import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { generateMessages } from "@likissdmd/warframe-market-prime-trash-buyer"
import { getAllCoolOrders } from "@likissdmd/warframe-market-prime-trash-buyer";

dotenv.config({ path: '.env.local' });


const initBot = async (): Promise<Telegraf<Context>> => {
  const token = await getToken();
  return new Telegraf(token);
};

const getToken = async (): Promise<string> => {
  const argv = yargs().options({ token: { type: 'string' } }).parseSync(); // Используйте parseSync

  if (argv.token) return argv.token as string;

  if (process.env.BOT_TOKEN) return process.env.BOT_TOKEN;

  console.log("Мой токен из енва", process.env.BOT_TOKEN)


  const token = await promptToken();
  return token;
};

const promptToken = async (): Promise<string> => {
  console.log('Пожалуйста, введите токен вашего бота:');
  const token = await new Promise<string>((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
  return token;
};


const setupBot = async () => {
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
      const keyboard = Markup.keyboard([['/start', '/help']])
        .resize()
        .oneTime();

      await ctx.reply(
        "Подождите, идёт обработка запроса..."
      );

      const allCoolOrders = await getAllCoolOrders();
      const messages = generateMessages(allCoolOrders);

      if (messages.length === 0) {
        await ctx.reply('Нет подходящих запросов на продажу');
      } else {
        await ctx.reply(messages.toString());
      }
    } finally {
      // Сбрасываем флаг после завершения выполнения команды
      isCommandExecuting = false;
    }
  });


  bot.command('help', (ctx) => ctx.reply('Логика команды /help здесь'));

  bot.use(async (ctx, next) => {
    // Добавить кнопки Start и Help
    // Комментарий: Кнопки всегда присутствуют

    await next();
  });

  return bot;
};

const startBot = async () => {
  const bot = await setupBot();
  bot.launch();
};

startBot();
