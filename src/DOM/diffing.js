import { isArray, isStringOrNumber, isFunction, isNullOrUndefined, isStatefulComponent } from '../core/utils';
import { replaceNode, SVGNamespace, MathNamespace } from './utils';
import { patchNonKeyedChildren, patchKeyedChildren, patchAttribute, patchComponent, patchStyle } from './patching';
import { mountChildren, mountNode } from './mounting';

function diffValueOnNode(type, lastValue, nextValue, dom, namespace, lifecycle, context) {
	switch (type) {
		case 0x0001: // single child
			diffNodes(lastValue, nextValue, dom, namespace, lifecycle, context);
			return;
		case 0x0002: // many children non keyed
			patchNonKeyedChildren(lastValue, nextValue, dom, namespace, lifecycle, context, null);
			return;
		case 0x0003: // text child
			dom.firstChild.nodeValue = nextValue;
			return;
		case 0x0004: // className prop
			if (nextValue) {
				dom.className = nextValue;
			}
			return;
	}
}

export function diffNodes(lastNode, nextNode, parentDom, namespace, lifecycle, context, staticCheck) {
	if (nextNode === false || nextNode === null) {
		return;
	}
	const lastTpl = lastNode.tpl;
	const nextTpl = nextNode.tpl;
	const dom = lastNode.dom;


	nextNode.dom = dom;
	if (lastTpl === nextTpl) {
		if (nextNode.v0 !== lastNode.v0) {
			diffValueOnNode(nextTpl.v0, lastNode.v0, nextNode.v0, dom, namespace, lifecycle, context);
		}
		if (nextNode.v1 !== lastNode.v1) {
			diffValueOnNode(nextTpl.v1, lastNode.v1, nextNode.v1, dom, namespace, lifecycle, context);
		}
		if (nextNode.v2 !== lastNode.v2) {
			diffValueOnNode(nextTpl.v2, lastNode.v2, nextNode.v2, dom, namespace, lifecycle, context);
		}
	}
}

function diffChildren(lastNode, nextNode, dom, namespace, lifecycle, context, staticCheck) {
	const nextChildren = nextNode.children;
	const lastChildren = lastNode.children;

	if (lastChildren !== nextChildren) {
		if (!isNullOrUndefined(lastChildren)) {
			if (!isNullOrUndefined(nextChildren)) {
				if (isArray(lastChildren)) {
					if (isArray(nextChildren)) {
						const isKeyed = nextChildren.length && nextChildren[0] && !isNullOrUndefined(nextChildren[0].key)
							|| lastChildren.length && lastChildren[0] && !isNullOrUndefined(lastChildren[0].key);

						if (!isKeyed) {
							patchNonKeyedChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, null);
						} else {
							patchKeyedChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, null);
						}
					} else {
						patchNonKeyedChildren(lastChildren, [nextChildren], dom, namespace, lifecycle, context, null);
					}
				} else {
					if (isArray(nextChildren)) {
						patchNonKeyedChildren([lastChildren], nextChildren, dom, namespace, lifecycle, context, null);
					} else if (isStringOrNumber(lastChildren)) {
						if (isStringOrNumber(nextChildren)) {
							dom.firstChild.nodeValue = nextChildren;
						}
					} else {
						diffNodes(lastChildren, nextChildren, dom, namespace, lifecycle, context, staticCheck);
					}
				}
			} else {
				dom.textContent = '';
			}
		} else {
			if (isStringOrNumber(nextChildren)) {
				dom.textContent = nextChildren;
			} else if (nextChildren && isArray(nextChildren)) {
				mountChildren(nextChildren, dom, namespace, lifecycle, context);
			} else if (nextChildren && typeof nextChildren === 'object') {
				mountNode(nextChildren, dom, namespace, lifecycle, context);
			}
		}
	}
}

function diffAttributes(lastNode, nextNode, dom) {
	const nextAttrs = nextNode.attrs;
	const lastAttrs = lastNode.attrs;
	const nextAttrsKeys = nextAttrs && Object.keys(nextAttrs);

	// TODO remove attrs we previously had, but no longer have
	if (nextAttrs && nextAttrsKeys.length !== 0) {
		for (let i = 0; i < nextAttrsKeys.length; i++) {
			const attr = nextAttrsKeys[i];
			const lastAttrVal = lastAttrs[attr];
			const nextAttrVal = nextAttrs[attr];

			if (lastAttrVal !== nextAttrVal) {
				patchAttribute(attr, lastAttrVal, nextAttrVal, dom);
			}
		}
	}
}

function diffEvents(lastNode, nextNode, dom) {

}