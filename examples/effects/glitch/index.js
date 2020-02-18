const { readFileSync } = require('fs');
const { resolve } = require('path');
const { Vector2 } = require('three');
const {
	EffectPass,
	Effect,
	GlitchEffect,
	BloomEffect,
	ScanlineEffect,
	SepiaEffect,
	VignetteEffect,
	BlendFunction
} = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const effects = [];

	effects.push(new GlitchEffect({
		delay: new Vector2(1, 7),
		duration: new Vector2(0, 1),
		columns: 0.05
	}));

	effects.push(new BloomEffect({
		kernelSize: 3,
		distinction: 1,
		blendFunction: BlendFunction.ADD
	}));

	effects.push(new ScanlineEffect({ density: 1.3 }));
	effects.push(new SepiaEffect({ intensity: 0.5 }));
	effects.push(new VignetteEffect({
		darkness: 0.6,
		offset: 0
	}));

	effects.push(new Effect(
		'curvedMonitorEffect',
		readFileSync(resolve(__dirname, '../../glsl/curved-monitor.glsl')).toString()
	));

	effects.push(new Effect(
		'sampling',
		readFileSync(resolve(__dirname, '../../glsl/sampling.glsl')).toString(),
		{ blendFunction: BlendFunction.NORMAL }
	));

	return { passes: [new EffectPass(null, ...effects)] };
};
