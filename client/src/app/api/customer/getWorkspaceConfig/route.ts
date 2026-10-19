import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { authenticateWorkspace } from "../../../../lib/workspaceAuth";
import type { Workspace } from "../../../../types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workspace_id } = body;

        if (!workspace_id) {
            return NextResponse.json({ message: "Missing workspace_id", success: false }, { status: 400 });
        }

        // Authenticate user and verify workspace ownership
        const auth = await authenticateWorkspace(request, workspace_id);
        if (auth.errorResponse) {
            return auth.errorResponse;
        }

        const { data: config, error } = await supabase
            .from("workspace")
            .select("*")
            .eq("id", workspace_id)
            .single();

        if (error || !config) {
            console.error("Error fetching workspace config:", error);
            return NextResponse.json({ message: "Workspace not found", error: error?.message, success: false }, { status: 404 });
        }

        // Mask sensitive API key if set to avoid leaking secrets
        if (config.llm_api_key) {
            config.has_custom_api_key = true;
            config.llm_api_key = "••••••••";
        } else {
            config.has_custom_api_key = false;
        }

        return NextResponse.json({ config, success: true });
    } catch (error: any) {
        console.error("getWorkspaceConfig error:", error);
        return NextResponse.json({ message: "Internal server error", success: false }, { status: 500 });
    }
}
