import { describe, it, expect } from 'vitest';
import routes from './routes';

describe('Server routes', () => {
  it('should initialize express router', () => {
    const router = routes();
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });
});
