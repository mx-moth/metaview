// alert("hello");
const popup = document.getElementById('popup-content');

var RenderableMixin = Base => class extends Base {

	/**
	 * Render this widget in to a new element and return it.
	 */
	render() { throw new Error("Not implemented"); }

	/**
	 * Get the content for this widget, using the cached content if it has been
	 * rendered before, or rendering it fresh using ``render()`` if not.
	 */
	getContent() {
		if (this.el) {
			return this.el;
		}
		return (this.el = this.render());
	}

	/**
	 * Mount this component within another element by appending the rendered
	 * content.
	 */
	mount(parent) {
		parent.appendChild(this.getContent());
		return this;
	}

	/**
	 * Remove this widget from the DOM.
	 */
	dismount() {
		const el = this.getContent();
		if (el.parentNode) {
			el.parentNode.removeChild(this.el);
		}
		return this;
	}
}


class MetatagFamily extends RenderableMixin(Object) {
	constructor(tagList) {
		super();
		this.tagList = tagList;
	}

	static handles(tag) { return False; }

	static tabInfo() { throw new Error("Not implemented"); }
	tab() {
		return Object.assign({
			content: this,
		}, this.constructor.tabInfo());
	}

	render() {
		return el('div', {children: [this.constructor.tabInfo().name]});
	}

	renderHTMLTag({tag, text, attrs}) {
		const attrBits = Object.entries(attrs).reduce((base, bits) => {
			let name = bits[0];
			let value = bits[1].replace(/[\\"]/, '\\\0');
			return base.concat([
				' ',
				el('span', {classList: 'tag--attr', children: [name]}),
				'="',
				el('span', {classList: 'tag--value', children: [value]}),
				'"'
			]);
		}, []);

		var children = [].concat(['<', tag], attrBits, ['>']);

		if (text) {
			children = children.concat([
				el('span', {classList: 'tag--text', children: text}),
				'</', tag, '>',
			]);
		}

		return el('code', {
			classList: 'tag', children: children
		});
	}

	renderTagTable(tags, name, content) {
		name = (name || 'name');
		content = (content || 'content');
		return el('table', {
			classList: 'tag-table',
			children: tags.map(({attrs}) => {
				return el('tr', {children: [
					el('th', {children: [attrs[name]]}),
					el('td', {
						children: [attrs[content]],
						events: {click: (e) => {
							selectElementText(e.target);
						}}
					}),
				]});
			}),
		});
	};
}


class FacebookTags extends MetatagFamily {
	constructor(tagList) {
		const knownTags = {}
		const otherTags = [];
		for (let tag of tagList) {
			if (tag.attrs.property == 'og:title') {
				knownTags.title = tag.attrs.content;
			} else if (tag.attrs.property == 'og:description') {
				knownTags.description = tag.attrs.content;
			} else if (tag.attrs.property == 'og:image') {
				knownTags.image = tag.attrs.content;
			} else {
				otherTags.push(tag);
			}
		}
		super(otherTags);
		this.knownTags = knownTags;
	}

	static handles({tag, attrs}) {
		if (tag != 'meta') return false;
		if (!('property' in attrs)) return false;
		const property = attrs['property'];
		if (property.indexOf('og:') == 0) return true;
		if (property.indexOf('fb:') == 0) return true;
		if (property.indexOf('article:') == 0) return true;
		return false;
	}

	static tabInfo() {
		return {
			id: 'facebook',
			name: 'Facebook',
			icon: 'facebook-f.svg',
		};
	}

	render() {
		return el('div', {
			classList: 'facebook',
			children: [
				this.renderCard(),
				this.renderTagTable(this.tagList, 'property'),
			],
		})
	}

	renderCard() {
		if (Object.keys(this.knownTags).length == 0) {
			return null;
		}

		const children = [];
		if (this.knownTags.image) {
			children.push(el('img', {
				classList: 'facebook--image',
				attrs: {'src': this.knownTags.image},
			}));
		}
		children.push(el('p', {
			classList: 'facebook--title',
			children: [this.knownTags.title]
		}));
		if (this.knownTags.description) {
			children.push(el('p', {
				classList: 'facebook--description',
				children: [this.knownTags.description],
			}));
		}
		return el('div', {classList: 'facebook--card', children: children});
	}
}


class TwitterTags extends MetatagFamily {
	constructor(tagList) {
		const knownTags = {}
		const otherTags = [];
		for (let tag of tagList) {
			if (tag.attrs.name == 'twitter:title') {
				knownTags.title = tag.attrs.content;
			} else if (tag.attrs.name == 'twitter:description') {
				knownTags.description = tag.attrs.content;
			} else if (tag.attrs.name == 'twitter:image') {
				knownTags.image = tag.attrs.content;
			} else {
				otherTags.push(tag);
			}
		}
		super(otherTags);
		this.knownTags = knownTags;
	}

	static handles({tag, attrs}) {
		return tag == 'meta' && 'name' in attrs && attrs['name'].indexOf('twitter:') == 0;
	}

	static tabInfo() {
		return {
			id: 'twitter',
			name: 'Twitter',
			icon: 'twitter.svg',
		};
	}

	render() {
		return el('div', {
			classList: 'twitter',
			children: [
				this.renderCard(),
				this.renderTagTable(this.tagList),
			],
		})
	}

	renderCard() {
		if (Object.keys(this.knownTags).length == 0) {
			return null;
		}

		const children = [];
		if (this.knownTags.image) {
			children.push(el('img', {
				classList: 'twitter--image',
				attrs: {'src': this.knownTags.image},
			}));
		}
		children.push(el('p', {
			classList: 'twitter--title',
			children: [this.knownTags.title]
		}));
		if (this.knownTags.description) {
			children.push(el('p', {
				classList: 'twitter--description',
				children: [this.knownTags.description],
			}));
		}
		return el('div', {classList: 'twitter--card', children: children});
	}
}


class OtherTags extends MetatagFamily {
	static handles(tag) { return true; }

	static tabInfo() {
		return {
			id: 'other',
			name: 'Other meta tags',
			icon: 'share.svg',
		};
	}

	render() {
		return el('table', {
			classList: 'tag-table',
			children: this.tagList.map((tag) => {
				let tagEl = this.renderHTMLTag(tag);
				return el('tr', {children: [el('td', {
					children: [tagEl],
					events: {
						click: (e) => {
							selectElementText(tagEl);
						}
					},
				})]});
			}),
		});
	}
}


const allHandlers = [
	FacebookTags,
	TwitterTags,
	OtherTags,
];


class Tabs extends RenderableMixin(Object) {
	constructor(tabs, tabState) {
		super();
		this.tabs = tabs;
		if (typeof tabState != 'object') {
			tabState = {};
		}
		this.tabState = tabState;
	}

	render() {
		this.tabBar = el('div', {classList: 'tabs--bar'});
		this.content = el('div', {classList: 'tabs--content'});
		this.el = el('div', {
			classList: 'tabs',
			children: [this.tabBar, this.content],
		});
		this.makeTabBar();

		let tabToActivate = this.tabs[0];
		for (let tab of this.tabs) {
			if (tab.id == this.tabState.activeTab) {
				tabToActivate = tab;
				break;
			}
		}
		this.activateTab(tabToActivate);

		return this.el;
	}

	makeTabBar() {
		this.tabs.forEach((tab) => {
			tab.tab = this.makeTab(tab, {
				events: {
					click: (e) => {
						e.preventDefault();
						this.activateTab(tab);
					},
				},
			});
			this.tabBar.appendChild(tab.tab);
		});
	}

	makeTab(tab, opts) {
		tab.tab = el('div', Object.assign({
			classList: 'tabs--tab',
			children: [inlineSvg('/assets/icons/' + tab.icon, 'tabs--icon')],
			attrs: {'title': tab.name},
		}, opts));
		return tab.tab;
	}

	storeTabState(state) {
		Object.assign(this.tabState, state);
		browser.storage.local.set({'tabState': state})
	}

	static fetchTabState() {
		return browser.storage.local
			.get('tabState')
			.then((results) => results.tabState)
	}

	activateTab(tab) {
		if (this.activeTab) {
			this.activeTab.tab.classList.remove('active');
			this.activeTab.content.dismount();
		}

		this.activeTab = tab;

		if (this.activeTab) {
			this.activeTab.tab.classList.add('active');
			this.activeTab.content.mount(this.content);
			this.storeTabState({'activeTab': tab.id})
		}
	}
}


/**
 * Take an iterable ``iter`` and a predicate function, and return an object
 * with two arrays ``{yes: [..], no: [..]}``, where ``yes`` contains all the
 * items from ``iter`` that the predicate function returned true for, and
 * ``no`` contains all the other elements.
 */
function partition(arr, pred) {
	return Array.from(arr).reduce(function(base, item) {
		let {yes, no} = base;
		if (pred(item)) {
			yes.push(item);
		} else {
			no.push(item);
		}
		return base;
	}, {yes: [], no: []});
}


/**
 * Construct a text node.
 */
function txt(content) {
	return document.createTextNode(content);
}


/**
 * Construct an element with (optional) class name, children, and attributes.
 */
function el(name, opts) {
	const element = document.createElement(name);

	if (opts.classList) {
		element.classList.add(opts.classList);
	}
	if (opts.children) {
		for (let child of opts.children) {
			if (child instanceof Node) {
				element.appendChild(child);
			} else if (child === null) {
				// Noop
			} else {
				element.appendChild(txt(child));
			}
		}
	}
	if (opts.attrs) {
		for (let [attr, val] of Object.entries(opts.attrs)) {
			element.setAttribute(attr, val);
		}
	}
	if (opts.events) {
		for (let [event, handler] of Object.entries(opts.events)) {
			element.addEventListener(event, handler);
		}
	};
	return element
}


/**
 * Create an element that will be filled with an inline SVG image bundled with
 * the addon. This SVG image is fetched asynchronously.
 */
function inlineSvg(url, classList) {
	var wrapper = el('span', {classList: (classList || 'svg')});
	fetch(browser.runtime.getURL(url))
		.then((response) => response.text())
		.then((content) => {
			const parser = new DOMParser()
			const doc = parser.parseFromString(content, "image/svg+xml");
			wrapper.appendChild(doc.documentElement)
		})
	return wrapper;
}


/**
 * Entry point to the addon, constructs the handlers and makes the tabbed
 * widget thing.
 */
function handleTags(metaTags, tabState) {
	const popup = document.getElementById('popup-content');
	const handlers = []

	if (metaTags.length == 0) {
		return;
	}

	popup.innerHTML = '';

	for (const handler of allHandlers) {
		let {yes, no} = partition(metaTags, handler.handles);
		if (yes.length) {
			handlers.push(new handler(yes));

			metaTags = no;
		}
	}

	const tabs = handlers.map((handler) => handler.tab());
	new Tabs(tabs, tabState).mount(popup);
}


/**
 * Selects the text of, and copies the text of, an element
 */
function selectElementText(el) {
	// Clear any current selection
	const selection = window.getSelection();
	selection.removeAllRanges();

	// Select paragraph
	const range = document.createRange();
	range.selectNodeContents(el);
	selection.addRange(range);

	// Copy the content to the clipboard anyway
	navigator.clipboard.writeText(el.innerText);
}

/*
 * Fetch the tags from the page, fetch the configuration from storage, and
 * start the popup.
 */
Promise
	.all([
		browser.tabs
			.executeScript({file: "/content_scripts/get_meta_tags.js"})
			.then((results) => results[0]),
		Tabs.fetchTabState(),
	])
	.then(([tags, tabState]) => handleTags(tags, tabState))
