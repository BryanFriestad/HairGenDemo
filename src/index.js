import example from 'example';
import demo from 'demo';
import { makeCanvas } from 'utils/dom';
import { setupForm } from 'utils/controls';

function onWindowLoad() {
  makeCanvas({
    id: 'theCanvas',
    width: 600,
    height: 400,
  });

  setupForm();
  demo();
}

window.addEventListener('load', onWindowLoad);
