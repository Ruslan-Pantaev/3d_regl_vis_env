// Author: 		Ruslan Pantaev
// Start-Date: 	2018-2-6
// Update-Date:	2018-2-9

// Thanks to Mikola Lysenko for the regl functional framework
// ref <https://www.youtube.com/watch?v=ZC6N6An5FVY>
//
// Credits to Taylor Baldwin for permission to build off of
// the audiofabric repo
// ref <https://github.com/rolyatmax/audiofabric>
 
// TODO clean up comments? 

const regl = require('regl')({
	// extends webGL to use 32bit indices
	extensions: 'OES_element_index_uint'
})
// listens for and returns cursor info
// <npm install mouse-change>
const mouse = require('mouse-change')()

// npm install regl-camera
// ref <https://www.npmjs.com/package/regl-camera>
const cameraREGL = require('regl-camera')(regl, {
  // for Sphere, etc
  // center: [0, 0, 0],

  // for My Fav
  center: [0, 2, 2.5],
  
  distance: 12.0,
  mouse: true,
  // theta / phi angles
  theta: 0.4, 	// left-right
  phi: -0.2, 	// up-down
  fovy: Math.PI / 5, // widen the spread lol, kind of like zoom
  zoomSpeed: 0.5,
  rotationSpeed: 0.7,
  damping: 0.5 // sets inertia of rotation
  // renderOnDirty: true // renders only on movement - cool for strobe effect
})

// for 3d, see <http://graphics.stanford.edu/data/3Dscanrep/#bunny>
// this is a module that handles 3d matrix maths, viewport, etc
// const bunny = require('bunny')

const ndarray = require('ndarray')
// for extracting iso-surface
// extracts ndarray up to 4 / 5 dimensions
const surfaceNets = require('surface-nets')
const vec3 = require('gl-vec3')
// npm install angle-normals
// helps us understand the vectors of which way our obj is pointing for lighting
// see <https://en.wikipedia.org/wiki/Normal_(geometry)>
// think perpendicular to obj, like a reflection bouncing off
const normals = require('angle-normals')

/* TODO ----------------------------------------------------------------- */
// npm install three
// ref <https://threejs.org/docs/#manual/introduction/Import-via-modules>
// npm install --save three-obj-loader
/* USAGE:
	var THREE = require('three');
	var OBJLoader = require('three-obj-loader');
	OBJLoader(THREE);
*/
// const THREE = require('three')
// const OBJLoader = require('three-obj-loader')
// OBJLoader(THREE)
/* ----------------------------------------------------------------------- */

function processMesh (mesh) {

	return regl({
		// see for GLSL <https://en.wikipedia.org/wiki/OpenGL_Shading_Language>
		// fragment shader - specify pixel color to webGL
		// these backticks define an interpolated expression (not commas!) - template literals / strings
		// ref <https://stackoverflow.com/questions/27678052/what-is-the-usage-of-the-backtick-symbol-in-javascript>
		frag: `
		precision highp float;
		varying vec3 color;
		
		void main () {
			gl_FragColor = vec4(color, 1);
		}
		`,

		// vertex shader - where to put vertices of triangle
		vert: `
		precision highp float; // or mediump
		varying vec3 color;
		// 2d attributes
		attribute vec3 position, normal;
		uniform mat4 projection, view;
		// for oscillitaing obj! hehe
		uniform float t;

		void main () {
			color = 1.0 * (0.9 + t * normal);
			
			// pass to output position variable
			// puts it where input comes from
			// NOTE codomains: sin = [-1,1] period = 2PI, cos = [-1,1] period = 2PI, tan = Real Numbers period = PI
			// ref <https://www.ma.utexas.edu/users/jmeth/TrigSheet.pdf>

			// Pulsing Sphere
			// gl_Position = projection * view * vec4(cos(2.0 * position.y + t) * normal /* + 0.1 * normal OR - cos(2.0 * position.y + t) * normal */, 0.7);

			// Wild Shards
			// gl_Position = projection * view * vec4(tan(2.0 * position.y + t) * normal /* + 0.1 * normal OR - cos(2.0 * position.y + t) * normal */, 2000);

			// Fat Baseball Bat
			// gl_Position = projection * view * vec4(cos(8.0 * position.y + t) + 0.5 * normal /* + 0.1 * normal OR - cos(2.0 * position.y + t) * normal */, 0.5);

			// Triangular Sphere
			// gl_Position = projection * view * vec4(cos(2.0 * position + t) * normal, 0.4);

			// My Fav - Pulsing Art Canvas
			gl_Position = (projection + 0.0) * (view + 0.0) * vec4(position - (t * normal), 1);


		}
		`,

		// data to run in the vertex shader
		attributes: {
			// for 3d we want to draw stuff from the mesh
			position: mesh.positions,

			normal: normals(mesh.cells, mesh.positions)
		},

		uniforms: {
			// arrow function declaration =>
			// ref <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions>
			t: ({tick}) => Math.cos(0.01 * tick)
		},

		// reads mesh's cells of data
		elements: mesh.cells
	})
}

// resl stands for resource loader
require('resl')({
	// xml http request (not only literal http address, but basic elements)
	// see <https://www.npmjs.com/package/resl#parser-interface>
	manifest: {
		source: {
			// PLAY! (with random files)
			type: 'binary',
			src: 'src/test.jpg',
			parser: (data) => ndarray(new Uint8Array(data),
				[5, 300, 210]) 	// for My Fav
				// [80, 230, 230]) 	// for sphere
		}
	},

	onDone({source}) {
		// after the neurons par, the <int> par specifies obj density (possibly brightness or degree of normals)
		const mesh = surfaceNets(source, 100)
		mesh.positions.forEach((p) => {
			// mutating in place
			vec3.divide(p, p, source.shape)
			vec3.scale(p, p, 5)
		})

		// not working
		// cameraREGL.distance = // vec3

		const drawMesh = processMesh(mesh)

		regl.frame(() => {
			// perhaps similar to creating a canvas
			regl.clear({
				// for strobe use: <Math.random()>
				color: [Math.random(0.9)+0.8, 0.9, 0.9, 1],
				depth: 1
			})

			cameraREGL(() => {
				// not working, seems user input is encapsulated within the <regl-camera> obj
				// translate: [(mouse.x / 1000) - 1, (-mouse.y / 1000) + 1]
				
				drawMesh()

			})
		})
	}
})
