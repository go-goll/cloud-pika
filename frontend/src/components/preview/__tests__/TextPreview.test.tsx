import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { TextPreview } from '../TextPreview';

// Mock fetch for signed URL content retrieval
const originalFetch = globalThis.fetch;
const mockFetch = vi.fn();

beforeAll(() => { globalThis.fetch = mockFetch; });
afterAll(() => { globalThis.fetch = originalFetch; });

// Mock shiki to avoid loading WASM in tests
vi.mock('shiki', () => ({
  codeToHtml: vi.fn((code: string) =>
    Promise.resolve(`<pre class="shiki"><code>${code}</code></pre>`),
  ),
}));

beforeEach(() => {
  mockFetch.mockReset();
});

describe('TextPreview', () => {
  it('显示纯文本内容', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('Hello World'),
    });

    renderWithProviders(
      <TextPreview
        open
        onClose={vi.fn()}
        contentUrl="https://example.com/file.txt"
        fileName="notes.txt"
        previewType="text"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('显示代码内容（语法高亮）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('const x = 1;'),
    });

    renderWithProviders(
      <TextPreview
        open
        onClose={vi.fn()}
        contentUrl="https://example.com/app.ts"
        fileName="app.ts"
        previewType="code"
        lang="typescript"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    });
  });

  it('显示 Markdown 渲染结果', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('# Hello\n\nParagraph text'),
    });

    renderWithProviders(
      <TextPreview
        open
        onClose={vi.fn()}
        contentUrl="https://example.com/README.md"
        fileName="README.md"
        previewType="markdown"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
    });
  });

  it('显示加载状态', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves

    renderWithProviders(
      <TextPreview
        open
        onClose={vi.fn()}
        contentUrl="https://example.com/file.txt"
        fileName="file.txt"
        previewType="text"
      />,
    );

    expect(screen.getByTestId('text-preview-loading')).toBeInTheDocument();
  });

  it('open=false 时不渲染', () => {
    renderWithProviders(
      <TextPreview
        open={false}
        onClose={vi.fn()}
        contentUrl="https://example.com/file.txt"
        fileName="file.txt"
        previewType="text"
      />,
    );

    expect(screen.queryByTestId('text-preview-loading')).not.toBeInTheDocument();
  });

  it('Escape 键关闭预览', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('content'),
    });

    const onClose = vi.fn();
    renderWithProviders(
      <TextPreview
        open
        onClose={onClose}
        contentUrl="https://example.com/file.txt"
        fileName="file.txt"
        previewType="text"
      />,
    );

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('显示文件名', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('content'),
    });

    renderWithProviders(
      <TextPreview
        open
        onClose={vi.fn()}
        contentUrl="https://example.com/file.txt"
        fileName="myfile.txt"
        previewType="text"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('myfile.txt')).toBeInTheDocument();
    });
  });
});
