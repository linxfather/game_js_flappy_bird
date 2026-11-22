export class util {
  static version = '2';
  //#region const
  static fps15 = Math.round(1000 / 15);
  static fps20 = Math.round(1000 / 20);
  static fps30 = Math.round(1000 / 30);
  //#endregion
  //#region utils
  static sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  static randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  static arrayDel(ar, val) {
    const idx = ar.indexOf(val);
    if (idx >= 0) {
      ar.splice(idx, 1);
    }
  }
  /** @returns {boolean} */
  static intersectsRect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  /** @returns {gameRect} */
  static shrinkRect(rect, amount) {
    const r = new gameRect();
    r.x = rect.x + amount;
    r.y = rect.y + amount;
    r.width = rect.width - amount * 2;
    r.height = rect.height - amount * 2;
    return r;
  }
  //#endregion
  //#region images
  static _imgCache = {};
  static loadImgAsync(src) {
    return new Promise((result, reject) => {
      if (this._imgCache[src]) {
        result(this._imgCache[src]);
        return;
      }
      const img = new Image();
      img.onload = () => {
        this._img = img;
        this._imgCache[src] = img;
        result(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  static async loadImgAll(srcs) {
    for (const src of srcs) {
      await this.loadImgAsync(src);
    }
  }
  static loadImgSync(src) {
    if (this._imgCache[src]) {
      return this._imgCache[src];
    }
    throw new Error('please call util.loadImgAsync or loadImgAll');
  }
  //#endregion
  //#region fill
  /** @param {gameRect} rect */
  static fillRect(ctx, rect) {
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  /** @param {gameSprite} sprite */
  static fillSprite(ctx, sprite) {
    if (sprite.hidden) return;
    if (sprite.periodIndex) {
      let rect = sprite.rects.at(0);
      if (!rect) return;
      if (sprite.animated) {
        ctx.drawImage(sprite.imgs[sprite.periodIndex.getCurrentIdx()], rect.x, rect.y, rect.w, rect.h);
      } else {
        ctx.drawImage(sprite.imgs.at(0), rect.x, rect.y, rect.w, rect.h);
      }
    } else {
      sprite.rects.forEach((rect, index) => {
        ctx.drawImage(sprite.imgs[index], rect.x, rect.y, rect.w, rect.h);
      });
    }
  }
  static fillAnimator(ctx, animator) {
    animator.sprites.forEach(sprite => {
      this.fillSprite(ctx, sprite);
    });
  }
  //#endregion
}

export class gameRect {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  //#region helpers
  get w() { return this.width; } // helpers
  get h() { return this.height; }
  get left() { return this.x; }
  get top() { return this.y; }
  get right() { return this.x + this.width; }
  get bottom() { return this.y + this.height; }
  setX(x) { this.x = x; }
  setY(y) { this.y = y; }
  setXAdd(add) { this.x += add; }
  setYAdd(add) { this.y += add; }
  setXY(x, y) { this.setX(x); this.setY(y); }
  setW(w) { this.width = Math.round(w); }
  setH(h) { this.height = Math.round(h); }
  //#endregion
  //
  /** @param {gameRect | null} obj */
  constructor(obj = null) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
  setElement(el) {
    this.width = el.width;
    this.height = el.height;
  }
  clone(obj = null) {
    let newRect = new gameRect(this);
    if (obj) {
      Object.assign(newRect, obj);
    }
    return newRect;
  }
  setCenterAtRect(rect) {
    this.x = rect.x + Math.round((rect.w - this.w) * 0.5);
    this.y = rect.y + Math.round((rect.h - this.h) * 0.5);
  }
  //#region physics
  vy = 0; // velocity
  vx = 0; // velocity
  setVY(val) {
    this.vy = val;
  }
  setVX(val) {
    this.vx = val;
  }
  moveGravity() {
    const box = gameBox.getInstance();
    const dt = box.getDT();
    this.vy += box.gravity * dt;
    this.y += this.vy * dt;
  }
  moveXConst() {
    const box = gameBox.getInstance();
    const dt = box.getDT();
    this.x += this.vx * dt;
  }
  //#endregion
}

export class gameBox {
  time = 1000; // 1 sec
  gravity = 300; // px per time
  canvasRect = new gameRect();
  _dt = -1;
  //#region constructor
  /** @type {gameBox} */
  static _instance = null;
  static getInstance() {
    return gameBox._instance;
  }
  constructor(canvas) {
    this.currentTime = Date.now();
    gameBox._instance = this;
    this.canvasRect.setElement(canvas);
  }
  //#endregion
  getDTms() {
    if (this._dt >= 0) return this._dt;
    let now = Date.now();
    let result = now - this.currentTime;
    this.currentTime = now;
    this._dt = result;
    return result;
  }
  getDT() {
    return this.getDTms() / this.time;
  }
  tick() {
    this._dt = -1;
  }
  endTick() {
    this.getDTms();
  }
}

class periodIndex {
  period = 1;
  len = 1;
  cp = 0;
  cidx = 0;
  getCurrentIdx() {
    let last = this.cidx;
    this.cp = (this.cp + 1) % this.period;
    if (this.cp === 0) {
      this.cidx = (this.cidx + 1) % this.len;
    }
    return last;
  }
  clone() {
    return Object.assign(new periodIndex(), this);
  }
}

export class gameSprite {
  /** @type  {gameRect[]} */
  rects = [];
  imgs = [];
  /** @type {periodIndex} */
  periodIndex = null;
  hidden = false;
  animated = false;
  //
  getRect(index = 0) {
    return this.rects.at(index);
  }
  getImg(index = 0) {
    return this.imgs.at(index);
  }
  setZoom(zoom) {
    this.rectCallFn('setW', this.getImg().width * zoom);
    this.rectCallFn('setH', this.getImg().height * zoom);
  }
  initWithImages(imgSrcs) {
    for (const src of imgSrcs) {
      const img = util.loadImgSync(src);
      const rect = new gameRect();
      rect.setElement(img);
      this.imgs.push(img);
      this.rects.push(rect);
    }
  }
  initWithImagesSingleRect(imgSrcs, period = 1) {
    for (const src of imgSrcs) {
      const img = util.loadImgSync(src);
      if (this.rects.length === 0) {
        const rect = new gameRect();
        rect.setElement(img);
        this.rects.push(rect);
      }
      this.imgs.push(img);
    }
    this.periodIndex = new periodIndex();
    this.periodIndex.period = period;
    this.periodIndex.len = this.imgs.length;
  }
  rectCallFn(fname, arg1 = null, arg2 = null) {
    for (const rect of this.rects) {
      rect[fname](arg1, arg2);
    }
  }
  getBoundingRight() {
    let right = this.rects.at(0).right;
    for (const rect of this.rects) {
      right = Math.max(right, rect.right);
    }
    return right;
  }
  clone() {
    let obj = new gameSprite();
    obj.hidden = this.hidden;
    this.rects.forEach(v => obj.rects.push(v.clone()));
    obj.imgs = this.imgs.slice(); // array copy
    if (this.periodIndex) obj.periodIndex = this.periodIndex.clone();
    return obj;
  }
}

export class gameSpriteAnimatorRightToLeftX {
  /** @type {gameSprite[]} */
  newSprites = [];
  /** @type {gameSprite[]} */
  sprites = [];
  //
  newX = 400; // TODO init
  delX = 0;
  onNewSpritesFn = null;
  init() {
    this.newX = gameBox.getInstance().canvasRect.w;
  }
  animate() {
    const toDel = [];
    const sprites = this.sprites;
    let newX_event = false;
    let right = 0;
    let dRight = 0;
    sprites.forEach(v => v.rectCallFn('moveXConst'));
    for (const v of sprites) {
      if (!v.newX_event && v.getRect().right <= this.newX) {
        right = v.getRect().right;
        dRight = this.newX - right;
        newX_event = true;
      }
      if (v.right <= this.delX) toDel.push(v);
    }
    if (newX_event || sprites.length === 0) {
      sprites.forEach(v => v.newX_event = true);
      const ns = this.newSprites.map(v => v.clone());
      ns.forEach(v => v.rectCallFn('setXAdd', -dRight));
      if (this.onNewSpritesFn) this.onNewSpritesFn(ns);
      sprites.push(...ns);
    }
    toDel.forEach(v => util.arrayDel(sprites, v));
  }
}

export class domEvents {
  spacePressed = false;
  kbKeys = [];
  constructor(canvas) {
    const kbKeys = this.kbKeys;
    canvas.addEventListener('click', (ev) => {
      if (kbKeys.at(-1) !== 32) {
        kbKeys.push(32);
      }
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.keyCode === 32 && kbKeys.at(-1) !== 32) {
        kbKeys.push(32);
      }
    });
  }
  tick() {
    this.spacePressed = this.kbKeys.pop() === 32;
  }
}
