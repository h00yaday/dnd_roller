from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from typing import Generic, TypeVar

DICE_PATTERN = r"^\s*(?:[+-]?\s*(?:\d+[dD]\d+|\d+)\s*)+$"
USERNAME_PATTERN = r"^[A-Za-z0-9_]{3,50}$"

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper"""
    items: list[T]
    total: int
    limit: int
    offset: int

    @property
    def has_next(self) -> bool:
        return (self.offset + self.limit) < self.total

    @property
    def has_prev(self) -> bool:
        return self.offset > 0


class FeatureBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=5000)
    source: str = Field(default="Class", min_length=1, max_length=50)
    modifiers: dict[str, int] = Field(default_factory=dict)


class FeatureCreate(FeatureBase):
    @model_validator(mode="after")
    def validate_modifier_range(self):
        for key, value in self.modifiers.items():
            if not -10 <= value <= 10:
                raise ValueError(f"Modifier '{key}' must be between -10 and 10")
        return self


class FeatureResponse(FeatureBase):
    id: int
    character_id: int
    model_config = ConfigDict(from_attributes=True)


class AttackBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    attack_bonus: int = Field(default=0, ge=-50, le=50)
    damage_dice: str = Field(
        min_length=1,
        max_length=256,
        pattern=DICE_PATTERN,
        json_schema_extra={"examples": ["1d8", "2d6+3"]},
    )
    damage_type: str = Field(min_length=1, max_length=50)


class AttackCreate(AttackBase):
    pass


class AttackResponse(AttackBase):
    id: int
    character_id: int
    model_config = ConfigDict(from_attributes=True)


class SpellBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    level: int = Field(default=0, ge=0, le=9)
    description: str | None = Field(default=None, max_length=5000)


class SpellCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    level: int = Field(default=0, ge=0, le=9)
    description: str | None = Field(default=None, max_length=5000)

    requires_attack_roll: bool = False
    spell_attack_bonus: int = Field(default=0, ge=-50, le=50)
    damage_dice: str | None = Field(default=None, max_length=256, pattern=DICE_PATTERN)
    damage_type: str | None = Field(default=None, max_length=50)


class SpellResponse(BaseModel):
    id: int
    name: str
    level: int
    description: str | None = None

    requires_attack_roll: bool
    spell_attack_bonus: int
    damage_dice: str | None
    damage_type: str | None

    character_id: int

    model_config = ConfigDict(from_attributes=True)


class SpellSlot(BaseModel):
    total: int = Field(ge=0, le=99)
    used: int = Field(ge=0, le=99)

    @model_validator(mode="after")
    def validate_slot_invariant(self):
        if self.used > self.total:
            raise ValueError("used cannot exceed total")
        return self


class CharacterBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    level: int = Field(default=1, ge=1, le=20)
    race: str = Field(default="Human", min_length=1, max_length=50)
    character_class: str = Field(default="Fighter", min_length=1, max_length=50)
    subclass: str | None = Field(default=None, max_length=50)
    background: str | None = Field(default=None, max_length=50)

    strength: int = Field(default=10, ge=1, le=30)
    dexterity: int = Field(default=10, ge=1, le=30)
    constitution: int = Field(default=10, ge=1, le=30)
    intelligence: int = Field(default=10, ge=1, le=30)
    wisdom: int = Field(default=10, ge=1, le=30)
    charisma: int = Field(default=10, ge=1, le=30)

    armor_class: int = Field(default=10, ge=0, le=50)
    max_hp: int = Field(default=10, ge=1, le=999)
    current_hp: int = Field(default=10, ge=0, le=999)
    speed: int = Field(default=30, ge=0, le=120)
    initiative_bonus: int = Field(default=0, ge=-20, le=20)

    spell_slots: dict[str, SpellSlot] = Field(default_factory=dict)
    skills: dict[str, int] = Field(default_factory=dict)
    saving_throws: dict[str, int] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_hp_invariant(self):
        if self.current_hp > self.max_hp:
            raise ValueError("current_hp cannot exceed max_hp")
        return self


class CharacterCreate(CharacterBase):
    pass


class CharacterResponse(CharacterBase):
    id: int
    owner_id: int
    attacks: list[AttackResponse] = Field(default_factory=list)
    spells: list[SpellResponse] = Field(default_factory=list)
    features: list[FeatureResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CharacterListItem(CharacterBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CharacterUpdate(BaseModel):
    current_hp: int | None = Field(default=None, ge=0, le=999)
    max_hp: int | None = Field(default=None, ge=1, le=999)
    armor_class: int | None = Field(default=None, ge=0, le=50)
    level: int | None = Field(default=None, ge=1, le=20)
    skills: dict[str, int] | None = None
    saving_throws: dict[str, int] | None = None
    spell_slots: dict[str, SpellSlot] | None = None
    speed: int | None = Field(default=None, ge=0, le=120)
    strength: int | None = Field(default=None, ge=1, le=30)
    dexterity: int | None = Field(default=None, ge=1, le=30)
    constitution: int | None = Field(default=None, ge=1, le=30)
    intelligence: int | None = Field(default=None, ge=1, le=30)
    wisdom: int | None = Field(default=None, ge=1, le=30)
    charisma: int | None = Field(default=None, ge=1, le=30)

    @model_validator(mode="after")
    def validate_hp_invariant(self):
        if self.current_hp is not None and self.max_hp is not None and self.current_hp > self.max_hp:
            raise ValueError("current_hp cannot exceed max_hp")
        return self


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=USERNAME_PATTERN, strip_whitespace=True)
    password: str = Field(min_length=8, max_length=72)
    email: EmailStr = Field(min_length=5, max_length=255)

    @model_validator(mode="after")
    def validate_password_strength(self):
        if not any(ch.isalpha() for ch in self.password) or not any(ch.isdigit() for ch in self.password):
            raise ValueError("Password must contain both letters and numbers")
        
        if self.username.lower() in self.password.lower():
            raise ValueError("Password cannot contain your username")
        
        if len(self.password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        return self

    @field_validator("username", mode="before")
    @classmethod
    def check_no_spaces(cls, value: str):
        if isinstance(value, str) and " " in value.strip():
            raise ValueError("Username cannot contain spaces")
        return value


class UserLogin(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=USERNAME_PATTERN, strip_whitespace=True)
    password: str = Field(min_length=1, max_length=72)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class HPUpdate(BaseModel):
    current_hp: int