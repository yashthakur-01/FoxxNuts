import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../../supabase/adminClient";
import { getCachedUser } from "../../../../../lib/authCache";
import redisClient from "../../../../../lib/redisClient";

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const { user, error: customerError } = await getCachedUser(authHeader);
    if (customerError || !user) {
        return NextResponse.json({ message: `Authorization error occurred - ${customerError?.message}`, success: false }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { workspace_id, limit = 50, page = 1 } = body;

        if (!workspace_id) {
            return NextResponse.json(
                { message: "Missing required field: workspace_id", success: false },
                { status: 400 }
            );
        }

        const pageKey = `observability_traces:${workspace_id}:${page}:${limit}`;
        const trackerSetKey = `workspace_trace_keys:${workspace_id}`;

        // 1. Check Redis Cache
        if (redisClient) {
            try {
                const cachedTraces = await redisClient.get(pageKey);
                if (cachedTraces) {
                    console.log(`[Observability Traces] Cache HIT for key: ${pageKey}`);
                    return NextResponse.json(JSON.parse(cachedTraces));
                }
            } catch (rErr) {
                console.warn("[Observability Traces] Redis lookup warning:", rErr);
            }
        }

        // 2. Cache Miss: Query Supabase DB
        const offset = (page - 1) * limit;

        const { data: traces, error, count } = await supabase
            .from("agent_traces")
            .select("id, session_id, query, final_response, total_tokens, total_duration_ms, trajectory, error_messages, query_context_pairs, query_type, created_at", { count: "exact" })
            .eq("workspace_id", workspace_id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching agent traces:", error);
            return NextResponse.json(
                { message: "Failed to fetch agent traces", error: error.message, success: false },
                { status: 500 }
            );
        }

        const payload = {
            traces: traces || [],
            total: count || 0,
            page,
            limit,
            success: true
        };

        // 3. Store in Redis and register in workspace tracker Set
        if (redisClient) {
            try {
                const pipeline = redisClient.pipeline();
                pipeline.setex(pageKey, 600, JSON.stringify(payload));
                pipeline.sadd(trackerSetKey, pageKey);
                pipeline.expire(trackerSetKey, 600);
                await pipeline.exec();
                console.log(`[Observability Traces] Cached key and registered in set: ${pageKey}`);
            } catch (rErr) {
                console.warn("[Observability Traces] Redis setex warning:", rErr);
            }
        }

        return NextResponse.json(payload);

    } catch (error) {
        console.error("Observability traces endpoint error:", error);
        return NextResponse.json({ message: "Internal server error", success: false }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const { user, error: customerError } = await getCachedUser(authHeader);
    if (customerError || !user) {
        return NextResponse.json({ message: `Authorization error: ${customerError?.message || "Not authenticated"}`, success: false }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { workspace_id, session_id, trace_id } = body;

        if (!workspace_id || (!session_id && !trace_id)) {
            return NextResponse.json(
                { message: "workspace_id and either session_id or trace_id are required", success: false },
                { status: 400 }
            );
        }

        // Verify workspace ownership
        const { data: ws, error: wsError } = await supabase
            .from("workspace")
            .select("id")
            .eq("id", workspace_id)
            .eq("cust_id", user.id)
            .maybeSingle();

        if (wsError || !ws) {
            return NextResponse.json({ message: "Workspace not found or unauthorized", success: false }, { status: 403 });
        }

        if (session_id) {
            // 1. Delete all agent traces for this session
            const { error: traceError } = await supabase
                .from("agent_traces")
                .delete()
                .eq("workspace_id", workspace_id)
                .eq("session_id", session_id);

            if (traceError) {
                console.error("Error deleting session traces:", traceError);
                return NextResponse.json({ message: `Failed to delete session traces: ${traceError.message}`, success: false }, { status: 500 });
            }

            // 2. Delete messages for this session
            await supabase
                .from("messages")
                .delete()
                .eq("workspace_id", workspace_id)
                .eq("session_id", session_id);

            // 3. Invalidate Redis Caches
            if (redisClient) {
                try {
                    const trackerSetKey = `workspace_trace_keys:${workspace_id}`;
                    const metricsKey = `observability_metrics:${workspace_id}`;
                    const historyKey = `chat_history:${session_id}`;
                    const keysToDelete = [metricsKey, trackerSetKey, historyKey];

                    const registeredKeys = await redisClient.smembers(trackerSetKey);
                    if (registeredKeys && registeredKeys.length > 0) {
                        keysToDelete.push(...registeredKeys);
                    }

                    await redisClient.del(...keysToDelete);
                    console.log(`[Observability Traces] Purged Redis cache for session: ${session_id}`);
                } catch (rErr) {
                    console.warn("[Observability Traces] Redis purge error:", rErr);
                }
            }

            return NextResponse.json({
                message: `Session ${session_id} traces deleted successfully`,
                success: true,
            });
        } else if (trace_id) {
            // Delete single trace
            const { error: traceError } = await supabase
                .from("agent_traces")
                .delete()
                .eq("workspace_id", workspace_id)
                .eq("id", trace_id);

            if (traceError) {
                console.error("Error deleting trace:", traceError);
                return NextResponse.json({ message: `Failed to delete trace: ${traceError.message}`, success: false }, { status: 500 });
            }

            // Invalidate Redis Caches
            if (redisClient) {
                try {
                    const trackerSetKey = `workspace_trace_keys:${workspace_id}`;
                    const metricsKey = `observability_metrics:${workspace_id}`;
                    const keysToDelete = [metricsKey, trackerSetKey];

                    const registeredKeys = await redisClient.smembers(trackerSetKey);
                    if (registeredKeys && registeredKeys.length > 0) {
                        keysToDelete.push(...registeredKeys);
                    }

                    await redisClient.del(...keysToDelete);
                } catch (rErr) {
                    console.warn("[Observability Traces] Redis purge error:", rErr);
                }
            }

            return NextResponse.json({
                message: `Trace ${trace_id} deleted successfully`,
                success: true,
            });
        }
    } catch (error: any) {
        console.error("Delete traces endpoint error:", error);
        return NextResponse.json({ message: error.message || "Internal server error", success: false }, { status: 500 });
    }
}
