import config from '../config/index.js';
import { reply } from '../services/line.js';

const replyMessage = async ({
  replyToken,
  messages,
}) => {
  console.log('Inside replyMessage', { replyToken, messages }); // 日誌
  if (config.APP_ENV !== 'production') return { replyToken, messages };
  return await reply({ replyToken, messages });
};

export default replyMessage;
