var width = 800;
var height = 600;

/***********
 ** SETUP **
 ***********/

// Constants
var DURATION = 1000,
    STROKE_WIDTH = 3.0,
    NUM_BODYPART = 24,
    WEIGHT_THRESHOLD = 1 / NUM_BODYPART;

// Globals we'll manipulate
// TODO: better way to handle this?
var nodes,
    links,
    nameIndex,
    weightMatrix,
    iter = 0;

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

// Interpolate color based on weight strength
var color = d3.interpolateRgb("#f00", "#000");

// Sorting function to keep everything sane
// NOTE: this is annoying because of the weightMatrix ordering
function sortNames(a,b) {
    if (a === 'body_part') return -1;
    if (b === 'body_part') return 1;
    return nameIndex[a] - nameIndex[b];
}

/********************
 ** INITIALIZATION **
 ********************/

function loadJson(iter, callback) {
    padded = ('0000' + iter).slice(-4);
    fname = 'bodypart_24/body_part_json_24/' + padded + '.json';
    d3.json(fname, function(error, root) {
        if (error) throw error;

        // Store stuff in globals
        // NOTE: keep nodes sorted for transitioning properly
        nodes = tree.nodes(root).sort((a,b) => sortNames(a.name, b.name));
        links = tree.links(nodes).sort((a,b) => sortNames(a.target.name, b.target.name));
        links.forEach(function(link) {
            var targetIndex = nameIndex[link.target.name];
                sourceIndex = (link.source.name === 'body_part') ? 0 : 
                                    nameIndex[link.source.name] + 1;
            link.strength = weightMatrix[iter][targetIndex][sourceIndex];
        });
        callback(root);
    });
}

// Preload the names and weight matrix
// TODO: do this async?
var names_txt = 'bodypart_24/list_of_words_bodypart_24.txt';
d3.text(names_txt, function(error, name_str) {
    if (error) throw error;
    var names = name_str.split("\n");
    names.pop(); // Drop empty last string

    nameIndex = {};
    names.forEach( (name, i) => nameIndex[name] = i );
});

var weights_csv = 'bodypart_24/edge_prob_bodypart_24.txt';
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
        for (var i = 0; i < NUM_BODYPART; i++) {
            var withEntity = NUM_BODYPART + 1;
            matrix.push(flattened.slice(withEntity*i, withEntity*(i+1)));
        }
        return matrix;
    });
    
    // Initialize tree with nested callback

    // NOTE: hack since we don't use async above
    // Have to do this after loading weights
    loadJson(iter, function(root) {
        // Set up svg elements
        var link = svg.selectAll("path.link")
            .data(links)
          .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal)
            .attr("stroke", l => color(l.strength))
            .attr("stroke-width", l => l.strength * STROKE_WIDTH);

        var node = svg.selectAll("g.node")
            .data(nodes)
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
            .on("mouseover", highlightNode)
            .on("mouseout", unHighlightNode)

        node.append("rect")
            .attr("width", 85)
            .attr("height", 20)
            .attr("x", -25)
            .attr("y", -10);

        node.append("text")
            .attr("dy", 4)
            .attr("dx", -20)
            .attr("text-anchor", "start")
            .text(d => d.name);
    });
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
        .attr("d", diagonal)
        .style("stroke", l => color(l.strength))
        .style("stroke-width", l => l.strength * STROKE_WIDTH);

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
    // Don't highlight 'body_part'
    if (d.name === 'body_part') return;

    // Set up the new hiddenLinks
    // NOTE: this requires some tricky indexing because the ordering
    //       of nodes in the tree differs from the alphabetical order
    var hiddenLinks = [],
        index = nameIndex[d.name],
        weights = weightMatrix[iter+1][index];
    for (var i in weights){ // loops over the name indices
        if (weights.hasOwnProperty(i) && // Not sure if this is necessary here
                    nodes[i] !== d.parent &&
                    weights[i] > WEIGHT_THRESHOLD) {
            hiddenLinks.push({
                source: nodes[i],
                target: d,
                strength: weights[i],
            });
        }
    }

    // TODO: make more efficient
    svg.selectAll("g.node rect")
        .style("fill", function(node) {
            if (node.name === d.name) return "#ff9";
            if (hiddenLinks.find(link => link.source.name === node.name) ||
                node.name === d.parent.name) return "#99f";
            else return "#fff";
        });

    svg.selectAll("path.link.hidden")
        .data(hiddenLinks)
      .enter().insert("path", ":first-child") // make sure it's under everything else
        .attr("class", "link hidden")
        .attr("d", diagonal)
        .attr("stroke", l => color(l.strength))
        .attr("stroke-width", l => l.strength * STROKE_WIDTH);
}

function unHighlightNode(d) {
    svg.selectAll("path.link.hidden")
        .remove();

    svg.selectAll("path.link")
        .style("stroke-width", l => l.strength * STROKE_WIDTH);

    svg.selectAll("g.node rect")
        .style("fill", "#fff");
}
