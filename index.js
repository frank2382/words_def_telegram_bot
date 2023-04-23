require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { response } = require('express');

const { TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
// const WEBHOOK_URL = SERVER_URL + URI;
const WEBHOOK_URL = URI;
const WORD_DEF_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

const PORT = process.env.PORT || 80;

const app = express();
app.use(bodyParser.json());

// this function is to get words definition from the internet
async function getWordDefinition(word) {
    let messageToDisplay = `${word.toUpperCase()}---> `;

    try {
        wordDef = await axios.get(WORD_DEF_URL + word);

        const data = wordDef.data[0].meanings;

        data.forEach((currentElement, index, array) => {
            const title = `${currentElement.partOfSpeech}: [definition: ${currentElement.definitions[0].definition}, synonyms: ${currentElement.definitions[0].synonyms}, antonyms: ${currentElement.definitions[0].antonyms}]`;

            messageToDisplay = messageToDisplay + title;
        });
    } catch (error) {
        messageToDisplay = messageToDisplay + 'Unable to find this word, please verify your word again';
    }

    return messageToDisplay;
}

// this function is use to send our webhook to telegram, so telegram will send us updates when new messages are sent to our bot
const init = async () => {
    const response = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(response.data);
};

// this method is use to listen to messages sent by any user to our bot
app.post(URI, async (request, response) => {
    const chatId = request.body.message.chat.id;
    const messageSent = request.body.message.text;
    console.log(messageSent);

    const messageToSendToUser = await getWordDefinition(messageSent);

    axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: messageToSendToUser
    });

    return response.send();
});

app.listen(PORT, async () => {
    console.log(`ttuf words definition bot running on port ${PORT}`);
    await init();
});