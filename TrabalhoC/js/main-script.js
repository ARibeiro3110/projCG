import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var carousel, renderer, camera, scene, controls, clock;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    // background color
    scene.background = new THREE.Color(0xFFFFFF);

    carousel = createCarousel();

}

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////
const M = Object.freeze({ // Material constants
    cylinder: new THREE.MeshBasicMaterial({color: 0x00FF00, wireframe: true}),
    ring1: new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: false}),
    ring2: new THREE.MeshBasicMaterial({color: 0x0000FF, wireframe: false}),
    ring3: new THREE.MeshBasicMaterial({color: 0xFFFF00, wireframe: false})
    
});

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
    'use strict';

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(scene.position);

    scene.add(camera);

    controls = new OrbitControls(camera, renderer.domElement);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createCarousel() {
    'use strict';

    var carousel = new THREE.Object3D();

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10, 32), M.cylinder);
    cylinder.position.set(0, 5, 0);

    // Add cylinder and rings to carousel
    carousel.add(cylinder);

    scene.add(carousel);

    return carousel;

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

    clock = new THREE.Clock();

    createScene();
    createCamera();

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    requestAnimationFrame(animate);

    update();

    render();

    controls.update();

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