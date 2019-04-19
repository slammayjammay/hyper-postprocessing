import {
	Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, Mesh, Vector2,
	MeshBasicMaterial, CanvasTexture, LinearFilter, Clock
} from 'three';
import { EffectComposer, RenderPass, Pass, EffectPass, Effect } from 'postprocessing';

const THREE_FALLBACK = {
	Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, Mesh, Vector2,
	MeshBasicMaterial, CanvasTexture, LinearFilter, Clock
};
const PP_FALLBACK = { EffectComposer, RenderPass, Pass, EffectPass, Effect };

/**
 * Workaround to allow peer dependencies, using a fallback if not given.
 */
class RequirePeer {
	constructor() {
		this.peers = {};
		this.fallbacks = {
			three: THREE_FALLBACK,
			postprocessing: PP_FALLBACK
		};
	}

	set(name, dependency) {
		this.peers[name] = dependency;
	}

	get(name) {
		return this.peers[name] || this.fallbacks[name];
	}
}

export default new RequirePeer();
