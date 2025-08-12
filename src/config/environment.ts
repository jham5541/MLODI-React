const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  isDevelopment,
  useMockServices: isDevelopment, // Use mock services in development
  api: {
    baseUrl: isDevelopment ? 'http://localhost:3000' : 'https://api.production.com',
  },
};
