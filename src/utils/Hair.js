class HairStrand {
  constructor(
    length,
    base_x,
    base_y,
    base_z,
    normal_x,
    normal_y,
    normal_z,
    drawFunction
  ) {
    //we are assuming that normal has already been normalized to one unit
    //additionally, one unit on the normal is one unit on the length
    this.num_control_vertices = 8; //this will create n-1 control hair segments
    this.control_vertices = [];
    this.bezier_control_vertices = [];
    this.final_vertices;
    this.draw = drawFunction || function() {};

    for (let i = 0; i < this.num_control_vertices; i++) {
      let temp_x =
        (i / (this.num_control_vertices - 1)) * normal_x * length + base_x;
      let temp_y =
        (i / (this.num_control_vertices - 1)) * normal_y * length + base_y;
      let temp_z =
        (i / (this.num_control_vertices - 1)) * normal_z * length + base_z;
      this.control_vertices.push(temp_x);
      this.control_vertices.push(temp_y);
      this.control_vertices.push(temp_z);
    }

    this.generateBezierControlVertices();
    this.final_vertices = this.generateFinalVertices(8); //8 is the number of verts between each pair of control points
  }

  getRandomWiggle(range) {
    return Math.random() * range - range / 2.0;
  }

  render(matrixWorld) {
    //make them wiggle a little bit for fun
    for (let i = 0; i < this.control_vertices.length / 3; i++) {
      this.control_vertices[3 * i] += this.getRandomWiggle(0.006);
      this.control_vertices[3 * i + 2] += this.getRandomWiggle(0.006);
    }
    this.generateBezierControlVertices();
    this.final_vertices = this.generateFinalVertices(8); //8 is the number of verts between each pair of control points

    const currentWorld = new Matrix4(matrixWorld);
    this.draw(currentWorld);
  }

  generateBezierControlVertices() {
    this.bezier_control_vertices = [];
    let length_factor = 1.0 / 3.0; //best guess for how far the control verts strech along tangents
    for (let i = 0; i < this.num_control_vertices; i++) {
      if (i == 0) {
        let x1 = this.control_vertices[3 * i];
        let y1 = this.control_vertices[3 * i + 1];
        let z1 = this.control_vertices[3 * i + 2];
        let x2 = this.control_vertices[3 * (i + 1)];
        let y2 = this.control_vertices[3 * (i + 1) + 1];
        let z2 = this.control_vertices[3 * (i + 1) + 2];
        this.bezier_control_vertices.push(x1);
        this.bezier_control_vertices.push(y1);
        this.bezier_control_vertices.push(z1);
        this.bezier_control_vertices.push(length_factor * (x2 - x1) + x1);
        this.bezier_control_vertices.push(length_factor * (y2 - y1) + y1);
        this.bezier_control_vertices.push(length_factor * (z2 - z1) + z1);
      } else if (i == this.num_control_vertices - 1) {
        let x1 = this.control_vertices[3 * (i - 1)];
        let y1 = this.control_vertices[3 * (i - 1) + 1];
        let z1 = this.control_vertices[3 * (i - 1) + 2];
        let x2 = this.control_vertices[3 * i];
        let y2 = this.control_vertices[3 * i + 1];
        let z2 = this.control_vertices[3 * i + 2];
        this.bezier_control_vertices.push(length_factor * (x1 - x2) + x2);
        this.bezier_control_vertices.push(length_factor * (y1 - y2) + y2);
        this.bezier_control_vertices.push(length_factor * (z1 - z2) + z2);
        this.bezier_control_vertices.push(x2);
        this.bezier_control_vertices.push(y2);
        this.bezier_control_vertices.push(z2);
      } else {
        let x1 = this.control_vertices[3 * (i - 1)];
        let y1 = this.control_vertices[3 * (i - 1) + 1];
        let z1 = this.control_vertices[3 * (i - 1) + 2];
        let x2 = this.control_vertices[3 * i];
        let y2 = this.control_vertices[3 * i + 1];
        let z2 = this.control_vertices[3 * i + 2];
        let x3 = this.control_vertices[3 * (i + 1)];
        let y3 = this.control_vertices[3 * (i + 1) + 1];
        let z3 = this.control_vertices[3 * (i + 1) + 2];
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
      3 * (this.control_vertices.length - 6) + 12
    ) {
      console.log(
        'Warning: something is wrong in generateBezierControlVertices'
      );
      console.log(
        'BezierControlVertices length is: ' +
          this.bezier_control_vertices.length
      );
      console.log(
        'should be: ' + (3 * (this.control_vertices.length - 6) + 12)
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
