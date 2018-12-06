import { Matrix4, Vector4 } from 'lib/cuon-matrix';
import HairyObject from 'utils/HairyObject';
import { blonde as defaultHairColor } from 'utils/hairColors';
import { makeNormalMatrixElements } from 'utils/Geometry';

import { getSettings } from 'utils/controls';

// light and material properties, remember this is column major

// generic white light
var lightPropElements = new Float32Array([...[0.2, 0.2, 0.2], ...[0.7, 0.7, 0.7], ...[0.7, 0.7, 0.7]]);

//very fake looking white, useful for testing lights
// light and material properties, remember this is column major

const matPropElements = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1]);
const shininess = 20.0;

let lightPosition = new Vector4([-4, 4, 4, 1]);

export function initHairyMesh({ model, drawFunction, drawHairFunction, hairDensity, scale = 2, position = [0, 0, 0], constraintContainer }, scalpModel) {
  const mesh = new HairyObject({
    drawFunction,
    modelData: model,
    drawHairFunction,
    hairDensity: hairDensity || getSettings().hairDensity,
    constraintContainer,
    scalpModelData: scalpModel
  });
  mesh.setScale(...Array(3).fill(scale));
  mesh.setPosition(...position);
  return mesh;
}

export default class HairyMesh {
  constructor(model, name, scene, meshParams = {}, hairColor) {
    this.name = name;
    this.model = model;
    this.scene = scene;
    this.allFinalVertices = [];
    this.allFinalColors = [];
    this.hairColor = hairColor;
    this.object = initHairyMesh({ model, drawFunction: this.drawMesh.bind(this), drawHairFunction: this.drawHair.bind(this), ...meshParams });
    scene.addObject(this.object);
    scene.addBuffer({
      name: `${name}_vertex`,
      bufferData: model.vertices,
    });
    scene.addBuffer({
      name: `${name}_hair_vertex`,
    });
    scene.addBuffer({
      name: `${name}_vertex_normal`,
      bufferData: model.vertexNormals,
    });
    scene.addBuffer({
      name: `${name}_tex_coords`,
      bufferData: model.texCoords,
    });
  }

  update(delta) {
    this.allFinalVertices = [];
    this.allFinalColors = [];
    this.object.update(delta, this.allFinalVertices);
    this.allFinalVertices = new Float32Array(this.allFinalVertices);
  }

  drawMesh(matrix = new Matrix4()) {
    const name = this.name;
    const scene = this.scene;
    const shader = scene.shaders[`demoMesh`];
    const vertexBuffer = scene.buffers[`${name}_vertex`];
    const vertexNormalBuffer = scene.buffers[`${name}_vertex_normal`];
    const texCoordBuffer = scene.buffers[`${name}_tex_coords`];
    const view = scene.view;
    const projection = scene.projection;
    const gl = scene.gl;
    const { is_mesh } = getSettings();

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

    let textureUnit = 0;
    const textureHandle = scene.textures[textureUnit];
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    loc = gl.getUniformLocation(shader, 'sampler');
    gl.uniform1i(loc, textureUnit);

    if (is_mesh) {
      gl.drawArrays(gl.TRIANGLES, 0, this.model.numVertices);
    } else {
      gl.drawArrays(gl.LINE_STRIP, 0, this.model.numVertices);
    }

    gl.disableVertexAttribArray(normalIndex);
    gl.disableVertexAttribArray(positionIndex);
    gl.disableVertexAttribArray(texCoordIndex);
    gl.useProgram(null);
  }

  drawHair(matrix = new Matrix4()) {
    const scene = this.scene;
    const line_shader = scene.shaders['hair'];
    const hairVertexBuffer = scene.buffers[`${this.name}_hair_vertex`];
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
    gl.bufferData(gl.ARRAY_BUFFER, this.allFinalVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

    let loc = gl.getUniformLocation(line_shader, 'model');
    gl.uniformMatrix4fv(loc, false, matrix.elements);
    loc = gl.getUniformLocation(line_shader, 'view');
    gl.uniformMatrix4fv(loc, false, view.elements);
    loc = gl.getUniformLocation(line_shader, 'projection');
    gl.uniformMatrix4fv(loc, false, projection.elements);
    loc = gl.getUniformLocation(line_shader, 'normalMatrix');
    gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(matrix, view));
    loc = gl.getUniformLocation(line_shader, 'color');
    gl.uniform4fv(loc, this.hairColor || getSettings().hairColor);

    loc = gl.getUniformLocation(line_shader, 'lightPosition');
    gl.uniform4fv(loc, lightPosition.elements);

    let num_hairs = this.object.hairs.length + this.object.childHairs.length;
    let num_verts_per_hair = this.object.hairs[0].final_vertices.length;
    for (let i = 0; i < num_hairs; i++) {
      gl.drawArrays(gl.LINE_STRIP, (i * num_verts_per_hair) / 3.0, num_verts_per_hair / 3.0);
    }

    gl.disableVertexAttribArray(positionIndex);
    gl.useProgram(null);
  }
}
