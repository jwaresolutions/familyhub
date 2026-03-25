import { describe, it, expect } from 'vitest';
import { loginSchema, createTaskSchema } from '../validation';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ username: 'justin', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects empty username', () => {
    const result = loginSchema.safeParse({ username: '', password: 'secret' });
    expect(result.success).toBe(false);
  });
});

describe('createTaskSchema', () => {
  it('accepts a valid task with required fields', () => {
    const result = createTaskSchema.safeParse({ title: 'Buy groceries', category: 'FAMILY' });
    expect(result.success).toBe(true);
  });

  it('rejects a task with empty title', () => {
    const result = createTaskSchema.safeParse({ title: '', category: 'FAMILY' });
    expect(result.success).toBe(false);
  });
});
