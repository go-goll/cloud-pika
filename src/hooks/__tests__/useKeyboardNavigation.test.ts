import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import { createObjectItem } from '@/test/fixtures';

const objects = [
  createObjectItem({ key: 'docs/', isDir: true }),
  createObjectItem({ key: 'photo.jpg', mimeType: 'image/jpeg' }),
  createObjectItem({ key: 'app.ts', mimeType: 'text/typescript' }),
];

function fireKey(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
) {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, ...opts }),
  );
}

describe('useKeyboardNavigation', () => {
  describe('方向键导航', () => {
    it('ArrowDown 递增 focusedIndex', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(objects, {}),
      );
      act(() => fireKey('ArrowDown'));
      expect(result.current.focusedIndex).toBe(0);
      act(() => fireKey('ArrowDown'));
      expect(result.current.focusedIndex).toBe(1);
    });

    it('ArrowUp 递减 focusedIndex', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(objects, {}),
      );
      act(() => fireKey('ArrowDown'));
      act(() => fireKey('ArrowDown'));
      act(() => fireKey('ArrowUp'));
      expect(result.current.focusedIndex).toBe(0);
    });

    it('不会超出边界', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(objects, {}),
      );
      act(() => fireKey('ArrowUp'));
      expect(result.current.focusedIndex).toBe(0);
      // 连按到末尾
      act(() => fireKey('ArrowDown'));
      act(() => fireKey('ArrowDown'));
      act(() => fireKey('ArrowDown'));
      act(() => fireKey('ArrowDown'));
      expect(result.current.focusedIndex).toBe(2);
    });
  });

  describe('Enter 键', () => {
    it('文件夹触发 onNavigateFolder', () => {
      const onNavigateFolder = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onNavigateFolder }),
      );
      act(() => fireKey('ArrowDown')); // focus index 0 = docs/
      act(() => fireKey('Enter'));
      expect(onNavigateFolder).toHaveBeenCalledWith('docs/');
    });

    it('图片触发 onPreview', () => {
      const onPreview = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onPreview }),
      );
      act(() => fireKey('ArrowDown')); // 0
      act(() => fireKey('ArrowDown')); // 1 = photo.jpg
      act(() => fireKey('Enter'));
      expect(onPreview).toHaveBeenCalledWith('photo.jpg');
    });

    it('可预览的代码文件触发 onPreview', () => {
      const onPreview = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onPreview }),
      );
      act(() => fireKey('ArrowDown')); // 0
      act(() => fireKey('ArrowDown')); // 1
      act(() => fireKey('ArrowDown')); // 2 = app.ts
      act(() => fireKey('Enter'));
      expect(onPreview).toHaveBeenCalledWith('app.ts');
    });
  });

  describe('Delete/Backspace 键', () => {
    it('触发 onDelete', () => {
      const onDelete = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onDelete }),
      );
      act(() => fireKey('ArrowDown'));
      act(() => fireKey('Delete'));
      expect(onDelete).toHaveBeenCalledWith('docs/');
    });
  });

  describe('Space 键', () => {
    it('触发 onSelect', () => {
      const onSelect = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onSelect }),
      );
      act(() => fireKey('ArrowDown'));
      act(() => fireKey(' '));
      expect(onSelect).toHaveBeenCalledWith('docs/', false);
    });

    it('支持 Shift 多选', () => {
      const onSelect = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onSelect }),
      );
      act(() => fireKey('ArrowDown'));
      act(() => fireKey(' ', { shiftKey: true }));
      expect(onSelect).toHaveBeenCalledWith('docs/', true);
    });
  });

  describe('新增快捷键', () => {
    it('F2 触发 onRename', () => {
      const onRename = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onRename }),
      );
      act(() => fireKey('ArrowDown')); // focus index 0
      act(() => fireKey('F2'));
      expect(onRename).toHaveBeenCalledWith('docs/');
    });

    it('Ctrl+U 触发 onUpload', () => {
      const onUpload = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onUpload }),
      );
      act(() => fireKey('u', { ctrlKey: true }));
      expect(onUpload).toHaveBeenCalled();
    });

    it('Meta+U 触发 onUpload（Mac）', () => {
      const onUpload = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onUpload }),
      );
      act(() => fireKey('u', { metaKey: true }));
      expect(onUpload).toHaveBeenCalled();
    });

    it('Ctrl+R 触发 onRefresh', () => {
      const onRefresh = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onRefresh }),
      );
      act(() => fireKey('r', { ctrlKey: true }));
      expect(onRefresh).toHaveBeenCalled();
    });

    it('Ctrl+A 触发 onSelectAll', () => {
      const onSelectAll = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onSelectAll }),
      );
      act(() => fireKey('a', { ctrlKey: true }));
      expect(onSelectAll).toHaveBeenCalled();
    });
  });

  describe('守卫条件', () => {
    it('输入框聚焦时忽略快捷键', () => {
      const onDelete = vi.fn();
      renderHook(() =>
        useKeyboardNavigation(objects, { onDelete }),
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      act(() => fireKey('ArrowDown'));
      act(() => fireKey('Delete'));
      expect(onDelete).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('空列表时不响应', () => {
      const onDelete = vi.fn();
      renderHook(() =>
        useKeyboardNavigation([], { onDelete }),
      );
      act(() => fireKey('ArrowDown'));
      act(() => fireKey('Delete'));
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
