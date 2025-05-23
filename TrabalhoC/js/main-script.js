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
var directionalLight, ambientLight, pointLights = [], spotLights = [];
var isDirectionalLightOn = true, isPointLightsOn = true, isSpotLightsOn = true;
var currentMaterialType, shouldUpdateMaterials = false; 
const meshes = [];
var resized = false;

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////

const G = Object.freeze({ // Geometry constants
    cylinder: { radius: 0.5, height: 12, radialSegments: 32 },
    rings: { radius: [0.5, 5, 7.5, 10], height: 0.5, thetaSegments: 32 },
    mobiusStrip: { radius: 3, width: 1, d_cylinder: 3.5},
    paramSurfaces: {
        surfaces: [
            { func: cylindricalSurface, minScale: 0.5, maxScale: 0.7 },
            { func: hyperboloid, minScale: 0.03, maxScale: 0.07 },
            { func: sineSurface, minScale: 0.03, maxScale: 0.07 },
            { func: twistedCone, minScale: 0.5, maxScale: 0.7 },
            { func: saddleSurface, minScale: 0.5, maxScale: 0.7 },
            { func: flaredCylinder, minScale: 0.5, maxScale: 0.7 },
            { func: wavyCylinder, minScale: 0.5, maxScale: 0.7 },
            { func: hyperboloidOfOneSheet, minScale: 0.2, maxScale: 0.3 },
        ],
        dist_ring: 1.3,
    },
});

const MaterialTypes = {
    lambert: (color) => new THREE.MeshLambertMaterial({ color: color, side: THREE.DoubleSide }),
    phong: (color) => new THREE.MeshPhongMaterial({ color: color, specular: 0x555555, shininess: 30, side: THREE.DoubleSide }),
    toon: (color) => new THREE.MeshToonMaterial({ color: color, side: THREE.DoubleSide }),
    normal: () => new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
    basic: (color) => new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }),
};

const materialColors = {
    cylinder: 0xa3d9f5,
    ring1: 0x0d92e9,
    ring2: 0x66bff0,
    ring3: 0x0d92e9,
    mobiusStrip: 0xFAFC97,
    parametricSurface: 0xa0aeba,
};

const DOF = Object.freeze({ // Degrees of freedom
    carousel: { vel: 1, step: 0.1 },
    rings: [
        { vel: 1, dir: 1, step: 2, min: 0, max: G.cylinder.height - G.rings.height},
        { vel: 1, dir: 1, step: 2, min: 0, max: G.cylinder.height - G.rings.height},
        { vel: 1, dir: 1, step: 2, min: 0, max: G.cylinder.height - G.rings.height },
    ],
    surfaces : new Array(24).fill({ vel: 1, step: Math.random() * 0.6 + 0.6, axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()) }),
});

const verticalOffset = -(G.cylinder.height + 1.6); // Offset to make VR camera start at a higher position

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';
    
    scene = new THREE.Scene();
    
    scene.add(new THREE.AxesHelper(10));
    
    // background color
    scene.background = new THREE.Color(0xE3E0E0);
    
    carousel = createCarousel();
    createSkydome();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
    'use strict';
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(20, 20 + verticalOffset, 30);

    camera.lookAt(scene.position.x, scene.position.y + G.cylinder.height/2 + verticalOffset, scene.position.z);

    scene.add(camera);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createGlobalLights() {
    'use strict';
    // Directional light
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 20);
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);

    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffa500, 1);
    scene.add(ambientLight);
}

function createPointLights(carousel) {
    'use strict';
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const light = new THREE.PointLight(0xffffff, 0.5, 10);
        light.position.set(
            Math.cos(angle) * G.mobiusStrip.radius,
            G.cylinder.height + G.mobiusStrip.width / 2 + G.mobiusStrip.d_cylinder,
            Math.sin(angle) * G.mobiusStrip.radius
        );
        carousel.add(light);
        pointLights.push(light);
    }
}

function createSpotlight(position, ring) {
    'use strict';
    const spotlight = new THREE.SpotLight(0xffffff, 2, 10, Math.PI / 2, 0.3, 2);
    spotlight.position.set(position.x, position.y - G.paramSurfaces.dist_ring/2, position.z);
    spotlight.target.position.set(position.x, position.y, position.z);

    ring.add(spotlight);
    ring.add(spotlight.target);

    spotLights.push(spotlight);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createCarousel() {
    'use strict';
    
    var carousel = new THREE.Object3D();
    
    // Cylinder

    const cylinder = createMesh('cylinder', new THREE.CylinderGeometry(G.cylinder.radius,
        G.cylinder.radius, G.cylinder.height, G.cylinder.radialSegments));
    cylinder.position.set(0, G.cylinder.height/2, 0);

    carousel.add(cylinder);

    // Mobius strip

    const mobiusStrip =  createMesh('mobiusStrip', MobiusStripGeometry());
    mobiusStrip.position.set(0, G.cylinder.height + G.mobiusStrip.width/2 + G.mobiusStrip.d_cylinder, 0);
    mobiusStrip.rotation.x = Math.PI / 2;

    createPointLights(carousel);
    
    carousel.add(mobiusStrip);

    // Rings

    var ref_rings = {};
    const initial_ring_offset = 1.5;

    for (let i = 1; i <= 3; i++) {
        ref_rings[i] = new THREE.Object3D();
        ref_rings[i].name = 'ref_ring_' + i;
        ref_rings[i].position.set(0, initial_ring_offset*(3-i), 0);

        var geometry = createExtrudedRingGeometry(G.rings.radius[i-1], G.rings.radius[i], G.rings.height);
        var ring = createMesh('ring' + i, geometry);

        ring.position.set(0, 0, 0);
        ring.rotation.x = -Math.PI / 2;

        ref_rings[i].add(ring);

        carousel.add(ref_rings[i]);
    }

    // Parametric surfaces

    for (let i = 1; i <= 3; i++) { // For each ring
        // Randomize list order
        var surfs = G.paramSurfaces.surfaces.slice().sort(() => Math.random() - 0.5);
        for (let j = 0; j < 8; j++) { // Instantiate 8 parametric geometries
            var angle = j * Math.PI / 4;
            var r = (G.rings.radius[i] + G.rings.radius[i-1]) / 2;
            var position = new THREE.Vector3(r * Math.cos(angle), G.rings.height + G.paramSurfaces.dist_ring, r * Math.sin(angle));
            var scale = Math.random() * (surfs[j].maxScale - surfs[j].minScale) + surfs[j].minScale;

            var surf = addParametricGeometry(surfs[j].func, 50, 50, position, scale);
            createSpotlight(position, ref_rings[i]);

            ref_rings[i].add(surf);
        }
    }

    // Add vertical offset to the carousel
    carousel.position.y += verticalOffset;
    
    scene.add(carousel);
    
    return carousel;
}
                    
function createSkydome() {
    // Load the textures
    const loader = new THREE.TextureLoader();
    
    // Load the main map, bump map, and displacement map
    const map = loader.load('skydome.png');
    const bmap = loader.load('skydome-bump.png');
    const dmap = loader.load('skydome-displacement.png');
    
    const geometry = new THREE.SphereGeometry(30, 60, 40, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Create the material with multiple textures
    const material = new THREE.MeshPhongMaterial({
        bumpMap: bmap,
        bumpScale: 1.3,
        displacementMap: dmap,
        displacementScale: 1,
        side: THREE.BackSide, // Dome must be visible from the inside
        map: map
    });
    
    const dome = new THREE.Mesh(geometry, material);
    dome.position.set(0, 0, 0);
    dome.rotation.y = Math.PI / 2;

    // Add vertical offset to the dome
    dome.position.y += verticalOffset;
    
    scene.add(dome);
}

function addParametricGeometry(func, slices, stacks, position, scale) {
    const geometry = new ParametricGeometry(func, slices, stacks);
    const mesh = createMesh('parametricSurface', geometry);
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
function update(delta_t) {
    'use strict';

    // Update lights visibility
    if (isDirectionalLightOn) {
        directionalLight.visible = true;
    } else {
        directionalLight.visible = false;
    }

    pointLights.forEach(light => {
        light.visible = isPointLightsOn;
    });

    spotLights.forEach(light => {
        light.visible = isSpotLightsOn;
    });

    // Update carousel rotation
    carousel.rotation.y += DOF.carousel.vel * DOF.carousel.step * delta_t;

    // Update rings position

    for (let i = 1; i <= 3; i++) {
        const ref_ring = carousel.getObjectByName('ref_ring_' + i);
        const DOF_ring = DOF.rings[i-1];

        const vel = DOF_ring.vel * DOF_ring.dir * DOF_ring.step * delta_t;
        
        // Oscillate the ring up and down
        const midpoint = (DOF_ring.max + DOF_ring.min) / 2;
        const amplitude = (DOF_ring.max - DOF_ring.min) / 2;

        const angle = Math.asin((ref_ring.position.y - midpoint) / amplitude);

        const newAngle = angle + vel / amplitude;

        if (newAngle >= Math.PI / 2) {
            DOF_ring.dir = -1;
        } else if (newAngle <= -Math.PI / 2) {
            DOF_ring.dir = 1;
        }

        ref_ring.position.y = midpoint + amplitude * Math.sin(newAngle);
    }

    // Update parametric surfaces

    carousel.children.forEach(child => {
        if (child.name === 'ref_ring_1' || child.name === 'ref_ring_2' || child.name === 'ref_ring_3') {
            // Remove first child (the ring) and keep the parametric surfaces
            const surfs = child.children.slice(1);
            surfs.forEach((surf, i) => {
                const DOF_surf = DOF.surfaces[i];
                const axis = DOF_surf.axis;
                const vel = DOF_surf.vel * DOF_surf.step * delta_t;

                surf.rotation.x += vel * axis.x;
                surf.rotation.y += vel * axis.y;
                surf.rotation.z += vel * axis.z;
            });
        }
    })

    if (shouldUpdateMaterials) {
        meshes.forEach((mesh) => (mesh.material = mesh.userData.materials[currentMaterialType]));      
        shouldUpdateMaterials = false;
    }

    if (resized) {
        const inVRMode = renderer.xr.isPresenting;
        renderer.xr.isPresenting = false;
        renderer.setSize(window.innerWidth, window.innerHeight);

        if(window.innerHeight > 0 && window.innerWidth > 0) {
            updateCamera(inVRMode? renderer.xr.getCamera() : camera);
        }
        resized = false;
        renderer.xr.isPresenting = inVRMode;
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

    // VR
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));

    clock = new THREE.Clock();

    createScene();
    createCamera();
    createGlobalLights();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    var delta_t = clock.getDelta();

    update(delta_t);

    render();

    renderer.setAnimationLoop(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() { 
    resized = true;

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

    switch (e.keyCode) {
        case 49: // 1
            DOF.rings[0].vel = 1 - DOF.rings[0].vel; // Toggle velocity
            DOF.rings[0].pressed = true;
            break;
        case 50: // 2
            DOF.rings[1].vel = 1 - DOF.rings[1].vel;
            DOF.rings[1].pressed = true;
            break;
        case 51: // 3
            DOF.rings[2].vel = 1 - DOF.rings[2].vel;
            DOF.rings[2].pressed = true;
            break;
        case 68: // 'D'
        case 100: // 'd'
            isDirectionalLightOn = !isDirectionalLightOn;
            break;
        case 80: // 'P'
        case 112: // 'p'
            isPointLightsOn = !isPointLightsOn;
            break;
        case 83: // 'S'
        case 115: // 's'
            isSpotLightsOn = !isSpotLightsOn;
            break;
        case 81: // 'Q'
        case 113:
            currentMaterialType = 'lambert';
            shouldUpdateMaterials = true;
            break;
        case 87: // 'W'
        case 119: // 'w'
            currentMaterialType = 'phong';
            shouldUpdateMaterials = true;
            break;
        case 69: // 'E'
        case 101: // 'e'
            currentMaterialType = 'toon';
            shouldUpdateMaterials = true;
            break;
        case 82: // 'R'
        case 114: // 'r'
            currentMaterialType = 'normal';
            shouldUpdateMaterials = true;
            break;
        case 84:
        case 116:
            // Deactivate lighting calculations by using the basic material
            currentMaterialType = 'basic';
            shouldUpdateMaterials = true;
        default:
            break;
    }
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
function createMesh(name, geometry) {
    const color = materialColors[name];
    const materials = {
        lambert: MaterialTypes.lambert(color),
        phong: MaterialTypes.phong(color),
        toon: MaterialTypes.toon(color),
        normal: MaterialTypes.normal(),
        basic: MaterialTypes.basic(color),
    };
    
    const mesh = new THREE.Mesh(geometry, materials.toon); // Default material
    mesh.userData = { materials };
    
    meshes.push(mesh);
    return mesh;
}

// Create the Mobius strip geometry with explicit vertices and faces
function MobiusStripGeometry() {
    const geometry = new THREE.BufferGeometry();

    const indices = [];

    // Define the vertices for the Möbius strip
    const vertices = new Float32Array(
        [
            2.50, 0.00, 0.00, // v0
            3.50, 0.00, 0.00, // v1
            2.45, 0.52, -0.05, // v2
            3.42, 0.73, 0.05, // v3
            2.29, 1.02, -0.10, // v4
            3.19, 1.42, 0.10, // v5
            2.04, 1.48, -0.15, // v6
            2.81, 2.04, 0.15, // v7
            1.70, 1.89, -0.20, // v8
            2.31, 2.57, 0.20, // v9
            1.28, 2.22, -0.25, // v10
            1.72, 2.97, 0.25, // v11
            0.80, 2.47, -0.29, // v12
            1.05, 3.24, 0.29, // v13
            0.27, 2.61, -0.33, // v14
            0.35, 3.35, 0.33, // v15
            -0.28, 2.65, -0.37, // v16
            -0.35, 3.32, 0.37, // v17
            -0.84, 2.57, -0.40, // v18
            -1.02, 3.13, 0.40, // v19
            -1.37, 2.38, -0.43, // v20
            -1.62, 2.81, 0.43, // v21
            -1.87, 2.08, -0.46, // v22
            -2.14, 2.38, 0.46, // v23
            -2.30, 1.67, -0.48, // v24
            -2.55, 1.85, 0.48, // v25
            -2.65, 1.18, -0.49, // v26
            -2.84, 1.26, 0.49, // v27
            -2.88, 0.61, -0.50, // v28
            -2.99, 0.63, 0.50, // v29
            -3.00, 0.00, -0.50, // v30
            -3.00, 0.00, 0.50, // v31
            -2.99, -0.63, -0.50, // v32
            -2.88, -0.61, 0.50, // v33
            -2.84, -1.26, -0.49, // v34
            -2.65, -1.18, 0.49, // v35
            -2.55, -1.85, -0.48, // v36
            -2.30, -1.67, 0.48, // v37
            -2.14, -2.38, -0.46, // v38
            -1.87, -2.08, 0.46, // v39
            -1.63, -2.81, -0.43, // v40
            -1.38, -2.38, 0.43, // v41
            -1.02, -3.13, -0.40, // v42
            -0.84, -2.57, 0.40, // v43
            -0.35, -3.32, -0.37, // v44
            -0.28, -2.65, 0.37, // v45
            0.35, -3.35, -0.33, // v46
            0.27, -2.61, 0.33, // v47
            1.05, -3.24, -0.29, // v48
            0.80, -2.47, 0.29, // v49
            1.72, -2.97, -0.25, // v50
            1.28, -2.22, 0.25, // v51
            2.31, -2.57, -0.20, // v52
            1.70, -1.89, 0.20, // v53
            2.81, -2.04, -0.15, // v54
            2.04, -1.48, 0.15, // v55
            3.19, -1.42, -0.10, // v56
            2.29, -1.02, 0.10, // v57
            3.42, -0.73, -0.05, // v58
            2.45, -0.52, 0.05, // v59
            3.50, -0.00, -0.00, // v60
            2.50, -0.00, 0.00, // v61
        ]);

    // Define the faces (two triangles per segment to form a quad)
    for (let i = 0; i < 30; i++) {
        const currentA = i * 2;
        const currentB = currentA + 1;
        const nextA = (i + 1) * 2;
        const nextB = nextA + 1;

        indices.push(currentA, nextA, nextB);
        indices.push(currentA, nextB, currentB);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    return geometry;
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
        curveSegments: 100,
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

function updateCamera(camera) {
    'use strict';
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

init();
animate();