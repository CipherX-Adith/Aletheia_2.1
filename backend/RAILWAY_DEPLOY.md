# Deploying Aletheia Backend to Railway

This guide outlines the steps to deploy the backend Node.js API to [Railway](https://railway.app/).

## 1. Project Configuration Changes Made
We updated the following files to support a seamless Railway deployment:
- **Prisma Schema**: Configured `prisma/schema.prisma` to use standard PostgreSQL with support for `DATABASE_URL` and `DIRECT_URL` (useful for environments using connection poolers like Neon, Supabase, or Railway's pooled PG).
- **Database Connector**: Updated `src/config/database.js` to initialize the client using standard `@prisma/client` and connection pooling via `@prisma/adapter-pg`.
- **Scripts**: Modified the `start` command in `package.json` to automatically execute database migrations (`prisma migrate deploy`) prior to starting the web server.

---

## 2. Step-by-Step Deployment on Railway

### Step 1: Push Your Code to GitHub
Ensure all your changes are committed and pushed to your GitHub repository.

### Step 2: Create a New Project on Railway
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** in the top-right corner.
3. Select **Deploy from GitHub repo** and select your repository.

### Step 3: Set the Root Directory
Since this is a monorepo, you must tell Railway to only build and run the backend directory:
1. Once the service is added, go to the **Settings** tab of the service.
2. Under the **General** section, locate the **Root Directory** setting.
3. Set the Root Directory to: `/backend`
4. Save the changes.

### Step 4: Configure Environment Variables
Go to the **Variables** tab of your backend service on Railway and add the following required variables:

| Variable Name | Description | Example / Value |
| --- | --- | --- |
| `DATABASE_URL` | The PostgreSQL connection URL | `postgresql://user:pass@host:port/db` (or Railway Postgres reference: `${{Postgres.DATABASE_URL}}`) |
| `DIRECT_URL` | The direct PostgreSQL connection URL (skipping poolers, used for migrations) | Same as `DATABASE_URL` unless using a separate migration/direct endpoint |
| `JWT_SECRET` | Secret key used for signing access tokens | *A long, secure random string* |
| `JWT_REFRESH_SECRET` | Secret key used for signing refresh tokens | *A separate long, secure random string* |

#### Optional Environment Variables
- `PORT`: (Managed automatically by Railway; defaults to `3000` inside our config if not provided)
- `NODE_ENV`: Set to `production`
- `STELLAR_NETWORK`: Set to `testnet`
- `GROQ_API_KEY`: If using the AI chatbot widget

---

## 3. Database setup (If deploying Postgres on Railway)
If you want to use Railway's built-in Postgres database:
1. Click **+ Add Service** in your Railway project board.
2. Select **Database** -> **Add PostgreSQL**.
3. In your backend service's **Variables** tab, reference the Postgres service:
   - Add a variable `DATABASE_URL` with value `${{Postgres.DATABASE_URL}}`.
   - Add `DIRECT_URL` with the same value.
