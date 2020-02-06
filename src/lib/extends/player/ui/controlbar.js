import utils from '@/lib/core/utils';
import dom from '@/lib/core/dom';
import Icon from './Icon'


function createButton( name, html ){
	let btn = document.createElement('div');
	btn.className = 'kwp-button kwp-button-' + name;
	btn.innerHTML = html;
	return btn;
}

class ControlBar{
	constructor( player ){
		this.player = player;
		this.initialize();
	}

	initialize(){
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'kwp-controlbar';
		var wrap = dom.query(".kwp-control", this.player.wrapper);
		wrap.appendChild( this.wrapper );

		this.uis = {};
		
		this.evtOnDragMove = this.onDragMove.bind( this );
		this.evtOnDragUp = this.onDragUp.bind( this );
		this.evtOnPlayerEvent = this.onPlayerEvent.bind( this );
		this.drawProgresss();
		this.drawButtons();
		this.attachEvent();
	}

	_updateProgressByClientX( clientX ){
		clientX -=6;
		let dot = this.uis["progress-dot"];
		
		let offset = dom.offset( this.uiProgress )
		//xpos
		let xpos = clientX - offset.left;
		let width = this.uiProgress.offsetWidth;
		xpos = Math.max(0,xpos);
		xpos = Math.min(width-12,xpos);
		let percent = (xpos + 12) / (width) * 100;

		dom.setStyle( dot, {left: xpos+"px"})
		dom.setStyle( this.uis["progress-play"], {width: (xpos+6)+"px"});
	}

	attachEvent(){
		this.uis['play'].addEventListener('click',e=>{
			this.player.play();
		});
		this.uis['pause'].addEventListener('click',e=>{
			this.player.pause();
		});

		this.uiProgress.addEventListener( 'mousedown', e=>{
			this._updateProgressByClientX( e.clientX );
		});
		this.uis["progress-dot"].addEventListener('mousedown', e=>{
			dom.addClass( this.uiProgress, 'kwp-progress-active');
			document.addEventListener('mousemove', this.evtOnDragMove );
			document.addEventListener('mouseup', this.evtOnDragUp );
		})
		this.player.on('loadedmetadata', this.evtOnPlayerEvent );
		this.player.on('timeupdate', this.evtOnPlayerEvent );

	}

	onPlayerEvent( e ){
		//console.log('onPlayerEvent', e)
		switch( e.type ){
			case 'timeupdate':
			case 'loadedmetadata':
				let time = utils.time( this.player.currentTime );
				let duration = utils.time( this.player.duration );
				this.uis['time'].innerHTML = [time,duration].join('/');
				break;
		}
	}
	onDragMove(e){
		this._updateProgressByClientX( e.clientX );
	}
	onDragUp(){
		dom.removeClass( this.uiProgress, 'kwp-progress-active');
		document.removeEventListener('mousemove', this.evtOnDragMove );
		document.removeEventListener('mouseup', this.evtOnDragUp );
	}

	drawProgresss(){
		let progress = dom.create('div',{},'kwp-progress');
		this.wrapper.appendChild( progress );

		this.uiProgress = progress;
		this.uis["progress-track"] = dom.create('div',{},'kwp-progress-track');
		this.uis["progress-play"] = dom.create('div',{},'kwp-progress-play');
		this.uis["progress-load"] = dom.create('div',{},'kwp-progress-load');
		
		this.uis["progress-dot"] = dom.create('div',{},'kwp-progress-dot');

		progress.appendChild( this.uis["progress-track"] )
		progress.appendChild( this.uis["progress-load"] )
		progress.appendChild( this.uis["progress-play"] )
		progress.appendChild( this.uis["progress-dot"] )
	}
	drawButtons(){
		
		this.uis['play']  = createButton('play', Icon('play'));
		this.uis['pause'] = createButton('pause', Icon('pause'));

		let time = utils.time( this.player.currentTime );
		let duration = utils.time( this.player.duration );
		this.uis['time'] = createButton('time', [time,duration].join('/'));
		
		this.wrapper.appendChild( this.uis['play'])
		this.wrapper.appendChild( this.uis['pause'])
		this.wrapper.appendChild( this.uis['time'])
	}

}

export default ControlBar;