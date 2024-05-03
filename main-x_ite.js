// init();

////////////////////////////////////////////////////////////////////////////////////
function init() {
    const xBrowser = X3D.getBrowser();
    const scene = xBrowser.currentScene;

    const background = scene.createNode("Background");
    background.skyColor = new X3D.MFColor(new X3D.SFColor(0, 0.5, 1.0));
    background.set_bind = true; // Will do the trick.
    scene.addNamedNode("background", background);
    scene.rootNodes.push(background); // rootNodes is a MFNode field.


    const shape = scene.createNode("Shape");
    const geom = scene.createNode("Cylinder");
    shape.geometry = geom;

    const appearance = scene.createNode("Appearance");
    const material = scene.createNode("Material");
    material.diffuseColor = X3D.Color3.White;
    appearance.material = material;
    shape.appearance = appearance;
    scene.rootNodes.push(shape); // rootNodes is a MFNode field.

    // background.skyColor[0] = new X3D.SFColor(0, 0.5, 1.0);
    // background.groundColor[0] = new X3D.SFColor(0, 0.5, 1.0);
    // scene.getRootNodes().splice(0, 0, background);
    // scene.getRootNodes().push(background);

    console.log("browser " + xBrowser.toXMLString());

}

function parseColor(colString) {
    return colString.split(",").map(x => parseFloat(x, 10) / 255.0);
}

function parseArray(arrString) {
    return arrString.split(",").map(x => parseFloat(x, 10) / 255.0);
}

function modifyOff(event) {
    const xBrowser = X3D.getBrowser(event.target);
    const scene = xBrowser.currentScene;
    // console.log(event.target);
    // console.log("browser " + xBrowser.toXMLString());

    const vertexRadius = event.target.getAttribute("vertexRadius");
    if (vertexRadius !== null) {
        const geom = scene.getNamedNode("VertexGeometry");
        geom.radius = parseFloat(vertexRadius, 10);
    }

    const edgeRadius = event.target.getAttribute("edgeRadius");
    if (edgeRadius !== null) {
        const geom = scene.getNamedNode("EdgeGeometry");
        geom.radius = parseFloat(edgeRadius, 10);
    }

    const backgroundColor = event.target.getAttribute("backgroundColor");
    if (backgroundColor !== null) {
        const background = scene.getNamedNode("Background");
        background.skyColor = new X3D.MFColor(new X3D.SFColor(...parseColor(backgroundColor)));
    }

    // Animation
    const transformNode = scene.getNamedNode("OffTransform");

    let rotationSpeed = event.target.getAttribute("rotationSpeed");
    rotationSpeed = rotationSpeed !== null ? parseFloat(rotationSpeed, 10) : 0;
    let rotationAxis = event.target.getAttribute("rotationAxis");
    rotationAxis = rotationAxis !== null ? parseArray(rotationAxis) : [0, 1, 0];

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

}

