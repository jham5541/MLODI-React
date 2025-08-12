import { config } from '../config/environment';
import { musicService } from './musicService';
import { mockMusicService } from './mockMusicService';

// Export the appropriate service based on configuration
export const currentMusicService = config.useMockServices ? mockMusicService : musicService;
