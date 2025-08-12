// Web3Auth imports temporarily removed

class Web3AuthService {
    private static instance: Web3AuthService;
    private constructor() {}

    public static getInstance(): Web3AuthService {
        if (!Web3AuthService.instance) {
            Web3AuthService.instance = new Web3AuthService();
        }
        return Web3AuthService.instance;
    }

    // Temporarily disabled Web3Auth
    public async init() {
        console.log('Web3Auth temporarily disabled');
        return;
    }

    public async login() {
        console.log('Web3Auth temporarily disabled');
        return { 
            address: null,
            message: 'Web3Auth temporarily disabled'
        };
    }

    public async logout() {
        console.log('Web3Auth temporarily disabled');
        return;
    }

    public async getAddress(): Promise<string> {
        console.log('Web3Auth temporarily disabled');
        return '0x0000000000000000000000000000000000000000';
    }

    public async getBalance(): Promise<string> {
        console.log('Web3Auth temporarily disabled');
        return '0';  // Return zero balance
    }
}
