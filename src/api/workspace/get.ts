import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { getAccessToken, JOUError, JwtGenerate, JwtValidate } from "../utils";
import { VideoTable, WorkspaceTable } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { oauth2ClientCreds } from "../utils/secret";

interface WorkspaceMetaData {
  id: string | null | undefined;
  userHandle: string | null | undefined;
  name: string | null | undefined;
  avatar: string | null | undefined;
  subscribers: string | null | undefined;
  desc: string | null | undefined;
  totalVideos: string | null | undefined;
  disconnected: boolean;
}

export const workspaceMetadata = async (
  workspaceId: string
): Promise<WorkspaceMetaData | null> => {
  const oauth2Client = oauth2ClientCreds();
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const [ws] = await db
    .select({ refTkn: WorkspaceTable.refreshToken })
    .from(WorkspaceTable)
    .where(eq(WorkspaceTable.id, workspaceId))
    .catch((err) => {
      throw new JOUError(400);
    });

  const acsTkn = await getAccessToken(ws.refTkn);

  oauth2Client.setCredentials({ access_token: acsTkn });

  return youtube.channels
    .list({
      part: ["snippet", "statistics"],
      mine: true,
    })
    .then((res) => {
      if (!res || !res.data?.items) return null;

      const [ws] = res.data?.items;

      return {
        id: ws.id,
        userHandle: ws.snippet?.customUrl,
        name: ws.snippet?.title,
        avatar: ws.snippet?.thumbnails?.high?.url,
        subscribers: ws.statistics?.subscriberCount,
        desc: ws.snippet?.description,
        totalVideos: ws.statistics?.videoCount,
        disconnected: false,
      };
    })
    .catch((_) => {
      throw new JOUError(400);
    });
};
