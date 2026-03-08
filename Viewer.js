let scene, camera, renderer, controls;
let currentMesh = null;
let autoRotate = false;

init();
animate();

function init() {
    const canvas = document.getElementById("viewer");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(2, 2, 3);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lumière premium
    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(light);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // UI
    document.getElementById("fileInput").addEventListener("change", loadModel);
    document.getElementById("colorPicker").addEventListener("input", updateColor);
    document.getElementById("resetBtn").addEventListener("click", resetCamera);
    document.getElementById("autoBtn").addEventListener("click", () => autoRotate = !autoRotate);

    window.addEventListener("resize", onResize);
}

function loadModel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
    }

    if (ext === "stl") {
        const loader = new THREE.STLLoader();
        loader.load(URL.createObjectURL(file), geometry => {
            const material = new THREE.MeshStandardMaterial({
                color: document.getElementById("colorPicker").value,
                metalness: 0.2,
                roughness: 0.6
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.geometry.center();
            mesh.scale.set(1, 1, 1);

            currentMesh = mesh;
            scene.add(mesh);
        });
    }

    if (ext === "glb" || ext === "gltf") {
        const loader = new THREE.GLTFLoader();
        loader.load(URL.createObjectURL(file), gltf => {
            currentMesh = gltf.scene;
            scene.add(gltf.scene);
        });
    }
}

function updateColor(event) {
    if (!currentMesh) return;

    const color = event.target.value;

    currentMesh.traverse(child => {
        if (child.isMesh && child.material) {
            child.material.color.set(color);
        }
    });
}

function resetCamera() {
    camera.position.set(2, 2, 3);
    controls.target.set(0, 0, 0);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && currentMesh) {
        currentMesh.rotation.y += 0.005;
    }

    controls.update();
    renderer.render(scene, camera);
}