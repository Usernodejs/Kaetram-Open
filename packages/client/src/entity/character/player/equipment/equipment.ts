import Util from '../../../../utils/util';

import type { Bonuses, Enchantments, Stats } from '@kaetram/common/types/item';

export default abstract class Equipment {
    public attackStats: Stats = Util.getEmptyStats();
    public defenseStats: Stats = Util.getEmptyStats();
    public bonuses: Bonuses = Util.getEmptyBonuses();

    public constructor(
        public key = '',
        public name = '',
        public count = 0,
        public enchantments: Enchantments = {},
        public ranged = false
    ) {}

    /**
     * An update function that is called when the equipment is equipped.
     * The function can be called with no parameters when the equipment is unequipped.
     * @param key The key of the item.
     * @param name The visual name of the item (the one the player sees).
     * @param count The amount of items in the equipment (if it is stackable).
     * @param enchantments The enchantments of the item.
     * @param ranged Whether or not the item is ranged.
     * @param attackStats The attack stats of the item.
     * @param defenseStats The defense stats of the item.
     * @param bonuses The bonuses of the item.
     */

    public update(
        key = '',
        name = '',
        count = 0,
        enchantments: Enchantments = {},
        ranged = false,
        attackStats?: Stats,
        defenseStats?: Stats,
        bonuses?: Bonuses
    ): void {
        this.key = key;
        this.name = name;
        this.count = count;
        this.enchantments = enchantments;
        this.ranged = ranged;

        // Add the stats and bonuses only if they exist.
        this.attackStats = attackStats || Util.getEmptyStats();
        this.defenseStats = defenseStats || Util.getEmptyStats();
        this.bonuses = bonuses || Util.getEmptyBonuses();
    }

    /**
     * A check for whether or not the item is equipped.
     * @returns Whether the key is an empty string or not.
     */

    public exists(): boolean {
        return this.key !== '';
    }
}
