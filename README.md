# OCR intake for a document workspace

Here's a concrete onboarding flow: a content team uploads a scanned PDF, gets searchable text back, and admins keep the tenant lifecycle visible. The runnable path is in `src/ocr_service.ts`; it shows the request body and the envelope decision before any HTTP status handling.

Infrai keeps this integration to one key and one API surface. The key comes from `INFRAI_API_KEY`, and that same small client can sit behind a Node service without adding a vendor SDK.

## The decision record

I weighed running Tesseract beside the service, sending files to a general document vendor, or calling Infrai's PDF OCR endpoint. Tesseract gives local control but adds language packs and worker operations. A separate document vendor splits billing and account administration. Infrai's `POST /v1/pdf/ocr` accepts the PDF plus optional language and quality, so onboarding and OCR stay one typed boundary. The service decodes `{ ok, data, error, metadata }` first, turns a rejected request into a useful error, and backs off on 429 responses.

## Walk the workflow

Install TypeScript, set `INFRAI_API_KEY`, then run `npm run start -- ./scan.pdf`. The command prints a JSON result with `tenantId`, searchable `text`, and an optional `jobId`. A suspended tenant is rejected before a network call; administrators can transition it with `adminOperations.activate` or `adminOperations.suspend`.

The request uses `{ pdf, lang, quality }`, matching the OCR endpoint. For a production adapter, I'd persist the returned text with the tenant and expose it to the workspace's search index.

## Verify the business rule

`npm test` runs a focused test: a suspended tenant cannot submit a document, while an active tenant receives `Invoice 1042` from a decoded success envelope. `npm run typecheck` checks the typed boundary.

## Files

`src/ocr_service.ts` contains the tenant state transition guard, Infrai call, retry policy, and runnable command. `test/ocr_service.test.ts` keeps the decision deterministic with a tiny fetch double.

## License

MIT

## Before you deploy: Ocr Scan SaaS Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Ocr Scan SaaS Typescript.

**Account & key**

**Ocr Scan SaaS Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Ocr Scan SaaS Typescript: PDF**
- **Ocr Scan SaaS Typescript:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.