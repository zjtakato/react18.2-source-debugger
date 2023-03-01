import { setInitialProperties, diffProperties, updateProperties } from './ReactDOMComponent';
import { precacheFiberNode, updateFiberProps } from './ReactdomComponentTree';
export function shouldSetTextContent(type, props) {
  return typeof props.children === 'string' || typeof props.children === 'number';
}

export function createTextInstance(content) {
  return document.createTextNode(content);
}

/**
 * 在原始组件初次挂载的时候，会通过此方法创建真实DOM
 * @param {*} type - 类型 span
 * @param {*} props - 属性
 * @param {*} internalInstanceHandle 对应的fiber
 * @returns
 */
export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  // 预先缓存fiber节点到DOM元素上
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props); // 把属性直接保存在domElement的属性上
  return domElement;
}

/**
 * 挂载新节点
 */
export function appendInitalChild(parent, child) {
  parent.appendChild(child);
}

export function finalizeInitailChildren(domElement, type, props) {
  setInitialProperties(domElement, type, props);
}

export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}
export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}

export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps);
}

export function commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  updateFiberProps(domElement, newProps);
}

export function removeChild(parentInstance, child){
  parentInstance.removeChild(child);
}