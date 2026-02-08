# Feature Specification: Foundation and Authentication

**Feature Branch**: `001-foundation-auth`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Foundation and Authentication - Bootstrap Next.js 14+ App Router project with Convex database, Clerk authentication (Google OAuth + email/password), shadcn/ui, Tailwind CSS, and Vercel deployment."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Signs Up with Google (Priority: P1)

A medical student visits V1 Drafts for the first time and creates an account using their Google account. They click "Sign in with Google", authorize the app, and land on their personal dashboard ready to start working on their research paper.

**Why this priority**: Authentication is the gateway to every other feature. Without sign-up, no user can access Learn Mode, Draft Mode, or any tool. Google OAuth is the lowest-friction option for Indian medical students who universally have Gmail accounts.

**Independent Test**: Can be fully tested by visiting the sign-up page, clicking "Sign in with Google", completing OAuth flow, and verifying the user lands on a dashboard with their name displayed.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on the landing page, **When** they click "Sign in with Google" and authorize the app, **Then** they are redirected to their personal dashboard with their name and avatar displayed.
2. **Given** an unauthenticated user on the landing page, **When** they click "Sign in with Google" but cancel the OAuth prompt, **Then** they remain on the landing page with no error shown.
3. **Given** a user who previously signed up with Google, **When** they click "Sign in with Google" again, **Then** they are logged in directly to their existing dashboard without creating a duplicate account.

---

### User Story 2 - New User Signs Up with Email and Password (Priority: P2)

A medical student who prefers not to use Google creates an account using their email address and a password. They enter their email, create a password, verify their email, and access their dashboard.

**Why this priority**: Email/password is the fallback authentication method for users without Google accounts or those who prefer traditional sign-up. It's essential but secondary to Google OAuth given the target demographic.

**Independent Test**: Can be fully tested by entering email and password on sign-up form, completing email verification, and verifying the user lands on a dashboard.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on the sign-up page, **When** they enter a valid email and password (minimum 8 characters), **Then** a verification email is sent and they are prompted to verify their email.
2. **Given** a user who has received a verification email, **When** they click the verification link, **Then** their account is activated and they are redirected to their dashboard.
3. **Given** a user trying to sign up with an email already registered, **When** they submit the form, **Then** they see a message indicating the email is already in use with an option to sign in instead.

---

### User Story 3 - Returning User Signs In (Priority: P1)

A returning user visits V1 Drafts and signs in using either Google or email/password. They are taken directly to their dashboard where their previous work and settings are preserved.

**Why this priority**: Returning user authentication is as critical as sign-up since users will sign in far more often than they sign up.

**Independent Test**: Can be tested by signing in with previously created credentials and verifying the dashboard loads with the user's data.

**Acceptance Scenarios**:

1. **Given** a registered user on the sign-in page, **When** they sign in with Google, **Then** they are redirected to their dashboard within 3 seconds.
2. **Given** a registered user on the sign-in page, **When** they enter correct email and password, **Then** they are redirected to their dashboard.
3. **Given** a user who enters incorrect credentials, **When** they submit the form, **Then** they see a clear error message without revealing whether the email exists.

---

### User Story 4 - Protected Routes Enforce Authentication (Priority: P1)

Any unauthenticated user who tries to access a protected page (dashboard, editor, settings) is automatically redirected to the sign-in page. After signing in, they are taken to the page they originally requested.

**Why this priority**: Route protection is a foundational security requirement. Without it, the entire application is exposed to unauthorized access.

**Independent Test**: Can be tested by navigating directly to a protected URL while logged out and verifying redirection to sign-in.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they navigate to `/dashboard`, **Then** they are redirected to the sign-in page.
2. **Given** an unauthenticated user redirected to sign-in from `/dashboard`, **When** they complete sign-in, **Then** they are redirected back to `/dashboard`.
3. **Given** an authenticated user, **When** they navigate to `/dashboard`, **Then** the page loads normally with their data.

---

### User Story 5 - User Signs Out (Priority: P2)

An authenticated user clicks "Sign Out" from anywhere in the app. Their session is terminated and they are returned to the landing page. Navigating back does not restore the session.

**Why this priority**: Sign-out completes the authentication lifecycle and is necessary for shared devices common in Indian medical college hostels.

**Independent Test**: Can be tested by signing in, clicking sign out, and verifying the session is fully terminated.

**Acceptance Scenarios**:

1. **Given** an authenticated user on any page, **When** they click "Sign Out", **Then** they are redirected to the landing page.
2. **Given** a user who just signed out, **When** they press the browser back button, **Then** they are redirected to the sign-in page (not the authenticated page).

---

### User Story 6 - Application Loads on Mobile (Priority: P2)

A medical student opens V1 Drafts on their phone (the primary device for many Indian students). The landing page, sign-in forms, and dashboard are fully usable with appropriately sized touch targets and readable text.

**Why this priority**: The constitution mandates mobile-responsive from day one. The target demographic (Indian medical students) frequently uses mobile as their primary device.

**Independent Test**: Can be tested by loading the app on a mobile viewport (375px wide) and verifying all interactive elements are tappable and all text is readable.

**Acceptance Scenarios**:

1. **Given** a user on a mobile device (375px viewport), **When** they load the landing page, **Then** all text is readable and all buttons have minimum 44px touch targets.
2. **Given** a user on a mobile device, **When** they complete the sign-in flow, **Then** all form fields and buttons are usable without horizontal scrolling.

---

### Edge Cases

- What happens when a user signs up with Google and later tries to sign up with the same email via email/password? They should be informed the email is linked to a Google account and offered to sign in with Google instead.
- What happens when the authentication service is temporarily unavailable? The user sees a friendly error message: "We're having trouble connecting. Please try again in a moment."
- What happens when a user's session expires while they are on a protected page? They are redirected to sign-in with a message: "Your session has expired. Please sign in again."
- What happens when a user tries to access the app with JavaScript disabled? The page should show a meaningful message indicating JavaScript is required.
- What happens on extremely slow connections (common in rural India)? Loading states should be visible and the app should not time out prematurely.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create accounts using Google OAuth (single click sign-up).
- **FR-002**: System MUST allow users to create accounts using email and password with email verification.
- **FR-003**: System MUST authenticate returning users via Google OAuth or email/password.
- **FR-004**: System MUST protect all authenticated routes and redirect unauthenticated users to sign-in.
- **FR-005**: System MUST redirect users to their originally requested page after successful authentication.
- **FR-006**: System MUST allow authenticated users to sign out, fully terminating their session.
- **FR-007**: System MUST display a responsive landing page that works on viewports from 375px to 1920px.
- **FR-008**: System MUST persist user account data (name, email, avatar, creation date) in the database.
- **FR-009**: System MUST display a dashboard page for authenticated users as the post-login landing page.
- **FR-010**: System MUST provide a responsive navigation shell with user identity display and sign-out action.
- **FR-011**: System MUST enforce minimum 44px touch targets on all interactive elements for mobile usability.
- **FR-012**: System MUST display appropriate loading states during authentication and page transitions.
- **FR-013**: System MUST handle authentication service failures gracefully with user-friendly error messages.
- **FR-014**: System MUST prevent duplicate accounts when the same email is used across different auth methods.

### Key Entities

- **User**: Represents a registered person. Key attributes: unique identifier, display name, email address, profile avatar URL, authentication method(s), account creation timestamp, subscription tier (defaults to "free").
- **Session**: Represents an active authenticated session. Key attributes: associated user, creation time, expiration policy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete Google sign-up in under 10 seconds (from clicking "Sign in with Google" to seeing their dashboard).
- **SC-002**: Users can complete email/password sign-up in under 2 minutes (including email verification).
- **SC-003**: Returning users can sign in and reach their dashboard in under 5 seconds.
- **SC-004**: 100% of protected routes redirect unauthenticated users to sign-in (zero unauthorized access).
- **SC-005**: All pages are fully usable on mobile devices (375px viewport) with no horizontal scrolling required.
- **SC-006**: All interactive elements meet the 44px minimum touch target requirement.
- **SC-007**: The application deploys successfully and is accessible via a public URL.
- **SC-008**: The application loads (first contentful paint) in under 3 seconds on a standard broadband connection.

## Assumptions

- Google OAuth is sufficient as the social login provider for V1 (no Facebook, Apple, etc. needed).
- Email verification is handled by the authentication provider (Clerk) with default email templates.
- Password requirements follow industry standards: minimum 8 characters (Clerk's default policy).
- The dashboard in this feature is a minimal placeholder showing user identity; full dashboard content is a separate feature.
- The landing page is a minimal page with sign-in/sign-up options; full marketing content is a separate feature.
- User data retention follows standard SaaS practices (data retained while account is active).
- The "free" subscription tier is the default for all new users; paid tier management is a separate feature.
