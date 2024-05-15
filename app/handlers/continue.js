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
      const { text, isFinishReasonStop } = await generateCompletion({ prompt });
      prompt.patch(text);
      if (lastMessage.isEnquiring && !isFinishReasonStop) prompt.write('', lastMessage.content);
      setPrompt(context.userId, prompt);
      if (!lastMessage.isEnquiring) updateHistory(context.id, (history) => history.patch(text));
      const defaultActions = ALL_COMMANDS.filter(({ type }) => type === lastMessage.content);
      const actions = isFinishReasonStop ? defaultActions : [COMMAND_BOT_CONTINUE];
      context.pushText(text, actions);

      console.log('Before calling replyMessage', {
        replyToken: context.event.replyToken,
        messages: context.messages.map(message => ({
          type: 'text',
          text: message.text,
        })),
      }); // 日誌

      // 自動發送回應
      await replyMessage({
        replyToken: context.event.replyToken,
        messages: context.messages.map(message => ({
          type: 'text',
          text: message.text,
        })),
      });

      console.log('After calling replyMessage'); // 日誌
      
    } catch (err) {
      console.error('Error in exec function', err); // 錯誤日誌
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
