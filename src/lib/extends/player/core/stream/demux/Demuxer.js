import DemuxerInline from './DemuxerInline';
class Demuxer{
	constructor( observer ){
		this.demuxer = new DemuxerInline( observer );
	}
	push(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration) {
		if (! this.demuxer) {            
            this.demuxer = new DemuxerInline();
        }
        this.demuxer.push(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration);
	}
}

export default Demuxer;
export {
	Demuxer
}