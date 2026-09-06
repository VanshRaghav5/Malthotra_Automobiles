import { describe, it, expect } from 'vitest';
import { cn } from './lib/utils';

describe('Client utilities', () => {
  it('cn merges class names properly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
    expect(cn('text-red-500', false && 'hidden')).toBe('text-red-500');
  });
});
