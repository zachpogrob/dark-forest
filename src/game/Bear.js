import * as THREE from 'three';

export class Bear {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.position = new THREE.Vector3(60, 0, 60);
    this.isActive = false;
    this.isChasing = false;
    this.catchDistance = 2;

    // Movement
    this.speed = 3;
    this.chaseSpeed = 6;
    this.currentSpeed = 0;

    // Detection
    this.detectionRange = 50;
    this.hearingRange = 35;
    this.sightRange = 25;

    // Roaming
    this.roamTarget = new THREE.Vector3();
    this.roamTimer = 0;

    // Eyes glow intensity
    this.eyeIntensity = 0;
    this.targetEyeIntensity = 0;

    this.createBear();
    this.createDangerOverlay();
  }

  createBear() {
    this.bearGroup = new THREE.Group();

    // Giant teddy bear body - menacing scale
    const bodyGeometry = new THREE.SphereGeometry(2, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      roughness: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.2, 0.9);
    body.position.y = 3;
    this.bearGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 5.5;
    this.bearGroup.add(head);

    // Snout
    const snoutGeometry = new THREE.SphereGeometry(0.5, 12, 12);
    const snoutMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0a00,
      roughness: 1
    });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.position.set(0, 5.3, 0.9);
    snout.scale.set(1, 0.7, 0.8);
    this.bearGroup.add(snout);

    // Ears
    const earGeometry = new THREE.SphereGeometry(0.4, 12, 12);
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.8, 6.4, 0);
    this.bearGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.8, 6.4, 0);
    this.bearGroup.add(rightEar);

    // RED GLOWING EYES - the key horror element
    const eyeGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    this.eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0
    });

    this.leftEye = new THREE.Mesh(eyeGeometry, this.eyeMaterial.clone());
    this.leftEye.position.set(-0.35, 5.6, 0.95);
    this.bearGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, this.eyeMaterial.clone());
    this.rightEye.position.set(0.35, 5.6, 0.95);
    this.bearGroup.add(this.rightEye);

    // Eye glow lights
    this.leftEyeLight = new THREE.PointLight(0xff0000, 0, 20);
    this.leftEyeLight.position.copy(this.leftEye.position);
    this.bearGroup.add(this.leftEyeLight);

    this.rightEyeLight = new THREE.PointLight(0xff0000, 0, 20);
    this.rightEyeLight.position.copy(this.rightEye.position);
    this.bearGroup.add(this.rightEyeLight);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.4, 1.5, 8, 8);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-1.8, 3.5, 0);
    leftArm.rotation.z = 0.4;
    this.bearGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(1.8, 3.5, 0);
    rightArm.rotation.z = -0.4;
    this.bearGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.5, 1.2, 8, 8);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.8, 1, 0);
    this.bearGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.8, 1, 0);
    this.bearGroup.add(rightLeg);

    // Position bear
    this.bearGroup.position.copy(this.position);
    this.scene.add(this.bearGroup);
  }

  createDangerOverlay() {
    this.dangerOverlay = document.getElementById('danger-overlay');
  }

  activate() {
    this.isActive = true;
    this.setNewRoamTarget();
  }

  setNewRoamTarget() {
    // Pick random point in forest
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 40;
    this.roamTarget.set(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    );
    this.roamTimer = 5 + Math.random() * 10;
  }

  update(delta, playerIsSprinting) {
    if (!this.isActive) return;

    const playerPos = this.player.position.clone();
    playerPos.y = 0;

    const bearPos = this.position.clone();
    bearPos.y = 0;

    const distanceToPlayer = bearPos.distanceTo(playerPos);

    // Detection logic
    let canDetect = false;

    // Hearing detection (increased range when sprinting)
    const effectiveHearingRange = playerIsSprinting ? this.hearingRange * 1.5 : this.hearingRange;
    if (distanceToPlayer < effectiveHearingRange && this.player.getNoiseLevel() > 0.2) {
      canDetect = true;
    }

    // Sight detection
    if (distanceToPlayer < this.sightRange) {
      // Check if player is in front of bear
      const bearForward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.bearGroup.quaternion);
      const toPlayer = playerPos.clone().sub(bearPos).normalize();
      const dot = bearForward.dot(toPlayer);

      if (dot > 0.3) { // In bear's field of view
        canDetect = true;
      }
    }

    // State transitions
    if (canDetect && distanceToPlayer < this.detectionRange) {
      this.isChasing = true;
    } else if (distanceToPlayer > this.detectionRange * 1.5) {
      this.isChasing = false;
    }

    // Movement
    let targetPos;
    if (this.isChasing) {
      targetPos = playerPos;
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, this.chaseSpeed, delta * 2);
    } else {
      // Roaming
      this.roamTimer -= delta;
      if (this.roamTimer <= 0 || bearPos.distanceTo(this.roamTarget) < 2) {
        this.setNewRoamTarget();
      }
      targetPos = this.roamTarget;
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, this.speed, delta);
    }

    // Move towards target
    const direction = targetPos.clone().sub(bearPos).normalize();
    this.position.add(direction.multiplyScalar(this.currentSpeed * delta));

    // Keep in bounds
    const bounds = 75;
    this.position.x = Math.max(-bounds, Math.min(bounds, this.position.x));
    this.position.z = Math.max(-bounds, Math.min(bounds, this.position.z));

    // Update bear group position
    this.bearGroup.position.copy(this.position);

    // Face movement direction
    if (direction.length() > 0.1) {
      const angle = Math.atan2(direction.x, direction.z);
      this.bearGroup.rotation.y = THREE.MathUtils.lerp(
        this.bearGroup.rotation.y,
        angle,
        delta * 3
      );
    }

    // Eye glow based on proximity and detection
    if (distanceToPlayer < this.detectionRange) {
      this.targetEyeIntensity = 1 - (distanceToPlayer / this.detectionRange);
      if (this.isChasing) {
        this.targetEyeIntensity = Math.min(1, this.targetEyeIntensity * 2);
      }
    } else {
      this.targetEyeIntensity = 0.2; // Subtle glow always visible in dark
    }

    this.eyeIntensity = THREE.MathUtils.lerp(this.eyeIntensity, this.targetEyeIntensity, delta * 2);

    // Update eye materials
    this.leftEye.material.opacity = this.eyeIntensity;
    this.rightEye.material.opacity = this.eyeIntensity;
    this.leftEyeLight.intensity = this.eyeIntensity * 2;
    this.rightEyeLight.intensity = this.eyeIntensity * 2;

    // Danger overlay
    if (this.dangerOverlay) {
      if (this.isChasing && distanceToPlayer < 20) {
        this.dangerOverlay.classList.add('active');
      } else {
        this.dangerOverlay.classList.remove('active');
      }
    }
  }

  getDistanceToPlayer() {
    const playerPos = this.player.position.clone();
    playerPos.y = 0;
    const bearPos = this.position.clone();
    bearPos.y = 0;
    return bearPos.distanceTo(playerPos);
  }

  hasCaughtPlayer() {
    return this.isActive && this.getDistanceToPlayer() < this.catchDistance;
  }
}
