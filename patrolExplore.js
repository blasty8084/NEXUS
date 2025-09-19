const { GoalBlock } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

module.exports = function patrolExplore(bot, config = {}, logger) {
  if (!bot.entity) return;

  // Load settings from config
  const patrolPoints = config.movementSystem?.patrolPoints || [];
  const exploreRadiusMin = config.movementSystem?.exploreRadiusMin || 80;
  const exploreRadiusMax = config.movementSystem?.exploreRadiusMax || 120;
  const stepSpeedFactor = 0.6; // 40% slower for humanized movement
  let patrolIndex = 0;

  // Initialize on bot spawn
  bot.once('spawn', () => {
    logger.info('✅ 🚶 Patrol & Explore activated');
  });

  function randomTarget() {
    const pos = bot.entity.position;
    const radius = Math.floor(Math.random() * (exploreRadiusMax - exploreRadiusMin + 1)) + exploreRadiusMin;
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.floor(Math.cos(angle) * radius);
    const dz = Math.floor(Math.sin(angle) * radius);
    return pos.offset(dx, 0, dz);
  }

  function isSafeBlock(block) {
    const dangerBlocks = new Set(['lava', 'water', 'cactus', 'fire', 'web']);
    return block && !dangerBlocks.has(block.name);
  }

  // ===== Main Patrol / Explore Tick =====
  return function tick() {
    if (!bot.entity) return;

    // Patrol points
    if (patrolPoints.length > 0) {
      const [x, y, z] = patrolPoints[patrolIndex];
      bot.pathfinder.setGoal(new GoalBlock(x, y, z), true);
      patrolIndex = (patrolIndex + 1) % patrolPoints.length;
      bot.setControlState('sprint', false); // slower
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 1000 * stepSpeedFactor);
      logger.info(`🚶 Patrolling to: ${x}, ${y}, ${z}`);
      return true;
    }

    // Explore randomly
    let target = randomTarget();
    const blockBelow = bot.blockAt(target.offset(0, -1, 0));
    if (!isSafeBlock(blockBelow)) return false;

    bot.pathfinder.setGoal(new GoalBlock(target.x, target.y, target.z), true);
    bot.setControlState('sprint', false); // slower
    bot.setControlState('forward', true);
    setTimeout(() => bot.setControlState('forward', false), 1000 * stepSpeedFactor);
    logger.info(`🌍 Exploring: ${target.x}, ${target.y}, ${target.z}`);
    return true;
  };
};