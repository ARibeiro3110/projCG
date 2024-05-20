import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var carousel, renderer, camera, scene, controls, clock;

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////
const G = Object.freeze({ // Geometry constants
    cylinder: { radius: 0.5, height: 12, radialSegments: 32 },
    rings: { radius: [0.5, 5, 7.5, 10], height: 0.5, thetaSegments: 32 },
    mobiusStrip: { radius: 3, width: 1, segments: 100, tubularSegments: 50, d_cylinder: 1.5},
    paramSurfaces: [
        { func: cylindricalSurface, scale: 0.6 },
        { func: hyperboloid, scale: 0.05 },
        { func: sineSurface, scale: 0.05 },
        { func: twistedCone, scale: 0.6 },
        { func: saddleSurface, scale: 0.6 },
        { func: flaredCylinder, scale: 0.6 },
        { func: wavyCylinder, scale: 0.6 },
        { func: hyperboloidOfOneSheet, scale: 0.4 },
    ],
});

const M = Object.freeze({ // Material constants
    cylinder: new THREE.MeshBasicMaterial({color: 0x00FF00}),
    ring1: new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }),
    ring2: new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
    ring3: new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide }),
    mobiusStrip: new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide }),
    parametricSurface: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
});

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
    createSkydome();
}

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
    
    // Cylinder

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(G.cylinder.radius,
    G.cylinder.radius, G.cylinder.height, G.cylinder.radialSegments), M.cylinder);
    cylinder.position.set(0, G.cylinder.height/2, 0);

    carousel.add(cylinder);

    // Mobius strip

    const mobiusStrip =  new THREE.Mesh(MobiusStripGeometry(G.mobiusStrip.radius,
        G.mobiusStrip.width, G.mobiusStrip.segments, G.mobiusStrip.tubularSegments), M.mobiusStrip);
    mobiusStrip.position.set(0, G.cylinder.height + G.mobiusStrip.width/2 + G.mobiusStrip.d_cylinder, 0);
    mobiusStrip.rotation.x = Math.PI / 2;
    
    carousel.add(mobiusStrip);

    // Rings

    var ref_rings = {};

    for (let i = 1; i <= 3; i++) {
        ref_rings[i] = new THREE.Object3D();
        ref_rings[i].name = 'ring' + i;
        ref_rings[i].position.set(0, 0, 0);

        var geometry = createExtrudedRingGeometry(G.rings.radius[i-1], G.rings.radius[i], G.rings.height);
        var ring = new THREE.Mesh(geometry, M['ring' + i]);

        ring.position.set(0, 0, 0);
        ring.rotation.x = -Math.PI / 2;

        ref_rings[i].add(ring);

        carousel.add(ref_rings[i]);
    }

    // Parametric surfaces
    for (let i = 1; i <= 3; i++) { // For each ring
        // Randomize list order
        var surfs = G.paramSurfaces.slice().sort(() => Math.random() - 0.5);
        for (let j = 0; j < 8; j++) { // Instantiate 8 parametric geometries
            var angle = j * Math.PI / 4;
            var r = (G.rings.radius[i] + G.rings.radius[i-1]) / 2;
            var surf_height = 1.5; // TODO how to get this value properly?
            var vector = new THREE.Vector3(r * Math.cos(angle), G.rings.height + surf_height/2, r * Math.sin(angle));
            var surf = addParametricGeometry(surfs[j].func, 50, 50, vector, surfs[j].scale);

            ref_rings[i].add(surf);
        }
    }
    
    scene.add(carousel);
    
    return carousel;
}
                    
function createSkydome() {
    // Load the texture
    const loader = new THREE.TextureLoader();
    loader.load('skydome.png', function (texture) {
        const geometry = new THREE.SphereGeometry(100, 60, 40, 0, Math.PI * 2, 0, Math.PI/2);
        // sphere geometry arguments: 
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide // Dome must be visible from the inside
        });
        
        const dome = new THREE.Mesh(geometry, material);
        dome.position.set(0, 0, 0);
        scene.add(dome);
    });
}

function addParametricGeometry(func, slices, stacks, position, scale) {
    const geometry = new ParametricGeometry(func, slices, stacks);
    const mesh = new THREE.Mesh(geometry, M.parametricSurface);
    mesh.position.copy(position);
    mesh.scale.set(scale, scale, scale); // Scale down the geometry
    
    // Add random rotation
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.rotation.z = Math.random() * Math.PI;

    return mesh;
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

    // TODO: implement window resize callback
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

////////////////////////////
/* AUXILIARY FUNCTIONS */
////////////////////////////

// Create the Mobius strip geometry
function MobiusStripGeometry(radius, width, segments, tubularSegments) {
    'use strict';

    const mobiusGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let i = 0; i <= segments; i++) {
        for (let j = 0; j <= tubularSegments; j++) {
            const u = i / segments * Math.PI * 2;
            const v = (j / tubularSegments - 0.5) * width;

            const x = Math.cos(u) * (radius + v * Math.cos(u / 2));
            const y = Math.sin(u) * (radius + v * Math.cos(u / 2));
            const z = v * Math.sin(u / 2);

            vertices.push(x, y, z);

            // Normal and UV calculations are omitted for simplicity
            // but they should be added for proper lighting and texturing
            normals.push(0, 0, 1);
            uvs.push(i / segments, j / tubularSegments);
        }
    }

    const indices = [];

    for (let i = 1; i <= segments; i++) {
        for (let j = 1; j <= tubularSegments; j++) {
            const a = (tubularSegments + 1) * i + j - 1;
            const b = (tubularSegments + 1) * (i - 1) + j - 1;
            const c = (tubularSegments + 1) * (i - 1) + j;
            const d = (tubularSegments + 1) * i + j;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    mobiusGeometry.setIndex(indices);
    mobiusGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mobiusGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    mobiusGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    return mobiusGeometry;
}

// Create an extruded ring geometry
function createExtrudedRingGeometry(innerRadius, outerRadius, height) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = {
        depth: height,
        bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

function cylindricalSurface(u, v, target) {
    const height = 2;
    const radius = 0.5;
    const x = radius * Math.cos(v * 2 * Math.PI);
    const y = radius * Math.sin(v * 2 * Math.PI);
    const z = height * (u - 0.5);
    target.set(x, y, z);
}

function hyperboloid(u, v, target) {
    u *= Math.PI;
    v *= 2 * Math.PI;
    const x = Math.cosh(u) * Math.cos(v);
    const y = Math.cosh(u) * Math.sin(v);
    const z = Math.sinh(u);
    target.set(x, y, z);
}

function sineSurface(u, v, target) {
    const x = u * 20 - 10;
    const y = Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2) * 5;
    const z = v * 20 - 10;
    target.set(x, y, z);
}

function twistedCone(u, v, target) {
    const height = 2;
    const twist = 5;
    const radius = 1 - u;
    const x = radius * Math.cos(v * 2 * Math.PI + u * twist * Math.PI);
    const y = radius * Math.sin(v * 2 * Math.PI + u * twist * Math.PI);
    const z = height * u;
    target.set(x, y, z);
}

function saddleSurface(u, v, target) {
    const width = 2;
    const x = width * (u - 0.5);
    const y = width * (v - 0.5);
    const z = x * y;
    target.set(x, y, z);
}

function flaredCylinder(u, v, target) {
    const height = 2;
    const baseRadius = 0.5;
    const topRadius = 1;
    const radius = baseRadius + (topRadius - baseRadius) * u;
    const x = radius * Math.cos(v * 2 * Math.PI);
    const y = radius * Math.sin(v * 2 * Math.PI);
    const z = height * (u - 0.5);
    target.set(x, y, z);
}

function wavyCylinder(u, v, target) {
    const height = 2;
    const baseRadius = 0.5;

    // Convert v from [0, 1] to [0, 2*PI] for full rotation
    const theta = v * 2 * Math.PI;

    const waveAmplitude = 0.1;
    const waveFrequency = 3;

    // Radius varies with a sinusoidal wave at both ends
    const radius = baseRadius + waveAmplitude * Math.sin(waveFrequency * theta);

    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    const z = height * (u - 0.5);

    target.set(x, y, z);
}

function hyperboloidOfOneSheet(u, v, target) {
    const a = 1;
    const b = 2;

    // u is the angular coordinate, v ranges linearly along the straight lines
    const angle = 2 * Math.PI * u;
    const z = 2 * (v - 0.5); // Scale v to range from -1 to 1

    const pinchFactor = 0.5; // Controls the degree of inward curvature
    const factor = Math.sqrt(z * z + pinchFactor);

    const x = a * factor * Math.cos(angle);
    const y = a * factor * Math.sin(angle);

    target.set(x, y, b * z);
}

init();
animate();