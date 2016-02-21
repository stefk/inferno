import { isArray, isStringOrNumber, isFunction, isNullOrUndefined, addChildrenToProps, isStatefulComponent, isString } from '../core/utils';
import { recyclingEnabled, recycle } from './recycling';
import { appendText, createElement, SVGNamespace, MathNamespace } from './utils';
import { patchAttribute, patchStyle } from './patching';
import { handleEvent } from './events';
import { diffNodes } from './diffing';

export function mountChildren(children, parentDom, namespace, lifecycle, context) {
	if (isArray(children)) {
		for (let i = 0; i < children.length; i++) {
			const child = children[i];

			if (isStringOrNumber(child)) {
				appendText(child, parentDom, false);
			} else {
				mountNode(child, parentDom, namespace, lifecycle, context);
			}
		}
	} else {
		if (isStringOrNumber(children)) {
			appendText(children, parentDom, true);
		} else {
			mountNode(children, parentDom, namespace, lifecycle, context);
		}
	}
}

function mountComponent(parentNode, Component, props, events, children, parentDom, lifecycle, context) {
	props = addChildrenToProps(children, props);

	if (isStatefulComponent(Component)) {
		const instance = new Component(props);
		instance._diffNodes = diffNodes;

		const childContext = instance.getChildContext();
		if (childContext) {
			context = { ...context, ...childContext };
		}
		instance.context = context;

		instance.componentWillMount();
		const node = instance.render();
		let dom;

		if (node) {
			dom = mountNode(node, null, null, lifecycle, context);
			instance._lastNode = node;
			if (parentDom) {
				parentDom.appendChild(dom);
			}
			lifecycle.addListener(instance.componentDidMount);
		}

		parentNode.dom = dom;
		parentNode.instance = instance;
		return dom;
	} else {
		let dom;
		if (events) {
			if (events.componentWillMount) {
				events.componentWillMount(null, props);
			}
			if (events.componentDidMount) {
				lifecycle.addListener(() => {
					events.componentDidMount(dom, props);
				});
			}
		}

		/* eslint new-cap: 0 */
		const node = Component(props);
		dom = mountNode(node, null, null, lifecycle, context);

		parentNode.instance = node;
		if (parentDom) {
			parentDom.appendChild(dom);
		}
		parentNode.dom = dom;

		return dom;
	}
}

function mountEvents(events, allEvents, dom) {
	for (let i = 0; i < allEvents.length; i++) {
		const event = allEvents[i];

		handleEvent(event, dom, events[event]);
	}
}

function mountChild(value, parentDom, namespace, lifecycle, context) {
	if (isStringOrNumber(value)) {
		appendText(value, parentDom, true);
	} else {
		if (isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				const child = value[i];

				mountChild(child, parentDom, namespace, lifecycle, context);
			}
		} else {
			mountNode(value, parentDom, namespace, lifecycle, context);
		}
	}
}

function mountValueOnNode(type, value, dom, namespace, lifecycle, context) {
	switch (type) {
		case 0x0001: // single child
			mountChild(value, dom, namespace, lifecycle, context);
			return;
		case 0x0002: // many children
			for (let i = 0; i < value.length; i++) {
				const child = value[i];

				mountChild(child, dom, namespace, lifecycle, context);
			}
			return;
		case 0x0003: // text child
			if (value === '') {
				dom.appendChild(document.createTextNode(''));
			} else {
				dom.textContent = value;
			}
			return;
		case 0x0004: // className prop
			if (value) {
				dom.className = value;
			}
			return;
	}
}

export function mountNode(node, parentDom, namespace, lifecycle, context) {
	const tpl = node.tpl;
	const dom = tpl.dom.cloneNode(true);

	if (tpl.v0 !== undefined) {
		mountValueOnNode(tpl.v0, node.v0, dom, namespace, lifecycle, context);
	}
	if (tpl.v1 !== undefined) {
		mountValueOnNode(tpl.v1, node.v1, dom, namespace, lifecycle, context);
	}
	if (tpl.v2 !== undefined) {
		mountValueOnNode(tpl.v2, node.v2, dom, namespace, lifecycle, context);
	}

	node.dom = dom;
	if (parentDom !== null) {
		parentDom.appendChild(dom);
	}
	return dom;
}

function mountAttributes(attrs, dom) {
	const attrsKeys = Object.keys(attrs);

	for (let i = 0; i < attrsKeys.length; i++) {
		const attr = attrsKeys[i];

		patchAttribute(attr, null, attrs[attr], dom);
	}
}