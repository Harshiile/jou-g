import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { JOUError, JwtGenerate, JwtValidate } from "../utils";
import { VideoTable } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export const updateScheduleAPI = async (
  req: Request<{}, {}>,
  res: Response<APIResponse>
) => {
  const { searchParams } = new URL(req.url);

  const videoId = searchParams.get("id");
  const newSchedule = searchParams.get("schedule");

  if (!videoId || !newSchedule) throw new JOUError(404, "Invalid Params");

  await db
    .update(VideoTable)
    .set({
      willUploadAt: newSchedule,
    })
    .where(eq(VideoTable.id, videoId))
    .catch((_) => {
      throw new JOUError(400, "Update Schedule Failed, Try Again");
    });

  return res.json({ message: "Scheudle Time Changed" });
};
