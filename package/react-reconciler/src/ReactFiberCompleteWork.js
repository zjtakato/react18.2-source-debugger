import logger from 'shared/logger';
import { HostComponent, HostRoot, HostText, FunctionComponent } from './ReactWorkTags';
import {
  createTextInstance,
  createInstance,
  appendInitalChild,
  finalizeInitailChildren,
  prepareUpdate,
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { NoFlags, Update } from './ReactFiberFlags';

export function completeWork(current, workInProgress) {
  logger('completedWork', workInProgress);
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    // 如果完成的fiber是文本节点, 那就创建真实的文本节点
    case HostText:
      const newText = newProps;
      // 创建真实的DOM节点并传入stateNode
      workInProgress.stateNode = createTextInstance(newText);
      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;

    // 如果完成的是原生节点
    case HostComponent:
      // 创建真实的DOM节点
      const { type } = workInProgress;
      // 如果老fier存在并且老fiber上有真实DOM节点，要走节点更新的逻辑
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        const instance = createInstance(type, newProps, workInProgress);
        // 把自己所有的子节点都挂在自己身上
        appendAllChild(instance, workInProgress);
        workInProgress.stateNode = instance;
        finalizeInitailChildren(instance, type, newProps);
      }

      bubbleProperties(workInProgress);
      break;
    case HostRoot:
      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
      break;
  }
}

function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  let child = completedWork.child;
  // 遍历当前fiber的所有子节点，把所有的子节点的副作用，以及子节点的子节点的副作用全部合并
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags |= subtreeFlags;
}

/**
 * 把当前完成的fiber所有的子节点对应的真实DOM都挂载到自己父parent真实DOM节点上
 * @param {*} parent - 当前完成的fiber的真实的DOM节点
 * @param {*} workInProgress - 完成的fiber
 */
function appendAllChild(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    // 如果子节点类型是一个原生节点或者是一个文本节点
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitalChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 如果第一个儿子不是原生节点，说明它可能是一个函数组件或者类组件
      node = node.child;
      continue;
    }
    if (node === workInProgress) return;
    // 如果当前的节点没有兄弟节点
    while (node.sibling === null) {
      if (node.return === workInProgress || node.return === null) return;
      // 回到父节点
      node = node.return;
    }
    node = node.sibling;
  }
}

/**
 * 在fiber的完成阶段，准备更新DOM
 * @param {*} current - 老fiber
 * @param {*} workInProgress - 新fiber
 * @param {*} type - 类型
 * @param {*} newProps - 新属性
 */
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps; // 老的属性
  const instance = workInProgress.stateNode; // 老的DOM节点
  // 比较新老属性，收集属性的差异
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  console.log(updatePayload);
  // let updatePayload = ['children', 6];
  // 让原生组件的新fiber更新队列等于[]
  workInProgress.updateQueue = updatePayload;
  if (updatePayload) {
    markUpdate(workInProgress);
  }
}

function markUpdate(workInProgress) {
  workInProgress.flags |= Update; // 给当前的fiber添加一个更新的副作用
}
