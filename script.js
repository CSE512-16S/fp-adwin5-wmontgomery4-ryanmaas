var width = 960;
var height = 800;

// Constants
WEIGHT_THRESHOLD = 5e-2; // Show hidden edges stronger than this
LINK_WIDTH = 5; // Base stroke width for links

// Globals we'll manipulate
// TODO: better way to handle this?
var nodes,
    links,
    names,
    hiddenLinks,
    weightMatrix;


// Tree layout is only used for manipulating json trees
var tree = d3.layout.tree()
    .size([height, width - 160]);

// Actual layout comes from force layout
//var force = d3.layout.force()
//    .charge(-150)
//    .linkDistance(80)
//    .linkStrength(link => link.strength || 1.0)
//    .size([diameter, diameter]);

// Create the svg canvas into which everything goes
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(40,0)");

// Flip x/y to get left to right tree
var diagonal = d3.svg.diagonal()
    .projection(d => [d.y, d.x]);

//function highlightNode(d) {
//    // Don't highlight 'entity'
//    if (d.index === 0) return;
//
//    // Highlight the node
//    d3.select(this).select("circle")
//        .style("fill", "#ff0");
//
//    // Set up the new hiddenLinks
//    // NOTE: this requires some tricky indexing because the ordering
//    //       of nodes in the tree differs from the alphabetical order
//    hiddenLinks = [];
//    var nameIndex = names.indexOf(d.name);
//    var weights = weightMatrix[nameIndex];
//    for (var i in weights){ // loops over the name indices
//        if (weights.hasOwnProperty(i) && weights[i] > WEIGHT_THRESHOLD) {
//            // Annoying indexing stuff, because 'entity' isn't in names
//            // TODO: make this nicer by munging data files better
//            if (i > 0) {
//                var sourceNode = nodes.find(node => node.name === names[i-1]);
//            } else {
//                var sourceNode = nodes[0];
//            }
//
//            hiddenLinks.push({
//                source: sourceNode,
//                target: nodes[d.index], // DONT use nameIndex
//                strength: weights[i],
//            });
//        }
//    }
//
//    // Update the svg/force
//    svg.selectAll(".link.hidden")
//        .data(hiddenLinks)
////      .enter().insert("line", ":first-child")
//      .enter().append("line")
//        .attr("class", "link hidden")
//        .attr("stroke", "#c11")
//        .attr("stroke-width", d => LINK_WIDTH * d.strength);
//
//    force
//        .links(links.concat(hiddenLinks))
//        .start();
//}

//function unHighlightNode(d) {
//    // TODO: why doesn't svg.select work??
//    d3.select(this).select("circle")
//      .style("fill", "#fff");
//
//    svg.selectAll(".link.hidden")
//        .remove();
//    
//    force
//        .links(links)
//        .start();
//}

//function drawGraph() {
//    svg.selectAll(".link")
//        .attr("x1", d => d.source.x)
//        .attr("y1", d => d.source.y)
//        .attr("x2", d => d.target.x)
//        .attr("y2", d => d.target.y);
//
//    svg.selectAll(".node")
//        .attr("transform", d => "translate(" + d.x + " " + d.y + ")");
//}

// File paths
var tree_json = 'bodypart_full/body_part_json_trial_10/0302.json';
//var edges_txt = 'bodypart_full/edge_prob_bodypart_trial_10.txt';
var weights_csv = 'last_edges.csv';
var names_txt = 'bodypart_full/list_of_words_bodypart.txt';

queue()
    .defer(d3.json, tree_json)
    .defer(d3.csv, weights_csv)
    .defer(d3.text, names_txt)
    .await(setup);

function setup(error, root, weight_data, name_data) {
    if (error) throw error;

    // Store stuff in globals
    nodes = tree.nodes(root),
    links = tree.links(nodes);
    weightMatrix = weight_data;
    names = name_data.split('\n');

    // Set up the force layout
//    force
//        .nodes(nodes)
//        .links(links)
//        .start();

    var link = svg.selectAll("path.link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);
//        .attr("stroke", "#ccc")
//        .attr("stroke-width", LINK_WIDTH);

    var node = svg.selectAll("g.node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
//        .call(force.drag);

    node.append("circle")
        .attr("r", 4.5);
        /*
        .attr("r", d => 60 / (d.depth + 2));
        .attr("r", function(d) {
            return d.children ? 10*Math.sqrt(d.children.length+1) : 10;
        });
        */

    node.append("text")
        .attr("dx", d => d.children ? -8 : 8)
        .attr("dy", 3)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.name);
//        .attr("dy", ".31em")
//        .attr("text-anchor", "middle")

//    node.on("mouseover", highlightNode)
//        .on("mouseout", unHighlightNode);
//
//    force.on("tick", drawGraph);
}
