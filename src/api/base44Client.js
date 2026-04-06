import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "689af59dce3a112c0a893cbf", 
  requiresAuth: true // Ensure authentication is required for all operations
});
import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: "689af59dce3a112c0a893cbf",
  apiKey: "59c898b104cb400f894e993a20564327", // Ajoute cette ligne !
  requiresAuth: true 
});