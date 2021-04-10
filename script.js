import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { gsap } from 'gsap'
import { Group, MeshToonMaterial } from 'three'
import { Raycaster } from 'three'

import ThreeMeshUI from 'three-mesh-ui'


const axios = require('axios').default;

/**
 * Sounds
 */

const hitSound = new Audio('/scan.mp3')


/**
 * html related functions
 */
var radarPanel = document.getElementById('panel')



/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

const axesHelper = new THREE.AxesHelper()





// function for converting latitude and longitude into local map coordinates
// dimension of map: 60 * 25
const convertCoord = (lat, lon) => {
    const cityZ = 50 - lat - 25
    const cityX = 125 - lon - 30
    return [cityX, cityZ]

}

const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('/textures/matcaps/1.png')
    /**
     * Fonts
     */

let textTitle = null


// Define some variables
let targetX = 0
let targetZ = 0

let city1OnFire = false
let city2OnFire = false
let city3OnFire = false



// Scene
const scene = new THREE.Scene()

scene.add(axesHelper)

const fog = new THREE.Fog('#262837', 1, 15)

// scene.add(axesHelper)

/**
 * Lines
 */
//create a blue LineBasicMaterial
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
let line = null


/**
 * Textures
 */





// Adding globe
scene.background = new THREE.Color(0x000000);
const RADIUS = 40;
const SEGMENTS = 50;
const RINGS = 50;
const globe = new THREE.Group();
scene.add(globe);

textureLoader.load('/textures/land_ocean_ice_cloud_2048.jpg', function(texture) {

    // Create the sphere
    var sphere = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);
    // Map the texture to the material. 
    var material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 });
    // Create a new mesh with sphere geometry.
    var mesh = new THREE.Mesh(sphere, material);

    // Add mesh to globe
    globe.add(mesh);
});
const pointLight = new THREE.PointLight(0xFFFFFF);
globe.position.x = -1
globe.position.y = 30
globe.position.z = -17;
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 400;
scene.add(pointLight);




const reportBtn = document.getElementById('report')


reportBtn.addEventListener("click", onButtonClick, false);

function onButtonClick(event) {
    hitSound.volume = 0.5
    hitSound.play()
    document.querySelector('.radar-1').style.border = "10px solid #db1212"

    axios.get('http://usw-gp-vm.westus.cloudapp.azure.com:5000/getReportInfo')
        .then(function(response) {
            console.log(response.data['report_info'][0]['brief'])
            var reports = ""
            for (let i = 0; i < response.data['report_info'].length; i++) {
                reports += response.data['report_info'][i]['brief']
            }
            document.querySelector('.rp1').innerText = reports
        })
}



/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null


const calcPosFromLatLonRad = (lat, lon, radius) => {

    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));

    return [x, y, z];

}

/**
 * Particles
 */

const particleTexture = textureLoader.load('/textures/particles/5.png')
const particlesGeometry = new THREE.BufferGeometry()




const particlesMaterial = new THREE.PointsMaterial({
    size: 0.7,
    sizeAttenuation: true,
})
particlesMaterial.transparent = true
particlesMaterial.alphaMap = particleTexture
particlesMaterial.alphaTest = 0.001
particlesMaterial.dpethWrite = false
particlesMaterial.blending = THREE.AdditiveBlending
particlesMaterial.vertexColors = true


const count = 1024

const positions = new Float32Array(count * 3)
const colors = new Float32Array(count * 3)

let [particleX, particleZ] = convertCoord(34.0522, 118.2437)

for (let i = 0; i < count * 3; i++) {

    positions[i] = (Math.random() - 0.5) * 5

    if (i % 3 === 0) {
        positions[i] += particleX
    } else
    if (i % 3 === 2) {
        positions[i] += particleZ
    }
    // else
    // {
    //     positions[i] 
    // }

    if (i % 3 === 0) {
        colors[i] = 1
    } else {
        colors[i] = 0
    }

}

particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
)



particlesGeometry.setAttribute(
    'color',
    new THREE.BufferAttribute(colors, 3)
)

const [px, py, pz] = calcPosFromLatLonRad(0, 122.3321, 45)

// Particles effect
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
particles.visible = true
    // scene.add(particles)

/**
 * Textures
 */



/**
 * Load Seattle: 47.6062 N, 122.3321 W
 */
const satellite_gp = new THREE.Group()
gltfLoader.load(
    '/models/satellite/scene.gltf',
    (gltf) => {



        console.log('loaded')
        satellite_gp.add(gltf.scene)
    }
)
const [sx, sy, sz] = calcPosFromLatLonRad(0, 122.3321, 41)
scene.add(satellite_gp)
satellite_gp.position.set(sx - 1, sy + 30, sz - 17)
satellite_gp.scale.set(0.001, 0.001, 0.001)

/**
 * Load shuttle 1
 */
var shuttle_poly = new THREE.Group()
var shuttle_poly2 = new THREE.Group()
var shuttle_poly3 = new THREE.Group()
var shuttle_poly4 = new THREE.Group()
var shuttle_poly5 = new THREE.Group()
const shuttle_gp = new THREE.Group()
const shuttle_gp2 = new THREE.Group()
const shuttle_gp3 = new THREE.Group()
const shuttle_gp4 = new THREE.Group()
const shuttle_gp5 = new THREE.Group()

gltfLoader.load(
    '/models/shuttle/scene.gltf',
    (gltf) => {



        console.log('loaded')

        shuttle_poly.add(gltf.scene)
        shuttle_poly.position.set(sx, sy, sz)
        shuttle_poly.scale.set(0.05, 0.05, 0.05)
        shuttle_poly.rotation.set(0, -1.01, 1.591)
        shuttle_gp.add(shuttle_poly)

    }
)

gltfLoader.load(
    '/models/shuttle/scene.gltf',
    (gltf) => {



        console.log('loaded')

        shuttle_poly2.add(gltf.scene)
        shuttle_poly2.position.set(sx, sy, sz)
        shuttle_poly2.scale.set(0.05, 0.05, 0.05)
        shuttle_poly2.rotation.set(0, -1.01, 1.591)
        shuttle_gp2.add(shuttle_poly2)

    }
)

gltfLoader.load(
    '/models/shuttle/scene.gltf',
    (gltf) => {



        console.log('loaded')

        shuttle_poly3.add(gltf.scene)
        shuttle_poly3.position.set(sx, sy, sz)
        shuttle_poly3.scale.set(0.05, 0.05, 0.05)
        shuttle_poly3.rotation.set(0, -1.01, 1.591)
        shuttle_gp3.add(shuttle_poly3)

    }
)

gltfLoader.load(
    '/models/shuttle/scene.gltf',
    (gltf) => {



        console.log('loaded')

        shuttle_poly4.add(gltf.scene)
        shuttle_poly4.add(gltf.scene)
        shuttle_poly4.scale.set(0.05, 0.05, 0.05)
        shuttle_poly4.rotation.set(0, -1.01, 1.591)
        shuttle_gp4.add(shuttle_poly4)

    }
)

gltfLoader.load(
    '/models/shuttle/scene.gltf',
    (gltf) => {



        console.log('loaded')

        shuttle_poly5.add(gltf.scene)
        shuttle_poly5.position.set(sx, sy, sz)
        shuttle_poly5.scale.set(0.05, 0.05, 0.05)
        shuttle_poly5.rotation.set(0, -1.01, 1.591)
        shuttle_gp5.add(shuttle_poly5)

    }
)

scene.add(shuttle_gp)
scene.add(shuttle_gp2)
scene.add(shuttle_gp3)
scene.add(shuttle_gp4)
scene.add(shuttle_gp5)

shuttle_gp.position.set(-1, 30, -17)
shuttle_gp2.position.set(-1, 30, -17)
shuttle_gp3.position.set(-1, 30, -17)
shuttle_gp4.position.set(-1, 30, -17)
shuttle_gp5.position.set(-1, 30, -17)


gui.add(shuttle_poly.rotation, 'x').min(-5).max(5).step(0.001)
gui.add(shuttle_poly.rotation, 'y').min(-5).max(5).step(0.001)
gui.add(shuttle_poly.rotation, 'z').min(-5).max(5).step(0.001)


/**
 * Load shuttle 2
 */



scene.add(shuttle_gp)

shuttle_gp.position.set(-1, 30, -17)

gui.add(shuttle_poly.rotation, 'x').min(-5).max(5).step(0.001)
gui.add(shuttle_poly.rotation, 'y').min(-5).max(5).step(0.001)
gui.add(shuttle_poly.rotation, 'z').min(-5).max(5).step(0.001)


/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#b9d5ff', 1)
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
scene.add(ambientLight)

// Directional light
const moonLight = new THREE.DirectionalLight('#b9d5ff', 0.5)
moonLight.position.set(4, 5, -2)
gui.add(moonLight, 'intensity').min(0).max(1).step(0.001)
gui.add(moonLight.position, 'x').min(-5).max(5).step(0.001)
gui.add(moonLight.position, 'y').min(-5).max(5).step(0.001)
gui.add(moonLight.position, 'z').min(-5).max(5).step(0.001)
scene.add(moonLight)


/**
 * Ghosts
 */
const ghost1 = new THREE.PointLight('#e25822', 10, 3)
scene.add(ghost1)

const ghost2 = new THREE.PointLight('#00ff00', 10, 3)
scene.add(ghost2)

const ghost3 = new THREE.PointLight('#ffff00', 10, 3)
scene.add(ghost3)




/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Raycaster
 */
const raycaster = new Raycaster()

const [city1X, city1Z] = convertCoord(47.6062, 122.3321)
const [city2X, city2Z] = convertCoord(45.5051, 122.6750)
const [city3X, city3Z] = convertCoord(34.0522, 118.2437)



var sat_lat = 0
var sat_lon = 122.3321


const [vx, vy, vz] = calcPosFromLatLonRad(47.6062, 122.3321, 41)


const points = [{

        position: new THREE.Vector3(0, 0, 0),
        element: document.querySelector('.point-0')
    },
    {
        position: new THREE.Vector3(city2X, 3, city2Z),
        element: document.querySelector('.point-1')
    },
    {
        position: new THREE.Vector3(city3X, 3, city3Z),
        element: document.querySelector('.point-2')
    },
    {
        position: new THREE.Vector3(0, 20, -20),
        element: document.querySelector('.point-3')
    },
    {
        position: new THREE.Vector3(0, 15, -50),
        element: document.querySelector('.point-4')
    },
    {
        position: new THREE.Vector3(0, 10, 20),
        element: document.querySelector('.point-5')
    },
    {
        position: new THREE.Vector3(0, 10, 20),
        element: document.querySelector('.point-6')
    },
    {
        position: new THREE.Vector3(0, 10, 20),
        element: document.querySelector('.point-7')
    },
    {
        position: new THREE.Vector3(0, 10, 20),
        element: document.querySelector('.point-8')
    },
    {
        position: new THREE.Vector3(0, 10, 20),
        element: document.querySelector('.point-9')
    },
    {
        position: new THREE.Vector3(0, 10, 20),
        element: document.querySelector('.point-10')
    }

]

let chanceFireCity1 = 10
let chanceFireCity2 = 8
let chanceFireCity3 = 10

document.getElementById("city1FireChance").innerText = `Chance of fire: ${chanceFireCity1}%`




/**
 * City tag rod
 */

const city1Points = [];
city1Points.push(new THREE.Vector3(city1X, 2.8, city1Z));
city1Points.push(new THREE.Vector3(city1X, 0, city1Z));

const city2Points = [];
city2Points.push(new THREE.Vector3(city2X, 2.8, city2Z));
city2Points.push(new THREE.Vector3(city2X, 0, city2Z));

const city3Points = [];
city3Points.push(new THREE.Vector3(city3X, 2.8, city3Z));
city3Points.push(new THREE.Vector3(city3X, 0, city3Z));

const cityRodMaterial = new THREE.LineBasicMaterial({ color: 0x800080 });
const cityRodGeometry1 = new THREE.BufferGeometry().setFromPoints(city1Points);
const cityRodGeometry2 = new THREE.BufferGeometry().setFromPoints(city2Points);
const cityRodGeometry3 = new THREE.BufferGeometry().setFromPoints(city3Points);



const cityLine1 = new THREE.Line(cityRodGeometry1, cityRodMaterial);
const cityLine2 = new THREE.Line(cityRodGeometry2, cityRodMaterial);
const cityLine3 = new THREE.Line(cityRodGeometry3, cityRodMaterial);

scene.add(cityLine1, cityLine2, cityLine3);


window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#262837')



/**
 * Shadows
 */
renderer.shadowMap.enabled = true

moonLight.castShadow = true
ghost1.castShadow = true
ghost2.castShadow = true
ghost3.castShadow = true




ghost1.shadow.mapSize.width = 256
ghost1.shadow.mapSize.height = 256
ghost1.shadow.camera.far = 7

ghost2.shadow.mapSize.width = 256
ghost2.shadow.mapSize.height = 256
ghost2.shadow.camera.far = 7

ghost3.shadow.mapSize.width = 256
ghost3.shadow.mapSize.height = 256
ghost3.shadow.camera.far = 7




renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap


/**
 * Report function
 */

// const container = new ThreeMeshUI.Block({
//     width: 1.2,
//     height: 0.7,
//     padding: 0.2,
//     fontFamily: './assets/Roboto-msdf.json',
//     fontTexture: './assets/Roboto-msdf.png',
// });

// //

// const text = new ThreeMeshUI.Text({
//     content: "Some text to be displayed"
// });

// container.add(text);

// // scene is a THREE.Scene (see three.js)
// scene.add(container);

// // This is typically done in the loop :
// ThreeMeshUI.update();





/**
 * Animate
 */
const clock = new THREE.Clock()


let UAVLastPosX = 0.0
let UAVLastPoxZ = 0.0

let counter = 0
let resetCount = 0

let sceneReady = false

city1OnFire = true


var spheres = new THREE.Group()
scene.add(spheres)

const tick = () => {
    counter += 1
    if (counter === 500000) {
        // reset counter to prevent overflow
        counter = 0
    }

    if (counter > 300) {
        sat_lon += 1
        const [sx, sy, sz] = calcPosFromLatLonRad(sat_lat, sat_lon, 41)
        satellite_gp.position.set(sx - 1, sy + 30, sz - 17)
        shuttle_gp.rotation.y += 0.005
        shuttle_gp.rotation.x += 0.002 * Math.random()

        shuttle_gp2.rotation.y += 0.005
        shuttle_gp3.rotation.y += 0.005
        shuttle_gp4.rotation.y += 0.005
        shuttle_gp5.rotation.y += 0.005

        shuttle_gp2.rotation.x += 0.002 * (Math.random() - 0.5)
        shuttle_gp3.rotation.x += 0.005 * (Math.random() - 0.5)
        shuttle_gp4.rotation.x += 0.003 * Math.random()
        shuttle_gp5.rotation.x += 0.002 * (Math.random() + 1)

    }

    if (counter % 500 === 0) {

        let res = axios.get('http://usw-gp-vm.westus.cloudapp.azure.com:5000/getPollutionData?number=10')
            .then(function(response) {
                scene.remove(spheres)
                spheres = new THREE.Group()
                for (let i = 0; i < 10; i++) {
                    const lat = parseFloat(response.data["pollution_info"][i]["latitude"])
                    const lon = parseFloat(response.data["pollution_info"][i]["longitude"])
                    const value = response.data["pollution_info"][i]["value"]
                        // document.getElementById(`c${i}`).innerText = city
                    const [x, y, z] = calcPosFromLatLonRad(lat, lon, 40)

                    const [cx, cy, cz] = calcPosFromLatLonRad(lat, lon, 36)

                    const cg = new THREE.SphereGeometry(5, 32, 32);

                    var color = new THREE.Color()
                    if (value > 150) {
                        color = new THREE.Color(0xff0000)
                    } else if (value > 100) {
                        color = new THREE.Color(0xffff00)
                    } else {
                        color = new THREE.Color(0x00ff00)
                    }

                    const cm = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.2
                    });
                    const sphere = new THREE.Mesh(cg, cm);


                    sphere.position.setX(cx - 1)
                    sphere.position.setY(cy + 30)
                    sphere.position.setZ(cz - 17)
                    spheres.add(sphere)

                    points[i].position.setX(x - 1)
                    points[i].position.setZ(z - 17)
                    points[i].position.setY(y + 30)


                }
                scene.add(spheres)
                    // spheres.forEach(s => {
                    //     scene.add(s)
                    // })
            })
    }

    if (counter > 300 && sceneReady === false) {
        sceneReady = true
    }

    if (sceneReady) {
        // Go through each point
        if (points !== null) {
            for (const point of points) {
                if (point.element !== null) {
                    const screenPosition = point.position.clone()
                    screenPosition.project(camera)

                    raycaster.setFromCamera(screenPosition, camera)
                    const intersects = raycaster.intersectObjects(scene.children, true)

                    if (intersects.length === 0) {
                        if (point !== null) {
                            if (point.element !== null) {
                                point.element.classList.add('visible')
                            }
                        }

                    } else {

                        const intersectionDistance = intersects[0].distance
                        const pointDistance = point.position.distanceTo(camera.position)

                        if (intersectionDistance < pointDistance) {
                            point.element.classList.remove('visible')
                        } else {
                            point.element.classList.add('visible')
                        }

                    }

                    const translateX = screenPosition.x * sizes.width * 0.5
                    const translateY = -screenPosition.y * sizes.height * 0.5
                    if (point.element !== null) {
                        point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`

                    }
                }


            }
        }

    }

    const elapsedTime = clock.getElapsedTime()



    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()