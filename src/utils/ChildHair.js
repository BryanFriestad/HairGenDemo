import HairStrand from './Hair';
import Vector from './Vector';

export default class ChildHair extends HairStrand {
  constructor(parents = Array(3), { drawFunction = () => {}}) {
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

    super({});
    this.parents = parents;
    this.b_A = b_A;
    this.b_B = b_B;
    this.b_C = b_C;
  }

  update(delta_t, allFinalVertices) {
    this.final_vertices = this.interpolateParentHairs({
      weights: [this.b_A, this.b_B, this.b_C],
      parents: this.parents,
    });
    for (let i = 0; i < this.final_vertices.length; i++) {
      allFinalVertices.push(this.final_vertices[i]);
    }
  }

  interpolateParentHairs({ weights: [b_A, b_B, b_C], parents: [p_A, p_B, p_C] }) {
    let output = [];
    let num_final_verts = p_A.final_vertices.length;
    if (num_final_verts != p_B.final_vertices.length) {
      console.log('Error: parent hairs have different number of final vertices');
      return;
    }
    if (num_final_verts != p_C.final_vertices.length) {
      console.log('Error: parent hairs have different number of final vertices');
      return;
    }

    for (let i = 0; i < num_final_verts; i++) {
      let a = b_A * p_A.final_vertices[i];
      let b = b_B * p_B.final_vertices[i];
      let c = b_C * p_C.final_vertices[i];
      output.push(a + b + c);
    }
    return output;
  }
}
