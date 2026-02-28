from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
import httpx
from pydantic import BaseModel, Field, ConfigDict
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import List, Optional, Annotated

app = FastAPI(title="Todo API with Keycloak", root_path="/api")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://admin:password@mongodb:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.todos_db

# Keycloak Setup
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
REALM = "myrealm"
JWKS_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs"

security = HTTPBearer()

# Pydantic models for MongoDB (Pydantic V2)
PyObjectId = Annotated[str, BeforeValidator(str)]

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

class Todo(TodoCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

async def get_public_keys():
    async with httpx.AsyncClient() as httpx_client:
        try:
            response = await httpx_client.get(JWKS_URL)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching JWKS: {e}")
            return None

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Fetch public keys from Keycloak
        jwks = await get_public_keys()
        if not jwks:
            raise HTTPException(status_code=500, detail="Could not fetch public keys")

        # Get the unverified header to find the key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        
        # Find the matching key
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break

        if rsa_key:
            # Verify the token
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                options={"verify_aud": False} # Skip audience check for simplicity in this demo
            )
            return payload
        else:
            raise HTTPException(status_code=401, detail="Invalid Key")

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/todos", response_model=List[Todo])
async def get_todos(user: dict = Depends(verify_token)):
    user_id = user.get("sub") # Keycloak subject (user ID)
    todos_cursor = db.todos.find({"user_id": user_id})
    todos = await todos_cursor.to_list(length=1000)
    return todos

@app.post("/todos", response_model=Todo)
async def create_todo(todo: TodoCreate, user: dict = Depends(verify_token)):
    user_id = user.get("sub")
    
    new_todo = todo.model_dump()
    new_todo["user_id"] = user_id
    
    result = await db.todos.insert_one(new_todo)
    created_todo = await db.todos.find_one({"_id": result.inserted_id})
    return created_todo

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: str, todo_update: TodoUpdate, user: dict = Depends(verify_token)):
    user_id = user.get("sub")

    from bson import ObjectId
    try:
        obj_id = ObjectId(todo_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Todo ID format")

    # Find and update
    update_data = {k: v for k, v in todo_update.model_dump(exclude_unset=True).items() if v is not None}
    
    if len(update_data) >= 1:
        update_result = await db.todos.update_one(
            {"_id": obj_id, "user_id": user_id},
            {"$set": update_data}
        )

        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Todo not found")

    updated_todo = await db.todos.find_one({"_id": obj_id})
    return updated_todo

@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: str, user: dict = Depends(verify_token)):
    user_id = user.get("sub")

    from bson import ObjectId
    try:
        obj_id = ObjectId(todo_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Todo ID format")

    delete_result = await db.todos.delete_one({"_id": obj_id, "user_id": user_id})

    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    return None
