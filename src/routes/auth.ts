import { Router } from "express";
import {
  authorizeEditorLinkAPI,
  authorizeEditorValidateAPI,
  loginAPI,
  logoutAPI,
  signUpAPI,
  UserAPI,
} from "../api/auth";

export const authRouter = Router();

// authRouter.post("/renew-token", UserAPI);
authRouter.post("/user", UserAPI);
authRouter.post("/login", loginAPI);
authRouter.post("/signup", signUpAPI);
authRouter.post("/logout", logoutAPI);
authRouter.get("/auth-editor/validate/:link", authorizeEditorValidateAPI); // Validate
authRouter.post("/auth-editor/link", authorizeEditorLinkAPI); // Generate
