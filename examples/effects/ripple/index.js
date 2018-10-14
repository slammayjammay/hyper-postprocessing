const { homedir } = require('os');
const { readFileSync } = require('fs');
const { TextureLoader, LinearFilter, Uniform } = require('three');
const { EffectPass, Effect } = require('postprocessing');

const BASE = `${homedir()}/hyper-postprocessing/examples`;

module.exports = ({ hyperTerm, xTerm }) => {
	const effects = [];

	const backgroundEffect = new Effect(
		'backgroundImage',
		readFileSync(`${BASE}/glsl/background-image.glsl`).toString(),
		{
			uniforms: new Map([['backgroundImage', new Uniform(null)]])
		}
	);
	new TextureLoader().load(`${BASE}/images/underwater.jpg`, texture => {
		texture.minFilter = LinearFilter;
		backgroundEffect.uniforms.get('backgroundImage').value = texture;
	});
	effects.push(backgroundEffect);

	effects.push(new Effect(
		'underwaterEffect',
		readFileSync(`${BASE}/glsl/ripple.glsl`).toString()
	));

	effects.push(new Effect(
		'scaleEffect',
		readFileSync(`${BASE}/glsl/scale.glsl`).toString(),
		{
			defines: new Map([['scale', '0.9']])
		}
	));

	effects.push(new Effect(
		'sampling',
		readFileSync(`${BASE}/glsl/sampling.glsl`).toString(),
		{
			blendFunction: 12
		}
	));

	return { pass: new EffectPass(null, ...effects) };
};
