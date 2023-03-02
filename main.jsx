import { createRoot } from 'react-dom/client';
import { useReducer, useState } from 'react';

function counter(state, action) {
  if (action.type === 'add') return state + action.payload;
  return state;
}

function FunctionComponent() {
  console.log('~~~~FunctionComponent render~~~~~~');
  const [num1, setNum] = useState(0);
  return num1 === 0 ? (
    <ul key='container' onClick={() => setNum(num1 + 1)}>
      <li key='A'>A</li>
      <li key='B'>B</li>
      <li key='C'>C</li>
    </ul>
  ) : (
    <ul key='container' onClick={() => setNum(num1 + 1)}>
    <li key='A'>A</li>
    <p key='B'>B</p>
    {/* <li key='C'>C</li> */}
  </ul>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
// console.log(root);
root.render(element);
