/**
 * This interface defines the shape of the ClientPrincipal object
 * provided by Azure Static Web Apps Easy Auth.
 */
export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // User's email or username
  userRoles: string[];
}

/**
 * This is the shape of the JSON response from `/.auth/me`
 */
export interface AuthMeResponse {
  clientPrincipal: ClientPrincipal | null;
}