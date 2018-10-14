const { homedir } = require('os');
const { readFileSync } = require('fs');
const { EffectPass, Effect } = require('postprocessing');

const BASE = `${homedir()}/hyper-postprocessing/examples`;

module.exports = ({ hyperTerm, xTerm }) => {
	const filmEffect = new Effect(
		'filmEffect',
		readFileSync(`${BASE}/glsl/film.glsl`).toString(),
		{
			blendFunction: 12 // normal -- overwrite
		}
	);

	return { pass: new EffectPass(null, filmEffect) };
};
