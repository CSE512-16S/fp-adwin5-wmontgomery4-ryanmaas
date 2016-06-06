// Constants
var SVG_WIDTH = 1000,
    SVG_HEIGHT = 500,
    SVG_OFFSET = 40,
    DURATION = 1000,
    STROKE_WIDTH = 3.0,
    NUM_BODYPART = 10,
    NUM_QUESTIONS = 132,
    WEIGHT_THRESHOLD = 1 / NUM_BODYPART,
    DATA_DIR = 'bodypart_' + NUM_BODYPART;

// Globals we'll manipulate
var trees,
    nameIndex,
    questions,
    weightMatrix,
    seq = 0;

// Initialize tree layout
//var tree = d3.layout.cluster()
var tree = d3.layout.tree()
    .size([SVG_HEIGHT, SVG_WIDTH-2*SVG_OFFSET]);

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

// Create swiper (magic!)
var swiper = new Swiper('.swiper-container', {
    scrollbar: '.swiper-scrollbar',
    scrollbarHide: true,
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: 30,
    grabCursor: true
});

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

var queue = queue()
    .defer(d3.text, names_txt)
    .defer(d3.text, weights_txt)
    .defer(d3.text, questions_txt)
//    .defer(d3.json, jsonFile(seq))
    .await(initialize);

function initialize(error, names_raw, weights_raw, questions_raw, root) {
//function initialize(error, names_raw, weights_raw, questions_raw, root) {
    if (error) throw error;

    // setup nameIndex
    var names = names_raw.split("\n");
    names.pop(); // Drop empty last string

    nameIndex = {};
    names.forEach( (name, i) => nameIndex[name] = i );

    // Tricky stuff to format the weight matrix manually
    // (d3.csv doesn't work for some reason)
    weightMatrix = weights_raw.split("\n");
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
    
    // Parse questions
    questions = questions_raw.split("\n");
    questions.pop(); // Remove empty last string
    questions = questions.map( (raw) => raw.split(",") );
}


/*****************
 ** INTERACTION **
 *****************/
function scrollToQuestion(){
}

function createNextQuestion(callback){
    // Append SVG objects for next question and tree

    // Create the next question
    var q = d3.select("#timeline").append("div")
        .attr("class", "row log well col-md-12")
        .attr("id", "q" + seq)
    
    var parent = questions[seq][0],
        child = questions[seq][1];
    q.append("h2")
        .text("Is '" + parent + "' a descendant of '" + child + "'?");

    q.append("button")
        .attr("class", "yes btn btn-default btn-default-md")
        .text("Yes")

    q.append("button")
        .attr("class", "no btn btn-default btn-default-md")
        .text("No")

    var clicked = false;
    q.append("button")
        .attr("class", "next btn btn-default btn-default-md")
        .text("Next")
        .on("click", function() {
            if (clicked++) return; // set clicked true, nifty
            seq++;
            createNextQuestion();
        });

    $('html,body').animate({scrollTop: $("#q"+seq).offset().top}, 'slow');

    if (callback) callback();
}

//    // Store stuff in globals
//    // NOTE: keep nodes sorted for transitioning properly
//    nodes = tree.nodes(root).sort((a,b) => sortNames(a.name, b.name));
//    links = tree.links(nodes).sort((a,b) => sortNames(a.target.name, b.target.name));
//    links.forEach(function(link) {
//        var targetIndex = nameIndex[link.target.name];
//            sourceIndex = (link.source.name === 'body_part') ? 0 : 
//                                nameIndex[link.source.name] + 1;
//        link.strength = weightMatrix[seq][targetIndex][sourceIndex];
//    });
//
//    // Create the chart
//    var svg = d3.select("#chart1").append("svg")
//        .attr("width", SVG_WIDTH)
//        .attr("height", SVG_HEIGHT)
//        .append("g")
//        .attr("transform", "translate(" + SVG_OFFSET + ",0)"); 
//
//    // Set up svg elements
//    var link = svg.selectAll("path.link")
//        .data(links)
//      .enter().append("path")
//        .attr("class", "link")
//        .attr("d", diagonal)
//        .attr("stroke", l => color(l.strength))
//        .attr("stroke-width", l => l.strength * STROKE_WIDTH);
//
//    var node = svg.selectAll("g.node")
//        .data(nodes)
//      .enter().append("g")
//        .attr("class", "node")
//        .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
////        .on("mouseover", highlightNode)
////        .on("mouseout", unHighlightNode)
//
//    node.append("rect")
//        .attr("width", d => 10 + d.name.length * 6)
//        .attr("x", d => -5 - d.name.length * 3)
//        .attr("height", 20)
//        .attr("y", -10);
//
//    node.append("text")
//        .attr("dy", 4)
//        .attr("text-anchor", "middle")
//        .text(d => d.name);
//}

////called when user click Yes/No, and the system would send the posterior tree as the input of this function "data"        
//function updateANS(data){
//    createSVG("#chart2", 560, 280, function(vis){
//        //do the transition animation [from the current state to next state]*************************
//
//
//
//        //
//        render(vis, data, "#chart2");//right now just plot the posterior json tree// the last state tree can be acquired by dataHistory  
//    });
//    //plot this to slides
//    if(seq<33)
//    {
//        $("#s"+seq).empty()
//        createSVG("#s"+seq, 500, 250, function(vis){
//            render(vis, data, "#s0");  
//        });    
//        //plot question on slides
//        d3.select("#s"+seq).select("svg").append("text").text("Q"+seq+" : "+data.value.question[1].replace(/\s+/g,"") +" <- "+data.value.question[0]+" ?").attr("x",250).attr("y",20).attr("font-size",25)
//            .attr("font-family","serif")
//            .attr("text-anchor","middle");    
//    }
//    //update the question temporal variable 
//    questionTEM = data.value.question;    
//    if(seq<301) seq++;
//}
////called when user click next
//function updateNEXT(){
//    $("#questionTitle").html("Q"+seq+" : "+'<mark>' + questionTEM[1].replace(/\s+/g,"") + '</mark>' + " is the children of " + '<mark>' + questionTEM[0] + '</mark>' +" ?");
//
//    //delete #1
//    d3.select('#chart1').select("svg").remove();
//    if(seq<seqTotal+1)//no movement in the end iteration
//    {
//        //move the #chart2 to left
//        $("#chart2").fadeIn('slow',function(){
//            $(this).animate({'left': '-=600px'},300,function(){
//                    //#1 copy #2
//                    document.getElementById("chart1").appendChild(
//                        document.getElementById("chart2").querySelector("svg")
//                    );
//                    //move the #chart2back to right
//                    $("#chart2").animate({
//                        'left' : "0px" //moves right
//                    });
//            });
//        });
//    }
//    //set progress bar
//    var temSeq = seq-1;
//    if(temSeq<seqTotal)
//    {
//        document.getElementById("slidesProgress").style.width= 100*temSeq/seqTotal+"%";
//        $("#slidesProgress").html(Math.round(100*temSeq/seqTotal)+"%");  
//    }    
//    else if(temSeq==seqTotal)
//    {
//        document.getElementById("slidesProgress").style.width= 100+"%";
//        $("#slidesProgress").html(100*temSeq/seqTotal+"%");  
//        $("#slidesProgress").attr("class", "progress-bar progress-bar-danger progress-bar-striped");
//        document.getElementById("restartBTN").style.visibility="visible";
//        document.getElementById("answerYES").style.visibility="hidden";
//        document.getElementById("answerNO").style.visibility="hidden";
//        document.getElementById("next_question").style.visibility="hidden";
//    }   
//}

// setup scrolling buttons
$("#startBTN").click(function() {
    if (seq > 0) return;
    createNextQuestion();
});

$("#galleryBTN").click(function() {
    $('html,body').animate({
        scrollTop: $("#gallerySection").offset().top},
        'slow');
});
$("#animationBTN").click(function() {
    $('html,body').animate({
        scrollTop: $("#animationSection").offset().top},
        'slow');
});
$('#galleryBTNBack').click(function() {
    $('html,body').animate({
        scrollTop: $("#vizSection").offset().top},
        'slow');
});
$('#animationBTNBack').click(function() {
    $('html,body').animate({
        scrollTop: $("#vizSection").offset().top},
        'slow');
});

//// This script block handles all the Socket-IO communication
//var handleServerRequest = function(data) {
//    console.log({
//        source: 'server',
//        action: 'request',
//        data: data
//    });
//    dataHistory.push(data.value);//store data in here
//    if(seq==0)
//        updateINIT(data);
//    else
//        updateANS(data);
//};
//
//var socket = io.connect('http://localhost'); //, {port:81}
//socket.on('server request', handleServerRequest);
//// socket.on('update_after_answer', function(data){
////     console.log('update_after_answer'+data.value);
//// });
//
////tell the server to generate new tree, question and matrix based on the yes/no
//function answerButtonClicked() {
//    socket.emit(
//        "answer_button_clicked",1);// [Yes,no] = [1,0]
//    //set answer hidden //set next visible
//    document.getElementById("answerYES").style.visibility="hidden";
//    document.getElementById("answerNO").style.visibility="hidden";
//    document.getElementById("next_question").style.visibility="visible";
//}
//function nextQuestionButtonClicked() {
//    //change the layout from right to left//***
//    //socket.emit(
//    //    "next_question",1);
//
//    //set next hidden //set answer visible
//    document.getElementById("answerYES").style.visibility="visible";
//    document.getElementById("answerNO").style.visibility="visible";
//    document.getElementById("next_question").style.visibility="hidden";
//    updateNEXT();
//
//} 
//function restartButtonClicked() {
//    seq=0;
//    document.getElementById("answerYES").style.visibility="visible";
//    document.getElementById("answerNO").style.visibility="visible";
//    document.getElementById("restartBTN").style.visibility="hidden";
//    $("#slidesProgress").attr("class", "progress-bar progress-bar-striped active");
//    document.getElementById("slidesProgress").style.width= 0+"%";
//    $("#slidesProgress").html(0+"%");  
//    d3.select('#chart1').select("svg").remove();
//    d3.select('#chart2').select("svg").remove();
//    socket.emit("restart",1);//send notification to server
//    //clear dataHistory
//    dataHistory = [];
//    //clear the gallery
//    for(var i=0;i<33;i++)
//    {
//        d3.select('#s'+i).selectAll("svg").remove();
//    }
//    for(var i=1;i<33;i++)
//    {
//        d3.select('#s'+i).html("slides"+i);
//    }        
//} 
//document.getElementById("answerYES").addEventListener("click", answerButtonClicked);
//document.getElementById("answerNO").addEventListener("click", answerButtonClicked); //right now call the same function***
//document.getElementById("next_question").addEventListener("click", nextQuestionButtonClicked);
//document.getElementById("restartBTN").addEventListener("click", restartButtonClicked);
//document.getElementById("restartBTN").style.visibility="hidden";

//function createSVG(stage, widthSVG, transSVG, callback){
//            vis = d3.select(stage).append("svg:svg")
//                .attr("width", widthSVG)
//                .attr("height", widthSVG)
//                .append("svg:g")
//                .attr("transform", "translate("+transSVG+", "+transSVG+")"); 
//            callback(vis);        
//}
//function render(vis,actual_JSON, stage){
//            var treeData = actual_JSON.value.tree;
//            var question = actual_JSON.value.question;
//            var seqKeyword;
//            
//            // Create a cluster "canvas"
//            var cluster = d3.layout.cluster()
//            .size([300,150]);
// 
//            var diagonal = d3.svg.diagonal.radial()
//            .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
//             
//            var nodes = cluster.nodes(treeData);
//            var links = cluster.links(nodes);
// 
//            var link = vis.selectAll("pathlink")
//            .data(links)
//            .enter().append("svg:path")
//            .attr("class", "link")
//            .attr("d", diagonal)
// 
//            var node = vis.selectAll("g.node")
//                .data(nodes)
//                .enter().append("svg:g")
//                .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
// 
//            // Add the dot at every node
//            node.append("svg:circle")
//                .attr("r", 3.5);
// 
//            node.append("svg:text")
//                .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
//                .attr("dy", ".31em")
//                .attr("fill", 
//                    function(d){//highlight the chosen node
//                        if(stage == "#chart2")
//                            seqKeyword = seq-1;
//                        else
//                            seqKeyword = seq;
//                        if(d.name == question[0]||d.name == question[1].replace(/\s+/g,"")) return "red";
//                        else    return "black";
//                    })
//                .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
//                .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
//                .text(function(d) { return d.name; });
//            
//        }    

//function updateINIT(data){
//        //set next invisible initially
//        document.getElementById("next_question").style.visibility="hidden";
//
//        createSVG("#chart1", 560, 280, function(vis){   
//            render(vis, data, "#chart1");  
//        });
//        //plot to the slide
//        $('#s0').empty()
//        createSVG("#s"+seq, 500, 250, function(vis){
//            render(vis, data, "#s0");  
//        });    
//        //set question title
//        $("#questionTitle").html("Q1 : "+'<mark>' + data.value.question[1].replace(/\s+/g,"") + '</mark>' + " is the children of " + '<mark>' + data.value.question[0] + '</mark>' +" ?");
//        seq++;
//}

