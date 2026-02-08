# Feature Specification: Deep Research

## Overview
A deep research feature that lets users enter a research topic and receive a comprehensive research report with cited sources. The agent iteratively searches academic databases, evaluates results, and synthesizes findings into a structured report.

## User Stories

### US1: Launch Deep Research (P1)
**As a** Basic/Pro subscriber
**I want to** enter a research topic and launch an autonomous research agent
**So that** I get a comprehensive research summary without manually searching and reading papers

**Acceptance Criteria:**
- User enters a topic (5-500 characters)
- System checks subscription tier (free/none blocked, basic: 5/mo, pro: 15/mo)
- Agent searches PubMed, Semantic Scholar, and OpenAlex iteratively
- Report generated in 30-90 seconds
- Progress shown in real-time (status: pending → in_progress → completed/failed)

### US2: View Research Report (P1)
**As a** user who launched a deep research
**I want to** view the generated report with structured sections and cited sources
**So that** I can understand the research landscape for my topic

**Acceptance Criteria:**
- Report displays: executive summary, key findings by theme, literature gaps, cited sources
- Report is rendered as formatted markdown
- Cited papers show title, authors, year, journal
- Users can copy the report text

### US3: Deep Research History (P2)
**As a** returning user
**I want to** see all my previous deep research reports
**So that** I can revisit research I've done before

**Acceptance Criteria:**
- List view showing topic, date, status for all reports
- Click to view full report
- Reports ordered by newest first

### US4: Subscription Gating (P2)
**As a** free-tier user
**I want to** see an upgrade prompt when I try deep research
**So that** I understand I need to upgrade to access this feature

**Acceptance Criteria:**
- Free/none users see upgrade modal with "Deep Research" feature
- Usage counter shown (X/5 or X/15 used this month)
- Limits enforced server-side in Convex mutation

## Functional Requirements

- FR1: Deep Research page at /deep-research with topic input and report display
- FR2: API route to trigger research agent and poll for results
- FR3: Mastra-based research agent that iteratively searches and synthesizes
- FR4: Real-time progress polling via useQuery on report status
- FR5: Report formatted as markdown with executive summary, findings, gaps, sources
- FR6: Subscription gating using existing checkUsageLimit system
- FR7: Navigation link added to nav-shell
- FR8: Dashboard usage stats already show deep research (existing)

## Success Criteria

- SC1: Basic/Pro users can generate a research report from a topic in under 2 minutes
- SC2: Reports contain at least 5 cited academic papers from real databases
- SC3: Free users see upgrade modal when attempting deep research
- SC4: Previous reports are accessible from the reports list
- SC5: All new pages are mobile-responsive (375px and 1280px viewports)
