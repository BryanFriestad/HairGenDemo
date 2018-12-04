import Scene from 'utils/Scene';
import { Matrix4, Vector4 } from 'lib/cuon-matrix';
import { getWebGLContext, initShaders } from 'lib/cuon-utils';

import VerletParticle from 'utils/VerletParticle';
import { ConstraintContainer } from 'utils/Constraint';
import HairStrand from 'utils/Hair';
import HairyObject from 'utils/HairyObject';
import { getModelData, makeNormalMatrixElements } from 'utils/Geometry';

import * as THREE from 'three';

import VSHADER_SOURCE from './vshader.glsl';
import FSHADER_SOURCE from './fshader.glsl';
import VSHADER_SOURCE_LINES from './vshader_lines.glsl';
import FSHADER_SOURCE_LINES from './fshader_lines.glsl';
import CheckerBoard from './check64.png';

let theModel = getModelData(new THREE.SphereGeometry(1, 8, 8));
// let theModel = getModelData(new THREE.CubeGeometry(1, 1, 1, 1, 1, 1));
//let theModel = getModelData(new THREE.PlaneGeometry());

// Initialize constraint container for global storage of constraints
const constraintContainer = new ConstraintContainer();

const imageFilename = CheckerBoard;

// light and material properties, remember this is column major

// generic white light
var lightPropElements = new Float32Array([
  ...[0.2, 0.2, 0.2],
  ...[0.7, 0.7, 0.7],
  ...[0.7, 0.7, 0.7],
]);

//very fake looking white, useful for testing lights
// light and material properties, remember this is column major

const matPropElements = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1]);
const shininess = 20.0;

let axis = 'y';
let paused = true;

let lightPosition = new Vector4([-4, 4, 4, 1]);

const cube = new HairyObject({
  drawFunction: drawCube,
  modelData: theModel,
  drawHairFunction: drawHair,
  hairDensity: 0,
  constraintContainer,
});
const cubeScale = 2;
cube.setScale(cubeScale, cubeScale, cubeScale);

const scene = new Scene({
  additionalAnimation(delta) {
    constraintContainer.solve();
    cube.update(delta);

    let increment = 1.5 * 60 * delta;
    if (!paused) {
      switch (axis) {
        case 'x':
          cube.rotateX(increment);
          axis = 'x';
          break;
        case 'y':
          axis = 'y';
          cube.rotateY(increment);
          break;
        case 'z':
          axis = 'z';
          cube.rotateZ(increment);
          break;
        default:
      }
    }
  },
  additionalSetup() {
    constraintContainer.generatePPConstraints(cube.getParticles(false));
  },
  additionalHandleKeypress(event, ch) {
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
    }
  },
});

scene.addObject(cube);
scene.addShader({
  name: 'cube',
  vshaderSource: VSHADER_SOURCE,
  fshaderSource: FSHADER_SOURCE,
});
scene.addShader({
  name: 'hair',
  vshaderSource: VSHADER_SOURCE_LINES,
  fshaderSource: FSHADER_SOURCE_LINES,
});

scene.addBuffer({
  name: 'cube_vertex',
  bufferData: theModel.vertices,
});
scene.addBuffer({
  name: 'cube_vertex_normal',
  bufferData: theModel.vertexNormals,
});
scene.addBuffer({
  name: 'cube_tex_coords',
  bufferData: theModel.texCoords,
});
scene.addBuffer({
  name: 'hair_vertex',
});

scene.addImage(imageFilename);

function drawCube(matrix = new Matrix4(), scene) {
  const shader = scene.shaders['cube'];
  const vertexBuffer = scene.buffers['cube_vertex'];
  const vertexNormalBuffer = scene.buffers['cube_vertex_normal'];
  const texCoordBuffer = scene.buffers['cube_tex_coords'];
  const view = scene.view;
  const projection = scene.projection;
  const gl = scene.gl;

  gl.useProgram(shader);

  let positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  let normalIndex = gl.getAttribLocation(shader, 'a_Normal');
  if (normalIndex < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // let texCoordIndex = gl.getAttribLocation(shader, 'a_TexCoord');
  // if (texCoordIndex < 0) {
  //   console.log('Failed to get the storage location of a_TexCoord');
  //   return;
  // }

  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(normalIndex);
  // gl.enableVertexAttribArray(texCoordIndex);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  // gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
  // gl.bindBuffer(gl.ARRAY_BUFFER, null);

  let loc = gl.getUniformLocation(shader, 'model');
  gl.uniformMatrix4fv(loc, false, matrix.elements);
  loc = gl.getUniformLocation(shader, 'view');
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(shader, 'projection');
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(shader, 'normalMatrix');
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(matrix, view));

  loc = gl.getUniformLocation(shader, 'lightPosition');
  gl.uniform4fv(loc, lightPosition.elements);

  loc = gl.getUniformLocation(shader, 'lightProperties');
  gl.uniformMatrix3fv(loc, false, lightPropElements);
  loc = gl.getUniformLocation(shader, 'materialProperties');
  gl.uniformMatrix3fv(loc, false, matPropElements);
  loc = gl.getUniformLocation(shader, 'shininess');
  gl.uniform1f(loc, shininess);

  // const textureUnit = 0;
  // const textureHandle = scene.textures[textureUnit];
  // gl.activeTexture(gl.TEXTURE0 + textureUnit);
  // gl.bindTexture(gl.TEXTURE_2D, textureHandle);
  // loc = gl.getUniformLocation(shader, 'sampler');
  // gl.uniform1i(loc, textureUnit);
  //
  // gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

  gl.disableVertexAttribArray(normalIndex);
  gl.disableVertexAttribArray(positionIndex);
  // gl.disableVertexAttribArray(texCoordIndex);
  gl.useProgram(null);
}

function drawHair(matrix = new Matrix4(), scene) {
  const line_shader = scene.shaders['hair'];
  const hairVertexBuffer = scene.buffers['hair_vertex'];
  const view = scene.view;
  const projection = scene.projection;
  const gl = scene.gl;

  gl.useProgram(line_shader);

  let positionIndex = gl.getAttribLocation(line_shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  gl.enableVertexAttribArray(positionIndex);

  gl.bindBuffer(gl.ARRAY_BUFFER, hairVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.final_vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

  let loc = gl.getUniformLocation(line_shader, 'model');
  gl.uniformMatrix4fv(loc, false, matrix.elements);
  loc = gl.getUniformLocation(line_shader, 'view');
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(line_shader, 'projection');
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(line_shader, 'normalMatrix');
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(matrix, view));

  loc = gl.getUniformLocation(line_shader, 'lightPosition');
  gl.uniform4fv(loc, lightPosition.elements);

  gl.drawArrays(gl.LINE_STRIP, 0, this.final_vertices.length / 3.0);

  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);
}

export default function demo() {
  scene.start();
}
