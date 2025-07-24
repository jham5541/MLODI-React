import React, { createContext, useContext, useEffect, useState } from 'react';
import { createConfig, configureChains, mainnet } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { WagmiConfig, useAccount, useConnect, useDisconnect } from 'wagmi';
import { walletConnectConnector } from '@web3modal/wagmi-react-native';

interface Web3ContextType {
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType | null>(null);

const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing WalletConnect Project ID');
}

const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors: [
    walletConnectConnector({
      chains,
      options: {
        projectId,
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'auto',
        },
      },
    }),
  ],
});

function Web3ContextProvider({ children }: { children: React.ReactNode }) {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { connect, isLoading: isConnecting, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setAddress(wagmiAddress ?? null);
    setIsConnected(wagmiConnected);
  }, [wagmiAddress, wagmiConnected]);

  const connectWallet = async () => {
    try {
      const walletConnectConnector = connectors.find(
        (connector) => connector.id === 'walletConnect'
      );
      
      if (!walletConnectConnector) {
        throw new Error('WalletConnect connector not found');
      }
      
      await connect({ connector: walletConnectConnector });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setAddress(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setAddress(null);
      setIsConnected(false);
    }
  };

  const value = {
    address,
    connectWallet,
    disconnect: handleDisconnect,
    isConnecting,
    isConnected,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <Web3ContextProvider>{children}</Web3ContextProvider>
    </WagmiConfig>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}