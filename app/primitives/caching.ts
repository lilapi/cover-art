export class MemoizedCalculator<Input, Output> {
  private readonly _calculation: (input: Input) => Output;
  private readonly _cache: Map<Input, Output>;

  constructor(calculation: (input: Input) => Output) {
    this._calculation = calculation;
    this._cache = new Map();
    Object.freeze(this);
  }

  get(input: Input): Output {
    const existing = this._cache.get(input);
    if (existing !== undefined) return existing;

    const calculated = this._calculation(input);
    this._cache.set(input, calculated);
    return calculated;
  }

  results(): IterableIterator<Output> {
    return this._cache.values();
  }

  clear() {
    this._cache.clear();
  }
}
