import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { formatEther } from '@ethersproject/units';

const WALLET_STORAGE_KEY = 'mlodi_wallet_key';
const POLYGON_RPC = 'https://polygon-rpc.com';

class SimpleWalletService {
    private static instance: SimpleWalletService;
    private provider: JsonRpcProvider;

    private constructor() {
        this.provider = new JsonRpcProvider(POLYGON_RPC);
    }

    public static getInstance(): SimpleWalletService {
        if (!SimpleWalletService.instance) {
            SimpleWalletService.instance = new SimpleWalletService();
        }
        return SimpleWalletService.instance;
    }

    async createWallet(): Promise<string> {
        try {
            // Generate new wallet
            const wallet = Wallet.createRandom();
            
            // Save private key
            await AsyncStorage.setItem(WALLET_STORAGE_KEY, wallet.privateKey);
            
            return wallet.address;
        } catch (error) {
            console.error('Error creating wallet:', error);
            throw new Error('Failed to create wallet');
        }
    }

    async getWalletAddress(): Promise<string | null> {
        try {
            const privateKey = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
            if (!privateKey) return null;
            
            const wallet = new Wallet(privateKey);
            return wallet.address;
        } catch (error) {
            console.error('Error getting wallet address:', error);
            return null;
        }
    }

    async getBalance(address: string): Promise<string> {
        try {
            const balance = await this.provider.getBalance(address);
            return formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0.0';
        }
    }
}

export default SimpleWalletService;
