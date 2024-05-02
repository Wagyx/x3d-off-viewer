
// http://paulbourke.net/dataformats/off/
// https://people.sc.fsu.edu/~jburkardt/data/off/off.html


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

         const background = scene.createNode("Background");
         background.skyColor = [0.8, 0.8, 0.8];
         scene.getRootNodes().push(background);
         
         // Parse scene.

         this.shape();
         
         return scene;
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

         // convert vertex data to THREE.js vectors
         const vertices = [];
         let cnt = new X3D.SFVec3f(0,0,0);
         for (let v of offData.vertices) {
            const tmp = new X3D.SFVec3f(...v)
            cnt = cnt.add(tmp);
            vertices.push(tmp);
         }
         cnt = cnt.divide(vertices.length);
         //center in zero
         const edgesLength = [];
         for (let i = 0; i < vertices.length; i++) {
            vertices[i] = vertices[i].subtract(cnt);
            edgesLength.push(vertices[i].length());
         }
         const polyScaleFactor = 10 / Math.max.apply(Math, edgesLength);
         edgesLength.length = 0;
         // compute edges length to normalize edge length
         for (let e of offData.edges) {
            edgesLength.push((vertices[e[1]].subtract(vertices[e[0]])).length());
         }
         const scaleFactor = edgesLength.reduce((partialSum, a) => partialSum + a, 0)/edgesLength.length;
         for (let i = 0; i < vertices.length; i++) {
            vertices[i] = vertices[i].divide(scaleFactor);
         }

         // FACES
         this.facesShape(vertices, offData.faces, offData.facesColor);
         this.verticesShape(vertices, offData.verticesColor);
         this.edgesShape(vertices, offData.edges, offData.edgesColor);
      },

      facesShape(vertices, faces, facesColor) {
         const scene = this.getExecutionContext();

         const shape = scene.createNode("Shape");

         const appearance = scene.createNode("Appearance");
         const material = scene.createNode("Material");
         material.diffuseColor = X3D.Color3.White;
         appearance.material = material;
         shape.appearance = appearance;

         const geometry = scene.createNode("IndexedFaceSet");
         geometry.solid = false;
         geometry.convex = false;
         geometry.colorPerVertex = false;

         // remove faces that are not colored
         const actualColors = [];
         const actualFaces = [];
         // const colorNode = scene.createNode("Color");
         const colorNode = scene.createNode("ColorRGBA");
         for (let faceNum = 0; faceNum < faces.length; faceNum++) {
            // if (facesColor[faceNum].length == 4 && facesColor[faceNum][3] == 0.0) {
            //    continue;
            // }
            actualColors.push(...facesColor[faceNum]);
            actualFaces.push(...faces[faceNum])
            actualFaces.push(-1);
         }
         geometry.coordIndex = actualFaces;
         colorNode.color = actualColors;
         geometry.color = colorNode;

         const points = [];
         for (v of vertices) {
            points.push(...v)
         }
         const coordinate = scene.createNode("Coordinate");
         coordinate.point = points;
         geometry.coord = coordinate;

         shape.geometry = geometry;
         scene.getRootNodes().push(shape);

      },

      verticesShape(vertices, verticesColor) {
         const vertexRadius = 0.03;
         const scene = this.getExecutionContext();

         for (let i = 0, l = vertices.length; i < l; ++i) {
            const point = vertices[i];
            const color = verticesColor[i];

            // if (color.length == 4 && color[3] == 0.0) {
            //    continue;
            // }

            const shape = scene.createNode("Shape");

            const material = scene.createNode("Material");
            material.diffuseColor = new X3D.SFColor(color[0],color[1],color[2]);
            material.transparency = 1-color[3];
            const appearance = scene.createNode("Appearance");
            appearance.material = material;
            shape.appearance = appearance;

            const geometry = scene.createNode("Sphere");
            geometry.radius = vertexRadius;
            shape.geometry = geometry;

            const transform = scene.createNode("Transform");
            transform.translation = point;
            transform.children.push(shape);

            scene.getRootNodes().push(transform);
         }
      },

      edgesShape(vertices, edges, edgesColor) {
         const scene = this.getExecutionContext();
         const edgeRadius = 0.02;
         const cylDir = new X3D.SFVec3f(0, 1, 0); // the cylinder direction
         for (let i = 0, l = edges.length; i < l; ++i) {
            const e = edges[i];
            const color = edgesColor[i];
            // if (color.length == 4 && color[3] == 0.0) {
            //    continue;
            // }
            const pt0 = vertices[e[0]];
            const pt1 = vertices[e[1]];
            const mid = pt0.lerp(pt1, 0.5);
            const direction = pt1.subtract(pt0);
            const length = direction.length();
            const rot = new X3D.SFRotation(cylDir, direction);

            const transform = scene.createNode("Transform");
            transform.translation = mid;
            transform.rotation = rot;


            const material = scene.createNode("Material");
            material.diffuseColor = new X3D.SFColor(color[0],color[1],color[2]);
            material.transparency = 1-color[3];
            const appearance = scene.createNode("Appearance");
            appearance.material = material;
            const shape = scene.createNode("Shape");
            shape.appearance = appearance;

            const geometry = scene.createNode("Cylinder");
            geometry.height = length;
            geometry.radius = edgeRadius;
            shape.geometry = geometry;
            transform.children.push(shape);
            scene.getRootNodes().push(transform);

         }

      },

      parseColor(colorStringArray) {
         let isFloat = false;
         for (let el of colorStringArray) {
            isFloat = isFloat || el.includes(".");
         }
         const color = colorStringArray.map(el => isFloat ? parseFloat(el, 10) : parseInt(el, 10) / 255.0);
         if (color.length < 4){
            color.push(1)
         }
         console.log(color);
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
      }
   });

X3D.GoldenGate.Parser.push(OFFParser);
// export default OFFParser;