# EduCore Mobile — React Native (Expo)

- **Framework:** Expo SDK 54 + Expo Router 6 | **Runtime:** React Native 0.81
- **Dev:** `pnpm start` | **Package manager:** pnpm | **New Architecture:** enabled

---

## Setup & Styling
- **NativeWind v4** (Tailwind CSS v3) — use `className` prop always. `style={{}}` only for dynamic values (colors, calculated dims).
- `babel.config.js` — `babel-preset-expo` + `nativewind/babel` plugin (no `jsxImportSource` — pnpm doesn't hoist)
- `metro.config.js` — `withNativeWind({ input: './global.css' })` + `config.resolver.assetExts.push('svg')`
- **SVG logos:** `expo-image` with `require('@/assets/images/educore_*.svg')` — never RN's built-in `<Image>` for SVGs
- Auth screens use `educore_logo.svg` (light bg)
- **Icons:** `Ionicons` from `@expo/vector-icons`
- `.npmrc` — `public-hoist-pattern` for `react-native-css-interop`, `*react-native*`, `*expo*`
- **Pressable backgroundColor:** never set on the callback style — put it on an inner `View`; only use callback for opacity/transform

---

## State & Data
- **Server state:** TanStack React Query v5 — `QueryClient` in root layout
- **Global state:** Zustand v5 (`store/authStore.ts`) — persisted via AsyncStorage; stores `user`, `isAuthenticated`, `selectedSchoolId`, `hasOnboarded`
- **Tokens:** `expo-secure-store` (keys: `educore_access_token`, `educore_refresh_token`)
- **HTTP client:** Axios (`services/axios.service.ts`) — Bearer token from SecureStore, auto-refresh on 401, all errors → `new Error(message)`. Always use `err.message` in `onError`.
- **Forms:** React Hook Form v7 + Zod v4 via `@hookform/resolvers/zod`
- **File uploads:** `expo-document-picker` — append as `{ uri, name, type }` to FormData

---

## Navigation
- **5 tabs:** Home (`index`) · Classroom (`classroom/`) · Action (center FAB, `href: null`) · Chat (`chat/`) · Account (`account/`)
- **Custom tab bar:** `components/navigation/CustomTabBar.tsx` — dark `#0B0F14`, indigo-400 active, haptic on tap
- **FAB:** 56×56 indigo-to-violet, raised 20px above tab bar
- `router.replace()` for auth transitions; `router.back()` for in-flow back
- `tsconfig.json` `@/*` alias points to repo root

---

## App Structure

```
app/
├── _layout.tsx         — root: QueryClient + auth restore + splash
├── index.tsx           — redirect based on hasOnboarded + isAuthenticated
├── onboarding.tsx      — 4 animated slides, Reanimated, progress dots
├── (auth)/             — sign-in, sign-up (4-step), forgot/reset password
└── (tabs)/
    ├── index.tsx       — role-based dashboard
    ├── action.tsx      — FAB bottom sheet (attendance + quick actions + inline modals)
    ├── classroom/      — Stack: list → detail → assessment/[id] → take (fullScreenModal)
    ├── chat/           — Stack: conversation list → [conversationId]
    └── account/        — Stack: hub + 7 sub-screens
```

---

## Onboarding (4 steps — `app/(auth)/sign-up.tsx`)
1. BasicInfoStep: firstName, lastName, email, phone?, password → `POST /auth/register`
2. OtpStep: verify via `POST /auth/verify-otp`
3. RoleSelectionStep: `super_admin | staff | student | parent`
4. Role action → redirect to `/(tabs)/`

---

## Role-Based Dashboard (`app/(tabs)/index.tsx`)
- `isAdmin` → `MobileAdminDashboard` · `isStaff` → `MobileStaffDashboard` · `isStudent` → `MobileStudentDashboard` · `isParent` → `MobileParentDashboard` · no school → `NoSchoolState`
- Components in `components/dashboard/` — dark hero + 4 bold gradient stat cards (`from-X-500 to-X-700`)
- Shared primitives: `DashboardPrimitives.tsx` — `GradCard`, `Card`, `SectionLabel`, `DashLoader`
- **No charts on mobile** — stat counts only
- **Backend join tables:** `classroom_teachers` (classroomId, teacherId), `classroom_students` (classroomId, studentId) — never guess other names

---

## Classroom Tab (`app/(tabs)/classroom/`)
- List: role-based hooks (`useClassroomsBySchool` / `useMyTeacherClassrooms` / `useMyStudentClassrooms`)
- Detail tabs — Staff/Admin: Schedule | Members | Assessments; Student: Schedule | Assessments
- Assessment detail — Staff: Info | Questions | Attempts | Scores | Retakes; Student: Info | My Score
- Take assessment: `fullScreenModal`, timer, auto-submit at 0, questions from `GET /assessment-questions/:assessmentId`
- Questions sourced from assessment questions API — NOT from `attempt.answerSubmissions`

---

## Chat Tab (`app/(tabs)/chat/`)
- Conversation list grouped: School → Admin → Classes → Groups → Direct Messages. `type === 'team'` hidden from non-admins.
- `ChatBubble.tsx` — own=right/indigo, other=left/white; reaction pills; read receipts
- `PeoplePickerSheet.tsx` — DM (single) or Group (multi + name) mode
- ChatRoom: `FlatList inverted`, polls 10s, `KeyboardAvoidingView`

---

## Action Tab (`app/(tabs)/action.tsx`)
- Animated bottom sheet with: attendance card (clock in/out with location + QR) + role-based quick action grid (2-col)
- Inline modal forms: PostAnnouncement (admin), CreateEvent (admin/staff), WriteReport (staff), ApproveReports (admin)
- `useAttendanceSettings(schoolId)` staleTime 5min; `useTodayAttendance(schoolId)` refetchInterval 60s

---

## Account Tab (`app/(tabs)/account/`)
Hub + 7 sub-screens: finances, attendance, results, subscription, question-bank, library, documents
- File opening: `Linking.openURL(signedUrl)` from `GET /files/view-url?fileUrl=`
- `useLogout()` returns async function — call directly: `const logout = useLogout(); logout()`

---

## Loading Screen
`components/ui/LoadingScreen.tsx` — dark `#0B0F14` bg, spinning indigo ring, pulsing EduCore icon, 3-dot trail. Replace all `ActivityIndicator` full-screen loaders with this.

---

## Key Conventions
- Always `"Hello, {firstName}!"` — never time-of-day greetings, never 👋
- `useLogout()` returns an async function — call directly
- Error handling: always `err.message` in `onError` handlers

---

## Environment
```
EXPO_PUBLIC_BACKEND_BASE_URL=http://localhost:8000/api/v1/
```
- Physical device: use machine's local IP (not `localhost`)
- Android emulator: `http://10.0.2.2:8000/api/v1/`
- iOS simulator: `localhost` works

---

## App Icon & Splash
- Icons generated via `scripts/generate-icons.mjs` (uses `@resvg/resvg-js`)
- Splash: `backgroundColor: "#0B0F14"`, dark bg with EduCore logo, `imageWidth: 320`
