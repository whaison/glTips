(function (){
  var gl = null;
  var canvas = null;
  var ext = null;
  function initWebGL() {
    canvas = document.querySelector("#webgl-canvas");
    canvas.width = 1200;
    canvas.height = 800;
    gl = glTips.getWebGL2Context(canvas);
    if (gl) {
      console.log("WebGL2 context was created successfully.");
    }
    gl.clearColor(0.8, 0.8, 1, 1);
    gl.enable(gl.DEPTH_TEST);

  }

  initWebGL();

  var INSTANCE_NUMBER = 100;
  var X_ARRANGE_NUMBER = 10;
  var shaderProgram = null;
  var attribLocationPosition = null;
  var attribLocationNormal = null;
  var attribLocationTexcoord = null;
  var attribLocationWorldMatrixRow1 = null;
  var attribLocationWorldMatrixRow2 = null;
  var attribLocationWorldMatrixRow3 = null;

  function initMeshBuffers()
  {
    // create VBO
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // convert separeted vertex attribute arrays to a interleaved array
    var typedArray = glTips.makeVerticesDataInterleaved(gl.FLOAT,
      [cubePosArray, cubeNormalArray, cubeTexcoordArray],
      [3, 3, 2]
    )

    gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribLocationPosition, 3, gl.FLOAT, gl.FALSE, 32, 0)
    gl.vertexAttribPointer(attribLocationNormal, 3, gl.FLOAT, gl.FALSE, 32, 12)
    gl.vertexAttribPointer(attribLocationTexcoord, 2, gl.FLOAT, gl.FALSE, 32, 24)
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // create Indexbuffer
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndexArray), gl.STATIC_DRAW);
  }

  var worldMatrixRow1 = {};
  var worldMatrixRow2 = {};
  var worldMatrixRow3 = {};
  function initInstanceUniforms()
  {
    for (var i=0; i<INSTANCE_NUMBER; i++) {
      worldMatrixRow1['_' + i] = gl.getUniformLocation(shaderProgram, 'uWorldMatrixRow1[' + i + ']');
      worldMatrixRow2['_' + i] = gl.getUniformLocation(shaderProgram, 'uWorldMatrixRow2[' + i + ']');
      worldMatrixRow3['_' + i] = gl.getUniformLocation(shaderProgram, 'uWorldMatrixRow3[' + i + ']');
    }
  }

  function initShader() {
    var vertShaderText = document.querySelector("#shader-vs").textContent;
    var fragShaderText = document.querySelector("#shader-fs").textContent;
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, glTips.compileShader(gl, gl.VERTEX_SHADER, vertShaderText));
    gl.attachShader(shaderProgram, glTips.compileShader(gl, gl.FRAGMENT_SHADER, fragShaderText));

    gl.bindAttribLocation(shaderProgram, 0, 'aPosition');
    attribLocationPosition = 0;
    gl.enableVertexAttribArray(attribLocationPosition);
    gl.bindAttribLocation(shaderProgram, 1, 'aNormal');
    attribLocationNormal = 1;
    gl.enableVertexAttribArray(attribLocationNormal);
    gl.bindAttribLocation(shaderProgram, 2, 'aTexcoord');
    attribLocationTexcoord = 2;
    gl.enableVertexAttribArray(attribLocationTexcoord);

    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

  }

  var rotation = 0;
  var viewMat = mat4.create();
  var projMat = mat4.create();
  var unitLength = 4.5;

  function initMatrix() {

    mat4.lookAt(viewMat, vec3.fromValues(unitLength*X_ARRANGE_NUMBER/2-unitLength/2, 10, 35), vec3.fromValues(unitLength*X_ARRANGE_NUMBER/2-unitLength/2, 0, 0), vec3.fromValues(0, 1, 0));
    mat4.perspective(projMat, Math.PI / 4, canvas.width/canvas.height, 1, 50000);

    uniformLocationPMatrix = gl.getUniformLocation(shaderProgram, 'uPMatrix');
    gl.uniformMatrix4fv(uniformLocationPMatrix, false, projMat);
    uniformLocationVMatrix = gl.getUniformLocation(shaderProgram, 'uVMatrix');
    gl.uniformMatrix4fv(uniformLocationVMatrix, false, viewMat);
  }

  function updateWorldMatrix() {

    for (var i=0; i<INSTANCE_NUMBER; i++) {
      var worldMat = mat4.create();
      mat4.translate(worldMat, worldMat, vec3.fromValues(unitLength*(i%X_ARRANGE_NUMBER), 0, -unitLength*(i/X_ARRANGE_NUMBER)));
      mat4.rotateY(worldMat, worldMat, rotation);
      mat4.transpose(worldMat, worldMat);
      gl.uniform4f(worldMatrixRow1['_' + i], worldMat[0], worldMat[1], worldMat[2], worldMat[3]);
      gl.uniform4f(worldMatrixRow2['_' + i], worldMat[4], worldMat[5], worldMat[6], worldMat[7]);
      gl.uniform4f(worldMatrixRow3['_' + i], worldMat[8], worldMat[9], worldMat[10], worldMat[11]);
    }

  }

  var rS = new rStats();
  function render(){
    rS( 'FPS' ).frame();

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateWorldMatrix();
    gl.drawElementsInstanced(gl.TRIANGLES, cubeIndexArray.length, gl.UNSIGNED_SHORT, 0, INSTANCE_NUMBER);
    rotation += 0.02;

    rS().update();

    requestAnimationFrame( render );

  }

  // glTips();
  initShader();
  initMeshBuffers();
  initInstanceUniforms();
  initMatrix();

  glTips.setupTexture2DSimple(gl, "../assets/uv_test.png", gl.RGBA, gl.RGBA,
    gl.UNSIGNED_BYTE, gl.LINEAR, gl.CLAMP_TO_EDGE, true,
    function(){
      var uniformTextureSampler_0 = gl.getUniformLocation(shaderProgram, 'uTexture');
      gl.uniform1i(uniformTextureSampler_0, 0);

      render();
    }.bind(this));
})();
