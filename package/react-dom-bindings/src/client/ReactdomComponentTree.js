const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropKey = '__reactProps$' + randomKey;

/**
 * 从真实的DOM节点上获取它对应的fiber节点
 * @param {*} targetNode
 */
export function getCloseInstanceFromNode(targetNode) {
  const targetInstance = targetNode[internalInstanceKey];
  return targetInstance;
}

/**
 * 提前缓存fiber节点的实例到DOM节点上
 * @param {*} hostInstance - fiber实例
 * @param {*} node - 真实DOM
 */
export function precacheFiberNode(hostInstance, node) {
  node[internalInstanceKey] = hostInstance;
}

export function updateFiberProps(node, props) {
  node[internalPropKey] = props;
}

export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropKey] || null;
}