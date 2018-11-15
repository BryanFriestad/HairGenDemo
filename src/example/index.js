import VSHADER_SOURCE from './vshader.glsl';
import FSHADER_SOURCE from './fshader.glsl';

/**
 * Example code from: http://web.cs.iastate.edu/~smkautz/cs336f17/examples/example123/GL_example1.js
 */

// Raw data for some point positions - this will be a square, consisting
// of two triangles.  We provide two values per vertex for the x and y coordinates
// (z will be zero by default).
var numPoints = 6;
var vertices = new Float32Array([
  -0.5,
  -0.5,
  0.5,
  -0.5,
  0.5,
  0.5,
  -0.5,
  -0.5,
  0.5,
  0.5,
  -0.5,
  0.5,
]);

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexbuffer;

// handle to the compiled shader program on the GPU
var shader;

// code to actually render our geometry
function draw() {
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT);

  // bind the shader
  gl.useProgram(shader);

  // bind the buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.error('Failed to get the storage location of a_Position');
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);

  // associate the data in the currently bound buffer with the a_position attribute
  // (The '2' specifies there are 2 floats per vertex in the buffer.  Don't worry about
  // the last three args just yet.)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

  // we can unbind the buffer now (not really necessary when there is only one buffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // draw, specifying the type of primitive to assemble from the vertices
  //gl.drawArrays(gl.TRIANGLES, 0, 6);
  //gl.drawArrays(gl.LINE_LOOP, 0, numPoints);

  // alternatively, just use part of the data in the buffer
  //gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.drawArrays(gl.TRIANGLES, 3, 3);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);
}

// entry point when page is loaded
function main() {
  // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is
  // redrawn

  // retrieve <canvas> element
  var canvas = document.getElementById('theCanvas');

  // get the rendering context for WebGL, using the utility from the teal book
  // (Set second argument to true for debug version.  Note the debug version is
  // incompatible with Firefox shader editor.)
  gl = getWebGLContext(canvas, false);

  if (!gl) {
    console.error('Failed to get the rendering context for WebGL');
    return;
  }

  // load and compile the shader pair, using utility from the teal book
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.error('Failed to intialize shaders.');
    return;
  }

  // retain a handle to the shader program, then unbind it
  // (This looks odd, but the way initShaders works is that it "binds" the shader and
  // stores the handle in an extra property of the gl object.  That's ok, but will really
  // mess things up when we have more than one shader pair.)
  shader = gl.program;
  gl.useProgram(null);

  // request a handle for a chunk of GPU memory
  vertexbuffer = gl.createBuffer();
  if (!vertexbuffer) {
    console.error('Failed to create the buffer object');
    return;
  }

  // "bind" the buffer as the current array buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

  // load our data onto the GPU (uses the currently bound buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // now that the buffer is filled with data, we can unbind it
  // (we still have the handle, so we can bind it again when needed)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.8, 0.8, 1.0);

  // we could just call draw() once to see the result, but setting up an animation
  // loop to continually update the canvas makes it easier to experiment with the
  // shaders
  //draw();

  // define an animation loop
  var animate = function() {
    draw();

    // request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate, canvas);
  };

  // start drawing!
  animate();
}

export default main;
