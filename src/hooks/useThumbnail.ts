/**
 * useThumbnail - 图片缩略图加载 hook
 * 对图片类型文件生成签名URL用于缩略图展示，
 * 支持懒加载（IntersectionObserver）
 */
import { useEffect, useRef, useState } from 'react';
import { cloudApi } from '@/lib/api-client';

interface ThumbnailState {
  /** 签名后的图片URL */
  url: string | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 是否加载失败 */
  error: boolean;
  /** 绑定到容器元素的 ref */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * 获取图片缩略图签名URL
 * 仅当元素进入可视区域时触发加载
 */
export function useThumbnail(
  key: string,
  bucket: string,
  accountId: string,
  isImage: boolean,
): ThumbnailState {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isImage || !accountId || !bucket || !key) return;
    if (loadedRef.current) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loadedRef.current) return;
        loadedRef.current = true;
        observer.disconnect();

        setLoading(true);
        cloudApi
          .generateURL({ accountId, bucket, key })
          .then((res) => {
            setUrl(res.url);
            setLoading(false);
          })
          .catch(() => {
            setError(true);
            setLoading(false);
          });
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [key, bucket, accountId, isImage]);

  return { url, loading, error, containerRef };
}
