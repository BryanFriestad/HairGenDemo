import example from './example';
import demo from './demo';
import { makeCanvas } from './utils/dom';

function onWindowLoad() {
  makeCanvas({
    id: 'theCanvas',
    width: 600,
    height: 400,
    style: 'position: absolute; top: 0px; left:0px;',
  });

  demo();
}

window.addEventListener('load', onWindowLoad);
