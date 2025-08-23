# Run Pool – Next.js + Supabase

A lightweight group challenge app built with Next.js App Router and Supabase. It supports creating groups, weekly challenges, proofs, and admin tools to manage settings, invite links, and group deletion.

## Features

- **Group management**: create, view, and manage groups (`app/group/[id]/`).
- **Admin controls**: edit group name/rules/entry fee, create weeks, delete group (`app/group/[id]/admin/page.tsx`).
- **Invite links**: generate copyable invite URLs, list active/expired invites, revoke invites.
- **Client-side guards**: admin page checks current user membership role and redirects non-admins.
- **RLS-secured**: relies on Supabase Row Level Security to enforce permissions.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

Scripts:

```bash
npm run dev       # start dev server
npm run build     # production build (Turbopack)
npm run start     # start production server
npm run lint      # run ESLint
```

## Environment Variables

Create `.env.local` with your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Client initialized in `lib/supabaseClient.ts`.

## Supabase Setup

- Ensure tables like `groups`, `memberships`, `challenges`, `proofs`, and `invites` exist.
- Enable RLS and add policies so only group owners/admins can edit/delete groups and manage invites.
- Admin page includes a client guard, but security must be enforced by RLS.

### Optional RPC for Atomic Deletion

App prefers an RPC named `delete_group_cascade` to delete a group and related rows atomically, with a client-side fallback if RPC is absent. Example PostgreSQL function signature:

```sql
create or replace function delete_group_cascade(p_group_id uuid)
returns void language plpgsql security definer as $$
begin
  delete from proofs where challenge_id in (select id from challenges where group_id = p_group_id);
  delete from challenges where group_id = p_group_id;
  delete from invites where group_id = p_group_id;
  delete from memberships where group_id = p_group_id;
  delete from groups where id = p_group_id;
end; $$;
```

Grant execute to relevant roles if needed.

## Directory Highlights

- `app/group/[id]/page.tsx` – group dashboard; shows Admin button for owners/admins.
- `app/group/[id]/admin/page.tsx` – admin tools (edit settings, weeks, invites, delete).
- `app/signin/page.tsx` – email/password auth + post-auth redirect.
- `lib/supabaseClient.ts` – Supabase client.

## E2E Test Checklist

- **Sign in**: create account or sign in with email/password.
- **Admin access**: visit `/group/[id]/admin` as owner/admin; non-admins are redirected.
- **Invite flow**: generate invite, copy URL, join via `/join?token=...`, confirm membership.
- **Revoke invite**: revoke and verify link no longer works.
- **Delete group**: use Danger Zone; verify RPC path works or client cascade fallback.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

You can deploy to any platform supporting Next.js. For Vercel, see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
