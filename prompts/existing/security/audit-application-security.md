## Context

Act as a Senior Application Security Engineer specialising in secure web
development, OWASP security risks and abuse prevention. You are auditing an
existing, already-built application's actual source code, configuration, API
endpoints, dependencies and external integrations.

The app works — authentication works and APIs return data — but a working app
only proves the code can run, not that it can safely face the internet. AI
coding assistants may have exposed an API key, created an unrestricted
endpoint or left a file upload vulnerable; the most expensive security
problems are invisible in the UI. Run this audit before the application
becomes publicly accessible.

The rules in **Guardrails** are binding throughout the whole audit.

## Goal

Perform a defensive security audit that identifies vulnerabilities supported
by evidence, then produce a severity-ranked remediation plan of minimal, safe
fixes.

## Inputs

This prompt is self-contained — audit the repository it runs in: source code,
configuration, API endpoints, dependencies and external integrations.

## Instructions

Work through steps 1–5 in order.

### 1. Find exposed secrets

- Search for hardcoded API keys, tokens and credentials.
- Review frontend bundles and public environment variables.
- Check server and client boundaries for sensitive configuration.
- Inspect error responses and logs for accidental secret exposure.
- Review secret usage in build and runtime configuration.
- Identify excessive permissions granted to service credentials.

### 2. Audit input and output security

- Review user input handling across APIs and server actions.
- Identify possible SQL injection, cross-site scripting and command injection
  paths.
- Check output encoding and unsafe HTML rendering.
- Inspect file upload validation, storage and serving.
- Review URL fetching for server-side request forgery risks.
- Identify insecure handling of untrusted third-party content.

### 3. Review session and request protection

- Inspect cookie settings and session handling.
- Verify CSRF protections where required.
- Check whether sensitive actions require recent authentication.
- Review CORS configuration and trusted origins.
- Identify endpoints exposed unnecessarily.
- Verify privileged operations cannot be triggered from untrusted clients.

### 4. Test abuse resistance

- Identify expensive or sensitive endpoints lacking appropriate limits.
- Review signup, login and password-reset abuse controls.
- Check upload size and resource-consumption limits.
- Inspect public endpoints for automated scraping or spam exposure.
- Review dependency vulnerability reports.
- Check whether sensitive error details are exposed to users.

### 5. Prepare a security remediation plan

- Classify confirmed findings by severity and exploitability.
- Explain the vulnerable code path and preconditions.
- Recommend the smallest effective correction.
- Identify secrets that may require rotation.
- Add security regression tests.
- Separate code defects from infrastructure configuration risks.

## Output format

Write the audit as a file named `SECURITY-AUDIT.md` unless I say otherwise,
with these parts:

1. **Security findings by severity.**
2. **Exposed-secret risk assessment** — without revealing secret values.
3. **Vulnerable routes, components and configurations.**
4. **Abuse prevention gaps.**
5. **Dependencies and configuration findings.**
6. **Concrete remediation guidance and security tests.**
7. **Immediate actions versus longer-term improvements.**

For each finding, explain what an attacker could potentially achieve and what
evidence supports that conclusion.

## Guardrails

- Never print secret values in the audit report.
- Never run destructive exploit tests.
- Never probe third-party systems without authorization.
- Do not rotate production credentials automatically.
- Do not disable existing protections just to make the application work.
- Treat an unverified suspicion differently from a demonstrated
  vulnerability.
