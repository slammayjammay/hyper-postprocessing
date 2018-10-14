const { homedir } = require('os');
const { readFileSync } = require('fs');
const { EffectPass, Effect } = require('postprocessing');

const BASE = `${homedir()}/hyper-postprocessing/examples`;

module.exports = ({ hyperTerm, xTerm }) => {
	const spaceEffect = new Effect(
		'space',
		readFileSync(`${BASE}/glsl/space-travel.glsl`).toString()
	);

	return { pass: new EffectPass(null, spaceEffect) };
};
