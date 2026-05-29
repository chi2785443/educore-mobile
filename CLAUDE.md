# EduCore Mobile — React Native (Expo)

- **Framework:** Expo SDK 54 + Expo Router 6 | **Runtime:** React Native 0.81
- **Dev:** `pnpm start` | **Package manager:** pnpm | **New Architecture:** enabled

---

## Styling

- **NativeWind v4** — use `className` always. `style={{}}` only for dynamic values (colors, calculated dims).
- **SVG logos:** `expo-image` with `require('@/assets/images/educore_*.svg')` — never RN `<Image>` for SVGs
- **Icons:** `Ionicons` from `@expo/vector-icons`
- **Pressable:** never set `backgroundColor` in callback style — put it on an inner `View`; callback for opacity/transform only
- **Color palette:** primary `#4C3FC4`, accent `#F5486A`, pastels: `#F0EEFF` / `#FFF0F0` / `#E8F5EE` / `#E8F4FF`
- **Screen headers:** `#4C3FC4` bg + `borderBottomLeftRadius: 28, borderBottomRightRadius: 28` — color varies by module/role
- **Phone fields:** always `PhoneInput` from `@/components/ui/PhoneInput` — never plain `TextInput`

---

## State & Data

- **Server state:** TanStack React Query v5
- **Global state:** Zustand v5 — persisted via AsyncStorage. Stores `user`, `isAuthenticated`, `selectedSchoolId`, `hasOnboarded`
- **Tokens:** `expo-secure-store` (keys: `educore_access_token`, `educore_refresh_token`)
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

## Classroom Tab

- Assessment questions from `GET /assessment-questions/:assessmentId` — NOT from `attempt.answerSubmissions`
- Member detail: `app/(tabs)/features/[classroomId]/member/[memberId].tsx` — all member fields as URL params
- `CreateAssessmentSheet` props: `classrooms[]` + `schoolId` — **no `classroomId`**; classroom selected inside the sheet

---

## Chat Tab

- Conversation list grouped: School → Admin → Classes → Groups → Direct Messages. `type === 'team'` hidden from non-admins.
- ChatRoom: `FlatList inverted`, polls 10s, `KeyboardAvoidingView`

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

## Environment

```
EXPO_PUBLIC_BACKEND_BASE_URL=http://localhost:8000/api/v1/
```
- Physical device: use machine's local IP
- Android emulator: `http://10.0.2.2:8000/api/v1/`
