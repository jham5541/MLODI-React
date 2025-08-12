import { ethers } from 'ethers';
import Web3AuthService from './web3auth';

// ABI for NFT contract (this is a simplified version, replace with your actual contract ABI)
const NFT_CONTRACT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

class NFTService {
  private static instance: NFTService;
  private web3auth: Web3AuthService;
  private nftContract: ethers.Contract | null = null;
  
  private constructor() {
    this.web3auth = Web3AuthService.getInstance();
  }
  
  public static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }
  
  private async initializeContract() {
    try {
      if (!this.nftContract) {
        const provider = await this.web3auth.getProvider();
        if (!provider) throw new Error('Provider not initialized');
        
        // Replace with your actual NFT contract address
        const NFT_CONTRACT_ADDRESS = '0x...';
        
        this.nftContract = new ethers.Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          provider
        );
      }
    } catch (error) {
      console.error('Error initializing NFT contract:', error);
      throw error;
    }
  }
  
  public async getOwnedTokens(): Promise<any[]> {
    try {
      // For demo purposes, return sample NFT data
      return [
        {
          id: 'nft-1',
          name: 'Crypto Beats #1',
          artist: 'CryptoBeats',
          artistId: 'crypto-artist-1',
          albumId: 'crypto-album-1',
          description: 'First NFT music track on the platform',
          image: 'https://picsum.photos/300/300?random=6',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
          isOwned: true,
        },
        {
          id: 'nft-2',
          name: 'Digital Symphony',
          artist: 'Web3 Orchestra',
          artistId: 'crypto-artist-2',
          albumId: 'crypto-album-2',
          description: 'A blockchain-native symphony',
          image: 'https://picsum.photos/300/300?random=7',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
          isOwned: true,
        },
      ];
    } catch (error) {
      console.error('Error getting owned tokens:', error);
      return [];
    }
  }
  
  public async isTokenOwned(tokenId: string): Promise<boolean> {
    try {
      // For demo purposes, consider NFT-1 and NFT-2 as owned
      return tokenId === 'nft-1' || tokenId === 'nft-2';
    } catch (error) {
      console.error('Error checking token ownership:', error);
      return false;
    }
  }
}

export default NFTService;
