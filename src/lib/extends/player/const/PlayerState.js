export const PlayerState = {
    /**
     * 等待中状态
     * @member
     */
	PENDING:0,
	IDLE:0, //闲置
	PLAYING:1, //正在播放
	PAUSE:2, //暂停中
	STOPED:3, //播放停止
	PRELOADING:5 //预加载
};

export const BufferState = {
	BUFFER_EMPTY:0, //缓冲区为空
	BUFFERING:1, //正在缓冲
	BUFFER_FULL:2  // 缓冲区满
}
