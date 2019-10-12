import { homedir } from 'os';
import loadConfig from './load-config';
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
			this.activeTermGroupId = null;
			this.activeTerms = [];

			const userConfig = window.config.getConfig().hyperPostprocessing || {};
			this.config = Object.assign({}, CONFIG_DEFAULTS, userConfig);
			this.parsedEntry = null;
		}

		_onDecorated(hyper) {
			if (this.props.onDecorated) {
				this.props.onDecorated(hyper);
			}

			if (!this.config.entry || this._isInit) {
				return;
			}

			this._hyper = hyper;
			this._init();
		}

		_init() {
			this.parsedEntry = loadConfig(this.config.entry);

			if (!this.parsedEntry || this.parsedEntry.passes.length === 0) {
				return;
			}

			this._isInit = true;
		}

		componentDidUpdate() {
			setTimeout(() => this.sync());
		}

		sync() {
			const state = window.store.getState();
			const activeRootId = state.termGroups.activeRootGroup;
			const allIds = Object.keys(state.sessions.sessions);

			const numTermsChanged = allIds.length !== this.map.size;
			const didActiveGroupChange = activeRootId !== this.activeTermGroupId;

			// stop render loop for non-visible terms
			if (didActiveGroupChange) {
				this.activeTerms.forEach(term => {
					const { xTermEffect } = this.map.get(term.props.uid);
					xTermEffect.cancelAnimationLoop();
				});
			}

			// destroy terms that don't exist anymore
			if (numTermsChanged) {
				for (const id of this.map.keys()) {
					if (!state.sessions.sessions[id]) {
						this.destroySessionId(id);
					}
				}
			}

			this.activeTermGroupId = activeRootId;
			this.activeTerms = this.getActiveTerms(state);

			// setup newly created terms
			this.activeTerms.forEach(term => {
				if (!this.map.has(term.props.uid)) {
					const id = term.props.uid;
					const xTermEffect = new XTermEffect(term.term, this.parsedEntry);
					this.map.set(id, { term, xTermEffect });

					xTermEffect.setup();
				}
			});

			// begin render loop for visible terms
			this.activeTerms.forEach(term => {
				const { xTermEffect } = this.map.get(term.props.uid);
				xTermEffect.readDimensions();
				xTermEffect.startAnimationLoop();
			});
		}

		getActiveTerms(state) {
			const activeRootId = state.termGroups.activeRootGroup;
			const activeTermIds = this.getActiveTermsIdsForRootId(state, activeRootId);

			return activeTermIds.map(id => {
				const sessionId = state.termGroups.termGroups[id].sessionUid;
				return this._hyper.terms.terms[sessionId];
			});
		}

		getActiveTermsIdsForRootId(state, rootTermId) {
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

		destroySessionId(id) {
			if (!this.map.has(id)) {
				return;
			}

			const { xTermEffect } = this.map.get(id);

			xTermEffect.destroy();
			this.map.delete(id);
			return true;
		}

		destroyXTermEffect(effect) {
			for (const [id, { xTermEffect }] of this.map.entries()) {
				if (xTermEffect === effect) {
					return this.destroySessionId(id);
				}
			}

			return false;
		}

		render() {
			return React.createElement(Hyper, Object.assign({}, this.props, {
				onDecorated: this._onDecorated
			}));
		}

		componentWillUnmount() {
			if (this._isInit) {
				this.destroy();
			}
		}

		destroy() {
			for (const id of this.map.keys()) {
				this.destroySessionId(id);
			}
			this.map.clear();

			this._onDecorated = null;

			this._hyper = null;
			this._isInit = null;
			this.map = null;
			this.activeTermGroupId = this.activeTerms = null;

			this.config = this.parsedEntry = null;
		}
	}

	return HyperComponent;
};

// CSS to position the our canvas correctly
exports.decorateConfig = (config) => {
	return Object.assign({}, config, {
		css: `
		${config.css || ''}

		.term_term {
			position: relative;
		}

		.hyper-postprocessing.canvas {
			position: absolute;
			top: 0;
			left: 0;
		}
		`
	});
};
