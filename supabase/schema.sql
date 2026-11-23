-- Office state. The UI reads these; Claude Code writes them.
create table if not exists office_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  subject text,
  body text,
  assignee text,
  status text not null default 'queued'
    check (status in ('queued','in_progress','awaiting_review','awaiting_approval','done','blocked')),
  priority int default 3,
  deadline timestamptz,
  last_message text,
  next_action text,
  result jsonb
);

create table if not exists office_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  from_whom text,             -- 'owner' | '<employee-slug>' | 'om'
  to_whom text,
  task_id uuid references office_tasks(id) on delete cascade,
  body text
);

create table if not exists office_approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  task_id uuid references office_tasks(id) on delete cascade,
  ask text not null,
  recommendation text,        -- approve | reject | revise
  rationale text,
  default_if_silent text,
  decided_at timestamptz,
  decision text               -- approved | rejected | revised
);

create index if not exists office_tasks_status_idx on office_tasks (status);
create index if not exists office_messages_task_idx on office_messages (task_id, created_at);

-- Row-level security: the UI uses an anon key, so lock it down before going live.
alter table office_tasks enable row level security;
alter table office_messages enable row level security;
alter table office_approvals enable row level security;
-- TODO: add policies for the owner's authenticated user before exposing the UI.
