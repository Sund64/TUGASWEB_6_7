# Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. Run [`schema.sql`](./schema.sql). It creates custom app accounts, hashed-token sessions, and transaction RPCs; it does not use Supabase Auth.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the project-root `.env` file, then restart Vite.

Users can register in the app; the database stores a bcrypt hash and returns a custom session token. Credentials are verified in the database, and transactions can only be accessed through RPCs with a valid application session token. Direct table permissions are revoked. Never use a Supabase `service_role` key in a browser app.
