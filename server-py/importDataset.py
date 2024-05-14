import time
import mysql.connector
import sys
from pm4py.streaming.importer.xes import importer as xes_importer
import typeList
import statistics

def get_infos(stream):
    trace_values = {}
    events_values = {}
    trace_length = []
    trace_count = 0

    for trace in stream:
        trace_count += 1
        for name_att in trace.attributes:
            if name_att not in trace_values:
                trace_values[name_att] = {}
            if trace.attributes[name_att] not in trace_values[name_att]:
                trace_values[name_att][trace.attributes[name_att]] = 0
            trace_values[name_att][trace.attributes[name_att]] += 1

        trace_length.append(len(trace))
        for event in trace:
            for name_att in event:
                if name_att not in events_values:
                    events_values[name_att] = {}
                if event[name_att] not in events_values[name_att]:
                    events_values[name_att][event[name_att]] = 0
                events_values[name_att][event[name_att]] += 1
    return trace_values, events_values, trace_length, trace_count

def select_or_insert_collection(cursor, collection_name):
    cursor.execute("SELECT id FROM collections WHERE name = %s", (collection_name,))
    collectionRes = cursor.fetchone()
    collectionId = None
    if collectionRes is None:
        cursor.execute("INSERT IGNORE INTO collections (name) VALUES (%s)", (collection_name,))
        collectionId = cursor.lastrowid
    else:
        collectionId = collectionRes[0]
    return collectionId

def select_or_insert_attribute(cursor, name, type, is_trace):
    cursor.execute("SELECT id, value_type FROM attributes WHERE name = %s AND value_type = %s", (name, type))
    sqlRes = cursor.fetchone()
    attributesId = None
    if sqlRes is None or type != sqlRes[1]:
        cursor.execute("INSERT INTO attributes (name, value_type) VALUES (%s, %s)", (name, type))
        attributesId = cursor.lastrowid
        cursor.execute("INSERT INTO attribute_types (attribute_id, type_id) VALUES (%s, %s)", (attributesId, 3 if is_trace else 2))
    else:
        attributesId = sqlRes[0]
        type = sqlRes[1]
    return attributesId

def insert_cardinality(cursor, datasetId, attributesId, is_trace, cardinality):
    cursor.execute("INSERT INTO dataset_attribute_cardinality (dataset_id, attribute_id, type_id, cardinality) VALUES (%s, %s, %s, %s)", (datasetId, attributesId, 3 if is_trace else 2, cardinality))

def insert_values(cursor, type, values, attributesId, datasetId):
    strSql = "INSERT INTO attribute_value_" + type + " (attribute_value, attribute_id, dataset_id, occur) VALUES (%s, %s, %s, %s)"
    data = []
    for name_value in values:
        data.append((name_value, attributesId, datasetId, values[name_value]))
    cursor.executemany(strSql, data)

def import_xes(cursor, path, collection_name, name, link_global = None, author = None):
    stream = xes_importer.apply(path, variant=xes_importer.xes_trace_stream)
    collectionId = select_or_insert_collection(cursor, collection_name)
    cursor.execute("INSERT INTO datasets (collection_id, name, link_global, author) VALUES (%s, %s, %s, %s)", (collectionId, name,link_global, author))
    datasetId = cursor.lastrowid

    trace_values, events_values, trace_length, trace_count = get_infos(stream)
    for name_att in trace_values:
        type = typeList.get_type(trace_values[name_att].keys())
        attributesId = select_or_insert_attribute(cursor, name_att, type, True)
        insert_cardinality(cursor, datasetId, attributesId, True, len(trace_values[name_att]))
        insert_values(cursor, type, trace_values[name_att], attributesId, datasetId)
    for name_att in events_values:
        type = typeList.get_type(events_values[name_att].keys())
        attributesId = select_or_insert_attribute(cursor, name_att, type, False)
        insert_cardinality(cursor, datasetId, attributesId, False, len(events_values[name_att]))
        insert_values(cursor, type, events_values[name_att], attributesId, datasetId)
    start_activities = min(events_values["time:timestamp"]) if "time:timestamp" in events_values else None
    end_activities = max(events_values["time:timestamp"]) if "time:timestamp" in events_values else None
    trace_length_min = min(trace_length)
    trace_length_max = max(trace_length)
    trace_length_mean = statistics.mean(trace_length)
    trace_length_std = statistics.stdev(trace_length)
    
    cursor.execute("""INSERT INTO dataset_stats2
        (dataset_id, start_activities, end_activities, trace_count, trace_length_min, trace_length_max, trace_length_mean, trace_length_std)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""", 
        (datasetId, start_activities, end_activities, trace_count, trace_length_min, trace_length_max, trace_length_mean, trace_length_std)
    )
    return datasetId

def importDataset(config, path, collection_name, name, link_global = None, author = None):
    db = mysql.connector.connect(
        host=config["db"]["host"],
        user=config["db"]["user"],
        password=config["db"]["password"],
        database=config["db"]["database"],
    )
    cursor = db.cursor(buffered=True)
    try:
        start = time.time()
        idDataset = import_xes(cursor, path, collection_name, name, link_global, author)
        db.commit()
        print("Time: " + str(time.time() - start))
        return {"state": "success", "idDataset": str(idDataset)}
    except Exception as e:
        db.rollback()
        if e.errno == 1062 and e.sqlstate == '23000':
            print(e)
            return {"state": "error", "message": "dataset already exist"}
        else:
            print(e)

sys.modules[__name__] = importDataset