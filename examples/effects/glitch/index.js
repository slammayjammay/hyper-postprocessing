const { homedir } = require('os');
const { readFileSync } = require('fs');
const { Vector2 } = require('three');
const {
	EffectPass,
	Effect,
	GlitchEffect,
	BloomEffect,
	ScanlineEffect,
	SepiaEffect,
	VignetteEffect
} = require('postprocessing');

const BASE = `${homedir()}/hyper-postprocessing/examples`;

module.exports = ({ hyperTerm, xTerm }) => {
	const effects = [];

	effects.push(new GlitchEffect({
		delay: new Vector2(1, 7),
		duration: new Vector2(0, 1),
		columns: 0.05
	}));

	effects.push(new BloomEffect());

	effects.push(new ScanlineEffect({ density: 1 }));
	effects.push(new SepiaEffect({ intensity: 0.5 }));
	effects.push(new VignetteEffect({
		darkness: 0.5,
		offset: 0.2
	}));

	effects.push(new Effect(
		'curvedMonitorEffect',
		readFileSync(`${BASE}/glsl/curved-monitor.glsl`).toString()
	));

	effects.push(new Effect(
		'sampling',
		readFileSync(`${BASE}/glsl/sampling.glsl`).toString(),
		{
			blendFunction: 12 // normal -- overwrite
		}
	))

	return { pass: new EffectPass(null, ...effects) };
};
