import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import busboy from "busboy";
import { IncomingHttpHeaders } from "http";
import { APIResponse } from "../../../types";
import { JOUError } from "../../utils/error";
import { db } from "../../../db";
import { VideoTable } from "../../../db/schema";
import { driveCreds } from "../../utils/secret";
import { google } from "googleapis";

/*

  Flow
    1. Gets the video
    2. Create Replica
    3. Divides into Chunks/Replica
    4. Uploads them all
    5. For each Replica

*/

const parseFieldData = (data: string) => {
  if (data == "true") return true;
  else if (data === "null" || data === "undefined" || data === "") return null;
  return data;
};
type VideoType = "public" | "private" | "unlisted";
const parseVideoType = (videoType: string): VideoType => {
  switch (videoType) {
    case "public":
      return "public";
    case "private":
      return "private";
    case "unlisted":
      return "unlisted";
    default:
      return "unlisted";
  }
};

const DriveUpload = (
  file: object,
  filename: FileName,
  headers: IncomingHttpHeaders
) => {
  const [fileName, fileExt] = filename.filename.split(".");
  const drive = driveCreds();
  return drive.files.create(
    {
      requestBody: {
        name: `${fileName}-${uuidv4()}.${fileExt}`,
        parents: [
          filename.mimeType.includes("video")
            ? process.env.DRIVE_VIDEO_FOLDER_ID!
            : process.env.DRIVE_THUMBNAIL_FOLDER_ID!,
        ],
      },
      media: {
        mimeType: filename.mimeType,
        body: file,
      },
    },
    {
      onUploadProgress: (progress) => {
        if (filename.mimeType.includes("video")) {
          const uploaded = progress.bytesRead || progress.loaded;
          const percent = Math.round(
            (Number(uploaded) / Number(headers["content-length"] || 1)) * 100
          );
          console.log(`Uploading - ${percent} %`);

          // io.to(headers["socket"]!).emit("uploading-progress", {
          //   percentage: percent,
          // });
        }
      },
    }
  );
};

export const driveUploadAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const videoMetadata: Record<string, string | boolean | null> = {
    title: null,
    desc: null,
    duration: null,
    videoType: null,
    willUploadAt: null,
    isMadeForKids: null,
    editor: null,
    workspace: null,
  };
  const uploadPromises: Promise<any>[] = [];

  const fileIds: {
    fileId: null | string;
    thumbnailId: null | string;
  } = {
    fileId: null,
    thumbnailId: null,
  };
  const bb = busboy({ headers: req.headers });
  req.pipe(bb);
  bb.on("field", (fieldname, val) => {
    if (val) videoMetadata[fieldname] = parseFieldData(val)!;
  });

  bb.on(
    "file",
    async (
      fieldname: string,
      file: NodeJS.ReadableStream,
      filename: FileName
    ) => {
      uploadPromises.push(
        DriveUpload(file, filename, req.headers)
          .then((res) => {
            if (fieldname === "video") fileIds.fileId = res.data.id!;
            else if (fieldname === "thumbnail")
              fileIds.thumbnailId = res.data.id!;
          })
          .catch((err) => {
            console.log("--Error : ", err.message);
            throw new JOUError(err.status, "Uploading Failed");
          })
      );
    }
  );

  bb.on("finish", () => {
    Promise.all(uploadPromises)
      .then(async (_) => {
        console.log("Video Uploaded, Now Inserting in DB");

        // DB Uploading

        console.log({
          title: videoMetadata.title as string,
          desc: videoMetadata.desc as string,
          videoType: videoMetadata.videoType as VideoType,
          duration: videoMetadata.duration as string,
          isMadeForKids: videoMetadata.isMadeForKids as boolean,
          willUploadAt: videoMetadata.willUploadAt as string | null,
          editor: videoMetadata.editor as string,
          workspace: videoMetadata.workspace as string,
          thumbnail: fileIds.thumbnailId as string,
          fileId: fileIds.fileId as string,
          status: "reviewPending",
        });

        // await db
        //   .insert(VideoTable)
        //   .values({
        //     title: videoMetadata.title as string,
        //     desc: videoMetadata.desc as string,
        //     videoType: videoMetadata.videoType as VideoType,
        //     duration: videoMetadata.duration as string,
        //     isMadeForKids: videoMetadata.isMadeForKids as boolean,
        //     willUploadAt: videoMetadata.willUploadAt as string | null,
        //     editor: videoMetadata.editor as string,
        //     workspace: videoMetadata.workspace as string,
        //     thumbnail: fileIds.thumbnailId as string,
        //     fileId: fileIds.fileId as string,
        //     status: "reviewPending",
        //   })
        //   .then((_) => {
        //     console.log("Video Inserted in DB");
        //     // Send mail to youtuber - workspaceId
        //     res.json({
        //       message: "Video Uploaded",
        //     });
        //   })
        //   .catch((err) => {
        //     throw new JOUError(err.status, "Video Insertion Failed");
        //   });

        return res.json({ message: "Video Uploaded" });
      })
      .catch((err) => {
        console.error("One or more uploads failed:", err);
        res.json({ message: "Upload failed" });
      });
  });
};

// export const deleteOnDrive = async (
//   req: Request,
//   res: Response<APIResponse>
// ) => {
//   const { fileId } = req.query;
//   if (fileId && typeof fileId == "string") {
//     drive.files
//       .delete({ fileId })
//       .then((_) =>
//         res.json({
//           message: "File Deleted",
//         })
//       )
//       .catch((err) => {
//         throw new JOUError(err.status, "Deletion Failed");
//       });
//   }
// };

interface FileName {
  filename: string;
  encoding: string;
  mimeType: string;
}

interface Header {
  "content-length": number;
  socket: string;
}
