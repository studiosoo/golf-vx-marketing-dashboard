/**
 * Upload file to S3 storage
 * This is a client-side wrapper that calls the backend storage API
 */
export async function storagePut(
  key: string,
  data: ArrayBuffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  // Call backend API to upload to S3
  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      data: base64,
      contentType,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  return await response.json();
}
