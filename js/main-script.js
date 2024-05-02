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
    camera.position.x = 2;
    camera.position.y = 2;
    camera.position.z = 5;
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
    'use strict';
    switch (color) {
        case "red":
            return new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
        case "green":
            return new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});
        case "blue":
            return new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true});
        case "yellow":
            return new THREE.MeshBasicMaterial({color: 0xffff00, wireframe: true});
        case "purple":
            return new THREE.MeshBasicMaterial({color: 0x800080, wireframe: true});
    }
    return new THREE.MeshBasicMaterial({color: color, wireframe: true});
}
function createCrane() {
    'use strict';

    var r_base = 2.5;
    var h_base = 1;
    var l_torre = 1;
    var h_torre = 7;

    var base = new THREE.Mesh(new THREE.CylinderGeometry(r_base, r_base, h_base), material("green"));

    var torreMetalica = new THREE.Mesh(new THREE.BoxGeometry(l_torre, h_torre, l_torre), material("blue"));
    torreMetalica.position.set(0, h_base/2 + h_torre/2, 0);

    var ref_eixo = new THREE.Object3D();
    ref_eixo.position.set(0, h_base + h_torre, 0);

        // var portaLancaBase = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), material("purple"));
        // ref_eixo.add(portaLancaBase);

        var portaLancaTopo = new THREE.Mesh(new THREE.TetrahedronGeometry(Math.sqrt(3/8)), material("red"));
        // rotate the tetrahedron by the axis z=-x

        portaLancaTopo.position.set(0, 0, 0);
        
        var quadrado = new THREE.Mesh(new THREE.SphereGeometry(Math.sqrt(3/8)), material("green"));
        var grua = new THREE.Object3D();
        grua.add(portaLancaTopo);
        grua.add(quadrado);
    // grua.add(base);
    // grua.add(torreMetalica);
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

init();
animate();