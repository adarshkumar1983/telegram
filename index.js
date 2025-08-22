require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

const token = process.env.TELEGRAM_BOT_TOKEN;
const dbUrl = process.env.MONGODB_URI;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Connect to MongoDB
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// User schema
const userSchema = new mongoose.Schema({
    chatId: { type: Number, required: true, unique: true },
    isEnabled: { type: Boolean, default: true },
    frequency: { type: Number, default: 1 },
    lastSentAt: { type: Date, default: null }
});

const User = mongoose.model('User', userSchema);

// Function to send a random joke
const sendJoke = async (chatId) => {
    try {
        const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
        const joke = `${response.data.setup}\n${response.data.punchline}`;
        // Update lastSentAt immediately to make joke intervals more consistent
        await User.findOneAndUpdate({ chatId }, { lastSentAt: new Date() });
        bot.sendMessage(chatId, joke);
    } catch (error) {
        console.error('Error sending joke:', error);
    }
};

// Check every minute if a joke needs to be sent
setInterval(async () => {
    const users = await User.find({ isEnabled: true });
    users.forEach(user => {
        const now = new Date();
        const lastSent = user.lastSentAt || 0;
        const diffInMinutes = (now - lastSent) / (1000 * 60);
        if (diffInMinutes >= user.frequency) {
            sendJoke(user.chatId);
        }
    });
}, 60000);

// /start command
bot.onText( /\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        let user = await User.findOne({ chatId });
        if (!user) {
            user = new User({ chatId });
            await user.save();
            bot.sendMessage(chatId, 'Welcome! I will send you a random joke every minute. You can use /disable to stop receiving jokes.');
            sendJoke(chatId);
        } else {
            bot.sendMessage(chatId, 'You are already subscribed for jokes.');
        }
    } catch (error) {
        console.error('Error on /start:', error);
        bot.sendMessage(chatId, 'Something went wrong. Please try again later.');
    }
});

// /enable command
bot.onText( /\/enable/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await User.findOneAndUpdate({ chatId }, { isEnabled: true });
        bot.sendMessage(chatId, 'Joke delivery enabled.');
    } catch (error) {
        console.error('Error on /enable:', error);
        bot.sendMessage(chatId, 'Something went wrong. Please try again later.');
    }
});

// /disable command
bot.onText( /\/disable/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await User.findOneAndUpdate({ chatId }, { isEnabled: false });
        bot.sendMessage(chatId, 'Joke delivery disabled. You can re-enable it anytime by typing /enable.');
    } catch (error) {
        console.error('Error on /disable:', error);
        bot.sendMessage(chatId, 'Something went wrong. Please try again later.');
    }
});

// /setfrequency command
bot.onText( /\/setfrequency (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const frequency = parseInt(match[1]);
    if (isNaN(frequency) || frequency <= 0) {
        bot.sendMessage(chatId, 'Invalid frequency. Please provide a positive number of minutes.');
        return;
    }
    try {
        await User.findOneAndUpdate({ chatId }, { frequency });
        bot.sendMessage(chatId, `Joke frequency set to ${frequency} minutes.`);
    } catch (error) {
        console.error('Error on /setfrequency:', error);
        bot.sendMessage(chatId, 'Something went wrong. Please try again later.');
    }
});