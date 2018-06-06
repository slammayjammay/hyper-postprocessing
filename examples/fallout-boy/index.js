const { homedir } = require('os');
const { readFileSync } = require('fs');
const { TextureLoader, LinearFilter } = require('three');

const BASE = `${homedir()}/hyper-postprocessing`;

/* `hyper-postprocessing` entry file */
module.exports = ({ ShaderMaterial }) => {
	const fragmentShader = `
	uniform sampler2D tDiffuse;
	uniform sampler2D backgroundTexture;
	uniform float timeElapsed;
	varying vec2 vUv;

	float blendScreen(float base, float blend) {
		return 1.0-((1.0-base)*(1.0-blend));
	}

	void main() {
		vec4 diffuseColor = texture2D(tDiffuse, vUv);

		// add motion to background
		vec2 pos = vec2(vUv.x + timeElapsed * 0.1, vUv.y);
		pos.x = mod(pos.x, 1.0);
		vec4 backgroundColor = texture2D(backgroundTexture, pos);

		vec4 src = diffuseColor;
		vec4 dest = backgroundColor;
		float srcFactor = 1.0 - dest.a;
		float destFactor = src.a;
		vec3 blended = src.rgb * srcFactor + dest.rgb * destFactor;

		// apply brightness
		vec4 color = vec4(blended, 1.0) * 1.2;
		gl_FragColor = color;
	}
	`;

	const shaderMaterial = new ShaderMaterial({
		fragmentShader,
		uniforms: {
			backgroundTexture: { value: null }
		}
	});

	// load background image
	const imagePath = `file://${BASE}/examples/fallout-boy/fallout-boy.jpg`;
	new TextureLoader().load(imagePath, texture => {
		texture.minFilter = LinearFilter;
		shaderMaterial.uniforms.backgroundTexture.value = texture;
	});

	return { shaderMaterial };
};
