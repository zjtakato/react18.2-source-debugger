import { scheduleCallBack } from 'scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { ChildDeletion, MutationMask, NoFlags, Placement, Update } from './ReactFiberFlags';
import { commitMutationEffectsOnFiber } from './ReactFiberCommitWork';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags';
import { finishQueueConcurrentUpdates } from './ReactFiberConcurrentUpdates';

let workInProgress = null; // 记录当前工作
let workInProgressRoot = null;

/**
 * 计划更新root（调度任务的功能）
 */
export function scheduleUpdateOnFiber(root) {
  console.log('~~~~~ 重新调度更新 ~~~~~');
  ensureRootIsScheduled(root); // 确保调度执行root上的更新
}

function ensureRootIsScheduled(root) {
  if (workInProgressRoot) return;
  workInProgressRoot = root;
  scheduleCallBack(performConcurrentWorkOnRoot.bind(null, root)); // 告诉浏览器要执行此函数
}

/**
 * 根据fiber构建fiber树 -> 创建真实DOM节点 -> 将真实DOM插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  renderRootSync(root); // 以同步的方式渲染根节点，初次渲染的时候，都是同步的
  // 开始进入提交阶段，就是执行副作用，修改真实DOM
  // console.log('root', root);
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  workInProgressRoot = null;
}

function renderRootSync(root) {
  // 开始构建fiber树
  prepareFreshStack(root);
  workLoopSync();
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
  finishQueueConcurrentUpdates();
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * 执行一个工作单元
 * @param {*} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate; // 获取新fiber对应的老fiber
  const next = beginWork(current, unitOfWork); // 完成当前fiber的子fiber链表构建后
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // 如果没有子节点 表示当前的fiber已经完成了
    completeUnitOfWork(unitOfWork);
  } else {
    // 如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const reutrnFiber = completedWork.return;
    // 执行此fiber的完成工作，如果是原生组件的话就是创建真实DOM
    completeWork(current, completedWork);
    // 如果有弟弟，就构建弟弟对应的fiber子链表
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟，说明完成的就是父fiber的最后一个节点， 也就是说一个父fiber，所有的子fiber全部都完成了
    completedWork = reutrnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null); // workInProgress为根fiber的父fiber时，工作结束
}

function commitRoot(root) {
  const { finishedWork } = root;
  printFinishedWork(finishedWork);
  // 判断子树有没有副作用
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;
  // 如果自己有副作用或者子节点有副作用，就提交DOM操作
  if (subtreeHasEffects || rootHasEffects) {
    commitMutationEffectsOnFiber(finishedWork, root); // 在fiber上提交变更操作的副作用
  }
  // 等DOM变更后，就可以把root的current指向新的fiber树
  root.current = finishedWork;
}

/**
 * 打印完成工作的副作用
 * @param {*} finishedWork
 */
function printFinishedWork(fiber) {
  const { flags, deletions } = fiber;
  if ((flags & ChildDeletion) !== NoFlags) {
    fiber.flags &= ~ChildDeletion;
    console.log('子节点有删除' + deletions.map((fiber) => `${fiber.type} #${fiber.memoizedProps.id}`).join());
  }
  let child = fiber.child;
  while (child) {
    printFinishedWork(child);
    child = child.sibling;
  }
  if (fiber.flags !== NoFlags) {
    console.log(getFlags(fiber), getTag(fiber.tag), fiber.type, fiber.memoizedProps);
  }
}

function getTag(tag) {
  switch (tag) {
    case FunctionComponent:
      return 'FunctionComponent';
    case HostRoot:
      return 'HostRoot';
    case HostComponent:
      return 'HostComponent';
    case HostText:
      return 'HostText';
    default:
      return tag;
  }
}

function getFlags(fiber) {
  const { flags, deletions } = fiber;
  if (flags === (Placement | Update)) {
    return '移动';
  }
  if (flags === Placement) {
    return '插入';
  }
  if (flags === Update) {
    return '更新';
  }

  return flags;
}
