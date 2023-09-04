// /* eslint-disable*/

// #region shaders
let VSHADER_SOURCE = `
precision mediump float;
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;       // Normal
attribute vec2 a_TexCoords;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;
uniform mat4 u_VPMatrix;
// uniform vec3 u_LightColor;     // Light color
uniform vec3 u_LightPosition[2];	// position of the light source
uniform vec3 u_AmbientLight;
uniform bool u_isLighting;
uniform bool u_UseNormalMap;
varying vec4 v_Color;
varying vec3 v_Normal;
varying vec3 v_Position;
varying vec2 v_TexCoords;

varying vec3 ts_lightPos[2];
varying vec3 ts_FragPosition;

// Common transpose function to transpose a matrix
mat3 transpose(in mat3 inMatrix)
{
    vec3 i0 = inMatrix[0];
    vec3 i1 = inMatrix[1];
    vec3 i2 = inMatrix[2];

    mat3 outMatrix = mat3(
        vec3(i0.x, i1.x, i2.x),
        vec3(i0.y, i1.y, i2.y),
        vec3(i0.z, i1.z, i2.z)
    );

    return outMatrix;
}

void main() {

		gl_Position = u_VPMatrix * u_ModelMatrix * a_Position;
		if(u_isLighting)
		{
		v_Position = vec3(u_ModelMatrix * a_Position);
		
		// attempt at changing coordinates to tangent space from world space
		
		// vec3 t;
		// vec3 b;
		// vec3 c1 = cross(a_Normal.xyz, vec3(0.0, 0.0, 1.0));
		// vec3 c2 = cross(a_Normal.xyz, vec3(0.0, 1.0, 0.0));
		// if (length(c1) > length(c2)){
		// 	t = c1;
		// }
		// else{
		// 	t = c2;
		// }

		// t = normalize(t);
		// b = normalize(cross(a_Normal.xyz, t));
		// vec3 n = normalize(cross(t,b));
		// mat3 tbn = transpose(mat3(t,b,n));
		// v_Position = tbn * v_Position;
		// lightPos = tbn * u_LightPosition;
	
		v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
		v_Color = a_Color;

		}
		else
		{
			v_Color = a_Color;
		}
	
		v_TexCoords = a_TexCoords;
	}
`;


let FSHADER_SOURCE = `
precision mediump float;
#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

uniform bool u_UseTextures;    // Texture enable/disable flag
uniform vec3 u_LightColor[2];	// light colour
uniform vec3 u_LightPosition[2];	// position of the light source
uniform vec3 u_AmbientLight; 	// ambient light colour
uniform bool u_UseToonShading;
uniform bool u_UseNormalMap;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;
uniform bool u_IsEmissive;
uniform bool u_WhichNormal;
uniform sampler2D u_normalTextureSampler;
varying vec3 v_Normal;
varying vec3 v_Position;
varying vec4 v_Color;
uniform sampler2D u_Sampler;
varying vec2 v_TexCoords;
varying vec3 ts_lightPos[2];
varying vec3 ts_FragPosition;

vec3 perturbNormal( vec3 eye_pos, vec3 surf_norm, vec2 uv_coords, sampler2D tex){
	vec3 pNorm	= (texture2D( tex, uv_coords ).rgb * 2.0 - 1.0);

	vec2 st0	= dFdx( uv_coords.st ),
		 st1	= dFdy( uv_coords.st );
	vec3 q0		= dFdx( eye_pos.xyz ),
		 q1		= dFdy( eye_pos.xyz ),
		 S		= normalize(  q0 * st1.t - q1 * st0.t ),
		 T		= normalize( -q0 * st1.s + q1 * st0.s ),
		 N		= normalize( surf_norm );

	return normalize( mat3( S, T, N ) * pNorm );
}

void main() {
	// Normalize normal because it's interpolated and not 1.0 (length)
	vec3 normal = normalize(v_Normal);
	

	// Calculate the light direction and make it 1.0 in length

	vec3 lightDirection[2];
	lightDirection[0] = normalize(u_LightPosition[0] - v_Position);
	lightDirection[1] = normalize(u_LightPosition[1] - v_Position);

	float normalDiffuse = 1.0;
	if (u_UseNormalMap){

		if (u_WhichNormal){
			normal = perturbNormal(v_Position,normal,v_TexCoords,u_normalTextureSampler);
		}
		else{
			vec3 direction = normalize(vec3(1.0,-1.0,0.0));
			vec3 normalMap = (normalize(texture2D(u_normalTextureSampler, v_TexCoords).rgb * 2.0 - 1.0 ));
			
			normalDiffuse = (1.0 + (dot(direction,normalMap ) * 2.0));
		}
	}

	vec3 outputLight;
	for (int i=0;i<2;i++){

		float nDotL = max(dot(lightDirection[i],normal),0.0);
		
		

		if (u_UseToonShading)
		{
	
			const float A = 0.1;
			const float B = 0.3;
			const float C = 0.5;
			const float D = 0.8;
			const float F = 1.0;
	
			if (nDotL < A) nDotL = 0.0;
			else if (nDotL < B) nDotL = B;
			else if (nDotL < C) nDotL = C;
			else if (nDotL < D) nDotL = D;
			else nDotL = F;
	
		}
		outputLight += nDotL * u_LightColor[i].rgb;
	}




	// The dot product of the light direction and the normal

	
	// Calculate the final color from diffuse and ambient reflection
	vec3 ambient = u_AmbientLight * v_Color.rgb;


	vec3 diffuse;
	if (u_UseTextures) {
		vec3 albedo = texture2D(u_Sampler, v_TexCoords).rgb;
		
		

		if (u_IsEmissive){
			
			gl_FragColor = vec4(albedo + ambient, v_Color.a);
		}
		else {

			diffuse = outputLight * 1.0 * normalDiffuse;
			gl_FragColor = vec4(diffuse * albedo + ambient , v_Color.a);
		}



	} else {

		vec3 diffuse = outputLight * vec3(0.8,0.8,0.8);
		gl_FragColor = vec4(diffuse + ambient, v_Color.a);
	}
}
`;

// #endregion shaders
class Scene {

	/**
	 * Scene Constructor
	 * Initialises scene, through setting up webgl and lighting
	 * @param {WebGLContext} gl The gl element in the html page
	 * @param {HTMLElement} canvas The canvas present in the html page
	 */
	constructor (gl,canvas) {

		this.gl = gl;
		this.canvas = canvas;

		// Initialize shaders

		if (!this.changeShader()) {

			console.log("Failed to intialize shaders.");
			return;

		}

		// initialise matrices and program
		this.program = this.gl.program;
		this.viewMatrix = new Matrix4();  // The view matrix
		this.projMatrix = new Matrix4();  // The projection matrix
		this.VPMatrix = new Matrix4();
		this.models = [];
		// Set clear color to white and enable hidden surface removal
		this.gl.clearColor(0.8, 0.8, 0.8, 0.8);
		this.gl.enable(this.gl.DEPTH_TEST);

		// Clear color and depth buffer
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.getShaderLocations();

		this.lightScalar = 0.2;
		// set the light colour for flickering light
		this.gl.uniform3f(this.program.u_LightColor, 1 * this.lightScalar, 1 * this.lightScalar, 1 * this.lightScalar);
		this.gl.uniform3f(this.program.u_LampColor, 0.25,0.25, 0.25);
		// Calculate the view matrix and the projection matrix
		// Multiply them and pass through to shader program - Acts as precalculation to save work on shader prorgam

		this.eye = new Eye(1.1,4,10);

		this.viewMatrix.setLookAt(this.eye.x, this.eye.y, this.eye.z, 0, 0, 0, 0, 1.0, 0.0);
		this.projMatrix.setPerspective(90, this.canvas.width / this.canvas.height, 1, 170);

		this.VPMatrix.set(this.projMatrix).multiply(this.viewMatrix);

		this.gl.uniformMatrix4fv(this.program.u_VPMatrix, false, this.VPMatrix.elements);

		// depth of camera value
		this.depth = -25;
		this.textures = [];

		// Set default lighting boolean and position
		this.lampPosition = new Vector3([8,8,8]);

	}
	/**
	 * Initialises the scene with the vertex shader and fragment shader provided by the active values
	 * Adapted from lib/initShaders.js
	 * @returns {Boolean} success on whether the new shader has loaded
	 */
	changeShader () {

		// load both shaders
		this.vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, VSHADER_SOURCE);
		this.fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, FSHADER_SOURCE);
		// Create a program object
		let program = this.gl.createProgram();
		if (!program) {

			return null;

		}

		// Attach the shader object
		this.gl.attachShader(program, this.vertexShader);
		this.gl.attachShader(program, this.fragmentShader);

		// Link the program object
		this.gl.linkProgram(program);

		// Check the result of linking
		let linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
		if (!linked) {

			let error = this.gl.getProgramInfoLog(program);
			console.log("Failed to link program: " + error);
			this.gl.deleteProgram(program);
			this.gl.deleteShader(this.fragmentShader);
			this.gl.deleteShader(this.vertexShader);
			return null;

		}
		this.gl.useProgram(program);
		this.gl.program = program;
		this.program = program;
		return true;

	}
	/**
	 * Assigns the shader variable locations to the current program
	 * Used when changing and initialising shader variables
	 * @returns {null} No return value
	 */
	getShaderLocations () {

		// Get the storage locations of uniform attributes

		this.program.a_Position = this.gl.getAttribLocation(this.program, "a_Position");
		this.program.a_Normal = this.gl.getAttribLocation(this.program, "a_Normal");
		this.program.a_Color = this.gl.getAttribLocation(this.program, "a_Color");
		this.program.a_TexCoords = this.gl.getAttribLocation(this.program, "a_TexCoords");
		this.program.u_ModelMatrix = this.gl.getUniformLocation(this.program, "u_ModelMatrix");
		this.program.u_NormalMatrix = this.gl.getUniformLocation(this.program,"u_NormalMatrix");
		this.program.u_VPMatrix = this.gl.getUniformLocation(this.program,"u_VPMatrix");
		this.program.u_LightColor = this.gl.getUniformLocation(this.program, "u_LightColor[0]");
		this.program.u_LampColor = this.gl.getUniformLocation(this.program, "u_LightColor[1]");
		this.program.u_LightPosition = this.gl.getUniformLocation(this.program, "u_LightPosition[0]");
		this.program.u_LampPosition = this.gl.getUniformLocation(this.program, "u_LightPosition[1]");
		this.program.u_AmbientLight = this.gl.getUniformLocation(this.program, "u_AmbientLight");
		this.program.u_whichNormal = this.gl.getUniformLocation(this.program, "u_WhichNormal");

		// Trigger using lighting or not
		this.program.u_isLighting = this.gl.getUniformLocation(this.gl.program, "u_isLighting");

		if (!this.program.u_VPMatrix) {

			console.log("Failed to Get the storage locations of u_ViewProjMatrix,");
			return;

		}

		if (!this.program.u_LightPosition) {

			console.log("Failed to Get the storage locations of u_lightPosition 0");
			return;

		}
		if (!this.program.u_LampPosition) {

			console.log("Failed to Get the storage locations of u_lightPosition 1");
			return;

		}
		this.program.u_Sampler = this.gl.getUniformLocation(this.program, "u_Sampler");
		if (!this.program.u_Sampler) {

			console.log("Failed to get the storage location of u_Sampler");
			return false;

		}
		this.program.u_UseTextures = this.gl.getUniformLocation(this.program, "u_UseTextures");
		if (!this.program.u_UseTextures) {

			console.log("Failed to get the storage location for texture map enable flag");
			return;

		}
		this.program.u_UseToonShading = this.gl.getUniformLocation(this.program, "u_UseToonShading");
		if (!this.program.u_UseToonShading) {

			console.log("Failed to get the storage location for toon shading flag");
			return;

		}
		this.ToonShading = false;
		this.gl.uniform1i(this.program.u_UseToonShading, this.ToonShading);

		this.program.u_UseNormalMap = this.gl.getUniformLocation(this.program, "u_UseNormalMap");
		if (!this.program.u_UseNormalMap) {

			console.log("Failed to get the storage location for normal map flag");
			return;

		}
		this.program.u_normalTextureSampler = this.gl.getUniformLocation(this.program, "u_normalTextureSampler");
		if (!this.program.u_normalTextureSampler) {

			console.log("Failed to get the storage location for normal map sampler");
			return;

		}

		this.program.u_IsEmissive = this.gl.getUniformLocation(this.program, "u_IsEmissive");
		if (!this.program.u_IsEmissive) {

			console.log("Failed to get the storage location for emissive texture flag");
			return;

		}
		// Initialise ambient light to be low to emphasise the flickering light - on click of L
		this.gl.uniform3f(this.program.u_AmbientLight,0.05, 0.05, 0.05);


		// Set default lighting boolean and position
		this.lightPosition = new Vector3([0,10,0]);
		this.gl.uniform3f(this.program.u_LightPosition, this.lightPosition.elements[0],this.lightPosition.elements[1], this.lightPosition.elements[2]);
		this.gl.uniform1i(this.program.u_isLighting, true); // Will apply lighting
		this.gl.uniform1i(this.program.u_whichNormal, false);

	}

	/**
	 * Push a new model into the array of models present in the Scene
	 * @param {String} name Name of the object - if primitive == 0, then this needs to be the same as the endpoint for the obj file
	 * @param {Number} primitive when 1 object is based on default cube, when 0 the object requests an obj, when 2, the object has no mesh, only a modelmatrix and Transforms
	 * @param {Texture} texture A texture object for the model - can be changed after instantiation
	 * @param {Vector3} pos The starting positon of the object
	 * @param {Vector3} scale Starting scale of the object
	 * @returns {Model} Returns the model instantiated
	 */
	newModel (name,primitive,texture, pos, scale) {

		let model = new Model({"filename":name,"gl":this.gl,"program":this.program, "pos": pos, "scale":scale,"primitive": primitive,"texture":texture});

		this.models.push(model);
		return model;

	}
	/**
	 * Push a new texture into the array of textures present in the Scene
	 * @param {String} name Name of the texture
	 * @param {Number} type Type of texture - 0 for regular - 1 for normal map - 2 for emissive (not affected by lighting)
	 * @returns {Texture} Returns the texture instantiated
	 */
	newTexture (name,type) {


		let text = new Texture(name,this.gl,this.textures.length,type);
		this.textures.push(text);
		return text;

	}
	/**
	 * Runs the draw function every frame
	 * This binds the buffers for every object and draws its corresponding elements
	 * The default cube requires a different type to that used by the obj
	 * @returns {null} No return value for function
	 */
	draw () {

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		for (let i = 0;i < this.models.length;i++) {

			if (this.models[i].drawingInfo) {

				this.models[i].bindBuffers(this.gl,this.program);
				if (this.models[i].primitive == 1) {

					this.gl.drawElements(this.gl.TRIANGLES, this.models[i].drawingInfo.indices.length, this.gl.UNSIGNED_BYTE, 0);

				}
				else{

					this.gl.drawElements(this.gl.TRIANGLES, this.models[i].drawingInfo.indices.length, this.gl.UNSIGNED_SHORT, 0);

				}
				this.gl.uniform1i(this.program.u_UseTextures, false);


			}

		}
		// updates the new light position and light colour to the shader program
		this.gl.uniform3f(this.program.u_LightPosition, this.lightPosition.elements[0],this.lightPosition.elements[1], this.lightPosition.elements[2]);
		// this.gl.uniform3f(this.program.u_LampPosition, this.lampPosition.elements[0],this.lampPosition.elements[1], this.lampPosition.elements[2]);

		this.gl.uniform3f(this.program.u_LightColor, 1 * this.lightScalar, 1 * this.lightScalar, 1 * this.lightScalar);

	}
	/**
	 * Updates the position/ rotation of the camera based on the provided key presses
	 * Also updates the VP matrix where appropriate
	 * @param {Number} deltaTime The time elapsed since the function was last run
	 * @returns {null} No value is returned
	 */
	updateCamera (deltaTime) {

		this.rate = deltaTime;
		let temp;
		if (keypressed["37"] == true) {

			// "left arrow pressed"
			// rotate left
			this.eye.y += this.rate;

		}
		if(keypressed["38"] == true) {

			// "up arrow clicked"
			// rotate up
			temp = this.eye.x + this.rate;
			if (temp > 1.1) {

				this.eye.x = 1.1;

			}
			else{

				this.eye.x = temp;

			}

		}
		if (keypressed["39"] == true) {

			// "right arrow clicked"
			// rotate right
			this.eye.y -= this.rate;

		}
		if (keypressed["40"] == true) {

			// "down arrow clicked"
			// rotate down

			temp = this.eye.x - this.rate;
			// if (temp<-0.35){
			// 	this.eye.x = -0.35;
			// }
			if (temp < -0.5) {

				this.eye.x = -0.5;

			}
			else{

				this.eye.x = temp;

			}

		}
		if (keypressed["87"] == true) {

			// w clicked
			// move closer to the center
			temp = this.depth + this.rate * 10;
			if (temp > -4) {

				this.depth = -4;

			}
			else{

				this.depth = temp;

			}

		}
		if (keypressed["83"] == true) {

			// s clicked
			// move further away from center
			temp = this.depth - this.rate * 10;
			if (temp < -45) {

				this.depth = -45;

			}
			else{

				this.depth = temp;

			}

		}

		// rotate and translate the view matrix appropriately
		this.viewMatrix = new Matrix4().setIdentity();

		mat4.translate(this.viewMatrix.elements,this.viewMatrix.elements, vec3.fromValues(0,0,this.depth));
		mat4.rotateX(this.viewMatrix.elements,this.viewMatrix.elements, this.eye.x);
		mat4.rotateY(this.viewMatrix.elements,this.viewMatrix.elements, this.eye.y);

		this.VPMatrix.set(this.projMatrix).multiply(this.viewMatrix);

		// Pass the model, view, and projection matrix to the uniform variable respectively
		this.gl.uniformMatrix4fv(this.program.u_VPMatrix, false, this.VPMatrix.elements);

	}

}


class Model {

	/**
	 * Instantiates a new model/ object
	 * @param {String} filename Filename provided if looking for obj, else can be unique for object
	 * @param {WebGLContext} gl The gl element in the html page
	 * @param {program} program The current program being used to render the scene
	 * @param {Vector3} pos The starting position of an object
	 * @param {Vectro3} scale The starting scale of an object
	 * @param {Vector3} rot The starting rotation of an object
	 * @param {Number} primitive The integer used when When 1 object is based on default cube,
	 * 							when 0 the object requests an obj, when 2, the object has no mesh, only a modelmatrix and Transforms
	 */
	constructor ({filename,gl,program, pos, scale, rot, primitive}) {

		this.name = filename;

		this.textures = [];
		this.activeTexture = 0;
		// Initialise coordinate transformation matrices
		this.modelMatrix = new Matrix4();
		this.position = new Vector3([0,0,0]);
		this.scale = new Vector3([1,1,1]);
		this.rotation = new Vector3([0,0,0]);

		// 0 for non primitive and will request for obj with given filename
		// 1 for primitive ie cube stored in this file
		// 2 for empty object for parenting
		this.primitive = primitive;
		if (this.primitive < 2) {

			// for every object with a mesh init buffers and generate starting normal matrix
			this.normalMatrix = new Matrix4();
			this.initVertexBuffers(gl,program);
			if (this.primitive == 0) {

				// if required, read the obj
				readOBJFile(this.name,gl,program,this,1,0);

			}
			else{

				// else use default cube
				this.initCube();

			}

		}
		if (rot) {

			this.updateRot(rot);

		}
		if (pos) {

			this.updatePos(pos);

		}
		if (scale) {

			this.updateScale(scale);

		}

		this.normalTexture = undefined;

		this.children = [];
		this.dampening = false;

	}
	/**
	 * @param {Model} model The model to push into the children array - to produce heirarchy
	 * @returns {null} No return value
	 */
	addChild (model) {

		this.children.push(model);

	}
	/**
	 * Iterates through each child, resets its model matrix based on Transforms
	 * Multiplies its model matrix by its parent's model matrix
	 * Then recursively updates that objects children
	 * @returns {null} No return value
	 */
	updateChildren () {

		// this doesn't fully work
		for (let i = 0;i < this.children.length;i++) {


			// this.children[i].modelMatrix.elements = mat4.multiply(this.children[i].modelMatrix.elements,this.modelMatrix.elements,this.children[i].modelMatrix.elements)
			this.children[i].updateModelMatrix();
			this.children[i].modelMatrix.elements = mat4.multiply(this.children[i].modelMatrix.elements,this.modelMatrix.elements,this.children[i].modelMatrix.elements);

			this.children[i].updateChildren();


		}

	}
	/**
	 * Updates the objects scale, then updates the objects model matrix by the Vector3 given
	 * @param {Vector3} scale The scale to adjust the object by
	 * @returns {null} No return value
	 */
	updateScale (scale) {

		this.scale.elements[0] *= scale.elements[0];
		this.scale.elements[1] *= scale.elements[1];
		this.scale.elements[2] *= scale.elements[2];
		this.updateModelMatrix();
		this.updateChildren();

	}
	/**
	 * Updates the objects position, then updates the objects model matrix by the Vector3 given
	 * @param {Vector3} pos The position to translate the object by
	 * @returns {null} No return value
	 */
	updatePos (pos) {

		this.position.elements[0] += pos.elements[0];
		this.position.elements[1] += pos.elements[1];
		this.position.elements[2] += pos.elements[2];
		this.updateModelMatrix();
		this.updateChildren();

	}
	/**
	 * Updates the objects rotation, then updates the objects model matrix by the Vector3 given
	 * @param {Vector3} rot The difference in rotation to the current rotation
	 * @returns {null} No return value
	 */
	updateRot (rot) {

		this.rotation.elements[0] += rot.elements[0];
		this.rotation.elements[1] += rot.elements[1];
		this.rotation.elements[2] += rot.elements[2];
		this.updateModelMatrix();
		this.updateChildren();

	}
	/**
	 * Resets the model matrix to the identity matrix
	 * Then translates, scales and rotates the object based on the objects Transform values
	 * @returns {null} No return value
	 */
	updateModelMatrix () {

		this.modelMatrix = this.modelMatrix.setIdentity();


		this.modelMatrix.setRotate(this.rotation.elements[1],0,1,0);
		this.modelMatrix.rotate(this.rotation.elements[0],1,0,0);
		this.modelMatrix.rotate(this.rotation.elements[2],0,0,1);


		this.modelMatrix.translate(this.position.elements[0],this.position.elements[1],this.position.elements[2]);


		this.modelMatrix.scale(this.scale.elements[0],this.scale.elements[1],this.scale.elements[2]);


		// this.modelMatrix.rotate(this.rotation.elements[1],0,1,0);
		// this.modelMatrix.rotate(this.rotation.elements[0],1,0,0);
		// this.modelMatrix.rotate(this.rotation.elements[2],0,0,1);

	}
	/**
	 * Outputs the objects current Transforms to the console
	 * @returns {null} No return value
	 */
	printTransform () {

		console.log(this.name);
		console.log("Position:");
		console.log(this.position);
		console.log("Scale:");
		console.log(this.scale);
		console.log("Rotation:");
		console.log(this.rotation);

	}
	/**
	 * Initialises the array buffers for each object, needs to occur every frame
	 * @param {WebGLContext} gl The gl element in the html page
	 * @param {ShaderLocation} a_attribute The attribute to initiate a buffer for
	 * @param {Number} num The size of each element in the buffer
	 * @param {DataType} type The data type for the buffer
	 * @returns {null} No return value
	 */
	createEmptyArrayBuffer (gl, a_attribute, num, type) {

		let buffer = gl.createBuffer();
		if (!buffer) {

			console.log("Failed to create the buffer object");
			return null;

		}
		gl.bindBuffer(gl.ARRAY_BUFFER,buffer);

		gl.vertexAttribPointer(a_attribute,num,type,false,0,0);
		gl.enableVertexAttribArray(a_attribute);
		return buffer;

	}
	/**
	 * Initialises object buffers for position, normal, colour,indices and texture coordinates
	 * @param {WebGLContext} gl The gl element in the html page
	 * @param {program} program The current program being used to render the scene
	 * @returns {null} No return value
	 */
	initVertexBuffers (gl,program) {

		this.vertexBuffer = this.createEmptyArrayBuffer(gl,program.a_Position,3,gl.FLOAT);
		this.normalBuffer = this.createEmptyArrayBuffer(gl,program.a_Normal,3,gl.FLOAT);
		if (this.primitive == 1) {

			this.colourBuffer = this.createEmptyArrayBuffer(gl,program.a_Color,3,gl.FLOAT);

		}
		else{

			this.colourBuffer = this.createEmptyArrayBuffer(gl,program.a_Color,4,gl.FLOAT);

		}

		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		if (this.drawingInfo) {

			if (typeof (this.drawingInfo.textCoords) != undefined) {

				this.texCoordsBuffer =  this.createEmptyArrayBuffer(gl,program.a_TexCoords,2,gl.FLOAT);

			}

		}

	}

	/**
	 * First initialises the buffers for the object
	 * Then binds each attribute to the buffer and then draws the elements (after this function finishes - in Scene.draw())
	 * @param {WebGLContext} gl The gl element in the html page
	 * @param {program} program The current program being used to render the scene
	 * @returns {null} No return value
	 */
	bindBuffers (gl,program) {

		// get drawing info
		// Acquire the vertex coordinates and colors from OBJ file


		this.initVertexBuffers(gl,program);

		if (this.textures[this.activeTexture]) {

			if (this.textures[this.activeTexture].loaded) {

				this.textures[this.activeTexture].bindTexture(gl,program);

			}

		}
		else{

			// Enable texture mapping
			gl.uniform1i(program.u_UseTextures, false);

		}
		if (this.normalTexture) {

			if (this.normalTexture.loaded) {

				this.normalTexture.bindTexture(gl,program);

			}

		}

		// Write data into the buffer object
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.drawingInfo.vertices, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.drawingInfo.normals, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.drawingInfo.colours, gl.STATIC_DRAW);

		// Write the indices to the buffer object
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.drawingInfo.indices, gl.STATIC_DRAW);

		if (typeof (this.drawingInfo.textCoords) != undefined) {

			gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.drawingInfo.textCoords, gl.STATIC_DRAW);

		}

		this.normalMatrix.setInverseOf(this.modelMatrix);
		this.normalMatrix.transpose();

		gl.uniformMatrix4fv(program.u_NormalMatrix, false, this.normalMatrix.elements);

		gl.uniformMatrix4fv(program.u_ModelMatrix, false, this.modelMatrix.elements);

	}
	/**
	 * Moves through the textures available for the object in a cyclic manner
	 * @returns {null} No return value
	 */
	changeTexture () {

		this.activeTexture = (this.activeTexture + 1) % this.textures.length;

	}
	/**
	 * Initialises cube primitive drawing info data
	 * @returns {DrawingInfo} Containing the drawing info for the primitive cube
	 */
	initCube () {

		// Create a cube
		//    v6----- v5
		//   /|      /|
		//  v1------v0|
		//  | |     | |
		//  | |v7---|-|v4
		//  |/      |/
		//  v2------v3

		let vertices = new Float32Array([   // Coordinates
			0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
			0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
			0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
			-0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
			-0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
			0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
		]);
		for (let i = 0;i < vertices.length;i++) {

			vertices[i] *= 2;

		}


		let colors = new Float32Array([    // Colors
			1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,      // v0-v1-v2-v3 front
			1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,      // v0-v3-v4-v5 right
			1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,      // v0-v5-v6-v1 up
			1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,      // v1-v6-v7-v2 left
			1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,      // v7-v4-v3-v2 down
			1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1       // v4-v7-v6-v5 back
		]);

		let normals = new Float32Array([    // Normal
			0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
			1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
			0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
			-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
			0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
			0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
		]);

		// Texture Coordinates
		let texCoords = new Float32Array([
			1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
			0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
			1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
			1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
			0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
			0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
		]);

		// Indices of the vertices
		let indices = new Uint8Array([
			0, 1, 2,   0, 2, 3,    // front
			4, 5, 6,   4, 6, 7,    // right
			8, 9,10,   8,10,11,    // up
			12,13,14,  12,14,15,    // left
			16,17,18,  16,18,19,    // down
			20,21,22,  20,22,23     // back
		]);

		this.drawingInfo = new DrawingInfo(vertices,normals,colors,indices,texCoords);

	}

}

// #region obj importing

/**
 * Runs a HTTP GET request to my express server
 * When the file has arrived, parse the object file
 * When the object file has been parsed,
 * set the objects drawing info to that found in the obj
 * @param {String} fileName Endpoint for obj to load
 * @param {WebGLContext} gl The gl element in the html page
 * @param {program} program The current program being used to render the scene
 * @param {Model} model The model object to link with the requested obj file
 * @param {Number} scale The starting scale of an object
 * @param {Boolean} reverse Whether the object is inverted - flipping all normals
 * @returns {null} No return value
 */
function readOBJFile (fileName, gl,program, model, scale, reverse) {

	let request = new XMLHttpRequest();
	request.onreadystatechange = function () {

		if (request.readyState === 4 && request.status !== 404) {

			onReadOBJFile(request.responseText, fileName, scale, reverse)
				.then(function (objDoc) {

					model.objdoc = objDoc;
					model.drawingInfo = model.objdoc.getDrawingInfo();
					console.log("loaded");
					// model.onReadComplete(gl,program);
					// model.draw(gl,program);

				}
				);

		}

	};
	request.open("GET","./assets/Models/"+fileName+".obj",true);
	request.send();

}

/**
 * Async function starting the parse of the file
 * @param {String} fileString Contents of the obj file
 * @param {String} fileName Name of the obj file
 * @param {Number} scale Scale of the obj
 * @param {Boolean} reverse Whether the object is inverted - flipping all normals
 * @returns {objDoc} The object data found from the obj file or NULL if failure occurs
 */
async function onReadOBJFile (fileString, fileName, scale, reverse) {

	try{

		let objdoc = new objDoc(fileName);
		let result = await objdoc.parse(fileString, scale, reverse);
		if (!result) {

			console.log("OBJ file parsing error.");
			return;

		}
		return objdoc;

	}
	catch(e) {

		console.log(e);

	}

}


class objDoc {

	/**
	 * Initialises the objDoc arrays
	 * @param {String} fileName The name of the file's obj
	 */
	constructor (fileName) {

		this.fileName = fileName;
		this.mtls = Array(0);
		this.vertices = Array(0);
		this.objects = Array(0);
		this.normals = Array(0);
		this.vertexTextures = Array(0);

	}
	/**
	 *
	 * @param {String} fileString Contents of the obj
	 * @param {Number} scale Scale to adjust model by
	 * @param {Boolean} reverseNormal Whether to reverse the normals
	 * @returns {Boolean} On success of parsing
	 */
	parse (fileString, scale, reverseNormal) {

		let lines = fileString.split("\n");
		lines.push(null);
		let index =  0;
		let currentObject = null;
		let line;

		let objectName;
		let object;

		let x;
		let y;
		let z;
		let vertex;

		let u;
		let v;
		let textCoord;

		let normal;

		let face;

		// loop through line adding found attributes to this.attribute
		while ((line = lines[index++]) != null) {

			let words = line.split(" ");
			if (words[0] == null || words[0] == "#") {

				// skip comments and blank lines
				continue;

			}
			switch(words[0]) {

			// case "#":
			// 	// skip comments
			// 	continue;
			case "mtllib":
				// read material chunk
				break;
			case "o":

				for (let i = 1;i < words.length; i++) {

					objectName = objectName + words[i];

				}
				// new object found - if obj contains multiple objects
				object = new OBJObject(objectName);
				this.objects.push(object);
				currentObject = object;
				continue;
			case "v":
				// adds a vertex and its coordinates
				x = words[1] * scale;
				y = words[2] * scale;
				z = words[3] * scale;
				vertex = new Vertex (x,y,z);
				this.vertices.push(vertex);
				continue;
			case "vt":
				// add vertex texture coordinates
				u = words[1];
				v = words[2];
				// ignore depth
				textCoord = new VertexTexture (u,v);
				this.vertexTextures.push(textCoord);
				continue;
			case "vn":
				// vertex normals
				x = words[1];
				y = words[2];
				z = words[3];
				normal = new Normal (x,y,z);
				this.normals.push(normal);
				continue;
			case "f":
				// new face
				face = this.parseFace(words,reverseNormal);
				currentObject.addFace(face);
				continue;

			}

		}
		return true;

	}
	/**
	 * Generate a face object based on the attributes for the line
	 * @param {Array} words The string of the line the data is found on
	 * @param {Boolean} reverse Whether to reverse the normals
	 * @returns {Face} returns the generated face object
	 */
	parseFace (words,reverse) {

		let face = new Face();
		// loop through given indices for the face
		// format v/vt/vn
		for (let i = 1; i < words.length;i++) {

			let word = words[i];
			if(word == null) break;

			let subWords = word.split("/");
			if(subWords.length >= 1) {

				let vi = parseInt(subWords[0]) - 1;
				face.vIndices.push(vi);

			}
			if(subWords.length >= 3) {

				let ni = parseInt(subWords[2]) - 1;
				face.nIndices.push(ni);

			}else{

				face.nIndices.push(-1);

			}
			if (subWords[1].length > 0) {

				let ti = parseInt(subWords[1]) - 1;
				face.texIndices.push(ti);

			}

		}

		// calc normal
		let v0 = [
			this.vertices[face.vIndices[0]].x,
			this.vertices[face.vIndices[0]].y,
			this.vertices[face.vIndices[0]].z];
		let v1 = [
			this.vertices[face.vIndices[1]].x,
			this.vertices[face.vIndices[1]].y,
			this.vertices[face.vIndices[1]].z];
		let v2 = [
			this.vertices[face.vIndices[2]].x,
			this.vertices[face.vIndices[2]].y,
			this.vertices[face.vIndices[2]].z];

		// calculate surface nornal and set to normal
		let normal = calcNormal(v0, v1, v2);
		// check if the normal was found
		if (normal == null) {

			if (face.vIndices.length >= 4) {

				// if the surface is square calculate the normal using another combination of three points
				let v3 = [
					this.vertices[face.vIndices[3]].x,
					this.vertices[face.vIndices[3]].y,
					this.vertices[face.vIndices[3]].z];
				normal = calcNormal(v1, v2, v3);

			}
			if(normal == null) {

				// as the normal still wasnt found use the y-dir normal
				normal = [0.0, 1.0, 0.0];

			}

		}
		if(reverse) {

			normal[0] = -normal[0];
			normal[1] = -normal[1];
			normal[2] = -normal[2];

		}
		face.normal = new Normal(normal[0], normal[1], normal[2]);

		// Devide to triangles if face contains over 3 points.

		if(face.vIndices.length > 3) {

			let n = face.vIndices.length - 2;
			let newVIndices = new Array(n * 3);
			let newNIndices = new Array(n * 3);
			let newVTIndices = new Array(n * 3);
			for(let i = 0; i < n; i++) {

				newVIndices[i * 3 + 0] = face.vIndices[0];
				newVIndices[i * 3 + 1] = face.vIndices[i + 1];
				newVIndices[i * 3 + 2] = face.vIndices[i + 2];
				newNIndices[i * 3 + 0] = face.nIndices[0];
				newNIndices[i * 3 + 1] = face.nIndices[i + 1];
				newNIndices[i * 3 + 2] = face.nIndices[i + 2];
				// added Vertex texture coordinate devide for faces over 3 points
				newVTIndices[i * 3 + 0] = face.texIndices[0];
				newVTIndices[i * 3 + 1] = face.texIndices[i + 1];
				newVTIndices[i * 3 + 2] = face.texIndices[i + 2];

			}
			face.vIndices = newVIndices;
			face.nIndices = newNIndices;
			// push the new indices
			face.texIndices = newVTIndices;

		}
		face.numIndices = face.vIndices.length;

		return face;

	}
	getDrawingInfo () {

		// Create an arrays for vertex coordinates, normals, colors, and indices
		let numIndices = 0;
		for(let i = 0; i < this.objects.length; i++) {

			numIndices += this.objects[i].numIndices;

		}


		let numVertices = numIndices;
		let vertices = new Float32Array(numVertices * 3);
		let textCoords = new Float32Array(numVertices * 2);
		let normals = new Float32Array(numVertices * 3);
		let colors = new Float32Array(numVertices * 4);
		let indices = new Uint16Array(numIndices);

		// Set vertex, normal and color
		let index_indices = 0;
		for(let i = 0; i < this.objects.length; i++) {

			let object = this.objects[i];
			for(let j = 0; j < object.faces.length; j++) {

				let face = object.faces[j];
				let color = this.findColor(face.materialName);
				let faceNormal = face.normal;
				for(let k = 0; k < face.vIndices.length; k++) {

					// Set index
					indices[index_indices] = index_indices;
					// Copy vertex
					let vIdx = face.vIndices[k];
					let vertex = this.vertices[vIdx];

					vertices[index_indices * 3 + 0] = vertex.x;
					vertices[index_indices * 3 + 1] = vertex.y;
					vertices[index_indices * 3 + 2] = vertex.z;

					// Sort vertext texture coordinates out for each vertex
					let tIdx = face.texIndices[k];
					let vertexText = this.vertexTextures[tIdx];
					textCoords[index_indices * 2 + 0] = vertexText.U;
					textCoords[index_indices * 2 + 1] = vertexText.V;
					// Copy color
					colors[index_indices * 4 + 0] = color.r;
					colors[index_indices * 4 + 1] = color.g;
					colors[index_indices * 4 + 2] = color.b;
					colors[index_indices * 4 + 3] = color.a;
					// Copy normal
					let nIdx = face.nIndices[k];
					if(nIdx >= 0) {

						let normal = this.normals[nIdx];
						normals[index_indices * 3 + 0] = normal.x;
						normals[index_indices * 3 + 1] = normal.y;
						normals[index_indices * 3 + 2] = normal.z;

					}else{

						normals[index_indices * 3 + 0] = faceNormal.x;
						normals[index_indices * 3 + 1] = faceNormal.y;
						normals[index_indices * 3 + 2] = faceNormal.z;

					}
					index_indices ++;

				}

			}

		}

		return new DrawingInfo(vertices, normals, colors, indices, textCoords);

	}
	/**
	 * Used for material parsing
	 * Therefore not used in this project
	 * Gives the object a default colour when no material is provided
	 * @param {String} name Name of the material
	 * @returns {Colour} returns a colour object to colour the model with
	 */
	findColor (name) {

		if (name) {

			for(let i = 0; i < this.mtls.length; i++) {

				for(let j = 0; j < this.mtls[i].materials.length; j++) {

					if(this.mtls[i].materials[j].name == name) {

						return(this.mtls[i].materials[j].color);

					}

				}

			}
			return(new Colour(0.8, 0.8, 0.8, 1));

		}
		else{

			return(new Colour(0.8, 0.8, 0.8, 1));

		}

	}

}

// #endregion obj import

class Texture {

	/**
	 * Initialises the texture Image, and the source endpoint
	 * @param {String} name name of the texture - the endpoint on the server to get the object
	 * @param {WebGLContext} gl The gl element in the html page
	 * @param {Number} pointer The numerical value of the texture for look up in memory
	 * @param {Number} type Type of texture - 0 for regular, 1 for normal map and 2 for emissive (is not affected by lighting)
	 */
	constructor (name,gl,pointer,type) {

		this.name = name;
		this.loaded = false;
		this.pointer = pointer;
		this.textureBuffer = gl.createTexture();
		this.textureBuffer.img = new Image();
		this.textureBuffer.img.src = "./assets/Textures/" + this.name;
		if (type == 1) {

			this.normal = true;
			this.emissive = false;

		}
		else if (type == 2) {

			this.emissive = true;
			this.normal = false;

		}
		else{

			this.emissive = false;
			this.normal = false;

		}

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

		// Enable texture unit0
		gl.activeTexture(gl.TEXTURE0 + this.pointer);

		// Bind the texture object to the target

		gl.bindTexture(gl.TEXTURE_2D, this.textureBuffer);
		// Set the texture image

		// console.log(this.textureBuffer.img.src + "\t"+this.textureBuffer.img.height+"\t"+this.textureBuffer.img.width)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([18, 33, 54,255]));

		let callbackObj = this;
		this.textureBuffer.img.onload = function () {

			callbackObj.onTextureLoad(gl);

		};

	}
	/**
	 * Initiates the texture buffer for the current texture
	 * @param {WebGLContext} gl The gl element in the html page
	 * @returns {null} No return value
	 */
	onTextureLoad (gl) {


		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

		// Enable texture unit0
		gl.activeTexture(gl.TEXTURE0 + this.pointer);

		// Bind the texture object to the target

		gl.bindTexture(gl.TEXTURE_2D, this.textureBuffer);
		// Set the texture image

		// console.log(this.textureBuffer.img.src + "\t"+this.textureBuffer.img.height+"\t"+this.textureBuffer.img.width)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.textureBuffer.img);

		if (this.name != "ceramic" && isPower2(this.textureBuffer.img.width) && isPower2(this.textureBuffer.img.height)) {

			gl.generateMipmap(gl.TEXTURE_2D);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		}
		else if (this.textureBuffer.img.width == this.textureBuffer.img.height) {

			// console.log("square"+this.name)

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		}
		else{

			console.log("clamp\t" + this.name + "\t" + this.textureBuffer.img.height + "\t" + this.textureBuffer.img.width);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		}


		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		this.loaded = true;

	}
	/**
	 * Binds the texture to the buffers and sorts out clamping/ mipmap generation respectively
	 * @param {WebGLContext} gl The gl element in the html page
	 * @param {program} program The current program being used to render the scene
	 * @returns {null} No return value
	 */
	bindTexture (gl,program) {

		if (this.loaded) {

			if (this.normal) {

				// Assign normalSampler to pointer
				gl.uniform1i(program.u_normalTextureSampler, this.pointer);
				gl.uniform1i(program.u_UseNormalMap, true);
				gl.uniform1i(program.u_IsEmissive, false);

			}
			else if (this.emissive) {

				// Assign emissiveSampler to pointer
				gl.uniform1i(program.u_Sampler, this.pointer);
				gl.uniform1i(program.u_IsEmissive, true);
				gl.uniform1i(program.u_UseNormalMap, false);

			}
			else{

				// Assign u_Sampler to pointer
				gl.uniform1i(program.u_Sampler, this.pointer);
				gl.uniform1i(program.u_UseNormalMap, false);
				gl.uniform1i(program.u_IsEmissive, false);

			}


			// Enable texture mapping
			gl.uniform1i(program.u_UseTextures, true);

		}
		else{

			// Disable texture mapping
			gl.uniform1i(program.u_UseTextures, false);

		}

	}


}

// #region basic classes and common function
class Vertex {

	// vertex class with usual attributes
	constructor (x,y,z) {

		this.x = x;
		this.y = y;
		this.z = z;

	}

}
class VertexTexture {

	// vertex texture coordinate class with usual attributes
	constructor (U,V) {

		this.U = U;
		this.V = V;

	}

}
class Eye {

	// The position of the camera
	constructor (x,y,z) {

		this.x = x;
		this.y = y;
		this.z = z;

	}

}
class Normal {

	// normal class with usual attributes
	constructor (x,y,z) {

		this.x = x;
		this.y = y;
		this.z = z;

	}

}
class Colour {

	// colour class with usual attributes
	constructor (r,g,b,a) {

		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;

	}

}
class Face {

	// face class for each line in obj
	// takes and parses the indices for a given face
	constructor () {

		this.vIndices = new Array(0);
		this.nIndices = new Array(0);
		this.texIndices = new Array(0);

	}

}
class OBJObject {

	// The obj class containing faces from Face
	constructor (name) {

		this.name = name;
		this.faces = new Array(0);
		this.numIndices = 0;

	}
	addFace (face) {

		this.faces.push(face);
		this.numIndices += face.numIndices;

	}

}

class DrawingInfo {

	// Geometry drawing info - can be used to make new instances of model without pinging server
	constructor (vertices,normals,colours,indices,textCoords) {

		this.vertices = vertices;
		this.normals = normals;
		this.colours = colours;
		this.indices = indices;
		this.textCoords = textCoords;

	}

}
/**
 * Is the given number a power of two
 * used for mipmap generation
 * @param {Number} num Number to query
 * @returns {Boolean} Whether number is a power of two or not
 */
function isPower2 (num) {

	if ((num & (num - 1)) == 0) {

		return true;

	}
	return false;

}
/**
 * NOTE: function from textbook
 * Uses cross product to find the normal of the 2 vectors
 * vector 0 is p0-p1 vector 1 is p1-p2 vector
 * @param {*} p0 position 0
 * @param {*} p1 position 1
 * @param {*} p2 position 2
 * @returns {Vector3} a normalised normal of the 3 points provided
 */
function calcNormal (p0, p1, p2) {

	// v0: a vector from p1 to p0, v1; a vector from p1 to p2
	let v0 = new Float32Array(3);
	let v1 = new Float32Array(3);
	for (let i = 0; i < 3; i++) {

		v0[i] = p0[i] - p1[i];
		v1[i] = p2[i] - p1[i];

	}

	// The cross product of v0 and v1
	let c = new Float32Array(3);
	c[0] = v0[1] * v1[2] - v0[2] * v1[1];
	c[1] = v0[2] * v1[0] - v0[0] * v1[2];
	c[2] = v0[0] * v1[1] - v0[1] * v1[0];

	// Normalize the result
	let v = new Vector3(c);
	v.normalize();
	return v.elements;

}
// #endregion basic classes and common function


let lastTime = 0;
let deltaTime;

let startLoadAnimation = false;
let ranStartAnimation = false;
let lightAnimation = false;
let cushionAnimation = false;
let chairAnimation = false;
let mugAnimation = false;
let mugTime = 0;
let mugState = 0;
let cushionTime = 0;
let chairPosition = 1;
let deltaFlash;
let lightMoveAnimation = false;
let lightTime = 0;
let chairTime = 0;
let dirX = 1;
let dirZ = 1;

/**
 * Runs animations and draw functions
 * @param {Number} currTime The current time elapsed when update is ran
 * @returns {null} `no return value
 */
function update (currTime) {

	// calculates delta time
	deltaTime = (currTime - lastTime) / 1000;

	if (!ranStartAnimation) {

		if (startLoadAnimation) {

			// moves walls down on spacebar click
			Scene1.walls.children[0].children[0].rotation.elements[0] += deltaTime * 45;
			Scene1.walls.children[0].updateModelMatrix();
			Scene1.walls.children[0].updateChildren();
			Scene1.walls.children[1].children[0].rotation.elements[0] += deltaTime * 45;
			Scene1.walls.children[1].updateModelMatrix();
			Scene1.walls.children[1].updateChildren();
			Scene1.walls.children[2].children[0].rotation.elements[0] += -deltaTime * 45;
			Scene1.walls.children[2].updateModelMatrix();
			Scene1.walls.children[2].updateChildren();
			Scene1.walls.children[3].children[0].rotation.elements[0] += -deltaTime * 45;
			Scene1.walls.children[3].updateModelMatrix();
			Scene1.walls.children[3].updateChildren();

			if (Scene1.walls.children[0].children[0].rotation.elements[0] > 90) {

				ranStartAnimation = true;

			}

		}

	}
	if (lightAnimation) {

		// flashes light when l is clicked
		deltaFlash -= deltaTime;
		if (deltaFlash < 0)
		{

			deltaFlash = Math.random();
			Scene1.lightScalar = Math.random() * (0.6) + 0.1;

		}

	}
	// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if (lightMoveAnimation) {

		// light sways when m is clicked

		// lightTime += deltaTime;
		lightTime += 0.016;
		let angle = Math.cos(2 * Math.PI * lightTime) * 4 * (-(lightTime / 10 - 1) * -(lightTime / 10 - 1) * -(lightTime / 10 - 1));
		// Scene1.fitting.children[0].rotation.elements[0] += angle;
		Scene1.fitting.children[0].rotation.elements[0] += angle / 4 * dirX;
		Scene1.fitting.children[0].children[0].rotation.elements[0] += angle / 2 * dirX;
		Scene1.fitting.children[0].children[0].children[0].rotation.elements[0] += angle * (3 / 4) * dirX;
		Scene1.fitting.children[0].rotation.elements[2] += angle / 4 * dirZ;
		Scene1.fitting.children[0].children[0].rotation.elements[2] += angle / 2 * dirZ;
		Scene1.fitting.children[0].children[0].children[0].rotation.elements[2] += angle * (3 / 4) * dirZ;
		Scene1.fitting.updateModelMatrix();
		Scene1.fitting.updateChildren();

		Scene1.lightPosition.elements[0] = Scene1.fitting.children[0].children[0].children[0].modelMatrix.elements[12];
		Scene1.lightPosition.elements[1] = Scene1.fitting.children[0].children[0].children[0].modelMatrix.elements[13] - 1;
		Scene1.lightPosition.elements[2] = Scene1.fitting.children[0].children[0].children[0].modelMatrix.elements[14];


		if (lightTime > 9.5) {

			lightMoveAnimation = false;
			lightTime = 0;
			Scene1.fitting.children[0].rotation.elements[0] = 0;
			Scene1.fitting.children[0].children[0].rotation.elements[0] = 0;
			Scene1.fitting.children[0].children[0].children[0].rotation.elements[0] = 0;
			Scene1.fitting.children[0].rotation.elements[2] = 0;
			Scene1.fitting.children[0].children[0].rotation.elements[2] = 0;
			Scene1.fitting.children[0].children[0].children[0].rotation.elements[2] = 0;
			Scene1.fitting.updateModelMatrix();
			Scene1.fitting.updateChildren();


		}

	}

	if (cushionAnimation) {

		// spin cushions and reset after 5 seconds
		// on their own axis
		cushionTime += deltaTime;
		let angle = Math.sin(2 * Math.PI * cushionTime) * 7; //* 3*  (-(cushionTime / 10 - 1) * -(cushionTime / 10 - 1) * -(cushionTime / 10 - 1));// 0.2 / (Math.exp(-cushionTime) + 0.1);

		for (let i = 0;i < Scene1.cushions.length;i++) {

			// Scene1.cushions[i].children[0].updateRot(new Vector3([angle,0,0]));
			Scene1.cushions[i].children[0].rotation.elements[0] += angle;
			Scene1.cushions[i].updateChildren();

		}


		if (cushionTime > 8) {

			cushionTime = 0;
			cushionAnimation = false;

			for (let i = 0;i < Scene1.cushions.length;i++) {

				// let temp = Scene1.cushions[i].rotation;
				Scene1.cushions[i].children[0].rotation.elements[0] = 0;
				Scene1.cushions[i].updateChildren();

			}

		}

	}

	if (chairAnimation) {

		// move chair between two points
		if (chairPosition == 2) {

			chairTime +=  deltaTime;

			Scene1.chair.updatePos(new Vector3([0,0,chairTime]));
			if (Scene1.chair.position.elements[2] > -5.35) {

				chairTime = 0;
				Scene1.chair.position.elements[2] = -5.4;
				chairPosition = 1;
				chairAnimation = false;

			}

		}
		if (chairPosition == 1) {

			chairTime -=  deltaTime;
			Scene1.chair.updatePos(new Vector3([0,0,chairTime]));

			if (Scene1.chair.position.elements[2] < -7.4) {

				chairTime = 0;
				Scene1.chair.position.elements[2] = -7.4;
				chairPosition = 2;
				chairAnimation = false;

			}

		}

	}

	if (mugAnimation) {

		// mug animation when g or html button is pressed
		// first moves mug uptowards invisible human, then tilts mug, waits and reverses animation.

		if (mugState == 0) {

			Scene1.mug.children[0].rotation.elements[2] -= deltaTime * 35;

			if (Scene1.mug.children[0].rotation.elements[2] < -70) {

				mugState = 1;

			}
			if (Scene1.mug.children[0].children[0].rotation.elements[1] > 85) {

				Scene1.mug.children[0].children[0].rotation.elements[1] -= deltaTime * 20;

			}

			Scene1.mug.updateModelMatrix();
			Scene1.mug.updateChildren();

		}
		else if (mugState == 1) {

			Scene1.mug.children[0].children[0].rotation.elements[0] += deltaTime * 20;
			Scene1.mug.children[0].position.elements[1] += deltaTime / 4;
			Scene1.mug.updateModelMatrix();
			Scene1.mug.updateChildren();

			if (Scene1.mug.children[0].children[0].rotation.elements[0] > 30) {

				mugState = 2;

			}

		}
		else if (mugState == 2) {

			mugTime += deltaTime;
			if (mugTime > 1.5) {

				mugState = 3;

			}

		}
		else if (mugState == 3) {

			Scene1.mug.children[0].children[0].rotation.elements[0] -= deltaTime * 20;
			Scene1.mug.children[0].position.elements[1] -= deltaTime / 4;
			Scene1.mug.updateModelMatrix();
			Scene1.mug.updateChildren();

			if (Scene1.mug.children[0].children[0].rotation.elements[0] < 0) {

				mugState = 4;
				mugTime = 0;

			}

		}

		else{

			Scene1.mug.children[0].rotation.elements[2] += deltaTime * 35;
			if (Scene1.mug.children[0].children[0].rotation.elements[1] < 120) {

				Scene1.mug.children[0].children[0].rotation.elements[1] += deltaTime * 20;

			}
			Scene1.mug.updateModelMatrix();
			Scene1.mug.updateChildren();
			if (Scene1.mug.children[0].rotation.elements[2] > 0) {

				mugState = 0;
				mugAnimation = false;
				mugTime = 0;


			}

		}

	}

	// update draw and camera movements
	Scene1.updateCamera(deltaTime);
	Scene1.draw();

	// call this function again with animation frame
	lastTime = currTime;
	window.requestAnimationFrame(update);

}

/**
 * Prints a matrix instance to the console
 * @param {Matrix4} mat	The matrix to print
 * @param {String} name	Name of the matrix
 * @param {Boolean} round Whether the elements should be rounded - to 2dp
 * @returns {null} No return value
 */
function printMatrix (mat,name,round) {	// eslint-disable-line no-unused-vars

	if (name) {

		console.log("--------------Start  " + name + "--------------");

	}
	else{

		console.log("--------------Start  mat4--------------");

	}
	if (round) {

		console.log("| " + Math.round(mat.elements[0] * 100) / 100 + ", " + Math.round(mat.elements[4] * 100) / 100 + ", " + Math.round(mat.elements[8] * 100) / 100 + ", " + Math.round(mat.elements[12] * 100) / 100 + " |");
		console.log("| " + Math.round(mat.elements[1] * 100) / 100 + ", " + Math.round(mat.elements[5] * 100) / 100 + ", " + Math.round(mat.elements[9] * 100) / 100 + ", " + Math.round(mat.elements[13] * 100) / 100 + " |");
		console.log("| " + Math.round(mat.elements[2] * 100) / 100 + ", " + Math.round(mat.elements[6] * 100) / 100 + ", " + Math.round(mat.elements[10] * 100) / 100 + ", " + Math.round(mat.elements[14] * 100) / 100 + " |");
		console.log("| " + Math.round(mat.elements[3] * 100) / 100 + ", " + Math.round(mat.elements[7] * 100) / 100 + ", " + Math.round(mat.elements[11] * 100) / 100 + ", " + Math.round(mat.elements[15] * 100) / 100 + " |");

	}
	else{

		console.log("| " + mat.elements[0] + ", " + mat.elements[4] + ", " + mat.elements[8] + ", " + mat.elements[12] + " |");
		console.log("| " + mat.elements[1] + ", " + mat.elements[5] + ", " + mat.elements[9] + ", " + mat.elements[13] + " |");
		console.log("| " + mat.elements[2] + ", " + mat.elements[6] + ", " + mat.elements[10] + ", " + mat.elements[14] + " |");
		console.log("| " + mat.elements[3] + ", " + mat.elements[7] + ", " + mat.elements[11] + ", " + mat.elements[15] + " |");

	}


	console.log("--------------END--------------");

}


let Scene1;
let keypressed = {};
/**
 * The main function ran on load
 * Gets the canvas and instantiates the scene graph
 * defines the key events
 * @returns {null} No return value
 */
function main () {	// eslint-disable-line no-unused-vars
	// if (window.screen.width < 1000){

	// 	return;
	// }
	// Retrieve <canvas> element
	let glparent = document.getElementById("glWidthParent");
	let canvas = document.getElementById("webgl");
	canvas.width = (glparent.offsetWidth);
	canvas.style.width = (glparent.offsetWidth - 28) + "px";
	canvas.style.marginTop = "10px";
	canvas.height = window.innerHeight - 280;


	// Get the rendering context for WebGL
	let gl = getWebGLContext(canvas);
	// let gl = canvas.getContext("webgl2");
	if (!gl) {

		console.log("Failed to get the rendering context for WebGL");
		return;

	}
	gl.getExtension("OES_standard_derivatives");
	gl.getExtension("EXT_shader_texture_lod");

	// Objects and scene graph
	// // #region Scene Graph

	Scene1 = new Scene(gl,canvas);

	window.addEventListener("resize", function () {


		// set new width and height of canvas
		canvas.width = (glparent.offsetWidth);
		canvas.style.width = (glparent.offsetWidth - 28) + "px";
		canvas.height = window.innerHeight - 280;

		// reset center of canvas

		Scene1.projMatrix.setPerspective(90, Scene1.canvas.width / Scene1.canvas.height, 1, 100);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	});

	// #region Textures

	let woodText = Scene1.newTexture("wood.png");
	let floorText = Scene1.newTexture("floor.jpg");
	let sofa1Text = Scene1.newTexture("sofa1.jpg");
	let sofa2Text = Scene1.newTexture("sofa2.jpg");

	let sofa2NormalText = Scene1.newTexture("sofa2Normal.jpg",1);
	let ceramic = Scene1.newTexture("mug.png");
	let shadeText = Scene1.newTexture("shade.jpg");
	let skyboxText = Scene1.newTexture("skybox.png",2);

	let TVtext1 = Scene1.newTexture("TV1.png",2);
	let TVtext2 = Scene1.newTexture("TV2.png",2);
	let TVtext3 = Scene1.newTexture("TV3.png",2);
	let TVtext4 = Scene1.newTexture("TV4.png",2);


	let wallText = Scene1.newTexture("wall.jpg");
	let wallNormalText = Scene1.newTexture("wallNormal.jpg",1);
	let tableText = Scene1.newTexture("fabric.jpg");
	let tableNormalText = Scene1.newTexture("fabricNormal.jpg",1);


	// #endregion Textures


	// #region floor light

	let lampParentParent = Scene1.newModel("lampParentParent",2);
	let lampParent = Scene1.newModel("lampParent",2);
	let base = Scene1.newModel("lampBase",0);
	let stand = Scene1.newModel("lampStand",0);
	let shade1 = Scene1.newModel("lampShade",0);
	let bulb1 = Scene1.newModel("bulb",2);

	lampParentParent.addChild(lampParent);
	lampParent.addChild(base);
	base.addChild(stand);
	stand.addChild(shade1);
	shade1.addChild(bulb1);

	bulb1.updateRot(new Vector3([180,0,0]));
	bulb1.updateScale(new Vector3([0.6,0.6,0.6]));
	bulb1.updatePos(new Vector3([0,2,0]));

	stand.updatePos(new Vector3([0,-0.5,0]));
	shade1.updateScale(new Vector3([0.3,0.3,0.3]));
	shade1.updatePos(new Vector3([0,9.9,3]));


	lampParent.updateRot(new Vector3([0,-45,0]));
	lampParentParent.updatePos(new Vector3([8.3,-2.5,-8.6]));
	lampParentParent.updateScale(new Vector3([0.9,0.8,0.9]));
	shade1.textures.push(shadeText);
	bulb1.textures.push(ceramic);
	base.textures.push(woodText);
	stand.textures.push(woodText);

	Scene1.lampPosition.elements[0] = bulb1.modelMatrix.elements[12];
	Scene1.lampPosition.elements[1] = bulb1.modelMatrix.elements[13] - 2;
	Scene1.lampPosition.elements[2] = bulb1.modelMatrix.elements[14];

	Scene1.gl.uniform3f(Scene1.program.u_LampPosition, Scene1.lampPosition.elements[0],Scene1.lampPosition.elements[1],Scene1.lampPosition.elements[2]);

	// #endregion floor light


	// #region Table
	let tableParent = Scene1.newModel("tableParent",2);
	let table = Scene1.newModel("table",0);
	table.updateRot(new Vector3([0,-90,0]));
	table.updateScale(new Vector3([2.75,7,2.5]));
	table.updatePos(new Vector3([0,-8.4,0]));
	table.textures.push(tableText);
	table.normalTexture = tableNormalText;

	tableParent.addChild(table);


	tableParent.updatePos(new Vector3([0,-0.9,0]));

	tableParent.updateScale(new Vector3([0.7,0.2,0.7]));

	let plate = Scene1.newModel("plate",0);
	plate.updateScale(new Vector3([1.1,1.1,1.1]));
	plate.updatePos(new Vector3([0.8,-0.6,0]));

	let mug = Scene1.newModel("mug",0);
	mug.updateScale(new Vector3([0.6,0.6,0.6]));
	// mug.updateScale(new Vector3([2,2,2]));

	mug.textures.push(ceramic);
	plate.textures.push(ceramic);


	let mugPivot1 = Scene1.newModel("mugPivot",2);
	let mugPivot2 = Scene1.newModel("mugPivot",2);
	mugPivot1.addChild(mugPivot2);
	mugPivot2.addChild(mug);
	Scene1.mug = mugPivot1;

	tableParent.updateScale(new Vector3([1,1,0.85]));
	tableParent.addChild(plate);
	tableParent.addChild(mugPivot1);

	mug.updateRot(new Vector3([0,120,0]));
	mugPivot2.updatePos(new Vector3([-5.5,2.15,0]));
	mugPivot1.updatePos(new Vector3([5.5,-3,-1.75]));


	// #endregion Table


	// #region Chairs
	let ChairParent = Scene1.newModel("chairParent",2);
	let chairBack = Scene1.newModel("chairSeat",0);
	let chairSeat = Scene1.newModel("chairSeat",0);
	let chairLeg = Scene1.newModel("chairLeg",0);
	chairLeg.updateScale(new Vector3([1,0.2,0.6]));
	chairBack.updateRot(new Vector3([90,0,0]));
	chairBack.updateScale(new Vector3([0.5,0.3,0.25]));
	chairBack.updatePos(new Vector3([0,-1.4,-2.4]));
	chairSeat.updateScale(new Vector3([0.5,0.7,0.15]));


	ChairParent.addChild(chairBack);
	ChairParent.addChild(chairLeg);
	ChairParent.addChild(chairSeat);

	chairSeat.textures.push(woodText);
	chairBack.textures.push(woodText);
	chairLeg.textures.push(woodText);
	ChairParent.updateScale(new Vector3([0.5,0.55,0.6]));
	ChairParent.updatePos(new Vector3([0,-1.3,-5.4]));

	let Chair2Parent = Scene1.newModel("chairParent",2);
	let chair2Back = Scene1.newModel("chairSeat",0);
	let chair2Seat = Scene1.newModel("chairSeat",0);
	let chair2Leg = Scene1.newModel("chairLeg",0);
	chair2Leg.updateScale(new Vector3([1,0.2,0.6]));
	chair2Back.updateRot(new Vector3([90,0,0]));
	chair2Back.updateScale(new Vector3([0.5,0.3,0.25]));
	chair2Back.updatePos(new Vector3([0,-1.4,-2.4]));
	chair2Seat.updateScale(new Vector3([0.5,0.7,0.15]));


	Chair2Parent.addChild(chair2Back);
	Chair2Parent.addChild(chair2Leg);
	Chair2Parent.addChild(chair2Seat);

	chair2Seat.textures.push(woodText);
	chair2Back.textures.push(woodText);
	chair2Leg.textures.push(woodText);
	Chair2Parent.updatePos(new Vector3([0,-1.3,-6]));
	Chair2Parent.updateRot(new Vector3([0,180,0]));
	Chair2Parent.updateScale(new Vector3([0.5,0.55,0.6]));

	// -5.4 to -7.5
	// #endregion


	// #region sofas

	let sofa1 = Scene1.newModel("sofa1",0);
	let cushion1 = Scene1.newModel("cushion",0);
	let cushion2 = Scene1.newModel("cushion",0);


	sofa1.updatePos(new Vector3([8.9,-2.5,1.2]));


	let sofa2 = Scene1.newModel("sofa2",0);
	let sofa2Parent = Scene1.newModel("sofa2Parent",2);
	sofa2Parent.addChild(sofa2);
	sofa2.updateRot(new Vector3([0,-30,0]));
	sofa2Parent.updatePos(new Vector3([5,-2.5,9.3]));


	let sofa3 = Scene1.newModel("sofa2",0);
	let sofa3Parent = Scene1.newModel("sofa3Parent",2);
	sofa3Parent.addChild(sofa3);
	sofa3.updateRot(new Vector3([0,30,0]));
	sofa3Parent.updatePos(new Vector3([7.5,-2.5,-5]));


	sofa1.textures.push(sofa1Text);
	sofa2.textures.push(sofa2Text);
	sofa2.normalTexture = sofa2NormalText;
	sofa3.textures.push(sofa2Text);
	sofa3.normalTexture = sofa2NormalText;

	cushion1.textures.push(shadeText);
	cushion2.textures.push(shadeText);
	cushion1.normalTexture = sofa2NormalText;
	cushion2.normalTexture = sofa2NormalText;

	let footRest = Scene1.newModel("footRest",0);
	let footRestBase = Scene1.newModel("cube",1);
	footRestBase.textures.push(woodText);
	footRest.updateScale(new Vector3([2.5,2.5,2.5]));
	footRestBase.addChild(footRest);
	footRest.updatePos(new Vector3([0,0.6,0]));
	footRestBase.updatePos(new Vector3([4.2,-2,1.7]));
	footRestBase.updateScale(new Vector3([0.7,0.7,0.7]));


	footRest.normalTexture = sofa2NormalText;
	footRest.textures.push(sofa2);


	let cushion1Parent = Scene1.newModel("Cushion1",2);
	cushion1Parent.addChild(cushion1);
	let cushion2Parent = Scene1.newModel("Cushion2",2);
	cushion2Parent.addChild(cushion2);
	cushion1.updateScale(new Vector3([0.6,0.6,0.6]));
	cushion2.updateScale(new Vector3([0.6,0.6,0.6]));
	cushion1Parent.updatePos(new Vector3([8.7,0,2]));

	cushion2Parent.updatePos(new Vector3([8.7,0,-1.5]));


	sofa1.addChild(cushion1Parent);
	sofa1.addChild(cushion2Parent);

	Scene1.cushions = [cushion1Parent,cushion2Parent];
	Scene1.chair = ChairParent;
	// #endregion sofas


	// #region TV
	let TVStand = Scene1.newModel("TV_Stand",0);
	TVStand.updatePos(new Vector3([-8,-1.7,3.6]));
	TVStand.updateScale(new Vector3([0.8,0.9,1]));
	TVStand.textures.push(woodText);

	let TV = Scene1.newModel("TV",0);
	TV.updatePos(new Vector3([-8,0.3,0]));
	TV.updateScale(new Vector3([0.5,0.6,0.6]));


	TV.textures.push(TVtext1);
	TV.textures.push(TVtext2);
	TV.textures.push(TVtext3);
	TV.textures.push(TVtext4);

	let soundbar = Scene1.newModel("soundbar",0);
	soundbar.updatePos(new Vector3([-8,-1.5,-0.2]));
	soundbar.updateScale(new Vector3([0.5,0.5,0.4]));
	soundbar.textures.push(TVtext4);

	TVStand.addChild(soundbar);
	TVStand.addChild(TV);

	// #endregion TV


	// #region overhead light

	let lightFitting = Scene1.newModel("fitting",2);

	let cable1 = Scene1.newModel("lightCable",0);
	let cable2 = Scene1.newModel("lightCable",0);
	let cable3 = Scene1.newModel("lightCable",0);


	let bulb = Scene1.newModel("bulb",2);
	let shade = Scene1.newModel("lampShade",0);
	lightFitting.addChild(cable1);
	cable1.addChild(cable2);
	cable2.addChild(cable3);
	cable3.addChild(bulb);
	cable3.addChild(shade);

	bulb.updateRot(new Vector3([180,0,0]));
	bulb.updateScale(new Vector3([0.6,0.6,0.6]));
	bulb.updatePos(new Vector3([0,1,0]));
	shade.updatePos(new Vector3([0,1,0]));

	cable2.updatePos(new Vector3([0,-4.2,0]));
	cable3.updatePos(new Vector3([0,-4.2,0]));
	cable1.updatePos(new Vector3([0,-4.2,0]));

	lightFitting.updatePos(new Vector3([0,17,0]));

	lightFitting.updateScale(new Vector3([0.4,0.38,0.4]));

	Scene1.fitting = lightFitting;

	cable1.textures.push(ceramic);
	cable2.textures.push(ceramic);
	bulb.textures.push(ceramic);
	shade.textures.push(shadeText);

	// #endregion overhead light


	// #region walls
	let wallsRoot = Scene1.newModel("wallRoot",2);

	let wall1Parent = Scene1.newModel("wall1Parent",2);
	let wall1 =  Scene1.newModel("wall",0);
	wall1.updateRot(new Vector3([0,90,0]));
	wall1.updateScale(new Vector3([2.51,2.5,1]));

	wall1Parent.addChild(wall1);

	wall1Parent.updatePos(new Vector3([9.8,-2.8,0]));


	wallsRoot.addChild(wall1Parent);

	let wall2Parent = Scene1.newModel("wall2Parent",2);
	let wall2 =  Scene1.newModel("wall",0);

	wall2.updateScale(new Vector3([2.51,2.5,1]));
	wall2Parent.addChild(wall2);
	wall2Parent.updatePos(new Vector3([0,-2.8,9.8]));

	wallsRoot.addChild(wall2Parent);

	let wall3Parent = Scene1.newModel("wall3Parent",2);
	let wall3 =  Scene1.newModel("wall",0);

	wall3.updateRot(new Vector3([0,90,0]));
	wall3.updateScale(new Vector3([2.51,2.5,1]));
	wall3Parent.addChild(wall3);
	wall3Parent.updatePos(new Vector3([-9.8,-2.8,0]));

	wallsRoot.addChild(wall3Parent);

	let wall4Parent = Scene1.newModel("wall4Parent",2);
	let wall4 =  Scene1.newModel("wall",0);


	wall4.updateScale(new Vector3([2.51,2.5,1]));
	wall4Parent.addChild(wall4);
	wall4Parent.updatePos(new Vector3([0,-2.8,-9.8]));

	wallsRoot.addChild(wall4Parent);

	wall1.textures.push(wallText);
	wall2.textures.push(wallText);
	wall3.textures.push(wallText);
	wall4.textures.push(wallText);
	wall1.normalTexture = wallNormalText;
	wall2.normalTexture = wallNormalText;
	wall3.normalTexture = wallNormalText;
	wall4.normalTexture = wallNormalText;
	Scene1.walls = wallsRoot;

	// #endregion walls


	let floor = Scene1.newModel("quad",0);
	floor.updatePos(new Vector3([0,-3,0]));
	floor.updateScale(new Vector3([10,1,10]));

	floor.textures.push(floorText);

	floor.addChild(wallsRoot);
	floor.addChild(tableParent);
	floor.addChild(TVStand);
	floor.addChild(lightFitting);
	floor.addChild(sofa1);
	floor.addChild(sofa2);
	floor.addChild(sofa3);
	floor.addChild(Chair2Parent);
	floor.addChild(ChairParent);
	floor.addChild(lampParentParent);

	let skybox = Scene1.newModel("skybox",0);
	skybox.textures.push(skyboxText,2);
	skybox.updateScale(new Vector3([60,60,60]));
	skybox.updatePos(new Vector3([0,35,0]));

	skybox.addChild(floor);

	// #endregion Scene Graph

	// Key events and animations
	document.onkeydown = function (ev) {

		// for events on update/ multi key presses
		keypressed[ev.keyCode] = true;

		// prevents scroll down on arrow click
		// space and arrow keys
		if([32, 37, 38, 39, 40].indexOf(ev.keyCode) > -1) {
			ev.preventDefault();
		}

		// events on key press
		if (keypressed["84"]) {

			// t pressed
			// changes the channel on the TV
			TV.changeTexture();

		}
		if (keypressed["32"]) {

			// spacebar pressed
			// lowers walls to fully show room - see update function
			startLoadAnimation = true;

		}
		if (keypressed["76"]) {

			// lights start to flicker - see update function
			lightAnimation = !lightAnimation;
			if (!lightAnimation) {

				dimmer.disabled = false;
				document.getElementById("dimmerTxt").innerHTML = "Light Dimmer";
				Scene1.lightScalar = dimmer.value;

			}
			else{

				dimmer.disabled = true;
				document.getElementById("dimmerTxt").innerHTML = "Light Dimmer (Disabled)";
				deltaFlash = Math.random();
				Scene1.lightScalar = Math.random() * (0.6) + 0.1;

			}

		}
		if (keypressed["77"]) {

			// m pressed
			// Starts swaying of light in random direction and magnitude
			lightMoveAnimation = true;
			dirX = Math.random() * 2 - 1;
			dirZ = Math.random() * 2 - 1;

		}
		if (keypressed["67"]) {

			Scene1.ToonShading = !Scene1.ToonShading;
			Scene1.gl.uniform1i(Scene1.program.u_UseToonShading, Scene1.ToonShading);

		}
		if (keypressed["78"]) {

			// n pressed
			// Rotate cushion animation
			if (!cushionAnimation) {

				cushionAnimation = true;

			}


		}
		if (keypressed["66"]) {

			// b pressed
			// Move Chair animation
			if (!chairAnimation) {

				chairAnimation = true;

			}


		}
		if (keypressed["71"]) {


			// g pressed
			// mug animtion
			if (!mugAnimation) {

				mugAnimation = true;

			}

		}

	};
	document.onkeyup = function (ev) {

		keypressed[ev.keyCode] = false;

	};

	let dimmer = document.getElementById("dimmer");
	dimmer.value = Scene1.lightScalar;
	dimmer.addEventListener("input", function () {

		Scene1.lightScalar = this.value;

	});


	let channelButton = document.getElementById("channelBtn");
	channelButton.addEventListener("click",function () {

		TV.changeTexture();

	});

	let flickerBox = document.getElementById("flickerBox");
	flickerBox.addEventListener("change",function () {

		// lights start to flicker - see update function
		lightAnimation = !lightAnimation;
		if (!lightAnimation) {

			dimmer.disabled = false;
			document.getElementById("dimmerTxt").innerHTML = "Light Dimmer";
			Scene1.lightScalar = dimmer.value;

		}
		else{

			dimmer.disabled = true;
			document.getElementById("dimmerTxt").innerHTML = "Light Dimmer (Disabled)";
			deltaFlash = Math.random();
			Scene1.lightScalar = Math.random() * (0.6) + 0.1;

		}

	});


	let normalBox = document.getElementById("normalBox");
	normalBox.addEventListener("change",function () {

		if (normalBox.checked){
			document.getElementById("normalLabel").innerHTML = "Normal Map Style - <strong>Currently:</strong> Point-based"
			Scene1.ToonShading = false;
			document.getElementById("styleLabel").innerHTML = "Lighting Style - <strong>Currently:</strong> Point-based";
			document.getElementById("styleBox").checked = false;
		}
		else{
			document.getElementById("normalLabel").innerHTML = "Normal Map Style - <strong>Currently:</strong> Directional"
			
		}
		Scene1.gl.uniform1i(Scene1.program.u_UseToonShading, Scene1.ToonShading);
		Scene1.gl.uniform1i(Scene1.program.u_whichNormal, normalBox.checked);

	});

	let wallBtn = document.getElementById("wallsBtn");
	wallBtn.addEventListener("click",function () {

			// spacebar pressed
			// lowers walls to fully show room - see update function
			startLoadAnimation = true;

	});

	let changeStyle = document.getElementById("styleBox");
	changeStyle.addEventListener("change", function () {


		Scene1.ToonShading = changeStyle.checked;
		if (Scene1.ToonShading) {
			document.getElementById("styleLabel").innerHTML = "Lighting Style - <strong>Currently:</strong> Toon";
			normalBox.checked = false;
			Scene1.gl.uniform1i(Scene1.program.u_whichNormal, normalBox.checked);
			document.getElementById("normalLabel").innerHTML = "Normal Map Style - <strong>Currently:</strong> Directional"
		}
		else{
			document.getElementById("styleLabel").innerHTML = "Lighting Style - <strong>Currently:</strong> Point-based";
		}
		Scene1.gl.uniform1i(Scene1.program.u_UseToonShading, Scene1.ToonShading);

	});

	let cushionSpin = document.getElementById("cushionBtn");
	cushionSpin.addEventListener("click", function () {

		// Rotate cushion animation
		cushionAnimation = true;

	});

	let chairMove = document.getElementById("chairMoveBtn");
	chairMove.addEventListener("click", function () {

		// Move Chair animation
		if (chairAnimation == false) {

			chairAnimation = true;

		}

	});

	let sway = document.getElementById("sway");
	sway.addEventListener("click", function () {

		// Starts swaying of light in random direction and magnitude
		if (lightMoveAnimation == false) {

			lightMoveAnimation = true;
			dirX = Math.random() * 2 - 1;
			dirZ = Math.random() * 2 - 1;

		}

	});

	let mugBtn = document.getElementById("mug");
	mugBtn.addEventListener("click", function () {

		// Move mug animation
		if (mugAnimation == false) {

			mugAnimation = true;

		}

	});


	window.requestAnimationFrame(update);

}


