# Gym User mobile implementation

Updated: 2026-09-24. Continued from the existing backend changes and the supplied implementation plan.

## Implemented

| Area | Result |
| --- | --- |
| Login/session | Remembered login uses SecureStore on native and sessionStorage on web. Logout clears storage; API 401 clears an expired session. Authenticated routes are protected. |
| Home/plans | Working shortcuts, start selected workout day, and resume an unfinished workout from Home. |
| Exercise library | Separate `/exercises` route, search, muscle filters, exercise detail, available video/image, actual PR and stored instructions. |
| Templates | Level filters, day/exercise detail, confirmation before applying. Other users' private plans cannot be applied. Legacy unscheduled days use day order without modifying shared templates. |
| Custom plans | Name, description, level, weeks, weekdays, exercises, sets/reps/rest. Creation and activation are one transaction; creator comes from the authenticated profile and `isTemplate` is always false. |
| Active workout | Previous performance, immediate set saves/edits/deletes, added sets, exercise completion, elapsed time, volume, fixed rest timer, navigation, completion/cancellation and resume. Only confirmed inputs are saved. |
| History/progress | Week/month/all filters, actual set detail, totals and PR. `PR MỚI` uses the first date the current maximum was attained, not a later tied performance. |
| Profile | Existing profile/body metric editing retained, with a working change-password form. |
| Backend/database | Twelve workout procedures installed on local MySQL, without changing tables/columns. Mobile mutations check nested ownership and session state and serialize concurrent writes per profile. |

## Verification commands

Verified in this workspace: 29 backend tests passed with MySQL integration enabled; TypeScript reported no errors; Expo exported web, Android and iOS bundles; the browser flow passed at 390 × 844, including custom-plan creation, saved-set recovery after reload, password change and logout. `git diff --check` passed using the repository's line-ending configuration.

Backend, from `App/BE_GymPlan` in PowerShell:

```powershell
npm.cmd test
# Include the MySQL integration test; it creates and removes its own fixtures:
$env:GYM_DB_TESTS = '1'
npm.cmd test
# Install/reinstall the procedures into the database configured by .env:
npm.cmd run db:workout-flow
```

The database test covers atomic plan creation/rollback, ownership, invalid inputs, concurrent starts, duplicate set retries, saved-session recovery, completion retries, history/volume/PR, template application, cancellation, and password validation. Without `GYM_DB_TESTS=1`, the database test is skipped.

Frontend, from `App/FE_GymPlan/Client_GymUser/GymPlan`:

```powershell
npm.cmd run typecheck
npx.cmd expo export --platform all --output-dir dist
```

After adding routes to a fresh checkout, start Expo once to generate `.expo/types/router.d.ts` before checking types.

Browser smoke test uses an Expo web server on port 8082, Playwright and Microsoft Edge:

```powershell
# Frontend terminal:
npx.cmd expo start --web --port 8082
# Backend terminal; use the path to an installed Playwright package:
$env:PLAYWRIGHT_MODULE = '<path-to-playwright-package>'
npm.cmd run test:ui
```

The test runs its own backend on an ephemeral local port, redirects frontend requests targeting localhost:3000 to it, and cleans up its test account and records. `GYM_WEB_URL` overrides the web URL. Screenshots are stored in the frontend's ignored `.expo/verification` directory.

## Remaining visual/device verification

- The nine reference images mentioned by the plan are absent from this workspace. New screens follow the existing dark/green design; exact visual matching remains unverified.
- Exercise records contain free-text descriptions and media, with no separate four-step instruction, common-mistake, or RPE fields. Detail screens show the supplied content and do not invent exercise-specific guidance or video resolution claims.
- Browser verification and native bundle export do not replace testing video playback, SecureStore and keyboard/safe-area behavior on physical Android/iOS devices.
- Authentication continues to use the project's existing login/password procedures; this change does not migrate their password storage format.
