(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  /* ---------- mobile menu ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  $$('.langs a').forEach((a) => a.addEventListener('click', () => store.set('lang', a.dataset.lang)));

  /* ---------- text scramble (section kickers) ---------- */
  const GLYPHS = '01<>/\\+*#%&';
  const scramble = (el) => {
    const text = el.dataset.t;
    if (reduce) return;
    let frame = 0;
    const total = 22;
    const tick = () => {
      const k = Math.floor((frame / total) * text.length);
      el.textContent = text.slice(0, k) + [...text.slice(k)].map((c) => (c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (++frame <= total) requestAnimationFrame(tick); else el.textContent = text;
    };
    tick();
  };

  /* ---------- scroll reveal ---------- */
  const items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        const s = $('.scr', en.target);
        if (s) scramble(s);
        io.unobserve(en.target);
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    );
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add('in'));

  /* ---------- scroll-linked: progress, timeline, parallax, active nav, GL fade ---------- */
  const bar = $('#progress');
  const fill = $('#tl-fill');
  const tline = $('#timeline');
  const photo = $('#photo');
  const links = $$('.nav a');
  const secs = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    root.style.setProperty('--gl', String(Math.max(0.16, 1 - y / (vh * 0.95))));
    if (tline && fill) {
      const r = tline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.65 - r.top) / r.height));
      fill.style.height = `${p * 100}%`;
    }
    if (photo && !reduce) {
      const r = photo.getBoundingClientRect();
      root.style.setProperty('--py', String(((r.top + r.height / 2 - vh / 2) / vh) * -46));
    }
    let cur = null;
    secs.forEach((s) => { if (s.getBoundingClientRect().top < vh * 0.4) cur = s.id; });
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${cur}`));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- pointer: tilt, spotlight, magnetic, cursor ---------- */
  const stage = $('#stage');
  const hero = $('.hero');
  const cur = $('.cursor');
  const dot = $('#cur');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, sx: innerWidth / 2, sy: innerHeight / 2 };
  if (fine && !reduce) {
    addEventListener('pointermove', (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      cur.classList.add('on');
      const el = e.target.closest?.('.spot');
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    document.addEventListener('pointerover', (e) => cur.classList.toggle('big', !!e.target.closest('a, button')));

    $$('.magnet, .magnet-lite').forEach((m) => {
      const k = m.classList.contains('magnet') ? 0.35 : 0;
      if (!k) return;
      m.addEventListener('pointermove', (e) => {
        const r = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * k}px, ${(e.clientY - r.top - r.height / 2) * k}px)`;
      });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });
  } else {
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      hero.style.setProperty('--tx', String(Math.max(-1, Math.min(1, e.gamma / 25))));
      hero.style.setProperty('--ty', String(Math.max(-1, Math.min(1, (e.beta - 45) / 25))));
    }, { passive: true });
  }

  /* ---------- colour theme ---------- */
  let applyCols = () => {};
  const metaTheme = $('meta[name="theme-color"]');
  const pal = $('#pal');
  const palBtn = $('#pal-btn');
  const palBtns = $$('.pal-menu button');
  const markPal = () => {
    palBtns.forEach((b) => {
      const on = b.dataset.pal === root.dataset.pal;
      b.setAttribute('aria-pressed', String(on));
      if (on) { palBtn.style.setProperty('--c1', b.style.getPropertyValue('--c1')); palBtn.style.setProperty('--c2', b.style.getPropertyValue('--c2')); }
    });
  };
  markPal();
  const setPalMenu = (open) => { pal.classList.toggle('open', open); palBtn.setAttribute('aria-expanded', String(open)); };
  palBtn.addEventListener('click', (e) => { e.stopPropagation(); setPalMenu(!pal.classList.contains('open')); });
  document.addEventListener('click', (e) => { if (!pal.contains(e.target)) setPalMenu(false); });
  addEventListener('keydown', (e) => e.key === 'Escape' && setPalMenu(false));
  palBtns.forEach((b) => b.addEventListener('click', () => {
    root.dataset.pal = b.dataset.pal;
    store.set('pal', b.dataset.pal);
    markPal();
    applyCols();
    if (metaTheme) metaTheme.content = getComputedStyle(root).getPropertyValue('--bg').trim();
    setPalMenu(false);
  }));

  /* ---------- WebGL background: khatam energy lattice over emerald aurora ---------- */
  const canvas = $('#gl');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 M;uniform vec3 uBg;uniform vec3 uAur;uniform vec3 uA;uniform vec3 uB;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float box(vec2 p,float b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec2(3.1,1.7);a*=.5;}return v;}
float lattice(vec2 g){
  vec2 c=fract(g)-.5;
  float s1=abs(box(c,.30));
  float s2=abs(box(rot(.78539816)*c,.30));
  float ring=abs(length(c)-.13);
  vec2 c2=fract(g+.5)-.5;
  float s3=abs(box(rot(.78539816)*c2,.12));
  return min(min(s1,s2),min(ring,s3));
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  vec2 mo=(M-.5*R)/R.y;
  vec2 ctr=vec2(0.,-.02);
  float dist=length(uv-ctr);
  float n=fbm(uv*1.4+vec2(T*.03,-T*.02));
  float n2=fbm(uv*2.2-vec2(T*.02,T*.04)+n*1.5);
  vec3 emerald=uAur,mint=uA,gold=uB;
  vec3 col=uBg;
  col+=emerald*smoothstep(.25,.95,n2)*(1.1-dist*.6);
  vec2 p=uv*3.6+mo*.05;p*=rot(T*.008);
  float l=lattice(p+vec2(T*.01,0.));
  float line=smoothstep(.011,.0,l)+.005/(l+.005)*.22;
  float wave=.5+.5*sin(dist*7.-T*.9);
  float fade=smoothstep(1.45,.05,dist);
  float near=exp(-length(uv-mo)*3.0);
  vec3 lc=mix(gold,mint,clamp(wave*.8+near*.5,0.,1.));
  col+=lc*line*(.035+.38*wave*wave*fade+.55*near);
  col*=1.-.6*smoothstep(.5,1.5,length(uv));
  col+=(hash(gl_FragCoord.xy+T)-.5)*.02;
  gl_FragColor=vec4(col,1.);
}`;
  let glOk = false;
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS);
    const fs = sh(gl.FRAGMENT_SHADER, FS);
    if (vs && fs) {
      const prog = gl.createProgram();
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const uR = gl.getUniformLocation(prog, 'R');
        const uT = gl.getUniformLocation(prog, 'T');
        const uM = gl.getUniformLocation(prog, 'M');
        const uBg = gl.getUniformLocation(prog, 'uBg');
        const uAur = gl.getUniformLocation(prog, 'uAur');
        const uA = gl.getUniformLocation(prog, 'uA');
        const uB = gl.getUniformLocation(prog, 'uB');
        applyCols = () => {
          const cs = getComputedStyle(root);
          const v = (n) => cs.getPropertyValue(n).split(',').map(Number);
          gl.uniform3fv(uBg, v('--gl-bg'));
          gl.uniform3fv(uAur, v('--gl-aur'));
          gl.uniform3fv(uA, v('--gl-a'));
          gl.uniform3fv(uB, v('--gl-b'));
        };
        applyCols();
        let w = 0, h = 0;
        const resize = () => {
          const s = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 700 ? 0.6 : 0.75);
          w = canvas.width = Math.max(2, Math.floor(innerWidth * s));
          h = canvas.height = Math.max(2, Math.floor(innerHeight * s));
          gl.viewport(0, 0, w, h);
        };
        resize();
        addEventListener('resize', resize);
        const t0 = performance.now();
        const draw = (now) => {
          mouse.sx += (mouse.x - mouse.sx) * 0.06;
          mouse.sy += (mouse.y - mouse.sy) * 0.06;
          gl.uniform2f(uR, w, h);
          gl.uniform1f(uT, reduce ? 3 : (now - t0) / 1000);
          gl.uniform2f(uM, (mouse.sx / innerWidth) * w, (1 - mouse.sy / innerHeight) * h);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        glOk = true;
        const loop = (now) => {
          if (scrollY < innerHeight * 1.05 && !document.hidden) {
            draw(now);
            // parallax variables for the hero stage
            if (fine) {
              const tx = (mouse.sx / innerWidth - 0.5) * 2;
              const ty = (mouse.sy / innerHeight - 0.5) * 2;
              hero.style.setProperty('--tx', tx.toFixed(3));
              hero.style.setProperty('--ty', ty.toFixed(3));
            }
          }
          if (!reduce) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
        if (reduce) draw(0);
      }
    }
  }
  if (!glOk) root.classList.add('no-gl');
})();
