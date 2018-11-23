
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;

attribute vec4 a_Position;
attribute vec3 a_Normal;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
void main() 
{
  // convert position to eye coords
  vec4 positionEye = view * model * a_Position;

  // convert light position to eye coords
  vec4 lightEye = view * lightPosition;

  // vector to light
  fL = (lightEye - positionEye).xyz;

  // transform normal vector into eye coords
  fN = normalMatrix * a_Normal;

  // vector from vertex position toward view point
  fV = normalize(-(positionEye).xyz);

  gl_Position = projection * view * model * a_Position;
}
