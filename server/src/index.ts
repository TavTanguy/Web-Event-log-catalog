import { delay } from "./utils/asyncTools";
import { initConfig, config, inDev, inProd } from "./utils/configFile";
import { Db } from "./utils/db";
import { ServerHttp } from "./utils/ServerHttp";
import { UserAuth } from "./utils/UserAuth";
(async () => {
  console.log("Starting ...");
  const dateStart = new Date();
  const promises: Promise<any>[] = [];
  if (inDev) await initConfig("../configs/devConfig.json");
  else if (inProd) await initConfig(process.env.CONFIG_FILE || "");
  const server = new ServerHttp(config.http.headers);
  promises.push(server.autoRoutes("../routes"));
  server.publicFolder(config.http.publicFolder, "/");

  promises.push(server.init(config.http.port, config.http.host));
  promises.push(Db.init());
  UserAuth.setKey(config.jwt.key, config.jwt.expiresIn);
  await Promise.all(promises);

  console.log(
    "listen on",
    config.http.host + ":" + config.http.port,
    Date.now() - dateStart.getTime(),
    "ms in",
    process.env.NODE_ENV
  );
})().catch(console.error);
