# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/derwinblue/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/derwinblue/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: it reads a sealed DefiLlama snapshot of 758 protocols, ranks the 198
pre-token protocols it can rank by an implied value, and shows a reader how to farm each one.
The board covers all 40 protocols on the snapshot's watchlist, plus 158 more below the floor.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

`main.ts` (Node 22, standard library only) reads the snapshot, writes the ranked board to
`board.json`, the dashboard's data to `data.js`, copies `dashboard/` and `screenshots/` into the
output, and writes `dossier.json` with the vendored make.fun library. Open `out/dashboard/`
in a browser; no network is needed.

## The model (radar-2)

```
implied = round( tvl_usd x 0.30
               x (1 + clamp(change_7d, -50, 100) / 100 x 0.6)
               x (0.70 + 0.30 x min(age_days, 1095) / 1095)
               x (1 + 0.03 x min(chains - 1, 4)) )
```

- **Base (TVL x 0.30).** What comparable DeFi tokens trade at, in fully-diluted terms,
  against the TVL they secure: roughly 0.2–0.5x. A stated assumption, not a fact.
- **Growth.** Seven-day TVL momentum, clamped to -50%..+100% because a week is noisy: the
  snapshot's own 7d moves run from -100% to +1200%. The clamp keeps one wild week from
  deciding a rank.
- **Maturity.** A protocol that ran for years with no token has more pent-up launch value
  than one listed last month. Age is the time since DefiLlama first listed it; an unlisted
  age uses 365 days. The factor runs 0.70 (new) to 1.00 (3 years or older).
- **Breadth.** Each extra chain up to four adds 3%: more chains, more users the token
  would reach.

No protocol name is ever special-cased: the same function scores every row, and the
dashboard recomputes each row from the same figures, so the page and `board.json` agree.
The dashboard's model sandbox lets a reader move the constants and watch the board
re-rank; the board itself always uses the defaults above.

## Who is ranked

A protocol is rankable when it records no token (no market cap, no CoinGecko id, no
symbol) and is not a wrapped, staked or bridged product, not an exchange and not a
versioned pool — the watchlist's own rule, as far as the snapshot's ten fields allow.
The one part it cannot repeat is DefiLlama's `parentProtocol`, which is not among the
snapshot's fields. Protocols whose token already trades are set aside in the Live token
view with their market caps, never mixed into the ranking. Every row carries a six-step
farm plan derived from its category, chains, TVL and age, each step with a cost and a
time.

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
