import './style.css'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import CANNON from 'cannon'
import {Clock} from "three";

const scene = new THREE.Scene()

// debug gui

const gui = new dat.GUI()
gui.hide()
const parameter = {
    color: 0xff0000
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)


const pointSourceLight = new THREE.PointLight(0xffffff, 0.5)
pointSourceLight.position.set(4, 4, 4)
pointSourceLight.castShadow = true

// box geometry
const material = new THREE.MeshStandardMaterial()
material.roughness = 0.4
//material.metalness = 0.7


const sphereMesh = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.75, 64, 64),
    material
)
sphereMesh.castShadow = true


const planeMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(20, 20, 1, 1),
    material
)
planeMesh.material.side = THREE.DoubleSide
planeMesh.position.set(0, 0, 0)
planeMesh.rotation.x = Math.PI / 2
planeMesh.receiveShadow = true

const group = new THREE.Group()
group.add(sphereMesh)
group.add(planeMesh)

//sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.parent = new THREE.Object3D()
scene.background = new THREE.Color(0x000000);

//physics world

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

//physics material

const defaultMaterial = new CANNON.Material('default')

const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.05,
        restitution: 0.2
    }
)
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial
//physics

const sphereShape = new CANNON.Sphere(0.75)
const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 1, 0),
    shape: sphereShape,
})
// force and position of the force

const createSphere = (radius, position) =>{
    const mesh = new THREE.Mesh()
}


world.addBody(sphereBody)

const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
world.addBody(floorBody)

// add motion to object

window.addEventListener('keydown', (event) => {
    if (event.key === 'w') {
        sphereBody.applyLocalForce(new CANNON.Vec3(0, 0, 100), new CANNON.Vec3(0, 0, 0))
    } else if (event.key === 's') {
        sphereBody.applyLocalForce(new CANNON.Vec3(0, 0, -100), new CANNON.Vec3(0, 0, 0))
    }
    else if (event.key === 'a') {
        sphereBody.applyLocalForce(new CANNON.Vec3(-100, 0, 0), new CANNON.Vec3(0, 0, 0))
    }
    else if (event.key === 'd') {
        sphereBody.applyLocalForce(new CANNON.Vec3(100, 0, 0), new CANNON.Vec3(0, 0, 0))
    }
});

// render the object

scene.add(ambientLight)
scene.add(pointSourceLight)

scene.add(group)
scene.add(camera)



const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl')
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMapEnabled = true
// debug

gui.add(group.position, 'x').min(-3).max(3).step(0.001).name('elevation')
gui.add(group.position, 'y').min(-3).max(3).step(0.001).name('elevation')
gui.add(group.position, 'z').min(-3).max(3).step(0.001).name('elevation')
gui.add(group, 'visible')
gui.addColor(parameter, 'color').onChange(() => {
    group.material.color.set(parameter.color)
})

const clock = new THREE.Clock()
let oldElapsedTime = 0
// animate the object
const animate = () => {
    // update physics world
    const currentElapsedTime = clock.getElapsedTime()
    const delta = currentElapsedTime - oldElapsedTime
    oldElapsedTime = currentElapsedTime

    world.step(1 / 60, delta, 3)
    sphereMesh.position.copy(sphereBody.position)

    console.log(sphereMesh.position)

    let camPos = new THREE.Vector3(sphereMesh.position.x, 0, sphereMesh.position.z)
    camera.position.copy(camPos).add(new THREE.Vector3(0, 2, 4))
    camera.lookAt(sphereMesh.position)

    renderer.render(scene, camera)

    window.requestAnimationFrame(animate)
}

animate()

