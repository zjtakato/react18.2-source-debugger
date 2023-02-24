import { createHostRootFiber } from './ReactFiber'
import { initialUpdateQuene } from './ReactFiberClassUpdateQuene'

export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo); // Root指根容器（真实DOM节点）
  const uninitializedFiber = createHostRootFiber(); // HostRoot指得就是根节点div#root
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  initialUpdateQuene(uninitializedFiber);
  return root;
}

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
}
