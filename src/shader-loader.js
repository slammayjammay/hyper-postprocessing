import ShaderPass from './ShaderPass';
import ShaderMaterial from './ShaderMaterial';

export const createPassFromFragmentString = (fragmentShader) => {
	return createPassFromOptions({ fragmentShader });
};

export const createPassFromOptions = (options) => {
	if (options.shaderPass) {
		return options.shaderPass;
	}

	const material = options.shaderMaterial || new ShaderMaterial(options);
	return new ShaderPass(material);
};

export const createPassFromCallback = (callback) => {
	return callback({ ShaderPass, ShaderMaterial });
};
