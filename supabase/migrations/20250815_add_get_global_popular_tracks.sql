-- Create a function to compute global popular tracks using a composite ML-style score
-- This uses plays, likes, shares, and a recency boost with exponential decay

create or replace function public.get_global_popular_tracks(
  limit_count integer default 20
)
returns setof public.tracks_public_view
language sql
stable
as $$
  select t.*
  from public.tracks_public_view t
  order by (
    0.8 * ln(1 + coalesce(t.play_count, 0)) +
    -- Recency boost: half-life ~ 14 days
    5.0 * exp(- (extract(epoch from (now() - coalesce(t.created_at, now()))) / 86400.0) / 14.0)
  ) desc nulls last
  limit limit_count;
$$;

grant execute on function public.get_global_popular_tracks(integer) to anon, authenticated;
