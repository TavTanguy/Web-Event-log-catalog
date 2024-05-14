import requests
from server import baseUrl
from Attribute import Attribute

class Dataset:
    def __init__(self, id: int, name: str, link: str) -> None:
        self.id = id
        self.name = name
        self.link = link

    def get_attributes(self, limit = -1, fromLimit = 1, searchConcept = "", searchType = ""):
        params = {"limit": limit,"from": fromLimit,"searchConcept": searchConcept,"searchType": searchType}
        r = requests.get(baseUrl + "/dataset/"+ str(self.id) + "/attribute", params=params).json()
        if r.get("type") == "success":
            return list(map(lambda att: Attribute(self.id, att["id"], att["type"], att["name"], att["cardinality"], att["value_type"]), r.get("res").get("attributes")))
        else:
            raise Exception(r.get("message"))

    def get_stats(self, id: int):
        r = requests.get(baseUrl + "/dataset/"+ self.id + "/stats" + id).json()
        if r.get("type") == "success":
            return r.get("res")
        else:
            raise Exception(r.get("message"))

def get_dataset():
    r = requests.get(baseUrl + "/dataset").json()
    if r.get("type") == "success":
        return list(map(lambda ds : Dataset(ds["id"], ds["name"], ds["link_global"]), r.get("res").get("datasets")))
    else:
        return None
