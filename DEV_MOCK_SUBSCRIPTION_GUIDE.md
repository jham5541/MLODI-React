# Development Mock Subscription Guide

## 🎭 Overview

Since you're experiencing database permission issues, I've created a mock subscription system that works entirely in memory during development. This allows you to test all subscription features without needing database access.

## 🚀 How to Use

### 1. Start the App in Development Mode
```bash
npm start
# or
expo start
```

### 2. Add the Dev Control Panel
Add this to your Artist Profile screen or any screen where you want to test subscriptions:

```tsx
import { DevSubscriptionPanel } from '../components/dev/DevSubscriptionPanel';

// In your component render:
{__DEV__ && <DevSubscriptionPanel />}
```

### 3. Switch Between Tiers
The dev panel will show three buttons:
- **Free** - No access to engagement metrics
- **Fan** - No access to engagement metrics  
- **Superfan** - Full access to engagement metrics

Tap any button to instantly switch tiers!

## 🧪 Testing Engagement Metrics

1. Navigate to any Artist Profile page
2. Look for the "Engagement Metrics" section
3. Test different scenarios:

### As Free/Fan User:
- You'll see "SUPERFAN" badge
- Lock icon appears
- Tapping shows an upgrade alert
- Metrics are blurred/locked

### As Superfan User:
- No lock icon or badge
- Can tap to expand metrics
- All data is visible
- AI insights are shown

## 📱 What's Mocked

The mock system simulates:
- ✅ Subscription tiers (free, fan, superfan)
- ✅ Subscription status (active, expired, cancelled)
- ✅ Payment methods (card, apple, eth)
- ✅ Auto-renewal settings
- ✅ Expiration dates (30 days from "purchase")

## 🔧 Technical Details

### Mock Store Location
`src/store/mockSubscriptionStore.ts`

### Key Methods:
```typescript
// Change tier programmatically
useMockSubscriptionStore.getState().setMockTier('superfan');

// Get current subscription
const subscription = useMockSubscriptionStore.getState().subscription;

// Check if user has active subscription
const hasActive = useMockSubscriptionStore.getState().hasActiveSubscription();
```

## 🎯 Quick Test Scenarios

### Scenario 1: Upgrade Flow
1. Set tier to "Free"
2. Go to Artist Profile
3. Try to access Engagement Metrics
4. See upgrade prompt

### Scenario 2: Superfan Access
1. Set tier to "Superfan"
2. Go to Artist Profile
3. Access Engagement Metrics
4. View all metrics and AI insights

### Scenario 3: Downgrade
1. Set tier to "Superfan"
2. Access metrics (should work)
3. Change to "Fan"
4. Try again (should be locked)

## 🐛 Troubleshooting

### Metrics still locked as Superfan?
- Make sure you're in development mode (`__DEV__` is true)
- Check console for "🎭 Mock tier set to: superfan" message
- Refresh the screen after changing tiers

### Dev panel not showing?
- Ensure you've added `{__DEV__ && <DevSubscriptionPanel />}` to your screen
- Check that you're running in development mode

### Changes not reflecting?
- The mock store updates immediately
- If components don't update, they might need to re-render
- Try navigating away and back to the screen

## 📝 Notes

- Mock data is stored in memory only
- Changes reset when you restart the app
- Perfect for testing without database setup
- Automatically disabled in production builds

## 🎉 Ready to Test!

You can now test all subscription features without any database permissions. The mock system behaves exactly like the real subscription system, making it perfect for development and testing!
