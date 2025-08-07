import { Request, Response } from "express";
import { APIResponse } from "../../../types/res";
import { JOUError, JwtGenerate, JwtValidate } from "../../utils";
import { db } from "../../../db";
import { VideoTable } from "../../../db/schema";
import { eq } from "drizzle-orm";

interface reqBody {
  isApprove: boolean;
  schedule: Date;
  fileId: string;
  workspaceId: string;
}
export const videoUploadAPI = async (
  req: Request<{}, {}, reqBody>,
  res: Response<APIResponse>
) => {
  const { isApprove, schedule, fileId, workspaceId } = req.body;

  if (isApprove == undefined || workspaceId == undefined || fileId == undefined)
    throw new JOUError(404, "Approval Not Found");

  if (isApprove) {
    // Video is approved, push to Scheduler
    if (schedule) {
      const delay = Number(schedule) - Date.now();
      if (delay < 60) {
        // Upload Scheudling Time Gone - 60 just for 1 second - Ideally should be 0
        throw new JOUError(
          400,
          "Upload Schedule Time Passed, Change Schedule Time"
        );
      }

      console.log(
        "Schedule Time : ",
        new Date(Number(schedule)).toLocaleTimeString()
      );
      console.log("Now Time : ", new Date().toLocaleTimeString());
      console.log(
        "Delay in Minutes : ",
        (Number(schedule) - Date.now()) / (1000 * 60)
      );

      //   await uploadQueue.add(
      //     "uploadVideoToYoutube",
      //     {
      //       workspaceId,
      //       fileId,
      //     },
      //     {
      //       delay: Number(schedule) - Date.now(),
      //       attempts: 3,
      //       backoff: 60 * 1000, // 1 min
      //       removeOnComplete: true,
      //     }
      //   );

      // Set video state as uploadPending------------------
      await db
        .update(VideoTable)
        .set({
          status: "uploadPending",
        })
        .where(eq(VideoTable.fileId, fileId))
        .catch((_) => {
          throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1026`);
        });
    } else {
      // Immediate Upload
      //   await uploadQueue.add("uploadVideoToYoutube", {
      //     workspaceId,
      //     fileId,
      //   });
    }
    return res.json({
      message: !schedule
        ? "Video Uploading Started"
        : `Video is Scheduled to upload on ${schedule.toDateString()} - ${schedule.toLocaleTimeString()}`,
    });
  } else {
    // Video rejected, delete from DB
    await db
      .delete(VideoTable)
      .where(eq(VideoTable.fileId, fileId))
      .catch((_) => {
        throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1022`);
      });
    return res.json({ message: "Video is rejected" });
  }
};
