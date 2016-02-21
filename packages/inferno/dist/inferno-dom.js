/*!
 * inferno-dom v0.6.0
 * (c) 2016 Dominic Gannaway
 * Released under the MPL-2.0 License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.InfernoDOM = factory());
}(this, function () { 'use strict';

	var babelHelpers = {};
	babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
	};

	babelHelpers.classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	babelHelpers.createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

	babelHelpers.extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];

	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }

	  return target;
	};

	babelHelpers;

	var Lifecycle = function () {
		function Lifecycle() {
			babelHelpers.classCallCheck(this, Lifecycle);

			this._listeners = [];
		}

		babelHelpers.createClass(Lifecycle, [{
			key: "addListener",
			value: function addListener(callback) {
				this._listeners.push(callback);
			}
		}, {
			key: "trigger",
			value: function trigger() {
				for (var i = 0; i < this._listeners.length; i++) {
					this._listeners[i]();
				}
			}
		}]);
		return Lifecycle;
	}();

	function isArray(obj) {
		return obj.constructor === Array;
	}

	function isStatefulComponent(obj) {
		return obj && obj.prototype && obj.prototype.render;
	}

	function isStringOrNumber(obj) {
		return typeof obj === 'string' || typeof obj === 'number';
	}

	function isNullOrUndefined(obj) {
		return obj === undefined || obj === null;
	}

	function appendText(text, parentDom, singleChild) {
		if (singleChild) {
			if (text !== '') {
				parentDom.textContent = text;
			} else {
				parentDom.appendChild(document.createTextNode(''));
			}
		} else {
			var textNode = document.createTextNode(text);

			parentDom.appendChild(textNode);
		}
	}

	function detachNode(node) {
		if (isNullOrUndefined(node)) {
			return;
		}
		if (isStatefulComponent(node.instance)) {
			node.instance.componentWillUnmount();
			node.instance._unmounted = true;
		}
		if (node.events && node.events.willDetach) {
			node.events.willDetach(node.dom);
		}
		if (node.events && node.events.componentWillUnmount) {
			node.events.componentWillUnmount(node.dom, node.events);
		}
		var children = node.children;

		if (children) {
			if (isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					detachNode(children[i]);
				}
			} else {
				detachNode(children);
			}
		}
	}

	function remove(node, parentDom) {
		var dom = node.dom;

		detachNode(node);
		if (dom === parentDom) {
			dom.innerHTML = '';
		} else {
			parentDom.removeChild(dom);
			if (recyclingEnabled) {
				pool(node);
			}
		}
	}

	function patchNode(lastNode, nextNode, parentDom, namespace, lifecycle, context) {
		if (isNullOrUndefined(lastNode)) {
			mountNode(nextNode, parentDom, namespace, lifecycle);
			return;
		}
		if (isNullOrUndefined(nextNode)) {
			remove(lastNode, parentDom);
			return;
		}
		diffNodes(lastNode, nextNode, parentDom, namespace, lifecycle, context, false);
	}

	function patchNonKeyedChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, nextDom) {
		var nextChildrenLength = nextChildren.length;

		for (var i = 0; i < nextChildrenLength; i++) {
			var lastChild = lastChildren[i];
			var nextChild = nextChildren[i];

			if (lastChild !== nextChild) {
				if (isArray(nextChild)) {
					for (var x = 0; x < nextChild.length; x++) {
						var subLastChild = lastChild[x];
						var subNextChild = nextChild[x];

						patchNode(subLastChild, subNextChild, dom, namespace, lifecycle, context);
					}
				} else {
					patchNode(lastChild, nextChild, dom, namespace, lifecycle, context);
				}
			}
		}
	}

	function diffValueOnNode(type, lastValue, nextValue, dom, namespace, lifecycle, context) {
		switch (type) {
			case 0x0001:
				// single child
				diffNodes(lastValue, nextValue, dom, namespace, lifecycle, context);
				return;
			case 0x0002:
				// many children non keyed
				patchNonKeyedChildren(lastValue, nextValue, dom, namespace, lifecycle, context, null);
				return;
			case 0x0003:
				// text child
				dom.firstChild.nodeValue = nextValue;
				return;
			case 0x0004:
				// className prop
				if (nextValue) {
					dom.className = nextValue;
				}
				return;
		}
	}

	function diffNodes(lastNode, nextNode, parentDom, namespace, lifecycle, context, staticCheck) {
		if (nextNode === false || nextNode === null) {
			return;
		}
		var lastTpl = lastNode.tpl;
		var nextTpl = nextNode.tpl;
		var dom = lastNode.dom;

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

	var recyclingEnabled = true;

	function pool(node) {
		var key = node.key;
		var staticNode = node.static;

		if (staticNode) {
			var pools = staticNode.static;

			if (key === null) {
				var _pool = pools.nonKeyed;
				_pool && _pool.push(item);
			} else {
				var _pool2 = pools.keyed;
				(_pool2[key] || (_pool2[key] = [])).push(node);
			}
		}
	}

	function mountChild(value, parentDom, namespace, lifecycle, context) {
		if (isStringOrNumber(value)) {
			appendText(value, parentDom, true);
		} else {
			if (isArray(value)) {
				for (var i = 0; i < value.length; i++) {
					var child = value[i];

					mountChild(child, parentDom, namespace, lifecycle, context);
				}
			} else {
				mountNode(value, parentDom, namespace, lifecycle, context);
			}
		}
	}

	function mountValueOnNode(type, value, dom, namespace, lifecycle, context) {
		switch (type) {
			case 0x0001:
				// single child
				mountChild(value, dom, namespace, lifecycle, context);
				return;
			case 0x0002:
				// many children
				for (var i = 0; i < value.length; i++) {
					var child = value[i];

					mountChild(child, dom, namespace, lifecycle, context);
				}
				return;
			case 0x0003:
				// text child
				if (value === '') {
					dom.appendChild(document.createTextNode(''));
				} else {
					dom.textContent = value;
				}
				return;
			case 0x0004:
				// className prop
				if (value) {
					dom.className = value;
				}
				return;
		}
	}

	function mountNode(node, parentDom, namespace, lifecycle, context) {
		var tpl = node.tpl;
		var dom = tpl.dom.cloneNode(true);

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

	var roots = [];

	function getRoot(parentDom) {
		for (var i = 0; i < roots.length; i++) {
			var root = roots[i];

			if (root.dom === parentDom) {
				return root;
			}
		}
		return null;
	}

	function removeRoot(rootNode) {
		for (var i = 0; i < roots.length; i++) {
			var root = roots[i];

			if (root === rootNode) {
				roots.splice(i, 1);
				return true;
			}
		}
		return false;
	}

	function render(node, parentDom) {
		var root = getRoot(parentDom);
		var lifecycle = new Lifecycle();

		if (isNullOrUndefined(root)) {
			mountNode(node, parentDom, null, lifecycle, {});
			lifecycle.trigger();
			roots.push({ node: node, dom: parentDom });
		} else {
			patchNode(root.node, node, parentDom, null, lifecycle, {});
			lifecycle.trigger();
			if (node === null) {
				removeRoot(root);
			}
			root.node = node;
		}
	}

	var index = {
		render: render
	};

	return index;

}));