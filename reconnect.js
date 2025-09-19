module.exports = function(bot, config = {}, logger) {
  const reconnectDelay = config.reconnectDelay || 5000; // default 5s
  const maxAttempts = config.maxAttempts || 5;
  let attempts = 0;

  function attemptReconnect() {
    if (attempts >= maxAttempts) {
      logger.error(`❌ Max reconnect attempts (${maxAttempts}) reached. Bot stopped.`);
      return;
    }
    attempts++;
    logger.info(`🔁 Attempting reconnect (${attempts}/${maxAttempts}) in ${reconnectDelay}ms...`);
    setTimeout(() => {
      try {
        bot.connect?.(); // for newer versions
      } catch (err) {
        logger.error(`💥 Reconnect failed: ${err.stack || err}`);
        attemptReconnect();
      }
    }, reconnectDelay);
  }

  // Hook into bot disconnect
  bot.on('end', () => {
    logger.warn('❌ Bot disconnected! Triggering reconnect plugin...');
    attemptReconnect();
  });

  bot.once('spawn', () => {
    attempts = 0; // reset attempts on fresh spawn
    logger.info('✅ 🔌 Reconnect plugin activated');
  });
};