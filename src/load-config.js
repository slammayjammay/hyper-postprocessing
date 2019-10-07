import requirePeer from './require-peer';

/**
 * Tries to load from the config path, then parses the export and returns an
 * array of shader passes.
 *
 * @param {String} configPath - Absolute file path to the config file.
 * @param {Object} cbObj - Contains additional data that will be passed along
 * to the exported function.
 */
export default (configPath, cbObj) => {
	let config;

	try {
		config = window.require(configPath);
	} catch (e) {
		console.warn(e);
	}

	if (typeof config === 'function') {
		config = config(cbObj);
	}

	if (!config) {
		return null;
	}

	if (typeof config === 'object') {
		requirePeer.set('three', config.three);
		requirePeer.set('postprocessing', config.postprocessing);
	}

	const parsed = parseConfig(config, cbObj) || [];

	return {
		passes: Array.isArray(parsed) ? parsed : [parsed],
		coordinateTransform: config.coordinateTransform,
		fps: typeof config.fps === 'number' ? config.fps : 60
	};
}

function parseConfig(config, cbObj) {
	if (Array.isArray(config)) {
		return loadFromArray(config);
	}

	if (typeof config === 'string') {
		return loadFromEffectStrings(config);
	}

	if (typeof config === 'object') {
		return loadFromObject(config);
	}

	return null;
}

/**
 * Iterates over the array, combines any adjacent strings into one EffectPass,
 * then re-parses the config object.
 */
function loadFromArray(array) {
	const newConfig = [];
	let effectStrings = [];

	for (let i = 0; i < array.length; i++) {
		if (typeof array[i] === 'string') {
			effectStrings.push(array[i]);
			continue;
		}

		if (effectStrings.length > 0) {
			newConfig.push({ pass: loadFromEffectStrings(effectStrings) });
			effectStrings = [];
		}

		newConfig.push(array[i]);
	}

	if (effectStrings.length > 0) {
		newConfig.push({ pass: loadFromEffectStrings(effectStrings) });
	}

	return newConfig.map(item => parseConfig(item));
}

function loadFromEffectStrings(fragments, vertexShader) {
	if (typeof fragments === 'string') {
		fragments = [fragments];
	}

	const { EffectPass, Effect } = requirePeer.get('postprocessing');

	const effects = [];

	for (const fragment of fragments) {
		effects.push(new Effect('DefaultEffect', fragment, { vertexShader }));
	}

	return new EffectPass(null, ...effects);
}

function loadFromObject(object) {
	if (object.pass) {
		return object.pass;
	}

	if (object.passes) {
		return object.passes;
	}

	if (object.fragmentShader) {
		return loadFromEffectStrings(object.fragmentShader, object.vertexShader);
	}

	return null;
}

