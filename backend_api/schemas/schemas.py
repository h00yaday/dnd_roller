from pydantic import BaseModel, ConfigDict, Field
from typing import Dict

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

class CharacterCreate(CharacterBase):
    pass 

class CharacterResponse(CharacterBase):
    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)



class UserCreate(BaseModel):
    username: str
    password: str = Field(min_length=3, max_length=72)

class UserResponse(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)