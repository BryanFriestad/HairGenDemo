precision mediump float;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;
uniform vec4 color;

attribute vec4 a_Position;

varying vec4 fColor;

void main()
{
  fColor = color;
  gl_Position = projection * view * model * a_Position;
}
