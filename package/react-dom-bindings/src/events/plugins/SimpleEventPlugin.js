import { registerSimpleEvents, topLevelEventsToReactNames } from '../DOMEventProperties';
import { IS_CAPTURE_PHASE } from '../EventSystemFlags';
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem';
import { SyntheicMouseEvent } from '../SyntheticEvent';

/**
 * 提取事件， 把要执行的回调函数添加到dispatchQueue
 * @param {*} dispatchQueue 派发队列 放置监听函数
 * @param {*} domEventName DOM事件名 click
 * @param {*} targetInstance 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags 事件系统标题 0 标识冒泡 4表示捕获
 * @param {*} targetContianer 目标容器 div#root
 */
export function extractEvents(
  dispatchQueue,
  domEventName, //
  targetInstance, //
  nativeEvent, //
  nativeEventTarget, //
  eventSystemFlags, //
  targetContianer
) {

  let SyntheticEventCtor; // 合成事件的构建函数
  switch(domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheicMouseEvent;
  }

  const reactName = topLevelEventsToReactNames.get(domEventName); // click => onClick
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0; // 判断是否是捕获阶段
  const listeners = accumulateSinglePhaseListeners(
    targetInstance, //
    reactName, //
    nativeEvent.type, //
    isCapturePhase //
  );
  // 如果有要执行的监听函数的话[onClickCapture, onClickCapture] = [ChildCapture, ParentCapture];
  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(reactName, domEventName, null, nativeEvent, nativeEventTarget);
    // const event = new SyntheticEventCtor(reactName, domEventName, targetInstance, nativeEvent.type, nativeEvent.target);
    dispatchQueue.push({
      event, // 合成事件实例
      listeners, // 监听函数数组
    });
  }
  console.log(eventSystemFlags, listeners);
}

export { registerSimpleEvents as registerEvents };
