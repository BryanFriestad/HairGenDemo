import CS336Object from './CS336Object';
import HairStrand from './Hair';

export default class HairyObject extends CS336Object {
  constructor(
    drawFunction = () => {},
    modelData = {},
    drawHairFunction = () => {}
  ) {
    super(drawFunction);
    const {
      numVertices,
      vertices,
      normals,
      vertexNormals,
      reflectedNormals,
      texCoords,
    } = modelData;
    this.hairs = [];
    let vertexMap = {};
    for (let i = 0; i < numVertices; i++) {
      let [a, b, c] = vertices.slice(3 * i, 3 * i + 3);
      let abcNormals = vertexNormals.slice(3 * i, 3 * i + 3);

      const key = `${a},${b},${c}`;
      let existingNormals = vertexMap[key]
        ? vertexMap[key].v_normals || []
        : [];
      vertexMap[key] = {
        v_bases: [a, b, c],
        v_normals: [...existingNormals, abcNormals],
      };
    }

    Object.values(vertexMap).forEach(({ v_bases, v_normals }) => {
      let avgNormal = new Array(3).fill(0);

      // sum normals
      for (let i = 0; i < v_normals.length; i++) {
        avgNormal[0] += v_normals[i][0];
        avgNormal[1] += v_normals[i][1];
        avgNormal[2] += v_normals[i][2];
      }
      // normalize normals
      const norm = Math.sqrt(
        avgNormal[0] * avgNormal[0] +
          avgNormal[1] * avgNormal[1] +
          avgNormal[2] * avgNormal[2]
      );
      avgNormal = [
        avgNormal[0] / norm,
        avgNormal[1] / norm,
        avgNormal[2] / norm,
      ];

      this.hairs.push(
        new HairStrand(1, ...v_bases, ...avgNormal, drawHairFunction)
      );
    });

    // this.hairs.push(
    //   new HairStrand(1, a, b, c, a_n, b_n, c_n, drawHairFunction)
    // );
  }

  render(matrixWorld) {
    super.render(matrixWorld);
    const currentWorld = new Matrix4(matrixWorld).multiply(this.getMatrix());
    for (let i = 0; i < this.hairs.length; i++) {
      this.hairs[i].render(currentWorld);
    }
  }
}
