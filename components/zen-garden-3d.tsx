"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface RippleInstance {
  id: number;
  x: number;
  y: number;
  time: number;
}

export default function ZenGarden3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active ripples list for 3D physics
  const ripplesRef = useRef<RippleInstance[]>([]);
  const nextRippleId = useRef(0);

  // References for mouse interaction and parallax rotation
  const targetRotation = useRef({ x: 0.4, y: -0.4 }); // initial isometric tilt
  const currentRotation = useRef({ x: 0.4, y: -0.4 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Get current container dimensions
    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = null; // transparent background so it overlays the shikkui background

    // 2. CAMERA SETUP (Orthographic/Perspective hybrid for isometric minimalist look)
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    camera.position.set(0, 0, 10); // Look straight ahead down Z
    scene.add(camera);

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. LIGHTS
    const ambientLight = new THREE.AmbientLight(0xfaf8f5, 0.95);
    scene.add(ambientLight);

    // Main directional sunlight for casting soft wabi-sabi shadows
    const dirLight = new THREE.DirectionalLight(0xfffdfa, 1.45);
    dirLight.position.set(5, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -3;
    dirLight.shadow.camera.right = 3;
    dirLight.shadow.camera.top = 3;
    dirLight.shadow.camera.bottom = -3;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Sub-directional fill light to soften dark shadows
    const fillLight = new THREE.DirectionalLight(0xa3b4a2, 0.45);
    fillLight.position.set(-5, -2, 2);
    scene.add(fillLight);

    // 5. INNER ROOT GROUP (Applies overall tilt and parallax)
    const gardenGroup = new THREE.Group();
    scene.add(gardenGroup);

    // 6. GEOMETRIES & MATERIALS

    // Sand Plane Geometry (dense grid for smooth height displacement)
    const segments = 96;
    const sandWidth = 4.0;
    const sandHeight = 4.0;
    const sandGeometry = new THREE.PlaneGeometry(sandWidth, sandHeight, segments, segments);
    
    // Store initial vertex heights for concentric raking patterns
    const initialHeights = new Float32Array(sandGeometry.attributes.position.count);
    const posAttr = sandGeometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const dist = Math.sqrt(x * x + y * y);

      // Concentric circular raked ridges (concentric sine wave)
      const concentricRipple = Math.sin(dist * Math.PI * 5) * 0.025;
      
      // Edge falloff to keep edges flat near the wooden container boundaries
      const edgeFalloffX = Math.min(1, Math.max(0, (sandWidth/2 - Math.abs(x)) * 3.5));
      const edgeFalloffY = Math.min(1, Math.max(0, (sandHeight/2 - Math.abs(y)) * 3.5));
      const totalFalloff = edgeFalloffX * edgeFalloffY;

      const heightVal = concentricRipple * totalFalloff;
      posAttr.setZ(i, heightVal);
      initialHeights[i] = heightVal;
    }
    posAttr.needsUpdate = true;
    sandGeometry.computeVertexNormals();

    // Sand standard matte material
    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf8f5,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: false,
    });

    const sandMesh = new THREE.Mesh(sandGeometry, sandMaterial);
    sandMesh.receiveShadow = true;
    sandMesh.castShadow = false;
    gardenGroup.add(sandMesh);

    // Wooden Container Outer Box
    const boxThickness = 0.12;
    const boxDepth = 0.25;
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c2b29, // Sumi Ink Charcoal
      roughness: 0.75,
      metalness: 0.05,
    });

    // Box Frame segments
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(boxThickness, sandHeight + boxThickness * 2, boxDepth), woodMaterial);
    frameLeft.position.set(-sandWidth / 2 - boxThickness / 2, 0, boxDepth / 2 - 0.05);
    frameLeft.castShadow = true;
    frameLeft.receiveShadow = true;
    gardenGroup.add(frameLeft);

    const frameRight = frameLeft.clone();
    frameRight.position.set(sandWidth / 2 + boxThickness / 2, 0, boxDepth / 2 - 0.05);
    gardenGroup.add(frameRight);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(sandWidth, boxThickness, boxDepth), woodMaterial);
    frameTop.position.set(0, sandHeight / 2 + boxThickness / 2, boxDepth / 2 - 0.05);
    frameTop.castShadow = true;
    frameTop.receiveShadow = true;
    gardenGroup.add(frameTop);

    const frameBottom = frameTop.clone();
    frameBottom.position.set(0, -sandHeight / 2 - boxThickness / 2, boxDepth / 2 - 0.05);
    gardenGroup.add(frameBottom);

    // Box Base floor
    const boxBase = new THREE.Mesh(new THREE.BoxGeometry(sandWidth + boxThickness * 2, sandHeight + boxThickness * 2, 0.05), woodMaterial);
    boxBase.position.set(0, 0, -0.05);
    boxBase.receiveShadow = true;
    gardenGroup.add(boxBase);

    // 7. 3D RIVER PEBBLES (Ellipsoidal Sphere Geometries)
    const stonesGroup = new THREE.Group();
    gardenGroup.add(stonesGroup);

    const stoneSpecs = [
      {
        color: 0xe5a99e, // Sakura Pink
        scale: [0.65, 0.45, 0.25] as [number, number, number],
        position: [-0.9, 0.7, 0.1] as [number, number, number],
        rotation: [0.1, -0.2, 0.6] as [number, number, number],
        roughness: 0.45,
      },
      {
        color: 0xa3b4a2, // Moss Green
        scale: [0.85, 0.65, 0.35] as [number, number, number],
        position: [0.8, -0.5, 0.15] as [number, number, number],
        rotation: [-0.2, 0.15, -0.8] as [number, number, number],
        roughness: 0.5,
      },
      {
        color: 0xb8c5d0, // Slate Blue
        scale: [0.45, 0.45, 0.2] as [number, number, number],
        position: [-0.4, -0.9, 0.08] as [number, number, number],
        rotation: [0.3, 0.3, 0.1] as [number, number, number],
        roughness: 0.4,
      },
    ];

    stoneSpecs.forEach((spec) => {
      const stoneGeo = new THREE.SphereGeometry(1, 32, 24);
      const stoneMat = new THREE.MeshStandardMaterial({
        color: spec.color,
        roughness: spec.roughness,
        metalness: 0.05,
      });
      const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
      stoneMesh.scale.set(...spec.scale);
      stoneMesh.position.set(...spec.position);
      stoneMesh.rotation.set(...spec.rotation);
      stoneMesh.castShadow = true;
      stoneMesh.receiveShadow = true;
      stonesGroup.add(stoneMesh);
    });

    // 8. RAYCASTER & CLICKS FOR RIPPLE PHYSICS
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const trigger3DRipple = (x: number, y: number) => {
      const id = nextRippleId.current++;
      ripplesRef.current.push({
        id,
        x,
        y,
        time: 0,
      });

      // Maintain a maximum of 4 active ripples to conserve processing power
      if (ripplesRef.current.length > 4) {
        ripplesRef.current.shift();
      }
    };

    // Raycast click coordinate mapping
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Normalized Device Coordinates (-1 to 1)
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(sandMesh);

      if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        const localPoint = sandMesh.worldToLocal(intersectPoint.clone());
        trigger3DRipple(localPoint.x, localPoint.y);
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    // 9. MOUSE ROTATION / TRACTILE DRAGGING EVENT LISTENERS
    const handleMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = event.clientX;
      const clientY = event.clientY;

      if (isDragging.current) {
        // Drag-to-rotate orbit camera controls
        const deltaX = clientX - previousMousePosition.current.x;
        const deltaY = clientY - previousMousePosition.current.y;

        targetRotation.current.y += deltaX * 0.007;
        targetRotation.current.x += deltaY * 0.007;

        // Cap camera tilt angles to prevent flipping upside down
        targetRotation.current.x = Math.max(0.1, Math.min(1.2, targetRotation.current.x));

        previousMousePosition.current = {
          x: clientX,
          y: clientY,
        };
      } else {
        // Hover parallax drifting when not dragging
        const containerCenterX = rect.left + rect.width / 2;
        const containerCenterY = rect.top + rect.height / 2;
        const offsetX = (clientX - containerCenterX) / (rect.width / 2);
        const offsetY = (clientY - containerCenterY) / (rect.height / 2);

        // Adjust base rotations by hover values
        targetRotation.current.y = -0.4 + offsetX * 0.18;
        targetRotation.current.x = 0.5 + offsetY * 0.18;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Touch support for mobile devices
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging.current && event.touches.length === 1) {
        const clientX = event.touches[0].clientX;
        const clientY = event.touches[0].clientY;

        const deltaX = clientX - previousMousePosition.current.x;
        const deltaY = clientY - previousMousePosition.current.y;

        targetRotation.current.y += deltaX * 0.009;
        targetRotation.current.x += deltaY * 0.009;
        targetRotation.current.x = Math.max(0.1, Math.min(1.2, targetRotation.current.x));

        previousMousePosition.current = {
          x: clientX,
          y: clientY,
        };
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleMouseUp, { passive: true });

    // 10. ANIMATION LOOP
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth interpolation for camera rotations (Spring damping effect)
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.06;
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.06;

      gardenGroup.rotation.y = currentRotation.current.y;
      gardenGroup.rotation.x = currentRotation.current.x;

      // Subtle breathing motion for pebbles
      stonesGroup.position.z = Math.sin(time * 1.5) * 0.012;

      // Update ripple propagation physics
      const activeRipples = ripplesRef.current;
      
      if (activeRipples.length > 0) {
        // Increment time for each active ripple
        activeRipples.forEach((ripple) => {
          ripple.time += delta;
        });

        // Remove ripples that completed propagation and decayed completely
        ripplesRef.current = activeRipples.filter((ripple) => ripple.time < 2.2);

        // Displace plane height attributes in real-time
        const positions = sandGeometry.attributes.position;
        const speed = 4.5;
        const waveLength = 0.55;

        for (let i = 0; i < positions.count; i++) {
          const vx = positions.getX(i);
          const vy = positions.getY(i);
          
          let accumulatedDisplacement = initialHeights[i];

          // Compute wave impact of all active ripples on this vertex
          ripplesRef.current.forEach((ripple) => {
            const dx = vx - ripple.x;
            const dy = vy - ripple.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const waveFront = ripple.time * speed;

            if (dist < waveFront) {
              const timeDecay = Math.exp(-ripple.time * 1.6);
              const spaceDecay = Math.max(0, 1 - (waveFront - dist) / 1.6);
              const phase = (waveFront - dist) / waveLength;

              // Propagating sine wave displacement
              const waveHeight = Math.sin(phase * Math.PI * 2) * 0.08 * spaceDecay * timeDecay;
              accumulatedDisplacement += waveHeight;
            }
          });

          positions.setZ(i, accumulatedDisplacement);
        }

        positions.needsUpdate = true;
        sandGeometry.computeVertexNormals();
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. HANDLE WINDOW RESIZE
    const handleResize = () => {
      if (!containerRef.current) return;
      width = container.clientWidth;
      height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 12. CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleMouseUp);
      
      sandGeometry.dispose();
      sandMaterial.dispose();
      woodMaterial.dispose();
      stonesGroup.children.forEach((mesh) => {
        if (mesh instanceof THREE.Mesh) {
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      
      {/* Decorative center marker for 3D alignment */}
      <div className="absolute top-4 left-4 pointer-events-none border border-[#2C2B29]/10 rounded-full px-2 py-0.5 text-[7px] font-bold tracking-widest text-[#2C2B29]/30 uppercase select-none">
        3D Engine Active
      </div>
    </div>
  );
}
