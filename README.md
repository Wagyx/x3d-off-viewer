# x3d-off-viewer
A web application using X3D to display OFF files within a web page.
Created in the beginning of May 2024.

This viewer is meant to parse standard OFF files but also those produced by [Antiprism](http://www.antiprism.com).

It is using [X3D](www.x3dom.org) and the [X_ite browser](https://create3000.github.io/x_ite) to render the 3D scene.

Thanks to [Scott Vorthmann](https://github.com/vorth) for telling me about the X3D project.

## How to run

Start a local web server, if you don't know how more details [here](https://create3000.github.io/x_ite/setup-a-localhost-server/)
I usually either
- use vscode live server extension
- or use a command line terminal and Python, cd to the project folder then run python -m http.server


## How to use it within your web page

### New way : using an integrated Parser for the OFF file
Take a look at the x_ite-off-viewer.html:

First, link the parser in the header. Yo can choose between several parser, each have their pros and cons:
- AntiprismOFFParserTooManyShapes.js : the most complete but slow to load when the number of vertices and edges is large (>500).
- AntiprismOFFParserInstancedShape.js : uses instances but there are no individual colors for vertices and edges
- AntiprismOFFParserTriangleSet.js : uses manually crafted icospheres and cylinders
- AntiprismOFFParser2DSets.js : uses 2D points and lines

Then, use the "x3d-canvas" tag with the off file as the "src" attribute.
Example : `<x3d-canvas src="./off/U1.off"></x3d-canvas>`

If you would like to support parameters to modify the scene, this is achieved with the main-x_ite.js script, please link it in the header.
Then you have to choose the correct function to handle parameters, search for the word *IMPORTANT* and then comment/uncomment the modifyScene that you need to use below it. I know this is a bit cumbersome to do for now.

The parameters are set with the following attributes of the x3d-canvas:
- vertexRadius : default is "0.03"
- edgeRadius : default is "0.02"
- backgroundColor :  default is "cccccc", color is in hexadecimal format
- rotationSpeed : default is "0"
- rotationAxis : default is the vertical direction "0,1,0"
- vertexColor : default if the original color from the off file, color is in hexadecimal format
- edgeColor : default if the original color from the off file, color is in hexadecimal format
- faceColor : default if the original color from the off file, color is in hexadecimal format
- verticesActive : default is true, set to "false" to deactivate
- edgesActive : default is true, set to "false" to deactivate 
- facesActive : default is true, set to "false" to deactivate 

Example : `<x3d-canvas src="./off/U1.off" vertexRadius="0.2" edgeRadius="0.1" rotationSpeed="1" rotationAxis="0,1,0" vertexColor="00ff33" edgeColor="3300ff" faceColor="ff3300" verticesActive="true" edgesActive="false" facesActive="false" onload="modifyOff(event)"></x3d-canvas>`

### Old way : building DOM elements
Take a look at the x3d-off-viewer.html:

First, link x_ite.min.js, main.js (at the end of the <body>).
Then, use the "x3d-canvas" tag with the off file as the "filename" attribute.
You can also set some other attributes:
- vertexRadius
- edgeRadius

## TODOS
- fix the issue with transparency and double sided faces
- an EnvironmentLight
- better interactions
- optimizing (instances)