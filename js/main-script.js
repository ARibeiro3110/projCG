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
var clock;

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////
const M = Object.freeze({ // Material constants
    base: new THREE.MeshBasicMaterial({ color: "black", wireframe: true}),
    torre: new THREE.MeshBasicMaterial({ color: "yellow", wireframe: true}),
    portaLancaBase: new THREE.MeshBasicMaterial({ color: "yellow", wireframe: true}),
    portaLancaTopo: new THREE.MeshBasicMaterial({ color: "yellow", wireframe: true}),
    cabine: new THREE.MeshBasicMaterial({ color: "grey", wireframe: true}),
    lanca: new THREE.MeshBasicMaterial({ color: "yellow", wireframe: true}),
    contraLanca: new THREE.MeshBasicMaterial({ color: "yellow", wireframe: true}),
    contrapeso: new THREE.MeshBasicMaterial({ color: "grey", wireframe: true}),
    tirante: new THREE.MeshBasicMaterial({ color: "black", wireframe: true}),
    carrinho: new THREE.MeshBasicMaterial({ color: "black", wireframe: true}),
    cabo: new THREE.MeshBasicMaterial({ color: "black", wireframe: true}),
    bloco: new THREE.MeshBasicMaterial({ color: "black", wireframe: true}),
    dedo: new THREE.MeshBasicMaterial({ color: "grey", wireframe: true, side: THREE.DoubleSide}),
    contentor: new THREE.MeshBasicMaterial({ color: "red", wireframe: true, side: THREE.DoubleSide })
});

const G = Object.freeze({ // Geometry constants
    base: { r: 1.5, h: 0.5 },
    torre: { l: 1, h: 7, w: 1 },
    portaLancaBase: { l: 1, h: 2, w: 1 },
    portaLancaTopo: { h: 2 },
    cabine: { l: 1, h: 1, w: 0.5, d: 0.5 },
    lanca: { l: 10, h: 1, w: 1, d: 2 },
    contraLanca: { l: 4, h: 1, w: 1 },
    contrapeso: { l: 1, h: 1, w: 1, d: 2 },
    tirante: { r: 0.01, d: 5.5 },
    carrinho: { l: 1, h: 0.5, w: 1 },
    cabo: { r: 0.05, l: 2 },
    bloco: { l: 0.75, h: 0.75, w: 0.75 },
    dedo: { h: 1 }
});

const DOF = Object.freeze({ // Degrees of freedom
    eixo: { vel: [0, 0], step: Math.PI/16 },
    carrinho: { vel: [0, 0], step: 0.5, min: G.torre.l/2 + G.carrinho.l/2, max: G.torre.l/2 + G.lanca.l - G.carrinho.l/2 },
    bloco: { vel: [0, 0], step: 0.75, min: (G.dedo.h + G.bloco.h) - (G.torre.h + G.lanca.d), max: -G.carrinho.h },
    dedo: { vel: [0, 0], step: Math.PI/16, min: -Math.PI/4, max: Math.PI/9, cur_angle: 0 }  // TODO: adjust min and max values
});

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    // background color
    scene.background = new THREE.Color(0xB6D0E2);  // TODO: change to light colour

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
    var base = new THREE.Mesh(new THREE.CylinderGeometry(G.base.r, G.base.r, G.base.h), M.base);
    grua.add(base);

    // Create torre metálica
    var torreMetalica = new THREE.Mesh(new THREE.BoxGeometry(G.torre.l, G.torre.h, G.torre.w), M.torre);
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
        portaLancaBase: new THREE.Mesh(new THREE.BoxGeometry(G.portaLancaBase.l, G.portaLancaBase.h, G.portaLancaBase.w), M.portaLancaBase),
        portaLancaTopo: new THREE.Mesh(createTetrahedronGeom(1, G.portaLancaTopo.h), M.portaLancaTopo),
        cabine: new THREE.Mesh(new THREE.BoxGeometry(G.cabine.l, G.cabine.h, G.cabine.w), M.cabine),
        lanca: new THREE.Mesh(new THREE.BoxGeometry(G.lanca.l, G.lanca.h, G.lanca.w), M.lanca),
        contraLanca: new THREE.Mesh(new THREE.BoxGeometry(G.contraLanca.l, G.contraLanca.h, G.contraLanca.w), M.contraLanca),
        contrapeso: new THREE.Mesh(new THREE.BoxGeometry(G.contrapeso.l, G.contrapeso.h, G.contrapeso.w), M.contrapeso),
        tiranteLanca: new THREE.Mesh(new THREE.CylinderGeometry(G.tirante.r, G.tirante.r, Math.sqrt(G.portaLancaTopo.h**2 + G.tirante.d**2)), M.tirante),
        tiranteContraLanca1: new THREE.Mesh(new THREE.CylinderGeometry(G.tirante.r, G.tirante.r, Math.sqrt((G.portaLancaTopo.h+G.contraLanca.h)**2 + G.contrapeso.d**2)), M.tirante),
        tiranteContraLanca2: undefined // to be defined later
    };

    components.portaLancaBase.position.set(0, G.portaLancaBase.h/2, 0);

    components.portaLancaTopo.position.set(0, G.portaLancaBase.h + G.lanca.h, 0);
    components.portaLancaTopo.rotateY(-Math.PI/2); // TODO: alterar posição

    components.cabine.position.set(0, G.cabine.h/2 + G.cabine.d, G.torre.l/2 + G.cabine.w/2);

    components.lanca.position.set(G.lanca.l/2 + G.portaLancaBase.l/2, G.lanca.h/2 + G.lanca.d, 0);

    components.contraLanca.position.set(-G.contraLanca.l/2 + G.portaLancaBase.l/2, G.contraLanca.h/2 + G.lanca.d, 0);

    components.contrapeso.position.set(-G.contrapeso.d - G.contrapeso.l/2, G.contrapeso.h/2 + G.contraLanca.h, 0);

    components.tiranteLanca.rotation.z = Math.atan(G.tirante.d / G.portaLancaTopo.h);
    components.tiranteLanca.position.set(G.tirante.d/2, G.portaLancaBase.h + G.portaLancaTopo.h/2 + G.lanca.h, 0);

    components.tiranteContraLanca1.rotation.z = -Math.atan(G.contrapeso.d / (G.portaLancaTopo.h + G.contraLanca.h));
    components.tiranteContraLanca1.rotation.y = Math.atan(G.contraLanca.w/2 / G.contrapeso.d);
    components.tiranteContraLanca1.position.set(-G.contrapeso.d/2, G.portaLancaBase.h + G.portaLancaTopo.h - (G.portaLancaTopo.h+G.contraLanca.h)/2 + G.lanca.h, G.contraLanca.w/4);

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
        carrinho: new THREE.Mesh(new THREE.BoxGeometry(G.carrinho.l, G.carrinho.h, G.carrinho.w), M.carrinho),
        cabo_de_aco: new THREE.Mesh(new THREE.CylinderGeometry(G.cabo.r, G.cabo.r, G.cabo.l), M.cabo)
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

    var bloco = new THREE.Mesh(new THREE.BoxGeometry(G.bloco.l, G.bloco.h, G.bloco.w), M.bloco);
    bloco.position.set(0, -G.bloco.h/2, 0);
    ref_bloco.add(bloco);

    for (var i = 1; i <= 4; i++) {
        var dedo = new THREE.Mesh(createTetrahedronGeom(0.25, -G.dedo.h), M.dedo);
        dedo.rotateY(g(i));
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

    var cuboid = new THREE.Mesh(geometry, M.contentor);

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
function update(delta_t){
    'use strict';

    checkCollisions();

    // Update degrees of freedom
    var ref_eixo = grua.getObjectByName("ref_eixo");
    var ref_carrinho = grua.getObjectByName("ref_carrinho");
    var ref_bloco = grua.getObjectByName("ref_bloco");

    var vel;

    // Update eixo
    vel = DOF.eixo.vel[0] + DOF.eixo.vel[1]; // Get velocity direction
    vel = vel * DOF.eixo.step * delta_t; // Scale up velocity
    ref_eixo.rotation.y += vel;

    // Update carrinho
    vel = DOF.carrinho.vel[0] + DOF.carrinho.vel[1];
    vel = vel * DOF.carrinho.step * delta_t;
    
    var pos = ref_carrinho.position;
    if (pos.x + vel > DOF.carrinho.min && pos.x + vel < DOF.carrinho.max) {
        pos.x += vel;
    }

    // Update bloco
    vel = DOF.bloco.vel[0] + DOF.bloco.vel[1];
    vel = vel * DOF.bloco.step * delta_t;

    var pos = ref_bloco.position;
    if (pos.y + vel > DOF.bloco.min && pos.y + vel < DOF.bloco.max) {
        pos.y += vel;
        
        // Extend cable
        var cabo_de_aco = ref_carrinho.getObjectByName("cabo_de_aco");
        cabo_de_aco.position.y += vel/2;
        cabo_de_aco.scale.y -= vel/2;
    }

    // Update dedos
    vel = DOF.dedo.vel[0] + DOF.dedo.vel[1];
    var angle = vel * DOF.dedo.step * delta_t;

    var rotated = false;

    var axis = new THREE.Vector3(-1, 0, 0);
    axis.normalize();

    if (DOF.dedo.cur_angle + angle > DOF.dedo.min && DOF.dedo.cur_angle + angle < DOF.dedo.max) {
        for (var i = 1; i <= 4; i++) {
            var dedo = ref_bloco.getObjectByName('dedo' + i);
            if (dedo) {
                dedo.rotateOnAxis(axis, angle);
            }
        }
        rotated = true;
    }

    if (rotated) {
        DOF.dedo.cur_angle += angle;
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

    clock = new THREE.Clock();

    createScene();
    createCameras();

    render();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';
    
    var delta_t = clock.getDelta();

    update(delta_t);

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
            DOF.eixo.vel[0] = -1; // rotate in the negative direction
            break;

        case 97:  // a
        case 65:  // A
            DOF.eixo.vel[1] = 1; // rotate in the positive direction
            break;

        case 119: // w
        case 87:  // W
            DOF.carrinho.vel[1] = 1; // go forward
            break;

        case 115: // s
        case 83:  // S
            DOF.carrinho.vel[0] = -1; // go backward
            break;

        case 101: // e
        case 69:  // E
            DOF.bloco.vel[0] = -1; // go down
            break;

        case 100: // D
        case 68:  // d
            DOF.bloco.vel[1] = 1; // go up
            break;
        
        case 114: // r
        case 82:  // R
            DOF.dedo.vel[1] = 1; // rotate in the positive direction
            break;
        case 102: // f
        case 70:  // F
            DOF.dedo.vel[0] = -1; // rotate in the negative direction
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
            toggleWireframe(e);
            break;


    }
}

/////////////////////
/* KEY UP CALLBACK */
/////////////////////
function onKeyUp(e){
    'use strict';

    switch (e.keyCode) {
        case 113: // q
        case 81:  // Q
            DOF.eixo.vel[0] = 0;
            break;

        case 97:  // a
        case 65:  // A
            DOF.eixo.vel[1] = 0;
            break;

        case 119: // w
        case 87:  // W
            DOF.carrinho.vel[1] = 0;
            break;

        case 115: // s
        case 83:  // S
            DOF.carrinho.vel[0] = 0;
            break;

        case 101: // e
        case 69:  // E
            DOF.bloco.vel[0] = 0;
            break;

        case 100: // D
        case 68:  // d
            DOF.bloco.vel[1] = 0;
            break;
        
        case 114: // r
        case 82:  // R
            DOF.dedo.vel[1] = 0;
            break;
        
        case 102: // f
        case 70:  // F
            DOF.dedo.vel[0] = 0;
            break;
    }
}

///////////
/* UTILS */
///////////
function createTetrahedronGeom(edgeLength, verticalHeight) {
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

    return geometry;
}

function p(n){ return Math.sign(-n%2 + 0.5); }

function q(n){ return Math.sign(-2*n + 5); }

function g(n){ return -p(n) * (1/4 + (q(n)+1)/4) * Math.PI;}

function material(color) {
    return new THREE.MeshBasicMaterial({color: color, wireframe: true});
}

function toggleWireframe(e, isKeyUp) {
    'use strict';
    if (e.repeat || isKeyUp) return;
    Object.values(M).forEach((material) => (material.wireframe = !material.wireframe));
}

init();
animate();