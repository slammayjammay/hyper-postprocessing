const int mSize = 4;

vec3 colorDodge(in vec3 src, in vec3 dst) {
    return step(0.0, dst) * mix(min(vec3(1.0), dst/ (1.0 - src)), vec3(1.0), step(1.0, src));
}

float greyScale(in vec3 col) {
  return dot(col, vec3(0.3, 0.59, 0.11));
}

vec2 random(vec2 p) {
	p = fract(p * (vec2(314.159, 314.265)));
  p += dot(p, p.yx + 17.17);
  return fract((p.xx + p.yx) * p.xy);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec2 q = uv;
  vec3 col = texture2D(inputBuffer, q).rgb;

  vec2 r = random(q);
  r.x *= PI2;
  vec2 cr = vec2(sin(r.x),cos(r.x))*sqrt(r.y);

  vec3 blurred = texture2D(inputBuffer, q + cr * 0.5 * (vec2(mSize) / resolution.xy) ).rgb;

  vec3 inv = vec3(1.0) - blurred * 1.5;
  // color dodge
  vec3 lighten = colorDodge(col, inv);
	vec3 res = vec3(1.0) - lighten;

 	outputColor = vec4(res, 1.0);
}
