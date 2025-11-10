import { createHash } from 'crypto';
import { promises as fs } from 'fs';

/**
 * Tính SHA-256 hash của file PDF để tạo preIssueHash
 * ---------------------------------------------------
 * @param filePath Đường dẫn file PDF
 * @returns Chuỗi hash hex (64 ký tự)
 */
export async function sha256File(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Tính SHA-256 hash từ buffer hoặc string
 * @param input Dữ liệu dạng Buffer hoặc string
 */
export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}
