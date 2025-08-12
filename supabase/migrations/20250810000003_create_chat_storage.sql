-- Enable storage
create extension if not exists "uuid-ossp";

-- Create chat images bucket
insert into storage.buckets (id, name, public, avif_autodetection)
values ('chat-images', 'chat-images', true, false);

-- Set up storage policies
create policy "Chat images are viewable by everyone"
  on storage.objects for select
  using ( bucket_id = 'chat-images' );

create policy "Authenticated users can upload chat images"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-images'
    and auth.role() = 'authenticated'
  );

create policy "Users can update their own chat images"
  on storage.objects for update
  using (
    bucket_id = 'chat-images'
    and auth.uid() = owner
  );

create policy "Users can delete their own chat images"
  on storage.objects for delete
  using (
    bucket_id = 'chat-images'
    and auth.uid() = owner
  );
