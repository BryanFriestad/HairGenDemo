import { Matrix4 } from 'lib/cuon-matrix';
import { Vector3 } from 'lib/cuon-matrix';
import CS336Object from './CS336Object';
import HairStrand from './Hair';
import ChildHair from './ChildHair';
import VerletParticle from './VerletParticle';
import { ConstraintContainer } from './Constraint';

export default class HairyObject extends CS336Object {
  constructor({ drawFunction = () => {}, modelData = {}, drawHairFunction = () => {}, hairDensity = 0, constraintContainer }) {
    super(drawFunction);
    const { numVertices, vertices, normals, vertexNormals, reflectedNormals, texCoords } = modelData;
    this.hairs = [];
    this.childHairs = [];
    this.constraints = [];
    this.res = 5; //5 is a good medium between fast and smooth
    this.drawHairFunction = drawHairFunction;
    this.object_pearls = []; //a list of the verlet particles that the hairs can collide with
    this.object_pearls.push(new VerletParticle(this.position.elements[0], this.position.elements[1], this.position.elements[2], true, 0, 2));
    this.generateHairs({
      numVertices,
      vertices,
      normals,
      vertexNormals,
      drawHairFunction,
      constraintContainer,
    });
    this.generateChildHairs({ hairDensity, vertices });
    console.log('num of control hairs: ' + this.hairs.length);
    console.log('num of control verts: ' + this.hairs.length * this.res);
    console.log('num of child hairs: ' + this.childHairs.length);

    constraintContainer.addHairObjectCollision(this.object_pearls, this.hairs);
  }

  // hashmap the vertices to aggregate the vertex pairs
  generateHairs({ numVertices, vertices, normals, vertexNormals, constraintContainer }) {
    let vertexMap = {};
    for (let i = 0; i < numVertices; i++) {
      let [a, b, c] = vertices.slice(3 * i, 3 * i + 3);
      let abcNormals = vertexNormals.slice(3 * i, 3 * i + 3);

      const key = `${a},${b},${c}`;
      let existingNormals = vertexMap[key] ? vertexMap[key].v_normals || [] : [];
      vertexMap[key] = {
        v_base: [a, b, c],
        v_normals: [...existingNormals, abcNormals],
      };
    }

    // keep track of hair strand at each vertex for efficient lookup for child hairs
    this.hairMap = {};
    Object.values(vertexMap).forEach(({ v_base, v_normals }) => {
      let avgNormal = new Array(3).fill(0);

      // sum normals
      for (let i = 0; i < v_normals.length; i++) {
        avgNormal[0] += v_normals[i][0];
        avgNormal[1] += v_normals[i][1];
        avgNormal[2] += v_normals[i][2];
      }
      // normalize normals
      const norm = Math.sqrt(avgNormal[0] * avgNormal[0] + avgNormal[1] * avgNormal[1] + avgNormal[2] * avgNormal[2]);
      avgNormal = [avgNormal[0] / norm, avgNormal[1] / norm, avgNormal[2] / norm];

      const hairStrand = new HairStrand({
        length: 4.5,
        base: v_base,
        normal: avgNormal,
        drawFunction: this.drawHairFunction,
        res: this.res,
        bez_res: 4,
        constraintContainer,
      });
      this.hairs.push(hairStrand);
      this.hairMap[this.vertexToKey(v_base)] = hairStrand;
    });
  }

  generateChildHairs({ hairDensity, vertices }) {
    if (!hairDensity) return;
    for (let i = 0; i < vertices.length; i += 9) {
      let p1 = vertices.slice(i, i + 3);
      let p2 = vertices.slice(i + 3, i + 6);
      let p3 = vertices.slice(i + 6, i + 9);

      const parents = [this.hairMap[this.vertexToKey(p1)], this.hairMap[this.vertexToKey(p2)], this.hairMap[this.vertexToKey(p3)]];

      for (let j = 0; j < hairDensity; j++) {
        this.childHairs.push(
          new ChildHair(parents, {
            drawFunction: this.drawHairFunction,
            res: this.res,
            bez_res: 4
          })
        );
      }
    }
  }

  vertexToKey([a, b, c]) {
    return `${a},${b},${c}`;
  }

  update(delta_t, allFinalVertices) {
    // if (Math.random() > 0.08) {
    //   let rand_hair = Math.floor(Math.random() * this.hairs.length);
    //   this.hairs[rand_hair].rebase(
    //     Math.random() * 8 - 4,
    //     0,
    //     Math.random() * 8 - 4
    //   );
    // }
    for (let i = 0; i < this.hairs.length; i++) {
      this.hairs[i].update(delta_t, allFinalVertices);
    }
    for (let i = 0; i < this.childHairs.length; i++) {
      this.childHairs[i].update(delta_t, allFinalVertices);
    }
  }

  render(matrixWorld) {
    super.render(matrixWorld);
    const currentWorld = new Matrix4(matrixWorld).multiply(this.getMatrix());
    this.hairs[0].render(new Matrix4());
    for (let i = 0; i < this.hairs.length; i++) {
      //this.hairs[i].render(new Matrix4());
      this.hairs[i].rebase(...currentWorld.multiplyVector3(new Vector3(this.hairs[i].base)).elements);
    }
    for (let i = 0; i < this.childHairs.length; i++) {
      //this.childHairs[i].render(new Matrix4());
    }
  }

  getParticles(includeChild) {
    let output = [];
    for (let i = 0; i < this.hairs.length; i++) {
      let temp = this.hairs[i].verlet_parts;
      for (let j = 0; j < temp.length; j++) {
        output.push(temp[j]);
      }
    }
    return output;
  }
}
