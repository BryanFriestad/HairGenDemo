
//a particle to represent a point in a hair strand simulated using verlet integration
var VerletParticle = function(base_x, base_y, base_z, anchored){
  this.position = new Vector3([base_x, base_y, base_z]);
  this.prevPosition = new Vector3([base_x, base_y, base_z]);
  this.velocity = new Vector3();
  this.acceleration = new Vector3();
  this.fixed_pos = anchored;
};
