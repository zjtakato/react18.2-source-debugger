import { getFiberCurrentPropsFromNode } from "../client/ReactdomComponentTree";

/**
 * 获取此fiber上对应的回调函数
 * @param {*} instance 
 * @param {*} registrationName 
 */
export default function getListener(instance, registrationName){
  const { stateNode } = instance;
  if(stateNode === null) return null;
  const props = getFiberCurrentPropsFromNode(stateNode);
  if(props === null) return null;
  const listener = props[registrationName];
  return listener;
}