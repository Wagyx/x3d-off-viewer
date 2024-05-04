// init();

////////////////////////////////////////////////////////////////////////////////////
function init() {
    const xBrowser = X3D.getBrowser();
    // console.log(xBrowser.supportedComponents);
    const scene = xBrowser.currentScene;
    // console.log(xBrowser.keys);
    // for (let [key, value] of Object.entries(xBrowser)) {
    //     console.log(key, value);
    // }
    // scene.components.push("X_ITE");

    const comp = xBrowser.getComponent ("X_ITE", 1);
    scene.addComponent(comp);

    // scene.createNode("ComponentInfoArray");
    for (let [key, value] of Object.entries(scene)) {
        console.log(key, value);
    }
    // console.log();

    const background = scene.createNode("Background");
    background.skyColor = new X3D.MFColor(new X3D.SFColor(0, 0.5, 1.0));
    background.set_bind = true; // Will do the trick.
    scene.addNamedNode("background", background);
    scene.rootNodes.push(background); // rootNodes is a MFNode field.

    // const transformLight = scene.createNode("Transform");
    // transformLight.translation = new X3D.SFVec3f(0,0,0);
    const envLight = scene.createNode("PointLight");
    envLight.color = new X3D.SFColor(0,1,0);
    envLight.intensity = 0.00001;
    envLight.ambientIntensity = 1;
    envLight.attenuation = new X3D.SFVec3f(0,0,0);
    // envLight.global = true;
    // transformLight.children.push(envLight)
    scene.rootNodes.push(envLight);
    
    // const inline = scene.createNode("Inline");
    // inline.url = ["/dump/simpleInst.x3d",];
    // scene.rootNodes.push(inline);

    // const res = scene.getNamedNode("_2");
    // console.log(res);

    // <NavigationInfo headlight='false'/>

    const shape = scene.createNode("Shape");
    const geom = scene.createNode("Box");
    shape.geometry = geom;
    
    // const protoDeclare = scene.createNode("ProtoDeclare");
    // const protoBody = scene.createNode("ProtoBody");
    
    const appearance = scene.createNode("Appearance");
    const material = scene.createNode("Material");
    material.diffuseColor = new X3D.SFColor(0.5, 0.5, 0.5);
    material.ambientIntensity = 0.4;
    appearance.material = material;
    shape.appearance = appearance;
    scene.rootNodes.push(shape); // rootNodes is a MFNode field.

    console.log("browser " + xBrowser.toXMLString());
    
    const instShape = scene.createNode("InstancedShape");
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

    // const envLight = scene.createNode("EnvironmentLight");
    // envLight.color = new X3D.SFColor(0,1,1);
    // envLight.intensity = 100;
    // envLight.ambientIntensity = 100;
    // envLight.global = true;
    // scene.rootNodes.splice(0,0,envLight);

    // const vertexRadius = event.target.getAttribute("vertexRadius");
    // if (vertexRadius !== null) {
    //     const geom = scene.getNamedNode("VertexGeometry");
    //     geom.radius = parseFloat(vertexRadius, 10);
    // }

    // const edgeRadius = event.target.getAttribute("edgeRadius");
    // if (edgeRadius !== null) {
    //     const geom = scene.getNamedNode("EdgeGeometry");
    //     geom.radius = parseFloat(edgeRadius, 10);
    // }

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
    console.log("browser " + scene.toXMLString());

}

