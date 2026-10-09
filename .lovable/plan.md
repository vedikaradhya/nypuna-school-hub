# Reset owner password + add "Forgot password"

## What I'll do

1. **Reset your owner password now**
   - Set a new temporary password for vedikaradhya1234@gmail.com directly in the backend (owner account).
   - Share the temporary password with you in chat so you can sign in immediately.
   - Recommend you change it after signing in (or I can add a change-password option on a My Account page later).

2. **Add a "Forgot password" link on the sign-in page** (so this never blocks you again)
   - Add a "Forgot password?" link under the sign-in form on the auth page.
   - Clicking it asks for your email and sends a password-reset email.
   - The email link opens a reset page where you type a new password.
   - Uses the built-in auth email flow — no new services needed.

## Technical details

- Password reset for the owner account: `supabaseAdmin.auth.admin.updateUserById` via a one-off server-side call (or SQL-level admin update).
- Forgot-password flow: `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/reset-password })` on the auth page; new public route `src/routes/reset-password.tsx` that calls `supabase.auth.updateUser({ password })`.
- Reset page is public (no sign-in gate), added to routes in the same change.
- Verify with `bunx tsgo --noEmit` and the build log.

## Note

Auth reset emails send through the default Lovable sender until a custom email domain is set up — they will still arrive, just without school branding.
