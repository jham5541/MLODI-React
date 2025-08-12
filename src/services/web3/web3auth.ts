import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/env';

class Web3AuthService {
    private static instance: Web3AuthService;
    private provider: ethers.providers.Web3Provider | null = null;
    private signer: ethers.Signer | null = null;

    private constructor() {}

    public static getInstance(): Web3AuthService {
        if (!Web3AuthService.instance) {
            Web3AuthService.instance = new Web3AuthService();
        }
        return Web3AuthService.instance;
    }

    public async init() {
        try {
            // For demo purposes, use a default provider
            this.provider = new ethers.providers.JsonRpcProvider(config.ETHEREUM_RPC_URL);
            this.signer = this.provider.getSigner();
        } catch (error) {
            console.error('Error initializing Web3Auth:', error);
            throw error;
        }
    }

    public async getProvider(): Promise<ethers.providers.Web3Provider | null> {
        if (!this.provider) {
            await this.init();
        }
        return this.provider;
    }

    public async getAddress(): Promise<string> {
        try {
            if (!this.signer) {
                await this.init();
            }
            // For demo purposes, return a sample address
            return "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        } catch (error) {
            console.error('Error getting address:', error);
            throw error;
        }
    }

    public async getBalance(): Promise<string> {
        try {
            if (!this.provider || !this.signer) {
                await this.init();
            }
            const address = await this.getAddress();
            const balance = await this.provider!.getBalance(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            throw error;
        }
    }
}

export default Web3AuthService;
