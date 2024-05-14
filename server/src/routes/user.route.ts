import { RouterWithAsync } from "@awaitjs/express";
import { Request, Response } from "express";
import { response } from "../utils/Response";
import { Db } from "../utils/db";
import { object, string } from "yup";
import { UserAuth, UserInfoAuth } from "../utils/UserAuth";
import { ErrorApi } from "../utils/ErrorApi";
import { delay } from "../utils/asyncTools";

const postUserSchema = object({
  username: string().required(),
  password: string().required(),
  email: string().email().required(),
});

async function postUser(req: Request, res: Response) {
  const info = await postUserSchema.validate(req.body);
  const hashPass = await UserAuth.hashPassword(info.password);
  info.password = "";
  try {
    const [{ insertId }] = (await Db.query(
      `INSERT INTO webusers (username, email, password) VALUES (:username, :email, :password)`,
      { username: info.username, email: info.email, password: hashPass }
    )) as any;
    const userInfo: UserInfoAuth = { idUser: insertId, email: info.email, username: info.username };
    const [token, expire] = UserAuth.getToken(userInfo);

    response(res, 201, "success", { userInfo, token, expire });
  } catch (err: unknown) {
    throw new ErrorApi("user-1", 400, "Username or email already exists");
  }
}

const loginUserSchema = object({
  username: string().required(),
  password: string().required(),
});

async function login(req: Request, res: Response) {
  const info = await loginUserSchema.validate(req.query);
  const [[user]] = (await Db.query(`SELECT id, email, username, password FROM webusers WHERE username = :username`, {
    username: info.username,
  })) as [[{ id: number; username: string; password: string; email: string }], any];
  if (!user) throw new ErrorApi("user-2", 400, "Username or password incorrect");
  if (!(await UserAuth.comparePassword(user.password, info.password)))
    throw new ErrorApi("user-2", 400, "Username or password incorrect");
  const userInfo: UserInfoAuth = { idUser: user.id, email: user.email, username: user.username };
  const [token, expire] = UserAuth.getToken(userInfo);
  response(res, 200, "success", { userInfo, token, expire });
}

async function getToken(req: Request, res: Response) {
  const userInfo = new UserAuth(req).getUserInfo();
  const [token, expire] = UserAuth.getToken(userInfo);
  response(res, 200, "success", { userInfo, token, expire });
}

async function getTest(req: Request, res: Response) {
  //const userInfo = new UserAuth(req).getUserInfo();
  res.status(102);
  await delay(3000);
  response(res, 200, "success", { test: "ok" });
}

export function init(router: RouterWithAsync) {
  router.postAsync("/v1/user", postUser);
  router.getAsync("/v1/user/login", login);
  router.getAsync("/v1/user/token", getToken);
  router.getAsync("/v1/user/test", getTest);
}
