import * as THREE from 'three';

export class Player {
  constructor(camera, canvas, scene) {
    this.camera = camera;
    this.canvas = canvas;
    this.scene = scene;

    this.position = new THREE.Vector3(0, 1.6, 0);
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.moveSpeed = 4;
    this.sprintSpeed = 8;
    this.isSprinting = false;

    // Mouse look
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.mouseSensitivity = 0.002;

    // Movement keys
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false
    };

    // Head bob
    this.bobTime = 0;
    this.bobAmount = 0.05;
    this.bobSpeed = 10;

    // Sprint indicator element
    this.createSprintIndicator();

    // Flashlight
    this.createFlashlight();

    this.setupControls();
  }

  createFlashlight() {
    // Flashlight spotlight - bright, wider, softer
    this.flashlight = new THREE.SpotLight(0xfff8e0, 12, 80, Math.PI / 5, 0.5, 1.2);
    this.flashlight.position.set(0.15, -0.1, -0.2);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);
    this.flashlight.target.position.set(0, 0, -10);

    // Add camera to scene so flashlight works
    this.scene.add(this.camera);

    // Visible flashlight model (in player's hand)
    this.flashlightModel = new THREE.Group();

    // Flashlight body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.018, 0.022, 0.15, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.4,
      metalness: 0.6
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    this.flashlightModel.add(body);

    // Flashlight head (wider part)
    const headGeometry = new THREE.CylinderGeometry(0.028, 0.022, 0.04, 12);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.7
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.rotation.x = Math.PI / 2;
    head.position.z = -0.095;
    this.flashlightModel.add(head);

    // Lens with glow
    const lensGeometry = new THREE.CircleGeometry(0.024, 16);
    const lensMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffdd,
      transparent: true,
      opacity: 0.9
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.z = -0.116;
    this.flashlightModel.add(lens);

    // Grip rubber texture (ring)
    const gripGeometry = new THREE.TorusGeometry(0.021, 0.004, 8, 16);
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9
    });
    for (let i = 0; i < 3; i++) {
      const grip = new THREE.Mesh(gripGeometry, gripMaterial);
      grip.rotation.y = Math.PI / 2;
      grip.position.z = 0.03 + i * 0.025;
      this.flashlightModel.add(grip);
    }

    // Base position for flashlight (holding in right hand)
    this.flashlightBasePos = { x: 0.22, y: -0.25, z: -0.35 };
    this.flashlightBaseRot = { x: 0.15, y: -0.08, z: 0.05 };

    this.flashlightModel.position.set(this.flashlightBasePos.x, this.flashlightBasePos.y, this.flashlightBasePos.z);
    this.flashlightModel.rotation.x = this.flashlightBaseRot.x;
    this.flashlightModel.rotation.y = this.flashlightBaseRot.y;
    this.flashlightModel.rotation.z = this.flashlightBaseRot.z;

    this.camera.add(this.flashlightModel);

    // Flashlight bob parameters
    this.flashlightBobTime = 0;
    this.flashlightIdleTime = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.flashlightLag = { x: 0, y: 0, rotX: 0, rotY: 0 };
  }

  updateFlashlightBob(delta, isMoving, isSprinting) {
    this.flashlightIdleTime += delta;

    // Subtle idle breathing motion
    const breatheY = Math.sin(this.flashlightIdleTime * 1.5) * 0.003;
    const breatheX = Math.sin(this.flashlightIdleTime * 0.8) * 0.002;

    // Mouse look lag (flashlight trails behind camera movement) - minimal
    const lagSpeed = 15;
    this.flashlightLag.x += (this.mouseDeltaX * 0.0003 - this.flashlightLag.x) * delta * lagSpeed;
    this.flashlightLag.y += (this.mouseDeltaY * 0.0002 - this.flashlightLag.y) * delta * lagSpeed;
    this.flashlightLag.rotY += (-this.mouseDeltaX * 0.001 - this.flashlightLag.rotY) * delta * lagSpeed;
    this.flashlightLag.rotX += (-this.mouseDeltaY * 0.0008 - this.flashlightLag.rotX) * delta * lagSpeed;

    // Decay mouse delta
    this.mouseDeltaX *= 0.9;
    this.mouseDeltaY *= 0.9;

    let bobX = 0, bobY = 0, bobRotZ = 0;

    if (isMoving) {
      const bobSpeed = isSprinting ? 12 : 7;
      const bobAmountY = isSprinting ? 0.025 : 0.008;
      const bobAmountX = isSprinting ? 0.015 : 0.005;
      const bobAmountRot = isSprinting ? 0.025 : 0.008;

      this.flashlightBobTime += delta * bobSpeed;

      // Vertical bob (up/down)
      bobY = Math.sin(this.flashlightBobTime) * bobAmountY;
      // Horizontal sway (left/right)
      bobX = Math.sin(this.flashlightBobTime * 0.5) * bobAmountX;
      // Slight rotation sway
      bobRotZ = Math.sin(this.flashlightBobTime * 0.5) * bobAmountRot;
    } else {
      this.flashlightBobTime *= 0.95;
    }

    // Apply all motions
    const targetX = this.flashlightBasePos.x + bobX + breatheX + this.flashlightLag.x;
    const targetY = this.flashlightBasePos.y + bobY + breatheY + this.flashlightLag.y;
    const targetRotZ = this.flashlightBaseRot.z + bobRotZ;
    const targetRotX = this.flashlightBaseRot.x + this.flashlightLag.rotX;
    const targetRotY = this.flashlightBaseRot.y + this.flashlightLag.rotY;

    // Smooth interpolation
    this.flashlightModel.position.x += (targetX - this.flashlightModel.position.x) * 0.15;
    this.flashlightModel.position.y += (targetY - this.flashlightModel.position.y) * 0.15;
    this.flashlightModel.rotation.x += (targetRotX - this.flashlightModel.rotation.x) * 0.1;
    this.flashlightModel.rotation.y += (targetRotY - this.flashlightModel.rotation.y) * 0.1;
    this.flashlightModel.rotation.z += (targetRotZ - this.flashlightModel.rotation.z) * 0.15;
  }

  onMouseMove(movementX, movementY) {
    this.mouseDeltaX = movementX;
    this.mouseDeltaY = movementY;
  }

  createSprintIndicator() {
    this.sprintIndicator = document.getElementById('sprint-indicator');
  }

  setupControls() {
    // Pointer lock
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.canvas;
    });

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= e.movementX * this.mouseSensitivity;
      this.euler.x -= e.movementY * this.mouseSensitivity;

      // Clamp vertical look
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

      this.camera.quaternion.setFromEuler(this.euler);

      // Update flashlight lag
      this.onMouseMove(e.movementX, e.movementY);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      this.handleKey(e.code, true);
    });

    document.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });

    // Re-lock pointer on click
    this.canvas.addEventListener('click', () => {
      if (!this.isLocked && window.game?.isPlaying) {
        this.canvas.requestPointerLock();
      }
    });
  }

  handleKey(code, pressed) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = pressed;
        break;
    }
  }

  update(delta) {
    if (!this.isLocked) return;

    // Calculate movement direction
    this.direction.set(0, 0, 0);

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (this.keys.forward) this.direction.add(forward);
    if (this.keys.backward) this.direction.sub(forward);
    if (this.keys.left) this.direction.sub(right);
    if (this.keys.right) this.direction.add(right);

    this.direction.normalize();

    // Sprint
    const isMoving = this.direction.length() > 0;
    this.isSprinting = this.keys.sprint && isMoving;
    const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;

    // Update sprint indicator
    if (this.sprintIndicator) {
      if (this.isSprinting) {
        this.sprintIndicator.classList.add('active');
      } else {
        this.sprintIndicator.classList.remove('active');
      }
    }

    // Apply movement
    this.velocity.copy(this.direction).multiplyScalar(speed * delta);
    this.position.add(this.velocity);

    // Keep player in bounds (forest area)
    const bounds = 80;
    this.position.x = Math.max(-bounds, Math.min(bounds, this.position.x));
    this.position.z = Math.max(-bounds, Math.min(bounds, this.position.z));

    // Head bob when moving
    if (isMoving) {
      const bobMultiplier = this.isSprinting ? 1.5 : 1;
      this.bobTime += delta * this.bobSpeed * bobMultiplier;
      const bobOffset = Math.sin(this.bobTime) * this.bobAmount * bobMultiplier;
      this.position.y = 1.6 + bobOffset;
    } else {
      this.bobTime = 0;
      this.position.y = 1.6;
    }

    // Flashlight bob
    this.updateFlashlightBob(delta, isMoving, this.isSprinting);
  }

  getNoiseLevel() {
    // Returns 0-1 based on movement
    if (this.isSprinting) return 1.0;
    if (this.direction.length() > 0) return 0.3;
    return 0;
  }
}
