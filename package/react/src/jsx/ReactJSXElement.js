import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import hasOwnProperty from 'shared/hasOwnProperty';

/**
 * 保留的props
 */
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

/**
 * React18 jsx --> ReactElement
 *  - 旧版的React是使用React.createElement
 * @param {*} type
 * @param {*} config
 */
export function jsxDEV(type, config, maybeKey) {
  const props = {}; // 属性对象
  let key = null; // 用于区分父节点下的不同子节点的标识
  let ref = null; // 引入，可以通过ref获取真实DOM
  // React17以前转换函数中的key是放在config里的，第三个参数放child
  // React17之后转换函数中的key是放在第三个参数里的，child放在config里
  if(typeof maybeKey !== 'undefined') {
    key = maybeKey;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }
  for (const propName in config) {
    if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
      props[propName] = config[propName];
    }
  }
  return ReactElement(type, key, ref, props);
}

/**
 * 创建虚拟DOM
 * @param {*} type - 标签类型
 * @param {*} key - 唯一标识
 * @param {*} ref - 用来获取真实DOM
 * @param {*} props - 属性
 * @returns
 */
function ReactElement(type, key, ref, props) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };
}

/**
 * 验证ref是否合法
 * @param {*} config
 * @returns {boolean}
 */
function hasValidRef(config) {
  return config.ref !== undefined;
}
