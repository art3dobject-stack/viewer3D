let scene, camera, renderer, controls;
let currentMesh = null;
let autoRotate = false;

init();
animate();

function init() {
    const canvas = document.getElementById("viewer");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(2, 2, 3);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0xaaaaaa);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const fileInput = document.getElementById("fileInput");
    const colorPicker = document.getElementById("colorPicker");
    const resetBtn = document.getElementById("resetBtn");
    const autoBtn = document.getElementById("autoBtn");

    if (fileInput) {
        fileInput.addEventListener("change", loadModel);
    }
    if (colorPicker) {
        colorPicker.addEventListener("input", updateColor);
    }
    if (resetBtn) {
        resetBtn.addEventListener("click", resetCamera);
    }
    if (autoBtn) {
        autoBtn.addEventListener("click", () => {
            autoRotate = !autoRotate;
        });
    }

    window.addEventListener("resize", onResize);
    resetCamera();
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
        const reader = new FileReader();

        reader.onload = function (e) {
            const geometry = loader.parse(e.target.result);
            geometry.computeBoundingBox();
            geometry.center();

            const material = new THREE.MeshStandardMaterial({
                color: document.getElementById("colorPicker").value || "#cccccc",
                roughness: 0.6,
                metalness: 0.1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            currentMesh = mesh;
            scene.add(mesh);

            fitCameraToObject(mesh);
        };

        reader.readAsArrayBuffer(file);
    } else {
        alert("Format non supporté. Utilise un fichier .stl");
    }
}

function updateColor(event) {
    if (!currentMesh) return;
    const color = event.target.value;
    currentMesh.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.color.set(color);
        }
    });
}

function resetCamera() {
    camera.position.set(2, 2, 3);
    controls.target.set(0, 0, 0);
    controls.update();
}

function fitCameraToObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

    cameraZ *= 1.2;

    camera.position.set(center.x + cameraZ / 3, center.y + cameraZ / 3, center.z + cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
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
