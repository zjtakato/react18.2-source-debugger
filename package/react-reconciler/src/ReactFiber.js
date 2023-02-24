import { HostComponent, HostRoot, HostText, IndeterminateComponent } from './ReactWorkTags';
import { NoFlags } from './ReactFiberFlags';

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

/**
 *
 * @param {*} tag  - fiber的类型 例如函数组件 根组件 原生组件 类组件等等
 * @param {*} pendingProps - 新属性，等待处理或新生效的属性
 * @param {*} key - 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  this.type = null; // fiber类型 例如 虚拟DOM节点的type 真实节点的 span div p
  // 每个虚拟DOM -> Fiber 节点 -> 真实DOM
  this.stateNode = null; // 对应真实的DOM节点

  this.return = null; // 指向父节点
  this.child = null; // 指向第一个子节点
  this.sibling = null; // 指向兄弟节点

  this.pendingProps = pendingProps; // 等待生效的属性
  this.memoizedProps = null; // 已经生效的属性

  this.memoizedState = null; // 每个fiber自己的状态
  this.updateQueue = null; // 每个fiber身上的更新队列
  this.flags = NoFlags; // 副作用的标识，表示要针对此fiber节点进行何种操作
  this.subtreeFlags = NoFlags; // 子节点对应的副作用标识（为了性能优化）
  this.alternate = null; // 替身，轮替（双缓存）
  this.index = 0; // 索引 在兄弟节点中的位置
}

/**
 * 基于老的fiber和新的属性创建新的fiber
 * @param {*} current  老fiber
 * @param {*} pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 更新操作
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

/**
 * 根据虚拟DOM 创建fiber节点
 * @param {*} element
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;
  return createFiberFromTypeAndProps(type, key, pendingProps);
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent;
  // 如果类型type是一个字符串，那么此fiber类型是一个原生组件
  if (typeof type === 'string') {
    tag = HostComponent;
  }
  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;
  return fiber;
}

export function createFiberFromText(content) {
  const fiber = createFiber(HostText, content, null);
  return fiber;
}
