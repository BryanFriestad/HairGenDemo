
//a particle to represent a point in a hair strand simulated using verlet integration
class VerletParticle {
  constructor(
    base_x,
    base_y,
    base_z,
    anchored,
    damping
  ){
    this.position = new Vector3([base_x, base_y, base_z]);
    this.prevPosition = new Vector3([base_x, base_y, base_z]);
    this.velocity = new Vector3();
    this.acceleration = new Vector3();
    this.fixed_pos = anchored;
    this.dampen_factor = damping;
    }

  update(delta_t){
    if(this.fixed_pos){
      this.prevPosition = this.position;
      this.velocity = new Vector3();
      this.acceleration = new Vector3();
    }
    else{
      this.acceleration = new Vector3([0, -9.81, 0]);
      let prev_x = this.prevPosition.elements[0];
      let prev_y = this.prevPosition.elements[1];
      let prev_z = this.prevPosition.elements[2];
      let x = this.position.elements[0];
      let y = this.position.elements[1];
      let z = this.position.elements[2];
      let v_x = x - prev_x;
      let v_y = y - prev_y;
      let v_z = z - prev_z;
      let a_x = this.acceleration.elements[0];
      let a_y = this.acceleration.elements[1];
      let a_z = this.acceleration.elements[2];
      this.prevPosition = new Vector3([x, y, z]);
      let new_x = x + (v_x * this.dampen_factor) + (a_x * Math.pow(delta_t, 2));
      let new_y = y + (v_y * this.dampen_factor) + (a_y * Math.pow(delta_t, 2));
      let new_z = z + (v_z * this.dampen_factor) + (a_z * Math.pow(delta_t, 2));
      this.position = new Vector3([new_x, new_y, new_z]);
    }
  }

  setPosition(x, y, z){
    this.prevPosition = this.position;
    this.position = new Vector3([x, y, z]);
  }
}

export default VerletParticle;
