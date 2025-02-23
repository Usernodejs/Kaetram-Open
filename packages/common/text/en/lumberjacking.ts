export default {
    INVALID_WEAPON: 'You must equip an axe in order to cut trees.',
    INVALID_LEVEL(level: number) {
        return `You need to be at least level ${level} to cut this tree.`;
    },
    INVENTORY_FULL: 'You do not have enough space in your inventory.',
    UNABLE_TO_CUT: 'You are unable to cut this tree at the moment.'
};
