var diameter = 960;

var tree = d3.layout.tree()
    .size([360, diameter / 2 - 120])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(80)
    .size([diameter, diameter])

var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)

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

    force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) {
            return "translate(" + d.x + " " + d.y + ")";
        })
    });
});

/*
edges = null;
d3.csv(edges_txt, function(error, edges_data) {
    if (error) throw error;

    edges = edges_data;
    console.log(edges);
});
*/
