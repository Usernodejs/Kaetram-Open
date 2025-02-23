/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

import { Pointer } from './opcodes';

// Preset objects and values for various usages.
export default {
    EmptyPointer: {
        type: Pointer.Remove
    }
};

export enum PacketType {
    Broadcast,
    Player,
    Players,
    Region,
    Regions,
    RegionList
}

export enum ContainerType {
    Bank,
    Inventory
}

export enum Orientation {
    Up,
    Down,
    Left,
    Right
}

export enum EntityType {
    Player,
    NPC,
    Item,
    Mob,
    Chest,
    Projectile,
    Object
}

export enum AbilityType {
    Active,
    Passive
}

export type HealTypes = 'passive' | 'hitpoints' | 'mana';

/**
 * Enumeration of special states that an entity could be. For example,
 * an entity could be a quest-based entity and it has special name colour.
 */

export enum SpecialEntityTypes {
    Achievement,
    Quest,
    Area,
    Boss,
    Miniboss
}

export enum Actions {
    Idle,
    Attack,
    Walk,
    Orientate
}

export enum MenuActions {
    Use = 'Use',
    Drop = 'Drop',
    Equip = 'Equip',
    Eat = 'Eat',
    Move = 'Move'
}

export enum Hits {
    Damage,
    Poison,
    Heal,
    Mana,
    Experience,
    LevelUp,
    Critical,
    Stun,
    Explosive,
    Profession
}

export enum Projectiles {
    Arrow,
    Boulder,
    FireBall,
    IceBall,
    Terror,
    Tornado
}

export enum Equipment {
    Armour,
    Boots,
    Pendant,
    Ring,
    Weapon
}

export enum Hovering {
    Colliding,
    Mob,
    Player,
    Item,
    NPC,
    Chest,
    Object
}

export enum AudioTypes {
    Music,
    SFX
}

export enum PoisonTypes {
    Venom, // When a mob hits you
    Plague, // When entering a poisoned area.
    Persistent // Poison that doesn't wear off until it's cured.
}

export enum Warps {
    Mudwich,
    Undersea,
    Lakesworld
}

export enum Skills {
    Lumberjacking,
    Accuracy,
    Archery,
    Health,
    Magic,
    Mining,
    Strength
}

export enum Enchantment {
    Bloodsucking,
    Critical,
    Evasion,
    Spike,
    Explosive,
    Stun,
    AntiStun,
    Splash
}

export enum AoEType {
    Character,
    Player,
    Mob
}

export enum Effects {
    None,
    Critical,
    Terror,
    Stun,
    Healing,
    Fireball,
    Burning,
    Freezing
}

export enum Medals {
    None,
    Silver,
    Gold
}

export interface Colours {
    fill: string;
    stroke: string;
}

export let DamageColours = {
    // Received damage
    [Hits.Damage]: {
        fill: 'rgb(255, 50, 50)',
        stroke: 'rgb(255, 180, 180)',
        inflicted: {
            fill: 'white',
            stroke: '#373737'
        }
    },

    [Hits.Critical]: {
        fill: 'rgb(204, 0, 204)',
        stroke: 'rgb(255, 180, 180)',
        inflicted: {
            fill: 'rgb(255, 153, 204)',
            stroke: '#373737'
        }
    },

    [Hits.Poison]: {
        fill: 'rgb(66, 183, 77)',
        stroke: 'rgb(50, 120 , 50)'
    },

    [Hits.Heal]: {
        fill: 'rgb(80, 255, 80)',
        stroke: 'rgb(50, 120, 50)'
    },

    [Hits.Mana]: {
        fill: 'rgb(73, 94, 228)',
        stroke: 'rgb(56, 63, 133)'
    },

    [Hits.Experience]: {
        fill: 'rgb(80, 180, 255)',
        stroke: 'rgb(15, 85, 138)'
    },

    [Hits.LevelUp]: {
        fill: 'rgb(80, 180, 255)',
        stroke: 'rgb(15, 85, 138)'
    },

    [Hits.Profession]: {
        fill: 'rgb(204, 0, 153)',
        stroke: 'rgb(112, 17, 112)'
    }
};

export let SkillExpColours = {
    [Skills.Lumberjacking]: {
        fill: 'rgb(132, 57, 45)',
        stroke: 'rgb(101, 48, 35)'
    },

    [Skills.Accuracy]: {
        fill: 'rgb(6, 191, 188)',
        stroke: 'rgb(2, 94, 93)'
    },

    [Skills.Archery]: {
        fill: 'rgb(34, 214, 130)',
        stroke: 'rgb(7, 184, 101)'
    },

    [Skills.Health]: {
        fill: 'rgb(239, 90, 90)',
        stroke: 'rgb(255, 0, 0)'
    },

    [Skills.Magic]: {
        fill: 'rgb(37, 124, 210)',
        stroke: 'rgb(12, 55, 208)'
    },

    [Skills.Mining]: {
        fill: 'rgb(105, 106, 107)',
        stroke: 'rgb(45, 45, 46)'
    },

    [Skills.Strength]: {
        fill: 'rgb(232, 211, 185)',
        stroke: 'rgb(189, 172, 151)'
    }
};

export let NameColours = {
    [SpecialEntityTypes.Achievement]: 'rgb(60, 179, 113)',
    [SpecialEntityTypes.Quest]: 'rgb(106, 90, 205)',
    [SpecialEntityTypes.Area]: 'rgb(255, 165, 0)',
    [SpecialEntityTypes.Boss]: 'rgb(150, 0, 51)',
    [SpecialEntityTypes.Miniboss]: 'rgb(204, 51, 0)'
};

export let EntityScale = {
    [SpecialEntityTypes.Miniboss]: 1.2
};

export let PoisonInfo = {
    [PoisonTypes.Venom]: {
        name: 'Venom',
        damage: 2,
        duration: 30,
        rate: 3 // every second
    },
    [PoisonTypes.Plague]: {
        name: 'Plague',
        damage: 5,
        duration: 60,
        rate: 1
    },
    [PoisonTypes.Persistent]: {
        name: 'Persistent',
        damage: 2,
        duration: -1,
        rate: 1
    }
};

export enum NPCRole {
    Banker,
    Enchanter,
    Clerk
}

export const enum Constants {
    MAX_STACK = 2_147_483_647, // Maximum default stack size for a stackable item.
    MAX_LEVEL = 135, // Maximum attainable level.
    INVENTORY_SIZE = 20, // Maximum inventory size
    BANK_SIZE = 69, // Maximum bank size
    DROP_PROBABILITY = 1000, // 1 in 1000
    MAX_PROFESSION_LEVEL = 99, // Totally not influenced by another game lol
    HEAL_RATE = 5000, // healing every 5 seconds
    STORE_UPDATE_FREQUENCY = 20_000, // update store every 20 seconds
    MAP_DIVISION_SIZE = 48, // The size of a region the map is split into.
    SPAWN_POINT = '405,27', // Default starting point outside the tutorial
    TUTORIAL_QUEST_KEY = 'tutorial', // key of the tutorial quest
    TUTORIAL_SPAWN_POINT = '570,11', // 'x,y' values
    RESOURCE_RESPAWN = 30_000,
    TREE_RESPAWN = 25_000,
    SKILL_LOOP = 1000, // How often we check the loop of a skill
    MAX_ACCURACY = 0.45, // Maximum attainable accuracy for a character.
    EDIBLE_COOLDOWN = 1500, // 1.5 seconds between eating foods to prevent spam.
    INVALID_MOVEMENT_THRESHOLD = 3 // Amount of invalid movements before ignoring packets.
}

export enum MinigameConstants {
    TEAM_WAR_COUNTDOWN = 45, // 180 seconds (3 minutes) in the lobby
    TEAM_WAR_MIN_PLAYERS = 2 // Minimum number of players to start a team war
}

export enum APIConstants {
    UNHANDLED_HTTP_METHOD,
    NOT_FOUND_ERROR,
    MALFORMED_PARAMETERS,
    PLAYER_NOT_ONLINE
}

// Defaults that apply to all types of entities
export enum Defaults {
    MOVEMENT_SPEED = 250, // 250 milliseconds to traverse one tile
    ATTACK_RATE = 1000, // every 1 second
    POISON_CHANCE = 15 // 15 in (235 - level) chance to poison
}

export enum ItemDefaults {
    RESPAWN_DELAY = 30_000, // 30 seconds
    DESPAWN_DURATION = 17_000, // 17 seconds of blinking before despawning
    BLINK_DELAY = 40_000 // 40 seconds until item starts blinking.
}

// Defaults that apply specifically to mobs
export enum MobDefaults {
    EXPERIENCE = 1, // Default 1 exp granted if not specified
    AGGRO_RANGE = 2, // Default aggro range of 2 tiles
    RESPAWN_DELAY = 60_000, // 60 seconds to respawn
    ROAM_DISTANCE = 7, // 7 tiles away from spawn point
    ROAM_FREQUENCY = 10_000, // Roam interval every 10 seconds
    ROAM_RETRIES = 5, // 5 retries if the new spot is not possible
    DEFENSE_LEVEL = 1,
    ATTACK_LEVEL = 1
}

// Flags used by Tiled to determine tile rotation.
export enum MapFlags {
    DIAGONAL_FLAG = 0x20_00_00_00,
    VERTICAL_FLAG = 0x40_00_00_00,
    HORIZONTAL_FLAG = 0x80_00_00_00
}

// Handles the two states of a resource, default or depleted.
export enum ResourceState {
    Default,
    Depleted
}
