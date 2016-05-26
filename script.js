var diameter = 960;

// Globals we'll manipulate
// TODO: better way to handle this?
nodes = null;
links = null;
hiddenLinks = null;
weightMatrix = null;

// File paths
tree_json = 'bodypart_full/body_part_json_trial_10/0302.json';
//edges_txt = 'bodypart_full/edge_prob_bodypart_trial_10.txt';
edges_txt = 'last_edges.csv';

// Tree layout is only used for manipulating json trees
var tree = d3.layout.tree()

// Actual layout comes from force layout
var force = d3.layout.force()
    .charge(-150)
    .linkDistance(80)
    .size([diameter, diameter])

// Create the svg canvas into which everything goes
var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)

function highlightNode(d) {
    // Don't highlight entity
    if (d.index === 0) return;

    // Highlight the node
    d3.select(this).select("circle")
        .style("fill", "#ff0");

    var weights = weightMatrix[d.index - 1];

    hiddenLinks = [];
    for (var i in weights){
        if (weights.hasOwnProperty(i) && weights[i] > 1e-3) {
            hiddenLinks.push({
                source: nodes[i],
                target: nodes[d.index],
            });
        }
    }

    console.log(weights);
    console.log(hiddenLinks);
//    weights = weights.filter(function (d) { return d > 1e-3; });
//    hiddenLinks = [{source: nodes[d.index], target: nodes[0]}];


    svg.selectAll(".link.hidden")
        .data(hiddenLinks)
      .enter().insert("line", ":first-child")
        .attr("class", "link hidden")
        .attr("stroke", "#c11");

    force
        .nodes(nodes)
        .links(links.concat(hiddenLinks))
        .start();
}

function unHighlightNode(d) {
    // TODO: why doesn't svg.select work??
    d3.select(this).select("circle")
      .style("fill", "#fff");

    svg.selectAll(".link.hidden")
        .remove();
    
    force
        .nodes(nodes)
        .links(links)
        .start();
}

function drawGraph() {
    svg.selectAll(".link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    svg.selectAll(".node")
        .attr("transform", function(d) {
            return "translate(" + d.x + " " + d.y + ")";
        });
}

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
        .attr("class", "link")
        .attr("stroke", "#ccc");

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

d3.csv(edges_txt, function(error, edges) {
    if (error) throw error;

    weightMatrix = edges;
});
