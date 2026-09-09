import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { uploadAsync, FileSystemUploadType } from "expo-file-system/legacy";
import { Platform } from "react-native";
import {
  completeCandidateCvUpload,
  requestCandidateCvUploadUrl,
  type CandidateCvUploadRequestContentType,
} from "@workspace/api-client-react";

interface UseCvUploadOptions {
  onSuccess?: (fileName: string) => void;
  onError?: (error: string) => void;
}

export function useCvUpload(options?: UseCvUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload(): Promise<{ fileName: string } | null> {
    setError(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = asset.name ?? `cv-${Date.now()}.pdf`;
    const mimeType = asset.mimeType ?? "application/pdf";
    const fileSize = asset.size ?? 1;
    const validTypes = new Set<CandidateCvUploadRequestContentType>([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    if (!validTypes.has(mimeType as CandidateCvUploadRequestContentType)) {
      const message = "Only PDF, DOC, and DOCX files are supported";
      setError(message);
      options?.onError?.(message);
      return null;
    }
    if (fileSize > 10 * 1024 * 1024) {
      const message = "CV must be 10MB or less";
      setError(message);
      options?.onError?.(message);
      return null;
    }

    setUploading(true);
    try {
      const { uploadURL, uploadToken } = await requestCandidateCvUploadUrl({
        name: fileName,
        size: fileSize,
        contentType: mimeType as CandidateCvUploadRequestContentType,
      });

      if (Platform.OS === "web") {
        const fileRes = await fetch(uri);
        const blob = await fileRes.blob();
        const putRes = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": mimeType },
          body: blob,
        });
        if (!putRes.ok) throw new Error("CV upload to storage failed");
      } else {
        const uploadResult = await uploadAsync(uploadURL, uri, {
          httpMethod: "PUT",
          uploadType: FileSystemUploadType.BINARY_CONTENT,
          headers: { "Content-Type": mimeType },
        });
        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          throw new Error("CV upload to storage failed");
        }
      }

      await completeCandidateCvUpload({ uploadToken });
      options?.onSuccess?.(fileName);
      return { fileName };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      options?.onError?.(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { pickAndUpload, uploading, error };
}
