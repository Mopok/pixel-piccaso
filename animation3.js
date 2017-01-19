var canvas = document.createElement('canvas');
var canvasWidth = canvas.width = 501;
var canvasHeight = canvas.height = 500;
var ctx = canvas.getContext('2d');
var id = 100000;
var nodes = {};

var ToolEnum = {
    NODE: "node",
    DRAW: "draw",
    LINK: "link",
    FLOW: "flow",
};

var tool = ToolEnum.DRAW;
var c1 = null;//For linker
var mouseOver = false;
var mouseDown = 0;

//Canvas drawing status stuff
var draw = false;
var color = "random";
var spread = canvasWidth;
var counterMax = 1;
var selected;//selected in edit list

document.body.style.background = 'black';
canvas.style.border = '2px solid white';
document.body.appendChild(canvas);


function pixelColors() {
    //for mouse drawing
    if (mouseOver && (tool == "draw")) {
        t = new Thing(cursorX, cursorY, color, spread, counterMax, null, {max: 3000, min: 2000});
        t.go();
    }
    //for nodes
    for(var i = 0; i < Object.keys(nodes).length; i++) {
        var n = nodes[Object.keys(nodes)[i]];
        if(n.linked != "receiver"){
            t = new Thing(n.x, n.y, n.color, n.spread, n.counterMax, n.linked, n.animationSpeed);
            t.flowTrack = n.flowTrack;
            t.go();
        }
    }

   
}

function clear() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    return true;
}

// add a timer function, it should 
// return truthy if it wants to keep running...
jQuery.fx.timer( clear );




//Node Constructor
//@param x (int) , y (int), color (string) , name(string), spread(int), counterMax(int), eventually density
function Node(x, y, color, name, spread, counterMax, aniSpeed) {
    this.id = id + 1;
    id++;
    this.x = x;
    this.y = y;
    this.name  = name;
    this.spread = spread;
    this.animationSpeed = aniSpeed;
    this.counterMax = counterMax;
    this.color = color;
    this.linked = null;
    this.receiving = [];
    this.flowTrack = [];
} 



// Thing Constructor
//@param x (int) , y (int), color (string) , spread(int), counterMax(int) linked(null or obj)
function Thing(x, y, color, spread, counterMax, linked, aniSpeed) {
    this.id = id + 1;
    id ++;
    this.x = x; 
    this.y = y;
    this.width = 6;
    this.height = 6;
    this.counter = 0;
    this.counterMax = counterMax;
    this.spread = spread;
    this.animationSpeed = aniSpeed;
    this.linked = linked;
    this.flowTrack = [];
    if(color == "random") {
        this.color = 'rgb('+[0|Math.random()*255,0|Math.random()*255,0|Math.random()*255]+')';
    } else {
        this.color = color;
    }
}

// Animate to a new position and size
Thing.prototype.go = function() {
    var width = Math.random() * 20;
    var spread;
    var animationSpeed = this.animationSpeed;
    // use jQuery.Animation() for the promisy goodness
    if(this.flowTrack.length > 0) {
        spread = flowSpread(this.x, this.y, this.flowTrack[this.counter * 2], this.flowTrack[this.counter * 2 + 1], this.spread);
    } else if(this.linked == null) {
        spread = dotSpread(this.x, this.y, this.spread);
    } else {
        spread = linkSpread(this.linked); 
    }
    
    

    var anim = jQuery.Animation( this, {
        x: spread.x,
        y: spread.y,
        width: width,
        height: width
    }, { 
        duration: Math.random() * (animationSpeed.max - animationSpeed.min) + animationSpeed.min //100. this will be custom soon
    });
    if(this.counter >= this.counterMax) {
        return;
    }
    this.counter++;
  
    // call draw after we finish each frame of the animations
    // call go after we finish each animation
    anim.progress( this.draw )
        .done( this.go );
};

// draw this thing
Thing.prototype.draw = function() {
  ctx.fillStyle = this.color;
  ctx.fillRect(this.x, this.y, this.width, this.height);
};

//Gets coords for flows
function flowSpread(x, y, x2, y2, spread) {
    var deltaX = Math.abs(x - x2);
    var deltaY = Math.abs(y - y2);
    var spread = spread * Math.PI/180;
    var maxX = x2 + (deltaY * Math.tan(spread));
    var minX = x2 - (deltaY * Math.tan(spread));
    var maxY = y2 + (deltaX * Math.tan(spread));
    var minY = y2 - (deltaX * Math.tan(spread));
    var finalX = Math.random() * (maxX - minX) + minX;
    var finalY = Math.random() * (maxY - minY) + minY;
    var spreadCoords = {x: finalX, y: finalY};

    return spreadCoords;




}

//Gets coords for link spread
function linkSpread(linked) {
    var spreadCoords;
    var finalX = Math.random() * (linked.maxX - linked.minX) + linked.minX;
    var finalY = Math.random() * (linked.maxY - linked.minY) + linked.minY;

    spreadCoords = {x: finalX, y: finalY};
    return spreadCoords;
}

//Calculates things spread from a coord.
function dotSpread(x, y, spread) {
    var spreadX;
    var spreadY;
    var spreadCoords;
    var sign  = (Math.floor(Math.random() * 2) == 0);
    if(sign) {
        spreadX = x + Math.random() * spread;
    } else {
        spreadX = x - Math.random() * spread;
    }
    sign = (Math.floor(Math.random() * 2) == 0);
    if(sign) {
        spreadY = y + Math.random() * spread;
    } else {
        spreadY = y - Math.random() * spread;
    }
    spreadCoords = {x: spreadX, y: spreadY};
    return spreadCoords; 

}

$(document).ready(function() {

    var toolHeader  = document.createElement('h1');
    toolHeader.innerHTML = "TOOLS";
    toolHeader.style.color = "white";
    toolHeader.style.marginTop = "5px";
    toolHeader.style.marginBottom = "5px";
    document.body.appendChild(toolHeader);

    var nodeButton = document.createElement('button');
    nodeButton.innerHTML = "Node Tool";
    document.body.appendChild(nodeButton);

    var drawButton = document.createElement('button');
    drawButton.innerHTML = "Draw Tool";
    document.body.appendChild(drawButton);

    var linkButton = document.createElement('button');
    linkButton.innerHTML = "Link Tool";
    document.body.appendChild(linkButton);

    var flowButton = document.createElement('button');
    flowButton.innerHTML = "Flow Tool";
    document.body.appendChild(flowButton);

    var lineBreak = document.createElement('br');
    document.body.appendChild(lineBreak);

    var spreadText = document.createElement('span');
    spreadText.style.color = "white";
    spreadText.innerHTML = "  Spread: " + spread + "  ";
    spreadText.id = "spreadText";
    document.body.appendChild(spreadText);

    var colorInput = document.createElement('input');
    colorInput.type = "color";
    colorInput.id = "colorPicker";
    document.body.appendChild(colorInput);
    document.querySelector('#colorPicker').value = '#ffffff';

    var colortext = document.createElement('span');
    colortext.style.color = "white";
    colortext.id = "color-text";
    colortext.innerHTML = "  Down arrow for random colors (On)"
    document.body.appendChild(colortext);

    var toolInstructions = document.createElement('p');
    toolInstructions.style.color = "white";
    toolInstructions.innerHTML = "Move mouse over canvas to draw. Left and right arrow kets control spread.";
    toolInstructions.style.marginBottom = "5px";
    toolInstructions.style.marginTop = "5px";
    document.body.appendChild(toolInstructions);

    var nodeListContainer = document.createElement('div');
    nodeListContainer.id = "nodeListContainer";
    nodeListContainer.style.width = "200px";
    nodeListContainer.style.background = "rgb(102, 102, 153)"
    nodeListContainer.style.padding = "5px";
    nodeListContainer.style.color = "white";
    nodeListContainer.style.position = "absolute";
    nodeListContainer.style.overflowY = "scroll";
    document.body.appendChild(nodeListContainer);

    var nodeListTitle = document.createElement('h3');
    nodeListTitle.innerHTML = "List of Nodes";
    nodeListTitle.style.color = "white";
    nodeListTitle.style.marginTop = "0px";
    nodeListTitle.style.marginBottom = "5px";
    nodeListContainer.appendChild(nodeListTitle);

    var nodeList = document.createElement('ul');
    nodeList.id = "node-list";
    nodeList.style.paddingLeft = "0px"
    nodeListContainer.appendChild(nodeList);

    nodeEdit();


    $('#colorPicker').on('input', function() { 
        color = $(this).val();
        $("#color-text").html("  Down arrow for random colors (Off)");
    });

    canvas.onmouseenter = function() {
        mouseOver = true;
    };

    canvas.onmouseleave = function() {
        mouseOver = false;
        if(mouseDown) {
            --mouseDown;
        }
    };

    canvas.onmousemove = function (e) {
        cursorX = e.pageX;
        cursorY = e.pageY;
    };

    canvas.onclick = function (e) {
        if(tool == "node") {
            nodeMenu(e);
        }
        if(tool == "link") {
            linkTool(e);
        }
    }

    canvas.onmousedown = function (e) {
        ++mouseDown;
        canvas.style.cursor = "crosshair";
        if(tool == "flow") {
            flowTool(e);
        }
        
    }

    canvas.onmouseup = function (e) {
        --mouseDown;
        canvas.style.cursor = "auto";
    }

    drawButton.onclick = function (e) {
        tool = "draw";
        toolInstructions.innerHTML = "Move mouse over canvas to draw. Left and right arrow kets control spread.";

    }

    nodeButton.onclick = function (e) {
        tool = "node";
        toolInstructions.innerHTML = "Click on canvas to make a node.";
    }

    linkButton.onclick = function (e) {
        tool = "link";
        toolInstructions.innerHTML = "Click once on canvas, then another time somewhere else on canvas."
    }
    flowButton.onclick = function (e) {
        tool = "flow";
        toolInstructions.innerHTML = "Hold mouse down on canvas and drag to make a flow."
    }
    //Node List listener
    $('#nodeListContainer').on('click', 'li', function () {
        

        if(selected != null) {
            selected.style.background = "transparent";
        }
        this.style.background = "#0099ff";
        selected = this;

        removeNodeEditListeners();
        nodeEditPop(nodes[this.classList[1]]);
        addNodeEditListeners();
    });

    

});

function addNodeEditListeners() {
    var n = nodes[selected.classList[1]];

    $("#editNameInput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            n.name = $("#editNameInput").val();
            nodeList();
        }
    });
    $("#editSpreadinput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            n.spread = parseInt($("#editSpreadinput").val());
            
            if(n.linked != null && n.linked != "receiver") {
                n.linked = makeLink(n, nodes[n.linked.linkedTo]);
            }
            nodeList();
        }
    });
    $("#editCounterMaxInput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            n.counterMax = parseInt($("#editCounterMaxInput").val());
            nodeList();
        }
    });

    $("#editColorPicker").on('input', function(e) {
        n.color = $("#editColorPicker")[0].value;
        nodeList();
    });
    
    $("#xposInput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            n.x = parseInt($("#xposInput").val());
            if(n.linked != null && n.linked != "receiver") {
                n.linked = makeLink(n, nodes[n.linked.linkedTo]);
                remakeReceivingLinks(n, n.receiving);
            } else if (n.receiving.length > 0) {
                remakeReceivingLinks(n, n.receiving);
            }
            
            nodeList();
        }
    });
    $("#yposInput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            n.y = parseInt($("#yposInput").val());
            if(n.linked != null && n.linked != "receiver") {
                n.linked = makeLink(n, nodes[n.linked.linkedTo]);
                remakeReceivingLinks(n, n.receiving);
            } else if (n.receiving.length > 0) {
                remakeReceivingLinks(n, n.receiving);
            }
            
            nodeList();
        }
    });
    $("#linkedInput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            if(n.linked != null && n.linked != "receiver") {
                removeReceiving(n.id, n.linked.linkedTo);
            }
            if(nodes[$("#linkedInput").val()] != null && $("#linkedInput").val() != "receiver") {
                n.linked = makeLink(n, nodes[$("#linkedInput").val()]);
                nodes[$("#linkedInput").val()].receiving.push(n.id);
            } else if ($("#linkedInput").val() == "receiver") {
                n.linked = "receiver";
            } else {
                n.linked = null;
            }
        }
    });
    $("#minAniSpeedInput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            n.animationSpeed.min = parseInt($("#minAniSpeedInput").val());
            nodeList();
        }
    });
    $("#maxAniSpeedInput").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            n.animationSpeed.max = parseInt($("#maxAniSpeedInput").val());
            nodeList();
        }
    });
    $("#editNodeDelete").on('click', function(e) {
        if(n.linked != "receiver" && n.linked != null) {
            removeReceiving(n.id, n.linked.linkedTo);
        }
        removeLinkedTo(n.receiving);
        delete nodes[key(n)];
        nodeList();
    });
}
//Redo Links of receivers to me
//@param n: this node changing and receving 
//       receiving: array of nodes who are linked this node
function remakeReceivingLinks(n, receiving) {
    for(var i = 0; i < receiving.length; i++) {
        nodes[receiving[i]].linked = makeLink(nodes[receiving[i]], n);
    }
}
//Tell who Im linkedTo to remove me from receiving
//Me being the node changing linkedTo or being deleted
//@param id: own id, id2: id of receiving, who is removing id
function removeReceiving(id, id2) {
    var n = nodes[id2];
    var index = n.receiving.indexOf(id);
    if(index > -1) {
        n.receiving.splice(index, 1);
    } 
}
//Tell receivers to put linkedTo to null
//@param receiving: array of nodes who are linked this node
function removeLinkedTo(receiving) {
    for(var i = 0; i < receiving.length; i++) {
        nodes[receiving[i]].linked = null;
    }
}

function removeNodeEditListeners() {
    //Clear all children listeners, causes memory leaks
    // var oldEdit = $("#node-edit")[0];
    // var newEdit = oldEdit.cloneNode(true);
    // oldEdit.parentNode.replaceChild(newEdit, oldEdit);
    $("#editNameInput").off('keypress');
    $("#editSpreadinput").off('keypress');
    $("#editCounterMaxInput").off('keypress');
    $("#xposInput").off('keypress');
    $("#yposInput").off('keypress');
    $("#editColorPicker").off('input');
    $("#linkedInput").off('keypress');
    $("#minAniSpeedInput").off('keypress');
    $("#maxAniSpeedInput").off('keypress');
    $("#editNodeDelete").off('click');

}

//Node edit menu
function nodeEdit() {
    var nodeEdit = document.createElement('div');
    nodeEdit.id = "node-edit";
    nodeEdit.style.marginLeft = "210px"
    nodeEdit.style.width = "200px";
    nodeEdit.style.padding = "5px";
    nodeEdit.style.background = "rgb(102, 102, 153)";
    document.body.appendChild(nodeEdit);

    var nodeEditTitle = document.createElement('h3');
    nodeEditTitle.innerHTML = "Node Editor";
    nodeEditTitle.style.color = "white";
    nodeEditTitle.style.marginTop = "0px";
    nodeEditTitle.style.marginBottom = "5px";
    nodeEdit.appendChild(nodeEditTitle);

    var name = document.createElement('label');
    name.setAttribute("for", "editNameInput");
    name.className = "label";
    name.innerHTML = "Name: ";
    nodeEdit.appendChild(name);

    var editNameInput = document.createElement('input');
    editNameInput.id = "editNameInput";
    editNameInput.type = "text";
    editNameInput.class = "nameInput";
    name.appendChild(editNameInput);

    var spread = document.createElement('label');
    spread.setAttribute("for", "editSpreadinput");
    spread.className = "label";
    spread.innerHTML = "Spread: ";
    nodeEdit.appendChild(spread);

    var editSpreadinput = document.createElement('input');
    editSpreadinput.id = "editSpreadinput";
    editSpreadinput.type = "text";
    editSpreadinput.value = "100";
    spread.appendChild(editSpreadinput);

    var counterMax = document.createElement('label');
    counterMax.setAttribute("for", "editCounterMaxInput");
    counterMax.className = "label";
    counterMax.innerHTML = "Counter Max: ";
    nodeEdit.appendChild(counterMax);

    var editCounterMaxInput = document.createElement('input');
    editCounterMaxInput.id = "editCounterMaxInput";
    editCounterMaxInput.type = "text";
    editCounterMaxInput.style.width = "30%";
    editCounterMaxInput.value = "1";
    counterMax.appendChild(editCounterMaxInput);

    var color = document.createElement('label');
    color.setAttribute("for", "colorInput");
    color.className = "label";
    color.innerHTML = "Color: ";
    nodeEdit.appendChild(color);

    var editColorPicker = document.createElement('input');
    editColorPicker.type = "color";
    editColorPicker.id = "editColorPicker";
    color.appendChild(editColorPicker);
    document.querySelector('#editColorPicker').value = '#ffffff';

    var xpos = document.createElement('label');
    xpos.setAttribute("for", "xposInput");
    xpos.innerHTML = "X: ";
    xpos.className = "label";
    nodeEdit.appendChild(xpos);

    var xposInput = document.createElement('input');
    xposInput.id = "xposInput";
    xposInput.type = "text";
    xposInput.style.width = "30%";
    xpos.appendChild(xposInput);

    var ypos = document.createElement('label');
    ypos.setAttribute("for", "yposInput");
    ypos.className = "label";
    ypos.innerHTML = "Y: ";
    nodeEdit.appendChild(ypos);

    var yposInput = document.createElement('input');
    yposInput.id = "yposInput";
    yposInput.type = "text";
    yposInput.style.width = "30%";
    ypos.appendChild(yposInput);

    var linked = document.createElement('label');
    linked.setAttribute("for", "linkedInput");
    linked.className = "label";
    linked.innerHTML = "Linked(Id): ";
    nodeEdit.appendChild(linked);

    var linkedInput = document.createElement('input');
    linkedInput.id = "linkedInput";
    linkedInput.type = "text";
    linkedInput.style.width = "50%";
    linked.appendChild(linkedInput);

    var minAniSpeed = document.createElement('label');
    minAniSpeed.setAttribute("for", "minAniSpeedInput");
    minAniSpeed.className = "label";
    minAniSpeed.innerHTML = "Min Animation Speed(ms): ";
    nodeEdit.appendChild(minAniSpeed);

    var minAniSpeedInput = document.createElement('input');
    minAniSpeedInput.id = "minAniSpeedInput";
    minAniSpeedInput.type = "text";
    minAniSpeedInput.value = "2000";
    minAniSpeedInput.style.width = "50%";
    minAniSpeed.appendChild(minAniSpeedInput);

    var maxAniSpeed = document.createElement('label');
    maxAniSpeed.setAttribute("for", "maxAniSpeedInput");
    maxAniSpeed.className = "label";
    maxAniSpeed.innerHTML = "Max Animation Speed(ms): ";
    nodeEdit.appendChild(maxAniSpeed);

    var maxAniSpeedInput = document.createElement('input');
    maxAniSpeedInput.id = "maxAniSpeedInput";
    maxAniSpeedInput.type = "text";
    maxAniSpeedInput.value = "3000";
    maxAniSpeedInput.style.width = "50%";
    maxAniSpeed.appendChild(maxAniSpeedInput);

    var deleteNode = document.createElement('button');
    deleteNode.id = "editNodeDelete";
    deleteNode.innerHTML = "Delete Node";
    nodeEdit.appendChild(deleteNode);

    $(".label").css("display", "block");
    $(".label").css("color", "white");

}

//Node editor populator
//@param node, node info used to populate editor
function nodeEditPop(node) {
    $("#editNameInput").val(node.name);
    $("#editSpreadinput").val(node.spread);
    $("#editCounterMaxInput").val(node.counterMax);
    $("#editColorPicker").val(node.color);
    $("#xposInput").val(node.x);
    $("#yposInput").val(node.y);
    $("#minAniSpeedInput").val(node.animationSpeed.min);
    $("#maxAniSpeedInput").val(node.animationSpeed.max);
    $("#linkedInput").val("");
    if(node.linked != null) {
        if(node.linked == "receiver") {
            $("#linkedInput").val("receiver");
        } else if(nodes[node.linked.linkedTo] != null) {
            $("#linkedInput").val(nodes[node.linked.linkedTo].id);
        }
    }
}

//code for nodeList
function nodeList() {
    $("#node-list").empty();
    for(var i = 0; i < Object.keys(nodes).length; i++) {
        var n = nodes[Object.keys(nodes)[i]];
        var nodeLi = document.createElement('li');
        nodeLi.className = "nodeLi";
        nodeLi.style.cursor = "pointer";
        nodeLi.style.listStyleType = "none";
        nodeLi.style.border = "2px solid";
        nodeLi.style.borderColor = n.color;
        nodeLi.style.color = n.color;
        nodeLi.className += " " + n.id.toString();
        $("#node-list")[0].appendChild(nodeLi);
        var nodeDiv = document.createElement('div');
        nodeLi.appendChild(nodeDiv);
        nodeDiv.innerHTML = "Name: " + n.name;
        nodeDiv.style.padding = "2px";

        var nodeId = document.createElement('span');
        nodeDiv.appendChild(nodeId);
        nodeId.innerHTML = "Id: " + n.id;
        nodeId.style.float = "right";
    }
}

//Code for node placement menu, and node initialization
function nodeMenu(e) {
    var nodeOverlay = document.createElement('div');
    nodeOverlay.style.position = "fixed";
    nodeOverlay.style.top = "0px";
    nodeOverlay.style.left = "0px"
    nodeOverlay.style.height = "100%";
    nodeOverlay.style.width = "100%";
    nodeOverlay.style.zIndex = "1";
    nodeOverlay.style.background = "#444444";
    nodeOverlay.style.opacity = "0.5";
    nodeOverlay.style.filter = "alpha(opacity=50)";
    document.body.appendChild(nodeOverlay);

    var error = false;
    var nodeMenu =  document.createElement('div');
    nodeMenu.id = "nodeMenu";
    nodeMenu.style.left = e.x +'px';
    nodeMenu.style.top = e.y +'px';
    nodeMenu.style.position = "absolute";
    nodeMenu.style.zIndex = 2;
    nodeMenu.style.width = "150px";
    nodeMenu.style.height = "300px";
    nodeMenu.style.background = "rgb(102, 102, 153)";
    nodeMenu.style.color = "white";
    nodeMenu.style.padding = "10px 10px 10px 10px";
    document.body.appendChild(nodeMenu);

    var name = document.createElement('label');
    name.setAttribute("for", "nameInput");
    name.innerHTML = "Name: ";
    name.style.color = "white";
    nodeMenu.appendChild(name);

    var nameInput = document.createElement('input');
    nameInput.id = "nameInput";
    nameInput.type = "text";
    nameInput.autofocus = true;
    nameInput.class = "nameInput";
    nodeMenu.appendChild(nameInput);

    var spread = document.createElement('label');
    spread.setAttribute("for", "nameInput");
    spread.innerHTML = "Spread: ";
    spread.style.color = "white";
    nodeMenu.appendChild(spread);

    var spreadInput = document.createElement('input');
    spreadInput.id = "spreadInput";
    spreadInput.type = "text";
    spreadInput.class = "nameInput";
    spreadInput.value = "100";
    nodeMenu.appendChild(spreadInput);

    var counterMax = document.createElement('label');
    counterMax.setAttribute("for", "nameInput");
    counterMax.innerHTML = "Counter Max: ";
    spread.style.color = "white";
    nodeMenu.appendChild(counterMax);

    var counterMaxInput = document.createElement('input');
    counterMaxInput.id = "counterMaxInput";
    counterMaxInput.type = "text";
    counterMaxInput.class = "nameInput";
    counterMaxInput.value = "1";
    nodeMenu.appendChild(counterMaxInput);

    var color = document.createElement('label');
    color.setAttribute("for", "colorInput");
    color.innerHTML = "Color: ";
    color.style.color = "white";
    nodeMenu.appendChild(color);

    var colorInput = document.createElement('input');
    colorInput.type = "color";
    colorInput.id = "nodeColorPicker";
    nodeMenu.appendChild(colorInput);
    document.querySelector('#nodeColorPicker').value = '#ffffff';

    var nodeMinAniSpeed = document.createElement('label');
    nodeMinAniSpeed.setAttribute("for", "nodeMinAniSpeedInput");
    nodeMinAniSpeed.className = "label";
    nodeMinAniSpeed.innerHTML = "Min Animation Speed(ms): ";
    nodeMenu.appendChild(nodeMinAniSpeed);

    var nodeMinAniSpeedInput = document.createElement('input');
    nodeMinAniSpeedInput.id = "nodeMinAniSpeedInput";
    nodeMinAniSpeedInput.type = "text";
    nodeMinAniSpeedInput.class = "nameInput";
    nodeMinAniSpeedInput.value = "2000";
    nodeMinAniSpeed.appendChild(nodeMinAniSpeedInput);

    var nodeMaxAniSpeed = document.createElement('label');
    nodeMaxAniSpeed.setAttribute("for", "nodeMaxAniSpeedInput");
    nodeMaxAniSpeed.className = "label";
    nodeMaxAniSpeed.innerHTML = "Max Animation Speed(ms): ";
    nodeMenu.appendChild(nodeMaxAniSpeed);

    var nodeMaxAniSpeedInput = document.createElement('input');
    nodeMaxAniSpeedInput.id = "nodeMaxAniSpeedInput";
    nodeMaxAniSpeedInput.type = "text";
    nodeMaxAniSpeedInput.value = "3000";
    nodeMaxAniSpeed.appendChild(nodeMaxAniSpeedInput);

    var submit = document.createElement('button');
    submit.innerHTML = "Create Node";
    nodeMenu.appendChild(submit);

    var cancel = document.createElement('button');
    cancel.innerHTML = "Cancel";
    nodeMenu.appendChild(cancel);

    $("#nameInput")[0].focus();
    $(".label").css("display", "block");
    $(".label").css("color", "white");

    $("#nodeMenu").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            submit.click();//Trigger submit button click event
        }
    });

    submit.onclick = function () {
        var nameValue = $("#"+nameInput.id)[0].value.trim();
        var spreadValue = parseInt($("#"+spreadInput.id)[0].value.trim());
        var counterMaxValue = parseInt($("#"+counterMaxInput.id)[0].value.trim());
        var minAniSpeedValue = parseInt($("#"+nodeMinAniSpeedInput.id)[0].value.trim());
        var maxAniSpeedValue = parseInt($("#"+nodeMaxAniSpeedInput.id)[0].value.trim());
        var colorValue = colorInput.value;
        

        if ((typeof nameValue)       == "string" &&
            (typeof colorValue)      == "string" &&
            (typeof spreadValue)     == "number" &&
            (typeof counterMaxValue) == "number" &&
            (typeof minAniSpeedValue) == "number" &&
            (typeof maxAniSpeedValue) == "number" &&
            nameValue                != ""       &&
            !isNaN(spreadValue)                  &&
            !isNaN(minAniSpeedValue)             &&
            !isNaN(maxAniSpeedValue)             &&
            !isNaN(counterMaxValue)) {
                var aniSpeed = {min: minAniSpeedValue, max: maxAniSpeedValue};
                n = new Node(e.x, e.y, colorValue, nameValue, spreadValue, counterMaxValue, aniSpeed);
                nodes[key(n)] = n;
                nodeList();
                $('#'+nodeMenu.id).remove();
                nodeOverlay.remove();
            } else if(!error) {
                error = true;
                nodeMenu.style.height = "400px";
                var warning  = document.createElement('p');
                warning.innerHTML = "Please fill all fields, spread and counter max are integers";
                warning.style.color = "red";
                warning.id = "warning"
                nodeMenu.appendChild(warning);
            }

        
    }

    cancel.onclick = function () {
        $('#'+nodeMenu.id).remove();
        nodeOverlay.remove();
    }
}
//Code for link menu
function linkMenu(e) {
    return new Promise(function(resolve) {
    var dfrd1 = $.Deferred();
    var returnValue;

    var linkOverlay = document.createElement('div');
    linkOverlay.style.position = "fixed";
    linkOverlay.style.top = "0px";
    linkOverlay.style.left = "0px"
    linkOverlay.style.height = "100%";
    linkOverlay.style.width = "100%";
    linkOverlay.style.zIndex = "1";
    linkOverlay.style.background = "#444444";
    linkOverlay.style.opacity = "0.5";
    linkOverlay.style.filter = "alpha(opacity=50)";
    document.body.appendChild(linkOverlay);

    var error = false;
    var linkMenu =  document.createElement('div');
    linkMenu.id = "linkMenu";
    linkMenu.style.left = e.x +'px';
    linkMenu.style.top = e.y +'px';
    linkMenu.style.position = "absolute";
    linkMenu.style.zIndex = 1;
    linkMenu.style.width = "150px";
    linkMenu.style.height = "300px";
    linkMenu.style.background = "rgb(102, 102, 153)";
    linkMenu.style.color = "white";
    linkMenu.style.padding = "10px 10px 10px 10px";
    document.body.appendChild(linkMenu);

    var name = document.createElement('label');
    name.setAttribute("for", "nameInput");
    name.innerHTML = "Name: ";
    name.style.color = "white";
    linkMenu.appendChild(name);

    var nameInput = document.createElement('input');
    nameInput.id = "nameInput";
    nameInput.type = "text";
    nameInput.autofocus = true;
    nameInput.class = "nameInput";
    linkMenu.appendChild(nameInput);

    var spread = document.createElement('label');
    spread.setAttribute("for", "nameInput");
    spread.innerHTML = "Spread: ";
    spread.style.color = "white";
    linkMenu.appendChild(spread);

    var spreadInput = document.createElement('input');
    spreadInput.id = "spreadInput";
    spreadInput.type = "text";
    spreadInput.value = "30";
    linkMenu.appendChild(spreadInput);

    var color = document.createElement('label');
    color.setAttribute("for", "colorInput");
    color.innerHTML = "Color: ";
    color.style.color = "white";
    linkMenu.appendChild(color);

    var colorInput = document.createElement('input');
    colorInput.type = "color";
    colorInput.id = "linkColorPicker";
    linkMenu.appendChild(colorInput);
    document.querySelector('#linkColorPicker').value = '#ffffff';

    var linkMinAniSpeed = document.createElement('label');
    linkMinAniSpeed.setAttribute("for", "linkMinAniSpeedInput");
    linkMinAniSpeed.className = "label";
    linkMinAniSpeed.innerHTML = "Min Animation Speed(ms): ";
    linkMenu.appendChild(linkMinAniSpeed);

    var linkMinAniSpeedInput = document.createElement('input');
    linkMinAniSpeedInput.id = "linkMinAniSpeedInput";
    linkMinAniSpeedInput.type = "text";
    linkMinAniSpeedInput.class = "nameInput";
    linkMinAniSpeedInput.value = "2000";
    linkMinAniSpeed.appendChild(linkMinAniSpeedInput);

    var linkMaxAniSpeed = document.createElement('label');
    linkMaxAniSpeed.setAttribute("for", "linkMaxAniSpeedInput");
    linkMaxAniSpeed.className = "label";
    linkMaxAniSpeed.innerHTML = "Max Animation Speed(ms): ";
    linkMenu.appendChild(linkMaxAniSpeed);

    var linkMaxAniSpeedInput = document.createElement('input');
    linkMaxAniSpeedInput.id = "linkMaxAniSpeedInput";
    linkMaxAniSpeedInput.type = "text";
    linkMaxAniSpeedInput.value = "3000";
    linkMaxAniSpeed.appendChild(linkMaxAniSpeedInput);

    var submit = document.createElement('button');
    submit.innerHTML = "Create Node";
    linkMenu.appendChild(submit);

    var cancel = document.createElement('button');
    cancel.innerHTML = "Cancel";
    linkMenu.appendChild(cancel);

    $("#nameInput")[0].focus();
    $(".label").css("display", "block");
    $(".label").css("color", "white");

    $("#linkMenu").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            submit.click();//Trigger submit button click event
        }
    });

    submit.onclick = function () {
        var nameValue = $("#"+nameInput.id)[0].value.trim();
        var spreadValue = parseInt($("#"+spreadInput.id)[0].value.trim());
        var minAniSpeedValue = parseInt($("#"+linkMinAniSpeedInput.id)[0].value.trim());
        var maxAniSpeedValue = parseInt($("#"+linkMaxAniSpeedInput.id)[0].value.trim());
        var colorValue = colorInput.value;
        

        if ((typeof nameValue)       == "string" &&
            (typeof colorValue)      == "string" &&
            (typeof spreadValue)     == "number" &&
            (typeof minAniSpeedValue) == "number" &&
            (typeof maxAniSpeedValue) == "number" &&
            nameValue                != ""       &&
            !isNaN(minAniSpeedValue)             &&
            !isNaN(maxAniSpeedValue)             &&
            !isNaN(spreadValue)) {
                var aniSpeed = {min: minAniSpeedValue, max: maxAniSpeedValue};
                returnValue = {name: nameValue, spread: spreadValue, color: colorValue, animationSpeed: aniSpeed};
                $('#'+linkMenu.id).remove();
                linkOverlay.remove();
                dfrd1.resolve();
            } else if(!error) {
                error = true;
                linkMenu.style.height = "400px";
                var warning  = document.createElement('p');
                warning.innerHTML = "Please fill all fields, spread and counter max are integers";
                warning.style.color = "red";
                warning.id = "warning"
                linkMenu.appendChild(warning);
            }

        
    }

    cancel.onclick = function () {
        $('#'+linkMenu.id).remove();
        linkOverlay.remove();
        dfrd1.resolve();
        returnValue = null;
    }
    return $.when(dfrd1).done(function(){
        
        resolve(returnValue);
        
    });
    });


}
//@param Node
//       LinkedNode
function makeLink(node, linkedNode) {
    var x = node.x;
    var y = node.y;
    var linkx = linkedNode.x;
    var linky = linkedNode.y;
    var deltaX = Math.abs(x - linkx);
    var deltaY = Math.abs(y - linky);
    var spread = node.spread * Math.PI/180;
    var maxX = linkx + (deltaY * Math.tan(spread));
    var minX = linkx - (deltaY * Math.tan(spread));
    var maxY = linky + (deltaX * Math.tan(spread));
    var minY = linky - (deltaX * Math.tan(spread));

    return {linkedTo: linkedNode.id, maxX: maxX, minX: minX, maxY: maxY, minY: minY};
}
//Handles link tool
//Uses c1 to check if first or second click
//makes pop up at c2 coords, makes 2 nodes, 
function linkTool(e) {
    var c2;
    var n1;
    var n2;
    if(c1 == null) {
        c1 = {x: e.x, y: e.y};
    } else {
        c2  = {x: e.x, y: e.y};
        linkMenu(e).then(function(result) {
            if(result != null) {
                n1 = new Node(c1.x, c1.y, result.color, result.name + "1", result.spread, 1, result.animationSpeed);
                n2 = new Node(c2.x, c2.y, result.color, result.name + "2", result.spread, 1, result.animationSpeed);
                n1.linked = makeLink(n1, n2);
                n2.linked = "receiver";
                n2.receiving.push(n1.id);
                nodes[key(n1)] = n1;
                nodes[key(n2)] = n2;
                nodeList();
            }
            c1 = null;
        });
    }
}


//Handles flowTool

function flowTool(e) {
    var flowTrack = [];
    var flowTimer;
    

    flowTimer = setInterval(function() {
        if(mouseDown) {
            flowTrack.push(cursorX, cursorY);
        } else {
            flowNode(flowTrack, e);
            clearInterval(flowTimer);
        }
        
    }, 200);
    

}

function flowMenu(e) {
    return new Promise(function(resolve) {
    var dfrd1 = $.Deferred();
    var returnValue;

    var flowOverlay = document.createElement('div');
    flowOverlay.style.position = "fixed";
    flowOverlay.style.top = "0px";
    flowOverlay.style.left = "0px"
    flowOverlay.style.height = "100%";
    flowOverlay.style.width = "100%";
    flowOverlay.style.zIndex = "1";
    flowOverlay.style.background = "#444444";
    flowOverlay.style.opacity = "0.5";
    flowOverlay.style.filter = "alpha(opacity=50)";
    document.body.appendChild(flowOverlay);

    var error = false;
    var flowMenu =  document.createElement('div');
    flowMenu.id = "flowMenu";
    flowMenu.style.left = e.x +'px';
    flowMenu.style.top = e.y +'px';
    flowMenu.style.position = "absolute";
    flowMenu.style.zIndex = 1;
    flowMenu.style.width = "150px";
    flowMenu.style.height = "300px";
    flowMenu.style.background = "rgb(102, 102, 153)";
    flowMenu.style.color = "white";
    flowMenu.style.padding = "10px 10px 10px 10px";
    document.body.appendChild(flowMenu);

    var name = document.createElement('label');
    name.setAttribute("for", "nameInput");
    name.innerHTML = "Name: ";
    name.style.color = "white";
    flowMenu.appendChild(name);

    var nameInput = document.createElement('input');
    nameInput.id = "nameInput";
    nameInput.type = "text";
    nameInput.autofocus = true;
    nameInput.class = "nameInput";
    flowMenu.appendChild(nameInput);

    var spread = document.createElement('label');
    spread.setAttribute("for", "nameInput");
    spread.innerHTML = "Spread: ";
    spread.style.color = "white";
    flowMenu.appendChild(spread);

    var spreadInput = document.createElement('input');
    spreadInput.id = "spreadInput";
    spreadInput.type = "text";
    spreadInput.value = "30";
    flowMenu.appendChild(spreadInput);

    var color = document.createElement('label');
    color.setAttribute("for", "colorInput");
    color.innerHTML = "Color: ";
    color.style.color = "white";
    flowMenu.appendChild(color);

    var colorInput = document.createElement('input');
    colorInput.type = "color";
    colorInput.id = "linkColorPicker";
    flowMenu.appendChild(colorInput);
    document.querySelector('#linkColorPicker').value = '#ffffff';

    var flowMinAniSpeed = document.createElement('label');
    flowMinAniSpeed.setAttribute("for", "flowMinAniSpeedInput");
    flowMinAniSpeed.className = "label";
    flowMinAniSpeed.innerHTML = "Min Animation Speed(ms): ";
    flowMenu.appendChild(flowMinAniSpeed);

    var flowMinAniSpeedInput = document.createElement('input');
    flowMinAniSpeedInput.id = "flowMinAniSpeedInput";
    flowMinAniSpeedInput.type = "text";
    flowMinAniSpeedInput.class = "nameInput";
    flowMinAniSpeedInput.value = "2000";
    flowMinAniSpeed.appendChild(flowMinAniSpeedInput);

    var flowMaxAniSpeed = document.createElement('label');
    flowMaxAniSpeed.setAttribute("for", "flowMaxAniSpeedInput");
    flowMaxAniSpeed.className = "label";
    flowMaxAniSpeed.innerHTML = "Max Animation Speed(ms): ";
    flowMenu.appendChild(flowMaxAniSpeed);

    var flowMaxAniSpeedInput = document.createElement('input');
    flowMaxAniSpeedInput.id = "flowMaxAniSpeedInput";
    flowMaxAniSpeedInput.type = "text";
    flowMaxAniSpeedInput.value = "3000";
    flowMaxAniSpeed.appendChild(flowMaxAniSpeedInput);

    var submit = document.createElement('button');
    submit.innerHTML = "Create Node";
    flowMenu.appendChild(submit);

    var cancel = document.createElement('button');
    cancel.innerHTML = "Cancel";
    flowMenu.appendChild(cancel);

    $("#nameInput")[0].focus();
    $(".label").css("display", "block");
    $(".label").css("color", "white");

    $("#flowMenu").keypress(function(e) {
        if(e.which == 13){//Enter key pressed
            submit.click();//Trigger submit button click event
        }
    });

    submit.onclick = function () {
        var nameValue = $("#"+nameInput.id)[0].value.trim();
        var spreadValue = parseInt($("#"+spreadInput.id)[0].value.trim());
        var minAniSpeedValue = parseInt($("#"+flowMinAniSpeedInput.id)[0].value.trim());
        var maxAniSpeedValue = parseInt($("#"+flowMaxAniSpeedInput.id)[0].value.trim());
        var colorValue = colorInput.value;
        

        if ((typeof nameValue)       == "string" &&
            (typeof colorValue)      == "string" &&
            (typeof spreadValue)     == "number" &&
            (typeof minAniSpeedValue) == "number" &&
            (typeof maxAniSpeedValue) == "number" &&
            nameValue                != ""       &&
            !isNaN(minAniSpeedValue)             &&
            !isNaN(maxAniSpeedValue)             &&
            !isNaN(spreadValue)) {
                var aniSpeed = {min: minAniSpeedValue, max: maxAniSpeedValue};
                returnValue = {name: nameValue, spread: spreadValue, color: colorValue, animationSpeed: aniSpeed};
                $('#'+flowMenu.id).remove();
                flowOverlay.remove();
                dfrd1.resolve();
            } else if(!error) {
                error = true;
                flowMenu.style.height = "400px";
                var warning  = document.createElement('p');
                warning.innerHTML = "Please fill all fields, spread and counter max are integers";
                warning.style.color = "red";
                warning.id = "warning"
                flowMenu.appendChild(warning);
            }

        
    }

    cancel.onclick = function () {
        $('#'+flowMenu.id).remove();
        flowOverlay.remove();
        dfrd1.resolve();
        returnValue = null;
    }
    return $.when(dfrd1).done(function(){
        
        resolve(returnValue);
        
    });
    });
}

function flowNode(flowTrack, e) {
    var counterMax = flowTrack.length / 2;
    flowMenu(e).then(function(result) {
        if(result != null) {
            n = new Node(flowTrack[0], flowTrack[1], result.color, result.name, result.spread, counterMax, result.animationSpeed);
            flowTrack.shift();
            flowTrack.shift();//Remove first 2 coords
            n.flowTrack = flowTrack;
            nodes[key(n)] = n;
            nodeList();
        }
    });
}



setInterval("pixelColors()", 20);

//@param n
//@func gives id of thing
var key = function(n){
  return n.id;
};

//Controls key press events
$(function() {
    $(document).keydown(function(e) {
        switch (e.which) {
            case 38: // up key
                
                break;
            case 40: //down key
                if(color == "random") {
                    color  = $("#colorPicker").val();
                    $("#color-text").html("  Down arrow for random colors (Off)");
                } else {
                    color = "random";
                    $("#color-text").html("  Down arrow for random colors (On)");
                }
                
                break;
            case 87: //w key
                color = 'white'; //white
                break;
            case 68: //d key
                
                break;
            case 37: //left arrow
                if(spread > 10){
                    spread -= 10;
                } else {
                    spread = 0;
                }
                $("#spreadText").html("  Spread: " + spread + "  ");
                break;
            case 39: //right arrow
                spread += 10;
                $("#spreadText").html("  Spread: " + spread + "  ");
                break;
        }   
    });
});









