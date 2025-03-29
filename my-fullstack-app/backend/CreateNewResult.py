import os
from dotenv import load_dotenv

load_dotenv()

from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

class CreateNewResult:
    def __init__(self):
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise Exception("MongoDB URI not found in environment variables")
        self.client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
        self.db = self.client["test_db"]
        self.collection = self.db["results_collection"]


    def add_new_row(self, test_id, example_id, student_id, user_email, student_answer,answer_result, created_at, file_name):
        """
        Add new row to results_collection
        :param test_id: the test id
        :param example_id: the example id/example number
        :param student_id: the id of the student/(e.g. 111222)
        :param user_email: the  email of the user/teacher who is logged in
        :param student_answer: the answer from student
        :param answer_result: boolean value indicating whether the student's answer is correct or not
        :param created_at: the date when the result was checked
        :param file_name: the image name
        :return: 
        """
        document = {
            "test_id": test_id,
            "example_id": example_id,
            "student_id": student_id,
            "user_email": user_email,
            "student_answer": student_answer,
            "answer_results": answer_result,
            "created_at": created_at,
            "file_name": file_name
        }
        self.collection.insert_one(document)
     
    