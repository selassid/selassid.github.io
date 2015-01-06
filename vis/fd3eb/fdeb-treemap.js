var w = 960,
    h = 500,
    fill = d3.scale.ordinal().range(colorbrewer.Greys[9].slice(1, 4)),
    stroke = d3.scale.linear().domain([0, 1e4]).range(["brown", "steelblue"]);

var treemap = d3.layout.treemap()
    .size([w, h])
    .value(function(d) { return d.size; });

var div = d3.select("#chart").append("div")
    .style("position", "relative")
    .style("width", w + "px")
    .style("height", h + "px");

var line = d3.svg.line()
    .interpolate("bundle")
    .tension(1)
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

// Move nodes to the center of their cells.
var transform = d3.geom.transform(function(d) {
    d.x = d.x + d.dx / 2;
    d.y = d.y + d.dy / 2;
});

d3.json("flare-imports.json", function(classes) {
  var nodes = transform(treemap.nodes(packages.root(classes))),
      links = packages.imports(nodes);
      
  var bundle = d3.layout.fdeb()
    .links(links)
    .start();

  div.selectAll("div")
      .data(nodes)
    .enter().append("div")
      .attr("class", "cell")
      .style("background", function(d) { return d.children ? fill(d.key) : null; })
      .call(cell)
      .text(function(d) { return d.children ? null : d.key; });

  var vis = div.append("svg")
      .attr("width", w)
      .attr("height", h)
      .style("position", "absolute")
      
  var link = vis.selectAll("path.link")
      .data(bundle.splines(links))
    .enter().append("path")
      .style("stroke", function(d) { return stroke(d[0].value); })
      .attr("class", "link")
      .attr("d", line);
      
  bundle.on("tick", function() {
    link.attr("d", line);
  });
});

function cell() {
  this
      // Undo the moving of nodes to the center of their cells.
      .style("left", function(d) { return d.x - d.dx / 2 + "px"; })
      .style("top", function(d) { return d.y - d.dy / 2 + "px"; })
      .style("width", function(d) { return d.dx - 1 + "px"; })
      .style("height", function(d) { return d.dy - 1 + "px"; });
}
