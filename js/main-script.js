import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

var camera, scene, renderer, controls;

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////


/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    // background color
    scene.background = new THREE.Color(0x000000);

    createCrane();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
    'use strict';
    camera = new THREE.PerspectiveCamera(70,
                                         window.innerWidth / window.innerHeight,
                                         1,
                                         1000);
    camera.position.x = 0;
    camera.position.y = 15;
    camera.position.z = 15;
    camera.lookAt(scene.position);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLight() {
    'use strict';

    var light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function material(color) {
    return new THREE.MeshBasicMaterial({color: color, wireframe: true});
}

function createCrane() {
    'use strict';

    var r_base = 2.5;
    var h_base = 1;
    var l_torre = 1;
    var h_torre = 7;
    var l_portaLancaBase = 1;
    var h_portaLancaBase = 3;

    var base = new THREE.Mesh(new THREE.CylinderGeometry(r_base, r_base, h_base), material("green"));
    var torreMetalica = new THREE.Mesh(new THREE.BoxGeometry(l_torre, h_torre, l_torre), material("blue"));
    torreMetalica.position.set(0, h_base/2 + h_torre/2, 0);

    var ref_eixo = new THREE.Object3D();
    ref_eixo.position.set(0, h_base/2 + h_torre, 0);

        var portaLancaBase = new THREE.Mesh(new THREE.BoxGeometry(l_portaLancaBase, h_portaLancaBase, l_portaLancaBase), material("purple"));
        portaLancaBase.position.y = h_portaLancaBase/2;
        ref_eixo.add(portaLancaBase);

        var portaLancaTopo = createTetrahedron(1, 2, "red");
        portaLancaTopo.position.y = h_portaLancaBase;
        ref_eixo.add(portaLancaTopo);

    var grua = new THREE.Object3D();
    grua.add(base);
    grua.add(torreMetalica);
    grua.add(ref_eixo);

    scene.add(grua);
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';

}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';
    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCamera();

    render();
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    render();

    controls.update();

    requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() { 
    'use strict';

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
}

/////////////////////////////
/* UTILS */
/////////////////////////////

function createTetrahedron(edgeLength, verticalHeight, color) {
    'use strict';
    
    // Calculate the altitude of the equilateral triangle that forms the base of the tetrahedron
    var base_height = Math.sqrt(3) / 2 * edgeLength;
    
    // Define the vertices of the tetrahedron
    var vertices = new Float32Array([
        -edgeLength / 2, 0, base_height / 3, // vertex 0
        edgeLength / 2, 0, base_height / 3,  // vertex 1
        0, 0, -2 * base_height / 3,         // vertex 2
        0, verticalHeight, 0                // vertex 3
    ]);

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex([
        0, 1, 2, // base face
        0, 1, 3, // side face 1
        1, 2, 3, // side face 2
        2, 0, 3  // side face 3
    ]);

    var tetrahedron = new THREE.Mesh(geometry, material(color));

    return tetrahedron;
}


init();
animate();