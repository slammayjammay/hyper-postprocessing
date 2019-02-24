const { homedir } = require('os');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { EffectPass, Effect } = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const spaceEffect = new Effect(
		'space',
		readFileSync(resolve(__dirname, '../../glsl/space-travel.glsl')).toString()
	);

	return { pass: new EffectPass(null, spaceEffect) };
};
