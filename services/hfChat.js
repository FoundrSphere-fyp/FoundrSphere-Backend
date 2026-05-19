const OpenAI = require("openai");
const { buildContextWindowStats } = require("./contextWindow");
const { buildLlamaChatMessage, cleanAssistantReply, LLAMA } = require("./llamaPrompt");

const DEFAULT_BASE_URL =
  "https://kjf8fc4i1o5jb4of.eu-west-1.aws.endpoints.huggingface.cloud/v1/";
const DEFAULT_MODEL = "PsychoTheCoder/foundrsphere-clean-model";
const DEFAULT_MAX_TOKENS = 1024;

let client = null;

function getHfChatClient() {
  if (client) return client;

  const baseURL = (process.env.HF_CHAT_BASE_URL || DEFAULT_BASE_URL).trim();
  const apiKey = (process.env.HF_TOKEN || "").trim();

  if (!apiKey) {
    throw new Error("HF_TOKEN is not configured.");
  }

  client = new OpenAI({ baseURL, apiKey });
  return client;
}

/**
 * @param {Array<{ role: string, content: string }>} conversationMessages
 * @returns {Promise<{ reply: string, contextWindow: object }>}
 */
async function generateChatReply(conversationMessages) {
  const openai = getHfChatClient();
  const model = (process.env.HF_CHAT_MODEL || DEFAULT_MODEL).trim();
  const max_tokens =
    parseInt(process.env.HF_CHAT_MAX_TOKENS || String(DEFAULT_MAX_TOKENS), 10) ||
    DEFAULT_MAX_TOKENS;

  const llamaMessage = buildLlamaChatMessage(conversationMessages);

  const completion = await openai.chat.completions.create({
    model,
    messages: [llamaMessage],
    stream: false,
    max_tokens,
    stop: [LLAMA.eot, "<|" + "end_of_text" + "|>"],
  });

  const raw = completion.choices[0]?.message?.content;
  const reply = cleanAssistantReply(raw);

  const contextWindow = buildContextWindowStats({
    promptText: llamaMessage.content,
    usage: completion.usage,
    messageCount: conversationMessages.length,
  });

  return { reply, contextWindow };
}

module.exports = {
  generateChatReply,
  buildLlamaChatMessage,
  cleanAssistantReply,
  LLAMA,
};
