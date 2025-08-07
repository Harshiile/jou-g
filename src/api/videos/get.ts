import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { getAccessToken, JOUError, JwtGenerate, JwtValidate } from "../utils";
import {
  EditorWorkspaceJoinTable,
  UserTable,
  VideoTable,
  VideoWorkspaceJoinTable,
  WorkspaceTable,
} from "../../db/schema";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { workspaceMetadata } from "../workspace/get";
import { oauth2ClientCreds } from "../utils/secret";
import { google } from "googleapis";

interface VideoMetadata {
  id: string;
  title: string;
  duration: string;
  thumbnail: string | null;
  videoType: "public" | "private" | "unlisted" | string;
  status: "reviewPending" | "uploadPending" | "uploaded";
  editor: string | null;
  views?: String | null;
  username?: string;
  fileId?: string;
  willUploadAt?: string | null;
  publishedAt?: string | null;
}
export const workspaceVideosAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { workspace } = req.params;

  if (!workspace) throw new JOUError(404, "Request Params Invalid");

  // Non-Uploaded Videos
  const nonUploadedVideos = await db
    .select({
      id: VideoTable.id,
      title: VideoTable.title,
      duration: VideoTable.duration,
      willUploadAt: VideoTable.willUploadAt,
      thumbnail: VideoTable.thumbnail,
      videoType: VideoTable.videoType,
      status: VideoTable.status,
      editor: UserTable.name,
      fileId: VideoTable.fileId,
    })
    .from(VideoTable)
    .leftJoin(UserTable, eq(UserTable.id, VideoTable.editor))
    .where(eq(VideoTable.workspace, workspace))
    .catch((_) => {
      throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1009`);
    });

  // Uploaded Videos
  const uploadedVideosIds = await db
    .select({
      editor: UserTable.name,
      videoId: VideoWorkspaceJoinTable.videoId,
    })
    .from(VideoWorkspaceJoinTable)
    .leftJoin(UserTable, eq(UserTable.id, VideoWorkspaceJoinTable.editor))
    .where(eq(VideoWorkspaceJoinTable.workspace, workspace))
    .catch((_) => {
      throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1010`);
    });

  const metadata: VideoMetadata[] = nonUploadedVideos || [];

  if (uploadedVideosIds.length <= 0)
    return res.json({ message: "Workspace Videos", data: { metadata } });

  const [ws] = await db
    .select({
      refreshToken: WorkspaceTable.refreshToken,
    })
    .from(WorkspaceTable)
    .where(eq(WorkspaceTable.id, workspace))
    .catch((_) => {
      throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1011`);
    });

  if (!ws) throw new JOUError(404, "Workspace not Exist");

  const { refreshToken } = ws;

  const oauth2Client = oauth2ClientCreds();
  oauth2Client.setCredentials({
    access_token: await getAccessToken(refreshToken),
  });
  const yt = google.youtube({ version: "v3", auth: oauth2Client });
  const videos = uploadedVideosIds.map((v) => v.videoId!);
  const videoDetails = await yt.videos.list({
    part: ["snippet", "contentDetails", "status", "statistics"],
    id: videos,
  });

  // Fetching Details About Videos Using IDs

  const videosMetaDatas = videoDetails?.data?.items;
  videosMetaDatas?.forEach((video) => {
    const { editor } = uploadedVideosIds.filter(
      (fv) => fv.videoId == video.id
    )[0];
    metadata.push({
      id: video.id!,
      title: video.snippet!.title!,
      publishedAt: video.snippet!.publishedAt!,
      duration: video.contentDetails!.duration!,
      username: video.snippet?.channelTitle!,
      thumbnail: video.snippet?.thumbnails?.maxres?.url!,
      videoType: video.status!.privacyStatus!,
      views: video.statistics!.viewCount,
      status: "uploaded",
      editor,
    });
  });
  return res.json({ message: "Workspace Videos", data: { metadata } });
};
