module.exports = function(bot, config = {}, logger) {
  const settings = config.afk || {};
  const minDelay = settings.minDelay || 10000;
  const maxDelay = settings.maxDelay || 30000;

  function randomDuration(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function performAction() {
    const actions = [];

    if (settings.move?.enabled) actions.push(() => {
      bot.setControlState('forward', true);
      const dur = randomDuration(settings.move.minDuration, settings.move.maxDuration);
      setTimeout(() => bot.setControlState('forward', false), dur);
      logger.info(`🤖 Bot moved forward for ${dur}ms`);
    });

    if (settings.jump?.enabled) actions.push(() => {
      bot.setControlState('jump', true);
      const dur = randomDuration(settings.jump.minDuration, settings.jump.maxDuration);
      setTimeout(() => bot.setControlState('jump', false), dur);
      logger.info('🦘 Bot jumped');
    });

    if (settings.sneak?.enabled) actions.push(() => {
      const dur = randomDuration(settings.sneak.minDuration, settings.sneak.maxDuration);
      bot.setControlState('sneak', true);
      setTimeout(() => bot.setControlState('sneak', false), dur);
      logger.info(`🕵️ Bot sneaked for ${dur}ms`);
    });

    if (settings.swingHand?.enabled) actions.push(() => {
      const hand = Math.random() > 0.5 ? 'right' : 'left';
      const swings = randomDuration(settings.swingHand.minSwings, settings.swingHand.maxSwings);
      let count = 0;
      const interval = setInterval(() => {
        bot.swingArm(hand);
        count++;
        if (count >= swings) clearInterval(interval);
      }, 200);
      logger.info(`✋ Bot swung ${hand} hand ${swings} times`);
    });

    if (settings.look?.enabled) actions.push(() => {
      bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI / 2, true);
      logger.info('👀 Bot changed view');
    });

    // Pick random action
    if (actions.length > 0) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      action();
    }
  }

  function scheduleNext() {
    setTimeout(() => {
      performAction();
      scheduleNext();
    }, randomDuration(minDelay, maxDelay));
  }

  bot.once('spawn', () => {
    logger.info('✅ 🤖 AFK Actions plugin activated');
    scheduleNext();
  });
};