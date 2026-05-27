const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Telegram Bot Token (Buni BotFather'dan olasiz)
const TOKEN = '8792427523:AAFyFsQAcX4W8iZN95BDMCA3e9xQvGZTmOM';
const bot = new TelegramBot(TOKEN, { polling: true });

// Tog'angizning Telegram ID raqami (Begonalar rasm joylay olmasligi uchun)
const ADMIN_ID = 7141072364;

// Vaqtincha foydalanuvchi holatini saqlash
const userStates = {};

// Bosh sahifaga kirganda index.html faylini yuborish

app.get('/', (req, res) => {
  const possiblePaths = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'Public', 'index.html'),
    path.join(__dirname, 'index.html'),
  ];

  const validPath = possiblePaths.find((p) => fs.existsSync(p));
  if (validPath) {
    res.sendFile(validPath);
  } else {
    res.send('Sayt fayllari topilmadi. Papka nomini tekshiring.');
  }
});

// Yuklangan fayllarni saqlash uchun papkalar yaratish
const categories = ['beton', 'gazon', 'bruschatka', 'remont'];
categories.forEach((cat) => {
  const dir = path.join(__dirname, 'public', 'uploads', cat);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Botga rasm yoki video kelsa
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (chatId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '🚫 Вы не являетесь администратором.');
  }

  if (msg.photo || msg.video) {
    const fileId = msg.photo
      ? msg.photo[msg.photo.length - 1].file_id
      : msg.video.file_id;
    const fileType = msg.photo ? 'image' : 'video';

    userStates[chatId] = { fileId, fileType };

    // Bo'limni tanlash uchun tugmalar
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

// Tugma bosilganda faylni yuklab olish va saqlash
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const category = callbackQuery.data;
  const state = userStates[chatId];

  if (!state) return;

  try {
    const fileLink = await bot.getFileLink(state.fileId);
    const ext = state.fileType === 'image' ? '.jpg' : '.mp4';
    const fileName = `${Date.now()}${ext}`;
    const filePath = path.join(
      __dirname,
      'public',
      'uploads',
      category,
      fileName
    );

    const response = await axios({ url: fileLink, responseType: 'stream' });
    response.data.pipe(fs.createWriteStream(filePath)).on('finish', () => {
      bot.sendMessage(
        chatId,
        `✅ Успешно загружено в раздел: ${category.toUpperCase()}`
      );
      delete userStates[chatId];
    });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка при загрузке файла.');
  }
});

// Saytga barcha rasmlarni JSON formatda beradigan API link
app.get('/api/gallery', (req, res) => {
  let result = {};
  categories.forEach((cat) => {
    const dir = path.join(__dirname, 'public', 'uploads', cat);
    result[cat] = fs.readdirSync(dir).map((file) => `/uploads/${cat}/${file}`);
  });
  res.json(result);
});

app.listen(PORT, () =>
  console.log(`Сервер запущен на http://localhost:${PORT}`)
);
