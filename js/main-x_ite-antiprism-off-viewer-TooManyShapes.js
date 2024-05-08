function parseColor(colString) {
    return colString.split(",").map(x => parseFloat(x, 10) / 255.0);
}

function parseHexColor(colorHexString) {
    return [
        parseInt(Number("0x" + colorHexString.slice(0, 2)), 10) / 255.0,
        parseInt(Number("0x" + colorHexString.slice(2, 4)), 10) / 255.0,
        parseInt(Number("0x" + colorHexString.slice(4, 6)), 10) / 255.0
    ];
}

function parseArray(arrString) {
    return arrString.split(",").map(x => parseFloat(x, 10) / 255.0);
}

function modifySceneTooManyShapes(scene, parameters) {
    if (parameters.vertexRadius !== null) {
        const defaultRadius = OFFParser.prototype.defaultVertexRadius();
        const geom = scene.getNamedNode("VertexGeometry");
        geom.radius = geom.radius * parseFloat(parameters.vertexRadius, 10) / defaultRadius;
    }
    if (parameters.edgeRadius !== null) {
        const defaultRadius = OFFParser.prototype.defaultEdgeRadius();
        const geom = scene.getNamedNode("EdgeGeometry");
        geom.radius = geom.radius * parseFloat(parameters.edgeRadius, 10) / defaultRadius;
    }

    if (parameters.faceColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.faceColor));
        const geom = scene.getNamedNode("FacesTransform").children[0].geometry;
        geom.color.color = new X3D.MFColor(color);
    }
    if (parameters.edgeColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.edgeColor));
        for (let el of scene.getNamedNode("EdgesTransform").children) {
            el.children[0].appearance.material.diffuseColor = color;
        }
    }
    if (parameters.vertexColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.vertexColor));
        for (let el of scene.getNamedNode("VerticesTransform").children) {
            el.children[0].appearance.material.diffuseColor = color;
        }
    }

    if (parameters.facesActive == "false") {
        scene.getNamedNode("FacesTransform").children[0].visible = false;
    }
    if (parameters.edgesActive == "false") {
        for (let el of scene.getNamedNode("EdgesTransform").children) {
            el.children[0].visible = false;
        }
    }
    if (parameters.verticesActive == "false") {
        for (let el of scene.getNamedNode("VerticesTransform").children) {
            el.children[0].visible = false;
        }
    }

}

function modifyOff(event) {
    const xBrowser = X3D.getBrowser(event.target);
    // console.log("browser " + xBrowser.toXMLString());
    xBrowser.setBrowserOption("StraightenHorizon", false);
    const scene = xBrowser.currentScene;

    const parameters = {
        vertexRadius: event.target.getAttribute("vertexRadius"),
        edgeRadius: event.target.getAttribute("edgeRadius"),
        backgroundColor: event.target.getAttribute("backgroundColor"),
        rotationSpeed: event.target.getAttribute("rotationSpeed"),
        rotationAxis: event.target.getAttribute("rotationAxis"),
        vertexColor: event.target.getAttribute("vertexColor"),
        edgeColor: event.target.getAttribute("edgeColor"),
        faceColor: event.target.getAttribute("faceColor"),
        verticesActive: event.target.getAttribute("verticesActive"),
        edgesActive: event.target.getAttribute("edgesActive"),
        facesActive: event.target.getAttribute("facesActive"),
    }
    modifySceneTooManyShapes(scene, parameters);

    // Background
    if (parameters.backgroundColor !== null) {
        const background = scene.getNamedNode("Background");
        background.skyColor = new X3D.MFColor(new X3D.SFColor(...parseHexColor(parameters.backgroundColor)));
    }

    // Animation
    const transformNode = scene.getNamedNode("OffTransform");
    const rotationSpeed = parameters.rotationSpeed !== null ? parseFloat(parameters.rotationSpeed, 10) : 0;
    const rotationAxis = parameters.rotationAxis !== null ? parseArray(parameters.rotationAxis) : [0, 1, 0];

    const timeSensorNode = scene.createNode("TimeSensor");
    timeSensorNode.cycleInterval = 2 * Math.PI / rotationSpeed;
    timeSensorNode.loop = true;

    const interpolatorNode = scene.createNode("OrientationInterpolator");
    for (let i = 0; i < 5; ++i) {
        interpolatorNode.key[i] = i / 4;
        interpolatorNode.keyValue[i] = new X3D.SFRotation(rotationAxis[0], rotationAxis[1], rotationAxis[2], Math.PI * i / 2);
    }
    scene.rootNodes.push(timeSensorNode, interpolatorNode);

    // Routes
    scene.addRoute(timeSensorNode, "fraction_changed", interpolatorNode, "set_fraction");
    scene.addRoute(interpolatorNode, "value_changed", transformNode, "set_rotation");
    // console.log("browser " + scene.toXMLString());

}

