import { array, InferType, number, object, string } from "yup";
import { promises as fs } from "fs";

const configSchema = object({
  http: object({
    host: string().required(),
    port: number().required().integer().positive(),
    headers: object().default({}),
    publicFolder: string().required(),
  }).required(),
  db: object({
    host: string().required(),
    port: number().required().integer().positive(),
    user: string().required(),
    password: string(),
    database: string().required(),
  }).required(),
  uploadFile: object({
    path: string().required(),
    limitSize: number().required().integer().positive(),
    urlImportDataset: string().required(),
  }).required(),
  jwt: object({
    key: string().required(),
    expiresIn: string().required(),
  }).required(),
});
interface Config extends InferType<typeof configSchema> {}

export let config: Config;

export async function initConfig(file: string) {
  const configStr = await fs.readFile(file, { encoding: "utf-8" });
  config = await configSchema.validate(JSON.parse(configStr));
}

export const inProd = process.env.NODE_ENV === "production";
export const inDev = process.env.NODE_ENV === "development";
