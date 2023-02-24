import { createFiberRoot } from './createFiberRoot';
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQuene';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

/**
 * 更新容器，把虚拟DOM 变成真实DOM 插入到容器中
 * @param {*} ReactElement  - 虚拟DOM
 * @param {*} container - 容器(真实DOM)
 */
export function updateContainer(ReactElement, container) {
  const current = container.current; // 从container 拿到根fiber
  const update = createUpdate(); // 创建更新
  update.payload = { element: ReactElement }; // 要更新的虚拟DOM
  const root = enqueueUpdate(current, update); // 把此更新添加到根fiber的更新队列上
  scheduleUpdateOnFiber(root); // 在fiber上调度更新
}
