window.addEventListener('load', function(){
	function pad(string , length){
		string = ""+string;
		while(string.length < length){
			string = '0' + string;
		}
		return string;
	}
	var app = playground({
		scale: 1,
		width: 640,
		height: 480,
		create: function() {
			this.loadData('tilemap'),
			this.loadData('characterAnims'),
			this.loadData('shops'),
			this.loadImage('tileset'),
			this.loadImage('character'),
			this.loadImage('shops')
		},

		ready: function () {
			for(var key in this.data.tilemap){
				if(this.data.tilemap.hasOwnProperty(key)){
					var value = this.data.tilemap[key];
					this.data.tilemap[key] = {
						x: value % 8,
					    y: Math.floor(value/8)
					}
				}
			}

			var cTilesetCols = this.data.characterAnims.columns;
			var characterAnimations = {};
			for(var key in this.data.characterAnims.animations){
				if(this.data.characterAnims.animations.hasOwnProperty(key)){
					characterAnimations[key+'_On'] = this.data.characterAnims.animations[key].map(function(frame){
						return {
							tile: {
								x: frame.tile % cTilesetCols,
								y: Math.floor(frame.tile / cTilesetCols)
							},
							time: frame.time
						};
					});
					characterAnimations[key+'_Off'] = characterAnimations[key+'_On'].map(function(frame){
						return {
							tile: {
								x: frame.tile.x,
								y: frame.tile.y + 5
							},
							time: frame.time
						};
					})
				}
			}

			this.textEffects = [];

			this.tileSize = 32;
			this.gravity = 9.81 * 4;

			this.map = new GameMap(200, 300, this, this.images.tileset, this.data.tilemap);
			this.shops = [
				{type: 'Battery', bought: 0, x: 95, y:8, w:4, h:2, prop: 'maxPower'},
				{type: 'Torch', bought: 0, x: 102, y:8, w:4, h:2, prop: 'maxTorchLevel'},
				{type: 'Drill', bought: 0, x: 107, y:8, w:4, h:2, prop: 'damage'}
			];
			this.player = new Player(100, 9, this, this.map, this.images.character, characterAnimations);

			this.maxOffset = {
				x: (this.map.width - 1)*this.tileSize - this.width,
				y: (this.map.height - 1)*this.tileSize - this.height
			}

			this.offset = {x:100 * this.tileSize - this.width/2, y:0}

			this.messages = [];

			this.addMessage("You are solar powered.");
			this.addMessage("Dig up Gold and Silver for Profit.");
		},

		step: function (dt) {
			if(this.player){

				if((this.keyboard.keys.space || this.keyboard.keys.enter) && !this.justBought){
					var self = this;
					this.shops.forEach(function(shop){
						var shopData = self.data.shops[shop.type];
						if(self.player.x > shop.x && self.player.x < shop.x + shop.w &&
							self.player.y > shop.y && self.player.y < shop.y + shop.h &&
							shop.bought < shopData.levels.length &&
							self.player.money >= shopData.levels[shop.bought].price){

							self.player.money -= shopData.levels[shop.bought].price;
							self.addTextEffect({
								x: self.player.x,
								y: self.player.y,
								time: 0,
								text: '-' + shopData.levels[shop.bought].price,
								color: 'red'
							});
							self.player[shop.prop] *= shopData.levels[shop.bought].factor;
							shop.bought++;

							self.justBought = true;
						}
					});
				} else {
					this.justBought = this.keyboard.keys.space;
				}

				this.player.step(dt, this.keyboard.keys);
				var offsetGoal = {
					x: this.offset.x,
					y: this.offset.y
				};
				var px = Math.round(this.player.x * this.tileSize);
				offsetGoal.x = Math.max(0, Math.min(px - this.width*1/2, this.maxOffset.x));
				var py = Math.round(this.player.y * this.tileSize);
				offsetGoal.y = Math.max(0, Math.min(py - this.height*1/2, this.maxOffset.y));

				var maxChange = {
					x: 15 * this.tileSize * dt,
					y: 30 * this.tileSize * dt
				}

				var offsetChange = {
					x: Math.min(maxChange.x, Math.max(-maxChange.x, (offsetGoal.x - this.offset.x)/16)),
					y: Math.min(maxChange.y, Math.max(-maxChange.y, (offsetGoal.y - this.offset.y)/16))
				};

				this.offset.x += offsetChange.x;
				this.offset.y += offsetChange.y;
			}
		},

		addTextEffect: function(ef){
			this.textEffects.push(ef);
		},

		addMessage: function(text, time){
			this.messages.push({
				timeLeft: time || 5,
				text: text
			});
		},

		render: function (dt) {
			if(this.map && this.player){
				var layer = this.layer
				var tileSize = this.tileSize;

				layer.smoothing = false;
				layer.canvas.style.imageRendering = 'pixelated';

				layer
					.clear("#31a2f2")
					.save()
					.translate(Math.round(-this.offset.x), Math.round(-this.offset.y));

				var area = {
					x: Math.floor(this.offset.x/this.tileSize),
					y: Math.floor(this.offset.y/this.tileSize),
					width: Math.ceil(this.width/this.tileSize) + 1,
					height: Math.ceil(this.height/this.tileSize) + 1
				}

				this.map.draw(this.layer, area, {
					x: this.player.x,
					y: this.player.y,
					level: this.player.torchLevel,
				});

				var self = this;
				this.shops.forEach(function(shop){
					var shopData = self.data.shops[shop.type];
					var x = (shop.x - 0.5) * tileSize;
					var y = (shop.y - 0.5) * tileSize;
					var coords = shopData.tile;
					layer.drawImage(
						self.images.shops,
						coords.x, coords.y,
						coords.w, coords.h,
						x, y,
						coords.w, coords.h
					);
					if(self.player.x > shop.x && self.player.x < shop.x + shop.w &&
						self.player.y > shop.y && self.player.y < shop.y + shop.h){
						var sx = (shop.x + shop.w/2 - 0.5) * tileSize;
						var sy = (shop.y + shop.h/4 - 0.5) * tileSize
						layer.beginPath()
							.moveTo(sx, sy)
							.lineTo(sx + 0.5*tileSize, sy -   tileSize)
							.lineTo(sx +   4*tileSize, sy -   tileSize)
							.lineTo(sx +   4*tileSize, sy - 4*tileSize)
							.lineTo(sx -   4*tileSize, sy - 4*tileSize)
							.lineTo(sx -   4*tileSize, sy -   tileSize)
							.lineTo(sx - 0.5*tileSize, sy -   tileSize)
							.moveTo(sx, sy)
							.fillStyle('white')
							.fill()
							.fillStyle('black')
							.font("16px silkscreen")
							.fillText(shopData.description, sx - shopData.description.length * 3, sy - 3*tileSize);

						if(shop.bought < shopData.levels.length){
							layer.fillText('Price: ' + pad(shopData.levels[shop.bought].price, 5), sx - 3*tileSize, sy - 2.25*tileSize)
								.fillText('Increase: ' + shopData.levels[shop.bought].factor, sx + 0.5*tileSize, sy - 2.25*tileSize)
								.fillText('[Space]', sx - 28, sy - 1.5*tileSize)
						} else {
							layer.fillText('Sold Out', sx - 32, sy - 2*tileSize)
						}

					}
				});

				this.player.draw(dt, this.layer);

				this.textEffects = this.textEffects.filter(function(ef){
					return ef.time < 1;
				});
				this.textEffects.forEach(function(ef){
					var x = ef.x;
					var y = ef.y;
					if(x >= area.x && x < area.x+area.width && y >= area.y && y < area.y+area.height){
						layer.fillStyle(ef.color)
						     .fillText(ef.text, x*tileSize - ef.text.length*4, ef.y * tileSize - ef.time*tileSize);
					}
					ef.time += dt;
				});

				var h = this.height*this.player.power/this.player.maxPower;

				layer
					.restore()
					.fillStyle('yellow')
					.strokeStyle('yellow')
					.lineWidth(1)
					.strokeRect(0, 0, tileSize/4, this.height)
					.fillRect(0, this.height-h, tileSize/4, h)
					.font("16px silkscreen")
					.fillText(pad(this.player.money, 6), this.width - 60, 20);


				if(this.messages.length > 0){
					layer.fillStyle('white')
						.fillRect(192,32,this.width-384,48)
						.fillStyle('black')
						.fillText(this.messages[0].text, this.width/2 - this.messages[0].text.length * 3, 64);

					this.messages[0].timeLeft -= dt;
					if(this.messages[0].timeLeft <= 0){
						this.messages.shift();
					}
				}
			}
		},

		resize: function() {
			this.scale = Math.max(1, Math.min(
				Math.floor(document.documentElement.clientWidth / this.width),
				Math.floor(document.documentElement.clientHeight / this.height)
			));
		}
	});
});