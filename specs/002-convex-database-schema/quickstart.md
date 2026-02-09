# Quickstart: Convex Database Schema

**Feature**: 002-convex-database-schema
**Date**: 2026-02-07

## Prerequisites

- Node.js 20+
- Convex CLI (`npx convex`)
- Clerk configured (from Task 1)
- Convex project `perceptive-hippopotamus-290` deployed

## Verification Steps

### 1. Schema Deploys Successfully

```bash
cd /Users/shaileshsingh/v1-drafts
npx convex dev
```

Expected: All 10 tables created in Convex dashboard. No schema validation errors.

### 2. User Record Created on Sign-in

1. Start dev server: `npm run dev`
2. Open browser, sign in with Google
3. Check Convex dashboard > users table
4. Verify: user record has all fields including new ones (institution=undefined, specialization=undefined, plagiarismChecksUsed=0, aiDetectionChecksUsed=0, deepResearchUsed=0)

### 3. Document CRUD

1. Open browser console
2. Call `documents.create` via Convex client
3. Verify document appears in Convex dashboard
4. Call `documents.list` — should return the created document
5. Call `documents.update` to change title
6. Verify updated title in dashboard

### 4. Paper Save & Collection

1. Call `papers.save` with mock PubMed data
2. Call `collections.create` with a name
3. Call `papers.update` to assign paper to collection
4. Call `papers.list` with collectionId — should return the paper

### 5. Citation Insert

1. Create a document and a paper first
2. Call `citations.insert` linking them
3. Call `citations.listByDocument` — should return the citation

### 6. File Upload (PDF)

1. Call `files.generateUploadUrl`
2. Upload a test PDF to the URL
3. Call `papers.update` with the resulting storage ID
4. Call `files.getUrl` with the storage ID — should return a download URL

### 7. Subscription Limit Check

1. Create a user with `subscriptionTier: "free"`
2. Call `plagiarismChecks.create` twice — should succeed
3. Call `plagiarismChecks.create` a 3rd time — should be denied (free limit is 2/month)

### 8. E2E Test (Playwright)

```bash
npx playwright test tests/e2e/convex-schema.spec.ts
```

Expected: All tests pass — user creation, document CRUD, paper save, citation insert, file upload, limit enforcement.
