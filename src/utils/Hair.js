import { Vector3, Matrix4 } from 'lib/cuon-matrix';
import VerletParticle from 'utils/VerletParticle.js';
import DistanceConstraint from 'utils/Constraint.js';

class HairStrand {
  constructor({
    length = 1,
    base = [0, 0, 0],
    normal = [1, 1, 1],
    drawFunction = () => {},
    res = 8,
  }) {
    this.length = length;
    const [base_x, base_y, base_z] = base;
    this.base = base;
    const [normal_x, normal_y, normal_z] = normal;
    this.normal = normal;
    // console.log({ base, normal });
    //we are assuming that normal has already been normalized to one unit
    //additionally, one unit on the normal is one unit on the length
    this.num_control_vertices = res; //this will create n-1 control hair segments
    this.verlet_parts = [];
    this.constraints = [];
    this.bezier_control_vertices = [];
    this.final_vertices;
    this.draw = drawFunction;

    for (let i = 0; i < this.num_control_vertices; i++) {
      let temp_x =
        (i / (this.num_control_vertices - 1)) * normal_x * length + base_x;
      let temp_y =
        (i / (this.num_control_vertices - 1)) * normal_y * length + base_y;
      let temp_z =
        (i / (this.num_control_vertices - 1)) * normal_z * length + base_z;
      //TODO: i just got thinking that there might be an issue here with the whole normal * length thing
      if (i == 0) {
        this.verlet_parts.push(
          new VerletParticle(temp_x, temp_y, temp_z, true, 0.99)
        );
      } else {
        this.verlet_parts.push(
          new VerletParticle(temp_x, temp_y, temp_z, false, 0.99)
        );
      }
    }

    let dist = length / (this.num_control_vertices - 1);
    for (let i = 0; i < this.verlet_parts.length - 1; i++) {
      this.constraints.push(
        new DistanceConstraint(
          this.verlet_parts[i],
          this.verlet_parts[i + 1],
          dist
        )
      );
    }

    this.generateBezierControlVertices();
    this.final_vertices = this.generateFinalVertices(this.num_control_vertices); //8 is the number of verts between each pair of control points
  }

  getRandomWiggle(range) {
    return Math.random() * range - range / 2.0;
  }

  rebase(x, y, z) {
    this.verlet_parts[0].setPosition(x, y, z); //move the base particle to the position
  }

  update(delta_t) {
    //update all verlet particles
    for (let i = 0; i < this.num_control_vertices; i++) {
      this.verlet_parts[i].update(delta_t);
    }
    for (let i = 0; i < this.constraints.length; i++) {
      this.constraints[i].solve();
    }
    this.generateBezierControlVertices();
    this.final_vertices = this.generateFinalVertices(this.num_control_vertices); //8 is the number of verts between each pair of control points
  }

  render(matrixWorld) {
    const currentWorld = new Matrix4(matrixWorld);
    this.draw(currentWorld);
  }

  generateBezierControlVertices() {
    this.bezier_control_vertices = [];
    let length_factor = 1.0 / 3.0; //best guess for how far the control verts strech along tangents
    for (let i = 0; i < this.num_control_vertices; i++) {
      if (i == 0) {
        let p1 = this.verlet_parts[i].position.elements;
        let p2 = this.verlet_parts[i + 1].position.elements;
        let x1 = p1[0];
        let y1 = p1[1];
        let z1 = p1[2];
        let x2 = p2[0];
        let y2 = p2[1];
        let z2 = p2[2];
        this.bezier_control_vertices.push(x1);
        this.bezier_control_vertices.push(y1);
        this.bezier_control_vertices.push(z1);
        this.bezier_control_vertices.push(length_factor * (x2 - x1) + x1);
        this.bezier_control_vertices.push(length_factor * (y2 - y1) + y1);
        this.bezier_control_vertices.push(length_factor * (z2 - z1) + z1);
      } else if (i == this.num_control_vertices - 1) {
        let p1 = this.verlet_parts[i - 1].position.elements;
        let p2 = this.verlet_parts[i].position.elements;
        let x1 = p1[0];
        let y1 = p1[1];
        let z1 = p1[2];
        let x2 = p2[0];
        let y2 = p2[1];
        let z2 = p2[2];
        this.bezier_control_vertices.push(length_factor * (x1 - x2) + x2);
        this.bezier_control_vertices.push(length_factor * (y1 - y2) + y2);
        this.bezier_control_vertices.push(length_factor * (z1 - z2) + z2);
        this.bezier_control_vertices.push(x2);
        this.bezier_control_vertices.push(y2);
        this.bezier_control_vertices.push(z2);
      } else {
        let p1 = this.verlet_parts[i - 1].position.elements;
        let p2 = this.verlet_parts[i].position.elements;
        let p3 = this.verlet_parts[i + 1].position.elements;
        let x1 = p1[0];
        let y1 = p1[1];
        let z1 = p1[2];
        let x2 = p2[0];
        let y2 = p2[1];
        let z2 = p2[2];
        let x3 = p3[0];
        let y3 = p3[1];
        let z3 = p3[2];
        this.bezier_control_vertices.push(
          (length_factor * (x1 - x3)) / 2.0 + x2
        );
        this.bezier_control_vertices.push(
          (length_factor * (y1 - y3)) / 2.0 + y2
        );
        this.bezier_control_vertices.push(
          (length_factor * (z1 - z3)) / 2.0 + z2
        );
        this.bezier_control_vertices.push(x2);
        this.bezier_control_vertices.push(y2);
        this.bezier_control_vertices.push(z2);
        this.bezier_control_vertices.push(
          (length_factor * (x3 - x1)) / 2.0 + x2
        );
        this.bezier_control_vertices.push(
          (length_factor * (y3 - y1)) / 2.0 + y2
        );
        this.bezier_control_vertices.push(
          (length_factor * (z3 - z1)) / 2.0 + z2
        );
      }
    }
    if (
      this.bezier_control_vertices.length !=
      3 * (3 * this.num_control_vertices - 6) + 12
    ) {
      console.log(
        'Warning: something is wrong in generateBezierControlVertices'
      );
      console.log(
        'BezierControlVertices length is: ' +
          this.bezier_control_vertices.length
      );
      console.log(
        'should be: ' + (3 * (3 * this.num_control_vertices - 6) + 12)
      );
    }
  }

  generateFinalVertices(num_points) {
    let output = [];
    for (let i = 0; i < this.bezier_control_vertices.length - 1; i += 3) {
      let p1 = new Vector3([
        this.bezier_control_vertices[3 * i],
        this.bezier_control_vertices[3 * i + 1],
        this.bezier_control_vertices[3 * i + 2],
      ]);
      let p2 = new Vector3([
        this.bezier_control_vertices[3 * (i + 1)],
        this.bezier_control_vertices[3 * (i + 1) + 1],
        this.bezier_control_vertices[3 * (i + 1) + 2],
      ]);
      let p3 = new Vector3([
        this.bezier_control_vertices[3 * (i + 2)],
        this.bezier_control_vertices[3 * (i + 2) + 1],
        this.bezier_control_vertices[3 * (i + 2) + 2],
      ]);
      let p4 = new Vector3([
        this.bezier_control_vertices[3 * (i + 3)],
        this.bezier_control_vertices[3 * (i + 3) + 1],
        this.bezier_control_vertices[3 * (i + 3) + 2],
      ]);
      this.generateBezierPoints(p1, p2, p3, p4, num_points, output);
    }
    return new Float32Array(output);
  }

  generateBezierPoints(p1, p2, p3, p4, num_points, array) {
    for (let i = 0; i < num_points; i++) {
      let t = i / (num_points - 1);
      let x =
        Math.pow(1 - t, 3) * p1.elements[0] +
        3 * Math.pow(1 - t, 2) * t * p2.elements[0] +
        3 * Math.pow(t, 2) * (1 - t) * p3.elements[0] +
        Math.pow(t, 3) * p4.elements[0];

      let y =
        Math.pow(1 - t, 3) * p1.elements[1] +
        3 * Math.pow(1 - t, 2) * t * p2.elements[1] +
        3 * Math.pow(t, 2) * (1 - t) * p3.elements[1] +
        Math.pow(t, 3) * p4.elements[1];

      let z =
        Math.pow(1 - t, 3) * p1.elements[2] +
        3 * Math.pow(1 - t, 2) * t * p2.elements[2] +
        3 * Math.pow(t, 2) * (1 - t) * p3.elements[2] +
        Math.pow(t, 3) * p4.elements[2];

      array.push(x);
      array.push(y);
      array.push(z);
    }
  }
}

export default HairStrand;
