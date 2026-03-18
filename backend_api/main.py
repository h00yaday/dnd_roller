from fastapi import FastAPI
from contextlib import asynccontextmanager

from db.database import engine
from db.models import Base
from api import characters, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="D&D Manager API", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(characters.router)

@app.get("/")
async def root():
    return {"message": "Добро пожаловать в таверну!"}