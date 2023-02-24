import logger from 'shared/logger';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';
import { processUpdateQueue } from './ReactFiberClassUpdateQuene';
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
/**
 * 根据新的虚拟DOM 构建新的fiber子链表 child slbling
 * @param {*} current
 * @param {*} workInProgress
 * @returns
 */
export function beginWork(current, workInProgress) {
  logger('begin work', workInProgress);
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
      return null;
  }
}

function updateHostRoot(curernt, workInProgress) {
  // 需要知道它的子虚拟DOM信息
  processUpdateQueue(workInProgress); // workInProgress.memoizedState = {element }
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  reconcileChildren(curernt, workInProgress, nextChildren); // 协调子节点 DOM-DIFF算法
  return workInProgress.child;
}

/**
 * 构建原生组件的子fiber链表
 * @param {*} current  - 老fiber
 * @param {*} workInProgress  - 新fiber
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;
  let nextChild = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps); // 判断当前虚拟DOM它的儿子是不是一个文本的独生子
  if (isDirectTextChild) {
    nextChild = null;
  }
  reconcileChildren(current, workInProgress, nextChild);
  return workInProgress.child;
}

/**
 * 根据新的虚拟DOM生成新的Fiber链表
 * @param {*} current - 老的父fiber
 * @param {*} workInProgress - 新的父fiber
 * @param {*} nextChildren - 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  // 如果此新fiber没有老fiber，说明此新fiber是新创建的
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 如果说有老fiber，做DOM DIFF（拿老的子fiber链表和新的子虚拟DOM进行比较，进行最小化的更新）
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  }
}
