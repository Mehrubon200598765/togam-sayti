const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Token va Admin ID (Siz bergan ma'lumotlar joylashtirildi)
const TOKEN = '8792427523:AAFyFsQAcX4W8iZN95BDMCA3e9xQvGZTmOM';
const bot = new TelegramBot(TOKEN, { polling: true });
const ADMIN_ID = 7141072364;

const userStates = {};

// Statik fayllarni (index.html, style.css, script.js) loyiha asosiy qismidan ulash
app.use(express.static(__dirname));

// Yuklangan fayllarni saqlash papkalari
const categories = ['beton', 'gazon', 'bruschatka', 'remont'];
categories.forEach((cat) => {
  const dir = path.join(__dirname, 'uploads', cat);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Telegram Bot xabarlari
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
    const fileLink = await bot.getFileLink(state.fileId);
    const ext = state.fileType === 'image' ? '.jpg' : '.mp4';
    const fileName = `${Date.now()}${ext}`;
    const filePath = path.join(__dirname, 'uploads', category, fileName);

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

// Asosiy sahifani ochish
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Galereya API linki
app.get('/api/gallery', (req, res) => {
  let result = {};
  categories.forEach((cat) => {
    const dir = path.join(__dirname, 'uploads', cat);
    if (fs.existsSync(dir)) {
      result[cat] = fs
        .readdirSync(dir)
        .map((file) => `/uploads/${cat}/${file}`);
    } else {
      result[cat] = [];
    }
  });
  res.json(result);
});

app.listen(PORT, () => console.log(`Сервер запущен`));
