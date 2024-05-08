
// http://paulbourke.net/dataformats/off/
// https://people.sc.fsu.edu/~jburkardt/data/off/off.html
// This parser is extending the OFF format. By providing a description for lines and vertices.

/*
 * Parser
 */

function OFFParser(scene) {
   X3D.X3DParser.call(this, scene);
}

Object.assign(Object.setPrototypeOf(OFFParser.prototype, X3D.X3DParser.prototype),
   {
      getEncoding() {
         return "STRING";
      },
      setInput(string) {
         this.input = string;
      },
      isValid() {
         if (!(typeof this.input === "string"))
            return false;

         if (this.input.length < 4)
            return false;

         return this.input.slice(0, 3) == "OFF" || this.input.slice(1, 3) == "OFF";
      },
      parseIntoScene(resolve, reject) {
         this.off()
            .then(resolve)
            .catch(reject);
      },
      off: async function () {
         // Set profile and components.

         const
            browser = this.getBrowser(),
            scene = this.getScene();

         scene.setEncoding("OFF");
         scene.setProfile(browser.getProfile("Interchange"));

         await this.loadComponents();

         // const envLight = scene.createNode("PointLight");
         // envLight.color = new X3D.SFColor(1, 1, 1);
         // envLight.intensity = 1;
         // envLight.ambientIntensity = 1;
         // envLight.attenuation = new X3D.SFVec3f(0, 0, 0);
         // scene.rootNodes.push(envLight);

         const camera = scene.createNode("Viewpoint");
         camera.fieldOfView = 30.0 * Math.PI / 180.0;
         camera.nearDistance = 0.1;
         camera.farDistance = 1000;
         const position = [0, 0, 45];
         camera.position = new X3D.SFVec3f(...position);
         scene.rootNodes.push(camera);

         const background = scene.createNode("Background");
         scene.addNamedNode("Background", background);
         background.skyColor = new X3D.MFColor(new X3D.SFColor(0.8, 0.8, 0.8));
         scene.rootNodes.push(background);

         // Parse scene.
         const objectTransform = this.shape();
         scene.rootNodes.push(objectTransform);

         return scene;
      },
      defaultVertexRadius() {
         return 0.03;
      },
      defaultEdgeRadius() {
         return 0.02;
      },

      textToPrimaries() {
         const _face_vertex_data_separator_pattern = /\s+/;

         //READ RAW DATA
         let lines = this.input;
         if (lines.indexOf('\r\n') !== -1) {
            // This is faster than String.split with regex that splits on both
            lines = lines.replace(/\r\n/g, '\n');
         }

         if (lines.indexOf('\\\n') !== -1) {
            // join lines separated by a line continuation character (\)
            lines = lines.replace(/\\\n/g, '');
         }
         lines = lines.split('\n')
         const result = {
            vertices: [],
            faces: [],
            edges: [],
            verticesColor: [],
            facesColor: [],
            edgesColor: [],
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
               result.facesColor.push((lineData.length > faceNum + 1) ? this.parseColor(lineData.slice(faceNum + 1)) : undefined);
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
               result.edgesColor.push((lineData.length > faceNum + 1) ? this.parseColor(lineData.slice(faceNum + 1)) : undefined);
            }
            else if (faceNum == 1) {
               if (lineData.length > faceNum + 1) {
                  result.verticesColor[parseInt(lineData.slice(1, 2), 10)] = this.parseColor(lineData.slice(faceNum + 1));
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
      },

      shape() {
         const offData = this.textToPrimaries();
         this.addMissingColors(offData);

         // compute scalings
         const vertices = new X3D.MFVec3f();
         vertices.length = offData.vertices.length;
         let cnt = new X3D.SFVec3f(0, 0, 0);
         for (let i = 0, l = offData.vertices.length; i < l; ++i) {
            vertices[i] = new X3D.SFVec3f(...offData.vertices[i])
            cnt = cnt.add(vertices[i]);
         }
         cnt = cnt.divide(vertices.length);
         //center in zero
         const edgesLength = [];
         for (let i = 0, l = vertices.length; i < l; i++) {
            vertices[i] = vertices[i].subtract(cnt);
            edgesLength.push(vertices[i].length());
         }
         const polyScaleFactor = 10 / Math.max.apply(Math, edgesLength);
         edgesLength.length = 0;
         // compute edges length to normalize edge length
         for (let e of offData.edges) {
            edgesLength.push((vertices[e[1]].subtract(vertices[e[0]])).length());
         }
         const scaleFactor = edgesLength.reduce((partialSum, a) => partialSum + a, 0) / edgesLength.length;
         // console.log(Math.min.apply(Math, edgesLength));
         // console.log(Math.max.apply(Math, edgesLength));
         // for (let i = 0, l = vertices.length; i < l; i++) {
         //    vertices[i] = vertices[i].divide(scaleFactor);
         // }

         // FACES
         const scene = this.getExecutionContext();
         const objectTransform = scene.createNode("Transform");
         objectTransform.scale = new X3D.SFVec3f(polyScaleFactor, polyScaleFactor, polyScaleFactor);
         scene.addNamedNode("OffTransform", objectTransform);

         const faceTransform = this.facesShape(vertices, offData.faces, offData.facesColor);
         scene.addNamedNode("FacesTransform", faceTransform);
         objectTransform.children.push(faceTransform);

         const edgeTransform = this.edgesShape(vertices, offData.edges, offData.edgesColor, scaleFactor);
         scene.addNamedNode("EdgesTransform", edgeTransform);
         objectTransform.children.push(edgeTransform);

         const vertexTransform = this.verticesShape(vertices, offData.verticesColor, scaleFactor);
         scene.addNamedNode("VerticesTransform", vertexTransform);
         objectTransform.children.push(vertexTransform);

         return objectTransform;
      },

      facesShape(vertices, faces, facesColor) {
         const scene = this.getExecutionContext();

         const shape = scene.createNode("Shape");
         const appearance = scene.createNode("Appearance");
         const material = scene.createNode("Material");
         // material.diffuseColor = X3D.Color3.White;
         appearance.material = material;
         shape.appearance = appearance;

         const geometry = scene.createNode("IndexedFaceSet");
         geometry.solid = false;
         geometry.convex = false;
         geometry.colorPerVertex = false;

         //color
         let hasTransparency = false;
         for (let c of facesColor) {
            if (c[3] != 1) {
               hasTransparency = true;
            }
         }
         let colorNode, colData;
         if (hasTransparency) {
            colorNode = scene.createNode("ColorRGBA");
            colData = new X3D.MFColorRGBA();
         }
         else {
            colorNode = scene.createNode("Color");
            colData = new X3D.MFColor();
         }
         colData.length = facesColor.length;

         for (let i = 0, l = facesColor.length; i < l; i++) {
            if (hasTransparency) {
               colData[i] = new X3D.SFColorRGBA(facesColor[i][0], facesColor[i][1], facesColor[i][2], facesColor[i][3]);
            }
            else {
               colData[i] = new X3D.SFColor(facesColor[i][0], facesColor[i][1], facesColor[i][2]);
            }
         }

         //faces
         const actualFaces = [];
         for (let i = 0, l = faces.length; i < l; i++) {
            actualFaces.push(...faces[i])
            actualFaces.push(-1);
         }
         geometry.coordIndex = actualFaces;
         colorNode.color = colData;
         geometry.color = colorNode;

         const coordinate = scene.createNode("Coordinate");
         coordinate.point = vertices;
         geometry.coord = coordinate;

         shape.geometry = geometry;

         const transform = scene.createNode("Transform");
         transform.children.push(shape);
         return transform;
      },

      verticesShape(vertices, verticesColor, scaleFactor) {
         const scene = this.getExecutionContext();
         const groupTransform = scene.createNode("Transform");

         const geometry = scene.createNode("Sphere");
         scene.addNamedNode("VertexGeometry", geometry);
         geometry.radius = this.defaultVertexRadius() * scaleFactor;


         for (let i = 0, l = vertices.length; i < l; ++i) {
            const shape = scene.createNode("Shape");
            shape.geometry = geometry;

            const color = verticesColor[i];
            const material = scene.createNode("Material");
            material.diffuseColor = new X3D.SFColor(color[0], color[1], color[2]);
            material.transparency = 1 - color[3];
            const appearance = scene.createNode("Appearance");
            appearance.material = material;
            shape.appearance = appearance;

            const transform = scene.createNode("Transform");
            const point = vertices[i];
            transform.translation = point;
            transform.children.push(shape);

            groupTransform.children.push(transform);
         }
         return groupTransform;
      },

      edgesShape(vertices, edges, edgesColor, scaleFactor) {
         const scene = this.getExecutionContext();
         const groupTransform = scene.createNode("Transform");

         const geometry = scene.createNode("Cylinder");
         scene.addNamedNode("EdgeGeometry", geometry);
         geometry.radius = this.defaultEdgeRadius() * scaleFactor;
         geometry.height = 1;

         const cylDir = new X3D.SFVec3f(0, 1, 0); // the cylinder direction
         for (let i = 0, l = edges.length; i < l; ++i) {
            const e = edges[i];
            const pt0 = vertices[e[0]];
            const pt1 = vertices[e[1]];
            const mid = pt0.lerp(pt1, 0.5);
            const direction = pt1.subtract(pt0);
            const dirLength = direction.length();
            const rot = new X3D.SFRotation(cylDir, direction);

            const transform = scene.createNode("Transform");
            transform.translation = mid;
            transform.rotation = rot;
            transform.scale = new X3D.SFVec3f(1, dirLength, 1);

            const color = edgesColor[i];
            const material = scene.createNode("Material");
            material.diffuseColor = new X3D.SFColor(color[0], color[1], color[2]);
            material.transparency = 1 - color[3];
            const appearance = scene.createNode("Appearance");
            appearance.material = material;
            const shape = scene.createNode("Shape");
            shape.appearance = appearance;

            shape.geometry = geometry;
            transform.children.push(shape);
            groupTransform.children.push(transform);
         }
         return groupTransform;
      },

      parseColor(colorStringArray) {
         let isFloat = false;
         for (let el of colorStringArray) {
            isFloat = isFloat || el.includes(".");
         }
         const color = colorStringArray.map(el => isFloat ? parseFloat(el, 10) : parseInt(el, 10) / 255.0);
         if (color.length < 4) {
            color.push(1)
         }
         return color;
      },

      addMissingColors(obj) {
         // const gDefaultColor = { vertex: [1.0, 0.5, 0.0], edge: [0.8, 0.6, 0.8], face: [0.8, 0.9, 0.9] };
         const gDefaultColor = { vertex: [1.0, 0.5, 0.0, 1.0], edge: [0.8, 0.6, 0.8, 1.0], face: [0.8, 0.9, 0.9, 1.0] };

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
      },

   });

X3D.GoldenGate.Parser.push(OFFParser);
// export default OFFParser;