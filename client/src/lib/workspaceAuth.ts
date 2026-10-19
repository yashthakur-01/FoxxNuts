import { NextRequest, NextResponse } from "next/server";
import supabase from "../supabase/adminClient";
import { getCachedUser } from "./authCache";

/**
 * Result returned by authenticateWorkspace helper.
 */
export interface WorkspaceAuthResult {
  user: any;
  errorResponse: NextResponse | null;
}

/**
 * Authenticates the incoming request user and verifies that the given workspace_id
 * belongs to the authenticated user.
 *
 * @param request - NextRequest containing Authorization header
 * @param workspaceId - Optional workspace UUID to verify ownership against
 * @returns { user, errorResponse } - If errorResponse is non-null, return it immediately from your route handler.
 */
export async function authenticateWorkspace(
  request: NextRequest,
  workspaceId?: string
): Promise<WorkspaceAuthResult> {
  // 1. Authenticate user session using the 60-second in-memory TTL cache
  const authHeader = request.headers.get("Authorization");
  const { user, error: customerError } = await getCachedUser(authHeader);

  if (customerError || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: `Authorization error occurred - ${customerError?.message || "Invalid or missing token"}`, success: false },
        { status: 401 }
      ),
    };
  }

  // 2. If a workspaceId is provided, verify customer ownership
  if (workspaceId) {
    const { data: workspaceOwner, error: checkError } = await supabase
      .from("workspace")
      .select("cust_id")
      .eq("id", workspaceId)
      .single();

    if (checkError || workspaceOwner?.cust_id !== user.id) {
      return {
        user,
        errorResponse: NextResponse.json(
          { message: "Unauthorized or workspace not found", success: false },
          { status: 403 }
        ),
      };
    }
  }

  return {
    user,
    errorResponse: null,
  };
}
