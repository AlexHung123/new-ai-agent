import { AgentTemplateRegistry } from '@shareai-lab/kode-sdk/dist/core/template';
import { JSONStore } from '@shareai-lab/kode-sdk/dist/infra/store/json-store';
import { ToolRegistry } from '@shareai-lab/kode-sdk/dist/tools/registry';
import { builtin } from '@shareai-lab/kode-sdk/dist/tools/builtin';
import type { AgentDependencies } from '@shareai-lab/kode-sdk/dist/core/agent';
import type { ModelConfig } from '@shareai-lab/kode-sdk/dist/infra/provider';
import { createDemoModelProvider } from './demo-model';
import { LocalSandboxFactory } from './localSandboxFactory';

type BuiltinGroup = 'fs' | 'bash' | 'todo' | 'task';

export interface RuntimeOptions {
  storeDir?: string;
  store?: AgentDependencies['store'];
  modelDefaults?: Partial<ModelConfig>;
}

export interface RuntimeContext {
  templates: AgentTemplateRegistry;
  tools: ToolRegistry;
  sandboxFactory: LocalSandboxFactory;
  registerBuiltin: (...groups: BuiltinGroup[]) => void;
}

export function createRuntime(setup: (ctx: RuntimeContext) => void, options?: RuntimeOptions): AgentDependencies {
  const store = options?.store ?? new JSONStore(options?.storeDir ?? './.kode');
  const templates = new AgentTemplateRegistry();
  const tools = new ToolRegistry();
  const sandboxFactory = new LocalSandboxFactory();

  const registerBuiltin = (...groups: BuiltinGroup[]) => {
    for (const group of groups) {
      if (group === 'fs') {
        for (const tool of builtin.fs()) {
          tools.register(tool.name, () => tool);
        }
      } else if (group === 'bash') {
        for (const tool of builtin.bash()) {
          tools.register(tool.name, () => tool);
        }
      } else if (group === 'todo') {
        for (const tool of builtin.todo()) {
          tools.register(tool.name, () => tool);
        }
      } else if (group === 'task') {
        const taskTool = builtin.task();
        if (taskTool) {
          tools.register(taskTool.name, () => taskTool);
        }
      }
    }
  };

  setup({ templates, tools, sandboxFactory, registerBuiltin });

  return {
    store,
    templateRegistry: templates,
    sandboxFactory,
    toolRegistry: tools,
    modelFactory: (config) => createDemoModelProvider({ ...(options?.modelDefaults ?? {}), ...config }),
  };
}
