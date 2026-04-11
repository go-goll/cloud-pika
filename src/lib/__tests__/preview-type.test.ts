import { getPreviewType, getShikiLang } from '../preview-type';

describe('getPreviewType', () => {
  describe('图片类型', () => {
    it.each(['photo.jpg', 'image.png', 'pic.gif', 'icon.webp', 'logo.svg', 'file.avif'])(
      '识别 %s 为 image',
      (key) => {
        expect(getPreviewType(key)).toBe('image');
      },
    );
  });

  describe('Markdown 类型', () => {
    it('识别 .md 为 markdown', () => {
      expect(getPreviewType('README.md')).toBe('markdown');
    });
  });

  describe('代码类型', () => {
    it.each([
      'app.ts', 'index.tsx', 'main.js', 'style.css',
      'config.yaml', 'data.json', 'page.html', 'main.go',
      'script.py', 'lib.rs', 'run.sh', 'build.yml',
    ])(
      '识别 %s 为 code',
      (key) => {
        expect(getPreviewType(key)).toBe('code');
      },
    );
  });

  describe('文本类型', () => {
    it.each(['notes.txt', 'output.log', 'data.csv'])(
      '识别 %s 为 text',
      (key) => {
        expect(getPreviewType(key)).toBe('text');
      },
    );
  });

  describe('不可预览类型', () => {
    it.each(['archive.zip', 'program.exe', 'data.bin', 'folder/'])(
      '识别 %s 为 null',
      (key) => {
        expect(getPreviewType(key)).toBeNull();
      },
    );
  });
});

describe('getShikiLang', () => {
  it.each([
    ['app.tsx', 'tsx'],
    ['app.ts', 'typescript'],
    ['app.js', 'javascript'],
    ['app.jsx', 'jsx'],
    ['style.css', 'css'],
    ['config.yaml', 'yaml'],
    ['config.yml', 'yaml'],
    ['data.json', 'json'],
    ['page.html', 'html'],
    ['main.go', 'go'],
    ['script.py', 'python'],
    ['lib.rs', 'rust'],
    ['run.sh', 'bash'],
    ['code.xml', 'xml'],
    ['Makefile.toml', 'toml'],
  ])(
    '将 %s 映射为 %s',
    (key, expected) => {
      expect(getShikiLang(key)).toBe(expected);
    },
  );

  it('未知扩展名返回 "text"', () => {
    expect(getShikiLang('unknown.xyz')).toBe('text');
  });
});
