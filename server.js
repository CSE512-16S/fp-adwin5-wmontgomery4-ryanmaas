var app = require('http').createServer(handler),
    io = require('socket.io').listen(app), //require('socket.io').listen(80);
    fs = require('fs');

app.listen(9900);
var seq =0;
var obj ={};

//preload all the question from questions_bodypart_trial_10.txt  
var questionLists;
readTextFile("bodypart_full/questions_bodypart_trial_10.txt",function (d){
    var fixedResponse = d.split('\n');
    //var jsonObj = JSON.parse(fixedResponse);
    questionLists = fixedResponse;
});

console.log("listen to port 9900");

function handler(req, res) {
    console.log('handler')
    fs.readFile(__dirname + '/index.html',
        function(err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

// Manage connections
io.sockets.on('connection', function(socket) {
    console.log('handle connection');

    var periodInMilliseconds = 400;
    var timeoutId = -1;

    /**
     * Handle "disconnect" events.
     */
    var handleDisconnect = function() {
        console.log('handle disconnect');

        clearTimeout(timeoutId);
    };

    /**
     * Generate a request to be sent to the client.
     */
    function generateServerRequest(seq) {
        // execute program with parameter [1:0]
        // read the JSON
        //  read the question
        console.log('generate server request');
        //submit tree JSON from 0000.json - 0302.json
        loadJSON(seq,function(response){    
            //sublmit an object
            socket.emit('server request', {
                date: new Date(),
                value: response
            });
        });
        //timeoutId = setTimeout(generateServerRequest, periodInMilliseconds);
    }
    //read JSON function
    function loadJSON(seq, callback) {

            var tem_seq;
            if(seq<10)
                tem_seq = "000"+seq+".json";
            else if(seq<100)
                tem_seq = "00"+seq+".json";
            else
                tem_seq = "0"+seq+".json";

            fs.readFile('bodypart_full/body_part_json_trial_10/'+tem_seq, 'utf8', function (err, data) {
              if (err) throw err;
              obj.tree = JSON.parse(data);//read the jason tree
              obj.question = questionLists[seq].split(",");//read the question
              callback(obj);
            });
     }
    socket.on('disconnect', handleDisconnect);
    socket.on("answer_button_clicked", function(data){
        console.log(data);
        io.sockets.emit("update_after_answer",{value: data+"GG"});
        generateServerRequest(seq); 
        if(seq<301)seq++;
    });
    socket.on("restart", function(data){
        generateServerRequest(0); 
        seq=0;
    });
    //init
    generateServerRequest(0); 
    seq++;
    // setInterval(function(){
    //     generateServerRequest(seq); 
    //     if(seq<301)seq++;},
    //      periodInMilliseconds);
    
});


function readTextFile(file, callback)
{
  fs.readFile(file, function(error, data) {
        callback(data.toString());
  });         
  
}
