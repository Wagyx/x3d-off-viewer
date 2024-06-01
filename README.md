# x3d-off-viewer
A web application using X3D to display OFF files within a web page.
Created in the beginning of May 2024.

This viewer is meant to parse standard OFF files but also those produced by [Antiprism](http://www.antiprism.com).

It is using [X3D](www.x3dom.org) and the [X_ite browser](https://create3000.github.io/x_ite) to render the 3D scene.

Thanks to [Scott Vorthmann](https://github.com/vorth) for telling me about the X3D project.

## How to run

Start a local web server, if you don't know how more details [here](https://create3000.github.io/x_ite/setup-a-localhost-server/)
I usually either
- use VSCode live server extension
- use a command line terminal and Python, cd to the project folder then run python -m http.server


## How to use it within your web page

In this repo you will find many variations to help you include an OFF file into your webpage.
The first thing to consider is whether you want to use the X3DOM or the X_ITE library.
Then you can choose to use the vanilla version which only displays the model faces or the Antiprism version which is an extension of the OFF format and includes a description of edges and vertices, attributing colors to them. A scene using an Antiprism model have additional geometry elements to represent the vertices (spheres) and the edges (cylinders).

### With X3DOM

Take a look at the x3dom-*-off-viewer.html:

First, link x_ite.min.js, and the chosen main-x3dom-*.js (at the end of the <body>).
Then, use the "x3d" tag with the off file as the "filename" attribute.

`<x3d filename="./off/U1.off"><scene></scene></x3d>`

You can also set some other attributes (for the Antiprism version only):
- vertexRadius
- edgeRadius

### With X_ITE
For vanilla and Antiprism off file, just use the "x3d-canvas" tag with the off file as the "src" attribute to include a 3D model in your webpage as you would with a VRML or X3D file.

Example : `<x3d-canvas src="./off/U1.off"></x3d-canvas>`

For Vanilla : have a look at x_ite-vanilla-off-viewer.html

For Antiprism models, the integration into the X_ITE browser comes with different flavors mostly driven by the technique used to create the geometry for the edges and vertices.
Take a look at the various x_ite-antiprism-off-viewer-*.html files to see how to link the Parser script and use the x3d-canvas.

The pros and cons of each technique are:
- MultiInstancedShape : the overall best, if you have to pick any it is the one.
- TooManyShapes : no smart things but slow to load when the number of vertices and edges is large (>500).
- TriangleSet : uses manually crafted icospheres and cylinders, a bit ugly and slow to load for large models
- 2DSets : uses 2D points and lines, the look is too flat


If you would like to support parameters to modify the scene, don't forget to include the corresponding main-x_ite-antiprism-off-*.js file.
The parameters are set with the following attributes on the x3d-canvas:
- data-vertex-radius : default is "0.03"
- data-edge-radius : default is "0.02"
- data-background-color :  default is "#cccccc", color is in hexadecimal format
- data-rotation-speed : default is "0"
- data-rotation-axis : default is the vertical direction "0,1,0"
- data-vertex-color : default is the original color from the off file, color is in hexadecimal format, you can have an alpha value e.g. "#ffffffaa"
- data-edge-color : default is the original color from the off file, color is in hexadecimal format, you can have an alpha value e.g. "#ffffffaa"
- data-face-color : default is the original color from the off file, color is in hexadecimal format, you can have an alpha value e.g. "#ffffffaa"
- data-vertices-active : default is true, set to "false" to deactivate
- data-edges-active : default is true, set to "false" to deactivate 
- data-faces-active : default is true, set to "false" to deactivate 

Example : `<x3d-canvas src="./off/U1.off" data-vertex-radius="0.2" data-edge-radius="0.1" data-rotation-speed="1" data-rotation-axis="0,1,0" data-vertex-color="#00ff33" data-edge-color="#3300ff" data-face-color="#ff3300"  data-background-color="#aaaaaa" onload="modifyOff(event)"></x3d-canvas>`


## TODOS
- better interactions
