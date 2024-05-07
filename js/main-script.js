import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

var camera, scene, renderer, controls;

var grua;

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
    createContainer(2, 1.5, 1.5, "red");
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
function createCrane() {
    'use strict';

    grua = new THREE.Object3D();
    
    var r_base = 1.5;
    var h_base = 0.5;
    
    var l_torre = 1;
    var h_torre = 7;
    var w_torre = l_torre;
    
    var l_portaLancaBase = 1;
    var h_portaLancaBase = 3;
    var w_portaLancaBase = l_portaLancaBase;

    var h_portaLancaTopo = 2;
    
    var l_cabine = 1;
    var h_cabine = 1;
    var w_cabine = 0.5;
    var d_torre_cabine = 0.5;

    var l_lanca = 10;
    var h_lanca = 1;
    var w_lanca = h_lanca;
    var d_torre_lanca = 2;
    
    var l_contraLanca = 4;
    var h_contraLanca = 1;
    var w_contraLanca = 1;

    var l_contrapeso = 1;
    var h_contrapeso = 2;
    var w_contrapeso = 1;
    var d_portaLanca_contrapeso = 2;

    var r_tirante = 0.01;
    var d_torre_extremoTiranteLanca = 5.5;
    var l_tiranteLanca = Math.sqrt(h_portaLancaTopo**2 + d_torre_extremoTiranteLanca**2);
    var l_tiranteContraLanca = Math.sqrt((h_portaLancaTopo+h_contraLanca)**2 + d_portaLanca_contrapeso**2);

    var l_carrinho = 1;
    var h_carrinho = 0.5;
    var w_carrinho = 1;

    var r_cabo = 0.05;
    var l_cabo = 2;

    var l_bloco = 0.75;
    var h_bloco = 0.75;
    var w_bloco = 0.75;
    
    var h_dedo = 1;

    // add white plane in y = -h_base/2
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({color: "white", wireframe: false}));
    plane.rotation.x = -Math.PI/2;
    plane.position.y = 0;

    var base = new THREE.Mesh(new THREE.CylinderGeometry(r_base, r_base, h_base), material("green"));
    var torreMetalica = new THREE.Mesh(new THREE.BoxGeometry(l_torre, h_torre, w_torre), material("blue"));
    torreMetalica.position.set(0, h_base/2 + h_torre/2, 0);

    var ref_eixo = new THREE.Object3D();
    ref_eixo.name = "ref_eixo";
    ref_eixo.position.set(0, h_base/2 + h_torre, 0);

        var portaLancaBase = new THREE.Mesh(new THREE.BoxGeometry(l_portaLancaBase, h_portaLancaBase, w_portaLancaBase), material("purple"));
        portaLancaBase.position.y = h_portaLancaBase/2;
        ref_eixo.add(portaLancaBase);

        var portaLancaTopo = createTetrahedron(1, h_portaLancaTopo, "red");
        portaLancaTopo.position.y = h_portaLancaBase;
        ref_eixo.add(portaLancaTopo);

        var cabine = new THREE.Mesh(new THREE.BoxGeometry(l_cabine, h_cabine, w_cabine), material("yellow"));
        cabine.position.set(0, h_cabine/2 + d_torre_cabine, l_torre/2 + w_cabine/2);
        ref_eixo.add(cabine);
    
        var lanca = new THREE.Mesh(new THREE.BoxGeometry(l_lanca, h_lanca, w_lanca), material("orange"));
        lanca.position.set(l_lanca/2 + l_portaLancaBase/2, h_lanca/2 + d_torre_lanca, 0);
        ref_eixo.add(lanca);

        var contraLanca = new THREE.Mesh(new THREE.BoxGeometry(l_contraLanca, h_contraLanca, w_contraLanca), material("blue"));
        contraLanca.position.set(-l_contraLanca/2 + l_portaLancaBase/2, h_contraLanca/2 + d_torre_lanca, 0);
        ref_eixo.add(contraLanca);

        var contrapeso = new THREE.Mesh(new THREE.BoxGeometry(l_contrapeso, h_contrapeso, w_contrapeso), material("red"));
        contrapeso.position.set(-d_portaLanca_contrapeso - l_contrapeso/2, h_contrapeso/2 + h_contraLanca, 0);
        ref_eixo.add(contrapeso);

        var tiranteLanca = new THREE.Mesh(new THREE.CylinderGeometry(r_tirante, r_tirante, l_tiranteLanca), material("green"));
        tiranteLanca.rotation.z = Math.atan(d_torre_extremoTiranteLanca / h_portaLancaTopo);
        tiranteLanca.position.set(d_torre_extremoTiranteLanca/2, h_portaLancaBase + h_portaLancaTopo/2, 0);
        ref_eixo.add(tiranteLanca);
        
        var tiranteContraLanca1 = new THREE.Mesh(new THREE.CylinderGeometry(r_tirante, r_tirante, l_tiranteContraLanca), material("green"));
        tiranteContraLanca1.rotation.z = -Math.atan(d_portaLanca_contrapeso / (h_portaLancaTopo + h_contraLanca));
        tiranteContraLanca1.rotation.y = Math.atan(w_contraLanca/2 / d_portaLanca_contrapeso)
        tiranteContraLanca1.position.set(-d_portaLanca_contrapeso/2, h_portaLancaBase + h_portaLancaTopo - (h_portaLancaTopo+h_contraLanca)/2, w_contraLanca/4);
        ref_eixo.add(tiranteContraLanca1);

        var tiranteContraLanca2 = new THREE.Mesh(new THREE.CylinderGeometry(r_tirante, r_tirante, l_tiranteContraLanca), material("green"));
        tiranteContraLanca2.rotation.z = -Math.atan(d_portaLanca_contrapeso / (h_portaLancaTopo + h_contraLanca));
        tiranteContraLanca2.rotation.y = -Math.atan(w_contraLanca/2 / d_portaLanca_contrapeso)
        tiranteContraLanca2.position.set(-d_portaLanca_contrapeso/2, h_portaLancaBase + h_portaLancaTopo/2 - h_contraLanca/2, -w_contraLanca/4);
        ref_eixo.add(tiranteContraLanca2);

        var ref_carrinho = new THREE.Object3D();
        ref_carrinho.name = "ref_carrinho";
        ref_carrinho.userData.max_x = l_torre/2 + l_lanca - l_carrinho/2;
        ref_carrinho.userData.min_x = l_torre/2 + l_carrinho/2;
        ref_carrinho.position.set(ref_carrinho.userData.max_x, d_torre_lanca, 0); // TODO: alterar beta
        
            var carrinho = new THREE.Mesh(new THREE.BoxGeometry(l_carrinho, h_carrinho, w_carrinho), material("pink"));
            carrinho.position.y = -h_carrinho/2;
            ref_carrinho.add(carrinho); 

            var cabo_de_aco = new THREE.Mesh(new THREE.CylinderGeometry(r_cabo, r_cabo, l_cabo), material("green"));
            cabo_de_aco.name = "cabo_de_aco";
            cabo_de_aco.position.y = -h_carrinho - l_cabo/2;
            ref_carrinho.add(cabo_de_aco);

            var ref_bloco = new THREE.Object3D();
            ref_bloco.name = "ref_bloco";
            ref_bloco.userData.max_y = -h_carrinho;
            ref_bloco.userData.min_y = (h_dedo + h_bloco) -(h_base/2 + h_torre + d_torre_lanca);
            ref_bloco.position.y = -h_carrinho - l_cabo;

                var bloco = new THREE.Mesh(new THREE.BoxGeometry(l_bloco, h_bloco, w_bloco), material("brown"));
                bloco.position.y = -h_bloco/2;
                ref_bloco.add(bloco);

                for (var i = 1; i <= 4; i++) {
                    var dedo = createTetrahedron(0.25, -h_dedo, "yellow");
                    // TODO: add g(i) rotation
                    dedo.name = 'dedo' + i;
                    dedo.position.set(p(i) * l_bloco / 4, -h_bloco, q(i) * l_bloco / 4); // FIXME: w_bloco
                    ref_bloco.add(dedo);
                }

    grua.add(base);
    grua.add(torreMetalica);
    grua.add(ref_eixo);
    grua.add(plane);
    
    ref_eixo.add(ref_carrinho);
    ref_carrinho.add(ref_bloco);

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

    // window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    // window.addEventListener("keyup", onKeyUp);
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

    switch (e.keyCode) {
        // TODO: aplicar mudanças sobre graus de liberdade em vez de atributos do referencial

        case 113: // q
        case 81:  // Q
            grua.getObjectByName("ref_eixo").rotation.y += 0.025/4;
            break;

        case 97:  // a
        case 65:  // A
            grua.getObjectByName("ref_eixo").rotation.y -= 0.025/4;
            break;
        
        case 119: // w
        case 87:  // W
            var ref = grua.getObjectByName("ref_carrinho");
            if (ref.position.x < ref.userData.max_x)
                ref.position.x = roundTo(ref.position.x + 0.05, 2)
            console.log(ref.position.x);
            break;
        
        case 115: // s
        case 83:  // S
            var ref = grua.getObjectByName("ref_carrinho");
            if (ref.position.x > ref.userData.min_x)
                ref.position.x = roundTo(ref.position.x - 0.05, 2);
            console.log(ref.position.x);
            break;
        
        case 101: // e
        case 69:  // E
            var ref = grua.getObjectByName("ref_bloco");
            var ref_carrinho = grua.getObjectByName("ref_carrinho");
            var cabo_de_aco = grua.getObjectByName("cabo_de_aco");
            if (ref.position.y > ref.userData.min_y) {
                // TODO cleanup and set constant
                ref.position.y = roundTo(ref.position.y - 0.05, 4);
                cabo_de_aco.position.y = roundTo(cabo_de_aco.position.y - 0.05/2, 4);
                cabo_de_aco.scale.y = roundTo(cabo_de_aco.scale.y + 0.05/2, 4);
            }
            console.log(ref.position.y);
            break;
        
        case 100: // D
        case 68:  // d
            var ref = grua.getObjectByName("ref_bloco");
            var ref_carrinho = grua.getObjectByName("ref_carrinho");
            var cabo_de_aco = grua.getObjectByName("cabo_de_aco");
            if (ref.position.y < ref.userData.max_y) {
                // TODO cleanup and set constant
                ref.position.y = roundTo(ref.position.y + 0.05, 4);
                cabo_de_aco.position.y = roundTo(cabo_de_aco.position.y + 0.05/2, 4);
                cabo_de_aco.scale.y = roundTo(cabo_de_aco.scale.y - 0.05/2, 4);
            }
            console.log(ref.position.y);
            break;

        case 114: // r
        case 82:  // R
            var ref = grua.getObjectByName("ref_bloco");
            if (ref) {
                var angle = Math.PI / 24;

                for (var i = 1; i <= 4; i++) {
                    var dedo = ref.getObjectByName('dedo' + i);
                    if (dedo) {
                        var axis = new THREE.Vector3(p(i), 0, q(i));  // check this
                        axis.normalize(); 
                        dedo.rotateOnAxis(axis, angle);
                    }
                }
            }
            break;
    }
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

function p(n){ return Math.sign(-n%2 + 0.5); }

function q(n){ return Math.sign(-2*n + 5); }

function g(n){ return -p(n)*((q(n)+1)/2 * Math.PI/4 - ((q(n)-1)/2 * Math.PI/12)); }

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
        4, 6, 5,  4, 7, 6,
        // Bottom face
        8, 9, 10, 8, 10, 11,
        // Right face
        1, 5, 6,  1, 6, 2,
        // Left face
        0, 3, 7,  0, 7, 4
    ];

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    var cuboid = new THREE.Mesh(geometry, material(color));

    cuboid.position.set(6, height/2, 6);
    scene.add(cuboid);

    return cuboid;
}

function material(color) {
    return new THREE.MeshBasicMaterial({color: color, wireframe: true});
}

function roundTo(number, decimalPlaces) {
    let factor = Math.pow(10, decimalPlaces);
    return Math.round(number * factor) / factor;
}

init();
animate();