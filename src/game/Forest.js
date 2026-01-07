import * as THREE from 'three';

export class Forest {
  constructor(scene) {
    this.scene = scene;
    this.trees = [];

    this.createGround();
    this.createTrees();
    this.createNecklace();
    this.createAmbientLights();
  }

  createGround() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a05,
      roughness: 1,
      metalness: 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
  }

  createTrees() {
    // Create tree geometry (reused)
    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.25, 6, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d1f1a,
      roughness: 1
    });

    // Create many trees
    const treeCount = 300;
    const forestRadius = 85;

    for (let i = 0; i < treeCount; i++) {
      // Random position avoiding center spawn area
      let x, z;
      do {
        x = (Math.random() - 0.5) * forestRadius * 2;
        z = (Math.random() - 0.5) * forestRadius * 2;
      } while (Math.sqrt(x * x + z * z) < 8); // Keep center clear

      const tree = this.createTree(trunkGeometry, trunkMaterial);
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI * 2;

      // Slight random scale variation
      const scale = 0.8 + Math.random() * 0.6;
      tree.scale.set(scale, scale, scale);

      this.scene.add(tree);
      this.trees.push(tree);
    }

    // Dense outer ring of trees (boundary)
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      const radius = forestRadius + 5 + Math.random() * 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const tree = this.createTree(trunkGeometry, trunkMaterial);
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI * 2;

      this.scene.add(tree);
      this.trees.push(tree);
    }
  }

  createTree(trunkGeometry, trunkMaterial) {
    const tree = new THREE.Group();

    // Trunk
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 3;
    trunk.castShadow = true;
    tree.add(trunk);

    // Branches (dead tree look - no leaves, creepy)
    const branchMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1210,
      roughness: 1
    });

    for (let i = 0; i < 5; i++) {
      const branchGeometry = new THREE.CylinderGeometry(0.02, 0.08, 2 + Math.random() * 2, 5);
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);

      branch.position.y = 3 + Math.random() * 3;
      branch.rotation.x = (Math.random() - 0.5) * 0.8;
      branch.rotation.z = Math.random() * Math.PI * 2;
      branch.position.x = Math.sin(branch.rotation.z) * 0.3;
      branch.position.z = Math.cos(branch.rotation.z) * 0.3;

      tree.add(branch);
    }

    return tree;
  }

  createNecklace() {
    // The daughter's necklace - key story element
    const necklaceGroup = new THREE.Group();

    // Chain (simplified as a torus)
    const chainGeometry = new THREE.TorusGeometry(0.15, 0.01, 8, 20);
    const chainMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0a060,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x402000,
      emissiveIntensity: 0.2
    });
    const chain = new THREE.Mesh(chainGeometry, chainMaterial);
    chain.rotation.x = Math.PI / 2;
    necklaceGroup.add(chain);

    // Heart pendant
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, -0.05, -0.05, -0.1, -0.1, -0.1);
    heartShape.bezierCurveTo(-0.15, -0.1, -0.15, -0.05, -0.15, 0);
    heartShape.bezierCurveTo(-0.15, 0.05, 0, 0.15, 0, 0.2);
    heartShape.bezierCurveTo(0, 0.15, 0.15, 0.05, 0.15, 0);
    heartShape.bezierCurveTo(0.15, -0.05, 0.15, -0.1, 0.1, -0.1);
    heartShape.bezierCurveTo(0.05, -0.1, 0, -0.05, 0, 0);

    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01
    });
    const heartMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x553300,
      emissiveIntensity: 0.3
    });
    const heart = new THREE.Mesh(heartGeometry, heartMaterial);
    heart.scale.set(0.5, 0.5, 0.5);
    heart.position.y = -0.15;
    heart.rotation.z = Math.PI;
    necklaceGroup.add(heart);

    // Point light to make it glow slightly
    const necklaceLight = new THREE.PointLight(0xffaa00, 0.5, 3);
    necklaceLight.position.set(0, 0.2, 0);
    necklaceGroup.add(necklaceLight);

    // Position necklace near spawn (player will find it first)
    necklaceGroup.position.set(3, 0.05, 4);
    necklaceGroup.rotation.x = -Math.PI / 2 + 0.1;

    this.scene.add(necklaceGroup);
    this.necklace = necklaceGroup;
  }

  createAmbientLights() {
    // Dim ambient light
    const ambient = new THREE.AmbientLight(0x404040, 1.0);
    this.scene.add(ambient);

    // Subtle moonlight - no shadows
    const moonlight = new THREE.DirectionalLight(0x4444aa, 0.3);
    moonlight.position.set(50, 100, 50);
    this.scene.add(moonlight);

    // Hemisphere light
    const hemi = new THREE.HemisphereLight(0x222233, 0x111111, 0.8);
    this.scene.add(hemi);
  }

  getTreePositions() {
    return this.trees.map(tree => tree.position.clone());
  }
}
