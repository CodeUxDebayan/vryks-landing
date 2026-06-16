/**
 * VRYKS Landing — scene.js
 * - Mouse-reactive camera parallax (Plan 1 & 3)
 * - GLB materials preserved (red card, white text from Blender)
 * - Electric blue rim lighting
 * - Scroll-synced + mouse-synced transforms
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function initScene(lenis) {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const dpr      = Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5);

  // ── Renderer ────────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping      = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ── Scene & Camera ───────────────────────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 5);

  // ── Lights ──────────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(4, 6, 6);
  scene.add(keyLight);

  const blueRim = new THREE.DirectionalLight(0x0057ff, 3.0);
  blueRim.position.set(-5, -1, 2);
  scene.add(blueRim);

  const warmFill = new THREE.PointLight(0xff4422, 1.2, 30);
  warmFill.position.set(0, -6, 3);
  scene.add(warmFill);

  // ── Mouse tracking (Plan 1 & 3) ─────────────────────────────────────────────
  let mouseX = 0, mouseY = 0;
  let targetMX = 0, targetMY = 0;

  window.addEventListener('mousemove', e => {
    targetMX = (e.clientX / window.innerWidth)  * 2 - 1;
    targetMY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // ── GLB Loader ───────────────────────────────────────────────────────────────
  let mainObject;
  let baseScale = 1;
  const loader  = new GLTFLoader();

  const RED_MAT   = new THREE.MeshStandardMaterial({ color: 0xcc1a1a, roughness: 0.35, metalness: 0.2 });
  const WHITE_MAT = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5,  metalness: 0.0, emissive: 0xffffff, emissiveIntensity: 0.1 });

  loader.load(
    './vryks.glb',
    gltf => {
      mainObject = gltf.scene;
      mainObject.traverse(child => {
        if (!child.isMesh) return;
        const name = child.name || '';
        if      (name === 'Node1') child.material = RED_MAT;
        else if (name === 'Node2') child.material = WHITE_MAT;
        child.castShadow    = false;
        child.receiveShadow = false;
        if (child.material && name !== 'Node1' && name !== 'Node2') {
          child.material = child.material.clone();
          child.material.side = THREE.FrontSide;
        }
      });

      const box    = new THREE.Box3().setFromObject(mainObject);
      const centre = new THREE.Vector3();
      const size   = new THREE.Vector3();
      box.getCenter(centre);
      box.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      baseScale    = (isMobile ? 1.1 : 1.8) / maxDim;
      mainObject.scale.setScalar(baseScale);
      mainObject.position.copy(centre.multiplyScalar(-baseScale));
      scene.add(mainObject);

      if (import.meta.env.DEV) {
        console.group('[VRYKS] GLB mesh inventory:');
        mainObject.traverse(c => {
          if (c.isMesh) {
            const mat = Array.isArray(c.material) ? c.material[0] : c.material;
            console.log(`  ${c.name} | color: ${mat?.color?.getHexString() || 'n/a'}`);
          }
        });
        console.groupEnd();
      }
    },
    undefined,
    err => {
      console.warn('[VRYKS] GLB failed, using procedural fallback:', err?.message);
      mainObject = buildFallback();
      scene.add(mainObject);
    },
  );

  // ── Procedural Fallback ──────────────────────────────────────────────────────
  function buildFallback() {
    const group  = new THREE.Group();
    const detail = isMobile ? 1 : 3;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0 },
        uScroll: { value: 0 },
        uMouse:  { value: new THREE.Vector2(0, 0) }, // Plan 3: mouse uniform
      },
      vertexShader: `
        uniform float uTime; uniform float uScroll; uniform vec2 uMouse;
        varying vec3 vN; varying vec3 vP;
        vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}
        vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
        vec4 pm(vec4 x){return m289(((x*34.)+1.)*x);}
        vec4 ti(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float sn(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
          vec3 i=floor(v+dot(v,C.yyy)),x0=v-i+dot(i,C.xxx),g=step(x0.yzx,x0.xyz),l=1.-g,
            i1=min(g.xyz,l.zxy),i2=max(g.xyz,l.zxy),x1=x0-i1+C.xxx,x2=x0-i2+C.yyy,x3=x0-D.yyy;
          i=m289(i);vec4 p=pm(pm(pm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
          float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
          vec4 j=p-49.*floor(p*ns.z*ns.z),x_=floor(j*ns.z),y_=floor(j-7.*x_),
            x=x_*ns.x+ns.yyyy,y=y_*ns.x+ns.yyyy,h=1.-abs(x)-abs(y),
            b0=vec4(x.xy,y.xy),b1=vec4(x.zw,y.zw),s0=floor(b0)*2.+1.,s1=floor(b1)*2.+1.,sh=-step(h,vec4(0.));
          vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;
          vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);
          vec4 norm=ti(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
          p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
          vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
          return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
        void main(){vN=normalize(normalMatrix*normal);vP=position;
          float mouseInfluence = length(uMouse) * 0.15;
          float n=sn(position*1.2+vec3(uTime*.15)+vec3(uMouse.x,uMouse.y,0.)*0.3);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(
            position+normal*(n*.12+mouseInfluence)*(1.-uScroll*.5),1.);}
      `,
      fragmentShader: `
        uniform float uScroll; uniform vec2 uMouse; varying vec3 vN; varying vec3 vP;
        void main(){
          vec3 vd=normalize(cameraPosition-vP);
          float f=pow(1.-max(dot(vd,vN),0.),2.5);
          float mouseGlow = length(uMouse) * 0.3;
          vec3 col=mix(vec3(0.,0.34,1.),vec3(1.),.5+uScroll*.4+mouseGlow);
          gl_FragColor=vec4(mix(col*.05,col,f),f*.55+.05);}
      `,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, detail), mat);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.4, isMobile ? 0 : 1)),
      new THREE.LineBasicMaterial({ color: 0x0057ff, transparent: true, opacity: 0.15 }),
    );
    group.add(mesh, wire);
    group._mat = mat;
    return group;
  }

  // ── Scroll tracking ──────────────────────────────────────────────────────────
  let scrollProgress = 0;
  lenis.on('scroll', ({ progress }) => { scrollProgress = progress; });

  // ── Resize ───────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Render Loop ───────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  (function tick() {
    const t = clock.getElapsedTime();

    // Smooth mouse tracking
    mouseX = THREE.MathUtils.lerp(mouseX, targetMX, 0.05);
    mouseY = THREE.MathUtils.lerp(mouseY, targetMY, 0.05);

    if (mainObject) {
      const tx = scrollProgress < 0.5 ? scrollProgress * 4.5 : (1 - scrollProgress) * 4.5;
      const tz = scrollProgress * -2;

      mainObject.position.x = THREE.MathUtils.lerp(mainObject.position.x, tx,   0.04);
      mainObject.position.y = THREE.MathUtils.lerp(mainObject.position.y, scrollProgress * -1.5, 0.04);
      mainObject.position.z = THREE.MathUtils.lerp(mainObject.position.z, tz, 0.04);

      mainObject.rotation.y = Math.sin(t * 0.5) * 0.15;
      mainObject.rotation.x = t * 0.025 + scrollProgress * Math.PI * 0.3;

      const s = baseScale * (1 - scrollProgress * 0.18);
      mainObject.scale.setScalar(THREE.MathUtils.lerp(mainObject.scale.x, s, 0.05));

      if (mainObject._mat) {
        mainObject._mat.uniforms.uTime.value   = t;
        mainObject._mat.uniforms.uScroll.value = scrollProgress;
        mainObject._mat.uniforms.uMouse.value.set(mouseX, -mouseY);
      }
    }

    // Camera: base idle movement + mouse parallax (Plan 1)
    const targetCX = mouseX * 0.35 + Math.sin(t * 0.035) * 0.08;
    const targetCY = -mouseY * 0.25 + Math.cos(t * 0.05) * 0.06;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCX, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCY, 0.04);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();
}
