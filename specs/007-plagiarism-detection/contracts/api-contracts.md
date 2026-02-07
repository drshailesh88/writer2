# API Contracts: Plagiarism & AI Detection with Payments

**Feature Branch**: `007-plagiarism-detection`
**Date**: 2026-02-07

## 1. Plagiarism Check API

### POST `/api/plagiarism/check`

Submit text for plagiarism scanning.

**Auth**: Optional (anonymous allowed for free funnel)

**Request**:
```json
{
  "text": "string (required, the text to check)",
  "documentId": "string (optional, Convex document ID)",
  "anonymous": "boolean (optional, true for free funnel)"
}
```

**Response (202 Accepted)**:
```json
{
  "checkId": "string (Convex plagiarismChecks record ID)",
  "status": "pending",
  "estimatedSeconds": 30
}
```

**Error Responses**:
- `400`: Text empty or exceeds 1,000 words (anonymous)
- `403`: Usage limit exceeded (returns `{ limit, used, tier }`)
- `429`: Rate limited

---

### GET `/api/plagiarism/status?checkId={id}`

Poll for plagiarism check results.

**Auth**: Optional

**Response (200 OK)**:
```json
{
  "checkId": "string",
  "status": "pending | completed | failed",
  "result": {
    "overallSimilarity": 18.5,
    "sources": [
      {
        "id": "src_1",
        "title": "Source Document Title",
        "url": "https://example.com/source",
        "matchedWords": 42,
        "totalWords": 500,
        "similarity": 8.4,
        "matchedText": "The quick brown fox..."
      }
    ]
  }
}
```

---

## 2. AI Detection API

### POST `/api/ai-detection/check`

Submit text for AI content detection.

**Auth**: Required (no anonymous access)

**Request**:
```json
{
  "text": "string (required)",
  "documentId": "string (optional, Convex document ID)"
}
```

**Response (202 Accepted)**:
```json
{
  "checkId": "string (Convex aiDetectionChecks record ID)",
  "status": "pending",
  "estimatedSeconds": 30
}
```

**Error Responses**:
- `401`: Not authenticated
- `400`: Text empty
- `403`: Usage limit exceeded

---

### GET `/api/ai-detection/status?checkId={id}`

Poll for AI detection results.

**Auth**: Required

**Response (200 OK)**:
```json
{
  "checkId": "string",
  "status": "pending | completed | failed",
  "result": {
    "overallAiScore": 45.2,
    "humanScore": 54.8,
    "sentences": [
      {
        "text": "This sentence was likely written by AI.",
        "startPosition": 0,
        "endPosition": 42,
        "classification": "ai",
        "probability": 0.87
      }
    ]
  }
}
```

---

## 3. Copyleaks Webhook Endpoints

### POST `/api/copyleaks/webhook/completed`

Webhook called by Copyleaks when a plagiarism scan completes.

**Auth**: Copyleaks webhook (verify via scan ID mapping)

**Request** (from Copyleaks):
```json
{
  "scannedDocument": {
    "scanId": "string",
    "totalWords": 500,
    "credits": 2
  },
  "results": {
    "internet": [{ "id": "...", "title": "...", "url": "...", "matchedWords": 42 }],
    "database": [{ "id": "...", "title": "...", "url": "...", "matchedWords": 10 }]
  }
}
```

**Response**: `200 OK`

---

### POST `/api/copyleaks/webhook/error`

Webhook called by Copyleaks when a scan fails.

**Auth**: Copyleaks webhook

**Request**:
```json
{
  "scannedDocument": { "scanId": "string" },
  "error": { "code": 1234, "message": "Error description" }
}
```

**Response**: `200 OK`

**Side Effects**: Updates check status to "failed", does NOT decrement user counter (counter was already incremented on submit — must be decremented back).

---

## 4. Razorpay API

### POST `/api/razorpay/create-subscription`

Create a Razorpay subscription for the authenticated user.

**Auth**: Required

**Request**:
```json
{
  "planType": "basic | pro"
}
```

**Response (200 OK)**:
```json
{
  "subscriptionId": "sub_xyz123",
  "shortUrl": "https://rzp.io/i/xyz",
  "razorpayKeyId": "rzp_test_xxx"
}
```

---

### POST `/api/razorpay/webhook`

Webhook for Razorpay subscription lifecycle events.

**Auth**: Razorpay webhook signature (HMAC SHA256)

**Events Handled**:
- `subscription.activated`: Create subscription record, update user tier
- `subscription.charged`: Extend billing period
- `subscription.cancelled`: Mark subscription cancelled
- `payment.failed`: Set subscription to "paused", start 3-day grace period

**Response**: `200 OK` (always, to prevent Razorpay retries on processing errors)

---

### POST `/api/razorpay/cancel-subscription`

Cancel the authenticated user's subscription.

**Auth**: Required

**Request**:
```json
{
  "cancelAtCycleEnd": true
}
```

**Response (200 OK)**:
```json
{
  "status": "cancelled",
  "effectiveDate": "2026-03-07T00:00:00Z"
}
```

---

## 5. Convex Mutations & Queries (Existing)

These already exist and handle the database layer:

| Function | Type | Purpose |
|----------|------|---------|
| `plagiarismChecks.create` | mutation | Create check record, enforce limits |
| `plagiarismChecks.updateResult` | mutation | Store scan results |
| `plagiarismChecks.get` | query | Get single check by ID |
| `plagiarismChecks.listByUser` | query | List user's check history |
| `aiDetectionChecks.create` | mutation | Create check record, enforce limits |
| `aiDetectionChecks.updateResult` | mutation | Store scan results |
| `aiDetectionChecks.get` | query | Get single check by ID |
| `aiDetectionChecks.listByUser` | query | List user's check history |
| `subscriptions.create` | mutation | Create subscription record |
| `subscriptions.getByUser` | query | Get user's active subscription |
| `subscriptions.updateStatus` | mutation | Update subscription status |

### New Convex Functions Needed

| Function | Type | Purpose |
|----------|------|---------|
| `users.getUsage` | query | Get current usage counts + tier limits for UI |
| `users.resetAllUsageCounters` | internal mutation | Monthly cron: reset all counters to 0 |
| `users.decrementPlagiarismUsage` | mutation | Decrement counter when external service fails |
| `users.decrementAiDetectionUsage` | mutation | Decrement counter when external service fails |
| `crons` | scheduled | Monthly reset cron job |
