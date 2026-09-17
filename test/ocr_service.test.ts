import assert from "node:assert/strict";
import test from "node:test";
import { canProcess, onboardDocument, type Tenant } from "../src/ocr_service.js";

test("suspended tenants cannot submit scanned documents", async () => {
  const tenant: Tenant = { id: "t1", name: "Editorial", status: "suspended" };
  assert.equal(canProcess(tenant), false);
  await assert.rejects(() => onboardDocument(tenant, { pdf: "blob" }), /not active/);
});

test("active tenant receives OCR text from the decoded envelope", async () => {
  process.env.INFRAI_API_KEY = "test-key";
  const fakeFetch = async () => new Response(JSON.stringify({ ok: true, data: { text: "Invoice 1042" } }), { status: 200, headers: { "Content-Type": "application/json" } });
  const result = await onboardDocument({ id: "t2", name: "Media", status: "active" }, { pdf: "blob", lang: "eng" }, fakeFetch as typeof fetch);
  assert.equal(result.text, "Invoice 1042");
});
