import { RouterWithAsync } from "@awaitjs/express";
import { Request, Response } from "express";
import { response } from "../utils/Response";
import { Db } from "../utils/db";
import { number, object, string } from "yup";

const getValuesSchema = object({
  limit: number().integer().min(-1).max(200).default(20),
  from: number().integer().min(1).default(1),
  searchValue: string().default(""),
  sortBy: string().oneOf(["value", "occur", ""]).default(""),
  orderBy: string().oneOf(["ASC", "DESC"]).default("ASC"),
});
async function getValues(req: Request, res: Response) {
  const idDataset = await number().integer().positive().required().validate(req.params.id);
  const idAtt = await number().integer().positive().required().validate(req.params.idAtt);
  const info = await getValuesSchema.validate(req.query);

  const promises: Promise<Array<any>>[] = [];
  promises.push(
    Db.query(
      ` SELECT value, occur FROM (
      SELECT attribute_value as value, occur FROM attribute_value_int WHERE dataset_id = :dataset AND attribute_id = :att UNION
  SELECT attribute_value as value, occur FROM attribute_value_string WHERE dataset_id = :dataset AND attribute_id = :att UNION
  SELECT attribute_value as value, occur FROM attribute_value_float WHERE dataset_id = :dataset AND attribute_id = :att UNION
  SELECT attribute_value as value, occur FROM attribute_value_date WHERE dataset_id = :dataset AND attribute_id = :att) as t
  ${info.searchValue !== "" ? "WHERE attribute_value LIKE :value" : ""}
  ${info.sortBy !== "" ? `ORDER BY ${info.sortBy} ${info.orderBy} ` : ""}
  ${info.limit !== -1 ? "LIMIT :limit OFFSET :offset" : ""}`,
      { dataset: idDataset, att: idAtt, value: `%${info.searchValue}%`, limit: info.limit, offset: info.from - 1 }
    )
  );

  promises.push(
    Db.query(
      `SELECT COUNT(*) as totalLength FROM (
        SELECT attribute_value as value, occur FROM attribute_value_int WHERE dataset_id = :dataset AND attribute_id = :att UNION
        SELECT attribute_value as value, occur FROM attribute_value_string WHERE dataset_id = :dataset AND attribute_id = :att UNION
        SELECT attribute_value as value, occur FROM attribute_value_float WHERE dataset_id = :dataset AND attribute_id = :att UNION
        SELECT attribute_value as value, occur FROM attribute_value_date WHERE dataset_id = :dataset AND attribute_id = :att) as t`,
      { dataset: idDataset, att: idAtt, value: `%${info.searchValue}%` }
    )
  );

  const [[data], [[{ totalLength }]]] = await Promise.all(promises);

  response(res, 200, "success", { totalLength, values: data });
}

export function init(router: RouterWithAsync) {
  router.getAsync("/v1/dataset/:id/attribute/:idAtt/values", getValues);
}
