import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { authenticateWorkspace } from "../../../../lib/workspaceAuth";
import type { WorkspaceFile } from "../../../../types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workspace_id } = body;

        if (!workspace_id) {
            return NextResponse.json(
                { message: "Missing required field: workspace_id" },
                { status: 400 }
            );
        }

        // Authenticate user and verify workspace ownership
        const auth = await authenticateWorkspace(request, workspace_id);
        if (auth.errorResponse) {
            return auth.errorResponse;
        }

        const { data: files, error } = await supabase
            .from("files")
            .select("file_id, file_name, status, created_at")
            .eq("workspace_id", workspace_id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching files:", error);
            return NextResponse.json(
                { message: "Failed to fetch files", error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ files: files || [], success: true });

    } catch (error) {
        console.error("Get files endpoint error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
