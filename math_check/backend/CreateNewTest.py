import os
from dotenv import load_dotenv

load_dotenv()

from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

class CreateNewTest:
    def __init__(self):
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise Exception("MongoDB URI not found in environment variables")
        self.client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
        self.db = self.client["test_db"]
        self.collection = self.db["examples_collection"]

    def add_new_row(self, test_id, example_id, correct_answer, user_email, description): 
        """
        Add new row to examples_collection
        :param test_id: the test id
        :param example_id: the example id/example number
        :param correct_answer: the correct answer
        :param user_email: the  email of the user/teacher who is logged in
        :param description: the description of the example
        :return: 
        """
        document = {
            "test_id": test_id,
            "example_id": example_id,
            "correct_answer": correct_answer,
            "user_email": user_email,
            "description": description
        }
        self.collection.insert_one(document)
    
    def get_correct_answer(self, user_email, test_id, example_id):
        """
        Get the correct answer by user email, test id and example id
        :param test_id: the test id
        :param example_id: the example id/example number
        :param user_email: the  email of the user/teacher who is logged in
        :return: the correct answer
        """
        query = {
            "user_email": user_email,
            "test_id": test_id,
            "example_id": example_id
        }

        projection = {
            "_id": 0,               
            "correct_answer": 1   
        }

        result = self.collection.find_one(query, projection)

        if result:
            return result["correct_answer"]
        else:
            return None
        