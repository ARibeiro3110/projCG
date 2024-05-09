import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var camera, scene, renderer, controls;
var cameraFront, cameraSide, cameraTop, cameraFixedOrtho, cameraFixedPerspective, cameraMobile;
var grua, container, object;

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////
const G = Object.freeze({ // Geometry constants
    base: { r: 1.5, h: 0.5 },
    torre: { l: 1, h: 7, w: 1 },
    portaLancaBase: { l: 1, h: 3, w: 1 },
    portaLancaTopo: { h: 2 },
    cabine: { l: 1, h: 1, w: 0.5, d: 0.5 },
    lanca: { l: 10, h: 1, w: 1, d: 2 },
    contraLanca: { l: 4, h: 1, w: 1 },
    contrapeso: { l: 1, h: 2, w: 1, d: 2 },
    tirante: { r: 0.01, d: 5.5 },
    carrinho: { l: 1, h: 0.5, w: 1 },
    cabo: { r: 0.05, l: 2 },
    bloco: { l: 0.75, h: 0.75, w: 0.75 },
    dedo: { h: 1 }
});

const DOF = Object.freeze({ // Degrees of freedom
    eixo: { step: Math.PI/360 },
    carrinho: { step: 0.05, min: G.torre.l/2 + G.carrinho.l/2, max: G.torre.l/2 + G.lanca.l - G.carrinho.l/2 },
    bloco: { step: 0.05, min: (G.dedo.h + G.bloco.h) - (G.torre.h + G.lanca.d), max: -G.carrinho.h },
    dedo: { step: Math.PI/200, min: -Math.PI/4, max: Math.PI/4 }
});

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    // background color
    scene.background = new THREE.Color(0x000000);  // TODO: change to light colour

    grua = createCrane();
    container = createContainer(2, 1.5, 1.5, "red");
    object = createObject(0.5, "blue");
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
    'use strict';

    const aspectRatio = window.innerWidth / window.innerHeight;
    const frustumSize = 30; // Common frustum size for a consistent zoom level

    // Helper function to create orthographic cameras
    function createOrthographicCamera(x, y, z) {
        const camera = new THREE.OrthographicCamera(
            -frustumSize * aspectRatio / 2, frustumSize * aspectRatio / 2,
            frustumSize / 2, -frustumSize / 2, 1, 1000
        );
        camera.position.set(x, y, z);
        camera.lookAt(scene.position);
        return camera;
    }

    // Orthographic cameras
    cameraFront = createOrthographicCamera(0, 0, 20);
    cameraSide = createOrthographicCamera(20, 0, 0);
    cameraTop = createOrthographicCamera(0, 20, 0);
    cameraFixedOrtho = createOrthographicCamera(20, 20, 20);

    // Perspective camera
    cameraFixedPerspective = new THREE.PerspectiveCamera(70, aspectRatio, 1, 1000);
    cameraFixedPerspective.position.set(20, 20, 20);
    cameraFixedPerspective.lookAt(scene.position);

    // cameraMobile = new THREE.PerspectiveCamera(70, aspectRatio, 1, 1000);
    // This camera will be updated in the animation loop or event handlers to follow the crane hook

    // Set the default camera
    camera = cameraFront;

    controls = new OrbitControls(camera, renderer.domElement);  // TODO: remove this
    controls.update();  // TODO: remove this
}

function switchCamera(newCamera) {
    camera = newCamera;

    var width = window.innerWidth;
    var height = window.innerHeight;
    var aspectRatio = width / height;

    // Update the newly activated camera
    if (camera.isPerspectiveCamera) {
        camera.aspect = aspectRatio;
    } else if (camera.isOrthographicCamera) {
        const frustumSize = 30; // Adjust as necessary
        camera.left = -frustumSize * aspectRatio / 2;
        camera.right = frustumSize * aspectRatio / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
    }
    camera.updateProjectionMatrix();

    controls.dispose();
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
function createCrane() {
    'use strict';

    var ref_bloco = createRefBloco();
    var ref_carrinho = createRefCarrinho().add(ref_bloco);
    var ref_eixo = createRefEixo().add(ref_carrinho);
    var grua = (new THREE.Object3D()).add(ref_eixo);

    // Create base
    var base = new THREE.Mesh(new THREE.CylinderGeometry(G.base.r, G.base.r, G.base.h), material("green"));
    grua.add(base);

    // Create torre metálica
    var torreMetalica = new THREE.Mesh(new THREE.BoxGeometry(G.torre.l, G.torre.h, G.torre.w), material("blue"));
    torreMetalica.position.set(0, G.base.h/2 + G.torre.h/2, 0);
    grua.add(torreMetalica);

    scene.add(grua);

    return grua;
}

function createRefEixo() {
    'use strict';

    var ref_eixo = new THREE.Object3D();
    ref_eixo.name = "ref_eixo";
    ref_eixo.position.set(0, G.base.h/2 + G.torre.h, 0);

    var components = {
        portaLancaBase: new THREE.Mesh(new THREE.BoxGeometry(G.portaLancaBase.l, G.portaLancaBase.h, G.portaLancaBase.w), material("purple")),
        portaLancaTopo: createTetrahedron(1, G.portaLancaTopo.h, "red"),
        cabine: new THREE.Mesh(new THREE.BoxGeometry(G.cabine.l, G.cabine.h, G.cabine.w), material("yellow")),
        lanca: new THREE.Mesh(new THREE.BoxGeometry(G.lanca.l, G.lanca.h, G.lanca.w), material("orange")),
        contraLanca: new THREE.Mesh(new THREE.BoxGeometry(G.contraLanca.l, G.contraLanca.h, G.contraLanca.w), material("blue")),
        contrapeso: new THREE.Mesh(new THREE.BoxGeometry(G.contrapeso.l, G.contrapeso.h, G.contrapeso.w), material("red")),
        tiranteLanca: new THREE.Mesh(new THREE.CylinderGeometry(G.tirante.r, G.tirante.r, Math.sqrt(G.portaLancaTopo.h**2 + G.tirante.d**2)), material("green")),
        tiranteContraLanca1: new THREE.Mesh(new THREE.CylinderGeometry(G.tirante.r, G.tirante.r, Math.sqrt((G.portaLancaTopo.h+G.contraLanca.h)**2 + G.contrapeso.d**2)), material("green")),
        tiranteContraLanca2: undefined // to be defined later
    };

    components.portaLancaBase.position.set(0, G.portaLancaBase.h/2, 0);

    components.portaLancaTopo.position.set(0, G.portaLancaBase.h, 0);

    components.cabine.position.set(0, G.cabine.h/2 + G.cabine.d, G.torre.l/2 + G.cabine.w/2);

    components.lanca.position.set(G.lanca.l/2 + G.portaLancaBase.l/2, G.lanca.h/2 + G.lanca.d, 0);

    components.contraLanca.position.set(-G.contraLanca.l/2 + G.portaLancaBase.l/2, G.contraLanca.h/2 + G.lanca.d, 0);

    components.contrapeso.position.set(-G.contrapeso.d - G.contrapeso.l/2, G.contrapeso.h/2 + G.contraLanca.h, 0);

    components.tiranteLanca.rotation.z = Math.atan(G.tirante.d / G.portaLancaTopo.h);
    components.tiranteLanca.position.set(G.tirante.d/2, G.portaLancaBase.h + G.portaLancaTopo.h/2, 0);

    components.tiranteContraLanca1.rotation.z = -Math.atan(G.contrapeso.d / (G.portaLancaTopo.h + G.contraLanca.h));
    components.tiranteContraLanca1.rotation.y = Math.atan(G.contraLanca.w/2 / G.contrapeso.d);
    components.tiranteContraLanca1.position.set(-G.contrapeso.d/2, G.portaLancaBase.h + G.portaLancaTopo.h - (G.portaLancaTopo.h+G.contraLanca.h)/2, G.contraLanca.w/4);

    components.tiranteContraLanca2 = components.tiranteContraLanca1.clone();
    components.tiranteContraLanca2.position.z *= -1;
    components.tiranteContraLanca2.rotation.y *= -1;

    for (var key in components)
        ref_eixo.add(components[key]);

    return ref_eixo;
}

function createRefCarrinho() {
    'use strict';

    var ref_carrinho = new THREE.Object3D();
    ref_carrinho.name = "ref_carrinho";
    ref_carrinho.position.set(DOF.carrinho.max, G.lanca.d, 0);

    var components = {
        carrinho: new THREE.Mesh(new THREE.BoxGeometry(G.carrinho.l, G.carrinho.h, G.carrinho.w), material("pink")),
        cabo_de_aco: new THREE.Mesh(new THREE.CylinderGeometry(G.cabo.r, G.cabo.r, G.cabo.l), material("green"))
    };

    components.carrinho.position.set(0, -G.carrinho.h/2, 0);

    components.cabo_de_aco.name = "cabo_de_aco";
    components.cabo_de_aco.position.set(0, -G.carrinho.h - G.cabo.l/2, 0);

    for (var key in components)
        ref_carrinho.add(components[key]);

    return ref_carrinho;
}

function createRefBloco() {
    'use strict';

    var ref_bloco = new THREE.Object3D();
    ref_bloco.name = "ref_bloco";
    ref_bloco.position.set(0, -G.carrinho.h - G.cabo.l, 0);

    var bloco = new THREE.Mesh(new THREE.BoxGeometry(G.bloco.l, G.bloco.h, G.bloco.w), material("brown"));
    bloco.position.set(0, -G.bloco.h/2, 0);
    ref_bloco.add(bloco);

    for (var i = 1; i <= 4; i++) {
        var dedo = createTetrahedron(0.25, -G.dedo.h, color(i));
        dedo.rotateY(g(i));  // FIXME: PROBLEMS
        dedo.name = 'dedo' + i;
        dedo.position.set(p(i) * G.bloco.l * (1/3), -G.bloco.h, q(i) * G.bloco.w * (1/3));
        ref_bloco.add(dedo);
    }

    return ref_bloco;
}

function createContainer(width, height, depth, color) {
    'use strict';

    var vertices = new Float32Array([
        // Front face
        -width / 2, -height / 2, depth / 2,   // bottom left
        width / 2, -height / 2, depth / 2,    // bottom right
        width / 2, height / 2, depth / 2,     // top right
        -width / 2, height / 2, depth / 2,    // top left

        // Back face
        -width / 2, -height / 2, -depth / 2,  // bottom left
        width / 2, -height / 2, -depth / 2,   // bottom right
        width / 2, height / 2, -depth / 2,    // top right
        -width / 2, height / 2, -depth / 2,   // top left

        // Bottom face
        -width / 2, -height / 2, depth / 2,   // front left
        width / 2, -height / 2, depth / 2,    // front right
        width / 2, -height / 2, -depth / 2,   // back right
        -width / 2, -height / 2, -depth / 2,  // back left
    ]);

    var indices = [
        // Front face
        0, 1, 2,  0, 2, 3,
        // Back face
        4, 7, 6,  4, 6, 5,
        // Bottom face
        8, 11, 10, 8, 10, 9,
        // Right face
        1, 5, 6,  1, 6, 2,
        // Left face
        0, 3, 7,  0, 7, 4
    ];

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    var cuboid = new THREE.Mesh(geometry,
        new THREE.MeshBasicMaterial({color: color, wireframe: true, side: THREE.DoubleSide}));

    //    cuboid.position.set(6, height/2, 6);
    cuboid.position.set(6, height/2, 6);
    scene.add(cuboid);

    return cuboid;
}


function createObject(radius, color) {
    'use strict';

    // sphere
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var sphere = new THREE.Mesh(geometry, material(color));
    // TODO: get position as a parameter
    sphere.position.set(10, radius, 0);
    scene.add(sphere);

    return sphere;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';

    for (var i = 1; i <= 4; i++) {
        var dedo = grua.getObjectByName('ref_bloco').getObjectByName('dedo' + i);
        if (dedo) {
            // get positions in world coordinates
            var pd = dedo.getWorldPosition(new THREE.Vector3());
            var po = object.getWorldPosition(new THREE.Vector3());

            // adjust pd to finger's center
            pd.y -= G.dedo.h/2;

            // get radius for bounding spheres
            var rd = G.dedo.h/2;
            var ro = object.geometry.parameters.radius; // TODO: have object list

            if ((rd + ro)**2 > (pd.x - po.x)**2 + (pd.y - po.y)**2 + (pd.z - po.z)**2) {
                object.material.color.setHex(0xff0000); // TODO: delete this
                return true;
            } else {
                object.material.color.setHex(0x0000ff); // TODO: delete this
                return false;
            }
        }
    }

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

    if (checkCollisions()) {
        handleCollisions();
    }
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
    createCameras();

    render();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    // window.addEventListener("keyup", onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    update();

    render();

    controls.update();

    requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
    'use strict';

    var width = window.innerWidth;
    var height = window.innerHeight;
    var aspectRatio = width / height;

    renderer.setSize(width, height);

    // Update the currently active camera
    if (camera.isPerspectiveCamera) {
        camera.aspect = aspectRatio;
        camera.updateProjectionMatrix();
    } else if (camera.isOrthographicCamera) {
        const frustumSize = 30; // Assuming a default frustum size for orthographic cameras
        camera.left = -frustumSize * aspectRatio / 2;
        camera.right = frustumSize * aspectRatio / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
    }

    render();
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

    switch (e.keyCode) {
        // TODO: aplicar mudanças sobre graus de liberdade em vez de atributos do referencial

        case 113: // q
        case 81:  // Q
            grua.getObjectByName("ref_eixo").rotation.y += DOF.eixo.step;
            break;

        case 97:  // a
        case 65:  // A
            grua.getObjectByName("ref_eixo").rotation.y -= DOF.eixo.step;
            break;

        case 119: // w
        case 87:  // W
            var ref = grua.getObjectByName("ref_carrinho");
            if (ref.position.x < DOF.carrinho.max)
                ref.position.x = roundTo(ref.position.x + DOF.carrinho.step, 4);
            break;

        case 115: // s
        case 83:  // S
            var ref = grua.getObjectByName("ref_carrinho");
            if (ref.position.x > DOF.carrinho.min)
                ref.position.x = roundTo(ref.position.x - DOF.carrinho.step, 4);
            break;

        case 101: // e
        case 69:  // E
            var ref = grua.getObjectByName("ref_bloco");
            var cabo_de_aco = grua.getObjectByName("cabo_de_aco");
            if (ref.position.y > DOF.bloco.min) {
                ref.position.y = roundTo(ref.position.y - DOF.bloco.step, 4);
                cabo_de_aco.position.y = roundTo(cabo_de_aco.position.y - DOF.bloco.step/2, 4);
                cabo_de_aco.scale.y = roundTo(cabo_de_aco.scale.y + DOF.bloco.step/2, 4);
            }
            break;

        case 100: // D
        case 68:  // d
            var ref = grua.getObjectByName("ref_bloco");
            var cabo_de_aco = grua.getObjectByName("cabo_de_aco");
            if (ref.position.y < DOF.bloco.max) {
                // TODO cleanup and set constant
                ref.position.y = roundTo(ref.position.y + DOF.bloco.step, 4);
                cabo_de_aco.position.y = roundTo(cabo_de_aco.position.y + DOF.bloco.step/2, 4);
                cabo_de_aco.scale.y = roundTo(cabo_de_aco.scale.y - DOF.bloco.step/2, 4);
            }
            break;
        
        case 114: // r
        case 82:  // R
        case 102: // f
        case 70:  // F
            var ref = grua.getObjectByName("ref_bloco");
            if (ref) {
                var angle = DOF.dedo.step * ((e.keyCode == 114 || e.keyCode == 82) ? -1 : 1); // TODO: check this

                for (var i = 1; i <= 4; i++) {
                    var dedo = ref.getObjectByName('dedo' + i);
                    // TODO: test rotation limits
                    if (dedo) {
                        var axis = new THREE.Vector3((i <= 2 ? 1 : -1), 0, (i <= 2 ? -p(i)*q(i) : 0));  // TODO: check this
                        axis.normalize();
                        dedo.rotateOnAxis(axis, angle);
                    }
                }
            }
            break;

        case 49: // '1'
            switchCamera(cameraFront);
            break;
        case 50: // '2'
            switchCamera(cameraSide);
            break;
        case 51: // '3'
            switchCamera(cameraTop);
            break;
        case 52: // '4'
            switchCamera(cameraFixedOrtho);
            break;
        case 53: // '5'
            switchCamera(cameraFixedPerspective);
            break;
        // case 54: // '6'  // TODO: implement mobile camera
        //     switchCamera(cameraMobile);
        //     break;
        case 55: // '7'
            toggleWireframe(scene);  // TODO: check this
            break;


    }
}

/////////////////////
/* KEY UP CALLBACK */
/////////////////////
function onKeyUp(e){
    'use strict';
}

///////////
/* UTILS */
///////////

function createTetrahedron(edgeLength, verticalHeight, color) {
    'use strict';

    // Calculate the altitude of the equilateral triangle that forms the base of the tetrahedron
    var base_height = Math.sqrt(3) / 2 * edgeLength;

    // Define the vertices of the tetrahedron
    var vertices = new Float32Array([
        -base_height / 3, 0, -edgeLength / 2,   // vertex 0
        -base_height / 3, 0, edgeLength / 2,    // vertex 1
        2 * base_height / 3, 0, 0,              // vertex 2
        0, verticalHeight, 0                    // vertex 3
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

function p(n){ return Math.sign(-n%2 + 0.5); }

function q(n){ return Math.sign(-2*n + 5); }

function g(n){ return -p(n)*((q(n)+1)/2 * Math.PI/12 - (q(n)-1)/2 * Math.PI/4);}

function material(color) {
    return new THREE.MeshBasicMaterial({color: color, wireframe: true});
}

function color(i) { // TODO: remove
    return i == 1 ? "red" : i == 2 ? "green" : i == 3 ? "yellow" : i == 4 ? "blue" : "black";
}

function roundTo(number, decimalPlaces) {
    let factor = Math.pow(10, decimalPlaces);
    return Math.round(number * factor) / factor;
}

function toggleWireframe(object) {
    'use strict';
    object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material.wireframe = !child.material.wireframe;
        }
    });
}

init();
animate();