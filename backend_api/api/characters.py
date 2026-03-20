from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import random 
from core.dice import parse_and_roll 

from db.database import get_db
from db.models import Character, User, Attack, Spell
from api.dependencies import get_current_user
from schemas.schemas import (
    CharacterCreate, CharacterResponse, 
    AttackCreate, AttackResponse,
    SpellCreate, SpellResponse
)

router = APIRouter(prefix="/characters", tags=["Characters"])

@router.post("/", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
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
    
    stmt = select(Character).where(Character.id == new_char.id).options(
        selectinload(Character.attacks),
        selectinload(Character.spells)
    )
    result = await db.execute(stmt)
    character_with_relations = result.scalar_one()

    return character_with_relations


@router.get("/", response_model=list[CharacterResponse])
async def get_characters(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    stmt = select(Character).where(Character.owner_id == current_user.id).options(
        selectinload(Character.attacks),
        selectinload(Character.spells)
    )
    result = await db.execute(stmt)
    characters = result.scalars().all()
    return characters



@router.post("/{character_id}/attacks", response_model=AttackResponse)
async def add_attack_to_character(
    character_id: int,
    attack_in: AttackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.owner_id == current_user.id)
    )
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден или у вас нет к нему доступа")

    new_attack = Attack(**attack_in.model_dump(), character_id=character.id)
    db.add(new_attack)
    await db.commit()
    await db.refresh(new_attack)
    
    return new_attack


@router.post("/{character_id}/spells", response_model=SpellResponse)
async def add_spell_to_character(
    character_id: int,
    spell_in: SpellCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.owner_id == current_user.id)
    )
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Персонаж не найден или у вас нет к нему доступа")

    new_spell = Spell(**spell_in.model_dump(), character_id=character.id)
    db.add(new_spell)
    await db.commit()
    await db.refresh(new_spell)
    
    return new_spell

@router.post("/{character_id}/attacks/{attack_id}/roll")
async def roll_character_attack(
    character_id: int,
    attack_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Attack).join(Character).where(
        Attack.id == attack_id,
        Attack.character_id == character_id,
        Character.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    attack = result.scalar_one_or_none()
    
    if not attack:
        raise HTTPException(status_code=404, detail="Атака не найдена или у вас нет к ней доступа")

    d20_roll = random.randint(1, 20)
    hit_total = d20_roll + attack.attack_bonus
    
    is_critical = d20_roll == 20
    is_critical_fail = d20_roll == 1

    try:
        damage_result = parse_and_roll(attack.damage_dice)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Ошибка в формуле кубиков атаки: {e}")

    return {
        "action": f"Атака: {attack.name}",
        "hit_roll": {
            "d20_face": d20_roll,
            "bonus": attack.attack_bonus,
            "total": hit_total,
            "is_critical": is_critical,
            "is_critical_fail": is_critical_fail
        },
        "damage": {
            "total": damage_result["total"],
            "dice_rolls": damage_result["rolls_detail"], 
            "modifier": damage_result["modifier"],
            "type": attack.damage_type
        }
    }