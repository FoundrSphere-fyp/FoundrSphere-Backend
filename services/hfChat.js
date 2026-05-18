const OpenAI = require("openai");

const DEFAULT_BASE_URL =
  "https://kjf8fc4i1o5jb4of.eu-west-1.aws.endpoints.huggingface.cloud/v1/";
const DEFAULT_MODEL = "PsychoTheCoder/foundrsphere-clean-model";
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_HISTORY_LIMIT = 20;

/** Llama 3.x Instruct chat template tokens */
const LLAMA = {
  begin: "<|" + "begin_of_text" + "|>",
  startHeader: "<|" + "start_header_id" + "|>",
  endHeader: "<|" + "end_header_id" + "|>",
  eot: "<|" + "eot_id" + "|>",
};

const DEFAULT_SYSTEM_PROMPT = `You are a startup expert. Analyze the startup and provide comprehensive feedback in this exact format:

RECOMMENDED BUSINESS MODEL:
<write here, describe clearly>

STRENGTHS:
- List 4 to 5 specific strengths based on the startup idea, user skills, and business type

GAPS & WEAKNESSES:
- List 4 to 5 specific gaps or weaknesses, including risks and limitations

RECOMMENDATIONS:
- Provide 5 actionable recommendations

Output must follow this structure exactly.`;

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

function getSystemPrompt() {
  return (process.env.HF_CHAT_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT).trim();
}

function roleHeader(role) {
  return `${LLAMA.startHeader}${role}${LLAMA.endHeader}\n\n`;
}

/**
 * Build a single user message in Llama 3 chat format (system + history + assistant header).
 * @param {Array<{ role: string, content: string }>} conversationMessages
 */
function buildLlamaChatMessage(conversationMessages) {
  const limit = Math.max(
    2,
    parseInt(process.env.HF_CHAT_HISTORY_LIMIT || String(DEFAULT_HISTORY_LIMIT), 10) ||
      DEFAULT_HISTORY_LIMIT
  );

  const history = conversationMessages
    .filter((m) => m.role && m.content)
    .slice(-limit)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content).trim(),
    }));

  let content = `${LLAMA.begin}\n${roleHeader("system")}${getSystemPrompt()}${LLAMA.eot}`;

  for (const msg of history) {
    content += `${roleHeader(msg.role)}${msg.content}${LLAMA.eot}`;
  }

  // Model completes after this header
  content += roleHeader("assistant");

  return {
    role: "user",
    content,
  };
}

/** Strip Llama special tokens if the model echoes them in the reply */
function cleanAssistantReply(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text.trim();

  const patterns = [
    LLAMA.begin,
    LLAMA.eot,
    roleHeader("assistant"),
    roleHeader("user"),
    roleHeader("system"),
  ];

  for (const token of patterns) {
    cleaned = cleaned.split(token).join("");
  }

  return cleaned.trim();
}

/**
 * @param {Array<{ role: string, content: string }>} conversationMessages
 * @returns {Promise<string>}
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
  return cleanAssistantReply(raw);
}

module.exports = {
  generateChatReply,
  buildLlamaChatMessage,
  cleanAssistantReply,
  LLAMA,
};
