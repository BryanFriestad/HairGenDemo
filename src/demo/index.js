import Scene from 'utils/Scene';

import { ConstraintContainer } from 'utils/Constraint';
import { getModelData } from 'utils/Geometry';
import Vector from 'utils/Vector';
import HairyMesh from 'utils/HairyMesh';

import * as THREE from 'three';

import VSHADER_SOURCE from './vshader.glsl';
import FSHADER_SOURCE from './fshader.glsl';
import VSHADER_SOURCE_LINES from './vshader_lines.glsl';
import FSHADER_SOURCE_LINES from './fshader_lines.glsl';
import CheckerBoard from './check64.png';

import { blonde } from 'utils/hairColors';
import { getSettings, defaultHandleKeyup, defaultHandleKeydown } from 'utils/controls';

const sphereModel = getModelData(new THREE.SphereGeometry(1, 8, 8));
const scalpModel = getModelData(new THREE.SphereGeometry(1, 12, 12, 2, 4.3, 1, 2)); //this is a good mesh for the scalp (for hair extrusion, but not rendering)
const highDensitySphereModel = getModelData(new THREE.SphereGeometry(1, 12, 12));
const cubeModel = getModelData(new THREE.CubeGeometry(1, 1, 1, 1, 1, 1));
const planeModel = getModelData(new THREE.PlaneGeometry());

// Initialize constraint container for global storage of constraints
let constraintContainer = new ConstraintContainer();

const imageFilename = CheckerBoard;

let scene;
let resetScene = () => {};

function resetConstraints() {
  constraintContainer = new ConstraintContainer();
}

function defaultAnimation(delta) {
  constraintContainer.solve();
  scene.meshes.forEach(mesh => mesh.update(delta));

  const { velocity, axis, paused, moveSpeed } = getSettings();

  scene.meshes.forEach(mesh => {
    const currentPosition = new Vector(mesh.object.position.elements);
    const velocityVector = new Vector(velocity);
    const newPosition = currentPosition.add(velocityVector.normalize().scale(moveSpeed));
    if (currentPosition.equals(newPosition)) return;
    mesh.object.setPosition(...newPosition.items);
  });

  let increment = 1.5 * 60 * delta;
  if (!paused) {
    switch (axis) {
      case 'x':
        scene.meshes.forEach(mesh => mesh.object.rotateX(increment));
        break;
      case 'y':
        scene.meshes.forEach(mesh => mesh.object.rotateY(increment));
        break;
      case 'z':
        scene.meshes.forEach(mesh => mesh.object.rotateZ(increment));
        break;
      default:
    }
  }
}

function defaultInitScene(sceneConfig, addObjects) {
  if (scene) scene.end();
  scene = new Scene(sceneConfig);
  scene.addShader({
    name: 'demoMesh',
    vshaderSource: VSHADER_SOURCE,
    fshaderSource: FSHADER_SOURCE,
  });
  scene.addShader({
    name: 'hair',
    vshaderSource: VSHADER_SOURCE_LINES,
    fshaderSource: FSHADER_SOURCE_LINES,
  });

  addObjects(scene);

  scene.addImage(imageFilename);
  scene.start();
}

const scene1config = {
  init() {
    const params = {
      additionalAnimation: defaultAnimation,
      additionalSetup() {},
      additionalHandleKeydown: defaultHandleKeydown,
      additionalHandleKeyup: defaultHandleKeyup,
    };
    defaultInitScene(params, theScene => (theScene.meshes = [new HairyMesh(sphereModel, 'sphere1', theScene, { constraintContainer })]));
  },
};

const scene2config = {
  init() {
    const params = {
      additionalAnimation: defaultAnimation,
      additionalSetup() {},
      additionalHandleKeydown: defaultHandleKeydown,
      additionalHandleKeyup: defaultHandleKeyup,
    };
    defaultInitScene(
      params,
      theScene =>
        (theScene.meshes = [
          new HairyMesh(sphereModel, 'sphere1', theScene, { position: [-2, 0, 0], constraintContainer }),
          new HairyMesh(cubeModel, 'cube1', theScene, { position: [2, 0, 0], constraintContainer }, blonde),
        ])
    );
  },
};

const scene3config = {
  init() {
    const params = {
      additionalAnimation: defaultAnimation,
      additionalSetup() {},
      additionalHandleKeydown: defaultHandleKeydown,
      additionalHandleKeyup: defaultHandleKeyup,
    };
    defaultInitScene(params, theScene => (theScene.meshes = [new HairyMesh(scalpModel, 'head', theScene, { constraintContainer })]));
  },
};

function createSceneTab(sceneConfig, label) {
  const tab = document.createElement('button');
  tab.addEventListener('click', () => {
    resetScene = () => {
      resetConstraints();
      sceneConfig.init();
    };
    resetScene();
  });
  tab.innerText = label;
  return tab;
}

export default function demo() {
  const scene1Tab = createSceneTab(scene1config, 'Scene 1');
  const scene2Tab = createSceneTab(scene2config, 'Scene 2');
  const scene3Tab = createSceneTab(scene3config, 'Scene 3');
  const tabBar = document.getElementById('tab-bar');
  tabBar.appendChild(scene1Tab);
  tabBar.appendChild(scene2Tab);
  tabBar.appendChild(scene3Tab);
  scene1config.init();
}
