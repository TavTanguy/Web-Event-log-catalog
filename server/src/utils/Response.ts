import { Response } from "express";

export function response(
  res: Response,
  code: number,
  type: "success" | "error",
  obj?: any
) {
  res.status(code).json({ type, res: obj });
}
