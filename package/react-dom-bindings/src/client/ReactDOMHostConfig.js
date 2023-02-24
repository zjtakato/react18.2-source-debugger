import { setInitialProperties } from './ReactDOMComponent';
export function shouldSetTextContent(type, props) {
  return typeof props.children === 'string' || typeof props.children === 'number';
}

export function createTextInstance(content) {
  return document.createTextNode(content);
}

export function createInstance(type, props) {
  const domElement = document.createElement(type);
  // TODO: 属性的添加
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
