# Prompt Auction — TolazzAI

## Product direction
A local-only browser game that teaches prompt engineering through a competitive auction. The visual direction is a dark orbital prompt lab: cobalt and warm orange accents, translucent panels, and editorial typography.

## Gameplay plan

- Five-round match, first to three round wins.
- Each round randomizes the task, six-card market, fluctuating card prices, hidden synergy, and CPU personality.
- Player starts with 25 coins. Remaining coins plus 10 refill into the next round, capped at 35.
- Card values remain hidden during the auction. Final quality is base quality + task focus bonus + secret synergy bonus.
- Winner is determined by efficiency: quality divided by coins spent.
- CPU personalities: economic, strategist, and chaotic.
- `?demo` automatically makes a deterministic, visible round decision for screenshot verification.

## Risk slices

1. **State model**: round transitions, score, wallets, selected cards, and result reveal must not desynchronize.
2. **Efficiency math**: score must be calculated from card quality, visible price, task focus, and hidden synergy.
3. **Reveal flow**: the auction must hide values and the result must explain both sides.
4. **Responsive layout**: market cards and reveal panels must remain usable at narrow widths.
5. **Local-only constraint**: no backend, API calls, auth, or runtime data fetches.

## Verification criteria

- A user can buy affordable market cards, see their wallet change, stop, and reveal results.
- CPU personality, selected cards, costs, quality, efficiency, and secret synergy are visible after reveal.
- Scores and wallets advance correctly to the next round.
- Gameover appears after five rounds or when a player reaches three wins.
- `pnpm check` and `pnpm build` pass.
- Desktop and mobile screenshots show a cohesive, readable game board.
