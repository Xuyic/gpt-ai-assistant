import { generateCompletion } from '../../utils/index.js';
import { ALL_COMMANDS, COMMAND_BOT_CONTINUE } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
import { getPrompt, setPrompt } from '../prompt/index.js';
import replyMessage from '../../utils/reply-message.js';

const messageLimit = 2000; // 每条消息的最大字数限制

/**
 * 分割长文本为多条消息
 * @param {string} text 
 * @returns {Array}
 */
const splitText = (text) => {
  const messages = [];
  let remainingText = text;
  while (remainingText.length > 0) {
    const messageText = remainingText.slice(0, messageLimit);
    remainingText = remainingText.slice(messageLimit);
    messages.push({ type: 'text', text: messageText });
  }
  return messages;
};

/**
 * 递归发送所有消息
 * @param {Array} messages 
 * @param {string} replyToken 
 * @param {Function} callback 
 */
const sendMessages = async (messages, replyToken, callback) => {
  if (messages.length === 0) {
    if (callback) callback();
    return;
  }
  try {
    const message = messages.shift();
    console.log('Sending message:', message); // 日志
    await replyMessage({
      replyToken,
      messages: [message],
    });
    // 延迟一段时间以避免速率限制
    setTimeout(() => sendMessages(messages, replyToken, callback), 1000);
  } catch (err) {
    console.error('Error sending message:', err);
    if (callback) callback(err);
  }
};

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_CONTINUE);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    console.log('Entered exec function'); // 日志
    updateHistory(context.id, (history) => history.erase());
    const prompt = getPrompt(context.userId);
    const { lastMessage } = prompt;
    if (lastMessage.isEnquiring) prompt.erase();

    let isFinishReasonStop = false;
    const allMessages = [];

    while (!isFinishReasonStop) {
      try {
        const { text, isFinishReasonStop: stop } = await generateCompletion({ prompt });
        isFinishReasonStop = stop;
        prompt.patch(text);
        if (lastMessage.isEnquiring && !isFinishReasonStop) {
          prompt.write('', lastMessage.content);
        }
        setPrompt(context.userId, prompt);
        if (!lastMessage.isEnquiring) {
          updateHistory(context.id, (history) => history.patch(text));
        }
        allMessages.push(...splitText(text));
      } catch (err) {
        console.error('Error in exec function:', err); // 错误日志
        context.pushError(err);
        break;
      }
    }

    console.log('All messages prepared for sending:', allMessages); // 日志

    // 发送所有消息
    sendMessages(allMessages, context.event.replyToken, () => {
      console.log('All messages sent successfully'); // 日志
    });

    return context;
  }
)();

export default exec;
