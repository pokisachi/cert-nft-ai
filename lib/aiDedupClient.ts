//D:\2025-2026\src_Code\cert-nft\lib\aiDedupClient.ts
import crypto from 'crypto';

// Environment variables
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8001';
const AI_SECRET = process.env.AI_SECRET || 'default_secret_key';
const DEDUP_THRESHOLD = parseFloat(process.env.DEDUP_THRESHOLD || '0.85');
const DEDUP_TOPK = parseInt(process.env.DEDUP_TOPK || '5');

interface CheckRequest {
  docHash: string;
  textPreview: string;
  options?: {
    threshold?: number;
    topK?: number;
  };
}

interface CheckResponse {
  isExactDuplicate: boolean;
  exactMatch?: {
    certificateId: string;
    docHash: string;
    similarity: number;
    textPreview: string;
  };
  candidates?: Array<{
    certificateId: string;
    docHash: string;
    similarity: number;
    textPreview: string;
  }>;
}

interface DecisionRequest {
  checkId: string;
  decision: 'ALLOW' | 'BLOCK';
  decidedBy: string;
  note?: string;
}

interface DecisionResponse {
  ok: boolean;
}

interface HealthResponse {
  status: string;
}

class AIDedupClient {
  private baseUrl: string;
  private secret: string;

  constructor(baseUrl: string = AI_BASE_URL, secret: string = AI_SECRET) {
    this.baseUrl = baseUrl;
    this.secret = secret;
  }

  private generateSignature(body: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(body)
      .digest('hex');
  }

  private async request<T>(
    endpoint: string,
    method: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const bodyString = body ? JSON.stringify(body) : undefined;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (bodyString) {
      const signature = this.generateSignature(bodyString);
      headers['x-signature'] = signature;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyString,
    });

    if (!response.ok) {
      throw new Error(`AI Dedup API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/ai/health', 'GET');
  }

  async check(docHash: string, textPreview: string, options?: { threshold?: number; topK?: number }): Promise<CheckResponse> {
    const request: CheckRequest = {
      docHash,
      textPreview,
      options: {
        threshold: options?.threshold ?? DEDUP_THRESHOLD,
        topK: options?.topK ?? DEDUP_TOPK,
      },
    };

    return this.request<CheckResponse>('/ai/dedup/check', 'POST', request);
  }

  async decision(checkId: string, decision: 'ALLOW' | 'BLOCK', decidedBy: string, note?: string): Promise<DecisionResponse> {
    const request: DecisionRequest = {
      checkId,
      decision,
      decidedBy,
      note,
    };

    return this.request<DecisionResponse>('/ai/dedup/decision', 'POST', request);
  }
}

// Export singleton instance
export const aiDedupClient = new AIDedupClient();
export default AIDedupClient;
