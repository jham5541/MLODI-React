import { useState, useEffect } from 'react';
import Web3AuthService from '../services/web3auth';

export const useWeb3Auth = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);

    const web3auth = Web3AuthService.getInstance();

    useEffect(() => {
        initializeWeb3Auth();
    }, []);

    const initializeWeb3Auth = async () => {
        try {
            setIsLoading(true);
            await web3auth.init();
            setIsInitialized(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize Web3Auth');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        try {
            setIsLoading(true);
            await web3auth.login();
            const userAddress = await web3auth.getAddress();
            const userBalance = await web3auth.getBalance();
            setAddress(userAddress);
            setBalance(userBalance);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await web3auth.logout();
            setAddress(null);
            setBalance(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to logout');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isInitialized,
        isLoading,
        error,
        address,
        balance,
        login,
        logout
    };
};
