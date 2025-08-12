import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_KEY = 'mlodi_wallet';
const RPC_URL = 'https://polygon-rpc.com';

class WalletService {
    private static instance: WalletService;
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet | null = null;

    private constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    }

    public static getInstance(): WalletService {
        if (!WalletService.instance) {
            WalletService.instance = new WalletService();
        }
        return WalletService.instance;
    }

    public async createWallet(): Promise<{ address: string; privateKey: string }> {
        try {
            // Create a new random wallet
            const randomWallet = ethers.Wallet.createRandom();
            this.wallet = randomWallet.connect(this.provider);

            // Save wallet info securely
            await this.saveWalletInfo(this.wallet.address, this.wallet.privateKey);

            return {
                address: this.wallet.address,
                privateKey: this.wallet.privateKey,
            };
        } catch (error) {
            console.error('Error creating wallet:', error);
            throw error;
        }
    }

    public async loadWallet(): Promise<string | null> {
        try {
            const walletInfo = await AsyncStorage.getItem(WALLET_KEY);
            if (walletInfo) {
                const { privateKey } = JSON.parse(walletInfo);
                this.wallet = new ethers.Wallet(privateKey, this.provider);
                return this.wallet.address;
            }
            return null;
        } catch (error) {
            console.error('Error loading wallet:', error);
            return null;
        }
    }

    public async getBalance(address: string): Promise<string> {
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0.0';
        }
    }

    private async saveWalletInfo(address: string, privateKey: string): Promise<void> {
        try {
            await AsyncStorage.setItem(
                WALLET_KEY,
                JSON.stringify({
                    address,
                    privateKey,
                })
            );
        } catch (error) {
            console.error('Error saving wallet info:', error);
            throw error;
        }
    }
}

export default WalletService;
