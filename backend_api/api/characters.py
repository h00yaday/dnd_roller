from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import get_db
from db.models import Character, User
from api.dependencies import get_current_user
from schemas.schemas import CharacterCreate, CharacterResponse

router = APIRouter(prefix="/characters", tags=["Characters"])

@router.post("/", response_model=CharacterResponse)
async def create_character(
    char_in: CharacterCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    char_data = char_in.model_dump()

    new_char = Character(**char_data, owner_id=current_user.id)
    new_char.current_hp = char_in.max_hp

    db.add(new_char)
    await db.commit()
    await db.refresh(new_char)

    return new_char


@router.get("/", response_model=list[CharacterResponse])
async def get_characters(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    result = await db.execute(
        select(Character).where(Character.owner_id == current_user.id)
    )
    characters = result.scalars().all()
    return characters