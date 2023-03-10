import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber';
import { ChildDeletion, Placement } from './ReactFiberFlags';
import isArray from 'shared/isArray';
import { HostText } from './ReactWorkTags';

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
    let previousNewFiber = null; // 上一个的一个新的fiber
    let newIndex = 0; // 用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstFiber;
    let nextOldFiber = null; // 下一个老fiber
    let lastPlacedIndex = 0; // 上一个不需要移动的老节点的索引
    // 开始第一轮循环, 如果老fiber有值，新的虚拟DOM也有值
    for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
      nextOldFiber = oldFiber.sibling;
      // 试图更新或复用老的fiber
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
      if (newFiber === null) {
        return;
      }
      if (shouldTracksSideEffects) {
        // 如果有老fiber，但是新的fiber并没有成功复用老fiber和老的真实DOM，那就删除老fiber，在提交阶段会删除真实DOM
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      // 指定新fiber的位置
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        resultingFirstChild.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
      // oldFiber = oldFiber.sibling;
    }

    // 如果虚拟DOM已经循环完毕，
    if (newIndex === newChildren.length) {
      // 删除剩下的老fiber
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; newIndex < newChildren.length; newIndex++) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        if (newFiber === null) continue;
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
        // 如果previousNewFiber为null，说明这是第一个fiber
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          // 否则说明不是大儿子，就把这个newFiber添加到上一个子节点的后面
          previousNewFiber.sibling = newFiber;
        }
        // 让newFiber成为最后一个或者说上一个子fiber
        previousNewFiber = newFiber;
      }
    }

    // 开始处理移动的情况
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
    // 开始遍历剩下的虚拟DOM子节点
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = updateFromMap(existingChildren, returnFiber, newIndex, newChildren[newIndex]);
      if (newFiber !== null) {
        if (shouldTracksSideEffects) {
          // 如果要跟踪副作用，并且有老fiber
          if (newFiber.alternate !== null) {
            existingChildren.delete(newFiber.key === null ? newIndex : newFiber.key);
          }
        }
        // 指定新的fiber存放位置，并且给lastPlacedIndex赋值
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
        // 如果previousNewFiber为null，说明这是第一个fiber
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          // 否则说明不是大儿子，就把这个newFiber添加到上一个子节点的后面
          previousNewFiber.sibling = newFiber;
        }
        // 让newFiber成为最后一个或者说上一个子fiber
        previousNewFiber = newFiber;
      }
    }
    if (shouldTracksSideEffects) {
      // 等全部处理完之后，删除map中所有剩下的老fiber
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
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

  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    // 指定新的fiber在新的挂载索引
    newFiber.index = newIndex;
    if (!shouldTracksSideEffects) return lastPlacedIndex;
    // 获取它的老fiber
    const current = newFiber.alternate;
    // 如果有，说明这是一个更新的节点，有老的真实DOM
    if (current !== null) {
      const oldIndex = current.index;
      // 如果找到的老fiber的索引并lastPlacedIndex要小,则老fiber对应的DOM节点需要移动
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      // 如果没有，说明这是一个新的节点，需要插入
      newFiber.flags |= Placement;
      return lastPlacedIndex;
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

  /**
   * 复用老fiber
   * @param {*} fiber
   * @param {*} pendingProps
   * @returns
   */
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

  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (newChild !== null && typeof newChild === 'object') {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          // 如果key一样，就进入更新元素的逻辑
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
        default:
          return null;
      }
    }
    return null;
  }

  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      // 判断是否类型一样，则表示key和type都一样，可以复用老的fiber和真实DOM
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
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

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      // 如果有key用key，如果没有key就使用索引
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  function updateFromMap(existingChildren, returnFiber, newIndex, newChild) {
    if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
      const matchedFiber = existingChildren.get(newIndex) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild);
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber = existingChildren.get(newChild.key === null ? newIndex : newChild.key) || null;
          return updateElement(returnFiber, matchedFiber, newChild);
        }
      }
    }
  }

  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  return reconcilerChildFibers;
}

export const reconcileChildFibers = createChildReconciler(true); //  有老fiber 更新的时候用这个
export const mountChildFibers = createChildReconciler(false); // 没有老fiber 初次挂载用这个
