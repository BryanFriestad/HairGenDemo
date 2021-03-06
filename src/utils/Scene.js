import { Matrix4, Vector4 } from 'lib/cuon-matrix';
import { getWebGLContext, initShaders } from 'lib/cuon-utils';

export default class Scene {
  constructor({ additionalAnimation = () => {}, additionalSetup = () => {}, additionalHandleKeydown = () => {}, additionalHandleKeyup = () => {} }) {
    this.objects = [];

    this.imageFilenames = [];
    this.images = [];

    this.shaderSources = [];
    this.shaders = {};

    this.bufferSources = [];
    this.buffers = {};

    this.textures = {};

    this.additionalSetup = additionalSetup;
    this.additionalAnimation = additionalAnimation;
    this.additionalHandleKeydown = additionalHandleKeydown;
    this.additionalHandleKeyup = additionalHandleKeyup;
    this.view = new Matrix4().setLookAt(
      ...[5, 5, 5], // eye
      ...[0, 0, 0], // at - looking at the origin
      ...[0, 1, 0] // up vector - y axis
    );

    this.projection = new Matrix4().setPerspective(35, 1.5, 0.1, 1000);

    this.rolling_buffer_length = 15;
    this.rolling_buffer = [];
  }

  render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BIT);
    this.objects.forEach(object => object.render());
  }

  async loadImages() {
    const promises = [];
    this.imageFilenames.forEach(filename => {
      promises.push(
        new Promise(resolve => {
          let image = new Image();
          image.onload = () => {
            this.images.push(image);
            resolve();
          };
          image.onerror = () => {
            console.error(`Failed to load image: ${filename}`);
          };
          image.src = filename;
        })
      );
    });
    await Promise.all(promises);
    this.main();
  }

  addImage(imageFilename) {
    this.imageFilenames.push(imageFilename);
  }

  addObject(object) {
    object.setScene(this);
    this.objects.push(object);
  }

  getChar(event) {
    if (event.key) {
      return event.key;
    } else if (event.which == null) {
      return String.fromCharCode(event.keyCode); // IE
    } else if (event.which != 0 && event.charCode != 0) {
      return String.fromCharCode(event.which); // the rest
    } else {
      return null; // special key
    }
  }

  handleKeydown(event) {
    let ch = this.getChar(event);
    const ahk = this.additionalHandleKeydown(event, ch);
    if (ahk === true || ahk === false) return ahk;
  }

  handleKeyup(event) {
    let ch = this.getChar(event);
    const ahk = this.additionalHandleKeyup(event, ch);
    if (ahk === true || ahk === false) return ahk;
  }

  addShader({ name, vshaderSource, fshaderSource }) {
    this.shaderSources.push({ name, vshaderSource, fshaderSource });
  }

  loadShader({ name, fshaderSource, vshaderSource }) {
    if (!initShaders(this.gl, vshaderSource, fshaderSource)) {
      console.error('Failed to initialize shaders.');
      return;
    }
    this.shaders[name] = this.gl.program;
    this.gl.useProgram(null);
  }

  addBuffer({ name, bufferType, bufferData, bufferDataDrawType }) {
    this.bufferSources.push({
      name,
      bufferType,
      bufferData,
      bufferDataDrawType,
    });
  }

  initBuffer({ name, bufferType, bufferData, bufferDataDrawType }) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (!buffer) {
      console.error('Failed to create the buffer object.');
      return;
    }
    gl.bindBuffer(bufferType || gl.ARRAY_BUFFER, buffer);
    if (bufferData) {
      gl.bufferData(bufferType || gl.ARRAY_BUFFER, bufferData, bufferDataDrawType || gl.STATIC_DRAW);
    }
    this.buffers[name] = buffer;
  }

  loadTexture(image, i) {
    const gl = this.gl;
    const textureHandle = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, i + 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.textures[i] = textureHandle;
  }

  main() {
    const canvas = document.getElementById('theCanvas');
    this.canvas = canvas;

    this.keydownListener = window.addEventListener('keydown', this.handleKeydown.bind(this));
    this.keyupListener = window.addEventListener('keyup', this.handleKeyup.bind(this));

    this.gl = getWebGLContext(canvas, false);
    const gl = this.gl;
    if (!gl) {
      console.error('Failed to get the rendering context for WebGL');
      return;
    }

    this.shaderSources.forEach(this.loadShader.bind(this));
    this.bufferSources.forEach(this.initBuffer.bind(this));
    this.images.forEach(this.loadTexture.bind(this));

    gl.clearColor(0.529, 0.808, 0.922, 1.0);

    gl.enable(gl.DEPTH_TEST);

    this.additionalSetup();

    this.animate();
  }

  animate() {
    const delta = this.calcFPS();
    this.additionalAnimation(delta);
    this.render();
    this.animationFrame = requestAnimationFrame(this.animate.bind(this), this.canvas);
  }

  calcFPS() {
    if (!this.lastCalledTime) this.lastCalledTime = new Date().getTime();
    this.updateRollingBuffer((new Date().getTime() - this.lastCalledTime) / 1000);
    let delta = this.averageRollingBuffer();
    document.getElementById('fps_tracker').innerHTML = (1.0 / delta).toFixed(2) + ' fps';
    this.lastCalledTime = new Date().getTime();
    return delta;
  }

  updateRollingBuffer(new_delta_t) {
    this.rolling_buffer.push(new_delta_t);
    if (this.rolling_buffer.length > this.rolling_buffer_length) {
      this.rolling_buffer.shift();
    }
  }

  averageRollingBuffer() {
    let sum = 0;
    for (let i = 0; i < this.rolling_buffer.length; i++) {
      sum += this.rolling_buffer[i];
    }
    return sum / this.rolling_buffer.length;
  }

  start() {
    this.loadImages();
  }

  end() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('keydown', this.keydownListener);
    window.removeEventListener('keyup', this.keyupListener);
  }
}
