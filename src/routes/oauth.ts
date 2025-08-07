import { Router } from "express";
import { driveUploadAPI } from "../api/g-api/drive";
import {
  authYoutube,
  connectYoutubeAPI,
  reconnectYoutubeURLAPI,
  videoUploadAPI,
} from "../api/g-api/youtube";

export const oAuthRouter = Router();

oAuthRouter.post("/drive/upload", driveUploadAPI);
// oAuthRouter.get("/drive/get-stream");
oAuthRouter.get("/youtube/connect", connectYoutubeAPI);
oAuthRouter.get("/youtube/re-connect", reconnectYoutubeURLAPI);
oAuthRouter.get("/youtube/upload", videoUploadAPI);
oAuthRouter.get("/youtube/auth/:code", authYoutube);
