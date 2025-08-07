import { Router } from "express";
import {
  updateScheduleAPI,
  videoReviewLinkAPI,
  videoReviewValidateAPI,
  workspaceVideosAPI,
} from "../api/videos";

export const videoRouter = Router();

videoRouter.get("/:workspace", workspaceVideosAPI);
videoRouter.post("/review/link", videoReviewLinkAPI);
videoRouter.get("/review/validate/:link", videoReviewValidateAPI);
videoRouter.patch("/schedule", updateScheduleAPI);
