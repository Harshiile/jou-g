import { google } from "googleapis";

// Drive - Service Account
export const driveCreds = () =>
  google.drive({
    version: "v3",
    auth: new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/drive"],
      credentials: !process.env.JOU_DRIVE_SERVICE_ACCOUNT_CREDENTIALS
        ? {}
        : JSON.parse(
            process.env.JOU_DRIVE_SERVICE_ACCOUNT_CREDENTIALS as string
          ),
    }),
  });

// OAuthClient
export const oauth2ClientCreds = () =>
  new google.auth.OAuth2({
    clientId: process.env.OAUTH_CLIENT_ID as string,
    clientSecret: process.env.OAUTH_CLIENT_SECRET as string,
    redirectUri: "http://localhost:3000/youtube-info",
  });
