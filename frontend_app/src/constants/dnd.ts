import type { SkillKey, StatKey } from '../types/character';

// --- D&D CONSTANTS ---
export const SKILLS = [
  { id: 'acrobatics', name: 'Acrobatics', stat: 'dexterity' },
  { id: 'animal_handling', name: 'Animal Handling', stat: 'wisdom' },
  { id: 'arcana', name: 'Arcana', stat: 'intelligence' },
  { id: 'athletics', name: 'Athletics', stat: 'strength' },
  { id: 'deception', name: 'Deception', stat: 'charisma' },
  { id: 'history', name: 'History', stat: 'intelligence' },
  { id: 'insight', name: 'Insight', stat: 'wisdom' },
  { id: 'intimidation', name: 'Intimidation', stat: 'charisma' },
  { id: 'investigation', name: 'Investigation', stat: 'intelligence' },
  { id: 'medicine', name: 'Medicine', stat: 'wisdom' },
  { id: 'nature', name: 'Nature', stat: 'intelligence' },
  { id: 'perception', name: 'Perception', stat: 'wisdom' },
  { id: 'performance', name: 'Performance', stat: 'charisma' },
  { id: 'persuasion', name: 'Persuasion', stat: 'charisma' },
  { id: 'religion', name: 'Religion', stat: 'intelligence' },
  { id: 'sleight_of_hand', name: 'Sleight of Hand', stat: 'dexterity' },
  { id: 'stealth', name: 'Stealth', stat: 'dexterity' },
  { id: 'survival', name: 'Survival', stat: 'wisdom' },
] as const satisfies ReadonlyArray<{ id: SkillKey; name: string; stat: StatKey }>;

export const STATS = [
  { id: 'strength', name: 'Strength' },
  { id: 'dexterity', name: 'Dexterity' },
  { id: 'constitution', name: 'Constitution' },
  { id: 'intelligence', name: 'Intelligence' },
  { id: 'wisdom', name: 'Wisdom' },
  { id: 'charisma', name: 'Charisma' }
] as const satisfies ReadonlyArray<{ id: StatKey; name: string }>;