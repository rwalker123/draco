import { describe, it, expect } from 'vitest';
import { ApiClient, BaseApiClient } from './index.js';

describe('Api Client Module', () => {
  it('should export main interfaces and classes', () => {
    expect(BaseApiClient).toBeDefined();
    expect(typeof BaseApiClient).toBe('function');
    expect(ApiClient).toBeDefined();
    expect(typeof ApiClient).toBe('function');
  });
});
