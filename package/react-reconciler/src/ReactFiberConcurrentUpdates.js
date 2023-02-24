import { HostRoot } from './ReactWorkTags';

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
