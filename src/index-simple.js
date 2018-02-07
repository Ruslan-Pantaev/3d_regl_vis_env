// Author: 	Ruslan Pantaev
// Date: 	2018-26
// Thanks to Mikola Lysenko
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

// see for use of <var> <https://stackoverflow.com/questions/1470488/what-is-the-purpose-of-the-var-keyword-and-when-to-use-it-or-omit-it>
// for global vars it won't make a diff
tickSpeed = 0.005;

const drawTriangle = regl({
	// fragment shader - specify pixel color to webGL
	frag: `
	precision highp float;
	void main () {
		// all white
		gl_FragColor = vec4(1);
	}
	`,

	// vertex shader - where to put vertices of triangle
	vert: `
	precision highp float;
	// 2d attributes
	attribute vec2 position;
	// creating / calling uniforms global var
	uniform vec2 translate;
	void main () {
		// pass to output position variable
		// puts it where input comes from
		gl_Position = vec4(position + translate, 0, 1);
	}
	`,

	// data to run in the vertex shader
	attributes: {
		// webGL coord sys:
		// 		upper left corner of screen = [-1, -1]
		// 		lower right corner of screen = [1, 1]
		position: [
			[-1, 0],
			[0, 1],
			[1, -1]
		]
	},

	// like global vars that get broadcast to shaders (outside of then into webGL)
	uniforms: {
		// simple form
		// translate: [0, 0.1]
		
		// create movement with ticks
		/* An arrow function expression has a
			shorter syntax than a function expression
			and does not have its own this, arguments,
			super, or new.target. These function
			expressions are best suited for non-method
			functions, and they cannot be used as constructors.
		   ref <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions>
		*/
		// translate: ({tick}) => [Math.cos(tickSpeed * tick), 0]

		// another way which takes in user input
		translate: regl.prop('translate')
	},

	// how many vertices?
	count: 3
})

regl.frame(() => {
  regl.clear({
  	// for strobe use: <Math.random()>
    color: [0, 0.9, 1, 1],
    depth: 1
  })

  // simple func call to draw triangle
  // drawTriangle()
  
  // add user input
  drawTriangle({
  	// -1, +1 here offsets pivot center coordinates
  	translate: [(mouse.x / 1000) - 1, (-mouse.y / 1000) + 1]
  })
})
