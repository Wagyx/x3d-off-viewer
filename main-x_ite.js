// init();

////////////////////////////////////////////////////////////////////////////////////
function init() {
    console.log("start");
    const xBrowser = X3D.getBrowser();
    // console.log("browser " + xBrowser.toXMLString());
    // console.log("browser " + xBrowser.element);
    // const scene = xBrowser.createScene();
    const scene = xBrowser.currentScene;

    // const sceneDOM      = document .querySelector ("Scene");
    // console.log(sceneDOM);
    // console.log(scene.());
    // console.log("scene " + xBrowser);
    // console.log(scene === X3D.X3DExecutionContext);

    // const background = scene.getNamedNode("Background");
    const background = scene.createNode("Background");
    background.skyColor[0] = new X3D.SFColor(0, 0.5, 1.0);
    // scene.getRootNodes().splice(0, 0, background);
    scene.getRootNodes().push(background);

    // const node = scene.createNode("Transform");
    // scene.addRootNode("Transform",node)
    console.log("browser " + xBrowser.toXMLString());


    // const cylinder = scene.createNode("Cylinder");
    // cylinder.height = 4.2;

    // console.log("background "+background);
    // const scene = Browser.currentScene;                      // Get the scene.
    // const timer = scene.getNamedNode("SpinAnimationTimer"); // Get box TouchSensor node.
    // console.log(scene);




    // }
    console.log("end");
}

