<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yffDbEh8mBfMaFiXtfdWnsqAFG-_OYPJ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```
   cp .env.example .env.local
   ```
3. Set the required environment variables in `.env.local`:
   - `GEMINI_API_KEY` — your Google Gemini API key
   - `VITE_SUPABASE_URL` — your Supabase project URL (e.g. `https://<project-ref>.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — your Supabase project's anonymous (public) key

   You can find your Supabase URL and anon key in your [Supabase project dashboard](https://supabase.com/dashboard) under **Project Settings → API**.
4. Run the app:
   `npm run dev`

> **Note:** `.env.local` is listed in `.gitignore` and will never be committed to the repository. Never commit your API keys or anon key to source control.
