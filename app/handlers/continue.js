import { generateCompletion } from '../../utils/index.js';
import { ALL_COMMANDS, COMMAND_BOT_CONTINUE } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
import { getPrompt, setPrompt } from '../prompt/index.js';
import replyMessage from '../../utils/reply-message.js';

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
    console.log('Entered exec function'); // 日誌
    updateHistory(context.id, (history) => history.erase());
    const prompt = getPrompt(context.userId);
    const { lastMessage } = prompt;
    if (lastMessage.isEnquiring) prompt.erase();

    try {
      let isFinishReasonStop = false;
      const messageLimit = 2000; // 每條訊息的最大字數限制
      const messages = [];

      while (!isFinishReasonStop) {
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

        // 分割訊息
        let remainingText = text;
        while (remainingText.length > 0) {
          const messageText = remainingText.slice(0, messageLimit);
          remainingText = remainingText.slice(messageLimit);
          messages.push({ type: 'text', text: messageText });
        }
      }

      // 自動發送所有訊息
      for (const message of messages) {
        await replyMessage({
          replyToken: context.event.replyToken,
          messages: [message],
        });
      }

      console.log('After sending all messages'); // 日誌

    } catch (err) {
      console.error('Error in exec function', err); // 錯誤日誌
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
