import config from '../config/index.js';
import { reply } from '../services/line.js';

const replyMessage = async ({ replyToken, messages }) => {
  console.log('Inside replyMessage', { replyToken, messages }); // 日志
  if (config.APP_ENV !== 'production') return { replyToken, messages };
  try {
    await reply({ replyToken, messages });
    console.log('Message sent successfully'); // 日志
  } catch (error) {
    console.error('Error in replyMessage:', error.response ? error.response.data : error.message);
  }
};

export default replyMessage;
