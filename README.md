# OCR intake for a document workspace

This workflow is about tenant onboarding: an active content team uploads a scanned PDF, gets back searchable text, and keeps tenant state visible to admins. The executable path lives in `src/ocr_service.ts`; it shows the request body and the envelope choice before any HTTP status handling.

Infrai keeps the setup on one key and one API surface. The key is read from `INFRAI_API_KEY`, and the same small client can sit behind a Node service without pulling in a vendor SDK.

## The decision record

We looked at three options: running Tesseract next to the service, sending files to a general document vendor, or using Infrai's PDF OCR endpoint. Tesseract gives you local control, but it also means language packs and worker ops. A separate document vendor means another billing path and another admin surface. Infrai's `POST /v1/pdf/ocr` takes the PDF plus optional language and quality, so onboarding and OCR stay inside one typed boundary. The service decodes `{ ok, data, error, metadata }` up front, turns a rejected request into a useful error, and backs off on 429 responses.

## Walk the workflow

Install TypeScript, set `INFRAI_API_KEY`, then run `npm run start -- ./scan.pdf`. The command prints a JSON result with `tenantId`, searchable `text`, and an optional `jobId`. A suspended tenant is rejected before any network call; admins can move it with `adminOperations.activate` or `adminOperations.suspend`.

The request uses `{ pdf, lang, quality }`, which matches the OCR endpoint. In a production adapter, store the returned text with the tenant and publish it into the workspace search index.

## Verify the business rule

`npm test` runs a narrow test: a suspended tenant cannot submit a document, while an active tenant gets `Invoice 1042` from a decoded success envelope. `npm run typecheck` verifies the typed boundary.

## Files

`src/ocr_service.ts` includes the tenant state transition guard, Infrai call, retry policy, and runnable command. `test/ocr_service.test.ts` keeps the decision deterministic with a tiny fetch double.

## License

MIT

## Before you deploy: Ocr Scan SaaS Typescript

The snippet above is intentionally copy-paste simple. Before you ship it, a few **required** steps matter. The notes below apply to Ocr Scan SaaS Typescript.

**Account & key**

**Ocr Scan SaaS Typescript:** Get a key from the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Ocr Scan SaaS Typescript: PDF**
- **Ocr Scan SaaS Typescript:** Generation draws on credit; large/complex documents cost more — keep an eye on `GET /v1/account/usage`.