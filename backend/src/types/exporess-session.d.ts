import "express-session"

declare module "express-session" {
    interface SessionData {
        realmId?: string;
        accessToken?: string;
        refreshToken?: string;
        oauthState?: string; // CSRF protection token for OAuth flow
    }
}