import requirePeer from './require-peer';

/**
 * Tries to load from the config path, then parses the export and returns an
 * array of shader passes.
 *
 * @param {String} configPath - Absolute file path to the config file.
 * @param {Object} cbObj - Contains additional data that will be passed along
 * to the exported function.
 */
export default (configPath, ...args) => {
	let exported;

	try {
		exported = window.require(configPath);
		if (typeof exported !== 'function') {
			throw new Error('hyper-postprocessing: entry file must export a function');
		}
	} catch (e) {
		console.warn(e);
		return;
	}

	const config = exported(...args);

	if (!config) {
		return null;
	}

	requirePeer.set('three', config.three);
	requirePeer.set('postprocessing', config.postprocessing);

	config.passes = config.passes.length > 0 ? parsePasses(config.passes) : [];
	config.fps = config.fps || 60;

	return config;
}

function parsePasses(passes) {
	const parsed = [];
	let effectStrings = [];

	for (let i = 0; i < passes.length; i++) {
		if (typeof passes[i] === 'string') {
			effectStrings.push(passes[i]);
			continue;
		}

		if (effectStrings.length > 0) {
			parsed.push(loadFromEffectStrings(effectStrings));
			effectStrings = [];
		}

		parsed.push(passes[i]);
	}

	if (effectStrings.length > 0) {
		parsed.push(loadFromEffectStrings(effectStrings));
	}

	return parsed;
}

function loadFromEffectStrings(fragmentShaders) {
	if (typeof fragmentShaders === 'string') {
		fragmentShaders = [fragmentShaders];
	}

	const { EffectPass, Effect } = requirePeer.get('postprocessing');

	const effects = fragmentShaders.map(fragment => {
		return new Effect('DefaultEffect', fragment);
	});

	return new EffectPass(null, ...effects);
}

