import * as hairColors from 'utils/hairColors';

let axis = 'y';
let paused = true;
let is_mesh = true;
let hairDensity = 5;
let moveSpeed = 0.1;
let bezRes = 4;
let velocity = [0, 0, 0];
let hairColor = hairColors.blonde;
let hairLength = 4.5;

export const getSettings = () => ({
  axis,
  paused,
  is_mesh,
  hairDensity,
  hairLength,
  moveSpeed,
  velocity,
  hairColor,
  bezRes,
});

export function defaultHandleKeydown(event, ch) {
  switch (ch) {
    case ' ':
      paused = !paused;
      event.preventDefault();
      return false;
    case 'x':
      axis = 'x';
      break;
    case 'y':
      axis = 'y';
      break;
    case 'z':
      axis = 'z';
      break;
    case 'm':
      is_mesh = !is_mesh;
      break;
    case 'w':
      velocity[2] = -1;
      break;
    case 'a':
      velocity[0] = -1;
      break;
    case 's':
      velocity[2] = 1;
      break;
    case 'd':
      velocity[0] = 1;
      break;
    case 'q':
      velocity[1] = 1;
      break;
    case 'e':
      velocity[1] = -1;
      break;
  }
}

export function defaultHandleKeyup(event, ch) {
  switch (ch) {
    case 'w':
      velocity[2] = 0;
      break;
    case 'a':
      velocity[0] = 0;
      break;
    case 's':
      velocity[2] = 0;
      break;
    case 'd':
      velocity[0] = 0;
      break;
    case 'q':
      velocity[1] = 0;
      break;
    case 'e':
      velocity[1] = 0;
      break;
  }
}

export function setupForm() {
  const hairDensitySlider = document.getElementById('hair-density-slider');
  const moveSpeedSlider = document.getElementById('move-speed-slider');
  const bezResSlider = document.getElementById('bez-res-slider');
  const hairLengthSlider = document.getElementById('hair-length-slider');
  const hairColorSelect = document.getElementById('hair_color_select');

  hairDensitySlider.addEventListener('change', e => {
    const value = e.target.value;
    hairDensity = value;
  });

  moveSpeedSlider.addEventListener('change', e => {
    const value = e.target.value;
    moveSpeed = value;
  });

  hairLengthSlider.addEventListener('change', e => {
    const value = e.target.value;
    hairLength = value;
  });

  bezResSlider.addEventListener('change', e => {
    const value = e.target.value;
    bezRes = value;
  });

  const hairColorKeys = Object.keys(hairColors);
  for (let i = 0; i < hairColorKeys.length; i++) {
    const key = hairColorKeys[i];
    const option = document.createElement('option');
    option.setAttribute('value', key);
    option.innerText = key;
    hairColorSelect.appendChild(option);
  }
  hairColorSelect.addEventListener('change', e => {
    hairColor = hairColors[e.target.value];
  });
}
