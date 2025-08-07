import { Router } from "express";
import { driveUploadAPI } from "../api/g-api/drive/upload";
import { authRouter } from "./auth";
import { workspaceRouter } from "./workspace";
import { oAuthRouter } from "./oauth";
import { videoRouter } from "./video";

export const router = Router();

router.use("/auth", authRouter);
router.use("/workspace", workspaceRouter);
router.use("/oauth", oAuthRouter);
router.use("/video", videoRouter);
