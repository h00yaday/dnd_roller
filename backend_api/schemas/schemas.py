from pydantic import BaseModel, ConfigDict, Field
from typing import Dict, List, Optional

DICE_PATTERN = r"^\s*(?:[+-]?\s*(?:\d+[dD]\d+|\d+)\s*)+$"

class AttackBase(BaseModel):
    name: str
    attack_bonus: int = 0
    damage_dice: str = Field(
        pattern=DICE_PATTERN, 
        json_schema_extra={"examples": ["1d8", "2d6+3"]}
    )
    damage_type: str

class AttackCreate(AttackBase):
    pass

class AttackResponse(AttackBase):
    id: int
    character_id: int
    model_config = ConfigDict(from_attributes=True)

class SpellBase(BaseModel):
    name: str
    level: int = 0
    description: Optional[str] = None

class SpellCreate(SpellBase):
    pass

class SpellResponse(SpellBase):
    id: int
    character_id: int
    model_config = ConfigDict(from_attributes=True)

class CharacterBase(BaseModel):
    name: str
    level: int = 1
    strength: int = 10
    dexterity: int = 10
    constitution: int = 10
    intelligence: int = 10
    wisdom: int = 10
    charisma: int = 10
    armor_class: int = 10
    max_hp: int = 10
    current_hp: int = 10

    spell_slots: Dict[str, int] = Field(default_factory=dict)
    skills: Dict[str, int] = Field(default_factory=dict) 

class CharacterCreate(CharacterBase):
    pass 

class CharacterResponse(CharacterBase):
    id: int
    owner_id: int
    attacks: List[AttackResponse] = []
    spells: List[SpellResponse] = []

    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    username: str
    password: str = Field(min_length=3, max_length=72)

class UserResponse(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)