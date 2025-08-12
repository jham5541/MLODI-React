-- Create chat tables
create table IF NOT EXISTS public.conversations (
    id uuid default gen_random_uuid() primary key,
    title text,
    is_group boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table IF NOT EXISTS public.conversation_participants (
    conversation_id uuid references public.conversations(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    last_read_at timestamptz default now(),
    created_at timestamptz default now(),
    primary key (conversation_id, user_id)
);

create table IF NOT EXISTS public.messages (
    id uuid default gen_random_uuid() primary key,
    conversation_id uuid references public.conversations(id) on delete cascade,
    sender_id uuid references public.profiles(id) on delete cascade,
    content text not null,
    type text default 'text', -- can be 'text', 'image', 'audio', etc.
    metadata jsonb default '{}'::jsonb,
    is_deleted boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Create RLS policies (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can view conversations they are part of'
  ) THEN
    CREATE POLICY "Users can view conversations they are part of"
      ON public.conversations
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can create conversations'
  ) THEN
    CREATE POLICY "Users can create conversations"
      ON public.conversations
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can update conversations they are part of'
  ) THEN
    CREATE POLICY "Users can update conversations they are part of"
      ON public.conversations
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'Users can view conversation participants for their conversations'
  ) THEN
    CREATE POLICY "Users can view conversation participants for their conversations"
      ON public.conversation_participants
      FOR SELECT
      USING (
        user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = conversation_participants.conversation_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'Users can manage conversation participants'
  ) THEN
    CREATE POLICY "Users can manage conversation participants"
      ON public.conversation_participants
      FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can view messages in their conversations'
  ) THEN
    CREATE POLICY "Users can view messages in their conversations"
      ON public.messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = messages.conversation_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can send messages to conversations they are part of'
  ) THEN
    CREATE POLICY "Users can send messages to conversations they are part of"
      ON public.messages
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = messages.conversation_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can update their own messages'
  ) THEN
    CREATE POLICY "Users can update their own messages"
      ON public.messages
      FOR UPDATE
      USING (sender_id = auth.uid());
  END IF;
END $$;

-- Helper functions
create or replace function public.get_or_create_direct_conversation(user1_id uuid, user2_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
    conv_id uuid;
begin
    -- Check if a direct conversation already exists between these users
    select c.id into conv_id
    from public.conversations c
    join public.conversation_participants p1 on c.id = p1.conversation_id
    join public.conversation_participants p2 on c.id = p2.conversation_id
    where not c.is_group
    and ((p1.user_id = user1_id and p2.user_id = user2_id)
    or (p1.user_id = user2_id and p2.user_id = user1_id))
    limit 1;

    -- If no conversation exists, create one
    if conv_id is null then
        -- Create new conversation
        insert into public.conversations (is_group)
        values (false)
        returning id into conv_id;

        -- Add participants
        insert into public.conversation_participants (conversation_id, user_id)
        values
            (conv_id, user1_id),
            (conv_id, user2_id);
    end if;

    return conv_id;
end;
$$;

-- Add tables to realtime publication
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
