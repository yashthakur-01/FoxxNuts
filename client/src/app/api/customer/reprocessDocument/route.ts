import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { authenticateWorkspace } from "../../../../lib/workspaceAuth";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workspace_id, fileName } = body;

        if (!workspace_id || !fileName) {
            return NextResponse.json(
                { message: "Missing required fields: workspace_id, fileName" },
                { status: 400 }
            );
        }

        // Authenticate user and verify workspace ownership
        const auth = await authenticateWorkspace(request, workspace_id);
        if (auth.errorResponse) {
            return auth.errorResponse;
        }

        const customer_id = auth.user.id;

        // 2. Update file status to 'processing' (scoped to workspace)
        const { error: dbError } = await supabase
            .from("files")
            .update({ status: "processing", updated_at: new Date().toISOString() })
            .eq("file_id", fileName)
            .eq("workspace_id", workspace_id);

        if (dbError) {
            console.error("Failed to update file status:", dbError);
        }

        // 2. Forward to FastAPI reprocess endpoint (deletes old vectors + re-embeds)
        const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

        const fastApiResponse = await fetch(`${fastApiUrl}/api/reprocess-document`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.FASTAPI_SECRET_KEY || ""
            },
            body: JSON.stringify({
                workspace_id: workspace_id,
                customer_id: customer_id,
                fileName: fileName
            })
        });

        const data = await fastApiResponse.json();

        if (!fastApiResponse.ok) {
            console.error("FastAPI Reprocess Error:", data);
            return NextResponse.json({ message: data.message || "AI Engine failed to reprocess document" }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Reprocess Document endpoint error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
