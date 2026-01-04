"use server";

import AdmZip from "adm-zip";
import { ingestFile } from "@/lib/api";

export async function ingestZipAction(formData: FormData) {
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;

    if (!file || !sessionId) {
        throw new Error("Missing file or sessionId");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const entry of zipEntries) {
        if (entry.isDirectory) continue;

        const fileName = entry.entryName.toLowerCase();
        if (!fileName.endsWith(".pdf") && !fileName.endsWith(".txt")) {
            continue;
        }

        try {
            const content = entry.getData();
            // Create a mock File-like object for the ingestFile function
            // Use Uint8Array to ensure compatibility with BlobPart types in Node.js/TypeScript
            const blob = new Blob([new Uint8Array(content)], {
                type: fileName.endsWith(".pdf") ? "application/pdf" : "text/plain"
            });
            const extractedFile = new File([blob], entry.name, {
                type: blob.type
            });

            await ingestFile(extractedFile, sessionId);
            successCount++;
        } catch (err: any) {
            console.error(`Failed to ingest ${entry.entryName}:`, err);
            failCount++;
            errors.push(`${entry.entryName}: ${err.message || "Unknown error"}`);
        }
    }

    if (successCount === 0 && failCount > 0) {
        throw new Error(`Failed to process zip: ${errors.join(", ")}`);
    }

    return {
        success: true,
        message: `Processed ${successCount} files successfully.${failCount > 0 ? ` Failed ${failCount} files.` : ""}`,
        errors: errors.length > 0 ? errors : undefined,
    };
}
