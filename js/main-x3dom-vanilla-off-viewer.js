init();


////////////////////////////////////////////////////////////////////////////////////
// PARSING OFF FILE FORMAT
////////////////////////////////////////////////////////////////////////////////////

async function readOffFile(url) {
    const response = await fetch(url);

    const obj = parseOFF(await response.text());
    addMissingColors(obj);
    obj["filename"] = url;
    obj["name"] = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
    return obj;
}

function addMissingColors(obj) {
    const gDefaultColor = { face: [0.8, 0.9, 0.9, 1.0] };

    for (let i = 0, l = obj.facesColor.length; i < l; ++i) {
        if (obj.facesColor[i] === undefined) {
            obj.facesColor[i] = gDefaultColor.face;
        }
        if (obj.facesColor[i].length == 3) {
            obj.facesColor[i].push(1.0);
        }
    }
    return obj;
}

function parseColor(colorStringArray) {
    let isFloat = false;
    for (let el of colorStringArray) {
        isFloat = isFloat || el.includes(".");
    }
    return colorStringArray.map(el => isFloat ? parseFloat(el, 10) : parseInt(el, 10) / 255.0);
}

function parseOFF(text) {
    const _face_vertex_data_separator_pattern = /\s+/;

    if (text.indexOf('\r\n') !== -1) {
        // This is faster than String.split with regex that splits on both
        text = text.replace(/\r\n/g, '\n');
    }

    if (text.indexOf('\\\n') !== -1) {
        // join lines separated by a line continuation character (\)
        text = text.replace(/\\\n/g, '');
    }

    const lines = text.split('\n');
    const result = {
        vertices: [],
        faces: [],
        facesColor: [],
        text: text,
    };
    const headerKeyword = lines[0].trimStart();
    if (!headerKeyword == "OFF") {
        return result;
    }
    let i = 1;
    let l = lines.length;
    let numbers;

    for (; i < l; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        const lineFirstChar = line.charAt(0);
        if (lineFirstChar === '#') continue;

        numbers = line.split(_face_vertex_data_separator_pattern).map(el => parseInt(el, 10));
        i++;
        break;
    }
    const numberVertices = numbers[0];
    const numberFaces = numbers[1];

    for (; i < l; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        const lineFirstChar = line.charAt(0);
        if (lineFirstChar === '#') continue;
        const data = line.split(_face_vertex_data_separator_pattern);
        result.vertices.push(data.slice(0, 3).map(el => parseFloat(el, 10)));
        if (result.vertices.length >= numberVertices) {
            i++;
            break;
        }
    }

    for (; i < l; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        const lineFirstChar = line.charAt(0);
        if (lineFirstChar === '#') continue;

        const lineData = line.split(_face_vertex_data_separator_pattern);
        const faceNum = parseInt(lineData.slice(0, 1), 10);
        // Parse the face vertex data into an easy to work with format
        if (faceNum > 2) {
            result.faces.push(lineData.slice(1, faceNum + 1).map(el => parseFloat(el, 10)));
            result.facesColor.push((lineData.length > faceNum + 1) ? parseColor(lineData.slice(faceNum + 1)) : undefined);
        }
    }

    return result;
}

////////////////////////////////////////////////////////////////////////////////////

function createIndexedFaceSet(vertices, faces, facesColor) {
    const geometry = document.createElement("IndexedFaceSet");
    geometry.setAttribute("solid", "false")
    geometry.setAttribute("convex", "false")
    geometry.setAttribute("colorPerVertex", "false");
    geometry.setAttribute("coordIndex", faces.map(x => x.join(",") + ",-1"
    ).join(","));

    const coordinates = document.createElement("Coordinate");
    coordinates.setAttribute("point", vertices.map(x => x.join(" ")).join(","));
    geometry.appendChild(coordinates);

    const colorNode = document.createElement("ColorRGBA");
    colorNode.setAttribute("color", facesColor.map(x => x.join(" ")).join(","));
    geometry.appendChild(colorNode);

    return geometry;
}


function init() {
    const canvases = document.getElementsByTagName('x3d');
    for (let canvas of canvases) {

        const filename = canvas.getAttribute("filename");
        (async () => {
            const offData = await readOffFile(filename);

            const scene = canvas.getElementsByTagName("Scene")[0];

            const background = document.createElement("Background");
            background.setAttribute("skyColor", "0.8 0.8 0.8");
            scene.appendChild(background);

            // const envLight = document.createElement("EnvironmentLight");
            // envLight.setAttribute("color", "1 1 1");
            // envLight.setAttribute("intensity", "0");
            // envLight.setAttribute("ambienIntensity", "1");
            // scene.appendChild(envLight);
            // const dirLight = document.createElement("DirectionalLight");
            // dirLight.setAttribute("color", "1 1 1");
            // dirLight.setAttribute("intensity", "40");
            // scene.appendChild(dirLight);

            const camera = document.createElement("Viewpoint");
            camera.setAttribute("fieldOfView", 30.0 * Math.PI / 180.0); // radians ...
            camera.setAttribute("nearClippingPlane", 0.1);
            camera.setAttribute("farClippingPlane", 1000);
            const position = [0, 0, 8];
            camera.setAttribute("position", position.join(","));
            scene.appendChild(camera);

            //Centering model and scaling to fit inside a sphere

            const objectTransform = document.createElement("Transform");

            // FACES
            {
                const shape = document.createElement("Shape");

                const appearance = document.createElement("Appearance");
                const material = document.createElement("Material");
                material.setAttribute("diffuseColor", "1.0 1.0 1.0");
                appearance.appendChild(material);
                shape.appendChild(appearance);

                const geometry = createIndexedFaceSet(offData.vertices, offData.faces, offData.facesColor);
                shape.appendChild(geometry);

                objectTransform.appendChild(shape);
            }

            scene.appendChild(objectTransform);
        })();
    }

}
