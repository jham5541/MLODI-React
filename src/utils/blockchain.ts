import { ethers } from 'ethers';

export const formatBalance = (balance: string): string => {
    // Convert balance from wei to MATIC
    const formattedBalance = ethers.utils.formatEther(balance);
    // Round to 4 decimal places
    return Number(formattedBalance).toFixed(4);
};

export const shortenAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidAddress = (address: string): boolean => {
    try {
        ethers.utils.getAddress(address);
        return true;
    } catch {
        return false;
    }
};

export const POLYGON_MAINNET = {
    chainId: '0x89',
    chainName: 'Polygon',
    nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/'],
};
