import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoSongs, demoArtists } from '../data/demoMusic';

class MockDatabaseService {
  private async getStorageData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  }

  private async setStorageData(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  }

  // Listening Sessions
  async createListeningSession(userId: string, songId: string): Promise<any> {
    const sessions = await this.getStorageData('listening_sessions') || [];
    const newSession = {
      id: `session_${Date.now()}`,
      userId,
      songId,
      startTime: new Date().toISOString(),
      endTime: null,
      completed: false
    };
    sessions.push(newSession);
    await this.setStorageData('listening_sessions', sessions);
    return newSession;
  }

  async updateListeningSession(sessionId: string, data: any): Promise<void> {
    const sessions = await this.getStorageData('listening_sessions') || [];
    const sessionIndex = sessions.findIndex((s: any) => s.id === sessionId);
    if (sessionIndex >= 0) {
      sessions[sessionIndex] = { ...sessions[sessionIndex], ...data };
      await this.setStorageData('listening_sessions', sessions);
    }
  }

  // Songs
  async getSongs(): Promise<any[]> {
    return demoSongs;
  }

  async getSongById(id: string): Promise<any> {
    return demoSongs.find(song => song.id === id);
  }

  // Artists
  async getArtists(): Promise<any[]> {
    return demoArtists;
  }

  async getArtistById(id: string): Promise<any> {
    return demoArtists.find(artist => artist.id === id);
  }

  // Play History
  async recordPlay(userId: string, songId: string, duration: number): Promise<void> {
    const history = await this.getStorageData('play_history') || [];
    history.push({
      id: `play_${Date.now()}`,
      userId,
      songId,
      timestamp: new Date().toISOString(),
      duration
    });
    await this.setStorageData('play_history', history);
  }

  // Likes
  async likeSong(userId: string, songId: string): Promise<void> {
    const likes = await this.getStorageData('likes') || [];
    if (!likes.some((like: any) => like.userId === userId && like.songId === songId)) {
      likes.push({
        userId,
        songId,
        timestamp: new Date().toISOString()
      });
      await this.setStorageData('likes', likes);
    }
  }

  async unlikeSong(userId: string, songId: string): Promise<void> {
    const likes = await this.getStorageData('likes') || [];
    const filteredLikes = likes.filter(
      (like: any) => !(like.userId === userId && like.songId === songId)
    );
    await this.setStorageData('likes', filteredLikes);
  }

  async isLiked(userId: string, songId: string): Promise<boolean> {
    const likes = await this.getStorageData('likes') || [];
    return likes.some((like: any) => like.userId === userId && like.songId === songId);
  }

  // User
  async getCurrentUser(): Promise<any> {
    return {
      id: 'demo_user',
      name: 'Demo User',
      email: 'demo@example.com'
    };
  }

  // Initialize demo data
  async initializeDemoData(): Promise<void> {
    // Only initialize if data doesn't exist
    const existingData = await this.getStorageData('initialized');
    if (!existingData) {
      await this.setStorageData('songs', demoSongs);
      await this.setStorageData('artists', demoArtists);
      await this.setStorageData('initialized', true);
      console.log('Demo data initialized');
    }
  }
}

export const mockDatabaseService = new MockDatabaseService();
