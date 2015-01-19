$(function() {
  var levels = document.URL.split("#")[1];
  if(levels == undefined) {
    levels = 2;
  } else {
    levels = levels.split("/").length - 1;
		if(levels < 2) {
			levels = 2;
		}
  }

  $('#sidebar').treeview({
    data: [createTreeData(data)],
    enableLinks: true,
    nodeIcon: "",
    expandIcon: "glyphicon glyphicon-plus-sign",
    collapseIcon: "glyphicon glyphicon-minus-sign",
    showTags: true,
    onNodeSelected: onNodeSelected,
    levels: levels
  });

  $('#sidebar').click(function() {
		$(window).resize();
	});

	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		$(window).resize();
	});

  $(window).on('resize', function() {
    $('#content').css('padding-left', $('#sidebar').width() + 'px');
  });

  initBackbone();
});

function onNodeSelected(event, node) {
	router.navigate(node.href, {trigger: true});
  
  updateHeader(node);
  updateSummaryTable(node);
  updatePlots(node);
  updateDetailsTable(node);
}

function initBackbone() {
  var initialRouting = true;

  var Router = Backbone.Router.extend({
    routes: {
      "results/*query": "showResults",
      "*path": "showResults"
    },

    after: function() {
	    initialRouting = false;
		},

    showResults: function(query) {
      if(query == undefined) {
				router.navigate("results/instances", {trigger: true});
			} else {
		    var elem = $("#sidebar a[href=\"#results/" + query + "\"]")
		    
        if(initialRouting) {
          elem.parent("li").click();
		    }
			}
    }
  });

  window.router = new Router();
  Backbone.history.start();
}

