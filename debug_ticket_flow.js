// Debug script for ticket purchase and viewing flow
// Run this in your React Native debugger console

// 1. Check if user is authenticated
async function checkAuth() {
  const { supabase } = require('./src/lib/supabase');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user);
  return user;
}

// 2. Check existing ticket purchases
async function checkTicketPurchases(userId) {
  const { supabase } = require('./src/lib/supabase');
  const { data, error } = await supabase
    .from('ticket_purchases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching purchases:', error);
    return;
  }
  
  console.log('Ticket purchases:', data);
  data?.forEach((purchase, index) => {
    console.log(`\n--- Purchase ${index + 1} ---`);
    console.log('Event ID:', purchase.event_id);
    console.log('Venue:', purchase.venue);
    console.log('Quantity:', purchase.quantity);
    console.log('Tickets:', JSON.stringify(purchase.tickets, null, 2));
  });
}

// 3. Test ticket purchase service
async function testTicketPurchase(userId) {
  const { ticketPurchaseService } = require('./src/services/ticketPurchaseService');
  
  try {
    console.log('\nTesting ticket purchase...');
    const result = await ticketPurchaseService.purchaseTicketsWithApplePay({
      showId: '1', // Test with event ID 1
      quantity: 2,
      userId: userId,
      unitPrice: 89.99,
      venue: 'Madison Square Garden',
      city: 'New York, NY',
      date: '2025-09-15',
      artistName: 'Test Artist'
    });
    
    console.log('Purchase result:', result);
    return result;
  } catch (error) {
    console.error('Purchase failed:', error);
  }
}

// 4. Test fetching tickets for show
async function testGetTickets(userId, showId = '1') {
  const { ticketPurchaseService } = require('./src/services/ticketPurchaseService');
  
  try {
    console.log(`\nFetching tickets for show ${showId}...`);
    const tickets = await ticketPurchaseService.getTicketsForShow(showId, userId);
    console.log('Fetched tickets:', tickets);
    return tickets;
  } catch (error) {
    console.error('Error fetching tickets:', error);
  }
}

// 5. Test purchase service methods
async function testPurchaseService(eventId = '1') {
  const { purchaseService } = require('./src/services/purchaseService');
  
  console.log('\nTesting purchaseService methods...');
  
  // Test isTicketPurchased
  const isPurchased = await purchaseService.isTicketPurchased(eventId);
  console.log(`Event ${eventId} purchased:`, isPurchased);
  
  // Test getTicketPurchaseCount
  const count = await purchaseService.getTicketPurchaseCount(eventId);
  console.log(`Ticket count for event ${eventId}:`, count);
}

// Run all tests
async function runAllTests() {
  console.log('=== Starting Ticket Flow Debug ===\n');
  
  const user = await checkAuth();
  if (!user) {
    console.error('No user authenticated. Please sign in first.');
    return;
  }
  
  await checkTicketPurchases(user.id);
  await testGetTickets(user.id);
  await testPurchaseService();
  
  console.log('\n=== Debug Complete ===');
}

// Export functions for console use
window.ticketDebug = {
  checkAuth,
  checkTicketPurchases,
  testTicketPurchase,
  testGetTickets,
  testPurchaseService,
  runAllTests
};

console.log('Ticket debug functions loaded. Use:');
console.log('- ticketDebug.runAllTests() to run all tests');
console.log('- ticketDebug.checkAuth() to check authentication');
console.log('- ticketDebug.testTicketPurchase(userId) to test purchase');
console.log('- ticketDebug.testGetTickets(userId, showId) to test ticket fetching');
