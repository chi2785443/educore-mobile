# Cakale EDU Mobile — React Native (Expo)

- **Framework:** Expo SDK 54 + Expo Router 6 | **Runtime:** React Native 0.81
- **Dev:** `pnpm start` | **Package manager:** pnpm | **New Architecture:** enabled

---

## Styling

- **NativeWind v4** — use `className` always. `style={{}}` only for dynamic values (colors, calculated dims).
- **SVG logos:** `expo-image` with `require('@/assets/images/cakale_edu_*.svg')` — never RN `<Image>` for SVGs
- **Icons:** `Ionicons` from `@expo/vector-icons`
- **Pressable:** never set `backgroundColor` in callback style — put it on an inner `View`; callback for opacity/transform only
- **Color palette:** primary `#4C3FC4`, accent `#F5486A`, pastels: `#F0EEFF` / `#FFF0F0` / `#E8F5EE` / `#E8F4FF`
- **Screen headers:** `#4C3FC4` bg + `borderBottomLeftRadius: 28, borderBottomRightRadius: 28` — color varies by module/role
- **Phone fields:** always `PhoneInput` from `@/components/ui/PhoneInput` — never plain `TextInput`

---

## State & Data

- **Server state:** TanStack React Query v5
- **Global state:** Zustand v5 — persisted via AsyncStorage. Stores `user`, `isAuthenticated`, `selectedSchoolId`, `hasOnboarded`
- **Tokens:** `expo-secure-store` (keys: `cakale_edu_access_token`, `cakale_edu_refresh_token`)
- **HTTP:** Axios (`services/axios.service.ts`) — Bearer token, auto-refresh on 401, all errors → `new Error(message)`
- **Forms:** React Hook Form v7 + Zod v4

---

## Navigation

- **5 tabs:** Home (`index`) · Features (`features/`) · Action (FAB, `href: null`) · Chat (`chat/`) · Account (`account/`)
- `router.replace()` for auth transitions; `router.back()` for in-flow back

---

## Role-Based Dashboard

- `isAdmin → MobileAdminDashboard` · `isStaff → MobileStaffDashboard` · `isStudent → MobileStudentDashboard` · `isParent → MobileParentDashboard` · no school → `NoSchoolState`
- Shared primitives: `DashboardPrimitives.tsx` — `GradCard`, `Card`, `SectionLabel`, `DashLoader`
- No charts on mobile — stat counts only

---

## School Settings (non-obvious)

- Auth store school object can be stale — use `useSchoolById(schoolId)` for fresh `currentTerm`/`currentSession`
- Allowed assessment types: `useGradeConfigs(schoolId)` → `gradeConfigs[0].enabledAssessmentTypes`
- `academicYear` and `term` are never typed by users — always auto-injected from school data

---

## Modals — Critical

- **Never render a `Modal` outside another open `Modal`** — it is invisible behind the parent
- Always nest sub-pickers (date, time, member, subject) inside the parent `Modal`'s `SafeAreaView`

---

## Tab Navigation — Standard

- **Always use `ClassroomDetailTabs`** (`components/classroom/ClassroomDetailTabs.tsx`) for any page-level tab or filter bar — never custom pill buttons, horizontal-scroll chip rows, or inline segment controls.
- Props: `tabs: { key: T; label: string }[]`, `activeTab: T`, `onTabChange: (tab: T) => void`, `accentColor?: string` (defaults to `#6366f1`).
- The underline style is the app-wide standard: white background, colored underline on active tab, gray inactive text. `ClassroomDetailTabs` uses a `ScrollView` internally so it handles any number of tabs.
- **Exception:** segmented controls embedded inside a dark-background header (e.g. the staff "Browse / Applied / Interviews" tabs on `STAFF_BG`) can keep their own style since `ClassroomDetailTabs` requires a white background.
- Count badges / extra info: append to the label string — e.g. `` `Jobs (${n})` `` — rather than a separate badge view.
- If tab state is `boolean | null`, convert to a string union (`'all' | 'present' | 'absent'`) and map to the boolean in filter logic — `ClassroomDetailTabs` is generic over `T extends string`.
- If a filter array has a `color` field per item (e.g. status filters), drop per-item colors and use a single `accentColor` to stay consistent.

---

## Date & Time Pickers

- **No external library** — use the custom `DatePickerModal` / `TimePickerModal` pattern (no `@react-native-community/datetimepicker`)
- **Reference implementation:** `components/assessment/CreateAssessmentSheet.tsx`
- `DatePickerModal` — bottom-sheet calendar grid, outputs `YYYY-MM-DD` string
- `TimePickerModal` — bottom-sheet up/down spinners, outputs `HH:MM` (24 h), minute steps of 5
- Trigger UI: `Pressable` wrapping a styled `View` (matches `inputStyle`) with a calendar/clock icon; show clear (`close-circle`) icon when value is set
- Outputs are plain strings — convert to ISO at submit time (e.g. `new Date(\`${date}T23:59:59Z\`).toISOString()`)

---

## Assessment Module

- Questions: `GET /assessment-questions/:assessmentId` — NOT from `attempt.answerSubmissions`
- Member detail: `app/(tabs)/features/[classroomId]/member/[memberId].tsx` — all member fields as URL params
- `CreateAssessmentSheet` props: `classrooms[]` + `schoolId` — **no `classroomId`**; classroom selected inside the sheet
- **Staff tabs in `[assessmentId].tsx`:** Info · Questions · Attempts · Scores · Marking · Retakes
- **Marking flow:** `GET /marking/pending/assessment/:id` → list pending attempts → `GET /marking/attempt/:id` → mark answers via `POST /marking/mark-answer` → `POST /marking/submit-marking` to calculate score
- **`Pressable` layout rule:** never put `flex: 1` inside the callback style — wrap Pressable in a `View style={{ flex: 1 }}` instead; callback for opacity/transform only

---

## Assessment Proctoring (Student)

- `take.tsx` auto-requests camera + mic on mount; goes back if denied — assessment requires proctoring
- Recording starts via `CameraView.recordAsync({ maxDuration: 7200 })` in `onCameraReady` (with 500 ms delay to avoid pipeline race)
- On submit/auto-submit: `stopRecording()` → fire-and-forget upload to `POST /student-attempts/:id/recording`
- PiP widget: 76×104, top-right corner, `zIndex: 999`, pulsing red dot while active
- `expo-camera@~17.0.10` installed; plugin declared in `app.json` with camera + mic permissions

---

## Student Score States

- `GET /student-scores/my-scores/assessment/:id` returns null for unreleased scores — always use bulk `GET /student-scores/my-scores` and filter client-side by `assessmentId`
- Three states: no record → **Awaiting Grading** (amber); record + `isReleased: false` → **Under Review** (blue); `isReleased: true` → full score card
- `ScoreCard` props: `pending` (no record yet), `underReview` (marked but not released), default (show score)

---

## Results Module

- **Generate Results screen:** `app/generate-results.tsx` — staff see only `useMyTeacherClassrooms`; admins see all classrooms + "All Classrooms" option.
- **Staff flow on mobile:** Generate → go to Results screen → Submit for Approval. The generate screen shows a reminder banner for staff.
- `useGenerateResults` and `useSubmitResultsForApproval` mutations are in `hooks/useResults.ts`; service methods in `services/results.service.ts`.
- Feature card "Generate Results" shown for both staff and admin in `(tabs)/features/index.tsx`.

---

## Registration Flow

- OTP step (`components/auth/OtpStep.tsx`) uses **6-digit** code — schema `min(6).max(6)`.
- **Choose Your Role** step (step 2 in sign-up) has **no back button** — it is a one-way forward step.
- Non-tab routes (`app/my-jobs.tsx`, `app/my-enrollments.tsx`, `app/my-enquiries.tsx`) are at `/my-*` — never use `/(tabs)/my-*` to link to them.
- Users with no school membership who open `/my-jobs` land on `StaffJobsScreen` (public job browse), not an access-restricted screen.

---

## Parent Role — Mobile Restrictions

- **Features tab:** parents see only 5 cards: My Children · Children's Reports · Children's Results · Children's Documents · Enquiries. No My Classes hero card, no student/staff features, no Finances, no Attendance, no Library, no Enrollments.
- **My Children screen (`app/my-children.tsx`):** display-only — child cards are plain `View`, no tap navigation. Separate feature cards handle Reports/Results/Documents.
- **Children's Reports/Results/Documents:** each has a child-picker index screen + `[studentId]`/`[userId]` detail screen under `app/my-children-reports/`, `app/my-children-results/`, `app/my-children-documents/`.
- **Quick actions (action tab):** parents see only Enquiries — My Jobs is removed (access-restricted for parents).
- **Account page:** Enrollment row hidden for parents (`{!isParent && <SettingsRow ... />}`).
- **Chat tab:** compose/new-DM icon hidden for parents.

---

## Account Screens

- `account/help-support.tsx` — FAQ accordion + contact cards (Email/WhatsApp/Help Centre). Linked from Support settings group.
- `account/about.tsx` — app version (`Application.nativeApplicationVersion` via `expo-application`, falls back to `'1.0.0'`), mission, feature list, legal links. Linked from Support settings group.
- Both use the standard purple hero header pattern.

## In-App Update Wall

- `components/update/UpdateWallModal.tsx`, mounted as a root-level sibling in `app/_layout.tsx` (outside the `Stack`, not nested in any other `Modal` — per the "Modal outside Modal is invisible" rule above).
- Gates on `AppRelease.versionCode` (int) vs `Application.nativeBuildVersion` — **never** compare the semver `version` string for gating logic (string comparison of `"1.10.0" > "1.9.0"` is wrong).
- `useAppUpdateCheck()` (`hooks/useAppUpdateCheck.ts`) polls `GET /app-releases/latest?platform=android` via `refetchInterval: 10 * 60_000` — same convention as `useNotifications.ts`, no `AppState` foreground-listener exists in this app.
- `updateType: 'critical'` → unskippable full block, no dismiss, hardware back does nothing. `'optional'` → dismissible; skip is persisted per-versionCode in `store/updateStore.ts` (Zustand + AsyncStorage, same shape as `authStore.ts`) so it re-prompts automatically on any newer release.
- "Update Now" opens `release.fileUrl` (public R2 URL) via `Linking.openURL` — same backend release the frontend landing page and admin panel manage (see `backend/CLAUDE.md` → "App Releases").

---

## Avatar Placeholder Rule

- **Never show initials** when a user has no profile picture — always render `<Ionicons name="person" />` inside the coloured avatar container. Applies to home top-bar and account hero.
- **School logo in active school card:** `<Image source={{ uri: school.logo }} />` when available; fall back to initial letter only if no logo.

---

## Chat Tab

- Conversation list grouped: School → Admin → Classes → Groups → Direct Messages. `type === 'team'` hidden from non-admins.
- ChatRoom: `FlatList inverted`, polls 10s, `KeyboardAvoidingView`
- DM new-conversation button hidden for parents (`isParent` check in chat tab).

---

## Currency System

- `lib/currency.ts` — 7 currencies (NGN default), `formatCurrency()`, `formatCompact()`, Hermes-safe compact fallback
- **Always use `useCurrency()` for financial amounts** — never hardcode `₦` or any symbol

---

## Key Conventions

- Always `"Hello, {firstName}!"` — never time-of-day greetings, never 👋
- `useLogout()` returns an async function — call directly: `const logout = useLogout(); logout()`
- Error handling: always `err.message` in `onError`
- Replace all full-screen `ActivityIndicator` with `components/ui/LoadingScreen.tsx`

---

## Location (Attendance)

- Android uses `Location.Accuracy.Low` (network-based); iOS uses `Balanced`.
- `getCurrentPositionAsync` races against a 10 s timeout. On timeout/failure, falls back to `getLastKnownPositionAsync` (up to 1 h old, then any cached).
- Attendance card shows a blocking modal on location failure — no two-step confirm dialog.

## Attendance Method (Location vs QR Code)

- `AttendanceSettings.attendanceMethod: 'location' | 'qr_code'` (replaces the old `useQRCode: boolean`) — set per school, drives which clock-in flow the staff/student Attendance card (`app/(tabs)/action.tsx` → `AttendanceCard`, rendered on the Action-tab FAB sheet) shows.
- `'location'` — existing GPS flow unchanged: `getCurrentLocation()` acquires lat/lng, server geofences against it.
- `'qr_code'` — no GPS is acquired at all (`getCurrentLocation()` is skipped entirely in `handleClock`). Instead a "Scan QR Code" button opens `QrScannerModal`, a full-screen `Modal` wrapping `expo-camera`'s `CameraView` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}` and `onBarcodeScanned`. The scanned string is passed through verbatim as `qrToken` on the clock payload — it's opaque to the client, decoded from a long-lived QR code the school emails to the family (homeschool use case: a visiting teacher scans it at the student's home instead of GPS).
- Camera permission pattern in `QrScannerModal` mirrors `useCameraPermissions()` from `take.tsx` (exam proctoring) — requests on modal open, shows a denial screen with "Grant Permission" (if `canAskAgain`) or "Open Settings" (mirrors the existing location-denial blocker UX style).
- Clock-in button is disabled until a token is scanned (`qrToken` non-empty), same pattern as GPS mode requiring acquired coordinates.
- `testID`s added for Maestro targeting: `action-fab-button` (the FAB in `CustomTabBar.tsx`), `scan-qr-button`, `qr-scanner-modal`, `qr-scanner-close-button`.
- **E2E note:** Maestro can't feed a real QR image to the device camera, so `staff/deep_qr_attendance_scan.yaml` only verifies the scanner UI opens/closes — not a full scan-to-clock-in. Verify actual scanning manually on-device.

---

## Results Service

- `getClassroomResults`: backend may return `{ data: { results: [] } }` or `{ results: [] }`. Unwrap both layers.
- Field remapping: `position → classPosition`, `grade → overallGrade`, flat `studentName/studentPicture → student` object.

---

## Environment

```
EXPO_PUBLIC_BACKEND_BASE_URL=http://localhost:8000/api/v1/
```
- Physical device: use machine's local IP
- Android emulator: `http://10.0.2.2:8000/api/v1/`

---

## E2E Testing (Maestro)

- **Location:** `e2e/maestro/` — YAML flows, no native build required (works with Expo).
- **Install CLI:** `curl -Ls "https://get.maestro.mobile.dev" | bash`
- **Prerequisite:** run `pnpm seed:demo` in `backend/` (wipes/rebuilds "Cakale Demo Academy") and start the app pointed at that local backend, with a simulator/emulator or device running.
- **Run:** `pnpm test:e2e` (all flows), or `pnpm test:e2e:admin` / `:staff` / `:student` / `:parent` for a single role's flows.
- **Structure:** `flows/shared/login.yaml` + `logout.yaml` are reusable subflows (parameterized via `EMAIL`/`PASSWORD` env, called with `runFlow`). Each role folder (`admin/`, `staff/`, `student/`, `parent/`) has one `smoke_<module>.yaml` per feature module (login → navigate → assert screen loaded → logout) plus a few `deep_<action>.yaml` flows for critical multi-step actions (generate/publish results, mark attendance, take an assessment, submit an enquiry, etc.).
- **Test accounts** (all password `Demo@2026!`, see `.env.example` in the maestro folder): `e2etest@mail.cakale.com` (school admin), `ifeoma.chukwu@mail.cakale.com` (teacher/class teacher JSS1A), `segun.ojo@mail.cakale.com` (finance staff), `chioma.eze@mail.cakale.com` (student, JSS1A), `chinwe.eze.parent@mail.cakale.com` (parent, linked child in JSS1A). No `super_admin` demo account exists yet.
- **`email-input` / `password-input` / `sign-in-button` testIDs** were added to `SignInForm.tsx` specifically so Maestro can target them reliably; `action-fab-button` / `scan-qr-button` / `qr-scanner-modal` / `qr-scanner-close-button` were added for the attendance FAB + QR scanner flow — no other screens have `testID`s yet, so other flows target visible text/labels. Add `testID`s to new interactive elements if you want more robust E2E targeting going forward.
- **Known gap / first-pass caveat:** `deep_*.yaml` flows and the `admin_results`/`subscription`/`notifications` smoke flows (routes not reachable via a Features-grid card tap) were written from static code reading, not a live run — some selectors (button labels, list item positions) may need adjusting the first time they're run against the real app.
- **Corrected gap:** `staff/deep_mark_attendance.yaml` originally navigated Features > Attendance > "Clock In", but that screen (`app/attendance.tsx`) is history-only with no Clock In button — the real Attendance card lives on the Action-tab FAB sheet (`app/(tabs)/action.tsx`). Fixed to open via `action-fab-button`.
