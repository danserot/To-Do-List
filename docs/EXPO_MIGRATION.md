# Expo migration

The task domain is already independent from React DOM and can be reused as-is:

- `src/domain/tasks.js` contains the task model, filters, sorting and date helpers.
- `src/services/taskRepository.js` owns local-first persistence and optional Supabase sync.
- `src/services/quickTaskRepository.js` owns configurable quick-task templates.
- `src/platform/storage.js` is the only browser storage adapter.

## Migration steps

1. Create an Expo app and copy `src/domain`, `src/services` and `src/lib`.
2. Replace `src/platform/storage.js` with an AsyncStorage adapter that implements
   `getItem`, `setItem` and `removeItem`.
3. Replace web components with React Native screens. Keep the same repository
   methods: `list`, `create`, `update`, `remove` and `restore`.
4. Replace `lucide-react` with `lucide-react-native`.
5. Configure Supabase Auth storage with AsyncStorage and set
   `detectSessionInUrl: false` in the native client.

The current storage adapter is synchronous because `localStorage` is synchronous.
For Expo, make adapter calls asynchronous and add `await` inside the repository;
the public repository API is already asynchronous, so screens do not need to change.

## Shared task shape

```js
{
  id: string,
  text: string,
  notes: string,
  completed: boolean,
  due_date: "YYYY-MM-DD" | "",
  priority: "none" | "low" | "medium" | "high",
  created_at: string,
  updated_at: string,
  remote_id?: string | number
}
```

The optional `focus_tasks` Supabase table stores the complete task shape. Apply
the migration from `supabase/migrations` and enable cloud sync as described in
`docs/BACKEND.md`. On Expo, supply the same environment values through Expo
configuration and keep the publishable anonymous key in the client. Never ship
the service-role key.
