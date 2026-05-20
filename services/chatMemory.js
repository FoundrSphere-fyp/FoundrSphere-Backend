const { embedText } = require("./azureEmbed");
const { getUserNamespace, isPineconeConfigured } = require("./pineconeClient");

const DEFAULT_TOP_K = 5;
const METADATA_TEXT_LIMIT = 2000;

function getTopK() {
  const parsed = parseInt(process.env.PINECONE_MEMORY_TOP_K || String(DEFAULT_TOP_K), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TOP_K;
}

function isMemoryEnabled() {
  if (String(process.env.PINECONE_MEMORY_ENABLED || "true").trim().toLowerCase() === "false") {
    return false;
  }
  return isPineconeConfigured();
}

function vectorId(conversationId, messageIndex, role) {
  return `${conversationId}_${messageIndex}_${role}`;
}

/**
 * @param {Array<{ score?: number, metadata?: object }>} matches
 * @returns {string}
 */
function formatMemoryForPrompt(matches) {
  if (!matches?.length) return "";

  const lines = matches
    .filter((m) => m.metadata?.content)
    .map((m) => {
      const role = m.metadata.role === "assistant" ? "assistant" : "user";
      const title = m.metadata.conversationTitle || "Past chat";
      const sameChat = m.metadata.scopeLabel || title;
      const snippet = String(m.metadata.content).trim().slice(0, 400);
      return `- [${sameChat}] (${role}): ${snippet}`;
    });

  if (!lines.length) return "";

  return `RELEVANT MEMORY FROM YOUR PAST CHATS:\n${lines.join("\n")}`;
}

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.conversationId
 * @param {string} params.queryText
 * @param {'conversation'|'all'} params.memoryScope
 */
async function queryRelevantMemory({ userId, conversationId, queryText, memoryScope = "conversation" }) {
  if (!isMemoryEnabled()) {
    return { memoryContext: "", hits: 0, matches: [] };
  }

  const embedding = await embedText(queryText);
  if (!embedding?.length) {
    return { memoryContext: "", hits: 0, matches: [] };
  }

  const ns = getUserNamespace(userId);
  if (!ns) {
    return { memoryContext: "", hits: 0, matches: [] };
  }

  const filter =
    memoryScope === "all"
      ? undefined
      : { conversationId: { $eq: String(conversationId) } };

  try {
    const result = await ns.query({
      vector: embedding,
      topK: getTopK(),
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    });

    const matches = (result.matches || []).filter((m) => (m.score ?? 0) > 0.35);
    const memoryContext = formatMemoryForPrompt(matches);

    return {
      memoryContext,
      hits: matches.length,
      matches,
    };
  } catch (err) {
    console.error("[chatMemory] Pinecone query failed:", err?.message || err);
    return { memoryContext: "", hits: 0, matches: [] };
  }
}

/**
 * @param {object} params
 */
async function storeMessageMemory({
  userId,
  conversationId,
  conversationTitle,
  messageIndex,
  role,
  content,
}) {
  if (!isMemoryEnabled()) return false;

  const text = String(content || "").trim();
  if (!text) return false;

  const embedding = await embedText(text);
  if (!embedding?.length) return false;

  const ns = getUserNamespace(userId);
  if (!ns) return false;

  const id = vectorId(conversationId, messageIndex, role);

  try {
    await ns.upsert({
      records: [
        {
          id,
          values: embedding,
          metadata: {
            userId: String(userId),
            conversationId: String(conversationId),
            conversationTitle: String(conversationTitle || "Chat").slice(0, 120),
            messageIndex,
            role,
            content: text.slice(0, METADATA_TEXT_LIMIT),
            createdAt: new Date().toISOString(),
          },
        },
      ],
    });
    return true;
  } catch (err) {
    console.error("[chatMemory] Pinecone upsert failed:", err?.message || err);
    return false;
  }
}

async function deleteConversationMemory(userId, conversationId) {
  if (!isMemoryEnabled()) return;

  const ns = getUserNamespace(userId);
  if (!ns) return;

  try {
    await ns.deleteMany({
      filter: { conversationId: { $eq: String(conversationId) } },
    });
  } catch (err) {
    console.error("[chatMemory] Pinecone delete failed:", err?.message || err);
  }
}

module.exports = {
  isMemoryEnabled,
  queryRelevantMemory,
  storeMessageMemory,
  deleteConversationMemory,
  formatMemoryForPrompt,
};
