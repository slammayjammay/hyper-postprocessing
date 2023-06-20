const { readFileSync } = require('fs');
const { resolve } = require('path');
const THREE = require('three');
const POSTPROCESSING = require('postprocessing');

class GlslEffect extends POSTPROCESSING.Effect {

	constructor(name, options = {}) {
		const fragmentShader = readFileSync(resolve(__dirname, '../../glsl/' + name + '.glsl')).toString();
		options.blendFunction = options.blendFunction || POSTPROCESSING.BlendFunction.NORMAL;

		super(name, fragmentShader, options);
	}
}


module.exports = ({ hyperTerm, xTerm }) => {

const saveTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { format: THREE.RGBAFormat, stencilBuffer: false })
const savePass = new POSTPROCESSING.SavePass(saveTarget)

const burnInEffect = new GlslEffect('burn-in', {
		uniforms: new Map([
			[ 'burnInSource', new THREE.Uniform(savePass.renderTarget.texture)],
			[ 'burnInTime', new THREE.Uniform(0.4)],
		]),
	}
);

const jitter = 0.3;
const screenCurvature = 0.2;

const retroEffect = new GlslEffect('retro', {
		uniforms: new Map([
			[ 'fontColor', new THREE.Uniform(new THREE.Vector3(200/255, 255/255, 110/255))],
			[ 'backgroundColor', new THREE.Uniform(new THREE.Vector3(0.0, 0.05, 0.0))],
			[ 'chromaColor', new THREE.Uniform(1.0)],
			[ 'staticNoise', new THREE.Uniform(0.2)],
			[ 'noiseSource', new THREE.Uniform(null)],
			[ 'horizontalSyncStrength', new THREE.Uniform(0.250)],
			[ 'horizontalSyncFrequency', new THREE.Uniform(0.30)],
			[ 'jitter', new THREE.Uniform(new THREE.Vector2(0.007 * jitter, 0.002 * jitter))],
			[ 'glowingLine', new THREE.Uniform(0.4)],
			[ 'flickering', new THREE.Uniform(0.2)],
			[ 'ambientLight', new THREE.Uniform(0.05)],
			[ 'pixelHeight', new THREE.Uniform(8.0)],
			[ 'pixelization', new THREE.Uniform(false)],
			[ 'rbgSplit', new THREE.Uniform(0.2)],
		]),
	}
);

new THREE.TextureLoader().load(resolve(__dirname, '../../images/allNoise512.png'), texture => {
	texture.minFilter = THREE.LinearFilter;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	retroEffect.uniforms.get('noiseSource').value = texture;
});

const bloomEffect = new POSTPROCESSING.BloomEffect({
	kernelSize: 3,
	distinction: 0.2,
	// blendFunction: POSTPROCESSING.BlendFunction.AVERAGE,
});

const frameEffect = new GlslEffect('retro_frame', {
		uniforms: new Map([
			[ 'frameColor', new THREE.Uniform(new THREE.Vector3(245/255, 238/255, 216/255))],
			[ 'screenCurvature', new THREE.Uniform(screenCurvature)],
		]),
	}
);

function coordinateTransform(x, y) {
	x -= 0.5;
	y -= 0.5;

	let dist = screenCurvature * (x*x + y*y);
	dist *= 1.0 + dist;

	return [x * dist + x + 0.5, y * dist + y + 0.5];
};

return {
	passes: [
		new POSTPROCESSING.EffectPass(null, burnInEffect),
		savePass,
		new POSTPROCESSING.EffectPass(null, retroEffect),
		new POSTPROCESSING.EffectPass(null, bloomEffect),
		new POSTPROCESSING.EffectPass(null, frameEffect),
	],
	coordinateTransform: coordinateTransform,
	three: THREE,
	postprocessing: POSTPROCESSING
};


};


