import requirePeer from './require-peer';

let THREE, PP;

class XTermEffect {
	/**
	 * @param {Xterm} xTerm - instance of xTerm
	 * @param {object} options
	 * @prop {array<ShaderPass|EffectPass>} options.passes - array of
	 * `postprocessing` passes that will be passed to EffectComposer.
	 * @prop {function} [options.coordinateTransform] - a function to modify
	 * mouse event coordinates.
	 * @prop {number} [options.fps=60] - frame rate.
	 */
	constructor(xTerm, options) {
		this.xTerm = xTerm;
		this.options = options;

		this._onCanvasReplacement = this._onCanvasReplacement.bind(this);
		this._onResize = this._onResize.bind(this);
		this._onMouseEvent = this._onMouseEvent.bind(this);

		this._xTermScreen = null; // xterm's container for render layers
		this._xTermLayerMap = new Map(); // map for each render layer and the material we will create
		this._animationId = null; // id of the next animation frame
		this.canvas = null; // the canvas we will inject
		this.clock = this.scene = this.renderer = this.camera = this.composer = null; // threejs + postprocessing stuff

		this.passes = []; // all of the passes for EffectComposer
		this._shaderPasses = []; // a subset of all passes that are not an EffectPass
	}

	setup() {
		THREE = requirePeer.get('three');
		PP = requirePeer.get('postprocessing');

		this._xTermScreen = this.xTerm._core.screenElement;

		const renderLayers = Array.from(this._xTermScreen.querySelectorAll('canvas'));
		for (const canvas of renderLayers) {
			canvas.style.opacity = 0;
		}

		const sortedLayers = this._sortLayers(renderLayers);
		this._setupScene(sortedLayers);
		this.clock = new THREE.Clock({ autoStart: false});

		// store all our passes
		this.passes = [new PP.RenderPass(this.scene, this.camera), ...this.options.passes];
		this.passes[this.passes.length - 1].renderToScreen = true;
		this.passes.forEach(pass => this.composer.addPass(pass));
		this._shaderPasses = this.passes.slice(1).filter(pass => {
			return (pass instanceof PP.Pass) && !(pass instanceof PP.EffectPass);
		});

		// listen for any changes that happen inside XTerm's screen
		this._layerObserver = new MutationObserver(this._onCanvasReplacement);
		this._layerObserver.observe(this._xTermScreen, { childList: true });

		if (typeof this.options.coordinateTransform === 'function') {
			this._coordinateTransform = this.options.coordinateTransform;
			for (const eventType of ['click', 'mousedown', 'mouseup', 'mousemove']) {
				this._xTermScreen.addEventListener(eventType, this._onMouseEvent);
			}
		}

		this.xTerm.on('resize', this._onResize);
		this.readDimensions();
	}

	/**
	 * Boilerplate for threejs.
	 *
	 * @param {Iterable} renderLayers - The list of xTerm's render layers we
	 * will use to create textures out of.
	 */
	_setupScene(renderLayers) {
		const { offsetWidth, offsetHeight } = this.xTerm.element;

		this.canvas = document.createElement('canvas');
		this.canvas.classList.add('hyper-postprocessing', 'canvas');

		// scene!
		this.scene = new THREE.Scene();

		// renderer!
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			preserveDrawingBuffer: true,
			alpha: true
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(offsetWidth, offsetHeight);

		// camera!
		const [w, h] = [offsetWidth / 2, offsetHeight / 2];
		this.camera = new THREE.OrthographicCamera(-w, w, h, -h, 1, 1000);
		this.camera.position.z = 1;

		// composer!
		this.composer = new PP.EffectComposer(this.renderer);

		// xTerm textures!
		let zOffset = -renderLayers.length;
		for (const canvas of renderLayers) {
			const texture = new THREE.CanvasTexture(canvas);
			texture.minFilter = THREE.LinearFilter;

			const geometry = new THREE.PlaneGeometry(offsetWidth, offsetHeight);
			const material = new THREE.MeshBasicMaterial({
				color: 0xFFFFFF,
				map: texture,
				transparent: true
			});
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.z = ++zOffset;

			this.scene.add(mesh);
			this._xTermLayerMap.set(canvas, material);
		}

		// add the element to the page
		this.xTerm.element.append(this.renderer.domElement);
	}

	_onResize() {
		if (this._animationId !== null) {
			this.readDimensions();
		}
	}

	readDimensions() {
		const { offsetWidth: w, offsetHeight: h } = this._xTermScreen;
		const dpRatio = window.devicePixelRatio;

		this.composer.setSize(w, h);

		this._setUniforms({
			aspect: w / h,
			resolution: new THREE.Vector2(w * dpRatio, h * dpRatio)
		});
	}

	/**
	 * Sets the given uniforms on all instances of ShaderPasses. We don't need
	 * to set uniforms on any EffectPasses -- all of the uniforms used here are
	 * automatically updated by postprocessing.
	 *
	 * @param {Object} obj - A map with uniform strings as keys and their value
	 * as values.
	 */
	_setUniforms(obj) {
		for (const uniformKey of Object.keys(obj)) {
			const value = obj[uniformKey];

			for (const pass of this._shaderPasses) {
				const material = pass.getFullscreenMaterial();

				if (material.uniforms[uniformKey] !== undefined) {
					material.uniforms[uniformKey].value = value;
				}
			}
		}
	}

	/**
	 * Sort correctly the renderLayers so the cursor texture is always
	 * on top when we render it.
	 *
	 * @param {Iterable} renderLayers - The list of xTerm's render layers we
	 * need to sort.
	 */
	_sortLayers(renderLayers) {
		function zIndex(element) {
			const { zIndex } = window.getComputedStyle(element);
			return zIndex === 'auto' ? 0 : Number(zIndex);
		}

		renderLayers.sort((a, b) => {
			return zIndex(a) - zIndex(b);
		});

		return renderLayers;
	}

	_onMouseEvent(e) {
		if (e.syntethic) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		const r = e.target.getBoundingClientRect();
		const [w, h] = [r.width, r.height];

		let [x, y] = [(e.clientX - r.left) / w, (r.bottom - e.clientY) / h];
		[x, y] = this._coordinateTransform(x, y);

		const copy = {};
		for (const attr in e) {
			copy[attr] = e[attr];
		}

		[copy.clientX, copy.clientY] = [x * w + r.left, r.bottom - y * h];

		const e2 = new MouseEvent(copy.type, copy);
		e2.syntethic = true;
		copy.target.dispatchEvent(e2);
	}

	/**
	 * Begins the rendering loop, as well as sets time uniforms on passes that
	 * contain them, and sets the `needsUpdate` flag on all of our xTerm
	 * materials.
	 */
	startAnimationLoop() {
		if (this._animationId !== null) {
			return;
		}

		const xTermMaterials = Array.from(this._xTermLayerMap.values());
		const timeUniforms = this._shaderPasses.filter(pass => {
			return pass.getFullscreenMaterial().uniforms.time !== undefined;
		}).map(pass => {
			return pass.getFullscreenMaterial().uniforms.time;
		});

		const xTermMaterialsLength = xTermMaterials.length;
		const timeUniformsLength = timeUniforms.length;

		const that = this;
		const fps = 1000 / this.options.fps;
		let lastRenderTime = fps;
		(function render() {
			that._animationId = window.requestAnimationFrame(render);

			const now = performance.now();
			if (now - lastRenderTime < fps) {
				return;
			}

			for (let i = 0; i < timeUniformsLength; i++) {
				timeUniforms.value = that.clock.getElapsedTime();
			}

			for (let i = 0; i < xTermMaterialsLength; i++) {
				xTermMaterials[i].map.needsUpdate = true;
			}

			that.composer.render(that.clock.getDelta());
			lastRenderTime = now;
		})();
	}

	cancelAnimationLoop() {
		window.cancelAnimationFrame(this._animationId);
		this._animationId = null;
	}

	/**
	 * XTerm sometimes removes and replaces render layer canvases. afaik there
	 * isn't an event that fires when this happens (i think it only happens
	 * when Terminal#setTransparency is called). this function is the callback
	 * for a MutationObserver that observes `.xterm-screen` whenever the
	 * childList changes.
	 */
	_onCanvasReplacement([e]) {
		const { removedNodes, addedNodes } = e;
		for (let i = 0; i < removedNodes.length; i++) {
			this._replaceTexture(removedNodes[i], addedNodes[i]);
		}
	}

	_replaceTexture(removedCanvas, addedCanvas) {
		const affectedMaterial = this._xTermLayerMap.get(removedCanvas);
		const newTexture = new THREE.CanvasTexture(addedCanvas);
		newTexture.minFilter = THREE.LinearFilter;

		affectedMaterial.map.dispose();
		affectedMaterial.map = newTexture;
	}

	/**
	 * Garbage collection.
	 */
	destroy() {
		const renderLayers = Array.from(this._xTermScreen.querySelectorAll('canvas'));
		for (const canvas of renderLayers) {
			canvas.style.opacity = '';
		}

		this.cancelAnimationLoop();
		this.clock.stop();

		while (this.scene.children.length > 0) {
			const mesh = this.scene.children[0];
			this.scene.remove(mesh);

			mesh.material.map.dispose();
			mesh.material.dispose();
			mesh.geometry.dispose();
		}

		this._layerObserver.disconnect();
		this.canvas.remove();
		this.composer.dispose();

		this.renderer.dispose();
		this.renderer.forceContextLoss();
		this.renderer.context = null;
		this.renderer.domElement = null;


		this._onCanvasReplacement = this._onResize = this._onMouseEvent = null;

		this.xTerm = this.options = null;
		this.passes = this._shaderPasses = null;
		this.canvas = null;
		this.clock = this.scene = this.renderer = this.camera = this.composer = null;
		this._xTermScreen = null;
		this._layerObserver = this._xTermLayerMap = null;
	}
}

export default XTermEffect;
