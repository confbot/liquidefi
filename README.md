# liquiDEFI
Telegram bot that help user query or get notified the liquidation stats on AAVE👻

The bot in Telegram https://t.me/aavesheetybot

### /aave [addr]

Show user liquidation stats

The bot can query by the address

```
/aave [addr]

0xAbCd..5678 on 👻Aave: 
💰 Supplied: $33762.61
💳 Borrowed: $12148.10
🌡 Collateral Rate: 277.92%
✅ Health Factor: 208
```

### /gas

Show current gasfee estimation from gasnow

You can send feedback/request to the host or ask for subscribe certain address

```
/gas

⛽️Gas prices (from gasnow):
🚀Fast: 77 Gwei
🚘Average: 58 Gwei
🚜Slow:50 Gwei
```

### /scan [address|tx]

Show etherscan links with provided address or tx

### /feedback

If you like to try
- periotically notify AAVE liquidation stats
- periotically notify gasfee
- notify with threshold
- periotically/threshold notfiy to webhook

Use `/feedback [your suggestion]` to send team the feedback.

Or use `/feedback` to ask for subscribe

`/feedback I want periotically notify me the AAVE liquidation stats with [address]`

(We manually reviewed the request for now)


# Setup

## Setup bot
- create a Telegram bot with https://t.me/botfather
- save the token for later use

## Setup spreadsheet
- create a Google Spreadsheet in https://docs.google.com/spreadsheets/
- Edit the script in menu > Tools > Scripts Editor
- paste `bot.gs` in the editor and save.
- Tap the `Deploy` button and set anyone can access, will get a public accessible url (WEBAPP_URL)
- visit that url will see a message `liquiDEFI Bot`.

## Run bot

- fill in the TELEGRAM_TOKEN
- fill in the SPREADSHEET_ID and WEBAPP_URL
- deploy again and the bot is ready to serve

To register the webhook to the telegram bot, please run setWebhook in Scripts Editor after deploy

# Reference

- Starting from EthGlobal Hackthon https://hack.ethglobal.co/showcase/liquidefi-recEkBh7CCTUqVJKB
- Telegram bot guide https://core.telegram.org/bots
- AAVE liquidations https://docs.aave.com/developers/guides/liquidations
