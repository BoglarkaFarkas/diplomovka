from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import csv
from io import StringIO
from typing import Optional
from CreateNewTest import CreateNewTest
from CreateNewResult import CreateNewResult
from calculators.CorankMatrix import CorankMatrix
from calculators.DeterminantMatrix import DeterminantMatrix
from calculators.RankMatrix import RankMatrix
from calculators.TraceMatrix import TraceMatrix
from calculators.VectorNorm import VectorNorm
from calculators.GcdTwoNumbers import GcdTwoNumbers
from YoloImageProcessor import YOLOImageProcessor
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import jwt
from fastapi import Depends, Header
from jose import JWTError, jwt
import datetime
from dotenv import load_dotenv


load_dotenv()

router = APIRouter()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET")  
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

class TokenIn(BaseModel):
    id_token: str

@router.post("/auth/google")
async def login_with_google(token_in: TokenIn):
    """
    Login with Google.
    :param token_in: the id of the token
    :return: the response message 
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            token_in.id_token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        user_email = idinfo["email"]
        user_name = idinfo.get("name", "")
        payload = {
            "sub": user_email,
            "name": user_name,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=60)
        }
        access_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        return {"access_token": access_token}

    except ValueError as e:
        raise HTTPException(status_code=401, detail="Nesprávny Google token")

def get_current_user(authorization: str = Header(...)):
    """
    Get current user (the user/teacher who is logged in)
    :return: the current user 
    """
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=403, detail="Nesprávny auth schéma")

        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload 

    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Nesprávny alebo vypršaný token")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

@app.post("/items/")
async def create_item(
    images: list[UploadFile] = File(...),
    user = Depends(get_current_user)
):  
    """
    Working with YOLO and tessaract, get informations from image, 
    like the test id, answers, example ids, and the student id and save it to DB 
    :param images: images, what the user selected
    :return: the response message 
    """
    uploaded_files = []
    student_ids = []
    student_answers = []
    example_ids_all = []
    test_ids = []
    correct_answers = []
    points = 0
    for image in images:
        file_location = f"uploads/{image.filename}"
        try:
            os.makedirs("uploads", exist_ok=True)
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            uploaded_files.append(image.filename)
            processor = YOLOImageProcessor('runs88/detect/train_digits_detection/weights/best.pt')
            id_values, example_ids,answer, student_id = processor.get_test_results(file_location)
            new_result = CreateNewResult()
            test = CreateNewTest()
            test_id = id_values
            example_ids_all.append(example_ids)
            test_ids.append(test_id)
            student_answers.append(answer)
            student_ids.append(student_id)
            c_answer = []
            submitted_at = datetime.datetime.utcnow().isoformat()
            for a, example_id in zip(answer, example_ids):
                correct_answer = test.get_correct_answer(user["sub"], test_id, example_id)
                c_answer.append(correct_answer)
                answer_results = False
                if str(correct_answer) == a:
                    answer_results = True
                    points = points + 1
                new_result.add_new_row(test_id, example_id, student_id, user["sub"], a, answer_results, submitted_at, image.filename)

            correct_answers.append(c_answer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error pri spracovaní obrázku: {str(e)}")
    return {
        "message": f"{len(images)} image(s) uploaded.",
        "uploaded_files": uploaded_files,
        "student_ids": student_ids,
        "example_ids": example_ids_all,
        "student_answers": student_answers,
        "test_ids": test_ids,
        "correct_answers": correct_answers,
        "points": points

    }


@app.get("/items/")
async def get_results(user = Depends(get_current_user)):
    """
    Get infromations from DB, from results_collection collection
    :return: the response message 
    """
    try:
        new_results = CreateNewResult()
        results = list(new_results.collection.find({"user_email": user["sub"]}, {"_id": 0}))
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Došlo k chybe: {str(e)}")

@app.post("/examples/")
async def create_example(
    test_id: str = Form(...),
    example_id: str = Form(...),
    correct_answer: str = Form(...),
    description: str = Form(...),
    user = Depends(get_current_user)
):
    """
    Saving the correct answers to DB, for the concrete test  
    :param imatest_id: the test id
    :param example_id: the example id (the number of the example)
    :param correct_answer: the correct answer for the concrete example
    :param description: the description of the example
    :return: the response message 
    """
    if not test_id or not example_id or not correct_answer:
        raise HTTPException(status_code=422, detail="test_id, example_id and correct_answer must be provided")
    
    try:
        new_test = CreateNewTest()
        new_test.add_new_row(test_id, example_id, correct_answer, user["sub"], description)
        return {"message": f"Test id '{test_id}', example id '{example_id}', correct answer '{correct_answer}' saved successfully and user email {user['sub']}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Došlo k chybe: {str(e)}")

@app.get("/examples/")
async def get_examples(user = Depends(get_current_user)):
    """
    Get examples by logged user  
    :return: the response message 
    """
    try:
        new_test = CreateNewTest()
        tasks = list(new_test.collection.find({"user_email": user["sub"]}, {"_id": 0}))
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Došlo k chybe: {str(e)}")

@app.post("/examples/upload-csv/")
async def upload_csv_examples(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    """
    Saving the correct answers to DB, for the concrete test, with CSV file  
    :param file: the CSV file
    :return: the response message 
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File musí byt CSV fiel.")
    
    try:
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        csv_reader = csv.DictReader(StringIO(csv_text))
        new_test = CreateNewTest()   
        rows_added = 0
        errors = []

        for row in csv_reader:
            try:
                if 'test_id' not in row or 'example_id' not in row or 'correct_answer' not in row:
                    errors.append(f"Riadok nemá všetky povinné polias: {row}")
                    continue

                test_id = row['test_id']
                example_id = row['example_id']
                correct_answer = row['correct_answer']
                description = row.get('description', "")

                new_test.add_new_row(test_id, example_id, correct_answer, user["sub"], description)
                rows_added += 1
            
            except Exception as e:
                errors.append(f"Chyba pri spracovaní riadku: {row}. Chyba: {str(e)}")

        return {
            "message": f"CSV bol spracovaný, úspešne bolo pridaných {rows_added} riadkov",
            "rows_added": rows_added,
            "errors": errors if errors else None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Počas spracovania CSV súboru došlo k chybe: {str(e)}")



@app.put("/examples/{example_id}")
async def update_example(
    example_id: str,
    test_id: str = Form(...),
    correct_answer: str = Form(...),
    description: str = Form(...),
    user = Depends(get_current_user)
):
    """
    Update the values in one of the concrete test 
    :param imatest_id: the test id
    :param example_id: the example id (the number of the example)
    :param correct_answer: the correct answer for the concrete example
    :param description: the description of the example
    :return: the response message 
    """
    try:
        new_test = CreateNewTest()
        result = new_test.collection.update_one(
            {"example_id": example_id, "test_id": test_id, "user_email": user["sub"]},
            {"$set": {"correct_answer": correct_answer, "description": description}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail=f"Číslo úlohy {example_id} nenašlo.")
            
        return {"message": f"Príklad {example_id} (s test id: {test_id}) bol úspešne aktualizovaný."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.delete("/examples/{example_id}")
async def delete_example(example_id: str, test_id: str, correct_answer: str, description: str,user = Depends(get_current_user)):
    """
    Delete the values in one of the concrete test 
    :param imatest_id: the test id
    :param example_id: the example id (the number of the example)
    :param correct_answer: the correct answer for the concrete example
    :param description: the description of the example
    :return: the response message 
    """
    try:
        new_test = CreateNewTest()
        # Delete the document from MongoDB
        result = new_test.collection.delete_one(
            {"example_id": example_id, "test_id": test_id, "user_email": user["sub"],"correct_answer": correct_answer, "description": description }
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Example with ID {example_id} not found")
            
        return {"message": f"Example {example_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Došlo k chybe: {str(e)}")

@app.post("/calculate")
async def calculate_matrix(request: Request):
    """
    Calculate the matrix with specific operation
    :param request: the request, where is the operation and the concrate matrix/vector/2 numbers
    :return: the response message 
    """
    try:
        data = await request.json()
        operation = data.get("operation")
        matrix = data.get("matrix")
        try:
            matrix = [[int(x) for x in row] for row in matrix]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Zadané charaktery nie sú čísla {str(e)}")
        if not operation or not matrix:
            raise HTTPException(status_code=400, detail="Operácia alebo jednotlivé hognoty neboli zadané.")

        if operation == "determinant":
            det = DeterminantMatrix.determinant_calculate(matrix) 
            return {"message": "Determinatn", "operation": operation, "result": str(det)}
        elif operation == "rank":
            rank = RankMatrix.matrix_rank_calculate(matrix)
            return {"message": "Determinatn", "operation": operation, "result": rank}
        elif operation == "corank":
            corank = CorankMatrix.matrix_corank_calculate(matrix)
            return {"message": "Corank", "operation": operation, "result": str(corank)}
        elif operation == "trace":
            trace = TraceMatrix.trace_calculate(matrix)
            return {"message": "Trace", "operation": operation, "result": trace}
        elif operation == "vector normal form":
            vector  = [item for sublist in matrix for item in sublist]
            normal_form = VectorNorm.vector_norm_euclidean(vector)
            return {"message": "Vector normal form", "operation": operation, "result": normal_form}
        elif operation == "GCD":
            first_number = matrix[0][0]
            second_number = matrix[0][1]
            gcd_result = GcdTwoNumbers.gcd_calculate(first_number,second_number)
            return {"message": "Gcd", "operation": operation, "result": gcd_result}
        return {"message": "Operácia", "operation": operation, "result": matrix}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interná chyba servera: {str(e)}")

app.include_router(router)
