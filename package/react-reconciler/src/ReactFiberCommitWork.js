import { MutationMask, Placement } from './ReactFiberFlags';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';
import { appendChild, insertBefore } from 'react-dom-bindings/src/client/ReactDOMHostConfig';

/**
 * 遍历fiber树，执行fiber上的副作用
 * @param {*} finishedWork - fiber节点
 * @param {*} root - 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  switch (finishedWork.tag) {
    case HostRoot:
    case HostComponent:
    case HostText: {
      // 先遍历子节点，处理子节点上的副作用
      recursivelyTransverseMutationEffects(root, finishedWork);
      // 再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    default:
      break;
  }
}

function recursivelyTransverseMutationEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;
  // 插入操作
  if (flags & Placement) {
    // 进行插入操作，把此fiber对应的真实DOM节点添加到父真实DOM上
    commitPlacement(finishedWork);
    // 把flags里的Placement删除
    finishedWork.flags & ~Placement;
  }
}

/**
 * 把此fiber的真实DOM插入到父DOM里
 * @param {*} finishedWork
 */
function commitPlacement(finishedWork) {
  console.log('commitPlacement', finishedWork);
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo;
      const before = getHostSibling(finishedWork); // 获取最近的弟弟真实DOM节点
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostComponent: {
      const parent = parentFiber.stateNode;
      const before = getHostSibling(finishedWork); // 获取最近的弟弟真实DOM节点
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
  }
}

function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

/**
 * 把子节点对应的真实DOM插入到父节点DOM中
 * @param {*} node - 将要插入的fiber节点
 * @param {*} parent - 父真实DOM节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  // 判断fiber对应的节点是不是真实DOM节点
  const isHost = tag === HostComponent || tag === HostText;
  // 是的话直接插入
  if (isHost) {
    const { stateNode } = node;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    // 如果node不是真实的DOM节点，获取它的第一个子节点
    const { child } = node;
    if (child !== null) {
      insertOrAppendPlacementNode(node, parent); // 把node的第一个子节点添加到该node的DOM节点里面去
      let { sibling } = child;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

/**
 * 找要插入的节点
 * 找到可以插在它的前面的那个fiber的真实DOM
 * <ul>                    <ul>
 *  <li>1</li>              <li>1</li>
 *  <li>3</li>    -->       <li>2</li>
 * </ul>                    <li>3</li>
 *                         </ul>
 * @param {*} fiber
 */
function getHostSibling(fiber) {
  let node = fiber;
  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) return null;
      node = node.return;
    }
    node = node.sibling;
    // 如果弟弟不是原生节点也不是文本节点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      // 如果此节点是一个将要插入的新节点，找它的弟弟
      if (node.flags & Placement) {
        continue siblings;
      } else {
        node = node.child;
      }
    }
    if(!(node.flags & Placement)) { // 如果不是插入节点
      return node.stateNode;
    }
  }
}