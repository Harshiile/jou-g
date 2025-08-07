import { oauth2ClientCreds } from "./secret";

const oauthClient = oauth2ClientCreds();

export const getAccessToken = async (refTkn: string) => {
  oauthClient.setCredentials({
    refresh_token: refTkn,
  });

  return (await oauthClient.getAccessToken()).token;
};
