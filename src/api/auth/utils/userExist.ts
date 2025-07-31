import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { UserTable } from "../../../db/schema";
import { JOUError } from "../../utils/error";
import { User } from "../../../types/user";

export const userExist = (email: string) => {
  return db
    .select({
      id: UserTable.id,
      name: UserTable.name,
      password: UserTable.password,
      role: UserTable.role,
    })
    .from(UserTable)
    .where(eq(UserTable.email, email))
    .then(([user]) => user)
    .catch((err) => {
      throw new JOUError(400, process.env.SERVER_ERROR_MSG!);
    });
};
