import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { message: "Missing workspace_id", success: false },
        { status: 400 }
      );
    }

    const { data: ws, error } = await supabase
      .from("workspace")
      .select(
        "id, workspace_name, chatbot_name, chatbot_description, chatbot_avatar, primary_color, welcome_message, suggested_questions, widget_position, chatbot_theme"
      )
      .eq("id", workspace_id)
      .single();

    if (error || !ws) {
      return NextResponse.json(
        { message: "Workspace not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      config: {
        workspace_id: ws.id,
        workspace_name: ws.workspace_name,
        chatbot_name: ws.chatbot_name || "AI Assistant",
        chatbot_description: ws.chatbot_description || "Powered by FoxxNuts",
        chatbot_avatar: ws.chatbot_avatar,
        primary_color: ws.primary_color || "#E50914",
        welcome_message: ws.welcome_message || "Hello! How can I help you today?",
        suggested_questions: ws.suggested_questions || [],
        widget_position: ws.widget_position || "bottom-right",
        chatbot_theme: ws.chatbot_theme || "dark",
      },
      success: true,
    });
  } catch (error: any) {
    console.error("Public getConfig error:", error);
    return NextResponse.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
