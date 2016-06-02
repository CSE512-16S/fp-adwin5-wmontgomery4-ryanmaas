var width = 960;
var height = 800;

/***********
 ** SETUP **
 ***********/

// Constants
var DURATION = 1000,
    WEIGHT_THRESHOLD = 1e-1;

// Globals we'll manipulate
// TODO: better way to handle this?
var nodes,
    links,
    names,
    weightMatrix,
    iter = 302;

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

/********************
 ** INITIALIZATION **
 ********************/

function loadJson(iter, callback) {
    padded = ('0000' + iter).slice(-4);
    fname = 'bodypart_full/body_part_json_trial_10/' + padded + '.json';
    d3.json(fname, function(error, root) {
        if (error) throw error;
        callback(root);
    });
}

// Preload the names and weight matrix
// TODO: do this async?
var names_txt = 'bodypart_full/list_of_words_bodypart.txt';
d3.text(names_txt, function(error, name_str) {
    if (error) throw error;
    names = name_str.split("\n");
    names.pop(); // Drop empty last string
});

var weights_csv = 'bodypart_full/edge_prob_bodypart_trial_10.txt';
d3.text(weights_csv, function(error, weights_str) {
    if (error) throw error;

    // Tricky stuff to format the weight matrix manually
    // (d3.csv doesn't work for some reason)
    weightMatrix = weights_str.split("\n");
    weightMatrix.shift(); // Remove first row, corresponds to prior
    weightMatrix.pop(); // Remove last row, it's just an empty string

    // Reshape rows
    weightMatrix = weightMatrix.map(function(matrix_str) {
        var flattened = matrix_str.split(",");
        var matrix = [];
        for (var i = 0; i < 44; i++) {
            matrix.push(flattened.slice(45*i, 45*(i+1)));
        }
        return matrix;
    });
});

// Initialize tree
loadJson(iter, function(root) {
    // Store stuff in globals
    // NOTE: keep nodes sorted for transitioning properly
    nodes = tree.nodes(root).sort((a,b) => a.name.localeCompare(b.name));
    links = tree.links(nodes).sort((a,b) => a.target.name.localeCompare(b.target.name));

    // Set up svg elements
    var link = svg.selectAll("path.link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal)
        .attr("stroke", "#ccc")
        .attr("stroke-width", "1.5px");

    var node = svg.selectAll("g.node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
        .on("mouseover", highlightNode)
        .on("mouseout", unHighlightNode)

    node.append("circle")
        .attr("r", 5);

    node.append("text")
        .attr("dy", 3)
        .attr("dx", d => d.children ? -8 : 8)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.name);
});

/*****************
 ** INTERACTION **
 *****************/
function updateTree(root) {
    // Store stuff in globals
    // NOTE: keep nodes sorted for transitioning properly
    nodes = tree.nodes(root).sort((a,b) => a.name.localeCompare(b.name));
    links = tree.links(nodes).sort((a,b) => a.target.name.localeCompare(b.target.name));

    // Update svg with smooth transition
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
}

// Set up mock prev/next buttons
svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 50)
    .attr("height", 50)
    .on("click", function(){
        if (iter <= 1) return;
        iter -= 1;
        loadJson(iter, updateTree);
    });

svg.append("rect")
    .attr("x", 70)
    .attr("y", 0)
    .attr("width", 50)
    .attr("height", 50)
    .on("click", function(){
        if (iter > 301) return;
        iter += 1;
        loadJson(iter, updateTree);
    });

function highlightNode(d) {
    // Don't highlight 'entity'
    if (d.name === 'entity') return;

    // Highlight the node
    d3.select(this).select("circle")
        .style("fill", "#ff0");

    // Set up the new hiddenLinks
    // NOTE: this requires some tricky indexing because the ordering
    //       of nodes in the tree differs from the alphabetical order
    var hiddenLinks = [];
    var nameIndex = names.indexOf(d.name);
    var weights = weightMatrix[iter-1][nameIndex];
    for (var i in weights){ // loops over the name indices
        if (weights.hasOwnProperty(i) && weights[i] > WEIGHT_THRESHOLD) {
            if (i > 0) {
                var source = nodes.find(d => d.name === names[i-1]);
            } else {
                var source = nodes.find(d => d.name === 'entity');
            }
            hiddenLinks.push({
                source: source,
                target: d,
                strength: weights[i],
            });
        }
    }

    // Update the svg/force
    svg.selectAll("path.link.hidden")
        .data(hiddenLinks)
//      .enter().insert("line", ":first-child")
      .enter().append("path")
        .attr("class", "link hidden")
        .attr("d", diagonal)
        .attr("stroke", "#c11")
        .attr("stroke-width", d => 2 * d.strength);
}

function unHighlightNode(d) {
    d3.select(this).select("circle")
        .style("fill", "#fff");

    svg.selectAll("path.link.hidden")
        .remove();
}
