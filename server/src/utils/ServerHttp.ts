import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { urlencoded, json } from "body-parser";
import { promises as fs } from "fs";
import { join } from "path";
import { addAsync, ExpressWithAsync, Router, RouterWithAsync } from "@awaitjs/express";
import { ErrorApi } from "./ErrorApi";
import { ValidationError } from "yup";

import swaggerUI from "swagger-ui-express";
import swagger from "../swagger.json";

export class ServerHttp {
  private server: ExpressWithAsync;
  private router: RouterWithAsync;

  public constructor(headers: { [name: string]: string }) {
    this.server = addAsync(express());
    this.server.use(urlencoded({ extended: true }));
    this.server.use(json());
    this.server.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} ${req.ip?.toString()} ${req.method} ${req.url}`);
      for (const name in headers) res.set(name, headers[name]);
      next();
    });
    this.server.use(
      "/doc",
      swaggerUI.serve,
      swaggerUI.setup(swagger, {
        explorer: true,
      })
    );

    this.router = Router();
  }

  public addMiddleware(url: string, middleware: RequestHandler[], ...middlewares: RequestHandler[]) {
    this.server.use(url, ...middlewares);
  }

  public init(port: number, host?: string) {
    this.server.use(this.router);

    this.server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof ValidationError) err = new ErrorApi("ErrorApi-2.0", 400, err.message, false);
      const errorApi = err instanceof ErrorApi ? err : ErrorApi.unkownError(0);
      errorApi.response(res);
      if (process.env.NODE_ENV !== "production" || !(err instanceof ErrorApi)) console.error(err);
    });

    return new Promise((resolve) => {
      this.server.listen(
        {
          port,
          host,
        },
        () => {
          resolve(undefined);
        }
      );
    });
  }

  public async autoRoutes(directory: string) {
    const files = (await fs.readdir(join(__dirname, directory))).filter(
      (file) => file.endsWith(".route.ts") || file.endsWith(".route.js")
    );
    for (const file of files) {
      const module = await import(join(__dirname, directory, file));
      module?.init?.(this.router);
    }
  }

  public publicFolder(folder: string, path: string) {
    this.server.use(path, express.static(folder));
  }
}
