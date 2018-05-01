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
		this.material.uniforms[key].value = value;
	}

	/**
	 * Sets the default uniforms and renders. Only the uniforms that will change
	 * each frame will be set here. Uniforms that do not change each frame can
	 * be set calling `setUniform`.
	 */
	render(renderer, readBuffer, writeBuffer, timeDelta) {
		this.material.uniforms.tDiffuse.value = readBuffer.texture;
		this.material.uniforms.timeDelta.value = timeDelta;
		this.material.uniforms.timeElapsed.value = this.uniforms.timeElapsed;

		renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
	}
}
