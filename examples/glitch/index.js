const { GlitchPass, DotScreenPass } = require('postprocessing');

/* `hyper-postprocessing` entry file */
module.exports = ({ ShaderMaterial }) => {
	const fragmentShader = `
	uniform sampler2D tDiffuse;
	varying vec2 vUv;

	float easeInQuart(float time, float begin, float change, float duration) {
		return change * (time /= duration) * time * time * time + begin;
	}

	vec2 curvedMonitor(vec2 inputUV) {
		vec2 screenCenter = vec2(0.5);
		float radius = 0.5;
		float magnitude = 0.15; // how far the center of the "monitor" points out
		float cutShort = 0.3; // how far along the the easing curve we travel...I think...

		vec2 coords = vec2(inputUV.x - screenCenter.x, inputUV.y - screenCenter.y);

		float distFromOrigin = distance(inputUV, screenCenter);

		float scalar = easeInQuart(distFromOrigin, 1.0 / cutShort - magnitude, magnitude, radius);
		coords *= scalar * cutShort;

		return vec2(coords.x + screenCenter.x, coords.y + screenCenter.y);
	}

	void main() {
		vec2 pos = curvedMonitor(vUv);

		// avoids awkward texture sampling when pixel is not constrained to (0, 1)
		if (pos.x < 0.0 || pos.y < 0.0 || pos.x > 1.0 || pos.y > 1.0) {
			discard;
		}

		gl_FragColor = texture2D(tDiffuse, pos);
	}
	`;

	const shaderMaterial = new ShaderMaterial({ fragmentShader });

	return [
		{ shaderPass: new GlitchPass() },
		{ shaderPass: new DotScreenPass() },
		{ shaderMaterial }
	];
};
