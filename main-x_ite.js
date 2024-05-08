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

    const comp = xBrowser.getComponent("X_ITE", 1);
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
    envLight.color = new X3D.SFColor(0, 1, 0);
    envLight.intensity = 0.00001;
    envLight.ambientIntensity = 1;
    envLight.attenuation = new X3D.SFVec3f(0, 0, 0);
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
        const geom = scene.getNamedNode("VertexGeometry");
        geom.radius = parseFloat(parameters.vertexRadius, 10);
    }
    if (parameters.edgeRadius !== null) {
        const geom = scene.getNamedNode("EdgeGeometry");
        geom.radius = parseFloat(parameters.edgeRadius, 10);
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

function modifySceneInstancedShape(scene, parameters) {
    if (parameters.vertexRadius !== null) {
        scene.getNamedNode("VertexShape").geometry.radius = parseFloat(parameters.vertexRadius, 10);
    }
    if (parameters.edgeRadius !== null) {
        scene.getNamedNode("EdgeShape").geometry.radius = parseFloat(parameters.edgeRadius, 10);
    }

    if (parameters.faceColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.faceColor));
        const geom = scene.getNamedNode("FacesTransform").children[0].geometry;
        geom.color.color = new X3D.MFColor(color);
    }
    if (parameters.edgeColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.edgeColor));
        scene.getNamedNode("EdgeShape").appearance.material.diffuseColor = color;
    }
    if (parameters.vertexColor !== null) {
        const color = new X3D.SFColor(...parseHexColor(parameters.vertexColor));
        scene.getNamedNode("VertexShape").appearance.material.diffuseColor = color;
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

function modifySceneTriangleSet(scene, parameters) {
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


    // console.log(event.target);
    // console.log("browser " + xBrowser.toXMLString());

    // *IMPORTANT* : choose this in accordance with the Parser
    modifySceneTooManyShapes(scene, parameters);
    // modifySceneInstancedShape(scene, parameters);
    // modifySceneTriangleSet(scene, parameters);
    // modifyScene2DSets(scene, parameters);



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
    console.log("browser " + scene.toXMLString());

}

