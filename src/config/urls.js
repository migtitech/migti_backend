const environmentUrls = {
  development: 'https://dev.gca.user.infosparkles.net',
  production: 'https://admin.globalculinaryalliance.com',
};

// Get current environment
const currentEnv = process.env.NODE_ENV || 'development';

// Get base URL for current environment
const BASE_URL = environmentUrls[currentEnv] || environmentUrls.development;

// Export URL generator functions
export const registerIndividual = (referralCode) => `${BASE_URL}/register-individual?referralCode=${referralCode}`;
export const registerAssociation = (token) => `${BASE_URL}/register-association?token=${token}`;
export const resetPassword = (token) => `${BASE_URL}/reset-password?token=${token}`;
export { BASE_URL };