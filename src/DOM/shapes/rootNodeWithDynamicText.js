import isVoid from '../../util/isVoid';
import isStringOrNumber from '../../util/isStringOrNumber';
import { recycle } from '../recycling';
import { getValueWithIndex } from '../../core/variables';
import { addDOMDynamicAttributes, updateDOMDynamicAttributes, clearListeners, handleHooks } from '../addAttributes';
import recreateRootNode from '../recreateRootNode';
import addShapeAttributes from '../addShapeAttributes';
import appendText from '../../util/appendText';

export default function createRootNodeWithDynamicText(templateNode, valueIndex, dynamicAttrs, recyclingEnabled, isSVG) {
	const dynamicAttrKeys = dynamicAttrs && Object.keys(dynamicAttrs);
	const node = {
		pool: [],
		keyedPool: [],
		overrideItem: null,
		create(item, treeLifecycle) {
			let domNode;

			if (recyclingEnabled) {
				domNode = recycle(node, item);
				if (domNode) {
					return domNode;
				}
			}
			domNode = templateNode.cloneNode(false);
			const value = getValueWithIndex(item, valueIndex);

			if (!isVoid(value)) {
				if (process.env.NODE_ENV !== 'production') {
					if (!isStringOrNumber(value)) {
						throw Error('Inferno Error: Template nodes with TEXT must only have a StringLiteral or NumericLiteral as a value, this is intended for low-level optimisation purposes.');
					}
				}
				if (value === '') {
					domNode.appendChild(document.createTextNode(''));
				} else {
					domNode.textContent = value;
				}
			}
			if (dynamicAttrs) {
				addShapeAttributes(domNode, item, dynamicAttrs, node, treeLifecycle, isSVG);
			}
			item.rootNode = domNode;
			return domNode;
		},
		update(lastItem, nextItem, treeLifecycle) {
			const tree = lastItem && lastItem.tree;
			const domNode = lastItem.rootNode;

			if (tree && node !== tree.dom) {
				recreateRootNode(domNode, lastItem, nextItem, node, treeLifecycle);
				return;
			}
			nextItem.id = lastItem.id;
			nextItem.rootNode = domNode;
			const nextValue = getValueWithIndex(nextItem, valueIndex);
			const lastValue = getValueWithIndex(lastItem, valueIndex);

			if (dynamicAttrs && dynamicAttrs.onWillUpdate) {
				handleHooks(nextItem, dynamicAttrs, domNode, 'onWillUpdate');
			}
			if (nextValue !== lastValue) {
				if (isVoid(nextValue)) {
					appendText(domNode, '');
				} else if (isVoid(lastValue)) {
					appendText(domNode, nextValue);
				} else {
					appendText(domNode, nextValue);
				}
			}
			if (dynamicAttrs) {
				updateDOMDynamicAttributes(lastItem, nextItem, domNode, dynamicAttrs, dynamicAttrKeys, isSVG);
				if (dynamicAttrs.onDidUpdate) {
					handleHooks(nextItem, dynamicAttrs, domNode, 'onDidUpdate');
				}
			}
		},
		remove(item) {
			if (dynamicAttrs) {
				const domNode = item.rootNode;

				if (dynamicAttrs.onWillDetach) {
					handleHooks(item, dynamicAttrs, domNode, 'onWillDetach');
				}
				clearListeners(item, domNode, dynamicAttrs);
			}
		}
	};

	return node;
}
