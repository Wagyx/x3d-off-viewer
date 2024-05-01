# x3d-off-viewer
A web application using X3D to display OFF files within a web page.

This viewer is meant to parse standard OFF files but also those produced by [Antiprism](http://www.antiprism.com).

It is using [X3D technology](www.x3dom.org) and the [X_ite library](https://create3000.github.io/x_ite) to render the 3D scene.

Thanks to [Scott Vorthmann](https://github.com/vorth) for telling me about the X3D project.

## How to Use it within your web page

Take a look at the x3d-off-viewer.html:

First, link x_ite.min.js, main.js (at the end of the <body>).
Then, use the "x3d-canvas" tag with the off file as the "filename" attribute.
You can also set some other attributes:
- vertexRadius
- edgeRadius

## TODOS
- more parameters as attributes
- an EnvironmentLight
- instances for vertices and edges
- better interactions
- optimizing