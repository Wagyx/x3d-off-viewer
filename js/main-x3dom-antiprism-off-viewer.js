init();

function createIndexedFaceSet(points, faces, facesColor) {
    const geometry = document.createElement("IndexedFaceSet");
    geometry.setAttribute("solid", "false")
    geometry.setAttribute("convex", "false")
    geometry.setAttribute("colorPerVertex", "false");
    geometry.setAttribute("coordIndex", faces.map(x => x.join(",") + ",-1"
    ).join(","));

    const coordinates = document.createElement("Coordinate");
    coordinates.setAttribute("point", points.map(x => x.join(" ")).join(","));
    geometry.appendChild(coordinates);

    const colorNode = document.createElement("ColorRGBA");
    colorNode.setAttribute("color", facesColor.map(x => x.join(" ")).join(","));
    geometry.appendChild(colorNode);

    return geometry;
}

////////////////////////////////////////////////////////////////////////////////////
// PARSING ANTIPRISM OFF FILE FORMAT
////////////////////////////////////////////////////////////////////////////////////

async function readAntiprismOffFile(url) {
    const response = await fetch(url);

    const obj = parseAntiprismOFF(await response.text());
    addMissingColors(obj);
    obj["filename"] = url;
    obj["v"] = obj.vertices.length;
    obj["e"] = obj.edges.length;
    obj["f"] = obj.faces.length;
    obj["name"] = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
    return obj;
}

function addMissingColors(obj) {
    const gDefaultColor = { vertex: [1.0, 0.5, 0.0, 1.0], edge: [0.8, 0.6, 0.8, 1.0], face: [0.8, 0.9, 0.9, 1.0] };
    for (let i = 0, l = obj.verticesColor.length; i < l; ++i) {
        if (obj.verticesColor[i] === undefined) {
            obj.verticesColor[i] = gDefaultColor.vertex;
        }
        if (obj.verticesColor[i].length == 3) {
            obj.verticesColor[i].push(1.0);
        }
    }
    for (let i = 0, l = obj.edgesColor.length; i < l; ++i) {
        if (obj.edgesColor[i] === undefined) {
            obj.edgesColor[i] = gDefaultColor.edge;
        }
        if (obj.edgesColor[i].length == 3) {
            obj.edgesColor[i].push(1.0);
        }
    }
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

function parseAntiprismOFF(text) {
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
        edges: [],
        verticesColor: [],
        facesColor: [],
        edgesColor: [],
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
        result.verticesColor.push(undefined);
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
        else if (faceNum == 2) {
            const i0 = parseFloat(lineData[1], 10);
            const i1 = parseFloat(lineData[2], 10);
            let edge;
            if (i0 > i1) {
                edge = "" + i1 + "," + i0;
            }
            else {
                edge = "" + i0 + "," + i1;
            }
            result.edges.push(edge);
            result.edgesColor.push((lineData.length > faceNum + 1) ? parseColor(lineData.slice(faceNum + 1)) : undefined);
        }
        else if (faceNum == 1) {
            if (lineData.length > faceNum + 1) {
                result.verticesColor[parseInt(lineData.slice(1, 2), 10)] = parseColor(lineData.slice(faceNum + 1));
            }
        }
    }


    // add misssing edges
    for (let face of result.faces) {
        for (let j = 0, jl = face.length; j < jl; j++) {
            const i0 = face[j];
            const i1 = face[(j + 1) % jl];
            let edge;
            if (i0 > i1) {
                edge = "" + i1 + "," + i0;
            }
            else {
                edge = "" + i0 + "," + i1;
            }
            if (!result.edges.includes(edge)) {
                result.edges.push(edge);
                result.edgesColor.push(undefined);
            }
        }
    }


    for (let i = 0, l = result.edges.length; i < l; ++i) {
        const edgeParts = result.edges[i].split(',');
        result.edges[i] = [parseInt(edgeParts[0], 10), parseInt(edgeParts[1], 10)]
    }
    return result;
}
////////////////////////////////////////////////////////////////////////////////////
// VECTOR MATH
////////////////////////////////////////////////////////////////////////////////////

function dotVec(u, v) {
    return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}
function normSqVec(u) {
    return dotVec(u, u);
}
function normVec(u) {
    return Math.sqrt(dotVec(u, u));
}
function normalizeVec(u) {
    const d = normVec(u)
    return [u[0] / d, u[1] / d, u[2] / d];
}
function crossVec(u, v) {
    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    ];
}

function clamp(x, vmin, vmax) {
    return Math.min(Math.max(x, vmin), vmax);
}
function angleVec(u, v) {
    const denominator = Math.sqrt(normSqVec(u) * normSqVec(v));
    if (denominator === 0) return Math.PI / 2;
    const dv = dotVec(u, v) / denominator;
    // clamp, to handle numerical problems
    return Math.acos(clamp(dv, - 1, 1));
}

function rotationFrom(u, v) {
    let angle;
    let normal = crossVec(u, v);
    const cosAngle = dotVec(u, v);
    if (normSqVec(normal) < 1e-5) {
        const tmp = [Math.random(), Math.random(), Math.random()];
        normal = normalizeVec(crossVec(tmp, v));
        angle = cosAngle > 0 ? 0 : Math.PI;
        return [normal[0], normal[1], normal[2], angle];
    }
    const sinAngle = normVec(normal);
    if (Math.abs(cosAngle) < 1e-5) {
        angle = Math.PI / 2;
    } else {
        angle = Math.atan2(sinAngle, cosAngle);
    }
    return [normal[0] / sinAngle, normal[1] / sinAngle, normal[2] / sinAngle, angle];
}

function signedAngleVec(u, v) {
    const dv = dotVec(u, v);
    if (dv === 0) {
        return Math.PI / 2
    }
    return Math.atan2(crossVec(u, v), dv);
}
function addVec(u, v) {
    return [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
}
function midPoint(u, v) {
    return [(u[0] + v[0]) * 0.5, (u[1] + v[1]) * 0.5, (u[2] + v[2]) * 0.5];
}
function substractVec(u, v) {
    return [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
}

function divideScalar(vec, s) {
    return [vec[0] / s, vec[1] / s, vec[2] / s];
}

function arraySum(arr) {
    return arr.reduce((partialSum, a) => partialSum + a, 0);
}

function arrayAverage(arr) {
    return arraySum(arr) / arr.length;
}

////////////////////////////////////////////////////////////////////////////////////

function init() {
    const canvases = document.getElementsByTagName('x3d');
    for (let canvas of canvases) {

        let vertexRadius = canvas.getAttribute("vertexRadius");
        if (!vertexRadius) { vertexRadius = 0.03; } else { vertexRadius = parseFloat(vertexRadius, 10); }
        let edgeRadius = canvas.getAttribute("edgeRadius");
        if (!edgeRadius) { edgeRadius = 0.02; } else { edgeRadius = parseFloat(edgeRadius, 10); }

        const filename = canvas.getAttribute("filename");
        (async () => {
            const offData = await readAntiprismOffFile(filename);

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
            const position = [0, 0, 45];
            camera.setAttribute("position", position.join(","));
            scene.appendChild(camera);

            //Centering model and scaling to fit inside a sphere

            // compute center
            const vertices = [];
            let cnt = [0, 0, 0];
            for (let v of offData.vertices) {
                cnt = addVec(cnt, v);
                vertices.push([...v])
            }
            cnt = divideScalar(cnt, vertices.length);
            //center in zero
            const edgesLength = [];
            for (let i = 0; i < vertices.length; i++) {
                vertices[i] = substractVec(vertices[i], cnt);
                edgesLength.push(normVec(vertices[i]));
            }
            const polyScaleFactor = 10 / Math.max.apply(Math, edgesLength);
            edgesLength.length = 0;
            // compute edges length to normalize edge length
            for (let e of offData.edges) {
                const pt0 = vertices[e[0]];
                const pt1 = vertices[e[1]];
                edgesLength.push(normVec(substractVec(pt1, pt0)));
            }
            const scaleFactor = arrayAverage(edgesLength);
            // for (let i = 0; i < vertices.length; i++) {
            //     vertices[i] = divideScalar(vertices[i], scaleFactor);
            // }

            const objectTransform = document.createElement("Transform");
            objectTransform.setAttribute("scale", [polyScaleFactor, polyScaleFactor, polyScaleFactor].join(", "));
            edgeRadius = edgeRadius * scaleFactor;
            vertexRadius = vertexRadius * scaleFactor;

            // FACES
            {
                const shape = document.createElement("Shape");

                const appearance = document.createElement("Appearance");
                const material = document.createElement("Material");
                material.setAttribute("diffuseColor", "1.0 1.0 1.0");
                appearance.appendChild(material);
                shape.appendChild(appearance);

                const geometry = createIndexedFaceSet(vertices, offData.faces, offData.facesColor);
                shape.appendChild(geometry);

                objectTransform.appendChild(shape);
            }

            // VERTICES
            {
                const vertTransform = document.createElement("Transform");
                for (let i = 0, l = vertices.length; i < l; ++i) {
                    const point = vertices[i];
                    const color = offData.verticesColor[i];
                    const transform = document.createElement("Transform");
                    transform.setAttribute("translation", point.join(" "));

                    const shape = document.createElement("Shape");

                    const appearance = document.createElement("Appearance");
                    const material = document.createElement("Material");
                    material.setAttribute("diffuseColor", color.slice(0, 3).join(" "));
                    material.setAttribute("transparency", "" + (1 - color[3]));
                    appearance.appendChild(material);
                    shape.appendChild(appearance);

                    const geom = document.createElement("Sphere");
                    geom.setAttribute("radius", vertexRadius);
                    shape.appendChild(geom);
                    transform.appendChild(shape);
                    vertTransform.appendChild(transform);
                }
                objectTransform.appendChild(vertTransform);
            }

            //EDGES
            {
                const edgeTransform = document.createElement("Transform");
                const cylDir = [0, 1, 0]; // the cylinder direction
                for (let i = 0, l = offData.edges.length; i < l; ++i) {
                    const e = offData.edges[i];
                    const color = offData.edgesColor[i];
                    const pt0 = vertices[e[0]];
                    const pt1 = vertices[e[1]];
                    const mid = midPoint(pt0, pt1);
                    const direction = substractVec(pt1, pt0);
                    const length = normVec(direction);
                    const rot = rotationFrom(cylDir, direction);
                    const scale = [edgeRadius, length, edgeRadius];

                    const transform = document.createElement("Transform");
                    transform.setAttribute("translation", mid.join(","));
                    transform.setAttribute("rotation", rot.join(","));
                    transform.setAttribute("scale", scale.join(","));

                    const shape = document.createElement("Shape");

                    const appearance = document.createElement("Appearance");
                    const material = document.createElement("Material");
                    material.setAttribute("diffuseColor", color.slice(0, 3).join(" "));
                    material.setAttribute("transparency", "" + (1 - color[3]));
                    appearance.appendChild(material);
                    shape.appendChild(appearance);

                    const geom = document.createElement("Cylinder");
                    geom.setAttribute("height", 1);
                    geom.setAttribute("radius", 1);
                    shape.appendChild(geom);
                    transform.appendChild(shape);
                    scene.appendChild(transform);
                    edgeTransform.appendChild(transform);
                }
                objectTransform.appendChild(edgeTransform);
            }
            scene.appendChild(objectTransform);
        })();
    }

}
