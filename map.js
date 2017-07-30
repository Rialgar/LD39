var Tiles = {
	air: {
		id:'a'
	},
	dugGround: {
		id:'d'
	},
	earth: {
		maxHealth: 1,
		id:'e'
	}
}

for(var key in Tiles){
	if(Tiles.hasOwnProperty(key)){
		var proto = Tiles[key];
		Tiles[key] = function(){
			this.solid = !!this.maxHealth;
			this.health = this.maxHealth;
		}
		Tiles[key].prototype = proto;
	}
}

function Map(width, height, game, tileset, tilemap){
	this.width = width;
	this.height = height;
	this.game = game;
	this.tileset = tileset;
	this.tilemap = tilemap;
	this.tiles = [];

	for(var y = 0; y < this.height; y++){
		this.tiles[y] = [];
		for(var x = 0; x < this.width; x++){
			if(x < 10 ){
				this.tiles[y][x] = y < 10  ? new Tiles.air() : new Tiles.earth();
			} else {
				this.tiles[y][x] = (y>8 && y<x)  ? new Tiles.air() : new Tiles.earth();
			};
		}
	}
};

Map.prototype.getTileId = function(x, y){
	if(x < 0){
		x = 0;
	} else if (x >= this.width){
		x = this.width-1;
	}
	if(y < 0){
		y = 0;
	} else if (y >= this.height){
		y = this.height-1;
	}
	return this.tiles[y][x].id;
}

Map.prototype.getTilesetId = function(x, y){
	return "" +
	    this.getTileId(x  , y  ) +
		this.getTileId(x+1, y  ) +
		this.getTileId(x  , y+1) +
		this.getTileId(x+1, y+1);
}

Map.prototype.isLadder = function(x, y) {
	return !!(this.tiles[y] && this.tiles[y][x] && this.tiles[y][x].ladder);
};

Map.prototype.isSolid = function(x, y) {
	if(!(this.tiles[y] && this.tiles[y][x])){
		return true;
	}
	if(this.tiles[y][x].solid){
		return this.tiles[y][x].health > 0;
	}
	return false;
};

Map.prototype.damage = function(x, y, damage) {
	var tile = this.tiles[y] && this.tiles[y][x];
	if(tile && tile.maxHealth){
		console.log(x, y, tile.health);
		tile.health -= damage;
		console.log(x, y, tile.health);
		if(tile.health <= 0){
			this.tiles[y][x] = new Tiles.dugGround();
		}
	}
}

Map.prototype.draw = function(layer, area) {
	var tileSize = this.game.tileSize;
	for(var y = Math.max(0, area.y); y < Math.min(this.height-1, area.y + area.height); y++){
		for(var x = Math.max(0, area.x); x < Math.min(this.width-1, area.x + area.width); x++){
			layer.save().translate(tileSize*x, tileSize*y);
			var tilesetID = this.getTilesetId(x, y);
			var coords = this.tilemap[tilesetID];
			layer.drawImage(
				this.tileset,
				coords.x * tileSize, coords.y * tileSize,
				tileSize, tileSize,
				0, 0,
				tileSize, tileSize
			)
			/*if(tile.ladder){
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
			}*/
			layer.restore();
		}
	}
};