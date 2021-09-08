class XTermEffect {
	static get THREE() {
		return this._THREE;
	}

	static set THREE(val) {
		this._THREE = val;
	}

	static get PP() {
		return this._PP;
	}

	static set PP(val) {
		this._PP = val;
	}

	/**
	 * @param {object} options
	 * @prop {array<ShaderPass|EffectPass>} options.passes - array of
	 * `postprocessing` passes that will be passed to EffectComposer.
	 * @prop {function} [options.coordinateTransform] - a function to modify
	 * mouse event coordinates.
	 * @prop {number} [options.fps=60] - frame rate.
	 */
	constructor(options) {
		this.options = options;

		this._onResize = this._onResize.bind(this);
		this._onMouseEvent = this._onMouseEvent.bind(this);

		this._xTermScreen = null; // xterm's container for render layers
		this._xTermScreenOpacity = null; // holds xTerm's opacity, which we will change to 0
		this._xTermLayerMap = new Map(); // map for each render layer and the material we will create
		this._animationId = null; // id of the next animation frame
		this.scene = this.renderer = this.camera = this.composer = null; // threejs + postprocessing stuff
		this.passes = []; // all of the passes for EffectComposer
		this._shaderPasses = []; // a subset of all passes that are not an EffectPass

		this.clock = new this.constructor.THREE.Clock({ autoStart: false});
		this.canvas = document.createElement('canvas'); // the canvas we will inject
		this.canvas.classList.add('hyper-postprocessing', 'canvas');

		this.prep();
		this.setPasses(options.passes);
	}

	/**
	 * Sets up three+postprocessing boilerplate that is not subject to change.
	 */
	prep() {
		const { Scene, WebGLRenderer, OrthographicCamera } = this.constructor.THREE;
		const { EffectComposer, RenderPass } = this.constructor.PP;

		this.scene = new Scene();

		this.renderer = new WebGLRenderer({
			canvas: this.canvas,
			preserveDrawingBuffer: true,
			alpha: true
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 1, 1000);
		this.camera.position.z = 1;

		this.composer = new EffectComposer(this.renderer);

		this.passes = [new RenderPass(this.scene, this.camera)];
	}

	setPasses(passes) {
		const { Pass, EffectPass } = this.constructor.PP;

		const removed = this.passes.splice(1, this.passes.length, ...passes);

		removed.forEach(pass => {
			this.composer.removePass(pass);
			pass.dispose();
		});

		this.passes[this.passes.length - 1].renderToScreen = true;
		this.passes.forEach(pass => this.composer.addPass(pass));

		this._shaderPasses = this.passes.slice(1).filter(pass => {
			return (pass instanceof Pass) && !(pass instanceof EffectPass);
		});
	}

	attach(xTerm, reuseMeshes) {
		this.xTerm = xTerm;
		this._xTermScreen = this.xTerm._core.screenElement;

		this._xTermScreenOpacity = this._xTermScreen.style.opacity;
		this._xTermScreen.style.opacity = 0;

		const xTermLayers = this.getSortedXTermLayers(this.xTerm);

		if (!reuseMeshes || this.scene.children.length === 0) {
			while (this.scene.children.length) {
				this.scene.remove(this.scene.children[0]);
			}
			this._createMeshes(xTermLayers.length);
		}

		this.addTextures(xTermLayers);

		this.xTerm.element.append(this.canvas);

		if (typeof this.options.coordinateTransform === 'function') {
			this._coordinateTransform = this.options.coordinateTransform;
			for (const eventType of this.getMouseEvents()) {
				this._xTermScreen.addEventListener(eventType, this._onMouseEvent);
			}
		}

		this.xTerm.onResize(this._onResize);
		this.readDimensions();
	}

	getXTermLayers(xTerm) {
		const xTermScreen = xTerm._core.screenElement;
		return Array.from(xTermScreen.querySelectorAll('canvas'));
	}

	getSortedXTermLayers(xTerm) {
		const xTermLayers = this.getXTermLayers(xTerm);

		const getZIndex = (element) => {
			const { zIndex } = window.getComputedStyle(element);
			return zIndex === 'auto' ? 0 : Number(zIndex);
		};

		const map = new Map(xTermLayers.map(el => [el, getZIndex(el)]));

		return xTermLayers.sort((a, b) => map.get(a) - map.get(b));
	}

	getMouseEvents() {
		return ['click', 'mousedown', 'mouseup', 'mousemove'];
	}

	_createMeshes(numLayers) {
		const { PlaneGeometry, MeshBasicMaterial, Mesh } = this.constructor.THREE;

		for (let i = 0; i < numLayers; i++) {
			const geometry = new PlaneGeometry(1, 1);
			const material = new MeshBasicMaterial({ transparent: true });
			const mesh = new Mesh(geometry, material);

			mesh.position.z = -numLayers + i;

			this.scene.add(mesh);
		}
	}

	addTextures(xTermLayers) {
		xTermLayers = xTermLayers || this.getSortedXTermLayers(this.xTerm);

		const { CanvasTexture, LinearFilter } = this.constructor.THREE;

		if (xTermLayers.length !== this.scene.children.length) {
			console.warn('hyper-postprocessing error: number of meshes does not equal number of render layers...');
		}

		for (const [idx, canvas] of xTermLayers.entries()) {
			const texture = new CanvasTexture(canvas);
			texture.minFilter = LinearFilter;

			const mesh = this.scene.children[idx];

			mesh.material.map = texture;

			this._xTermLayerMap.set(canvas, mesh);
		}
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
			resolution: new this.constructor.THREE.Vector2(w * dpRatio, h * dpRatio)
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

		const xTermMaterials = Array.from(this._xTermLayerMap.values()).map(m => m.material);
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
	 * Disassociates the xterm effect from xTerm.
	 */
	detach() {
		if (!this.xTerm) {
			return;
		}

		this.cancelAnimationLoop();
		this.clock.stop();
		this.canvas.remove();

		this._xTermScreen.style.opacity = this._xTermScreenOpacity;
		this._xTermScreenOpacity = null;

		this.xTerm.off('resize', this._onResize);

		for (const eventType of this.getMouseEvents()) {
			this._xTermScreen.removeEventListener(eventType, this._onMouseEvent);
		}

		for (const [canvas, mesh] of this._xTermLayerMap.entries()) {
			mesh.material.map.dispose();
		}

		this.xTerm = this._xTermScreen = null;
	}

	destroy() {
		this.detach();

		this.composer.dispose();
		this.renderer.dispose();
		this.renderer.forceContextLoss();

		this._xTermLayerMap.clear();
		this._xTermLayerMap = null;
		this.xTerm = this.options = null;
		this.passes = this._shaderPasses = null;
		this.canvas = null;
		this.clock = this.scene = this.renderer = this.camera = this.composer = null;
		this._xTermScreen = null;
	}
}

export default XTermEffect;
