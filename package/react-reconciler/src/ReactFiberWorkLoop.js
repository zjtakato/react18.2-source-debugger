import { scheduleCallBack } from 'scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags } from './ReactFiberFlags';
import { commitMutationEffectsOnFiber } from './ReactFiberCommitWork';

let workInProgress = null; // 记录当前工作
/**
 * 计划更新root（调度任务的功能）
 */
export function scheduleUpdateOnFiber(root) {
  ensureRootIsScheduled(root); // 确保调度执行root上的更新
}

function ensureRootIsScheduled(root) {
  scheduleCallBack(performConcurrentWorkOnRoot.bind(null, root)); // 告诉浏览器要执行此函数
}

/**
 * 根据fiber构建fiber树 -> 创建真实DOM节点 -> 将真实DOM插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  renderRootSync(root); // 以同步的方式渲染根节点，初次渲染的时候，都是同步的
  // 开始进入提交阶段，就是执行副作用，修改真实DOM
  console.log('root', root)
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
}

function renderRootSync(root) {
  // 开始构建fiber树
  prepareFreshStack(root);
  workLoopSync();
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
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
  const curernt = unitOfWork.alternate; // 获取新fiber对应的老fiber
  const next = beginWork(curernt, unitOfWork); // 完成当前fiber的子fiber链表构建后
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
  // 判断子树有没有副作用
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;
  // 如果自己有副作用或者子节点有副作用，就提交DOM操作
  if (subtreeHasEffects || rootHasEffects) {
    commitMutationEffectsOnFiber(finishedWork, root); // 在fiber上提交变更操作的副作用
  }
  // 等DOM变更后，就可以把root的current指向新的fiber树
  root.curernt = finishedWork;
}
