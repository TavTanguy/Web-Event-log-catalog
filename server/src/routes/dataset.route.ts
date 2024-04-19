import { RouterWithAsync } from "@awaitjs/express";
import { Request, Response } from "express";
import { response } from "../utils/Response";
import { ErrorApi } from "../utils/ErrorApi";
import { Db } from "../utils/db";
import { number, object, string } from "yup";

const getDatasetsSchema = object({
  limit: number().integer().min(0).max(200).default(20),
  from: number().integer().min(1).default(1),
  searchName: string().default(""),
  sortBy: string().oneOf(["name", "id", "link_local", "link_local_metadata", "link_global", ""]).default(""),
  orderBy: string().oneOf(["ASC", "DESC"]).default("ASC"),
});

//recherche en fonction de attribute
async function getDatasets(req: Request, res: Response) {
  const info = await getDatasetsSchema.validate(req.query);

  const dataSql: Array<number | string> = [info.limit, info.from - 1];
  if (info.searchName !== "") dataSql.unshift(`%${info.searchName}%`);
  const promises: Promise<Array<any>>[] = [];
  promises.push(
    Db.query(
      `SELECT id, name, link_local, link_local_metadata, link_global FROM datasets
    ${info.searchName !== "" ? "WHERE name LIKE ? " : ""}
    ${info.sortBy !== "" ? `ORDER BY ${info.sortBy} ${info.orderBy} ` : ""} 
    LIMIT ? OFFSET ?`,
      dataSql
    )
  );

  promises.push(
    Db.query(
      `SELECT COUNT(*) as totalLength FROM datasets ${info.searchName !== "" ? "WHERE name LIKE ? " : ""}`,
      info.searchName !== "" ? [`%${info.searchName}%`] : []
    )
  );

  const [[datasets], [[{ totalLength }]]] = await Promise.all(promises);

  response(res, 200, "success", { length: datasets?.length || 0, totalLength, datasets });
}

const getAttributesSchema = object({
  limit: number().integer().min(0).max(200).default(20),
  from: number().integer().min(0).default(0),
  searchName: string().default(""),
  sortBy: string().oneOf(["name", "cardinality", ""]).default(""),
  orderBy: string().oneOf(["ASC", "DESC"]).default("ASC"),
});

async function getAttributes(req: Request, res: Response) {
  const idDatabase = await number().integer().positive().required().validate(req.params.id);
  const info = await getAttributesSchema.validate(req.query);

  const promises: Promise<Array<any>>[] = [];

  const dataSql: Array<number | string> = [idDatabase];
  if (info.searchName !== "") dataSql.push(`%${info.searchName}%`);
  dataSql.push(info.limit, info.from - 1);
  promises.push(
    Db.query(
      `SELECT attributes.name, dataset_attribute_cardinality.cardinality FROM dataset_attribute_cardinality
  JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id
  WHERE dataset_attribute_cardinality.dataset_id = ?
  ${info.searchName !== "" ? "AND attributes.name LIKE ? " : ""}
    ${info.sortBy !== "" ? `ORDER BY ${info.sortBy} ${info.orderBy} ` : ""}
    LIMIT ? OFFSET ?`,
      dataSql
    )
  );

  promises.push(
    Db.query(
      `SELECT COUNT(*) as totalLength FROM dataset_attribute_cardinality
  JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id
  WHERE dataset_attribute_cardinality.dataset_id = ?
  ${info.searchName !== "" ? "AND attributes.name LIKE ? " : ""}`,
      ([idDatabase] as any[]).concat(info.searchName !== "" ? [`%${info.searchName}%`] : [])
    )
  );

  const [[attributes], [[{ totalLength }]]] = await Promise.all(promises);
  response(res, 200, "success", { length: attributes?.length || 0, totalLength, attributes });
}

export function init(router: RouterWithAsync) {
  router.getAsync("/v1/dataset", getDatasets);
  router.getAsync("/v1/dataset/:id/attributes", getAttributes);
}
