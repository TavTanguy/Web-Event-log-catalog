import requests
from server import baseUrl

class Attribute:
    def __init__(self, dataset_id: int, id: int, type: str, name: str, cardinality: int, value_type: str) -> None:
        self.dataset_id = dataset_id
        self.id = id
        self.type = type
        self.name = name
        self.cardinality = cardinality
        self.value_type = value_type

    def get_values(self, limit = -1, fromLimit = 1, searchValue = ""):
        params = {"limit": limit,"from": fromLimit,"searchValue": searchValue}
        r = requests.get(baseUrl + "/dataset/"+ str(self.dataset_id) + "/attribute/" + str(self.id) + "/values", params=params).json()
        if r.get("type") == "success":
            return r.get("res")
        else:
            raise Exception(r.get("message"))