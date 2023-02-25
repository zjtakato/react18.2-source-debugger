import getEventTarget from './getEventTarget';
import { getCloseInstanceFromNode } from '../client/ReactdomComponentTree';
import { dispatchEventForPluginEvntSystem } from './DOMPluginEventSystem'

export function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
  const listenerWrapper = dispatchDiscreateEvent;
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}

/**
 * 派发离散的事件的监听函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器 div#root
 * @param {*} nativeEvent 原生的事件
 */
function dispatchDiscreateEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
}

/**
 * 此方法就是委托给容器的回调，当容器#root在捕获或者冒泡节点处理事件的时候，会执行此函数
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} targetContainer
 * @param {*} nativeEvent
 */
export function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent);
  const targetInstance = getCloseInstanceFromNode(nativeEventTarget);
  dispatchEventForPluginEvntSystem(
    domEventName, // click
    eventSystemFlags, // 0 4
    nativeEvent, // 原始事件
    targetInstance, // 此真实DOM对应的fiber
    targetContainer // 目标容器
  );
}
