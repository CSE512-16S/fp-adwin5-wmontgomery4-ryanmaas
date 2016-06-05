var width = 1000;
var height = 800;

/***********
 ** SETUP **
 ***********/

// Constants
var DURATION = 1000,
    WEIGHT_THRESHOLD = 1e-1,
    STROKE_WIDTH = 3.0;

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

// Sorting function to keep everything sane
// NOTE: this is annoying because of the weightMatrix ordering
function sortNames(a,b) {
    if (a === 'entity') return -1;
    if (b === 'entity') return 1;
    return a.localeCompare(b);
}

/********************
 ** INITIALIZATION **
 ********************/

function loadJson(iter, callback) {
    padded = ('0000' + iter).slice(-4);
    fname = 'bodypart_full/body_part_json_trial_10/' + padded + '.json';
    d3.json(fname, function(error, root) {
        if (error) throw error;

        // Store stuff in globals
        // NOTE: keep nodes sorted for transitioning properly
        nodes = tree.nodes(root).sort((a,b) => sortNames(a.name, b.name));
        links = tree.links(nodes).sort((a,b) => sortNames(a.target.name, b.target.name));
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
    // Set up svg elements
    var link = svg.selectAll("path.link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal)
        .attr("stroke", "#ccc")
        .attr("stroke-width", STROKE_WIDTH);

    var node = svg.selectAll("g.node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
        .on("mouseover", highlightNode)
        .on("mouseout", unHighlightNode)

    node.append("rect")
        .attr("width", 72)
        .attr("height", 20)
        .attr("x", -25)
        .attr("y", -10)

    node.append("text")
        .attr("dy", 4)
        .attr("dx", -20)
        .attr("text-anchor", "start")
        .text(d => d.name);
});

/*****************
 ** INTERACTION **
 *****************/
function updateTree(root) {
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

    // Set up the new hiddenLinks
    // NOTE: this requires some tricky indexing because the ordering
    //       of nodes in the tree differs from the alphabetical order
    var hiddenLinks = [],
        parents = [],
        nameIndex = names.indexOf(d.name),
        weights = weightMatrix[iter-1][nameIndex];
    for (var i in weights){ // loops over the name indices
        if (weights.hasOwnProperty(i) && weights[i] > WEIGHT_THRESHOLD) {
            hiddenLinks.push({
                source: nodes[i],
                target: d,
                strength: weights[i],
            });
        }
    }

    svg.selectAll("g.node rect")
        .style("fill", function(node) {
            if (node.name === d.name) return "#ff0";
            if (hiddenLinks.find(link => link.source.name === node.name)) return "#00b";
            else return "#fff";
        });

    svg.selectAll("path.link")
        .style("stroke-width", l => STROKE_WIDTH*(l.target.name !== d.name))

    svg.selectAll("path.link.hidden")
        .data(hiddenLinks)
      .enter().insert("path", ":first-child") // make sure it's under everything else
        .attr("class", "link hidden")
        .attr("d", diagonal)
        .attr("stroke", "#c11")
        .attr("stroke-width", d => d.strength * STROKE_WIDTH);
}

function unHighlightNode(d) {
    svg.selectAll("g.node rect")
        .style("fill", "#fff");

    svg.selectAll("path.link")
        .style("stroke-width", STROKE_WIDTH);

    svg.selectAll("path.link.hidden")
        .remove();
}
