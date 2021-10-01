
// some globals
var gl;

var delay = 100;
var direction = true;
var stripBuffer
var colorStrip
var program;
var stripVertices = [];
var colorsStrip = [];
var numSquares = 0;
var offset1, offset2, offset3 = 0;
var colorOff1, colorOff2, colorOff3 = 0;
var colorOffset=0;
var colorBuffer;

var enabledDrawing = false;
var isMouseDown = false;
var worldCords = 100
var startColors = 1;

var width = 0.0;
var height = 0.0;


var max_prims = 6000, num_triangles = 0;

window.onload = function init() {

	var show = "Yes"
	if(!enabledDrawing){
		show = "No"
	}
	document.getElementById('points').innerHTML = show

	// get the canvas handle from the document's DOM
    var canvas = document.getElementById( "gl-canvas" );
	height = canvas.height
	width = canvas.width
	// initialize webgl
    gl = WebGLUtils.setupWebGL(canvas);

	// check for errors
    if ( !gl ) { 
		alert("WebGL isn't available"); 
	}

    // set up a viewing surface to display your image
    gl.viewport(0, 0, canvas.width, canvas.height);

	// clear the display with a background color 
	// specified as R,G,B triplet in 0-1.0 range
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //  Load shaders -- all work done in init_shaders.js
    program = initShaders(gl, "vertex-shader", "fragment-shader");

	// make this the current shader program
    gl.useProgram(program);

	// Get a handle to theta  - this is a uniform variable defined 
	// by the user in the vertex shader, the second parameter should match
	// exactly the name of the shader variable
    thetaLoc = gl.getUniformLocation(program, "theta");

	colorLoc = gl.getUniformLocation(program, "vertColor");

	stripBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, (32*3000), gl.STATIC_DRAW)

	colorStrip = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorStrip)
	gl.bufferData(gl.ARRAY_BUFFER, (64*3000), gl.STATIC_DRAW)

	createTriangleStrip();

    render();
};

function calculateVertices(input, flag){
	if(flag === false){
		return input / 100
	} else {
		return input / -100
	}
}

function createTriangleStrip() {
	colorsStrip = [];
	
	stripVertices.push([calculateVertices(worldCords, true),0])
	stripVertices.push([0,calculateVertices(worldCords, false)])
	stripVertices.push([0,calculateVertices(worldCords, true)])
	stripVertices.push([calculateVertices(worldCords, false),0])

	gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, offset2, flatten(stripVertices));
	offset2 += 32
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	colorsStrip.push([1,0,0,1]);
	colorsStrip.push([0,1,0,1]);
	colorsStrip.push([0,0,1,1]);
	colorsStrip.push([1,0,1,1]);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colorStrip)
	gl.bufferSubData(gl.ARRAY_BUFFER, colorOff2, flatten(colorsStrip))
	colorOff2 += 64;
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0 , 0);
	gl.enableVertexAttribArray(vColor)
}

function translate2D(tx,ty){
	translation = mat3(
		1, 0, tx,
		0, 1, ty,
		0, 0, 1)
	return translation
}

function scale2D(sx,sy){
	scale = mat3(
		sx, 0, 0,
		0, sy, 0,
		0, 0,  1
	)
	return scale
}

function dotProd(v1, v2){

	sum = 0.0
	if(v1.length != v2.length){
		throw "dotProd: vectors are not the same dimension"
	}

	for(let i = 0; i < v1.length; i++){
		sum += v1[i] * v2[i]
	}

	return sum
}

function deviceToWorld(x, y) {
	myVec = vec3(x, y, 1)
	tMat = translate2D(-8,-8)

	x1 = dot(tMat[0], myVec)
	y1 = dot(tMat[1], myVec)

	myVec2 = vec3(x,y,1)
	sMat = scale2D(1/512, 1/512)

	x2 = dot(sMat[0], myVec2)
	y2 = dot(sMat[1], myVec2)

	myVec3 = vec3(x2, y2, 1)
	sMat2 = scale2D(200,200)

	x3 = dot(sMat2[0], myVec3)
	y3 = dot(sMat2[1], myVec3)

	myVec4 = vec3(x3, y3, 1)
	tMat2 = translate2D(-100, -100)

	x4 = dot(tMat2[0], myVec4)
	y4 = dot(tMat2[1], myVec4)

	returnVec = vec3(x4, y4, 1)

	return returnVec
}

function worldToNDC(wx, wy){
	myVec = vec3(wx, wy, 1)
	sMat = scale2D(1/100, 1/100)

	xDot = dot(sMat[0], myVec)
	yDot = dot(sMat[1], myVec)

	returnVec = vec3(xDot, yDot, 1)
	return returnVec
}

counter = 0;
function render() {
	// this is render loop

	// clear the display with the background color
    gl.clear( gl.COLOR_BUFFER_BIT );

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	for(let i = 1; i < stripVertices.length; i++){
		gl.drawArrays(gl.POINTS, 5, i*5+4)
	}
	
    setTimeout(
        function (){requestAnimFrame(render);}, delay
    );
}

function enableDrawing() {
	enabledDrawing = !enabledDrawing
	var show = "Yes"
	if(!enabledDrawing){
		show = "No"
	}
	document.getElementById('points').innerHTML = show
}

function mouseDown(event){
	isMouseDown = true
	if(enabledDrawing){
		drawPoints(event)
	}
}

function mouseUp(){
	isMouseDown = false
}

function drawPoints(event){
	x=2*event.clientX/width-1
	y=2*(height-event.clientY)/height-1
	stripVertices.push([x,y])
	gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer)
	gl.bufferSubData(gl.ARRAY_BUFFER, offset2, flatten(stripVertices))
	offset2 += 32
	colorsStrip.push([0,0,0,1])
	gl.bindBuffer(gl.ARRAY_BUFFER, colorStrip)
	gl.bufferSubData(gl.ARRAY_BUFFER, colorOff2, flatten(colorsStrip))
	colorOff2 +=64
}

function updateResults(event){
	x = event.clientX
	y = event.clientY
	world = deviceToWorld(x,height - y)
	NDC = worldToNDC(world[0], world[1])
	message = "Device Coordinates: [ " + x + ", " + y +" ]\n" +
			  "World Coordinates: [ " + world[0] + ", " + world[1] + " ]\n" +
			  "NDC Coordinates: [ " + NDC[0] + ", " + NDC[1] + " ]"
	document.getElementById('text-area').value = message
	if(isMouseDown && enabledDrawing){
		drawPoints(event)
	}
}