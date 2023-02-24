import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';
import assign from 'shared/assign';

export function initialUpdateQuene(fiber) {
  // 创建一个新的更新队列
  const queue = {
    shared: {
      pending: null, // 循环队链表
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate() {
  const update = { tag: UpdateState };
  return update;
}

/**
 * 任务入队 - pending指向最后一个update，最后一个update的next指向第一个update
 * @param {*} fiber
 * @param {*} update
 */
export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const pending = updateQueue.shared.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next; // 如果有任务，那pending应该就是最后一个任务，最后一个任务的pending的next指向第一个任务
  }
  updateQueue.shared.pending = update;
  return markUpdateLaneFromFiberToRoot(fiber); // 从当前fiber向上找到根节点（为了任务优先级）
}

/**
 * 根据老状态和更新队列中的更新计算最新的状态
 * @param {*} workInProgress 要计算的fiber
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;
  // 如果有更新，或者更新队列里有内容
  if (pendingQueue !== null) {
    queue.shared.pending = null; // 清除等待生效的更新
    const lastPendingUpdate = pendingQueue; // 获取更新队列中最后一个更新 update = { payload: { element: 'h1'} }
    const firstPendingUpdate = lastPendingUpdate.next; //指向第一个更新
    lastPendingUpdate.next = null; // 把更新的链表剪开，变成一个单链表
    let newState = workInProgress.memoizedState; // 获取老状态
    let update = firstPendingUpdate;
    while (update) {
      newState = getStateFromUpdate(update, newState); // 根据老状态和更新计算状态
      update = update.next;
    }
    workInProgress.memoizedState = newState; // 把最终计算到的状态赋值给memoizedState
  }
}

/**
 * 根据老状态和更新 计算新状态
 * @param {*} update 更新的对象 其实有很多种类型
 * @param {*} prevState
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      return assign({}, prevState, payload);
  }
}

export const UpdateState = 0;
