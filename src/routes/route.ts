import { Router } from "express";
import { driveUploadAPI } from "../api/g-api/drive/upload";

export const router = Router();

router.post("/upload", driveUploadAPI);

// DONE
// /auth/login
// /auth/signup
// /auth/logout
// /auth/authorize-editor/validate
// /fetch/me

// /drive/upload
// /drive/get-stream

// /youtube/connect
// /youtube/reconnect

// /videos/review/generate
// /videos/review/validate
// /youtube/video-approval
// /videos/update-schedule

// /fetch/workspaces/join/final
// /fetch/workspaces/join/initial
// /fetch/workspaces/join/link/generate
// /fetch/workspaces/join/link/validate
// /fetch/workspaces/videos

// ---------------------------------------------------------

// Remaining

// /auth/renew-token

// /fetch/chart
