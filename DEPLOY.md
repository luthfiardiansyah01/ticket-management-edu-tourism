# Deployment Guide (Vercel + Turso)

This guide will help you deploy your Next.js application to Vercel, using Turso as your cloud database.

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **Turso Account**: Sign up at [turso.tech](https://turso.tech).
3.  **GitHub Repository**: Push your code to a GitHub repository.

---

## Step 1: Set up Turso Database

Since Vercel is serverless, you cannot use a local SQLite file (`file:local.db`). You need a cloud-hosted SQLite database like Turso.

1.  **Create a Database**:
    *   Go to the Turso dashboard.
    *   Create a new database (e.g., `cikapundung-db`).
2.  **Get Credentials**:
    *   **Database URL**: Copy the URL (it starts with `libsql://`).
    *   **Auth Token**: Generate an authentication token for your database.

---

## Step 2: Configure Environment Variables

Update your local `.env.local` file with the new credentials to test the connection and push your schema.

```env
# .env.local
DATABASE_URL="libsql://your-database-name-organization.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
NEXTAUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000" # Change to your Vercel URL after deployment
```

---

## Step 3: Push Schema to Turso

Run the following command in your terminal to create the tables in your new Turso database:

```bash
npx drizzle-kit push
```

If successful, your database structure is now live on Turso!

---

## Step 4: Seed Initial Data (Optional)

To populate your database with the initial packages and data:

```bash
npx tsx scripts/seed.ts
```

---

## Step 5: Deploy to Vercel

1.  **Import Project**:
    *   Go to your Vercel dashboard.
    *   Click "Add New..." -> "Project".
    *   Select your GitHub repository.

2.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: `./` (default).

3.  **Environment Variables**:
    *   Add the following variables in the Vercel deployment screen:
        *   `DATABASE_URL`: Your Turso Database URL (`libsql://...`).
        *   `TURSO_AUTH_TOKEN`: Your Turso Auth Token.
        *   `NEXTAUTH_SECRET`: Generate a random string (e.g., use `openssl rand -base64 32` or an online generator).
        *   `NEXTAUTH_URL`: Set this to your production URL (e.g., `https://your-project.vercel.app`) once you know it. For the initial build, you can omit it or set it to the Vercel preview URL pattern.

4.  **Deploy**:
    *   Click **Deploy**.
    *   Wait for the build to complete.

---

## Troubleshooting

*   **Build Failures**: Check the build logs in Vercel. Ensure all environment variables are set correctly.
*   **Database Connection Errors**: Verify that `TURSO_AUTH_TOKEN` is correct and has permission to access the database.
*   **"Table not found"**: Ensure you ran `npx drizzle-kit push` against the *production* database URL.

---

## Post-Deployment

1.  **Update NEXTAUTH_URL**: Once deployed, go to Vercel Settings -> Environment Variables and update `NEXTAUTH_URL` to your actual domain (e.g., `https://cikapundung-river.vercel.app`).
2.  **Redeploy**: Go to Deployments -> Redeploy to apply the new environment variable.
