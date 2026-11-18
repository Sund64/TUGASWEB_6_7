# Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. Run [`schema.sql`](./schema.sql) to create the `transactions` and `students` tables, indexes, and row-level security policies.
3. Copy `.env.example` to `.env` in the project root. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings.
4. Restart the Vite development server, then register or sign in from the app.

The app reads and inserts transactions, and reads student records, through Supabase's REST API. Row-level security restricts every query to the signed-in user's `user_id`. Add student records in the Supabase dashboard with the matching user's ID from **Authentication → Users**; the app currently presents student records as a read-only list. Never use a Supabase `service_role` key in a browser app. Configure email confirmation and allowed redirect URLs in Supabase Auth if confirmation is enabled.
