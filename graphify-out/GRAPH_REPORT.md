# Graph Report - .  (2026-05-03)

## Corpus Check
- Corpus is ~25,644 words - fits in a single context window. You may not need a graph.

## Summary
- 166 nodes · 242 edges · 15 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_OTP Authentication & Supabase Setup|OTP Authentication & Supabase Setup]]
- [[_COMMUNITY_Dashboard Core & Page Routing|Dashboard Core & Page Routing]]
- [[_COMMUNITY_Workspace Management & Invites|Workspace Management & Invites]]
- [[_COMMUNITY_Category & Subcategory Management|Category & Subcategory Management]]
- [[_COMMUNITY_Transaction UI & Reporting|Transaction UI & Reporting]]
- [[_COMMUNITY_User Settings & Account Deletion|User Settings & Account Deletion]]
- [[_COMMUNITY_Transaction Mutations|Transaction Mutations]]
- [[_COMMUNITY_Workspace Switching|Workspace Switching]]
- [[_COMMUNITY_Invite Acceptance Flow|Invite Acceptance Flow]]
- [[_COMMUNITY_Test Invalid OTP Retry|Test: Invalid OTP Retry]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Resend Client|Resend Client]]
- [[_COMMUNITY_Redis Client|Redis Client]]
- [[_COMMUNITY_Agent Rules|Agent Rules]]
- [[_COMMUNITY_Antigravity Behavior|Antigravity Behavior]]

## God Nodes (most connected - your core abstractions)
1. `getUser()` - 17 edges
2. `cn()` - 12 edges
3. `getWorkspaces()` - 11 edges
4. `getActiveWorkspaceId()` - 9 edges
5. `TransactionsPage()` - 6 edges
6. `createClient()` - 6 edges
7. `sendOtp()` - 5 edges
8. `verifyOtp()` - 5 edges
9. `getWorkspaceMembers()` - 5 edges
10. `DashboardLayout()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Multi-tenant Workspace Isolation` --implemented_by--> `getActiveWorkspaceId()`  [INFERRED]
  testsprite_tests/tmp/code_summary.yaml → src\app\actions\workspaces.ts
- `handleSendOtp()` --calls--> `sendOtp()`  [INFERRED]
  src\app\auth\page.tsx → src\app\actions\auth.ts
- `handleResend()` --calls--> `sendOtp()`  [INFERRED]
  src\app\auth\page.tsx → src\app\actions\auth.ts
- `handleVerifyOtp()` --calls--> `verifyOtp()`  [INFERRED]
  src\app\auth\page.tsx → src\app\actions\auth.ts
- `SettingsPage()` --calls--> `getUser()`  [INFERRED]
  src\app\dashboard\settings\page.tsx → src\app\actions\auth.ts

## Hyperedges (group relationships)
- **Core Authentication Nexus** — feature_otp_auth, src_middleware_ts, src_lib_supabase_server_ts [INFERRED 0.85]

## Communities

### Community 0 - "OTP Authentication & Supabase Setup"
Cohesion: 0.12
Nodes (17): finishOnboarding(), getActiveSessions(), sendOtp(), signIn(), signOut(), verifyOtp(), handleFinishOnboarding(), handleResend() (+9 more)

### Community 1 - "Dashboard Core & Page Routing"
Cohesion: 0.24
Nodes (13): getUser(), getCategoriesWithSubs(), getReportData(), getCategories(), getTransactions(), getActiveWorkspaceId(), getWorkspaces(), DashboardLayout() (+5 more)

### Community 2 - "Workspace Management & Invites"
Cohesion: 0.2
Nodes (16): confirmOwnershipTransfer(), createInvite(), deleteWorkspace(), getWorkspace(), getWorkspaceInvites(), getWorkspaceMembers(), leaveWorkspace(), requestOwnershipTransfer() (+8 more)

### Community 3 - "Category & Subcategory Management"
Cohesion: 0.13
Nodes (7): createTransaction(), deleteTransaction(), updateTransaction(), handleSubmit(), cn(), handleDelete(), handleSave()

### Community 4 - "Transaction UI & Reporting"
Cohesion: 0.24
Nodes (9): createCategory(), createSubcategory(), deleteCategory(), deleteSubcategory(), updateCategory(), updateSubcategory(), commit(), handleDelete() (+1 more)

### Community 5 - "User Settings & Account Deletion"
Cohesion: 0.29
Nodes (8): requestAccountDeletion(), revokeAccountDeletion(), terminateSession(), updateProfile(), handleAccountDeletion(), handleKillSession(), handleRevokeDeletion(), handleSaveUsername()

### Community 6 - "Transaction Mutations"
Cohesion: 0.6
Nodes (4): createWorkspace(), setActiveWorkspace(), handleCreateWorkspace(), handleSwitch()

### Community 7 - "Workspace Switching"
Cohesion: 0.6
Nodes (4): acceptInviteWithOtp(), sendInviteOtp(), handleStartAccept(), handleVerifyOtp()

### Community 8 - "Invite Acceptance Flow"
Cohesion: 0.67
Nodes (2): middleware(), updateSession()

### Community 24 - "Test: Invalid OTP Retry"
Cohesion: 1.0
Nodes (2): Optimistic Concurrency Pattern, Zero-Lag UI Philosophy

### Community 31 - "PostCSS Config"
Cohesion: 1.0
Nodes (1): Fine Finance App

### Community 32 - "Resend Client"
Cohesion: 1.0
Nodes (1): AI Operating Rules

### Community 33 - "Redis Client"
Cohesion: 1.0
Nodes (1): Developer Guide

### Community 34 - "Agent Rules"
Cohesion: 1.0
Nodes (1): Antigravity Core Behavior

### Community 35 - "Antigravity Behavior"
Cohesion: 1.0
Nodes (1): Auth-to-Redis Latent Coupling

## Knowledge Gaps
- **8 isolated node(s):** `Fine Finance App`, `AI Operating Rules`, `Developer Guide`, `Antigravity Core Behavior`, `Optimistic Concurrency Pattern` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Invite Acceptance Flow`** (4 nodes): `middleware.ts`, `middleware()`, `middleware.ts`, `updateSession()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test: Invalid OTP Retry`** (2 nodes): `Optimistic Concurrency Pattern`, `Zero-Lag UI Philosophy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `Fine Finance App`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Resend Client`** (1 nodes): `AI Operating Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Redis Client`** (1 nodes): `Developer Guide`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agent Rules`** (1 nodes): `Antigravity Core Behavior`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Antigravity Behavior`** (1 nodes): `Auth-to-Redis Latent Coupling`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Category & Subcategory Management` to `OTP Authentication & Supabase Setup`, `Dashboard Core & Page Routing`, `Workspace Management & Invites`, `Transaction UI & Reporting`, `User Settings & Account Deletion`, `Transaction Mutations`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `getUser()` connect `Dashboard Core & Page Routing` to `OTP Authentication & Supabase Setup`, `Workspace Management & Invites`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `createClient()` connect `OTP Authentication & Supabase Setup` to `Workspace Management & Invites`, `Category & Subcategory Management`, `Transaction UI & Reporting`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `getUser()` (e.g. with `DashboardLayout()` and `ReportsPage()`) actually correct?**
  _`getUser()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `getWorkspaces()` (e.g. with `DashboardLayout()` and `ReportsPage()`) actually correct?**
  _`getWorkspaces()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `getActiveWorkspaceId()` (e.g. with `DashboardLayout()` and `TransactionsPage()`) actually correct?**
  _`getActiveWorkspaceId()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `TransactionsPage()` (e.g. with `getUser()` and `getWorkspaces()`) actually correct?**
  _`TransactionsPage()` has 5 INFERRED edges - model-reasoned connections that need verification._