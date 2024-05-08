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
