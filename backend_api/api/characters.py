from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.dependencies import CurrentUser, get_current_user
from core.limiter import RateLimiter
from db.database import get_db
from db.models import Attack, Character, Feature, Spell
from db.repository import CharacterRepository
from schemas.schemas import (
    AttackCreate,
    AttackResponse,
    CharacterCreate,
    CharacterListItem,
    CharacterResponse,
    CharacterUpdate,
    FeatureCreate,
    FeatureResponse,
    SpellCreate,
    SpellResponse,
    PaginatedResponse,
)
from services.character_service import CharacterService
from services.character_usecase import CharacterUseCase
from services.combat_service import CombatService
from services.domain_exceptions import EntityNotFoundError, ValidationDomainError

roller_limiter = RateLimiter(capacity=50, refill_amount=1, refill_period_ms=200)
router = APIRouter(prefix="/characters", tags=["Characters"], dependencies=[Depends(roller_limiter)])


def build_usecase(db: AsyncSession) -> CharacterUseCase:
    return CharacterUseCase(CharacterRepository(db))


def map_domain_error(exc: Exception) -> HTTPException:
    if isinstance(exc, EntityNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ValidationDomainError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    char_in: CharacterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    char_data = char_in.model_dump()

    new_char = Character(**char_data, owner_id=current_user.id)
    new_char.current_hp = char_in.max_hp

    CharacterService._clamp_character_invariants(new_char)

    db.add(new_char)
    await db.commit()

    stmt = (
        select(Character)
        .where(Character.id == new_char.id)
        .options(
            selectinload(Character.attacks),
            selectinload(Character.spells),
            selectinload(Character.features),
        )
    )
    result = await db.execute(stmt)
    character_with_relations = result.scalar_one()

    return character_with_relations


@router.get("/", response_model=list[CharacterListItem])
async def get_characters(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        limit, offset = CharacterService.validate_pagination(limit, offset)
        return await usecase.get_list(current_user.id, limit=limit, offset=offset)
    except Exception as exc:
        raise map_domain_error(exc) from exc


@router.get("/{char_id}", response_model=CharacterResponse)
async def get_character(
    char_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        return await usecase.get_detail(char_id, current_user.id)
    except Exception as exc:
        raise map_domain_error(exc) from exc


@router.post("/{character_id}/attacks", response_model=AttackResponse, status_code=status.HTTP_201_CREATED)
async def add_attack_to_character(
    character_id: int,
    attack_in: AttackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        character = await usecase.get_owned_character(character_id, current_user.id)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    new_attack = Attack(**attack_in.model_dump(), character_id=character.id)
    db.add(new_attack)
    await db.commit()
    await db.refresh(new_attack)

    return new_attack


@router.post("/{character_id}/spells", response_model=SpellResponse, status_code=status.HTTP_201_CREATED)
async def add_spell_to_character(
    character_id: int,
    spell_in: SpellCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        character = await usecase.get_owned_character(character_id, current_user.id)
    except Exception as exc:
        raise map_domain_error(exc) from exc

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
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        attack = await usecase.get_owned_attack(attack_id, character_id, current_user.id)
        return CombatService.process_attack_roll(attack)
    except Exception as exc:
        raise map_domain_error(exc) from exc


@router.post("/{character_id}/spells/{spell_id}/roll")
async def roll_character_spell(
    character_id: int,
    spell_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        spell = await usecase.get_owned_spell(spell_id, character_id, current_user.id)
        return CombatService.process_spell_roll(spell)
    except Exception as exc:
        raise map_domain_error(exc) from exc


@router.patch("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: int,
    char_update: CharacterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        character = await usecase.get_detail(character_id, current_user.id)
        update_data = char_update.model_dump(exclude_unset=True)
        CharacterService.apply_character_patch(character, update_data)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    await db.commit()
    await db.refresh(character)
    return character


@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        character = await usecase.get_owned_character(character_id, current_user.id)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    await db.delete(character)
    await db.commit()


@router.delete("/{character_id}/attacks/{attack_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attack(
    character_id: int,
    attack_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        await usecase.get_owned_character(character_id, current_user.id)
        rowcount = await usecase.repo.delete_attack(attack_id, character_id)
        if rowcount <= 0:
            raise EntityNotFoundError("Attack not found")
    except Exception as exc:
        raise map_domain_error(exc) from exc

    await db.commit()
    return None


@router.post("/{character_id}/spells/{spell_id}/cast")
async def cast_spell(
    character_id: int,
    spell_id: int,
    cast_level: Annotated[int | None, Query(ge=0, le=9)] = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        spell = await usecase.get_owned_spell(spell_id, character_id, current_user.id)
        CharacterService.validate_cast_level(cast_level if cast_level is not None else spell.level, spell.level)

        char_stmt = (
            select(Character)
            .where(Character.id == character_id, Character.owner_id == current_user.id)
            .with_for_update()
        )
        char_result = await db.execute(char_stmt)
        character = char_result.scalar_one_or_none()
        if not character:
            raise EntityNotFoundError("Character not found")
    except Exception as exc:
        raise map_domain_error(exc) from exc

    try:
        response_data = CombatService.process_spell_cast(spell, character, cast_level)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    db.add(character)
    await db.commit()

    return response_data


@router.delete("/{character_id}/spells/{spell_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spell(
    character_id: int,
    spell_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        spell = await usecase.get_owned_spell(spell_id, character_id, current_user.id)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    await db.delete(spell)
    await db.commit()


@router.post("/{character_id}/features", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
async def add_feature_to_character(
    character_id: int,
    feature_in: FeatureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        character = await usecase.get_owned_character(character_id, current_user.id)
        new_feature = Feature(**feature_in.model_dump(), character_id=character.id)
        if new_feature.modifiers:
            CharacterService.apply_feature_modifiers(character, new_feature.modifiers)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    db.add(new_feature)
    await db.commit()
    await db.refresh(new_feature)
    return new_feature


@router.delete("/{character_id}/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feature(
    character_id: int,
    feature_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        character = await usecase.get_owned_character(character_id, current_user.id)
        feature = await usecase.get_feature(feature_id, character_id)
        if feature.modifiers:
            CharacterService.revert_feature_modifiers(character, feature.modifiers)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    await db.delete(feature)
    await db.commit()

    return None


@router.post("/{character_id}/roll-check")
async def roll_character_check(
    character_id: int,
    action: str,
    bonus: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    usecase = build_usecase(db)
    try:
        action, bonus = CharacterService.parse_roll_check(action, bonus)
        await usecase.get_owned_character(character_id, current_user.id)
    except Exception as exc:
        raise map_domain_error(exc) from exc

    try:
        return CombatService.process_check_roll(action, bonus)
    except Exception as exc:
        raise map_domain_error(exc) from exc