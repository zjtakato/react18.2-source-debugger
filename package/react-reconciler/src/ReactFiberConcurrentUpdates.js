import { HostRoot } from './ReactWorkTags';

const concurrentQueue = [];
let concurrentQueuesIndex = 0;

/**
 * 处理任务优先级
 * 现在只实现向上找到根节点
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber; // 当前fiber
  let parent = sourceFiber.return; // 当前fiber的父fiber
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}

/**
 * 把更新对象添加到更新队列中
 * @param {*} fiber - 函数组件对应的fiber
 * @param {*} queue - 要更新的hook对应的更新队列
 * @param {*} update - 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update);
  return getRootForUpdateFiber(fiber);
}

/**
 * 先把更新缓存到concurrentQueue数组中
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update) {
  concurrentQueue[concurrentQueuesIndex++] = fiber; // 函数组件对应的fiber
  concurrentQueue[concurrentQueuesIndex++] = queue; // 要更新的hook对应的更新队列
  concurrentQueue[concurrentQueuesIndex++] = update; // 更新对象
}

function getRootForUpdateFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  return node.tag === HostRoot ? node.stateNode : null; //FiberRootNode div#root
}

export function finishQueueConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueue[i++];
    const queue = concurrentQueue[i++];
    const update = concurrentQueue[i++];
    // 构建update双向循环链表
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
    }
    queue.pending = update;
  }
}
