/**
 * @typedef {Object} IsoDomEaselJsConductorConfig
 * @property {HTMLCanvasElement} gridTarget
 * @property {HTMLCanvasElement} itemsTarget
 * @property {Object.<string, *>} stageConfig
 * @property {HTMLImageElement} image
 * @property {function(IsoDomItem):HTMLImageElement} resolve
 * @property {'top-left'|'top-right'|'left-top'|'right-top'|'bottom-left'|'bottom-right'|'left-bottom'|'right-bottom'} offsetPivot
 */

/**
 * @class IsoDomEaselJsConductor
 * @property {IsoDomEaselJsConductorConfig} config
 * @property {createjs.StageGL} gridStage
 * @property {createjs.StageGL} itemsStage
 * @implements {IsoDomConductor}
 */
class IsoDomEaselJsConductor {
    /**
     * IsoDomEaselJsConductor constructor.
     * @param {IsoDomEaselJsConductorConfig} config
     */
    constructor(config = {}) {
        this.gridStage = null;
        this.itemsStage = null;
        this.config = {
            gridTarget: null,
            itemsTarget: null,
            stageConfig: {},
            image: null,
            resolve: null,
            offsetPivot: 'top-left',
        };
        this.tickUpdateGrid = false;
        this.tickUpdateItems = true;
        this.tickUpdate = true;

        Object.assign(this.config, config);

        // Validate elements
        if (!this.config.gridTarget || !this.config.gridTarget.nodeName || this.config.gridTarget.nodeName.toLowerCase() !== 'canvas') {
            throw new Error('`gridTarget` config property must be set and must be an HTMLCanvasElement.');
        }

        if (!this.config.itemsTarget || !this.config.itemsTarget.nodeName || this.config.itemsTarget.nodeName.toLowerCase() !== 'canvas') {
            throw new Error('`itemsTarget` config property must be set and must be an HTMLCanvasElement.');
        }
    }

    /**
     * Set IsoDom instance.
     * @param {IsoDom} isoDom
     */
    setIsoDom(isoDom) {
        this.iso = isoDom;

        isoDom.on({
            beforeInit: this._beforeInit.bind(this),
            cellCreated: this._cellCreated.bind(this),
            afterInit: this._afterInit.bind(this),
            itemAdded: this.itemAdded.bind(this),
            itemMoved: this._itemMoved.bind(this),
            itemRemoved: this._itemRemoved.bind(this),
            renderCell: this.renderCell.bind(this),
            itemRotated: this._itemUpdated.bind(this),
            draw: () => {
                this.updateItemIndexes();
            },
        });
    }

    /**
     * Handle tick.
     */
    handleTick(e) {
        if (!this.tickUpdate) {
            return;
        }

        this.updateStages(e);
    }

    _getSprite(item) {
        const scItem = items[item.defaults.name];
        let sprite = new createjs.Sprite(this.config.spriteSheet);
        if(scItem.category == ItemCategories.Miscellaneous) {
            sprite = new createjs.Sprite(Game.letterSpriteSheet);
        }
        sprite.gotoAndStop(`${item.defaults.name.toLowerCase()}-${item.orientation.toLowerCase()}`);
        return sprite;
    }

    /**
     * Add item to EaselJs.
     * @param {IsoDomItem} item
     */
    itemAdded(item) {
        const displayObject = new createjs.Container();
        const sprite = this._getSprite(item);
        displayObject.addChild(sprite);
        item.meta.displayObject = displayObject;
        this.itemsStage.addChild(item.meta.displayObject);
    }

    /**
     * Update item in easelJS
     * @param {IsoDomItem} item
     */
    _itemUpdated(item) {
        item.meta.displayObject.removeAllChildren();
        const sprite = this._getSprite(item);
        item.meta.displayObject.addChild(sprite);
        item.meta.displayObject.setChildIndex(sprite, 0);
        if (item.meta.displayObject.cacheCanvas)
            item.meta.displayObject.updateCache();

        if (item.cell) {
            this.updateItemPosition(item, item.cell);
        }
    }

    /**
     * Update IsoDomCell.
     * @param {IsoDomCell} cell
     */
    renderCell(cell) {
        if (cell.isItemRoot()) {
            this.updateItemPosition(cell.item, cell);
        }
    }

    /**
     * Update all stages.
     */
    updateStages(e) {
        if (this.tickUpdateGrid) {
            this.gridStage.update(e);
        }

        if (this.tickUpdateItems) {
            this.itemsStage.update(e);
        }

        if (Game.overlayController) {
            Game.overlayController.stage.update(e);
        }
    }

    /**
     * Update stage.
     */
    updateItemIndexes() {
        this.iso.items
            .sort((a, b) => a.cell.z - b.cell.z)
            .forEach((item, index) => {
                this.itemsStage.setChildIndex(item.meta.displayObject, index + 1); // Start at 1 to ensure background stays at 0.
            });
    }

    /**
     * Update item position to cell.
     * @param {IsoDomItem} item
     * @param {IsoDomCell} cell
     */
    updateItemPosition(item, cell, animate = false) {
        const pivots = this.config.offsetPivot.split('-');

        let image = item.image();
        let destX = Number(cell.meta.displayObject.x);
        let destY = Number(cell.meta.displayObject.y);

        let assetBounds = item.meta.displayObject.children[0].getBounds();
        if (pivots.includes('bottom')) {
            destY = destY - Number(assetBounds.height) * item.meta.displayObject.scale + this.iso.config.cellSize[1];
        }

        if (pivots.includes('right')) {
            destX = destX - Number(assetBounds.width) * item.meta.displayObject.scale + this.iso.config.cellSize[0];
        }

        createjs.Tween.removeTweens(item.meta.displayObject);

        if (animate) {
            createjs.Tween.get(item.meta.displayObject).to({
                x: destX + image.offset.left,
                y: destY + image.offset.top
            }, 80);
        } else {
            item.meta.displayObject.x = destX + image.offset.left;
            item.meta.displayObject.y = destY + image.offset.top;
        }
    }

    /**
     * IsoDom event.
     * @private
     */
    _itemMoved(item, fromCell, toCell) {
        this.updateItemPosition(item, toCell);
    }

    _itemRemoved(item) {
        this.itemsStage.removeChild(item.meta.displayObject);
    }

    /**
     * IsoDom event.
     * @private
     */
    _beforeInit() {
        if (this.gridStage != null) {
            this.gridStage.removeAllChildren();
            this.itemsStage.removeAllChildren();
        } else {
            this.config.gridTarget.width = window.innerWidth;
            this.config.gridTarget.height = window.innerHeight;
            this.config.itemsTarget.width = window.innerWidth;
            this.config.itemsTarget.height = window.innerHeight;
            this.gridStage = new createjs.StageGL(this.config.gridTarget, Object.assign({
                transparent: false,
                antialias: true
            }, this.config.stageConfig || {}));
            this.itemsStage = new createjs.StageGL(this.config.itemsTarget, Object.assign({
                transparent: false,
                antialias: true
            }, this.config.stageConfig || {}, {transparent: true}));
            this.itemsStage.setClearColor("#000000");
            if (!this.iso.config.debug) {
                this.gridStage.alpha = 0.01;
            } else {
                this.tickUpdateGrid = true;
            }
            this.itemsStage.snapToPixelEnabled = true;
            this.itemsStage.nextStage = this.gridStage;

            this.config.gridTarget.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            });
            this.config.itemsTarget.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            });

            createjs.Ticker.timingMode = createjs.Ticker.RAF;
            createjs.Ticker.addEventListener("tick", this.handleTick.bind(this));

            this.iso.emit('conductorStageSetupCompleted', this);
        }
    }

    /**
     * IsoDom event.
     * @param {IsoDomCell} cell
     * @private
     */
    _cellCreated(cell) {
        // TODO cache these calcs
        const canvasWidth = this.iso.config.cellSize[0] * this.iso.config.columns;
        const halfWidth = Math.round(canvasWidth / 2);
        const halfCellWidth = Math.round(this.iso.config.cellSize[0] / 2);
        const halfCellHeight = Math.round(this.iso.config.cellSize[1] / 2);
        const rowStartX = halfWidth - halfCellWidth - (cell.y * halfCellWidth);

        // Dynamic display object?
        const displayObject = new createjs.Bitmap(this.config.image);
        displayObject.x = rowStartX + cell.x * halfCellWidth;
        displayObject.y = (halfCellHeight * cell.x) + (halfCellHeight * cell.y);

        cell.meta.displayObject = displayObject;

        this.gridStage.addChild(displayObject);
    }

    /**
     * IsoDom event.
     * @private
     */
    _afterInit() {
        this.updateItemIndexes();

        this.itemsStage.enableMouseOver(100);

        if(Game.backgroundCache == null) Game.backgroundCache = {};

        if (this.iso.config.background) {
            if(!Game.backgroundCache[this.iso.config.background.src]) {
                let background =new createjs.Container();

                let xParts = Math.ceil(this.iso.config.background.width / 1024);
                let yParts = Math.ceil(this.iso.config.background.height / 1024);

                for (let y = 0; y < yParts; y++) {
                    for (let x = 0; x < xParts; x++) {
                        let part = new createjs.Sprite(this.config.backgroundSpriteSheet);
                        part.gotoAndStop(this.iso.config.background.src + `_${(y * xParts) + x}`);
                        part.x = 1024 * x;
                        part.y = 1024 * y;
                        background.addChild(part);
                    }
                }

                background.setBounds(0, 0, this.iso.config.background.width, this.iso.config.background.height); // Set bounds manually to allow for SPOT compatible image
                this.itemsStage.addChild(background);
                background.x = -this.iso.config.background.offset.x;
                background.y = -this.iso.config.background.offset.y;

                if (this.iso.config.debug) {
                    background.alpha = 0.5;
                }

                Game.backgroundCache[this.iso.config.background.src] = background;
            }

            this.iso.background = Game.backgroundCache[this.iso.config.background.src];
            this.itemsStage.addChild(this.iso.background);
            this.itemsStage.setChildIndex(this.iso.background, 0);

        }

        this.gridStage.update();
    }
}
