/**
 * Probe the configured OpenAI-compatible gateway the same way the app does.
 * Usage: node scripts/test-llm-request.mjs
 */
import { ChatOpenAI } from '@langchain/openai';
import { completeSimple } from '@earendil-works/pi-ai';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(
  readFileSync(resolve('data/config.json'), 'utf8'),
).base;

const modelId = config.modelId;
const apiKey = config.apiKey;
const baseUrl = String(config.baseURL).replace(/\/$/, '');

function heading(title) {
  console.log(`\n======== ${title} ========`);
}

async function testLangchain() {
  heading('LangChain ChatOpenAI invoke (enable_thinking:false)');
  const llm = new ChatOpenAI({
    apiKey,
    temperature: 0.7,
    model: modelId,
    configuration: { baseURL: baseUrl },
    modelKwargs: { enable_thinking: false },
    maxTokens: 32,
  });
  try {
    const res = await llm.invoke('Say hi in one word.');
    console.log('OK content:', JSON.stringify(res.content));
    console.log('additional_kwargs:', JSON.stringify(res.additional_kwargs));
  } catch (err) {
    console.log('FAIL', err?.status || '', err?.message || err);
    if (err?.error) console.log('error body:', JSON.stringify(err.error));
  }
}

async function testLangchainChatTemplate() {
  heading('LangChain ChatOpenAI invoke (chat_template_kwargs.enable_thinking:false)');
  const llm = new ChatOpenAI({
    apiKey,
    temperature: 0.7,
    model: modelId,
    configuration: { baseURL: baseUrl },
    modelKwargs: { chat_template_kwargs: { enable_thinking: false } },
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

function summarizePiResult(result) {
  if (!result) return result;
  return {
    stopReason: result.stopReason,
    errorMessage: result.errorMessage,
    content: result.content,
  };
}

function piModel(extraCompat = {}) {
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
      ...extraCompat,
    },
  };
}

async function testPiNoTools() {
  heading('pi-ai completeSimple, no tools (app piModel compat)');
  const result = await completeSimple(
    piModel(),
    {
      systemPrompt: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Say hi in one word.', timestamp: Date.now() }],
    },
    { apiKey, maxTokens: 64 },
  );
  console.log(JSON.stringify(summarizePiResult(result), null, 2));
}

async function testPiWithTools() {
  heading('pi-ai completeSimple, with fs_read tool (document/writing agent)');
  const result = await completeSimple(
    piModel(),
    {
      systemPrompt: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Say hi in one word.', timestamp: Date.now() }],
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
    { apiKey, maxTokens: 64 },
  );
  console.log(JSON.stringify(summarizePiResult(result), null, 2));
}

async function testPiThinkingOff() {
  heading('pi-ai completeSimple, chat_template_kwargs.enable_thinking=false via onPayload');
  const result = await completeSimple(
    piModel(),
    {
      systemPrompt: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Say hi in one word.', timestamp: Date.now() }],
    },
    {
      apiKey,
      maxTokens: 64,
      onPayload: (params) => ({
        ...params,
        chat_template_kwargs: { enable_thinking: false },
      }),
    },
  );
  console.log(JSON.stringify(summarizePiResult(result), null, 2));
}

heading(`target ${baseUrl} model=${modelId}`);
await testLangchain();
await testLangchainChatTemplate();
await testPiNoTools();
await testPiWithTools();
await testPiThinkingOff();
