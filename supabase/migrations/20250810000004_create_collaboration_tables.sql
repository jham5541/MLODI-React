-- Create collaboration projects table
create table public.collaboration_projects (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    type text not null check (type in ('song', 'album', 'playlist', 'remix')),
    status text not null check (status in ('active', 'pending', 'completed', 'cancelled')),
    progress integer not null check (progress between 0 and 100),
    description text,
    deadline timestamptz,
    genre text,
    owner_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_activity timestamptz default now()
);

-- Create collaboration roles table
create table public.collaboration_roles (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    created_at timestamptz default now()
);

-- Insert default roles
insert into public.collaboration_roles (name) values
    ('Producer'),
    ('Vocalist'),
    ('Mixing Engineer'),
    ('Mastering Engineer'),
    ('Songwriter'),
    ('Instrumentalist'),
    ('Beat Maker'),
    ('Sound Designer');

-- Create collaborators table
create table public.collaborators (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.collaboration_projects(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role_id uuid references public.collaboration_roles(id) on delete set null,
    status text not null check (status in ('active', 'inactive')),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(project_id, user_id)
);

-- Create collaboration updates table for tracking progress
create table public.collaboration_updates (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.collaboration_projects(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    content text not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.collaboration_projects enable row level security;
alter table public.collaborators enable row level security;
alter table public.collaboration_updates enable row level security;
alter table public.collaboration_roles enable row level security;

-- Allow anyone to read roles
create policy "Anyone can view collaboration roles"
    on public.collaboration_roles for select
    using (true);

-- Create policies
create policy "Users can view their own projects and collaborations"
    on public.collaboration_projects for select
    using (
        owner_id = auth.uid() or
        exists (
            select 1 from public.collaborators
            where project_id = id and user_id = auth.uid()
        )
    );

create policy "Owner can update their projects"
    on public.collaboration_projects for update
    using (owner_id = auth.uid());

create policy "Owner can delete their projects"
    on public.collaboration_projects for delete
    using (owner_id = auth.uid());

create policy "Users can create projects"
    on public.collaboration_projects for insert
    with check (owner_id = auth.uid());

create policy "Anyone can view project collaborators"
    on public.collaborators for select
    using (true);

create policy "Users can view their collaborations"
    on public.collaborators for select
    using (
        user_id = auth.uid() or
        exists (
            select 1 from public.collaboration_projects
            where id = project_id and owner_id = auth.uid()
        )
    );

create policy "Project owner can manage collaborators"
    on public.collaborators for all
    using (
        exists (
            select 1 from public.collaboration_projects
            where id = project_id and owner_id = auth.uid()
        )
    );

create policy "Collaborators can view updates"
    on public.collaboration_updates for select
    using (
        exists (
            select 1 from public.collaboration_projects
            where id = project_id and (
                owner_id = auth.uid() or
                exists (
                    select 1 from public.collaborators
                    where project_id = collaboration_projects.id
                    and user_id = auth.uid()
                )
            )
        )
    );

create policy "Project members can create updates"
    on public.collaboration_updates for insert
    with check (
        auth.uid() = user_id and
        (
            exists (
                select 1 from public.collaboration_projects
                where id = project_id and owner_id = auth.uid()
            ) or
            exists (
                select 1 from public.collaborators
                where project_id = collaboration_updates.project_id
                and user_id = auth.uid()
                and status = 'active'
            )
        )
    );

-- Create function to update last_activity
create or replace function public.update_collaboration_last_activity()
returns trigger
security definer
language plpgsql as $$
begin
    update public.collaboration_projects
    set last_activity = now(),
        updated_at = now()
    where id = new.project_id;
    return new;
end;
$$;

-- Create triggers to update last_activity
create trigger on_collaboration_update
    after insert on public.collaboration_updates
    for each row execute function public.update_collaboration_last_activity();

create trigger on_collaborator_update
    after insert or update on public.collaborators
    for each row execute function public.update_collaboration_last_activity();

-- Add sample data for development (guarded; only runs if users exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users) THEN
    INSERT INTO public.collaboration_projects 
      (title, type, status, progress, description, genre, owner_id)
    VALUES
      (
        'Midnight Vibes Remix',
        'remix',
        'active',
        75,
        'Creating a chill house remix of the original track',
        'House',
        (SELECT id FROM auth.users LIMIT 1)
      ),
      (
        'Future Sounds Album',
        'album',
        'pending',
        25,
        'Collaborative album exploring futuristic electronic sounds',
        'Electronic',
        (SELECT id FROM auth.users LIMIT 1)
      ),
      (
        'Acoustic Sessions',
        'song',
        'completed',
        100,
        'Beautiful acoustic collaboration with guitar accompaniment',
        'Acoustic',
        (SELECT id FROM auth.users LIMIT 1)
      );

    -- Add a few sample collaborators only if we have at least 2 users
    IF (SELECT count(*) FROM auth.users) >= 2 THEN
      WITH first_project AS (
        SELECT id FROM public.collaboration_projects WHERE title = 'Midnight Vibes Remix' LIMIT 1
      ),
      first_user AS (
        SELECT id FROM auth.users OFFSET 1 LIMIT 1
      ),
      vocalist_role AS (
        SELECT id FROM public.collaboration_roles WHERE name = 'Vocalist' LIMIT 1
      )
      INSERT INTO public.collaborators (project_id, user_id, role_id, status)
      SELECT p.id, u.id, r.id, 'active'
      FROM first_project p, first_user u, vocalist_role r;
    END IF;
  END IF;
END
$$;
