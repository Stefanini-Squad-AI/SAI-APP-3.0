/**
 * AURA — Self-Documenting ChangeLog Decorators
 *
 * TypeScript decorator factory that registers change metadata at compile-time.
 * Any class, method or property decorated with @AuraChange is automatically
 * catalogued in the ChangelogRegistry — no manual documentation required.
 *
 * Usage:
 *   @AuraChange({
 *     kind: 'feature',
 *     title: 'AI-driven element resolution',
 *     description: 'Added CognitiveScanner with OpenAI GPT-4o backend.',
 *     author: 'John Doe',
 *     version: '1.2.0',
 *     tags: ['cognitive', 'ai', 'selector'],
 *   })
 *   class CognitiveScanner { ... }
 */
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { ChangelogRegistry } from './ChangelogRegistry';
import type { ChangeEntry, ChangeKind, ChangeId } from '../../types/index';

// ─── Decorator Options ────────────────────────────────────────────────────────

export interface ChangeDecoratorOptions {
  readonly kind: ChangeKind;
  readonly title: string;
  readonly description: string;
  readonly author: string;
  readonly version: string;
  readonly tags?: readonly string[];
}

// ─── Metadata Key ─────────────────────────────────────────────────────────────

const AURA_CHANGE_META = Symbol('aura:change');

// ─── Decorator Factory ────────────────────────────────────────────────────────

/**
 * Class / Method / Property decorator.
 * Works as both @AuraChange({...}) on a class and on class methods.
 */
export function AuraChange(
  options: ChangeDecoratorOptions,
): ClassDecorator & MethodDecorator & PropertyDecorator {
  return function decorator(
    target: object,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor,
  ): void {
    const targetName =
      propertyKey !== undefined
        ? `${(target as Function).name ?? 'Unknown'}.${String(propertyKey)}`
        : (target as Function).name ?? 'Unknown';

    const entry: ChangeEntry = {
      id: uuidv4() as ChangeId,
      kind: options.kind,
      title: options.title,
      description: options.description,
      author: options.author,
      version: options.version,
      date: new Date().toISOString(),
      tags: options.tags ?? [],
      target: targetName,
    };

    // Store on the target for reflection
    Reflect.defineMetadata(AURA_CHANGE_META, entry, target);

    // Register globally
    ChangelogRegistry.getInstance().register(entry);
  } as ClassDecorator & MethodDecorator & PropertyDecorator;
}

/**
 * Reads the ChangeEntry stored on a decorated class/method.
 */
export function getChangeMetadata(target: object): ChangeEntry | undefined {
  return Reflect.getMetadata(AURA_CHANGE_META, target) as ChangeEntry | undefined;
}

// ─── Semantic Shorthand Decorators ───────────────────────────────────────────

export const AuraFeature = (
  opts: Omit<ChangeDecoratorOptions, 'kind'>,
): ReturnType<typeof AuraChange> => AuraChange({ ...opts, kind: 'feature' });

export const AuraFix = (
  opts: Omit<ChangeDecoratorOptions, 'kind'>,
): ReturnType<typeof AuraChange> => AuraChange({ ...opts, kind: 'fix' });

export const AuraRefactor = (
  opts: Omit<ChangeDecoratorOptions, 'kind'>,
): ReturnType<typeof AuraChange> => AuraChange({ ...opts, kind: 'refactor' });

export const AuraBreaking = (
  opts: Omit<ChangeDecoratorOptions, 'kind'>,
): ReturnType<typeof AuraChange> => AuraChange({ ...opts, kind: 'breaking' });

export const AuraDocs = (
  opts: Omit<ChangeDecoratorOptions, 'kind'>,
): ReturnType<typeof AuraChange> => AuraChange({ ...opts, kind: 'docs' });

export const AuraPerf = (
  opts: Omit<ChangeDecoratorOptions, 'kind'>,
): ReturnType<typeof AuraChange> => AuraChange({ ...opts, kind: 'perf' });
