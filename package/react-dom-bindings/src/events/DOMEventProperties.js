import { registerTwoPhaseEevent } from './EventRegistry';

const simpleEventPluginEvents = ['click'];

export const topLevelEventsToReactNames = new Map();

export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i];
    const domEventName = eventName.toLowerCase(); // click
    const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1); // Click
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`);
  }
}

function registerSimpleEvent(domEventName, reactName) {
  // onClick在哪里可以找到? 让真实DOM updateFiberProps(domElenemt, props);
  // const internalPropsKey = '__reactProps$' + randomKey;
  // 真实DOM元素[internalPropsKey] = props; props.onClick

  topLevelEventsToReactNames.set(domEventName, reactName); // 把原生事件名和处理函数的名字进行映射或绑定 click => onClick
  registerTwoPhaseEevent(reactName, [domEventName]);
}
