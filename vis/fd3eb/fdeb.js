var width = 960,
    height = 960;

var cluster = d3.layout.cluster()
    .size([360, Math.min(width, height) / 2 - 120])
    .sort(null)
    .value(function(d) { return d.size; });

// Explicitly make nodes into a radial layout.
var transform = d3.geom.transform(function(d) {
    d.r = d.y;
    // Rotate by 90 degrees.
    d.t = d.x < 90 ? d.x + 270 : d.x - 90;
    d.y = Math.sin(d.t / 180 * Math.PI) * d.r;
    d.x = Math.cos(d.t / 180 * Math.PI) * d.r;
});

// Original layout is a linear dendrogram, but .radial makes it circular.
// Can't do this .radial trick, since the cartesian to polar mapping does not preserve shortest distance; you'd have to know actual mesh point locations in cartesian space.
var line = d3.svg.line()
    .interpolate("bundle")
    .tension(1)
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

var vis = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

d3.json("flare-imports.json", function(classes) {
  var nodes = transform(cluster.nodes(packages.root(classes))),
      links = packages.imports(nodes);

  var bundle = d3.layout.fdeb()
    .links(links)
    .start();

  var link = vis.selectAll("path.link")
      .data(bundle.splines())
    .enter().append("path")
      .attr("class", "link")
      .style("stroke-width", function(d) { return d.weight ? d.weight : 1; })
      .attr("d", line);

  vis.selectAll("g.node")
      .data(nodes.filter(function(n) { return !n.children; }))
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "rotate(" + d.t + ")translate(" + d.r + ")"; })
    .append("text")
      .attr("dx", function(d) { return d.t < 90 || d.t > 270 ? 8 : -8; })
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.t < 90 || d.t > 270 ? "start" : "end"; })
      .attr("transform", function(d) { return d.t < 90 || d.t > 270 ? null : "rotate(180)"; })
      .text(function(d) { return d.key; });

  bundle.on("tick", function() {
    // Needed to redraw the lines with new mesh positions.
    link.attr("d", line);
  });
});

/*d3.select(window).on("mousemove", function() {
  vis.selectAll("path.link")
      .data(splines)
      .attr("d", line.tension(Math.min(1, d3.event.clientX / width)));
});*/
