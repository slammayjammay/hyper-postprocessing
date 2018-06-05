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

	void main() {
		vec4 fg = texture2D(tDiffuse, vUv);
		vec4 bg = texture2D(backgroundTexture, vUv);

		vec3 blended = bg.rgb * bg.a + fg.rgb * fg.a * (1.0 - bg.a);

		gl_FragColor = color;
	}
	`;

	// first pass is to blend foreground and background
	const backgroundMaterial = new ShaderMaterial({
		fragmentShader,
		uniforms: {
			backgroundTexture: { value: null }
		}
	});

	// second pass is the film effect
	const filmShaderPath = `${homedir()}/examples/film-pass.glsl`;
	const filmShader = readFileSync(filmShaderPath).toString();

	// load background image
	const imagePath = `file://${BASE}/examples/film/film.jpg`;
	new TextureLoader().load(imagePath, texture => {
		texture.minFilter = LinearFilter;
		backgroundMaterial.uniforms.backgroundTexture.value = texture;
	});

	return [
		{ shaderMaterial: backgroundMaterial },
		filmShader
	];
};
