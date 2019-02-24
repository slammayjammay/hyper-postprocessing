const { homedir } = require('os');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { ShaderPass, EffectPass, Effect, BloomEffect, LuminanceMaterial } = require('postprocessing');
const { Vector2 } = require('three');

module.exports = ({ hyperTerm, xTerm }) => {
	// two passes. one to scale the text down a bit so blooming doesn't go right
	// up against the edge of the terminal. another for space and bloom effects.
	const scaleEffects = [];
	const spaceEffects = [];

	// scale
	scaleEffects.push(new Effect(
		'scale',
		readFileSync(resolve(__dirname, '../../glsl/scale.glsl')).toString(),
		{
			defines: new Map([['scale', '0.95']])
		}
	));

	// avoid sampling issues
	scaleEffects.push(new Effect(
		'sampling',
		readFileSync(resolve(__dirname, '../../glsl/sampling.glsl')).toString(),
		{
			blendFunction: 12 // normal -- overwrite
		}
	));

	// space
	spaceEffects.push(new Effect(
		'space',
		readFileSync(resolve(__dirname, '../../glsl/space-travel.glsl')).toString()
	));

	// bloom
	spaceEffects.push(new BloomEffect({
		kernelSize: 4,
		distinction: -0.5
	}));

	return [
		{ pass: new EffectPass(null, ...scaleEffects) },
		{ pass: new EffectPass(null, ...spaceEffects) }
	];
};
