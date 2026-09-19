# Structure

The project is intentionally client-only.

- `client/src/App.tsx`: game data, deterministic seeded market generation, CPU selection logic, evaluation math, round state machine, and UI composition.
- `client/src/index.css`: visual system, responsive layout, motion, typography, and local-storage-free styling.
- `client/index.html`: Portuguese document metadata and title.
- `client/public/`: only scaffold configuration files; no media assets are committed there.
- `/manus-storage/prompt-auction-orbit_ecdf95fd.png`: generated orbital background asset.
- `/manus-storage/prompt-auction-mark_fe17135f.png`: generated prompt-auction emblem.

The React layer owns the game state because this is a 2D UI-first game; no canvas engine is necessary. All gameplay logic is pure TypeScript functions and can be extracted later without changing the rules.
