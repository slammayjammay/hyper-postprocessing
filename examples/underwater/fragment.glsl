uniform sampler2D tDiffuse;
uniform sampler2D backgroundTexture;
uniform vec2 resolution;
uniform float aspect;
uniform float timeElapsed;
uniform float timeDelta;
varying vec2 vUv;

#pragma glslify: rippleShader = require('./ripple-shader', resolution=resolution, timeElapsed=timeElapsed)

void main() {
	vec2 ripplePos = rippleShader(vUv);
	ripplePos *= 0.9;

	vec4 fg = texture2D(tDiffuse, vUv);
	vec4 bg = texture2D(backgroundTexture, ripplePos);
	bg.a = 0.4;

	vec3 blended = bg.rgb * bg.a + fg.rgb * fg.a * (1.0 - bg.a);

	gl_FragColor = blended;
}
