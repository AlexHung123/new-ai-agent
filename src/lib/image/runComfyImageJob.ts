import {
  COMFY_UNREACHABLE,
  cancelComfyJob,
  readComfyHistory,
  readComfyQueuePhase,
  submitComfyPrompt,
} from './comfyClient';
import {
  getComfyConfig,
  isComfyConfigured,
  resolveWorkflowFilePath,
} from './comfyConfig';
import { buildPromptWorkflow, loadComfyWorkflow } from './comfyWorkflow';
import {
  GENERATED_IMAGE_EVENT_TYPE,
  imageViewUrl,
  type GeneratedImageEvent,
} from './generatedImageEvent';
import { IMAGE_POLL_MS } from './imageJobProtocol';
import { patchImageJob, rememberImageJob } from './imageJobStore';

export { GENERATED_IMAGE_EVENT_TYPE };

export type RunComfyImageJobInput = {
  prompt: unknown;
  userId: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  emit?: (event: GeneratedImageEvent) => void;
};

export type RunComfyImageJobResult =
  | {
      ok: true;
      jobId: string;
      seed: number;
      prompt: string;
      imageUrl: string;
    }
  | { ok: false; error: string };

export async function sleepWithSignal(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) {
    throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function runComfyImageJob(
  input: RunComfyImageJobInput,
): Promise<RunComfyImageJobResult> {
  const emit = input.emit;
  const fetchImpl = input.fetchImpl ?? fetch;
  const sleep = input.sleep ?? sleepWithSignal;

  const config = getComfyConfig();
  if (!isComfyConfigured(config)) {
    const error =
      'ComfyUI is not configured. Set comfy.baseUrl in data/config.json.';
    emit?.({ status: 'failed', error });
    return { ok: false, error };
  }

  let template;
  try {
    template = loadComfyWorkflow(resolveWorkflowFilePath(config.workflowPath));
  } catch (error) {
    console.error('Failed to load ComfyUI workflow', error);
    const message = 'ComfyUI workflow template could not be loaded.';
    emit?.({ status: 'failed', error: message });
    return { ok: false, error: message };
  }

  const built = buildPromptWorkflow(template, input.prompt);
  if (!built.ok) {
    emit?.({ status: 'failed', error: built.error, prompt: undefined });
    return { ok: false, error: built.error };
  }

  emit?.({ status: 'queued', prompt: built.prompt, seed: built.seed });

  const submitted = await submitComfyPrompt({
    baseUrl: config.baseUrl,
    workflow: built.workflow,
    fetchImpl,
  });
  if (!submitted.ok) {
    const error = submitted.error || COMFY_UNREACHABLE;
    emit?.({ status: 'failed', error, prompt: built.prompt, seed: built.seed });
    return { ok: false, error };
  }

  rememberImageJob({
    jobId: submitted.promptId,
    userId: input.userId,
    prompt: built.prompt,
    status: 'queued',
  });
  emit?.({
    status: 'queued',
    prompt: built.prompt,
    jobId: submitted.promptId,
    seed: built.seed,
  });

  const startedAt = Date.now();
  try {
    while (true) {
      if (input.signal?.aborted) {
        throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
      }
      if (Date.now() - startedAt > config.timeoutMs) {
        const error = 'Image generation timed out.';
        patchImageJob(submitted.promptId, { status: 'failed', error });
        emit?.({
          status: 'failed',
          error,
          prompt: built.prompt,
          jobId: submitted.promptId,
          seed: built.seed,
        });
        return { ok: false, error };
      }

      const history = await readComfyHistory({
        baseUrl: config.baseUrl,
        promptId: submitted.promptId,
        fetchImpl,
      });
      if (!history.ok) {
        const error = history.error || COMFY_UNREACHABLE;
        patchImageJob(submitted.promptId, { status: 'failed', error });
        emit?.({
          status: 'failed',
          error,
          prompt: built.prompt,
          jobId: submitted.promptId,
          seed: built.seed,
        });
        return { ok: false, error };
      }

      if (history.result.state === 'succeeded') {
        patchImageJob(submitted.promptId, {
          status: 'succeeded',
          images: history.result.images,
          error: null,
        });
        const imageUrl = imageViewUrl(submitted.promptId);
        emit?.({
          status: 'succeeded',
          prompt: built.prompt,
          jobId: submitted.promptId,
          imageUrl,
          seed: built.seed,
          error: null,
        });
        return {
          ok: true,
          jobId: submitted.promptId,
          seed: built.seed,
          prompt: built.prompt,
          imageUrl,
        };
      }

      if (history.result.state === 'failed') {
        patchImageJob(submitted.promptId, {
          status: 'failed',
          error: history.result.error,
        });
        emit?.({
          status: 'failed',
          error: history.result.error,
          prompt: built.prompt,
          jobId: submitted.promptId,
          seed: built.seed,
        });
        return { ok: false, error: history.result.error };
      }

      const status = await readComfyQueuePhase({
        baseUrl: config.baseUrl,
        promptId: submitted.promptId,
        fetchImpl,
      });
      patchImageJob(submitted.promptId, { status });
      emit?.({
        status,
        prompt: built.prompt,
        jobId: submitted.promptId,
        seed: built.seed,
      });
      await sleep(IMAGE_POLL_MS, input.signal);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      await cancelComfyJob({
        baseUrl: config.baseUrl,
        promptId: submitted.promptId,
        fetchImpl,
      });
      patchImageJob(submitted.promptId, {
        status: 'cancelled',
        error: 'Cancelled',
      });
      emit?.({
        status: 'cancelled',
        error: 'Cancelled',
        prompt: built.prompt,
        jobId: submitted.promptId,
        seed: built.seed,
      });
      return { ok: false, error: 'Cancelled' };
    }
    const message =
      error instanceof Error && error.message
        ? error.message
        : COMFY_UNREACHABLE;
    emit?.({
      status: 'failed',
      error: message,
      prompt: built.prompt,
      jobId: submitted.promptId,
      seed: built.seed,
    });
    return { ok: false, error: message };
  }
}
