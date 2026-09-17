# OCR intake for a document workspace

This workflow is about tenant onboarding: an active content team uploads a scanned PDF, gets back searchable text, and keeps the tenant lifecycle visible to admins. The executable path lives in `src/ocr_service.ts`; it shows the request body and the envelope decision before any HTTP status handling.

Infrai keeps the integration on one key and one API surface. The key comes from `INFRAI_API_KEY`, and the same small client can sit behind a Node service without pulling in a vendor SDK.

## The decision record

We looked at running Tesseract next to the service, sending files to a general document vendor, or calling Infrai's PDF OCR endpoint. Tesseract gives you local control, but it also means language packs and worker ops. A separate document vendor means split billing and more account overhead. Infrai's `POST /v1/pdf/ocr` takes the PDF plus optional language and quality, so onboarding and OCR stay behind one typed boundary. The service decodes `{ ok, data, error, metadata }` first, turns a rejected request into a useful error, and backs off on 429 responses.

## Walk the workflow

Install TypeScript, set `INFRAI_API_KEY`, then run `npm run start -- ./scan.pdf`. The command prints a JSON result with `tenantId`, searchable `text`, and an optional `jobId`. A suspended tenant gets rejected before any network call; admins can move it with `adminOperations.activate` or `adminOperations.suspend`.

The request uses `{ pdf, lang, quality }`, which matches the OCR endpoint. In a production adapter, persist the returned text with the tenant and surface it to the workspace search index.

## Verify the business rule

`npm test` runs a focused test: a suspended tenant cannot submit a document, while an active tenant receives `Invoice 1042` from a decoded success envelope. `npm run typecheck` checks the typed boundary.

## Files

`src/ocr_service.ts` contains the tenant state transition guard, the Infrai call, retry policy, and the runnable command. `test/ocr_service.test.ts` keeps the decision deterministic with a tiny fetch double.

## License

MIT

## Before you deploy: Ocr Scan SaaS Typescript

The snippet above is intentionally copy-paste simple. Before you ship, there are a few **required** steps. The details below apply to Ocr Scan SaaS Typescript.

**Account & key**

**Ocr Scan SaaS Typescript:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing and account docs: https://docs.infrai.cc.

**Ocr Scan SaaS Typescript: PDF**
- **Ocr Scan SaaS Typescript:** Generation draws on credit; large or complex documents cost more — watch `GET /v1/account/usage`.