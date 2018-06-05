const { homedir } = require('os');
const { readFileSync } = require('fs');
const { BloomPass } = require('postprocessing');

const BASE = `${homedir()}/hyper-postprocessing/`;

/* `hyper-postprocessing` entry file */
module.exports = () => {
	const fragmentShaderPath = `${BASE}/examples/space-travel/compiled.glsl`;
	const fragmentShader = readFileSync(fragmentShaderPath).toString();

	return [
		fragmentShader,
		{ shaderPass: new BloomPass({ intensity: 2 }) }
	];
};
