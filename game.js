let scene, camera, renderer, player;
let obstacles = [];
let rewards = [];
let score = 0;
let gameActive = true;
let speed = 0.2;
const lanes = [-2, 0, 2];
let currentLane = 1; // Middle lane

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Track
    const trackGeometry = new THREE.PlaneGeometry(7, 1000);
    const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    scene.add(track);

    // Player
    const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffcc });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    player.position.z = 5;
    scene.add(player);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onWindowResize);

    animate();
    spawnLoop();
}

function handleKeyDown(event) {
    if (!gameActive) return;
    if (event.key === 'ArrowLeft' && currentLane > 0) {
        currentLane--;
    } else if (event.key === 'ArrowRight' && currentLane < 2) {
        currentLane++;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function spawnLoop() {
    if (!gameActive) return;

    // Spawn Obstacle ('F' grade)
    if (Math.random() < 0.3) {
        spawnObstacle();
    }

    // Spawn Reward (Clover)
    if (Math.random() < 0.2) {
        spawnReward();
    }

    setTimeout(spawnLoop, 1000 - Math.min(score * 5, 500));
}

function spawnObstacle() {
    const lane = lanes[Math.floor(Math.random() * 3)];
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const material = new THREE.MeshPhongMaterial({ map: texture });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(lane, 0.5, -50);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function spawnReward() {
    const lane = lanes[Math.floor(Math.random() * 3)];
    const textureLoader = new THREE.TextureLoader();
    // Using existing clover image if available, else fallback to green cube
    textureLoader.load('./tainguyen/clover.png', (texture) => {
        const geometry = new THREE.PlaneGeometry(0.8, 0.8);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const reward = new THREE.Mesh(geometry, material);
        reward.position.set(lane, 0.5, -50);
        reward.rotation.y = 0;
        scene.add(reward);
        rewards.push(reward);
    }, undefined, () => {
        // Fallback
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const reward = new THREE.Mesh(geometry, material);
        reward.position.set(lane, 0.5, -50);
        scene.add(reward);
        rewards.push(reward);
    });
}

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);

    // Smooth lane transition
    player.position.x = THREE.MathUtils.lerp(player.position.x, lanes[currentLane], 0.15);

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].position.z += speed;

        // Collision detection
        if (Math.abs(obstacles[i].position.z - player.position.z) < 0.7 &&
            Math.abs(obstacles[i].position.x - player.position.x) < 0.7) {
            gameOver();
        }

        if (obstacles[i].position.z > 10) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
        }
    }

    // Move rewards
    for (let i = rewards.length - 1; i >= 0; i--) {
        rewards[i].position.z += speed;
        rewards[i].rotation.z += 0.05;

        // Collection detection
        if (Math.abs(rewards[i].position.z - player.position.z) < 0.7 &&
            Math.abs(rewards[i].position.x - player.position.x) < 0.7) {
            score += 10;
            document.getElementById('score').innerText = `Score: ${score}`;
            scene.remove(rewards[i]);
            rewards.splice(i, 1);
            speed += 0.005; // Increase speed
        } else if (rewards[i].position.z > 10) {
            scene.remove(rewards[i]);
            rewards.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

function gameOver() {
    gameActive = false;
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('final-score').innerText = score;
}

init();
