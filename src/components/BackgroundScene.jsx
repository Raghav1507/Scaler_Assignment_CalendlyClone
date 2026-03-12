import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BackgroundScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    // Create a circular cloud of points
    const dotCount = 640;
    const radius = 55;
    const positions = new Float32Array(dotCount * 3);

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const r = radius * (0.4 + 0.6 * Math.random());
      const x = Math.cos(angle) * r;
      const y = (Math.random() - 0.5) * 36;
      const z = Math.sin(angle) * r;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x4f46e5,
      size: 0.55,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
    });

    const points = new THREE.Points(geometry, material);

    // Second shape: inner ring of dots, same size and position
    const dotCount2 = 480;
    const positions2 = new Float32Array(dotCount2 * 3);
    for (let i = 0; i < dotCount2; i++) {
      const angle = (i / dotCount2) * Math.PI * 2;
      const r = radius * 0.35;
      const x = Math.cos(angle) * r;
      const y = (Math.random() - 0.5) * 24;
      const z = Math.sin(angle) * r;
      positions2[i * 3] = x;
      positions2[i * 3 + 1] = y;
      positions2[i * 3 + 2] = z;
    }
    const geometry2 = new THREE.BufferGeometry();
    geometry2.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
    const material2 = new THREE.PointsMaterial({
      color: 0x4f46e5,
      size: 0.55,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
    });
    const points2 = new THREE.Points(geometry2, material2);

    // Group both shapes so they rotate together at same speed, size, position
    const group = new THREE.Group();
    group.add(points);
    group.add(points2);
    scene.add(group);

    // Soft radial gradient plane behind points
    const circleGeometry = new THREE.CircleGeometry(radius * 1.3, 72);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.28
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2.4;
    circle.position.y = -10;
    scene.add(circle);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      // Extra-slow, subtle rotation in both axes (shared across all pages)
      group.rotation.y += 0.00015;
      group.rotation.x += 0.00007;
      circle.rotation.z += 0.00006;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      geometry2.dispose();
      material2.dispose();
      circleGeometry.dispose();
      circleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 -z-20"
      aria-hidden="true"
    />
  );
}

