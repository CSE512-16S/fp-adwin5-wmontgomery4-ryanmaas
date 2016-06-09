/***********
 ** STYLE **
 ***********/
// Interpolate stroke/strokeWidth based on weight strength
function stroke(link) {
    return d3.interpolateRgb("#f00", "#000")(link.strength);
}

function strokeWidth(link) {
    return d3.interpolate(1.5, 3.0)(link.strength);
}

function opacity(link) {
    return d3.interpolate(0.3, 1.0)(link.strength);
}

var highlightFill = d3.interpolateRgb("#ccf", "#88f");

/**********
 ** DEMO **
 **********/
var DEMO_SEQ = 300,
    DEMO_SVG_WIDTH = 1100,
    DEMO_SVG_HEIGHT = 450,
    DEMO_SVG_OFFSET = 30,
    DEMO_NUM_BODYPART = 44,
    DEMO_WEIGHT_THRESHOLD = 0.5 / DEMO_NUM_BODYPART,
    DEMO_DATA_DIR = 'bodypart_' + DEMO_NUM_BODYPART;

var demoLayout = d3.layout.tree()
    .size([DEMO_SVG_HEIGHT, DEMO_SVG_WIDTH-2.5*DEMO_SVG_OFFSET]);

// Load stuff and get ready
var demo_names_txt = DEMO_DATA_DIR + '/list_of_words_bodypart.txt';
var demo_weights_txt = DEMO_DATA_DIR + '/edge_prob_bodypart.txt';
var demo_padded = ('0000' + DEMO_SEQ).slice(-4) + '.json';
var demo_json = DEMO_DATA_DIR + '/body_part_json/' + demo_padded;

// Magic global
var demo;
d3.select("#demoBTN").on("click", function() {
    this.remove();

    // Setup header, with button to move forward
    var header = d3.select("#timeline").append("div")
        .attr("class", "row log well col-md-12")
        .attr("id", "demoHeader");

    var instructions = header.append("h3").text("Demo Instructions");

    var list = header.append("ul")
    list.append("li").text("Below is the MAP hierarchy learned after crowdsourcing 300 questions.")
    list.append("li").text("Weaker edges appear thinner/redder/more transparent.")
    list.append("li").text("Hover over a node to activate edge highlighting, show other possible parent nodes")

    // Add button for getting to interactive part
    header.append("button")
        .attr("class", "btn btn-primary btn-md pull-right")
        .text("Go To Interactive Session")
        .on("click", function() {
            this.remove();
            createNextQuestion();
        });

    // Scroll to header
    $('html,body').animate({scrollTop: $("#demoHeader").offset().top}, 'slow');

    demo = d3.select("#timeline").append("div")
        .attr("class", "block chart")
      .append("svg")
        .attr("width", DEMO_SVG_WIDTH)
        .attr("height", DEMO_SVG_HEIGHT)
      .append("g")
        .attr("transform", "translate(" + DEMO_SVG_OFFSET + ",0)");

    var demoQueue = queue()
        .defer(d3.text, demo_names_txt)
        .defer(d3.text, demo_weights_txt)
        .defer(d3.json, demo_json)
        .await(initDemo);
});

function initDemo(error, names_raw, weights_raw, root) {
    if (error) throw error;

    // Legend
    // TODO: abstract into function
    var gradient = demo.append("svg:defs")
      .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");
    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#f00")
        .attr("stop-opacity", 0.3);
    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#000")
        .attr("stop-opacity", 1.0);
    demo.append("svg:polygon")
        .attr("points", "0,400 0,401.5 200,402.25 200,399.25")
        .style("fill", "url(#gradient)");
    demo.append("text")
        .attr("x", 0)
        .attr("y", 390)
        .attr("font-size", 10)
        .text("Edge Probability")
    demo.append("text")
        .attr("x", 0)
        .attr("y", 415)
        .attr("font-size", 10)
        .text("0%")
    demo.append("text")
        .attr("x", 100)
        .attr("y", 415)
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text("50%")
    demo.append("text")
        .attr("x", 200)
        .attr("y", 415)
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .text("100%")

    // setup nameIndex
    var names = names_raw.split("\n");
    names.pop(); // Drop empty last string
    var nameIndex = {};
    names.forEach( (name, i) => nameIndex[name] = i );

    // Parse magic
    weights_raw = weights_raw.split("\n")[DEMO_SEQ].split(",");
    var weights = [];
    for (var i = 0; i < DEMO_NUM_BODYPART; i++) {
        var withEntity = DEMO_NUM_BODYPART + 1;
        weights.push(weights_raw.slice(withEntity*i, withEntity*(i+1)));
    }

    // Set up tree
    function sortNames(a,b) {
        if (a === 'body') return -1;
        if (b === 'body') return 1;
        return nameIndex[a] - nameIndex[b];
    }
    var nodes = demoLayout.nodes(root).sort((a,b) => sortNames(a.name, b.name));
    var links = demoLayout.links(nodes).sort((a,b) => sortNames(a.target.name, b.target.name));

    // Store edge strength
    links.forEach(function(link) {
        var targetIndex = nameIndex[link.target.name];
            sourceIndex = (link.source.name === 'body') ? 0 :
                                nameIndex[link.source.name] + 1;
        link.strength = weights[targetIndex][sourceIndex];
    });

    // Set up svg elements
    var link = demo.selectAll("path.link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("opacity", opacity);

    var node = demo.selectAll("g.node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")")

    node.append("rect")
        .attr("width", d => 20 + d.name.length * 4)
        .attr("x", d => -10 - d.name.length * 2)
        .attr("height", 20)
        .attr("y", -10);

    node.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .text(d => d.name);

    // Add highlighting
    node.on("mouseover", function(d) {
        // Don't highlight 'body'
        if (d.name === 'body') return;

        // Set up the new hiddenLinks
        var highlightLinks = [],
            index = nameIndex[d.name],
            w = weights[index];
        for (var i in w){ // loops over the name indices
            if (w.hasOwnProperty(i) && w[i] > DEMO_WEIGHT_THRESHOLD) {
                highlightLinks.push({
                    source: nodes[i],
                    target: d,
                    strength: w[i],
                });
            }
        }

        demo.selectAll("g.node rect")
            // TODO: make more efficient
            .style("fill", function(node) {
                // Draw gold child
                if (node.name === d.name) return "#ff8";

                // Try to extract associated link
                var link = highlightLinks.find(link => link.source.name === node.name);
                return link ? highlightFill(link.strength) : "#fff";
            });

        demo.selectAll("path.link")
            .style("visibility", "hidden");

        demo.selectAll("path.link.highlight")
            .data(highlightLinks)
          .enter().insert("path", ":first-child")
            .attr("class", "link highlight")
            .attr("d", diagonal)
            .attr("stroke", stroke)
            .attr("stroke-width", strokeWidth)
            .attr("opacity", opacity);
    })

    // Add unhighlighting
    node.on("mouseout", function () {
        demo.selectAll("path.link.highlight")
            .remove();

        demo.selectAll("path.link")
            .style("visibility", "visible");

        demo.selectAll("g.node rect")
            .style("fill", "#fff");
    });
}

/**********
 ** MAIN **
 **********/

// Constants
var SVG_WIDTH = 550,
    SVG_HEIGHT = 510,
    SVG_OFFSET = 30,
    DURATION = 750,
    NUM_BODYPART = 10,
    NUM_QUESTIONS = 38,
    WEIGHT_THRESHOLD = 0.5 / NUM_BODYPART,
    DATA_DIR = 'bodypart_' + NUM_BODYPART;

// Globals we'll manipulate
var trees = [],
    nameIndex = {},
    questions = [],
    weightMatrix = [],
    seq = 0;

// Initialize tree layout
var layout = d3.layout.tree()
    .size([SVG_HEIGHT, SVG_WIDTH-2.5*SVG_OFFSET]);

// Flip x/y to get left to right tree
var diagonal = d3.svg.diagonal()
    .projection(d => [d.y, d.x]);

// Sorting function to keep everything sane
// NOTE: this is annoying because of the weightMatrix ordering
function sortNames(a,b) {
    if (a === 'body') return -1;
    if (b === 'body') return 1;
    return nameIndex[a] - nameIndex[b];
}

/********************
 ** INITIALIZATION **
 ********************/
var names_txt = DATA_DIR + '/list_of_words_bodypart.txt';
var questions_txt = DATA_DIR + '/questions_bodypart.txt';
var weights_txt = DATA_DIR + '/edge_prob_bodypart.txt';

function jsonFile(seq) {
    padded = ('0000' + seq).slice(-4);
    return DATA_DIR + '/body_part_json/' + padded + '.json';
}

var mainQueue = queue()
    .defer(d3.text, names_txt)
    .defer(d3.text, weights_txt)
    .defer(d3.text, questions_txt);

mainQueue.await(function(error, names_raw, weights_raw, questions_raw) {
    if (error) throw error;

    // setup nameIndex
    var names = names_raw.split("\n");
    names.pop(); // Drop empty last string

    nameIndex = {};
    names.forEach( (name, i) => nameIndex[name] = i );

    // Tricky stuff to format the weight matrix manually
    // (d3.csv doesn't work for some reason)
    weightMatrix = weights_raw.split("\n");
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

    // Parse questions
    questions = questions_raw.split("\n");
    questions.pop(); // Remove empty last string
    questions = questions.map( (raw) => raw.split(",") );
});


/*****************
 ** INTERACTION **
 *****************/
function createNextQuestion(){
    // Append SVG objects for next question and tree

    // Create the next question and buttons
    var q = d3.select("#timeline").append("div")
        .attr("class", "row log well col-md-12")
        .attr("id", "q" + seq);

    var parent = questions[seq][0],
        child = questions[seq][1];
    q.append("h3")
        .html("Q" + (seq + 1) +  ") Is <b>'" + child + "'</b> part of <b>'" + parent + "'</b>?");

    var yesButton = q.append("button")
        .attr("class", "yes btn btn-success btn-default-md")
        .text("Yes")

    var noButton = q.append("button")
        .attr("class", "no btn btn-danger btn-default-md")
        .text("No")

    var nextButton = q.append("button")
        .attr("class", "next btn btn-primary btn-primary-md pull-right")
        .text("Next Question")
        .style("visibility", "hidden")

    // Scroll to new question
    $('html,body').animate({scrollTop: $("#q"+seq).offset().top}, 'slow');

    // Create the first chart and draw it
    var row = d3.select("#timeline").append("div")
        .attr("class", "row")
        .attr("id", "r" + seq);

    var chart = row.append("div")
        .attr("class", "block chart")

    // TODO: hack
    chart.qChild = child;
    chart.qParent = parent;

    initChart(chart, seq, unHighlightNode); // TODO: hack

    // Set up the buttons
    function update() {
        seq++;
        updateChart(chart, function() {
            var prevChart = row.insert("div", ":first-child")
                .attr("class", "block chart");

            // Hacky setup before init
            prevChart.qChild = child;
            prevChart.qParent = parent;
            initChart(prevChart, chart.seq - 1, unHighlightNode)

            // Nice transition
            var svg = prevChart.select("svg");
            svg.attr("width", 0);
            svg.transition()
                .duration(DURATION)
                .attr("width", SVG_WIDTH)
                .each("end", function () {
                    // Don't display next button until the end
                    nextButton.style("visibility", "visible");
                });
        });
    }

    var yesNoClicked = false;
    yesButton.on("click", function() {
        if (yesNoClicked++) return;
        noButton.style("visibility", "hidden");
        update()
    });

    noButton.on("click", function() {
        if (yesNoClicked++) return;
        yesButton.style("visibility", "hidden");
        update()
    });

    var nextClicked = false;
    nextButton.on("click", function() {
        if (!yesNoClicked) return;
        if (nextClicked++) return;
        nextButton.style("visibility", "hidden");
        createNextQuestion();
    });
}

function initChart(chart, seq, callback) {
    // TODO: super hacky, but it works well enough
    chart.seq = seq;

    // TODO: hack, assumes only need to import next tree
    if (trees.length <= chart.seq) {
        d3.json(jsonFile(chart.seq), function(error, root) {
            if (error) throw error;
            trees.push(root);
            initChart(chart, seq, callback);
        });
        return;
    }

    // Create the chart
    var svg = chart.append("svg")
        .attr("width", SVG_WIDTH)
        .attr("height", SVG_HEIGHT)
      .append("g")
        .attr("transform", "translate(" + SVG_OFFSET + ",0)");

    // Legend
    var gradient = svg.append("svg:defs")
      .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");
    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#000")
        .attr("stop-opacity", 1.0);
    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#f00")
        .attr("stop-opacity", 0.3);

    svg.append("svg:polygon")
        .attr("points", "-10,300 -7,300 -5.25,500 -6.75,500")
        .style("fill", "url(#gradient)");
//    svg.append("text")
//        .attr("x", 200)
//        .attr("y", 200)
//        .attr("font-size", 10)
//        .attr("transform", "rotate(90)")
//        .attr("text-anchor", "middle")
//        .text("Edge Probability")
    svg.append("text")
        .attr("x", -2)
        .attr("y", 310)
        .attr("font-size", 10)
        .text("100%")
    svg.append("text")
        .attr("x", -2)
        .attr("y", 405)
        .attr("font-size", 10)
        .text("50%")
    svg.append("text")
        .attr("x", -2)
        .attr("y", 500)
        .attr("font-size", 10)
        .text("0%")

    // NOTE: keep nodes sorted for transitioning properly
    var root = trees[chart.seq]
    var nodes = layout.nodes(root).sort((a,b) => sortNames(a.name, b.name));
    var links = layout.links(nodes).sort((a,b) => sortNames(a.target.name, b.target.name));

    // Store edge strength
    links.forEach(function(link) {
        var targetIndex = nameIndex[link.target.name];
            sourceIndex = (link.source.name === 'body') ? 0 :
                                nameIndex[link.source.name] + 1;
        link.strength = weightMatrix[chart.seq][targetIndex][sourceIndex];
    });

    // Store stuff
    chart.nodes = nodes;
    chart.links = links;

    // Show that this is before question
    var label = svg.append("text")
        .attr("class", "beforeAfter")
        .attr("font-size", 24)
        .attr("x", 10 - SVG_OFFSET)
        .attr("y", 30)
        .text("Before")

    // Set up svg elements
    var link = svg.selectAll("path.link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("opacity", opacity);

    var node = svg.selectAll("g.node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
        .on("mouseover", d => highlightNode(chart, d))
        .on("mouseout", d => unHighlightNode(chart)); // TODO: hacky

    node.append("rect")
        .attr("width", d => 20 + d.name.length * 4)
        .attr("x", d => -10 - d.name.length * 2)
        .attr("height", 20)
        .attr("y", -10);

    node.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .text(d => d.name);

    if (callback) callback(chart);
}

function updateChart(chart, callback) {
    // update to current thing
    // TODO: hack, assumes only need to import next tree
    if (trees.length <= chart.seq+1) {
        d3.json(jsonFile(chart.seq+1), function(root) {
            trees.push(root);
            updateChart(chart, callback);
        });
        return;
    }
    chart.seq++;

    // NOTE: keep nodes sorted for transitioning properly
    var root = trees[chart.seq]
    var nodes = layout.nodes(root).sort((a,b) => sortNames(a.name, b.name));
    var links = layout.links(nodes).sort((a,b) => sortNames(a.target.name, b.target.name));

    // Store stuff
    chart.nodes = nodes;
    chart.links = links;

    // Store edge strength
    // TODO: Store hiddenlinks
    links.forEach(function(link) {
        var targetIndex = nameIndex[link.target.name];
            sourceIndex = (link.source.name === 'body') ? 0 :
                                nameIndex[link.source.name] + 1;
        link.strength = weightMatrix[chart.seq][targetIndex][sourceIndex];
    });

    // Update chart with smooth transition
    var link = chart.selectAll("path.link")
        .data(links)
        .transition()
        .duration(DURATION)
        .attr("d", diagonal)
        .style("stroke", stroke)
        .style("stroke-width", strokeWidth)
        .attr("opacity", opacity);

    var node = chart.selectAll("g.node")
        .data(nodes)
        .transition()
        .duration(DURATION)
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

    var label = chart.select(".beforeAfter")
        .transition()
        .duration(DURATION)
        .text("After")
        .each("end", function() {
            if (callback) callback(chart);
        });
}

function highlightNode(chart, d) {
    // Don't highlight 'body'
    if (d.name === 'body') return;

    // Set up the new hiddenLinks
    // NOTE: this requires some tricky indexing because the ordering
    //       of nodes in the tree differs from the alphabetical order
    var highlightLinks = [],
        index = nameIndex[d.name],
        weights = weightMatrix[chart.seq][index];
    for (var i in weights){ // loops over the name indices
        if (weights.hasOwnProperty(i) && weights[i] > WEIGHT_THRESHOLD) {
            highlightLinks.push({
                source: chart.nodes[i],
                target: d,
                strength: weights[i],
            });
        }
    }

    var svg = chart.select("svg").select("g");

    svg.selectAll("g.node rect")
        // TODO: make more efficient
        .style("fill", function(node) {
            // Draw gold child
            if (node.name === d.name) return "#ff8";

            // Try to extract associated link
            var link = highlightLinks.find(link => link.source.name === node.name);
            return link ? highlightFill(link.strength) : "#fff";
        });

    svg.selectAll("path.link")
        .style("visibility", "hidden");

    svg.selectAll("path.link.highlight")
        .data(highlightLinks)
      .enter().insert("path", ":first-child")
        .attr("class", "link highlight")
        .attr("d", diagonal)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("opacity", opacity);
}

function unHighlightNode(chart) {
    chart.selectAll("path.link.highlight")
        .remove();

    chart.selectAll("path.link")
        .style("visibility", "visible");

    chart.selectAll("g.node rect")
        .style("fill", function(node) {
            if (node.name === chart.qChild) return "#ff8";
            if (node.name === chart.qParent) return "#88f";
            else return "#fff";
        });
}
