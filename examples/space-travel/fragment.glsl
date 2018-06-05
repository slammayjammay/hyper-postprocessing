uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float timeElapsed;
varying vec2 vUv;

#pragma glslify: spaceTravelShader = require('../../glsl/space-travel', vUv=vUv, resolution=resolution, timeElapsed=timeElapsed)

void main() {
	vec4 bg = spaceTravelShader();

	vec2 pos = vUv;
	pos -= 0.5;
	pos *= 1.1;
	bool outOfBounds = (abs(pos.x) >= 0.5 || abs(pos.y) >= 0.5);
	pos += 0.5;

	vec4 fg;

	if (outOfBounds) {
		fg = vec4(0.0);
	} else {
		fg = texture2D(tDiffuse, pos);
	}

	vec3 blended = bg.rgb * bg.a + fg.rgb * fg.a * (1.0 - bg.a);
	gl_FragColor = vec4(blended, 1.0);
}
