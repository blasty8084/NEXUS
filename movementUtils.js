const patrolExplore = require('./patrolExplore');
const avoidDanger = require('./avoidDanger');
const autoFollow = require('./autoFollow');
const afkActions = require('./afkActions');

module.exports = function createMovementUtils(bot, logger, config = {}) {
  const utils = {};
  const tickInterval = config.tickInterval || 2000; // default tick interval

  // ===== Priority System 1 > 2 > 3 =====
  function tick() {
    // 1️⃣ Avoid Danger (highest priority)
    if (avoidDanger(bot, config, logger)) return;

    // 2️⃣ Auto Follow nearby player
    if (autoFollow(bot, config, logger)) return;

    // 3️⃣ Patrol & Explore if no danger or follow
    patrolExplore(bot, config, logger);
  }

  // Start main tick loop
  utils.startTickLoop = () => {
    bot.once('spawn', () => {
      logger.info('✅ 🛠️ Movement Utils activated');
      tick(); // first tick immediately
      setInterval(tick, tickInterval);
    });
  };

  // Initialize AFK Actions
  utils.startAFKActions = () => {
    if (config.afk?.enabled) {
      afkActions(bot, config, logger);
    }
  };

  return utils;
};