// Based on http://learningwebgl.com/lessons/lesson01/index.html

function glForCanvas(canvas) {
    var gl
    try {
        gl = canvas.getContext("experimental-webgl")
        gl.viewportWidth = canvas.width
        gl.viewportHeight = canvas.height
    }
    catch (e) {
    }
    if (!gl) {
        alert("Could not initialize WebGL.")
    }
    
    return gl
}

function glMakeShader(gl, id) {
    var shaderScript = document.getElementById(id)
    if (!shaderScript) {
        return null
    }

    var str = ""
    var k = shaderScript.firstChild
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent
        }
        k = k.nextSibling
    }

    var shader
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER)
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER)
    } else {
        return null
    }

    gl.shaderSource(shader, str)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader))
        return null
    }

    return shader
}

function glMakeProgram(gl, fragmentSource, vertexSource) {
    var fragmentShader = glMakeShader(gl, fragmentSource)
    var vertexShader = glMakeShader(gl, vertexSource)

    shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not link shaders.")
    }

    gl.useProgram(shaderProgram)
    
    // Remembers links to the shader vars in gl.
    gl.colorPtr = gl.getUniformLocation(shaderProgram, "color")
    
    gl.vertexPositionPtr = gl.getAttribLocation(shaderProgram, "vertexPosition")
    gl.enableVertexAttribArray(gl.vertexPositionPtr)
    
    gl.projectionMatrixPtr = gl.getUniformLocation(shaderProgram, "projectionMatrix")
    gl.modelViewMatrixPtr = gl.getUniformLocation(shaderProgram, "modelViewMatrix")
    gl.projectionMatrix = mat4.create()
    gl.modelViewMatrix = mat4.create()
    
    return shaderProgram
}

// From http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/
function flatten(array){
    var flat = []
    for (var i = 0, l = array.length; i < l; i++) {
        var type = Object.prototype.toString.call(array[i]).split(' ').pop().split(']').shift().toLowerCase()
        if (type) {
            flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten(array[i]) : array[i])
        }
    }
    
    return flat
}

function glBufferFromLightGeo(gl, lightGeo) {
    return glMakeBuffer(gl, lightGeo, 2, gl.LINES)
}

function glBuffersFromFeatures(gl, features) {
    buffers = []
    
    for (var featureIndex = 0; featureIndex < features.length; featureIndex++) {
        feature = features[featureIndex]
        
        switch (feature.geometry.type) {
            case "LineString":
                buffers.push(glMakeBuffer(gl, flatten(feature.geometry.coordinates), 2, gl.LINE_STRIP))
                break
            case "Polygon":
                for (var linearRingIndex = 0; linearRingIndex < feature.geometry.coordinates.length; linearRingIndex++) {
                    linearRing = feature.geometry.coordinates[linearRingIndex]
                    
                    buffers.push(glMakeBuffer(gl, flatten(linearRing), 2, gl.LINE_LOOP))
                }
                break
            case "MultiPolygon":
                for (var polygonIndex = 0; polygonIndex < feature.geometry.coordinates.length; polygonIndex++) {
                    polygon = feature.geometry.coordinates[polygonIndex]
                    
                    for (var linearRingIndex = 0; linearRingIndex < feature.geometry.coordinates.length; linearRingIndex++) {
                        linearRing = feature.geometry.coordinates[linearRingIndex]
    
                        buffers.push(glMakeBuffer(gl, flatten(linearRing), 2, gl.LINE_LOOP))
                    }
                }
                break
            default:
                console.log(feature.geometry.type)
                break;
        }
    }
    
    return buffers
}

function glMakeBuffer(gl, verts, dims, primitive) {
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
    buffer.dims = dims
    buffer.length = verts.length / buffer.dims
    buffer.primitive = primitive
    
    return buffer
}

function glDraw(gl, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.vertexAttribPointer(gl.vertexPositionPtr, buffer.dims, gl.FLOAT, false, 0, 0)
    gl.uniformMatrix4fv(gl.projectionMatrixPtr, false, gl.projectionMatrix)
    gl.uniformMatrix4fv(gl.modelViewMatrixPtr, false, gl.modelViewMatrix)
    gl.uniform4fv(gl.colorPtr, gl.color)
    gl.drawArrays(buffer.primitive, 0, buffer.length)
}