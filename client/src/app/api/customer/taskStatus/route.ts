import { NextRequest, NextResponse } from "next/server";
import { getCachedUser } from "../../../../lib/authCache";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const { user, error: customerError } = await getCachedUser(authHeader);
  if (customerError || !user) {
    return NextResponse.json(
      { message: `Authorization error: ${customerError?.message || "Not authenticated"}`, success: false },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json(
      { message: "taskId query parameter is required", success: false },
      { status: 400 }
    );
  }

  try {
    const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${fastApiUrl}/api/task-status/${taskId}`, {
      method: "GET",
      headers: {
        "X-API-Key": process.env.FASTAPI_SECRET_KEY || "",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("taskStatus API error:", error);
    return NextResponse.json(
      { message: `Failed to fetch task status: ${error.message || error}`, status: "ERROR", ready: true, successful: false },
      { status: 500 }
    );
  }
}
