
class Constraint {
  constructor(
    p1,
    p2
  ){
    this.particle1 = p1;
    this.particle2 = p2;
    }

  solve(){

  }
}

class DistanceConstraint extends Constraint{
  constructor(
    p1,
    p2,
    restDist
  ){
    super(p1, p2);
    this.restDistance = restDist;
    }

  solve(){
    let diff_x = this.particle1.position.elements[0] - this.particle2.position.elements[0];
    let diff_y = this.particle1.position.elements[1] - this.particle2.position.elements[1];
    let diff_z = this.particle1.position.elements[2] - this.particle2.position.elements[2];
    let distance = Math.sqrt(diff_x*diff_x + diff_y*diff_y + diff_z*diff_z);
    let scale = (this.restDistance - distance) / distance;
    let t_x = diff_x * 0.5 * scale;
    let t_y = diff_y * 0.5 * scale;
    let t_z = diff_z * 0.5 * scale;

    if(!this.particle1.fixed_pos){
      this.particle1.position.elements[0] = this.particle1.position.elements[0] + t_x;
      this.particle1.position.elements[1] = this.particle1.position.elements[1] + t_y;
      this.particle1.position.elements[2] = this.particle1.position.elements[2] + t_z;
    }
    if(!this.particle2.fixed_pos){
      this.particle2.position.elements[0] = this.particle2.position.elements[0] - t_x;
      this.particle2.position.elements[1] = this.particle2.position.elements[1] - t_y;
      this.particle2.position.elements[2] = this.particle2.position.elements[2] - t_z;
    }
  }
}

export default DistanceConstraint;
