class IsoDomDragAndDrop {
    /**
     * Initialize plugin properties.
     */
    constructor() {
        /** @type IsoDom */
        this.isoDom = null;
        /** @type IsoDomItem */
        this.item = null;
        this.initialOrientation = null;
        this.destinationCell = null;
        this.itemFromOtherFloor = null;
    }

    /**
     * Determine if already dragging an item.
     * @returns {boolean}
     */
    isDragging() {
        return Boolean(this.item);
    }

    /**
     * Set destination cell.
     * @param {IsoDomCell} cell
     */
    setDestination(cell, animate = false) {
        this.destinationCell = cell;
        iso.conductor.updateItemPosition(this.item, cell, animate);
    }

    /**
     * Return closest cell that does not go out of bounds.
     * @param {IsoDomCell} cell
     * @returns {IsoDomCell}
     */
    closestInBoundCell(cell) {
        let x = cell.x;
        let y = cell.y;

        if (cell.x + this.item.getWidth() > this.isoDom.config.columns) {
            x = this.isoDom.config.columns - this.item.getWidth();
        }

        if (cell.y + this.item.getHeight() > this.isoDom.config.rows) {
            y = this.isoDom.config.rows - this.item.getHeight();
        }

        return this.isoDom.cell(x, y);
    }

    /**
     * Cancel drag.
     */
    cancel() {
        if (!this.item) {
            return;
        }

        if (this.item.meta.displayObject && this.item.meta.displayObject.cacheCanvas) {
            this.item.meta.displayObject.filters = [];
            this.item.meta.displayObject.updateCache();
        }

        this.isoDom.emit('dragEnd', true, this); // canceled = true
        this.item.rotate(true, this.initialOrientation);
        this._reset();

        this.isoDom.draw();
    }

    /**
     * Start dragging of an item.
     * @param {IsoDomItem} item
     */
    start(item, x = 0, y = 0) {
        this.item = item;
        this.initialOrientation = item.orientation;

        if (!this._reenableOverlay) {
            this._reenableOverlay = Game.overlayController.enabled;
            if (Game.overlayController.enabled) {
                Game.overlayController.toggleOverlays();
            }
        }

        let destinationCell = item.cell;
        if (destinationCell == null) {
            let localCoords = this.isoDom.conductor.gridStage.globalToLocal(this.isoDom.conductor.gridStage.mouseX, this.isoDom.conductor.gridStage.mouseY);
            let objUnderCursor = this.isoDom.conductor.gridStage.getObjectUnderPoint(localCoords.x, localCoords.y);
            let hoveredCell = _.toArray(this.isoDom.cellMap.values()).find(x => x.meta.displayObject == objUnderCursor);

            destinationCell = hoveredCell;
            if (destinationCell == null) {
                destinationCell = this.isoDom.cell(x, y);
            }
        }

        if (item.preview) {
            this.isoDom.addGhostItem(this.item);
        }

        this.setDestination(destinationCell);

        this.isoDom.conductor.itemsStage.setChildIndex(item.meta.displayObject, iso.conductor.itemsStage.children.length - 1);

        this.isoDom.conductor.config.itemsTarget.style.pointerEvents = 'none';
        this.isoDom.conductor.itemsStage.mouseEnabled = false;
        this.isoDom.conductor.gridStage.enableMouseOver();

        this.isoDom.emit('dragStart', this.item, this);
    }

    /**
     * Confirm new item position and move it or add it to the grid.
     */
    commit() {
        if (!this.isDragging() || !this.destinationCell) {
            return;
        }

        let ghostObject = this.item.meta.displayObject;
        this.isoDom.moveItem(this.item, this.destinationCell.x, this.destinationCell.y);

        if (this.item.preview) { // Remove the ghost
            this.isoDom.conductor.itemsStage.stage.removeChild(ghostObject);
        }

        if (this.itemFromOtherFloor) {
            let $rootScope = GetRootScope();
            _.remove($rootScope.settings.office.grid, x => x.id == this.itemFromOtherFloor.id);
            this.itemFromOtherFloor = null;
            this.item.preview = false;
        }

        this.isoDom.draw();

        this.isoDom.emit('itemDrop', this.item, this.destinationCell, this);
        this.isoDom.emit('dragEnd', false, this); // canceled = false

        this._reset();
    }

    /**
     * Install plugin for IsoDom instance.
     * @param {IsoDom} isoDom
     */
    install(isoDom) {
        this.isoDom = isoDom;

        this.isoDom.on('itemRemoved', item => {
            if (item === this.item) {
                if (item.workstationId) {
                    Game.overlayController.removeWorkstationOverlay(item.workstationId);
                }
                this.cancel();
            }
        });
    }

    /**
     * Reset properties.
     * @private
     */
    _reset() {
        this.item = null;
        this.initialOrientation = null;

        this.isoDom.conductor.itemsStage.mouseEnabled = true;
        this.isoDom.conductor.gridStage.enableMouseOver(0);
        this.isoDom.conductor.config.itemsTarget.style.pointerEvents = '';

        if (this._reenableOverlay) {
            Game.overlayController.toggleOverlays();
            delete this._reenableOverlay;
        }
    }
}
