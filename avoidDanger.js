const { GoalBlock } = require('mineflayer-pathfinder');

module.exports = function avoidDanger(bot, config = {}, logger) {
  const dangerDistance = config.dangerDistance || 12; // blocks
  const hostileMobs = new Set(['creeper', 'zombie', 'skeleton', 'spider', 'witch', 'enderman']);
  const dangerBlocks = new Set(['lava', 'water', 'cactus', 'fire', 'web']);
  const stepSpeedFactor = 0.6; // slower for humanized movement

  bot.once('spawn', () => {
    logger.info('⚠️ 💀 Avoid Danger activated');
  });

  function findNearbyHostiles() {
    return Object.values(bot.entities).filter(e =>
      e.name && hostileMobs.has(e.name) &&
      bot.entity.position.distanceTo(e.position) < dangerDistance
    );
  }

  function findDangerBlock() {
    const pos = bot.entity.position;
    const range = 3; // look around bot
    for (let dx = -range; dx <= range; dx++) {
      for (let dz = -range; dz <= range; dz++) {
        const block = bot.blockAt(pos.offset(dx, -1, dz));
        if (block && dangerBlocks.has(block.name)) return block.position;
      }
    }
    return null;
  }

  function runAwayFrom(targetPos) {
    const botPos = bot.entity.position;
    const escape = botPos.offset((botPos.x - targetPos.x) * 2, 0, (botPos.z - targetPos.z) * 2);
    bot.pathfinder.setGoal(new GoalBlock(escape.x, escape.y, escape.z));
    bot.setControlState('sprint', false); // humanized slower
    logger.warn(`🏃 Running away from danger at ${targetPos.x}, ${targetPos.y}, ${targetPos.z}`);
  }

  // ===== Tick function =====
  return function tick() {
    if (!bot.entity) return false;

    const hostiles = findNearbyHostiles();
    if (hostiles.length > 0) {
      runAwayFrom(hostiles[0].position);
      return true; // priority over patrol/explore
    }

    const dangerBlockPos = findDangerBlock();
    if (dangerBlockPos) {
      runAwayFrom(dangerBlockPos);
      return true;
    }

    return false; // nothing dangerous nearby
  };
};