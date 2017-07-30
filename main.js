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
			this.loadImage('tileset')
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

			this.textEffects = [];

			this.tileSize = 32;
			this.gravity = 9.81 * 4;

			this.map = new GameMap(200, 300, this, this.images.tileset, this.data.tilemap);
			this.player = new Player(100, 9, this, this.map);

			this.maxOffset = {
				x: (this.map.width - 1)*this.tileSize - this.width,
				y: (this.map.height - 1)*this.tileSize - this.height
			}

			this.offset = {x:100 * this.tileSize - this.width/2, y:0}
		},

		step: function (dt) {
			if(this.player){
				this.player.step(dt, this.keyboard.keys);
				var offsetGoal = {
					x: this.offset.x,
					y: this.offset.y
				};
				var px = Math.round(this.player.x * this.tileSize);
				offsetGoal.x = Math.max(0, Math.min(px - this.width*1/2, this.maxOffset.x));
				/*if(this.player.lastDx > 0 && px > this.offset.x + this.width*1/3){
					offsetGoal.x = Math.min(px - this.width*1/3, this.maxOffset.x);
				} else if (this.player.lastDx < 0 && px < this.offset.x + this.width*2/3){
					offsetGoal.x = Math.max(px - this.width*2/3, 0);
				}*/
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
				this.player.draw(this.layer);

				this.textEffects = this.textEffects.filter(function(ef){
					return ef.time < 1;
				});
				this.textEffects.forEach(function(ef){
					var x = ef.x;
					var y = ef.y;
					if(x >= area.x && x < area.x+area.width && y >= area.y && y < area.y+area.height){
						layer.fillStyle(ef.color)
						     .fillText(ef.text, x*tileSize - ef.text.length*4, ef.y * tileSize - ef.time*tileSize);
						console.log(ef.text, x*tileSize - ef.text.length*4, ef.y * tileSize - ef.time*tileSize);
					}
					ef.time += dt;
				});

				var h = this.height*this.player.power;

				layer
					.restore()
					.fillStyle('yellow')
					.strokeStyle('yellow')
					.lineWidth(1)
					.strokeRect(0, 0, tileSize/4, this.height)
					.fillRect(0, this.height-h, tileSize/4, h)
					.font("16px silkscreen")
					.fillText(pad(this.player.money, 6), this.width - 60, 20);

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