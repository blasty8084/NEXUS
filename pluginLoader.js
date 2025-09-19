// pluginLoader.js (V2.9)
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const logger = require("./logger");

function safeRequire(filePath) {
  try {
    return require(filePath);
  } catch (err) {
    logger.error(`❌ Failed to require: ${filePath}`);
    console.error(err.stack || err);
    return null;
  }
}

function loadModules(bot, folder, label) {
  const dir = path.join(__dirname, folder);
  const configPath = path.join(__dirname, "config.json");

  let moduleConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      moduleConfig = JSON.parse(fs.readFileSync(configPath, "utf8")) || {};
    } catch (err) {
      logger.error(`❌ Failed to parse config.json: ${err.message}`);
    }
  }

  if (!fs.existsSync(dir)) {
    logger.warn(`⚠️ No ${folder} folder found.`);
    return { loaded: [], disabled: 0, jsCount: 0 };
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));
  const loaded = [];
  let disabled = 0;

  for (const file of files) {
    const name = file.replace(".js", "");
    const filePath = path.join(dir, file);

    if (moduleConfig[name]?.enabled === false) {
      logger.info(`⏸️ ${label} disabled: ${name}`);
      disabled++;
      continue;
    }

    const mod = safeRequire(filePath);
    if (!mod) continue;

    const start = Date.now();
    try {
      // Auto tick loop start for certain plugins/utils
      if (typeof mod === "function") {
        mod(bot, moduleConfig[name] || {}, logger);

        // Auto-start for reconnect plugin or AFK plugin
        if (name.toLowerCase().includes("reconnect") || name.toLowerCase().includes("afk")) {
          if (typeof mod.startTick === "function") mod.startTick();
          logger.info(`⏱️ Tick loop started for ${name}`);
        }

        logger.info(`⚡ ${label} loaded: ${name}`);
      } else if (typeof mod === "object" && label === "Util") {
        if (!bot.utils) bot.utils = {};
        bot.utils = { ...bot.utils, ...mod };

        // Start humanized AFK actions if present
        if (mod.humanizeAFK) mod.humanizeAFK(moduleConfig[name]);
        logger.info(`🛠️ Utility loaded & tick started: ${name}`);
      }
      loaded.push({ name, time: Date.now() - start });
    } catch (err) {
      logger.error(`❌ Error while loading ${label} "${name}"`);
      console.error(err.stack || err);
    }
  }

  return { loaded, disabled, jsCount: files.length };
}

function loadAll(bot) {
  const plugins = loadModules(bot, "plugins", "Plugin");
  const utils = loadModules(bot, "utils", "Util");

  logger.info(
    chalk.cyanBright(
      `✅ Load Summary:\n` +
        `   Plugins: ${plugins.loaded.length}/${plugins.jsCount} loaded, ${plugins.disabled} disabled\n` +
        `   Utils:   ${utils.loaded.length}/${utils.jsCount} loaded, ${utils.disabled} disabled`
    )
  );

  return { plugins, utils };
}

module.exports = { loadAll };