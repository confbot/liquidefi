// while deploy, set anyone can access
// run setWebhook after first deploy
// NEED SPECIFY DURING SETUP
var SPREADSHEET_ID = '';
var WEBAPP_URL = '';
var TELEGRAM_TOKEN = '';

var TEST_ADDRESS = '';
var FeedBack_subscribers = [];
var Gasfee_subscribers = [];

/*
Support commands
aave - [addr] show user liquidation stats
scan - [addr] show etherscan link with address/tx
gas - current estimate gas fee (from gas now)
feedback - send feedback to the host
*/

/*
triggerGasnow - send subscribe gas fee periotically
*/

// DO NOT CHANGE CODE BELOW IF YOU DONT KNOW WHAT YOU ARE DOING
var ETHEREUM_NODE = 'https://api.mycryptoapi.com/eth';
var TELEGRAM_API = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/';

// utils
function int(num) {
  return parseInt(num, 10);
}

function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

function getUserInfo() {
  sendMessages("ID: " + [this.update.message.from.id]);
}

function setWebhook(e) {
  var TELEGRAM_WEBHOOK = TELEGRAM_API + 'setWebhook?url=' + WEBAPP_URL;
  const result = UrlFetchApp.fetch(TELEGRAM_WEBHOOK);
  Logger.log(result.getContentText());
}

function sendMessages(msg, senders) {
  senders.forEach(function(senderId) {
    const options = {
      'method' : 'post',
      'contentType': 'application/json',
      'payload' : JSON.stringify({
        'chat_id': senderId,
        'text': msg
      })
    };

    const response = UrlFetchApp.fetch(TELEGRAM_API + 'sendMessage', options);

    if (response.getResponseCode() == 200) {
      return JSON.parse(response.getContentText());
    }
    return false;
  });
}


// SKILLS
function showEtherscan() {
  var ID = this.update && this.update.message && this.update.message.from && this.update.message.from.id || '';
  var address = (this.update && this.update.message && this.update.message.text)
    ? this.update.message.text.replace('/scan ', '')
    : '';
  var msg = address && address.length == 42
    ? 'https://etherscan.io/address/' + address // address
    : 'https://etherscan.io/tx/' + address // tx
  if(ID && address) {
    sendMessages(msg, [ID]);
  }
}

// https://docs.aave.com/developers/the-core-protocol/lendingpool#getuseracountdata
var idx = 1;
var AAVE_LENDINGPOOL_CONTRACT = '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9';

// to liquidate https://protocol-api.aave.com/liquidations?get=proto
// health > 1.3 ✅, 🧨 > 1, liquidated 💀
function getHealthRateEmoji(rate) {
  if (rate > 130) {
    return '✅';
  }
  else if (rate > 100) {
    return '🧨';
  } else {
    return '💀';
  }
}

function getAaveHealthFactor() {
  var ID = this.update && this.update.message && this.update.message.from && this.update.message.from.id || '';
  var address = (this.update && this.update.message && this.update.message.text)
    ? this.update.message.text.replace('/aave ', '')
    : TEST_ADDRESS;
  // SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Feedback').appendRow([new Date(), ID, 'bot', address]);
  var data = {
    jsonrpc: '2.0',
    id: idx++,
    method: 'eth_call',
    params: [
      {
        to: AAVE_LENDINGPOOL_CONTRACT,
        data: '0xbf92857c' + address.replace('0x', '').padStart(64, '0')
      },
      'latest'
    ],
  };
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data) // Convert the JavaScript object to a JSON string.
  };
  var rawData = JSON.parse(UrlFetchApp.fetch(ETHEREUM_NODE, options).getContentText()).result;

  var totalCollateralETH = toFixed(parseFloat(rawData.slice(0, 66) / 10**15), 2);
  var totalDebtETH = toFixed(parseFloat(('0x' + rawData.slice(66, 130)) / 10**15), 2);
  var borrowed = parseInt('0x' + rawData.slice(66, 130));
  var collateralRate = borrowed === 0
    ? ' - '
    : toFixed(parseInt(rawData.slice(0, 66)) * 100 / parseInt('0x' + rawData.slice(66, 130)), 2)
  var healthFactor = parseInt(('0x' + rawData.slice(322, 386)) / 10**16);

  var msg = address.slice(0, 6) + '..' + address.slice(38, 42) + ' on 👻Aave: \n💰 Supplied: $' +  totalCollateralETH
    + '\n💳 Borrowed: $' + totalDebtETH
    + '\n🌡 Collateral Rate: ' + collateralRate
    + '%\n' + getHealthRateEmoji(healthFactor) + ' Health Factor: ' + healthFactor + '%';
  Logger.log(msg);

  if(ID) {
    sendMessages(msg, [ID]);
  }
}

function getFeedBack() {
  var ID = this.update.message.from.id;
  var NAME = this.update.message.from.first_name + ' ' + this.update.message.from.last_name;
  var TEXT = this.update.message.text.replace('/feedback ', '');
  var msg = NAME + '(' + ID + '): ' + TEXT;
  SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Feedback').appendRow([new Date(), ID, NAME, TEXT])
  sendMessages(msg, FeedBack_subscribers);
}

function gasnow(userId) {
  var ID = this.update && this.update.message && this.update.message.from && this.update.message.from.id || userId || '';
  var url = 'https://www.gasnow.org/api/v3/gas/price?utm_source=:gaso';

  var json = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  var parsedData = {
      H: int(json.data.fast / 10**9),
      M: int(json.data.standard / 10**9),
      L: int(json.data.slow / 10**9),
  }
  var msg = '⛽️Gas prices (from gasnow):\n🚀Fast: '
    + parsedData.H + ' Gwei\n🚘Average: '
    + parsedData.M + ' Gwei\n🚜Slow:'
    + parsedData.L + ' Gwei';
  Logger.log(msg);

  if(ID) {
    if (Array.isArray(ID)) {
      sendMessages(msg, ID);
    } else {
      sendMessages(msg, [ID]);
    }
  }
}

// TRIGGERS
function triggerGasnow() {
  gasnow(Gasfee_subscribers);
}


// refer https://gist.github.com/unnikked/828e45e52e217adc09478321225ec3de
function Bot (token, update) {
  this.token = token;
  this.update = update;
  this.handlers = [];
}

Bot.prototype.register = function ( handler) {
  this.handlers.push(handler);
}

Bot.prototype.process = function () {
  for (var i in this.handlers) {
    const event = this.handlers[i];
    const result = event.condition(this);
    if (result) {
      return event.handle(this);
    }
  }
}

Bot.prototype.request = function (method, data) {
  const options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };

  const response = UrlFetchApp.fetch(TELEGRAM_API + method, options);

  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  }

  return false;
}

Bot.prototype.replyToSender = function (text, senderId) {
  return this.request('sendMessage', {
    'chat_id': senderId || this.update.message.from.id,
    'text': text
  });
}

function CommandBus() {
  this.commands = [];
}

CommandBus.prototype.on = function (regexp, callback) {
  this.commands.push({'regexp': regexp, 'callback': callback});
}

CommandBus.prototype.condition = function (bot) {
  return bot.update.message.text.charAt(0) === '/';
}

CommandBus.prototype.handle = function (bot) {
  for (var i in this.commands) {
    const cmd = this.commands[i];
    const tokens = cmd.regexp.exec(bot.update.message.text);
    if (tokens != null) {
      return cmd.callback.apply(bot, tokens.splice(1));
    }
  }
  return bot.replyToSender("Invalid command");
}

// HTTP
function doGet(e) {
  return HtmlService.createHtmlOutput('liquiDEFI Bot');
}

function doPost(e) {
 // Make sure to only reply to json requests
 if(e.postData.type == "application/json") {
  // Parse the update sent from Telegram
  const update = JSON.parse(e.postData.contents);
  // Instantiate the bot passing the update
  const bot = new Bot(TELEGRAM_TOKEN, update);

  // Building commands
  const bus = new CommandBus();
  bus.on(/\/gas$/, gasnow);
  bus.on(/\/feedback /, getFeedBack);
  bus.on(/\/aave /, getAaveHealthFactor);
  bus.on(/\/scan /, showEtherscan);
  // private
  bus.on(/\/info$/, getUserInfo);

  // Register the command bus
  bot.register(bus);

  // If the update is valid, process it
  if (update) {
   bot.process();
  }
 }
}
