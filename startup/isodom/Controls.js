class IsoDomControls {
    constructor(conductor) {
        this.conductor = conductor;
        this.dragging = {mousePressed: false, active: false, startX: 0, startY: 0, endX: 0, endY: 0};
        this.isoDom = null;
            }

    _setBackgroundBounds(centerViewport) {
        let backgroundBounds = this.isoDom.background.getBounds();
        let scale = this.isoDom.conductor.itemsStage.scale;
        this.minX = Math.round(this.isoDom.conductor.config.itemsTarget.width - (backgroundBounds.width * scale) - (this.isoDom.background.x * scale));
        this.maxX = Math.round(Math.abs(this.isoDom.background.x) * scale);

        this.minY = Math.round(this.isoDom.conductor.config.itemsTarget.height - (backgroundBounds.height * scale) - (this.isoDom.background.y * scale));
        this.maxY = Math.round(Math.abs(this.isoDom.background.y) * scale);

        if (centerViewport) {
            let x = _.mean([this.minX, this.maxX]);
            let y = _.mean([this.minY, this.maxY]);
            this.isoDom.conductor.itemsStage.y = y;
            this.isoDom.conductor.itemsStage.x = x;
            this.isoDom.conductor.gridStage.y = y;
            this.isoDom.conductor.gridStage.x = x;
        } else {
            let stages = [this.isoDom.conductor.itemsStage, this.isoDom.conductor.gridStage];
            if (this.isoDom.conductor.itemsStage.x > this.maxX) {
                stages.forEach(s => s.x = this.maxX);
            }

            if (this.isoDom.conductor.itemsStage.x < this.minX) {
                stages.forEach(s => s.x = this.minX);
            }

            if (this.isoDom.conductor.itemsStage.y > this.maxY) {
                stages.forEach(s => s.y = this.maxY);
            }

            if (this.isoDom.conductor.itemsStage.y < this.minY) {
                stages.forEach(s => s.y = this.minY);
            }
        }

        this.isoDom.emit('backgroundBoundsChanged', this);
    };


    _setMininmumScale(centerViewport) {
        // Set scale
        let backgroundBounds = this.isoDom.background.getBounds();
        this.isoDom.minimumScale = Math.ceil(Math.max(
            (window.innerHeight * 100 / (backgroundBounds.height + this.isoDom.background.y)),
            (window.innerWidth * 100 / (backgroundBounds.width + this.isoDom.background.x))
        )) / 100;

        let stages = [this.conductor.gridStage, this.conductor.itemsStage];
        for (const stage of stages) {
            stage.scale = this.isoDom.minimumScale;
            stage.update();
        }

        this._setBackgroundBounds(centerViewport);
    };

    _setupResizing() {
        window.addEventListener('resize', () => {
            if(!iso) return;
            for (let stage of [iso.conductor.gridStage, iso.conductor.itemsStage]) {
                stage.canvas.width = window.innerWidth;
                stage.canvas.height = window.innerHeight;
                stage.updateViewport(window.innerWidth, window.innerHeight);
                stage.update();
                this._setBackgroundBounds();

            }

            this._setMininmumScale();
        });
    }

    _setupZooming() {
        this.conductor.itemsStage.canvas.addEventListener('wheel', e => {
            let isScrollDown = e.deltaY > 0;

            if (isScrollDown) {
                this.changeZoom(-0.1);

            } else {
                this.changeZoom(0.1);
            }
        });
    }

    changeZoom(rate) {
        let newScale = this.conductor.itemsStage.scale;
        let oldScale = this.conductor.itemsStage.scale;

        if (rate < 0) {
            if (iso.minimumScale < this.conductor.itemsStage.scale) {
                newScale = Math.max(this.conductor.itemsStage.scale + rate, iso.minimumScale);
            }
        } else {
            if (this.conductor.itemsStage.scale < 1) {
                newScale = Math.min(this.conductor.itemsStage.scale + rate, 1);

            }
        }

        this.conductor.itemsStage.scale = newScale;
        this.conductor.gridStage.scale = newScale;

        let zoomDiff= 1+(newScale- oldScale);
        if (zoomDiff == 1) return;

        let x = ((this.conductor.itemsStage.x - window.innerWidth) * zoomDiff) + window.innerWidth;
        let y = ((this.conductor.itemsStage.y - window.innerHeight) * zoomDiff) + window.innerHeight;

        this.conductor.itemsStage.x = x;
        this.conductor.itemsStage.y = y;

        this.conductor.gridStage.y = y;
        this.conductor.gridStage.x = x;

        this._setBackgroundBounds();
    }

    _setupMousePanning() {
        this.conductor.itemsStage.on('stagemouseup', (event) => {
            this.dragging.mousePressed = false;
            this.conductor.itemsStage.enableMouseOver();
            setTimeout(() => {
                this.dragging.active = false;
            }, 10);
        });
        this.conductor.itemsStage.on('stagemousedown', (event) => {
            this.conductor.itemsStage.enableMouseOver(false);
            this.dragging.mousePressed = true;
            this.dragging.startX = event.stageX;
            this.dragging.startY = event.stageY;
        });
        this.conductor.itemsStage.on('stagemousemove', (event) => {
            if (!this.dragging.mousePressed) return;

            this.dragging.endX = event.stageX;
            this.dragging.endY = event.stageY;

            let xDiff = this.dragging.endX - this.dragging.startX;
            let yDiff = this.dragging.endY - this.dragging.startY;

            if (Math.abs(xDiff) > 3 && Math.abs(yDiff) > 3 && !this.dragging.active) {
                this.dragging.active = true;
            }

            if (this.dragging.active) {
                const scale = iso.conductor.itemsStage.scale;

                let newX = Math.round(iso.conductor.itemsStage.x + xDiff);
                let newY = Math.round(iso.conductor.itemsStage.y + yDiff);

                // Handle X
                if ((newX * scale) > (this.minX * scale) && (newX * scale) < (this.maxX * scale)) {
                    iso.conductor.itemsStage.x = newX;
                    iso.conductor.gridStage.x = newX;
                }

                // Handle Y
                if ((newY * scale) > (this.minY * scale) && (newY * scale) < (this.maxY * scale)) {
                    iso.conductor.itemsStage.y = newY;
                    iso.conductor.gridStage.y = newY;
                }

                this.dragging.startX = event.stageX;
                this.dragging.startY = event.stageY;

                Game.overlayController.setOverlayOffset();

            }
        });
    }

    _panToMouseLocation(maxDistance = 0) {
        let transformedBackgroundBounds = iso.background.getTransformedBounds();
        let newX = (window.innerWidth / 2) -
            (iso.conductor.itemsStage.mouseX + Math.abs(iso.conductor.itemsStage.x - Math.abs(transformedBackgroundBounds.x)))
            + Math.abs(transformedBackgroundBounds.x);

        let newY = (window.innerHeight / 2) -
            (iso.conductor.itemsStage.mouseY + Math.abs(iso.conductor.itemsStage.y - Math.abs(transformedBackgroundBounds.y)))
            + Math.abs(transformedBackgroundBounds.y);


        iso.conductor.itemsStage.x = _.clamp(newX, iso.conductor.itemsStage.x - maxDistance, iso.conductor.itemsStage.x + maxDistance);
        iso.conductor.itemsStage.y = _.clamp(newY, iso.conductor.itemsStage.y - maxDistance, iso.conductor.itemsStage.y + maxDistance);
    }

    /**
     * Change the panning relatively.
     * @param x
     * @param y
     */
    changePanning(x, y) {
        if (x) {
            this.isoDom.conductor.itemsStage.x = _.clamp(this.isoDom.conductor.itemsStage.x + x, this.minX, this.maxX);
            this.isoDom.conductor.gridStage.x = _.clamp(this.isoDom.conductor.gridStage.x + x, this.minX, this.maxX);
        }
        if (y) {
            this.isoDom.conductor.itemsStage.y = _.clamp(this.isoDom.conductor.itemsStage.y + y, this.minY, this.maxY);
            this.isoDom.conductor.gridStage.y = _.clamp(this.isoDom.conductor.gridStage.y + y, this.minY, this.maxY);
        }
    }
    
    /**
     * Install plugin for IsoDom instance.
     * @param {IsoDom} isoDom
     *
     */
    install(isoDom) {
        this.isoDom = isoDom;

        if (isoDom.conductor.itemsStage) {
            isoDom.conductor.itemsStage.x = 0;
            isoDom.conductor.itemsStage.y = 0;
        }

        this.isoDom.on('conductorStageSetupCompleted', conductor => {
            this._setupMousePanning();
            this._setupResizing();
            this._setupZooming();
        });

        this.isoDom.on('afterInit', () => {
            //this._setBackgroundBounds.call(this);
            this._setMininmumScale.call(this, true);
        });
    }
}