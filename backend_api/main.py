from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from db.database import engine
from db.models import Base
from api import characters, auth, roller


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="D&D Manager API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)
app.include_router(auth.router)
app.include_router(characters.router)
app.include_router(roller.router)

@app.get("/")
async def root():
    return {"message": "Добро пожаловать в таверну!"}