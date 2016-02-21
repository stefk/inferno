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

	function Element(tpl, v0, v1, v2) {
		this.dom = null;
		this.tpl = tpl;
		this.v0 = v0;
		this.v1 = v1;
		this.v2 = v2;
	}

	function createQuery(query) {
		return new Element(queryTemplate1, [
			new Element(queryTemplate2, query.formatElapsed, null, null),
			new Element(queryTemplate3, [
				new Element(queryTemplate4, query.query, null, null),
				new Element(queryTemplate5, null, null, null)
			])
		], query.elapsedClassName, null);
	}

	function createDatabase(db) {
		return new Element(dbTemplate1, [
			new Element(dbTemplate2, db.dbname, null, null),
			new Element(dbTemplate3, new Element(dbTemplate4, db.lastSample.nbQueries, db.lastSample.countClassName, null), null, null),
			map(createQuery, db.lastSample.topFiveQueries)
		], null, null);
	}

	function render() {
		var dbs = ENV.generateData().toArray();
		Monitoring.renderRate.ping();
		InfernoDOM.render(new Element(appTemplate1, new Element(appTemplate2, map(createDatabase, dbs), null, null), null, null), elem);
		setTimeout(render, ENV.timeout);
	}
	render();
})();
