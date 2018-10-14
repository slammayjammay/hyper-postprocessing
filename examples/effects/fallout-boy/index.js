const { homedir } = require('os');
const { readFileSync } = require('fs');
const { TextureLoader, LinearFilter, Uniform } = require('three');
const { EffectPass, Effect } = require('postprocessing');

const BASE = `${homedir()}/hyper-postprocessing/examples`;

module.exports = ({ hyperTerm, xTerm }) => {
	// turn all colors that aren't black into white -- then we can multiply the
	// image against this to "shine" through only the text (setting the background
	// to black in the hyper config is required)
	const textEffect = new Effect(
		'textEffect',
		readFileSync(`${BASE}/glsl/black-and-white.glsl`).toString()
	);

	// move background image left
	const backgroundEffect = new Effect(
		'backgroundEffect',
		readFileSync(`${BASE}/glsl/background-image.glsl`).toString(),
		{
			uniforms: new Map([['backgroundImage', new Uniform(null)]]),
			defines: new Map([['motionX', '-0.1']]),
			blendFunction: 10 // multiply
		}
	);

	new TextureLoader().load(`${BASE}/images/fallout-boy.jpg`, texture => {
		texture.minFilter = LinearFilter;
		backgroundEffect.uniforms.get('backgroundImage').value = texture;
	});

	return { pass: new EffectPass(null, textEffect, backgroundEffect) };
};
