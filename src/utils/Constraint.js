export class Constraint {
  constructor(p1, p2) {
    this.particle1 = p1;
    this.particle2 = p2;
  }

  solve() {}
}

export class DistanceConstraint extends Constraint {
  constructor(p1, p2, restDist) {
    super(p1, p2);
    this.restDistance = restDist;
  }

  solve() {
    let diff_x = this.particle1.position.elements[0] - this.particle2.position.elements[0];
    let diff_y = this.particle1.position.elements[1] - this.particle2.position.elements[1];
    let diff_z = this.particle1.position.elements[2] - this.particle2.position.elements[2];
    let distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y + diff_z * diff_z);
    let scale = (this.restDistance - distance) / distance;
    let t_x = diff_x * 0.5 * scale;
    let t_y = diff_y * 0.5 * scale;
    let t_z = diff_z * 0.5 * scale;

    if (!this.particle1.fixed_pos) {
      this.particle1.position.elements[0] = this.particle1.position.elements[0] + t_x;
      this.particle1.position.elements[1] = this.particle1.position.elements[1] + t_y;
      this.particle1.position.elements[2] = this.particle1.position.elements[2] + t_z;
    }
    if (!this.particle2.fixed_pos) {
      this.particle2.position.elements[0] = this.particle2.position.elements[0] - t_x;
      this.particle2.position.elements[1] = this.particle2.position.elements[1] - t_y;
      this.particle2.position.elements[2] = this.particle2.position.elements[2] - t_z;
    }
  }
}

// Describes a constraint in which two particles must be
export class PearlPearlConstraint extends Constraint {
  constructor(p1, p2) {
    super(p1, p2);
  }

  solve() {
    let diff_x = this.particle1.position.elements[0] - this.particle2.position.elements[0];
    let diff_y = this.particle1.position.elements[1] - this.particle2.position.elements[1];
    let diff_z = this.particle1.position.elements[2] - this.particle2.position.elements[2];
    let distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y + diff_z * diff_z);
    let minDist = this.particle1.pearl_radius + this.particle2.pearl_radius;
    if (distance < minDist) {
      let scale = (minDist - distance) / distance;
      let t_x = diff_x * 0.5 * scale;
      let t_y = diff_y * 0.5 * scale;
      let t_z = diff_z * 0.5 * scale;

      if (!this.particle1.fixed_pos) {
        this.particle1.position.elements[0] = this.particle1.position.elements[0] + t_x;
        this.particle1.position.elements[1] = this.particle1.position.elements[1] + t_y;
        this.particle1.position.elements[2] = this.particle1.position.elements[2] + t_z;
      }
      if (!this.particle2.fixed_pos) {
        this.particle2.position.elements[0] = this.particle2.position.elements[0] - t_x;
        this.particle2.position.elements[1] = this.particle2.position.elements[1] - t_y;
        this.particle2.position.elements[2] = this.particle2.position.elements[2] - t_z;
      }
    }
  }
}

export class ConstraintContainer {
  constructor() {
    this.constraints = [];
  }

  add(constraint) {
    this.constraints.push(constraint);
  }

  //adds pp constraints between the given hairs and object spheres
  addHairObjectCollision(obj_pearls, hairs) {
    for (let i = 0; i < obj_pearls.length; i++) {
      for (let j = 0; j < hairs.length; j++) {
        let parts = hairs[j].verlet_parts;
        for (let k = 1; k < parts.length; k++) {
          this.add(new PearlPearlConstraint(obj_pearls[i], parts[k]));
        }
      }
    }
  }

  generatePPConstraints(particles) {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        this.add(new PearlPearlConstraint(particles[i], particles[j]));
      }
    }
  }

  solve(iterations = 10) {
    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < this.constraints.length; j++) {
        this.constraints[j].solve();
      }
    }
  }
}
