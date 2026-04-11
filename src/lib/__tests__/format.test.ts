import {
  formatFileSize,
  formatDate,
  isImageKey,
  formatCopyUrl,
  extractFileName,
  formatSpeed,
  formatETA,
} from '../format';

describe('formatFileSize', () => {
  it('returns "0 B" for zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('returns "0 B" for negative values', () => {
    expect(formatFileSize(-1)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats kilobytes with decimal', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('formats terabytes', () => {
    expect(formatFileSize(1099511627776)).toBe('1 TB');
  });
});

describe('formatDate', () => {
  it('formats ISO date string to local time', () => {
    const result = formatDate('2026-04-01T14:30:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('returns original string on invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('isImageKey', () => {
  it.each(['photo.jpg', 'image.png', 'pic.gif', 'icon.webp', 'logo.svg'])(
    'recognizes %s as image',
    (key) => {
      expect(isImageKey(key)).toBe(true);
    },
  );

  it.each(['doc.pdf', 'app.tsx', 'archive.zip', 'folder/'])(
    'rejects %s as non-image',
    (key) => {
      expect(isImageKey(key)).toBe(false);
    },
  );
});

describe('extractFileName', () => {
  it('extracts file name from path', () => {
    expect(extractFileName('images/2024/photo.jpg')).toBe('photo.jpg');
  });

  it('handles root-level file', () => {
    expect(extractFileName('photo.jpg')).toBe('photo.jpg');
  });

  it('handles directory path', () => {
    expect(extractFileName('images/2024/')).toBe('2024/');
  });
});

describe('formatCopyUrl', () => {
  it('returns plain URL for url mode', () => {
    expect(formatCopyUrl('https://cdn.example.com/a.jpg', 'a.jpg', 'url'))
      .toBe('https://cdn.example.com/a.jpg');
  });

  it('returns markdown image for image in markdown mode', () => {
    expect(formatCopyUrl('https://cdn.example.com/a.jpg', 'a.jpg', 'markdown'))
      .toBe('![a.jpg](https://cdn.example.com/a.jpg)');
  });

  it('returns markdown link for non-image in markdown mode', () => {
    expect(formatCopyUrl('https://cdn.example.com/a.pdf', 'a.pdf', 'markdown'))
      .toBe('[a.pdf](https://cdn.example.com/a.pdf)');
  });
});

describe('formatSpeed', () => {
  it('formats bytes per second', () => {
    expect(formatSpeed(500)).toBe('500 B/s');
  });

  it('formats KB per second', () => {
    expect(formatSpeed(1024)).toBe('1 KB/s');
  });

  it('formats MB per second', () => {
    expect(formatSpeed(1048576)).toBe('1 MB/s');
  });

  it('returns "0 B/s" for zero', () => {
    expect(formatSpeed(0)).toBe('0 B/s');
  });
});

describe('formatETA', () => {
  it('returns "--" when speed is 0', () => {
    expect(formatETA(1000, 0)).toBe('--');
  });

  it('formats seconds only', () => {
    expect(formatETA(5000, 1000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatETA(150000, 1000)).toBe('2m 30s');
  });

  it('formats hours', () => {
    expect(formatETA(7200000, 1000)).toBe('2h 0m');
  });

  it('returns "0s" when remaining is 0', () => {
    expect(formatETA(0, 1000)).toBe('0s');
  });
});
