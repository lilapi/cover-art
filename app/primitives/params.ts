export interface ParamsReader {
  string(key: string): string | undefined;
  string(key: string, fallback: string): string;
  int(key: string): number | undefined;
  int(key: string, fallback: number): number;
  boolean(key: string): boolean;
}
export function readParams(params: {
  get(name: string): string | null;
}): ParamsReader {
  return {
    string(key: string, fallback?: string) {
      return params.get(key) ?? fallback;
    },
    url(key: string, fallback?: URL) {
      const raw = this.string(key, "");
      try {
        return new URL(raw);
      } finally {
        return fallback;
      }
    },
    int(key: string, fallback?: number) {
      const value = params.get(key);
      if (value === null) {
        return fallback;
      }

      const n = parseInt(value, 10);
      if (Number.isNaN(n)) {
        return fallback;
      }

      return n;
    },
    boolean(key: string) {
      return params.get(key) !== null;
    },
  } as ParamsReader;
}
