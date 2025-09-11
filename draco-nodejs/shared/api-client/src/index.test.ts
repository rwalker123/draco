import { describe, it, expect } from 'vitest';
import { VERSION, PACKAGE_INFO } from './index.js';

describe('Api Client Package', () => {
  it('should export version information', () => {
    expect(VERSION).toBe('1.0.0');
    expect(PACKAGE_INFO.version).toBe(VERSION);
    expect(PACKAGE_INFO.name).toBe('@draco/api-client');
  });
});