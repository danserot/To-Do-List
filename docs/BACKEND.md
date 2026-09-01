# Backend and database

Focus uses a local-first data model. The browser remains usable without a
network connection, while Supabase can provide authentication, PostgreSQL,
row-level security and file storage.

## What is prepared

- `supabase/migrations/202609010001_focus_schema.sql` creates tables for tasks,
  profiles, application settings and quick-task templates.
- Every table has row-level security. An authenticated user can access only
  rows whose `user_id` matches `auth.uid()`.
- Private Storage buckets are prepared for avatars and profile covers.
- `src/services/cloudRepository.js` is the single adapter for cloud reads and
  writes. UI components do not access the new tables directly.
- Local repositories keep their current fallback if Supabase is unavailable.
- Failed cloud task deletion is stored as a local tombstone and retried later.

## Enable cloud sync

1. Create or select a Supabase project.
2. Run the SQL migration in the Supabase SQL editor or with the Supabase CLI.
3. Copy `.env.example` to `.env.local` and fill in the project URL and
   publishable anonymous key.
4. Set `REACT_APP_CLOUD_SYNC=true`.
5. Restart the development server.

Never put a Supabase service-role key in a React or Expo client. It bypasses
RLS and must exist only in a trusted server environment.

## Current synchronization contract

- Tasks synchronize all fields and use `client_id` to preserve IDs created
  offline.
- Settings, profile metadata and quick-task templates are loaded from the
  cloud and stay cached locally.
- Avatar and cover buckets are provisioned, but uploading media to them should
  be added together with progress, retry and image deletion handling. Until
  then, processed images remain local.

## Do we need a custom backend?

Not for the MVP. Supabase already acts as the backend for authentication,
database, access control and storage. Add server-side functions when the app
needs trusted or scheduled work, for example:

- push notification delivery and reminder schedules;
- shared projects, invitations and permission changes;
- email delivery and account recovery workflows;
- payments, subscriptions or limits;
- integrations that require secret API keys;
- recurring-task generation and heavy analytics.

These jobs can start as Supabase Edge Functions and scheduled database jobs.
A separate Node.js backend is justified only when their complexity or load
outgrows that setup.
