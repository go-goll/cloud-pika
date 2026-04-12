/**
 * useKeyboardNavigation - 资源列表键盘导航 Hook
 * 支持上下箭头移动焦点、Enter进入文件夹/预览、Delete删除、空格选中
 */
import { useEffect, useRef, useState } from 'react';
import type { ObjectItem } from '@/types/cloud';
import { getPreviewType } from '@/lib/preview-type';

interface KeyboardNavCallbacks {
  onNavigateFolder?: (prefix: string) => void;
  onPreview?: (key: string) => void;
  onDelete?: (key: string) => void;
  onSelect?: (key: string, shiftKey: boolean) => void;
  onRename?: (key: string) => void;
  onUpload?: () => void;
  onRefresh?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export function useKeyboardNavigation(
  objects: ObjectItem[],
  callbacks: KeyboardNavCallbacks,
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const objectsRef = useRef(objects);
  objectsRef.current = objects;

  const focusRef = useRef(focusedIndex);
  focusRef.current = focusedIndex;

  // 对象列表变化时重置焦点
  useEffect(() => {
    setFocusedIndex(-1);
  }, [objects]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (
        document.activeElement?.tagName ?? ''
      ).toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;

      const items = objectsRef.current;
      const len = items.length;
      if (len === 0) return;

      const idx = focusRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const focused = idx >= 0 && idx < len ? items[idx] : null;
      const cb = cbRef.current;

      if (mod) {
        switch (e.key.toLowerCase()) {
          case 'u':
            e.preventDefault();
            cb.onUpload?.();
            return;
          case 'r':
            e.preventDefault();
            cb.onRefresh?.();
            return;
          case 'a':
            e.preventDefault();
            cb.onSelectAll?.();
            return;
        }
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, len - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter': {
          if (!focused) break;
          if (focused.isDir || focused.key.endsWith('/')) {
            cb.onNavigateFolder?.(focused.key);
          } else if (getPreviewType(focused.key) !== null) {
            cb.onPreview?.(focused.key);
          }
          break;
        }
        case 'F2': {
          if (!focused) break;
          e.preventDefault();
          cb.onRename?.(focused.key);
          break;
        }
        case 'Delete':
        case 'Backspace': {
          if (!focused) break;
          cb.onDelete?.(focused.key);
          break;
        }
        case ' ': {
          if (!focused) break;
          e.preventDefault();
          cb.onSelect?.(focused.key, e.shiftKey);
          break;
        }
        case 'Escape':
          setFocusedIndex(-1);
          cb.onClearSelection?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { focusedIndex, setFocusedIndex };
}
