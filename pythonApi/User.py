import requests
from Dataset import Dataset
from server import baseUrl

def login(username: str, password: str):
    r = requests.get(baseUrl + "/user/login?username=" + username + "&password=" + password)
    if r.json().get("type") == "success":
        return User(r.json().get("res").get("token"))
    else:
        return None

def register(username: str, email: str, password: str):
    r = requests.post(baseUrl + "/user", data={"username": username, "email": email, "password": password})
    if r.json().get("type") == "success":
        return User(r.json().get("res").get("token"))
    else:
        return None

class User:
    def __init__(self, token: str) -> None:
      self.token = token

    def uploadDataset(self, path: str, collection_name: str, name: str, link: str) -> int:
      with open(path, "rb") as file:
         self.uploadDatasetWithStream(file, name, collection_name, link)
        
    def uploadDatasetWithStream(self, stream, name: str, collection_name: str, link: str) -> int:
        r = requests.post(baseUrl + "/dataset", headers={"Authorization": "Bearer " + self.token}, data={"name": name,"linkGlobal": link, "collectionName": collection_name}, files = {"file": stream}).json()
        if r.get("type") == "success":
          return Dataset(r.get("res").get("idDataset"), name, link)
        else:
           raise Exception(r.get("message"))
    
