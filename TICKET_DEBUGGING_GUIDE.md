# Ticket Purchase and QR Code Viewing - Debugging Guide

## Overview
This guide helps troubleshoot issues with ticket purchasing and QR code viewing in the M3lodi mobile app.

## Common Issues and Solutions

### 1. QR Code Modal Not Opening After Purchase

**Problem**: After purchasing tickets, the QR code modal doesn't appear.

**Solution Applied**: 
- Modified `TicketPurchaseModal.tsx` to properly sequence modal operations
- Added a 300ms delay between closing purchase modal and opening QR modal
- This prevents React Native's modal conflicts

### 2. "View Tickets" Button Not Working

**Problem**: The "View Tickets" button shows but clicking it doesn't open the QR modal.

**Solution Applied**:
- Updated `TourDates.tsx` to fetch tickets from database instead of local memory
- Added proper async handling for ticket fetching
- Implemented error handling with user-friendly alerts

### 3. Permission Denied on user_library Table

**Problem**: Database throws permission errors when accessing user_library.

**Solution Applied**:
- Added proper RLS policies for user_library table
- Granted necessary permissions to authenticated role
- See `fix_ticket_purchases.sql` for the complete fix

## Database Structure

### ticket_purchases Table
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- event_id (text)
- event_name (text)
- artist_name (text)
- venue (text)
- event_date (text)
- quantity (integer)
- total_price (numeric)
- purchase_date (timestamp)
- payment_method (text)
- tickets (jsonb) -- Array of ticket objects
- transaction_hash (text, optional)
```

### Ticket Object Structure (in JSONB)
```json
{
  "id": "TICKET-xxx",
  "qrCode": "QR-xxx-timestamp",
  "status": "valid",
  "seatInfo": "General Admission"
}
```

## Testing Steps

### 1. Test Ticket Purchase
```javascript
// In the app:
1. Navigate to an artist page
2. Go to Tour Dates section
3. Click "Buy Now" on any event
4. Select quantity (max 2)
5. Complete purchase with Apple Pay
6. QR modal should appear immediately
```

### 2. Test View Tickets
```javascript
// After purchase:
1. The "Buy Now" button should change to "View Tickets"
2. Click "View Tickets"
3. QR modal should open with your tickets
```

### 3. Database Verification
```sql
-- Run this query to check your purchases:
SELECT * FROM ticket_purchases 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
ORDER BY created_at DESC;
```

## Debugging Console Logs

The following console logs have been added for debugging:

1. **TicketPurchaseModal.tsx**:
   - "Fetched tickets after purchase:" - Shows tickets retrieved
   - "Error fetching tickets after purchase:" - Shows fetch errors

2. **TourDates.tsx**:
   - "Fetched tickets for viewing:" - Shows tickets when View Tickets clicked

## Common Error Messages and Fixes

### "No Tickets Found"
- Check if tickets exist in database using the SQL query above
- Ensure user is authenticated
- Verify event_id matches between purchase and retrieval

### "Failed to load tickets"
- Check database connection
- Verify RLS policies are correct
- Check if user has permission to read ticket_purchases

### Modal Doesn't Appear
- Check React Native console for errors
- Ensure modals aren't conflicting (only one modal at a time)
- Verify ticket data structure matches expected format

## Code Flow

### Purchase Flow:
1. User clicks "Buy Now" → `TicketPurchaseModal` opens
2. User selects quantity and payment method
3. `ticketPurchaseService.purchaseTicketsWithApplePay()` creates purchase
4. Purchase modal closes
5. After 300ms delay, tickets are fetched
6. `onTicketsReady` callback opens QR modal

### View Flow:
1. User clicks "View Tickets" → `handleViewTickets` in TourDates
2. `ticketPurchaseService.getTicketsForShow()` fetches from database
3. Tickets formatted for display
4. `TicketViewModal` opens with ticket data

## Troubleshooting Checklist

- [ ] User is signed in
- [ ] Database migrations applied successfully
- [ ] RLS policies are enabled and correct
- [ ] Event IDs match between components
- [ ] Ticket data structure is correct in database
- [ ] No JavaScript errors in console
- [ ] Only one modal open at a time
- [ ] Proper error handling in place

## Additional Resources

- See `test_ticket_viewing.sql` for database testing queries
- Check `fix_ticket_purchases.sql` for complete database setup
- Review component files for inline documentation
