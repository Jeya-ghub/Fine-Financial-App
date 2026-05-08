# Fine Finance Tracker - Developer Guide

## Build & Dev Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint

## Architecture Guidelines
- **Project Structure**:
  - `src/app/actions`: Server Actions (Supabase mutations)
  - `src/app/dashboard`: Main dashboard views
  - `src/app/dashboard/components`: Shared dashboard UI
  - `src/lib/supabase`: Supabase clients (client/server/admin)
- **Styling**: Tailwind CSS v4. Config is inline in `src/app/globals.css` via `@theme`.
- **Database**: Use Supabase. Schema is managed in `supabase/`.
- **Versioning**: All transactions require `version_no` for optimistic locking.

## Design Patterns
- **Glassmorphism**: Use `mica-effect` class.
- **Bento Cards**: Use `rounded-[2.5rem]`, `p-8`, and `border border-white/5`.
- **Animations**: Prefer `framer-motion` for transitions.
- **Form Handling**: Use Server Actions with optimistic updates for a "Zero-Lag" feel.
