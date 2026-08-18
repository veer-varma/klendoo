# @klendoo/trust-graph

Agent 4 — Trust/Confidence engine. Per the Trust Graph Spec §3: a package,
not a deployed microservice — services call this in-process. This is also
explicitly an **internal, non-MCP surface**: trust-graph reads/writes never
get exposed on the Claude-facing MCP server, on purpose — "putting
confidence-scoring internals on the public MCP server would leak
trust-scoring machinery to anyone who's connected Klendoo's MCP."

## What's real in this slice

- `TrustEdge` — the schema, matching the spec's §1 exactly (one relational
  table with an `edgeType` discriminator, not a graph database, not three
  tables per layer).
- `recordEdgeUsage()` — wired into the Reminder and Negotiation agents.
  Every real reminder sent and every poll that finalizes with confirmed
  attendees writes/increments a `TrustEdge`, best-effort (a trust-write
  failure never blocks the actual user-facing action — see the try/catch
  around each call site).
- `computeConfidence()` — the spec's weighted formula, copied exactly:
  `0.4×repeat_usage + 0.3×calendar_conflict + 0.2×response_reliability + 0.1×recency`.
- `classifyConfidence()` — the 0.8/0.5 auto/confirm/manual bands, read from
  `PlatformSetting` (same pattern as action pricing) so they're actually
  changeable when validation happens, not another hardcoded constant.

## What's honestly not real yet

- **Nothing calls `classifyConfidence()` to gate agent behavior.** Reminder
  always sends; Negotiation's poll always runs its full majority-vote
  process regardless of any edge's score. The spec is explicit that these
  thresholds are "an assumption, not a decided policy... recommend
  validating against real Agent 1 approval data" before anything downstream
  depends on them — there isn't real usage data yet to validate against,
  so nothing depends on them yet. Wiring an actual auto-act decision point
  (e.g. skip the poll for a high-confidence repeat invitee) is real product
  design work for whoever's ready to make that call, not something to
  fabricate here.
- **Two of the four confidence factors have no real signal source.**
  `calendarConflictCertainty` needs live calendar data — Google Calendar
  integration is explicitly deferred post-launch (see `BACKLOG.md`).
  `responseReliability` needs Layer 2 relationship tracking that doesn't
  exist. Both default to a neutral `0.5` until real sources exist — see
  `computeConfidence.ts`'s doc comments on `ConfidenceFactors`. The other
  two (`repeatUsageFactor`, `recencyFactor`) *are* derivable from real
  `TrustEdge.usageCount`/`lastUsedAt` today (`deriveRepeatUsageFactor`,
  `deriveRecencyFactor`), since those actually have data behind them now.
- **The saturation curve and decay window are this codebase's own
  starting heuristics**, not something the spec pins down (5 uses to
  saturate repeat-usage, 90-day linear decay for recency) — reasonable
  guesses, not validated against anything.

## fromId/toId are plain strings, not foreign keys

Matches the spec directly ("the trusted party: client email or User.id")
and matches every other identity field in this schema still being plain
strings until `HostAccount` gets connected to the agents (tracked in
`BACKLOG.md`) — `fromId` is currently a host's email, not a `HostAccount.id`.
