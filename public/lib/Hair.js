var HairStrand = function(length, base_x, base_y, base_z, normal_x, normal_y, normal_z, drawFunction){
  //we are assuming that normal has already been normalized to one unit
  //additionally, one unit on the normal is one unit on the length
  this.num_control_vertices = 9; //this will create 8 control hair segments
  this.control_vertices = [];
  this.final_vertices = [];
  this.draw = drawFunction || function(){};

  for(let i = 0; i < this.num_control_vertices; i++){
    let temp_x = (i/(this.num_control_vertices-1) * normal_x * length) + base_x;
    let temp_y = (i/(this.num_control_vertices-1) * normal_y * length) + base_y;
    let temp_z = (i/(this.num_control_vertices-1) * normal_z * length) + base_z;
    this.control_vertices.push(temp_x);
    this.control_vertices.push(temp_y);
    this.control_vertices.push(temp_z);
  }

  this.final_vertices = new Float32Array(this.control_vertices);
};

HairStrand.prototype.render = function(matrixWorld)
{
  //make them wiggle a little bit for fun
  for(let i = 0; i < this.num_control_vertices; i++){
    this.final_vertices[3*i] += Math.random() * 0.002 - 0.001;
    this.final_vertices[3*i + 2] += Math.random() * 0.002 - 0.001;
  }
  this.draw();
};

//export default class HairStrand;
