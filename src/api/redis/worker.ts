import { Worker } from "bullmq";
import Redis from "ioredis";
import { google } from "googleapis";
import { and, eq, getTableColumns } from "drizzle-orm";
import { db } from "../../db";
import {
  VideoTable,
  VideoWorkspaceJoinTable,
  WorkspaceTable,
} from "../../db/schema";
import { driveGetStream } from "../g-api/drive/get";
// import { driveGetStream } from "../drive/utils/index.ts";
// import * as Notify from "../../mails/templates/notify.ts";
// import { SendReconnectMail } from "../../mails/templates/reconnect.ts";

const drive = google.drive({
  version: "v3",
  auth: new google.auth.GoogleAuth({
    keyFile: process.env.DRIVE_SERVICE_ACCOUNT_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/drive"],
  }),
});

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: "http://localhost:3000/youtube-info",
});

const connection = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "video-scheudler-queue",
  async (job) => {
    const { workspaceId, fileId } = job.data;

    if (!workspaceId) throw new Error("WorkspaceId is not exist");
    if (!fileId) throw new Error("Video Id is not valid");

    await uploadVideoOnYoutuber(fileId, workspaceId).catch((_) => {
      throw new Error(_.message);
    });
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`🎉 Video successfully uploaded`);
});

worker.on("failed", (job, err) => {
  console.error(`🔥 Video uploading failed : `, err.message);
});

worker.on("error", (err) => {
  console.error("🚨 Worker internal error :", err.message);
});

const printCommands = (msg: string) => console.log(`${msg} - ${new Date()}`);

const uploadVideoOnYoutuber = async (fileId: string, workspaceId: string) => {
  try {
    const [video] = await db
      .select({
        ...getTableColumns(VideoTable),
        refreshToken: WorkspaceTable.refreshToken,
      })
      .from(VideoTable)
      .leftJoin(WorkspaceTable, eq(WorkspaceTable.id, VideoTable.workspace))
      .where(
        and(
          eq(VideoTable.workspace, workspaceId),
          eq(VideoTable.fileId, fileId)
        )
      )
      .catch((_) => {
        throw new Error("Video Fetching Error");
      });

    if (!video) throw new Error("No Video Found");

    // Video Uploading
    const { refreshToken } = video;
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    const yt = google.youtube({ version: "v3", auth: oauth2Client });

    const videoStream = await driveGetStream(fileId).catch((_) => {
      throw new Error(`${_.message} For Video`);
    });

    printCommands("1. Video Uploading Start ...");

    const resUpload = await yt.videos
      .insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: video.title,
            description: video.desc,
          },
          status: {
            privacyStatus: video.videoType,
            selfDeclaredMadeForKids: video.isMadeForKids,
          },
        },
        media: {
          body: videoStream,
        },
      })
      .catch(async (err) => {
        if (
          err.response?.status === 400 &&
          err.response?.data?.error === "invalid_grant"
        ) {
          // handle invalid refresh token
          //   await SendReconnectMail(workspaceId);
        }
        throw new Error("Video Uploading On Youtube Error");
      });

    printCommands("2. Video Uploading Finish ...");
    printCommands(`3. Video Uploaded, Id : ${resUpload.data.id}`);

    // 1. Thumbnail set if not null
    const uploadedVideoId = resUpload.data.id;
    if (video.thumbnail) {
      printCommands("4. Thumbnail Uploading Start ...");
      await yt.thumbnails
        .set({
          videoId: uploadedVideoId!,
          media: {
            body: await driveGetStream(video.thumbnail).catch((_) => {
              throw new Error(`${_.message} For Thumbnail`);
            }),
          },
        })
        .catch((err) => {
          throw new Error("Thumbnail Uploading Error");
        });

      await deleteOnDrive(video.thumbnail).catch((_) =>
        console.log("🚨 Deleting Thumbnail From Drive Error")
      );
      printCommands("5. Thumbnail Uploaded");
      printCommands("6. Thumbnail Deleted From Drive ...");
    }

    // Sending Mail
    const videoData = resUpload.data.snippet;
    // const videoMailObject: Notify.VideoNofityMail = {
    //   thumbnail: videoData?.thumbnails?.high?.url!,
    //   title: videoData?.title!,
    //   publishedAt: videoData?.publishedAt!,
    //   videoType: resUpload.data.status?.privacyStatus!,
    //   duration: resUpload.data.contentDetails?.duration!,
    //   id: resUpload.data.id!,
    //   editorId: video.editor,
    // };
    // await Notify.SendNotifyMail(videoMailObject, workspaceId);

    // 2. Video Delete on Drive
    await deleteOnDrive(fileId).catch((_) => {
      console.log("🚨 Deleting Video From Drive Error");
    });
    printCommands("7. Video Deleted From Drive ...");

    // 3. Video Details Delete On VideoTable
    await db
      .delete(VideoTable)
      .where(eq(VideoTable.fileId, fileId))
      .catch((_) => {
        throw new Error("Delete Video Details In DB Error");
      });
    printCommands("8. Video Deleting in VideoTable ...");

    // 4. Add entry in VideoWorkSpaceTable
    await db
      .insert(VideoWorkspaceJoinTable)
      .values({
        videoId: uploadedVideoId,
        workspace: workspaceId,
        editor: video.editor,
      })
      .catch((_) => {
        throw new Error("Inserting Uploaded Video Details in DB");
      });
    printCommands("9. Video Insert in VideoWorkSpaceJoinTable ...");
  } catch (error) {
    throw new Error(`${process.env.SERVER_ERROR_MESSAGE} - 1027`);
  }
};

const deleteOnDrive = async (fileId: string) => {
  await drive.files.delete({ fileId }).catch((_) => {
    throw new Error();
  });
};
