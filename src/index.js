import { homedir } from 'os';
import loadConfig from './load-config';
import requirePeer from './require-peer';
import XTermEffect from './XTermEffect';

const CONFIG_DEFAULTS = {
	entry: `${homedir()}/.hyper-postprocessing.js`,
};

exports.decorateHyper = (Hyper, { React }) => {
	class HyperComponent extends React.Component {
		constructor() {
			super(...arguments);

			this._onDecorated = this._onDecorated.bind(this);

			this._hyper = null;
			this.map = new Map();

			const userConfig = window.config.getConfig().hyperPostprocessing || {};
			this.config = Object.assign({}, CONFIG_DEFAULTS, userConfig);
		}

		_onDecorated(hyper) {
			if (this.props.onDecorated) {
				this.props.onDecorated(hyper);
			}

			if (!this.config.entry) {
				return;
			}

			this._hyper = hyper;
		}

		componentDidUpdate() {
			setTimeout(() => this.sync());
		}

		/**
		 * Reads from the state and creates an XTermEffect for all visible terms,
		 * if one isn't created already.
		 *
		 * `xTerm` refers to the literal xTerm instance.
		 * `term` refers to Hyper's wrapper object around it.
		 * `term.term` is a pointer to `xTerm`.
		 */
		sync() {
			const state = window.store.getState();
			const visibleXTerms = new Set(this.getVisibleTerms(state).map(t => t.term));

			const unusedXTermEffects = [];

			for (const [xTerm, xTermEffect] of this.map.entries()) {
				if (!visibleXTerms.has(xTerm)) {
					unusedXTermEffects.push(xTermEffect);
				}
			}

			for (const xTerm of visibleXTerms) {
				if (!this.map.has(xTerm)) {
					let xTermEffect;
					const canReuse = unusedXTermEffects.length > 0;

					const options = loadConfig(this.config.entry, {
						hyperTerm: this._hyper,
						xTerm
					});

					if (options.passes.length === 0) {
						continue;
					}

					XTermEffect.THREE = requirePeer.get('three');
					XTermEffect.PP = requirePeer.get('postprocessing');

					if (canReuse) {
						xTermEffect = unusedXTermEffects.pop();
						this.map.delete(xTermEffect.xTerm);
						xTermEffect.detach();
						xTermEffect.setPasses(options.passes);
					} else {
						xTermEffect = new XTermEffect(options);
					}

					xTermEffect.attach(xTerm, canReuse);
					xTermEffect.startAnimationLoop();
					this.map.set(xTerm, xTermEffect);
				}
			}

			for (const xTermEffect of unusedXTermEffects) {
				this.destroyXTermEffect(xTermEffect);
			}
		}

		getVisibleTerms(state) {
			const activeRootId = state.termGroups.activeRootGroup;
			const activeTermIds = this.getVisibleTermsIdsForRootId(state, activeRootId);

			return activeTermIds.map(id => {
				const sessionId = state.termGroups.termGroups[id].sessionUid;
				return this._hyper.terms.terms[sessionId];
			});
		}

		getVisibleTermsIdsForRootId(state, rootTermId) {
			const ids = [];

			const cdIntoTerm = (state, termId) => {
				const termObj = state.termGroups.termGroups[termId];

				if (termObj.children.length > 0 && termObj.sessionUid) {
					console.warn(`hyper-postprocessing error: term has children and a session?? "${termObj.uid}".`);
					return;
				}
				if (termObj.children.length === 0 && !termObj.sessionUid) {
					console.warn(`hyper-postprocessing error: term has no children and no session?? "${termObj.uid}".`);
					return;
				}

				if (termObj.children.length === 0) {
					ids.push(termId);
				} else {
					termObj.children.forEach(id => cdIntoTerm(state, id));
				}
			};

			cdIntoTerm(state, rootTermId);

			return ids;
		}

		destroyXTermEffect(xTermEffect) {
			this.map.delete(xTermEffect.xTerm);
			xTermEffect.destroy();
		}

		render() {
			return React.createElement(Hyper, Object.assign({}, this.props, {
				onDecorated: this._onDecorated
			}));
		}

		componentWillUnmount() {
			this.destroy();
		}

		destroy() {
			for (const id of this.map.keys()) {
				this.destroySessionId(id);
			}
			this.map.clear();
			this._hyper = this.map = this.config = null;
		}
	}

	return HyperComponent;
};

// CSS to position the our canvas correctly
exports.decorateConfig = (config) => {
	return Object.assign({}, config, {
		css: `
		${config.css || ''}

		.hyper-postprocessing.canvas {
			position: absolute;
			top: 0;
			left: 0;
		}
		`
	});
};
