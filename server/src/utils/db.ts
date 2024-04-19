import mysql from "mysql2/promise";
import { config } from "./configFile";

export class Db {
  private static instance: mysql.Connection;

  public static async init() {
    Db.instance = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      database: config.db.database,
      password: config.db.password,
    });
  }

  public static query(sql: string, values?: any) {
    return Db.instance.query(sql, values);
  }

  public static down() {
    return Db.instance.end();
  }
}
