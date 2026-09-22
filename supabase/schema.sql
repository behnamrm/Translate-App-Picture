-- WortBlick database schema.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Users live in Supabase's built-in auth.users table (email/password sign-up).

-- ---------------------------------------------------------------------------
-- Flashcards (Leitner system)
-- ---------------------------------------------------------------------------
create table if not exists public.flashcards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  german_word         text not null,
  -- Storage path of the scanned photo in the private "context-images" bucket (optional).
  context_image_url   text,
  persian_translation text not null,
  german_explanation  text not null,
  leitner_box         int  not null default 1 check (leitner_box between 1 and 5),
  -- New cards are due immediately; after each review the app schedules the next date
  -- by box: 1 → 1 day, 2 → 3 days, 3 → 7 days, 4 → 14 days, 5 → 30 days.
  next_review_date    timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  unique (user_id, german_word)
);

create index if not exists flashcards_user_due_idx
  on public.flashcards (user_id, next_review_date);

alter table public.flashcards enable row level security;

drop policy if exists "Users can read their own flashcards" on public.flashcards;
create policy "Users can read their own flashcards"
  on public.flashcards for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own flashcards" on public.flashcards;
create policy "Users can add their own flashcards"
  on public.flashcards for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own flashcards" on public.flashcards;
create policy "Users can update their own flashcards"
  on public.flashcards for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own flashcards" on public.flashcards;
create policy "Users can delete their own flashcards"
  on public.flashcards for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Storage for context images: private bucket, one folder per user ({user_id}/...).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('context-images', 'context-images', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own context images" on storage.objects;
create policy "Users can upload their own context images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'context-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can read their own context images" on storage.objects;
create policy "Users can read their own context images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'context-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own context images" on storage.objects;
create policy "Users can delete their own context images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'context-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
