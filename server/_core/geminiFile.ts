import { ENV } from "./env";

const GEMINI_BASE = "https://generativelanguage.googleapis.com";

export interface GeminiFile {
  uri: string;
  name: string;
  mimeType: string;
  displayName: string;
}

// Upload a file to Gemini File API using resumable protocol (supports large files)
export async function uploadFileToGemini(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<GeminiFile> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY required for file upload");

  const buffer = Buffer.from(base64, "base64");

  // Step 1: Start resumable upload session
  const initRes = await fetch(`${GEMINI_BASE}/upload/v1beta/files?key=${apiKey}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(buffer.length),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: fileName } }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`Gemini File API init failed: ${err}`);
  }

  const uploadUrl = initRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("No upload URL from Gemini File API");

  // Step 2: Upload binary data and finalize
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(buffer.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Gemini file upload failed: ${err}`);
  }

  const result = await uploadRes.json();
  return result.file as GeminiFile;
}

// Use Gemini's native generateContent API (required for File API URIs)
export async function generateContentWithFile({
  model,
  systemPrompt,
  userPrompt,
  fileUri,
  mimeType,
}: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  fileUri: string;
  mimeType: string;
}): Promise<string> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY required");

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { mimeType, fileUri } },
          { text: userPrompt },
        ],
      },
    ],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 8192 },
  };

  const response = await fetch(
    `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini generateContent failed: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: any) => p.text || "")
    .join("") ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}
