import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var camera, scene, renderer, controls;
var grua, container;
var objects = [];
var objectsColliders = [];
var clock;

var animation = ({
    running: false,
    phase: 0,
    carriedObject: null,
})

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
    contentor: new THREE.MeshBasicMaterial({ color: "red", wireframe: true, side: THREE.DoubleSide }),
    carga: new THREE.MeshBasicMaterial({ color: "black", wireframe: true})
});

const G = Object.freeze({ // Geometry constants
    base: { r: 1.5, h: 0.25 },
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
    dedo: { l: 0.25, h: 1 },
    contentor: { h: 1.5, w: 2, d: 1.5 }
});

var apotemaBase = Math.sqrt(3) * G.dedo.l / 2;
var hipotenusa = Math.sqrt((apotemaBase/2)**2 + G.dedo.h**2);
var angulo1 = Math.asin((apotemaBase/2) / hipotenusa);
var d_centro_baseDedo = Math.sqrt((G.bloco.l/2)**2 + (G.bloco.w/2)**2) * (2/3) - apotemaBase/2;
var angulo2 = Math.asin((d_centro_baseDedo) / hipotenusa);
var maxDedo = angulo1 + angulo2;

const DOF = Object.freeze({ // Degrees of freedom
    eixo: { vel: [0, 0], step: Math.PI/16 },
    carrinho: { vel: [0, 0], step: 0.5, min: G.torre.l/2 + G.carrinho.l/2, max: G.torre.l/2 + G.lanca.l - G.carrinho.l/2 },
    bloco: { vel: [0, 0], step: 0.75, min: (G.dedo.h + G.bloco.h) - (G.torre.h + G.lanca.d), max: -G.carrinho.h },
    dedo: { vel: [0, 0], step: Math.PI/8, min: -Math.PI/4, max: maxDedo, cur_angle: 0 }
});

const cameras = {
    front: createOrthographicCamera(0, 0, 20),
    side: createOrthographicCamera(20, 0, 0),
    top: createOrthographicCamera(0, 20, 0),
    fixedOrtho: createOrthographicCamera(20, 20, 20),
    fixedPerspective: createPerspectiveCamera(20, 20, 20, 1),
    mobile: createPerspectiveCamera(20, 20, 20, 0.1)  // Camera position will be updated in createRefBloco()
};

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    // background color
    scene.background = new THREE.Color(0xB6D0E2);

    grua = createCrane();
    container = createContainer();
    objects = createGeometricObjects();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
    'use strict';

    // Set default camera
    camera = cameras.front;

    // Loop through cameras and look at scene position
    for (const key in cameras) {
        if (key === "mobile") {
            cameras[key].lookAt(new THREE.Vector3(0, -100, 0)); 
        } else {
            cameras[key].lookAt(scene.position);
        }
    }

    // Additional setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

 
}

function createOrthographicCamera(x, y, z) {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const frustumSize = 30;
    const camera = new THREE.OrthographicCamera(
        -frustumSize * aspectRatio / 2, frustumSize * aspectRatio / 2,
        frustumSize / 2, -frustumSize / 2, 1, 1000
    );
    camera.position.set(x, y, z);
    return camera;
}

function createPerspectiveCamera(x, y, z, near) {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(70, aspectRatio, near, 1000);
    camera.position.set(x, y, z);
    return camera;
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
    components.portaLancaTopo.rotateY(-Math.PI/2);

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

    ref_bloco.add(cameras.mobile);
    cameras.mobile.position.set(0, -G.bloco.h -G.dedo.h, 0);

    for (var i = 1; i <= 4; i++) {
        var dedo = new THREE.Mesh(createTetrahedronGeom(G.dedo.l, -G.dedo.h), M.dedo);
        dedo.rotateY(g(i));
        dedo.name = 'dedo' + i;
        dedo.position.set(p(i) * G.bloco.l * (1/3), -G.bloco.h, q(i) * G.bloco.w * (1/3));
        ref_bloco.add(dedo);

        // Create collider for finger
        var colliderRadius = G.dedo.h / 2;
        var collider = new THREE.Mesh(new THREE.SphereGeometry(colliderRadius, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
        collider.position.copy(dedo.position);
        collider.position.y -= G.dedo.h/2;
        collider.name = 'fingerCollider' + i;
        ref_bloco.add(collider);
    }

    return ref_bloco;
}

function createContainer() {
    'use strict';

    var height = G.contentor.h;
    var width = G.contentor.w;
    var depth = G.contentor.d;

    var vertices = new Float32Array([
        // Front face
        -width / 2, -height / 2, depth / 2,  // bottom left 0
        width / 2, -height / 2, depth / 2,   // bottom right 1
        width / 2, height / 2, depth / 2,    // top right 2
        -width / 2, height / 2, depth / 2,   // top left 3

        // Back face
        -width / 2, -height / 2, -depth / 2, // bottom left 4
        width / 2, -height / 2, -depth / 2,  // bottom right 5
        width / 2, height / 2, -depth / 2,   // top right 6
        -width / 2, height / 2, -depth / 2,  // top left 7
    ]);

    var indices = [
        // Front face
        0, 1, 2,  0, 2, 3,
        // Back face
        4, 5, 6,  4, 6, 7,
        // Bottom face
        0, 1, 5,  0, 5, 4,
        // Right face
        1, 5, 6,  1, 6, 2,
        // Left face
        0, 4, 7,  0, 7, 3
    ];
    
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    var container = new THREE.Mesh(geometry, M.contentor);

    container.position.set(6, height/2, 6);
    scene.add(container);

    return container;
}

function createGeometricObjects() {
    'use strict';

    var geometries = [
        new THREE.BoxGeometry(0.6, 0.5, 0.4), // Cube
        new THREE.DodecahedronGeometry(0.35), // Dodecahedron
        new THREE.IcosahedronGeometry(0.5), // Icosahedron
        new THREE.TorusGeometry(0.4, 0.2, 16, 100), // Torus
        new THREE.TorusKnotGeometry(0.3, 0.2, 100, 16) // Torus Knot
    ];

    geometries.sort(() => Math.random() - 0.5);

    var step = (G.lanca.l - G.base.r) / 5;
    var radius = G.base.r + 1;
    var mesh, collider;

    geometries.forEach((geometry) => {
        do {
            let angle = Math.random() * 2 * Math.PI;

            let x = Math.cos(angle) * radius;
            let y = 0;
            let z = Math.sin(angle) * radius;

            mesh = new THREE.Mesh(geometry, M.carga);
            mesh.position.set(x, y, z);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            
        } while (isIntersectingWithContainer(mesh)); // If the object intersects with the container, create another one

        scene.add(mesh);
        objects.push(mesh);
        radius += step;

        // Create collider for object
        mesh.geometry.computeBoundingSphere();
        collider = new THREE.Mesh(new THREE.SphereGeometry(mesh.geometry.boundingSphere.radius, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
        collider.position.copy(mesh.position);
        scene.add(collider);
        objectsColliders.push(collider);

    });

    return objects;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';

    for (var i = 1; i <= 4; i++) {
        var fingerCollider = grua.getObjectByName('ref_bloco').getObjectByName('fingerCollider' + i);
        if (fingerCollider) {
            // Get finger colliders's position and radius
            var finger_pos = fingerCollider.getWorldPosition(new THREE.Vector3());
            var finger_r = fingerCollider.geometry.parameters.radius;

            for (var j = 0; j < objects.length; j++) {
                // Get object collider's position and radius
                var object_pos = objectsColliders[j].getWorldPosition(new THREE.Vector3());
                var object_r = objectsColliders[j].geometry.parameters.radius;

                if ((finger_r + object_r)**2 > (finger_pos.x - object_pos.x)**2 + 
                        (finger_pos.y - object_pos.y)**2 + (finger_pos.z - object_pos.z)**2) {
                    animation.carriedObject = objects[j];
                    return true;
                }
            }
        }
    }
    return false;
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

    var ref_eixo = grua.getObjectByName("ref_eixo");
    var ref_carrinho = grua.getObjectByName("ref_carrinho");
    var ref_bloco = grua.getObjectByName("ref_bloco");

    if (animation.running) { // Animation-driven movement
        // Add object to ref_bloco
        if (!animation.carriedObject.parent || animation.carriedObject.parent !== ref_bloco) {
            ref_bloco.add(animation.carriedObject);
            var obj_radius = animation.carriedObject.geometry.parameters.radius || Math.max(animation.carriedObject.geometry.parameters.width,
                                                                                            animation.carriedObject.geometry.parameters.height,
                                                                                            animation.carriedObject.geometry.parameters.depth) / 2;
            animation.carriedObject.position.set(0, - G.bloco.h/2 - G.dedo.h - obj_radius, 0);
        }

        switch (animation.phase) {
            case 0:
                updatePhase0(delta_t);
                break;
            case 1:
                updatePhase1(delta_t);
                break;
            case 2:
                updatePhase2(delta_t);
                break;
            case 3:
                updatePhase3(delta_t);
                break;
            default:
                break;
        }
    }
    else { // Key-driven movement
        if (checkCollisions())
            animation.running = true;
        
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
}

function updatePhase0(delta_t) {
    'use strict';

    var ref_bloco = grua.getObjectByName("ref_bloco");

    var vel = 1 * DOF.dedo.step * delta_t;
            
    if (DOF.dedo.cur_angle + vel < DOF.dedo.max) {
        for (var i = 1; i <= 4; i++) {
            var dedo = ref_bloco.getObjectByName('dedo' + i);
            if (dedo) {
                dedo.rotateOnAxis(new THREE.Vector3(-1, 0, 0), vel);
            }
        }
        DOF.dedo.cur_angle += vel;
    }
    else { // If fingers are closed
        DOF.dedo.cur_angle = DOF.dedo.max; // Align to target angle
        animation.phase = 1;
    }
}

function updatePhase1(delta_t) {
    'use strict';

    var ref_eixo = grua.getObjectByName("ref_eixo");
    var ref_carrinho = grua.getObjectByName("ref_carrinho");
    var ref_bloco = grua.getObjectByName("ref_bloco");

    var vel;
    var containerPos = container.position;

    /* Raise block */
    vel = 1 * DOF.bloco.step * delta_t;
    var pos = ref_bloco.position;
    var cabo_de_aco = ref_carrinho.getObjectByName("cabo_de_aco");
    
    if (pos.y + vel < -4) {
        pos.y += vel;
        
        // Retract cable
        cabo_de_aco.position.y += vel/2;
        cabo_de_aco.scale.y -= vel/2;
    }

    // Get block position in world coordinates
    var blockPos = ref_bloco.getWorldPosition(new THREE.Vector3());

    // Get distance to container in xz plane
    var dist_to_container = Math.sqrt((containerPos.x - blockPos.x)**2 + (containerPos.z - blockPos.z)**2);

    // This condition prevents the object from colliding with the container
    if (dist_to_container > 2 || pos.y >= -4 - vel) {
        /* Rotate crane to container */
        vel = 1 * DOF.eixo.step * delta_t;
        var pos = ref_eixo.position;

        var angle = ref_eixo.rotation.y;
        var targetAngle = -Math.atan2(containerPos.z - pos.z, containerPos.x - pos.x);
        var diff_angle = targetAngle - angle; // Angle difference

        if (Math.abs(diff_angle) > vel) {
            ref_eixo.rotation.y += Math.sign(diff_angle) * vel;
        } else {
            ref_eixo.rotation.y = targetAngle; // Align to target angle
        }

        /* Align kart with container */
        vel = 1 * DOF.carrinho.step * delta_t;
        var pos = ref_carrinho.position;

        var center = ref_eixo.position;
        var dist_container = Math.sqrt((containerPos.x - center.x)**2 + (containerPos.z - center.z)**2);
        var dist_carrinho = Math.abs(pos.x - center.x);
        var diff_dist = dist_container - dist_carrinho; // Distance difference

        if (Math.abs(diff_dist) > vel) {
            pos.x += Math.sign(diff_dist) * vel;
        } else {
            pos.x = dist_container; // Align to target distance
        }

        if (!diff_angle && !diff_dist) // If the block is already aligned with the container
            animation.phase = 2;
    }
}

function updatePhase2(delta_t) {
    'use strict';

    var ref_carrinho = grua.getObjectByName("ref_carrinho");
    var ref_bloco = grua.getObjectByName("ref_bloco");

    var vel = -1 * DOF.bloco.step * delta_t;
    var pos = ref_bloco.position;

    if (pos.y + vel > DOF.bloco.min + G.contentor.h) {
        pos.y += vel;
        
        // Extend cable
        var cabo_de_aco = ref_carrinho.getObjectByName("cabo_de_aco");
        cabo_de_aco.position.y += vel/2;
        cabo_de_aco.scale.y -= vel/2;
    }
    else { // If the block is already lowered
        animation.phase = 3;
    }
}

function updatePhase3(delta_t) {
    'use strict';

    var ref_bloco = grua.getObjectByName("ref_bloco");

    if (DOF.dedo.cur_angle > 0) {
        var vel = -1 * DOF.dedo.step * delta_t;
        for (var i = 1; i <= 4; i++) {
            var dedo = ref_bloco.getObjectByName('dedo' + i);
            if (dedo) {
                dedo.rotateOnAxis(new THREE.Vector3(-1, 0, 0), vel);
            }
        }
        DOF.dedo.cur_angle += vel;
    }
    else { // If fingers are open
        ref_bloco.remove(animation.carriedObject);
        var index = objects.indexOf(animation.carriedObject);
        objects.splice(index, 1); // Remove object from objects array

        scene.remove(objectsColliders[index]); // Remove collider
        objectsColliders.splice(index, 1);
        
        animation.running = false; // End of animation
        animation.phase = 0;
        animation.carriedObject = null;
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
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

    if (animation.running) {
        return;
    }

    switch (e.keyCode) {
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
            camera = cameras.front;
            break;
        case 50: // '2'
            camera = cameras.side;
            break;
        case 51: // '3'
            camera = cameras.top;
            break;
        case 52: // '4'
            camera = cameras.fixedOrtho;
            break;
        case 53: // '5'
            camera = cameras.fixedPerspective;
            break;
        case 54: // '6'
            camera = cameras.mobile;
            break;
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

function g(n){ return -p(n) * (1/4 + (q(n)+1)/4) * Math.PI; }

function material(color) {
    return new THREE.MeshBasicMaterial({color: color, wireframe: true});
}

function toggleWireframe(e, isKeyUp) {
    'use strict';
    if (e.repeat || isKeyUp) return;
    Object.values(M).forEach((material) => (material.wireframe = !material.wireframe));
}

function isIntersectingWithContainer(mesh) {
    // Get the bounding box of the mesh
    var boundingBox = new THREE.Box3().setFromObject(mesh);

    // Container bounds
    var minX = container.position.x - G.contentor.w / 2;
    var maxX = container.position.x + G.contentor.w / 2;
    var minZ = container.position.z - G.contentor.d / 2;
    var maxZ = container.position.z + G.contentor.d / 2;

    // Check if the mesh's bounding box intersects with the container
    return (
        (boundingBox.min.x <= maxX && boundingBox.max.x >= minX) &&
        (boundingBox.min.z <= maxZ && boundingBox.max.z >= minZ)
    );
}

init();
animate();