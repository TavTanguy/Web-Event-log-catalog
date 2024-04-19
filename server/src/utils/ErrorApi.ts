import { Response } from "express";

export class ErrorApi extends Error {
  public static unkownError = (code: number) => new ErrorApi("ErrorApi-1." + code, 500, "Internal error", false); //1

  public constructor(
    public code: string,
    public codeHttp: number = 500,
    publicMsg?: string,
    public print: boolean = false
  ) {
    super(publicMsg);
    Error.captureStackTrace(ErrorApi);
  }

  public response(res: Response) {
    res.status(this.codeHttp).json({ type: "error", code: this.code, message: this.message });
    if (this.print) console.error(this);
  }
}
