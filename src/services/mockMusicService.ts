import { demoSongs, demoArtists } from '../data/demoMusic';
import { Song, Artist } from './musicService';

class MockMusicService {
  private mockDelay = 500; // Simulate network delay

  private async delay() {
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));
  }

  // Artists
  async getArtists() {
    await this.delay();
    return demoArtists;
  }

  async getArtist(id: string) {
    await this.delay();
    return demoArtists.find(artist => artist.id === id) || null;
  }

  // Songs
  async getSongs() {
    await this.delay();
    return demoSongs;
  }

  async getSong(id: string) {
    await this.delay();
    const song = demoSongs.find(song => song.id === id);
    if (!song) return null;

    const artist = demoArtists.find(artist => artist.id === song.artistId);
    return {
      ...song,
      artist
    };
  }

  async getTrendingSongs(limit = 20) {
    await this.delay();
    return demoSongs.slice(0, limit);
  }

  async getPopularSongs(limit = 20) {
    await this.delay();
    return demoSongs.slice(0, limit);
  }

  async getRecentSongs(limit = 20) {
    await this.delay();
    return demoSongs.slice(0, limit);
  }

  // Likes
  async likeSong(songId: string) {
    await this.delay();
    console.log('Mock like song:', songId);
  }

  async unlikeSong(songId: string) {
    await this.delay();
    console.log('Mock unlike song:', songId);
  }

  async isLiked(songId: string) {
    await this.delay();
    return false; // Default to not liked in demo
  }

  // Play tracking
  async recordPlay(songId: string, durationPlayedMs = 0, completionPercentage = 0) {
    await this.delay();
    console.log('Mock record play:', { songId, durationPlayedMs, completionPercentage });
  }

  // Search
  async searchAll(query: string) {
    await this.delay();
    const results = {
      artists: demoArtists.filter(artist => 
        artist.name.toLowerCase().includes(query.toLowerCase())
      ),
      songs: demoSongs.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
      )
    };
    return results;
  }

  // Recommendations
  async getRecommendations() {
    await this.delay();
    return demoSongs;
  }
}

export const mockMusicService = new MockMusicService();
