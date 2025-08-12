import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import SimpleWalletService from '../services/SimpleWalletService';

export const useWallet = () => {
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0.0');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const walletService = SimpleWalletService.getInstance();
    const { user } = useAuthStore();
    useEffect(() => {
        loadWallet();
    }, []);

    const loadWallet = async () => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            const savedAddress = await walletService.getWalletAddress();
            if (savedAddress) {
                setAddress(savedAddress);
                const balance = await walletService.getBalance(savedAddress);
                setBalance(balance);
            }
        } catch (err) {
            console.error('Error loading wallet:', err);
            setError('Failed to load wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const createWallet = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const newAddress = await walletService.createWallet();
            setAddress(newAddress);
            const balance = await walletService.getBalance(newAddress);
            setBalance(balance);
            return newAddress;
        } catch (err) {
            console.error('Error creating wallet:', err);
            setError('Failed to create wallet');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshBalance = async () => {
        if (!address) return;
        
        try {
            setIsLoading(true);
            const newBalance = await walletService.getBalance(address);
            setBalance(newBalance);
        } catch (err) {
            console.error('Error refreshing balance:', err);
            setError('Failed to refresh balance');
        } finally {
            setIsLoading(false);
        }
    };

    const formatAddress = (addr: string | null): string => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return {
        address,
        formattedAddress: formatAddress(address),
        balance,
        isLoading,
        error,
        createWallet,
        refreshBalance,
    };
};
