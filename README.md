# AI Publishing Studio

A modern authentication system for an AI-powered publishing platform, built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication** — Email/password login and signup via Supabase Auth
- **Session persistence** — Secure cookie-based sessions with automatic refresh
- **Protected routes** — Middleware guards `/dashboard` and redirects authenticated users away from auth pages
- **Dashboard** — Welcome message, total books, and recent book cards
- **Book Creation** — Create drafts or active book projects at `/dashboard/new-book`
- **Modern UI** — Dark theme, glassmorphism cards, purple/blue accents, smooth animations

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy your Project URL and anon public key
3. Copy the environment template:

```bash
cp .env.local.example .env.local
```

4. Fill in your Supabase credentials in `.env.local`

### 3. Run the database schema

In the Supabase **SQL Editor**, run the contents of `supabase/schema.sql` to create tables, RLS policies, and the auto-profile trigger.

### 4. Configure Supabase Auth (optional)

In **Authentication → URL Configuration**, set:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

For email confirmation, configure SMTP or disable "Confirm email" under **Authentication → Providers → Email** during development.

### 5. Start the dev server

```bash
npm run dev
```

If styles look broken (plain white/black page), run a clean restart:

```bash
npm run dev:clean
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── auth/callback/route.ts
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── auth/
│   │   ├── auth-card.tsx
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── password-input.tsx
│   │   └── forgot-password-form.tsx
│   └── dashboard/
│       ├── dashboard-header.tsx
│       ├── stat-card.tsx
│       └── recent-projects.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── dashboard/stats.ts
│   ├── validations/auth.ts
│   └── utils.ts
└── middleware.ts
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/dashboard` or `/login` |
| `/login` | Sign in page |
| `/signup` | Create account page |
| `/forgot-password` | Password reset request |
| `/dashboard` | Protected dashboard with book stats and recent books |
| `/dashboard/new-book` | Create a new book project |
| `/dashboard/book/[id]` | View an individual book project |

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Zod](https://zod.dev/) for form validation
