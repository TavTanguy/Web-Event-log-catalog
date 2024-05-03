import { sign, verify } from "jsonwebtoken";
import { ErrorApi } from "./ErrorApi";
import { NextFunction, Request, Response } from "express";
import { compare, hash } from "bcrypt";
import { delay } from "./asyncTools";
import ms from "ms";

export interface UserInfoAuth {
  idUser: number;
  email: string;
  username: string;
}

export class UserAuth {
  private static key?: string;
  private static _expiresIn?: string;
  public static get expiresIn() {
    return this._expiresIn;
  }
  public static setKey(key: string, expiresIn: string) {
    this.key = key;
    this._expiresIn = expiresIn;
  }

  public static getToken(userInfo: UserInfoAuth & { exp?: number; iat?: number }): [string, number] {
    if (!this.key) throw new Error("Key for JWT not set");
    delete userInfo.exp;
    delete userInfo.iat;
    return [
      sign(userInfo, this.key, { expiresIn: UserAuth._expiresIn }),
      Date.now() + ms(UserAuth._expiresIn || "1 h"),
    ];
  }

  public static middlewareConnected(req: Request, res: Response, next: NextFunction) {
    new UserAuth(req).isConnected();
    next();
  }

  public static async hashPassword(password: string) {
    await delay(300);
    return await hash(password, 8);
  }

  public static async comparePassword(hashedPassword: string, password: string) {
    await delay(300);
    return compare(password, hashedPassword);
  }

  private _connected = false;
  public get connected() {
    return this._connected;
  }
  private _userInfo?: UserInfoAuth;
  public get userInfo(): UserInfoAuth | undefined {
    return this._userInfo;
  }
  public constructor(req: Request) {
    if (!UserAuth.key) throw new Error("Key for JWT not set");

    let token;
    if ((token = req.header("Authorization"))) {
      try {
        this._userInfo = verify(token.split(" ")[1], UserAuth.key) as UserInfoAuth;
        this._connected = true;
      } catch {
        throw new ErrorApi("UserAuth-2", 400, "Token invalide");
      }
    }
  }

  public isConnected() {
    if (!this.connected || !this.userInfo) throw new ErrorApi("UserAuth-1", 403, "You must be connected");
  }

  public getUserInfo() {
    this.isConnected();
    return this.userInfo as UserInfoAuth;
  }
}
