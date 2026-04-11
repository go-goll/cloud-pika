import { render } from '@testing-library/react';
import { getFileIcon, getIconBg } from '../file-icon';

describe('getFileIcon', () => {
  it('returns Folder icon for directory', () => {
    const { container } = render(getFileIcon('photos/', undefined));
    expect(container.querySelector('.icon-folder')).toBeInTheDocument();
  });

  it('returns Image icon for image by extension', () => {
    const { container } = render(getFileIcon('photo.jpg', undefined));
    expect(container.querySelector('.icon-image')).toBeInTheDocument();
  });

  it('returns Image icon for image by mimeType', () => {
    const { container } = render(getFileIcon('file', 'image/png'));
    expect(container.querySelector('.icon-image')).toBeInTheDocument();
  });

  it('returns FileVideo icon for video', () => {
    const { container } = render(getFileIcon('clip.mp4', 'video/mp4'));
    expect(container.querySelector('.icon-video')).toBeInTheDocument();
  });

  it('returns FileAudio icon for audio', () => {
    const { container } = render(getFileIcon('song.mp3', 'audio/mpeg'));
    expect(container.querySelector('.icon-audio')).toBeInTheDocument();
  });

  it('returns FileText icon for text mimeType', () => {
    const { container } = render(getFileIcon('readme.txt', 'text/plain'));
    expect(container.querySelector('.icon-text')).toBeInTheDocument();
  });

  it('returns FileArchive icon for archive extensions', () => {
    for (const ext of ['zip', 'tar', 'gz', 'rar', '7z']) {
      const { container } = render(getFileIcon(`file.${ext}`, undefined));
      expect(container.querySelector('.icon-archive')).toBeInTheDocument();
    }
  });

  it('returns FileCode icon for code extensions', () => {
    for (const ext of ['js', 'ts', 'jsx', 'tsx', 'json', 'yaml', 'html', 'css']) {
      const { container } = render(getFileIcon(`file.${ext}`, undefined));
      expect(container.querySelector('.icon-code')).toBeInTheDocument();
    }
  });

  it('returns generic File icon for unknown type', () => {
    const { container } = render(getFileIcon('data.bin', undefined));
    expect(container.querySelector('.icon-file')).toBeInTheDocument();
  });

  it('respects custom size', () => {
    const { container } = render(getFileIcon('photo.jpg', undefined, 32));
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});

describe('getIconBg', () => {
  it('returns blue bg for folder', () => {
    expect(getIconBg('photos/')).toBe('bg-blue-500/10');
  });

  it('returns emerald bg for image', () => {
    expect(getIconBg('photo.jpg')).toBe('bg-emerald-500/10');
  });

  it('returns purple bg for video', () => {
    expect(getIconBg('clip.mp4', 'video/mp4')).toBe('bg-purple-500/10');
  });

  it('returns amber bg for audio', () => {
    expect(getIconBg('song.mp3', 'audio/mpeg')).toBe('bg-amber-500/10');
  });

  it('returns gray bg for text', () => {
    expect(getIconBg('readme.txt', 'text/plain')).toBe('bg-gray-500/10');
  });

  it('returns violet bg for archive', () => {
    expect(getIconBg('file.zip')).toBe('bg-violet-500/10');
  });

  it('returns cyan bg for code', () => {
    expect(getIconBg('app.tsx')).toBe('bg-cyan-500/10');
  });

  it('returns gray bg for unknown', () => {
    expect(getIconBg('data.bin')).toBe('bg-gray-500/10');
  });
});
