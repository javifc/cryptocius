const TelegramBot = require('node-telegram-bot-api');
const CoinGecko = require('coingecko-api');
const axios = require('axios');
const _ = require('underscore');
var fs = require('fs');

const bot_token = process.env.BOT_TOKEN;
const giphy_token = process.env.GIPHY_TOKEN;

const bot = new TelegramBot(bot_token, { polling: true });
const CoinGeckoClient = new CoinGecko();
const opts = [
  { command: 'norris', description: 'Chuck Norris Jokes' },
  { command: 'joke', description: 'Random Jokes' },
  { command: 'price', description: ' Get a crypto price (ie: /price eth)' },
  { command: 'gif', description: ' Get a gif meme (ie: /gif happy)' },
  { command: 'chiquito', description: ' Frases de Chiquito de la Calzada' },
  { command: 'chiste', description: ' Chistes aleatorios' },
  { command: 'coelho', description: ' Frases chupis' },
  { command: 'cunyao', description: ' Frases pa ir de listo' }
];


var mapped_coins = new Array();
var chiquito = new Array();
var chistes = new Array();
var coelho = new Array();
var cunyao = new Array();

var nf = Intl.NumberFormat();

async function initialize() {
  bot.setMyCommands(opts);

  chiquito = fs.readFileSync('bin/chiquito.txt', 'utf8').split('\n');

  chistes = fs.readFileSync('bin/chistes.txt', 'utf8').split('\n');

  coelho = fs.readFileSync('bin/coelho.txt', 'utf8').split('\n');

  cunyao = fs.readFileSync('bin/cunyao.txt', 'utf8').split('\n');

  await CoinGeckoClient.coins.list().then(data => {
    data.data.forEach(coin => {
      mapped_coins[String(coin.symbol)] = String(coin.id);
    })
  });

}

async function getPrice(symbol, chatId) {
  coin_id = mapped_coins[String(symbol)]
  coin_id = _.isUndefined(coin_id) ? symbol : coin_id;

  await CoinGeckoClient.coins.fetch(coin_id, {})
    .then(data => {
      if (data.success) {
        usd_price = data.data.market_data.current_price.usd
        eur_price = data.data.market_data.current_price.eur
        usd_price = (usd_price > 999) ? nf.format(usd_price) : usd_price;
        eur_price = (eur_price > 999) ? nf.format(eur_price) : eur_price;

        html_response = "<b>" + data.data.symbol.toUpperCase() + "</b> - " + data.data.name + "\n" +
          " <i>" + usd_price + " USD</i> - <i>" + eur_price + " Euros</i> \n" +
          " <i>" + nf.format(data.data.market_data.market_cap.usd) + " USD Mcap </i> \n" +
          " <a href=\"https://www.coingecko.com/en/coins/" + coin_id + "\">Link</a> \n";

        bot.sendMessage(chatId, html_response, { parse_mode: "HTML" });
      } else {
        bot.sendMessage(chatId, "Sorry, no coin found for " + symbol.toUpperCase());
      }
    })
}

//EVENTS LISTENERS

bot.on('polling_error', (error) => {
  console.log(error.code);  // => 'EFATAL'
});

bot.on('polling_error', function (error) {
  console.log(error);
});

bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  var chatitle = msg.chat.title;

  if (msg.new_chat_members != undefined) {

    var nameNewMember = msg.new_chat_member.first_name;

    bot.sendMessage(chatId, "Hi " + nameNewMember + ", welcome to the group " + chatitle);
  }
  else if (msg.left_chat_member != undefined) {

    var nameLeftMember = msg.left_chat_member.first_name;

    bot.sendMessage(chatId, nameLeftMember + " left the group")
  }
});

bot.onText(/^\/start/, function (msg) {
  var chatId = msg.chat.id;
  var nameUser = msg.from.first_name;

  bot.sendMessage(chatId, "Hi, how are you doing? " + nameUser);
});

bot.onText(/^\/price (.+)/, function (msg, match) {
  var symbol = match[1].toLowerCase();
  if ((_.isUndefined(symbol)) || _.isEmpty(symbol)) {
    symbol = "btc"
  }
  var chatId = msg.chat.id;
  getPrice(symbol, chatId);
});

bot.onText(/^\/norris/, function (msg) {
  var chatId = msg.chat.id;

  axios.get('https://api.chucknorris.io/jokes/random')
    .then(response => {
      bot.sendMessage(chatId, response.data.value);
    })
    .catch(error => {
      console.log(error);
    });

});

bot.onText(/^\/joke/, function (msg) {
  var chatId = msg.chat.id;

  axios.get('https://v2.jokeapi.dev/joke/Any')
    .then(response => {
      var text = "Don't feel so funny now, please try again";
      if (response.data.error === false) {
        if (response.data.type === "single") {
          text = response.data.joke;
        }
        else if (response.data.type === "twopart") {
          text = response.data.setup + " .... " + response.data.delivery;
        }
      }
      bot.sendMessage(chatId, text);
    })
    .catch(error => {
      console.log(error);
    });

});

//https://developers.giphy.com/dashboard/
//https://developers.giphy.com/docs/api/endpoint#search
bot.onText(/^\/gif (.+)/, function (msg, match) {
  var chatId = msg.chat.id;
  var q_term = match[1];
  const max_limit = 10;

  var api_url = "https://api.giphy.com/v1/gifs/search?limit=" + max_limit + "&api_key=" + giphy_token + "&q=" + q_term;
  axios.get(api_url)
    .then(response => {
      index = _.random(0, max_limit - 1);
      var url = response.data.data[index].images.original.url
      bot.sendAnimation(chatId, url);
    })
    .catch(error => {
      console.log(error);
    });
});

bot.onText(/^\/chiquito/, function (msg) {
  var chatId = msg.chat.id;
  var index = _.random(0, chiquito.length - 1);
  var text = chiquito[index];

  bot.sendMessage(chatId, text);
});

bot.onText(/^\/chiste/, function (msg) {
  var chatId = msg.chat.id;
  var index = _.random(0, chistes.length - 1);
  var text = chistes[index];

  bot.sendMessage(chatId, text);
});


bot.onText(/^\/coelho/, function (msg) {
  var chatId = msg.chat.id;
  var index = _.random(0, coelho.length - 1);
  var text = coelho[index];

  bot.sendMessage(chatId, text);
});

bot.onText(/^\/cunyao/, function (msg) {
  var chatId = msg.chat.id;
  var index = _.random(0, cunyao.length - 1);
  var text = cunyao[index];

  bot.sendMessage(chatId, text);
});

initialize();