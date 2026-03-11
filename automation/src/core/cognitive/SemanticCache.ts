/**
 * AURA — Semantic Cache
 * Persists AI-resolved selectors to disk to avoid redundant API calls.
 * Uses a simple JSON file as a key-value store with TTL support.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { CognitiveCache, SemanticResolution } from '../../types/index';

type CacheStore = Record<string, CognitiveCache>;

export class SemanticCache {
  private readonly cachePath: string;
  private store: CacheStore = {};

  constructor(
    private readonly ttlSeconds: number = 3600,
    cacheDir = '.aura-cache',
  ) {
    this.cachePath = path.resolve(process.cwd(), cacheDir, 'semantic.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf-8');
        this.store = JSON.parse(raw) as CacheStore;
      }
    } catch {
      this.store = {};
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.cachePath, JSON.stringify(this.store, null, 2));
    } catch {
      // Non-critical: cache write failure should not crash tests
    }
  }

  static buildKey(intent: string, url: string): string {
    return crypto
      .createHash('sha256')
      .update(`${intent}::${url}`)
      .digest('hex')
      .slice(0, 16);
  }

  get(key: string): SemanticResolution | null {
    const entry = this.store[key];
    if (!entry) return null;

    const ageSeconds =
      (Date.now() - new Date(entry.createdAt).getTime()) / 1000;
    if (ageSeconds > entry.ttl) {
      delete this.store[key];
      return null;
    }

    return entry.resolution;
  }

  set(key: string, resolution: SemanticResolution): void {
    const entry: CognitiveCache = {
      key,
      resolution,
      createdAt: new Date().toISOString(),
      ttl: this.ttlSeconds,
    };
    this.store[key] = entry;
    this.persist();
  }

  invalidate(key: string): void {
    delete this.store[key];
    this.persist();
  }

  clear(): void {
    this.store = {};
    this.persist();
  }
}
