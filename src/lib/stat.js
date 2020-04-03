class Stat{
	static initialize( wrapper ){
		let stat = Stat.instance;
		if( !stat ){
			stat = new Stat( wrapper );
		}	
		return stat;
	}

	constructor( wrapper ){
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'k-stat';
		wrapper.appendChild( this.wrapper );
		var canvas = document.createElement('canvas');
		canvas.setAttribute("id","canvas")
		canvas.style.cssText = "border:1px solid #00cc00"
		this.width = canvas.width;
		this.height = canvas.height;
		this.wrapper.appendChild( canvas )
		this.canvas = canvas;
		this.fpsCanvas = canvas.getContext('2d');

		
		console.log("状态模块", this.wrapper, this.width,this.height)

		this.times = []; // 存储当前的时间数组
		this.fps = 0;
		this.updateFps();
		this.fpsIdx = 0;
		let inter = setInterval(_=>{
			let ctx = this.fpsCanvas, fps = this.fps;
			ctx.drawImage( this.canvas,1,0 )
			ctx.clearRect(0,0,this.width, this.height)
			ctx.save()
			ctx.fillStyle="#FF0000";
			let val = Math.floor(Math.random()*20)+20
			ctx.fillRect(0, val, 10, 10);
			ctx.fill()
			ctx.restore();
			
			//ctx.restore();
			if( this.fpsIdx > this.width ){
				console.log('end')
				//clearInterval( inter )

				//ctx.translate(10,0);
			}
			//clearInterval( inter )
			this.fpsIdx +=1;
		},1000)
	}

	updateFps(){
		let times = this.times;
		let fps = this.fps;
		
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