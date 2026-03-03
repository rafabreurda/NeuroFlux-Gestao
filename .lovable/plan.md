

## Plan: Bypass Auth During Development

The auth system (login, signup, profiles table, hooks) is already built and will remain intact. The only change is to **skip the login gate** so the app loads directly without requiring authentication.

### Changes

**`src/App.tsx`** — Remove the auth gate that redirects to `<Auth />` when no user is logged in. Instead, always render `<Routes>` with Index. Pass `user` as `null` and a no-op `signOut`.

**`src/pages/Index.tsx`** — Make the `user` prop optional (`User | null`). When `user` is null, skip the `useProfile` call and use fallback values (e.g., "Usuário" for name display). The `signOut` function becomes a no-op or hidden when not authenticated.

All auth code (`Auth.tsx`, `useAuth.ts`, `useProfile.ts`, profiles table, RLS policies) stays untouched and ready to re-enable by simply restoring the auth gate in `App.tsx`.

