import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import gsap from 'gsap';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

//  Base
 
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

//  Floor
 
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5,
        envMapIntensity: 1,
        envMap: scene.background
    })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

//  Lights
 
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.shadow.bias = -0.005;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

//  Sizes
 
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

//  Camera
 
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0.22, 1.020, 3.02);



let tl = gsap.timeline();

const cameraPositions = [
    { x: 0.22, y: 1.020, z: 3.02, delay: 3 },
    { x: -3.38, y: 1.020, z: -0.18 },
    { x: -0.18, y: 1.020, z: -2.979 },
    { x: 3.22, y: 1.020, z: -0.180 },
    { x: 0.22, y: 1.019, z: 7.80 },
    { x: -0.05, y: 1.019, z: 3.82 }
];

tl.to(camera.position, {
    duration: 2,
    ease: 'power2.inOut',
    delay: cameraPositions[0].delay || 0,
    onComplete: function() {
        let i = 1;
        function animateCamera() {
            tl.to(camera.position, {
                x: cameraPositions[i % cameraPositions.length].x,
                y: cameraPositions[i % cameraPositions.length].y,
                z: cameraPositions[i % cameraPositions.length].z,
                duration: 2,
                ease: 'power2.inOut',
                delay: cameraPositions[i % cameraPositions.length].delay || 0,
                onComplete: function() {
                    i++;
                    animateCamera();
                }
            });
        }
        animateCamera();
    }
});



scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    outputEncoding: THREE.sRGBEncoding // Use sRGB colors
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// GUI Controls
const guiControls = {
    timeScale: 1 // Default animation speed
};

// Array to store all FBX animations
const additionalFBXActions = [];

// Load additional animations
const additionalFBXFiles = [
    '/Character/Push Up.fbx', 
    '/Character/Flair.fbx', 
    '/Character/Run To Flip.fbx', 
    '/Character/Swimming To Edge.fbx', 
    '/Character/Northern Soul Spin Combo.fbx', 
    '/Character/Northern Soul Floor Combo.fbx', 
];

// FBXloader
const fbxLoader = new FBXLoader();
let fbxMixer = null;
const fbxActions = [];
let activeFBXAction = null;

// Load FBX Model
fbxLoader.load(
    '/Character/Hip Hop Dancing(skin).fbx', // Replace with your FBX model path
    (fbx) => {
        fbx.scale.set(0.01, 0.01, 0.01);
        fbx.position.set(-0.2, 0, -0.2);

        // gui.add(fbx.position, 'x', -10, 10).name('X Position');
        // gui.add(fbx.position, 'y', -10, 10).name('Y Position');
        // gui.add(fbx.position, 'z', -10, 10).name('Z Position');    

        scene.add(fbx);

        fbx.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        fbxMixer = new THREE.AnimationMixer(fbx);

        fbx.animations.forEach((clip, index) => {
            const action = fbxMixer.clipAction(clip);
            fbxActions.push(action);
            if (index === 0) activeFBXAction = action;
        });

        activeFBXAction.play();

        // Add GUI for default animations
        fbx.animations.forEach((clip, index) => {
            gui.add({ playAnimation: () => switchFBXAnimation(index) }, 'playAnimation')
                .name(`Animation ${index + 1}`);
        });

        additionalFBXFiles.forEach((file, index) => {
            fbxLoader.load(
                file,
                (fbx) => {
                    const clip = fbx.animations[0]; // Assuming each FBX file contains one animation
                    const action = fbxMixer.clipAction(clip);
                    additionalFBXActions.push(action);
        
                    // Add GUI control for each additional animation
                    gui.add({ playAnimation: () => switchFBXAnimation(fbxActions.length + index) }, 'playAnimation')
                        .name(`Animation ${index + 3}`);
                },
                undefined,
                (error) => console.error('Error loading FBX:', error)
            );
        });

    },
    undefined,
    (error) => console.error(error)
);

function switchFBXAnimation(index) {
    if (activeFBXAction) {
        activeFBXAction.fadeOut(0.5);
    }

    if (index < fbxActions.length) {
        activeFBXAction = fbxActions[index];
    } else {
        activeFBXAction = additionalFBXActions[index - fbxActions.length];
    }

    activeFBXAction.reset().fadeIn(0.5).play();
}

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const Animate = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // Update fbxMixers
    if (fbxMixer) fbxMixer.update(deltaTime);

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(Animate);
};

Animate();
