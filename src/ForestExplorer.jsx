import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const WEAPON_OPTIONS = [
  {
    id: 'assault',
    label: 'Assault Rifle',
    path: '/models/Ultimate%20Guns%20Pack-zip/Assault%20Rifle/AssaultRifle_4.fbx',
    scale: [0.012, 0.012, 0.012],
    rotation: [0, Math.PI, 0],
    position: [0.08, -0.12, 0.05]
  },
  {
    id: 'smg',
    label: 'Submachine Gun',
    path: '/models/Ultimate%20Guns%20Pack-zip/Submachine%20Gun/SubmachineGun_3.fbx',
    scale: [0.012, 0.012, 0.012],
    rotation: [0, Math.PI, 0],
    position: [0.08, -0.12, 0.05]
  },
  {
    id: 'shotgun',
    label: 'Shotgun',
    path: '/models/Ultimate%20Guns%20Pack-zip/Shotgun/Shotgun_3.fbx',
    scale: [0.012, 0.012, 0.012],
    rotation: [0, Math.PI, 0],
    position: [0.08, -0.12, 0.05]
  },
  {
    id: 'sniper',
    label: 'Sniper Rifle',
    path: '/models/Ultimate%20Guns%20Pack-zip/Sniper%20Rifle/SniperRifle_4.fbx',
    scale: [0.012, 0.012, 0.012],
    rotation: [0, Math.PI, 0],
    position: [0.08, -0.12, 0.05]
  },
  {
    id: 'pistol',
    label: 'Pistol',
    path: '/models/Ultimate%20Guns%20Pack-zip/Pistol/Pistol_3.fbx',
    scale: [0.014, 0.014, 0.014],
    rotation: [0, Math.PI, 0],
    position: [0.1, -0.15, 0.1]
  }
];

const EQUIPMENT_OPTIONS = [
  {
    id: 'none',
    label: 'Aucun',
    path: null
  },
  {
    id: 'scope',
    label: 'Scope',
    path: '/models/Ultimate%20Guns%20Pack-zip/Scope/Scope_2.fbx',
    scale: [0.01, 0.01, 0.01],
    rotation: [0, Math.PI, 0],
    position: [0.08, -0.02, -0.1]
  },
  {
    id: 'bayonet',
    label: 'Bayonet',
    path: '/models/Ultimate%20Guns%20Pack-zip/Bayonet/Bayonet.fbx',
    scale: [0.012, 0.012, 0.012],
    rotation: [0, Math.PI, 0],
    position: [0.08, -0.16, -0.35]
  },
  {
    id: 'bipod',
    label: 'Bipod',
    path: '/models/Ultimate%20Guns%20Pack-zip/Bipod/Bipod.fbx',
    scale: [0.01, 0.01, 0.01],
    rotation: [0, Math.PI, 0],
    position: [0.08, -0.2, -0.2]
  }
];

const ForestExplorer = () => {
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPON_OPTIONS[0].id);
  const [selectedEquipment, setSelectedEquipment] = useState(EQUIPMENT_OPTIONS[0].id);
  const activeWeapon = WEAPON_OPTIONS.find((option) => option.id === selectedWeapon) ?? WEAPON_OPTIONS[0];
  const activeEquipment = EQUIPMENT_OPTIONS.find((option) => option.id === selectedEquipment) ?? EQUIPMENT_OPTIONS[0];

  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.fog = new THREE.Fog(0x004f00, 50, 200);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5c1, 0.8);
    directionalLight.position.set(50, 50, -50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x567d46 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const weaponGroup = new THREE.Group();
    weaponGroup.position.set(0.28, -0.22, -0.55);
    weaponGroup.renderOrder = 999;
    camera.add(weaponGroup);
    scene.add(camera);

    const fbxLoader = new FBXLoader();
    const fallbackParts = [];
    const loadedWeaponModels = [];
    const loadedEquipmentModels = [];
    let isDisposed = false;

    const prepareModel = (model) => {
      model.traverse((child) => {
        if (child.isMesh) {
          child.renderOrder = 999;
          child.castShadow = false;
          child.receiveShadow = false;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;
            mat.depthTest = false;
            mat.depthWrite = false;
            mat.metalness = 0.45;
            mat.roughness = 0.55;
            mat.needsUpdate = true;
          });
        }
      });
    };

    const addFallbackWeapon = () => {
      const mkMat = (color) => new THREE.MeshStandardMaterial({
        color,
        metalness: 0.6,
        roughness: 0.35,
        depthTest: false,
        depthWrite: false
      });
      const fallbackBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.9), mkMat(0x3a3a3a));
      fallbackBody.position.set(0, 0, 0);
      fallbackBody.renderOrder = 999;
      const fallbackBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 10), mkMat(0x1a1a1a));
      fallbackBarrel.rotation.x = Math.PI / 2;
      fallbackBarrel.position.set(0, 0.04, -0.7);
      fallbackBarrel.renderOrder = 999;
      const fallbackGrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.12), mkMat(0x222222));
      fallbackGrip.position.set(0, -0.2, 0.1);
      fallbackGrip.renderOrder = 999;
      weaponGroup.add(fallbackBody, fallbackBarrel, fallbackGrip);
      fallbackParts.push(fallbackBody, fallbackBarrel, fallbackGrip);
    };

    const clearFallbackWeapon = () => {
      fallbackParts.forEach((part) => {
        weaponGroup.remove(part);
        part.geometry.dispose();
        part.material.dispose();
      });
      fallbackParts.length = 0;
    };

    const fitWeaponModel = (model, config) => {
      model.rotation.set(...config.rotation);

      const box = new THREE.Box3().setFromObject(model);
      if (!box.isEmpty()) {
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const TARGET = 0.75;
        const fitScale = TARGET / maxDim;
        model.scale.setScalar(fitScale);

        // recentre sur l'origine puis décale selon la config
        model.position.set(
          -center.x * fitScale + config.position[0],
          -center.y * fitScale + config.position[1],
          -center.z * fitScale + config.position[2]
        );
      } else {
        model.position.set(...config.position);
      }
    };

    addFallbackWeapon();

    fbxLoader.load(
      activeWeapon.path,
      (weaponModel) => {
        if (isDisposed) {
          return;
        }
        fitWeaponModel(weaponModel, activeWeapon);
        prepareModel(weaponModel);
        clearFallbackWeapon();
        weaponGroup.add(weaponModel);
        loadedWeaponModels.push(weaponModel);
      },
      undefined,
      () => {
        if (isDisposed) {
          return;
        }
        console.warn(`Impossible de charger le modèle d'arme: ${activeWeapon.path}`);
      }
    );

    if (activeEquipment.path) {
      fbxLoader.load(
        activeEquipment.path,
        (equipmentModel) => {
          if (isDisposed) {
            return;
          }
          equipmentModel.scale.set(...activeEquipment.scale);
          equipmentModel.rotation.set(...activeEquipment.rotation);
          equipmentModel.position.set(...activeEquipment.position);
          prepareModel(equipmentModel);
          weaponGroup.add(equipmentModel);
          loadedEquipmentModels.push(equipmentModel);
        },
        undefined,
        () => {
        }
      );
    }

    const makeFallbackRedDotTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      ctx.clearRect(0, 0, 64, 64);
      const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 22);
      gradient.addColorStop(0, 'rgba(255, 55, 55, 1)');
      gradient.addColorStop(0.45, 'rgba(255, 55, 55, 0.95)');
      gradient.addColorStop(1, 'rgba(255, 55, 55, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 22, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const redDotMaterial = new THREE.SpriteMaterial({
      color: 0xffffff,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const redDotSprite = new THREE.Sprite(redDotMaterial);
    redDotSprite.position.set(0, 0, -0.35);
    redDotSprite.scale.set(0.02, 0.02, 1);
    redDotSprite.visible = false;
    camera.add(redDotSprite);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/textures/reddot.png',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        redDotMaterial.map = texture;
        redDotMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        const fallbackTexture = makeFallbackRedDotTexture();
        if (fallbackTexture) {
          redDotMaterial.map = fallbackTexture;
          redDotMaterial.needsUpdate = true;
        }
      }
    );

    const hipWeaponPos = new THREE.Vector3(0.28, -0.22, -0.55);
    const aimWeaponPos = new THREE.Vector3(0.06, -0.18, -0.45);
    const raycaster = new THREE.Raycaster();
    const shootDirection = new THREE.Vector2(0, 0);
    const impactMarkers = [];
    const shotTraces = [];
    const treeGroups = [];
    let lastShotAt = 0;

    const createImpact = (position, normal) => {
      const impact = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 16),
        new THREE.MeshBasicMaterial({
          color: 0x1a1a1a,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide
        })
      );
      impact.position.copy(position).add(normal.clone().multiplyScalar(0.02));
      const lookAtTarget = position.clone().add(normal);
      impact.lookAt(lookAtTarget);
      scene.add(impact);
      impactMarkers.push({ mesh: impact, life: 20 });
    };

    const createShotTrace = (start, end) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.95 });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      shotTraces.push({ line, life: 0.08 });
    };

    const createTree = (x, z) => {
      const group = new THREE.Group();
      group.userData.isTree = true;

      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      const leavesColors = [0x0f5132, 0x146b44, 0x198754];
      for (let i = 0; i < 3; i++) {
        const leavesGeometry = new THREE.ConeGeometry(3 - i * 0.5, 6 - i * 1, 8);
        const leavesColor = leavesColors[i % leavesColors.length];
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: leavesColor });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 4 + i * 3;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);
      }

      group.position.set(x, 4, z);
      return group;
    };

    for (let i = 0; i < 100; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      if (x < -10 || x > 10 || z < -10 || z > 10) {
        const tree = createTree(x, z);
        scene.add(tree);
        treeGroups.push(tree);
      }
    }

    const grassGeometry = new THREE.PlaneGeometry(0.5, 1);
    const grassMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x7cfc00,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 500; i++) {
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      grass.position.set(
        (Math.random() - 0.5) * 200,
        0.5,
        (Math.random() - 0.5) * 200
      );
      grass.rotation.x = -Math.PI / 2;
      grass.rotation.z = Math.random() * Math.PI;
      scene.add(grass);
    }

    const keys = {};
    const moveSpeed = 0.5;
    let yaw = 0;
    let pitch = 0;
    let aiming = false;

    const onKeyDown = (e) => {
      keys[e.code] = true;
    };

    const onKeyUp = (e) => {
      keys[e.code] = false;
    };

    const onContextMenu = (e) => {
      if (e.target instanceof Element && e.target.closest('[data-ui-menu="true"]')) {
        return;
      }
      e.preventDefault();
    };

    const requestLookLock = () => {
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock?.();
      }
    };

    const shoot = () => {
      const now = performance.now();
      if (now - lastShotAt < 120) {
        return;
      }
      lastShotAt = now;

      const shootStart = new THREE.Vector3();
      const shootEnd = new THREE.Vector3();
      camera.getWorldPosition(shootStart);
      camera.getWorldDirection(shootEnd);
      shootEnd.multiplyScalar(220).add(shootStart);

      raycaster.setFromCamera(shootDirection, camera);
      const intersections = raycaster.intersectObjects([ground, ...treeGroups], true);

      if (intersections.length > 0) {
        const hit = intersections[0];
        createShotTrace(shootStart, hit.point);
        const normal = hit.face?.normal
          ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
          : new THREE.Vector3(0, 1, 0);
        createImpact(hit.point, normal);

        const treeGroup = hit.object.parent?.userData?.isTree
          ? hit.object.parent
          : hit.object.parent?.parent?.userData?.isTree
            ? hit.object.parent.parent
            : null;

        if (treeGroup) {
          scene.remove(treeGroup);
          const treeIndex = treeGroups.indexOf(treeGroup);
          if (treeIndex !== -1) {
            treeGroups.splice(treeIndex, 1);
          }
        }
        return;
      }

      createShotTrace(shootStart, shootEnd);
    };

    const onMouseDown = (e) => {
      if (e.target instanceof Element && e.target.closest('[data-ui-menu="true"]')) {
        return;
      }
      if (e.button === 0 || e.button === 2) {
        requestLookLock();
      }
      if (e.button === 2) {
        aiming = true;
        redDotSprite.visible = true;
      }
      if (e.button === 0) {
        shoot();
      }
    };

    const onMouseUp = (e) => {
      if (e.button === 2) {
        aiming = false;
        redDotSprite.visible = false;
      }
    };

    const onMouseMove = (e) => {
      const pointerLocked = document.pointerLockElement === renderer.domElement;
      if (!pointerLocked && !aiming) {
        return;
      }
      yaw -= e.movementX * 0.002;
      pitch -= e.movementY * 0.0016;
      pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
    };

    const onPointerLockChange = () => {
      if (document.pointerLockElement !== renderer.domElement && aiming) {
        aiming = false;
        redDotSprite.visible = false;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const updateMovement = () => {
      if (keys['KeyW'] || keys['ArrowUp']) {
        camera.translateZ(-moveSpeed);
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        camera.translateZ(moveSpeed);
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        camera.translateX(-moveSpeed);
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        camera.translateX(moveSpeed);
      }

      camera.position.y = 5;
    };

    let lastFrame = performance.now();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      updateMovement();

      const targetFov = aiming ? 55 : 75;
      camera.fov += (targetFov - camera.fov) * 0.16;
      camera.updateProjectionMatrix();

      const targetWeaponPos = aiming ? aimWeaponPos : hipWeaponPos;
      weaponGroup.position.lerp(targetWeaponPos, 0.2);

      for (let i = impactMarkers.length - 1; i >= 0; i--) {
        const marker = impactMarkers[i];
        marker.life -= delta;
        if (marker.life <= 0) {
          scene.remove(marker.mesh);
          marker.mesh.geometry.dispose();
          marker.mesh.material.dispose();
          impactMarkers.splice(i, 1);
        }
      }

      for (let i = shotTraces.length - 1; i >= 0; i--) {
        const trace = shotTraces[i];
        trace.life -= delta;
        trace.line.material.opacity = Math.max(0, trace.life * 12);
        if (trace.life <= 0) {
          scene.remove(trace.line);
          trace.line.geometry.dispose();
          trace.line.material.dispose();
          shotTraces.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;

      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock?.();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      impactMarkers.forEach(({ mesh }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });

      shotTraces.forEach(({ line }) => {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      });

      fallbackParts.forEach((part) => {
        weaponGroup.remove(part);
        part.geometry.dispose();
        part.material.dispose();
      });

      loadedWeaponModels.forEach((model) => {
        weaponGroup.remove(model);
      });

      loadedEquipmentModels.forEach((model) => {
        weaponGroup.remove(model);
      });

      if (redDotMaterial.map) {
        redDotMaterial.map.dispose();
      }
      redDotMaterial.dispose();
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, [activeWeapon, activeEquipment]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      <div data-ui-menu="true" className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-4 rounded w-72">
        <h2 className="text-lg font-bold mb-3">Sélection équipement</h2>
        <label className="block text-sm mb-1">Arme</label>
        <select
          className="w-full mb-3 bg-gray-900 border border-gray-600 rounded px-2 py-1"
          value={selectedWeapon}
          onChange={(e) => setSelectedWeapon(e.target.value)}
        >
          {WEAPON_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="block text-sm mb-1">Équipement</label>
        <select
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1"
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value)}
        >
          {EQUIPMENT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded max-w-sm">
        <h2 className="text-xl font-bold mb-2">Forest Explorer Controls</h2>
        <ul className="text-sm">
          <li>W/↑/S/↓ or A/D/←/→ - Move</li>
          <li>Clic droit maintenu - Viser</li>
          <li>Clic gauche - Tirer</li>
        </ul>
      </div>
    </div>
  );
};

export default ForestExplorer;