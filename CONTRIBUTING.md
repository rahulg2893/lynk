# Contributing

How to work on Lynk: set up, check your work, commit, and keep the docs current.

## Set up

```bash
cd apps/web && npm install && npm run dev          # http://localhost:3000
cd apps/mobile && npm install && npx expo run:ios  # or run:android
```

Sign in with **+91 98765 43210** and any 6 digits. The phone app needs Xcode or Android Studio; see [`apps/mobile/README.md`](apps/mobile/README.md) for its build fixes.

## Before you commit

Run these in each app you changed:

| Check | Web (`apps/web`) | Phone (`apps/mobile`) |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | `npx tsc --noEmit` |
| Lint | `npm run lint` | `npx expo lint` |
| Build or UI test | `npm run build` | `maestro test .maestro/smoke.yaml` |

If you change anything in `apps/web/src/lib`, check both apps: the phone app imports those files.

## Rules of the codebase

- **Shared logic stays portable.** Files the phone app imports through `@shared/*` must not use DOM, React Native or storage APIs. See [Architecture › The shared logic layer](docs/ARCHITECTURE.md#the-shared-logic-layer).
- **Never edit `apps/mobile/ios` or `apps/mobile/android` by hand.** They are generated. Change `app.json` or add a config plugin in `apps/mobile/plugins`.
- **Follow the design system** in [`design-system/lynk/MASTER.md`](design-system/lynk/MASTER.md): one blue accent, Apple greys, the platform font.
- **Suggestions, never automatic actions.** Anything Lynk spots is saved only when someone taps Save.
- **Nothing readable leaves the device.** New features that read messages run on the device.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org) with a short imperative subject and a body that says why.

- **Scopes:** `web`, `mobile`, `roadmap`, or a feature scope such as `auth` or `chat` when a change spans both apps.
- **One kind per commit.** A bug fix found along the way gets its own `fix` commit. Docs and roadmap updates get their own `docs` commits.

Examples: `feat(chat): pin an Up next bar with saved plans, to-dos and lists`, `fix(web): encrypt chats at rest in the browser`, `docs(roadmap): update to v5.2 …`.

## Keep the docs current

Update the docs in the same piece of work as the change, in a separate `docs` commit.

| When you change… | Update |
| --- | --- |
| How the code is organised: new routes, stores, shared modules, storage, native setup, data flow | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and its "Last updated" line |
| A product or technical direction, or you reverse an earlier one | [`docs/DECISIONS.md`](docs/DECISIONS.md): add an entry, or mark the old one Superseded |
| What's done, what's next, phases, risks | [`roadmap.html`](roadmap.html): bump the version in the header and footer |
| How to run, test or sign in; what the app does | [`README.md`](README.md) and, for the phone app, [`apps/mobile/README.md`](apps/mobile/README.md) |
| This workflow | This file |
