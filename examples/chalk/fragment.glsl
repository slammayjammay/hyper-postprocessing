uniform sampler2D tDiffuse;
uniform sampler2D noiseTexture;
uniform vec2 resolution;
uniform float aspect;
uniform float timeElapsed;
uniform float timeDelta;
varying vec2 vUv;

#pragma glslify: edgeGlow = require('../../glsl/chalk', vUv=vUv, tDiffuse=tDiffuse, resolution=resolution, timeElapsed=timeElapsed)

void main() {
	vec4 color = edgeGlow(noiseTexture);
	gl_FragColor = color;
}
