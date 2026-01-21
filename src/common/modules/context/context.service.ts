import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface BaseTraceContext {
  tenantId: number;
  userId?: number;

  // Additional fields can be added as needed
  ipAddress: string;
  requestId: string;
  userAgent: string;
}
@Injectable()
export class ContextService<T extends BaseTraceContext = BaseTraceContext> {
  private als: AsyncLocalStorage<Map<keyof T, T[keyof T]>>;

  constructor() {
    this.als = new AsyncLocalStorage();
  }

  public runContext(
    data: Map<keyof T, T[keyof T]>,
    cb: () => Promise<void> | void | Record<string, unknown>,
  ): void {
    void this.als.run(data, cb);
  }

  public setData<K extends keyof T>(key: K, value: T[K]): void {
    const store = this.als.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  public getData<K extends keyof T>(key: K): T[K] | undefined {
    const store = this.als.getStore();
    if (!store) return undefined;

    return store.get(key) as T[K] | undefined;
  }

  public getStore(): T | undefined {
    return this.als.getStore() as unknown as T | undefined;
  }
}
