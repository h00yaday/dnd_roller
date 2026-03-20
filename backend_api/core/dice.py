import re
import random

def parse_and_roll(dice_notation: str) -> dict:
    clean_notation = dice_notation.lower().replace(" ", "")
    
    if not re.match(r"^[\d\+d\-]+$", clean_notation):
        raise ValueError("Недопустимые символы в формуле.")
        

    if clean_notation[0] not in "+-":
        clean_notation = "+" + clean_notation
        
    pattern = r"([+-])(\d+d\d+|\d+)"
    matches = re.findall(pattern, clean_notation)
    
    if not matches:
         raise ValueError("Формула не распознана.")

    total = 0
    all_rolls = []
    total_modifier = 0
    
    for sign, value in matches:
        multiplier = 1 if sign == "+" else -1
        
        if "d" in value:
            num_dice, dice_sides = map(int, value.split("d"))
            
            if num_dice > 100 or dice_sides > 1000:
                raise ValueError("Слишком много кубиков (макс. 100) или граней (макс. 1000)!")
            if num_dice <= 0 or dice_sides <= 0:
                raise ValueError("Количество кубиков и граней должно быть больше 0.")
                
            current_rolls = [random.randint(1, dice_sides) for _ in range(num_dice)]
            sum_rolls = sum(current_rolls) * multiplier
            total += sum_rolls
            
            all_rolls.append({
                "dice": f"{sign}{value}",
                "rolls": current_rolls,
                "sum": sum_rolls
            })
        else:
            mod = int(value) * multiplier
            total_modifier += mod
            total += mod

    return {
        "notation": dice_notation,
        "rolls_detail": all_rolls,
        "modifier": total_modifier,
        "total": total
    }