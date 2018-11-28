import HairStrand from './Hair';
import Vector from './Vector';

export default class ChildHair extends HairStrand {
  constructor(parents = Array(3), { drawFunction = () => {}, res = 8 }) {
    let length = 1;
    /*
     * By generating two random values in [0..1],
     * computing 1 minus the larger of them if their sum is greater than 1,
     * and setting the third as 1 minus the other two so that they sum to 1,
     * we can determine positions at which to grow the desired density of hair.
     */
    let b_A = Math.random();
    let b_B = Math.random();
    if (b_A + b_B > 1) {
      if (b_A > b_B) b_A = 1 - b_A;
      else b_B = 1 - b_B;
    }
    let b_C = 1 - b_A - b_B;

    let p0_base = new Vector(parents[0].base).scale(b_A);
    let p1_base = new Vector(parents[1].base).scale(b_B);
    let p2_base = new Vector(parents[2].base).scale(b_C);

    let p0_normal = new Vector(parents[0].normal).scale(b_A);
    let p1_normal = new Vector(parents[1].normal).scale(b_B);
    let p2_normal = new Vector(parents[2].normal).scale(b_C);

    let p0_length = parents[0].length;
    let p1_length = parents[1].length;
    let p2_length = parents[2].length;

    let Y_length = p0_length * b_A + p1_length * b_B + p2_length * b_C;
    let Y_base = p0_base.add(p1_base).add(p2_base);
    let Y_normal = p0_normal.add(p1_normal).add(p2_normal);

    super({
      length: Y_length,
      drawFunction,
      res,
      base: Y_base.items,
      normal: Y_normal.items,
    });
    this.parents = parents;
    this.b_A = b_A;
    this.b_B = b_B;
    this.b_C = b_C;
  }

  update(delta_t) {
    // interpolate verlet particles
    for (let i = 0; i < this.num_control_vertices; i++) {
      let verlet_part = this.verlet_parts[i];
      let p_verlet_parts = [
        this.parents[0].verlet_parts[i],
        this.parents[1].verlet_parts[i],
        this.parents[2].verlet_parts[i],
      ];
      verlet_part.interpolate({
        weights: [this.b_A, this.b_B, this.b_C],
        parents: p_verlet_parts,
      });
    }
    // generate curves based on interpolated vertices
    this.generateBezierControlVertices();
    this.final_vertices = this.generateFinalVertices(this.bezier_resolution); //8 is the number of verts between each pair of control points
  }
}
