// Environment configuration
export const config = {
  // Web3 Configuration
  ETHEREUM_RPC_URL: 'https://api.web3auth.io/infura-service/v1/0x89/BLoCwIFkr0B09vb983eWUR-aWjxB2LtrBadcg044ArIkIkllUt1bNxlKMsJU8GUHXaKB9N1J1bc5fPet9wuXU70',
  WEB3AUTH_CLIENT_ID: 'BLoCwIFkr0B09vb983eWUR-aWjxB2LtrBadcg044ArIkIkllUt1bNxlKMsJU8GUHXaKB9N1J1bc5fPet9wuXU70',
  WALLETCONNECT_PROJECT_ID: 'placeholder-project-id-replace-me',

  // Supabase Configuration
  SUPABASE_URL: 'https://riesezhwmiklpcnrbjkb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZXNlemh3bWlrbHBjbnJiamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzgyNTMsImV4cCI6MjA1MDUxNDI1M30.tSRxLR-uG1tfr3k3DhmAUHThZ8Eh98NgOiaUT6leDxY',

  // Database Configuration
  DB_HOST: 'db.riesezhwmiklpcnrbjkb.supabase.co',
  DB_PORT: 5432,
  DB_NAME: 'postgres',
  DB_USER: 'postgres',
  
  // App Configuration
  APP_URL: 'm3lodi://',
  
  // Socket Configuration
  SOCKET_PORT: 3001,
  
  // API Configuration
  API_PORT: 3000,
} as const;

export default config;
