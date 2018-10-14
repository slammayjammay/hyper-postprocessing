const { homedir } = require('os');
const { readFileSync } = require('fs');
const { TextureLoader, LinearFilter, Uniform } = require('three');
const { EffectPass, Effect } = require('postprocessing');

const BASE = `${homedir()}/hyper-postprocessing/examples`;

module.exports = ({ hyperTerm, xTerm }) => {
	const effect = new Effect(
		'chalkEffect',
		readFileSync(`${BASE}/glsl/chalk.glsl`).toString(),
		{
			attributes: 2,
			uniforms: new Map([['noiseTexture', new Uniform(null)]])
		}
	);

	new TextureLoader().load(`${BASE}/images/noise.png`, texture => {
		texture.minFilter = LinearFilter;
		effect.uniforms.get('noiseTexture').value = texture;
	});

	return { pass: new EffectPass(null, effect) };
};
