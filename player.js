(function(){
	function Player(x, y, game, map){
		this.x = x;
		this.y = y;
		this.game = game;

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

	Player.prototype.step = function(dt, keys) {
		if(keys.space){
			this.map.addLadder(round(this.x), round(this.y));
		}
		if(keys.ctrl){
			this.torchLevel = this.maxTorchLevel;
		} else {
			this.torchLevel = 0;
		}

		var move = this.speed * dt;
		var dx = 0;
		var dy = 0;

		var controls = {}

		if(keys.a || keys.left){
			dx = -1;
			controls.left = true;
		} else if(keys.d || keys.right){
			dx = 1;
			controls.right = true;
		}
		if(keys.w || keys.up){
			controls.up = true;
		} else if(keys.s || keys.down){
			controls.down = true;
		}

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

			if(this.onGround && (keys.w || keys.up || keys.space)){
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
					this.map.damage(floor(this.x), ty, this.damage * dt);
				}
			} else if(this.map.isSolid(ceil(this.x), ty)){
				col = true;
				if(change > 0 && controls.down || change < 0 && controls.up){
					this.map.damage(ceil(this.x), ty, this.damage * dt);
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
					this.map.damage(tx, floor(this.y), this.damage * dt);
				}
			} else if(this.map.isSolid(tx, ceil(this.y))){
				col = true;
				if(change > 0 && controls.right || change < 0 && controls.left){
					this.map.damage(tx, ceil(this.y), this.damage * dt);
				}
			}

			if(col){
				this.x = roundInDir(this.x, -change)
				dx = 0;
			}
		}

		this.onGround = this.map.isSolid(floor(this.x), round(this.y+0.5)) || this.map.isSolid(ceil(this.x), round(this.y+0.5));
	};

	Player.prototype.draw = function(layer) {
		var tileSize = this.game.tileSize;
		layer.fillStyle('blue');
		layer.fillCircle((this.x)*tileSize, (this.y)*tileSize, tileSize/2);
	};


	window.Player = Player;
})();