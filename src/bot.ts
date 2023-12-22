import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { generateMessages } from "@likissdmd/warframe-market-prime-trash-buyer"
import { getAllCoolOrders } from "@likissdmd/warframe-market-prime-trash-buyer";

dotenv.config({ path: '.env.local' });

startBot();



async function getToken(): Promise<string> {
  const argv = yargs().options({ token: { type: 'string' } }).parseSync(); // Используйте parseSync

  if (argv.token) return argv.token as string;

  if (process.env.BOT_TOKEN) return process.env.BOT_TOKEN;

  console.log("Мой токен из енва", process.env.BOT_TOKEN)


  const token = await promptToken();
  return token;
};

async function promptToken(): Promise<string> {
  console.log('Пожалуйста, введите токен вашего бота:');
  const token = await new Promise<string>((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
  return token;
};

async function startBot() {
  const bot = await setupBot();
  bot.launch();
};


async function setupBot() {
  const showKeyboard = Markup.keyboard([['/start', '/help']])
  .resize()
  .oneTime();

  const token = await getToken();

  const bot = new Telegraf(token);

  let isCommandExecuting = false;


  bot.command('start', async (ctx: Context) => {
    if (isCommandExecuting) {
      // Если команда уже выполняется, выходим из обработчика
      return;
    }

    // Устанавливаем флаг, что команда начала выполняться
    isCommandExecuting = true;

    try {
      // Скрываем кнопки в начале
      const hideKeyboard = Markup.removeKeyboard();
      await ctx.reply("Подождите, идёт обработка запроса...", hideKeyboard);

      const allCoolOrders = await getAllCoolOrders();
      const messages = generateMessages(allCoolOrders);

      if (messages.length === 0) {
        await ctx.reply('Нет подходящих запросов на продажу');
      } else {
        for (const message of messages) {
          await ctx.reply("`" + message + "`", { parse_mode: 'Markdown' });
        }
      }

    } finally {
      // Показываем кнопки в конце
      
      await ctx.reply('Выберите действие:', showKeyboard);

      // Сбрасываем флаг после завершения выполнения команды
      isCommandExecuting = false;
    }
  });




  bot.command('help', (ctx) => ctx.reply("This bot is used to find valuable orders and generate messages to buy them",showKeyboard));


  return bot;
};