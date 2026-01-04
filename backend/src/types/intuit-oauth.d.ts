declare module 'intuit-oauth' {
  export interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: string;
    redirectUri: string;
    logging?: boolean;
  }

  export interface AuthResponse {
    token: {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      x_refresh_token_expires_in: number;
    };
  }

  export default class OAuthClient {
    constructor(config: OAuthClientConfig);
    scopes: {
      Accounting
    }
    authorizeUri(params: {
      scope: string | string[];
      state: string;
    }): string;

    createToken(url: string): Promise<AuthResponse>;

    refresh(): Promise<AuthResponse>;

    refreshUsingToken(refresh_token: string): Promise<AuthResponse>;

    revoke(params: { access_token?: string; refresh_token?: string }): Promise<AuthResponse>;

    getToken(): AuthResponse;

    setToken(token: AuthResponse): void;

    isAccessTokenValid(): boolean;

    getKeyFromJWKsURI(id_token: string, kid: string, request: any): Promise<any>;

    validateIdToken(params?: any): Promise<any>;
  }
}
