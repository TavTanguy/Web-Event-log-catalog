import pm4py
import mysql.connector
import sys
from datetime import datetime
import json

config = json.load(open("./configs/devConfig.json" if len(sys.argv) < 2 else sys.argv[1]))
db = mysql.connector.connect(
            host=config["db"]["host"],
            user=config["db"]["user"],
            password=config["db"]["password"],
            database=config["db"]["database"],
            pool_name="pool",
            pool_size=10
        )
cursor = db.cursor()
 
def is_float(element: any) -> bool:
    #If you expect None to be passed:
    if element is None: 
        return False
    try:
        float(element)
        return True
    except ValueError:
        return False
    
def is_date(element: any) -> bool:
    if isinstance(element, datetime):
        return True
    try:
        return bool(datetime.strptime(element, '%Y-%m-%dT%H:%M:%S.%f%z'))
    except:
        return False

def get_type(value: list) -> str:
    types = list(map(get_type_element, value))
    if "string" in types:
        return "string"
    if "float" in types:
        return "float"
    return types[0]
    

def get_type_element(value):
    try:
        if isinstance(value, float):
            return "float"
        if isinstance(value, int):
            return "int"
        if is_date(value):
            return "date"
        if value.strip and value.strip().isdigit():
            return "int"
        if is_float(value):
            return "float"
        if value == "true" or value == "false":
            return "bool"
        return "string"
    except:
        print("Error")
        print(value)

def insert_attribute(type, atts, attributesId, datasetId):
    if(len(atts) != 0):
        strSql = "INSERT INTO attribute_value_" + type + " (attribute_value, attribute_id, dataset_id, occur) VALUES (%s, %s, %s, %s)"
        data = []
        for att in atts:
            data.append((att[0], attributesId, datasetId, att[1]))
        cursor.executemany(strSql, data)

def import_event_att(event_log, datasetId):
    attributes = pm4py.get_event_attributes(event_log)
    for i in range(len(attributes)):
        valuesAgregate = pm4py.get_event_attribute_values(event_log, attributes[i])
        cursor.execute("SELECT id, value_type FROM attributes WHERE name = %s", (attributes[i],))
        sqlRes = cursor.fetchone()
        attributesId = None
        type = None
        if sqlRes is None:
            type = get_type(list(valuesAgregate.keys()))
            cursor.execute("INSERT INTO attributes (name, value_type) VALUES (%s, %s)", (attributes[i], type))
            attributesId = cursor.lastrowid
            cursor.execute("INSERT INTO attribute_types (attribute_id, type_id) VALUES (%s, %s)", (attributesId, 2))
        else:
            attributesId = sqlRes[0]
            type = sqlRes[1]
        values = []
        for key in valuesAgregate:
             values.append((key, valuesAgregate[key]))
        insert_attribute(type, values, attributesId, datasetId)

def import_trace_att(event_log, datasetId):
    attributes = pm4py.get_trace_attributes(event_log)
    for i in range(len(attributes)):
        valuesAgregate = pm4py.get_trace_attribute_values(event_log, attributes[i])
        cursor.execute("SELECT id, value_type FROM attributes WHERE name = %s", (attributes[i],))
        sqlRes = cursor.fetchone()
        attributesId = None
        type = None
        if sqlRes is None:
            type = get_type(list(valuesAgregate.keys()))
            cursor.execute("INSERT INTO attributes (name, value_type) VALUES (%s, %s)", (attributes[i], type))
            attributesId = cursor.lastrowid
            cursor.execute("INSERT INTO attribute_types (attribute_id, type_id) VALUES (%s, %s)", (attributesId, 3))
            cursor.execute("INSERT INTO dataset_attribute_cardinality (dataset_id, attribute_id, cardinality) VALUES (%s, %s, %s)", (datasetId, attributesId, len(valuesAgregate)))
        else:
            attributesId = sqlRes[0]
            type = sqlRes[1]
        values = []
        for key in valuesAgregate:
             values.append((key, valuesAgregate[key]))
        insert_attribute(type, values, attributesId, datasetId)



def import_xes(file_path, name, link_global = None):
    event_log = pm4py.read_xes(file_path)
    cursor.execute("INSERT INTO datasets (name, link_global) VALUES (%s, %s)", (name,link_global))
    datasetId = cursor.lastrowid
    import_trace_att(event_log, datasetId)
    import_event_att(event_log, datasetId)
    return datasetId


def importDataset(config, path, name, link_global = None):
    try:
        idDataset = import_xes(path, name, link_global)
        db.commit()
        return {"state": "success", "idDataset": str(idDataset)}
    except Exception as e:
        if e.errno == 1062 and e.sqlstate == '23000':
            return {"state": "error", "message": "dataset already exist"}
        else:
            print(e)

sys.modules[__name__] = importDataset