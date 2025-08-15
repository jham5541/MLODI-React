# M3LODI Subscription System Guide

## Overview

The M3LODI platform supports two types of subscriptions:

1. **Platform Subscriptions** (like Spotify Premium) - stored in `platform_subscriptions` table
2. **Artist Subscriptions** (like Patreon) - stored in `artist_subscriptions` table

The legacy `user_subscriptions` table should no longer be used directly as it was causing the `artist_name` null constraint error.

## Database Schema

### Platform Subscriptions (`platform_subscriptions`)
- For platform-wide premium features
- Linked to `subscription_plans` table
- Supports tiers: free, fan, superfan
- Metadata stored in JSONB format

### Artist Subscriptions (`artist_subscriptions`)
- For subscribing to individual artists
- Linked to `artists` table via `artist_id`
- Artist-specific benefits and pricing
- Metadata includes artist name, benefits, etc.

### Subscription Plans (`subscription_plans`)
- Pre-defined platform subscription tiers
- Fixed UUIDs for consistency:
  - Free: `00000000-0000-0000-0000-000000000001`
  - Fan: `00000000-0000-0000-0000-000000000002`
  - Superfan: `00000000-0000-0000-0000-000000000003`

## Usage

### Platform Subscription (App-wide Premium)

```typescript
import { useSubscriptionStore } from '@/store/subscriptionStore';

// In your component
const { confirmSubscription, selectedPlan } = useSubscriptionStore();

// User selects a plan and payment method
const success = await confirmSubscription('apple'); // or 'card' or 'eth'
```

### Artist Subscription (Support Individual Artists)

```typescript
import { useArtistSubscriptionStore } from '@/store/artistSubscriptionStore';

// In your component
const { 
  confirmArtistSubscription, 
  selectArtistAndPlan,
  isSubscribedToArtist 
} = useArtistSubscriptionStore();

// Check if subscribed to an artist
const isSubscribed = isSubscribedToArtist(artistId);

// Subscribe to an artist
selectArtistAndPlan({ id: artistId, name: artistName }, plan);
const success = await confirmArtistSubscription('apple');
```

### Using the Unified Service

```typescript
import { subscriptionService } from '@/services/subscriptionService';

// Create platform subscription
await subscriptionService.createPlatformSubscription({
  userId: user.id,
  planId: '00000000-0000-0000-0000-000000000002',
  tier: 'fan',
  price: 9.99,
  paymentMethod: 'apple',
  duration: 30
});

// Create artist subscription
await subscriptionService.createArtistSubscription({
  userId: user.id,
  artistId: artist.id,
  artistName: artist.name,
  price: 9.99,
  paymentMethod: 'apple',
  duration: 30,
  benefits: ['Early access', 'Exclusive content', ...]
});

// Check subscription status
const hasPlatform = await subscriptionService.hasActivePlatformSubscription(userId);
const hasArtist = await subscriptionService.isSubscribedToArtist(userId, artistId);
```

## Migration from Legacy System

If your code was using `user_subscriptions` directly:

1. Determine if it's a platform or artist subscription
2. Use the appropriate table/service:
   - Platform-wide → use `platform_subscriptions`
   - Artist-specific → use `artist_subscriptions`
3. The `subscriptionService.createLegacySubscription()` method provides backward compatibility

## Error Resolution

The original error:
```
"null value in column \"artist_name\" of relation \"user_subscriptions\" violates not-null constraint"
```

Was caused by trying to insert platform subscriptions into a table designed for artist subscriptions. The fix:

1. Made `artist_name` nullable in `user_subscriptions` (temporary fix)
2. Updated code to use the correct tables
3. Added proper validation and error handling

## Security

- Row Level Security (RLS) is enabled on all subscription tables
- Users can only view/modify their own subscriptions
- All users can view active subscription plans
- Transactions are recorded separately for audit trail

## Best Practices

1. Always check subscription status before granting premium features
2. Handle payment failures gracefully
3. Record all transactions for audit purposes
4. Use the appropriate subscription type for your use case
5. Don't directly insert into `user_subscriptions` - use the service methods

## Testing

```bash
# Run subscription tests
npm test -- subscriptionStore.test.ts
npm test -- subscriptionService.test.ts

# Test in development
# 1. Create a test user
# 2. Try platform subscription flow
# 3. Try artist subscription flow
# 4. Verify data in Supabase dashboard
```
