import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePlay } from './PlayContext';

interface RadioStation {
  id: string;
  name: string;
  genre: string;
  description: string;
  coverUrl: string;
  isLive?: boolean;
  listeners?: number;
}

interface RadioContextType {
  stationListeners: Record<string, number>;
  userCurrentStation: string | null;
  addListener: (stationId: string) => void;
  removeListener: (stationId: string) => void;
  getListenerCount: (stationId: string) => number;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

interface RadioProviderProps {
  children: ReactNode;
}

export const RadioProvider: React.FC<RadioProviderProps> = ({ children }) => {
  const [stationListeners, setStationListeners] = useState<Record<string, number>>({});
  const [userCurrentStation, setUserCurrentStation] = useState<string | null>(null);
  const { currentSong, isPlaying } = usePlay();

  const addListener = React.useCallback((stationId: string) => {
    setStationListeners(prev => {
      const newCount = (prev[stationId] || 0) + 1;
      console.log('RadioContext: Adding listener to', stationId, 'new count:', newCount);
      return {
        ...prev,
        [stationId]: newCount
      };
    });
  }, []);

  const removeListener = React.useCallback((stationId: string) => {
    setStationListeners(prev => {
      const newCount = Math.max(0, (prev[stationId] || 0) - 1);
      console.log('RadioContext: Removing listener from', stationId, 'new count:', newCount);
      return {
        ...prev,
        [stationId]: newCount
      };
    });
  }, []);

  // Track when user starts/stops playing radio content
  useEffect(() => {
    console.log('RadioContext: Tracking change', {
      currentSong: currentSong?.title,
      isRadio: currentSong?.isRadio,
      isPlaying,
      userCurrentStation
    });

    if (currentSong?.isRadio && isPlaying) {
      // Extract station ID from radio song ID (format: "radio-{stationId}")
      const stationId = currentSong.id.replace('radio-', '');
      console.log('RadioContext: User playing radio station', stationId);
      
      // If user switches to a different radio station
      if (userCurrentStation && userCurrentStation !== stationId) {
        console.log('RadioContext: Switching from station', userCurrentStation, 'to', stationId);
        removeListener(userCurrentStation);
      }
      
      // Add user to new station if not already there
      if (userCurrentStation !== stationId) {
        console.log('RadioContext: Adding listener to station', stationId);
        addListener(stationId);
        setUserCurrentStation(stationId);
      }
    } else if (userCurrentStation && (!currentSong?.isRadio || !isPlaying)) {
      // User stopped playing radio or switched to non-radio content
      console.log('RadioContext: Removing listener from station', userCurrentStation);
      removeListener(userCurrentStation);
      setUserCurrentStation(null);
    }
  }, [currentSong, isPlaying, addListener, removeListener, userCurrentStation]);

  const getListenerCount = (stationId: string) => {
    const count = stationListeners[stationId] || 0;
    console.log('RadioContext: Getting listener count for', stationId, ':', count);
    return count;
  };

  const value: RadioContextType = {
    stationListeners,
    userCurrentStation,
    addListener,
    removeListener,
    getListenerCount,
  };

  return (
    <RadioContext.Provider value={value}>
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = (): RadioContextType => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};
