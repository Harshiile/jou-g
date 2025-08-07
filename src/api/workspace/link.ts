import { Request, Response } from "express";
import { APIResponse } from "../../types/res";
import { JOUError, JwtGenerate, JwtValidate } from "../utils";
import { VideoTable, WorkspaceTable } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { workspaceMetadata } from "./get";

export const workspaceJoinLinkAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { workspaceId } = req.params;

  if (!workspaceId) throw new JOUError(404, "WorkSpace Id is not valid");

  try {
    const [wsExist] = await db
      .select()
      .from(WorkspaceTable)
      .where(eq(WorkspaceTable.id, workspaceId.toString()));

    if (!wsExist) throw new JOUError(404, "WorkSpace Is Not Exist");

    const linkParams = JwtGenerate(
      {
        workspaceId,
      },
      "1d"
    );

    if (!linkParams)
      throw new JOUError(400, "Link Generation Error, Please Try Again");
    return res.json({
      message: "Link Generated",
      data: {
        url: `${process.env.PRODUCT_URL}/join-workspace/${linkParams}`,
      },
    });
  } catch (error) {
    throw new JOUError(400, `${process.env.SERVER_ERROR_MESSAGE} - 1007`);
  }
};

export const workspaceJoinValidateAPI = async (
  req: Request,
  res: Response<APIResponse>
) => {
  const { link } = req.params;

  if (!link) throw new JOUError(404, "Link not found");
  try {
    const workspaceId = await JwtValidate<string>(link);

    const workspace = await workspaceMetadata(workspaceId);
    if (!workspace) throw new JOUError(400, "Workspace Params Not Valid");

    return res.json({ message: "Workspace Details", data: { workspace } });
  } catch (err) {
    if (err instanceof Error) {
      if (err.name == "TokenExpiredError")
        throw new JOUError(401, "Link is expires");
    } else throw new JOUError(400, "Link is not valid");
  }
};
