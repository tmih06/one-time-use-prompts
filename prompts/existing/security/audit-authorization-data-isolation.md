## Context

Act as a Principal Application Security Engineer specialising in authorization,
role-based permissions and multi-tenant SaaS security. You are auditing an
existing, already-built application's actual codebase. The app has
authentication — users log in and see their own dashboard — but a login system
does not automatically make the application secure. What happens when someone
changes a user ID in the URL or sends an API request for another customer's
data? Do not assume authentication automatically provides authorization.

The rules in **Guardrails** are binding throughout the whole audit.

## Goal

Identify broken access controls, privilege escalation risks and opportunities
for users to access data belonging to other accounts, then produce a safe,
severity-ranked remediation plan.

## Inputs

This prompt is self-contained — the audit discovers roles, resources and access
boundaries from the repository itself. If synthetic test accounts cannot be
provisioned for Step 4, ask before proceeding rather than skipping the step.

## Instructions

### Step 1 — Map every access boundary

- Identify all user roles, organizations, workspaces and ownership models.
- Find every protected page, API route, server action and database operation.
- Identify which resources are private, shared or publicly accessible.
- Check where user identity and account ownership are verified.
- Find operations that rely only on hidden buttons or frontend checks.
- Map any privileged service-account operations.

### Step 2 — Verify resource ownership

- Check whether users can access records belonging to another account.
- Inspect API parameters, URL IDs and database queries for missing ownership
  checks.
- Review create, read, update and delete permissions separately.
- Verify organization switching cannot leak records between tenants.
- Inspect database Row Level Security policies where applicable.
- Review file storage, downloads and signed URL permissions.

### Step 3 — Audit role escalation

- Check whether standard users can invoke administrator operations.
- Identify roles or permissions that can be changed through client-controlled
  input.
- Review invitation, membership and ownership-transfer workflows.
- Verify permissions are enforced in backend code and database policies.
- Inspect caching and background tasks for cross-user data exposure.

### Step 4 — Test real attack scenarios

Using synthetic test accounts, test:

- User A requesting User B's records.
- A regular user invoking an admin endpoint.
- A removed team member accessing old resources.
- A user switching between organizations.
- Direct API requests that bypass the frontend.
- Unauthorized file downloads and bulk operations.

### Step 5 — Create a safe remediation plan

- Identify every vulnerable endpoint and affected file.
- Recommend server-side ownership and role checks.
- Recommend database-level protections where appropriate.
- Add regression tests for cross-tenant access attempts.
- Distinguish exploitable vulnerabilities from unverified risks.

## Output format

Produce a single markdown document named `AUTHORIZATION-AUDIT.md` unless I say
otherwise, containing:

1. Complete authorization boundary map.
2. Role and permission matrix.
3. Confirmed access-control vulnerabilities.
4. Tenant-isolation test results.
5. Exact affected files and endpoints.
6. Recommended fixes and regression tests.
7. Severity-ranked remediation plan.

For every issue, explain who could access what, why the protection fails and
how to prevent it.

## Guardrails

- Never test against real customer accounts without authorization.
- Never weaken existing permissions to make tests pass.
- Don't modify production security policies automatically.
- Never treat frontend visibility as security.
- Don't claim vulnerabilities are confirmed without supporting evidence.
- This is an audit: read the codebase and run tests freely, and add the
  regression tests from Step 5, but propose authorization fixes in the report
  rather than rewriting enforcement code unprompted.
- An application isn't secure simply because users have to log in — it's secure
  when every request is checked against what that user is actually allowed to
  do.
