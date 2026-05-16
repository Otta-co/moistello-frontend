# Moistello — Outstanding Upgrades: Systematic Implementation Plan

## Dependency Graph (What Blocks What)

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1-3: Foundation (Independent — run in parallel)        │
│                                                              │
│  Phase 1: Replace leftover Freighter references              │
│  Phase 2: Feature flag system for all new features           │
│  Phase 3: WalletConnect Project ID + verification            │
│                                                              │
│  These 3 phases have ZERO dependencies on each other.        │
│  They can run simultaneously with 3 agents.                  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Phase 4-5: Components (Depends on Phases 1-3)               │
│                                                              │
│  Phase 4: Wallet Settings Page (needs feature flags)        │
│  Phase 5: Ledger Transport Abstraction (needs feature flags)│
│                                                              │
│  Run in parallel with 2 agents.                              │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Phase 6-9: Contracts Governance (Rust/Soroban)              │
│                                                              │
│  Phase 6: Scoring Upgrade (reputation-registry)             │
│  Phase 7: Circle Integration (circle contract)               │
│  Phase 8: Governance Contract (new contract)                 │
│  Phase 9: Frontend Governance UI                             │
│                                                              │
│  Sequential within contracts (build order matters).          │
│  Phase 9 can start once Phase 6 API is locked.               │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Phase 10-11: Testing + Audit (Depends on all above)         │
│                                                              │
│  Phase 10: Integration Tests + Gas Profiling                │
│  Phase 11: Security Audit + Production Readiness            │
│                                                              │
│  Phase 11 can start once Phase 10 begins.                   │
└─────────────────────────────────────────────────────────────┘
```

---

## DETAILED PHASE SPECIFICATIONS

---

## PHASE 1 — Leftover Freighter References Removal

### What It Does
Completely eliminates every remaining reference to the old single-wallet Freighter-only pattern from the frontend. Verifies that all 10+ migration targets from Phase 5 were actually applied to disk.

### Implementation Order
1. Read every file listed in phase5.md section 1.3 Modified Files
2. For each file, verify the migration was actually done:
   - `dashboard/page.tsx` — check for old `walletStore.address` → must use `useMultiWallet().activeWallet?.publicKey`
   - `circles/create/page.tsx` — check for old `isFreighterInstalled()` → must use `useMultiWallet().activeAdapter.isAvailable()`
   - `circles/[id]/page.tsx` — check contribute flow → must use `activeAdapter.signTransaction()`
   - `settings/page.tsx` — check wallet label → must show dynamic list, not "Freighter Wallet"
   - `wallet/page.tsx` — check balance display → must use BalanceDisplay component
   - `header.tsx` — check wallet button → must use AccountSwitcher component
   - `sidebar.tsx` — check wallet info → must use useMultiWallet()
3. If any file still has old code, apply the migration NOW
4. Run `npx tsc --noEmit` — zero errors required
5. Run `npx vitest run` — all 68 tests must still pass

### Files Verified
```
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/circles/create/page.tsx
src/app/(dashboard)/circles/[id]/page.tsx
src/app/(dashboard)/settings/page.tsx
src/app/(dashboard)/wallet/page.tsx
src/components/layout/header.tsx
src/components/layout/sidebar.tsx
src/components/circles/circle-contribute-form.tsx
```

### Acceptance Criteria
- [ ] Zero files contain `isFreighterInstalled` import
- [ ] Zero files contain `connectFreighter()` call
- [ ] Zero files contain `walletStore.address` (single-store pattern)
- [ ] All 8 files use `useMultiWallet()` hook
- [ ] TypeScript: 0 errors
- [ ] Tests: 68/68 pass

---

## PHASE 2 — Feature Flag System

### What It Does
Implements the two missing feature flags that were planned but never created. Each flag controls whether a wallet adapter is available in the registry and visible in the WalletSelector.

### Implementation Details

### 2.1 — `NEXT_PUBLIC_FEATURE_PASSKEY` flag
```
File: .env (add)
NEXT_PUBLIC_FEATURE_PASSKEY=true

File: src/lib/wallet/adapters/index.ts (modify)
  - Before registering Passkey adapter, check:
  if (process.env.NEXT_PUBLIC_FEATURE_PASSKEY === "false") return;
  
File: src/components/wallet/wallet-selector.tsx (modify)
  - Filter detectedWallets to exclude passkey if flag is false
```

### 2.2 — `NEXT_PUBLIC_FEATURE_HARDWARE_WALLET` flag
```
File: .env (add)
NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=true

File: src/lib/wallet/adapters/index.ts (modify)
  - Before registering Ledger adapter, check:
  if (process.env.NEXT_PUBLIC_FEATURE_HARDWARE_WALLET === "false") return;

File: src/components/wallet/wallet-selector.tsx (modify)
  - Filter detectedWallets to exclude hardware wallets if flag is false
```

### 2.3 — Flag-Aware Registry
```
File: src/lib/wallet/registry.ts (modify)
  - Add isFeatureEnabled(walletId: string): boolean method
  - detect() skips adapters whose feature flag is "false"
  - register() still registers all adapters, but detect() filters them
```

### Acceptance Criteria
- [ ] Both flags added to `.env` with default value `true`
- [ ] Both flags added to `.env.example` with comments
- [ ] Registry respects flags during detection
- [ ] WalletSelector hides flagged-off wallets
- [ ] Setting flag to `false` and rebuilding removes the wallet from UI
- [ ] Tests: 68/68 still pass (flags default to true)

---

## PHASE 3 — WalletConnect Project ID & Verification

### What It Does
Ensures the WalletConnect adapter actually WORKS by sourcing a real project ID and verifying the connection flow.

### 3.1 — Project ID Configuration
```
File: .env.production
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<real-project-id>

File: .env.example
  Already has the placeholder — verify it's correct

File: src/lib/wallet/adapters/walletconnect.ts
  Read the projectId assignment. Verify:
  const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""
  
  If PROJECT_ID is empty:
    - Log a warning in console (dev only): "WalletConnect requires a project ID. Get one at cloud.walletconnect.com"
    - Fall back to explicit deep-linking without QR modal (still functional, just no QR code)
```

### 3.2 — Verification Checklist
- [ ] WalletConnect adapter initializes without error when PROJECT_ID is set
- [ ] WalletConnect adapter gracefully degrades when PROJECT_ID is empty (no crash, deep-link fallback)
- [ ] WalletConnect modal opens and displays QR code (requires browser test — not automated)
- [ ] `signMessage()` returns valid signature from connected wallet
- [ ] `signTransaction()` returns signed XDR from connected wallet

### Acceptance Criteria
- [ ] Project ID env var documented with instructions
- [ ] Empty PROJECT_ID does NOT crash the app
- [ ] Adapter gracefully degrades to deep-link fallback
- [ ] Tests: 68/68 still pass

---

## PHASE 4 — Wallet Settings Page

### What It Does
Creates the missing `wallet-settings.tsx` component (220 lines) that was planned in Phase 5 but never built. This is a full CRUD page for managing all connected wallets.

### Implementation Details

### 4.1 — `/src/components/wallet/wallet-settings.tsx`
```
Props: none (reads from multi-wallet store)
Purpose: Full wallet management page

Sections:
  1. Connected Wallets List
     - For each connected wallet:
       - Adapter icon + name
       - Public key (truncated, copyable)
       - Connection status badge (connected/reconnecting/disconnected/error)
       - Balance (XLM + USDC)
       - Last connected timestamp
       - "Disconnect" button with confirmation dialog
       - "Rename" button (saves alias to localStorage)

  2. Available Wallets
     - List of detected (installed) but not yet connected wallets
     - "Connect" button for each
     - "Install" link for not-detected wallets

  3. Security Section
     - "Disconnect All" button (with grave confirmation dialog)
     - Connected wallets count
     - Network status (testnet/mainnet) per wallet

  4. Danger Zone (bottom)
     - "Disconnect All Wallets" — red button, double-confirmation
     - "Clear All Wallet Data" — clears localStorage sessions
```

### 4.2 — Route Registration
```
File: src/app/(dashboard)/wallet/settings/page.tsx (NEW)
  - Import WalletSettings component
  - Wrap in DashboardLayout
  - Add to sidebar navigation
```

### 4.3 — Tests
- [ ] Component renders all connected wallets
- [ ] Disconnect button triggers confirmation, then disconnects
- [ ] Rename button saves alias to localStorage
- [ ] "Disconnect All" button clears all wallet state
- [ ] Empty state when no wallets connected
- [ ] Loading state during wallet scanning
- [ ] Error state when disconnect fails

### Acceptance Criteria
- [ ] WalletSettings page accessible at `/wallet/settings`
- [ ] All connected wallets displayed with status + balance
- [ ] Disconnect works for individual wallets
- [ ] Disconnect All works with confirmation
- [ ] Alias rename persists across page refresh
- [ ] TypeScript: 0 errors
- [ ] Tests: at least 5 new tests pass

---

## PHASE 5 — Ledger Transport Abstraction

### What It Does
Creates the missing `ledger-transport.ts` (120 lines planned in Phase 4) that abstracts WebUSB vs WebBLE transport selection for the Ledger adapter.

### Implementation Details

### 5.1 — `/src/lib/wallet/adapters/ledger-transport.ts`
```
Purpose: Runtime transport selection for Ledger hardware wallet

export type TransportType = "webusb" | "webble" | "none"

export interface LedgerTransport {
  type: TransportType
  create(): Promise<any>  // Creates the appropriate transport
  isSupported(): boolean
  close(): Promise<void>
}

export function detectAvailableTransport(): TransportType:
  1. Check navigator.usb (WebUSB) → "webusb"
  2. Check navigator.bluetooth (WebBLE) → "webble"  
  3. Neither → "none"

export function createTransport(type: TransportType): Promise<LedgerTransport>:
  - "webusb" → lazy import("@ledgerhq/hw-transport-webusb").default.create()
  - "webble" → lazy import("@ledgerhq/hw-transport-webble").default.create()
  - "none" → throw "No compatible transport available"

export function getTransportDescription(type: TransportType): string:
  - "webusb" → "Connect your Ledger via USB cable"
  - "webble" → "Connect your Ledger via Bluetooth"
  - "none" → "Your browser does not support hardware wallet connections"
```

### 5.2 — Update `ledger.ts`
Replace inline transport creation with the new abstraction:
```
WAS: const TransportWebUSB = (await import("@ledgerhq/hw-transport-webusb")).default
     transport = await TransportWebUSB.create()

NOW: const transportType = detectAvailableTransport()
     const lt = await createTransport(transportType)
     transport = await lt.create()
```

### 5.3 — Update `ledger-prompt.tsx`
Show the correct instruction based on transport type:
- WebUSB: "Connect your Ledger via USB cable to your computer"
- WebBLE: "Open Bluetooth settings and connect your Ledger"

### Acceptance Criteria
- [ ] `detectAvailableTransport()` returns correct type on desktop (webusb)
- [ ] `detectAvailableTransport()` returns correct type on mobile (webble or none)
- [ ] Creating transport fails gracefully on unsupported browsers
- [ ] LedgerPrompt shows correct instruction per transport type
- [ ] TypeScript: 0 errors
- [ ] Tests: 68/68 still pass + new transport tests

---

## PHASE 6 — Contracts: Scoring Upgrade (uxupgrade.md Phase A)

### What It Does
Implements the tier-based dynamic collateral, circle size limits, and contribution ceilings in the reputation registry contract. This is the FOUNDATION for the entire governance + reputation system.

### Implementation Details

### 6.1 — `contracts/packages/reputation-registry/src/scoring.rs`
Add these new functions (pseudocode from uxupgrade.md):

```
fn calculate_collateral(env: &Env, member: &Address) -> u32:
  Get MoiScore for member
  Match tier:
    Diamond (801-1000) → 0 bips (0%)
    Platinum (601-800) → 100 bips (1%)  
    Gold (401-600) → 300 bips (3%)
    Silver (201-400) → 500 bips (5%)
    Bronze (0-200) → 1000 bips (10%)

fn max_circle_size(env: &Env, member: &Address) -> u32:
  Match tier:
    Diamond → 100 members
    Platinum → 50 members
    Gold → 20 members
    Silver → 10 members
    Bronze → 5 members

fn max_contribution(env: &Env, member: &Address) -> i128:
  Match tier:
    Diamond → 50_000_0000000 (50K USDC)
    Platinum → 10_000_0000000 (10K USDC)
    Gold → 2_000_0000000 (2K USDC)
    Silver → 500_0000000 (500 USDC)
    Bronze → 100_0000000 (100 USDC)
```

### 6.2 — Point System Implementation
```
fn record_on_time_payment(env, member, circle_id) → u32:
  Base: +10 points
  Streak bonus: +5 per consecutive (max +50)
  Volume bonus: +1 per 100 USDC contributed (max +20)
  Cap at 1000

fn record_circle_completion(env, member) → u32:
  +100 points
  Cap at 1000

fn record_default(env, member) → u32:
  -200 points
  Floor at 0
  Reset streak to 0

fn apply_inactivity_decay(env, member) → u32:
  -5 points per 30 days of inactivity
  Floor at 0
```

### 6.3 — Tests (cargo test)
- [ ] `test_collateral_by_tier`: Verify each tier returns correct collateral
- [ ] `test_max_circle_size_by_tier`: Verify each tier returns correct max size
- [ ] `test_max_contribution_by_tier`: Verify tier limits
- [ ] `test_on_time_payment`: Verify +10 base + streak bonus
- [ ] `test_circle_completion`: Verify +100
- [ ] `test_default_penalty`: Verify -200, streak reset
- [ ] `test_score_cap_at_1000`: Cannot exceed 1000
- [ ] `test_score_floor_at_0`: Cannot go below 0
- [ ] `test_inactivity_decay`: Verify -5/month

### Acceptance Criteria
- [ ] All 9 new contract functions compile
- [ ] All 9 tests pass
- [ ] Existing contract tests still pass
- [ ] All scoring is deterministic — same inputs = same outputs
- [ ] No .unwrap() calls (must use .ok_or())
- [ ] Access control on all mutating functions

---

## PHASE 7 — Contracts: Circle Integration (uxupgrade.md Phase C)

### What It Does
Updates the circle contract to ENFORCE the tier-based limits from Phase 6. When a user creates or joins a circle, the contract checks their MoiScore tier and enforces the limits.

### Implementation Details

### 7.1 — `contracts/packages/circle/src/contract.rs`
Update `create_circle`:
```
fn create_circle(...):
  // Query reputation registry for organizer's tier
  let tier = reputation_registry::get_tier(env, organizer)
  
  // Enforce tier-based limits
  let max_size = reputation_registry::max_circle_size(env, organizer)
  if config.max_members > max_size:
    return Err(CircleSizeExceedsTier)
  
  let max_amount = reputation_registry::max_contribution(env, organizer)
  if config.contribution_amount > max_amount:
    return Err(ContributionExceedsTier)
  
  // Auto-apply collateral based on organizer's tier
  let collateral = reputation_registry::calculate_collateral(env, organizer)
  config.collateral_percent = collateral
```

Update `join`:
```
fn join(...):
  // Check member's tier-based collateral requirement
  let required_collateral = reputation_registry::calculate_collateral(env, member)
  if member has not staked required_collateral:
    return Err(CollateralRequired)
```

### 7.2 — Circle Lifecycle Reputation Triggers
Hook reputation updates INTO the circle lifecycle:
```
fn contribute(...):
  // After successful contribution:
  reputation_registry::record_on_time_payment(env, member, circle_id)

fn trigger_payout(...):
  // Check if circle completed:
  if status == COMPLETED:
    for each member:
      reputation_registry::record_circle_completion(env, member)

fn report_late(...):
  // After applying strikes:
  if strikes >= max_strikes:
    reputation_registry::record_default(env, member)
```

### 7.3 — Add new error variants to CircleError enum
```
CircleSizeExceedsTier    = 16
ContributionExceedsTier  = 17
CollateralRequired       = 18
```

### Acceptance Criteria
- [ ] `create_circle` enforces tier-based max members
- [ ] `create_circle` enforces tier-based max contribution
- [ ] `create_circle` auto-applies tier-based collateral
- [ ] `join` checks member collateral
- [ ] `contribute` triggers reputation update on success
- [ ] `trigger_payout` triggers reputation update on completion
- [ ] `report_late` triggers reputation update on default
- [ ] All contract tests pass
- [ ] Contracts compile for wasm32v1-none

---

## PHASE 8 — Contracts: Governance Contract (uxupgrade.md Phase B)

### What It Does
Creates an entirely NEW Soroban contract — the Governance system. This is the most complex upgrade: proposal creation, MOI token voting, on-chain execution.

### 8.1 — New Contract Structure
```
contracts/packages/governance/
├── Cargo.toml (new package)
├── src/
│   ├── lib.rs           # #[contractimpl] entry point
│   ├── contract.rs       # Proposal lifecycle: create, vote, execute, cancel
│   ├── types.rs          # Proposal, GovernanceConfig, ProposalAction, VoteType
│   ├── events.rs         # ProposalCreated, VoteCast, ProposalExecuted
│   ├── errors.rs         # GovernanceError enum
│   └── tests/
│       └── mod.rs        # 10+ tests
```

### 8.2 — Key Functions
```
create_proposal(env, proposer, deposit, action, description) → u64:
  - Require deposit_amount MOI staked
  - Create proposal with status=Active
  - Set voting_ends_at = now + voting_period
  - Set timelock_ends_at = voting_ends_at + timelock
  - Emit ProposalCreated

cast_vote(env, voter, proposal_id, vote_type) → ():
  - Verify proposal is Active
  - Verify voter hasn't already voted
  - Vote power = token_balance + delegated_balance
  - Record vote
  - Emit VoteCast

execute_proposal(env, proposal_id) → ():
  - Verify proposal is Passed
  - Verify timelock has expired
  - Execute the encoded action (call target contract with method + args)
  - Set status = Executed
  - Return deposit to proposer
  - Emit ProposalExecuted
```

### 8.3 — GovernanceConfig
```
struct GovernanceConfig:
  proposal_deposit: i128       // MOI required to create proposal
  voting_period_seconds: u64   // 604800 = 7 days
  timelock_seconds: u64        // 172800 = 48 hours
  quorum_bps: u32              // 2000 = 20% of supply must vote
  pass_threshold_bps: u32      // 5000 = 50%+ must vote For
```

### 8.4 — Upgradable Parameters (via governance itself)
All of these are governable through proposals:
- Collateral percentages per tier
- Circle size limits per tier
- Contribution ceilings per tier
- MoiScore tier thresholds
- Platform fee
- Proposal deposit amount
- Voting period length
- Timelock duration
- Quorum percentage
- Pass threshold percentage

### Acceptance Criteria
- [ ] Governance contract compiles for wasm32v1-none
- [ ] create_proposal works with valid deposit
- [ ] cast_vote records vote with correct power
- [ ] execute_proposal calls target contract with correct args
- [ ] Quorum check: proposal fails if < 20% supply votes
- [ ] Pass threshold: proposal fails if < 50% For votes
- [ ] Timelock enforced: cannot execute before timelock expires
- [ ] Deposit returned on successful execution
- [ ] All 10+ tests pass
- [ ] No .unwrap() calls

---

## PHASE 9 — Frontend: Governance UI

### What It Does
Builds the governance voting interface in the frontend. This includes the tier progression card, proposal creation form, voting page, and governance dashboard.

### 9.1 — Tier Progression Card
```
File: src/components/reputation/tier-card.tsx (NEW)

Shows at the top of /reputation page:
  - Current MoiScore (large gradient text)
  - Tier badge (Bronze/Silver/Gold/Platinum/Diamond) with glow
  - Progress bar to next tier
  - "Points to next tier: XX"
  - Unlocked benefits list (what this tier gives you)
  - Locked benefits list (what the next tier unlocks)
```

### 9.2 — Governance Pages
```
File: src/app/(dashboard)/governance/page.tsx (NEW)
  - List of active proposals
  - Filter: Active / Passed / Failed / Executed
  - Each proposal card: title, proposer, status, votes for/against, time remaining

File: src/app/(dashboard)/governance/[id]/page.tsx (NEW)
  - Proposal detail: description, action encoded, vote counts
  - Vote button: For / Against / Abstain
  - Vote power display: "Your votes: XX (X MOI + X delegated)"
  - Results bar chart after voting ends
  - Execute button (visible after timelock, only if passed)

File: src/app/(dashboard)/governance/create/page.tsx (NEW)
  - Proposal creation form:
    - Title (text)
    - Description (textarea, IPFS upload optional)
    - Target contract (select from deployed contracts)
    - Method to call (select)
    - Arguments (dynamic form based on method)
    - Deposit amount displayed ("You will stake XX MOI")
    - Submit button
```

### 9.3 — The Upward Spiral (reputation page update)
```
File: src/app/(dashboard)/reputation/page.tsx (MODIFY)
  - Replace basic score display with TierCard
  - Add "Your Circle History" section:
    - Circles completed
    - Current streak
    - Total contributed
    - Average contribution size
  - Add "Next Benefits" teaser card
```

### Acceptance Criteria
- [ ] TierCard renders on reputation page
- [ ] Governance pages accessible at /governance, /governance/[id], /governance/create
- [ ] Proposal list shows active/passed/failed/executed
- [ ] Voting UI shows vote power correctly
- [ ] Create proposal form validates deposit amount
- [ ] All pages responsive (mobile-first)
- [ ] TypeScript: 0 errors
- [ ] All existing tests still pass

---

## PHASE 10 — Integration Tests + Gas Profiling

### What It Does
Writes comprehensive tests that exercise the FULL governance + reputation loop end-to-end. Also profiles gas usage for all new contract operations.

### 10.1 — Backend Integration Tests
```
File: moistello-backend/tests/integration/governance_test.go

Tests:
  - TestGovernance_CreateProposal
  - TestGovernance_CastVote
  - TestGovernance_ExecuteProposal  
  - TestGovernance_QuorumCheck
  - TestGovernance_TimelockEnforcement
  - TestGovernance_DepositRefund
  - TestReputation_TierBasedCollateral
  - TestReputation_ScoreProgression
  - TestReputation_CircleSizeEnforcement
  - TestFullCircleLifecycle_WithReputation
```

### 10.2 — Contract Gas Profiling
```
For each new contract function, profile gas usage:
  - calculate_collateral: < 10,000 gas
  - max_circle_size: < 10,000 gas
  - record_on_time_payment: < 50,000 gas
  - create_proposal: < 200,000 gas
  - cast_vote: < 100,000 gas
  - execute_proposal: < 500,000 gas

If any function exceeds budget: document WHY, propose optimization.
```

### Acceptance Criteria
- [ ] 10+ new integration tests pass
- [ ] All governance operations gas-profiled
- [ ] Gas budgets documented per function
- [ ] Existing 143 backend tests still pass

---

## PHASE 11 — Security Audit + Production Readiness

### What It Does
Final security sweep and production readiness certification for all new governance + reputation features.

### 11.1 — Contract Security Checklist
- [ ] No .unwrap() in any new code
- [ ] All mutating functions have access control (admin/organizer/member)
- [ ] ReentrancyGuard on all governance functions
- [ ] Proposal timelock cannot be bypassed
- [ ] Vote snapshotted at proposal creation (prevents flash loan attacks)
- [ ] Deposit returned only on successful execution
- [ ] Integer overflow protection on all score/amount calculations

### 11.2 — Governance Attack Vectors Tested
- [ ] Whale domination: single holder with 51% MOI cannot pass proposal without quorum
- [ ] Flash loan: voting power at proposal creation time, not vote time
- [ ] Timelock bypass: cannot execute before timelock expires
- [ ] Double voting: same voter cannot vote twice on same proposal
- [ ] Deposit theft: failed proposals should NOT return deposit

### 11.3 — Production Readiness
- [ ] All feature flags documented
- [ ] Rollback plan tested (flags off → old behavior)
- [ ] Monitoring metrics added for governance events
- [ ] Alert thresholds configured (unusual proposal activity)
- [ ] Audit trail for all governance actions

### Acceptance Criteria
- [ ] All 11 security checkboxes verified
- [ ] All 5 governance attack vectors tested and mitigated
- [ ] Feature flag rollback tested (< 5 minutes)
- [ ] Documentation updated with deployment instructions

---

## IMPLEMENTATION ORDER

```
Wave 1 (Parallel — 3 agents):
  Phase 1: Leftover Freighter cleanup
  Phase 2: Feature flags
  Phase 3: WalletConnect Project ID

Wave 2 (Parallel — 2 agents, after Wave 1):
  Phase 4: Wallet Settings Page
  Phase 5: Ledger Transport Abstraction

Wave 3 (Sequential contracts — 1-2 agents):
  Phase 6: Scoring Upgrade → Phase 7: Circle Integration → Phase 8: Governance Contract

Wave 4 (Parallel — 2 agents, after Wave 3):
  Phase 9: Frontend Governance UI (starts once Phase 6 API is locked)
  Phase 10: Integration Tests (starts once Phase 7 is complete)

Wave 5 (Final — 1 agent):
  Phase 11: Security Audit + Production Readiness
```

## ESTIMATED TIME

| Wave | Phases | Estimated Time | Agent Count |
|---|---|---|---|
| 1 | 1, 2, 3 | 1-2 hours | 3 parallel |
| 2 | 4, 5 | 1-2 hours | 2 parallel |
| 3 | 6, 7, 8 | 3-4 hours | 1-2 sequential |
| 4 | 9, 10 | 2-3 hours | 2 parallel |
| 5 | 11 | 1 hour | 1 agent |
| **Total** | | **8-12 hours** | |
