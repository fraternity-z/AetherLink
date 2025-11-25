/**
 * 异步初始化器，避免并发问题
 * 参考 Cherry Studio 实现
 */
export class AsyncInitializer<T, Args extends any[] = []> {
  private instance: T | null = null;
  private initPromise: Promise<T> | null = null;
  private initFn: (...args: Args) => Promise<T>;

  constructor(initFn: (...args: Args) => Promise<T>) {
    this.initFn = initFn;
  }

  async get(...args: Args): Promise<T> {
    if (this.instance) {
      return this.instance;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initFn(...args).then((result) => {
      this.instance = result;
      this.initPromise = null;
      return result;
    });

    return this.initPromise;
  }

  reset(): void {
    this.instance = null;
    this.initPromise = null;
  }
}
