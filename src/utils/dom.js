let root = null;

const getRoot = () => {
  if (!root) {
    root = document.getElementById('root');
  }
  return root;
};

export const makeCanvas = attributes => {
  const attributeKeys = Object.keys(attributes);
  const canvas = document.createElement('canvas');
  for (let i = 0; i < attributeKeys.length; i++) {
    const key = attributeKeys[i];
    canvas.setAttribute(key, attributes[key]);
  }
  canvas.innerText = 'Please use a browser that supports HTML5 Canvas';
  getRoot().appendChild(canvas);
};
