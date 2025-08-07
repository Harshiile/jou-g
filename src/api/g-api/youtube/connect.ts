import { Request, Response } from "express";
import { db } from "../../../db";
import { WorkspaceTable } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import { JOUError } from "../../utils";
import { oauth2ClientCreds } from "../../utils/secret";
import { APIResponse } from "../../../types";

// Connection URL
export const connectYoutubeAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { id: UserId } = req.user;

  let [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(WorkspaceTable)
    .where(eq(WorkspaceTable.owner, UserId))
    .catch((err) => {
      throw new JOUError(400, process.env.SERVER_ERROR_MESSAGE!);
    });

  if (count >= Number(process.env.WORKSPACE_CAPICITY))
    throw new JOUError(401, "Workspace Limits Reached");

  const scopes = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];
  const url = oauth2ClientCreds().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
  return res.json({ message: "Connection URL", data: { url } });
};

// Reconnection URL
const getReconnectUrl = (workspaceEmail: string) => {
  const scopes = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2ClientCreds().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    login_hint: workspaceEmail,
  });
};
export const reconnectYoutubeURLAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { workspaceId } = req.params;

  if (!workspaceId) throw new JOUError(404, "Params not found");
  try {
    const [ws] = await db
      .select({ email: WorkspaceTable.email })
      .from(WorkspaceTable)
      .where(eq(WorkspaceTable.id, workspaceId));

    return res.json({
      message: "Reconnetion URL",
      data: { url: getReconnectUrl(ws.email) },
    });
  } catch (error) {
    throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1027`);
  }
};
