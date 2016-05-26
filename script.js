var diameter = 960;

var tree = d3.layout.tree()
    .size([360, diameter / 2 - 120])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var force = d3.layout.force()
    .charge(-200)
    .linkDistance(80)
    .size([diameter, diameter])

var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)

function highlightNode(d) {
    // Don't highlight entity
    if (d.index === 0) return;

    d3.select(this).select("circle")
        .style("fill", "#ff0");

    hiddenLinks = [{source: nodes[this.index], target: nodes[0]}];
    d3.selectAll(".node.hidden")
        .data(links)
      .enter().append("line")
        .attr("class", "link")
        .attr("class", "hidden");

    force
        .links(links.concat(hiddenLinks));
}

function unHighlightNode(d) {
    d3.select(this).select("circle")
      .style("fill", "#fff");

    d3.selectAll(".link.hidden")
        .remove();
    
    force
        .links(links);
}

function drawGraph() {
    d3.selectAll(".link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    d3.selectAll(".node")
        .attr("transform", function(d) {
            return "translate(" + d.x + " " + d.y + ")";
        });
}

tree_json = 'bodypart_full/body_part_json_trial_10/0302.json';
//edges_txt = 'bodypart_full/edge_prob_bodypart_trial_10.txt';
edges_txt = 'last_edges.csv';


nodes = null;
links = null;
d3.json(tree_json, function(error, root) {
    if (error) throw error;

    nodes = tree.nodes(root),
    links = tree.links(nodes);

    force
        .nodes(nodes)
        .links(links)
        .start();

    var link = svg.selectAll(".link")
        .data(links)
      .enter().append("line")
        .attr("class", "link");

    var node = svg.selectAll(".node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .call(force.drag);

    node.append("circle")
        .attr("r", function(d) { return 60 / (d.depth + 2); });
        /*
        .attr("r", function(d) {
            return d.children ? 10*Math.sqrt(d.children.length+1) : 10;
        });
        */

    node.append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.name; });

    node.on("mouseover", highlightNode)
        .on("mouseout", unHighlightNode);

    force.on("tick", drawGraph);
});

/*
weightMatrix = null;
d3.csv(edges_txt, function(error, edges_data) {
    if (error) throw error;

    weightMatrix = edges_data;
});
*/
