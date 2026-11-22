import { 
  util, 
  gameBox, 
  gameRect, 
  gameSprite, 
  gameSpriteAnimatorRightToLeftX,
  domEvents
} from "./miniCanvas2.js";

class gameCtx {
  // const
  const_vx;
  const_gravity = 400; // 300px/s
  const_bird_vy = -(42*4); // 42 = bird.height
  //
  playScore = 0;
  playScoreRect = new gameRect();
  playSpeed = 0;
  //
  /** @type {domEvents} */
  domEvents;
  scene = 0;
  sceneFns = [];
  bird = new gameSprite();
  birdDeath = new gameSprite();
  buttonStart = new gameSprite();
  gameOver = new gameSprite();
  grass = new gameSpriteAnimatorRightToLeftX();
  town = new gameSpriteAnimatorRightToLeftX();
  pipes = new gameSpriteAnimatorRightToLeftX();
  //
  get currentScene() {
    return this.sceneFns[this.scene];
  }
  init() {
    const box = gameBox.getInstance();
    box.gravity = this.const_gravity;
    this.const_vx = -Math.round(box.canvasRect.w / 6);
    this.grass.init();
  }
}

const gctx = new gameCtx();

async function  scenesInit() {
  gctx.init();
  //
  await util.loadImgAll([
    '/img/screens/grass-1.png',
    '/img/screens/bg_town.png',
    '/img/screens/tube1-1.png',
    '/img/screens/tube1.png',
    '/img/screens/tube2.png',
    '/img/screens/flappy.png',
    '/img/screens/flappy2.png',
    '/img/screens/flappy_death.png',
    '/img/screens/play_button.png',
    '/img/screens/game_over.png'
  ]);
  //
  const canvasRect = gameBox.getInstance().canvasRect;
  //#region  bird
  gctx.bird.initWithImagesSingleRect([
    '/img/screens/flappy.png',
    '/img/screens/flappy2.png'
  ], 3);
  gctx.birdDeath.initWithImages([
    '/img/screens/flappy_death.png'
  ]);
  //#endregion
  //#region buttons
  gctx.buttonStart.initWithImages([
    '/img/screens/play_button.png'
  ]);
  gctx.gameOver.initWithImages([
    '/img/screens/game_over.png'
  ]);
  gctx.buttonStart.setZoom(0.7);
  gctx.buttonStart.getRect().setCenterAtRect(canvasRect);
  gctx.buttonStart.getRect().y = Math.round(canvasRect.h * 0.75) - gctx.buttonStart.getRect().h;
  gctx.gameOver.setZoom(0.7);
  gctx.gameOver.getRect().setCenterAtRect(canvasRect);
  gctx.gameOver.getRect().y = Math.round(canvasRect.h * 0.4) - gctx.gameOver.getRect().h;
  gctx.playScoreRect.x = Math.round(canvasRect.w * 0.5) - 20;
  gctx.playScoreRect.y = 40*2;
  //#endregion
  //#region grass
  let grass1 = new gameSprite();
  grass1.initWithImages(['/img/screens/grass-1.png']);
  grass1.rectCallFn('setXY', canvasRect.w, canvasRect.h - grass1.getRect().h);
  grass1.rectCallFn('setVX', gctx.const_vx);
  let grass2 = grass1.clone();
  grass2.rectCallFn('setX', 0);
  gctx.grass.newSprites.push(grass1);
  gctx.grass.sprites.push(grass2);
  //#endregion
  //#region town
  let town1 = new gameSprite();
  town1.initWithImages(['/img/screens/bg_town.png']);
  town1.rectCallFn('setXY', canvasRect.w, canvasRect.h - town1.getRect().h - 40);
  town1.rectCallFn('setVX', gctx.const_vx * 0.5);
  let town2 = town1.clone();
  town2.rectCallFn('setX', 0);
  gctx.town.newSprites.push(town1);
  gctx.town.sprites.push(town2);
  //#endregion
  //#region pipes
  let pipe1 = new gameSprite();
  pipe1.initWithImages([
    '/img/screens/tube1.png', '/img/screens/tube1-1.png',
    '/img/screens/tube2.png', '/img/screens/tube1-1.png'
  ]);
  pipe1.getRect(0).setXY(canvasRect.w, canvasRect.h - pipe1.getRect(0).h - 10);
  pipe1.getRect(1).setCenterAtRect(pipe1.getRect(0));
  pipe1.getRect(1).setY(pipe1.getRect(0).bottom);
  pipe1.getRect(1).setH(canvasRect.h);
  pipe1.getRect(2).setXY(canvasRect.w, 10);
  pipe1.getRect(3).setCenterAtRect(pipe1.getRect(2));
  pipe1.getRect(3).setH(canvasRect.h);
  pipe1.getRect(3).setY(pipe1.getRect(2).top - pipe1.getRect(3).h);
  pipe1.rectCallFn('setVX', gctx.const_vx);
  gctx.pipes.newSprites.push(pipe1);
  gctx.pipes.newX = Math.round(canvasRect.w * 0.5);
  gctx.pipes.onNewSpritesFn = 
  /** @param {gameSprite[]} ns */
  (ns) => {
    const newY = util.randomInt(0, Math.round(ns.at(0).getRect().top * 0.5));
    const rects = ns.at(0).rects;
    rects.at(0).setYAdd(-newY);
    rects.at(1).setYAdd(-newY);
    rects.at(2).setY(rects.at(0).top - rects.at(2).h - 42*4); // 42 = 1 bird
    rects.at(3).setY(rects.at(2).top - rects.at(3).h);
  };
  //#endregion
}

function scene0() {
  const canvasRect = gameBox.getInstance().canvasRect;
  gctx.bird.getRect().setCenterAtRect(canvasRect);
  gctx.bird.getRect().vy = 0;
  gctx.bird.animated = false;
  gctx.playScore = 0;
  if (gctx.domEvents.spacePressed) {
    console.log('click');
    gctx.scene = 1;
  }
}

function sceneSpeed() {
  let speed = Math.min(10, Math.trunc(gctx.playScore / 4));
  const newvx = Math.round(gctx.const_vx + speed*gctx.const_vx*0.25);
  const ar = [
    ...gctx.pipes.sprites, 
    ...gctx.pipes.newSprites,
    ...gctx.grass.sprites,
    ...gctx.grass.newSprites,
  ];
  for (const sprite of ar) {
    sprite.rectCallFn('setVX', newvx);
  }
  gctx.bird.getRect().setVX(newvx);
  gctx.playSpeed = speed;
}

function scene1BirdCollision() {
  const canvasRect = gameBox.getInstance().canvasRect;
  const birdRect = util.shrinkRect(gctx.bird.getRect(), 10);
  const scoreEventX = gctx.bird.getRect().right;
  let scoreEvent = false;
  for (const pSprite of gctx.pipes.sprites) {
    if (!pSprite.scoreEvent && pSprite.getRect().right < scoreEventX) {
      scoreEvent = true;
      break;
    }
  }
  if (scoreEvent) {
    gctx.pipes.sprites.forEach(v => v.scoreEvent = true);
    gctx.playScore++;
    sceneSpeed();
  }
  for (const pSprite of gctx.pipes.sprites) {
    for (const rect of pSprite.rects) {
      if (util.intersectsRect(birdRect, rect)) {
        console.log('scene2');
        gctx.birdDeath.getRect().vy = gctx.bird.getRect().vy;
        gctx.birdDeath.getRect().setCenterAtRect(gctx.bird.getRect());
        scene2Start();
        return;
      }
    }
  }
  if (gctx.bird.getRect().bottom >= canvasRect.h) {
    scene2Start();
    gctx.birdDeath.getRect().vy = 0;
    gctx.birdDeath.getRect().setCenterAtRect(gctx.bird.getRect());
    gctx.birdDeath.getRect().y = canvasRect.h - gctx.birdDeath.getRect().h;
    return;
  }
}

function scene1() {
  gctx.grass.animate();
  gctx.town.animate();
  gctx.pipes.animate();
  if (gctx.domEvents.spacePressed) {
    gctx.bird.getRect().setVY(gctx.const_bird_vy);
    sceneSpeed();
  }
  gctx.bird.animated = true;
  gctx.bird.getRect().moveGravity();
  scene1BirdCollision();
}

function scene2Start() {
  gctx.scene = 2;
}

function scene2() {
  const canvasRect = gameBox.getInstance().canvasRect;
  if (gctx.birdDeath.getRect().bottom >= canvasRect.h) {
    gctx.birdDeath.getRect().vy = 0;
    gctx.birdDeath.getRect().y = canvasRect.h - gctx.birdDeath.getRect().h;
  } else {
    gctx.birdDeath.getRect().moveGravity();
  }
  if (gctx.domEvents.spacePressed) {
    console.log('click');
    gctx.scene = 0;
    gctx.pipes.sprites = [];
  }
}

/** @param {CanvasRenderingContext2D} ctx */
function mainDraw(ctx) {
  const canvasRect = gameBox.getInstance().canvasRect;
  // console.log('mainDraw');
  util.fillAnimator(ctx, gctx.town);
  util.fillAnimator(ctx, gctx.grass);
  util.fillAnimator(ctx, gctx.pipes);
  if (gctx.scene === 0 || gctx.scene === 1) {
    util.fillSprite(ctx, gctx.bird);
  }
  if (gctx.scene === 2) {
    util.fillSprite(ctx, gctx.birdDeath);
    util.fillSprite(ctx, gctx.gameOver);
  }
  if (gctx.scene === 0) {
    util.fillSprite(ctx, gctx.buttonStart);
  }
  //#region text
  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 2;
  let text = `${gctx.playSpeed+1} - ${gctx.playScore}`;
  ctx.fillText(text, canvasRect.w * 0.5, gctx.playScoreRect.y);
  ctx.strokeText(text, canvasRect.w * 0.5, gctx.playScoreRect.y);
  //#endregion
}

export async function game(elementId) {
  const canvas = document.getElementById(elementId);
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext('2d');
  const box = new gameBox(canvas);
  //
  ctx.font = '30px "Press Start 2P"';
  ctx.textAlign = 'center';
  gctx.sceneFns = [scene0, scene1, scene2];
  gctx.domEvents = new domEvents(canvas);
  await scenesInit();
  //
  // let devStop = 0; setTimeout(() => { devStop = 1; }, 100000 );
  // let t = 0;
  //
  while (true) {
    box.tick();
    gctx.domEvents.tick();
    gctx.currentScene();
    ctx.fillStyle = '#9ae3fe';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    mainDraw(ctx);
    box.endTick();
    await util.sleepAsync(util.fps30);
    //
    // if (devStop === 1) { console.log('devStop', 1); break; }
    // t++;
    // if (t % 20 === 0) {
    //   //console.log('gctx.pipes', gctx.pipes.length);
    // }
  }
};