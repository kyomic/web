export var MediaEvent = {
	// fired before MediaSource is attaching to media element - data: { media }
    MEDIA_ATTACHING: 'hlsMediaAttaching',
    // fired when MediaSource has been succesfully attached to media element - data: { }
    MEDIA_ATTACHED: 'hlsMediaAttached',
    // fired before detaching MediaSource from media element - data: { }
    MEDIA_DETACHING: 'hlsMediaDetaching',
    // fired when MediaSource has been detached from media element - data: { }
    MEDIA_DETACHED: 'hlsMediaDetached'
}

