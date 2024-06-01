function parseColor(colString) {
    return colString.split(",").map(x => parseFloat(x, 10) / 255.0);
}

function parseHexColor(pString) {
    if (!pString || pString[0] !== "#") {
        return [0.0,0.0,0.0,1.0];
    }
    const res = [
        parseInt(pString.slice(1, 3), 16) / 255.0,
        parseInt(pString.slice(3, 5), 16) / 255.0,
        parseInt(pString.slice(5, 7), 16) / 255.0,
        (pString.length > 7) ? parseInt(pString.slice(7, 9), 16) / 255.0 : 1.0
    ];
    return res;
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
        const color = parseHexColor(parameters.faceColor);
        const geom = scene.getNamedNode("FacesTransform").children[0].geometry;
        if (color[3] < 1.0){
            const sfcolor = new X3D.SFColorRGBA(...color);
            geom.color = scene.createNode("ColorRGBA");
            geom.color.color = new X3D.MFColorRGBA(sfcolor);
        }
        else{
            const sfcolor = new X3D.SFColor(...color.slice(0,3));
            geom.color = scene.createNode("Color");
            geom.color.color = new X3D.MFColor(sfcolor);
        }
    }
    if (parameters.edgeColor !== null) {
        const color = parseHexColor(parameters.edgeColor);
        const sfcolor = new X3D.SFColor(...color.slice(0, 3));
        for (let el of scene.getNamedNode("EdgesTransform").children) {
            el.children[0].appearance.material.diffuseColor = sfcolor;
            el.children[0].appearance.material.transparency = 1-color[3];
        }
    }
    if (parameters.vertexColor !== null) {
        const color = parseHexColor(parameters.vertexColor);
        const sfcolor = new X3D.SFColor(...color.slice(0, 3));
        for (let el of scene.getNamedNode("VerticesTransform").children) {
            el.children[0].appearance.material.diffuseColor = sfcolor;
            el.children[0].appearance.material.transparency = 1-color[3];
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
        vertexRadius: event.target.getAttribute("data-vertex-radius"),
        edgeRadius: event.target.getAttribute("data-edge-radius"),
        backgroundColor: event.target.getAttribute("data-background-color"),
        rotationSpeed: event.target.getAttribute("data-rotation-speed"),
        rotationAxis: event.target.getAttribute("data-rotation-axis"),
        vertexColor: event.target.getAttribute("data-vertex-color"),
        edgeColor: event.target.getAttribute("data-edge-color"),
        faceColor: event.target.getAttribute("data-face-color"),
        verticesActive: event.target.getAttribute("data-vertices-active"),
        edgesActive: event.target.getAttribute("data-edges-active"),
        facesActive: event.target.getAttribute("data-faces-active"),
    }
    modifySceneTooManyShapes(scene, parameters);

    // Background
    if (parameters.backgroundColor !== null) {
        const background = scene.getNamedNode("Background");
        background.skyColor = new X3D.MFColor(new X3D.SFColor(...parseHexColor(parameters.backgroundColor).slice(0,3)));
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

