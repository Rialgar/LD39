var Tiles = {
	air: {
		draw: false,
		solid: false
	},
	earth: {
		draw: true,
		color: 'brown',
		solid: true,
		maxHealth: 1,
		destroyed: 'earthBG'
	},
	earthBG: {
		draw: true,
		solid: false,
		color: 'saddlebrown'
	}
}

for(var key in Tiles){
	if(Tiles.hasOwnProperty(key)){
		var proto = Tiles[key];
		Tiles[key] = function(){
			this.health = this.maxHealth;
		}
		Tiles[key].prototype = proto;
	}
}

function Map(width, height, game){
	this.width = width;
	this.height = height;
	this.game = game;
	this.tiles = [];

	for(var y = 0; y < this.height; y++){
		this.tiles[y] = [];
		for(var x = 0; x < this.width; x++){
			if(x < 20 ){
				this.tiles[y][x] = y < 20  ? new Tiles.air() : new Tiles.earth();
			} else {
				this.tiles[y][x] = (y>18 && y<x)  ? new Tiles.air() : new Tiles.earth();
			};
			if(y < 20 && x > 10 && x < 15){
				this.tiles[y][x].ladder = true;
			}
		}
	}
};

Map.prototype.isLadder = function(x, y) {
	return !!(this.tiles[y] && this.tiles[y][x] && this.tiles[y][x].ladder);
};

Map.prototype.isSolid = function(x, y) {
	return !!(this.tiles[y] && this.tiles[y][x] && this.tiles[y][x].solid);
};

Map.prototype.damage = function(x, y, damage) {
	var tile = this.tiles[y] && this.tiles[y][x];
	if(tile && tile.maxHealth){
		console.log(x, y, tile.health);
		tile.health -= damage;
		console.log(x, y, tile.health);
		if(tile.health <= 0){
			this.tiles[y][x] = new Tiles[tile.destroyed]();
		}
	}
}

Map.prototype.draw = function(layer) {
	var tileSize = this.game.tileSize;
	for(var y = 0; y < this.height; y++){
		for(var x = 0; x < this.width; x++){
			var tile = this.tiles[y][x];
			layer.save().translate(tileSize*x, tileSize*y);
			if(tile.draw){
				layer
				    .fillStyle(tile.color)
				    .fillRect(0, 0, tileSize, tileSize);
			}
			if(tile.ladder){
				layer
					.lineWidth(tileSize/8)
					.lineCap('square')
					.strokeStyle('beige')
					.beginPath()
					.moveTo(tileSize/4, 0)
					.lineTo(tileSize/4, tileSize)
					.moveTo(tileSize*3/4, 0)
					.lineTo(tileSize*3/4, tileSize)
					.moveTo(tileSize/4, tileSize*1/8)
					.lineTo(tileSize*3/4, tileSize*1/8)
					.moveTo(tileSize/4, tileSize*3/8)
					.lineTo(tileSize*3/4, tileSize*3/8)
					.moveTo(tileSize/4, tileSize*5/8)
					.lineTo(tileSize*3/4, tileSize*5/8)
					.moveTo(tileSize/4, tileSize*7/8)
					.lineTo(tileSize*3/4, tileSize*7/8)
					.stroke();
			}
			layer.restore();
		}
	}
};