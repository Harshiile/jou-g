import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { JOUError, JwtGenerate, JwtValidate } from "../utils";
import {
  EditorWorkspaceJoinTable,
  UserTable,
  VideoTable,
  WorkspaceTable,
} from "../../db/schema";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { workspaceMetadata } from "./get";

export const workspaceInitialJoinAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { workspaceId } = req.params;

  const { id: userId } = req.user;

  if (!workspaceId) throw new JOUError(400, "Invalid Params");

  try {
    const [user] = await db
      .select({
        role: UserTable.role,
        name: UserTable.name,
        id: UserTable.id,
        email: UserTable.email,
      })
      .from(UserTable)
      .where(eq(UserTable.id, userId));

    if (!user) throw new JOUError(404, "User not found");

    if (user.role != "editor")
      throw new JOUError(400, "Youtuber can't joined any workspace");

    // 1. Checks if editor request is approve or not
    try {
      const [isEditorExist] = await db
        .select({ authorize: EditorWorkspaceJoinTable.authorize })
        .from(EditorWorkspaceJoinTable)
        .where(
          and(
            eq(EditorWorkspaceJoinTable.editor, userId),
            eq(EditorWorkspaceJoinTable.workspace, workspaceId)
          )
        );

      if (isEditorExist) {
        if (!isEditorExist.authorize)
          throw new JOUError(400, "Your request is not approve yet");
        else throw new JOUError(400, "You already in this Workspace");
      }
    } catch (error) {
      throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1028 `);
    }

    // 2. Checks if editor already in table
    await db
      .insert(EditorWorkspaceJoinTable)
      .values({
        editor: userId,
        workspace: workspaceId,
        authorize: false,
      })
      .catch((err) => {
        throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1006`);
      });

    // 3. Mail to Youtuber
    try {
      try {
        const wsMetadata = await workspaceMetadata(workspaceId);
        if (!wsMetadata) throw new JOUError(400, "Workspace Params Not Found");

        const mailInputs = {
          wsId: wsMetadata.id,
          wsName: wsMetadata.name,
          wsAvatar: wsMetadata.avatar,
          wsUserHandle: wsMetadata.userHandle,
          editorId: user.id,
          editorName: user.name,
          editorMail: user.email,
        };
        // SendAuthorizeMail(mailInputs);
      } catch (error) {
        throw new Error();
      }
    } catch (error) {
      throw new JOUError(400, "Workspace Not Found");
    }
  } catch (error) {
    throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1005`);
  }

  return res.json({
    message: "Your request will send to Youtuber",
  });
};

export const workspaceFinalJoinAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { id, ws, approve } = req.query;
  const workspaceId = ws;

  if (!id || !workspaceId || !approve)
    throw new JOUError(404, "Params Not Found");

  if (approve == "true") {
    // update DB
    await db
      .update(EditorWorkspaceJoinTable)
      .set({ authorize: true })
      .where(
        and(
          eq(EditorWorkspaceJoinTable.workspace, workspaceId as string),
          eq(EditorWorkspaceJoinTable.editor, id as string)
        )
      )
      .catch((_) => {
        throw new JOUError(400, "Joined Error, Please try again");
      });

    return res.json({ message: "Editor Joined Workspace" });
  } else if (approve == "false") {
    // delete entry
    await db
      .delete(EditorWorkspaceJoinTable)
      .where(
        and(
          eq(EditorWorkspaceJoinTable.workspace, workspaceId?.toString()!),
          eq(EditorWorkspaceJoinTable.editor, id?.toString()!)
        )
      )
      .catch((_) => {
        throw new JOUError(400, "Joined Error, Please try again");
      });
    return res.json({ message: "Editor Discarded from Workspace" });
  } else throw new JOUError(400, "Invalid Request, Please try again");
};
