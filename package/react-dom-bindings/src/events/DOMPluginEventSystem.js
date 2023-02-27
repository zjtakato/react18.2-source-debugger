import { allNaviteEvents } from './EventRegistry';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import { addEventCaptureListener, addEventBubbleListener } from './EventListener';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import getEventTarget from './getEventTarget';
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';
import getListener from './getListener';

SimpleEventPlugin.registerEvents();

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(rootContainerElement) {
  // 监听根容器，也就是div#root只监听一次
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    // 遍历所有原生的事件比如click，进行监听
    allNaviteEvents.forEach((domEventName) => {
      listenToNativeEvent(domEventName, true, rootContainerElement);
      listenToNativeEvent(domEventName, false, rootContainerElement);
    });
  }
}

/**
 * 注册原生事件
 * @param {*} domEventName - 原生事件
 * @param {*} isCapturePhaseListener - 是否捕获阶段
 * @param {*} target - 目标节点（容器节点）
 */
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  let eventSystemFlags = 0; // 事件系统的标识， 默认是0 为冒泡 4 是捕获
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}

function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
  const listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags);
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}

export function dispatchEventForPluginEvntSystem(domEventName, eventSystemFlags, nativeEvent, targetInstance, targetContianer) {
  dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInstance, targetContianer);
}

function dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInstance, targetContianer) {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const dispatchQueue = []; // 派发事件的数组
  extractEvents(
    dispatchQueue, //
    domEventName, //
    targetInstance, //
    nativeEvent, //
    nativeEventTarget, //
    eventSystemFlags, //
    targetContianer //
  );
  // console.log('dispatchQueue', dispatchQueue);
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}

function extractEvents(
  dispatchQueue,
  domEventName, //
  targetInstance, //
  nativeEvent, //
  nativeEventTarget, //
  eventSystemFlags, //
  targetContianer
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName, //
    targetInstance, //
    nativeEvent, //
    nativeEventTarget, //
    eventSystemFlags, //
    targetContianer
  );
}

export function accumulateSinglePhaseListeners(
  targetFiber, //
  reactName, //
  nativeEventType, //
  isCapturePhase //
) {
  const captrureName = reactName + 'Capture';
  const reactEventName = isCapturePhase ? captrureName : reactName;
  const listeners = [];
  let instance = targetFiber;
  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      if (reactEventName !== null) {
        const listener = getListener(instance, reactEventName);
        if (listener) {
          listeners.push(createDispatchListener(instance, listener, stateNode));
        }
      }
    }
    instance = instance.return;
  }
  return listeners;
}

function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0; // 判断是否在捕获阶段
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
  }
}

function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
  if (inCapturePhase) {
    // dispatchListeners [子, 父]
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  } else {
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  }
}

function createDispatchListener(instance, listener, currentTarget) {
  return { instance, listener, currentTarget };
}

function executeDispatch(event, listener, currentTarget) {
  // 合成事件实例的currentTarget是在不断的变化的
  // event nativeEventTarget 它的是原始的事件源，是永远不变的
  // event currentTarget 当前的事件源，它是会随着事件回调的执行不断变化的
  event.currentTarget = currentTarget;
  listener(event);
}
