import { RouterWithAsync } from "@awaitjs/express";
import { NextFunction, Request, Response } from "express";
import { response } from "../utils/Response";
import { Db } from "../utils/db";
import { number, object, ref, string } from "yup";
import multer from "multer";
import { UserAuth } from "../utils/UserAuth";
import { App, PythonApp } from "../utils/PythonApp";
import { ErrorApi } from "../utils/ErrorApi";
import { join } from "path";
import { promises as fs } from "fs";
import { config } from "../utils/configFile";

const getDatasetsSchema = object({
  limit: number().integer().min(-1).max(200).default(20),
  from: number().integer().min(1).default(1),
  searchName: string().default(""),
  searchNameAttribute: string().default(""),
  minCardinality: number().integer().min(0).nullable(),
  maxCardinality: number().integer().min(0).nullable(),
  sortBy: string().oneOf(["name", "id", "link_local", "link_local_metadata", "link_global", ""]).default(""),
  orderBy: string().oneOf(["ASC", "DESC"]).default("ASC"),
});

async function getDatasets(req: Request, res: Response) {
  const info = await getDatasetsSchema.validate(req.query);
  info.maxCardinality = undefined;
  info.maxCardinality = undefined;
  const promises: Promise<Array<any>>[] = [];
  const rangeCardinality = info.minCardinality !== undefined && info.maxCardinality !== undefined;
  let whereCondition = info.searchNameAttribute !== "" || info.searchName !== "" || rangeCardinality;
  promises.push(
    Db.query(
      `SELECT DISTINCT datasets.id, datasets.name, datasets.link_local, datasets.link_local_metadata, datasets.link_global FROM datasets
    ${
      info.searchNameAttribute !== "" || rangeCardinality
        ? `JOIN dataset_attribute_cardinality ON dataset_attribute_cardinality.dataset_id = datasets.id
        JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id`
        : ""
    }

    ${whereCondition ? "WHERE " : ""}
    ${[
      info.searchName !== "" ? "datasets.name LIKE :searchName " : "",
      info.searchNameAttribute !== "" ? "attributes.name LIKE :searchNameAttribute " : "",
      rangeCardinality ? "dataset_attribute_cardinality.cardinality BETWEEN :minCardinality AND :maxCardinality " : "",
    ]
      .filter((x) => x !== "")
      .join("AND ")}

    ${info.sortBy !== "" ? `ORDER BY ${info.sortBy} ${info.orderBy} ` : ""} 
    ${info.limit !== -1 ? "LIMIT :limit OFFSET :offset" : ""}`,
      {
        searchName: `%${info.searchName}%`,
        searchNameAttribute: `%${info.searchNameAttribute}%`,
        minCardinality: info.minCardinality,
        maxCardinality: info.maxCardinality,
        limit: info.limit,
        offset: info.from - 1,
      }
    )
  );

  promises.push(
    Db.query(
      `SELECT COUNT(*) as totalLength FROM datasets
    ${
      info.searchNameAttribute !== "" || rangeCardinality
        ? `JOIN dataset_attribute_cardinality ON dataset_attribute_cardinality.dataset_id = datasets.id
        JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id`
        : ""
    }

    ${whereCondition ? "WHERE " : ""}
    ${[
      info.searchName !== "" ? "datasets.name LIKE :searchName " : "",
      info.searchNameAttribute !== "" ? "attributes.name LIKE :searchNameAttribute " : "",
      rangeCardinality ? "dataset_attribute_cardinality.cardinality BETWEEN :minCardinality AND :maxCardinality " : "",
    ]
      .filter((x) => x !== "")
      .join("AND ")}`,
      {
        searchName: `%${info.searchName}%`,
        searchNameAttribute: `%${info.searchNameAttribute}%`,
        minCardinality: info.minCardinality,
        maxCardinality: info.maxCardinality,
      }
    )
  );

  whereCondition = info.searchNameAttribute !== "" || info.searchName !== "";
  promises.push(
    Db.query(
      `SELECT MIN(dataset_attribute_cardinality.cardinality) as minCardinality, MAX(dataset_attribute_cardinality.cardinality) as maxCardinality FROM datasets
      JOIN dataset_attribute_cardinality ON dataset_attribute_cardinality.dataset_id = datasets.id
    ${
      info.searchNameAttribute !== "" || rangeCardinality
        ? `JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id`
        : ""
    }

    ${whereCondition ? "WHERE " : ""}
    ${[
      info.searchName !== "" ? "datasets.name LIKE :searchName " : "",
      info.searchNameAttribute !== "" ? "attributes.name LIKE :searchNameAttribute " : "",
    ]
      .filter((x) => x !== "")
      .join("AND ")}`,
      {
        searchName: `%${info.searchName}%`,
        searchNameAttribute: `%${info.searchNameAttribute}%`,
      }
    )
  );

  const [[datasets], [[{ totalLength }]], [[{ maxCardinality, minCardinality }]]] = await Promise.all(promises);

  response(res, 200, "success", {
    length: datasets?.length || 0,
    totalLength,
    maxCardinality,
    minCardinality,
    datasets,
  });
}

const getAttributesSchema = object({
  limit: number().integer().min(-1).max(200).default(20),
  from: number().integer().min(0).default(0),
  searchConcept: string().default(""),
  searchType: string().default(""),
  sortBy: string().oneOf(["type", "name", "cardinality", ""]).default(""),
  orderBy: string().oneOf(["ASC", "DESC"]).default("ASC"),
});

async function getAttributes(req: Request, res: Response) {
  const idDatabase = await number().integer().positive().required().validate(req.params.id);
  const info = await getAttributesSchema.validate(req.query);

  const promises: Promise<Array<any>>[] = [];
  const nameOfColumns = {
    type: "types.name",
    name: "attributes.name",
    cardinality: "dataset_attribute_cardinality.cardinality",
  };

  promises.push(
    Db.query(
      `SELECT types.name as type, attributes.name as name, dataset_attribute_cardinality.cardinality, attributes.id as id FROM dataset_attribute_cardinality
  JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id
  LEFT JOIN  attribute_types ON attribute_types.attribute_id = attributes.id LEFT JOIN types ON types.id = attribute_types.type_id
  WHERE dataset_attribute_cardinality.dataset_id = :id
  ${info.searchConcept !== "" ? "AND attributes.name LIKE :attName " : ""}
  ${info.searchType !== "" ? "AND types.name LIKE :typeName " : ""}
    ${info.sortBy !== "" ? `ORDER BY ${nameOfColumns[info.sortBy]} ${info.orderBy} ` : ""}
    ${info.limit !== -1 ? "LIMIT :limit OFFSET :offset" : ""}`,
      {
        id: idDatabase,
        attName: `%${info.searchConcept}%`,
        typeName: `%${info.searchType}%`,
        limit: info.limit,
        offset: info.from - 1,
      }
    )
  );

  promises.push(
    Db.query(
      `SELECT COUNT(*) as totalLength FROM dataset_attribute_cardinality
  JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id
  LEFT JOIN  attribute_types ON attribute_types.attribute_id = attributes.id LEFT JOIN types ON types.id = attribute_types.type_id
  WHERE dataset_attribute_cardinality.dataset_id = :id
  ${info.searchConcept !== "" ? "AND attributes.name LIKE :attName " : ""}
  ${info.searchType !== "" ? "AND types.name LIKE :typeName " : ""}
  `,
      {
        id: idDatabase,
        attName: `%${info.searchConcept}%`,
        typeName: `%${info.searchType}%`,
      }
    )
  );

  const [[attributes], [[{ totalLength }]]] = await Promise.all(promises);
  response(res, 200, "success", { length: attributes?.length || 0, totalLength, attributes });
}

async function getValues(req: Request, res: Response) {
  const idDataset = await number().integer().positive().required().validate(req.params.id);
  const idAtt = await number().integer().positive().required().validate(req.params.idAtt);

  const [data] = (await Db.query(
    `SELECT attribute_value as value, occur FROM attribute_value_int WHERE dataset_id = :dataset AND attribute_id = :att UNION
  SELECT attribute_value, occur FROM attribute_value_string WHERE dataset_id = :dataset AND attribute_id = :att UNION
  SELECT attribute_value, occur FROM attribute_value_float WHERE dataset_id = :dataset AND attribute_id = :att UNION
  SELECT attribute_value, occur FROM attribute_value_date WHERE dataset_id = :dataset AND attribute_id = :att`,
    { dataset: idDataset, att: idAtt }
  )) as any[][][];

  response(res, 200, "success", { values: data, totalLength: data.length });
}

const postDatasetSchema = object({
  name: string().required(),
  linkGlobal: string().url(),
});
const multerUpload = multer({
  dest: config.uploadFile.path,
  limits: { fileSize: config.uploadFile.limitSize },
});
function postDataste(req: Request, res: Response, next: NextFunction) {
  if (!req.file || typeof req.file.filename !== "string")
    throw new ErrorApi("datasetRt-1", 400, "file is required", false);

  const filename = req.file.filename;
  const pathdir = config.uploadFile.path;
  const filePath = join(pathdir, filename);
  (async function () {
    new UserAuth(req).isConnected();
    const info = await postDatasetSchema.validate(req.body);
    req.socket.setTimeout(1000 * 60 * 10);
    try {
      const ress = await fetch(config.uploadFile.urlImportDataset, {
        method: "POST",
        body: new URLSearchParams({ path: filename, name: info.name, linkGlobal: info.linkGlobal || "" }),
      });
      const resPy = JSON.parse(await ress.text()) as { state: string; idDataset: number; message?: string } | undefined;
      if (resPy?.state === "error" && resPy.message) throw new ErrorApi("datasetRt-2", 400, resPy.message, false);
      if (resPy?.state !== "success") throw new ErrorApi("datasetRt-3", 400, "Incorrect file", false);
      await fs.rename(filePath, join(pathdir, resPy.idDataset.toString() + ".xes"));
      response(res, 201, "success", { message: "file uploaded" });
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorApi) throw err;
      throw new ErrorApi("datasetRt-4", 400, "Incorrect file", false);
    }
  })().catch(function (err) {
    fs.rm(filePath);
    next(err);
  });
}

export function init(router: RouterWithAsync) {
  router.getAsync("/v1/dataset", getDatasets);
  router.getAsync("/v1/dataset/:id/attribute", getAttributes);
  router.getAsync("/v1/dataset/:id/attribute/:idAtt/values", getValues);
  router.post("/v1/dataset", multerUpload.single("file"), postDataste);
}
