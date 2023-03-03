import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';
import { Passive as PassiveEffect, Update as UpdateEffect } from './ReactFiberFlags';
import { HasEffect as HookHasEffect, Passive as HookPassive, Layout as HookLayout } from './ReactHookEffectTags';

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
};

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
};

/**
 * 渲染函数组件
 * @param {*} current  - 老fiber
 * @param {*} workInProgress - 新fiber
 * @param {*} Component - 组件定义
 * @param {*} props - 组件属性
 * @returns 虚拟DOM
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress; // Function组件对于的fiber
  workInProgress.updateQueue = null;
  // 如果有老的fier,并且有老的hook链表
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // 需要在函数组件执行前给ReactCurrentDispatcher.current赋值
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return children;
}

/**
 * 挂载构建中的hook
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, // hook的初始状态
    queue: null, // 存放本hook的更新队列 ququq.pending = update的循环链表
    next: null, // 指向下一个hook，一个函数可能会有多个hook，他们会组成一个单向链表
  };
  if (workInProgressHook === null) {
    // 当前函数对于的fiber的状态等于第一个hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }
  return workInProgressHook;
}

/**
 * 构建新的hooks
 */
function updateWorkInProgressHook() {
  // 获取将要构建的新的hook的老hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  // 根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

// useState 其实就是一个内置了reducer的useReducer
function baseStateReducer(state, action) {
  const newState = typeof action === 'function' ? action(state) : action;
  return newState;
}

// #region ----- start useReducer -----

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
    dispatch: null,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

function updateReducer(reducer) {
  // 获取新的hook
  const hook = updateWorkInProgressHook();
  // 获取新的hook的更新队列
  const queue = hook.queue;
  // 获取老的hook
  const current = currentHook;
  // 获取将要生效的更新队列
  const pendingQueue = queue.pending;
  // 初始化一个新状态，取值为当前的状态
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    do {
      if (update.hasEagerState) {
        newState = update.eagerState;
      } else {
        const action = update.action;
        newState = reducer(newState, action);
      }
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

/**
 * 执行派发动作的方法，更新状态，并且让界面重写更新
 * @param {*} fiber - function 对应的fiber
 * @param {*} queue - hook对应的更新队列
 * @param {*} action - 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  // 在每个hook里都会存放一个更新队列，更新队列是一个更新对象的循环链表 update1.next = update2.next = update.next
  const update = {
    action,
    next: null,
  };
  // 把当前最新的更新添加到更新队列中，并返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  console.log('~~~~~~~~~开始更新调度~~~~~~~~~~~~');
  scheduleUpdateOnFiber(root); // 让reconciler重新调度渲染
}

//#endregion ----- end useReducer -----

//#region  ----- start useState -----

function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderdReducer: baseStateReducer, // 上一个reducer
    lastRenderdState: initialState,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

function updateState() {
  return updateReducer(baseStateReducer);
}

function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    next: null,
    hasEagerState: false, // 是否有急切的更新
    eagerState: null, // 急切的更新状态
  };
  // 当派发状态后，立刻用上一次的状态和上一次的reducer计算新状态
  const { lastRenderdReducer, lastRenderdState } = queue;
  const eagerState = lastRenderdReducer(lastRenderdState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  // 如果新状态和老状态一致，那就不进行调度更新
  if (Object.is(eagerState, lastRenderdState)) {
    return;
  }
  // 下面是真正的入队更新并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

//#endregion ----- end useState -----

//#region  ----- start effect -----
function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags; // 给当前的函数组件fiber添加flags
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps);
}

/**
 * 添加effect链表
 * @param {*} tag - effect的标签
 * @param {*} create - 创建方法
 * @param {*} destory - 销毁方法
 * @param {*} deps - 依赖数组
 */
function pushEffect(tag, create, destory, deps) {
  const effect = {
    tag,
    create,
    destory,
    deps,
    next: null,
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
  };
}

function updateEffect(create, deps) {
  return updateEffectImp(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImp(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destory;
  // 上一个老hook
  if (currentHook !== null) {
    // 获取此useEffect这个Hook上的老的effect对象 create deps destory
    const prevEffect = currentHook.memoizedState;
    destory = prevEffect.destory;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      // 用新数组和老数组进行对比
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 不管要不要重新执行，都需要把新的effec组成完整的循环链表放到fiber.updateQueue中
        hook.memoizedState = pushEffect(hookFlags, create, destory, nextDeps);
        return;
      }
    }
  }
  // 如果要执行的话需要改变fiber的flags
  currentlyRenderingFiber.flags |= fiberFlags;
  // 如果要执行的话 添加 HookHasEffect flags
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, destory, nextDeps);
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return null;
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

//#endregion  ----- end useState -----

//#region  ---- start layoutEffect ----
function mountLayoutEffect(create, deps) {
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function updateLayoutEffect(create, deps) {
  return updateEffectImp(UpdateEffect, HookLayout, create, deps);
}
//#endregion ---- end layoutEffect
