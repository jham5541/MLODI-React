import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

interface Web3ContextType {
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
  isInitialized: boolean;
}

const Web3Context = createContext<Web3ContextType | null>(null);

// Mock Web3 Provider for Expo Go compatibility
function Web3ContextProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    Alert.alert(
      'Expo Go Limitation', 
      'Web3 wallet functionality is not available in Expo Go. Please build a development client to test wallet features.',
      [{ text: 'OK', onPress: () => setIsConnecting(false) }]
    );
  };

  const handleDisconnect = async () => {
    setAddress(null);
    setIsConnected(false);
  };

  const value = {
    address,
    connectWallet,
    disconnect: handleDisconnect,
    isConnecting,
    isConnected,
    isInitialized,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <Web3ContextProvider>{children}</Web3ContextProvider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}