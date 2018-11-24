// given an instance of THREE.Geometry, returns an object
// containing raw data for vertices and normal vectors.
export function getModelData(geom) {
  let verticesArray = [];
  let normalsArray = [];
  let vertexNormalsArray = [];
  let reflectedNormalsArray = [];
  let count = 0;
  for (let f = 0; f < geom.faces.length; ++f) {
    let face = geom.faces[f];
    let v = geom.vertices[face.a];
    verticesArray.push(v.x);
    verticesArray.push(v.y);
    verticesArray.push(v.z);

    v = geom.vertices[face.b];
    verticesArray.push(v.x);
    verticesArray.push(v.y);
    verticesArray.push(v.z);

    v = geom.vertices[face.c];
    verticesArray.push(v.x);
    verticesArray.push(v.y);
    verticesArray.push(v.z);
    count += 3;

    let fn = face.normal;
    for (let i = 0; i < 3; ++i) {
      normalsArray.push(fn.x);
      normalsArray.push(fn.y);
      normalsArray.push(fn.z);
    }

    for (let i = 0; i < 3; ++i) {
      let vn = face.vertexNormals[i];
      vertexNormalsArray.push(vn.x);
      vertexNormalsArray.push(vn.y);
      vertexNormalsArray.push(vn.z);
    }
  }

  // texture coords
  //each element is an array of three Vector2
  let uvs = geom.faceVertexUvs[0];
  let texCoordArray = [];
  for (let a = 0; a < uvs.length; ++a) {
    for (let i = 0; i < 3; ++i) {
      let uv = uvs[a][i];
      texCoordArray.push(uv.x);
      texCoordArray.push(uv.y);
    }
  }

  return {
    numVertices: count,
    vertices: new Float32Array(verticesArray),
    normals: new Float32Array(normalsArray),
    vertexNormals: new Float32Array(vertexNormalsArray),
    reflectedNormals: new Float32Array(reflectedNormalsArray),
    texCoords: new Float32Array(texCoordArray),
  };
}

export function makeNormalMatrixElements(model, view) {
  let n = new Matrix4(view).multiply(model);
  n.transpose();
  n.invert();
  n = n.elements;
  return new Float32Array([
    n[0],
    n[1],
    n[2],
    n[4],
    n[5],
    n[6],
    n[8],
    n[9],
    n[10],
  ]);
}
