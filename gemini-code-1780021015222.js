import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

// --- 1. SMOOTH SCROLL (Lenis) ---
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like easing
  smooth: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- 2. THREE.JS SCENE SETUP ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.02); // Sci-fi depth

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic lighting

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0x00f0ff, 2); // Cyan rim light
directionalLight.position.set(5, 5, 5);
scene.add(ambientLight, directionalLight);

// Load GLTF Truck
let truck;
const gltfLoader = new GLTFLoader();
gltfLoader.load('/assets/cyber_truck.glb', (gltf) => {
  truck = gltf.scene;
  scene.add(truck);
  
  // Setup GSAP Camera/Model Animations once loaded
  setupScrollAnimations();
});

// Particle System (Data Flow/AI effect)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 20;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- 3. GSAP SCROLLTRIGGER ANIMATIONS ---
function setupScrollAnimations() {
  // Cinematic Camera Movement
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-container",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5, // Smooth scrubbing
    }
  });

  // Move camera around the truck as user scrolls
  tl.to(camera.position, { x: 5, y: 3, z: 5, ease: "power2.inOut" })
    .to(camera.rotation, { y: Math.PI / 4, ease: "power2.inOut" }, "<")
    .to(truck.rotation, { y: Math.PI, ease: "none" }, 0); // Spin truck slightly
}

// UI Typography Stagger Animations
const splitTexts = document.querySelectorAll('.stagger-text');
splitTexts.forEach(text => {
  gsap.fromTo(text, 
    { y: 100, opacity: 0 },
    { 
      y: 0, 
      opacity: 1, 
      duration: 1.2, 
      ease: "expo.out", 
      scrollTrigger: {
        trigger: text,
        start: "top 80%",
      }
    }
  );
});

// Render Loop
const clock = new THREE.Clock();
function tick() {
  const elapsedTime = clock.getElapsedTime();
  
  // Animate particles slowly
  particlesMesh.rotation.y = elapsedTime * 0.05;
  particlesMesh.rotation.x = elapsedTime * 0.02;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// Handle Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});