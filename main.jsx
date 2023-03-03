import { createRoot } from 'react-dom/client';
import { useEffect, useLayoutEffect, useReducer, useState } from 'react';

function counter(state, action) {
  if (action.type === 'add') return state + action.payload;
  return state;
}

function FunctionComponent() {
  const [number, setNumer] = useState(0);
  useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('useEffect1 destory');
    };
  }, []);
  useLayoutEffect(() => {
    console.log('useLayoutEffect2');
    return () => {
      console.log('useLayoutEffect2 destory');
    };
  });
  useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('useEffect3 destory');
    };
  });
  return <button onClick={() => setNumer(number + 1)}>{number}</button>;
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
// console.log(root);
root.render(element);
