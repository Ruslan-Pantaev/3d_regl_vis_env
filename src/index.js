// Author: 	Ruslan Pantaev
// Date: 	2018-2-6
// Thanks to Mikola Lysenko for the regl functional framework
// ref <https://www.youtube.com/watch?v=ZC6N6An5FVY>

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
  center: [0, 2, 2.5],
  // distance: 0.1,
  mouse: true,
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
		// fragment shader - specify pixel color to webGL
		// these backticks define an interpolated expression (not commas!) - template literals / strings
		// ref <https://stackoverflow.com/questions/27678052/what-is-the-usage-of-the-backtick-symbol-in-javascript>
		frag: `
		precision highp float;
		varying vec3 color;
		
		void main () {
			// all white
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
			color = 1.0 * (0.6 + normal);
			// pass to output position variable
			// puts it where input comes from
			gl_Position = projection * view * vec4(cos(2.0 * position.y + t) * normal /* + 0.1 * normal OR - cos(2.0 * position.y + t) * normal */, 1);
		}
		`,

		// data to run in the vertex shader
		attributes: {
			// for 3d we want to draw stuff from the mesh
			position: mesh.positions,
			normal: normals(mesh.cells, mesh.positions)
		},

		uniforms: {
			t: ({tick}) => Math.tan(0.01 * tick)
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
		neurons: {
			// PLAY! (with random files)
			type: 'binary',
			src: 'src/test.jpg',
			parser: (data) => ndarray(new Uint8Array(data),
				[100, 230, 230])
		}
	},

	onDone({neurons}) {
		// after the neurons par, the <int> par specifies obj density (possibly brightness or degree of normals)
		const mesh = surfaceNets(neurons, 50)
		mesh.positions.forEach((p) => {
			// mutating in place
			vec3.divide(p, p, neurons.shape)
			vec3.scale(p, p, 5)
		})

		// not working
		// cameraREGL.distance = // vec3

		const drawMesh = processMesh(mesh)

		regl.frame(() => {
			regl.clear({
				// for strobe use: <Math.random()>
				color: [0.9, 0.9, 0.9, 1],
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
