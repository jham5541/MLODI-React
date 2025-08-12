import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePlay } from './PlayContext';
import { databaseService } from '../services/databaseServiceProvider';

interface PlaySession {
  songId: string;
  artistId: string;
  type: 'song' | 'video';
  duration: number;
  startTime: number;
  currentProgress: number;
  hasCountedPlay: boolean;
}

interface ArtistPlayStats {
  totalPlays: number;
  songPlays: number;
  videoPlays: number;
  uniqueListeners: Set<string>;
}

interface PlayTrackingContextType {
  artistPlayStats: Record<string, ArtistPlayStats>;
  currentSession: PlaySession | null;
  updateProgress: (progress: number) => Promise<void>;
  getArtistTotalPlays: (artistId: string) => number;
  getArtistSongPlays: (artistId: string) => number;
  getArtistVideoPlays: (artistId: string) => number;
}

const PlayTrackingContext = createContext<PlayTrackingContextType | undefined>(undefined);

interface PlayTrackingProviderProps {
  children: ReactNode;
}

export const PlayTrackingProvider: React.FC<PlayTrackingProviderProps> = ({ children }) => {
  const [artistPlayStats, setArtistPlayStats] = useState<Record<string, ArtistPlayStats>>({});
  const [currentSession, setCurrentSession] = useState<PlaySession | null>(null);
  const { currentSong, isPlaying } = usePlay();

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user123';

  // Start new play session when song changes
  useEffect(() => {
    if (currentSong && isPlaying && !currentSong.isRadio) {
      console.log('PlayTracking: Starting new play session for', currentSong.title);
      
      const newSession: PlaySession = {
        songId: currentSong.id,
        artistId: currentSong.artistId,
        type: currentSong.id.includes('video') ? 'video' : 'song', // Simple check for video content
        duration: currentSong.duration,
        startTime: Date.now(),
        currentProgress: 0,
        hasCountedPlay: false,
      };

      setCurrentSession(newSession);

      // Initialize artist stats if not exists
      setArtistPlayStats(prev => {
        if (!prev[currentSong.artistId]) {
          return {
            ...prev,
            [currentSong.artistId]: {
              totalPlays: 0,
              songPlays: 0,
              videoPlays: 0,
              uniqueListeners: new Set(),
            }
          };
        }
        return prev;
      });
    } else if (!currentSong || !isPlaying) {
      // End current session
      setCurrentSession(null);
    }
  }, [currentSong, isPlaying]);

  const updateProgress = async (progress: number) => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession, currentProgress: progress };
    setCurrentSession(updatedSession);

    // Check if 50% threshold is reached and play hasn't been counted yet
    const progressPercentage = (progress / currentSession.duration) * 100;
    
    if (progressPercentage >= 50 && !currentSession.hasCountedPlay) {
      console.log('PlayTracking: 50% threshold reached, counting play for', currentSession.songId);
      
      // Record the play in the database
      try {
        await databaseService.recordPlay(userId, currentSession.songId, progress);
        console.log('PlayTracking: Play recorded in database');
      } catch (error) {
        console.error('PlayTracking: Failed to record play:', error);
      }
      
      // Mark session as counted
      updatedSession.hasCountedPlay = true;
      setCurrentSession(updatedSession);

      // Update artist play stats
      setArtistPlayStats(prev => {
        const artistStats = prev[currentSession.artistId] || {
          totalPlays: 0,
          songPlays: 0,
          videoPlays: 0,
          uniqueListeners: new Set(),
        };

        const newUniqueListeners = new Set(artistStats.uniqueListeners);
        newUniqueListeners.add(userId);

        const updatedStats = {
          ...artistStats,
          totalPlays: artistStats.totalPlays + 1,
          songPlays: currentSession.type === 'song' ? artistStats.songPlays + 1 : artistStats.songPlays,
          videoPlays: currentSession.type === 'video' ? artistStats.videoPlays + 1 : artistStats.videoPlays,
          uniqueListeners: newUniqueListeners,
        };

        console.log('PlayTracking: Updated stats for artist', currentSession.artistId, updatedStats);

        return {
          ...prev,
          [currentSession.artistId]: updatedStats,
        };
      });
    }
  };

  const getArtistTotalPlays = (artistId: string): number => {
    return artistPlayStats[artistId]?.totalPlays || 0;
  };

  const getArtistSongPlays = (artistId: string): number => {
    return artistPlayStats[artistId]?.songPlays || 0;
  };

  const getArtistVideoPlays = (artistId: string): number => {
    return artistPlayStats[artistId]?.videoPlays || 0;
  };

  const value: PlayTrackingContextType = {
    artistPlayStats,
    currentSession,
    updateProgress,
    getArtistTotalPlays,
    getArtistSongPlays,
    getArtistVideoPlays,
  };

  return (
    <PlayTrackingContext.Provider value={value}>
      {children}
    </PlayTrackingContext.Provider>
  );
};

export const usePlayTracking = (): PlayTrackingContextType => {
  const context = useContext(PlayTrackingContext);
  if (!context) {
    throw new Error('usePlayTracking must be used within a PlayTrackingProvider');
  }
  return context;
};
