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
    for (let i = 0; i < vertices.length && i < vertexNormals.length; i += 3) {
      let [a, b, c] = vertices.slice(i, i + 3);
      let [a_n, b_n, c_n] = vertexNormals.slice(i, i + 3);
      this.hairs.push(
        new HairStrand(1, a, b, c, a_n, b_n, c_n, drawHairFunction)
      );
    }
  }

  render(matrixWorld) {
    super.render(matrixWorld);
    const currentWorld = new Matrix4(matrixWorld).multiply(this.getMatrix());
    for (let i = 0; i < this.hairs.length; i++) {
      this.hairs[i].render(currentWorld);
    }
  }
}
