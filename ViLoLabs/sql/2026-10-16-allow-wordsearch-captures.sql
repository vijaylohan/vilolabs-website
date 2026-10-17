-- 2026-10-16 — allow Find the Word (word search) sheets in the Google Images gallery.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run. It only widens the list of allowed sheet types; no rows are changed.

-- 1) remove the old activity rule (whatever its name is)
do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.captured_worksheets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%activity%'
  loop
    execute format('alter table public.captured_worksheets drop constraint %I', r.conname);
  end loop;
end $$;

-- 2) add it back with 'wordsearch' included (must match ALLOWED in functions/api/capture.js)
alter table public.captured_worksheets
  add constraint captured_worksheets_activity_check
  check (activity in ('colouring', 'maze', 'sudoku', 'worksheet', 'math', 'wordsearch'));

-- 3) check: should show the new rule with 'wordsearch' in it
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.captured_worksheets'::regclass and contype = 'c';
