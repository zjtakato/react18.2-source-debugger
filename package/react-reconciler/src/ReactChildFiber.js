import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber';
import { ChildDeletion, Placement } from './ReactFiberFlags';
import isArray from 'shared/isArray';

/**
 * 是否更新副作用
 * @param {*} shouldTracksSideEffects
 */
function createChildReconciler(shouldTracksSideEffects) {
  /**
   * 比较子fiber DOM-DIFF 用老的子fiber 链表 和 新的虚拟DOM 进行比较的过程
   * @param {*} returnFiber - 新的父fiber
   * @param {*} currentFirstFiber  - 老fiber第一个子fiber
   * @param {*} newChild - 新的子虚拟DOM H1虚拟DOM
   */
  function reconcilerChildFibers(returnFiber, currentFirstFiber, newChild) {
    // 现在要处理更新的逻辑，单节点的DOM DIFF

    // 暂时只考虑新的节点只有一个的情况
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstFiber, newChild));
        default:
          break;
      }
    }
    if (isArray(newChild)) {
      return reconcilerChildrenArray(returnFiber, currentFirstFiber, newChild);
    }
    return null;
  }

  /**
   *
   * @param {*} returnFiber - 根fiber div#root对应的fiber
   * @param {*} currentFirstChild - 老的FunctionComponent对应的fiber
   * @param {*} element - 新的虚拟对象
   * @returns 返回第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      // 判断此老fiber的key和新的虚拟DOM对应的key是否一样
      if (child.key === key) {
        // 判断老fiber对应的类型和新虚拟DO元素对应的类似是否一致
        if (child.type === element.type) {
          // 如果key一样，类型(标签)也一样，则认为此节点可以复用
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          // 如果找到key一样的老fiber，但是类型(标签)不一样，此时不能复用老fiber，把剩下的全部删掉
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }
    const created = createFiberFromElement(element); // 因为实现的是初次挂载，老节点的currentFirstFiber肯定是没有的， 所以可以根据虚拟DOM创建新的fiber节点
    created.return = returnFiber;
    return created;
  }

  function reconcilerChildrenArray(returnFiber, currentFirstFiber, newChildren) {
    let resultingFirstChild = null; // 返回的第一个新儿子
    let previousFiber = null; // 上一个的一个新的fiber
    let newIndex = 0;
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = createChild(returnFiber, newChildren[newIndex]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIndex);
      // 如果previousFiber为null，说明这是第一个fiber
      if (previousFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        // 否则说明不是大儿子，就把这个newFiber添加到上一个子节点的后面
        previousFiber.sibling = newFiber;
      }
      // 让newFiber成为最后一个或者说上一个子fiber
      previousFiber = newFiber;
    }
    return resultingFirstChild;
  }

  /**
   * 设置副作用
   * @param {*} newFiber
   * @param {*} newIndex
   */
  function placeSingleChild(newFiber) {
    // 添加副作用
    if (shouldTracksSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement; // 要在最后的提交阶段插入此节点 React渲染分成渲染阶段（创建fiber树）和提交阶段（更新真实DOM）
    }
    return newFiber;
  }

  function placeChild(newFiber, index) {
    newFiber.index = index;
    // 如果一个fiber上的flags上有placement，说明此节点需要创建真实DOM并插入到父容器中
    // 如果父fiber节点是初次挂载，shouldTracksSideEffects = false，不需要添加flags
    // 这种情况下会把完成阶段把所有子节点全部添加到自己身上
    if (shouldTracksSideEffects) {
      newFiber.flags |= Placement;
    }
  }

  function createChild(returnFiber, newChild) {
    if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
        default:
          break;
      }
    }
    return null;
  }

  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTracksSideEffects) return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions.push(childToDelete);
    }
  }

  // 删除从currentFirstChild之后的所有fiber节点
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTracksSideEffects) return;
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  return reconcilerChildFibers;
}

export const reconcileChildFibers = createChildReconciler(true); //  有老fiber 更新的时候用这个
export const mountChildFibers = createChildReconciler(false); // 没有老fiber 初次挂载用这个
