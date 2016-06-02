var width = 960;
var height = 800;

// Constants
DURATION = 1000;

// Globals we'll manipulate
// TODO: better way to handle this?
var nodes,
    links,
    names,
    hiddenLinks,
    weightMatrix;

// Initialize tree layout
//var tree = d3.layout.cluster()
var tree = d3.layout.tree()
    .size([height, width - 160]);

// Create the svg canvas into which everything goes
// NOTE: need transform to see root node
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

// File paths
var tree_json = 'bodypart_full/body_part_json_trial_10/0302.json';
var tree_json2 = 'bodypart_full/body_part_json_trial_10/0301.json';
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
    // NOTE: keep nodes sorted for transitioning properly
    nodes = tree.nodes(root).sort((a,b) => a.name.localeCompare(b.name));
    links = tree.links(nodes).sort((a,b) => a.target.name.localeCompare(b.target.name));
    weightMatrix = weight_data;
    names = name_data.split('\n');

    // Set up svg elements
    var link = svg.selectAll("path.link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = svg.selectAll("g.node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")")

    node.append("circle")
        .attr("r", 5);

    node.append("text")
        .attr("dy", 3)
        .attr("dx", d => d.children ? -8 : 8)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.name);
}

svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 50)
    .attr("height", 50)
    .on("click", toggle);

var cur_json = tree_json;

function toggle() {
    if (cur_json === tree_json) {
        cur_json = tree_json2;
    } else {
        cur_json = tree_json;
    }

    queue()
        .defer(d3.json, cur_json)
        .await(update);
}

function update(error, root) {
    if (error) throw error;

    // Store stuff in globals
    nodes = tree.nodes(root).sort((a,b) => a.name.localeCompare(b.name));
    links = tree.links(nodes).sort((a,b) => a.target.name.localeCompare(b.target.name));

    // Update svg
    var link = svg.selectAll("path.link")
        .data(links)
        .transition()
        .duration(DURATION)
        .attr("d", diagonal);

    var node = svg.selectAll("g.node")
        .data(nodes)
        .transition()
        .duration(DURATION)
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

    node.selectAll("text")
        .transition()
        .duration(DURATION)
        .text(d => d.name);
}
