import example from './example';
import { makeCanvas } from './utils/dom';

function onWindowLoad() {
  makeCanvas({
    id: 'theCanvas',
    width: 400,
    height: 400,
  });

  example();
}

window.addEventListener('load', onWindowLoad);
