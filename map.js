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
		Tiles[key] = function(x, y){
			this.x = x;
			this.y = y;
			this.solid = !!this.maxHealth;
			this.health = this.maxHealth;
		}
		Tiles[key].prototype = proto;
	}
}

function GameMap(width, height, game, tileset, tilemap){
	this.width = width;
	this.height = height;
	this.game = game;
	this.tileset = tileset;
	this.tilemap = tilemap;
	this.lightedTileSets = [];
	for(var i = 0; i <= 10; i++){
		var layer = cq(this.tileset).shiftHsl(false, false, i/10 - 1);
		this.lightedTileSets[i] = layer.canvas;
	}
	this.tiles = [];

	for(var y = 0; y < this.height; y++){
		this.tiles[y] = [];
		for(var x = 0; x < this.width; x++){
			this.tiles[y][x] = y < 10  ? new Tiles.air(x, y) : new Tiles.earth(x, y);
			this.tiles[y][x].light = y < 11 ? 1 : 0;
		}
	}
	for(var x = 0; x < this.width; x++){
		this.updateLight(this.tiles[10][x]);
	}
};

GameMap.prototype.getTile = function(x, y){
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
	return this.tiles[y][x];
}

GameMap.prototype.getTileId = function(x, y){
	return this.getTile(x,y).id;
}

GameMap.prototype.getTilesetId = function(x, y){
	return "t-" +
	    this.getTileId(x  , y  ) +
		this.getTileId(x+1, y  ) +
		this.getTileId(x  , y+1) +
		this.getTileId(x+1, y+1);
}

GameMap.prototype.getAvgLightLevel = function(x, y){
	return (
		this.getLight(x  , y  ) +
		this.getLight(x+1, y  ) +
		this.getLight(x  , y+1) +
		this.getLight(x+1, y+1)
	) / 4
}

GameMap.prototype.addLadder = function(x, y) {
	if(!this.isSolid(x, y) && !this.isLadder(x,y)){
		this.tiles[y][x].ladder = true;
		return true;
	}
	return false;
};

GameMap.prototype.isLadder = function(x, y) {
	return !!(this.tiles[y] && this.tiles[y][x] && this.tiles[y][x].ladder);
};

GameMap.prototype.isSolid = function(x, y) {
	if(!(this.tiles[y] && this.tiles[y][x])){
		return true;
	}
	return this.tiles[y][x].solid;
};

GameMap.prototype.getLight = function(x, y){
	return this.getTile(x,y).light;
}

GameMap.prototype.getPassedLight = function(x, y){
	var tile = this.getTile(x, y);
	if(tile.solid){
		return tile.light-0.1;
	} else {
		return tile.light*0.99;
	}
}

GameMap.prototype.updateLight = function(tile){
	var currentRow = [tile];
	var nextRow = {};
	while(currentRow.length > 0){
		var tile = currentRow.pop();
		tile.light = Math.max(
			tile.light,
			this.getPassedLight(tile.x - 1, tile.y - 1),
			this.getPassedLight(tile.x    , tile.y - 1),
			this.getPassedLight(tile.x + 1, tile.y - 1)
		);
		if(tile.light < 0.05){
			tile.light = 0;
		}
		if(tile.light > 0 && tile.y < this.height-1){
			nextRow[ tile.x-1 ] = true;
			nextRow[ tile.x   ] = true;
			nextRow[ tile.x+1 ] = true;
		}
		if(currentRow.length === 0){
			var self = this;
			Object.keys(nextRow).forEach(function(x){
				x = parseInt(x);
				if(x >= 0 && x < self.width){
					currentRow.push(self.getTile(x, tile.y+1));
				}
			});
			nextRow = {};
		}
	}
}

GameMap.prototype.damage = function(x, y, damage) {
	var tile = this.tiles[y] && this.tiles[y][x];
	if(tile && tile.maxHealth){
		console.log(x, y, tile.health);
		tile.health -= damage;
		console.log(x, y, tile.health);
		if(tile.health <= 0){
			var light = this.tiles[y][x].light;
			this.tiles[y][x] = new Tiles.dugGround(x, y);
			this.tiles[y][x].light = light;
			this.updateLight(this.tiles[y][x]);
		}
	}
}

GameMap.prototype.draw = function(layer, area) {
	var tileSize = this.game.tileSize;
	for(var y = Math.max(0, area.y); y < Math.min(this.height-1, area.y + area.height); y++){
		for(var x = Math.max(0, area.x); x < Math.min(this.width-1, area.x + area.width); x++){
			var tilesetID = this.getTilesetId(x, y);
			if(tilesetID === 't-aaaa'){
				continue;
			}
			layer.save().translate(tileSize*x, tileSize*y);
			var coords = this.tilemap[tilesetID];
			var lightLevel = this.getAvgLightLevel(x, y);
			var image = this.lightedTileSets[Math.round(lightLevel*10)];
			layer.drawImage(
				image,
				coords.x * tileSize, coords.y * tileSize,
				tileSize, tileSize,
				0, 0,
				tileSize, tileSize
			)
			layer.restore();
		}
	}
	for(var y = Math.max(0, area.y); y < Math.min(this.height, area.y + area.height); y++){
		for(var x = Math.max(0, area.x); x < Math.min(this.width, area.x + area.width); x++){
			if(this.tiles[y][x].ladder){
				layer.save().translate(tileSize*(x-0.5), tileSize*(y-0.5));

				var coords = this.tilemap['a-ladder'];
				layer.drawImage(
					this.tileset,
					coords.x * tileSize, coords.y * tileSize,
					tileSize, tileSize,
					0, 0,
					tileSize, tileSize
				)

				layer.restore();
			}
		}
	}
};