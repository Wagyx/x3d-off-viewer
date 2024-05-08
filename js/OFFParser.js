
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

         const background = scene.createNode("Background");
         scene.addNamedNode("Background", background);
         background.skyColor = new X3D.MFColor(new X3D.SFColor(0.8, 0.8, 0.8));
         scene.rootNodes.push(background);

         // Parse scene.
         const objectTransform = this.shape();
         scene.rootNodes.push(objectTransform);

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
            facesColor: [],
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
               result.facesColor.push((lineData.length > faceNum + 1) ? this.parseColor(lineData.slice(faceNum + 1)) : undefined);
            }
         }
         return result;
      },

      shape() {
         const offData = this.textToPrimaries();
         this.addMissingColors(offData);

         // convert vertex data to vectors
         const vertices = new X3D.MFVec3f();
         vertices.length = offData.vertices.length;
         for (let i = 0, l = offData.vertices.length; i < l; ++i) {
            vertices[i] = new X3D.SFVec3f(...offData.vertices[i])
         }

         // FACES
         const scene = this.getExecutionContext();
         const objectTransform = this.facesShape(vertices, offData.faces, offData.facesColor);
         scene.addNamedNode("OffTransform", objectTransform);

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
         // console.log(facesColor);
         // console.log(hasTransparency);
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
         const gDefaultColor = [1.0, 1.0, 1.0, 1.0];
         for (let i = 0, l = obj.facesColor.length; i < l; ++i) {
            if (obj.facesColor[i] === undefined) {
               obj.facesColor[i] = gDefaultColor;
            }
         }
         return obj;
      }

   });

X3D.GoldenGate.Parser.push(OFFParser);
// export default OFFParser;