-- Drop existing schema and recreate
drop schema if exists public cascade;
create schema public;

-- Configure access
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Create core tables
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    display_name text,
    email text,
    avatar_url text,
    onboarding_completed boolean default false,
    onboarding_step text default 'welcome',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint username_length check (char_length(username) >= 3)
);

create table public.user_settings (
    user_id uuid references public.profiles(id) on delete cascade primary key,
    notification_preferences jsonb default '{}'::jsonb,
    audio_quality text default 'auto',
    download_quality text default 'normal',
    crossfade_enabled boolean default false,
    crossfade_duration int default 0,
    gapless_playback boolean default true,
    volume_normalization boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.playlists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    name text not null,
    description text,
    is_public boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create tracks table
create table public.tracks (
    id uuid default gen_random_uuid() primary key,
    artist_id uuid references public.profiles(id) on delete cascade,
    title text not null,
    description text,
    duration int not null,
    audio_url text,
    cover_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create track reactions table
create table public.track_reactions (
    id uuid default gen_random_uuid() primary key,
    track_id uuid references public.tracks(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    reaction_type text not null,
    created_at timestamptz default now(),
    unique(track_id, user_id, reaction_type)
);

-- Create track comments table
create table public.track_comments (
    id uuid default gen_random_uuid() primary key,
    track_id uuid references public.tracks(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    content text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create user follows table
create table public.user_follows (
    follower_id uuid references public.profiles(id) on delete cascade,
    followed_id uuid references public.profiles(id) on delete cascade,
    created_at timestamptz default now(),
    primary key (follower_id, followed_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.playlists enable row level security;
alter table public.tracks enable row level security;
alter table public.track_reactions enable row level security;
alter table public.track_comments enable row level security;
alter table public.user_follows enable row level security;

-- Create RLS policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select using (true);

create policy "Users can update their own profile"
    on public.profiles for update using (auth.uid() = id);

create policy "Users can view their own settings"
    on public.user_settings for select using (auth.uid() = user_id);

create policy "Users can update their own settings"
    on public.user_settings for update using (auth.uid() = user_id);

create policy "Users can view public playlists"
    on public.playlists for select using (is_public or auth.uid() = user_id);

create policy "Users can insert own playlists"
    on public.playlists for insert with check (auth.uid() = user_id);

create policy "Users can update own playlists"
    on public.playlists for update using (auth.uid() = user_id);

create policy "Users can delete own playlists"
    on public.playlists for delete using (auth.uid() = user_id);

create policy "Users can view any track"
    on public.tracks for select using (true);

create policy "Artists can manage own tracks"
    on public.tracks for all using (auth.uid() = artist_id);

create policy "Users can react to tracks"
    on public.track_reactions for all using (auth.uid() = user_id);

create policy "Users can comment on tracks"
    on public.track_comments for all using (auth.uid() = user_id);

create policy "Users can manage follows"
    on public.user_follows for all using (auth.uid() = follower_id);

-- Create triggers and functions
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
language plpgsql
as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email);
    
    insert into public.user_settings (user_id)
    values (new.id);
    
    insert into public.playlists (user_id, name, is_public)
    values
        (new.id, 'Favorites', false),
        (new.id, 'Recently Played', false);
    
    return new;
end;
$$;

-- Create trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Create function to get track reaction counts
create or replace function public.get_track_reaction_counts(track_uuid uuid)
returns table (reaction_type text, count bigint)
language sql
security invoker
as $$
    select reaction_type, count(*)
    from track_reactions
    where track_id = track_uuid
    group by reaction_type;
$$;

-- Create publication for realtime features
drop publication if exists supabase_realtime;
create publication supabase_realtime;

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.tracks;
alter publication supabase_realtime add table public.track_reactions;
alter publication supabase_realtime add table public.track_comments;
