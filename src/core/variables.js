import isArray from '../util/isArray';
import isVoid from '../util/isVoid';
import isStringOrNumber from '../util/isStringOrNumber';

export const ValueTypes = {
	TEXT: 0,
	ARRAY: 1,
	TREE: 2,
	EMPTY_OBJECT: 3,
	FUNCTION: 4,
	FRAGMENT: 5,
	PROMISE: 6
};

export function createVariable(index) {
	return {
		index
	};
}

export function getValueWithIndex(item, index) {
	return (index < 2) ? ((index === 0) ? item.v0 : item.v1) : item.values[index - 2];
}

export function getTypeFromValue(value) {

	if (isStringOrNumber(value) || isVoid(value)) {
		return ValueTypes.TEXT;
	} else if (isArray(value)) {
		return ValueTypes.ARRAY;
	} else if (value instanceof Promise) {
		return ValueTypes.PROMISE;
	} else if (typeof value === 'object' && value.create) {
		return ValueTypes.TREE;
	} else if (typeof value === 'object' && Object.keys(value).length === 0) {
		return ValueTypes.EMPTY_OBJECT;
	} else if (typeof value === 'object' && value.tree.dom) {
		return ValueTypes.FRAGMENT;
	} else if (typeof value === 'function') {
		return ValueTypes.FUNCTION;
	}
}

export function getValueForProps(props, item) {
	const newProps = {};

	if (props.index) {
		return getValueWithIndex(item, props.index);
	}
	for (let name in props) {
		const val = props[name];

		if (val && val.index !== undefined) {
			newProps[name] = getValueWithIndex(item, val.index);
		} else {
			newProps[name] = val;
		}

		if (name === 'children') {
			newProps[name].overrideItem = item;
		}
	}
	return newProps;
}

export function removeValueTree(value, treeLifecycle) {
	if (isVoid(value)) {
		return;
	}
	if (isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			const child = value[i];

			removeValueTree(child, treeLifecycle);
		}
	} else if (typeof value === 'object') {
		const tree = value.tree;

		if (tree) {
			tree.dom.remove(value, treeLifecycle);
		} else if (value.create) {
			value.remove(value, treeLifecycle);
		}
	}
}

export function getDynamicNode(dynamicNodes, schema) {
	for (let i = 0; i < dynamicNodes.length; i++) {
		const dynamicNode = dynamicNodes[i];

		if (dynamicNode.node === schema) {
			return dynamicNode.dynamicFlags;
		}
	}
}