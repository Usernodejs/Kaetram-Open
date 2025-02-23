import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules, Opcodes } from '@kaetram/common/network';

import {
    Ability as AbilityPacket,
    Achievement,
    Container,
    Death,
    Despawn,
    Equipment as EquipmentPacket,
    Friends,
    NPC as NPCPacket,
    Overlay,
    Points,
    Poison as PoisonPacket,
    Quest,
    Skill
} from '../../../../network/packets';

import type Light from '../../../globals/impl/light';
import type Map from '../../../map/map';
import type World from '../../../world';
import type Entity from '../../entity';
import type Character from '../character';
import type Ability from './ability/ability';
import type Slot from './containers/slot';
import type Equipment from './equipment/equipment';
import type Areas from '../../../map/areas/areas';
import type NPC from '../../npc/npc';
import type Mob from '../mob/mob';
import type Player from './player';
import type { ProcessedDoor } from '@kaetram/common/types/map';

export default class Handler {
    private world: World;
    private map: Map;

    private updateTime = 600;

    private updateTicks = 0;
    private updateInterval: NodeJS.Timeout | null = null;

    public constructor(private player: Player) {
        this.world = player.world;
        this.map = player.world.map;

        // Disconnect callback
        this.player.connection.onClose(this.handleClose.bind(this));

        // Death callback
        this.player.onDeath(this.handleDeath.bind(this));

        // Hit callback
        this.player.onHit(this.handleHit.bind(this));

        // Movement-related callbacks
        this.player.onDoor(this.handleDoor.bind(this));
        this.player.onMovement(this.handleMovement.bind(this));

        // Region callback
        this.player.onRegion(this.handleRegion.bind(this));
        this.player.onRecentRegions(this.handleRecentRegions.bind(this));

        // Loading callbacks
        this.player.equipment.onLoaded(this.handleEquipment.bind(this));
        this.player.inventory.onLoaded(this.handleInventory.bind(this));
        this.player.quests.onLoaded(this.handleQuests.bind(this));
        this.player.achievements.onLoaded(this.handleAchievements.bind(this));
        this.player.skills.onLoaded(this.handleSkills.bind(this));
        this.player.abilities.onLoaded(this.handleAbilities.bind(this));

        // Inventory callbacks
        this.player.inventory.onAdd(this.handleInventoryAdd.bind(this));
        this.player.inventory.onRemove(this.handleInventoryRemove.bind(this));
        this.player.inventory.onNotify(this.player.notify.bind(this.player));

        // Bank callbacks
        this.player.bank.onAdd(this.handleBankAdd.bind(this));
        this.player.bank.onRemove(this.handleBankRemove.bind(this));
        this.player.bank.onNotify(this.player.notify.bind(this.player));

        // Friends list callback
        this.player.friends.onLoad(this.handleFriends.bind(this));
        this.player.friends.onAdd(this.handleFriendsAdd.bind(this));
        this.player.friends.onRemove(this.handleFriendsRemove.bind(this));
        this.player.friends.onStatus(this.handleFriendsStatus.bind(this));

        // Equipment callbacks
        this.player.equipment.onEquip(this.handleEquip.bind(this));
        this.player.equipment.onUnequip(this.handleUnequip.bind(this));

        // Ability callbacks
        this.player.abilities.onAdd(this.handleAbilityAdd.bind(this));

        // NPC talking callback
        this.player.onTalkToNPC(this.handleTalkToNPC.bind(this));

        // Killing a character callback
        this.player.onKill(this.handleKill.bind(this));

        // Poison callback
        this.player.onPoison(this.handlePoison.bind(this));

        // Cheat-score callback
        this.player.onCheatScore(this.handleCheatScore.bind(this));

        // Mana callback
        this.player.mana.onMana(this.handleMana.bind(this));
    }

    /**
     * Called after receiving the ready backet. Signals to the handler that we should
     * start loading our update interval timer.
     */

    public startUpdateInterval(): void {
        this.updateInterval = setInterval(this.handleUpdate.bind(this), this.updateTime);
    }

    /**
     * Callback handler for when the player's connection is closed.
     */

    private handleClose(): void {
        this.player.stopHealing();

        this.clear();

        if (this.player.ready) {
            if (config.discordEnabled)
                this.world.discord.sendMessage(this.player.username, 'has logged out!');

            if (config.hubEnabled)
                this.world.api.sendChat(Utils.formatName(this.player.username), 'has logged out!');
        }

        if (this.player.inMinigame()) this.player.getMinigame()?.disconnect(this.player);

        this.player.clearAreas();

        this.player.minigameArea?.exitCallback?.(this.player);

        this.world.entities.removePlayer(this.player);

        this.world.cleanCombat(this.player);

        this.world.linkFriends(this.player, true);
    }

    /**
     * Callback for when the player dies.
     */

    private handleDeath(attacker?: Character): void {
        this.player.dead = true;

        if (attacker) {
            attacker.clearTarget();
            attacker.removeAttacker(this.player);

            if (attacker.isPlayer()) {
                this.player.statistics.pvpDeaths++;

                // Signal to attacker they just killed a player.
                attacker.killCallback?.(this.player);
            }
        }

        // Send despawn packet to all the nearby entities except the player.
        this.player.sendToRegions(
            new Despawn({
                instance: this.player.instance
            }),
            true
        );

        // Remove the poison status.
        this.player.setPoison();

        this.player.skills.stop();
        this.player.combat.stop();
        this.player.save();

        // Send death packet only to the player.
        this.player.send(new Death(this.player.instance));
    }

    /**
     * Callback handler for when the player is hit.
     * @param damage The amount of damage dealt.
     * @param attacker Who is attacking the player.
     */

    private handleHit(damage: number, attacker?: Character): void {
        if (!attacker) return;

        if (!this.player.hasAttacker(attacker)) this.player.addAttacker(attacker);
    }

    /**
     * Receive a callback about the door destination coordinate
     * and quest information (if existant).
     */

    private handleDoor(door: ProcessedDoor): void {
        // Reset talking index when passing through any door.
        this.player.talkIndex = 0;

        // If a door has a quest, redirect to the quest handler's door callback.
        if (door.quest) {
            let quest = this.player.quests.get(door.quest);

            return quest.doorCallback?.(door, this.player);
        }

        // Prevent the player from entering if the player's level is too low.
        if (this.player.level < door.level)
            return this.player.notify(`You need to be level ${door.level} to enter this door.`);

        // Do not pass through doors that require an achievement which hasn't been completed.
        if (door.reqAchievement && !this.player.achievements.get(door.reqAchievement)?.isFinished())
            return;

        // Ensure quest requirement is fullfilled before passing through the door.
        if (door.reqQuest && !this.player.quests.get(door.reqQuest)?.isFinished()) return;

        // If the door has an achievement associated with it, it gets completed here.
        if (door.achievement) this.player.achievements.get(door.achievement)?.finish();

        this.player.teleport(door.x, door.y);

        log.debug(`[Handler] Going through door: ${door.x} - ${door.y}`);
    }

    /**
     * Handles the player's movement and passes new position as parameters.
     * @param x The new x grid position.
     * @param y The new y grid position.
     */

    private handleMovement(x: number, y: number): void {
        this.map.regions.handle(this.player);

        // Prevent out of bounds (placeholder coordinates) from being processed.
        if (this.map.isOutOfBounds(x, y)) return;

        this.detectAggro();
        this.detectAreas(x, y);

        this.player.storeOpen = '';
        this.player.plateauLevel = this.map.getPlateauLevel(x, y);
    }

    /**
     * Callback for when a region has changed.
     * @param region The new region.
     */

    private handleRegion(region: number): void {
        log.debug(`Player ${this.player.username} entered region: ${region}.`);

        this.handleLights(region);

        this.player.updateEntityList();

        this.player.lastRegionChange = Date.now();
    }

    /**
     * Sends a despawn packet to the regions the player has recently left.
     * @param regions Contains the array of regions the player has recently left.
     */

    private handleRecentRegions(regions: number[]): void {
        log.debug(`Sending despawn to recent regions: [${regions.join(', ')}].`);

        this.player.sendToRecentRegions(
            new Despawn({
                instance: this.player.instance,
                regions
            })
        );
    }

    /**
     * Callback once the equipments are loaded. Relay the mesasge to the client.
     */

    private handleEquipment(): void {
        this.player.send(
            new EquipmentPacket(Opcodes.Equipment.Batch, {
                data: this.player.equipment.serialize(true)
            })
        );
    }

    /**
     * Callback for when an item is equipped.
     * @param equipment The equipment slot and the data contained.
     */

    private handleEquip(equipment: Equipment): void {
        this.player.send(
            new EquipmentPacket(Opcodes.Equipment.Equip, {
                data: equipment
            })
        );

        // Sync to nearby players.
        this.player.sync();
    }

    /**
     * Callback for when the equipment is removed.
     * @param type The equipment type we are removing.
     */

    private handleUnequip(type: Modules.Equipment): void {
        this.player.send(new EquipmentPacket(Opcodes.Equipment.Unequip, { type }));

        // Sync to nearby players.
        this.player.sync();
    }

    /**
     * Sends a pacet to the client to add a new ability.
     * @param ability The ability that the player is adding.
     */

    private handleAbilityAdd(ability: Ability): void {
        this.player.send(new AbilityPacket(Opcodes.Ability.Add, ability.serialize(true)));
    }

    /**
     * Callback for when the inventory is loaded. Relay message to the client.
     */

    private handleInventory(): void {
        // Send Batch packet to the client.
        this.player.send(
            new Container(Opcodes.Container.Batch, {
                type: Modules.ContainerType.Inventory,
                data: this.player.inventory.serialize()
            })
        );
    }

    /**
     * Sends a packet to the client whenever
     * we add an item in our inventory.
     * @param slot The slot we just added the item to.
     */

    private handleInventoryAdd(slot: Slot): void {
        this.player.send(
            new Container(Opcodes.Container.Add, {
                type: Modules.ContainerType.Inventory,
                slot
            })
        );
    }

    /**
     * Send a packet to the client to clear the inventory slot.
     * @param slot The slot of the item we removed.
     * @param key The key of the slot we removed.
     * @param count The count represents the amount of item we are dropping, NOT IN THE SLOT.
     * @param drop If the item should spawn in the world upon removal.
     */

    private handleInventoryRemove(slot: Slot, key: string, count: number, drop?: boolean): void {
        // Spawn the item in the world if drop is true.
        if (drop)
            this.world.entities.spawnItem(
                key, // Key of the item before an action is done on the slot.
                this.player.x,
                this.player.y,
                true,
                count, // Note this is the amount we are dropping.
                slot.enchantments
            );

        this.player.send(
            new Container(Opcodes.Container.Remove, {
                type: Modules.ContainerType.Inventory,
                slot: slot.serialize()
            })
        );
    }

    /**
     * Sends a packet to the client containing batch data for the quests.
     */

    private handleQuests(): void {
        this.player.send(new Quest(Opcodes.Quest.Batch, this.player.quests?.serialize(true)));
    }

    /**
     * Sends a packet to the client containing batch data for the achievements.
     */

    private handleAchievements(): void {
        this.player.send(
            new Achievement(Opcodes.Achievement.Batch, this.player.achievements?.serialize(true))
        );
    }

    /**
     * Sends a packet to the server containing batch data
     * for the skills.
     */

    private handleSkills(): void {
        this.player.send(new Skill(Opcodes.Skill.Batch, this.player.skills?.serialize(true)));
    }

    /**
     * Sends a packet to the client containing serialized abilities.
     */

    private handleAbilities(): void {
        this.player.send(
            new AbilityPacket(Opcodes.Ability.Batch, this.player.abilities?.serialize(true))
        );
    }

    /**
     * Sends a packet to the client whenever
     * we add an item in our bank.
     * @param slot The slot we just added the item to.
     */

    private handleBankAdd(slot: Slot): void {
        this.player.send(
            new Container(Opcodes.Container.Add, {
                type: Modules.ContainerType.Bank,
                slot
            })
        );
    }

    /**
     * Callback sent to the client for when a slot is removed from the bank.
     * @param slot The slot of the bank we just removed data from.
     */

    private handleBankRemove(slot: Slot): void {
        this.player.send(
            new Container(Opcodes.Container.Remove, {
                type: Modules.ContainerType.Bank,
                slot: slot.serialize()
            })
        );
    }

    /**
     * Callback for when the player's friends list finishes loading
     */

    private handleFriends(): void {
        this.player.send(
            new Friends(Opcodes.Friends.List, {
                list: this.player.friends?.getFriendsList()
            })
        );
    }

    /**
     * Callback for when a friend is added to the friends list.
     * @param username The username of the friend we just added.
     * @param status The online status of the friend we just added.
     */

    private handleFriendsAdd(username: string, status: boolean): void {
        this.player.send(
            new Friends(Opcodes.Friends.Add, {
                username,
                status
            })
        );
    }

    /**
     * Callback for when a friend is removed from the friends list.
     */

    private handleFriendsRemove(username: string): void {
        this.player.send(
            new Friends(Opcodes.Friends.Remove, {
                username
            })
        );
    }

    /**
     * Synchronizes with the client the online status of a friend.
     * @param username The username of the friend we are updating.
     * @param status The online status of the friend we are updating.
     */

    private handleFriendsStatus(username: string, status: boolean): void {
        this.player.send(
            new Friends(Opcodes.Friends.Status, {
                username,
                status
            })
        );
    }

    /**
     * Callback for when a player interacts with an NPC.
     * @param npc The NPC instance we are interacting with.
     */

    private handleTalkToNPC(npc: NPC): void {
        // Primarily for the prevention of packet injection.
        if (!this.player.isAdjacent(npc))
            return log.warning(
                `Player ${this.player.username} tried to talk to NPC ${npc.key} but is not adjacent.`
            );

        // Checks if the NPC has an active quest associated with it.
        let quest = this.player.quests.getQuestFromNPC(npc);

        if (quest) return quest.talkCallback?.(npc, this.player);

        // Checks if the NPC has an active achievement associated with it.
        let achievement = this.player.achievements.getAchievementFromEntity(npc);

        if (achievement) return achievement.talkCallback?.(npc, this.player);

        // NPC is a store.
        if (npc.store) return this.world.stores.open(this.player, npc);

        switch (npc.role) {
            case 'banker': {
                this.player.send(new NPCPacket(Opcodes.NPC.Bank, this.player.bank.serialize()));
                return;
            }
            case 'enchanter': {
                this.player.send(new NPCPacket(Opcodes.NPC.Enchant, {}));
                break;
            }
        }

        npc.talk(this.player);
    }

    /**
     * Callback for when a character instance is killed.
     * @param character A character instance, generally a player or a mob.
     */

    private handleKill(character: Character): void {
        log.debug(`Received kill callback for: ${character.instance}.`);

        // Have the minigame handle the kill if present.
        if (character.isPlayer()) {
            if (this.player.inMinigame()) this.player.getMinigame()?.kill(this.player);

            // Incremebt the pvp kill count.
            this.player.statistics.pvpKills++;
        }

        // Skip if the kill is not a mob entity.
        if (!character.isMob()) return;

        // Handle the experience upon killing a mob.
        this.player.handleExperience((character as Mob).experience);

        /**
         * Special mobs (such as minibosses and bosses) have achievements
         * associated with them. Upon killing them, we complete the achievement.
         */

        let mobAchievement = (character as Mob).achievement;

        if (mobAchievement) this.player.achievements.get(mobAchievement).finish();

        // Checks if the mob has a active quest associated with it.
        let quest = this.player.quests.getQuestFromMob(character as Mob);

        if (quest) quest.killCallback?.(character as Mob);

        // Checks if the mob has an active achievement associated with it.
        let achievement = this.player.achievements.getAchievementFromEntity(character as Mob);

        if (achievement) achievement.killCallback?.(character as Mob);
    }

    /**
     * Callback for when the player's poison status updates.
     */

    private handlePoison(type = -1, exists = false): void {
        // Notify the player when the poison status changes.
        if (type === -1) this.player.notify('The poison has worn off.');
        else if (exists) this.player.notify(`You have been poisoned!`);

        this.player.send(new PoisonPacket(type));
    }

    /**
     * Callback for when the cheat score updates.
     */

    private handleCheatScore(): void {
        /**
         * This is a primitive anti-cheating system.
         * It will not accomplish much, but it is enough for now.
         */

        if (this.player.cheatScore > 15) {
            this.player.sendToSpawn();

            this.player.connection.reject('cheating');
        }

        log.debug(`Cheat score - ${this.player.cheatScore}`);
    }

    /**
     * Callback for when a change in player's mana has occurred.
     */

    private handleMana(): void {
        this.player.send(
            new Points({
                instance: this.player.instance,
                mana: this.player.mana.getMana(),
                maxMana: this.player.mana.getMaxMana()
            })
        );
    }

    /**
     * Callback function for the update that gets called every `updateTime` seconds.
     */

    private handleUpdate(): void {
        if (this.isTickInterval(4)) this.detectAggro();
        if (this.isTickInterval(10)) this.player.cheatScore = 0;

        this.updateTicks++;
    }

    /**
     * Synchronizes the lights within the region with the player.
     * @param regionId Identifier of the region we just entered.
     */

    private handleLights(regionId: number): void {
        let region = this.map.regions.get(regionId);

        if (!region) return;

        region.forEachLight((light: Light) => {
            if (this.player.hasLoadedLight(light.id)) return;

            this.player.send(
                new Overlay(Opcodes.Overlay.Lamp, {
                    light: light.serialize()
                })
            );

            this.player.lightsLoaded.push(light.id);
        });
    }

    /**
     * Checks for the area the player is currently in at the given
     * `x` and `y` positions. Triggers an update in the player's area
     * state if it differs from the player's current state. (e.g. if
     * the player is not in a PVP area and enters a PVP area, the player's
     * current state differs from the position's state, so the player's
     * state is updated and relayed to the client).
     * @param x The x grid coordinate we are checking the area at.
     * @param y The y grid coordinate we are checking the area at.
     */

    private detectAreas(x: number, y: number): void {
        this.map.forEachAreas(
            (areas: Areas, name: string) => {
                let info = areas.inArea(x, y);

                switch (name) {
                    case 'pvp': {
                        return this.player.updatePVP(!!info);
                    }

                    case 'overlay': {
                        return this.player.updateOverlay(info);
                    }

                    case 'camera': {
                        return this.player.updateCamera(info);
                    }

                    case 'music': {
                        return this.player.updateMusic(info);
                    }

                    case 'minigame': {
                        return this.player.updateMinigame(info);
                    }
                }
            },
            ['pvp', 'music', 'overlay', 'camera', 'minigame']
        );
    }

    /**
     * Whenever a player's position updates, we check if the nearby entities
     * can aggro the player. See `canAggro` in `Mob` for conditions under
     * which a player will be aggroed by a free-roaming mob.
     */

    private detectAggro(): void {
        let region = this.map.regions.get(this.player.region);

        region.forEachEntity((entity: Entity) => {
            // Ignore non-mob entities.
            if (!entity.isMob()) return;

            // Check if the mob can aggro the player and initiate the combat.
            if ((entity as Mob).canAggro(this.player)) (entity as Mob).combat.attack(this.player);
        });
    }

    /**
     * Takes a `interval` value and modulos it against the current updateTicks.
     * This is to separate an event into a larger interval instead of starting
     * multiple `setInterval` functions. For example, an `interval` of 4 means
     * that the event is called every 4 ticks (or 2400 milliseconds if `updateTime`
     * is set to 600 milliseconds).
     * @param interval The modulo interval.
     * @returns Whether or not the `interval` is reached.
     */

    private isTickInterval(interval: number): boolean {
        return this.updateTicks % interval === 0;
    }

    /**
     * Clears the timeouts and nullifies them (used for disconnection);
     */

    private clear(): void {
        this.player.clearTimeout();

        clearInterval(this.updateInterval!);
        this.updateInterval = null;
    }
}
