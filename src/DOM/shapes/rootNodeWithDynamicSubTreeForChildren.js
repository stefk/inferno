import isArray from '../../util/isArray';
import isVoid from '../../util/isVoid';
import { recycle } from '../recycling';
import { addDOMDynamicAttributes, updateDOMDynamicAttributes, clearListeners, handleHooks } from '../addAttributes';
import recreateRootNode from '../recreateRootNode';
import addShapeChildren from '../../shared/addShapeChildren';

export default function createRootNodeWithDynamicSubTreeForChildren(templateNode, subTreeForChildren, dynamicAttrs, recyclingEnabled, isSVG) {
	const dynamicAttrKeys = dynamicAttrs && Object.keys(dynamicAttrs);
	const node = {
		pool: [],
		keyedPool: [],
		overrideItem: null,
		create(item, treeLifecycle, context) {
			let domNode;

			if (recyclingEnabled) {
				domNode = recycle(node, item, treeLifecycle, context);
				if (domNode) {
					return domNode;
				}
			}
			domNode = templateNode.cloneNode(false);
			addShapeChildren(domNode, subTreeForChildren, item, treeLifecycle, context);
			if (dynamicAttrs) {
				addDOMDynamicAttributes(item, domNode, dynamicAttrs, node, 'onCreated', isSVG);
				if (dynamicAttrs.onAttached) {
					treeLifecycle.addTreeSuccessListener(() => {
						handleHooks(item, dynamicAttrs, domNode, 'onAttached');
					});
				}
			}
			item.rootNode = domNode;
			return domNode;
		},
		update(lastItem, nextItem, treeLifecycle, context) {
			const tree = lastItem && lastItem.tree;
			const domNode = lastItem.rootNode;

			nextItem.id = lastItem.id;
			if (tree && (node !== tree.dom)) {
				const newDomNode = recreateRootNode(domNode, lastItem, nextItem, node, treeLifecycle, context);

				nextItem.rootNode = newDomNode;
				return newDomNode;
			}
			nextItem.rootNode = domNode;
			if (dynamicAttrs && dynamicAttrs.onWillUpdate) {
				handleHooks(nextItem, dynamicAttrs, domNode, 'onWillUpdate');
			}
			if (!isVoid(subTreeForChildren)) {
				if (isArray(subTreeForChildren)) {
					for (let i = 0; i < subTreeForChildren.length; i++) {
						const subTree = subTreeForChildren[i];

						subTree.update(lastItem, nextItem, treeLifecycle, context);
					}
				} else if (typeof subTreeForChildren === 'object') {
					subTreeForChildren.update(lastItem, nextItem, treeLifecycle, context);
				}
			}
			if (dynamicAttrs) {
				updateDOMDynamicAttributes(lastItem, nextItem, domNode, dynamicAttrs, dynamicAttrKeys, isSVG);
				if (dynamicAttrs.onDidUpdate) {
					handleHooks(nextItem, dynamicAttrs, domNode, 'onDidUpdate');
				}
			}
		},
		remove(item, treeLifecycle) {
			if (!isVoid(subTreeForChildren)) {
				if (isArray(subTreeForChildren)) {
					for (let i = 0; i < subTreeForChildren.length; i++) {
						const subTree = subTreeForChildren[i];

						subTree.remove(item, treeLifecycle);
					}
				} else if (typeof subTreeForChildren === 'object') {
					subTreeForChildren.remove(item, treeLifecycle);
				}
			}
			if (dynamicAttrs) {
				const domNode = item.rootNode;

				clearListeners(item, domNode, dynamicAttrs);
				if (dynamicAttrs.onWillDetach) {
					handleHooks(item, dynamicAttrs, domNode, 'onWillDetach');
				}
			}
		}
	};

	return node;
}
