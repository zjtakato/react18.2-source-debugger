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
      <li key='A' id='A'>A</li>
      <li key='B' id='B'>B</li>
      <li key='C' id='C'>C</li>
    </ul>
  ) : (
    <ul key='container' onClick={() => setNum(num1 + 1)}>
      <li key='B' id='B2'>B2</li>
    </ul>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
// console.log(root);
root.render(element);
