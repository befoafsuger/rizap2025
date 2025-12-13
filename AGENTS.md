# Repository Guidelines

## Project Structure & Module Organization

- `backend/`: Hono-based AWS Lambda handler in TypeScript. Primary entry at `backend/src/index.ts`; build artifacts land in `backend/dist`.
- `frontend/`: Expo Router app. Screens live under `frontend/app/` (e.g., `frontend/app/(tabs)/_layout.tsx`), shared UI in `frontend/components/` and `frontend/components/ui/`, assets in `frontend/assets/images/`, and utilities/hooks in `frontend/hooks/` and `frontend/constants/`.
- Use feature-focused folders; keep shared primitives in `components/ui` and avoid duplicating styling logic across screens.

## Build, Test, and Development Commands

- Backend: from `backend/`, `npm install` then `npm run build` (esbuild bundle to `dist/index.js`). `npm run lint` for ESLint. `npm run deploy` runs build → zip → AWS Lambda update (`aws` CLI must be configured).
- Frontend: from `frontend/`, `npm install` then `npm run start` (Expo dev server), or platform targets via `npm run ios` / `npm run android` / `npm run web`. `npm run lint` uses Expo’s ESLint preset. `npm run reset-project` wipes starter code—use cautiously.

## Coding Style & Naming Conventions

- TypeScript first; prefer explicit return types on exported functions and components.
- 2-space indentation, single quotes, and trailing commas per ESLint/Prettier defaults (match existing files).
- React components: PascalCase filenames (`HelloWave.tsx`), hooks start with `use...`, and route files follow Expo Router patterns (`app/modal.tsx`).
- Keep handlers pure; isolate side effects (network, storage) in small utilities under `hooks/` or `constants/` when possible.

## Testing Guidelines

- No automated tests are present yet; add Jest/Expo Testing Library (frontend) or lightweight integration tests (backend) as you extend features.
- Name specs `*.test.ts` / `*.test.tsx` near the code or under `__tests__/`. Include at least one render/assert path for new UI and one success/error path for new backend endpoints.
- Run linting before opening a PR; treat lint clean as a gate until tests exist.

## Commit & Pull Request Guidelines

- Use short, imperative commit messages with scope hints when helpful (e.g., `frontend: add haptic tab`, `backend: tighten hello handler`). Keep related changes in a single commit.
- PRs should include: concise summary, linked issue/ticket, test or lint command results, and screenshots/video for UI changes (mobile + web when relevant).
- Keep PRs small and focused; prefer follow-up PRs over mixing unrelated refactors.

## Environment & Security Notes

- Node 20+ recommended for backend (esbuild targets `node20`); align local runtime with Lambda. Expo SDK 54 is in use; match the documented Node/Java versions for native tooling.
- Do not commit secrets or AWS credentials. Use local env/config files and verify `.gitignore` coverage before pushing.
