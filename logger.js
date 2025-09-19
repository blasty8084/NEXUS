const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const MAX_SIZE = 2 * 1024 * 1024;

function getTimestamp() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear().toString().slice(-2)}/${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function writeLog(filePath, prefix, message) {
  const logMsg = `[${prefix}] ${getTimestamp()} - ${message}\n`;
  try {
    fs.appendFileSync(filePath, logMsg, 'utf8');
    const stats = fs.statSync(filePath);
    if(stats.size > MAX_SIZE) {
      fs.renameSync(filePath, filePath.replace('.log', `-${Date.now()}.log`));
    }
  } catch(err) {
    console.error(chalk.red('❌ Failed to write log:'), err);
  }
}

const LOG_FILES = {
  info: path.join(logDir,'bot.log'),
  warn: path.join(logDir,'warn.log'),
  error: path.join(logDir,'error.log'),
  debug: path.join(logDir,'debug.log'),
};

const logger = {
  info: msg => { console.log(chalk.blue(`ℹ️ ${msg}`)); writeLog(LOG_FILES.info,'INFO',msg); },
  warn: msg => { console.log(chalk.yellow(`⚠️ ${msg}`)); writeLog(LOG_FILES.warn,'WARN',msg); },
  error: msg => { console.log(chalk.red(`❌ ${msg}`)); writeLog(LOG_FILES.error,'ERROR',msg); },
  debug: msg => { console.log(chalk.magenta(`🐞 ${msg}`)); writeLog(LOG_FILES.debug,'DEBUG',msg); },
};

module.exports = logger;