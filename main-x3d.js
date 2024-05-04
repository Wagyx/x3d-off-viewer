
console.log("start")
const gDefaultColor = { vertex: [1.0, 0.5, 0.0], edge: [0.8, 0.6, 0.8], face: [0.8, 0.9, 0.9] };
init();
console.log("end")


function genCube() {
    const cube = {
        points: [
            [0.5, 0.5, 0.5],
            [0.5, 0.5, -0.5],
            [0.5, -0.5, 0.5],
            [0.5, -0.5, -0.5],
            [-0.5, 0.5, 0.5],
            [-0.5, 0.5, -0.5],
            [-0.5, -0.5, 0.5],
            [-0.5, -0.5, -0.5]],
        faces: [
            [1, 2, 6, 5],
            [1, 5, 7, 3],
            [1, 3, 4, 2],
            [8, 4, 3, 7],
            [8, 7, 5, 6],
            [8, 6, 2, 4],
        ]
    }
    cube.points = cube.points.map(x => x.map(el => el * 2));
    cube.faces = cube.faces.map(x => x.map(el => el - 1));
    return cube;
}

function createIndexedFaceSet(points, faces, facesColor) {
    const actualColors = [];
    const actualFaces = [];
    for (let faceNum = 0; faceNum < faces.length; faceNum++) {
        if (facesColor[faceNum].length == 4 && facesColor[faceNum][3] == 0.0) {
            continue;
        }
        actualColors.push(facesColor[faceNum]);
        actualFaces.push(faces[faceNum]);
    }

    const geometry = document.createElement("IndexedFaceSet");
    geometry.setAttribute("solid", "false")
    geometry.setAttribute("convex", "false")
    geometry.setAttribute("colorPerVertex", "false");
    geometry.setAttribute("coordIndex", actualFaces.map(x => x.join(",") + ",-1"
    ).join(","));

    const coordinates = document.createElement("Coordinate");
    coordinates.setAttribute("point", points.map(x => x.join(" ")).join(","));
    geometry.appendChild(coordinates);

    const colorNode = document.createElement("Color");
    colorNode.setAttribute("color", actualColors.map(x => x.join(" ")).join(","));
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
    for (let i = 0, l = obj.verticesColor.length; i < l; ++i) {
        if (obj.verticesColor[i] === undefined) {
            obj.verticesColor[i] = gDefaultColor.vertex;
        }
    }
    for (let i = 0, l = obj.edgesColor.length; i < l; ++i) {
        if (obj.edgesColor[i] === undefined) {
            obj.edgesColor[i] = gDefaultColor.edge;
        }
    }
    for (let i = 0, l = obj.facesColor.length; i < l; ++i) {
        if (obj.facesColor[i] === undefined) {
            obj.facesColor[i] = gDefaultColor.face;
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

function divideScalar(vec,s){
    return [vec[0]/s, vec[1]/s, vec[2]/s];
}

function arraySum(arr) {
    return arr.reduce((partialSum, a) => partialSum + a, 0);
}

function arrayAverage(arr) {
    return arraySum(arr) / arr.length;
}

////////////////////////////////////////////////////////////////////////////////////

function init() {

    const canvases = document.getElementsByTagName('x3d-canvas');
    
    for (let canvas of canvases) {
        
        const filename = canvas.getAttribute("filename");
        let edgeRadius = canvas.getAttribute("edgeRadius");
        if (!edgeRadius){ edgeRadius = 0.03; }
        let vertexRadius = canvas.getAttribute("vertexRadius");
        if (!vertexRadius){ vertexRadius = 0.02; }

        (async () => {
            const offData = await readAntiprismOffFile(filename);
            // console.log(offData);
            
            const x3dnode = document.createElement("X3D");
            x3dnode.setAttribute("profile", "Interactive");
            x3dnode.setAttribute("version", "4.0");
            x3dnode.setAttribute("xmlns:xsd", "http://www.w3.org/2001/XMLSchema-instance");
            x3dnode.setAttribute("xsd:noNamespaceSchemaLocation", "http://www.web3d.org/specifications/x3d-4.0.xsd");
            
            const scene = document.createElement("Scene");
            x3dnode.appendChild(scene);

            const background = document.createElement("Background");
            background.setAttribute("skycolor", "0.8 0.8 0.8");
            scene.appendChild(background);
            
            

            const envLight = document.createElement("EnvironmentLight");
            envLight.setAttribute("color", "1 1 1");
            envLight.setAttribute("intensity", "40");
            scene.appendChild(envLight);
            // const dirLight = document.createElement("DirectionalLight");
            // dirLight.setAttribute("color", "1 1 1");
            // dirLight.setAttribute("intensity", "40");
            // scene.appendChild(dirLight);

            //todo scale to have edge length be unit

            // convert vertex data to THREE.js vectors
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
            for (let i = 0; i < vertices.length; i++) {
                vertices[i] = divideScalar(vertices[i], scaleFactor);
            }

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

                scene.appendChild(shape);
            }

            // VERTICES
            // const particles = document.createElement("ParticleSystem");
            // material.setAttribute("geometryType", "GEOMETRY");
            // material.setAttribute("maxParticles", ""+offData.vertices.length);
            // const partGeom = document.createElement("Sphere");

            // particles.appendChild(partGeom);
            // shape.appendChild(particles);

            {
                for (let i = 0, l = vertices.length; i < l; ++i) {
                    const point = vertices[i];
                    const color = offData.verticesColor[i];

                    if (color.length == 4 && color[3] == 0.0) {
                        continue;
                    }

                    const transform = document.createElement("Transform");
                    transform.setAttribute("translation", point.join(" "));

                    const shape = document.createElement("Shape");

                    const appearance = document.createElement("Appearance");
                    const material = document.createElement("Material");
                    material.setAttribute("diffuseColor", color.join(" "));
                    appearance.appendChild(material);
                    shape.appendChild(appearance);

                    const geom = document.createElement("Sphere");
                    geom.setAttribute("radius", vertexRadius);
                    shape.appendChild(geom);
                    transform.appendChild(shape);
                    scene.appendChild(transform);
                }


                // ProtoBody
                // const shape = document.createElement("InstancedShape");
                // const appearance = document.createElement("Appearance");
                // const material = document.createElement("Material");
                // material.setAttribute("diffuseColor", "0.5 0.5 0.5");
                // appearance.appendChild(material);
                // shape.appendChild(appearance);
                // // const translations = vertices.map(x => x.join(" ")).join(",");
                // const translations = ["0 0 0",];
                // shape.setAttribute("translations",translations)

                // const partGeom = document.createElement("Sphere");
                // shape.appendChild(partGeom);

                // scene.appendChild(shape);

            }

            //EDGES
            {
                const cylDir = [0, 1, 0]; // the cylinder direction
                for (let i = 0, l = offData.edges.length; i < l; ++i) {
                    const e = offData.edges[i];
                    const color = offData.edgesColor[i];
                    if (color.length == 4 && color[3] == 0.0) {
                        continue;
                    }
                    const pt0 = vertices[e[0]];
                    const pt1 = vertices[e[1]];
                    const mid = midPoint(pt0, pt1);
                    const direction = substractVec(pt1, pt0);
                    const length = normVec(direction);
                    const rot = rotationFrom(cylDir, direction);

                    const transform = document.createElement("Transform");
                    transform.setAttribute("translation", mid.join(","));
                    transform.setAttribute("rotation", rot.join(","));

                    const shape = document.createElement("Shape");

                    const appearance = document.createElement("Appearance");
                    const material = document.createElement("Material");
                    material.setAttribute("diffuseColor", color.join(" "));
                    appearance.appendChild(material);
                    shape.appendChild(appearance);

                    const geom = document.createElement("Cylinder");
                    geom.setAttribute("height", length);
                    geom.setAttribute("radius", edgeRadius);
                    shape.appendChild(geom);
                    transform.appendChild(shape);
                    scene.appendChild(transform);

                }
            }
            canvas.appendChild(x3dnode)

        })()


    }
}
