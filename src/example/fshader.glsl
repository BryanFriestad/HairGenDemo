precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties;
uniform float shininess;
uniform sampler2D sampler;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
varying vec2 fTexCoord;

void main()
{
  // normalize after interpolating
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  vec3 V = normalize(fV);

  // reflected vector
  vec3 R = reflect(-L, N);

  // get the columns out of the light and material properties.  We keep the surface
  // properties separate, so we can mess with them using the sampled texture value
  vec4 ambientSurface = vec4(materialProperties[0], 1.0);
  vec4 diffuseSurface = vec4(materialProperties[1], 1.0);
  vec4 specularSurface = vec4(materialProperties[2], 1.0);

  vec4 ambientLight = vec4(lightProperties[0], 1.0);
  vec4 diffuseLight = vec4(lightProperties[1], 1.0);
  vec4 specularLight = vec4(lightProperties[2], 1.0);

  // sample from the texture at interpolated texture coordinate
  vec4 color = texture2D(sampler, fTexCoord);
  //vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

  float mix_factor = color.a;
  ambientSurface = (1.0 - mix_factor) * ambientSurface + mix_factor * color;
  diffuseSurface = (1.0 - mix_factor) * diffuseSurface + mix_factor * color;
  specularSurface = (1.0 - mix_factor) * specularSurface + mix_factor * color;

  //clamp negative values to zero
  float diffuseFactor = max(0.0, dot(L, N));

  // specular factor from Phong reflection model
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);

  // add the components together, note that vec4 * vec4 is componentwise multiplication,
  // not a dot product
  vec4 ambient = ambientLight * ambientSurface;
  vec4 diffuse = diffuseFactor * diffuseLight * diffuseSurface;
  vec4 specular = specularFactor * specularLight * specularSurface;

  gl_FragColor = ambient + diffuse + specular;
  gl_FragColor.a = 1.0;
}
