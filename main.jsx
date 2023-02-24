import { createRoot } from 'react-dom/client';
const h1 = (
  <h1>
    hello <span style={{ color: 'red' }}>worl123d</span>
  </h1>
);
const root = createRoot(document.getElementById('root'));
console.log(root);
root.render(h1);
