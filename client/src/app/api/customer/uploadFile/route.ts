import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../../../../cloudflare/client";
import { getCachedUser } from "../../../../lib/authCache";
import supabase from "../../../../supabase/adminClient";
import { checkRateLimit, RATE_LIMIT_TIERS, formatResetTime } from "../../../../lib/rateLimit";

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const { user, error: customerError } = await getCachedUser(authHeader);
    if (customerError || !user) {
        return NextResponse.json({ message: `Authorization error occurred - ${customerError?.message}`, success: false }, { status: 401 });
    }

    const cust_id = user.id;

    try {
        const body = await request.json();
        const { workspace_id, fileName, fileType, fileSize, file_size } = body;

        if (!workspace_id || !fileName || !fileType) {
            return NextResponse.json(
                { message: "Missing required fields: workspace_id, fileName, fileType" },
                { status: 400 }
            );
        }

        // =========================================================================
        // 0. SERVER-SIDE FILE SIZE VALIDATION & CAP (Max 10MB per file)
        // =========================================================================
        const size = typeof fileSize === "number" ? fileSize : typeof file_size === "number" ? file_size : null;
        const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
        if (size !== null && size > MAX_FILE_SIZE_BYTES) {
            const sizeMB = (size / (1024 * 1024)).toFixed(1);
            return NextResponse.json(
                {
                    message: `File size exceeds the 10MB limit (${sizeMB}MB). Please upload a smaller file.`,
                    success: false,
                },
                { status: 400 }
            );
        }

        // =========================================================================
        // 1. WORKSPACE FILE COUNT CAP (Max 5 active files per workspace)
        // =========================================================================
        const { count: fileCount, error: countError } = await supabase
            .from("files")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace_id)
            .neq("status", "failed");

        if (countError) {
            console.warn("[uploadFile Warning] Failed to count workspace files:", countError.message);
        } else if (fileCount !== null && fileCount >= 5) {
            return NextResponse.json(
                {
                    message: "Workspace file limit reached. You can have a maximum of 5 files per workspace. Delete an existing file to upload a new one.",
                    success: false,
                },
                { status: 400 }
            );
        }

        // =========================================================================
        // 2. CUSTOMER DAILY UPLOAD RATE LIMIT (5 uploads per 24-hour window)
        // =========================================================================
        const uploadLimit = await checkRateLimit(
            `upload_daily:${cust_id}`,
            RATE_LIMIT_TIERS.FILE_UPLOAD_DAILY
        );

        if (!uploadLimit.allowed) {
            const timeUntilReset = formatResetTime(uploadLimit.resetInSeconds);
            return NextResponse.json(
                {
                    message: `Daily upload limit reached (5 files/day). Resets in ${timeUntilReset}.`,
                    remaining: 0,
                    resetInSeconds: uploadLimit.resetInSeconds,
                    success: false,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": uploadLimit.resetInSeconds.toString(),
                        "X-RateLimit-Limit": "5",
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }

        // Generate a unique key so files with the same name don't overwrite each other
        const uniqueFileId = `${crypto.randomUUID()}-${fileName}`;
        const key = `users/${cust_id}/${workspace_id}/${uniqueFileId}`;
        
        // 3. Bake ContentLength into the PutObjectCommand for cryptographic SigV4 signing
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
            ...(size !== null ? { ContentLength: size } : {})
        });

        // 4. Generate a presigned URL that the React frontend can use for 60 seconds
        const presignedUrl = await getSignedUrl(r2, command, {
            expiresIn: 60,
            ...(size !== null ? { signableHeaders: new Set(["content-type", "content-length", "host"]) } : {})
        });

        return NextResponse.json({
            uploadUrl: presignedUrl,
            uniqueFileName: uniqueFileId,
            key: key,
            message: "Presigned URL generated successfully",
            success: true
        });

    } catch (error) {
        console.error("Presigned URL generation failed:", error);
        return NextResponse.json(
            { message: "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}