import { Pass } from 'postprocessing';

export default class extends Pass {
	constructor(shaderMaterial) {
		if (!shaderMaterial) {
			throw new Error(`ShaderMaterial must be given.`);
		}

		super();

		this.name = 'DefaultShaderPass';
		this.uniforms = {};

		this.needsSwap = true;
		this.material = shaderMaterial;
		this.quad.material = this.material;
	}

	setUniform(key, value) {
		this.uniforms[key] = value;
	}

	render(renderer, readBuffer, writeBuffer, timeDelta) {
		this.material.uniforms.tDiffuse.value = readBuffer.texture;
		this.material.uniforms.timeDelta.value = timeDelta;
		this.material.uniforms.aspect.value = this.uniforms.aspect;
		this.material.uniforms.timeElapsed.value = this.uniforms.timeElapsed;

		renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
	}
};
