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

## The model (radar-3)

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

## Confidence in a rank

Every row also carries a confidence score from 0 to 100, with a band — High (75 and up),
Medium (55–74) or Low (below 55) — and the reasons that moved it most. The score is a
second opinion on the implied value, not a second ranking: it never changes a row's place
on the board, it says how far to trust the number.

It is built from what the snapshot actually records for that protocol: whether a seven-day
move and a listing date are on file, whether a category is named, how many chains it runs
on, how large its TVL is, and how long it has been tracked. A complete record with a long
track record and a steady weekly move scores high; a thin record, a very recent listing,
or a weekly move so extreme it looks like a data quirk scores low. No row can reach 100:
the top of the scale is deliberately out of reach, because an implied value is an
estimate and the score should never pretend otherwise.

The board shows the score and band on every row, the column sorts by it, and the detail
drawer for each protocol names the reasons, so a reader can see exactly what earned or
cost the points. The drawer also shows the full breakdown:

| What it is for | Points |
| --- | --- |
| Being on the board at all: the snapshot vouches for its own record | 30 |
| A seven-day move on record | 12 |
| A listing date on file | 10 |
| Tracked for more than two years | 12 |
| A named category | 8 |
| Live on four or more chains | 8 |
| More than $1B of TVL | 10 |
| A weekly move wilder than +300% or below -80% | -12 |

Smaller totals earn fewer points on the same scale, and a missing field earns none at all.

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
