import { createRoot } from 'react-dom/client';
import { useReducer } from 'react';

function counter(state, action) {
  if (action.type === 'add') return state + action.payload;
  return state;
}

function FunctionComponent() {
  const [count, setCount] = useReducer(counter, 0);
  const [count1, setCount1] = useReducer(counter, 0);
  let attrs = { id: 'btn' };
  if (count === 6) {
    delete attrs.id;
    attrs.style = { color: 'red' };
  }
  return (
    <button
      {...attrs}
      onClick={() => {
        setCount({ type: 'add', payload: 1 }); // update1
        setCount({ type: 'add', payload: 2 }); // update2
        setCount({ type: 'add', payload: 3 }); // update3
        // update1 -> update2 -> update3 -> update1
      }}
    >
      {count}
    </button>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
console.log(root);
root.render(element);
