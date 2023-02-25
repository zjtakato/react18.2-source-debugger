export const allNaviteEvents = new Set();

/**
 * 注册两个阶段的事件
 * 当再页面触发事件的时候，会走事件处理函数
 * 事件处理函数需要找到DOM元素对应的要执行的React事件 如onClick onClickCapture
 * @param {*} registrationName - React事件名
 * @param {*} dependencies - 原生事件数组 [click]
 */
export function registerTwoPhaseEevent(registrationName, dependencies) {
  registerDirectEvent(registrationName, dependencies); // 注册事件冒泡的对应关系
  registerDirectEvent(registrationName + 'Capture', dependencies); // 注册捕获事件的对应关系
}

export function registerDirectEvent(registrationName, dependencies) {
  for (let i = 0; i < dependencies.length; i++) {
    allNaviteEvents.add(dependencies[i]);
  }
}
