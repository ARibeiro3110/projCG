import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var carousel, renderer, camera, defaultCamera, stereoCamera, scene, controls, clock;
var directionalLight, ambientLight, pointLights = [], spotLights = [];
var isDirectionalLightOn = true, isPointLightsOn = true, isSpotLightsOn = true;
var currentMaterialType = 'lambert'; // Default material type  TODO: check this
var shouldUpdateMaterials = false; 
const meshes = [];
var resized = false;

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
        { func: hyperboloidOfOneSheet, scale: 0.3 },
    ],
});

const MaterialTypes = {
    lambert: (color) => new THREE.MeshLambertMaterial({ color: color, side: THREE.DoubleSide }),
    phong: (color) => new THREE.MeshPhongMaterial({ color: color, specular: 0x555555, shininess: 30, side: THREE.DoubleSide }),
    toon: (color) => new THREE.MeshToonMaterial({ color: color, side: THREE.DoubleSide }),
    normal: () => new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
    basic: (color) => new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }),
};

const materialColors = {
    cylinder: 0x00FF00,
    ring1: 0xffff00,
    ring2: 0xff0000,
    ring3: 0x0000ff,
    mobiusStrip: 0xff0055,
    parametricSurface: 0x00ff55,
};

const DOF = Object.freeze({ // Degrees of freedom
    carousel: { vel: 1, step: 0.1 },
    rings: [
        { vel: 0, dir: 1, step: 2, min: 0, max: G.cylinder.height - G.rings.height},
        { vel: 0, dir: 1, step: 2, min: 0, max: G.cylinder.height - G.rings.height},
        { vel: 0, dir: 1, step: 2, min: 0, max: G.cylinder.height - G.rings.height },
    ],
    surfaces : new Array(24).fill({ vel: 1, step: Math.random() * 0.4 + 0.6, axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()) }),
});

const keyListItems = document.querySelectorAll('#key-list li');

const codeToKey = {
    49: '1',
    50: '2',
    51: '3',
};

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
    
    defaultCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    defaultCamera.position.set(30, 20, 30);
    defaultCamera.lookAt(scene.position);
    
    controls = new OrbitControls(defaultCamera, renderer.domElement);

    // Stereo camera setup
    stereoCamera = new THREE.StereoCamera();
    stereoCamera.aspect = 0.5;
    stereoCamera.eyeSep = 0.1; // Adjust this value to increase or decrease eye separation

    return defaultCamera;
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
    const spotlight = new THREE.SpotLight(0xffffff, 1, 50, Math.PI / 2 , 0.5, 2);
    spotlight.position.set(position.x, G.rings.height, position.z);
    spotlight.target.position.set(position.x, position.y + 100, position.z);  // Aim the light upward TODO: keep it at 100 or lower it?

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

    const mobiusStrip =  createMesh('mobiusStrip', MobiusStripGeometry(G.mobiusStrip.radius,
        G.mobiusStrip.width, G.mobiusStrip.segments, G.mobiusStrip.tubularSegments));
    mobiusStrip.position.set(0, G.cylinder.height + G.mobiusStrip.width/2 + G.mobiusStrip.d_cylinder, 0);
    mobiusStrip.rotation.x = Math.PI / 2;

    createPointLights(carousel);
    
    carousel.add(mobiusStrip);

    // Rings

    var ref_rings = {};

    for (let i = 1; i <= 3; i++) {
        ref_rings[i] = new THREE.Object3D();
        ref_rings[i].name = 'ref_ring_' + i;
        ref_rings[i].position.set(0, 0, 0);

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
        var surfs = G.paramSurfaces.slice().sort(() => Math.random() - 0.5);
        for (let j = 0; j < 8; j++) { // Instantiate 8 parametric geometries
            var angle = j * Math.PI / 4;
            var r = (G.rings.radius[i] + G.rings.radius[i-1]) / 2;
            var surf_height = 1.5; // TODO how to get this value properly?
            var position = new THREE.Vector3(r * Math.cos(angle), G.rings.height + surf_height/2, r * Math.sin(angle));
            var surf = addParametricGeometry(surfs[j].func, 50, 50, position, surfs[j].scale);
            createSpotlight(position, ref_rings[i]);

            ref_rings[i].add(surf);
        }
    }
    
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
        renderer.setSize(window.innerWidth, window.innerHeight);

        if(window.innerHeight > 0 && window.innerWidth > 0) {
            camera.aspect = renderer.getSize().width / renderer.getSize().height;
            camera.updateProjectionMatrix();
        }
    }

}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';
    renderer.render(scene, camera);

    // Update stereo camera and render
    //stereoCamera.update(camera);

    // Render left eye
    // renderer.setScissorTest(true);
    // renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
    // renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
    // //renderer.render(scene, stereoCamera.cameraL);

    // // Render right eye
    // renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    // renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    // renderer.render(scene, stereoCamera.cameraR);

    //renderer.setScissorTest(false);
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
    // renderer.xr.enabled = true;
    // document.body.appendChild(VRButton.createButton(renderer));

    clock = new THREE.Clock();

    createScene();
    camera = createCamera();
    scene.add(camera);
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

    controls.update();

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

    keyListItems.forEach(item => {
        const listItemKey = item.getAttribute('data-key');
        if (listItemKey === codeToKey[e.keyCode]
            && !item.classList.contains('key-pressed')) {
            item.classList.add('key-pressed');
        }
    });

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
    
    const mesh = new THREE.Mesh(geometry, materials.lambert); // Default to Lambert TODO: check this
    mesh.userData = { materials };
    
    meshes.push(mesh);
    return mesh;
}

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

            // TODO calculate normals
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

init();
animate();