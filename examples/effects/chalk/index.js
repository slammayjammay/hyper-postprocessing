const { readFileSync } = require('fs');
const { resolve } = require('path');
const { TextureLoader, LinearFilter, Uniform } = require('three');
const { EffectPass, Effect } = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const effect = new Effect(
		'chalkEffect',
		readFileSync(resolve(__dirname, '../../glsl/chalk.glsl')).toString(),
		{
			uniforms: new Map([['noiseTexture', new Uniform(null)]])
		}
	);

	new TextureLoader().load(resolve(__dirname, '../../images/noise.png'), texture => {
		texture.minFilter = LinearFilter;
		effect.uniforms.get('noiseTexture').value = texture;
	});

	return { passes: [new EffectPass(null, effect)] };
};
