from datetime import datetime

def is_float(element: any) -> bool:
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
    except Exception as e:
        print("Error type not found")
        print(value)
        print(e)