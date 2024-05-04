# x3d-off-viewer
A web application using X3D to display OFF files within a web page.

This viewer is meant to parse standard OFF files but also those produced by [Antiprism](http://www.antiprism.com).

It is using [X3D](www.x3dom.org) and the [X_ite browser](https://create3000.github.io/x_ite) to render the 3D scene.

Thanks to [Scott Vorthmann](https://github.com/vorth) for telling me about the X3D project.

## How to run

Start a local web server, more details [here](https://create3000.github.io/x_ite/setup-a-localhost-server/)
- using vscode live server extension
- using a command line terminal and Python, cd to the project folder then run python -m http.server

## How to use it within your web page

### New way : using an integrated Parser for the OFF file
Take a look at the x_ite-off-viewer.html:

First, link AntiprismOFFParser.js and x_ite.min.js.
Then, use the "x3d-canvas" tag with the off file as the "src" attribute.

You can also set some other attributes:
- vertexRadius="0.03"
- edgeRadius="0.02"
- backgroundColor="204,204,204" default is 80% grey
- rotationSpeed="0" default is no rotation
- rotationAxis="0,1,0" default is the vertical direction

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