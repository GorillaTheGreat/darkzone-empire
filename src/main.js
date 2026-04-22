import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";



const loaderCannonBall = new GLTFLoader();
let cannonballModel = null;
let canShoot = false;

loaderCannonBall.load("./src/models/cannonBall.glb", (gltf) => {
  cannonballModel = gltf.scene;
  cannonballModel.scale.set(1, 1, 1);

  canShoot = true;
});

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// ground physics
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Renderer Setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
document.body.appendChild(renderer.domElement);


// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.set(-32, 16, -32);;

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

// Scene Setup
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });

function setupLights() {
  const light1 = new THREE.DirectionalLight();
  light1.position.set(1, 1, 1);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight();
  light2.position.set(-1, 1, -0.5);
  scene.add(light2);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.1;
  scene.add(ambient);
}

function setupWorld(size) {
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(x, 0, z);
      scene.add(cube);
    }
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
setupWorld(32);

const loader = new GLTFLoader();

let character;

loader.load(
  "./src/characters/human.glb", 
  function (gltf) {

    character = gltf.scene;
    character.scale.set(5, 5, 5);
    character.position.set(4.6, 4.6, 4.6);

    scene.add(character);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    console.error("Error loading model:", error);
  }
);
geometry.computeVertexNormals();

const keys = {
  w: false,
  a: false,
  s: false,
  d: false
};

window.addEventListener("keydown", (e) => {
  if (e.key === "w") keys.w = true;
  if (e.key === "a") keys.a = true;
  if (e.key === "s") keys.s = true;
  if (e.key === "d") keys.d = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "w") keys.w = false;
  if (e.key === "a") keys.a = false;
  if (e.key === "s") keys.s = false;
  if (e.key === "d") keys.d = false;
});

const arrowKeys = {
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
  ArrowRight: false
};

window.addEventListener("keydown", (e) => {
  if (e.key in arrowKeys) {
    arrowKeys[e.key] = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key in arrowKeys) {
    arrowKeys[e.key] = false;
  }
});

const loaderCannon = new GLTFLoader();

let cannon;
let barrel; // we will fake this for shooting

loaderCannon.load("./src/models/cannon.glb", (gltf) => {
  cannon = gltf.scene;

  cannon.scale.set(2, 2, 2); // adjust if needed
  cannon.position.set(20, 2, 10);

  scene.add(cannon);

  // 🔥 IMPORTANT: create a fake barrel tip (shoot position)
  barrel = new THREE.Object3D();
  barrel.position.set(1, 1.5, 1.5); // tweak this until it matches barrel tip
  cannon.add(barrel);
});

const balls = [];

//function shoot() {
  //  ection from barrel
  function shoot() {

  if (!canShoot || !cannon || !barrel) return;
  const dir = new THREE.Vector3();
  dir.set(1, 0, 0); // forward
  dir.applyQuaternion(cannon.quaternion);
  
  const spawnPos = barrel.getWorldPosition(new THREE.Vector3());
  spawnPos.add(dir.clone().multiplyScalar(1));

let mesh;


mesh = cannonballModel.clone();
mesh.position.copy(spawnPos);
scene.add(mesh);

  // CANNON body
  const body = new CANNON.Body({
    shape: new CANNON.Sphere(0.15),
    position: new CANNON.Vec3(spawnPos.x, spawnPos.y, spawnPos.z),
    mass: 1,
  
  });

  body.velocity.set(dir.x * 10, dir.y * 10, dir.z * 10);

 world.addBody(body);

  balls.push({ mesh, body });
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    shoot();
  }
});

function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);

  const speed = 0.1;

  // character movement
  if (character) {
    if (keys.w) character.position.z -= speed;
    if (keys.s) character.position.z += speed;
    if (keys.a) character.position.x -= speed;
    if (keys.d) character.position.x += speed;

    if (arrowKeys.ArrowUp) character.position.z -= speed;
    if (arrowKeys.ArrowDown) character.position.z += speed;
    if (arrowKeys.ArrowLeft) character.position.x -= speed;
    if (arrowKeys.ArrowRight) character.position.x += speed;
  }

  // physics sync (bullets)
  balls.forEach((b) => {
    b.mesh.position.copy(b.body.position);
    b.mesh.quaternion.copy(b.body.quaternion);
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();