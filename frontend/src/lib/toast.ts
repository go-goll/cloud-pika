import { toast as sonnerToast } from 'sonner';

/**
 * 统一的 toast 通知工具
 * 封装 sonner 提供一致的调用接口
 */
export const toast = {
  success(message: string) {
    sonnerToast.success(message);
  },
  error(message: string) {
    sonnerToast.error(message);
  },
  info(message: string) {
    sonnerToast.info(message);
  },
  warning(message: string) {
    sonnerToast.warning(message);
  },
};
