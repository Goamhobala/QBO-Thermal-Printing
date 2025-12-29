
import express from "express";
import expressSession from "express-session";
import dotenv from "dotenv";
import OAuthClient from "intuit-oauth";
 


dotenv.config();

const oauthClient = new OAuthClient({
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    environment: process.env.ENVIRONMENT!,
    redirectUri: process.env.REDIRECT_URI!,
})


const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: "testState"
})

const app = express();

app.get('/login', (req, res)=>{
    res.redirect(authUri)
})

app.get("/redirect", async (req, res)=> {
    const {code, state, realmId} = req.query;
    if (!code || !realmId) {
        return res.status(400).json({error: "Invalid request"})
    }
    if (state !== "testState") {
        return res.status(400).json({error: "Invalid state"})
    }
    try {
        console.log('Attempting token exchange...');
        const authResponse = await oauthClient.createToken(req.url);
        const tokens = authResponse.getJson();
        
        console.log('=== TOKEN RESPONSE ===');
        console.log('Full tokens object:', JSON.stringify(tokens, null, 2));
        console.log('tokens.realmId:', tokens.realmId);
        console.log('realmId from query:', realmId);
        
        res.json({
            success: true,
            realmId: realmId,  // Use query param, not tokens.realmId
            tokenType: tokens.token_type,
            expiresIn: tokens.expires_in
        })
    }
    catch (error){
        console.log(error)
        res.status(500).json({error: "Failed to create token"})
    }

})

app.get("/test", (req, res)=>{
    console.log(req.query)
})

app.get('/health', (req, res)=>{
    res.json({status: "ok"})
})


app.listen(process.env.PORT || 3000, () => {
    console.log("Server started on port 3000"); 
});




