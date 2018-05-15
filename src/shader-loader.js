import ShaderPass from './ShaderPass';
import ShaderMaterial from './ShaderMaterial';

export const createPassFromFragmentString = (fragmentShader) => {
	return createPassFromOptions({ fragmentShader });
};

export const createPassFromOptions = (options) => {
	if (options.shaderPass) {
		return options.shaderPass;
	}

	if (options.shaderMaterial) {
		return new ShaderPass(options.shaderMaterial);
	}

	if (options.vertexShader || options.fragmentShader) {
		return new ShaderPass(new ShaderMaterial(options));
	}

	return null;
};

export const createPassFromCallback = (callback, { hyperTerm, xTerm }) => {
	return callback({ ShaderPass, ShaderMaterial, hyperTerm, xTerm });
};
