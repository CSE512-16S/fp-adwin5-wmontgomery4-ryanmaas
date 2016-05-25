var diameter = 960;

var tree = d3.layout.tree()
    .size([360, diameter / 2 - 120])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter - 150)
  .append("g")
    .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

function highlightNode(d) {
    d3.select(this).select("circle")
        .style("fill", "#ff0");

    d3.select(this).selectAll(".hidden")
    console.log(d);
}

function unHighlightNode(d) {
    d3.select(this).select("circle")
      .style("fill", "#fff");
}

tree_json = 'bodypart_full/body_part_json_trial_10/0302.json';
//edges_txt = 'bodypart_full/edge_prob_bodypart_trial_10.txt';
edges_txt = 'last_edges.csv';
d3.json(tree_json, function(error, root) {
    if (error) throw error;

    var nodes = tree.nodes(root),
        links = tree.links(nodes);

    var link = svg.selectAll(".link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = svg.selectAll(".node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

    node.append("circle")
        .attr("r", 4.5);

    node.append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
        .text(function(d) { return d.name; });

    // Add highlighting
    svg.selectAll(".node")
        .on("mouseover", highlightNode)
        .on("mouseout", unHighlightNode);
});

edges = null;
d3.csv(edges_txt, function(error, edges_data) {
    if (error) throw error;

    edges = edges_data;
    console.log(edges);
});

//d3.select(self.frameElement).style("height", diameter - 150 + "px");
