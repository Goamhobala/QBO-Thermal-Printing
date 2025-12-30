import "express-session"

declare module "express-session" {
    interface SessionData {
        realmId?: string;
        accessToken?: string;
        refreshToken?: string;
    }
}