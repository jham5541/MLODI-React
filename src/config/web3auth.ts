import { CHAIN_NAMESPACES, CustomChainConfig } from '@web3auth/base';

export const WEB3AUTH_CLIENT_ID = 'BLoCwIFkr0B09vb983eWUR-aWjxB2LtrBadcg044ArIkIkllUt1bNxlKMsJU8GUHXaKB9N1J1bc5fPet9wuXU70';
export const WEB3AUTH_NETWORK = 'mainnet';

export const POLYGON_CONFIG: CustomChainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x89', // Polygon (Matic) mainnet
    rpcTarget: 'https://api.web3auth.io/infura-service/v1/0x89/BLoCwIFkr0B09vb983eWUR-aWjxB2LtrBadcg044ArIkIkllUt1bNxlKMsJU8GUHXaKB9N1J1bc5fPet9wuXU70',
    displayName: 'Polygon',
    blockExplorer: 'https://polygonscan.com',
    ticker: 'MATIC',
    tickerName: 'Polygon',
};
