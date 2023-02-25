import assign from 'shared/assign';

const MouseEventInterface = {
  clientX: 0,
  clientY: 0,
};

function createtSyntheticEvent(inter) {
  /**
   * 合成事件的基类
   * @param {*} reactName React属性名 onClick
   * @param {*} reactEventType click
   * @param {*} targetInstance 事件源对应的fiber实例
   * @param {*} nativeEvent  原生事件对象
   * @param {*} nativeEventTarget 原生事件源 span 事件源对应的真实DOM
   */
  function SyntheticBaseEvent(reactName, reactEventType, targetInstance, nativeEvent, nativeEventTarget) {
    this._reactName = reactName;
    this.type = reactEventType;
    this._targetInstance = targetInstance;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;
    // 把此接口上对应的属性从原始事件上拷贝到合成事件实例上
    for (const propName in inter) {
      if (!inter.hasOwnProperty(propName)) {
        continue;
      }
      this[propName] = nativeEvent[propName];
    }
    this.isDefaultPrevented = functionThatReturnsTrue; // 是否已经阻止默认事件
    this.isPropagationStopped = functonThatReturnsFlase; // 是否已经阻止继续传播
    return this;
  }
  assign(SyntheticBaseEvent.prototype, {
    preventDefault() {
      const event = this.nativeEvent;
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = false;
      }
      this.isDefaultPrevented = functionThatReturnsTrue;
    },
    stopPropagation() {
      const event = this.nativeEvent;
      if (event.preventDefault) {
        event.stopPropagation();
      } else {
        event.cancelBubble = false;
      }
      this.isPropagationStopped = functionThatReturnsTrue;
    },
  });
  return SyntheticBaseEvent;
}

export const SyntheicMouseEvent = createtSyntheticEvent(MouseEventInterface);

function functionThatReturnsTrue() {
  return true;
}

function functonThatReturnsFlase() {
  return false;
}
