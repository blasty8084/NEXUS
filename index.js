// index.js (V2.9)
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const express = require('express');
const Vec3 = require('vec3');

const logger = require('./logger');
const settings = require('./settings.json');
const { loadAll } = require('./pluginLoader');

const app = express();
const PORT = process.env.PORT || 3000;

let bot;
let modules;
let reconnectAttempts = 0;
const maxReconnect = 5;

function createBot() {
  bot = mineflayer.createBot({
    username: settings['bot-account'].username,
    password: settings['bot-account'].password || undefined,
    host: settings.server.ip,
    port: settings.server.port,
    version: settings.server.version,
    auth: settings['bot-account'].type || 'mojang',
  });

  // Load pathfinder plugin
  bot.loadPlugin(pathfinder);

  // Load all plugins & utils dynamically
  modules = loadAll(bot);

  bot.once('spawn', () => {
    reconnectAttempts = 0;
    logger.info(`🤖 Bot "${bot.username}" connected to ${settings.server.ip}:${settings.server.port}`);

    // Initialize pathfinder movements
    try {
      const mcData = require('minecraft-data')(bot.version);
      const movements = new Movements(bot, mcData);
      bot.pathfinder.setMovements(movements);
      logger.info('🧭 Pathfinder movements initialized.');
    } catch (err) {
      logger.error('❌ Failed to initialize pathfinder movements: ' + (err.stack || err));
    }

    // Announce loaded plugins/utils
    logger.info(`📦 Plugins Loaded: ${modules.plugins.loaded.map(p => p.name).join(', ') || 'None'}`);
    logger.info(`🛠️ Utils Loaded: ${modules.utils.loaded.map(u => u.name).join(', ') || 'None'}`);
  });

  // Handle disconnects & reconnects
  bot.on('end', () => {
    logger.warn('❌ Bot disconnected!');
    if (reconnectAttempts < maxReconnect) {
      reconnectAttempts++;
      logger.info(`🔁 Attempting reconnect ${reconnectAttempts}/${maxReconnect}...`);
      setTimeout(createBot, 5000);
    } else {
      logger.error('⛔ Max reconnect attempts reached. Bot stopped.');
    }
  });

  bot.on('error', (err) => logger.error('💥 Bot error: ' + (err.stack || err)));
  bot.on('kicked', (reason) => logger.error(`💥 Bot kicked: ${JSON.stringify(reason)}`));
  bot.on('message', (msg) => logger.debug(`💬 Chat: ${msg.toString()}`));
}

// Global error handling
process.on('uncaughtException', (err) => logger.error('💀 Uncaught exception: ' + (err.stack || err)));
process.on('unhandledRejection', (reason) => logger.error('💀 Unhandled rejection: ' + (reason.stack || reason)));

// Start bot
createBot();

// Webserver for UptimeRobot
app.get('/', (req, res) => {
  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.send(`🤖 Bot is running! <a href="${currentUrl}">${currentUrl}</a>`);
});

app.listen(PORT, () => logger.info(`🌐 Web server running at http://localhost:${PORT}`));

module.exports = { bot, modules, Vec3, pathfinder, goals };