import Dataset
import User

user = User.login("TestUser2", "SecurPass1")
dataset = Dataset.get_dataset()[0]
print(dataset.get_attributes)
print(dataset.get_attributes()[0].get_values())