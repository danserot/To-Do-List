# Focus

Local-first to-do application built with React and optional Supabase sync.

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000`. Use **Продолжить офлайн** when Supabase is not
available, or sign in with the local account:

```text
admin@local.test
admin123
```

## Features

- Inbox, Today, Upcoming, Important and Completed views
- Search, priorities, due dates and task notes
- Offline persistence and migration from the original local task format
- Optional synchronization of basic task fields with Supabase
- Responsive desktop and mobile interface
- Undo after deletion
- Optional full cloud schema for tasks, profile metadata, settings and quick templates

## Architecture

```text
src/domain       Shared task rules and selectors
src/services     Local-first repository and remote synchronization
src/platform     Platform storage adapter
src/components   Web UI components
src/pages        Web application screens
```

The domain and repository are deliberately independent from React DOM. See
[`docs/EXPO_MIGRATION.md`](docs/EXPO_MIGRATION.md) for the Expo migration path.

Database setup, RLS policies and the cloud-sync switch are documented in
[`docs/BACKEND.md`](docs/BACKEND.md).

## Build

```bash
npm run build
```
