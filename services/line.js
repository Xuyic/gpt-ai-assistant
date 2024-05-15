import axios from 'axios';
import config from '../config/index.js';
import { handleFulfilled, handleRejected, handleRequest } from './utils/index.js';

export const EVENT_TYPE_MESSAGE = 'message';
export const EVENT_TYPE_POSTBACK = 'postback';

export const SOURCE_TYPE_USER = 'user';
export const SOURCE_TYPE_GROUP = 'group';

export const MESSAGE_TYPE_TEXT = 'text';
export const MESSAGE_TYPE_STICKER = 'sticker';
export const MESSAGE_TYPE_AUDIO = 'audio';
export const MESSAGE_TYPE_IMAGE = 'image';
export const MESSAGE_TYPE_TEMPLATE = 'template';

export const TEMPLATE_TYPE_BUTTONS = 'buttons';

export const ACTION_TYPE_MESSAGE = 'message';
export const ACTION_TYPE_POSTBACK = 'postback';

export const QUICK_REPLY_TYPE_ACTION = 'action';

const client = axios.create({
  baseURL: 'https://api.line.me',
  timeout: config.LINE_TIMEOUT,
  headers: {
    'Accept-Encoding': 'gzip, deflate, compress',
  },
});

client.interceptors.request.use((c) => {
  c.headers.Authorization = `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`;
  return handleRequest(c);
});

client.interceptors.response.use(handleFulfilled, (err) => {
  if (err.response?.data?.message) {
    err.message = err.response.data.message;
  }
  return handleRejected(err);
});

const reply = async ({ replyToken, messages }) => {
  console.log('Sending reply via LINE API', { replyToken, messages }); // 日志
  try {
    await client.post('/v2/bot/message/reply', {
      replyToken,
      messages,
    });
    console.log('Reply sent successfully'); // 日志
  } catch (error) {
    console.error('Error sending reply:', error.response ? error.response.data : error.message);
  }
};

const fetchGroupSummary = ({ groupId }) => client.get(`/v2/bot/group/${groupId}/summary`);

const fetchProfile = ({ userId }) => client.get(`/v2/bot/profile/${userId}`);

const dataClient = axios.create({
  baseURL: 'https://api-data.line.me',
  timeout: config.LINE_TIMEOUT,
  headers: {
    'Accept-Encoding': 'gzip, deflate, compress',
  },
});

dataClient.interceptors.request.use((c) => {
  c.headers.Authorization = `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`;
  return handleRequest(c);
});

dataClient.interceptors.response.use(handleFulfilled, (err) => {
  if (err.response?.data?.message) {
    err.message = err.response.data.message;
  }
  return handleRejected(err);
});

const fetchContent = ({ messageId }) => dataClient.get(`/v2/bot/message/${messageId}/content`, {
  responseType: 'arraybuffer',
});

export {
  reply,
  fetchGroupSummary,
  fetchProfile,
  fetchContent,
};
