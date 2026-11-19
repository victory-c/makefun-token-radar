# makefun-token-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/victory-c/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/victory-c/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Harbor is an offline token research desk: a reproducible, peer-calibrated valuation model, a sortable research board, and cautious category/network-aware participation plans. No wallet connection, external assets, analytics, transaction execution or paid services.

## Run it

```sh
# Node 22.18+; no install or build step.
node main.ts --input /path/to/token-radar-01-kit/input/snapshot.json --output ./out
# Open out/dashboard/index.html directly, or serve it locally:
python3 -m http.server 8080 --directory out
# Visit http://localhost:8080/dashboard/
```

Without flags, the grader reads `/input/snapshot.json` and writes `/output`.
`MAKEFUN_OUTPUT_DIR` is also supported. The generated `data.js` stays beside
`dashboard/`, so the same static output works over HTTP or directly from disk.
`--preview` skips dossier assembly for first-time browser capture only; ordinary
and graded runs always build the canonical dossier.

## What Harbor does

- Covers every required watchlist protocol, then goes beyond the floor: the kit's
  frozen snapshot yields 200 ranked candidates, 40 required watchlist records,
  416 token-recorded protocols shown separately and 142 related-product records
  conservatively set aside. These counts are computed, not hardcoded selectors.
- Estimates a conditional token-equity proxy from TVL × a shrunk category peer
  multiple × bounded seven-day momentum × tracking maturity. All four terms,
  actual peer counts and a scenario stress test are visible in every detail page.
- Uses the snapshot's own recorded market-cap/TVL ratios for calibration, not a
  handwritten list of favored protocol names. Missing data remains explicit.
- Filters by search, category, chain, positive growth, sub-$50M TVL and required
  watchlist; sorts by name, value, TVL, growth or tracking age; paginates all rows.
- Provides six-step research plans with a $0 observation path, optional principal
  and estimated fee caps, weekly time budget, access verification and exit risks.
  Institutional and restricted categories default to checking access first;
  derivatives default to read-only/paper research, not real positions.
- Saves local research/checklists, compares up to three candidates, exports the
  filtered board to CSV and exports individual plans as text. `/` focuses search;
  Escape returns from a protocol brief. CSV cells guard formula injection.
- Supports small screens and keyboard navigation, and respects reduced motion.

## Important limitations

“No token recorded” is a statement about DefiLlama fields, not a token-existence
audit or a prediction. Implied value is neither FDV nor an allocation estimate.
Tracking age is not time without a token. The sensitivity bands are heuristic
stress ranges, not statistical confidence intervals. TVL can double-count capital.
No current URLs, audits, incentive programs, token rights or eligibility terms are
available in the snapshot. Plans are conditional category/network guidance, not
verified live app instructions. Do not spend money because a dashboard suggests a
possible airdrop. Harbor executes no financial action.

The full formula, candidate selection, missing-data treatment and sector
limitations are available in the dashboard's Methodology page and `lib/model.ts`.
Screenshots are real Chromium captures of generated output, not mockups.

## Verification

```sh
RADAR_SNAPSHOT=/path/to/kit/input/snapshot.json node --test tests/model.test.ts
RADAR_SNAPSHOT=/path/to/kit/input/snapshot.json RADAR_OUTPUT=out node --test tests/artifact.test.ts
# Browser checks need the development-only Playwright package, outside runtime:
NODE_PATH=/path/to/playwright/node_modules node tests/browser.cjs /absolute/path/to/out
# Optional axe-core audit (Playwright + axe-core in that development directory):
NODE_PATH=/path/to/dev/node_modules node tests/audit.cjs /absolute/path/to/out
# From the kit directory:
node cli/makefun.mjs check --kit . --repo /absolute/path/to/makefun-token-radar
```

The entry runtime uses only Node's standard library. The exact kit library is
vendored unchanged at `vendor/makefun-board.ts` solely to assemble the required
canonical dossier. All entry model, dashboard, entrypoint and tests are original.
The output includes `board.json`, `data.js`, `dashboard/`, three real screenshots
and `dossier.json`. Source license: MIT (SPDX identifier in LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=dsps50bd&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
