import { RouterWithAsync } from "@awaitjs/express";
import { NextFunction, Request, Response } from "express";
import { response } from "../utils/Response";
import { Db } from "../utils/db";
import { number, object, string } from "yup";
import multer from "multer";
import { UserAuth } from "../utils/UserAuth";
import { ErrorApi } from "../utils/ErrorApi";
import { join } from "path";
import { promises as fs } from "fs";
import { config } from "../utils/configFile";

const getDatasetsSchema = object({
  limit: number().integer().min(-1).max(200).default(20),
  from: number().integer().min(1).default(1),
  searchName: string().default(""),
  searchNameAttribute: string().default(""),
  searchCollName: string().default(""),
  minCardinality: number().integer().min(0).nullable(),
  maxCardinality: number().integer().min(0).nullable(),
  sortBy: string().oneOf(["name", "collectionName", "id", "link_global", "author", ""]).default(""),
  orderBy: string().oneOf(["ASC", "DESC"]).default("ASC"),
});

async function getDatasets(req: Request, res: Response) {
  const info = await getDatasetsSchema.validate(req.query);
  const nameOfColumns = {
    name: "datasets.name",
    collectionName: "collections.name",
    id: "datasets.id",
    author: "datasets.author",
    link_global: "datasets.link_global",
  };

  const promises: Promise<Array<any>>[] = [];
  const rangeCardinality = info.minCardinality !== undefined && info.maxCardinality !== undefined;
  let whereCondition =
    info.searchNameAttribute !== "" || info.searchName !== "" || info.searchCollName !== "" || rangeCardinality;
  promises.push(
    Db.query(
      `SELECT DISTINCT datasets.id, collections.name as collectionName, datasets.name, datasets.link_global, datasets.author FROM datasets
      JOIN collections ON collections.id = datasets.collection_id
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
      info.searchCollName !== "" ? "collections.name LIKE :searchCollName " : "",
      rangeCardinality ? "dataset_attribute_cardinality.cardinality BETWEEN :minCardinality AND :maxCardinality " : "",
    ]
      .filter((x) => x !== "")
      .join("AND ")}

    ${info.sortBy !== "" ? `ORDER BY ${nameOfColumns[info.sortBy]} ${info.orderBy} ` : ""} 
    ${info.limit !== -1 ? "LIMIT :limit OFFSET :offset" : ""}`,
      {
        searchName: `%${info.searchName}%`,
        searchNameAttribute: `%${info.searchNameAttribute}%`,
        searchCollName: `%${info.searchCollName}%`,
        minCardinality: info.minCardinality,
        maxCardinality: info.maxCardinality,
        limit: info.limit,
        offset: info.from - 1,
      }
    )
  );

  promises.push(
    Db.query(
      `SELECT COUNT(DISTINCT datasets.id) as totalLength FROM datasets
    ${
      info.searchNameAttribute !== "" || rangeCardinality
        ? `LEFT JOIN dataset_attribute_cardinality ON dataset_attribute_cardinality.dataset_id = datasets.id
        LEFT JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id`
        : ""
    }
    ${info.searchCollName !== "" ? `LEFT JOIN collections ON collections.id = datasets.collection_id` : ""}

    ${whereCondition ? "WHERE " : ""}
    ${[
      info.searchName !== "" ? "datasets.name LIKE :searchName " : "",
      info.searchNameAttribute !== "" ? "attributes.name LIKE :searchNameAttribute " : "",
      info.searchCollName !== "" ? "collections.name LIKE :searchCollName " : "",
      rangeCardinality ? "dataset_attribute_cardinality.cardinality BETWEEN :minCardinality AND :maxCardinality " : "",
    ]
      .filter((x) => x !== "")
      .join("AND ")}`,
      {
        searchName: `%${info.searchName}%`,
        searchNameAttribute: `%${info.searchNameAttribute}%`,
        searchCollName: `%${info.searchCollName}%`,
        minCardinality: info.minCardinality,
        maxCardinality: info.maxCardinality,
      }
    )
  );

  whereCondition = info.searchNameAttribute !== "" || info.searchName !== "" || info.searchCollName !== "";
  promises.push(
    Db.query(
      `SELECT MIN(dataset_attribute_cardinality.cardinality) as minCardinality, MAX(dataset_attribute_cardinality.cardinality) as maxCardinality FROM datasets
      LEFT JOIN dataset_attribute_cardinality ON dataset_attribute_cardinality.dataset_id = datasets.id
    ${
      info.searchNameAttribute !== "" || rangeCardinality
        ? `LEFT JOIN attributes ON dataset_attribute_cardinality.attribute_id = attributes.id`
        : ""
    }
    ${info.searchCollName !== "" ? `LEFT JOIN collections ON collections.id = datasets.collection_id` : ""}

    ${whereCondition ? "WHERE " : ""}
    ${[
      info.searchName !== "" ? "datasets.name LIKE :searchName " : "",
      info.searchNameAttribute !== "" ? "attributes.name LIKE :searchNameAttribute " : "",
      info.searchCollName !== "" ? "collections.name LIKE :searchCollName " : "",
    ]
      .filter((x) => x !== "")
      .join("AND ")}`,
      {
        searchName: `%${info.searchName}%`,
        searchNameAttribute: `%${info.searchNameAttribute}%`,
        searchCollName: `%${info.searchCollName}%`,
        minCardinality: info.minCardinality,
        maxCardinality: info.maxCardinality,
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

async function getStatsOfDataset(req: Request, res: Response) {
  const idDatabase = await number().integer().positive().required().validate(req.params.id);
  const [[stats]] = (await Db.query(
    `SELECT start_activities, end_activities, trace_count, trace_length_min, trace_length_max, trace_length_mean, trace_length_std FROM dataset_stats2 WHERE dataset_id = :id`,
    {
      id: idDatabase,
    }
  )) as any[][];
  response(res, 200, "success", stats);
}

const postDatasetSchema = object({
  collectionName: string().required(),
  name: string().required(),
  linkGlobal: string().url(),
  author: string(),
});
const multerUpload = multer({
  dest: config.uploadFile.path,
  limits: { fileSize: config.uploadFile.limitSize },
});
function postDataste(req: Request, res: Response, next: NextFunction) {
  if (!req.file || typeof req.file.filename !== "string")
    throw new ErrorApi("datasetRt-1", 400, "file is required", false);

  const filename = req.file.filename;
  const size = req.file.size;
  const pathdir = config.uploadFile.path;
  const filePath = join(pathdir, filename);
  (async function () {
    new UserAuth(req).isConnected();
    const info = await postDatasetSchema.validate(req.body);
    req.socket.setTimeout(1000 * 60 * 15);
    try {
      const start = Date.now();
      const ress = await fetch(config.uploadFile.urlImportDataset, {
        method: "POST",
        body: new URLSearchParams({
          path: filename,
          name: info.name,
          linkGlobal: info.linkGlobal || "",
          collectionName: info.collectionName,
          author: info.author || "",
        }),
      });
      const time = Date.now() - start;
      if (time > 5000) await fs.writeFile(join(pathdir, "time.txt"), (time / size).toString());
      const resPy = JSON.parse(await ress.text()) as { state: string; idDataset: number; message?: string } | undefined;
      if (resPy?.state === "error" && resPy.message) throw new ErrorApi("datasetRt-2", 400, resPy.message, false);
      if (resPy?.state !== "success") throw new ErrorApi("datasetRt-3", 400, "Incorrect file", false);
      //await fs.rename(filePath, join(pathdir, resPy.idDataset.toString() + ".xes"));
      response(res, 201, "success", { message: "file uploaded", idDataset: resPy.idDataset });
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorApi) throw err;
      throw new ErrorApi("datasetRt-4", 400, "Incorrect file", false);
    }
  })()
    .catch(function (err) {
      next(err);
    })
    .finally(() => {
      fs.rm(filePath);
    });
}

async function getTimeToUploadDataset(req: Request, res: Response) {
  const pathdir = config.uploadFile.path;
  const time = await fs.readFile(join(pathdir, "time.txt"), "utf8");
  response(res, 200, "success", { time });
}

export function init(router: RouterWithAsync) {
  router.getAsync("/v1/dataset", getDatasets);
  router.getAsync("/v1/dataset/:id/stats", getStatsOfDataset);
  router.post("/v1/dataset", multerUpload.single("file"), postDataste);
  router.getAsync("/v1/dataset/timeupload", getTimeToUploadDataset);
}
