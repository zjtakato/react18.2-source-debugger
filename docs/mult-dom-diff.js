let existingChildren = new Map();
existingChildren.set('B', 'B_Fiber');
existingChildren.set('C', 'B_Fiber');
existingChildren.set('D', 'B_Fiber');
existingChildren.set('E', 'B_Fiber');
existingChildren.set('F', 'B_Fiber');

let lastPlacedIndex = 0;
let newChildren = ['C', 'E', 'B', 'G', 'D'];
for (let i = 0; i < newChildren.length; i++) {
  let newChild = newChildren[i];
  let exis = existingChildren.get(newChild);
  if (exis) {
    existingChildren.delete(newChild);
  }
}
