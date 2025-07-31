import { google } from "googleapis";

const DRIVE_CREDS = JSON.parse(
  process.env.JOU_DRIVE_SERVICE_ACCOUNT_CREDENTIALS!
);

// Drive - Service Account
export const drive = google.drive({
  version: "v3",
  auth: new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive"],
    credentials: DRIVE_CREDS,
  }),
});

// OAuthClient
export const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.OAUTH_CLIENT_ID as string,
  clientSecret: process.env.OAUTH_CLIENT_SECRET as string,
  redirectUri: "http://localhost:3000/youtube-info",
});
