// React 在DOM diff的时候会计算要执行的操作

export const NoFlags = 0b00000000000000000000000000;
export const Placement = 0b00000000000000000000000010;
export const Update = 0b00000000000000000000000100;
export const ChildDeletion = 0b000000000000000000000010000; // 有子fiber需要被删除
export const Passive = 0b000000000000000100000000000; // 1024
export const LayoutMask = Update;

// export const NoFlags = /*                      */ 0b000000000000000000000000000;
// export const Placement = /*                    */ 0b000000000000000000000000010;
// export const Update = /*                       */ 0b000000000000000000000000100;
// export const ChildDeletion = /*                */ 0b000000000000000000000010000;
export const MutationMask = Placement | Update | ChildDeletion;
