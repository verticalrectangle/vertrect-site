/* ============================================================================
 * CYBER CRUCIFIX — psychedelic 3D scene
 * Three.js r147 (vendored, no modules) + custom post-processing shader pass.
 * Effects: chromatic aberration / RGB splits, chroma melt, chroma frame,
 * random strobe, glitch slice jumps, scanlines, grain, colored vignette.
 * ==========================================================================*/

'use strict';

(function () {
  // ---- error capture (surfaced in #err overlay) ----------------------------
  var errors = [];
  window.addEventListener('error', function (e) { errors.push(e.message); showErr(); });
  window.addEventListener('unhandledrejection', function (e) { errors.push(String(e.reason)); showErr(); });
  function showErr() {
    var el = document.getElementById('err');
    if (el && errors.length) { el.hidden = false; el.textContent = 'runtime error:\n' + errors.join('\n'); }
  }

  // ---- renderer -------------------------------------------------------------
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    errors.push('WebGL unavailable: ' + e.message); showErr(); return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('app').appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(11.5, 5.2, 14.5);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 3.4, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.65;
  controls.minDistance = 4;
  controls.maxDistance = 42;
  controls.maxPolarAngle = 1.54;

  // ---- tiny helpers ---------------------------------------------------------
  function hash2(seed) { // deterministic 0..1
    var t = (seed + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function canvasTex(w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return { canvas: c, ctx: c.getContext('2d'), tex: t };
  }

  // ---- circuit texture generator --------------------------------------------
  // Dark metal face covered in neon circuit traces with a bright core line.
  function circuitTexture(w, h, coreColor, traceColor, horizontal) {
    var ct = canvasTex(w, h);
    var x = ct.ctx;
    // base
    x.fillStyle = '#0b0b18';
    x.fillRect(0, 0, w, h);
    x.lineCap = 'round';
    // core neon line (lengthwise)
    x.save();
    x.shadowColor = coreColor; x.shadowBlur = 14;
    x.strokeStyle = coreColor; x.lineWidth = 5;
    x.beginPath();
    if (horizontal) { x.moveTo(0, h / 2); x.lineTo(w, h / 2); }
    else { x.moveTo(w / 2, 0); x.lineTo(w / 2, h); }
    x.stroke();
    x.restore();
    // circuit traces — orthogonal polylines branching off the core
    var n = 26;
    for (var i = 0; i < n; i++) {
      var cy = Math.random() < 0.5;
      var on = Math.random();
      x.strokeStyle = on < 0.25 ? traceColor : coreColor;
      x.globalAlpha = 0.35 + Math.random() * 0.5;
      x.lineWidth = 1.5 + Math.random() * 2;
      x.shadowColor = x.strokeStyle; x.shadowBlur = 6;
      var px, py;
      if (horizontal) { px = Math.random() * w; py = h / 2 + (Math.random() - 0.5) * h * 0.7; }
      else { px = w / 2 + (Math.random() - 0.5) * w * 0.7; py = Math.random() * h; }
      x.beginPath(); x.moveTo(px, py);
      for (var s = 0; s < 4; s++) {
        if (horizontal) px += (Math.random() - 0.5) * w * 0.4;
        else py += (Math.random() - 0.5) * h * 0.4;
        if (horizontal) py = h / 2 + (Math.random() - 0.5) * h * 0.8;
        else px = w / 2 + (Math.random() - 0.5) * w * 0.8;
        x.lineTo(px, py);
      }
      x.stroke();
      // pads / chips
      x.globalAlpha = 0.9;
      x.fillStyle = x.strokeStyle;
      x.shadowBlur = 4;
      x.fillRect(px - 2, py - 2, 4, 4);
      if (i % 4 === 0) {
        x.fillStyle = 'rgba(255,255,255,0.35)';
        x.fillRect(Math.random() * w, Math.random() * h, 3, 6);
      }
    }
    x.globalAlpha = 1; x.shadowBlur = 0;
    return ct.tex;
  }

  // ---- INRI plaque -----------------------------------------------------------
  function plaqueTexture() {
    var ct = canvasTex(512, 132);
    var x = ct.ctx;
    x.fillStyle = 'rgba(2,2,10,0.9)';
    x.fillRect(0, 0, 512, 132);
    x.strokeStyle = '#ff33cc'; x.lineWidth = 4;
    x.shadowColor = '#ff33cc'; x.shadowBlur = 12;
    x.strokeRect(7, 7, 498, 118);
    x.shadowColor = '#ff66ee'; x.shadowBlur = 16;
    x.fillStyle = '#ff8ae0';
    x.font = '900 62px "Courier New", monospace';
    x.textAlign = 'center';
    x.fillText('INRI', 256, 76);
    x.shadowColor = '#00ffff'; x.shadowBlur = 8;
    x.fillStyle = '#9ffcff'; x.font = '20px "Courier New", monospace';
    x.fillText('01101001 01101110 01110010 01101001', 256, 112);
    return ct.tex;
  }

  // ============================================================================
  // SKY — gradient, nebula, stars, chromatic-fringed sun + moon, ringed glow
  // ============================================================================
  var skyUniforms = { uTime: { value: 0 } };
  var sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: [
        'varying vec3 vDir;',
        'void main(){ vDir = normalize(position);',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'varying vec3 vDir;',
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }',
        'float vnoise(vec2 p){',
        '  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
        '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }',
        'void main(){',
        '  vec3 d = normalize(vDir);',
        '  float h = d.y;',
        '  vec3 deep = vec3(0.015,0.005,0.055);',
        '  vec3 mid  = vec3(0.17,0.015,0.32);',
        '  vec3 hor  = vec3(0.02,0.16,0.20);',
        '  vec3 col = mix(hor, mid, smoothstep(-0.10, 0.28, h));',
        '  col = mix(col, deep, smoothstep(0.18, 0.75, h));',
        // nebula
        '  float neb = vnoise(d.xz*2.2 + vec2(uTime*0.02,0.0)) * vnoise(d.xy*2.4 - vec2(0.0,uTime*0.015));',
        '  col += vec3(0.10,0.02,0.24) * neb * smoothstep(0.0,0.45,h);',
        '  col += vec3(0.0,0.10,0.16) * vnoise(d.yz*3.0 + vec2(uTime*0.03,0.0)) * smoothstep(0.0,0.2,h);',
        // stars
        '  vec2 sp = vec2(atan(d.z,d.x), asin(clamp(d.y,-1.0,1.0)));',
        '  vec2 cell = floor(sp*vec2(120.0,80.0));',
        '  float sh = hash(cell);',
        '  float star = step(0.986, sh) * smoothstep(0.03,0.42,h);',
        '  star *= 0.5 + 0.5*sin(uTime*6.0 + sh*47.0);',
        '  col += star * vec3(0.65,0.85,1.0) * (0.4 + sh*1.3);',
        // sun: RGB-fringed disc + chromatic rings
        '  vec3 sunDir = normalize(vec3(-0.52,0.12,-0.85));',
        '  float a = acos(clamp(dot(d,sunDir),-1.0,1.0));',
        '  float dR = smoothstep(0.24,0.21,a);',
        '  float dG = smoothstep(0.235,0.205,a);',
        '  float dB = smoothstep(0.23,0.20,a);',
        '  col += vec3(dR,dG,dB) * vec3(1.0,0.92,0.62) * 0.5;',
        '  float ringMask = smoothstep(0.24,0.28,a) * (1.0 - smoothstep(0.46,0.42,a));',
        '  float ring = sin(a*95.0 - uTime*1.6);',
        '  col += ringMask * (0.5+0.5*ring) * vec3(0.0,1.0,0.55) * 0.18;',
        '  col += ringMask * (0.5-0.5*ring) * vec3(1.0,0.2,1.0) * 0.12;',
        // moon (cyan, small, opposite-ish)
        '  vec3 moonDir = normalize(vec3(0.6,0.3,0.55));',
        '  float ma = acos(clamp(dot(d,moonDir),-1.0,1.0));',
        '  float md = smoothstep(0.12,0.09,ma);',
        '  col += md * vec3(0.5,0.95,1.0) * 0.5;',
        '  col += smoothstep(0.20,0.16,ma) * vec3(0.0,0.4,0.5) * 0.25;',
        '  gl_FragColor = vec4(col,1.0);',
        '}'
      ].join('\n')
    })
  );
  scene.add(sky);

  // far megastructure — giant wireframe torus knot
  var mega = new THREE.Mesh(
    new THREE.TorusKnotGeometry(10, 2.4, 120, 14),
    new THREE.MeshBasicMaterial({ color: 0x55ffdd, wireframe: true, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  mega.position.set(-50, 52, -230);
  scene.add(mega);

  // ============================================================================
  // GROUND — dark grid with RGB-split lines, pulsing rings, light pool
  // ============================================================================
  var groundUniforms = { uTime: { value: 0 } };
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(640, 640, 1, 1),
    new THREE.ShaderMaterial({
      uniforms: groundUniforms,
      vertexShader: [
        'varying vec3 vW;',
        'void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz;',
        'gl_Position = projectionMatrix * viewMatrix * wp; }'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'varying vec3 vW;',
        'void main(){',
        '  vec2 p = vW.xz;',
        '  float dist = length(p);',
        '  vec3 col = vec3(0.004,0.008,0.02);',
        // grid lines with chromatic split (red shifted +, blue shifted -)
        '  float gx = min(fract(p.x/3.0), 1.0-fract(p.x/3.0));',
        '  float gz = min(fract(p.y/3.0), 1.0-fract(p.y/3.0));',
        '  float gxR = min(fract((p.x+0.28)/3.0), 1.0-fract((p.x+0.28)/3.0));',
        '  float gxB = min(fract((p.x-0.28)/3.0), 1.0-fract((p.x-0.28)/3.0));',
        '  float lx = smoothstep(0.035,0.0,gx), lz = smoothstep(0.035,0.0,gz);',
        '  float lxR = smoothstep(0.035,0.0,gxR), lxB = smoothstep(0.035,0.0,gxB);',
        '  vec3 grid = vec3(lxR*0.55, lx*0.9, lxB*0.75) * (lx + lz);',
        '  col += grid * vec3(0.0,0.55,0.6) * 0.85;',
        // traveling pulse along grid lines
        '  float wave = 0.5 + 0.5*sin(dist*0.9 - uTime*7.0);',
        '  col += grid * vec3(0.7,0.1,1.0) * wave * 0.5;',
        // concentric rings around the cross base
        '  float rr = min(fract(dist/7.0), 1.0-fract(dist/7.0));',
        '  float rline = smoothstep(0.05,0.0,rr);',
        '  vec3 ringCol = mix(vec3(1.0,0.0,0.8), vec3(0.0,0.95,1.0), 0.5+0.5*sin(dist*0.35));',
        '  col += rline * ringCol * (0.35 + 0.35*sin(uTime*3.0)) * 0.4;',
        // expanding ripples
        '  float rip = 0.5 + 0.5*sin(dist*3.2 - uTime*9.0);',
        '  col += rip * smoothstep(95.0, 4.0, dist) * vec3(0.08,0.3,0.55) * 0.16;',
        // light pool under cross
        '  float pool = exp(-dist*dist*0.02);',
        '  col += pool * vec3(0.65,0.18,0.95) * (0.35 + 0.35*sin(uTime*5.0)) * 0.4;',
        // dark anchor shadow grounds the cross on the field
        '  float anchor = exp(-dist*dist*0.6);',
        '  col = mix(col, vec3(0.006,0.006,0.016), anchor * 0.95);',
        // horizon fade to sky color
        '  col = mix(col, vec3(0.02,0.16,0.20), 1.0 - exp(-dist*0.016));',
        '  gl_FragColor = vec4(col,1.0);',
        '}'
      ].join('\n')
    })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ============================================================================
  // GRASS FIELD — 24k instanced blades, swaying, hue-cycling tips
  // ============================================================================
  function bladeGeometry() {
    var segs = 4, pos = [], idx = [], ah = [];
    for (var i = 0; i <= segs; i++) {
      var y = i / segs;
      var w = 0.038 * (1.0 - y * 0.82);
      pos.push(-w, y, 0, w, y, 0);
      ah.push(y, y);
    }
    for (var k = 0; k < segs; k++) {
      var a = k * 2, b = k * 2 + 1, c = k * 2 + 2, d = k * 2 + 3;
      idx.push(a, c, b, b, c, d);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aHeight', new THREE.Float32BufferAttribute(ah, 1));
    g.setIndex(idx);
    return g;
  }

  var GRASS = 16000;
  var grassGeo = bladeGeometry();
  var aColor = new Float32Array(GRASS * 3);
  var aRand = new Float32Array(GRASS);
  var grassMatrices = [];
  var col = new THREE.Color();
  for (var gi = 0; gi < GRASS; gi++) {
    var r = Math.sqrt(Math.random()) * 58;
    var ang = Math.random() * Math.PI * 2;
    var px = Math.cos(ang) * r, pz = Math.sin(ang) * r;
    var base = r < 2.6 ? 0 : 1; // clear patch at cross base
    col.setHSL(0.30 + Math.random() * 0.12, 0.55, 0.10 + Math.random() * 0.12);
    aColor[gi * 3] = col.r; aColor[gi * 3 + 1] = col.g; aColor[gi * 3 + 2] = col.b;
    aRand[gi] = Math.random();
    var m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(px, 0, pz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3)),
      new THREE.Vector3(base * (0.7 + Math.random() * 0.8), base * (1.4 + Math.random() * 2.6), 1)
    );
    grassMatrices.push(m);
  }
  grassGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(aColor, 3));
  grassGeo.setAttribute('aRand', new THREE.InstancedBufferAttribute(aRand, 1));

  var grassUniforms = {
    uTime: { value: 0 },
    uFogColor: { value: new THREE.Color(0x022934) }
  };
  var grass = new THREE.InstancedMesh(grassGeo,
    new THREE.ShaderMaterial({
      uniforms: grassUniforms,
      vertexShader: [
        'uniform float uTime;',
        'attribute float aHeight;',
        'attribute vec3 aColor;',
        'attribute float aRand;',
        'varying vec3 vColor;',
        'varying float vH;',
        'varying float vDist;',
        'void main(){',
        '  vH = aHeight;',
        '  vColor = aColor;',
        '  vec3 tp = position;',
        '  float sway = sin(uTime*(1.1+aRand*0.9) + position.x*1.7 + position.z*2.3);',
        '  tp.x += sway * aHeight*aHeight * 0.55;',
        '  tp.z += sin(uTime*(0.9+aRand*0.6) + position.x*2.1) * aHeight * 0.22;',
        '  vec4 mv = modelViewMatrix * instanceMatrix * vec4(tp,1.0);',
        '  vDist = length(mv.xyz);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec3 uFogColor;',
        'varying vec3 vColor;',
        'varying float vH;',
        'varying float vDist;',
        'void main(){',
        '  vec3 col = vColor;',
        '  vec3 tip = mix(vec3(1.0,0.15,0.9), vec3(0.1,0.95,1.0), 0.5+0.5*sin(uTime*2.2 + vColor.r*40.0));',
        '  col = mix(col, tip, vH*0.8);',
        '  col *= 0.55 + 0.45*sin(vH*7.0 + uTime*4.5);',
        '  col += tip * vH * vH * 0.35;',
        '  col = mix(col, uFogColor, clamp(vDist*0.006, 0.0, 0.92));',
        '  gl_FragColor = vec4(col,1.0);',
        '}'
      ].join('\n')
    }),
    GRASS
  );
  grass.frustumCulled = false;
  grassMatrices.forEach(function (m, i) { grass.setMatrixAt(i, m); });
  grass.instanceMatrix.needsUpdate = true;
  scene.add(grass);

  // ============================================================================
  // CYBER CRUCIFIX
  // ============================================================================
  var crossGroup = new THREE.Group();
  scene.add(crossGroup);

  var vertCircuit = circuitTexture(256, 512, '#00eaff', '#ffffff', false);
  var horzCircuit = circuitTexture(512, 256, '#ff33cc', '#ffffff', true);

  var beamUniforms = {
    uTime: { value: 0 },
    uPulse: { value: 0 },
    uCamPos: { value: camera.position },
    uCircuit: { value: null },
    uGlow: { value: new THREE.Color(0x00eaff) },
    uAxis: { value: 0 } // 0 = pulse along vUv.y, 1 = along vUv.x
  };
  var beamShader = {
    uniforms: beamUniforms,
    vertexShader: [
      'varying vec2 vUv; varying vec3 vN; varying vec3 vW;',
      'void main(){',
      '  vUv = uv;',
      '  vN = normalize(normalMatrix * normal);',
      '  vec4 wp = modelMatrix * vec4(position,1.0);',
      '  vW = wp.xyz;',
      '  gl_Position = projectionMatrix * viewMatrix * wp;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D uCircuit;',
      'uniform float uTime;',
      'uniform float uPulse;',
      'uniform vec3 uCamPos;',
      'uniform vec3 uGlow;',
      'uniform float uAxis;',
      'varying vec2 vUv; varying vec3 vN; varying vec3 vW;',
      'void main(){',
      '  vec3 col = texture2D(uCircuit, vUv).rgb;',
      '  float a = mix(vUv.y, vUv.x, uAxis);',
      // traveling pulse band
      '  float dP = abs(a - uPulse);',
      '  float band = exp(-dP*dP*900.0);',
      '  col += uGlow * band * 1.35;',
      '  col += uGlow * exp(-dP*dP*140.0) * 0.6;',
      // secondary counter-pulse
      '  float dP2 = abs(a - fract(uPulse+0.62));',
      '  col += uGlow * exp(-dP2*dP2*400.0) * 0.5;',
      // rim light
      '  vec3 V = normalize(uCamPos - vW);',
      '  float rim = pow(1.0 - abs(dot(normalize(vN), V)), 2.5);',
      '  col += uGlow * rim * 1.0;',
      // micro flicker
      '  col *= 0.9 + 0.1*sin(uTime*23.0 + vW.y*9.0);',
      '  gl_FragColor = vec4(col,1.0);',
      '}'
    ].join('\n')
  };

  function makeBeam(w, h, d, glow, axis, pulse0) {
    var u = {
      uTime: beamUniforms.uTime, uPulse: { value: pulse0 }, uCamPos: beamUniforms.uCamPos,
      uCircuit: { value: axis ? horzCircuit : vertCircuit },
      uGlow: { value: new THREE.Color(glow) }, uAxis: { value: axis }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: beamShader.vertexShader,
      fragmentShader: beamShader.fragmentShader
    });
    return { mesh: new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), uniforms: u };
  }

  var vBeam = makeBeam(1.12, 6.6, 1.12, '#66ffff', 0, 0.35);
  vBeam.mesh.position.y = 3.3;
  crossGroup.add(vBeam.mesh);

  var hBeam = makeBeam(5.7, 0.95, 0.95, '#ff33cc', 1, 0.55);
  hBeam.mesh.position.y = 5.1;
  crossGroup.add(hBeam.mesh);

  // neon edge lines
  function edgeLines(geo, color) {
    var ls = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    return ls;
  }
  var vEdges = edgeLines(new THREE.BoxGeometry(1.14, 6.62, 1.14), 0x66ffff);
  vEdges.position.y = 3.3;
  crossGroup.add(vEdges);
  var hEdges = edgeLines(new THREE.BoxGeometry(5.72, 0.97, 0.97), 0xff33cc);
  hEdges.position.y = 5.1;
  crossGroup.add(hEdges);

  // hologram wireframe overlay (spins independently)
  var holoGroup = new THREE.Group();
  crossGroup.add(holoGroup);
  var holoMat = new THREE.MeshBasicMaterial({ color: 0xcc66ff, wireframe: true, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
  var holoV = new THREE.Mesh(new THREE.BoxGeometry(1.3, 6.8, 1.3), holoMat);
  holoV.position.y = 3.3;
  var holoH = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.05, 1.05), holoMat);
  holoH.position.y = 5.1;
  holoGroup.add(holoV, holoH);

  // nails — hot spots at hands & feet
  var nailMat = new THREE.MeshBasicMaterial({ color: 0xff3355 });
  function nail(x, y, z) {
    var n = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), nailMat);
    n.position.set(x, y, z);
    crossGroup.add(n);
  }
  nail(2.75, 5.1, 0); nail(-2.75, 5.1, 0); nail(0, 0.12, 0);

  // INRI plaque
  var plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 0.72),
    new THREE.MeshBasicMaterial({ map: plaqueTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  plaque.position.set(0, 6.45, 0.55);
  plaque.rotation.x = 0.14;
  crossGroup.add(plaque);

  // halo — wireframe torus + orbiting satellites
  var halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.045, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.position.set(0, 7.35, 0);
  halo.rotation.x = Math.PI / 2.2;
  crossGroup.add(halo);

  var sats = [];
  for (var si = 0; si < 4; si++) {
    var sat = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: si % 2 ? 0xff33cc : 0x33ffdd, wireframe: true, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false })
    );
    crossGroup.add(sat);
    sats.push(sat);
  }

  // floating glow orbs
  var orbs = [];
  for (var oi = 0; oi < 7; oi++) {
    var orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({ color: oi % 2 ? 0x00ffcc : 0xff33ff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false })
    );
    orb.userData = { rad: 3.5 + Math.random() * 3.5, ph: Math.random() * Math.PI * 2, spd: 0.3 + Math.random() * 0.5, y: 1.5 + Math.random() * 5, tilt: Math.random() * Math.PI * 2 };
    crossGroup.add(orb);
    orbs.push(orb);
  }

  // dust particles around the cross
  var dustGeo = new THREE.BufferGeometry();
  var dp = new Float32Array(2600 * 3);
  for (var di = 0; di < 2600; di++) {
    var dr = 12 + Math.random() * 30;
    var da = Math.random() * Math.PI * 2;
    var dy = Math.random() * 14 - 2;
    dp[di * 3] = Math.cos(da) * dr;
    dp[di * 3 + 1] = dy;
    dp[di * 3 + 2] = Math.sin(da) * dr;
  }
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0x88ccff, size: 0.09, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  dust.position.y = 3;
  scene.add(dust);

  // shockwave rings on the ground
  var rings = [];
  for (var ri = 0; ri < 4; ri++) {
    var ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.94, 1.0, 72),
      new THREE.MeshBasicMaterial({ color: 0x00ffee, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.06;
    scene.add(ringMesh);
    rings.push({ mesh: ringMesh, t: 1.0, delay: ri * 0.6, dur: 2.0 });
  }

  // ============================================================================
  // POST-PROCESSING — bloom + psychedelic shader pass
  // ============================================================================
  var composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));

  var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.5, 0.9);
  composer.addPass(bloom);

  var psyUniforms = {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uFlash: { value: 0 },
    uGlitch: { value: 0 },
    uHue: { value: 0 }
  };
  // NOTE: ShaderPass CLONES these uniforms — animate() must write to
  // psyPass.uniforms (the live copies), not psyUniforms.
  var psyPass = new THREE.ShaderPass({
    uniforms: psyUniforms,
    vertexShader: [
      'varying vec2 vUv;',
      'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform float uTime;',
      'uniform vec2 uResolution;',
      'uniform float uFlash;',
      'uniform float uGlitch;',
      'uniform float uHue;',
      'varying vec2 vUv;',

      'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }',
      'float vnoise(vec2 p){',
      '  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
      '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }',
      'float fbm(vec2 p){ return 0.5*vnoise(p) + 0.25*vnoise(p*2.03) + 0.125*vnoise(p*4.09); }',
      'vec3 hueShift(vec3 c, float s){',
      '  vec3 k = vec3(0.57735);',
      '  float coss = cos(s), sins = sin(s);',
      '  return c*coss + cross(k,c)*sins + k*dot(k,c)*(1.0-coss); }',
      // per-channel split sample
      'vec3 splitSample(vec2 uv, vec2 dir, float amt){',
      '  vec3 c;',
      '  c.r = texture2D(tDiffuse, uv + dir*amt).r;',
      '  c.g = texture2D(tDiffuse, uv).g;',
      '  c.b = texture2D(tDiffuse, uv - dir*amt).b;',
      '  return c; }',

      'void main(){',
      '  vec2 uv = vUv;',
      '  vec2 asp = vec2(uResolution.x/uResolution.y, 1.0);',
      '  float t = uTime;',

      // --- radial chromatic aberration, aspect-corrected, wobbling ---
      '  vec2 cc = (uv - 0.5) * asp;',
      '  float distC = length(cc);',
      '  vec2 dir = distC > 0.0001 ? cc/distC : vec2(0.0);',
      '  float wob = sin(t*1.3)*0.6 + sin(t*0.7+1.7)*0.4;',
      '  float aberr = 0.003 + 0.004*distC + 0.0025*abs(wob);',
      '  aberr += uGlitch*uGlitch*0.05;',

      // --- chroma melt: banded, drips downward with per-channel spread ---
      '  float melt = fbm(vec2(uv.x*2.2, uv.y*3.0 - t*0.5));',
      '  melt = smoothstep(0.50, 0.92, melt);',
      '  melt *= 0.55 + 0.45*uGlitch;',
      '  melt *= 0.6 + 0.85*smoothstep(0.25, 1.0, uv.y);',
      // keep the center clear so the crucifix silhouette stays readable
      '  melt *= 0.3 + 0.7*smoothstep(0.05, 0.22, distC);',
      '  float rowId = floor(uv.y*40.0);',
      '  float drip = hash(vec2(rowId, floor(t*3.0)));',
      '  float meltAmt = melt * (0.02 + 0.15*drip);',

      '  vec3 col = splitSample(uv, dir, aberr);',
      '  if (melt > 0.02) {',
      '    vec3 m = vec3(0.0);',
      '    for (int i = 0; i < 4; i++) {',
      '      float f = float(i) * meltAmt * 0.35;',
      '      m.r += texture2D(tDiffuse, uv + vec2(0.0, f*1.15) + dir*aberr).r;',
      '      m.g += texture2D(tDiffuse, uv + vec2(0.0, f*0.90)).g;',
      '      m.b += texture2D(tDiffuse, uv + vec2(0.0, f*0.75) - dir*aberr).b;',
      '    }',
      '    m /= 4.0;',
      '    col = mix(col, m, clamp(melt*1.5, 0.0, 1.0));',
      '  }',

      // --- glitch slice jumps (horizontal + vertical bands) ---
      '  float bandH = floor(uv.y * (6.0 + uGlitch*22.0));',
      '  float bh = hash(vec2(bandH, floor(t*4.0)));',
      '  if (step(0.90, bh) > 0.5) {',
      '    float sh = (bh - 0.90) * 0.12;',
      '    col.r = texture2D(tDiffuse, uv + vec2( sh, 0.0)).r;',
      '    col.b = texture2D(tDiffuse, uv + vec2(-sh, 0.0)).b;',
      '  }',
      '  float bandV = floor(uv.x * (10.0 + uGlitch*12.0));',
      '  float bv = hash(vec2(bandV, floor(t*3.0)));',
      '  if (step(0.93, bv) > 0.5) {',
      '    float sv = (bv - 0.93) * 0.06;',
      '    col.r = texture2D(tDiffuse, uv + vec2(0.0,  sv)).r;',
      '    col.b = texture2D(tDiffuse, uv + vec2(0.0, -sv)).b;',
      '  }',

      // --- chroma frame: bordered RGB-split band + fringe lines ---
      '  float d = length((uv - 0.5) * asp) * 1.1;',
      '  float f0 = 0.44, f1 = 0.62;',
      '  float inFrame = smoothstep(f0, f0+0.006, d) * (1.0 - smoothstep(f1-0.006, f1, d));',
      '  if (inFrame > 0.01) {',
      '    vec3 fc = splitSample(uv, dir, aberr*3.0 + 0.022);',
      '    fc = hueShift(fc, t*0.9);',
      '    fc = mix(fc, splitSample(uv, dir, 0.055), 0.5);',
      '    col = mix(col, fc, clamp(inFrame, 0.0, 1.0) * 0.7);',
      '  }',
      '  float lIn  = 1.0 - smoothstep(0.0, 0.016, abs(d - f0));',
      '  float lOut = 1.0 - smoothstep(0.0, 0.016, abs(d - f1));',
      '  col += lIn  * vec3(1.0, 0.05, 0.05) * 0.45;',
      '  col += lOut * vec3(0.0, 1.0, 1.0) * 0.6;',,
      // outer edge fringing
      '  float edge = smoothstep(0.80, 0.98, d);',
      '  col = mix(col, splitSample(uv, dir, 0.03 + edge*0.025), edge*0.7);',

      // --- strobe (sharp staccato bursts, not full white-out) ---
      '  float flick = 0.86 + 0.14*sin(t*31.0)*sin(t*47.7);',
      '  col *= flick * (1.0 + uFlash*0.9);',,
      '  if (uFlash > 0.04) {',
      '    vec3 flashCol = hueShift(vec3(1.0,1.0,1.0), uHue*6.2831);',
      '    col += flashCol * uFlash * 0.4;',
      '    col.r *= 1.0 + uGlitch*0.5;',
      '    col.b *= 1.0 + (1.0-uGlitch)*0.5;',
      '  }',

      // --- scanlines + rolling bar ---
      '  float sl = 0.5 + 0.5*sin(uv.y * uResolution.y * 3.14159);',
      '  col *= 0.88 + 0.12*sl;',
      '  float barY = fract(t*0.12);',
      '  float bar = smoothstep(0.0, 0.014, abs(uv.y - barY));',
      '  col += vec3(0.3,0.4,1.0) * (1.0-bar) * 0.06;',

      // --- grain ---
      '  col += (hash(uv*uResolution + fract(t)) - 0.5) * 0.05 * (1.0 + uFlash);',

      // --- colored vignette ---
      '  float vig = smoothstep(1.12, 0.22, d*1.45);',
      '  col *= mix(0.55, 1.0, vig);',
      '  col += vec3(0.42,0.0,0.5) * (1.0-vig) * 0.28;',

      // subtle global channel tint drift
      '  col.r *= 1.0 + 0.03*(0.5+0.5*sin(t*2.0));',
      '  col.b *= 1.0 + 0.03*(0.5+0.5*cos(t*2.0));',

      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  });
  composer.addPass(psyPass);

  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================
  var clock = new THREE.Clock();
  var strobePhase = -1, strobeFlash = 0, glitchRand = 0, hueRand = 0;
  var shake = 0;

  function updateStrobe(t) {
    var rate = 11.0;
    var ph = Math.floor(t * rate);
    if (ph !== strobePhase) {
      strobePhase = ph;
      var r = hash2(ph * 7 + 3);
      glitchRand = r;
      // ~10% of phases fire a rare, sharp flash burst (~1/sec with gaps)
      if (r > 0.90) strobeFlash = 0.3 + 0.4 * hash2(ph * 13 + 5);
      else strobeFlash = 0;
      hueRand = hash2(ph * 29 + 11);
    } else {
      var frac = t * rate - ph;
      strobeFlash *= Math.max(0, 1.0 - frac * 7.0);
    }
  }

  function updateRings(dt, t) {
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      if (r.t >= 1.0) {
        r.delay -= dt;
        r.mesh.visible = false;
        if (r.delay <= 0) { r.t = 0; r.delay = 0.5 + Math.random() * 2.4; }
        continue;
      }
      r.t += dt / r.dur;
      r.mesh.visible = true;
      var k = r.t;
      var sc = 0.8 + k * k * 26;
      r.mesh.scale.set(sc, sc, sc);
      r.mesh.material.opacity = 0.85 * (1.0 - k) * (0.6 + 0.4 * Math.sin(t * 6.0));
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    updateStrobe(t);

    // beam pulses
    vBeam.uniforms.uPulse.value = (t * 0.35) % 1.0;
    hBeam.uniforms.uPulse.value = (t * 0.35 + 0.5) % 1.0;

    // hologram
    holoGroup.rotation.y = t * 0.3;
    holoGroup.rotation.z = Math.sin(t * 0.7) * 0.06;
    holoGroup.scale.setScalar(1 + 0.04 * Math.sin(t * 3.0));
    holoMat.opacity = 0.25 + 0.12 * Math.sin(t * 2.6);

    // halo + satellites
    halo.rotation.z = t * 0.5;
    halo.material.opacity = 0.7 + 0.3 * Math.sin(t * 3.1);
    for (var si = 0; si < sats.length; si++) {
      var an = t * 0.9 + si * Math.PI / 2;
      sats[si].position.set(Math.cos(an) * 1.7, 7.35 + 0.18 * Math.sin(t * 2.0 + si), Math.sin(an) * 1.7);
      sats[si].rotation.x = t * 3 + si;
      sats[si].rotation.y = t * 2;
    }

    // glow orbs
    for (var oi = 0; oi < orbs.length; oi++) {
      var o = orbs[oi], u = o.userData;
      var oa = t * u.spd + u.ph;
      o.position.set(Math.cos(oa) * u.rad, u.y + 0.5 * Math.sin(t * 0.8 + u.ph * 3), Math.sin(oa) * u.rad);
      o.material.opacity = 0.55 + 0.45 * Math.sin(t * 4.0 + u.ph * 7);
    }

    // dust drift
    dust.rotation.y = t * 0.02;

    // plaque bob
    plaque.position.y = 6.3 + 0.05 * Math.sin(t * 1.4);

    // megastructure
    mega.rotation.y = t * 0.02;
    mega.rotation.x = Math.sin(t * 0.05) * 0.1;

    // shaders
    skyUniforms.uTime.value = t;
    groundUniforms.uTime.value = t;
    grassUniforms.uTime.value = t;
    beamUniforms.uTime.value = t;
    beamUniforms.uCamPos.value = camera.position;

    // rings
    updateRings(dt, t);

    // camera shake on glitch events
    shake += ((glitchRand > 0.55 && strobeFlash > 0.05 ? strobeFlash * 0.09 : 0) - shake) * 0.2;
    controls.update();
    if (shake > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake * 0.6;
    }

    // post uniforms — write to the pass's live cloned copies
    bloom.strength = 0.9 + 0.22 * Math.sin(t * 0.9) + strobeFlash * 0.9;
    psyPass.uniforms.uTime.value = t;
    psyPass.uniforms.uFlash.value = strobeFlash;
    psyPass.uniforms.uGlitch.value = glitchRand;
    psyPass.uniforms.uHue.value = hueRand;

    composer.render();
  }

  // ---- resize ----------------------------------------------------------------
  window.addEventListener('resize', function () {
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    psyPass.uniforms.uResolution.value.set(w, h);
  });

  // ---- boot -------------------------------------------------------------------
  window.__dbg = { renderer: renderer, scene: scene, camera: camera, composer: composer, grass: grass };
  animate();
})();
