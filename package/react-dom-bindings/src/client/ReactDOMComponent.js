import { setValueForStyles } from './CSSPropertyOperations';
import setTextContent from './setTextContent';
import { setValueForProperty } from './DOMPropertyOperations';

const STYLE = 'style';
const CHILDREN = 'children';

/**
 * 设置初始属性
 */
export function setInitialProperties(domElement, tag, props) {
  setInitalDOMProperties(tag, domElement, props);
}

function setInitalDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey];
      if (propKey === STYLE) {
        setValueForStyles(domElement, nextProp);
      } else if (propKey === CHILDREN) {
        if (typeof nextProp === 'string') {
          setTextContent(domElement, nextProp);
        } else if (typeof nextProp === 'number') {
          setTextContent(domElement, `${nextProp}`);
        }
      } else if (nextProp !== null) {
        setValueForProperty(domElement, propKey, nextProp);
      }
    }
  }
}
