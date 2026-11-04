export class util {
  static version = '1';
  static sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  static randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  static fps15 = Math.round(1000/15);
  static fps20 = Math.round(1000/20);
  static fps30 = Math.round(1000/30);
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
      img.src=src;
    });
  }
  static loadImgSync(src) {
    if (this._imgCache[src]) {
      return this._imgCache[src];
    }
    throw new Error('please call util.loadImgAsync');
  }
  /** @param {gameRect} rect */
  static fillRect(ctx, rect) {
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  /** @param {gameSprite} sprite */
  static fillSprite(ctx, sprite) {
    if (sprite.hidden) return; 
    sprite.rects.forEach((rect, index) => {
      ctx.drawImage(sprite.imgs[index], rect.x, rect.y, rect.w, rect.h);
    });
  }
}

export class gameRect {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  lastPositions = [];
  get w() { return this.width; } // helpers
  get h() { return this.height; }
  get left() { return this.x; }
  get top() { return this.y; }
  get right() { return this.x + this.width; }
  get bottom() { return this.y + this.height; }
  //
  /** @param {gameRect | null} obj */
  constructor(obj = null) {
    if (obj) {
      Object.assign(this, obj);
    }
    this.clearLastPositions();
  }
  setElement(el) {
    this.width = el.width;
    this.height = el.height;
  }
  clearLastPositions() {
    this.lastPositions = [];
  }
  /** @param {gameRect | null} obj */
  addLastPosition(rect = null) {
    if (rect) {
      this.lastPositions.push(rect);
    } else {
      this.lastPositions.push(this.clone());
    }
  }
  /** @returns {gameRect} */
  getLastPosition() {
    return this.lastPositions.at(-1) || this;
  }
  clone(obj = null) {
    let newRect = new gameRect(this);
    if (obj) {
      Object.assign(newRect, obj);
    }
    return newRect;
  }
  /**
   * @param {gameRect} rect1 
   * @param {gameRect} rect2 
   * @returns {boolean}
   */
  static intersects(a, b) {
    return a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y;
  }
  setCenterAtRect(rect) {
    this.x = rect.x + Math.round((rect.w - this.w) * 0.5);
    this.y = rect.y + Math.round((rect.h - this.h) * 0.5);
  }
}

export class gameBox {
  /** @type {gameBox} */
  static _instance = null;
  static getInstance() {
    return gameBox._instance;
  }
  time = 1000; // 1 sec
  gravity = 300; // px per time
  canvasRect = new gameRect();
  _dt = -1;
  constructor(canvas) {
    this.currentTime = Date.now();
    gameBox._instance = this;
    this.canvasRect.setElement(canvas);
  }
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

export class gamePhysicsRect extends gameRect {
  vy = 0; // velocity
  vx = 0; // velocity
  beginPhysics() {
    this.clearLastPositions();
    this.addLastPosition();
  }
  moveGravity() {
    const box = gameBox.getInstance();
    const dt = box.getDT();
    this.vy += box.gravity * dt;
    this.y += this.vy * dt;
    this.addLastPosition();
  }
  moveXConst() {
    const box = gameBox.getInstance();
    const dt = box.getDT();
    this.x += this.vx * dt;
  }
  stop(index = -1) {
    if (!index) index = -1;
    this.vy = 0;
    let rect = this.lastPositions.at(index) || this;
    this.x = rect.x;
    this.y = rect.y;
  }
}

export class gameSprite {
  /** @type  {gamePhysicsRect[]} */
  rects = [];
  imgs = [];
  hidden = false;
  // TODO: util.loadImgAsync
  initWithImages(imgSrcs) {
    for (const src of imgSrcs) {
      const img = util.loadImgSync(src);
      const rect = new gamePhysicsRect();
      rect.setElement(img);
      this.imgs.push(img);
      this.rects.push(rect);
    }
  }
  rectCallFn(fname, arg1 = null, arg2 = null) {
    for (const rect of this.rects) {
      rect[fname](arg1, arg2);
    }
  }
  getBoundingRect() {
    const bound = this.rects[0].clone();
    let right = bound.right;
    let bottom = bound.bottom;
    for (const rect of this.rects) {
      bound.x = Math.min(bound.x, rect.x);
      bound.y = Math.min(bound.y, rect.y);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }
    bound.width = right - bound.left;
    bound.height = bottom - bound.top;
    return bound;
  }
  getBoundingRight() {
    let right = this.rects.at(0).right;
    for (const rect of this.rects) {
      right = Math.max(right, rect.right);
    }
    return right;
  }
}

