export interface MetricsInput {
  objectsLoaded: number;
  activeTransfers: number;
}

export interface MetricsView {
  objects: string;
  queue: string;
}

/** 计算全局工作台指标：当前已加载对象数、排队与进行中任务数。 */
export function deriveMetrics(input: MetricsInput): MetricsView {
  return {
    objects: String(input.objectsLoaded),
    queue: String(input.activeTransfers),
  };
}
