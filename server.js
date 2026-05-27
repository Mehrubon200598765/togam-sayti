const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = '8792427523:AAFyFsQAcX4W8iZN95BDMCA3e9xQvGZTmOM';
const bot = new TelegramBot(TOKEN, { polling: true });
const ADMIN_ID = 7141072364;

const DATA_FILE = path.join(__dirname, 'data.json');
const userStates = {};

// Ma'lumotlar faylini tekshirish yoki yaratish
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ beton: [], gazon: [], bruschatka: [], remont: [] })
  );
}

app.use(express.static(__dirname));

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== ADMIN_ID) return;

  if (msg.photo || msg.video) {
    const fileId = msg.photo
      ? msg.photo[msg.photo.length - 1].file_id
      : msg.video.file_id;
    const fileType = msg.photo ? 'image' : 'video';

    userStates[chatId] = { fileId, fileType };

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📐 Бетон', callback_data: 'beton' },
            { text: '🌱 Газон', callback_data: 'gazon' },
          ],
          [
            { text: '🧱 Брусчатка', callback_data: 'bruschatka' },
            { text: '🏠 Ремонт кв.', callback_data: 'remont' },
          ],
        ],
      },
    };
    bot.sendMessage(chatId, 'Выберите раздел для загрузки:', opts);
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const category = callbackQuery.data;
  const state = userStates[chatId];

  if (!state) return;

  try {
    // Telegram'dan faylning to'g'ridan-to'g'ri linkini olish
    const fileLink = await bot.getFileLink(state.fileId);

    // data.json fayliga yozish
    const fileData = JSON.parse(fs.readFileSync(DATA_FILE));
    fileData[category].push({
      src: fileLink,
      type: state.fileType,
      date: Date.now(),
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2));
    bot.sendMessage(
      chatId,
      `✅ Успешно добавлено в раздел: ${category.toUpperCase()}. Файлы сохранены навсегда!`
    );
    delete userStates[chatId];
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка при сохранении ссылки.');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Galereya ma'lumotlarini beruvchi API
app.get('/api/gallery', (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    res.json(JSON.parse(fs.readFileSync(DATA_FILE)));
  } else {
    res.json({ beton: [], gazon: [], bruschatka: [], remont: [] });
  }
  const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

  // Izohlar fayli bo'lmasa, yaratamiz
  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(
      REVIEWS_FILE,
      JSON.stringify(
        [
          {
            name: 'Александр (г. Москва)',
            text: 'Заказывали ремонт квартиры под ключ у компании Навруз. Сделали всё идеально ровно и точно в срок. Рекомендую!',
            stars: 5,
          },
          {
            name: 'Михаил (Подмосковье)',
            text: 'Ребята делали бетонную отмостку и укладывали брусчатку на даче. Работают очень аккуратно, чувствуется огромный опыт.',
            stars: 5,
          },
        ],
        null,
        2
      )
    );
  }

  // Izohlarni saytga beradigan API
  app.get('/api/reviews', (req, res) => {
    res.json(JSON.parse(fs.readFileSync(REVIEWS_FILE)));
  });

  // Yangi izoh qo'shadigan API
  app.post('/api/reviews', express.json(), (req, res) => {
    const { name, text, stars } = req.body;
    if (!name || !text || !stars) {
      return res
        .status(400)
        .json({ success: false, message: 'Заполните все поля' });
    }

    const reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE));
    reviews.unshift({ name, text, stars: parseInt(stars) }); // Yangi izohni tepaga qo'shadi

    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`Сервер запущен`));
