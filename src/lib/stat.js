class Stat{
	static initialize( wrapper ){
		let stat = Stat.instance;
		if( !stat ){
			stat = new Stat( wrapper );
		}	
		return stat;
	}

	constructor( wrapper ){
		this.width = 100;
		this.height = 30;
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'k-stat';
		this.wrapper.style.cssText = "position:fixed;color:white;display:inline-block;left:0;bottom:0;z-index:888;"
		wrapper.appendChild( this.wrapper );
		var canvas = document.createElement('canvas');
		this.canvas_tmp = document.createElement('canvas');
		canvas.width = this.canvas_tmp.width = this.width;
		canvas.height = this.canvas_tmp.height = this.height;

		this.infowrap = document.createElement("div");
		this.wrapper.appendChild( this.infowrap );
		this.infowrap.style.cssText = "position:absolute;left:0;bottom:0;color:white;padding:4px 0;font-family: Verdana;font-size:9px;-webkit-transform: scale(0.80);";

		this.info_fps = document.createElement("div");
		this.infowrap.appendChild( this.info_fps)

		canvas.setAttribute("id","canvas")
		canvas.style.cssText = "background:black;"
		this.ctx_tmp = this.canvas_tmp.getContext('2d');

		this.width = canvas.width;
		this.height = canvas.height;
		this.wrapper.appendChild( canvas )
		this.canvas = canvas;
		this.fpsCanvas = canvas.getContext('2d');
		this.times = []; // 存储当前的时间数组
		this.fps = 0;
		this.updateFps();
		this.fpsIdx = 0;
		this.oldfps = 0;
		let self = this;
		setInterval(function(){
			self.drawFps( self.fps );
		},300)
	}

	drawFps( fps ){
		let ctx = this.fpsCanvas
		let ctx_tmp = this.ctx_tmp, canvas_tmp = this.canvas_tmp;
		let val = 0;
		let w = this.width;
		let h = this.height;
		let r = 0
		let g = 204
		let b = 0
		let color = "rgb("+r+","+g+","+b+")";
		let oldy = this.oldfps;
		val = h - (h * fps/100);
		if( !oldy ){
			oldy = val + 1;
		}
		if( this.fpsIdx >= w ){				
			ctx_tmp.clearRect(0,0,w,h);
			ctx_tmp.drawImage( this.canvas, 0, 0 );
			ctx.clearRect(0,0, w,h );
			ctx.drawImage( canvas_tmp, 0, 0, w, h, -1, 0, w, h );				
			ctx.fillStyle = color;
			ctx.fillRect(w-1, Math.min(oldy,val), 1,Math.max( Math.abs(oldy-val), 1));			
		}else{
			ctx.save();			
			ctx.translate(this.fpsIdx,0 )
			ctx.fillStyle= color
			ctx.fillRect(0, Math.min(oldy,val), 1, Math.max( Math.abs(oldy-val), 1));
			ctx.restore();
		}
		this.oldfps = val;
		this.fpsIdx +=1;

		this.info_fps.innerHTML = "FPS：" + this.fps
	}
	updateFps(){
		let times = this.times;
		let fps = this.fps;		
		let self = this;
		window.requestAnimationFrame(() => {
			const now = performance.now(); // 使用performance.now()能获取更高的精度
			while (times.length > 0 && times[0] <= now - 1000) {
				times.shift(); // 去掉1秒外的时间
			}			
			times.push(now);
			fps = times.length;
			this.fps =  fps;
			
			this.updateFps();
		});		
	}

}

export default Stat;