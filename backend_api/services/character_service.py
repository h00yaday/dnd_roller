import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from db.models import Character, User
from services.domain_exceptions import ValidationDomainError

ALLOWED_FEATURE_MODIFIER_FIELDS = {
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
    "armor_class",
    "max_hp",
    "speed",
    "initiative_bonus",
}


class CharacterService:
    @staticmethod
    async def ensure_username_available(db: AsyncSession, username: str) -> None:
        result = await db.execute(select(User).where(User.username == username))
        if result.scalar_one_or_none():
            raise ValidationDomainError("Username is already taken")

    @staticmethod
    def issue_csrf_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def _clamp_character_invariants(character: Character) -> None:
        if character.max_hp is None or character.max_hp == 0:
            character.max_hp = 10
        character.max_hp = max(1, min(character.max_hp, 999))

        if character.current_hp is None:
            character.current_hp = 0
        character.current_hp = min(max(0, character.current_hp), character.max_hp)

        if character.armor_class is None or character.armor_class == 0:
            character.armor_class = 10
        character.armor_class = max(0, min(character.armor_class, 50))

        for field in (
            "strength",
            "dexterity",
            "constitution",
            "intelligence",
            "wisdom",
            "charisma",
        ):
            current_value = getattr(character, field)
            if current_value is None or current_value == 0:
                setattr(character, field, 10)
            else:
                setattr(character, field, max(1, min(current_value, 30)))

    @staticmethod
    def _coerce_spell_slots(spell_slots: dict | None) -> dict[str, dict[str, int]]:
        normalized: dict[str, dict[str, int]] = {}
        for level, slot in (spell_slots or {}).items():
            if not isinstance(slot, dict) or "total" not in slot or "used" not in slot:
                raise ValidationDomainError(f"Invalid spell_slots format for level '{level}'")
            total = int(slot["total"])
            used = int(slot["used"])
            if total < 0 or used < 0 or used > total:
                raise ValidationDomainError(f"Invalid spell_slots values for level '{level}'")
            normalized[str(level)] = {"total": total, "used": used}
        return normalized

    @staticmethod
    def apply_feature_modifiers(character: Character, modifiers: dict[str, int]) -> None:
        for field, bonus in modifiers.items():
            if not -10 <= bonus <= 10:
                raise ValidationDomainError(f"Modifier['{field}'] value out of range -10 to 10")
            if field not in ALLOWED_FEATURE_MODIFIER_FIELDS:
                raise ValidationDomainError(f"Field '{field}' cannot be changed via modifiers")

            current_val = getattr(character, field, None)
            if not isinstance(current_val, int):
                raise ValidationDomainError(f"Field '{field}' does not support numeric modifiers")
            setattr(character, field, current_val + bonus)

        CharacterService._clamp_character_invariants(character)

    @staticmethod
    def revert_feature_modifiers(character: Character, modifiers: dict[str, int]) -> None:
        inverse_modifiers = {field: -bonus for field, bonus in modifiers.items()}
        CharacterService.apply_feature_modifiers(character, inverse_modifiers)

    @staticmethod
    def normalize_character_patch(update_data: dict) -> dict:
        normalized = dict(update_data)
        if "spell_slots" in normalized:
            normalized["spell_slots"] = CharacterService._coerce_spell_slots(normalized["spell_slots"])
        if "skills" in normalized:
            normalized["skills"] = {str(key): int(value) for key, value in (normalized["skills"] or {}).items()}
        if "saving_throws" in normalized:
            normalized["saving_throws"] = {
                str(key): int(value) for key, value in (normalized["saving_throws"] or {}).items()
            }
        return normalized

    @staticmethod
    def validate_pagination(limit: int, offset: int) -> tuple[int, int]:
        if limit < 1 or limit > 100:
            raise ValidationDomainError("Limit parameter must be between 1 and 100")
        if offset < 0:
            raise ValidationDomainError("Offset parameter must be >= 0")
        return limit, offset

    @staticmethod
    def validate_cast_level(cast_level: int, spell_level: int) -> int:
        if cast_level < 0 or cast_level > 9:
            raise ValidationDomainError("Cast level must be between 0 and 9")
        if cast_level < spell_level:
            raise ValidationDomainError("Cannot cast below the spell's base level")
        return cast_level

    @staticmethod
    def parse_roll_check(action: str, bonus: int) -> tuple[str, int]:
        normalized_action = action.strip()
        if not normalized_action:
            raise ValidationDomainError("Action parameter cannot be empty")
        if len(normalized_action) > 200:
            raise ValidationDomainError("Action parameter is too long")
        if bonus < -50 or bonus > 50:
            raise ValidationDomainError("Bonus parameter must be between -50 and 50")
        return normalized_action, bonus

    @staticmethod
    def apply_character_patch(character: Character, update_data: dict) -> None:
        normalized_update = CharacterService.normalize_character_patch(update_data)
        for key, value in normalized_update.items():
            if value is not None:
                setattr(character, key, value)

        if "current_hp" in normalized_update:
            character.current_hp = min(max(0, character.current_hp), character.max_hp)
        if "max_hp" in normalized_update:
            character.max_hp = max(1, character.max_hp)
            if character.current_hp > character.max_hp:
                character.current_hp = character.max_hp

        if "spell_slots" in normalized_update:
            flag_modified(character, "spell_slots")
        if "skills" in normalized_update:
            flag_modified(character, "skills")
        if "saving_throws" in normalized_update:
            flag_modified(character, "saving_throws")
        CharacterService._clamp_character_invariants(character)