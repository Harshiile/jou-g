import { Router } from "express";
import { driveUploadAPI } from "../api/g-api/drive/upload";

export const router = Router();

router.post("/upload", driveUploadAPI);
// /auth/login
// /auth/signup
// /auth/logout
// /auth/authorize-editor/validate
// /auth/renew-token

// /drive
// /drive/upload
// /drive/upload/progress - SSE

// /videos/review/generate
// /videos/review/validate
// /videos/update-schedule

// /youtube/connect
// /youtube/reconnect
// /youtube/video-approval

// /fetch/chart
// /fetch/me
// /fetch/workspaces/videos
// /fetch/workspaces/join/final
// /fetch/workspaces/join/initial
// /fetch/workspaces/join/link/generate
// /fetch/workspaces/join/link/validate
