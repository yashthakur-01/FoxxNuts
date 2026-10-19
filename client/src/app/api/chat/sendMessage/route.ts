import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { getCachedUser } from "../../../../lib/authCache";
import { checkRateLimit, RATE_LIMIT_TIERS, formatResetTime } from "../../../../lib/rateLimit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workspace_id, session_id, message } = body;

        if (!workspace_id || !session_id || !message) {
            return NextResponse.json(
                { message: "Missing required fields: workspace_id, session_id, message" }, 
                { status: 400 }
            );
        }

        const authHeader = request.headers.get("Authorization");
        const { user, error: authError } = await getCachedUser(authHeader);

        if (!user) {
            return NextResponse.json({ message: `Unauthorized: ${authError?.message || "Invalid or missing token"}` }, { status: 401 });
        }
        const customer_id = user.id;

        // Verify workspace ownership
        const { data: workspaceOwner, error: checkError } = await supabase
            .from("workspace")
            .select("cust_id")
            .eq("id", workspace_id)
            .single();

        if (checkError || workspaceOwner?.cust_id !== customer_id) {
            return NextResponse.json({ message: "Unauthorized or workspace not found", success: false }, { status: 403 });
        }

        // =========================================================================
        // 1. CLIENT ACCOUNT DAILY MESSAGE RATE LIMIT (200 messages / 24-hour window)
        // =========================================================================
        const clientDailyRate = await checkRateLimit(
            `client_daily_msgs:${customer_id}`,
            RATE_LIMIT_TIERS.CLIENT_DAILY_MESSAGES
        );

        if (!clientDailyRate.allowed) {
            const timeUntilReset = formatResetTime(clientDailyRate.resetInSeconds);
            return NextResponse.json(
                {
                    message: `Daily message quota reached (200 messages/day). Resets in ${timeUntilReset}.`,
                    remaining: 0,
                    resetInSeconds: clientDailyRate.resetInSeconds,
                    success: false,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": clientDailyRate.resetInSeconds.toString(),
                        "X-RateLimit-Limit": "200",
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }

        // 2. Save human message to Supabase & forward to FastAPI concurrently
        // Auth validation and rate limits have already executed sequentially above
        const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

        const [insertResult, fastApiResponse] = await Promise.all([
            supabase
                .from("messages")
                .insert({
                    session_id: session_id,
                    workspace_id: workspace_id,
                    sender_type: "human",
                    content: message
                }),
            fetch(`${fastApiUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.FASTAPI_SECRET_KEY || ""
                },
                body: JSON.stringify({
                    workspace_id: workspace_id,
                    customer_id: customer_id,
                    session_id: session_id,
                    message: message
                })
            })
        ]);

        if (insertResult.error) {
            console.error("Failed to save user message to DB:", insertResult.error);
        }

        if (!fastApiResponse.ok) {
            console.error("FastAPI Error:", await fastApiResponse.text());
            return NextResponse.json({ message: "AI Engine failed to respond" }, { status: 500 });
        }

        // 4. Stream the AI response directly back to the React frontend!
        // Next.js handles Web Streams beautifully. FastAPI will stream chunks, 
        // and Next.js passes them straight to the browser without buffering.
        return new Response(fastApiResponse.body, {
            headers: {
                // If FastAPI is sending Server-Sent Events (SSE), use text/event-stream
                // If it's just raw text chunks, text/plain is fine.
                "Content-Type": fastApiResponse.headers.get("Content-Type") || "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });

    } catch (error) {
        console.error("Chat endpoint error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
