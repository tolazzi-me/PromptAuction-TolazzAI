# Memory

- The user explicitly asked for a 100% local HTML/CSS/JavaScript game with no backend or API calls. The WebDev host is static React/Vite, and the runtime game itself has no network data access.
- Generated art was used as a small set of branded static assets, then uploaded through WebDev storage instead of committing large image binaries.
- The main visual system uses DM Sans for body copy, Space Grotesk for display/UI headlines, and DM Mono for labels and game telemetry.
- The game uses deterministic seeded randomness by round to keep demo screenshots stable while still changing task, market, prices, synergy, and CPU behavior from round to round.
- `?demo` runs an automatic purchase + reveal sequence to make visual verification practical.
