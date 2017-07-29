window.addEventListener('load', function(){
	var app = playground({
		create: function() {

		},

		ready: function () {
			this.tileSize = 32;
			this.gravity = 9.81 * 4;

			this.map = new Map(100, 100, this);
			this.player = new Player(5, 9, this, this.map);
		},

		step: function (dt) {
			if(this.player){
				this.player.step(dt, this.keyboard.keys);
			}
		},

		render: function () {
			this.layer.smoothing = false;
			this.layer.clear("#FFFFFF");

			this.map.draw(this.layer);
			this.player.draw(this.layer);
		}
	});
})