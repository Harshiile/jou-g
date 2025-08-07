import { Router } from "express";
import {
  workspaceFinalJoinAPI,
  workspaceInitialJoinAPI,
  workspaceJoinLinkAPI,
  workspaceJoinValidateAPI,
} from "../api/workspace";

export const workspaceRouter = Router();

workspaceRouter.post("/join/initial/:workspaceId", workspaceInitialJoinAPI);
workspaceRouter.post("/join/final", workspaceFinalJoinAPI);
workspaceRouter.get("/join/validate/:link", workspaceJoinValidateAPI); // Validate
workspaceRouter.get("/join/link", workspaceJoinLinkAPI); // Generate
// workspaceRouter.get("/chart", );
