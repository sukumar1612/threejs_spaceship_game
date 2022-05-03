import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import CANNON from "cannon";

const scene = new THREE.Scene()

const parameter = {
    color: 0xff0000
}

const explosionLocation = {
    'loc': [0, 0, 0]
}

//lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
const pointSourceLight = new THREE.PointLight(0xffffff, 1)


//spaceship
//body
const spaceShipBody = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(0.25, 0.25, 0.75, 20, 45),
    new THREE.MeshStandardMaterial({color: 0xffffff})
)
spaceShipBody.material.metalness = 0.4
spaceShipBody.material.roughness = 0.7

//cone
const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.275, 0.5, 10, 20),
    new THREE.MeshStandardMaterial({color: 0xff0000})
)
cone.material.metalness = 0.4
cone.material.roughness = 0.7
cone.position.copy(spaceShipBody.position).add(new THREE.Vector3(0, 0.6, 0))

//wings
const wingBody = new THREE.BoxBufferGeometry(0.25, 0.25, 0.05)
const wingMaterial = new THREE.MeshStandardMaterial({color: 0xff0000})
wingMaterial.metalness = 0.4
wingMaterial.roughness = 0.7
wingMaterial.side = THREE.DoubleSide

const wing1 = new THREE.Mesh(
    wingBody,
    wingMaterial
)
const wing2 = new THREE.Mesh(
    wingBody,
    wingMaterial
)
const wing3 = new THREE.Mesh(
    wingBody,
    wingMaterial
)
const wing4 = new THREE.Mesh(
    wingBody,
    wingMaterial
)
wing1.position.copy(spaceShipBody.position).add(new THREE.Vector3(0, -0.251, -0.25))
wing2.position.copy(spaceShipBody.position).add(new THREE.Vector3(0, -0.251, 0.25))
wing3.position.copy(spaceShipBody.position).add(new THREE.Vector3(-0.25, -0.251, 0))
wing4.position.copy(spaceShipBody.position).add(new THREE.Vector3(0.25, -0.251, 0))

wing1.rotation.y = Math.PI / 2
wing2.rotation.y = Math.PI / 2

const spaceship = new THREE.Group()
spaceship.add(spaceShipBody)
spaceship.add(cone)
spaceship.add(wing1, wing2, wing3, wing4)

spaceship.rotation.x = -Math.PI / 2

//grid

var division = 20;
var limit = 100;
var grid = new THREE.GridHelper(limit * 2, division, "blue", "blue");

var moveable = [];
for (let i = 0; i <= division; i++) {
    moveable.push(1, 1, 0, 0);
}
grid.geometry.addAttribute('moveable', new THREE.BufferAttribute(new Uint8Array(moveable), 1));
grid.material = new THREE.ShaderMaterial({
    uniforms: {
        time: {
            value: 0
        },
        limits: {
            value: new THREE.Vector2(-limit, limit)
        },
        speed: {
            value: 5
        }
    },
    vertexShader: `
    uniform float time;
    uniform vec2 limits;
    uniform float speed;
    
    attribute float moveable;
    
    varying vec3 vColor;
  
    void main() {
      vColor = color;
      float limLen = limits.y - limits.x;
      vec3 pos = position;
      if (floor(moveable + 0.5) > 0.5){ // if a point has "moveable" attribute = 1 
        float dist = speed * time;
        float currPos = mod((pos.z + dist) - limits.x, limLen) + limits.x;
        pos.z = currPos;
      } 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
    }
  `,
    fragmentShader: `
    varying vec3 vColor;
  
    void main() {
      gl_FragColor = vec4(vColor, 1.);
    }
  `,
    vertexColors: THREE.VertexColors
});

const group = new THREE.Group()
group.add(spaceship)
group.add(grid)


// physics world
//physics
const world = new CANNON.World()

const spaceShipShape = new CANNON.Cylinder(0.5, 0.5, 1.25, 20)
const spaceShipPhysicsBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 1, 0),
    shape: spaceShipShape,
})
world.addBody(spaceShipPhysicsBody)

// add movement for the Space Ship

window.addEventListener('keydown', (event) => {
    if (event.key === 'a') {
        spaceShipPhysicsBody.applyLocalImpulse(new CANNON.Vec3(-30, 0, 0), new CANNON.Vec3(0, 0, 0))
    }
    if (event.key === 'd') {
        spaceShipPhysicsBody.applyLocalImpulse(new CANNON.Vec3(30, 0, 0), new CANNON.Vec3(0, 0, 0))
    }
});
//collision sounds
const laserSound = new Audio('/sounds/laser.mp3')
const playLaserSound = () => {
    laserSound.currentTime = 0
    laserSound.play()
}

// generate spheres
const sphereGeometry = new THREE.SphereBufferGeometry(1, 8, 8)


const object_pool = []
for (let i = 0; i < 10; i += 2) {
    let sp1 = new THREE.Mesh(sphereGeometry, new THREE.MeshStandardMaterial())
    sp1.material.metalness = 0.4
    sp1.material.roughness = 0.7
    sp1.position.set(Math.random() * 30, 0, Math.random() * (-100))
    sp1.material.color = new THREE.Color(THREE.MathUtils.randInt(0, 0xffffff))

    let sp2 = new THREE.Mesh(sphereGeometry, new THREE.MeshStandardMaterial())
    sp2.material.metalness = 0.4
    sp2.material.roughness = 0.7
    sp2.position.set(Math.random() * 30, 0, Math.random() * (-100))
    sp2.material.color = new THREE.Color(THREE.MathUtils.randInt(0, 0xffffff))

    object_pool[i] = sp1
    object_pool[i + 1] = sp2
    scene.add(sp1, sp2)
}

// particle explosion

var movementSpeed = 80;
var totalObjects = 1000;
var objectSize = 10;
var sizeRandomness = 4000;
var colors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];

var dirs = [];
var parts = [];

function ExplodeAnimation(x,y, color)
{
    var geometry = new THREE.Geometry();

    for (let i = 0; i < totalObjects; i ++)
    {
        var vertex = new THREE.Vector3();
        vertex.x = x;
        vertex.y = y;
        vertex.z = 0;

        geometry.vertices.push( vertex );
        dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),y:(Math.random() * movementSpeed)-(movementSpeed/2),z:(Math.random() * movementSpeed)-(movementSpeed/2)});
    }
    var material = new THREE.ParticleBasicMaterial( { size: objectSize,  color: color});
    var particles = new THREE.ParticleSystem( geometry, material );

    this.object = particles;
    this.status = true;

    this.xDir = (Math.random() * movementSpeed)-(movementSpeed/2);
    this.yDir = (Math.random() * movementSpeed)-(movementSpeed/2);
    this.zDir = (Math.random() * movementSpeed)-(movementSpeed/2);

    scene.add( this.object  );

    this.update = function(){
        if (this.status == true){
            var pCount = totalObjects;
            while(pCount--) {
                var particle =  this.object.geometry.vertices[pCount]
                particle.y += dirs[pCount].y;
                particle.x += dirs[pCount].x;
                particle.z += dirs[pCount].z;
            }
            this.object.geometry.verticesNeedUpdate = true;
        }
    }

}
parts.push(new ExplodeAnimation(0, 0, 0xffffff));

//
const updateObjects = (object_pool, delta, x, spaceship, score) => {
    for (let i = 0; i < 10; i += 2) {
        if (object_pool[i].position.z >= 0) {
            object_pool[i].position.x = Math.random() * (30 - x)
            object_pool[i].position.z = Math.random() * (-100) - 30
        } else {
            object_pool[i].position.z += delta
        }
        if (object_pool[i + 1].position.z >= 0) {
            object_pool[i + 1].position.x = Math.random() * (x - 30)
            object_pool[i + 1].position.z = Math.random() * (-100) - 30
        } else {
            object_pool[i + 1].position.z += delta
        }

        //check for collisions
        if (spaceship.position.x <= object_pool[i].position.x + 1 && spaceship.position.x >= object_pool[i].position.x - 1) {
            //console.log("spaceship position: "+spaceship.position.x)
            if (spaceship.position.z <= object_pool[i].position.z + 1 && spaceship.position.z >= object_pool[i].position.z - 1) {
                score++;
                console.log(score);
                playLaserSound()
                parts.push(new ExplodeAnimation(spaceship.position.x, spaceship.position.y, object_pool[i].material.color));

            }
        }
        if (spaceship.position.x <= object_pool[i + 1].position.x + 1 && spaceship.position.x >= object_pool[i + 1].position.x - 1) {
            //console.log("spaceship position: "+spaceship.position.x)
            if (spaceship.position.z <= object_pool[i + 1].position.z + 1 && spaceship.position.z >= object_pool[i + 1].position.z - 1) {
                score++;
                console.log(score);
                playLaserSound()
                parts.push(new ExplodeAnimation(spaceship.position.x, spaceship.position.y, object_pool[i+1].material.color));
            }
        }
    }
}


//sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.parent = new THREE.Object3D()
scene.background = new THREE.Color(0x000000);

//


//add all the scenes
scene.add(ambientLight)
scene.add(pointSourceLight)
scene.add(group)
scene.add(camera)

// render the object
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl')
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)

// debug
const gui = new dat.GUI()
gui.hide()


// animate the object

const clock = new THREE.Clock()
let oldElapsedTime = 0
const animate = () => {
    const currentElapsedTime = clock.getElapsedTime()
    const delta = currentElapsedTime - oldElapsedTime
    oldElapsedTime = currentElapsedTime

    world.step(1 / 60, delta, 3)
    // move grid backwards along with all the objects
    grid.material.uniforms.time.value += delta * 20;
    updateObjects(object_pool, delta * 20, spaceship.position.x, spaceship)


    // drag
    const speed = spaceShipPhysicsBody.velocity.length()
    const dragMagnitude = 0.9 * Math.pow(speed, 2)
    const drag = spaceShipPhysicsBody.velocity.clone()
    drag.scale(-1, drag)
    drag.normalize()
    drag.scale(dragMagnitude, drag)
    spaceShipPhysicsBody.applyLocalForce(drag, new CANNON.Vec3(0, 0, 0))

    // update spaceship
    spaceship.position.copy(spaceShipPhysicsBody.position)

    //update camera
    camera.position.copy(spaceship.position).add(new THREE.Vector3(0, 1, 2))
    camera.lookAt(spaceship.position)

    //update point light source
    pointSourceLight.position.copy(spaceship.position).add(new THREE.Vector3(0, 2, 4))

    let pCount = parts.length;
    while(pCount--) {
        parts[pCount].update();
    }

    // render
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate)
}

animate()

