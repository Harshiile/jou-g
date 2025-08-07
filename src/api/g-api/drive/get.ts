import * as GoogleApis from "googleapis-common";
import { driveCreds } from "../../utils/secret";
import Stream from "node:stream";

export const driveGetStream = async (
  fileId: string,
  range?: string,
  RangeObject?: { start: number; end: number }
): Promise<Stream.Readable> => {
  const responseOptions: GoogleApis.StreamMethodOptions = RangeObject
    ? {
        responseType: "stream",
        headers: {
          Range: `bytes=${RangeObject.start}-${RangeObject.end}`,
        },
      }
    : {
        responseType: "stream",
      };
  try {
    return driveCreds()
      .files.get(
        {
          fileId,
          fields: "size",
          alt: "media",
        },
        responseOptions
      )
      .then((fileRes) => {
        return fileRes.data;
      })
      .catch((_) => {
        throw new Error(_.message);
      });
  } catch (err) {
    const errMsg =
      err instanceof Error
        ? err.message
        : "Unknown Error While Fetching Stream";
    throw new Error(errMsg);
  }
};
