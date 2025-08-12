import { config } from '../config/environment';
import { mockDatabaseService } from './mockDatabaseService';

// Export the appropriate service based on configuration
export const databaseService = config.useMockServices ? mockDatabaseService : mockDatabaseService; // For now, always use mock service

// Initialize demo data when in development mode
if (config.useMockServices) {
  mockDatabaseService.initializeDemoData().catch(console.error);
}
