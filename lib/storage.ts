// Upload PDF lên S3/MinIO, trả URL tạm
export async function uploadTempPDF(filePath: string, opts: { ttlSeconds: number }): Promise<string> {
  // Giả lập URL tạm (Dev có thể thay bằng MinIO SDK)
  const uuid = crypto.randomUUID();
  return `https://temp/preview/${uuid}.pdf`;
}
