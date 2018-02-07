// Author: 	Ruslan Pantaev
// Date: 	2018-26
// Thanks to Mikola Lysenko for the regl functional framework
// ref <https://www.youtube.com/watch?v=ZC6N6An5FVY>

/* Summary
	-read state of mouse
	-pass mouse data into webGL thru the uniforms' <regl.prop(...)>
	-outputs to screen thru vert's <gl_Position = vec4(...)>
*/

const regl = require('regl')()
// listens for and returns cursor info
// <npm install mouse-change>
const mouse = require('mouse-change')()

// npm install regl-camera
// for 3d, see <http://graphics.stanford.edu/data/3Dscanrep/#bunny>
// this is a module that handles 3d matrix maths, viewport, etc
const cameraREGL = require('regl-camera')(regl)
const bunny = require('bunny')

const ndarray = require('ndarray')

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

// npm install angle-normals
const normals = require('angle-normals')





/* ----------------------------------------------------------------------------- */

// var SEPARATION = 100, AMOUNTX = 50, AMOUNTY = 50;
// var container, stats;
// var camera, scene, renderer;
// var particles, particle, count = 0;
// var mouseX = 0, mouseY = 0;
// var windowHalfX = window.innerWidth / 2;
// var windowHalfY = window.innerHeight / 2;
// // init();
// // animate();
// function init() {
// 	container = document.createElement( 'div' );
// 	document.body.appendChild( container );
// 	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
// 	camera.position.z = 1000;
// 	scene = new THREE.Scene();
// 	particles = new Array();
// 	var PI2 = Math.PI * 2;
// 	var material = new THREE.SpriteCanvasMaterial( {
// 		color: 0xffffff,
// 		program: function ( context ) {
// 			context.beginPath();
// 			context.arc( 0, 0, 0.5, 0, PI2, true );
// 			context.fill();
// 		}
// 	} );
// 	var i = 0;
// 	for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
// 		for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
// 			particle = particles[ i ++ ] = new THREE.Sprite( material );
// 			particle.position.x = ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 );
// 			particle.position.z = iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 );
// 			scene.add( particle );
// 		}
// 	}
// 	renderer = new THREE.CanvasRenderer();
// 	renderer.setPixelRatio( window.devicePixelRatio );
// 	renderer.setSize( window.innerWidth, window.innerHeight );
// 	container.appendChild( renderer.domElement );
// 	stats = new Stats();
// 	container.appendChild( stats.dom );
// 	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
// 	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
// 	document.addEventListener( 'touchmove', onDocumentTouchMove, false );
// 	//
// 	window.addEventListener( 'resize', onWindowResize, false );
// }
// function onWindowResize() {
// 	windowHalfX = window.innerWidth / 2;
// 	windowHalfY = window.innerHeight / 2;
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();
// 	renderer.setSize( window.innerWidth, window.innerHeight );
// }
// //
// function onDocumentMouseMove( event ) {
// 	mouseX = event.clientX - windowHalfX;
// 	mouseY = event.clientY - windowHalfY;
// }
// function onDocumentTouchStart( event ) {
// 	if ( event.touches.length === 1 ) {
// 		event.preventDefault();
// 		mouseX = event.touches[ 0 ].pageX - windowHalfX;
// 		mouseY = event.touches[ 0 ].pageY - windowHalfY;
// 	}
// }
// function onDocumentTouchMove( event ) {
// 	if ( event.touches.length === 1 ) {
// 		event.preventDefault();
// 		mouseX = event.touches[ 0 ].pageX - windowHalfX;
// 		mouseY = event.touches[ 0 ].pageY - windowHalfY;
// 	}
// }
// //
// function animate() {
// 	requestAnimationFrame( animate );
// 	render();
// 	stats.update();
// }
// function render() {
// 	camera.position.x += ( mouseX - camera.position.x ) * .05;
// 	camera.position.y += ( - mouseY - camera.position.y ) * .05;
// 	camera.lookAt( scene.position );
// 	var i = 0;
// 	for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
// 		for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
// 			particle = particles[ i++ ];
// 			particle.position.y = ( Math.sin( ( ix + count ) * 0.3 ) * 50 ) +
// 				( Math.sin( ( iy + count ) * 0.5 ) * 50 );
// 			particle.scale.x = particle.scale.y = ( Math.sin( ( ix + count ) * 0.3 ) + 1 ) * 4 +
// 				( Math.sin( ( iy + count ) * 0.5 ) + 1 ) * 4;
// 		}
// 	}
// 	renderer.render( scene, camera );
// 	count += 0.1;
// }

/* ----------------------------------------------------------------------------- */

function processMesh (mesh) {

	return regl({
		// fragment shader - specify pixel color to webGL
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
		precision highp float;
		varying vec3 color;
		// 2d attributes
		attribute vec3 position, normal;
		uniform mat4 projection, view;
		// for oscillitaing obj! hehe
		uniform float t;

		void main () {
			color = 0.5 * (1.0 + normal);
			// pass to output position variable
			// puts it where input comes from
			gl_Position = projection * view * vec4(position /* + 0.1 * normal OR - cos(2.0 * position.y + t) * normal */, 1);
		}
		`,

		// data to run in the vertex shader
		attributes: {
			// for 3d we want to draw stuff from the mesh
			position: mesh.positions,
			normal: normals(mesh.cells, mesh.positions)
		},

		uniforms: {
			t: ({tick}) => Math.cos(0.2 * tick)
		},

		// reads mesh's cells of data
		elements: mesh.cells
	})
}

// const drawMesh = processMesh(bunny)

// resl stands for resource loader + surface-nets + gl-vec3  + gl-mat4  TODO
require('resl')({

})

regl.frame(() => {
  regl.clear({
  	// for strobe use: <Math.random()>
    color: [0, 0.9, 1, 1],
    depth: 1
  })

  cameraREGL(() => {
  	drawMesh()
  })


})
