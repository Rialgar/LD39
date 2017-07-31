(function(){
	function Player(x, y, game, map, spritesheet, animations){
		this.x = x;
		this.y = y;
		this.game = game;

		this.spritesheet = spritesheet;
		this.animations = animations;

		this.speed = 10;
		this.jumpSpeed = 20;

		var terminalVelocity = 30;
		this.airResistance = this.game.gravity / (terminalVelocity*terminalVelocity);

		this.map = map;

		this.onGround = false;

		this.falling = 0;

		this.damage = 2;

		this.maxTorchLevel = 3;
		this.torchLevel = 0;
		this.torchActive = false;

		this.maxPower = 1;
		this.power = 1;
		this.money = 0;

		this.timeInFrame = 0;
		this.animationFrame = 0;
	}

	var floor = Math.floor.bind(Math);
	var ceil = Math.ceil.bind(Math);
	var round = Math.round.bind(Math);
	var sign = function(x){return x > 0 ? 1 : x < 0 ? -1 : 0};
	var roundInDir = function(x, dir){
		if(dir >= 0){
			return ceil(x);
		} else {
			return floor(x);
		}
	}

	Player.prototype.toggleTorch = function(){
		this.torchActive = !this.torchActive && this.power > 0

		if(this.torchActive){
			this.torchLevel = this.maxTorchLevel * this.power  / this.maxPower;
		} else {
			this.torchLevel = 0;
		}
	}

	Player.prototype.getAnimationName = function(controls){
		var direction = controls.left ? 'Left' :
			controls.right ? 'Right' :
			controls.up ? 'Up' :
			controls.down ? 'Down' :
			'Front';
		return direction + (this.torchActive ? '_On' : '_Off');
	};

	Player.prototype.step = function(dt, keys) {
		if(this.torchActive){
			this.power -= dt * 1/60;
			if(this.power <= 0){
				this.toggleTorch();
			} else {
				this.torchLevel = this.maxTorchLevel * this.power / this.maxPower;
			}
		} else {
			this.power -= dt * 1/600;
		}
		this.power = Math.max(0, this.power);
		var light = this.map.getLight(round(this.x), round(this.y));

		var minLight = 0.8;
		var timeTillFull = 10;

		var charge = Math.max(0, (light - minLight)) * dt / (1-minLight) / timeTillFull;
		this.power = Math.min(this.maxPower, this.power + charge);

		if((keys.space || keys.enter) && this.money > 0 && this.y > 10){
			if(this.map.addLadder(round(this.x), round(this.y))){
				this.money -= 1;
				this.game.addTextEffect({
					x: this.x,
					y: this.y,
					time: 0,
					text: '-1',
					color: 'red'
				})
			}
		}
		if(keys.ctrl || keys.shift || keys.cmd || keys.alt || keys.y || keys.x || keys.z || keys.c || keys.v){
			if(!this.torchToggled){
				this.toggleTorch();
				this.torchToggled = true;
			}
		} else {
			this.torchToggled = false;
		}

		var move = this.speed * dt;
		if(this.power <= 0){
			move /= 10;
		}
		var dx = 0;
		var dy = 0;

		var controls = {}

		if(keys.a || keys.left){
			dx = -1;
			controls.left = true;
		} else if(keys.d || keys.e || keys.right){
			dx = 1;
			controls.right = true;
		}
		if(keys.w || keys.comma || keys.up){
			controls.up = true;
		} else if(keys.s || keys.o || keys.down){
			controls.down = true;
		}

		this.animationName = this.getAnimationName(controls);

		if(this.map.isLadder(round(this.x), ceil(this.y))){
			this.falling = 0;

			if(controls.up){
				dy = -1;
			} else if(controls.down){
				dy = 1;
			}

			var scale = Math.sqrt(dx*dx + dy*dy);
			if(scale != 0){
				dx = dx * move / scale;
				dy = dy * move / scale;
			}
		} else {
			dx = dx * move;

			if(this.onGround && controls.up && this.power > 0){
				this.falling = -this.jumpSpeed;
			}
			dy = dt * this.falling + dt*dt * this.game.gravity/2;
			this.falling += dt * (this.game.gravity - this.airResistance * this.falling * this.falling * sign(this.falling));
		}

		if(dx != 0){
			this.lastDx = dx;
		}
		if(dy != 0){
			this.lastDy = dy;
		}

		while(dy != 0){
			var change = Math.abs(dy) > 0.9 ? 0.9*sign(dy) : dy;
			dy -= change;
			this.y += change;

			var col = false;
			var ty = roundInDir(this.y, change);
			if(this.map.isSolid(floor(this.x), ty)){
				col = true;
				if(change > 0 && controls.down || change < 0 && controls.up){
					this.money += this.map.damage(floor(this.x), ty, this.damage * dt);
				}
			} else if(this.map.isSolid(ceil(this.x), ty)){
				col = true;
				if(change > 0 && controls.down || change < 0 && controls.up){
					this.money += this.map.damage(ceil(this.x), ty, this.damage * dt);
				}
			}

			if(col){
				this.y = roundInDir(this.y, -change);
				dy = 0;

				this.falling = Math.abs(this.falling > 1) ? -this.falling/10 : 0;
			}
		}
		while(dx != 0){
			var change = Math.abs(dx) > 1 ? sign(dx) : dx;
			dx -= change;
			this.x += change;

			var col = false;
			var tx = roundInDir(this.x, change);
			if(this.map.isSolid(tx, floor(this.y))){
				col = true;
				if(change > 0 && controls.right || change < 0 && controls.left){
					this.money += this.map.damage(tx, floor(this.y), this.damage * dt);
				}
			} else if(this.map.isSolid(tx, ceil(this.y))){
				col = true;
				if(change > 0 && controls.right || change < 0 && controls.left){
					this.money += this.map.damage(tx, ceil(this.y), this.damage * dt);
				}
			}

			if(col){
				this.x = roundInDir(this.x, -change)
				dx = 0;
			}
		}

		this.onGround = this.map.isSolid(floor(this.x), round(this.y+0.5)) || this.map.isSolid(ceil(this.x), round(this.y+0.5));
	};

	Player.prototype.draw = function(dt, layer) {
		var tileSize = this.game.tileSize;
		var animation = this.animations[this.animationName];
		if(this.power <= 0){
			this.timeInFrame = 0;
			this.animationFrame = 2;
		} else {
			this.timeInFrame += dt*1000;
			while(animation[this.animationFrame].time < this.timeInFrame){
				this.timeInFrame -= animation[this.animationFrame].time;
				this.animationFrame = (this.animationFrame+1) % animation.length;
			}
		}

		var coords = animation[this.animationFrame].tile;
		layer.drawImage(
			this.spritesheet,
			coords.x * tileSize, coords.y * tileSize,
			tileSize, tileSize,
			(this.x-0.5)*tileSize, (this.y-0.5)*tileSize,
			tileSize, tileSize
		)
	};


	window.Player = Player;
})();