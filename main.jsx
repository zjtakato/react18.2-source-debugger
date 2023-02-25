import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  return (
    <h1
      onClick={(event) => {
        console.log('ParentBubble');
      }}
      onClickCapture={(event) => {
        console.log('ParentCapture');
        event.stopPropagation();
      }}
    >
      <span
        onClick={(event) => {
          console.log('ChildBubble');
          event.stopPropagation();
        }}
        onClickCapture={(event) => {
          console.log('ChildCapture');
        }}
        style={{ color: 'red' }}
      >
        word
      </span>
    </h1>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
console.log(root);
root.render(element);
