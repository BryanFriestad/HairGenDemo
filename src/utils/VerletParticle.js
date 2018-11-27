import { Vector3 } from 'lib/cuon-matrix';
import Vector from 'utils/Vector';
//a particle to represent a point in a hair strand simulated using verlet integration
class VerletParticle {
  constructor(base_x, base_y, base_z, anchored, damping, p_size) {
    this.position = new Vector3([base_x, base_y, base_z]);
    this.prevPosition = new Vector3([base_x, base_y, base_z]);
    this.velocity = new Vector3();
    this.acceleration = new Vector3();
    this.fixed_pos = anchored;
    this.dampen_factor = damping;
    this.pearl_radius = p_size; //the radius of the collision sphere //TODO: make this a passed parameter
    if (this.fixed_pos) this.acceleration = new Vector3();
    else this.acceleration = new Vector3([0, -9.81, 0]);
  }

  update(delta_t) {
    if (this.fixed_pos) return;
    let [prev_x, prev_y, prev_z] = [...this.prevPosition.elements];
    let [x, y, z] = [...this.position.elements];
    let [v_x, v_y, v_z] = [x - prev_x, y - prev_y, z - prev_z];
    let [a_x, a_y, a_z] = this.acceleration.elements;
    this.velocity = new Vector3([v_x, v_y, v_z]);
    this.prevPosition = new Vector3([x, y, z]);
    let new_x = x + v_x * this.dampen_factor + a_x * Math.pow(delta_t, 2);
    let new_y = y + v_y * this.dampen_factor + a_y * Math.pow(delta_t, 2);
    let new_z = z + v_z * this.dampen_factor + a_z * Math.pow(delta_t, 2);
    this.position = new Vector3([new_x, new_y, new_z]);
  }

  interpolate({ weights: [b_A, b_B, b_C], parents: [p_A, p_B, p_C] }) {
    if (this.fixed_pos) return;

    let pA_pos = new Vector(p_A.position.elements).scale(b_A);
    let pB_pos = new Vector(p_B.position.elements).scale(b_B);
    let pC_pos = new Vector(p_C.position.elements).scale(b_C);

    let new_pos = pA_pos.add(pB_pos).add(pC_pos);
    this.position = new Vector3(new_pos.items);
  }

  setPosition(x, y, z) {
    this.prevPosition = this.position;
    this.position = new Vector3([x, y, z]);
  }
}

export default VerletParticle;
