import { NextRequest, NextResponse } from "next/server";
import { getCachedUser } from "../../../../lib/authCache";
import { refundRateLimit } from "../../../../lib/rateLimit";

export async function POST(request: NextRequest) {
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
    const refunded = await refundRateLimit(`upload_daily:${cust_id}`);
    return NextResponse.json({
      success: true,
      refunded,
      message: refunded ? "Upload rate limit quota restored" : "No active quota entry to refund",
    });
  } catch (error: any) {
    console.error("refundUpload error:", error);
    return NextResponse.json(
      { message: `Failed to refund upload quota: ${error.message || error}`, success: false },
      { status: 500 }
    );
  }
}
