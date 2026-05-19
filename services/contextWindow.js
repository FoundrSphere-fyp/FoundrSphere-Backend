const { buildLlamaChatMessage } = require("./llamaPrompt");

const DEFAULT_MAX_CONTEXT = 131072; // Llama 3.2 128K class models

function getMaxContextTokens() {
  const parsed = parseInt(process.env.HF_CONTEXT_WINDOW || String(DEFAULT_MAX_CONTEXT), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_CONTEXT;
}

function getReservedOutputTokens() {
  const parsed = parseInt(process.env.HF_CHAT_MAX_TOKENS || "1024", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1024;
}

/** Rough token estimate when the API does not return usage */
function estimateTokenCount(text) {
  if (!text) return 0;
  const str = String(text);
  const specialMatches = str.match(/<\|[^|]+\|>/g) || [];
  return Math.ceil(str.length / 3.8) + specialMatches.length;
}

function formatTokensForDisplay(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

/**
 * @param {{ promptText?: string, usage?: object, messageCount?: number, historyLimit?: number }} params
 */
function buildContextWindowStats(params = {}) {
  const maxTokens = getMaxContextTokens();
  const reservedForOutput = getReservedOutputTokens();

  const promptTokens =
    params.usage?.prompt_tokens ?? estimateTokenCount(params.promptText || "");
  const completionTokens = params.usage?.completion_tokens ?? 0;
  const totalTokens =
    params.usage?.total_tokens ?? promptTokens + completionTokens;

  const contextUsed = promptTokens + reservedForOutput;
  const remainingTokens = Math.max(0, maxTokens - contextUsed);
  const usedPercent = Math.min(100, (contextUsed / maxTokens) * 100);

  return {
    maxTokens,
    promptTokens,
    completionTokens,
    totalTokens,
    reservedForOutput,
    contextUsed,
    remainingTokens,
    usedPercent: Math.round(usedPercent * 10) / 10,
    messageCount: params.messageCount ?? 0,
    historyLimit:
      parseInt(process.env.HF_CHAT_HISTORY_LIMIT || "20", 10) || 20,
    isEstimated: !params.usage?.prompt_tokens,
    display: {
      used: formatTokensForDisplay(contextUsed),
      max: formatTokensForDisplay(maxTokens),
      prompt: formatTokensForDisplay(promptTokens),
    },
  };
}

function computeContextForMessages(messages) {
  const llamaMessage = buildLlamaChatMessage(messages || []);
  return buildContextWindowStats({
    promptText: llamaMessage.content,
    messageCount: (messages || []).length,
  });
}

module.exports = {
  getMaxContextTokens,
  getReservedOutputTokens,
  estimateTokenCount,
  buildContextWindowStats,
  computeContextForMessages,
  formatTokensForDisplay,
};
