# M3LODI Database Schema Summary

## ✅ Schema Status: COMPLETE

All required tables and views have been successfully created and configured with Row Level Security (RLS).

## Core Tables

### User Management
- **auth.users** - Supabase auth system users (managed by Supabase)
- **public.users** - Extended user data synchronized with auth.users
- **public.profiles** - User profile information (username, display_name, avatar)
- **public.users_metadata** - Additional user metadata

### Artist & Content
- **public.artists** - Artist profiles and information
- **public.albums** - Music albums
- **public.songs** (view) - Songs/tracks view
- **public.tracks** - Individual music tracks
- **public.videos** - Video content from artists

### Fan Engagement & Rewards
- **public.fan_tiers** - Fan tier levels per artist (Bronze, Silver, Gold, Diamond, Platinum)
- **public.fan_scores** (view) - Aggregated fan scores and rankings
- **public.user_artist_rewards** - Rewards audit trail for artist-specific activities
- **public.user_listening_rewards** - Listening activity rewards tracking

### Commerce & Orders
- **public.products** - Merchandise and digital products
- **public.carts** - Shopping carts
- **public.cart_items** - Items in shopping carts
- **public.orders** - Completed orders
- **public.order_items** - Line items in orders
- **public.merchandise_orders** - Physical merchandise orders
- **public.artist_fan_orders** - Artist-specific view of fan orders

### Events & Tickets
- **public.events** - Live events and concerts
- **public.ticket_purchases** - Ticket purchase records

### Subscriptions
- **public.platform_subscriptions** - Platform-level subscriptions
- **public.artist_subscriptions** - Artist-specific subscriptions
- **public.user_subscriptions** - User subscription records

### Social Features
- **public.user_follows** - User follow relationships
- **public.user_likes** - Content likes
- **public.track_comments** - Comments on tracks
- **public.artist_comments** - Comments on artist profiles
- **public.comment_likes** - Likes on comments

### Playback & Rights
- **public.play_events** - Track play history
- **public.listening_sessions** - Listening session tracking
- **public.song_purchases** - Digital song purchases
- **public.album_purchases** - Digital album purchases
- **public.video_purchases** - Video content purchases

### Collaboration
- **public.collaboration_projects** - Collaborative projects
- **public.collaborators** - Project collaborators
- **public.collaboration_updates** - Project updates

### Messaging
- **public.conversations** - Chat conversations
- **public.conversation_participants** - Conversation members
- **public.messages** - Chat messages

### Transactions
- **public.transactions** - Financial transactions
- **public.user_wallets** - User wallet information

## Key Functions

### Rewards System
- **award_artist_points_once()** - Award points for artist-specific activities (deduped)
- **award_listening_points()** - Award points for listening activities

### Subscription Checks
- **is_platform_subscriber()** - Check platform subscription status
- **is_artist_subscriber()** - Check artist subscription status

### Playback Rights
- **get_playback_rights_for_track()** - Determine track playback permissions
- **get_playback_rights_for_video()** - Determine video playback permissions

## Security Features

✅ **Row Level Security (RLS)** enabled on all sensitive tables
✅ **Foreign key constraints** properly configured
✅ **Indexes** optimized for performance
✅ **Audit trails** for rewards and transactions

## Migration History

The database schema was built through a series of migrations:
1. Core user and artist tables
2. Content management (songs, albums, videos)
3. Commerce and marketplace
4. Fan engagement and rewards system
5. Subscription management
6. Social features and collaboration

## Recent Fixes Applied

1. Created missing core tables (merchandise_orders, fan_tiers, videos, events)
2. Created fan_scores view for leaderboard functionality
3. Established proper foreign key relationships
4. Enabled RLS policies for security

## Notes

- All tables use UUID primary keys for global uniqueness
- Timestamps use `timestamptz` for timezone awareness
- JSONB columns used for flexible metadata storage
- Proper indexes created for query performance
- RLS policies ensure data isolation and security
