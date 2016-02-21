(function() {
	"use strict";
	var elem = document.getElementById('app');

	//allows support in < IE9
	function map(func, array) {
		var newArray = new Array(array.length);
		for (var i = 0; i < array.length; i++) {
			newArray[i] = func(array[i]);
		}
		return newArray;
	}

	var appTemplate1 = {
		dom: Inferno.staticCompiler.createElement('table', { className: 'table table-striped latest-data' }),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0001 // single child
	};

	var appTemplate2 = {
		dom: Inferno.staticCompiler.createElement('tbody'),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0002 // list of children
	};

	var dbTemplate1 = {
		dom: Inferno.staticCompiler.createElement('tr'),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0002 // list of children
	};

	var dbTemplate2 = {
		dom: Inferno.staticCompiler.createElement('td', { className: 'dbname' }),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0003 // text child
	};

	var dbTemplate3 = {
		dom: Inferno.staticCompiler.createElement('td', { className: 'query-count' }),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0001 // single child
	};

	var dbTemplate4 = {
		dom: Inferno.staticCompiler.createElement('span'),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0003, // text child
		v1: 0x0004 // class prop
	};

	var queryTemplate1 = {
		dom: Inferno.staticCompiler.createElement('td'),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0002, // list of children
		v1: 0x0004 // class prop
	};

	var queryTemplate2 = {
		dom: Inferno.staticCompiler.createElement('span', { className: 'foo' }),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0003 // text child
	};

	var queryTemplate3 = {
		dom: Inferno.staticCompiler.createElement('div', { className: 'popover left' }),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0002 // list of children
	};

	var queryTemplate4 = {
		dom: Inferno.staticCompiler.createElement('div', { className: 'popover-content' }),
		pools: {
			keyed: [],
			nonKeyed: []
		},
		v0: 0x0003 // text child
	};

	var queryTemplate5 = {
		dom: Inferno.staticCompiler.createElement('div', { className: 'arrow' }),
		pools: {
			keyed: [],
			nonKeyed: []
		}
	};

	function createQuery(query) {
		return {
			dom: null,
			tpl: queryTemplate1,
			v0: [
				{
					dom: null,
					tpl: queryTemplate2,
					v0: query.formatElapsed,
					v1: null,
					v2: null
				},
				{
					dom: null,
					tpl: queryTemplate3,
					v0: [
						{
							dom: null,
							tpl: queryTemplate4,
							v0: query.query,
							v1: null,
							v2: null
						},
						{
							dom: null,
							tpl: queryTemplate5,
							v0: null,
							v1: null,
							v2: null
						}
					],
					v1: null,
					v2: null
				}
			],
			v1: query.elapsedClassName,
			v2: null
		};
	}

	function createDatabase(db) {
		return {
			dom: null,
			tpl: dbTemplate1,
			v0: [
				{
					dom: null,
					tpl: dbTemplate2,
					v0: db.dbname,
					v1: null,
					v2: null
				},
				{
					dom: null,
					tpl: dbTemplate3,
					v0: {
						dom: null,
						tpl: dbTemplate4,
						v0: db.lastSample.nbQueries,
						v1: db.lastSample.countClassName,
						v2: null
					},
					v1: null,
					v2: null
				},
				map(createQuery, db.lastSample.topFiveQueries)
			],
			v1: null,
			v2: null
		};
	}

	function render() {
		var dbs = ENV.generateData(false).toArray();
		Monitoring.renderRate.ping();
		InfernoDOM.render({
			dom: null,
			tpl: appTemplate1,
			v0: {
				dom: null,
				tpl: appTemplate2,
				v0: map(createDatabase, dbs),
				v1: null,
				v2: null
			},
			v1: null,
			v2: null
		}, elem);
		setTimeout(render, ENV.timeout);
	}
	render();
})();
