# Feature Specification: Convex Database Schema

**Feature Branch**: `002-convex-database-schema`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "Convex Database Schema — implement all core entity tables, indexes, CRUD operations, file storage, and subscription/usage helpers for the V1 Drafts platform"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Document Management (Priority: P1)

A medical student signs in and creates a new research paper draft. The system persists the document with its title, content, writing mode (Learn or Draft), current stage, approved outline, citation style, and word count. The student can later retrieve, update, and archive this document.

**Why this priority**: Documents are the core unit of value in V1 Drafts. Every feature (writing, citations, plagiarism checks, AI detection) depends on documents existing in the database.

**Independent Test**: Can be fully tested by creating a user, creating a document, retrieving it, updating its content, and verifying all fields persist correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a new document with a title and mode, **Then** the document is persisted with correct userId, timestamps, and default status "in_progress"
2. **Given** an existing document, **When** the user updates the content and word count, **Then** the changes are persisted and updatedAt is refreshed
3. **Given** a user with multiple documents, **When** they list their documents, **Then** only their own documents are returned, ordered by most recently updated

---

### User Story 2 - Paper Library & Collections (Priority: P2)

A student searches for papers via PubMed/Semantic Scholar/OpenAlex and saves relevant ones to their personal library. They organize papers into named collections (folders). Each saved paper stores its source, metadata, authors, abstract, DOI, and optional PDF.

**Why this priority**: The paper library feeds into citations, bibliography generation, and the writing workflow. Without papers saved, citations and bibliography cannot function.

**Independent Test**: Can be tested by saving a paper from an external source, creating a collection, moving the paper into the collection, and verifying all metadata persists.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they save a paper with external ID and source, **Then** the paper is persisted with all metadata fields and linked to the user
2. **Given** a user with saved papers, **When** they create a collection and assign papers to it, **Then** papers are retrievable by collection
3. **Given** a paper with a PDF, **When** the user uploads the PDF, **Then** the file is stored and the paper record links to the stored file ID

---

### User Story 3 - Citations in Documents (Priority: P3)

While writing, the student inserts citations from their approved papers into specific sections of their document. Each citation records which paper it references, which document section it appears in, its position, and the formatted citation text (Vancouver, APA, AMA, or Chicago style).

**Why this priority**: Citations connect the paper library to the writing editor. They are essential for academic writing but depend on both documents and papers existing first.

**Independent Test**: Can be tested by creating a document and papers, inserting citations at specific positions, and verifying they are retrievable by document with correct ordering.

**Acceptance Scenarios**:

1. **Given** a document and an approved paper, **When** the user inserts a citation in a section, **Then** the citation is persisted with correct documentId, paperId, section, position, and formatted text
2. **Given** a document with multiple citations, **When** citations are listed for that document, **Then** all citations are returned ordered by position

---

### User Story 4 - Plagiarism & AI Detection Checks (Priority: P4)

A student submits text for plagiarism checking or AI detection. The system records the check request, tracks its status (pending/completed/failed), and stores the results — overall similarity score, matching sources for plagiarism; overall AI score and per-sentence results for AI detection.

**Why this priority**: These are paid features that drive subscription revenue. They depend on documents existing but are otherwise independent of the writing workflow.

**Independent Test**: Can be tested by creating a plagiarism check record, updating its status to completed with results, and verifying the results persist correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user with text to check, **When** they submit a plagiarism check, **Then** a record is created with status "pending" and the input text stored
2. **Given** a pending plagiarism check, **When** results arrive from the external service, **Then** the record is updated with similarity score, sources, and status "completed"
3. **Given** an authenticated user, **When** they submit an AI detection check, **Then** a record is created and eventually updated with AI score and sentence-level results
4. **Given** a no-signup user (plagiarism funnel), **When** they submit a check, **Then** the record is created with userId as optional/null

---

### User Story 5 - Deep Research & Learn Mode Sessions (Priority: P5)

A student requests a deep research report on a topic. The system stores the report with its cited papers and status. Separately, in Learn Mode, the student has a Socratic coaching session tied to a document, with conversation history and feedback tracked across the 5-stage writing process.

**Why this priority**: These are differentiated features but depend on the core document and paper infrastructure being in place.

**Independent Test**: Can be tested by creating a deep research report, updating its status through the lifecycle, and verifying conversation history persists for Learn Mode sessions.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they request a deep research report, **Then** a record is created with topic, status "pending"
2. **Given** a completed deep research report, **Then** the report content and cited papers are stored and retrievable
3. **Given** a user in Learn Mode, **When** a session starts for a document, **Then** the session tracks currentStage, conversationHistory, and feedbackGiven
4. **Given** an ongoing Learn Mode session, **When** the student progresses through stages, **Then** the currentStage and conversation history update correctly

---

### User Story 6 - Subscription & Usage Tracking (Priority: P6)

A student subscribes to V1 Drafts via Razorpay. The system records their subscription plan, status, billing period, and tracks usage against tier limits (plagiarism checks, AI detection checks, deep research reports). The system enforces these limits before allowing new checks.

**Why this priority**: Monetization depends on subscription tracking and usage enforcement. This is the business foundation but only becomes relevant once the features it gates are built.

**Independent Test**: Can be tested by creating a subscription record, updating usage counters, and verifying limit enforcement returns correct allow/deny decisions.

**Acceptance Scenarios**:

1. **Given** a user who subscribes, **When** the subscription is created, **Then** it stores razorpaySubscriptionId, planType, status "active", and billing period dates
2. **Given** a Basic tier user who has used 5 plagiarism checks this month, **When** they request a 6th check, **Then** the system denies the request (Basic limit is 5/month)
3. **Given** a Free tier user, **When** they attempt to use Draft Mode, **Then** the system denies access (Draft Mode requires Basic or higher)

---

### Edge Cases

- What happens when a user's Clerk account is deleted but Convex records still exist? The system should handle orphaned records gracefully — queries return null for missing users.
- What happens when a document references a paper that has been deleted from the library? Citations should remain intact with a flag indicating the source paper is unavailable.
- What happens when a Razorpay webhook reports a subscription cancellation mid-billing period? The subscription status updates but access continues until currentPeriodEnd.
- What happens when a plagiarism/AI detection check fails externally (Copyleaks error)? The check status is set to "failed" and the user can retry.
- What happens when a user tries to create a document while at the free tier? Free tier users can still create documents in Learn Mode (Learn Mode is free), but not in Draft Mode.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist user profiles with Clerk identity, institution, specialization, subscription tier, and usage counters
- **FR-002**: System MUST support creating, reading, updating, and archiving documents with all required fields (title, content, mode, stage, outline, approved papers, citation style, word count, status)
- **FR-003**: System MUST allow saving papers from multiple sources (PubMed, Semantic Scholar, OpenAlex, uploaded) with full metadata including authors array, DOI, and optional PDF file
- **FR-004**: System MUST support organizing papers into user-created collections
- **FR-005**: System MUST track citations within documents, linking each citation to a specific paper, section, and position
- **FR-006**: System MUST record plagiarism check requests and results including overall similarity, matching sources, and external scan ID
- **FR-007**: System MUST record AI detection check requests and results including overall AI score and per-sentence analysis
- **FR-008**: System MUST support plagiarism checks for non-authenticated users (the free funnel) with userId as optional
- **FR-009**: System MUST persist deep research reports with topic, markdown content, cited papers, and lifecycle status
- **FR-010**: System MUST track Learn Mode sessions per document with conversation history, feedback data, and 5-stage progression
- **FR-011**: System MUST record subscription details from Razorpay including plan type, status, and billing period
- **FR-012**: System MUST enforce usage limits per subscription tier — denying operations that exceed the tier's monthly allowance
- **FR-013**: System MUST support file storage for PDF uploads linked to paper records
- **FR-014**: All data MUST be scoped to the authenticated user — no user can access another user's data
- **FR-015**: System MUST provide efficient lookup by userId across all tables, by documentId for citations and sessions, by externalId for papers, and by status for checks and reports

### Key Entities

- **User**: The authenticated person using V1 Drafts. Has identity (from Clerk), profile info, subscription tier, and usage counters. Central entity — all others reference it.
- **Document**: A research paper being written. Has content (Tiptap JSON), mode (Learn/Draft), stage progression, approved papers, and citation style. Belongs to a User.
- **Paper**: A published research paper saved to the user's library. Has metadata from external APIs (PubMed, Semantic Scholar, OpenAlex) or uploaded by user. Optionally belongs to a Collection. Can have an attached PDF file.
- **Collection**: A named folder for organizing papers. Belongs to a User. Contains zero or more Papers.
- **Citation**: A reference to a Paper within a Document. Records the section, position, and formatted citation text.
- **Plagiarism Check**: A record of a plagiarism analysis. Links to User (optional for funnel) and Document (optional). Stores input text, results, and external scan ID.
- **AI Detection Check**: A record of AI content detection. Links to User and Document (optional). Stores input text, results, and external scan ID.
- **Deep Research Report**: An AI-generated comprehensive research report on a topic. Links to User. Stores markdown report content and cited papers.
- **Learn Mode Session**: A coaching conversation between the AI and student for a specific Document. Tracks the 5-stage process and conversation history.
- **Subscription**: A Razorpay subscription record. Links to User. Tracks plan type, status, and billing period.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 10 entity tables can be created, read, updated, and (where applicable) deleted through dedicated operations
- **SC-002**: Every table is queryable by userId, returning only that user's records, with sub-second response time for up to 10,000 records per table
- **SC-003**: PDF files can be uploaded, stored, and retrieved, with the stored file linked to the corresponding paper record
- **SC-004**: Subscription tier checking correctly enforces all usage limits defined in the pricing table (Free: 2 plagiarism + 2 AI detection/month; Basic: 5 plagiarism + 10 AI detection + 5 deep research/month)
- **SC-005**: Creating a user from Clerk sign-in results in a complete user record with all required fields within 2 seconds
- **SC-006**: Document operations (create, update, list) complete within 500ms for typical payloads
- **SC-007**: All indexes support the query patterns required by downstream features (paper search by externalId, citations by documentId, sessions by documentId, checks by status)
