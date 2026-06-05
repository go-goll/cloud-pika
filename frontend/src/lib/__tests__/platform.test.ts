import { describe, expect, it } from 'vitest';
import { detectPlatform } from '@/lib/platform';

describe('detectPlatform', () => {
  it('识别 macOS', () => {
    expect(
      detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)'),
    ).toBe('mac');
  });

  it('识别 Windows', () => {
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0)')).toBe(
      'win',
    );
  });

  it('其它平台回退 other', () => {
    expect(
      detectPlatform('Mozilla/5.0 (X11; Linux x86_64)'),
    ).toBe('other');
  });
});
