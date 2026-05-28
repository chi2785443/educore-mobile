# EduCore Mobile — React Native (Expo)

- **Framework:** Expo SDK 54 + Expo Router 6 | **Runtime:** React Native 0.81
- **Dev:** `pnpm start` | **Package manager:** pnpm | **New Architecture:** enabled

---

## Styling & Theme

- **NativeWind v4** — use `className` always. `style={{}}` only for dynamic values (colors, calculated dims).
- **SVG logos:** `expo-image` with `require('@/assets/images/educore_*.svg')` — never RN `<Image>` for SVGs
- **Icons:** `Ionicons` from `@expo/vector-icons`
- **Pressable:** never set `backgroundColor` in callback style — put it on an inner `View`; callback for opacity/transform only
- **Font:** Poppins via `@expo-google-fonts/poppins` — loaded in `app/_layout.tsx`
- **Color palette:** primary purple `#4C3FC4`, accent coral `#F5486A`, pastels: mint `#E8F5EE`, salmon `#FFF0F0`, sky `#E8F4FF`, lavender `#F0EEFF`
- **Screen headers:** dark background + `borderBottomLeftRadius: 28, borderBottomRightRadius: 28` + `paddingBottom: 24` — every screen, color varies per module
- **Phone fields:** always `PhoneInput` from `@/components/ui/PhoneInput` — never plain `TextInput`
- **Buttons:** primary = coral `#F5486A` pill (`rounded-full`), secondary = purple `#4C3FC4` pill
- **Tab bar:** white background, purple active, coral FAB

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
- `tsconfig.json` `@/*` alias points to repo root

---

## Role-Based Dashboard

- `isAdmin → MobileAdminDashboard` · `isStaff → MobileStaffDashboard` · `isStudent → MobileStudentDashboard` · `isParent → MobileParentDashboard` · no school → `NoSchoolState`
- Components in `components/dashboard/` — purple/role-colored hero + gradient stat cards
- Shared primitives: `DashboardPrimitives.tsx` — `GradCard`, `Card`, `SectionLabel`, `DashLoader`
- No charts on mobile — stat counts only

---

## School Data

- `SchoolInfo` (in `user.interface.ts`) includes `currentSession` and `currentTerm` — both returned from `GET /auth/profile`
- For fresh school data (term, session) use `useSchoolById(schoolId)` — never rely on the auth store alone as it can be stale
- Allowed assessment types come from `useGradeConfigs(schoolId)` → `gradeConfigs[0].enabledAssessmentTypes`
- `academicYear` and `term` are **never typed by users** — always auto-injected from school data

---

## Classroom Tab

- Backend join tables: `classroom_teachers` (classroomId, teacherId), `classroom_students` (classroomId, studentId)
- Assessment questions from `GET /assessment-questions/:assessmentId` — NOT from `attempt.answerSubmissions`
- Member detail page: `app/(tabs)/features/[classroomId]/member/[memberId].tsx` — pass all member fields as URL params

---

## Assessments

- `CreateAssessmentSheet` takes `classrooms` (array) and `schoolId` props — **no `classroomId` prop** (classroom is selected inside the sheet)
- Types come from grade config; term/year auto-filled; date/time use built-in picker modals (no external library)

---

## Modals — Critical Rule

- **Never render a `Modal` outside another open `Modal`** — it renders behind the parent and is invisible
- Always nest sub-pickers (date, time, member, subject) **inside** the parent `Modal`'s `SafeAreaView`

---

## Chat Tab

- Conversation list grouped: School → Admin → Classes → Groups → Direct Messages. `type === 'team'` hidden from non-admins.
- ChatRoom: `FlatList inverted`, polls 10s, `KeyboardAvoidingView`

---

## Currency System

- `lib/currency.ts` — 7 currencies (NGN default), `formatCurrency()`, `formatCompact()`, Hermes-safe compact fallback (K/M suffixes)
- `hooks/useCurrency.ts` — reads `selectedSchoolId` + `user.schools` from authStore, returns `{ currency, symbol, format, formatCompact }`
- **Always use `useCurrency()` for financial amounts** — never hardcode `₦` or any symbol

---

## Loading & UI

- Replace all full-screen `ActivityIndicator` with `components/ui/LoadingScreen.tsx`

---

## Key Conventions

- Always `"Hello, {firstName}!"` — never time-of-day greetings, never 👋
- `useLogout()` returns an async function — call directly: `const logout = useLogout(); logout()`
- Error handling: always `err.message` in `onError`

---

## Environment

```
EXPO_PUBLIC_BACKEND_BASE_URL=http://localhost:8000/api/v1/
```
- Physical device: use machine's local IP
- Android emulator: `http://10.0.2.2:8000/api/v1/`
