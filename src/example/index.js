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

 let theModel = getModelData(new THREE.SphereGeometry(1, 12, 12));
// let theModel = getModelData(new THREE.SphereGeometry(1, 12, 12, 2, 4.3, 1, 2)); //this is a good mesh for the scalp (for hair extrusion, but not rendering)
// let theModel = getModelData(new THREE.CubeGeometry(1, 1, 1, 1, 1, 1));
// let theModel = getModelData(new THREE.PlaneGeometry());

// Initialize constraint container for global storage of constraints
const constraintContainer = new ConstraintContainer();
let allFinalVertices = [];

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

let axis = 'y';
let paused = true;
let is_mesh = true;
let rolling_buffer_length = 15;
let rolling_buffer = [];

let lightPosition = new Vector4([-4, 4, 4, 1]);

//view matrix
let view = new Matrix4().setLookAt(
  12,
  12,
  12, // eye
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
  hairDensity: 5,
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
    case 'm':
      is_mesh = !is_mesh;
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
  //constraintContainer.generatePPConstraints(cube.getParticles(false));

  // define an animation loop
  function animate(timestamp) {
    // calculate duration since last animation frame
    if (!lastCalledTime) lastCalledTime = new Date().getTime();
    updateRollingBuffer((new Date().getTime() - lastCalledTime) / 1000);
    let delta = averageRollingBuffer();
    document.getElementById("fps_tracker").innerHTML = (1.0/delta).toFixed(2) + " fps";
    lastCalledTime = new Date().getTime();

    constraintContainer.solve();
    cube.update(delta, allFinalVertices);
    allFinalVertices = new Float32Array(allFinalVertices);
    render();
    allFinalVertices = [];

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

  let textureUnit = 1;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, textureHandle);
  loc = gl.getUniformLocation(shader, 'sampler');
  gl.uniform1i(loc, textureUnit);

  if(is_mesh){
    gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);
  }
  else{
    gl.drawArrays(gl.LINE_STRIP, 0, theModel.numVertices);
  }

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
  gl.bufferData(gl.ARRAY_BUFFER, allFinalVertices, gl.STATIC_DRAW);
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

  let num_hairs = cube.hairs.length + cube.childHairs.length;
  let num_verts_per_hair = cube.hairs[0].final_vertices.length;
  for(let i = 0; i < num_hairs; i++){
    gl.drawArrays(gl.LINE_STRIP, i * num_verts_per_hair / 3.0, num_verts_per_hair / 3.0);
  }

  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);
}

function updateRollingBuffer(new_delta_t){
  rolling_buffer.push(new_delta_t);
  if(rolling_buffer.length > rolling_buffer_length){
    rolling_buffer.shift();
  }
}

function averageRollingBuffer(){
  let sum = 0;
  for(let i = 0; i < rolling_buffer.length; i++){
    sum += rolling_buffer[i];
  }
  return (sum / rolling_buffer.length);
}

export default main;
