import utils from '@/lib/core/utils';
import dom from '@/lib/core/dom';
import fullScreen from '@/lib/core/fullscreen';
import Icon from './Icon'


function createButton( name, html ){
	let btn = document.createElement('div');
	btn.className = 'kwp-button kwp-button-' + name;
	btn.innerHTML = html;
	return btn;
}

class ControlBar{
	constructor( player ){
		console.log("控制条bind:", player)
		this.player = player;
		this.initialize();
	}

	initialize(){		
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'kwp-controlbar';
		var wrap = dom.query(".kwp-control", this.player.wrapper);
		wrap.appendChild( this.wrapper );

		this.isVV = false;
		this.draggingBar = false;
		this.uis = {};
		this.width = this.wrapper.offsetWidth;
		this.evtOnDragMove = this.onDragMove.bind( this );
		this.evtOnDragUp = this.onDragUp.bind( this );
		this.evtOnPlayerEvent = this.onPlayerEvent.bind( this );
		this.drawProgresss();
		this.drawButtons();
		this.attachEvent();
		this._updatePlayPauseState();
	}

	_updateProgressTipByClientX( clientX ){
		let dot = this.uis["progress-dot"];		
		let offset = dom.offset( this.uiProgress );
		//xpos
		let xpos = clientX - offset.left;
	}
	/** 
	 * 通过鼠标位置更新媒体播放头位置
	 */

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
		this.player.currentTime = xpos / width * this.player.duration;
	}

	/** 
	 * 通过媒体的时间更新进度条位置
	 */
	_updateProgressByVideoCurrentTime(){
		let percent = this.player.currentTime / this.player.duration;
		let width = this.uiProgress.offsetWidth;
		let xpos = width * percent;
		let time = utils.time( this.player.currentTime );
		let duration = utils.time( this.player.duration );
		this.uis['time'].innerHTML = [time,duration].join('/');
		//进度条位置修正
		if( xpos >= this.uiProgress.offsetWidth - 24 ){
			xpos = this.uiProgress.offsetWidth * percent;			
		}
		let dotpos = xpos - 6;
		if( dotpos > width -12 ){
			dotpos = width -12;
		}
		if( dotpos <0 ) dotpos = 0;
		dom.setStyle( this.uis["progress-play"], {width:xpos+"px"})
		dom.setStyle( this.uis["progress-dot"],  {left: dotpos + "px"})
		
	}

	_updatePlayPauseState(){
		dom.setStyle( this.uis["play"], {'display':'none'})
		dom.setStyle( this.uis["pause"], {'display':'none'})
		console.log("paused....", this.player.paused)
		if( this.player.paused ){
			dom.setStyle( this.uis["play"], {'display':'inline-block'})
		}else{
			dom.setStyle( this.uis["pause"], {'display':'inline-block'})
		}
	}

	/** 展示控制条，并定时关闭**/
	_showControlBar( show = true ){
		return

		if( this.draggingBar ) return;
		if( this.controlbarTimeoutId ){
			clearTimeout( this.controlbarTimeoutId );
		}
		if( show ){
			dom.setStyle( this.wrapper, {top:"-64px"})
			this.controlbarTimeoutId = setTimeout( _=>{
				dom.setStyle( this.wrapper, {top:"-21px"})
			},5000)
		}else{
			dom.setStyle( this.wrapper, {top:"-21px"})
		}
	}

	attachEvent(){
		this.uis['play'].addEventListener('click',e=>{
			this.player.play();
			this._updatePlayPauseState();
		});
		this.uis['pause'].addEventListener('click',e=>{
			this.player.pause();
			this._updatePlayPauseState();
		});

		this.uiProgress.addEventListener( 'mousedown', e=>{
			this._updateProgressByClientX( e.clientX );
		});
		this.uiProgress.addEventListener( 'mousemove', e=>{
			this._updateProgressTipByClientX( e.clientX );
		})
		this.uis["progress-dot"].addEventListener('mousedown', e=>{
			dom.addClass( this.uiProgress, 'kwp-progress-active');
			clearTimeout( this.controlbarTimeoutId );
			document.addEventListener('mousemove', this.evtOnDragMove );
			document.addEventListener('mouseup', this.evtOnDragUp );
		})



        /*
        $(this.video).on('webkitbeginfullscreen webkitendfullscreen', function(e){
			//video全屏时，player也为screennormal状态，视觉效果更好
			self.screenNormal(1);
		})
		*/


		this.uis["full"].addEventListener('click',e=>{
			this.player.toggleFullScreen();
		})

		this.player.on('playstatechange', this.evtOnPlayerEvent );
		this.player.on('loadedmetadata', this.evtOnPlayerEvent );
		this.player.on('timeupdate', this.evtOnPlayerEvent );
		this.player.on('playing', this.evtOnPlayerEvent );
		this.player.on('fullscreen', this.evtOnPlayerEvent );

		this.player.wrapper.addEventListener('mousemove', e=>{
			this._showControlBar();
		})
		this.player.wrapper.addEventListener('mouseenter', e=>{
			console.log('enter.......')
			this._showControlBar();
		})
		this.player.wrapper.addEventListener('mouseleave', e=>{
			this._showControlBar();
		})
		setInterval(_=>{
			let bufferTime =this.player.bufferredTime;
			let duration = this.player.duration;
			let w = this.width * bufferTime / duration;
			dom.setStyle( this.uis["progress-load"], {width:w+"px"})
		},200)

	}

	onPlayerEvent( e ){
		console.log('onPlayerEvent', e)
		switch( e.type ){
			case 'timeupdate':
			case 'loadedmetadata':
				this._updateProgressByVideoCurrentTime();
				break;
			case 'playstatechange':
				this._updatePlayPauseState();
				break;
			case 'fullscreen':
				//全屏事件监听
				dom.setStyle( this.uis["full-in"], {display:'none'});
        		dom.setStyle( this.uis["full-out"], {display:'none'});
        		if ( e.fullscreen ) {
                    dom.setStyle( this.uis["full-in"], {display:'block'});
                } else {
                    dom.setStyle( this.uis["full-out"], {display:'block'});
                }		        
				break;
			case 'playing':
				if( !this.isVV ){
					this._showControlBar();
					this.isVV = true;
				}
				
				break;
		}
	}
	onDragMove(e){
		this.draggingBar = true;
		this._updateProgressByClientX( e.clientX );
	}
	onDragUp(){
		this.draggingBar = false;
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
		let buttons = dom.create('div',{},'kwp-buttons');
		this.wrapper.appendChild( buttons )
		this.uis['play']  = createButton('play', Icon('play'));
		this.uis['pause'] = createButton('pause', Icon('pause'));

		let time = utils.time( this.player.currentTime );
		let duration = utils.time( this.player.duration );
		this.uis['time'] = createButton('time', [time,duration].join('/'));
		

		this.containerR = dom.create('div',{},'btn-group-r');
		buttons.appendChild( this.containerR );
		buttons.appendChild( this.uis['play'])
		buttons.appendChild( this.uis['pause'])
		buttons.appendChild( this.uis['time'])

		this.uis['full'] = createButton('full', Icon('full'));

		this.uis['volume'] = dom.create('div',{},'kwp-button btn-state kwp-button-volume');
		this.uis['volume-mute'] = createButton('mute', Icon('volume-off'))
		this.uis['volume-normal'] = createButton('normal', Icon('volume-down'))
		this.uis['volume-max'] = createButton('max', Icon('volume-up'))
		this.uis['volume'].appendChild( this.uis['volume-mute'] )
		this.uis['volume'].appendChild( this.uis['volume-normal'] )
		this.uis['volume'].appendChild( this.uis['volume-max'] )
		//volume
		let volPanel = dom.create('div',{},'panel panel-volume');		
		this.drawVolumeBar( volPanel )
		this.uis['volume'].appendChild( volPanel )
		this._registerPopup( this.uis['volume'], volPanel );

		let onVolumeClick = (e)=>{
			this.player.muted = !this.player.muted;
			this._updateVolumeState();
			this._updateVolumePosition();
		}
		this.uis['volume-mute'].addEventListener('mousedown',onVolumeClick)
		this.uis['volume-normal'].addEventListener('mousedown',onVolumeClick)
		this.uis['volume-max'].addEventListener('mousedown',onVolumeClick)

		this.uis['setting'] = createButton('setting', Icon('setting'))

		this.uis['full'] = dom.create('div',{},'kwp-button btn-state kwp-button-full');
		this.uis['full-out'] = createButton('fullout', Icon('full'))
		this.uis['full-in'] = createButton('fullin', Icon('full-in'))
		dom.setStyle( this.uis['full-in'],{display:'none'})
		this.uis['full'].appendChild( this.uis['full-out'] )
		this.uis['full'].appendChild( this.uis['full-in'] )

		this.containerR.appendChild( this.uis['volume'])
		this.containerR.appendChild( this.uis['setting'])
		this.containerR.appendChild( this.uis['full'])
	}

	drawVolumeBar( wrap ){
		let track = dom.create('div',{},'track');
		let bar = dom.create('div',{},'bar', '<i class="tip"></i>');
		wrap.appendChild(track);
		wrap.appendChild(bar);

		
		let self = this;
		let offsetY = 0;
		let onMouseMove = (e)=>{		
			self._updateVolumePosByClientY( e.clientY, offsetY );
		}
		let onMouseUp = (e)=>{
			document.removeEventListener('mousemove', onMouseMove )
			document.removeEventListener('mouseup', onMouseMove )
			dom.removeClass(bar,'bar-active');
		}
		bar.addEventListener('mousedown', e=>{
			offsetY = e.offsetY;
			dom.addClass(bar,'bar-active');
			document.addEventListener('mousemove', onMouseMove )
			document.addEventListener('mouseup', onMouseUp )
		})
		track.addEventListener('mousedown', e=>{
			self._updateVolumePosByClientY( e.clientY, 10 );
		})
	}

	_updateVolumePosByClientY( clientY, offsetY ){
		var track = dom.query(".panel-volume .track", this.wrapper );
		var bar = dom.query(".panel-volume .bar", this.wrapper );
		if( track && bar ){
			let tip = dom.query('.tip',bar)

			let offset = dom.offset( track );
			let offy = clientY - offset.top + offsetY;
			let fix = 10;
			offy = Math.max( fix, offy);
			offy = Math.min( track.offsetHeight - bar.offsetHeight + fix, offy );
			let percent = 100-Math.floor( (offy - fix)/(track.offsetHeight-bar.offsetHeight) * 100)
			tip.innerHTML = percent +"%";
			dom.setStyle( bar, {'top': offy + 'px'})
			this.player.volume = percent /100;
			this._updateVolumeState();
		}
	}

	_updateVolumeState(){
		let v = this.player.volume;
		dom.setStyle( this.uis["volume-mute"],{display:'none'});
		dom.setStyle( this.uis["volume-normal"],{display:'none'});
		dom.setStyle( this.uis["volume-max"],{display:'none'});
		if( v <=0 || this.player.muted ){
			dom.setStyle( this.uis["volume-mute"],{display:'block'});
		}else if( v >=1 ){
			dom.setStyle( this.uis["volume-max"],{display:'block'});
		}else{
			dom.setStyle( this.uis["volume-normal"],{display:'block'});
		}
	}

	//通过音量更新声音坐标
	_updateVolumePosition(){
		let percent = this.player.volume;
		console.log("ppppppppppppp",percent)
		if( this.player.muted ) percent = 0;
		var track = dom.query(".panel-volume .track", this.wrapper );
		var bar = dom.query(".panel-volume .bar", this.wrapper );
		if( track && bar ){			
			let fix = 10;
			let top = (track.offsetHeight-bar.offsetHeight) * (1-percent) + fix;
			console.log('top=====',top)
			dom.setStyle( bar, {'top':top+'px'});
		}
	}
	_registerPopup( target ,panel ){
		let timeoutid = 0;
		let isInit = false;
		let show = ()=>{			
			clearTimeout(timeoutid)
			dom.setStyle( panel, {'display':'block'})
			if( !isInit ){
				let height = panel.offsetHeight;
				let left = target.offsetWidth/2 - panel.offsetWidth/2;
				dom.setStyle( panel, {'top': (-height-20)+'px', 'left':left+'px'})
				isInit = true;
			}
		}
		let hide = ()=>{
			clearTimeout(timeoutid)
			timeoutid = setTimeout(_=>{
				dom.setStyle( panel, {'display':'none'})
			},800)
		}
		target.addEventListener('mouseover', e=>{
			show();
		})
		target.addEventListener('mouseout', e=>{
			hide();
		})
		panel.addEventListener('mouseenter', e=>{
			show();
		})
		panel.addEventListener('mouseleave', e=>{
			hide();
		})
	}


}

export default ControlBar;