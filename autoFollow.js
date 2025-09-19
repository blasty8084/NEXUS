const { GoalFollow } = require('mineflayer-pathfinder');

module.exports = function autoFollow(bot, config = {}, logger) {
  const followRange = config.followRange || 15;       // start following if player is within this distance
  const unfollowRange = config.unfollowRange || 20;   // stop following if player goes beyond this distance
  let followTarget = null;

  bot.once('spawn', () => {
    logger.info('👣 Auto Follow activated');
  });

  function findNearestPlayer() {
    let nearest = null;
    let minDist = Infinity;

    for (const username in bot.players) {
      const player = bot.players[username];
      if (!player.entity) continue;

      const dist = bot.entity.position.distanceTo(player.entity.position);
      if (dist < minDist && dist <= followRange) {
        minDist = dist;
        nearest = player.entity;
      }
    }
    return nearest;
  }

  function tick() {
    if (!bot.entity) return false;

    // Check existing follow target
    if (followTarget) {
      if (!followTarget.isValid || bot.entity.position.distanceTo(followTarget.position) > unfollowRange) {
        logger.info('🛑 Player too far or gone — stop following');
        followTarget = null;
      } else {
        bot.pathfinder.setGoal(new GoalFollow(followTarget, 2), true);
        return true; // following
      }
    }

    // Find nearest player to start following
    const nearest = findNearestPlayer();
    if (nearest) {
      followTarget = nearest;
      bot.pathfinder.setGoal(new GoalFollow(followTarget, 2), true);
      logger.info(`👣 Started following ${followTarget.username}`);
      return true;
    }

    return false; // no player to follow
  }

  return tick;
};