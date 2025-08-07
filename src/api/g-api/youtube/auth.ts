import { Request, Response } from "express";
import { getAccessToken, JOUError } from "../../utils";
import { oauth2ClientCreds } from "../../utils/secret";
import { google } from "googleapis";
import { db } from "../../../db";
import { WorkspaceTable } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { APIResponse } from "../../../types";

export const authYoutube = async (req: Request, res: Response<APIResponse>) => {
  const { id: userId } = req.user;
  const { code } = req.params;

  if (!code) throw new JOUError(400, "Code not generated after youtube signup");

  try {
    const oauth2Client = oauth2ClientCreds();
    // Fetching Channel Credentials
    const channelCreds = await oauth2Client
      .getToken(code!.toString())
      .catch((err) => {
        throw new JOUError(400, "Please Try Again");
      });

    if (!channelCreds)
      throw new JOUError(404, "Youtube Channel Fetching Failed");

    const refToken = channelCreds.tokens.refresh_token;

    if (!refToken) throw new JOUError(400);

    // Setting oAuth2Client
    oauth2Client.setCredentials({
      access_token: await getAccessToken(refToken),
    });

    const yt = google.youtube({ version: "v3", auth: oauth2Client });

    // Email associated with youtube channel
    const email = (
      await google.oauth2({ version: "v2", auth: oauth2Client }).userinfo.get()
    ).data.email;

    // Fetching Channel Data
    const channels = await yt.channels
      .list({
        part: ["id", "snippet"],
        mine: true,
      })
      .catch((err) => {
        throw new JOUError(400, err.message);
      });

    if (!channels)
      throw new JOUError(400, "Error while fetching youtube channel info");

    if (channels.data.items!.length <= 0)
      throw new JOUError(
        404,
        "No channel associated with given youtube account"
      );

    const { id: channelId } = channels.data.items![0];
    const { customUrl } = channels.data.items![0].snippet!;

    await db
      .insert(WorkspaceTable)
      .values({
        id: channelId!,
        owner: userId,
        userHandle: customUrl?.toString()!,
        refreshToken: refToken!,
        email: email!,
      })
      .catch(async (err: any) => {
        if (err?.cause?.code == "23505") {
          // Just renew the refresh Token
          await db
            .update(WorkspaceTable)
            .set({ refreshToken: refToken! })
            .where(eq(WorkspaceTable.id, channelId!))
            .catch((_) => {
              throw new JOUError(
                400,
                `${process.env.SERVER_ERROR_MESSAGE} - 1017`
              );
            });
        }
      });

    return res.json({ message: "Workspace Created" });
  } catch (error) {
    throw new JOUError(404, "Unauthorized Code");
  }
};
