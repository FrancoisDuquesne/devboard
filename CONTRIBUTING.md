# Contributing to DevBoard

Thanks for considering a contribution! This guide covers the essentials.

## Prerequisites

- **Node 22** (see `.nvmrc`)
- **npm** (ships with Node)

## Development Setup

```bash
npm install          # install dependencies
npm run dev          # start the dev server
npm run demo         # start with mock data (no provider connection needed)
```

Copy `.env.example` to `.env` and fill in your GitLab/GitHub tokens if you need live data.

## Code Style

[Biome](https://biomejs.dev/) handles both formatting and linting. There is no separate Prettier or ESLint config.

```bash
npm run lint         # check for issues
npm run lint:fix     # auto-fix issues
npm run format       # format with Biome
npm run build        # verify production build passes
```

Key rules enforced by the project:

- **No arbitrary Tailwind values** -- use standard utilities only (no `text-[9px]`).
- **No `console.log`** -- use `console.warn` or `console.error`.
- 2-space indent, 88-character line width, LF line endings.

A Husky pre-commit hook runs `npm run lint` automatically on every commit.

## Testing

```bash
npm run test         # run unit tests (Vitest)
npm run test:watch   # run in watch mode
```

Please add or update tests when introducing new features or fixing bugs. Tests live in `tests/unit/` and follow the existing structure (composables, server utils, frontend utils).

## Pull Request Process

1. **Branch naming**: `<issue-number>-short-description` (e.g. `14-add-contributing-docs`).
2. **Commit messages**: use [Conventional Commits](https://www.conventionalcommits.org/) -- `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, etc.
3. **CI must pass**: linting and tests are checked automatically.
4. Keep PRs focused. One logical change per PR is ideal.

## Provider Parity

DevBoard supports both GitLab and GitHub through a shared abstraction layer. When you add or change a feature on one provider, you **must** mirror the change on the other. See [`PROVIDER_PARITY.md`](PROVIDER_PARITY.md) for the full contract and checklist.

## Questions?

Open an issue on GitHub -- there are no dumb questions.
