import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { getCachedUser } from "../../../../lib/authCache";

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const { user, error: customerError } = await getCachedUser(authHeader);
    if (customerError || !user) {
        return NextResponse.json({ message: `Authorization error occurred - ${customerError?.message}`, success: false }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { workspace_id } = body;

        if (!workspace_id) {
            return NextResponse.json({ message: "Missing workspace_id", success: false }, { status: 400 });
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

        // Verify workspace ownership
        if (config.cust_id !== user.id) {
            return NextResponse.json({ message: "Unauthorized or workspace not found", success: false }, { status: 403 });
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
