import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { JOUError, JwtGenerate, JwtValidate } from "../utils";
import { VideoTable } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface VideoReview {
  channel: {
    id: string;
    name: string;
    avatar: string;
    userHandle: string;
  };
  videoId: string;
}
export const videoReviewLinkAPI = async (
  req: Request<{}, {}, VideoReview>,
  res: Response<APIResponse>
) => {
  const { channel, videoId } = req.body;
  return res.json({
    message: "Video Review Link",
    data: {
      url: `${process.env.PRODUCT_URL}/review/${JwtGenerate({
        channel,
        videoId,
      })}`,
    },
  });
};
export const videoReviewValidateAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { link } = req.params;

  if (!link) throw new JOUError(404, "Link not found");

  try {
    const videoDetails = await JwtValidate<VideoReview>(link);

    try {
      const [video] = await db
        .select()
        .from(VideoTable)
        .where(eq(VideoTable.id, videoDetails.videoId));

      if (!video)
        return res.json({ message: "Video Not Found", data: { error: true } });
      else {
        const videoEntireDetails = {
          channel: videoDetails.channel,
          video: { ...video },
        };
        return res.json({
          message: "Video Details",
          data: { videoEntireDetails },
        });
      }
    } catch (error) {
      throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1008`);
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name == "TokenExpiredError")
        throw new JOUError(401, "Link is expires");
    } else throw new JOUError(400, "Link is not valid");
  }
};
