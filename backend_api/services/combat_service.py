import random

from sqlalchemy.orm.attributes import flag_modified

from core.dice import parse_and_roll
from db.models import Attack, Character, Spell
from services.character_service import CharacterService
from services.domain_exceptions import ValidationDomainError


class CombatService:
    @staticmethod
    def process_attack_roll(attack: Attack) -> dict:
        """Processes attack roll and damage calculation"""
        d20_roll = random.randint(1, 20)
        hit_total = d20_roll + attack.attack_bonus

        is_critical = d20_roll == 20
        is_critical_fail = d20_roll == 1

        try:
            damage_result = parse_and_roll(attack.damage_dice)
        except ValueError as e:
            raise ValidationDomainError(f"Error in attack dice formula: {e}") from e

        return {
            "action": f"Attack: {attack.name}",
            "hit_roll": {
                "d20_face": d20_roll,
                "bonus": attack.attack_bonus,
                "total": hit_total,
                "is_critical": is_critical,
                "is_critical_fail": is_critical_fail,
            },
            "damage": {
                "total": damage_result["total"],
                "dice_rolls": damage_result["rolls_detail"],
                "modifier": damage_result["modifier"],
                "type": attack.damage_type,
            },
        }

    @staticmethod
    def process_spell_cast(spell: Spell, character: Character, cast_level: int | None = None) -> dict:
        """Processes spell casting and slot consumption"""
        try:
            actual_cast_level = CharacterService.validate_cast_level(
                cast_level if cast_level is not None else spell.level, spell.level
            )
            slots = CharacterService.normalize_character_patch({"spell_slots": character.spell_slots or {}})[
                "spell_slots"
            ]
        except ValidationDomainError as e:
            raise ValidationDomainError(str(e)) from e
        level_key = str(actual_cast_level)

        if actual_cast_level > 0:
            slot_data = slots.get(level_key)
            if slot_data is None:
                raise ValidationDomainError(f"No available level {actual_cast_level} slots!")

            if slot_data["total"] - slot_data["used"] <= 0:
                raise ValidationDomainError(f"No available level {actual_cast_level} slots!")

            slot_data["used"] += 1
            slots[level_key] = slot_data

            character.spell_slots = slots
            flag_modified(character, "spell_slots")

        spell_slots_remaining = (
            slots[level_key]["total"] - slots[level_key]["used"] if actual_cast_level > 0 else "Infinite (cantrip)"
        )

        response_data = {
            "action": f"Cast: {spell.name} (Level {actual_cast_level})",
            "spell_slots_remaining": spell_slots_remaining,
        }

        if spell.requires_attack_roll:
            d20_roll = random.randint(1, 20)
            response_data["hit_roll"] = {
                "d20_face": d20_roll,
                "bonus": spell.spell_attack_bonus,
                "total": d20_roll + spell.spell_attack_bonus,
                "is_critical": d20_roll == 20,
                "is_critical_fail": d20_roll == 1,
            }

        if spell.damage_dice:
            try:
                damage_result = parse_and_roll(spell.damage_dice)
                response_data["damage"] = {
                    "total": damage_result["total"],
                    "dice_rolls": damage_result["rolls_detail"],
                    "modifier": damage_result["modifier"],
                    "type": spell.damage_type,
                }
            except ValueError as e:
                raise ValidationDomainError(f"Error in damage dice formula: {e}") from e

        return response_data

    @staticmethod
    def process_spell_roll(spell: Spell) -> dict:
        """Processes spell roll (without slot consumption)"""
        response_data = {"action": f"Cast: {spell.name}"}

        if getattr(spell, "requires_attack_roll", False):
            d20_roll = random.randint(1, 20)
            bonus = getattr(spell, "spell_attack_bonus", 0)
            response_data["hit_roll"] = {
                "d20_face": d20_roll,
                "bonus": bonus,
                "total": d20_roll + bonus,
                "is_critical": d20_roll == 20,
                "is_critical_fail": d20_roll == 1,
            }

        damage_dice = getattr(spell, "damage_dice", None)
        if damage_dice:
            try:
                damage_result = parse_and_roll(damage_dice)
                response_data["damage"] = {
                    "total": damage_result["total"],
                    "dice_rolls": damage_result["rolls_detail"],
                    "modifier": damage_result["modifier"],
                    "type": getattr(spell, "damage_type", "Magical"),
                }
            except ValueError as e:
                raise ValidationDomainError(f"Error in damage dice formula: {e}") from e

        if not getattr(spell, "requires_attack_roll", False) and not damage_dice:
            response_data["effect"] = "Spell cast successfully (no attack/damage rolls)"

        return response_data

    @staticmethod
    def process_check_roll(action: str, bonus: int) -> dict:
        """Processes ability/skill check rolls"""
        d20_roll = random.randint(1, 20)
        return {
            "action": action,
            "hit_roll": {
                "d20_face": d20_roll,
                "bonus": bonus,
                "total": d20_roll + bonus,
                "is_critical": d20_roll == 20,
                "is_critical_fail": d20_roll == 1,
            },
        }