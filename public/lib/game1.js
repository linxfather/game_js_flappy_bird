import { util, gameBox, gameRect, gamePhysicsRect, gameSprite } from "./miniCanvas.js";

class gameCtx {
  kbSpace = false;
  scene = 0;
  sceneFns = [];
  /** @type {gameBox} */
  box;
  /** @type {gameSprite} */
  bird;
  /** @type {gameSprite[]} */
  pipes = [];
  //
  beginPhysics() {
    this.bird.rectCallFn('beginPhysics');
    for (const sprite of this.pipes) {
      sprite.rectCallFn('beginPhysics');
    }
  }
  get currentScene() {
    return this.sceneFns[this.scene];
  }
}

const gctx = new gameCtx();

function scene0() {
  gctx.bird.rects.at(0).setCenterAtRect(gctx.box.canvasRect);
  if (gctx.kbSpace) {
    gctx.scene = 1;
  }
}
function scene1() {
  //#region bird
  const pConfig_fly = -3000;
  const p0 = gctx.bird.rects.at(0);
  if (gctx.kbSpace) {
    p0.vy = pConfig_fly * gctx.box.getDT();
  }
  p0.moveGravity();
  //#endregion
  scene1Pipes();
}

function scene1Pipes() {
  const pConfig_center = 0.5;
  const pConfig_bottom = 0.1;
  const pConfig_h2 = 0.6;
  const pConfig_time = 5; // 5 sec
  const pConfig_bird = 3; 
  const rightPipes = gctx.pipes.filter(pipe => {
    return pipe.getBoundingRight() > gctx.box.canvasRect.width * pConfig_center;
  });
  if (rightPipes.length === 0) {
    const pipeBottom = new gameSprite();
    const pipeTop = new gameSprite();
    pipeBottom.initWithImages([
       '/img/screens/tube1.png',
       '/img/screens/tube1-1.png'
    ]);
    pipeTop.initWithImages([
      '/img/screens/tube2.png',
      '/img/screens/tube1-1.png'
    ]);
    const h = gctx.box.canvasRect.h;
    const h2 = Math.round(h * pConfig_h2);
    const p0 = pipeBottom.rects.at(0);
    const p1 = pipeBottom.rects.at(1);
    const p10 = pipeTop.rects.at(0);
    const p11 = pipeTop.rects.at(1);
    //
    p0.x = gctx.box.canvasRect.w + 10;
    p0.y = util.randomInt(pConfig_bottom * h, h2);
    p1.setCenterAtRect(p0);
    p1.y = p0.bottom;
    p1.height = h;
    p0.vx = -1 * Math.round(gctx.box.canvasRect.w/pConfig_time);
    p1.vx = p0.vx;
    //
    p10.x = p0.x;
    p10.y = p0.y - (gctx.bird.rects.at(0).h * pConfig_bird) - p10.h;
    p11.setCenterAtRect(p10);
    p11.height = h;
    p11.y = p10.top - p11.height;
    p10.vx = p0.vx;
    p11.vx = p0.vx;
    //
    gctx.pipes.push(pipeBottom);
    gctx.pipes.push(pipeTop);
  }
  const rightLeft = gctx.pipes.filter(pipe => pipe.getBoundingRight() < 0);
  for (const pipe of rightLeft) {
    const idx = gctx.pipes.indexOf(pipe);
    if (idx >= 0) gctx.pipes.splice(idx, 1);
  }
  for (const pipe of gctx.pipes) {
    pipe.rectCallFn('moveXConst');
  }
}

function scene2() {
  
}
/** @param {CanvasRenderingContext2D} ctx */
function mainDraw(ctx) {
  for (const sprite of gctx.pipes) {
    util.fillSprite(ctx, sprite);
  }
  util.fillSprite(ctx, gctx.bird);
}

export async function game(elementId) {
  const canvas = document.getElementById(elementId);
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext('2d');
  gctx.box = new gameBox(canvas);
  //#region events
  const kbKeys = [];
  canvas.addEventListener('click', (ev) => {
    if (kbKeys.at(-1) !== 32) kbKeys.push(32);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.keyCode === 32 && kbKeys.at(-1) !== 32) kbKeys.push(32); // 32 = key space
  });
  //#endregion
  // #region init
  ctx.fillStyle = 'red'; ctx.strokeStyle = 'red'; ctx.lineWidth = 2; ctx.font = '20px Arial';
  const srcs = [
    '/img/screens/flappy.png',
    '/img/screens/tube1.png',
    '/img/screens/tube2.png',
    '/img/screens/tube1-1.png'
  ];
  for (const src of srcs) {
    await util.loadImgAsync(src);
  }
  gctx.sceneFns = [scene0, scene1, scene2];
  gctx.bird = new gameSprite();
  gctx.bird.initWithImages(['/img/screens/flappy.png']);
  //#endregion
  //#region 
  let devStop = 0; setTimeout(() => { devStop = 1; }, 60000 );
  //#endregion
  let t = 0;
  //
  while (true) {
    gctx.kbSpace = kbKeys.pop() === 32;
    gctx.box.tick();
    gctx.beginPhysics();
    //
    gctx.currentScene();
    // 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //
    mainDraw(ctx);
    //
    gctx.box.endTick();
    await util.sleepAsync(util.fps20);
    //
    if (devStop === 1) { console.log('devStop', 1); break; }
    t++;
    if (t % 20 === 0) {
      console.log('gctx.pipes', gctx.pipes.length);
    }
  }
};