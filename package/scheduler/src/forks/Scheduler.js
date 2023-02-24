/**
 * 实现优先队列
 */
export function scheduleCallBack(callback) {
  requestIdleCallback(callback);
}
