import { ShaderMaterial } from 'three';

const DEFAULTS = {
	vertexShader: `
	uniform sampler2D tDiffuse;
	uniform float aspect;
	uniform float timeElapsed;
	uniform float timeDelta;
	varying vec2 vUv;

	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
	`,

	fragmentShader: `
	uniform sampler2D tDiffuse;
	uniform float aspect;
	uniform float timeElapsed;
	uniform float timeDelta;
	varying vec2 vUv;

	void main() {
		gl_FragColor = texture2D(tDiffuse, vUv);
	}
	`
};

export default class extends ShaderMaterial {
	constructor(options) {
		options = Object.assign({}, DEFAULTS, options);

		super({
			uniforms: {
				tDiffuse: { value: null },
				aspect: { value: null },
				timeElapsed: { value: null },
				timeDelta: { value: null },
			},
			vertexShader: options.vertexShader,
			fragmentShader: options.fragmentShader
		});
	}
};
