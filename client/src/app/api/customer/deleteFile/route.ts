import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../../supabase/adminClient";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../../../../cloudflare/client";
import { getCachedUser } from "../../../../lib/authCache";

export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const { user, error: customerError } = await getCachedUser(authHeader);
    if (customerError || !user) {
        return NextResponse.json({ message: `Authorization error occurred - ${customerError?.message}`, success: false }, { status: 401 });
    }

    const cust_id = user.id;

    const body = await request.json();
    const { file_id, workspace_id } = body;
    if (!file_id || !workspace_id) {
        return NextResponse.json({ message: "Missing required fields: file_id, workspace_id", success: false }, { status: 400 });
    }

    try {
        // Verify workspace ownership
        const { data: workspaceOwner, error: checkError } = await supabase
            .from("workspace")
            .select("cust_id")
            .eq("id", workspace_id)
            .single();

        if (checkError || workspaceOwner?.cust_id !== cust_id) {
            return NextResponse.json({ message: "Unauthorized or workspace not found", success: false }, { status: 403 });
        }

        const { data, error } = await supabase
            .from("files")
            .delete()
            .eq("file_id", file_id)
            .eq("workspace_id", workspace_id)
            .select("file_path");
        if (error) {
            return NextResponse.json({ message: `Failed to delete file from database - ${error.message}`, success: false }, { status: 500 });
        }

        if (!data?.[0]?.file_path) {
            return NextResponse.json({ message: "File not found or does not belong to this workspace", success: false }, { status: 404 });
        }

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: data[0].file_path,
        });
        const result = await r2.send(command);

        if (result.$metadata.httpStatusCode !== 204) {
            return NextResponse.json({ message: "Failed to delete file from R2 bucket", success: false }, { status: 500 });
        }

        const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

        const response = await fetch(`${fastApiUrl}/api/delete-document`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.FASTAPI_SECRET_KEY || ""
            },
            body: JSON.stringify({
                workspace_id: workspace_id,
                customer_id: cust_id,
                fileName: file_id
            })
        });

        if (!response.ok) {
            return NextResponse.json({ message: "Failed to delete vectors from database for file_id", success: false }, { status: 500 });
        }

        return NextResponse.json({ message: "File deleted successfully", success: true }, { status: 200 });


    } catch (error) {
        return NextResponse.json({ message: `Server Error Occured - ${error}` }, { status: 500 });
    }


}