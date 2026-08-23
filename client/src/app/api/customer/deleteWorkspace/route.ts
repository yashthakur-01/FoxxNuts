import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { getCachedUser } from "../../../../lib/authCache";

export async function POST(request: NextRequest) {
  return handleDelete(request);
}

export async function DELETE(request: NextRequest) {
  return handleDelete(request);
}

async function handleDelete(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const { user, error: customerError } = await getCachedUser(authHeader);
  if (customerError || !user) {
    return NextResponse.json(
      { message: `Authorization error: ${customerError?.message || "Not authenticated"}`, success: false },
      { status: 401 }
    );
  }

  const cust_id = user.id;

  try {
    const body = await request.json();
    const { workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { message: "workspace_id is required", success: false },
        { status: 400 }
      );
    }

    // Verify user owns the workspace
    const { data: workspace, error: wsError } = await supabase
      .from("workspace")
      .select("id, cust_id, workspace_name")
      .eq("id", workspace_id)
      .eq("cust_id", cust_id)
      .maybeSingle();

    if (wsError || !workspace) {
      return NextResponse.json(
        { message: "Workspace not found or unauthorized", success: false },
        { status: 404 }
      );
    }

    // Dispatch background deletion task to FastAPI / Celery
    const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${fastApiUrl}/api/delete-workspace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.FASTAPI_SECRET_KEY || "",
      },
      body: JSON.stringify({
        workspace_id: workspace_id,
        customer_id: cust_id,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return NextResponse.json(
        { message: data.message || "Failed to queue workspace deletion task", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Workspace deletion background task queued successfully",
      task_id: data.task_id,
      status: "queued",
      success: true,
    });
  } catch (error: any) {
    console.error("deleteWorkspace API error:", error);
    return NextResponse.json(
      { message: `Server error occurred: ${error.message || error}`, success: false },
      { status: 500 }
    );
  }
}
