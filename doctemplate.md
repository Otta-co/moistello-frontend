# Moistello Wallet Integration — Phase Documentation Template

> **How to use:** For each phase, copy this template and answer the prompts. Every `[ ]` must be filled. Every prompting question under each section must produce a detailed response. No phase is marked complete until every prompt is fully answered.

---

## PHASE TEMPLATE

### Phase Metadata
```
Phase Number:      [ ]
Phase Name:        [ ]
Date Started:      [ ]
Date Completed:    [ ]
Status:            [ PENDING / IN PROGRESS / COMPLETE ]
Blocks Phase(s):   [ ]
Blocked By:        [ ]
Implementing Agent:[ ]
```

---

## PHASE READINESS GATES (Complete Before ANY Code)

```
[ ] All dependencies verified — versions pinned, no CVEs, bundle impact measured
[ ] SSR safety audit completed for every planned file
[ ] Test files created and FAILING (confirming they detect missing code)
[ ] Previous phase tests still pass (regression check)
[ ] Feature flag defined and default value set
[ ] Rollback path tested (feature flag off → old behavior confirmed)
[ ] All adapter interfaces reviewed against provider documentation
[ ] Security level tags assigned to every sensitive function

DO NOT PROCEED to implementation until ALL gates are checked.
```

---

## 1. WHAT WAS BUILT

### 1.1 New Files
```
[ ] List every file created. Format: path → purpose → line count
[ ] For each file: justify why it exists (not just what it does)
[ ] For each file: which enterprise pattern does it follow?
```

### 1.2 Modified Files
```
[ ] List every file changed. Format: path → what changed → why
[ ] For each: is backward compatibility maintained? How?
[ ] For each: is the old code path still accessible via feature flag?
```

### 1.3 New Dependencies
```
[ ] List every new package installed
[ ] For each: version, license, maintainer track record
[ ] For each: why THIS package over alternatives (benchmark the decision)
[ ] For each: bundle size impact (before vs after)
[ ] For each: known vulnerabilities in last 90 days?
```

---

### 1.X — DEPENDENCY COMPATIBILITY CHECK (Mandatory Pre-Implementation)

Before `npm install` or `cargo add`:

```
[ ] What is the EXACT version being installed? (not caret range — exact pin)
[ ] Is this version compatible with the EXISTING dependency tree? (check peer deps)
[ ] For blockchain/Stellar packages: does the SDK version match the deployed contract SDK version?
[ ] For wallet packages: does the package version match the wallet extension's current API version?
[ ] Has this exact version been tested in ANY environment before? If no: what's the rollback plan?
[ ] Bundle size impact: measure before AND after install. Reject if >50KB gzipped increase.
[ ] Known CVEs in this version: check `npm audit` or `cargo audit` before install.
```

---

## 2. ARCHITECTURE DECISIONS

### 2.1 Interface Design
```
[ ] Show the full interface/type definitions created in this phase
[ ] For every property: why is it required vs optional?
[ ] For every method: why this signature over alternatives?
[ ] What interface patterns were REJECTED and why?
```

### 2.2 Algorithm Documentation
```
[ ] For every algorithm introduced: write pseudocode
[ ] For every algorithm: what are the security properties?
[ ] For every algorithm: what are the failure modes?
[ ] For every algorithm: what inputs were tested (valid, invalid, boundary)?
[ ] For every algorithm: what is the time complexity? Memory complexity?
[ ] For every algorithm involving cryptography: cite the standard (RFC, NIST, etc.)
```

### 2.3 State Management Design
```
[ ] What new state was introduced?
[ ] Where is state stored (memory, localStorage, sessionStorage, encrypted storage)?
[ ] What is the state lifecycle (created → used → invalidated → destroyed)?
[ ] How does state survive: page refresh, tab close, browser restart, device sleep?
[ ] What happens to state on error/failure?
[ ] How is state synced across multiple open tabs?
```

### 2.4 Error Handling Strategy
```
[ ] List every possible error this phase can produce
[ ] For each: what does the user see?
[ ] For each: what is logged to audit?
[ ] For each: is it retryable? If so, what is the retry strategy?
[ ] Are errors classified by type (network, auth, user-rejection, contract, unknown)?
[ ] Does the error propagate to the right boundary (component boundary, not catch-all)?
```

---

### 2.X — SSR SAFETY AUDIT (Mandatory Pre-Implementation)

Before writing ANY code, every file must answer:

```
[ ] Does this file import or use `localStorage`, `sessionStorage`, `window`, `document`, `BroadcastChannel`, or `navigator`?
[ ] If yes: where is the `typeof window === "undefined"` guard?
[ ] If the file is a module (exported at file scope): does instantiation happen lazily or behind a guard?
[ ] If the file is a React hook: does `useEffect` guard browser-only code? (hooks run on both server and client)
[ ] Are there any module-level `new BroadcastChannel()`, `new WebSocket()`, or `localStorage.getItem()` calls outside a function?

Rule: Every file that touches browser APIs MUST start execution with `if (typeof window === "undefined") return` or wrap browser code in `useEffect` / event handlers.
```

---

## 3. SECURITY ANALYSIS

### 3.1 Attack Surface
```
[ ] What new attack surface was introduced?
[ ] For each surface: what is the threat model?
[ ] For each surface: what is the mitigation?
[ ] What existing attack surfaces were affected by this phase?
```

### 3.2 Authentication & Authorization
```
[ ] How does this phase handle user identity verification?
[ ] What cryptographic primitives are used and why?
[ ] Where do keys/secrets live during the operation lifecycle?
[ ] Is there any point where a private key exists in memory unencrypted?
[ ] How is session hijacking prevented?
[ ] How is replay attack prevented?
```

### 3.3 Data Protection
```
[ ] What sensitive data is handled in this phase?
[ ] How is it protected at rest?
[ ] How is it protected in transit?
[ ] How is it protected in memory?
[ ] What is the data retention policy for this phase's data?
[ ] How is data purged on logout / session expiry?
```

### 3.4 Supply Chain
```
[ ] Were all new dependencies audited for supply chain attacks?
[ ] Were dependency lock files verified (integrity hashes match)?
[ ] Were transitive dependencies reviewed for known issues?
[ ] Is there a plan for dependency updates (Dependabot / Renovate)?
```

---

### 3.X — SECURITY IMPLEMENTATION LEVEL (Per-Feature Tagging)

Every security-critical function must be tagged:

```
| Function | Current Phase Level | Target Level | Upgrade Trigger |
|---|---|---|---|
| Session HMAC | Simplified hash (this phase) | crypto.subtle SHA-256 (Phase 3) | When passkey encryption is added |
| Storage encryption | Plain localStorage (this phase) | AES-256-GCM (Phase 3) | When hardware-backed keys available |
| Extension verification | Extension ID check (this phase) | Certificate pinning (Phase 6) | Before mainnet launch |

Rule: No security shortcut is left undocumented. Every simplification has a documented upgrade path.
```

---

## 4. PERFORMANCE ANALYSIS

### 4.1 Critical Path Timing
```
[ ] What is the critical path for the PRIMARY user action in this phase?
[ ] Measure: cold start (first ever load)
[ ] Measure: warm start (returning user, cached)
[ ] Measure: worst case (slow network, low-end device)
[ ] What is the p50, p95, p99 latency for each measurement?
[ ] What performance budgets were set, and were they met?
```

### 4.2 Resource Usage
```
[ ] Bundle size impact (JS, CSS, assets) in KB (raw and gzipped)
[ ] Memory usage at idle
[ ] Memory usage during peak operation
[ ] Number of network requests introduced
[ ] Total bytes transferred for a typical session
[ ] CPU profile for the critical path (any frame drops or long tasks?)
```

### 4.3 Optimization Decisions
```
[ ] What was deliberately NOT optimized and why?
[ ] What optimization was applied that may seem excessive? Justify.
[ ] Where would future optimization effort yield the highest ROI?
[ ] Is there any code that loads eagerly but should be lazy?
[ ] Is there any code loaded on every page that is only needed on some pages?
```

---

## 5. TESTING EVIDENCE

### 5.0 — TEST-DRIVEN ORDER (Mandatory Sequence)

Tests MUST be written and FAILING before implementation code exists. Sequence:

```
1. Write test file → run → FAILS (confirms test catches missing code)
2. Write implementation → run → PASSES (confirms code satisfies test)
3. Run ALL previous tests → PASSES (confirms no regression)

For every file in section 1.2:
[ ] Test file exists BEFORE implementation file
[ ] Test file was run and FAILED before implementation was written
[ ] Test file passes after implementation
[ ] All previous phase tests still pass
```

### 5.1 Unit Tests
```
[ ] Total unit tests written: [ ]
[ ] Total passing: [ ] Total failing: [ ] Total skipped: [ ]
[ ] Coverage for new code: [ ]%
[ ] Every exported function has: happy path + error path + boundary test
[ ] Every adapter/strategy has a test that mocks the underlying provider
[ ] Every algorithm has a property-based test (randomized inputs, invariant checks)
```

### 5.2 Integration Tests
```
[ ] Total integration tests written: [ ]
[ ] List the external systems tested against (which wallets, which networks)
[ ] For each integration: was it tested against the REAL system or a mock?
[ ] If mocked: what's the plan to test against real systems before release?
[ ] For WalletConnect: was the full pairing→connect→sign→disconnect path tested?
```

### 5.3 Security Tests
```
[ ] List every security test executed
[ ] For each: what attack was simulated?
[ ] For each: was the mitigation verified effective?
[ ] Were any vulnerabilities found? If yes, how were they resolved?
[ ] Who performed the security review? (Name and role)
```

### 5.4 Edge Case Tests
```
[ ] List at least 10 edge cases tested
[ ] For each: what is the scenario?
[ ] For each: what is the expected behavior?
[ ] For each: does it pass?
[ ] Examples: zero-balance wallet, wallet-mid-transaction, expired-session, 
  network-switch-during-sign, multiple-tabs, browser-back-button, 
  slow-3G-network, device-sleep-wake, extension-update, wallet-rejected
```

### 5.5 Regression Tests
```
[ ] All previous phase tests still pass: YES / NO
[ ] If NO: list failures and resolutions
[ ] Was the full test suite run (not just the new tests)?
[ ] Were tests run with race detector / concurrency fuzzer?
```

---

## 6. USER EXPERIENCE

### 6.1 Flow Documentation
```
[ ] Diagram the complete user flow for the PRIMARY action
[ ] Diagram the complete user flow for the ERROR path
[ ] How many clicks/taps from landing to authenticated? (Measure)
[ ] How many clicks/taps from authenticated to signed transaction? (Measure)
[ ] What is the time-to-value (seconds from landing to first successful action)?
```

### 6.2 Error UX
```
[ ] For every error: show the EXACT message the user sees
[ ] For every error: does the user know what to do next?
[ ] Is there a universal "escape hatch" if the user is stuck?
[ ] What happens when the user clicks "back" during an error state?
```

### 6.3 Loading States
```
[ ] Show every loading state introduced in this phase
[ ] For each: what skeleton/spinner/shim is shown?
[ ] For each: what's the maximum duration before timeout?
[ ] For each: what if it takes longer than timeout?
```

### 6.4 Accessibility Verification
```
[ ] Keyboard navigation: can the entire flow be completed without a mouse?
[ ] Screen reader: was the flow tested with VoiceOver / NVDA?
[ ] Color contrast: do all text elements meet WCAG AA (4.5:1)?
[ ] Focus management: is focus trapped in modals, returned on close?
[ ] Reduced motion: does the UI respect prefers-reduced-motion?
[ ] Touch targets: are all interactive elements ≥44px?
```

### 6.5 Mobile & Cross-Device
```
[ ] Was the flow tested on: iPhone Safari, Android Chrome, iPad?
[ ] Was the flow tested with: slow 3G, offline, spotty WiFi?
[ ] Does the flow work when the wallet is on a DIFFERENT device (phone wallet, desktop browser)?
[ ] Does the QR/ deep link flow work for WalletConnect pairing?
```

### 6.6 Internationalization
```
[ ] Are all new user-facing strings in locale files?
[ ] Were translations verified for all 6 supported languages?
[ ] Are wallet names kept in original language (proper nouns)?
[ ] Is RTL layout support maintained for Arabic/Hebrew?
```

---

## 7. OPERATIONS & MONITORING

### 7.1 Observability
```
[ ] What new metrics were added? (Name, type, labels)
[ ] What new alerts were configured? (Condition, severity, runbook)
[ ] What new logs were added? (Format, level, PII considerations)
[ ] What dashboard was created/updated for this phase?
```

### 7.2 Feature Flags
```
[ ] What feature flags control this phase's behavior?
[ ] What is the default state (on/off)?
[ ] What is the rollback procedure? (Time to rollback: < ? minutes)
[ ] Was rollback tested?
```

### 7.3 Failure Modes
```
[ ] What happens if the WalletConnect relay is down?
[ ] What happens if the passkey credential store is corrupted?
[ ] What happens if the hardware wallet firmware is outdated?
[ ] What happens if localStorage is full?
[ ] What happens if the browser doesn't support WebAuthn?
[ ] What happens if the user revokes the wallet permission in browser settings?
[ ] For each: is there a graceful degradation path or user-facing message?
```

---

## 8. COMPLETION GATES

```
A phase is COMPLETE only when ALL these are true:

[ ] Every file listed in Section 1 exists with documented purpose
[ ] Every algorithm in Section 2 has pseudocode + security properties
[ ] Every attack surface in Section 3 has threat model + mitigation
[ ] Every performance budget in Section 4 is met
[ ] Every test in Section 5 passes (0 skipped, 0 failed)
[ ] Every UX flow in Section 6 is diagrammed and measured
[ ] Every monitoring item in Section 7 is deployed
[ ] Feature flag tested: off → old behavior, on → new behavior
[ ] Rollback tested: <5 minutes
[ ] Full test suite passes (contracts + backend + frontend)
[ ] Bundle size increase approved (<50KB gzipped)
[ ] Race detector CLEAN
[ ] Dependencies audited (0 known CVEs)
[ ] Accessibility: keyboard-only flow verified
[ ] Mobile: tested on ≥2 device types
[ ] Security review completed by second engineer
```

---

## 9. PHASE SIGN-OFF

| Role | Name | Verified | Date |
|---|---|---|---|
| Implementation | [ ] | All code written, all tests pass | |
| Code Review | [ ] | Patterns correct, no shortcuts | |
| Security Review | [ ] | Attack surface analyzed, pen-tests pass | |
| UX Review | [ ] | Flows tested on real devices, a11y verified | |
| Product | [ ] | Matches requirements, user value delivered | |

**Final Status:** [ PENDING / IN PROGRESS / COMPLETE ]

**Open Blockers:** (list any unresolved issues or attach tickets)

---

> **Instructions for the agent completing this template:**
> 
> 1. Every `[ ]` must become a filled answer. No blanks tolerated.
> 2. Every prompting question under each section must produce a detailed narrative response — not one word, not "yes/no", but the reasoning, evidence, and justification.
> 3. Performance numbers require actual measurements from the build environment — not estimates.
> 4. Security answers require threat modeling for the specific phase — not generic security statements.
> 5. Testing answers require actual test output — not "tests were written".
> 6. If a section doesn't apply to this phase, explain WHY it doesn't apply — don't skip it.
> 7. At the end, re-read every answer and ask: "Would this convince a CTO to approve production deployment?" If not, deepen it.
