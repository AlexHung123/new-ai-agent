/**
 * Probe the configured OpenAI-compatible gateway the same way the app does.
 * Usage: node scripts/test-llm-request.mjs
 */
import { ChatOpenAI } from '@langchain/openai';
import { streamSimple } from '@earendil-works/pi-ai';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(
  readFileSync(resolve('data/config.json'), 'utf8'),
).base;

const modelId = config.modelId;
const apiKey = config.apiKey;
const baseUrl = String(config.baseURL).replace(/\/$/, '');
const chatTemplateKwargs = { enable_thinking: false };

function heading(title) {
  console.log(`\n======== ${title} ========`);
}

function applyLocalLlmPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const record = { ...payload };
  delete record.enable_thinking;
  const existing = record.chat_template_kwargs;
  const kwargs =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? existing
      : {};
  record.chat_template_kwargs = { ...kwargs, enable_thinking: false };
  return record;
}

function summarizePiResult(result) {
  if (!result) return result;
  return {
    stopReason: result.stopReason,
    errorMessage: result.errorMessage,
    content: result.content,
  };
}

function piModel() {
  return {
    id: modelId,
    name: modelId,
    api: 'openai-completions',
    provider: 'local-openai',
    baseUrl,
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 32768,
    maxTokens: 64,
    compat: {
      supportsStore: false,
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      supportsStrictMode: false,
      maxTokensField: 'max_tokens',
    },
  };
}

async function testLangchain() {
  heading('LangChain ChatOpenAI invoke (chat_template_kwargs.enable_thinking:false)');
  const llm = new ChatOpenAI({
    apiKey,
    temperature: 0.7,
    model: modelId,
    configuration: { baseURL: baseUrl },
    modelKwargs: { chat_template_kwargs: chatTemplateKwargs },
    maxTokens: 32,
  });
  try {
    const res = await llm.invoke('Say hi in one word.');
    console.log('OK content:', JSON.stringify(res.content));
  } catch (err) {
    console.log('FAIL', err?.status || '', err?.message || err);
    if (err?.error) console.log('error body:', JSON.stringify(err.error));
  }
}

async function testPiNoTools() {
  heading('pi-ai with local payload wrap, no tools');
  const result = await streamSimple(
    piModel(),
    {
      systemPrompt: 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: 'Say hi in one word.', timestamp: Date.now() },
      ],
    },
    { apiKey, maxTokens: 64, onPayload: applyLocalLlmPayload },
  ).result();
  console.log(JSON.stringify(summarizePiResult(result), null, 2));
}

async function testPiWithTools() {
  heading('pi-ai with local payload wrap, with fs_read tool');
  const result = await streamSimple(
    piModel(),
    {
      systemPrompt: 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: 'Say hi in one word.', timestamp: Date.now() },
      ],
      tools: [
        {
          name: 'fs_read',
          description: 'Read a file',
          parameters: {
            type: 'object',
            properties: { path: { type: 'string' } },
            required: ['path'],
          },
        },
      ],
    },
    { apiKey, maxTokens: 64, onPayload: applyLocalLlmPayload },
  ).result();
  console.log(JSON.stringify(summarizePiResult(result), null, 2));
}

heading(`target ${baseUrl} model=${modelId}`);
await testLangchain();
await testPiNoTools();
await testPiWithTools();
