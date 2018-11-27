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

// let theModel = getModelData(new THREE.SphereGeometry(1, 8, 8));
 let theModel = getModelData(new THREE.CubeGeometry(1, 1, 1, 2, 2, 2));
// let theModel = getModelData(new THREE.PlaneGeometry());

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

// the OpenGL context
let gl;

// handle to a buffer on the GPU
let hairVertexBuffer;
let vertexBuffer;
let vertexNormalBuffer;
let texCoordBuffer;

//handle to the texture object on the GPU
let textureHandle;

// handle to the compiled shader program on the GPU
let shader;
let line_shader;

// transformation matrices
let model = new Matrix4();
let modelScale = new Matrix4();

let axis = 'y';
let paused = true;

let lightPosition = new Vector4([-4, 4, 4, 1]);

//view matrix
let view = new Matrix4().setLookAt(
  5,
  5,
  5, // eye
  0,
  0,
  0, // at - looking at the origin
  0,
  1,
  0
); // up vector - y axis

let projection = new Matrix4().setPerspective(35, 1.5, 0.1, 1000);

const cube = new HairyObject({
  drawFunction: drawCube,
  modelData: theModel,
  drawHairFunction: drawHair,
  hairDensity: 50,
  constraintContainer,
});
const cubeScale = 2;
cube.setScale(cubeScale, cubeScale, cubeScale);

function getChar(event) {
  if (event.which == null) {
    return String.fromCharCode(event.keyCode); // IE
  } else if (event.which != 0 && event.charCode != 0) {
    return String.fromCharCode(event.which); // the rest
  } else {
    return null; // special key
  }
}

function handleKeyPress(event) {
  let ch = getChar(event);
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
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);
  cube.render();
}

//entry point when page is loaded.  Wait for image to load before proceeding
function main() {
  let image = new Image();
  image.onload = function() {
    // chain the next function
    startForReal(image);
  };

  // starts loading the image asynchronously
  image.src = imageFilename;
}

function startForReal(image) {
  let canvas = document.getElementById('theCanvas');

  window.onkeypress = handleKeyPress;

  gl = getWebGLContext(canvas, false);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // load and compile the shader pair, using utility from the teal book
  let vshaderSource = VSHADER_SOURCE;
  let fshaderSource = FSHADER_SOURCE;
  if (!initShaders(gl, vshaderSource, fshaderSource)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  shader = gl.program;
  gl.useProgram(null);

  // load and compile the shader pair, using utility from the teal book
  vshaderSource = VSHADER_SOURCE_LINES;
  fshaderSource = FSHADER_SOURCE_LINES;
  if (!initShaders(gl, vshaderSource, fshaderSource)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  line_shader = gl.program;
  gl.useProgram(null);

  // buffer for vertex positions for triangles
  vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, theModel.vertices, gl.STATIC_DRAW);

  hairVertexBuffer = gl.createBuffer();
  if (!hairVertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, hairVertexBuffer);

  // buffer for normals
  vertexNormalBuffer = gl.createBuffer();
  if (!vertexNormalBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, theModel.vertexNormals, gl.STATIC_DRAW);

  // buffer for tex coords
  texCoordBuffer = gl.createBuffer();
  if (!texCoordBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, theModel.texCoords, gl.STATIC_DRAW);

  // ask the GPU to create a texture object
  textureHandle = gl.createTexture();

  // choose a texture unit to use during setup, defaults to zero
  // (can use a different one when drawing)
  // max value is MAX_COMBINED_TEXTURE_IMAGE_UNITS
  gl.activeTexture(gl.TEXTURE0);

  // bind the texture
  gl.bindTexture(gl.TEXTURE_2D, textureHandle);

  // load the image bytes to the currently bound texture, flipping the vertical
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // texture parameters are stored with the texture
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //final setup for demo
  let lastCalledTime;
  constraintContainer.generatePPConstraints(cube.getParticles(false));

  // define an animation loop
  function animate(timestamp) {
    // calculate duration since last animation frame
    if (!lastCalledTime) lastCalledTime = new Date().getTime();
    let delta = (new Date().getTime() - lastCalledTime) / 1000;
    lastCalledTime = new Date().getTime();

    constraintContainer.solve();
    cube.update(delta);
    render();

    let increment = 0.5;
    if (!paused) {
      switch (axis) {
        case 'x':
          model = new Matrix4().setRotate(increment, 1, 0, 0).multiply(model);
          axis = 'x';
          break;
        case 'y':
          axis = 'y';
          model = new Matrix4().setRotate(increment, 0, 1, 0).multiply(model);
          break;
        case 'z':
          axis = 'z';
          model = new Matrix4().setRotate(increment, 0, 0, 1).multiply(model);
          break;
        default:
      }
    }
    requestAnimationFrame(animate, canvas);
  }

  animate();
}

function drawCube(matrix = new Matrix4()) {
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

  let texCoordIndex = gl.getAttribLocation(shader, 'a_TexCoord');
  if (texCoordIndex < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return;
  }

  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(normalIndex);
  gl.enableVertexAttribArray(texCoordIndex);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  let loc = gl.getUniformLocation(shader, 'model');
  let current = new Matrix4()
    .multiply(matrix)
    .multiply(model)
    .multiply(modelScale);
  gl.uniformMatrix4fv(loc, false, current.elements);
  loc = gl.getUniformLocation(shader, 'view');
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(shader, 'projection');
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(shader, 'normalMatrix');
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));

  loc = gl.getUniformLocation(shader, 'lightPosition');
  gl.uniform4fv(loc, lightPosition.elements);

  loc = gl.getUniformLocation(shader, 'lightProperties');
  gl.uniformMatrix3fv(loc, false, lightPropElements);
  loc = gl.getUniformLocation(shader, 'materialProperties');
  gl.uniformMatrix3fv(loc, false, matPropElements);
  loc = gl.getUniformLocation(shader, 'shininess');
  gl.uniform1f(loc, shininess);

  let textureUnit = 1;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, textureHandle);
  loc = gl.getUniformLocation(shader, 'sampler');
  gl.uniform1i(loc, textureUnit);

  gl.drawArrays(gl.LINE_STRIP, 0, theModel.numVertices);

  gl.disableVertexAttribArray(normalIndex);
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(texCoordIndex);
  gl.useProgram(null);
}

function drawHair(matrix = new Matrix4()) {
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
  let current = new Matrix4()
    .multiply(matrix)
    .multiply(model)
    .multiply(modelScale);
  gl.uniformMatrix4fv(loc, false, current.elements);
  loc = gl.getUniformLocation(line_shader, 'view');
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(line_shader, 'projection');
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(line_shader, 'normalMatrix');
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));

  loc = gl.getUniformLocation(line_shader, 'lightPosition');
  gl.uniform4fv(loc, lightPosition.elements);

  gl.drawArrays(gl.LINE_STRIP, 0, this.final_vertices.length / 3.0);

  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);
}

export default main;
