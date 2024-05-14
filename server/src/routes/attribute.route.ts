import { RouterWithAsync } from "@awaitjs/express";
import { Request, Response } from "express";
import { response } from "../utils/Response";
import { Db } from "../utils/db";
import { number, object, string } from "yup";

const getAttributesSchema = object({
  limit: number().integer().min(-1).max(200).default(20),
  from: number().integer().min(1).default(1),
  searchConcept: string().default(""),
  searchType: string().default(""),
  sortBy: string().oneOf(["type", "name", "cardinality", "value_type", ""]).default(""),
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
    value_type: "attributes.value_type",
  };

  promises.push(
    Db.query(
      `SELECT types.name as type, attributes.name as name, dataset_attribute_cardinality.cardinality, attributes.id as id, value_type FROM dataset_attribute_cardinality
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

export function init(router: RouterWithAsync) {
  router.getAsync("/v1/dataset/:id/attribute", getAttributes);
}
