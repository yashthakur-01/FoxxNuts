import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { getCachedUser } from "../../../../lib/authCache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, session_id } = body;

    if (!workspace_id || !session_id) {
      return NextResponse.json(
        { message: "Missing workspace_id or session_id", success: false },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("Authorization");
    const { user, error: authError } = await getCachedUser(authHeader);

    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_type, content, created_at")
      .eq("workspace_id", workspace_id)
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching chat history:", error);
      return NextResponse.json(
        { message: "Failed to fetch chat history", success: false },
        { status: 500 }
      );
    }

    const formattedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      role: msg.sender_type === "human" ? "human" : "ai",
      content: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json({
      messages: formattedMessages,
      success: true,
    });
  } catch (error: any) {
    console.error("Chat getHistory error:", error);
    return NextResponse.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
