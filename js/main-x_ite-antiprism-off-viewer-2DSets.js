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

function modifyScene2DSets(scene, parameters) {
    // if (parameters.vertexRadius !== null) {
    //     scene.getNamedNode("VertexShape").geometry.radius = parseFloat(parameters.vertexRadius, 10);
    // }
    // if (parameters.edgeRadius !== null) {
    //     scene.getNamedNode("EdgeShape").geometry.radius = parseFloat(parameters.edgeRadius, 10);
    // }

    if (parameters.faceColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.faceColor));
        const geom = scene.getNamedNode("FacesTransform").children[0].geometry;
        geom.color.color = new X3D.MFColor(color);
    }
    if (parameters.edgeColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.edgeColor));
        const colorNode = scene.createNode("Color");
        colorNode.color = new X3D.MFColor(color)
        scene.getNamedNode("EdgeShape").geometry.color = colorNode;
    }
    if (parameters.vertexColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.vertexColor));
        const colorNode = scene.createNode("Color");
        colorNode.color = new X3D.MFColor(color)
        scene.getNamedNode("VertexShape").geometry.color = colorNode;
    }

    if (parameters.facesActive == "false") {
        scene.getNamedNode("FacesTransform").children[0].visible = false;
    }
    if (parameters.edgesActive == "false") {
        scene.getNamedNode("EdgeShape").visible = false;
    }
    if (parameters.verticesActive == "false") {
        scene.getNamedNode("VertexShape").visible = false;
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
    modifyScene2DSets(scene, parameters);

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

