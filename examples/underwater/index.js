const { homedir } = require('os');
const { readFileSync } = require('fs');
const { TextureLoader, LinearFilter } = require('three');

const BASE = `${homedir()}/hyper-postprocessing`;

/* `hyper-postprocessing` entry file */
module.exports = ({ ShaderMaterial }) => {
	// compiled using `glslify`
	const fragmentShaderPath = `${BASE}/examples/underwater/compiled.glsl`;
	const fragmentShader = readFileSync(fragmentShaderPath).toString();

	const shaderMaterial = new ShaderMaterial({
		fragmentShader,
		uniforms: {
			backgroundTexture: { value: null }
		}
	});

	const imagePath = `file://${BASE}/examples/underwater/images/underwater.jpg`;
	new TextureLoader().load(imagePath, texture => {
		texture.minFilter = LinearFilter;
		shaderMaterial.uniforms.backgroundTexture.value = texture;
	});

	return { shaderMaterial };
};
