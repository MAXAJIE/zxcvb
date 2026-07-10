# Routing conventions

- `__root.tsx` — shell, providers, meta
- `index.tsx` — public landing
- `auth.tsx` — sign in / sign up
- `_authenticated/route.tsx` — client-only auth gate (ssr:false) + AppShell
- `_authenticated/map.tsx` — home: SVG museum map + zone lists
- `_authenticated/artifact.$id.tsx` — QR target: artifact detail + Claim EXP button (quiz removed per scope)
- `_authenticated/quests.tsx` — 4 category quests + 1 grand quest
- `_authenticated/badges.tsx` — badge case
- `_authenticated/rewards.tsx` — points balance + souvenir redemption
- `_authenticated/journal.tsx` — end-of-visit recap
