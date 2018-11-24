
precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties;
uniform float shininess;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
void main() 
{
  // normalize after interpolating
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  vec3 V = normalize(fV);

  // reflected vector
  vec3 R = reflect(-L, N);

  // multiply each lighting constant with the corresponding material constant,
  // then grab the three columns to get the ambient, diffuse, and specular components
  mat3 products = matrixCompMult(lightProperties, materialProperties);
  vec4 ambientColor = vec4(products[0], 1.0);
  vec4 diffuseColor = vec4(products[1], 1.0);
  vec4 specularColor = vec4(products[2], 1.0);

  // Lambert's law, clamp negative values to zero
  float diffuseFactor = max(0.0, dot(L, N));

  // specular factor from Phong reflection model
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);

  // add the components together
  gl_FragColor = specularColor * specularFactor + diffuseColor * diffuseFactor + ambientColor;
  gl_FragColor.a = 1.0;
}
