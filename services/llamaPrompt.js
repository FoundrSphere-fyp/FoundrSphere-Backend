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

module.exports = {
  LLAMA,
  buildLlamaChatMessage,
  cleanAssistantReply,
  roleHeader,
};
