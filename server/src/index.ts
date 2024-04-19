import { initConfig, config } from "./utils/configFile";
import { Db } from "./utils/db";
import { ServerHttp } from "./utils/ServerHttp";

(async () => {
  console.log("Starting ...");
  const dateStart = new Date();
  const promises: Promise<any>[] = [];

  await initConfig("devConfig.json");

  const server = new ServerHttp({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  });
  promises.push(server.autoRoutes("../routes"));
  server.publicFolder(__dirname + "/../../client/dist", "/");

  promises.push(server.init(config.http.port, config.http.host));
  promises.push(Db.init());

  await Promise.all(promises);

  console.log(
    "listen on",
    config.http.host + ":" + config.http.port,
    Date.now() - dateStart.getTime(),
    "ms in",
    process.env.NODE_ENV
  );
})().catch(console.error);
