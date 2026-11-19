# Verification record

Harbor was built and exercised against the supplied frozen token-radar-01 snapshot.
The runtime is standard-library-only Node 22. The local output can be opened
straight from disk at `out/dashboard/index.html` after running `main.ts`.

## Executed checks

- 26 Node tests passed, 0 failed, 0 skipped: 18 model tests and 8 local artifact
  contract tests. These check coverage, membership, rank order, farm-step lengths,
  missing inputs, extreme growth, tracking dates, peer bounds, category plan
  branches, proposed-network/fee consistency, offline assets, screenshot caps,
  source limits and exact canonical dossier bytes.
- 25 real Chromium browser checks passed with no page exceptions and no HTTP(S)
  requests from the dashboard. They exercise search, combined filters, sorting,
  pagination, downloads, saves, checklists, scenarios, comparison, reloads,
  keyboard focus, malformed storage, all 200 desktop detail routes and all 200
  mobile detail routes. Mobile pages stayed within the 390px document viewport;
  the board's table has its own horizontal scrolling container.
- axe-core audits found zero violations for the selected WCAG 2 A/AA and 2.1 A/AA
  rules across board, Symbiotic detail, methodology and token-recorded views at
  both 1440px and 390px widths (8 audited states). This is an automated audit, not
  a claim of complete WCAG conformance.
- A hostile protocol-name/category payload rendered as text, not executable HTML.
- Two ordinary generation runs, one using `--output` and one using
  `MAKEFUN_OUTPUT_DIR`, produced byte-identical trees of 9 output files.
- All 40 required watchlist records are covered. The board contains 200 candidates;
  416 token-recorded records are separate and 142 related-product records are
  conservatively set aside.

## Captures and dossier

The three screenshots are real Chromium PNG captures of the generated dashboard:

| File | Pixels | Bytes |
| --- | --- | --- |
| screenshots/1-board.png | 1440 × 1200 | 225116 |
| screenshots/2-detail.png | 1440 × 1400 | 269641 |
| screenshots/3-filtered.png | 1440 × 1200 | 219340 |

The detail view is Symbiotic; the filtered board selects Risk Curators. Screens
use the exact rows written to board.json, verified row-for-row. Layout was
inspected through browser geometry, overflow tests and accessibility audits.
This session has no image-viewing tool, so no subjective image review is claimed.

Dashboard source: 56073 bytes, fully present in the dossier text.
Canonical dossier: 1009818 bytes, under the competition's 1.5 MiB cap.
Dossier SHA-256: `82c88f5a173e296f2dc155757e2c8aa4b2a56f52522a12e07b0e48f7aa0df221`.
The exact kit dossier library is vendored unchanged as required.

## Site check and handoff boundary

The kit's pre-submit `check` was run. Repository size, competition opening,
SPDX MIT license and root main.ts pass. With no transcripts argument, this kit
reports `transcripts_present` as a failure and skips the dependent transcript
checks. Its RULES.txt explicitly says there is no local server grade for this
competition; these artifact tests are not the sealed scorer or a judge rating.

The session's instructions reserve recording finalization, transcript bundling
and submission for the external wrapper after the agent exits. No register,
login, bundle or submit command was run here. The wrapper must attach the complete
recorded session, rerun the transcript checks and submit the pushed final commit.
Server-only repository/account checks and competitive judge performance remain
unverified until that submission. No funds were moved or paid services invoked.
