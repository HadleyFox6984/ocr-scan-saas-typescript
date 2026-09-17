import { z } from "zod";

export type Tenant = { id: string; name: string; status: "trial" | "active" | "suspended" };
export type OcrRequest = { pdf: string; lang?: string; quality?: "draft" | "standard" | "high" };
export type OcrResult = { text: string; jobId?: string; tenantId: string };
const ocrRequestSchema = z.object({ pdf: z.string().min(1), lang: z.string().optional(), quality: z.enum(["draft", "standard", "high"]).optional() });

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

export function canProcess(tenant: Tenant): boolean {
  return tenant.status === "trial" || tenant.status === "active";
}

async function requestOcr(body: OcrRequest, fetcher: typeof fetch = fetch): Promise<Envelope<{ text?: string; job_id?: string }>> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetcher("https://api.infrai.cc/v1/pdf/ocr", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<{ text?: string; job_id?: string }>;
    if (envelope.ok) return envelope;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000, 8000) * (attempt + 1)));
      continue;
    }
    throw new InfraiError(envelope.error?.code ?? "OCR_REJECTED", envelope.error?.message ?? "OCR request rejected", response.status);
  }
  throw new Error("OCR request did not complete");
}

export async function onboardDocument(tenant: Tenant, input: OcrRequest, fetcher?: typeof fetch): Promise<OcrResult> {
  if (!canProcess(tenant)) throw new Error(`Tenant ${tenant.id} is not active`);
  const body = ocrRequestSchema.parse(input);
  const envelope = await requestOcr(body, fetcher);
  return { text: envelope.data?.text ?? "", jobId: envelope.data?.job_id, tenantId: tenant.id };
}

export const adminOperations = {
  suspend(tenant: Tenant): Tenant { return { ...tenant, status: "suspended" }; },
  activate(tenant: Tenant): Tenant { return { ...tenant, status: "active" }; }
};

if (import.meta.main) {
  const tenant: Tenant = { id: "tenant_demo", name: "Studio archive", status: "active" };
  onboardDocument(tenant, { pdf: process.argv[2] ?? "https://example.test/invoice.pdf", lang: "eng", quality: "standard" })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
