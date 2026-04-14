import { LocalSandbox, type Sandbox, type SandboxKind } from '@shareai-lab/kode-sdk/dist/infra/sandbox';

type SandboxConfig = { kind: SandboxKind } & Record<string, unknown>;
type SandboxFactoryFn = (config: Record<string, unknown>) => Sandbox;

export class LocalSandboxFactory {
  private readonly factories = new Map<SandboxKind, SandboxFactoryFn>();

  constructor() {
    this.factories.set('local', (config) => new LocalSandbox(config));
  }

  register(kind: SandboxKind, factory: SandboxFactoryFn): void {
    this.factories.set(kind, factory);
  }

  create(config: SandboxConfig): Sandbox {
    const factory = this.factories.get(config.kind);
    if (!factory) {
      throw new Error(`Sandbox factory not registered: ${config.kind}`);
    }
    return factory(config);
  }

  async createAsync(config: SandboxConfig): Promise<Sandbox> {
    return this.create(config);
  }
}
