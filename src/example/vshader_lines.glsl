precision mediump float;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;

attribute vec4 a_Position;

void main()
{
  gl_Position = projection * view * model * a_Position;
}
