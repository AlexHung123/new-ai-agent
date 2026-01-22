import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import eventEmitter from 'events';
import configManager from '../config';
import { MetaSearchAgentType } from './metaSearchAgent';

class AgentImage implements MetaSearchAgentType {
  private async isReachable(
    baseURL: string,
    signal?: AbortSignal,
  ): Promise<boolean> {
    try {
      const res = await fetch(`${baseURL}/object_info`, {
        method: 'GET',
        signal,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private getCandidateBaseURLs(): string[] {
    const configured =
      configManager.getConfig('comfyui.baseURL', '') ||
      configManager.getConfig('comfyui.baseUrl', '');
    const candidates = [configured].filter((x) => !!x);
    return Array.from(new Set(candidates));
  }

  private async resolveBaseURL(signal?: AbortSignal): Promise<string> {
    const candidates = this.getCandidateBaseURLs();
    for (const base of candidates) {
      const ok = await this.isReachable(base, signal);
      if (ok) return base;
    }
    throw new Error(
      `ComfyUI server not reachable at any of: ${candidates.join(', ')}`,
    );
  }

  private buildWorkflow(prompt: string, width: number, height: number): any {
    const workflow: any = {
      '9': {
        inputs: {
          filename_prefix: 'z-image',
          images: ['57:8', 0],
        },
        class_type: 'SaveImage',
        _meta: {
          title: 'Save Image',
        },
      },
      '58': {
        inputs: {
          value: '',
        },
        class_type: 'PrimitiveStringMultiline',
        _meta: {
          title: 'Prompt',
        },
      },
      '61': {
        inputs: {
          string_a: 'Pixel art style,',
          string_b: ['58', 0],
          delimiter: '',
        },
        class_type: 'StringConcatenate',
        _meta: {
          title: 'Concatenate',
        },
      },
      '57:30': {
        inputs: {
          clip_name: 'qwen_3_4b.safetensors',
          type: 'lumina2',
          device: 'default',
        },
        class_type: 'CLIPLoader',
        _meta: {
          title: 'Load CLIP',
        },
      },
      '57:29': {
        inputs: {
          vae_name: 'ae.safetensors',
        },
        class_type: 'VAELoader',
        _meta: {
          title: 'Load VAE',
        },
      },
      '57:33': {
        inputs: {
          conditioning: ['57:27', 0],
        },
        class_type: 'ConditioningZeroOut',
        _meta: {
          title: 'ConditioningZeroOut',
        },
      },
      '57:8': {
        inputs: {
          samples: ['57:3', 0],
          vae: ['57:29', 0],
        },
        class_type: 'VAEDecode',
        _meta: {
          title: 'VAE Decode',
        },
      },
      '57:28': {
        inputs: {
          unet_name: 'z_image_turbo_bf16.safetensors',
          weight_dtype: 'default',
        },
        class_type: 'UNETLoader',
        _meta: {
          title: 'Load Diffusion Model',
        },
      },
      '57:27': {
        inputs: {
          text: ['58', 0],
          clip: ['57:30', 0],
        },
        class_type: 'CLIPTextEncode',
        _meta: {
          title: 'CLIP Text Encode (Prompt)',
        },
      },
      '57:13': {
        inputs: {
          width: width,
          height: height,
          batch_size: 1,
        },
        class_type: 'EmptySD3LatentImage',
        _meta: {
          title: 'EmptySD3LatentImage',
        },
      },
      '57:3': {
        inputs: {
          seed: 0,
          steps: 4,
          cfg: 1,
          sampler_name: 'res_multistep',
          scheduler: 'simple',
          denoise: 1,
          model: ['57:11', 0],
          positive: ['57:27', 0],
          negative: ['57:33', 0],
          latent_image: ['57:13', 0],
        },
        class_type: 'KSampler',
        _meta: {
          title: 'KSampler',
        },
      },
      '57:11': {
        inputs: {
          shift: 3,
          model: ['57:28', 0],
        },
        class_type: 'ModelSamplingAuraFlow',
        _meta: {
          title: 'ModelSamplingAuraFlow',
        },
      },
    };

    workflow['58'].inputs.value = prompt;
    return workflow;
  }

  private getDimsFromAspect(aspect: string): { width: number; height: number } {
    console.log(`Invalid aspect ratio: ${aspect}`);
    if (aspect === '16:9') return { width: 1024, height: 576 };
    if (aspect === '9:16') return { width: 576, height: 1024 };
    if (aspect === '4:3') return { width: 1024, height: 768 };
    if (aspect === '3:2') return { width: 960, height: 640 };
    if (aspect === '1:1') return { width: 1024, height: 1024 };
    if (aspect === '594:295') return { width: 594, height: 295 };
    if (aspect === '295:295') return { width: 295, height: 295 };
    if (aspect === '952:320') return { width: 952, height: 320 };
    return { width: 1024, height: 1024 };
  }

  private async submitWorkflow(
    baseURL: string,
    workflow: any,
    signal?: AbortSignal,
  ): Promise<string> {
    const reachable = await this.isReachable(baseURL, signal);
    if (!reachable) {
      throw new Error(`ComfyUI server not reachable at ${baseURL}`);
    }
    const res = await fetch(`${baseURL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: 'new-ai-agent' }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`ComfyUI prompt submission failed: ${res.status}`);
    }
    const data = await res.json();
    const promptId = data.prompt_id || data.promptId || data.id;
    if (!promptId) {
      throw new Error('ComfyUI response missing prompt_id');
    }
    return promptId;
  }

  private async pollHistoryForImages(
    baseURL: string,
    promptId: string,
    signal?: AbortSignal,
  ): Promise<{ filename: string; subfolder?: string; type?: string }[]> {
    const maxAttempts = 60;
    const delayMs = 1000;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < maxAttempts; i++) {
      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      const res = await fetch(`${baseURL}/history/${promptId}`, {
        method: 'GET',
        signal,
      });
      if (res.ok) {
        const hist = await res.json();

        const collect = (
          obj: any,
        ): { filename: string; subfolder?: string; type?: string }[] => {
          if (!obj) return [];
          const images: {
            filename: string;
            subfolder?: string;
            type?: string;
          }[] = [];

          const outputs = obj.output || obj.outputs || obj;
          const nodes = typeof outputs === 'object' ? outputs : {};
          const visit = (value: any) => {
            if (!value) return;
            if (Array.isArray(value)) {
              value.forEach(visit);
            } else if (typeof value === 'object') {
              if (Array.isArray(value.images)) {
                value.images.forEach((img: any) => {
                  if (img && img.filename) {
                    images.push({
                      filename: img.filename,
                      subfolder: img.subfolder || '',
                      type: img.type || 'output',
                    });
                  }
                });
              }
              Object.values(value).forEach(visit);
            }
          };
          Object.values(nodes).forEach(visit);
          return images;
        };

        const imgs = collect(hist);
        if (imgs.length > 0) {
          return imgs;
        }
      }

      await sleep(delayMs);
    }
    throw new Error('Timed out waiting for generated images');
  }

  private buildImageHTML(
    baseURL: string,
    images: { filename: string; subfolder?: string; type?: string }[],
    prompt: string,
  ): string {
    const items = images.map((img) => {
      const url = `${baseURL}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`;
      return `<div style="margin:12px 0;">
<img src="${url}" alt="Generated image" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #ddd;" />
<div style="margin-top:6px;">
  <a href="${url}" target="_blank" rel="noopener" download>Download</a>
</div>
</div>`;
    });

    const summary = `Generated ${images.length} image${images.length > 1 ? 's' : ''} for: ${prompt}`;
    const html = `<details open>
<summary style="cursor:pointer;font-weight:bold;padding:8px;background-color:#f5f5f5;border-radius:4px;margin-bottom:8px;">${summary}</summary>
<div style="padding:12px;border-left:3px solid #ddd;margin-left:4px;">${items.join('\n')}</div>
</details>`;
    return html;
  }

  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
    signal?: AbortSignal,
    sfcExactMatch?: boolean,
    sfcTrainingRelated?: boolean,
    req?: Request,
  ): Promise<eventEmitter> {
    const emitter = new eventEmitter();

    (async () => {
      try {
        const totalSteps = 2;

        const baseURL = await this.resolveBaseURL(signal);
        const aspectTag = (fileIds || []).find(
          (f) =>
            typeof f === 'string' && f.startsWith('__AGENT_IMAGE_ASPECT__:'),
        ) as string | undefined;
        const aspect = aspectTag
          ? aspectTag.split(':').slice(1).join(':')
          : '1:1';
        const { width, height } = this.getDimsFromAspect(aspect);
        const wf = this.buildWorkflow(message, width, height);

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'processing',
              total: totalSteps,
              current: 1,
              question: '提交繪圖任務',
              message: '正在提交繪圖任務...',
            },
          }),
        );

        const promptId = await this.submitWorkflow(baseURL, wf, signal);

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'processing',
              total: totalSteps,
              current: 2,
              question: '生成圖片中',
              message: '正在生成圖片，請稍候...',
            },
          }),
        );

        const images = await this.pollHistoryForImages(
          baseURL,
          promptId,
          signal,
        );
        const html = this.buildImageHTML(baseURL, images, message);

        const chunkSize = 200;
        for (let i = 0; i < html.length; i += chunkSize) {
          if (signal?.aborted) break;
          const chunk = html.slice(i, i + chunkSize);
          emitter.emit(
            'data',
            JSON.stringify({ type: 'response', data: chunk }),
          );
        }

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'finished',
              total: totalSteps,
              current: totalSteps,
              message: '圖片生成完成',
            },
          }),
        );

        emitter.emit('end');
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: `Error: ${error instanceof Error ? error.message : String(error)}${error?.cause?.code ? ` (${error.cause.code})` : ''}`,
          }),
        );
        emitter.emit('end');
      }
    })();

    if (signal) {
      signal.addEventListener('abort', () => {
        emitter.emit('end');
      });
    }

    return emitter;
  }
}

export default AgentImage;
