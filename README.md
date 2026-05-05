# DDM Verify Admin (Next.js)

Runs on **port 3001** by default (`npm run dev`).

## Environment

Copy `.env.local.example` → `.env.local`, or generate from Railway:

```powershell
pwsh -File ..\scripts\sync-env-from-railway.ps1
```

Required:

- **`NEXT_PUBLIC_SUPABASE_URL`** / **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — same Supabase project as mobile (auth).
- **`NEXT_PUBLIC_API_URL`** — must be the public API base, e.g. `https://api.ddmverify.com` (used for `GET /users/me` to read `role` from **Railway Postgres**).

Login uses **Supabase email/password**; only users with **`role === 'admin'`** in the API `users` table can enter `/admin`.

## Remaining / owner tasks

- Create or promote admin users in the **Railway** `users` table (`role = 'admin'`), or via your existing admin-creation flow.
- Keep **CORS** on the API listing your admin origin if it is not under the same site as the API (see `CORS_ORIGIN` on Railway).
