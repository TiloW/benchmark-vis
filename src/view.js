var colors = {};
var colorCounter = 0;
var colorList = [
	'rgba(255,0,0,0.5)',
	'rgba(0,255,0,0.5)',
	'rgba(0,0,255,0.5)',
	'rgba(0,128,128,0.5)',
	'rgba(128,0,128,0.5)',
	'rgba(128,128,0,0.5)'
];
var callback = null;

function getColor(id) {  
	if(colors[id] == undefined) {
		colors[id] = colorList[colorCounter++];
	}

	return colors[id];
}

function createTreeData(dataNode) {
	var subTrees = [];
	var counter = dataNode.instances.length;

	_.each(dataNode.directories, function(dataDir) {
		var subTree = createTreeData(dataDir);
		counter += subTree.numberOfInstances;
		subTrees.push(subTree);
	});

	var name = dataNode.name.split(/[\\\/]/);
	name = name[name.length - 1];

	var tree = {
		text: name,
		tags: [counter],
		href: "#results/" + dataNode.name,
		numberOfInstances: counter,
		data: dataNode
	};

	if(subTrees.length > 0) {
		tree.nodes = subTrees;
	}

	return tree;
}

function collectValuesDetailsTable(data) {
	var result = data.instances;

	_.each(data.directories, function(dir) {
		result = result.concat(collectValuesDetailsTable(dir));
	});

	return result;
}

function collectValuesSummaryTable(data) {
	var result = {
		times: {},
		counters: {}
	};

	_.each(data.instances, function(instance) {
		_.each(instance.results, function(res, key) {
			result.times[key] |= 0;
			result.counters[key] |= 0;
			result.times[key] += res / 1000;
			result.counters[key]++;
		});
	});

	_.each(data.directories, function(dir) {
		var stats = collectValuesSummaryTable(dir);
		_.each(stats.times, function(time, key) {
			result.times[key] |= 0;
			result.counters[key] |= 0;

			result.times[key] += time;
			result.counters[key] += stats.counters[key];
		});
	});

	return result;
}

function updateSummaryTable(node) {
	var stats = collectValuesSummaryTable(node.data);
	var output = "";

	_.each(stats.times, function(sum, key) {
		output += "<tr style=\"background: " + getColor(key);
		output += "\"><td>" + key + "</td><td>" + parseInt(sum / stats.counters[key]) + "</td><td>" + stats.counters[key] + "</td></tr>";
	});

	$("#summary").html(output);
}

function updateDetailsTable(node) {
	var stats = collectValuesDetailsTable(node.data);
	var keys = _.keys(collectValuesSummaryTable(node.data).counters);
	var output = "<thead><tr><th>id</th><th>n</th><th>m</th>";

	_.each(keys, function(key) {
		output += "<th>" + key + "</th>";
	});

	output += "</th></thead><tbody>";

	_.each(stats, function(instance) {
		output += "<tr><td>" + instance.name + "</td><td>" + instance.meta.n + "</td><td>" + instance.meta.m + "</td>";

		_.each(keys, function(key) {
			output += "<td>" + (instance.results[key] || "-") + "</td>";
		});

		output += "</tr>";
	});

	output += "</tbody>";

	$("#details").html(output);
}

function updateHeader(node) {
	var path = node.data.name.split(/[\/\\]/);
	var title = "<small>"
	for(i = 0; i < path.length - 1; i++) {
		title += path[i] + " &raquo; ";
	}
	title += "</small>" + path[path.length - 1];
	$(".page-header h1").html(title);
}

function collectValuesPlot(data, prop) {
	var result = [];

	_.each(data.instances, function(instance) {
		_.each(instance.results, function(res, key) {
			result.push([instance.meta[prop], res / 1000, key]);
		});
	});

	_.each(data.directories, function(dir) {
		var res = collectValuesPlot(dir, prop);
		result = result.concat(res);
	});

	return result;
}

function updatePlots(node) {
	if($('#tab-plots').css('visibility') != 'hidden') {
		$("#plots").empty();
		createPlot(collectValuesPlot(node.data, 'n'), 'number of nodes');
		createPlot(collectValuesPlot(node.data, 'm'), 'number of edges');
	}

	if(callback != null) {
		$(window).unbind('resize', callback);
	}
	callback = function() {
		updatePlots(node);
	};
	$(window).one('resize', callback);
}

function createPlot(data, xLabel) {  
	var margin = {
		top: 20, 
		right: 15, 
		bottom: 60,
		left: 100
	};

	var width = $("#plots").parent().innerWidth() - 100;
	var height = 400;

	var x = d3.scale.pow().exponent(.25)
		.domain([d3.min(data, function(d) { return d[0]; }), d3.max(data, function(d) { return d[0]; })])
		.range([ 0, width ]);

	var y = d3.scale.pow().exponent(.25)
		.domain([d3.min(data, function(d) { return d[1]; }), d3.max(data, function(d) { return d[1]; })])
		.range([ height, 0 ]);

	var chart = d3.select('#plots')
		.append('svg:svg')
		.attr('width', width + margin.right + margin.left)
		.attr('height', height + margin.top + margin.bottom)
		.attr('class', 'chart')

	var main = chart.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
		.attr('width', width)
		.attr('height', height)
		.attr('class', 'main')   

	var xAxis = d3.svg.axis()
		.scale(x)
		.ticks(5)
		.orient('bottom');

	main.append('g')
		.attr('transform', 'translate(0,' + height + ')')
		.attr('class', 'main axis date')
		.call(xAxis);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient('left');

	main.append('g')
		.attr('transform', 'translate(0,0)')
		.attr('class', 'main axis date')
		.call(yAxis);

	main.append("text")
		.attr("class", "x label")
		.attr("text-anchor", "end")
		.attr("x", width)
		.attr("y", height - 6)
		.text(xLabel);

	main.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "end")
		.attr("y", 6)
		.attr("dy", ".75em")
		.attr("transform", "rotate(-90)")
		.text("runtime");

	var g = main.append("svg:g"); 


	g.selectAll("scatter-dots")
		.data(data)
		.enter().append("svg:circle")
		.attr("cx", function (d) { return x(d[0]); } )
		.attr("cy", function (d) { return y(d[1]); } )
		.attr("fill", function (d) { return getColor(d[2]); } )
		.attr("r", 4);
}

