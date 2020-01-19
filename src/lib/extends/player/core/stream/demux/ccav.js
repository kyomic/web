/*
*
*/

//鍥炬爣璺緞
var playerContorlsImgDir = "//player.cntv.cn/html5Player/images/20190905/";
//var playerContorlsImgDir = "img/";
var liveEpgJsonList = null;

function createAdCallsLiveHls(paras) {
    var video = document.getElementById("h5player_" + paras.divId);
    livePlayerObjs[paras.divId].isNoError = true;
    livePlayerObjs[paras.divId].errorTimer = null;
    livePlayerObjs[paras.divId].adCallsVideo.hls = new Hls();
    livePlayerObjs[paras.divId].startCreatHls = true;

    livePlayerObjs[paras.divId].adCallsVideo.hls.config.maxBufferSize = 40 * 1000 * 1000;
    //livePlayerObjs[paras.divId].video.hls.startLevel = 3;
    livePlayerObjs[paras.divId].adCallsVideo.hls.startLevel = -1;
    //-1琛ㄧず鑷€傚簲鐮佺巼
    // bind them together
    livePlayerObjs[paras.divId].adCallsVideo.hls.attachMedia(video);

    livePlayerObjs[paras.divId].adCallsVideo.hls.on(Hls.Events.MEDIA_ATTACHED, function() {
        livePlayerObjs[paras.divId].adCallsVideo.hls.loadSource(livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].hlsUrl);
    });

    livePlayerObjs[paras.divId].adCallsVideo.hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
        //console.log("manifest loaded, found " + data.levels.length + " quality level");
        //livePlayerObjs[paras.divId].adCallsVideo.hls.startLevel = getStartLevel(data.levels, livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].defaultStream);
        //video.play();

        livePlayerObjs[paras.divId].isNoError = true;

        var videoPlay = video.play();

        if (videoPlay) {
            videoPlay.then(()=>{}
            ).catch((err)=>{

                video.muted = true;
                if (document.getElementById("soundbtn_" + paras.divId)) {
                    document.getElementById("soundbtn_sound_" + paras.divId).style.display = "none";
                    document.getElementById("soundbtn_mute_" + paras.divId).style.display = "block";
                }
                video.play();

            }
            );
        }

        if (!document.getElementById("adcalls_bar_" + paras.divId)) {
            new AdCallsLiveBar(paras);

        } else {
            document.getElementById("adcalls_bar_" + paras.divId).setAttribute("adUrl", livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].clickUrl);
            //document.getElementById("adtitle_"+paras.divId).innerHTML = "<span>" + livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].title +"</span>";
        }

    });

    livePlayerObjs[paras.divId].adCallsVideo.hls.on(Hls.Events.FRAG_PARSED, function(event, data) {

        livePlayerObjs[paras.divId].isNoError = true;
        clearTimeout(livePlayerObjs[paras.divId].errorTimer);
        livePlayerObjs[paras.divId].errorTimer = null;

        //解决部分设备直播和时移第一个画面闪一下问题
        if (!isIPad() && video.style.visibility === "hidden") {
            setTimeout(function() {
                video.style.visibility = "visible";
            }, 500);
        }

    });

    livePlayerObjs[paras.divId].adCallsVideo.hls.on(Hls.Events.ERROR, function(event, data) {
        livePlayerObjs[paras.divId].isNoError = false;

        if (!document.getElementById("adcalls_bar_" + paras.divId)) {
            new AdCallsLiveBar(paras);

        } else {
            document.getElementById("adcalls_bar_" + paras.divId).setAttribute("adUrl", livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].clickUrl);
            //document.getElementById("adtitle_"+paras.divId).innerHTML = "<span>" + livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].title +"</span>";
        }

        if (livePlayerObjs[paras.divId].errorTimer === null) {
            let playerCurrent = 0;
            let thisDurition = parseInt(livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].duration);
            thisDurition = thisDurition ? thisDurition : 15;
            let timerSec = thisDurition;
            let videoCurrentTime = parseInt(video.currentTime);
            if (videoCurrentTime) {
                timerSec = timerSec - videoCurrentTime;
            }
            if (!timerSec || timerSec < 3) {
                timerSec = 3;
            } else {
                timerSec = 6;
            }

            timerSec = parseInt(timerSec) * 1000;

            livePlayerObjs[paras.divId].errorTimer = setTimeout(function() {
                livePlayerObjs[paras.divId].errorTimer = null;

                if (!livePlayerObjs[paras.divId].isNoError) {
                    playNextLiveAdCalls(paras);

                    let ticktackTimeTag = document.getElementById("ticktack_time_" + paras.divId);
                    let remainingTime = 0;

                    let adTotal = livePlayerObjs.adCallsAPI.length;

                    let num = livePlayerObjs.adCallsPlayingNum;

                    if (num < adTotal) {

                        remainingTime = thisDurition * (adTotal - num);

                        remainingTime = parseInt(remainingTime);
                        ticktackTimeTag.innerText = remainingTime;
                    }
                }

            }, timerSec);
        }

        if (data.fatal) {

            switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                // try to recover network error
                console.log("fatal network error encountered, try to recover");
                livePlayerObjs[paras.divId].adCallsVideo.hls.startLoad();
                break;
            case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("fatal media error encountered, try to recover");
                livePlayerObjs[paras.divId].adCallsVideo.hls.recoverMediaError();
                break;
            default:
                // cannot recover
                //livePlayerObjs[paras.divId].adCallsVideo.hls.destroy();
                //playNextLiveAdCalls(paras);
                break;
            }

        }
    });
}

class AdCallsLiveBar {
    constructor(paras) {
        this.adCallsBar = null;
        this.initAdCallsUi(paras);
        this.initEvents(paras.divId);
    }

    initAdCallsUi(paras) {
        this.adCallsBar = document.createElement("div");
        this.adCallsBar.setAttribute("id", "adcalls_bar_" + paras.divId);

        this.adCallsBar.style.cssText = "position:absolute;width:100%;height:100%;top:0px;left:0px;background:rgba(255,255,255,0);cursor:pointer;z-index:9;";
        document.getElementById(paras.divId).appendChild(this.adCallsBar);

        this.adCallsBar.setAttribute("adUrl", livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].clickUrl);
        this.adCallsBar.addEventListener("click", function() {
            if (event.target === this) {
                let adUrl = this.getAttribute("adUrl");
                if (adUrl && adUrl.length > 2) {
                    window.open(adUrl, "_blank");
                }

            }

        }, false);

        this.ticktack(paras.divId);
        //显示倒计时

        this.soundBtn(paras.divId);
        //显示声音喇叭

        //this.adSlogon(paras.divId);  //显示广告字样

        //this.adTitle(paras.divId);  //显示广告字样

        this.knowMore(paras.divId);
        //显示广告字样

        //this.fullscreen(paras.divId);  //全屏按钮
    }

    initEvents(divId) {
    }

    ticktack(divId) {
        let adTotal = livePlayerObjs.adCallsAPI.length;
        let num = livePlayerObjs.adCallsPlayingNum;
        let thisDuration = 15;

        let remainingTime = adTotal * livePlayerObjs.adCallsAPI[num].duration;

        let htmls = `             
                <div id="ticktack_${divId}" style="position:absolute;top:10px;right:70px;padding:3px 8px;height:20px;font-size:14px;background-color:rgba(60,60,60,0.5);border-radius:3px;cursor:default;">
                    <span style="color:rgb(255,255,255);margin-left:2px">广告剩余</span><span id="ticktack_time_${divId}" style="color:rgb(253,36,0);font-size:16px;">${remainingTime}</span><span style="color:rgb(255,255,255);margin-left:2px">秒</span>
                </div>   
        `;

        this.adCallsBar.insertAdjacentHTML("afterBegin", htmls);

        let player = document.getElementById("h5player_" + divId);
        let ticktackTimeTag = document.getElementById("ticktack_time_" + divId);

        livePlayerObjs[divId].adCallsRemainingTimer = setInterval(function() {
            if (!player.paused) {
                num = livePlayerObjs.adCallsPlayingNum ? livePlayerObjs.adCallsPlayingNum : 0;
                thisDuration = livePlayerObjs.adCallsAPI[num].duration ? livePlayerObjs.adCallsAPI[num].duration : 15;
                if (num < adTotal) {
                    remainingTime = parseFloat(thisDuration) * (adTotal - num) - parseFloat(player.currentTime);
                    remainingTime = parseInt(remainingTime);
                    ticktackTimeTag.innerText = remainingTime;

                    if (typeof livePlayerObjs.adCallsAPI[num].monitorTime !== "undefined" && livePlayerObjs.adCallsAPI[num].monitorTime && parseInt(livePlayerObjs.adCallsAPI[num].monitorTime) - parseInt(player.currentTime) == 0) {
                        if (typeof livePlayerObjs.adCallsAPI[num].middlecount === "string" && livePlayerObjs.adCallsAPI[num].middlecount.indexOf("http") !== -1) {
                            getApiByImage(livePlayerObjs.adCallsAPI[num].middlecount);
                        }
                    }

                } else {
                    clearInterval(livePlayerObjs[divId].adCallsRemainingTimer);
                }

            }

        }, 1000);

    }

    soundBtn(divId) {
        let soundBtnDisplay = "";
        let muteBtnDisplay = "";
        let player = document.getElementById("h5player_" + divId);
        if (player.muted) {
            soundBtnDisplay = "display:none;";
            muteBtnDisplay = "display:block;"
        } else {
            soundBtnDisplay = "display:block;";
            muteBtnDisplay = "display:none;"
        }

        let htmls = `             
                <div id="soundbtn_${divId}" style="position:absolute;top:10px;right:20px;padding:3px 8px;height:20px;cursor:pointer;z-index:30;">
                    <img id="soundbtn_sound_${divId}" title="点击静音" src="${playerContorlsImgDir}sound_yes_mouseover.png" style="width:22px;height:22px;${soundBtnDisplay}">
                    <img id="soundbtn_mute_${divId}" title="开启声音" src="${playerContorlsImgDir}sound_mute_mouseover.png" style="width:22px;height:22px;${muteBtnDisplay}">
                </div>   
        `;
        this.adCallsBar.insertAdjacentHTML("afterBegin", htmls);

        document.getElementById("soundbtn_" + divId).addEventListener("click", function() {
            event.preventDefault();
            let soundBtn = document.getElementById("soundbtn_" + divId);
            let soundImg = document.getElementById("soundbtn_sound_" + divId);
            let muteImg = document.getElementById("soundbtn_mute_" + divId);
            if (player.muted) {

                player.volume = 0.5;
                player.muted = false;
                muteImg.style.display = "none";
                soundImg.style.display = "block";
            } else {
                player.muted = true;
                soundImg.style.display = "none";
                muteImg.style.display = "block";
            }
        }, false);
    }

    adSlogon(divId) {
        let htmls = `             
                <div id="ticktack_${divId}" style="position:absolute;bottom:10px;left:20px;padding:3px 8px;height:20px;font-size:14px;background-color:rgba(200,200,200,0.8);border-radius:3px;cursor:default;">
                    <span>广告</span>
                </div>   
        `;

        this.adCallsBar.insertAdjacentHTML("afterBegin", htmls);
    }

    adTitle(divId) {
        let title = livePlayerObjs.adCallsAPI[livePlayerObjs.adCallsPlayingNum].title;
        let htmls = `             
                <div id="adtitle_${divId}" style="position:absolute;bottom:10px;left:70px;padding:3px 8px;height:20px;font-size:14px;background-color:rgba(200,200,200,0.8);border-radius:3px;cursor:default;">
                    <span>${title}</span>
                </div>   
        `;

        this.adCallsBar.insertAdjacentHTML("afterBegin", htmls);
    }

    knowMore(divId) {
        let htmls = `             
                <div id="knowmore_${divId}" style="position:absolute;bottom:10px;right:20px;padding:3px 8px;height:20px;font-size:14px;color:rgb(255,255,255);background-color:rgba(72,128,230,0.8);border-radius:3px;z-index:30;">
                    <span>详情点击>></span>
                </div>   
        `;

        this.adCallsBar.insertAdjacentHTML("afterBegin", htmls);

        document.getElementById("knowmore_" + divId).addEventListener("click", function() {
            let adUrl = document.getElementById("adcalls_bar_" + divId).getAttribute("adUrl");
            if (adUrl && adUrl.length > 2) {
                window.open(adUrl, "_blank");
            }

        }, false);
    }

    fullscreen(divId) {
        new LiveFullscreenBtn(divId,20,true);

    }

}

//暂停广告
class LiveAdPause {
    constructor(paras) {
        livePlayerObjs[paras.divId].adPauseNum = 0;
        this.initUi(paras);
        this.initEvents(paras);
    }

    initUi(paras) {
        let clickUrl = "";

        let htmls = `
                <div id="adpause_${paras.divId}" style="position:absolute;width:300px;height:250px;font-size:14px;margin:0 auto;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:#FFF;background-color:#000;z-index:99;display:none;">
                
                    <div style="position:absolute;top:0px;right:0px;width:100%;height:100%;cursor:pointer;">
                        <img id="adpause_img_${paras.divId}" adUrl="" src="" style="width:100%;height:100%;text-align:center;">
                    </div>
                
                             
                    <div id="adpause_close_${paras.divId}" style="position:absolute;top:5px;right:5px;width:22px;height:22px;font-size:14px;background-color:#000;border-radius:3px;cursor:pointer;z-index:999;">
                        <img src="${playerContorlsImgDir}close_player.png" title="关闭" style="width:12px;height:12px;padding:5px;text-align:center;">
                    </div>
                    
                    <div style="position:absolute;left:5px;bottom:5px;width:auto;height:22px;background-color:#000;border-radius:3px;cursor:default;z-index:999;">
                        <div style="padding:4px 5px;line-height:14px;">广告</div>
                    </div>
                </div>   
        `;

        document.getElementById(paras.divId).insertAdjacentHTML("afterBegin", htmls);

        this.adPauseShowOrHide(paras, "show");

    }

    initEvents(paras) {
        let imgTag = document.getElementById("adpause_img_" + paras.divId);
        imgTag.addEventListener("click", this.adPauseByClick.bind(null, paras), false);

        let closeBtn = document.getElementById("adpause_close_" + paras.divId);
        closeBtn.addEventListener("mouseover", this.adPauseCloseByMouseover.bind(null, paras), false);
        closeBtn.addEventListener("mouseout", this.adPauseCloseByMouseout.bind(null, paras), false);
        closeBtn.addEventListener("click", this.adPauseShowOrHide.bind(null, paras, "hide"), false);

    }

    adPauseCloseByMouseover(paras) {
        let closeBtn = document.getElementById("adpause_close_" + paras.divId);
        closeBtn.style.backgroundColor = "#bf0614";
    }

    adPauseCloseByMouseout(paras) {
        let closeBtn = document.getElementById("adpause_close_" + paras.divId);
        closeBtn.style.backgroundColor = "#000";
    }

    adPauseByClick(paras) {
        let adUrl = document.getElementById("adpause_img_" + paras.divId).getAttribute("adUrl");

        if (adUrl && adUrl.length > 2) {
            window.open(adUrl, "_blank");
        }
    }

    adPauseShowOrHide(paras, type) {
        let adPauseContainer = document.getElementById("adpause_" + paras.divId);
        let imgTag = document.getElementById("adpause_img_" + paras.divId);
        livePlayerObjs[paras.divId].adPauseNum = 0;
        livePlayerObjs.adPauseAPI = "";

        if (adPauseContainer) {
            if (type === "show") {
                //adCause
                LiveAdPause.prototype.getAdpauseByJsonFromUrl(LiveAdPause.prototype.parseLiveAdPauseDataFromApi, "LiveAdPause.prototype.parseLiveAdPauseDataFromApi", paras);

            } else {
                if (adPauseContainer.style.display === "none") {
                    return;
                }

                adPauseContainer.style.display = "none";

            }
        }
    }

    getAdpauseByJsonFromUrl(cb, cbToStr, paras) {

        let adPauseUrl = livePlayerObjs[paras.divId].adPause;
        if (adPauseUrl.indexOf("?") > 0) {
            adPauseUrl += "&cb=" + cbToStr;
        } else {
            adPauseUrl += "?cb=" + cbToStr;
        }

        LazyLoad.js(adPauseUrl, function() {
            setTimeout(function() {
                cb(livePlayerObjs[paras.divId], paras);
            }, 50);
        });
    }

    //adPause
    parseLiveAdPauseDataFromApi(data) {

        if (data && !data.divId) {
            var len = 0;
            if (Array.isArray(data)) {
                len = data.length;
            }

            livePlayerObjs.adPauseAPI = [];
            for (var i = 0; i < len; i++) {
                if (data[i].url && (data[i].url.indexOf(".mp4") > 0 || data[i].url.indexOf(".m3u8") > 0)) {
                    continue;
                }
                if (data[i].url) {
                    livePlayerObjs.adPauseAPI[i] = {};
                    livePlayerObjs.adPauseAPI[i].url = data[i].url;
                    livePlayerObjs.adPauseAPI[i].clickUrl = data[i].clickUrl;

                    livePlayerObjs.adPauseAPI[i].eventExposure = data[i].eventExposure;
                    livePlayerObjs.adPauseAPI[i].eventExposure1 = data[i].eventExposure1;
                }
            }

            if (Array.isArray(livePlayerObjs.adPauseAPI) && livePlayerObjs.adPauseAPI.length < 1) {
                livePlayerObjs.adPauseAPI = "";
            }
        } else if (Array.isArray(livePlayerObjs.adPauseAPI) && livePlayerObjs.adPauseAPI.length > 0) {
            livePlayerObjs[data.divId].adPauseIsShow = true;

            var adPauseContainer = document.getElementById("adpause_" + data.divId);
            if (adPauseContainer) {
                let paras = data;

                let num = livePlayerObjs[paras.divId].adPauseNum;

                let imgTag = document.getElementById("adpause_img_" + paras.divId);

                if (imgTag) {
                    if (livePlayerObjs.adPauseAPI[num].clickUrl) {
                        imgTag.setAttribute("adUrl", livePlayerObjs.adPauseAPI[num].clickUrl);
                    } else {
                        imgTag.setAttribute("adUrl", "");
                    }

                    imgTag.setAttribute("src", livePlayerObjs.adPauseAPI[num].url);

                    adPauseContainer.style.display = "block";

                    if (typeof livePlayerObjs.adPauseAPI[num].eventExposure === "string" && livePlayerObjs.adPauseAPI[num].eventExposure.indexOf("http") !== -1) {
                        getApiByImage(livePlayerObjs.adPauseAPI[num].eventExposure);
                    }

                    if (typeof livePlayerObjs.adPauseAPI[num].eventExposure1 === "string" && livePlayerObjs.adPauseAPI[num].eventExposure1.indexOf("http") !== -1) {
                        getApiByImage(livePlayerObjs.adPauseAPI[num].eventExposure1);
                    }

                }

            }

        } else {
            livePlayerObjs.adPauseAPI = "";
            livePlayerObjs[data.divId].adPauseIsShow = false;

            var adPauseContainer = document.getElementById("adpause_" + data.divId);
            if (adPauseContainer) {
                adPauseContainer.style.display = "none";
            }
        }
    }

}

//banner广告
class LiveAdBanner {
    constructor(paras) {
        livePlayerObjs[paras.divId].adBannerNum = 0;
        this.initUi(paras);
        this.initEvents(paras);
    }

    initUi(paras) {
        let clickUrl = "";

        let maxWidth = document.getElementById(paras.divId).offsetWidth;
        let adBannerWidth = 660;
        let adBannerHeight = 90;
        let whenAfter = 60;
        //60秒后自动显示banner广告,消失后，120秒后显示第2次，以后再不显示。

        if (adBannerWidth - maxWidth > 0) {
            adBannerWidth = maxWidth;
        }

        let htmls = `
                <div id="adbanner_${paras.divId}" whenAfter="${whenAfter}" style="position:absolute;width:${adBannerWidth}px;height:${adBannerHeight}px;font-size:14px;margin:0 auto;left:50%;bottom:120px;transform:translateX(-50%);text-align:center;color:#FFF;background-color:#000;z-index:99;display:none;">
                
                    <div style="position:absolute;top:0px;right:0px;width:100%;height:100%;cursor:pointer;">
                        <img id="adbanner_img_${paras.divId}" adUrl="" src="" style="width:100%;height:100%;text-align:center;">
                    </div>
                
                             
                    <div id="adbanner_close_${paras.divId}" style="position:absolute;top:5px;right:5px;width:22px;height:22px;font-size:14px;background-color:#000;border-radius:3px;cursor:pointer;z-index:999;">
                        <img src="${playerContorlsImgDir}close_player.png"  title="关闭" style="width:12px;height:12px;padding:5px;text-align:center;">
                    </div>
                    
                    <div style="position:absolute;left:5px;bottom:5px;width:auto;height:22px;background-color:#000;border-radius:3px;cursor:default;z-index:999;">
                        <div style="padding:4px 5px;line-height:14px;">广告</div>
                    </div>
                </div>   
        `;

        /*
        htmls += `
                <div id="adbanner_open_${paras.divId}" style="position:absolute;width:auto;font-size:10px;margin:0 auto;right:0px;bottom:120px;color:#FFF;background-color:#000;z-index:99;cursor:pointer;border-radius:6px 0 0 6px;">
                    
                        <div style="padding:4px 2px 4px 4px;line-height:10px;">AD</div>
                   
                </div>   
        `;
        */

        document.getElementById(paras.divId).insertAdjacentHTML("afterBegin", htmls);

    }

    initEvents(paras) {
        let imgTag = document.getElementById("adbanner_img_" + paras.divId);
        imgTag.addEventListener("click", this.adBannerByClick.bind(null, paras), false);

        let closeBtn = document.getElementById("adbanner_close_" + paras.divId);
        closeBtn.addEventListener("mouseover", this.adBannerCloseByMouseover.bind(null, paras), false);
        closeBtn.addEventListener("mouseout", this.adBannerCloseByMouseout.bind(null, paras), false);
        closeBtn.addEventListener("click", this.adBannerShowOrHide.bind(null, paras, "hide"), false);

        //打开adBanner
        /*
        let openBtn = document.getElementById("adbanner_open_" + paras.divId);
        openBtn.addEventListener("mouseover", this.adBannerOpenByMouseover.bind(null, paras), false);
        openBtn.addEventListener("mouseout", this.adBannerOpenByMouseout.bind(null, paras), false);
        openBtn.addEventListener("click", this.adBannerShowOrHide.bind(null, paras, "show"), false);
        */

        let adBannerContainer = document.getElementById("adbanner_" + paras.divId);

        LiveAdBanner.prototype.adBannerShowOrHide(paras, "show");
        adBannerContainer.setAttribute("whenAfter", "120");

    }

    adBannerCloseByMouseover(paras) {
        let closeBtn = document.getElementById("adbanner_close_" + paras.divId);
        closeBtn.style.backgroundColor = "#bf0614";
    }

    adBannerCloseByMouseout(paras) {
        let closeBtn = document.getElementById("adbanner_close_" + paras.divId);
        closeBtn.style.backgroundColor = "#000";
    }

    /*
    adBannerOpenByMouseover(paras) {
        let openBtn = document.getElementById("adbanner_open_" + paras.divId);
        openBtn.style.backgroundColor = "#bf0614";
    }

    adBannerOpenByMouseout(paras) {
        let openBtn = document.getElementById("adbanner_open_" + paras.divId);
        openBtn.style.backgroundColor = "#000";
    }
    */

    adBannerByClick(paras) {
        let adUrl = document.getElementById("adbanner_img_" + paras.divId).getAttribute("adUrl");

        if (adUrl && adUrl.length > 2) {
            window.open(adUrl, "_blank");
        }
    }

    adBannerShowOrHide(paras, type) {
        let adBannerContainer = document.getElementById("adbanner_" + paras.divId);
        let imgTag = document.getElementById("adbanner_img_" + paras.divId);
        //let openBtn = document.getElementById("adbanner_open_" + paras.divId);
        if (adBannerContainer) {
            clearTimeout(livePlayerObjs[paras.divId].adBannerTimer);
            if (type === "show") {
                let num = livePlayerObjs[paras.divId].adBannerNum;
                if (livePlayerObjs[paras.divId].adBannerNum - livePlayerObjs.adBannerAPI.length >= 0) {
                    livePlayerObjs[paras.divId].adBannerNum = 0;
                    num = 0;
                }
                if (livePlayerObjs.adBannerAPI[num].clickUrl) {
                    imgTag.setAttribute("adUrl", livePlayerObjs.adBannerAPI[livePlayerObjs[paras.divId].adBannerNum].clickUrl);
                } else {
                    imgTag.setAttribute("adUrl", "");
                }

                imgTag.setAttribute("src", livePlayerObjs.adBannerAPI[num].url);

                let controlBar = document.getElementById("control_bar_" + paras.divId);
                let timeshiftSwitchBtn = document.getElementById("timeshiftbtn_" + paras.divId);

                if (controlBar && controlBar.style.display === "none") {
                    adBannerContainer.style.bottom = "10px";
                } else if (timeshiftSwitchBtn && timeshiftSwitchBtn.getAttribute("isOn") === "true") {
                    adBannerContainer.style.bottom = "120px";
                } else {
                    adBannerContainer.style.bottom = "70px";
                }

                adBannerContainer.style.display = "block";

                //openBtn.style.display = "none";

                //10秒后自动消失
                livePlayerObjs[paras.divId].adBannerTimer = setTimeout(function() {
                    LiveAdBanner.prototype.adBannerShowOrHide(paras, "hide");
                }, 10000);

                if (typeof livePlayerObjs.adBannerAPI[num].eventExposure === "string" && livePlayerObjs.adBannerAPI[num].eventExposure.indexOf("http") !== -1) {
                    getApiByImage(livePlayerObjs.adBannerAPI[num].eventExposure);
                }

                if (typeof livePlayerObjs.adBannerAPI[num].eventExposure1 === "string" && livePlayerObjs.adBannerAPI[num].eventExposure1.indexOf("http") !== -1) {
                    getApiByImage(livePlayerObjs.adBannerAPI[num].eventExposure1);
                }

            } else {
                //openBtn.style.display = "block";

                livePlayerObjs.adBannerAPI = "";

                if (adBannerContainer.style.display === "none") {
                    return;
                }

                adBannerContainer.style.display = "none";
                livePlayerObjs[paras.divId].adBannerNum++;
                if (livePlayerObjs[paras.divId].adBannerNum - livePlayerObjs.adBannerAPI.length >= 0) {
                    livePlayerObjs[paras.divId].adBannerNum = 0;
                }

                let whenAfter = parseInt(adBannerContainer.getAttribute("whenAfter"));
                if (whenAfter && whenAfter > 0 && livePlayerObjs[paras.divId].adBannerGetting) {
                    setTimeout(function() {

                        let container = document.getElementById(paras.divId);
                        container.removeChild(adBannerContainer);

                        setTimeout(function() {
                            loadLiveScript(livePlayerObjs[paras.divId].adBanner, parseLiveAdBannerDataFromApi, paras, parseLiveAdBannerDataFromApiWhenError, 100);
                            parseLiveAdBannerDataFromApi(paras);
                        }, 100);

                        livePlayerObjs[paras.divId].adBannerGetting = false;

                    }, whenAfter * 1000);
                }

            }
        }
    }

}

//canvas播放器,ios系统用
function initCanvas(paras) {
    var canvasDiv = document.getElementById(paras.divId);
    livePlayerObjs[paras.divId].video.isCanvasRestart = false;

    canvasDiv.innerHTML = '<canvas id="h5player_' + paras.divId + '" style="width:100%;height:100%;"></canvas>';

    self.loadNumber = 0;
    self.isFullscreen = false;
    // self.loadTimer = progressLoad();

    // btnPlayDiv.style.background = "url('../img/home.png') ";
    initCanvasPlayer(paras);

    self.url = livePlayerObjs[paras.divId].video.url;
    //window.addEventListener("resize", resizeCanvas, false);

    //window.addEventListener("resize", resizeCanvas, false);
    self.loadedState = false;
    //resizeCanvas();
    if (!document.getElementById("loading_" + paras.divId)) {
        createLiveVideoLoadingImg(paras);

        document.getElementById("loading_" + paras.divId).style.display = "block";
    }
}
function initCanvasPlayer(paras) {
    if (self.player) {
        self.player.stop();
        self.player.destory();
        self.player = null;

    }
    self.player = new Player("./39/js-ios",initCanvasCallback.bind(null, paras));

}

function initCanvasCallback(paras, e) {
    switch (e.type) {
    case kDecodeInitSuccess:
        console.log("模块初始化加载完成!");

        if (self.loadTimer) {
            clearInterval(self.loadTimer);

        }

        playCanvasVideo(paras.divId);

        break;
    case kStartMessage:
        switch (e.status) {
        case kStartSuccess:
            console.log("启动成功!");

            break;
        case kInvalidUrl:
            console.log("无效的Url地址!");

            break;
        case kCanvasNotSet:
            console.log("没有设定Canvas!");
            break;
        case kDownloaderNotSet:
            console.log("没有设定Downloader!");
            break;
        case kDecoderNotSet:
            console.log("没有设定Decoder!");
            break;
        }
        break;
    case kDownLoadMessage:
        switch (e.status) {
        case kDownloadFileReq:
            console.log("已下载时长:", e.message);
            break;
        default:
            console.log("出现错误:", e);
            break;
        }
        break;
    case kPlayerMessage:

        switch (e.status) {

        case playerStatrPresOk:
            console.log("预加载完成3");

            //self.player.play();
            self.loadedState = true;

            if (document.getElementById("loading_" + paras.divId)) {
                document.getElementById("loading_" + paras.divId).style.display = "none";
            }

            // setTimeout(self.player.play(),200000);
            break;
        case playerStatebuffing:
            livePlayerObjs[paras.divId].video.playing = false;

            console.log("缓冲中");
            break;
        case playerStatePlaying:
            livePlayerObjs[paras.divId].video.playing = false;

            console.log("缓冲完成");
            break;
        case playerStatePlay:
            livePlayerObjs[paras.divId].video.playing = true;

            console.log("开始播放");

            break;
        case playerStateEnd:
            livePlayerObjs[paras.divId].video.playing = false;
            console.log("播放完成");
            break;
        case playerStateStop:
            livePlayerObjs[paras.divId].video.playing = false;
            console.log("播放停止");
            break;
        }
        break;
    default:
        console.log("未知错误:", e);
        break;

    }

    if (e.type && e.type == kPlayerMessage) {

        if (e.status == playerStatePlay) {
            LivePlayOrPauseBtn.prototype.switchPlayOrPauseBtn(paras.divId, "play");

            if (document.getElementById("loading_" + paras.divId)) {
                document.getElementById("loading_" + paras.divId).style.display = "none";
            }
        }

        if (e.status == playerStatebuffing || e.status == playerStateStop || e.status == playerStateEnd) {
            LivePlayOrPauseBtn.prototype.switchPlayOrPauseBtn(paras.divId, "pause");

            if (e.status == playerStatebuffing) {
                if (document.getElementById("loading_" + paras.divId)) {
                    document.getElementById("loading_" + paras.divId).style.display = "block";
                }
            }
        }
    }

}

function playCanvasVideo(divId, isContinue) {
    /*
    var currentState = self.player.getState();
    if (currentState != playerStatePlaying) {
        const canvasId = "h5player_"+divId;
        var canvas = document.getElementById(canvasId);
        if (!canvas) {
            return false;
        }

        self.player.start(self.url, canvas, playCanvasCallback, 524288);

    } else {
        this.loadedState = false;
        initCanvasPlayer();
    }
    return true;
*/

    self.url = livePlayerObjs[divId].video.url;

    var currentState = null;
    currentState = self.player.getState();

    if (currentState != playerStatePlaying && !isContinue) {

        const canvasId = "h5player_" + divId;
        var canvas = document.getElementById(canvasId);
        if (!canvas) {
            return false;
        }

        /** 移除在start传入callback 改为在new的时候传入*/
        self.player.start(self.url, canvas, 524288);

    } else {

        self.loadedState = false;
        initCanvasPlayer({
            divId: divId
        });

    }
    return true;

}

function playCanvasCallback(e) {

    switch (e.type) {
    case kStartMessage:
        break;
    case kDownLoadMessage:
        break;
    case kPlayerMessage:
        if (e.status == playerStatrPresOk) {
            self.player.play();
        }
        break;
    default:
        break;
    }
}
//canvas结束

function canvasFull(divId) {
    var body = (document.compatMode && document.compatMode == 'CSS1Compat') ? document.documentElement : document.body;
    var canvas = document.getElementById("h5canvas_" + divId);
    var _width = body.clientWidth;
    var _height = body.clientHeight;
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = _width + "px";
    canvas.style.height = _height + "px";
    canvas.width = _width * window.devicePixelRatio;
    canvas.height = _height * window.devicePixelRatio;

    var isFull = fullscreen(divId);
    console.log('isFull:', isFull);
    canvas.scrollIntoView();
}

function fullscreen(divId) {
    var canvas = document.getElementById("h5canvas_" + divId);
    var fullscreenSuccess = true;
    if (canvas.RequestFullScreen) {
        canvas.RequestFullScreen();
    } else if (canvas.webkitRequestFullScreen) {
        canvas.webkitRequestFullScreen();
    } else if (canvas.mozRequestFullScreen) {
        canvas.mozRequestFullScreen();
    } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
    } else {
        fullscreenSuccess = false;
    }
    return fullscreenSuccess;
}

function exitfullscreen() {
    var exitfullscreenSuccess = true;
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else {
        // alert("Exit fullscreen doesn't work");
        exitfullscreenSuccess = false;
    }
    return exitfullscreenSuccess;
}

function canvasAnimate(divId) {

    let video = document.getElementById("h5player_" + divId);
    canvas = document.getElementById("h5canvas_" + divId);

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    //videoanimate = requestAnimationFrame( canvasAnimate.bind(null, divId) );
    //console.log("draw");
}

function canvasLive(divId) {
    var videoanimate;
    let video = document.getElementById("h5player_" + divId);
    canvas = document.getElementById("h5canvas_" + divId);
    context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, "100%", "100%");
    //缁樺埗width*height鍍忕礌鐨勫凡濉厖鐭╁舰銆�
    var img = new Image();
    //鏂板缓涓€涓浘鐗囷紝妯′豢video閲岄潰鐨刾oster灞炴€с€�
    img.src = playerContorlsImgDir + "play.png";
    context.drawImage(img, 0, 0, "100%", "100%");
    //灏嗗浘鐗囩粯鍒惰繘canvas銆�
    clearInterval(livePlayerObjs[divId].canvasDrawTimer);
    livePlayerObjs[divId].canvasDrawTimer = setInterval(function() {
        canvasAnimate(divId);
        //鍦ㄨ繖閲岃皟鐢ㄣ€�
    }, 39);

    var videoplayPromise = video.play();
    if (videoplayPromise !== undefined) {
        videoplayPromise.then(_=>{}
        ).catch(error=>{
            video.play();
        }
        );
    }
}

function createLiveHls(paras) {

    destroyH5LiveHls(paras);
    livePlayerObjs[paras.divId].video.playing = false;
    let video = document.getElementById("h5player_" + paras.divId);
    livePlayerObjs[paras.divId].startCreatHls = true;
    livePlayerObjs[paras.divId].isStartPlay = false;
    livePlayerObjs[paras.divId].isNoError = false;
    livePlayerObjs[paras.divId].errorTimer = null;

    if (isTimeshift(paras)) {

        let start = 0;
        let videoUrl = livePlayerObjs[paras.divId].video.url;
        let startIndex = videoUrl.indexOf("?begintimeabs=");
        if (startIndex === -1) {
            startIndex = videoUrl.indexOf("&begintimeabs=");
        }
        start = paras.st * 1000;
        if (startIndex > 0) {
            livePlayerObjs[paras.divId].video.url = videoUrl.substring(0, startIndex + 1) + "begintimeabs=" + start;
        } else {
            if (videoUrl.indexOf("?") > 0) {
                livePlayerObjs[paras.divId].video.url = videoUrl + "&begintimeabs=" + start;
            } else {
                livePlayerObjs[paras.divId].video.url = videoUrl + "?begintimeabs=" + start;
            }
        }

    }

    if (livePlayerObjs[paras.divId].video.url.indexOf("begintimeabs=") > 0) {
        livePlayerObjs[paras.divId].isLive = false;
    } else {
        livePlayerObjs[paras.divId].isLive = true;
        paras.st = "";
    }

    livePlayerObjs[paras.divId].video.hls = new Hls();
    livePlayerObjs[paras.divId].video.hls.config.maxBufferSize = 40 * 1000 * 1000;

    //livePlayerObjs[paras.divId].video.hls.config.liveSyncDurationCount = 4;

    if (livePlayerObjs[paras.divId].playerType !== "liveback") {
        livePlayerObjs[paras.divId].video.hls.config.liveDurationInfinity = true;
    }

    // bind them together
    livePlayerObjs[paras.divId].video.hls.attachMedia(video);
    livePlayerObjs[paras.divId].video.hls.startLevel = -1;
    livePlayerObjs[paras.divId].video.hls.on(Hls.Events.MEDIA_ATTACHED, function() {
        livePlayerObjs[paras.divId].video.hls.loadSource(livePlayerObjs[paras.divId].video.url);

    });

    if (isIPad()) {
        if (!document.getElementById("control_bar_" + paras.divId)) {
            if (!isMobleUseBrowserUi) {
                var controls = new LiveControlsBar(paras);
            }

        }
    }

    setTimeout(function() {
        if (!livePlayerObjs[paras.divId].isNoError && isIPad()) {
            if (document.getElementById("loading_" + paras.divId)) {
                document.getElementById("loading_" + paras.divId).style.display = "none";
            }

            livePlayerObjs[paras.divId].isNoError = true;
            livePlayerObjs[paras.divId].errorIsReported = false;

            if (paras.playerType !== "liveback") {
                if (document.getElementById("control_bar_" + paras.divId)) {
                    document.getElementById("control_bar_" + paras.divId).style.display = "block";

                }

            }

            if (paras.playerType === "small" && paras.isMuted) {
                video.muted = true;

            }

            var videoPlay = video.play();

            if (videoPlay) {
                videoPlay.then(()=>{
                    livePlayerObjs[paras.divId].isStartPlay = true;
                    if (isUseConvivaMonitor) {
                        if (!Array.isArray(livePlayerObjs.adCallsAPI) || livePlayerObjs.adCallsAPI.length < 1) {
                            setLiveConvivaMetadata(paras);
                        }
                        livePlayerObjs.adCallsAPI = null;

                    }

                    if (isUseAliMonitor) {
                        if (typeof goldlog != "undefined" && goldlog["h5player_" + paras.divId] && typeof heartbeatStarted !== "undefined") {
                            heartbeatStarted = true;
                        }
                    }

                }
                ).catch((err)=>{

                    livePlayerObjs[paras.divId].isStartPlay = false;

                    if (livePlayerObjs[paras.divId].adCalls && livePlayerObjs[paras.divId].adCalls.length > 3) {
                        livePlayerObjs[paras.divId].isStartPlay = true;
                    }

                    /*
                //视频元素可以选择静音后再播放,提示用户打开声音
                video.muted = true;
                if(document.getElementById("player_sound_yes_"+paras.divId)) {
                    LiveSoundBar.prototype.setSoundBtn(true, paras.divId);
                }
                video.play();
                */

                }
                );
            }
        }

    }, 3000);

    livePlayerObjs[paras.divId].video.hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
        //console.log("manifest loaded, found " + data.levels.length + " quality level");

        //livePlayerObjs[paras.divId].video.hls.startLevel = getStartLevel(data.levels, livePlayerObjs[paras.divId].video.defaultStream);
        livePlayerObjs[paras.divId].video.hls.levels = data.levels;

        if (!isIPad()) {
            if (!document.getElementById("control_bar_" + paras.divId)) {
                if (!isMobleUseBrowserUi) {
                    var controls = new LiveControlsBar(paras);
                }

            }
        }

        //满足条件，重新更新epg，不如播放到下一天
        if (livePlayerObjs[paras.divId].endTime && (livePlayerObjs[paras.divId].isLive && (livePlayerObjs[paras.divId].endTime - (livePlayerObjs[paras.divId].start + 24 * 3600) >= 0) || paras.st && !(paras.st - livePlayerObjs[paras.divId].start >= 0 && paras.st - (livePlayerObjs[paras.divId].start + 24 * 3600) < 0))) {

            LiveTimeshiftBar.prototype.showEpg(paras);
        }

        if (livePlayerObjs[paras.divId].isNoError) {
            return;
        }

        livePlayerObjs[paras.divId].isNoError = true;
        livePlayerObjs[paras.divId].errorIsReported = false;

        if (paras.playerType === "small" && paras.isMuted) {
            video.muted = true;

        }

        var videoPlay = video.play();

        if (videoPlay) {
            videoPlay.then(()=>{
                livePlayerObjs[paras.divId].isStartPlay = true;
                if (isUseConvivaMonitor) {
                    if (!Array.isArray(livePlayerObjs.adCallsAPI) || livePlayerObjs.adCallsAPI.length < 1) {
                        setLiveConvivaMetadata(paras);
                    }
                    livePlayerObjs.adCallsAPI = null;

                }

                if (isUseAliMonitor) {
                    if (typeof goldlog != "undefined" && goldlog["h5player_" + paras.divId] && typeof heartbeatStarted !== "undefined") {
                        heartbeatStarted = true;
                    }
                }

            }
            ).catch((err)=>{

                livePlayerObjs[paras.divId].isStartPlay = false;

                if (Array.isArray(livePlayerObjs.adCallsAPI) && livePlayerObjs.adCallsAPI.length > 0) {
                    livePlayerObjs[paras.divId].isStartPlay = true;
                }

                /*
                    if(isIPad()) {
                        livePlayerObjs[paras.divId].isStartPlay = false;

                        if(livePlayerObjs[paras.divId].adCalls && livePlayerObjs[paras.divId].adCalls.length>3) {
                            livePlayerObjs[paras.divId].isStartPlay = true;
                        }

                    } else{
                        video.muted = true;
                        if(document.getElementById("player_sound_yes_"+paras.divId)) {
                            LiveSoundBar.prototype.setSoundBtn(true, paras.divId);
                        }
                        livePlayerObjs[paras.divId].isStartPlay = true;
                        if(isUseConvivaMonitor) {
                            if(!Array.isArray(livePlayerObjs.adCallsAPI) || livePlayerObjs.adCallsAPI.length<1) {
                                setLiveConvivaMetadata(paras);
                            }
                            livePlayerObjs.adCallsAPI = null;

                        }


                        if(isUseAliMonitor) {
                            if(typeof goldlog!="undefined" && goldlog["h5player_"+paras.divId] && typeof heartbeatStarted!=="undefined") {
                                heartbeatStarted = true;
                            }
                        }
                        video.play();
                    }
                    */

            }
            );
        }

    });

    livePlayerObjs[paras.divId].video.hls.on(Hls.Events.FRAG_PARSED, function(event, data) {

        livePlayerObjs[paras.divId].isNoError = true;

        //解决部分设备直播和时移第一个画面闪一下问题
        if (!isIPad() && video.style.visibility === "hidden") {
            setTimeout(function() {
                video.style.visibility = "visible";
            }, 500);
        }

        livePlayerObjs[paras.divId].isShowSmallWindow = true;

    });

    livePlayerObjs[paras.divId].video.hls.on(Hls.Events.FRAG_BUFFERED, function(event, data) {

        if (document.getElementById("player_progress_pointer_" + paras.divId)) {
            LiveProgressBar.prototype.setProgressBufferedPos(paras.divId, data.frag.endDTS);
        }

    });

    livePlayerObjs[paras.divId].video.hls.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
        if (!isIPad()) {
            let bitrateKbps = livePlayerObjs[paras.divId].video.hls.levels[data.level].bitrate / 1000;
            bitrateKbps = Math.round(bitrateKbps);

            if (liveConvivaClient && liveConvivaPlayerStateManager) {
                liveConvivaPlayerStateManager.setBitrateKbps(bitrateKbps);
            }
        }

    });

    livePlayerObjs[paras.divId].video.hls.on(Hls.Events.ERROR, function(event, data) {

        livePlayerObjs[paras.divId].isNoError = false;

        if (livePlayerObjs[paras.divId].errorTimer === null) {
            livePlayerObjs[paras.divId].errorTimer = setTimeout(function() {
                livePlayerObjs[paras.divId].errorTimer = null;

                if (!livePlayerObjs[paras.divId].isNoError && !livePlayerObjs[paras.divId].errorIsReported) {

                    if (liveConvivaClient && liveConvivaPlayerStateManager) {
                        let errorMsg = data.type ? data.type : 'unknown error';
                        if (errorMsg === "otherError") {
                            errorMsg = errorMsg + ":" + data.details;
                        }

                        if (liveConvivaClient && liveConvivaClient.cleanupSession && livePlayerObjs[paras.divId].convivaSessionKey !== undefined) {

                            liveConvivaClient.reportError(livePlayerObjs[paras.divId].convivaSessionKey, errorMsg, Conviva.Client.ErrorSeverity.FATAL);

                            liveConvivaClient.cleanupSession(livePlayerObjs[paras.divId].convivaSessionKey);
                            livePlayerObjs[paras.divId].convivaSessionKey = undefined;
                        } else {
                            setLiveConvivaMetadata(paras, errorMsg);
                        }

                        livePlayerObjs[paras.divId].errorIsReported = true;

                    }

                    //sendLiveAliAdCallsRequestData(paras, "play.1.4");
                    if (typeof goldlog != "undefined" && goldlog["h5player_" + paras.divId]) {
                        heartbeatStarted = false;
                    }
                    if (typeof goldlog !== "undefined" && goldlog["h5player_" + paras.divId]) {
                        goldlog.record("/play.1.4", "", "playScene=H5&type=H5" + goldlog["h5player_" + paras.divId].para + "&error_info=" + data.type, "");
                    }
                }

                if (!livePlayerObjs[paras.divId].isNoError) {

                    if (!document.getElementById("timeshift_pointer_" + paras.divId) && (paras.vdnRetryNum === undefined || paras.vdnRetryNum < 5)) {

                        if (paras.vdnRetryNum === undefined) {
                            paras.vdnRetryNum = 3;
                        }

                        paras.vdnRetryNum++;

                        livePlayerObjs[paras.divId].isShowSmallWindow = false;
                        let smallWindowCloseBtn = document.getElementById('close_player_' + paras.divId);
                        let container = document.getElementById(paras.divId);
                        let containerWidth = parseInt(container.offsetWidth);
                        if (smallWindowCloseBtn && containerWidth > 10 && containerWidth < 450) {
                            hideLivePlayerSmallWindow(paras.divId);
                        }

                        if (!livePlayerObjs[paras.divId].isLive && livePlayerObjs[paras.divId].startStamp && livePlayerObjs[paras.divId].startStamp - 1500000000 > 0) {
                            paras.st = livePlayerObjs[paras.divId].startStamp;
                        }
                        createLivePlayer(paras);

                    } else {
                        livePlayerObjs[paras.divId].video.hls.startLoad();
                    }

                }

            }, 15000);
        }

        if (data.fatal) {

            switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                // try to recover network error
                console.log("fatal network error encountered, try to recover");
                livePlayerObjs[paras.divId].video.hls.startLoad();
                break;
            case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("fatal media error encountered, try to recover");
                livePlayerObjs[paras.divId].video.hls.recoverMediaError();
                break;
            default:
                // cannot recover
                //destroyH5LiveHls(paras);

                break;
            }

            livePlayerObjs[paras.divId].isNoError = false;

        }
    });

}

class LiveControlsBar {

    constructor(paras) {
        this.controls = null;
        this.playerContainerId = paras.divId;
        this.playerContainer = document.getElementById(paras.divId);
        this.playerContainer.style.backgroundColor = "#000";
        this.playerContainer.style.fontFamily = "PingFangSC-Regular,Helvetica,Arial,Microsoft Yahei,sans-serif";
        this.playerContainer.style.position = "relative";
        livePlayerObjs[paras.divId].video.showPlayBtnTimer = null;

        this.initControls(paras);
        //设置控制条UI

        this.initEvents(paras.divId);
        //设置播放器容器事件

    }

    initControls(paras) {

        this.controls = document.createElement("div");
        this.controls.setAttribute("id", "control_bar_" + paras.divId);
        let controlsBgImg = "controls_bg.png";
        let controlsHeight = 48;

        if (paras.playerType === "live") {
            controlsBgImg = "controls_bg_live.png";
        }

        if (paras.playerType === "small") {
            controlsHeight = 46;
            let playerHeight = paras.h - controlsHeight;
            let playerTop = (playerHeight - paras.w * 9 / 16) / 2;
            let player = document.getElementById("h5player_" + paras.divId);
            if (player) {
                player.style.position = "absolute";
                player.style.height = playerHeight + "px";
                player.style.top = playerTop + "px";

                window.addEventListener("resize", function(ev) {
                    let container = document.getElementById(paras.divId);
                    playerHeight = parseInt(container.offsetHeight) - controlsHeight;
                    playerTop = (playerHeight - parseInt(container.offsetWidth) * 9 / 16) / 2;

                    player.style.height = playerHeight + "px";
                    player.style.top = playerTop + "px";

                    let isplayingText = document.getElementById("isplaying_text_" + paras.divId);

                    let textTop = 5;
                    if (isplayingText) {

                        if (parseInt(container.offsetHeight) < 290) {
                            textTop = 4;
                        }
                        isplayingText.style.top = textTop + "px";
                    }

                }, false);
            }

        }

        this.controls.style.cssText = "position:absolute;width:100%;height:" + controlsHeight + "px;bottom:0px;left:0px;background-image:url(" + playerContorlsImgDir + controlsBgImg + ");background-size:100% " + controlsHeight + "px;background-repeat:repeat-x;z-index:9;";
        this.playerContainer.appendChild(this.controls);

        let right = 0;
        let startLeft = 9;
        let startRight = 8;
        new LivePlayOrPauseBtn(paras.divId,startLeft);
        //播放和暂停按钮

        //new LiveVideoLoading(paras);
        //0首页播放模式
        if (paras.playerType === "small") {
            new LiveSoundOrMute(paras,startRight);
            new LiveTileShow(paras,60);
        } else if (paras.playerType === "hw" || paras.playerType === "liveback") {

            if (isIPad()) {
                new LiveMobileFullscreenBtn(paras.divId,startRight);
            } else {
                new LiveFullscreenBtn(paras.divId,startRight);
            }
            right = 62;

            if (!isIPad()) {
                new LiveSoundBar(paras.divId,right);
                //音量条
                right = right + 41;
            }

            //定时检测版权
            if (paras.playerType === "hw") {
                LiveTileShow.prototype.getEpgFromApi(paras);
            }

        } else {

            startRight = 8;
            new LiveFullscreenBtn(paras.divId,startRight);
            right = 42;
            if (paras.webFullScreenOn === "true") {

                right += startRight;
                new LivePageFullscreenBtn(paras.divId,right);
                //网页全屏
                right = 84 + startRight;
            } else {
                right = 44 + startRight;
            }

            new LiveSoundBar(paras.divId,right);
            //音量条

            let isAudioSet = /(chrome|firefox)/i.test(navigator.userAgent) && !(/(edge)/i.test(navigator.userAgent)) && !(/safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent));

            if (isAudioSet) {
                right = right + 49;
                new LiveAudioSetBar(paras,right);
                //音效
                right = right + 71;
            } else {
                right = right + 41;
            }

            if (paras.setupOn === "true") {
                new LiveSetupBar(paras.divId,right);
                //设置条
                right = right + 71;
            } else {
                right = right + 30;
            }

            new LiveResolutionBar(paras.divId,right);
            //清晰度选择条

        }

        if (paras.playerType === "live" && !isIPad() && (paras.ruleVisible === "true" || paras.ruleVisible === true)) {

            new LiveTimeshiftBar(paras);
            right = right + 33 + 30;
            new LiveTimeshiftSwitch(paras,right);

        }

        if (paras.playerType === "live" && !isIPad()) {

            new LivePictureInPicture(paras);

        }

    }

    initEvents(divId) {
        livePlayerObjs[divId].video.showPlayBtnTimer = null;
        this.playerContainer.addEventListener("mousemove", this.controlBarShowOrHide.bind(null, "show", this.playerContainerId, true), false);
        this.playerContainer.addEventListener("mouseover", this.controlBarShowOrHide.bind(null, "show", this.playerContainerId, true), false);
        this.playerContainer.addEventListener("mouseout", this.controlBarShowOrHide.bind(null, "hide", this.playerContainerId), false);

        //双击全屏
        if (!isIPad() && livePlayerObjs[divId].playerType === "live") {
            let player = document.getElementById("h5player_" + this.playerContainerId);
            if (player) {
                livePlayerObjs[divId].isDblClick = false;
                livePlayerObjs[divId].dblClickTimer = null;

                //单击播放器，全屏或退出全屏操作
                player.addEventListener("dblclick", this.playerByDblclick.bind(null, this.playerContainerId), false);

                //单击播放器，播放或暂停操作
                player.addEventListener("click", this.playerByClick.bind(null, this.playerContainerId), false);

                //空格键控制播放和暂停
                document.addEventListener("keyup", function(ev) {
                    let e = ev ? ev : window.event;
                    if (e && e.which == 32) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }

                        if (livePlayerObjs[divId].isPlayOrPauseByKeyup === undefined || livePlayerObjs[divId].isPlayOrPauseByKeyup) {
                            LiveControlsBar.prototype.playerByClick(divId);
                        }

                    }

                }, false);

                //空格键控制播放和暂停
                document.addEventListener("keydown", function(ev) {
                    let e = ev ? ev : window.event;
                    if (e && e.preventDefault && e.which == 32) {
                        e.preventDefault();
                    }

                }, false);

            }

        }

        //零首页点播放器跳转
        if (livePlayerObjs[divId].playerType === "small") {
            let player = document.getElementById("h5player_" + this.playerContainerId);

            if (player) {
                player.style.cursor = "pointer";
                //解决移动端，部分浏览器点击播放器没有跳转问题
                if (isIPad()) {
                    let w = parseInt(this.playerContainer.offsetWidth);
                    let h = parseInt(this.playerContainer.offsetHeight) - 50;
                    let htmls = `
                        <div id="float_up_${divId}" style="width:${w}px;height:${h}px;position:absolute;z-index:30;opacity:0;"></div>
                    `;
                    document.getElementById(divId).insertAdjacentHTML("afterBegin", htmls);
                    player = document.getElementById("float_up_" + divId);
                }
                player.addEventListener("click", function(ev) {
                    LiveTileShow.prototype.jumpToUrl(livePlayerObjs[divId]);
                }, false);
            }
        }

    }

    controlBarShowOrHide(mode, divId, targetCheck, ev) {

        let controls = document.getElementById("control_bar" + "_" + divId);
        let player = document.getElementById("h5player_" + divId);
        let e = window.event ? window.event : null;
        let targetId = "";

        let errorMsgDiv = document.getElementById("error_msg_" + divId);

        if (!controls) {
            return;
        }

        if (e && e.target && targetCheck === true) {
            targetId = e.target.getAttribute("id");

        }

        let playerIsPaused = false;
        if (isLiveHlsJsSupported()) {
            playerIsPaused = player.paused;
        } else {
            playerIsPaused = !self.player.getState();
        }

        let picInPicBtn = document.getElementById("pic_in_pic_" + divId);

        if (mode === "show" || playerIsPaused) {

            if (errorMsgDiv && errorMsgDiv.style.display !== "none" && isIPad()) {
                return;
            }

            controls.style.display = "block";

            if (picInPicBtn) {

                let closeSmallBtn = document.getElementById("close_player_" + divId);
                if (closeSmallBtn) {
                    picInPicBtn.style.display = "none";
                } else {
                    picInPicBtn.style.display = "block";
                }
            }

            if (livePlayerObjs[divId].video.showPlayBtnTimer !== null) {
                clearTimeout(livePlayerObjs[divId].video.showPlayBtnTimer);
            }

            livePlayerObjs[divId].video.showPlayBtnTimer = null;

            if (!isIPad() && targetCheck !== "show3Seconds" && (!targetId || typeof targetId === "string" && targetId.indexOf("h5player_" + divId) === -1)) {
                return;
            }

            livePlayerObjs[divId].video.showPlayBtnTimer = setTimeout(function() {

                if (livePlayerObjs[divId].video.playing && livePlayerObjs[divId].playerType !== "small") {
                    controls.style.display = "none";
                    if (picInPicBtn) {
                        picInPicBtn.style.display = "none";
                    }
                }

                livePlayerObjs[divId].video.showPlayBtnTimer = null;

            }, 3000);

        } else {

            if (!playerIsPaused) {

                //兼容qq浏览器点时移箭头，控制条自动消失问题
                if (/qqbrowser/i.test(navigator.userAgent)) {
                    let e = ev ? ev : window.event;
                    if (e && e.target && e.target.id && e.target.id.indexOf("epg_") !== -1 && e.target.id.indexOf("mouseover_") !== -1) {
                        return;
                    }
                }

                if (livePlayerObjs[divId].playerType !== "small") {
                    controls.style.display = "none";
                }

                if (picInPicBtn) {
                    picInPicBtn.style.display = "none";
                }

            }

        }

    }

    playerByDblclick(divId) {

        livePlayerObjs[divId].isDblClick = true;
        livePlayerObjs[divId].dblClickTimer = null;
        if (document.getElementById("player_fullscreen_" + divId)) {
            LiveFullscreenBtn.prototype.fullscreenClick(divId);
            LiveFullscreenBtn.prototype.fullScreenMouseout(divId);
        }

    }

    playerByClick(divId) {

        if (document.getElementById("play_or_pause_play_" + divId)) {

            if (livePlayerObjs[divId].dblClickTimer === null) {
                livePlayerObjs[divId].dblClickTimer = setTimeout(function() {

                    if (!livePlayerObjs[divId].isDblClick) {
                        LivePlayOrPauseBtn.prototype.playOrPause(divId);
                    }

                    livePlayerObjs[divId].isDblClick = false;
                    livePlayerObjs[divId].dblClickTimer = null;

                }, 500);

            }

        }

    }

}

//暂停和播放按钮
class LivePlayOrPauseBtn {
    constructor(divId, left) {
        this.initUi(divId, left);
        this.initEvents(divId);
        //设置播放器容器事件

    }

    initUi(divId, left) {
        let htmls = "";
        htmls = `             
        <div id="play_or_plause_${divId}" style="position:absolute;left:${left}px;width:48px;height:48px;cursor:pointer;z-index:10;">
            <img id="play_or_pause_play_${divId}" src="${playerContorlsImgDir}play.png" style="width:30px;height:30px;padding:9px;">
            <img id="play_or_pause_play_mouseover_${divId}" src="${playerContorlsImgDir}play_mouseover.png" style="width:48px;height:48px;display:none;">
            <img id="play_or_pause_pause_${divId}" src="${playerContorlsImgDir}pause.png" style="width:30px;height:30px;padding:9px;display:none;">
            <img id="play_or_pause_pause_mouseover_${divId}" src="${playerContorlsImgDir}pause_mouseover.png" style="width:48px;height:48px;display:none;">
        </div>        
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);

        //让控制条显示3秒

        if (livePlayerObjs[divId].video.showPlayBtnTimer === null) {
            livePlayerObjs[divId].video.showPlayBtnTimer = setTimeout(function() {

                if (isLiveHlsJsSupported() && livePlayerObjs[divId].video.playing || !isLiveHlsJsSupported() && self.player.getState() == 1) {

                    let errorDiv = document.getElementById("error_msg_" + divId);
                    if (!errorDiv && livePlayerObjs[divId].playerType !== "small") {
                        document.getElementById("control_bar_" + divId).style.display = "none";
                        let picInPicBtn = document.getElementById("pic_in_pic_" + divId);
                        if (picInPicBtn) {
                            picInPicBtn.style.display = "none";
                        }
                    }

                }

                livePlayerObjs[divId].video.showPlayBtnTimer = null;

            }, 3000);
        }

    }

    initEvents(divId) {

        let obj = document.getElementById("play_or_plause_" + divId);
        obj.addEventListener("click", this.playOrPause.bind(null, divId, true), false);
        if (!isIPad()) {
            obj.addEventListener("mouseover", this.playOrPauseMouseover.bind(null, divId), false);
            obj.addEventListener("mouseout", this.playOrPauseMouseout.bind(null, divId), false);
        }

        if (livePlayerObjs[divId].playerType === "small") {
            livePlayerObjs[divId].isByclick = false;
        }
    }

    playOrPause(divId, isByClick) {

        if (window.event) {
            window.event.preventDefault();
        }

        let errorDiv = document.getElementById("error_msg_" + divId);
        if (errorDiv) {
            return;
        }

        let playBtn = document.getElementById("play_or_pause_play_" + divId);
        let pauseBtn = document.getElementById("play_or_pause_pause_" + divId);
        let playMouseoverBtn = document.getElementById("play_or_pause_play_mouseover_" + divId);
        let pauseMouseoverBtn = document.getElementById("play_or_pause_pause_mouseover_" + divId);
        let videoTag = document.getElementById("h5player_" + divId);
        if (!isIPad()) {
            videoTag.style.visibility = "visible";
        }

        livePlayerObjs[divId].isByclick = false;

        if (playBtn.style.display !== "none" || playMouseoverBtn.style.display !== "none") {

            if (isLiveHlsJsSupported()) {

                if (Array.isArray(livePlayerObjs.adPauseAPI) && livePlayerObjs.adPauseAPI.length > 0) {
                    LiveAdPause.prototype.adPauseShowOrHide(livePlayerObjs[divId], "hide");
                }

                if (!document.getElementById("player_progress_" + divId) && livePlayerObjs[divId].LiveCanplaythroughTime && (Date.parse(new Date()) / 1000 - livePlayerObjs[divId].LiveCanplaythroughTime > livePlayerObjs.liveRetryTimeout)) {

                    if (document.getElementById("loading_" + divId)) {
                        document.getElementById("loading_" + divId).style.display = "block";
                    }

                    if (liveConvivaClient && liveConvivaClient.cleanupSession && livePlayerObjs[divId].convivaSessionKey !== undefined) {

                        liveConvivaClient.cleanupSession(livePlayerObjs[divId].convivaSessionKey);
                        livePlayerObjs[divId].convivaSessionKey = undefined;
                    }

                    if (typeof goldlog != "undefined" && goldlog["h5player_" + divId] && typeof heartbeatStarted !== "undefined") {
                        heartbeatStarted = true;
                    }

                    let pointer = document.getElementById("timeshift_pointer_" + divId);

                    if (pointer) {

                        livePlayerObjs[divId].isShowSmallWindow = false;
                        let smallWindowCloseBtn = document.getElementById('close_player_' + divId);
                        let container = document.getElementById(divId);
                        let containerWidth = parseInt(container.offsetWidth);
                        if (smallWindowCloseBtn && containerWidth > 10 && containerWidth < 450) {
                            hideLivePlayerSmallWindow(divId);
                        }

                        if (livePlayerObjs[divId].isLive) {
                            //第二个参数为true，表示从直播返回直播；否则，从时移返回直播
                            clearInterval(livePlayerObjs[divId].liveTimer);
                            LiveTimeshiftSwitch.prototype.returnToLive(livePlayerObjs[divId], true);
                        } else {

                            LiveTimeshiftSwitch.prototype.playTimeshiftFromPos(livePlayerObjs[divId], livePlayerObjs[divId].startStamp);
                        }

                    } else {
                        createLiveHls(livePlayerObjs[divId]);
                    }

                    livePlayerObjs[divId].LiveCanplaythroughTime = Date.parse(new Date()) / 1000;

                } else {

                    videoTag.play();

                    if (!livePlayerObjs[divId].isStartPlay) {

                        if (isUseConvivaMonitor) {
                            setLiveConvivaMetadata(livePlayerObjs[divId]);
                        }

                        if (isUseAliMonitor) {
                            if (typeof goldlog != "undefined" && goldlog["h5player_" + divId] && typeof heartbeatStarted !== "undefined") {
                                heartbeatStarted = true;
                            }
                        }

                    }

                    livePlayerObjs[divId].isStartPlay = true;

                }
            } else {

                if (self && self.player) {

                    if (!self.loadedState) {

                        return;
                    }

                    if (self.loadedState) {
                        livePlayerObjs[divId].video.isCanvasRestart = true;

                        self.player.play();
                        self.loadedState = false;
                    }

                }
            }

            if (livePlayerObjs[divId].isEnd && livePlayerObjs[divId].playerType !== "live") {
                clearInterval(livePlayerObjs[divId].video.playedTimer);

                LivePlayTimeShow.prototype.setPlayedTime(divId, 0);
                livePlayerObjs[divId].isEnd = false;

                if (isUseConvivaMonitor) {

                    setLiveConvivaMetadata(livePlayerObjs[divId]);
                }

                if (isUseAliMonitor) {

                    if (typeof goldlog != "undefined" && !goldlog["h5player_" + divId]) {
                        heartbeatStarted = false;
                    }

                }

            }

            playBtn.style.display = "none";
            pauseBtn.style.display = "none";
            playMouseoverBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "block";
        } else {

            if (livePlayerObjs[divId].playerType === "small" && isByClick) {
                livePlayerObjs[divId].isByclick = true;
            }

            if (livePlayerObjs[divId].adPause && livePlayerObjs[divId].adPause.length > 3 && !isIPad() && livePlayerObjs[divId].vdn.public === "1") {
                let adPauseContainer = document.getElementById("adpause_" + divId);

                if (adPauseContainer) {
                    LiveAdPause.prototype.adPauseShowOrHide(livePlayerObjs[divId], "show");
                } else {
                    new LiveAdPause(livePlayerObjs[divId]);
                }
            }

            livePlayerObjs[divId].LiveCanplaythroughTime = Date.parse(new Date()) / 1000;

            if (isLiveHlsJsSupported()) {
                videoTag.pause();
            } else {
                self.loadedState = false;

                if (livePlayerObjs[divId].playerType === "liveback") {

                    var start = 0;
                    var videoUrl = livePlayerObjs[divId].video.url;
                    var startIndex = videoUrl.indexOf("?begintimeabs=");
                    if (startIndex === -1) {
                        startIndex = videoUrl.indexOf("&begintimeabs=");
                    }
                    start = parseInt(livePlayerObjs[divId].start + livePlayerObjs[divId].video.duration * livePlayerObjs[divId].timePos / 100) * 1000;
                    if (startIndex > 0) {
                        livePlayerObjs[divId].video.url = videoUrl.substring(0, startIndex + 1) + "begintimeabs=" + start + "&begintimeabs=" + livePlayerObjs[divId].end * 1000;
                    } else {
                        if (videoUrl.indexOf("?") > 0) {
                            livePlayerObjs[divId].video.url = videoUrl + "&begintimeabs=" + start + "&endtimeabs=" + livePlayerObjs[divId].end * 1000;
                        } else {
                            livePlayerObjs[divId].video.url = videoUrl + "?begintimeabs=" + start + "&endtimeabs=" + livePlayerObjs[divId].end * 1000;
                        }
                    }

                }

                playCanvasVideo(divId, true);
            }

            playBtn.style.display = "none";
            pauseBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "none";
            playMouseoverBtn.style.display = "block";

        }

    }

    switchPlayOrPauseBtn(divId, mod) {

        let playBtn = document.getElementById("play_or_pause_play_" + divId);
        let pauseBtn = document.getElementById("play_or_pause_pause_" + divId);
        let playMouseoverBtn = document.getElementById("play_or_pause_play_mouseover_" + divId);
        let pauseMouseoverBtn = document.getElementById("play_or_pause_pause_mouseover_" + divId);
        if (!playBtn) {
            return;
        }

        let picInPicBtn = document.getElementById("pic_in_pic_" + divId);

        if (mod === "play") {
            playBtn.style.display = "none";
            playMouseoverBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "none";
            pauseBtn.style.display = "block";

        } else {

            pauseBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "none";
            playMouseoverBtn.style.display = "none";
            playBtn.style.display = "block";
            document.getElementById("control_bar_" + divId).style.display = "block";
            if (picInPicBtn) {

                let closeSmallBtn = document.getElementById("close_player_" + divId);
                if (closeSmallBtn) {
                    picInPicBtn.style.display = "none";
                } else {
                    picInPicBtn.style.display = "block";
                }

            }

        }

        //让控制条显示3秒
        if (livePlayerObjs[divId].video.showPlayBtnTimer === null) {
            livePlayerObjs[divId].video.showPlayBtnTimer = setTimeout(function() {

                let errorDiv = document.getElementById("error_msg_" + divId);

                if (mod === "play" && document.getElementById("control_bar_" + divId) && !errorDiv && livePlayerObjs[divId].playerType !== "small") {
                    document.getElementById("control_bar_" + divId).style.display = "none";
                    if (picInPicBtn) {
                        picInPicBtn.style.display = "none";

                        if (picInPicBtn) {
                            picInPicBtn.style.display = "none";
                        }
                    }

                }

                livePlayerObjs[divId].video.showPlayBtnTimer = null;

            }, 3000);
        }

    }

    playOrPauseMouseover(divId) {

        let playBtn = document.getElementById("play_or_pause_play_" + divId);
        let pauseBtn = document.getElementById("play_or_pause_pause_" + divId);
        let playMouseoverBtn = document.getElementById("play_or_pause_play_mouseover_" + divId);
        let pauseMouseoverBtn = document.getElementById("play_or_pause_pause_mouseover_" + divId);
        let videoTag = document.getElementById("h5player_" + divId);

        if (playMouseoverBtn.style.display !== "none" || playBtn.style.display !== "none") {
            playBtn.style.display = "none";
            pauseBtn.style.display = "none";
            playMouseoverBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "none";

            playMouseoverBtn.style.display = "block";
        } else {
            playBtn.style.display = "none";
            pauseBtn.style.display = "none";
            playMouseoverBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "none";

            pauseMouseoverBtn.style.display = "block";
        }
    }

    playOrPauseMouseout(divId, ev) {
        let playBtn = document.getElementById("play_or_pause_play_" + divId);
        let pauseBtn = document.getElementById("play_or_pause_pause_" + divId);
        let playMouseoverBtn = document.getElementById("play_or_pause_play_mouseover_" + divId);
        let pauseMouseoverBtn = document.getElementById("play_or_pause_pause_mouseover_" + divId);
        let videoTag = document.getElementById("h5player_" + divId);

        if (playMouseoverBtn.style.display !== "none" || playBtn.style.display !== "none") {

            pauseBtn.style.display = "none";
            playMouseoverBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "none";

            playBtn.style.display = "block";
        } else {
            playBtn.style.display = "none";

            playMouseoverBtn.style.display = "none";
            pauseMouseoverBtn.style.display = "none";

            pauseBtn.style.display = "block";
        }
    }

}

class LiveFullscreenBtn {
    constructor(divId, right, isAdcalls) {
        livePlayerObjs[divId].video.mouseMoveCheckTimer = null;
        this.initUi(divId, right, isAdcalls);
        this.initEvents(divId);
        //璁剧疆鎸夐挳浜嬩欢

    }

    initUi(divId, right, isAdcalls) {
        let htmls = "";
        let textRight = right - 4;

        htmls = `             
        <div id="player_fullscreen_${divId}" style="position:absolute;bottom:8px;right:${right}px;width:35px;height:32px;cursor:pointer;z-index:10;" isFullscreen="false">
            <img id="player_fullscreen_no_${divId}" src="${playerContorlsImgDir}fullscreen_no.png" style="width:15px;height:12px;padding:10px">
            <img id="player_fullscreen_no_mouseover_${divId}" src="${playerContorlsImgDir}fullscreen_no_mouseover.png" style="width:23px;height:20px;padding:6px;display:none;">

            <img id="player_fullscreen_yes_${divId}" src="${playerContorlsImgDir}fullscreen_yes.png" style="width:15px;height:12px;padding:10px;display:none;">

            <img id="player_fullscreen_yes_mouseover_${divId}" src="${playerContorlsImgDir}fullscreen_yes_mouseover.png" style="width:23px;height:20px;padding:6px;display:none">
        </div>

        <div id="player_fullscreen_msg_${divId}" style="position:absolute;opacity:0.9;display:none;bottom:56px;right:${textRight}px;height:20px;color:#FFF;background-color:rgba(38, 38, 43, 1);padding:3px 7px;font-size:14px;border-top-left-radius:3px;border-top-right-radius:3px;z-index:10;">
            全屏
        </div>    
        `;

        if (isAdcalls) {
            document.getElementById("adcalls_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);
        } else {
            document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);
        }

        //兼容mac+safari播放器窗口比较小时，全屏控制条破版问题
        if (/macintosh|mac os x/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)) {
            let bodyMinWidth = document.body.style.minWidth;
            if (bodyMinWidth) {
                document.body.setAttribute("minWidth", bodyMinWidth);

            }

        }

    }

    initEvents(divId) {
        let obj = document.getElementById("player_fullscreen_" + divId);
        obj.addEventListener("click", this.fullscreenClick.bind(null, divId), false);
        obj.addEventListener("mouseover", this.fullScreenMouseover.bind(null, divId), false);
        obj.addEventListener("mouseout", this.fullScreenMouseout.bind(null, divId), false);

        document.addEventListener("fullscreenchange", this.checkFullscreen.bind(null, divId), false);

        document.addEventListener("webkitfullscreenchange", this.checkFullscreen.bind(null, divId), false);

        document.getElementById("h5player_" + divId).addEventListener("mousemove", function(ev) {
            let isFullscreen = null;
            if (document.getElementById("player_fullscreen_" + divId)) {
                isFullscreen = document.getElementById("player_fullscreen_" + divId).getAttribute("isFullscreen");
            }
            clearTimeout(livePlayerObjs[divId].video.mouseMoveCheckTimer);
            document.getElementById("h5player_" + divId).style.cursor = "auto";
            if (isFullscreen === "true") {
                livePlayerObjs[divId].video.mouseMoveCheckTimer = setTimeout(function() {
                    document.getElementById("h5player_" + divId).style.cursor = "url(" + playerContorlsImgDir + "hidecursor.png) 1 1,auto";
                }, 5000);
            }
        }, false);

    }

    fullscreenClick(divId, isByClick) {

        let obj = document.getElementById("player_fullscreen_" + divId);

        if (/macintosh|mac os x/i.test(navigator.userAgent) && /qqbrowser/i.test(navigator.userAgent)) {
            return;
        }

        obj.setAttribute("isFullByClick", "true");
        setTimeout(function() {
            obj.setAttribute("isFullByClick", "false");
        }, 300);

        let isFullscreen = obj.getAttribute("isFullscreen");

        obj.setAttribute("isByClick", "true");
        //閫氳繃鎸塅11绛�
        let ele = document.getElementById(divId);
        let originalStyle = ele.getAttribute("originalStyle");

        if (isFullscreen !== "true") {

            if (originalStyle && originalStyle.length > 5) {
                ele.setAttribute("originalStyle", originalStyle);
            } else {
                ele.setAttribute("originalStyle", ele.style.cssText);
            }

            let nowWidth = parseInt(ele.style.width);
            let nowHeight = parseInt(ele.style.height);

            let originalWidth = 0;

            let widthIndex = originalStyle.indexOf("width:");
            if (widthIndex !== -1) {
                originalWidth = parseInt(originalStyle.substring(widthIndex + 6).replace(/(^\s*)|(\s*$)/g, ""));
            }

            if (Math.abs(nowWidth - originalWidth) > 10 && originalStyle.indexOf("height: " + nowHeight) !== -1) {
                originalStyle = originalStyle.replace('width: ' + originalWidth, "width: " + nowWidth);

                ele.setAttribute("originalStyle", originalStyle);

            }

            let pageObj = document.getElementById("player_pagefullscreen_" + divId);
            if (pageObj) {
                pageObj.setAttribute("originalStyle", originalStyle);
            }

            ele.style.position = "fixed";
            ele.style.left = "0";
            ele.style.top = "0";
            if (/macintosh|mac os x/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent) || /metaSr/i.test(navigator.userAgent) || /LBBROWSER/i.test(navigator.userAgent)) {

                let bodyMinWidth = document.body.getAttribute("minWidth");
                if (bodyMinWidth) {
                    document.body.style.minWidth = window.screen.width + "px";
                }

                ele.style.width = "100%";
                ele.style.height = "100%";
            } else {
                let playerRatio = 1;
                if (window.devicePixelRatio && window.devicePixelRatio - 0 > 0 && window.devicePixelRatio != 1) {
                    playerRatio = window.devicePixelRatio;
                }
                ele.style.width = window.screen.width / playerRatio + "px";
                ele.style.height = window.screen.height / playerRatio + "px";
            }

            if (ele.requestFullscreen) {
                ele.requestFullscreen();
            } else if (ele.mozRequestFullScreen) {
                ele.mozRequestFullScreen();
            } else if (ele.webkitRequestFullScreen) {
                ele.webkitRequestFullScreen();
            }

            obj.setAttribute("isFullscreen", "true");

            if (document.getElementById("player_pagefullscreen_" + divId)) {
                document.getElementById("player_pagefullscreen_" + divId).setAttribute("isPageFullscreen", "false");
                document.getElementById("player_pagefullscreen_no_mouseover_" + divId).style.display = "none";
                document.getElementById("player_pagefullscreen_yes_" + divId).style.display = "none";
                document.getElementById("player_pagefullscreen_yes_mouseover_" + divId).style.display = "none";
                document.getElementById("player_pagefullscreen_no_" + divId).style.display = "block";
            }

            if (/macintosh|mac os x/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)) {
                //LiveControlsBar.prototype.controlBarShowOrHide('hide', divId, false);
                //20191205,兼容safari12版本控制条显示不全问题
                setTimeout(function() {
                    let controlsBar = document.getElementById("control_bar_" + divId);
                    //controlsBar.style.width = window.screen.width + "px";
                    LiveTimeshiftBar.prototype.playerResize(livePlayerObjs[divId]);
                    LiveControlsBar.prototype.controlBarShowOrHide('hide', divId, false);

                }, 700);

            }

            //document.body.style.overflow = "hidden";

        } else {
            ele.style.cssText = originalStyle;

            let pageObj = document.getElementById("player_pagefullscreen_" + divId);
            if (pageObj) {
                pageObj.setAttribute("originalStyle", originalStyle);
            }

            if (isByClick !== false) {
                LiveFullscreenBtn.prototype.exitFullscreen();
            }

            obj.setAttribute("isFullscreen", "false");

            if (document.getElementById("player_pagefullscreen_" + divId)) {
                document.getElementById("player_pagefullscreen_" + divId).setAttribute("isPageFullscreen", "false");
                LivePageFullscreenBtn.prototype.pageFullscreenClick(divId, "yes");

            }

            LiveFullscreenBtn.prototype.fullScreenMouseout(divId);

            //20191205

            if (/macintosh|mac os x/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)) {
                let bodyMinWidth = document.body.getAttribute("minWidth");
                if (bodyMinWidth) {
                    document.body.style.minWidth = bodyMinWidth;
                }

                setTimeout(function() {
                    let controlsBar = document.getElementById("control_bar_" + divId);
                    controlsBar.style.width = "100%";
                    LiveTimeshiftBar.prototype.playerResize(livePlayerObjs[divId]);

                }, 700);
            }

        }

        setTimeout(function() {
            if (document.getElementById("player_progress_pointer_" + divId)) {
                LiveProgressBar.prototype.getProgressPointerWidth(divId);

            }

        }, 200);

    }

    exitFullscreen() {
        let de = document;
        if (de.exitFullscreen) {
            de.exitFullscreen();
        } else if (de.mozCancelFullScreen) {
            de.mozCancelFullScreen();
        } else if (de.webkitCancelFullScreen) {
            de.webkitCancelFullScreen();
        }

        //document.body.style.overflow = "visible";

    }

    //鍏ㄥ睆鍜岄€€鍑哄叏灞�
    fullScreenMouseover(divId) {
        let obj = document.getElementById("player_fullscreen_" + divId);
        let fullscreenNo = document.getElementById("player_fullscreen_no_" + divId);
        let fullscreenNoMouseover = document.getElementById("player_fullscreen_no_mouseover_" + divId);
        let fullscreenYes = document.getElementById("player_fullscreen_yes_" + divId);
        let fullscreenYesMouseover = document.getElementById("player_fullscreen_yes_mouseover_" + divId);
        let msgTag = document.getElementById("player_fullscreen_msg_" + divId);

        if (obj.getAttribute("isFullscreen") === "false") {
            fullscreenNo.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenNoMouseover.style.display = "block";
            if (!isIPad()) {

                if (/macintosh|mac os x/i.test(navigator.userAgent) && navigator.userAgent.toLowerCase().indexOf("qqbrowser") > 0 && msgTag) {
                    msgTag.innerHTML = "该浏览器不支持全屏";
                } else {
                    msgTag.innerHTML = "全屏";
                }

            }

        } else {
            fullscreenNo.style.display = "none";
            fullscreenNoMouseover.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "block";
            if (!isIPad()) {
                msgTag.innerHTML = "退出全屏";
            }

        }

        if (!isIPad()) {
            msgTag.style.display = "block";
        }

    }

    fullScreenMouseout(divId) {
        let obj = document.getElementById("player_fullscreen_" + divId);
        let fullscreenNo = document.getElementById("player_fullscreen_no_" + divId);
        let fullscreenNoMouseover = document.getElementById("player_fullscreen_no_mouseover_" + divId);
        let fullscreenYes = document.getElementById("player_fullscreen_yes_" + divId);
        let fullscreenYesMouseover = document.getElementById("player_fullscreen_yes_mouseover_" + divId);
        let msgTag = document.getElementById("player_fullscreen_msg_" + divId);
        msgTag.style.display = "none";

        if (obj.getAttribute("isFullscreen") === "false") {
            fullscreenNoMouseover.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenNo.style.display = "block";

        } else {
            fullscreenNo.style.display = "none";
            fullscreenNoMouseover.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenYes.style.display = "block";
        }
    }

    checkFullscreen(divId) {

        let obj = document.getElementById("player_fullscreen_" + divId);

        var fullElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || null;

        if (!obj || obj.getAttribute("isFullByClick") === "true") {

            if (!/macintosh|mac os x/i.test(navigator.userAgent) || /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)) {
                setTimeout(function() {
                    var _player_width = window.screen.availWidth || window.screen.width;
                    var offsetWidth = parseInt(document.getElementById("h5player_" + divId).offsetWidth);

                    if (!fullElement && Math.abs(offsetWidth - _player_width) < 60) {

                        if (obj.getAttribute("isFullscreen") === "true") {
                            LiveFullscreenBtn.prototype.fullscreenClick(divId, false);
                            LiveFullscreenBtn.prototype.fullScreenMouseout(divId);
                        }
                    }
                }, 300);
            }

            return;
        }

        if (!fullElement) {

            if (obj.getAttribute("isFullscreen") === "true") {

                LiveFullscreenBtn.prototype.fullscreenClick(divId, false);
                LiveFullscreenBtn.prototype.fullScreenMouseout(divId);
            }

        }

        setTimeout(function() {
            if (document.getElementById("player_progress_pointer_" + divId)) {
                LiveProgressBar.prototype.getProgressPointerWidth(divId);

            }
        }, 200);
    }

}

class LiveMobileFullscreenBtn {

    constructor(divId, right) {
        this.initUi(divId, right);
        this.initEvents(divId);
        //设置按钮事件
    }

    initUi(divId, right) {
        let htmls = "";
        let textRight = right + 6;

        htmls = `             
        <div id="player_pagefullscreen_${divId}" isPageFullscreen="false" style="position:absolute;bottom:7px;right:${right}px;width:36px;height:33px;cursor:pointer;z-index:10;">
            <img id="player_pagefullscreen_no_${divId}" src="${playerContorlsImgDir}fullscreen_no.png" style="width:16px;height:13px;padding:10px">

            <img id="player_pagefullscreen_no_mouseover_${divId}" src="${playerContorlsImgDir}fullscreen_no_mouseover.png" style="width:24px;height:21px;padding:6px;display:none;">

            <img id="player_pagefullscreen_yes_${divId}" src="${playerContorlsImgDir}fullscreen_yes.png" style="width:16px;height:13px;padding:10px;display:none;">

            <img id="player_pagefullscreen_yes_mouseover_${divId}" src="${playerContorlsImgDir}fullscreen_yes_mouseover.png" style="width:24px;height:21px;padding:6px;display:none;">
        </div>

        <div id="player_pagefullscreen_msg_${divId}" style="position:absolute;opacity:0.9;display:none;bottom:${textRight}px;right:33px;height:20px;color:#FFF;background-color:rgba(38, 38, 38, 1);padding:3px 7px;font-size:14px;border-top-left-radius:3px;border-radius:4px;z-index:10;">
            网页全屏
        </div>   
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);

    }

    initEvents(divId) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        obj.addEventListener("click", this.pageFullscreenClick.bind(null, divId), false);
        if (!isIPad()) {
            obj.addEventListener("mouseover", this.pageFullScreenMouseover.bind(null, divId), false);
            obj.addEventListener("mouseout", this.pageFullScreenScreenMouseout.bind(null, divId), false);
        } else {
            //微信返回按钮的处理
            //if(navigator.userAgent.toLowerCase().indexOf("micromessenger")>0) {
            //    window.addEventListener("resize", this.pageFullscreenCheck.bind(null, divId), false);
            //}

            window.addEventListener("resize", this.pageFullscreenCheck.bind(null, divId), false);

            /*
            pushHistory();
            window.addEventListener("popstate", function(e) {
                alert("我监听到了浏览器的返回按钮事件啦");//根据自己的需求实现自己的功能
            }, false);
            function pushHistory() {

                var state = {
                    title: "title",
                    url: "#"
                };
                window.history.pushState(state, "title", "#");
            }
            */

        }

    }

    //网页全屏和退出网页全屏

    pageFullScreenMouseover(divId) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        let fullscreenNo = document.getElementById("player_pagefullscreen_no_" + divId);
        let fullscreenNoMouseover = document.getElementById("player_pagefullscreen_no_mouseover_" + divId);
        let fullscreenYes = document.getElementById("player_pagefullscreen_yes_" + divId);
        let fullscreenYesMouseover = document.getElementById("player_pagefullscreen_yes_mouseover_" + divId);
        //let msgTag = document.getElementById("player_pagefullscreen_msg_"+divId);

        if (obj.getAttribute("isPageFullscreen") === "false") {
            fullscreenNo.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenNoMouseover.style.display = "block";
            //msgTag.innerHTML = "网页全屏";

        } else {
            fullscreenNo.style.display = "none";
            fullscreenNoMouseover.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "block";
            //msgTag.innerHTML = "退出网页全屏";
        }

        //msgTag.style.display = "block";
    }

    pageFullScreenScreenMouseout(divId) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        let fullscreenNo = document.getElementById("player_pagefullscreen_no_" + divId);
        let fullscreenNoMouseover = document.getElementById("player_pagefullscreen_no_mouseover_" + divId);
        let fullscreenYes = document.getElementById("player_pagefullscreen_yes_" + divId);
        let fullscreenYesMouseover = document.getElementById("player_pagefullscreen_yes_mouseover_" + divId);
        let msgTag = document.getElementById("player_pagefullscreen_msg_" + divId);
        msgTag.style.display = "none";

        if (obj.getAttribute("isPageFullscreen") === "false") {
            fullscreenNoMouseover.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenNo.style.display = "block";

        } else {
            fullscreenNo.style.display = "none";
            fullscreenNoMouseover.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenYes.style.display = "block";
        }
    }

    pageFullsreenToCanvas(canvas, divId, type) {

        let w = document.body.clientWidth || window.innerWidth;
        let h = window.screen.availHeight || window.innerHeight;

        if (w / h < 1) {
            if (type === "nofull" && typeof playerOriginalWidth !== "undefined" && playerOriginalWidth) {
                w = w * playerOriginalWidth;
            }
            canvas.width = w * window.devicePixelRatio;
            canvas.height = w * 9 / 16 * window.devicePixelRatio;
        } else {
            canvas.height = h * window.devicePixelRatio;
            canvas.width = h * 16 / 9 * window.devicePixelRatio;
        }

        if (type === "nofull") {
            canvas.style.top = "0px";
            canvas.style.left = "0px";
            canvas.style.height = "100%";
            canvas.style.width = "100%";

            return;
        }

        if (navigator.userAgent.toLowerCase().indexOf("micromessenger") > 0) {
            h -= 20;
        }

        let canvasWidth = w;
        let canvasHeight = h;
        let canvasTop = 0;
        let canvasLeft = 0;
        if (w / h < 1) {
            canvasWidth = "100%";
            canvasHeight = w * livePlayerObjs[divId].h / livePlayerObjs[divId].w;
            canvasTop = (document.documentElement.clientHeight - canvasHeight) / 2;

        } else {
            canvasHeight = h;
            canvasWidth = h * livePlayerObjs[divId].w / livePlayerObjs[divId].h;

            canvasLeft = (w - canvasWidth) / 2;

        }

        canvas.style.position = "absolute";
        canvas.style.top = canvasTop + "px";
        canvas.style.left = canvasLeft + "px";

        canvasWidth += "";
        canvasHeight += "";
        if (canvasHeight.indexOf("%") !== -1) {
            canvas.style.height = canvasHeight;
        } else {
            canvas.style.height = canvasHeight + "px";
        }

        if (canvasWidth.indexOf("%") !== -1) {
            canvas.style.width = canvasWidth;
        } else {
            canvas.style.width = canvasWidth + "px";
        }

        canvas.style.width = "100%!important";
        canvas.style.height = "100%!important";
        canvas.style.top = "0!important";
        canvas.style.left = "0!important";
        canvas.style.right = "0!important";
        canvas.style.bottom = "0!important";
        canvas.style.position = "fixed!important";

        canvasLive(divId);

        //fullscreen(divId);

    }

    pageFullscreenClick(divId, isOriginal) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        let containerObj = document.getElementById(divId);

        let _player_width = document.body.clientWidth || window.innerWidth;
        let _player_height = document.documentElement.clientHeight || window.innerHeight;
        let controlsBar = document.getElementById("control_bar_" + divId);

        /*
        if(isCanvasSupported(divId)) {
            canvasFull(divId);
            return;
        }



        if(document.getElementById("h5player_"+divId) && document.getElementById("h5player_"+divId).currentTime>0.5 && document.getElementById("h5player_"+divId).currentTime<2) {
            return;
        }

        */

        obj.setAttribute("isByClick", "true");

        setTimeout(function() {
            obj.setAttribute("isByClick", "false");
        }, 500);

        let originalStyle = "";
        let isPageFullscreen = obj.getAttribute("isPageFullscreen");

        if (containerObj.getAttribute("originalStyle") && containerObj.getAttribute("originalStyle").length > 3) {
            originalStyle = containerObj.getAttribute("originalStyle");
        } else {
            originalStyle = containerObj.style.cssText;
            containerObj.setAttribute("originalStyle", originalStyle);
        }

        if (isPageFullscreen !== "true" && isOriginal !== "yes") {

            if (isCanvasSupported(divId)) {
                let canvas = document.getElementById("h5canvas_" + divId);
                LiveMobileFullscreenBtn.prototype.pageFullsreenToCanvas(canvas, divId);

                //canvasFull(divId);
                //obj.setAttribute("isPageFullscreen", "true");
                //return;
            }

            containerObj.style.position = "fixed";
            containerObj.style.left = "0";
            containerObj.style.top = "0";
            containerObj.style.width = "100%";
            containerObj.style.height = "100%";

            if (containerObj.requestFullscreen) {

                containerObj.requestFullscreen();
            } else if (containerObj.mozRequestFullScreen) {
                containerObj.mozRequestFullScreen();
            } else if (containerObj.webkitRequestFullScreen) {

                containerObj.webkitRequestFullScreen();
            }

            obj.setAttribute("isPageFullscreen", "true");

            if (controlsBar) {

                if (_player_width / _player_height < 1) {
                    controlsBar.style.bottom = "80px";
                } else {
                    controlsBar.style.bottom = "0px";
                }
            }

            if (document.getElementById("player_fullscreen_" + divId) && document.getElementById("player_fullscreen_" + divId).getAttribute("isFullscreen") === "true") {
                document.getElementById("player_fullscreen_no_mouseover_" + divId).style.display = "none";
                document.getElementById("player_fullscreen_yes_" + divId).style.display = "none";
                document.getElementById("player_fullscreen_yes_mouseover_" + divId).style.display = "none";
                document.getElementById("player_fullscreen_no_" + divId).style.display = "block";

                LiveFullscreenBtn.prototype.exitFullscreen();
                document.getElementById("player_fullscreen_" + divId).setAttribute("isFullscreen", "false");
            }

            //document.body.style.overflow = "hidden";

        } else {

            containerObj.style.cssText = originalStyle;

            _player_width = parseInt(_player_width);
            _player_height = parseInt(_player_height);
            if (_player_width / _player_height < 1) {
                if (typeof playerOriginalWidth !== "undefined" && playerOriginalWidth) {
                    _player_width = _player_width * playerOriginalWidth;
                }
                _player_height = _player_width * livePlayerObjs[divId].h / livePlayerObjs[divId].w;
            } else {
                _player_width = _player_height * livePlayerObjs[divId].w / livePlayerObjs[divId].h;
            }
            containerObj.style.width = _player_width + "px";
            containerObj.style.height = _player_height + "px";

            if (navigator.userAgent.toLowerCase().indexOf("micromessenger") > 0) {
                setTimeout(function() {

                    _player_width = document.body.clientWidth || window.innerWidth;
                    _player_height = document.documentElement.clientHeight || window.innerHeight;

                    _player_width = parseInt(_player_width);
                    _player_height = parseInt(_player_height);

                    if (_player_width / _player_height < 1) {
                        if (typeof playerOriginalWidth !== "undefined" && playerOriginalWidth) {
                            _player_width = _player_width * playerOriginalWidth;
                        }
                        _player_height = _player_width * livePlayerObjs[divId].h / livePlayerObjs[divId].w;
                    } else {
                        _player_width = _player_height * livePlayerObjs[divId].w / livePlayerObjs[divId].h;
                    }
                    containerObj.style.width = _player_width + "px";
                    containerObj.style.height = _player_height + "px";

                }, 420);

            }

            obj.setAttribute("isPageFullscreen", "false");

            let de = document;
            if (de.exitFullscreen) {
                de.exitFullscreen();
            } else if (de.mozCancelFullScreen) {
                de.mozCancelFullScreen();
            } else if (de.webkitCancelFullScreen) {
                de.webkitCancelFullScreen();
            }

            //document.body.style.overflow = "visible";

            if (isCanvasSupported(divId)) {
                let canvas = document.getElementById("h5canvas_" + divId);
                LiveMobileFullscreenBtn.prototype.pageFullsreenToCanvas(canvas, divId, "nofull");
                //exitfullscreen(divId);
                //obj.setAttribute("isPageFullscreen", "true");

            }

            if (controlsBar) {

                controlsBar.style.bottom = "0px";
            }

        }

        setTimeout(function() {
            if (document.getElementById("player_progress_pointer_" + divId)) {
                LiveProgressBar.prototype.getProgressPointerWidth(divId);

            }

            LiveMobileFullscreenBtn.prototype.pageFullScreenScreenMouseout(divId);
        }, 200);

    }

    pageFullscreenCheck(divId) {

        let obj = document.getElementById("player_pagefullscreen_" + divId);
        if (obj.getAttribute("isByClick") === "true") {

            return;
        }

        setTimeout(function() {
            let obj = document.getElementById("player_pagefullscreen_" + divId);
            let containerObj = document.getElementById(divId);
            if (obj.getAttribute("isPageFullscreen") === "true" && obj.getAttribute("isByClick") === "false") {
                obj.setAttribute("isPageFullscreen", "false");
                window.history.go(-1);

                return;
            }
        }, 310);

    }
}

class LivePageFullscreenBtn {

    constructor(divId, right) {
        this.initUi(divId, right);
        this.initEvents(divId);
        //设置按钮事件
    }

    initUi(divId, right) {
        let htmls = "";
        let textRight = right + 6;

        htmls = `             
        <div id="player_pagefullscreen_${divId}" isPageFullscreen="false" style="position:absolute;bottom:8px;right:${right}px;width:35px;height:32px;cursor:pointer;z-index:10;">
            <img id="player_pagefullscreen_no_${divId}" src="${playerContorlsImgDir}player_pagefullscreen_no.png" style="width:15px;height:12px;padding:10px">

            <img id="player_pagefullscreen_no_mouseover_${divId}" src="${playerContorlsImgDir}player_pagefullscreen_no_mouseover.png" style="width:23px;height:20px;padding:6px;display:none;">

            <img id="player_pagefullscreen_yes_${divId}" src="${playerContorlsImgDir}player_pagefullscreen_yes.png" style="width:15px;height:12px;padding:10px;display:none;">

            <img id="player_pagefullscreen_yes_mouseover_${divId}" src="${playerContorlsImgDir}player_pagefullscreen_yes_mouseover.png" style="width:23px;height:20px;padding:6px;display:none;">
        </div>

        <div id="player_pagefullscreen_msg_${divId}" style="position:absolute;opacity:0.9;display:none;bottom:${textRight}px;right:33px;height:20px;color:#FFF;background-color:rgba(38, 38, 38, 1);padding:3px 7px;font-size:14px;border-top-left-radius:3px;border-radius:4px;z-index:10;">
            网页全屏
        </div>   
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);

    }

    initEvents(divId) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        obj.addEventListener("click", this.pageFullscreenClick.bind(null, divId), false);
        obj.addEventListener("mouseover", this.pageFullScreenMouseover.bind(null, divId), false);
        obj.addEventListener("mouseout", this.pageFullScreenScreenMouseout.bind(null, divId), false);

    }

    //网页全屏和退出网页全屏

    pageFullScreenMouseover(divId) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        let fullscreenNo = document.getElementById("player_pagefullscreen_no_" + divId);
        let fullscreenNoMouseover = document.getElementById("player_pagefullscreen_no_mouseover_" + divId);
        let fullscreenYes = document.getElementById("player_pagefullscreen_yes_" + divId);
        let fullscreenYesMouseover = document.getElementById("player_pagefullscreen_yes_mouseover_" + divId);
        let msgTag = document.getElementById("player_pagefullscreen_msg_" + divId);

        if (obj.getAttribute("isPageFullscreen") === "false") {
            fullscreenNo.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenNoMouseover.style.display = "block";
            msgTag.innerHTML = "网页全屏";

        } else {
            fullscreenNo.style.display = "none";
            fullscreenNoMouseover.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "block";
            msgTag.innerHTML = "退出网页全屏";
        }

        msgTag.style.display = "block";
    }

    pageFullScreenScreenMouseout(divId) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        let fullscreenNo = document.getElementById("player_pagefullscreen_no_" + divId);
        let fullscreenNoMouseover = document.getElementById("player_pagefullscreen_no_mouseover_" + divId);
        let fullscreenYes = document.getElementById("player_pagefullscreen_yes_" + divId);
        let fullscreenYesMouseover = document.getElementById("player_pagefullscreen_yes_mouseover_" + divId);
        let msgTag = document.getElementById("player_pagefullscreen_msg_" + divId);
        msgTag.style.display = "none";

        if (obj.getAttribute("isFullscreen") === "false") {
            fullscreenNoMouseover.style.display = "none";
            fullscreenYes.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenNo.style.display = "block";

        } else {
            fullscreenNo.style.display = "none";
            fullscreenNoMouseover.style.display = "none";
            fullscreenYesMouseover.style.display = "none";
            fullscreenYes.style.display = "block";
        }
    }

    pageFullscreenClick(divId, isOriginal) {
        let obj = document.getElementById("player_pagefullscreen_" + divId);
        let containerObj = document.getElementById(divId);

        let originalStyle = "";
        let isPageFullscreen = obj.getAttribute("isPageFullscreen");

        if (obj.getAttribute("originalStyle") && obj.getAttribute("originalStyle").length > 3) {
            originalStyle = obj.getAttribute("originalStyle");
        } else {
            originalStyle = containerObj.getAttribute("style");
            obj.setAttribute("originalStyle", originalStyle);
            containerObj.setAttribute("originalStyle", originalStyle);
        }

        if (isPageFullscreen !== "true" && isOriginal !== "yes") {

            let nowWidth = parseInt(containerObj.style.width);
            let nowHeight = parseInt(containerObj.style.height);
            let originalWidth = 0;

            let widthIndex = originalStyle.indexOf("width:");

            if (widthIndex !== -1) {
                originalWidth = parseInt(originalStyle.substring(widthIndex + 6).replace(/(^\s*)|(\s*$)/g, ""));

            }

            if (/macintosh|mac os x/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)) {
                let bodyMinWidth = document.body.getAttribute("minWidth");
                if (bodyMinWidth) {
                    document.body.style.minWidth = window.screen.width + "px";
                }

            }

            if (Math.abs(nowWidth - originalWidth) > 10 && originalStyle.indexOf("height: " + nowHeight) !== -1) {
                originalStyle = originalStyle.replace('width: ' + originalWidth, "width: " + nowWidth);

                obj.setAttribute("originalStyle", originalStyle);
                containerObj.setAttribute("originalStyle", originalStyle);
            }

            containerObj.style.position = "fixed";
            containerObj.style.zIndex = "999";
            containerObj.style.top = "0px";
            containerObj.style.left = "0px";
            containerObj.style.bottom = "0px";
            containerObj.style.width = "100%";
            containerObj.style.height = "auto";
            containerObj.style.maxHeight = "100%";
            obj.setAttribute("isPageFullscreen", "true");

            document.getElementById("player_fullscreen_no_mouseover_" + divId).style.display = "none";
            document.getElementById("player_fullscreen_yes_" + divId).style.display = "none";
            document.getElementById("player_fullscreen_yes_mouseover_" + divId).style.display = "none";
            document.getElementById("player_fullscreen_no_" + divId).style.display = "block";

            if (document.getElementById("player_fullscreen_" + divId).getAttribute("isFullscreen") === "true") {
                LiveFullscreenBtn.prototype.exitFullscreen();
                document.getElementById("player_fullscreen_" + divId).setAttribute("isFullscreen", "false");
            }

            document.body.style.overflow = "hidden";

            if (typeof flashToWebFullWindow !== "undefined") {
                flashToWebFullWindow();
            }

        } else {

            if (/macintosh|mac os x/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)) {
                let bodyMinWidth = document.body.getAttribute("minWidth");
                if (bodyMinWidth) {
                    document.body.style.minWidth = bodyMinWidth;
                }

            }

            containerObj.style.cssText = originalStyle;
            obj.setAttribute("originalStyle", originalStyle);
            obj.setAttribute("isPageFullscreen", "false");

            document.body.style.overflow = "visible";

            if (typeof flashToNormalWindow !== "undefined") {
                flashToNormalWindow();
            }
        }

        setTimeout(function() {
            LiveProgressBar.prototype.getProgressPointerWidth(divId);

            if (document.getElementById("timeshift_epg_" + divId)) {
                LiveTimeshiftBar.prototype.playerResize(livePlayerObjs[divId]);
            }
        }, 300);

    }
}

class LiveSoundBar {
    constructor(divId, right) {
        this.soundTimer = null;
        this.isSoundBarMove = false
        this.initUi(divId, right);
        this.initEvents(divId);
        //设置按钮事件
        this.defaultVolume = 50;
        //默认声音值
        this.initSoundValueByDefaultVolum(divId);
    }

    initUi(divId, right) {
        let htmls = "";
        let textRight = right - 4;

        htmls = `             
        <div id="player_sound_btn_${divId}" volume="50" isMute="false" style="position:absolute;bottom:0px;right:${right}px;width:30px;height:45px;cursor:pointer;z-index:16;">
            <img id="player_sound_yes_${divId}" src="${playerContorlsImgDir}sound_yes.png" style="width:14px;height:14px;padding:14px 8px 17px">

            <img id="player_sound_yes_mouseover_${divId}" src="${playerContorlsImgDir}sound_yes_mouseover.png" style="width:22px;height:22px;padding:10px 4px 13px;display:none;">

            <img id="player_sound_no_${divId}" src="${playerContorlsImgDir}sound_mute.png" style="width:14px;height:14px;padding:14px 8px 17px;display:none;">

            <img id="player_sound_no_mouseover_${divId}" src="${playerContorlsImgDir}sound_mute_mouseover.png" style="width:22px;height:22px;padding:10px 4px 13px;display:none;">
        </div>


        <div id="player_sound_${divId}" style="position:absolute;display:none;opacity:0.9;font-size:14px;bottom:56px;right:${textRight}px;width:40px;height:120px;border-radius:4px;color:#FFF;background-color:rgba(38, 38, 38, 1);z-index:15;">

           <div style="position:relative;padding:10px;height:100px;left:0px;top:0px;cursor:pointer;">

                <div id="player_sound_bar_${divId}" style="position:absolute;left:18px;height:100px;width:4px;background-color:rgb(215, 215, 215);border-radius:2px;"></div>

                <div id="player_sound_bar_seted_${divId}" style="position:absolute;left:18px;top:70px;height:40px;width:4px;background-color:rgb(253,36,0);border-radius:2px;"></div>


                <div id="player_sound_bar_pointer_${divId}" style="position:absolute;left:13px;top:63px;height:14px;width:14px;padding:0px;z-index:12;">
                    <img id="player_sound_no_mouseover_${divId}" src="${playerContorlsImgDir}player_sound_pointer.png" style="width:14px;height:14px;">

                </div>

           </div>

            <div style="position:relative;opacity:0;height:12px;background-color:rgba(38, 38, 38, 1);"></div>


        </div>  
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);

    }

    initEvents(divId) {
        let obj = document.getElementById("player_sound_btn_" + divId);
        obj.addEventListener("click", this.soundClick.bind(null, divId, this), false);
        obj.addEventListener("mouseover", this.soundMouseover.bind(null, divId, this), false);
        obj.addEventListener("mouseout", this.soundMouseout.bind(null, divId, this), false);

        let obj2 = document.getElementById("player_sound_" + divId);
        obj2.addEventListener("click", this.setSoundValueByClick.bind(null, divId, this), false);
        obj2.addEventListener("mousedown", this.soundBarMoveStart.bind(null, divId, this), false);
        obj2.addEventListener("mouseup", this.soundBarMoveEnd.bind(null, divId, this), false);
        obj2.addEventListener("mousemove", this.setSoundValueByMove.bind(null, divId, this), false);
        obj2.addEventListener("mouseover", this.showPlayerSoundBar.bind(null, divId, this), false);
        obj2.addEventListener("mouseout", this.hidePlayerSoundBar.bind(null, divId, this), false);

    }

    soundMouseover(divId, soundBarObj) {
        let obj = document.getElementById("player_sound_btn_" + divId);
        let isMute = obj.getAttribute("isMute");
        let soundYes = document.getElementById("player_sound_yes_" + divId);
        let soundYesMouseover = document.getElementById("player_sound_yes_mouseover_" + divId);
        let soundNo = document.getElementById("player_sound_no_" + divId);
        let soundNoMouseover = document.getElementById("player_sound_no_mouseover_" + divId);
        if (isMute === "false") {
            soundYes.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundYesMouseover.style.display = "block";
        } else {
            soundYes.style.display = "none";
            soundYesMouseover.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "block";
        }

        if (document.getElementById("player_sound_" + divId).getAttribute("isShow") === "true") {
            clearTimeout(soundBarObj.soundTimer);
            document.getElementById("player_sound_" + divId).style.display = "block";
        }

    }

    soundMouseout(divId, soundBarObj) {
        let obj = document.getElementById("player_sound_btn_" + divId);
        let isMute = obj.getAttribute("isMute");
        let soundYes = document.getElementById("player_sound_yes_" + divId);
        let soundYesMouseover = document.getElementById("player_sound_yes_mouseover_" + divId);
        let soundNo = document.getElementById("player_sound_no_" + divId);
        let soundNoMouseover = document.getElementById("player_sound_no_mouseover_" + divId);
        if (isMute === "false") {
            soundYesMouseover.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundYes.style.display = "block";

        } else {
            soundYes.style.display = "none";
            soundYesMouseover.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundNo.style.display = "block";
        }

        soundBarObj.soundTimer = setTimeout(function() {
            document.getElementById("player_sound_" + divId).style.display = "none";
            document.getElementById("player_sound_" + divId).setAttribute("isShow", "false");
        }, 20);

    }

    switchSoundPointer(pos, divId) {
        let totalLen = parseInt(document.getElementById("player_sound_bar_" + divId).style.height);
        let setTop = 10 + totalLen - pos;
        //10为padding-top值
        let setedBar = document.getElementById("player_sound_bar_seted_" + divId);
        let pointerBar = document.getElementById("player_sound_bar_pointer_" + divId);
        let pointerLen = parseInt(pointerBar.style.height);
        setedBar.style.top = setTop + "px";
        setedBar.style.height = pos + "px";
        pointerBar.style.top = setTop - pointerLen / 2 + "px";

        document.getElementById("h5player_" + divId).volume = pos / 100;
        if (pos > 0) {
            document.getElementById("h5player_" + divId).muted = false;
        }
    }

    soundClick(divId, soundBarObj) {
        let obj = document.getElementById("player_sound_btn_" + divId);
        let isMute = obj.getAttribute("isMute");
        let volume = obj.getAttribute("volume");
        let soundYes = document.getElementById("player_sound_yes_" + divId);
        let soundYesMouseover = document.getElementById("player_sound_yes_mouseover_" + divId);
        let soundNo = document.getElementById("player_sound_no_" + divId);
        let soundNoMouseover = document.getElementById("player_sound_no_mouseover_" + divId);

        if (document.getElementById("player_sound_" + divId).style.display !== "none") {
            if (isMute === "false") {

                soundYesMouseover.style.display = "none";
                soundYes.style.display = "none";
                soundNo.style.display = "none";
                soundNoMouseover.style.display = "block";
                obj.setAttribute("isMute", "true");
                soundBarObj.switchSoundPointer(0, divId);

            } else {
                soundYes.style.display = "none";
                soundNo.style.display = "none";
                soundNoMouseover.style.display = "none";
                soundYesMouseover.style.display = "block";
                obj.setAttribute("isMute", "false");
                soundBarObj.switchSoundPointer(volume, divId);
            }
        } else {
            if (isMute === "true") {
                soundYes.style.display = "none";
                soundNo.style.display = "none";
                soundNoMouseover.style.display = "none";
                soundYesMouseover.style.display = "block";
                obj.setAttribute("isMute", "false");
                soundBarObj.switchSoundPointer(volume, divId);
            }
        }
        document.getElementById("player_sound_" + divId).style.display = "block";
        document.getElementById("player_sound_" + divId).setAttribute("isShow", "true");
        soundBarObj.isSoundBarMove = false;
    }

    showPlayerSoundBar(divId, soundBarObj) {
        if (document.getElementById("player_sound_" + divId).getAttribute("isShow") === "true") {
            clearTimeout(soundBarObj.soundTimer);
            document.getElementById("player_sound_" + divId).style.display = "block";
        }
    }

    hidePlayerSoundBar(divId, showPlayerSoundBar) {
        showPlayerSoundBar.soundTimer = setTimeout(function() {
            document.getElementById("player_sound_" + divId).style.display = "none";
            document.getElementById("player_sound_" + divId).setAttribute("isShow", "false");
        }, 20);

    }

    setSoundBtn(isMute, divId) {
        let soundYes = document.getElementById("player_sound_yes_" + divId);
        let soundYesMouseover = document.getElementById("player_sound_yes_mouseover_" + divId);
        let soundNo = document.getElementById("player_sound_no_" + divId);
        let soundNoMouseover = document.getElementById("player_sound_no_mouseover_" + divId);
        let soundBtn = document.getElementById("player_sound_btn_" + divId);

        if (isMute) {
            soundYes.style.display = "none";
            soundYesMouseover.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundNo.style.display = "block";
            soundBtn.setAttribute("isMute", "true");
        } else {
            soundYesMouseover.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundNo.style.display = "none";
            soundYes.style.display = "block";
            soundBtn.setAttribute("isMute", "false");
        }

    }

    //初始化鼠标位置

    initSoundValueByDefaultVolum(divId) {
        let totalLen = parseInt(document.getElementById("player_sound_bar_" + divId).style.height);
        let setedLen = this.defaultVolume;
        let soundBtn = document.getElementById("player_sound_btn_" + divId);
        //设置是否自动播放
        document.getElementById("h5player_" + divId).muted = false;

        if (document.getElementById("h5player_" + divId).muted) {
            setedLen = 0;
            this.setSoundBtn(true, divId);
            soundBtn.setAttribute("isMute", "true");
        } else {
            soundBtn.setAttribute("isMute", "false");
            soundBtn.setAttribute("volume", setedLen);
        }

        this.switchSoundPointer(setedLen, divId);

    }

    //点击音量条
    setSoundValueByClick(divId, soundBarObj) {
        event.preventDefault();
        let obj = document.getElementById("player_sound_" + divId);
        let e = window.event;
        let objTop = getOffsetTop(obj);
        //对象y位置
        let mouseY = e.clientY + window.pageYOffset;
        //鼠标y位置

        let fullscreenBtn = document.getElementById("player_fullscreen_" + divId);
        let pageFullscreenBtn = document.getElementById("player_pagefullscreen_" + divId);
        if (fullscreenBtn && fullscreenBtn.getAttribute("isFullscreen") === "true" || pageFullscreenBtn && pageFullscreenBtn.getAttribute("isPageFullscreen") === "true") {
            mouseY = e.clientY;
        }

        // 计算点击的相对位置
        let objY = mouseY - objTop;

        let totalLen = parseInt(document.getElementById("player_sound_bar_" + divId).style.height);
        let setedLen = 0;

        if (objY < 10) {

            setedLen = totalLen;
        } else if (objY > totalLen + 10) {
            setedLen = 0;
        } else {
            setedLen = totalLen + 10 - objY;
        }
        soundBarObj.switchSoundPointer(setedLen, divId);

        if (setedLen > 0) {
            soundBarObj.setSoundBtn(false, divId);
        } else {
            soundBarObj.setSoundBtn(true, divId);
        }

        document.getElementById("player_sound_btn_" + divId).setAttribute("volume", setedLen);

    }
    //拖动音量条

    setSoundValueByMove(divId, soundBarObj) {
        event.preventDefault();
        if (soundBarObj.isSoundBarMove) {
            soundBarObj.setSoundValueByClick(divId, soundBarObj);
        }

    }

    soundBarMoveStart(divId, soundBarObj) {
        event.preventDefault();
        soundBarObj.isSoundBarMove = true;
    }

    soundBarMoveEnd(divId, soundBarObj) {
        event.preventDefault();
        soundBarObj.isSoundBarMove = false;
    }

}

//音效
class LiveAudioSetBar {
    constructor(paras, right) {
        this.audioTimer = null;
        this.initUi(paras, right);
        this.initEvents(paras);
        //设置播放器容器事件
    }

    initUi(paras, right) {
        let htmls = "";
        let textRight = right - 44;
        htmls = ` 
        <div id="audio_${paras.divId}" style="position:absolute;font-size:14px;font-weight:400;height:45px;width:auto;bottom:0px;right:${right}px;text-align:center;z-index:15;">
            <div id="audio_show_${paras.divId}" style="cursor:pointer;padding:3px 13px;margin-top:8px;border-radius:20px;height:20px;line-height:20px;position:relative;color:#FFF;background-color:rgb(0, 0, 0);opacity:0.7;">
                原声
            </div>

        </div>
        <div id="audio_bar_${paras.divId}" style="position:absolute;display:none;opacity:0.9;padding:0px 10px;text-align:center;font-size:14px;font-weight:bold;line-height:14px;bottom:44px;right:${textRight}px;color:#FFF;z-index:16;">          


            <div id="audio_item_speaker_${paras.divId}" itemValue="loudspeaker" style="cursor:pointer;padding:0px 10px;margin:0px;background-color:rgba(38, 38, 38, 1);border-top-left-radius:4px;border-top-right-radius:4px;">
                <div style="padding:15px;border-bottom:2px solid rgb(20,20,20);">
                    沉浸 (音箱)
                </div>
            </div>

            <div id="audio_item_headset_${paras.divId}" itemValue="headset" style="cursor:pointer;padding:0px 10px;margin:0px;background-color:rgba(38, 38, 38, 1);">
                <div style="padding:15px;border-bottom:2px solid rgb(20,20,20);">
                    沉浸 (耳机)
                </div>
            </div>

            <div id="audio_item_acoustic_${paras.divId}" itemValue="acoustic" style="cursor:pointer;padding:0px 10px;margin:0px;background-color:rgba(38, 38, 38, 1);border-bottom-left-radius:4px;border-bottom-right-radius:4px;color:#bf0614;">
                <div style="padding:15px;">
                    原声
                </div>
            </div>



            <div style="position:relative;height:12px;padding:0px 20px;margin:0px;opacity:0;">

            </div>


        </div>       
        `;

        document.getElementById("control_bar_" + paras.divId).insertAdjacentHTML("afterBegin", htmls);
    }

    initEvents(paras) {

        let obj = document.getElementById("audio_" + paras.divId);
        obj.addEventListener("mouseover", this.audioMouseover.bind(null, this), false);
        obj.addEventListener("mouseout", this.audioMouseout.bind(null, paras, this), false);

        let obj1 = document.getElementById("audio_bar_" + paras.divId);
        obj1.addEventListener("mouseover", this.audioMouseover.bind(null, this), false);
        obj1.addEventListener("mouseout", this.audioMouseout.bind(null, paras, this), false);

        let obj2 = document.getElementById("audio_show_" + paras.divId);
        obj2.addEventListener("mouseover", this.audioBtnMouseover.bind(null, paras), false);
        obj2.addEventListener("mouseout", this.audioBtnMouseout.bind(null, paras, this), false);
        obj2.addEventListener("click", this.audioClick.bind(null, paras), false);

        document.getElementById("audio_item_speaker_" + paras.divId).addEventListener("click", this.audioClickItems.bind(null, paras, "speaker"), false);
        document.getElementById("audio_item_headset_" + paras.divId).addEventListener("click", this.audioClickItems.bind(null, paras, "headset"), false);
        document.getElementById("audio_item_acoustic_" + paras.divId).addEventListener("click", this.audioClickItems.bind(null, paras, "acoustic"), false);

        let player = document.getElementById("h5player_" + paras.divId);
        livePlayerObjs[paras.divId].audioObject = null;

        if (player) {
            player.addEventListener('play', function() {
                if (livePlayerObjs[paras.divId].audioObject && livePlayerObjs[paras.divId].audioObject.audioContext) {
                    try {
                        livePlayerObjs[paras.divId].audioObject.audioContext.resume();
                    } catch (e) {
                    }

                }
            });
        }

    }

    audioClick(paras) {
        let audioBar = document.getElementById("audio_bar_" + paras.divId);
        if (audioBar.style.display === "none") {
            audioBar.style.display = "block";
        } else {
            audioBar.style.display = "none";
        }
    }

    audioBtnMouseover(paras) {
        document.getElementById("audio_show_" + paras.divId).style.backgroundColor = "#bf0614";
        document.getElementById("audio_show_" + paras.divId).style.opacity = "1";

    }

    audioBtnMouseout(paras) {
        document.getElementById("audio_show_" + paras.divId).style.backgroundColor = "#000";
        document.getElementById("audio_show_" + paras.divId).style.opacity = "0.7";
    }

    audioMouseover(audioBarObj) {
        clearTimeout(audioBarObj.audioTimer);

    }

    audioMouseout(paras, audioBarObj) {
        let audioBar = document.getElementById("audio_bar_" + paras.divId);

        if (audioBar.style.display !== "none") {
            audioBarObj.audioTimer = setTimeout(function() {
                audioBar.style.display = "none";
            }, 50);
        }
    }

    audioClickItems(paras, num) {
        let isAudioInit = true;

        if (typeof LiveAudio2 === "undefined") {
            return;
        } else {
            if (!livePlayerObjs[paras.divId].audioObject) {
                let player = document.getElementById("h5player_" + paras.divId);

                if (player) {
                    try {
                        livePlayerObjs[paras.divId].audioObject = LiveAudio2.initByVideo(player);
                    } catch (e) {
                        isAudioInit = false;
                        livePlayerObjs[paras.divId].audioObject = null;
                    }

                }

            }

            if (!isAudioInit || !livePlayerObjs[paras.divId].audioObject) {
                return;
            }

        }
        let obj = document.getElementById("audio_item_" + num + "_" + paras.divId);
        let itemValue = obj.getAttribute("itemValue");
        let itemText = "";
        let audioBar = document.getElementById("audio_bar_" + paras.divId);
        let items = audioBar.children;
        let itemsLen = items.length;

        for (let i = 0; i < itemsLen; i++) {
            items[i].style.color = "#FFF";
        }

        try {
            LiveAudioSetBar.prototype.changeVoice(paras, itemValue);
        } catch (e) {
            isAudioInit = false;
        }

        if (!isAudioInit) {
            return;
        }

        obj.style.color = "#bf0614";
        switch (itemValue) {
        case "loudspeaker":
            itemText = "音箱";
            break;
        case "headset":
            itemText = "耳机";
            break;
        default:
            itemText = "原声";

        }

        document.getElementById("audio_show_" + paras.divId).innerHTML = itemText;

    }

    changeVoice(paras, audioType) {

        if (typeof LiveAudio2 !== "undefined") {
            if (audioType == 'loudspeaker') {
                LiveAudio2.connectDestLoudspeaker();
            } else if (audioType == 'headset') {
                LiveAudio2.connectDestHeadset();
            } else {
                LiveAudio2.dislinkerDest();
            }
        }

    }

}

//静音或不静音
class LiveSoundOrMute {
    constructor(paras, right, isMuted) {
        this.soundTimer = null;
        this.isSoundBarMove = false
        this.initUi(paras, right);
        this.initEvents(paras);
        //设置按钮事件
        this.defaultVolume = 50;
        //默认声音值

    }

    initUi(paras, right) {
        let htmls = "";
        let textRight = right - 4;
        let player = document.getElementById("h5player_" + paras.divId);
        let isMuted = paras.isMuted ? true : false;
        let soundShow = "none";
        let muteShow = "block";
        if (isMuted) {
            player.muted = true;
            soundShow = "none";
            muteShow = "block";
        } else {
            player.muted = false;
            player.volume = 0.5;
            soundShow = "block";
            muteShow = "none";
        }

        htmls = `             
        <div id="player_sound_btn_${paras.divId}" isMute="${isMuted}" style="position:absolute;bottom:0px;right:${right}px;width:46px;height:46px;cursor:pointer;z-index:16;">
            <img id="player_sound_yes_${paras.divId}" src="${playerContorlsImgDir}sound_yes.png" style="width:14px;height:14px;padding:16px;display:${soundShow};">

            <img id="player_sound_yes_mouseover_${paras.divId}" src="${playerContorlsImgDir}sound_yes_mouseover.png" style="width:22px;height:22px;padding:12px;display:none;">

            <img id="player_sound_no_${paras.divId}" src="${playerContorlsImgDir}sound_mute.png" style="width:14px;height:14px;padding:16px;display:${muteShow};">

            <img id="player_sound_no_mouseover_${paras.divId}" src="${playerContorlsImgDir}sound_mute_mouseover.png" style="width:22px;height:22px;padding:12px;display:none;">
        </div>
       
        `;

        document.getElementById("control_bar_" + paras.divId).insertAdjacentHTML("afterBegin", htmls);

    }

    initEvents(paras) {
        let obj = document.getElementById("player_sound_btn_" + paras.divId);
        obj.addEventListener("click", this.soundClick.bind(null, paras, this), false);
        obj.addEventListener("mouseover", this.soundMouseover.bind(null, paras, this), false);
        obj.addEventListener("mouseout", this.soundMouseout.bind(null, paras, this), false);

    }

    soundMouseover(paras, soundBarObj) {
        let obj = document.getElementById("player_sound_btn_" + paras.divId);
        let isMute = obj.getAttribute("isMute");
        let soundYes = document.getElementById("player_sound_yes_" + paras.divId);
        let soundYesMouseover = document.getElementById("player_sound_yes_mouseover_" + paras.divId);
        let soundNo = document.getElementById("player_sound_no_" + paras.divId);
        let soundNoMouseover = document.getElementById("player_sound_no_mouseover_" + paras.divId);
        if (isMute === "false") {
            soundYes.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundYesMouseover.style.display = "block";
        } else {
            soundYes.style.display = "none";
            soundYesMouseover.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "block";
        }

    }

    soundMouseout(paras, soundBarObj) {
        let obj = document.getElementById("player_sound_btn_" + paras.divId);
        let isMute = obj.getAttribute("isMute");
        let soundYes = document.getElementById("player_sound_yes_" + paras.divId);
        let soundYesMouseover = document.getElementById("player_sound_yes_mouseover_" + paras.divId);
        let soundNo = document.getElementById("player_sound_no_" + paras.divId);
        let soundNoMouseover = document.getElementById("player_sound_no_mouseover_" + paras.divId);
        if (isMute === "false") {
            soundYesMouseover.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundYes.style.display = "block";

        } else {
            soundYes.style.display = "none";
            soundYesMouseover.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundNo.style.display = "block";
        }

    }

    soundClick(paras, soundBarObj) {
        let obj = document.getElementById("player_sound_btn_" + paras.divId);
        let isMute = obj.getAttribute("isMute");
        let volume = obj.getAttribute("volume");
        let soundYes = document.getElementById("player_sound_yes_" + paras.divId);
        let soundYesMouseover = document.getElementById("player_sound_yes_mouseover_" + paras.divId);
        let soundNo = document.getElementById("player_sound_no_" + paras.divId);
        let soundNoMouseover = document.getElementById("player_sound_no_mouseover_" + paras.divId);
        let player = document.getElementById("h5player_" + paras.divId);
        if (isMute === "false") {

            soundYesMouseover.style.display = "none";
            soundYes.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "block";
            obj.setAttribute("isMute", "true");
            paras.isMuted = true;
            player.muted = true;

        } else {
            soundYes.style.display = "none";
            soundNo.style.display = "none";
            soundNoMouseover.style.display = "none";
            soundYesMouseover.style.display = "block";
            obj.setAttribute("isMute", "false");
            paras.isMuted = false;
            player.muted = false;
            player.volume = 0.5;

        }
    }

}

class LiveTileShow {
    constructor(paras, left) {

        this.initUi(paras, left);
        this.initEvents(paras);
        //设置播放器容器事件

    }

    initUi(paras, left) {
        let htmls = "";
        htmls = `             
        <div id="title_${paras.divId}" style="position:absolute;cursor:pointer;left:${left}px;bottom:16px;width:auto;max-width:300px;height:16px;z-index:10;color:#FFF;font-size:14px;line-height:16px;overflow:hidden;">
            
        </div>        
        `;

        document.getElementById("control_bar_" + paras.divId).insertAdjacentHTML("afterBegin", htmls);

        let textTop = 5;
        if (parseInt(paras.h) < 290) {
            textTop = 4;
        }

        htmls = `             
        <div id="isplaying_text_${paras.divId}" style="position:absolute;cursor:pointer;right:20px;top:${textTop}px;width:75px;height:18px;z-index:10;color:#FFF;overflow:hidden;">
            <img src="${playerContorlsImgDir}small_isplaying.png" style="width:75px;height:18px;">
        </div>        
        `;

        document.getElementById(paras.divId).insertAdjacentHTML("afterBegin", htmls);

    }

    initEvents(paras) {
        this.getEpgFromApi(paras);
        let titleBar = document.getElementById("title_" + paras.divId);
        titleBar.addEventListener("click", this.jumpToUrl.bind(null, paras));

    }

    getEpgFromApi(paras) {
        livePlayerObjs[paras.divId].start = 0;
        livePlayerObjs[paras.divId].end = 0;
        let stamp = LiveTimeshiftBar.prototype.getNowTimestamp(paras);

        let nowDate = new Date(stamp * 1000);
        let epgMonth = nowDate.getMonth() + 1 + "";
        if (epgMonth.length < 2) {
            epgMonth = "0" + epgMonth;
        }
        let epgDay = nowDate.getDate() + "";
        if (epgDay.length < 2) {
            epgDay = "0" + epgDay;
        }
        let epgDate = nowDate.getFullYear() + epgMonth + epgDay;

        let epgUrl = "http://api.cntv.cn/epg/epginfo?serviceId=shiyi&d=" + epgDate + "&c=" + paras.t + "&cb=" + "LiveTileShow.prototype.getEpg";
        if (paras.isHttps === "true") {
            epgUrl = epgUrl.replace("http://", "https://");
        }

        LazyLoad.js(epgUrl, function() {
            setTimeout(function() {
                LiveTileShow.prototype.getEpg(liveEpgJsonList, paras);
            }, 50);
        });

    }

    getEpg(epg, paras) {
        if (!paras) {
            liveEpgJsonList = epg;
            return;
        }

        if (epg && epg[paras.t] && Array.isArray(epg[paras.t].program)) {
            livePlayerObjs[paras.divId].epg = epg[paras.t].program;

            livePlayerObjs[paras.divId].start = livePlayerObjs[paras.divId].epg[0].st;

            let showTime = livePlayerObjs[paras.divId].epg[0].showTime;
            let arr = showTime.split(":");

            livePlayerObjs[paras.divId].start = parseInt(livePlayerObjs[paras.divId].start) - parseInt(arr[0]) * 3600 - parseInt(arr[1]) * 60;
            let startHour = parseInt(livePlayerObjs[paras.divId].start / 3600);
            livePlayerObjs[paras.divId].start = startHour * 3600;

            if (!livePlayerObjs[paras.divId].end) {
                LiveTimeshiftBar.prototype.getNowTimestamp(paras);
            }

            livePlayerObjs[paras.divId].end = parseInt(livePlayerObjs[paras.divId].end);

            LiveTileShow.prototype.updateTitleAndCheckCopyright(paras);
        }

        let titleBar = document.getElementById("title_" + paras.divId);
        if (titleBar && epg && epg[paras.t] && epg[paras.t].isLive) {
            titleBar.innerHTML = epg[paras.t].isLive;
        }

    }

    updateTitleAndCheckCopyright(paras) {
        let updateInterval = 20;
        let title = "";
        clearInterval(livePlayerObjs[paras.divId].titleUpdateTimer);
        let isCheckCopyright = true;
        let nowLiveTime = livePlayerObjs[paras.divId].end;

        livePlayerObjs[paras.divId].titleUpdateTimer = setInterval(function() {
            livePlayerObjs[paras.divId].end += updateInterval;
            let epgIndex = 0;
            for (let item of livePlayerObjs[paras.divId].epg) {

                if ((Math.abs(nowLiveTime - livePlayerObjs[paras.divId].end) < updateInterval + 0.5) && (nowLiveTime - item.st < 0) && (livePlayerObjs[paras.divId].end - item.st < 0)) {

                    livePlayerObjs[paras.divId].epg[0].startPublicChecked = true;

                    if (document.getElementById("error_msg_" + paras.divId) || livePlayerObjs[paras.divId].vdn && livePlayerObjs[paras.divId].vdn.public != "1") {
                        livePlayerObjs[paras.divId].epg[0].startPublic = "0";
                    } else {
                        livePlayerObjs[paras.divId].epg[0].startPublic = "1";
                    }
                }

                if ((Math.abs(nowLiveTime - livePlayerObjs[paras.divId].end) < updateInterval + 0.5) && (nowLiveTime - item.st > 0 && nowLiveTime - item.et < 0) && (livePlayerObjs[paras.divId].end - item.st > 0 && livePlayerObjs[paras.divId].end - item.et < 0)) {

                    livePlayerObjs[paras.divId].epg[epgIndex].publicChecked = true;

                    if (document.getElementById("error_msg_" + paras.divId) || livePlayerObjs[paras.divId].vdn && livePlayerObjs[paras.divId].vdn.public != "1") {
                        livePlayerObjs[paras.divId].epg[epgIndex].public = "0";
                    } else {
                        livePlayerObjs[paras.divId].epg[epgIndex].public = "1";
                    }
                }

                epgIndex++;

                if (livePlayerObjs[paras.divId].end - item.st < 0) {
                    title = "";
                    break;
                }

                if (livePlayerObjs[paras.divId].end - item.st > 0 && livePlayerObjs[paras.divId].end - item.et < 0) {

                    title = item.t;
                    let titleBar = document.getElementById("title_" + paras.divId);
                    if (titleBar) {
                        titleBar.innerHTML = title;

                    }
                    break;
                }

            }

            if (livePlayerObjs[paras.divId].end - livePlayerObjs[paras.divId].start - 24 * 3600 > 0) {
                clearInterval(livePlayerObjs[paras.divId].titleUpdateTimer);
                LiveTileShow.prototype.getEpgFromApi(paras);
            }

            LiveTimeshiftBar.prototype.checkCopyright(paras, livePlayerObjs[paras.divId].end);

        }, updateInterval * 1000);
    }

    jumpToUrl(paras) {
        let jumpUrl = "http://tv.cctv.com/live/";
        if (livePlayerObjs[paras.divId].t) {
            jumpUrl += livePlayerObjs[paras.divId].t;
        }
        window.open(jumpUrl, "_blank");
    }

}

class LiveSetupBar {
    constructor(divId, right) {
        this.setShowTimer = null;
        this.initUi(divId, right);
        this.initEvents(divId);
        //设置播放器容器事件
    }

    initUi(divId, right) {
        let htmls = "";
        let textRight = right - 65;
        htmls = `             
        <div id="player_set_${divId}" style="position:absolute;bottom:0px;right:${right}px;width:30px;height:45px;cursor:pointer;z-index:16;">
            <img id="player_set_btn_${divId}" src="${playerContorlsImgDir}set.png" style="display:inline;width:14px;height:14px;padding:14px 8px 17px;">
            <img id="player_set_btn_mouseover_${divId}" src="${playerContorlsImgDir}set_mouseover.png" style="width:22px;height:22px;padding:10px 4px 13px;display:none;">
        </div>

        <div id="player_set_bar_${divId}" style="position:absolute;opacity:0.9;font-size:14px;bottom:44px;right:68px;width:170px;padding:0px 0px 12px;color:#FFF;z-index:15;display:none;">

            

            <div id="set_bar_1_${divId}" isOn="true" style="position:relative;height:30px;background-color:rgba(38, 38, 38, 1);cursor:pointer;border-top-left-radius:4px;border-top-right-radius:4px;">
                <div style="position:absolute;left:10px;top:10px">
                   自动播放下一集
                </div>

                <div style="position:absolute;right:17px;top:17px;height:6px;line-height:6px;text-align:center;display:table-cell;vertical-align:middle;">
                    <img id="seted_false_1_${divId}" style="width:22px;height:6px;display:none;vertical-align:middle;" src="${playerContorlsImgDir}seted_false.png">
                    <img id="seted_true_1_${divId}" style="width:22px;height:6px;display:table-cell;vertical-align:middle;" src="${playerContorlsImgDir}seted_true.png">
                </div>

                <div id="seted_pointer_1_${divId}" style="position:absolute;right:10px;top:13px">
                    <img style="width:14px;height:14px" src="${playerContorlsImgDir}seted_pointer.png">
                </div>
            </div>


            <div id="set_bar_2_${divId}" isOn="false" style="position:relative;height:30px;background-color:rgba(38, 38, 38, 1);cursor:pointer;">
                <div style="position:absolute;left:10px;top:10px">
                    单集循环播放
                </div>

                <div style="position:absolute;right:17px;top:17px;height:6px;line-height:6px;text-align:center;display:table-cell;vertical-align:middle;">
                    <img id="seted_false_2_${divId}" style="width:22px;height:6px;vertical-align:middle;display:table-cell;" src="${playerContorlsImgDir}seted_false.png">
                    <img id="seted_true_2_${divId}" style="width:22px;height:6px;display:none;vertical-align:middle;" src="${playerContorlsImgDir}seted_true.png">
                </div>

                <div id="seted_pointer_2_${divId}" style="position:absolute;right:32px;top:13px;">
                    <img style="width:14px;height:14px" src="${playerContorlsImgDir}seted_pointer.png">
                </div>
            </div>


            <div style="position:relative;height:12px;background-color:rgba(38, 38, 38, 1);border-bottom-left-radius:4px;border-bottom-right-radius:4px;">

            </div>


        </div>      
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);
    }

    initEvents(divId) {

        let obj = document.getElementById("player_set_" + divId);
        obj.addEventListener("mouseover", this.SetBtnMouseover.bind(null, divId, this), false);
        obj.addEventListener("mouseout", this.SetBtnMouseout.bind(null, divId, this), false);
        obj.addEventListener("click", this.showSetBar.bind(null, divId), false);

        let obj1 = document.getElementById("player_set_bar_" + divId);
        obj1.addEventListener("mouseover", this.SetBarMouseover.bind(null, this), false);
        obj1.addEventListener("mouseout", this.SetBarMouseout.bind(null, divId, this), false);

        document.getElementById("set_bar_1_" + divId).addEventListener("click", this.setItemClick.bind(null, divId, "1"), false);
        document.getElementById("set_bar_2_" + divId).addEventListener("click", this.setItemClick.bind(null, divId, "2"), false);

    }

    SetBarMouseover(setupBarObj) {
        clearTimeout(setupBarObj.setShowTimer);
    }

    SetBarMouseout(divId, setupBarObj) {
        setupBarObj.setShowTimer = setTimeout(function() {
            document.getElementById("player_set_bar_" + divId).style.display = "none";

        }, 50);
    }

    SetBtnMouseover(divId, setupBarObj) {

        clearTimeout(setupBarObj.setShowTimer);
        document.getElementById("player_set_btn_" + divId).style.display = "none";
        document.getElementById("player_set_btn_mouseover_" + divId).style.display = "block";

    }

    SetBtnMouseout(divId, setupBarObj) {

        document.getElementById("player_set_btn_mouseover_" + divId).style.display = "none";
        document.getElementById("player_set_btn_" + divId).style.display = "block";

        setupBarObj.setShowTimer = setTimeout(function() {
            document.getElementById("player_set_bar_" + divId).style.display = "none";

        }, 50);
    }

    showSetBar(divId) {
        let obj = document.getElementById("player_set_bar_" + divId);
        if (obj.style.display == "none") {
            obj.style.display = "block";
        } else {
            obj.style.display = "none";
        }

    }

    setItemClick(divId, num) {
        let obj = document.getElementById("set_bar_" + num + "_" + divId);
        let isOn = obj.getAttribute("isOn");
        let setPointer = document.getElementById("seted_pointer_" + num + "_" + divId);
        if (isOn === "false") {

            document.getElementById("seted_false_" + num + "_" + divId).style.display = "none";
            document.getElementById("seted_true_" + num + "_" + divId).style.display = "table-cell";
            setPointer.style.right = "10px";
            setPointer.style.transition = "right 0.3s";
            obj.setAttribute("isOn", "true");
        } else {
            document.getElementById("seted_true_" + num + "_" + divId).style.display = "none";
            document.getElementById("seted_false_" + num + "_" + divId).style.display = "table-cell";
            setPointer.style.right = "32px";
            setPointer.style.transition = "right 0.3s";
            obj.setAttribute("isOn", "false");
        }

    }
}

class LiveResolutionBar {
    constructor(divId, right) {
        this.resolutionTimer = null;
        this.resolutionList = new Map();
        this.initUi(divId, right);
        this.initEvents(divId);
        //设置播放器容器事件
    }

    initUi(divId, right) {
        let htmls = "";
        let textRight = right - 40;
        let levels = livePlayerObjs[divId].video.hls.levels;
        let levelsLen = levels.length;
        let levelsHtml = ``;
        let topRadius = "";
        let bottomRadius = "";
        let resolution = "";
        let resolutionMsg = "";
        let selectedBtnMsg = "";
        let allowedLastLevel = 0;
        let bottomItemStyle = "";
        let selectedLevelColor = "";
        let lowestBitrate = 250000;

        for (let i = levelsLen - 1; i > -1; i--) {

            if (levels[i].bitrate < lowestBitrate) {
                break
            }
            allowedLastLevel = i;
        }

        for (let i = levelsLen - 1; i > -1; i--) {

            if (levels[i].bitrate >= 6048000) {
                resolution = "2560";
                resolutionMsg = `<span style="color:rgb(255,195,111)">4K</span>`;
                if (i == livePlayerObjs[divId].video.hls.startLevel) {
                    selectedBtnMsg = "4K";
                }

                this.resolutionList.set(resolution, "4K");

            } else if (levels[i].bitrate >= 2548000 && levels[i].bitrate < 6048000) {
                resolution = "1080";
                resolutionMsg = `蓝光`;
                if (i == livePlayerObjs[divId].video.hls.startLevel) {
                    selectedBtnMsg = "蓝光";
                }

                this.resolutionList.set(resolution, "蓝光");

            } else if (levels[i].bitrate >= 1548000 && levels[i].bitrate < 2548000) {

                resolution = "720";
                resolutionMsg = `超清`;
                if (i == livePlayerObjs[divId].video.hls.startLevel) {
                    selectedBtnMsg = "超清";
                }

                this.resolutionList.set(resolution, "超清");

            } else if (levels[i].bitrate >= 1100000 && levels[i].bitrate < 1548000) {
                resolution = "540";
                resolutionMsg = `高清`;
                if (i == livePlayerObjs[divId].video.hls.startLevel) {
                    selectedBtnMsg = "高清";
                }

                this.resolutionList.set(resolution, "高清");

            } else if (levels[i].bitrate >= 700000 && levels[i].bitrate < 1100000) {
                resolution = "480";
                resolutionMsg = `标清`;
                if (i == livePlayerObjs[divId].video.hls.startLevel) {
                    selectedBtnMsg = "标清";
                }

                this.resolutionList.set(resolution, "标清");

            } else {
                resolution = "360";
                resolutionMsg = `流畅`;
                if (i == livePlayerObjs[divId].video.hls.startLevel) {
                    selectedBtnMsg = "流畅";
                }

                this.resolutionList.set(resolution, "流畅");

            }

            if (i == levelsLen - 1) {
                topRadius = "border-top-left-radius:4px;border-top-right-radius:4px;";
            } else {
                topRadius = "";
            }

            if (i == allowedLastLevel) {
            } else {
                bottomRadius = "";

            }

            bottomItemStyle = "padding:15px;border-bottom:2px solid rgb(20,20,20);";

            if (i == livePlayerObjs[divId].video.hls.startLevel) {
                selectedLevelColor = "color:rgb(253,36,0);";
            } else {
                selectedLevelColor = "";
            }

            levelsHtml += `<div id="resolution_item_${resolution}_${divId}" level="${i}" itemValue="${resolution}" style="cursor:pointer;padding:0px 10px;margin:0px;background-color:rgba(38,38,38,1);${selectedLevelColor}${topRadius}${bottomRadius}">
                <div style="${bottomItemStyle}">
                    ${resolutionMsg}
                </div>

            </div>`;

        }

        if (selectedBtnMsg) {
            levelsHtml += `<div style="position:relative;height:12px;padding:0px 20px;margin:0px;opacity:0;">

            </div>`;

        }

        if (livePlayerObjs[divId].video.hls.startLevel < 0) {
            selectedLevelColor = "color:rgb(253,36,0);";
        }

        bottomRadius = "border-bottom-left-radius:4px;border-bottom-right-radius:4px;";
        bottomItemStyle = "padding:15px;";

        levelsHtml += `<div id="resolution_item_auto_${divId}" level="-1" itemValue="auto" style="cursor:pointer;padding:0px 10px;margin:0px;background-color:rgba(38,38,38,1);${selectedLevelColor}${bottomRadius}">
                <div style="${bottomItemStyle}">
                    自动
                </div>

            </div>`;

        if (selectedBtnMsg.length < 2) {
            resolution = "auto";
            resolutionMsg = `自动`;
            selectedBtnMsg = "自动";

            this.resolutionList.set(resolution, "自动");
        }

        htmls = ` 
        <div id="player_resolution_${divId}" style="position:absolute;font-size:14px;font-weight:400;height:45px;width:auto;bottom:0px;right:${right - 17}px;text-align:center;z-index:15;">
            <div id="player_resolution_show_${divId}" style="cursor:pointer;padding:3px 13px;margin-top:8px;border-radius:20px;height:20px;line-height:20px;position:relative;color:#FFF;background-color:#000;opacity:0.7;">
                ${selectedBtnMsg}
            </div>

        </div>             
        <div id="player_resolution_bar_${divId}" style="position:absolute;display:none;opacity:0.9;padding: 0px 10px;text-align:center;font-size:14px;font-weight:bold;line-height:14px;bottom:44px;right:${textRight}px;color:#FFF;z-index:16;">
            ${levelsHtml}
        </div>        
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);
    }

    initEvents(divId) {

        let obj = document.getElementById("player_resolution_" + divId);
        obj.addEventListener("mouseover", this.resolutionMouseover.bind(null, this), false);
        obj.addEventListener("mouseout", this.resolutionMouseout.bind(null, divId, this), false);

        let obj1 = document.getElementById("player_resolution_bar_" + divId);
        obj1.addEventListener("mouseover", this.resolutionMouseover.bind(null, this), false);
        obj1.addEventListener("mouseout", this.resolutionMouseout.bind(null, divId, this), false);

        let obj2 = document.getElementById("player_resolution_show_" + divId);
        obj2.addEventListener("mouseover", this.resolutionBtnMouseover.bind(null, divId), false);
        obj2.addEventListener("mouseout", this.resolutionBtnMouseout.bind(null, divId), false);
        obj2.addEventListener("click", this.resolutionClick.bind(null, divId), false);

        for (let[k,v] of this.resolutionList) {
            document.getElementById("resolution_item_" + k + "_" + divId).addEventListener("click", this.resolutionClickItems.bind(null, divId, k, this), false);
        }

    }

    resolutionClick(divId) {
        let resolutionBar = document.getElementById("player_resolution_bar_" + divId);
        if (resolutionBar.style.display === "none") {
            resolutionBar.style.display = "block";
        } else {
            resolutionBar.style.display = "none";
        }
    }

    resolutionBtnMouseover(divId) {
        let btn = document.getElementById("player_resolution_show_" + divId);
        btn.style.opacity = "1";
        btn.style.color = "#FFF";
        btn.style.backgroundColor = "#bf0614";

    }

    resolutionBtnMouseout(divId) {
        let btn = document.getElementById("player_resolution_show_" + divId);
        btn.style.opacity = "0.7";
        btn.style.color = "#FFF";
        document.getElementById("player_resolution_show_" + divId).style.backgroundColor = "#000";
    }

    resolutionMouseover(resolutionBarObj) {
        clearTimeout(resolutionBarObj.resolutionTimer);

    }

    resolutionMouseout(divId, resolutionBarObj) {
        let resolutionBar = document.getElementById("player_resolution_bar_" + divId);
        if (resolutionBar.style.display !== "none") {
            resolutionBarObj.resolutionTimer = setTimeout(function() {
                resolutionBar.style.display = "none";
            }, 50);
        }
    }

    resolutionClickItems(divId, num, resolutionBarObj) {
        let obj = document.getElementById("resolution_item_" + num + "_" + divId);
        let level = obj.getAttribute("level");
        let showValue = "";

        for (let[k,v] of resolutionBarObj.resolutionList) {
            document.getElementById("resolution_item_" + k + "_" + divId).style.color = "#FFF";
            if (num == k) {
                document.getElementById("resolution_item_" + k + "_" + divId).style.color = "rgb(253,36,0)";
                showValue = v;
            }
        }

        obj.style.color = "rgb(253,36,0)"
        document.getElementById("player_resolution_show_" + divId).innerHTML = showValue;

        livePlayerObjs[divId].video.hls.nextLevel = parseInt(level);

    }
}

class LiveProgressBar {
    constructor(divId, right) {
        this.isPointerMove = false;
        this.initUi(divId, right);
        this.initEvents(divId);
        //设置播放器容器事件
    }

    initUi(divId) {
        let htmls = "";
        let pointerIsShow = "none";
        let defaultHeight = 2;
        if (isIPad()) {
            pointerIsShow = "block";
            defaultHeight = 4;
        }
        htmls = ` 
        <div id="player_progress_${divId}" style="position:absolute;width:100%;height:10px;bottom:44px;left:0px;z-index:13;opacity:0">

        </div>

        <div id="player_progress_total_${divId}" style="position:absolute;width:100%;height:${defaultHeight}px;bottom:48px;left:0px;white-space:nowrap;background-color:gray;margin-top:5px;z-index:10;">

        </div>

        <div id="player_progress_played_${divId}" style="position:absolute;width:0%;height:${defaultHeight}px;bottom:48px;left:0px;white-space:nowrap;background-color:rgb(253,36,0);z-index:11;">

        </div>

        <div id="player_progress_cached_${divId}" style="position:absolute;width:0%;height:${defaultHeight}px;bottom:48px;left:0%;white-space:nowrap;background-color:rgb(254,254,254);z-index:10;">
        </div>


        <div id="player_progress_pointer_${divId}" style="position:absolute;width:24px;height:24px;bottom:38px;left:-12px;white-space:nowrap;z-index:20;display:${pointerIsShow};">
            <img src="${playerContorlsImgDir}progress_pointer.png" style="width:14px;height:14px;height:14px;padding:5px;">
        </div>
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);

        this.getProgressPointerWidth(divId);

    }

    initEvents(divId) {

        let obj = document.getElementById("player_progress_" + divId);
        obj.addEventListener("mouseover", this.progressMouseover.bind(null, divId), false);
        obj.addEventListener("mouseout", this.progressMouseout.bind(null, divId, this), false);
        obj.addEventListener("click", this.clickProgress.bind(null, divId), false);

        let obj1 = document.getElementById("player_progress_pointer_" + divId);

        obj1.addEventListener("mouseover", this.progressMouseover.bind(null, divId), false);
        obj1.addEventListener("mouseout", this.progressMouseout.bind(null, divId), false);

        if (isIPad()) {
            obj1.addEventListener("touchstart", this.pointerMousedown.bind(null, divId, this), false);
            document.body.addEventListener("touchmove", this.progressByBodyMousemove.bind(null, divId, this), false);
            document.body.addEventListener("touchend", this.progressByBodyMouseup.bind(null, divId, this), false);
        } else {

            obj1.addEventListener("mousedown", this.pointerMousedown.bind(null, divId, this), false);

            document.body.addEventListener("mousemove", this.progressByBodyMousemove.bind(null, divId, this), false);
            document.body.addEventListener("mouseup", this.progressByBodyMouseup.bind(null, divId, this), false);
        }

    }

    progressMouseover(divId) {
        document.getElementById("player_progress_total_" + divId).style.height = "4px";
        document.getElementById("player_progress_played_" + divId).style.height = "4px";
        document.getElementById("player_progress_cached_" + divId).style.height = "4px";
        document.getElementById("player_progress_pointer_" + divId).style.display = "block";

    }
    progressMouseout(divId) {

        if (isIPad()) {
            document.getElementById("player_progress_total_" + divId).style.height = "4px";
            document.getElementById("player_progress_played_" + divId).style.height = "4px";
            document.getElementById("player_progress_cached_" + divId).style.height = "4px";
            document.getElementById("player_progress_pointer_" + divId).style.display = "block";
        } else {
            document.getElementById("player_progress_total_" + divId).style.height = "2px";
            document.getElementById("player_progress_played_" + divId).style.height = "2px";
            document.getElementById("player_progress_cached_" + divId).style.height = "2px";
            document.getElementById("player_progress_pointer_" + divId).style.display = "none";
        }

    }
    clickProgress(divId, event) {
        let e = event || window.event;
        clearInterval(livePlayerObjs[divId].video.playedTimer);
        LiveProgressBar.prototype.setProgressPointerPos(e, divId, true);

    }

    getProgressPointerWidth(divId) {
        let containerWidth = parseFloat(document.getElementById(divId).offsetWidth);
        let pointer = document.getElementById("player_progress_pointer_" + divId);

        if (pointer) {
            livePlayerObjs[divId].video.progressPointerWidth = parseInt(pointer.style.width) / containerWidth * 100 * 0.5;
        }

    }

    setProgressBufferedPos(divId, buffered) {
        let bufferedBar = document.getElementById("player_progress_cached_" + divId);
        let total = livePlayerObjs[divId].video.duration;
        bufferedBar.style.width = (buffered / total) * 100 + "%";
    }

    setProgressPointerPos(e, divId, seeked) {
        let objLeft = getOffsetLeft(document.getElementById(divId));
        //对象x位置
        let mouseX = (isIPad() && e.changedTouches ? e.changedTouches[0].clientX : e.clientX) + (window.pageXOffset ? window.pageXOffset : document.documentElement.scrollLeft);
        //姒х姵鐖娴ｅ秶鐤�

        //璁＄畻鐐瑰嚮鐨勭浉瀵逛綅缃�
        let objX = mouseX - objLeft;

        let containerWidth = parseFloat(document.getElementById(divId).offsetWidth);
        let newLeft = objX / containerWidth * 100;
        if (newLeft > 100) {
            newLeft = 100;
        }

        let pointer = document.getElementById("player_progress_pointer_" + divId);
        let pointerLelft = newLeft - livePlayerObjs[divId].video.progressPointerWidth;

        document.getElementById("player_progress_played_" + divId).style.width = newLeft + "%";
        pointer.style.left = pointerLelft + "%";

        if (seeked) {
            let player = document.getElementById("h5player_" + divId);

            let start = newLeft / 100 * livePlayerObjs[divId].video.duration;

            let pointerStart = start;
            //player.currentTime = start;

            var videoUrl = livePlayerObjs[divId].video.url;
            var startIndex = videoUrl.indexOf("?begintimeabs=");
            if (startIndex === -1) {
                startIndex = videoUrl.indexOf("&begintimeabs=");
            }

            document.getElementById("played_time_timer_" + divId).innerHTML = LivePlayTimeShow.prototype.formatTimeToStr(start);

            clearInterval(livePlayerObjs[divId].video.playedTimer);
            livePlayerObjs[divId].video.playing = false;

            if (!/(iphone|ipad)/i.test(navigator.userAgent)) {
                player.autoplay = true;
                player.currentTime = pointerStart;
            } else {

                if (self && self.player && self.player.stop) {
                    self.player.stop();
                }
                self.loadedState = false;
                playCanvasVideo(divId, true);

            }

            if (!/(iphone|ipad)/i.test(navigator.userAgent) && !livePlayerObjs[divId].video.playing) {
                player.play();

                if (!player.paused) {
                    livePlayerObjs[divId].video.playing = true;
                }
            }

            livePlayerObjs[divId].pointerStart = pointerStart;
            LivePlayTimeShow.prototype.setPlayedTime(divId, pointerStart);
        }
    }

    moveProgressPointerPos(divId, pos) {
        let pointerLelft = pos - livePlayerObjs[divId].video.progressPointerWidth;

        document.getElementById("player_progress_played_" + divId).style.width = pos + "%";
        document.getElementById("player_progress_pointer_" + divId).style.left = pointerLelft + "%";
    }

    pointerMousedown(divId, progressBarObj) {
        event.preventDefault();

        progressBarObj.isPointerMove = true;

        clearInterval(livePlayerObjs[divId].video.playedTimer);

    }

    progressByBodyMousemove(divId, progressBarObj) {
        event.preventDefault();

        if (progressBarObj.isPointerMove) {

            LiveControlsBar.prototype.controlBarShowOrHide('show', divId, false);

            let e = window.event;

            LiveProgressBar.prototype.setProgressPointerPos(e, divId);

        }
    }
    ;
    progressByBodyMouseup(divId, progressBarObj, event) {
        if (!progressBarObj.isPointerMove) {
            return;
        }
        window.event.preventDefault();
        let e = event || window.event;

        if (progressBarObj.isPointerMove) {
            clearInterval(livePlayerObjs[divId].video.playedTimer);
            LiveProgressBar.prototype.setProgressPointerPos(e, divId, true);
        }

        progressBarObj.isPointerMove = false;

    }
}

//播放时间显示
class LivePlayTimeShow {
    constructor(divId, left) {
        livePlayerObjs[divId].video.playedTimer = null;
        this.initUi(divId, left);
        //this.initEvents(divId);  //设置按钮事件
    }

    initUi(divId, left) {
        let htmls = "";
        let total = livePlayerObjs[divId].video.duration;
        total = this.formatTimeToStr(total);
        htmls = `             
        <div id="played_time_${divId}" style="position: absolute;bottom:18px;left:${left}px;width:115px;height:12px;font-size:12px;line-height:12px;z-index:10;">
            <span id="played_time_timer_${divId}" style="color:#fff;font-weight:650">00:00</span><span style="padding: 0 3px;color:rgba(255, 255, 255, 0.803922);">/</span><span id="played_time_total_${divId}" style="color:rgba(255, 255, 255, 0.803922);">${total}</span>
        </div>     
        `;

        document.getElementById("control_bar" + "_" + divId).insertAdjacentHTML("afterBegin", htmls);

        this.setPlayedTime(divId, 0);
    }

    formatTimeToStr(secs) {
        let h = parseInt(secs / 3600);
        let m = parseInt((secs - h * 3600) / 60);
        if (m == 60) {
            h += 1;
            m = 0;
        }
        let s = Math.ceil(secs - h * 3600 - m * 60);
        if (s == 60) {
            m += 1;
            s = 0;
            if (m == 60) {
                h += 1;
                m = 0;
            }
        }
        let str = "";
        if (m < 10) {
            str += "0";
        }
        if (s < 10) {
            s = "0" + s;
        }
        str += m + ":" + s;
        if (h > 0) {
            str = h + ":" + str;
        }

        return str;
    }

    setPlayedTime(divId, start=0) {
        let played = start;
        let player = document.getElementById("h5player_" + divId);
        let playerdTimeTag = document.getElementById("played_time_timer_" + divId);
        let intSecs = 0;
        let playedSecs = 0;
        clearInterval(livePlayerObjs[divId].video.playedTimer);

        livePlayerObjs[divId].video.playedTimer = setInterval(function() {

            if (livePlayerObjs[divId].video.playing) {

                intSecs += 1000;
                if (!/(iphone|ipad)/i.test(navigator.userAgent)) {
                    played = player.currentTime;
                } else {
                    played += 1;
                }

                playedSecs = LivePlayTimeShow.prototype.formatTimeToStr(played);
                playerdTimeTag.innerText = playedSecs;

                livePlayerObjs[divId].video.playing = true;

                let pos = 100 * played / livePlayerObjs[divId].video.duration;
                if (pos > 100) {
                    pos = 100;
                }

                livePlayerObjs[divId].timePos = pos;

                LiveProgressBar.prototype.moveProgressPointerPos(divId, pos);

                if (played >= livePlayerObjs[divId].video.duration && /(iphone|ipad)/i.test(navigator.userAgent)) {
                    clearInterval(livePlayerObjs[divId].video.playedTimer);

                    document.getElementById("player_progress_played_" + divId).style.width = "0%";
                    document.getElementById("player_progress_cached_" + divId).style.width = "0%";
                    document.getElementById("player_progress_pointer_" + divId).style.left = "-17px";
                    playerdTimeTag.innerText = "00:00";

                    livePlayerObjs[divId].timePos = 0;
                    livePlayerObjs[divId].pointerStart = 0;
                    livePlayerObjs[divId].video.playing = false;
                    livePlayerObjs[divId].isEnd = true;
                    livePlayerObjs[divId].video.url = livePlayerObjs[divId].video.originalUrl;

                    if (typeof goldlog != "undefined" && goldlog["h5player_" + divId] && typeof heartbeatStarted !== "undefined") {
                        heartbeatStarted = false;
                    }

                    if (liveConvivaClient && liveConvivaClient.cleanupSession && livePlayerObjs[divId].convivaSessionKey !== undefined) {
                        liveConvivaClient.cleanupSession(livePlayerObjs[divId].convivaSessionKey);
                        livePlayerObjs[divId].convivaSessionKey = undefined;
                    }

                    if (self && self.player && self.player.stop) {
                        self.player.stop();
                    }
                    self.loadedState = false;

                    playCanvasVideo(divId, true);
                }

            } else {

                let pauseBtn = document.getElementById("play_or_pause_pause_" + divId);
                let pauseMouseoverBtn = document.getElementById("play_or_pause_pause_mouseover_" + divId);

                if (pauseBtn && (pauseBtn.style.display !== "none" || pauseMouseoverBtn.style.display !== "none")) {
                    LivePlayOrPauseBtn.prototype.switchPlayOrPauseBtn(divId, "pause");
                }

            }

        }, 1000);

    }

}

class LiveTimeshiftBar {
    constructor(paras) {

        this.initUi(paras);
        this.initEvents(paras);
        //设置播放器容器事件
    }

    initUi(paras) {
        let htmls = "";
        let timeScaleOneHourWidth = 90;
        let totalWidth = timeScaleOneHourWidth * 6 * 24;
        let barHeight = 50;
        let timeScaleHeight = 20;
        let epgHeight = barHeight - timeScaleHeight;
        let container = document.getElementById(paras.divId);
        let containerWidth = parseInt(container.offsetWidth ? container.offsetWidth : paras.w);
        let timeshiftEpgBarWidth = containerWidth - 60 - 30 - 30;
        let controlsBgImg = "controls_bg_live.png";
        htmls = ` 
        <div id="timeshift_bar_${paras.divId}" style="position:absolute;display:none;overflow:hidden;font-size:14px;font-weight:400;height:${barHeight}px;width:100%;bottom:48px;left:0px;margin:0;padding:0;color:rgba(255, 255, 255, 0.803922);background-image:url(${playerContorlsImgDir}${controlsBgImg});background-size:100% ${barHeight}px;background-repeat:repeat-x;z-index:9;">
            <div id="timeshift_scale_${paras.divId}" style="position:absolute;height:${timeScaleHeight}px;width:auto;bottom:${epgHeight}px;left:60px;margin:0;padding:0;overflow:hidden;cursor:pointer;">
                <div id="scale_${paras.divId}" style="position:relative;font-size:12px;left:0px;padding:0px;margin:0px;height:${timeScaleHeight - 1}px;width:${totalWidth}px;border-bottom:1px solid rgb(90,90,90);margin:0;padding:0;">                
                </div>                  
            </div>              
            
             <div id="timeshift_epg_${paras.divId}" style="position:absolute;height:${epgHeight}px;width:${timeshiftEpgBarWidth}px;bottom:0px;left:90px;margin:0;padding:0;overflow:hidden;cursor:pointer;">                  
                <div id="epg_${paras.divId}" style="position:relative;left:-30px;padding:0px;margin:0px;height:${epgHeight - 1}px;width:${totalWidth}px;border-bottom:1px solid rgb(90,90,90);margin:0;padding:0;color:#FFF;">               
                </div>
            </div>            
            
            <div style="position:absolute;height:${barHeight}px;width:60px;bottom:0px;left:0px;margin:0;padding:0;border-right:1px solid rgb(90,90,90);overflow:hidden;border-bottom:1px solid rgb(90,90,90);">
                <div style="position:relative;margin:0px auto;height:${barHeight / 2}px;width:59px;text-align:center;line-height:30px;vertical-align:bottom;">
                       今日
                </div>
                
                <div id="timeshift_date_${paras.divId}" style="position:relative;margin:0px auto;height:${barHeight / 2}px;width:59px;text-align: center;line-height:16px;vertical-align:top;">
                       
                </div>
            </div>
            
            
            <div id="epg_left_shift_${paras.divId}" style="position:absolute;left:60px;bottom:0px;width:30px;height:29px;cursor:pointer;z-index:20;border-bottom:1px solid rgb(90,90,90);">
                <img id="epg_leftarrow_${paras.divId}" src="${playerContorlsImgDir}epg_left.png" style="width:12px;height:15px;padding:8px 9px;">
                <img id="epg_leftarrow_mouseover_${paras.divId}" src="${playerContorlsImgDir}epg_left_mouseover.png" style="width:12px;height:15px;padding:8px 9px;display:none;">             
               
            </div>              
            
            
             <div id="epg_right_shift_${paras.divId}" style="position:absolute;right:0px;bottom:0px;width:30px;height:29px;cursor:pointer;z-index:200;border-bottom:1px solid rgb(90,90,90);">
                <img id="epg_rightarrow_${paras.divId}" src="${playerContorlsImgDir}epg_right.png" style="width:12px;height:15px;padding:8px 9px;">
                <img id="epg_rightarrow_mouseover_${paras.divId}" src="${playerContorlsImgDir}epg_right_mouseover.png" style="width:12px;height:15px;padding:8px 9px;display:none;">             
               
            </div>             

        </div>             
              
        `;

        htmls += ` 
        <div id="timeshift_pointer_${paras.divId}" style="position:absolute;left:100px;bottom:42px;width:20px;height:70px;cursor:pointer;z-index:12;display:none;">
                <img src="${playerContorlsImgDir}epg_pointer.png" style="width:20px;height:70px;">                       
               
            </div>  
         `;

        //兼容qq浏览器点时移箭头，控制条自动消失问题
        if (/qqbrowser/i.test(navigator.userAgent)) {
            htmls += `<div style="position:absolute;right:0px;bottom:48px;width:10px;height:30px;cursor:pointer;z-index:201;color:#FFF;opacity:0;">                   
               
                        </div>`;

        }

        document.getElementById("control_bar" + "_" + paras.divId).insertAdjacentHTML("afterBegin", htmls);

        this.showScale(paras);
        this.showEpg(paras);

    }

    initEvents(paras) {
        window.addEventListener("resize", this.playerResize.bind(null, paras), false);

        let resizeEle = document.querySelector(".playingVideo .video_left .video_btn_l");
        if (resizeEle) {
            resizeEle.addEventListener("click", function() {
                setTimeout(function() {
                    LiveTimeshiftBar.prototype.playerResize(paras);
                }, 550);

            }, false);
        }

        let leftShiftBtn = document.getElementById("epg_left_shift_" + paras.divId);
        leftShiftBtn.addEventListener("mouseover", this.epgShifByMouseover.bind(null, paras, "left"), false);
        leftShiftBtn.addEventListener("mouseout", this.epgShifByMouseout.bind(null, paras, "left"), false);
        leftShiftBtn.addEventListener("mousemove", this.epgShifByMousemove.bind(null, paras), false);
        leftShiftBtn.addEventListener("click", this.epgShifByClick.bind(null, paras, "left"), false);

        let rightShiftBtn = document.getElementById("epg_right_shift_" + paras.divId);
        rightShiftBtn.addEventListener("mouseover", this.epgShifByMouseover.bind(null, paras, "right"), false);
        rightShiftBtn.addEventListener("mouseout", this.epgShifByMouseout.bind(null, paras, "right"), false);
        rightShiftBtn.addEventListener("mousemove", this.epgShifByMousemove.bind(null, paras), false);
        rightShiftBtn.addEventListener("click", this.epgShifByClick.bind(null, paras, "right"), false);

        let scaleBar = document.getElementById("timeshift_scale_" + paras.divId);
        scaleBar.addEventListener("click", this.timeshiftByClick.bind(null, paras, true), false);
        scaleBar.addEventListener("mousemove", this.timeshiftByMousemove.bind(null, paras), false);
        scaleBar.addEventListener("mouseout", this.timeshiftByMouseout.bind(null, paras), false);

        let epgBar = document.getElementById("timeshift_epg_" + paras.divId);

        epgBar.addEventListener("click", this.epgByClick.bind(null, paras), false);
        epgBar.addEventListener("mouseover", this.epgByMouseover.bind(null, paras), false);
        epgBar.addEventListener("mouseout", this.epgByMouseout.bind(null, paras), false);

        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);

        pointer.addEventListener("mousedown", this.pointerMousedown.bind(null, paras, this), false);

        document.body.addEventListener("mousemove", this.timeshiftByBodyMousemove.bind(null, paras), false);
        document.body.addEventListener("mouseup", this.timeshiftByBodyMouseup.bind(null, paras), false);

    }

    epgShifByMouseover(paras, type) {
        let arrow = document.getElementById("epg_" + type + "arrow_" + paras.divId);
        let arrowMouseover = document.getElementById("epg_" + type + "arrow_mouseover_" + paras.divId);
        arrow.style.display = "none";
        arrowMouseover.style.display = "block";

        clearTimeout(livePlayerObjs[paras.divId].video.showPlayBtnTimer);
        document.getElementById("control_bar_" + paras.divId).style.display = "block";

        let picInPicBtn = document.getElementById("pic_in_pic_" + paras.divId);
        if (picInPicBtn) {

            let closeSmallBtn = document.getElementById("close_player_" + paras.divId);
            if (closeSmallBtn) {
                picInPicBtn.style.display = "none";
            } else {
                picInPicBtn.style.display = "block";
            }
        }

    }

    epgShifByMousemove(paras) {
        clearTimeout(livePlayerObjs[paras.divId].video.showPlayBtnTimer);
        document.getElementById("control_bar_" + paras.divId).style.display = "block";

        let picInPicBtn = document.getElementById("pic_in_pic_" + paras.divId);
        if (picInPicBtn) {

            let closeSmallBtn = document.getElementById("close_player_" + paras.divId);
            if (closeSmallBtn) {
                picInPicBtn.style.display = "none";
            } else {
                picInPicBtn.style.display = "block";
            }
        }
    }

    epgShifByMouseout(paras, type, ev) {
        let arrow = document.getElementById("epg_" + type + "arrow_" + paras.divId);
        let arrowMouseover = document.getElementById("epg_" + type + "arrow_mouseover_" + paras.divId);

        let e = ev ? ev : window.event;

        arrowMouseover.style.display = "none";
        arrow.style.display = "block";

    }

    epgShifByClick(paras, type) {
        let epgContainer = document.getElementById("timeshift_epg_" + paras.divId);
        let epgContainerWidth = parseInt(epgContainer.style.width) - 30;

        let moveValue = 0;
        if (type === "left") {
            moveValue = epgContainerWidth;
        } else {
            moveValue = -epgContainerWidth;
        }

        clearInterval(livePlayerObjs[paras.divId].liveTimer);
        LiveTimeshiftBar.prototype.moveEpgByValue(paras, moveValue);

        /*
        let errorDiv = document.getElementById("error_msg_"+paras.divId);
        if(!errorDiv) {
            setTimeout(function () {
                //从上次时间点开始计时
                LiveTimeshiftBar.prototype.liveTimeUpdate(paras, livePlayerObjs[paras.divId].startStamp+2);
            }, 100);

        }
        */

        setTimeout(function() {
            //从上次时间点开始计时
            LiveTimeshiftBar.prototype.liveTimeUpdate(paras, livePlayerObjs[paras.divId].startStamp + 2);
        }, 100);

        clearTimeout(livePlayerObjs[paras.divId].video.showPlayBtnTimer);
        document.getElementById("control_bar_" + paras.divId).style.display = "block";

        let picInPicBtn = document.getElementById("pic_in_pic_" + paras.divId);
        if (picInPicBtn) {
            let closeSmallBtn = document.getElementById("close_player_" + paras.divId);
            if (closeSmallBtn) {
                picInPicBtn.style.display = "none";
            } else {
                picInPicBtn.style.display = "block";
            }
        }

    }

    timeshiftByClick(paras, isPlay, event) {
        let e = event || window.event;
        let scale = document.getElementById("scale_" + paras.divId);
        let scaleLeft = getOffsetLeft(scale);
        let mouseX = e.clientX + (window.pageXOffset ? window.pageXOffset : document.documentElement.scrollLeft);
        let objX = mouseX - scaleLeft;

        let secPerPix = 600 / 90;
        let start = objX * secPerPix;
        let startStamp = parseInt(livePlayerObjs[paras.divId].start + start);

        if (startStamp > livePlayerObjs[paras.divId].end && (!livePlayerObjs[paras.divId].endTime || startStamp > livePlayerObjs[paras.divId].endTime)) {
            if (isPlay === "byDrag") {
                LiveTimeshiftSwitch.prototype.returnToLive(paras);
            }
            return;
        }

        let textBtn = document.getElementById("return_to_live_" + paras.divId);
        textBtn.style.display = "block";

        let container = document.getElementById(paras.divId);
        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);
        let pointerLeft = mouseX - getOffsetLeft(container);

        let containerWidth = container.offsetWidth;

        if (pointerLeft > containerWidth) {
            pointerLeft = containerWidth;
        }

        if (pointerLeft < 60) {
            pointerLeft = 60;
        }

        if (pointerLeft < 90 || pointerLeft > containerWidth - 40) {
            pointer.style.zIndex = "8";
        } else {
            pointer.style.zIndex = "12";
        }

        pointer.style.display = "block";
        pointer.style.left = pointerLeft - 10 + "px";

        if (isPlay) {
            pointer.style.transition = "left 0.5s";
            let videoUrl = livePlayerObjs[paras.divId].video.url;

            var startIndex = videoUrl.indexOf("?begintimeabs=");
            if (startIndex === -1) {
                startIndex = videoUrl.indexOf("&begintimeabs=");
            }

            if (startIndex > 0) {
                livePlayerObjs[paras.divId].video.url = videoUrl.substring(0, startIndex + 1) + "begintimeabs=" + startStamp * 1000;
            } else {
                if (videoUrl.indexOf("?") > 0) {
                    livePlayerObjs[paras.divId].video.url += "&begintimeabs=" + startStamp * 1000;
                } else {
                    livePlayerObjs[paras.divId].video.url += "?begintimeabs=" + startStamp * 1000;
                }

            }

            let errorDiv = document.getElementById("error_msg_" + paras.divId);

            paras.st = "";

            /*2020.1.4注释，解决跨天到当天，直播节目错位到指针节目问题
            if(livePlayerObjs[paras.divId].endTime && livePlayerObjs[paras.divId].endTime>0) {
                livePlayerObjs[paras.divId].end = startStamp;
            }
            */

            LiveTimeshiftBar.prototype.showTimeShiftTime(paras, startStamp, 0);
            livePlayerObjs[paras.divId].startStamp = startStamp;

            livePlayerObjs[paras.divId].isLive = false;

            if (!errorDiv) {
                createLiveHls(paras);
                LiveTimeshiftBar.prototype.liveTimeUpdate(paras);
            } else {
                clearInterval(livePlayerObjs[paras.divId].liveTimer);
                LiveTimeshiftBar.prototype.liveTimeUpdate(paras);
            }

        } else {
            pointer.style.transition = "left 0s";

            LiveTimeshiftBar.prototype.showTimeShiftTime(paras, startStamp, 0);

        }

    }

    timeshiftByMousemove(paras, event) {
        let e = event || window.event;
        let scale = document.getElementById("scale_" + paras.divId);
        let scaleLeft = getOffsetLeft(scale);
        let timeshiftBar = document.getElementById("timeshift_scale_" + paras.divId);
        let mouseX = e.clientX + (window.pageXOffset ? window.pageXOffset : document.documentElement.scrollLeft);
        let objX = mouseX - scaleLeft;

        let secPerPix = 600 / 90;
        let start = objX * secPerPix;
        let startStamp = parseInt(livePlayerObjs[paras.divId].start + start);

        if (startStamp > livePlayerObjs[paras.divId].end && (!livePlayerObjs[paras.divId].endTime || startStamp > livePlayerObjs[paras.divId].endTime)) {
            timeshiftBar.style.cursor = "auto";

        } else {
            timeshiftBar.style.cursor = "pointer";
        }
    }

    timeshiftByMouseout(paras, event) {
        let timeshiftBar = document.getElementById("timeshift_scale_" + paras.divId);
        if (timeshiftBar) {//timeshiftBar.style.cursor = "auto";
        }
    }

    epgByClick(paras, event) {
        let e = event || window.event;
        let epgTarget = e.target;
        let epgTargetLeft = getOffsetLeft(epgTarget);
        let scale = document.getElementById("scale_" + paras.divId);
        let scaleLeft = getOffsetLeft(scale);
        let secPerPix = 600 / 90;
        let start = secPerPix * (epgTargetLeft - scaleLeft);
        let startStamp = parseInt(livePlayerObjs[paras.divId].start + start);

        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);
        pointer.style.zIndex = "12";

        if (startStamp > livePlayerObjs[paras.divId].end && (!livePlayerObjs[paras.divId].endTime || startStamp > livePlayerObjs[paras.divId].endTime)) {
            return;
        }

        let textBtn = document.getElementById("return_to_live_" + paras.divId);
        textBtn.style.display = "block";

        livePlayerObjs[paras.divId].isLive = false;
        LiveTimeshiftSwitch.prototype.playTimeshiftFromPos(paras, startStamp);

    }

    epgByMouseover(paras, event) {
        let e = event || window.event;
        let epgTarget = e.target;

        let itemId = epgTarget.getAttribute("itemid");
        let liveIndex = livePlayerObjs[paras.divId].liveProgramIndex === "" ? "" : parseInt(livePlayerObjs[paras.divId].liveProgramIndex);
        if (!itemId) {
            return;
        }

        itemId = itemId.replace("_", "");
        let epgBar = document.getElementById("timeshift_epg_" + paras.divId);

        if (itemId - 0 < liveIndex - 0 || liveIndex === "") {
            epgTarget.style.backgroundColor = "rgba(60,60,60, 0.6)";

            epgBar.style.cursor = "pointer";
        } else if (itemId - 0 == liveIndex - 0) {
            epgBar.style.cursor = "pointer";
        } else {
            epgBar.style.cursor = "auto";
        }

    }

    epgByMouseout(paras, event) {
        let e = event || window.event;
        let epgTarget = e.target;

        let epgBar = document.getElementById("timeshift_epg_" + paras.divId);
        if (epgBar) {
            epgBar.style.cursor = "auto";
        }

        let itemId = epgTarget.getAttribute("itemid");
        let liveIndex = parseInt(livePlayerObjs[paras.divId].liveProgramIndex);
        if (!itemId) {
            return;
        }

        itemId = itemId.replace("_", "");
        if (itemId - 0 != liveIndex - 0) {
            epgTarget.style.backgroundColor = "";
        }

    }

    pointerMousedown(paras, progressBarObj) {
        event.preventDefault();

        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);
        pointer.style.transition = "left 0s";

        livePlayerObjs[paras.divId].isPointerMove = true;

        clearInterval(livePlayerObjs[paras.divId].liveTimer);

    }

    timeshiftByBodyMousemove(paras, progressBarObj) {
        event.preventDefault();

        if (livePlayerObjs[paras.divId].isPointerMove) {

            LiveControlsBar.prototype.controlBarShowOrHide('show', paras.divId, false);

            let e = window.event;

            LiveTimeshiftBar.prototype.timeshiftByClick(paras, false, e);

        }
    }
    ;
    timeshiftByBodyMouseup(paras, progressBarObj, event) {
        if (!livePlayerObjs[paras.divId].isPointerMove) {
            return;
        }
        window.event.preventDefault();
        let e = event || window.event;

        if (livePlayerObjs[paras.divId].isPointerMove) {
            clearInterval(livePlayerObjs[paras.divId].liveTimer);
            LiveTimeshiftBar.prototype.timeshiftByClick(paras, "byDrag", e);
        }

        livePlayerObjs[paras.divId].isPointerMove = false;

    }

    showScale(paras) {
        let scaleBar = document.getElementById("scale_" + paras.divId);
        let hour = 0;
        let scaleItem = "";
        let scaleItemLeft = 0;
        let scaleItemHeight = 0;
        let scaleTime = 0;

        scaleTime = this.formatMinToStr(0);
        scaleItem += `<div style="position:absolute;left:${scaleItemLeft + 5}px;bottom:3px;">${scaleTime}</div>`;

        for (var min = 2; min < 1440; min += 2) {

            scaleItemLeft = min * 9;
            if (min % 10 === 0) {
                scaleItemHeight = 14;
                scaleTime = this.formatMinToStr(min);
                scaleItem += `<div style="position:absolute;left:${scaleItemLeft + 4}px;bottom:3px;">${scaleTime}</div>`;
            } else {
                scaleItemHeight = 4;
            }
            scaleItem += `<div style="position:absolute;width:1px;height:${scaleItemHeight}px;left:${scaleItemLeft}px;bottom:0px;background-color:rgb(90,90,90);"></div>`;
        }

        scaleBar.insertAdjacentHTML("afterBegin", scaleItem);
    }

    showEpg(paras) {
        let timeshiftBar = document.getElementById("timeshift_bar_" + paras.divId);
        let timeshiftPointer = document.getElementById("timeshift_pointer_" + paras.divId);
        timeshiftBar.style.display = "none";
        timeshiftPointer.style.display = "none";

        let epgBar = document.getElementById("epg_" + paras.divId);
        epgBar.innerHTML = "";
        epgBar.style.left = "-30px";
        let scaleBar = document.getElementById("scale_" + paras.divId);
        scaleBar.style.left = "0px";
        livePlayerObjs[paras.divId].start = 0;
        livePlayerObjs[paras.divId].end = 0;
        livePlayerObjs[paras.divId].endTime = 0;

        let isLivetimeGeted = false;

        if (isTimeshift(paras) || livePlayerObjs[paras.divId].isNewDay) {

            if (livePlayerObjs[paras.divId].flv5) {
                LazyLoad.js(livePlayerObjs[paras.divId].flv5, function() {
                    isLivetimeGeted = true;
                    LiveTimeshiftBar.prototype.getEpgByJsonFromUrl(LiveTimeshiftBar.prototype.appendEpg, "LiveTimeshiftBar.prototype.appendEpg", paras);
                });
            }

            setTimeout(function() {
                if (!isLivetimeGeted) {
                    isLivetimeGeted = true;
                    LiveTimeshiftBar.prototype.getEpgByJsonFromUrl(LiveTimeshiftBar.prototype.appendEpg, "LiveTimeshiftBar.prototype.appendEpg", paras);
                }
            }, 6000);
        } else {
            setTimeout(function() {
                LiveTimeshiftBar.prototype.getEpgByJsonFromUrl(LiveTimeshiftBar.prototype.appendEpg, "LiveTimeshiftBar.prototype.appendEpg", paras);
            }, 100);
        }

        let textBtn = document.getElementById("return_to_live_" + paras.divId);
        if (textBtn && paras.st && paras.st > 0) {
            textBtn.style.display = "block";
        }

    }

    showDate(paras, dateMsg) {
        let dateBar = document.getElementById("timeshift_date_" + paras.divId);
        dateBar.innerHTML = dateMsg;
    }

    appendEpg(epg, paras) {
        if (!paras) {
            liveEpgJsonList = epg;
            return;
        }

        let epgBar = document.getElementById("epg_" + paras.divId);
        let epgList = epg[paras.t].program;

        let startTitle = "";

        if (livePlayerObjs[paras.divId].isNewDay && Array.isArray(livePlayerObjs[paras.divId].epg)) {
            let len = livePlayerObjs[paras.divId].epg.length;
            if (len - 0 > 0) {
                startTitle = livePlayerObjs[paras.divId].epg[len - 1].t || "";
            }

        }

        livePlayerObjs[paras.divId].epg = epgList;
        let len = epgList.length;
        let epgItem = "";
        let epgItemWidth = "";
        let oneSecWidth = 90 / 600;
        if (isNaN(livePlayerObjs[paras.divId].start) || !livePlayerObjs[paras.divId].start) {
            livePlayerObjs[paras.divId].start = epgList[0].st;

            let showTime = epgList[0].showTime;
            let arr = showTime.split(":");

            livePlayerObjs[paras.divId].start = parseInt(livePlayerObjs[paras.divId].start) - parseInt(arr[0]) * 3600 - parseInt(arr[1]) * 60;
            let startHour = parseInt(livePlayerObjs[paras.divId].start / 3600);
            livePlayerObjs[paras.divId].start = startHour * 3600;

        }

        let endTime = livePlayerObjs[paras.divId].end;

        if (isTimeshift(paras) && (!epg[paras.t].liveSt || epg[paras.t].liveSt < 1500000000)) {
            if (livePlayerObjs[paras.divId].isNewDay) {
                let stamp = 0;
                if (currentLiveTimeData && currentLiveTimeData.GT && currentLiveTimeData.GT > 1000000000) {
                    stamp = currentLiveTimeData.GT;
                    if (stamp - 10000000000 > 0) {
                        stamp = parseInt(stamp / 1000);
                    }
                } else {
                    stamp = Date.parse(new Date()) / 1000;
                    if (stamp - epg[paras.t].liveSt < 0) {
                        stamp = epg[paras.t].liveSt
                    } else {
                        stamp = stamp - 50;
                    }

                }

                if (stamp - livePlayerObjs[paras.divId].start >= 3600 * 24) {
                    endTime = livePlayerObjs[paras.divId].start + 3600 * 24;
                } else {
                    endTime = stamp;
                }

            } else {
                endTime = livePlayerObjs[paras.divId].start + 3600 * 24;
            }

            livePlayerObjs[paras.divId].endTime = endTime;

        } else if (isTimeshift(paras) && epg[paras.t].liveSt && epg[paras.t].liveSt >= 1500000000) {
            let stamp = 0;
            if (currentLiveTimeData && currentLiveTimeData.GT && currentLiveTimeData.GT > 1000000000) {
                stamp = currentLiveTimeData.GT;
                if (stamp - 10000000000 > 0) {
                    stamp = parseInt(stamp / 1000);
                }
            } else {
                stamp = Date.parse(new Date()) / 1000;
                if (stamp - epg[paras.t].liveSt < 0) {
                    stamp = epg[paras.t].liveSt
                } else {
                    stamp = stamp - 50;
                }

            }

            endTime = stamp;
            livePlayerObjs[paras.divId].endTime = endTime;
        } else {
            livePlayerObjs[paras.divId].endTime = 0;
        }

        if (livePlayerObjs[paras.divId].isNewDay) {
            LiveControlsBar.prototype.controlBarShowOrHide("show", paras.divId, "show3Seconds");
        }

        livePlayerObjs[paras.divId].isNewDay = false;

        let lastLeft = oneSecWidth * (epgList[0].st - livePlayerObjs[paras.divId].start);
        let liveProgramId = "";
        livePlayerObjs[paras.divId].liveProgramIndex = "100001";
        livePlayerObjs[paras.divId].liveProgramStart = "";
        livePlayerObjs[paras.divId].liveProgramEnd = "";
        livePlayerObjs[paras.divId].liveProgramIndex = "";

        if (endTime > livePlayerObjs[paras.divId].start && endTime < epgList[0].st) {

            liveProgramId = `0`;
            livePlayerObjs[paras.divId].liveProgramStart = livePlayerObjs[paras.divId].start;
            livePlayerObjs[paras.divId].liveProgramEnd = epgList[0].st;
            livePlayerObjs[paras.divId].liveProgramIndex = "0";

            if (document.getElementById("error_msg_" + paras.divId) || livePlayerObjs[paras.divId].vdn && livePlayerObjs[paras.divId].vdn.public != "1") {
                livePlayerObjs[paras.divId].epg[0].startPublic = "0";
            } else {
                livePlayerObjs[paras.divId].epg[0].startPublic = "1";
            }

            livePlayerObjs[paras.divId].epg[0].startPublicChecked = true;
        }

        epgItem += `<div id="program_0_${paras.divId}" itemid="_0" style="position:absolute;margin:0 auto;text-align:center;left:0px;width:${lastLeft}px;height:14px;bottom:0px;padding:8px 0px;line-height:14px;white-space:nowrap;overflow:hidden;">${startTitle}</div>`;

        for (var i = 0; i < len; i++) {
            let textColor = "#FFF";
            if (endTime > epgList[i].st && endTime < epgList[i].et) {
                liveProgramId = `${i + 1}`;
                livePlayerObjs[paras.divId].liveProgramStart = epgList[i].st;
                livePlayerObjs[paras.divId].liveProgramEnd = epgList[i].et;
                livePlayerObjs[paras.divId].liveProgramIndex = `${i + 1}`;

                if (document.getElementById("error_msg_" + paras.divId) || livePlayerObjs[paras.divId].vdn && livePlayerObjs[paras.divId].vdn.public != "1") {
                    livePlayerObjs[paras.divId].epg[i].public = "0";
                } else {
                    livePlayerObjs[paras.divId].epg[i].public = "1";
                }

                livePlayerObjs[paras.divId].epg[i].publicChecked = true;

            }

            if (liveProgramId !== "" && i + 1 - liveProgramId > 0) {
                textColor = "#a8a9ad";
            }

            epgItemWidth = oneSecWidth * (epgList[i].et - epgList[i].st);

            epgItem += `<div id="program_${i + 1}_${paras.divId}" itemid="_${i + 1}" style="position:absolute;margin:0 auto;text-align:center;left:${lastLeft}px;width:${epgItemWidth}px;height:14px;bottom:0px;padding:8px 0px;line-height:14px;white-space:nowrap;overflow:hidden;color:${textColor}">${epgList[i].t}</div>`;

            epgItem += `<div style="position:absolute;width:1px;height:30px;left:${lastLeft}px;bottom:0px;background-color:rgb(90,90,90);"></div>`;
            lastLeft += epgItemWidth;

        }

        epgBar.insertAdjacentHTML("afterBegin", epgItem);

        if (liveProgramId.length > 0) {
            LiveTimeshiftBar.prototype.hightlightLiveProgram(paras, liveProgramId);
        }

        //显示时移时间
        if (isTimeshift(paras)) {

            LiveTimeshiftBar.prototype.showTimeShiftTime(paras, livePlayerObjs[paras.divId].end, 0);
        }

        if (livePlayerObjs[paras.divId].end >= livePlayerObjs[paras.divId].start && livePlayerObjs[paras.divId].end < (livePlayerObjs[paras.divId].start + 24 * 3600)) {
            LiveTimeshiftBar.prototype.movePointerToPos(paras, livePlayerObjs[paras.divId].end);

            let container = document.getElementById(paras.divId);
            let playerWidth = container.offsetWidth;

            let moveValue = oneSecWidth * (livePlayerObjs[paras.divId].end - livePlayerObjs[paras.divId].start);
            moveValue = -moveValue + playerWidth / 2 + 60;

            LiveTimeshiftBar.prototype.moveEpgByValue(paras, moveValue);
        }

        if (isTimeshift(paras) && epg[paras.t].liveSt && epg[paras.t].liveSt >= 1500000000) {
            livePlayerObjs[paras.divId].end = endTime;
        }

        let timeshiftbtn = document.getElementById("timeshiftbtn_" + paras.divId);
        if (timeshiftbtn && timeshiftbtn.getAttribute("isOn") === "false") {
            LiveTimeshiftSwitch.prototype.textBtnByClick(paras, true);
        }
        document.getElementById("timeshift_bar_" + paras.divId).style.display = "block";

        document.getElementById("timeshift_pointer_" + paras.divId).style.display = "block";

        LiveTimeshiftBar.prototype.liveTimeUpdate(paras);

        livePlayerObjs[paras.divId].isShowSmallWindow = true;

    }

    hightlightLiveProgram(paras, liveProgramId) {
        let hightlightedProgram = document.getElementById("program_" + liveProgramId + "_" + paras.divId);
        let lastProgram = document.getElementById("program_" + (liveProgramId - 1) + "_" + paras.divId);
        if (lastProgram) {
            lastProgram.style.backgroundColor = "";
            lastProgram.style.color = "#FFF";
        }

        if (hightlightedProgram) {
            hightlightedProgram.style.backgroundColor = "#bf0614";
            hightlightedProgram.style.color = "#FFF";
        }
    }

    getEpgByJsonFromUrl(cb, cbToStr, paras, fromStamp) {
        let stamp = 0;

        if (fromStamp) {
            stamp = fromStamp;
        } else {
            stamp = LiveTimeshiftBar.prototype.getNowTimestamp(paras);

        }

        let nowDate = new Date(stamp * 1000);
        let epgMonth = nowDate.getMonth() + 1 + "";
        if (epgMonth.length < 2) {
            epgMonth = "0" + epgMonth;
        }
        let epgDay = nowDate.getDate() + "";
        if (epgDay.length < 2) {
            epgDay = "0" + epgDay;
        }

        livePlayerObjs[paras.divId].start = new Date(`${nowDate.getFullYear()},${epgMonth},${epgDay}`).getTime() / 1000;

        let epgDate = nowDate.getFullYear() + epgMonth + epgDay;
        LiveTimeshiftBar.prototype.showDate(paras, epgMonth + " / " + epgDay);

        let epgUrl = "http://api.cntv.cn/epg/epginfo?serviceId=shiyi&d=" + epgDate + "&c=" + paras.t + "&cb=" + cbToStr;
        if (paras.isHttps === "true") {
            epgUrl = epgUrl.replace("http://", "https://");
        }
        LazyLoad.js(epgUrl, function() {
            setTimeout(function() {

                cb(liveEpgJsonList, paras);
            }, 50);
        });
    }

    getNowTimestamp(paras) {

        let stamp = 0;

        if (isTimeshift(paras)) {
            stamp = paras.st;
        } else if (livePlayerObjs[paras.divId].end && livePlayerObjs[paras.divId].end > 0 && !livePlayerObjs[paras.divId].isNewDay) {
            stamp = livePlayerObjs[paras.divId].end;
        } else if (currentLiveTimeData && currentLiveTimeData.GT && currentLiveTimeData.GT > 1000000000) {
            stamp = currentLiveTimeData.GT;
            if (stamp > 10000000000) {
                stamp = parseInt(stamp / 1000);
            }
        } else {
            stamp = Date.parse(new Date()) / 1000;
        }

        livePlayerObjs[paras.divId].end = stamp;
        return stamp;
    }

    movePointerToPos(paras, stamp) {
        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);
        let oneSecWidth = 90 / 600;
        let leftPos = oneSecWidth * (stamp - livePlayerObjs[paras.divId].start);
        if (pointer) {
            pointer.style.left = 60 - 10 + leftPos + "px";
        }
    }

    moveEpgByValue(paras, moveValue) {
        let scale = document.getElementById("scale_" + paras.divId);
        let scaleWidth = parseInt(scale.style.width);
        let epg = document.getElementById("epg_" + paras.divId);
        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);
        let container = document.getElementById(paras.divId);
        let playerWidth = container.offsetWidth;
        let realLeft = 0;

        let transitionTime = 0.2;

        if (scale) {
            let scaleLeft = parseInt(scale.style.left);
            realLeft = scaleLeft + moveValue;
            if (moveValue < 0) {
                if (realLeft + scaleWidth < playerWidth - 60) {
                    moveValue = moveValue + playerWidth - 60 - (realLeft + scaleWidth)
                }
            } else {
                if (realLeft > 0) {
                    moveValue = moveValue - realLeft;
                }
            }
            transitionTime = Math.abs(moveValue) * 0.001;
            if (transitionTime > 0.9) {
                transitionTime = 0.9;
            }
            scale.style.transition = `left ${transitionTime}s`;

            scale.style.left = scaleLeft + moveValue + "px";
        }

        if (epg) {
            let epgLeft = parseInt(epg.style.left);
            epg.style.transition = `left ${transitionTime}s`;
            epg.style.left = epgLeft + moveValue + "px";
        }

        if (pointer) {
            let pointerLeft = parseInt(pointer.style.left);

            pointer.style.transition = `left ${transitionTime}s`;
            pointer.style.left = pointerLeft + moveValue + "px";

        }

    }

    liveTimeUpdate(paras, fromStartStamp) {
        let intervalTime = 1000;
        let playingTime = 0;
        livePlayerObjs[paras.divId].loadingTime = 0;
        livePlayerObjs[paras.divId].checkCopyrightTimer = null;

        let container = document.getElementById(paras.divId);
        let containerWidth = 0;
        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);
        let pointerLeft = parseFloat(pointer.style.left);

        livePlayerObjs[paras.divId].end = parseInt(livePlayerObjs[paras.divId].end);

        let moveLeft = 0;

        let scale = document.getElementById("scale_" + paras.divId);

        let secPerPix = 600 / 90;

        let startStamp = 0;

        if (fromStartStamp) {
            startStamp = livePlayerObjs[paras.divId].startStamp;
        } else {
            startStamp = secPerPix * (getOffsetLeft(container) + pointerLeft + 10 - getOffsetLeft(scale)) + livePlayerObjs[paras.divId].start;
        }

        startStamp = parseInt(startStamp);

        clearInterval(livePlayerObjs[paras.divId].liveTimer);

        livePlayerObjs[paras.divId].liveTimer = setInterval(function() {

            if (livePlayerObjs[paras.divId].endTime && livePlayerObjs[paras.divId].endTime > 0) {
                livePlayerObjs[paras.divId].endTime++;
            }

            livePlayerObjs[paras.divId].end++;

            let errorMsgTag = document.getElementById("error_msg_" + paras.divId);
            let loadingTag = document.getElementById("loading_" + paras.divId);
            if (errorMsgTag) {
                livePlayerObjs[paras.divId].video.playing = true;
                if (errorMsgTag.style.display !== "none" && loadingTag && loadingTag.style.display !== "none") {
                    loadingTag.style.display = "none";
                }
            }

            if (livePlayerObjs[paras.divId].video.playing) {
                playingTime++;

                if (livePlayerObjs[paras.divId].video.url.indexOf("begintimeabs=") > 0) {
                    LiveTimeshiftBar.prototype.showTimeShiftTime(paras, startStamp, playingTime);
                }
            }

            livePlayerObjs[paras.divId].startStamp = parseInt(startStamp + playingTime);

            if (loadingTag && loadingTag.style.display !== "none") {
                livePlayerObjs[paras.divId].loadingTime++;
                if (livePlayerObjs[paras.divId].loadingTime > 8) {
                    livePlayerObjs[paras.divId].loadingTime = 0;
                    if (paras.vdnRetryNum === undefined) {
                        paras.vdnRetryNum = 0;
                    }
                    paras.vdnRetryNum++;

                    livePlayerObjs[paras.divId].isShowSmallWindow = false;
                    let smallWindowCloseBtn = document.getElementById('close_player_' + paras.divId);

                    let containerWidth = parseInt(container.offsetWidth);
                    if (smallWindowCloseBtn && containerWidth > 10 && containerWidth < 450) {
                        hideLivePlayerSmallWindow(paras.divId);
                    }

                    if (livePlayerObjs[paras.divId].isLive) {
                        if (paras.vdnRetryNum == 2 || paras.vdnRetryNum > 3) {
                            paras.st = "";
                            createLivePlayer(paras);
                        } else {
                            LiveTimeshiftSwitch.prototype.returnToLive(paras);
                        }

                    } else {

                        if (paras.vdnRetryNum == 2 || paras.vdnRetryNum > 3) {
                            paras.st = livePlayerObjs[paras.divId].startStamp;
                            createLivePlayer(paras);

                        } else {
                            LiveTimeshiftSwitch.prototype.playTimeshiftFromPos(paras, livePlayerObjs[paras.divId].startStamp);
                        }
                    }

                    return;

                }

            } else {
                livePlayerObjs[paras.divId].loadingTime = 0;
                paras.vdnRetryNum = 0;
            }

            LiveTimeshiftBar.prototype.checkCopyright(paras, startStamp + playingTime);

            if (playingTime % 5 === 0) {
                moveLeft = playingTime * 90 / 600;
                pointer.style.left = pointerLeft + moveLeft + "px";

            }

            let containerWidth = container.offsetWidth;
            let pLeft = parseInt(pointer.style.left);

            //根据指针位置，显示或隐藏指针
            if (pLeft < 50 || pLeft > containerWidth - 10) {
                pointer.style.display = "none";

                if (pLeft > containerWidth - 9 && pLeft < containerWidth - 6) {

                    let moveValue = -(containerWidth / 2 + 60);
                    clearInterval(livePlayerObjs[paras.divId].liveTimer);
                    LiveTimeshiftBar.prototype.moveEpgByValue(paras, moveValue);
                    LiveTimeshiftBar.prototype.liveTimeUpdate(paras, livePlayerObjs[paras.divId].startStamp + 2);
                }
            } else {

                if (pLeft >= 50 && pLeft <= 80 || pLeft <= containerWidth - 10 && pLeft >= containerWidth - 40) {
                    pointer.style.zIndex = "8";
                } else {
                    pointer.style.zIndex = "12";
                }

                let timeshiftbtn = document.getElementById("timeshiftbtn_" + paras.divId);
                if (timeshiftbtn && timeshiftbtn.getAttribute("isOn") === "true") {

                    if (!document.getElementById("close_player_" + paras.divId) || document.getElementById("close_player_" + paras.divId).style.display === "none") {
                        pointer.style.display = "block";
                    }

                }

            }

            //如果到凌晨0点，加载下一天epg
            if (startStamp + playingTime - (livePlayerObjs[paras.divId].start + 24 * 3600) >= 0) {
                livePlayerObjs[paras.divId].start = parseInt(livePlayerObjs[paras.divId].start);

                if (livePlayerObjs[paras.divId].isLive) {
                    paras.st = "";
                    livePlayerObjs[paras.divId].endTime = livePlayerObjs[paras.divId].start + 24 * 3600 + 1;
                    livePlayerObjs[paras.divId].end = livePlayerObjs[paras.divId].endTime;
                } else {
                    paras.st = livePlayerObjs[paras.divId].start + 24 * 3600 + 1;
                }

                livePlayerObjs[paras.divId].start = 0;
                livePlayerObjs[paras.divId].startStamp = 0;
                clearInterval(livePlayerObjs[paras.divId].liveTimer);
                livePlayerObjs[paras.divId].isNewDay = true;
                LiveTimeshiftBar.prototype.showEpg(paras);
                //createLiveHls(paras);

            }

        }, intervalTime);
    }

    checkCopyright(paras, start, type) {

        start = parseInt(start);

        let epg = livePlayerObjs[paras.divId].epg;
        let len = 0;

        if (epg) {
            len = epg.length;

            //高亮直播节目
            if (livePlayerObjs[paras.divId].liveProgramStart && livePlayerObjs[paras.divId].end && livePlayerObjs[paras.divId].end % 10 === 0) {
                for (var i = 0; i < len; i++) {
                    if (livePlayerObjs[paras.divId].end - epg[i].st > 0 && livePlayerObjs[paras.divId].end - epg[i].et < 0) {
                        let liveIndex = i + 1;
                        if (liveIndex - (livePlayerObjs[paras.divId].epg.length + 1) < 0) {
                            LiveTimeshiftBar.prototype.hightlightLiveProgram(paras, liveIndex);

                            livePlayerObjs[paras.divId].liveProgramStart = epg[liveIndex - 1].st;
                            livePlayerObjs[paras.divId].liveProgramEnd = epg[liveIndex - 1].et;
                            livePlayerObjs[paras.divId].liveProgramIndex = liveIndex;
                            break;
                        }

                    }
                }
            }

            for (var i = 0; i < len; i++) {

                //st>=0"="去掉，20191126
                if (i == 0 && start - livePlayerObjs[paras.divId].start > 0 && start - epg[i].st < 0) {

                    if (livePlayerObjs[paras.divId].epg[0].startPublic !== undefined && livePlayerObjs[paras.divId].epg[0].startPublic !== "1") {
                        showLivePlayerMsg(paras, "由于播出安排变更，暂时不提供该时段内容，请选择观看其他精彩视频");

                        if (isUseConvivaMonitor) {
                            createFlvHtml5ConvivaEvent(paras);
                        }
                    } else if (livePlayerObjs[paras.divId].epg[0].startPublic !== undefined && livePlayerObjs[paras.divId].epg[0].startPublic === "1") {
                        removeLiveErrorMsg(paras);
                    } else {
                        if (!livePlayerObjs[paras.divId].epg[i].startPublicChecked) {
                            start = epg[i].st - 0 + parseInt((epg[i].et - epg[i].st) / 2);
                            LiveTimeshiftBar.prototype.getCopyrightData(paras, start, -1);
                        }

                    }

                    livePlayerObjs[paras.divId].epg[0].startPublicChecked = true;

                    break;
                }

                //st>=0"="去掉，20191126
                if (start - epg[i].st > 0 && start - epg[i].et < 0) {

                    if (livePlayerObjs[paras.divId].epg[i].public !== undefined && livePlayerObjs[paras.divId].epg[i].public !== "1") {
                        showLivePlayerMsg(paras, "由于播出安排变更，暂时不提供该时段内容，请选择观看其他精彩视频");

                        if (isUseConvivaMonitor) {
                            createFlvHtml5ConvivaEvent(paras);
                        }
                    } else if (livePlayerObjs[paras.divId].epg[i].public !== undefined && livePlayerObjs[paras.divId].epg[i].public === "1") {
                        removeLiveErrorMsg(paras);
                    } else {
                        if (!livePlayerObjs[paras.divId].epg[i].publicChecked) {
                            start = epg[i].st - 0 + parseInt((epg[i].et - epg[i].st) / 2);
                            LiveTimeshiftBar.prototype.getCopyrightData(paras, start, i);
                        }

                    }

                    livePlayerObjs[paras.divId].epg[i].publicChecked = true;

                    break;
                }
            }

        } else {
            if (!livePlayerObjs[paras.divId].checkCopyrightWhenNoEpg) {
                livePlayerObjs[paras.divId].checkCopyrightWhenNoEpg = true;
                let timeSec = 10 * 60;
                setTimeout(function() {
                    if (livePlayerObjs[paras.divId].checkCopyrightWhenNoEpg) {
                        livePlayerObjs[paras.divId].checkCopyrightWhenNoEpg = false;
                        LiveTimeshiftBar.prototype.getCopyrightData(paras, start - 0 + timeSec);
                    }
                }, timeSec * 1000)
            }

        }

    }

    getCopyrightData(paras, start, epgIndex) {
        //检查版权
        //对接口文档的新字段进行初始化；
        var vdn_tsp = new Date().getTime().toString().slice(0, 10);
        var vdn_vn = "2049";
        var vdn_vc = "";
        var staticCheck = "47899B86370B879139C08EA3B5E88267";
        var vdn_uid = "";
        var vdn_wlan = "";
        //获取cookie
        if (typeof (getCookie_vdn) == "function") {
            if (!getCookie_vdn("Fingerprint")) {
                //获取设备指纹信息
                if (typeof (getfingerprint2) == "function" && typeof (getfingerprint2) != "undefined" && !livePlayerObjs.isFingerprintJsLoading) {
                    getfingerprint2();
                }
            } else {
                vdn_uid = getCookie_vdn("Fingerprint");
            }
        }
        //md5加密  动态校验码
        var vdn_vc = setH5Str((vdn_tsp + vdn_vn + staticCheck + vdn_uid)).toUpperCase();

        var vdnUrl = "http://vdn.live.cntv.cn/api2/liveTimeshiftHtml5.do?channel=pa://cctv_p2p_hd" + paras.t + "&client=flash&starttime=" + start;
        if (paras.isHttps === "true") {
            vdnUrl = "https://vdn.live.cntv.cn/api2/liveTimeshiftHtml5.do?channel=pa://cctv_p2p_hd" + paras.t + "&client=flash&starttime=" + start;
        }

        if (isIPad()) {
            vdnUrl = vdnUrl.replace("client=flash", "client=html5");
        }

        //添加新字段
        vdnUrl += "&tsp=" + vdn_tsp + "&vn=" + vdn_vn + "&vc=" + vdn_vc + "&uid=" + vdn_uid + "&wlan=" + vdn_wlan;
        vdnUrl += "";

        /*
        if(livePlayerObjs[paras.divId].isLive && livePlayerObjs[paras.divId].checkCopyrightTimer===null && livePlayerObjs[paras.divId].vdn && livePlayerObjs[paras.divId].vdn.vdnUrl) {
            vdnUrl = livePlayerObjs[paras.divId].vdn.vdnUrl;

            livePlayerObjs[paras.divId].checkCopyrightTimer = setTimeout(function () {
                livePlayerObjs[paras.divId].checkCopyrightTimer = null;
                LiveTimeshiftBar.prototype.parseCopyrightData(paras, vdnUrl, epgIndex);

            }, 60000);
        } else {
            LiveTimeshiftBar.prototype.parseCopyrightData(paras, vdnUrl, epgIndex);

        }
        */

        LiveTimeshiftBar.prototype.parseCopyrightData(paras, vdnUrl, epgIndex);

    }

    parseCopyrightData(paras, vdnUrl, epgIndex) {
        LazyLoad.js(vdnUrl, function() {
            if (typeof html5VideoData && html5VideoData) {
                var obj = null;
                var publicMsg = "1";

                try {
                    var obj = eval('(' + html5VideoData + ')');
                    if (obj.ack === "yes") {
                        publicMsg = obj.public;
                    }
                } catch (e) {
                    publicMsg = "1";
                }

                if (epgIndex !== undefined) {
                    if (epgIndex === -1) {
                        livePlayerObjs[paras.divId].epg[0].startPublicChecked = true;
                        livePlayerObjs[paras.divId].epg[0].startPublic = publicMsg;
                    } else {
                        livePlayerObjs[paras.divId].epg[epgIndex].publicChecked = true;
                        livePlayerObjs[paras.divId].epg[epgIndex].public = publicMsg;

                    }
                }

                if (publicMsg !== "1") {
                    showLivePlayerMsg(paras, "由于播出安排变更，暂时不提供该时段内容，请选择观看其他精彩视频");

                    if (isUseConvivaMonitor) {
                        createFlvHtml5ConvivaEvent(paras);
                    }
                } else {
                    removeLiveErrorMsg(paras);
                }
            }
        });
    }

    showTimeShiftTime(paras, startStamp, playingTime) {
        let stamp = parseInt(startStamp - 0 + playingTime - 0);

        let nowDate = new Date(stamp * 1000);
        let epgMonth = nowDate.getMonth() + 1 + "";
        if (epgMonth.length < 2) {
            epgMonth = "0" + epgMonth;
        }
        let epgDay = nowDate.getDate() + "";
        if (epgDay.length < 2) {
            epgDay = "0" + epgDay;
        }

        let dateText = document.getElementById("timeshift_text_date_" + paras.divId);
        let timeText = document.getElementById("timeshift_text_time_" + paras.divId);

        let shiftTime = LiveTimeshiftBar.prototype.formatTimeToStr(stamp - livePlayerObjs[paras.divId].start);
        dateText.innerHTML = `${epgMonth}月${epgDay}日 `;
        timeText.innerHTML = shiftTime;

        let timeshiftBar = document.getElementById("timeshift_time_" + paras.divId);

        if (!document.getElementById("close_player_" + paras.divId) || document.getElementById("close_player_" + paras.divId).style.display === "none") {
            timeshiftBar.style.display = "block";
        } else {
            timeshiftBar.style.display = "none";
        }

    }

    formatTimeToStr(secs) {
        let h = parseInt(secs / 3600);
        let m = parseInt((secs - h * 3600) / 60);
        if (m == 60) {
            h += 1;
            m = 0;
        }
        let s = Math.ceil(secs - h * 3600 - m * 60);
        if (s == 60) {
            m += 1;
            s = 0;
            if (m == 60) {
                h += 1;
                m = 0;
            }
        }

        let str = "";
        if (m < 10) {
            str += "0";
        }
        if (s < 10) {
            s = "0" + s;
        }
        str += m + ":" + s;

        if (h < 1) {
            str = "00" + ":" + str;
        } else if (h < 10) {
            str = "0" + h + ":" + str;
        } else {
            str = h + ":" + str;
        }

        return str;
    }

    playerResize(paras) {

        let container = document.getElementById(paras.divId);
        let timeshiftEpgBar = document.getElementById("timeshift_epg_" + paras.divId);
        let playerWidth = container.offsetWidth;

        if (timeshiftEpgBar) {
            timeshiftEpgBar.style.width = playerWidth - 60 - 30 - 30 + "px";

            let scale = document.getElementById("scale_" + paras.divId);
            let scaleWidth = parseInt(scale.style.width);
            let scaleLeft = parseInt(scale.style.left);

            if (scaleLeft + scaleWidth < playerWidth - 60) {
                let moveValue = scaleLeft + (playerWidth - 60 + scaleLeft + scaleWidth);

                clearInterval(livePlayerObjs[paras.divId].liveTimer);
                LiveTimeshiftBar.prototype.moveEpgByValue(paras, moveValue);

                setTimeout(function() {
                    LiveTimeshiftBar.prototype.liveTimeUpdate(paras, livePlayerObjs[paras.divId].startStamp + 2);
                }, 1000);

            }
        }

    }

    formatMinToStr(min) {
        let h = parseInt(min / 60);
        let m = min - h * 60;
        if (h < 10) {
            h = "0" + h;
        }

        if (m < 10) {
            m = "0" + m;
        }

        return h + ":" + m;
    }

}

class LiveTimeshiftSwitch {
    constructor(paras, right) {

        this.initUi(paras, right);
        this.initEvents(paras);
        //设置播放器容器事件
    }

    initUi(paras, right) {
        let htmls = "";

        htmls = ` 
        <div id="timeshiftbtn_${paras.divId}" isOn="true" style="position:absolute;bottom:9px;right:${right}px;height:30px;cursor:pointer;z-index:9;">
                <div id="timeshiftbtn_text_${paras.divId}" style="position:absolute;right:35px;font-size:14px;line-height:14px;padding:8px 0px;width:32px;font-weight:400;color:rgb(180, 180, 180);">
                   时移
                </div>

                <div style="position:absolute;right:7px;padding:12px 0px;line-height:6px;text-align:center;display:table-cell;vertical-align:middle;">
                    <img id="timeshiftbtn_false_${paras.divId}" style="width:22px;height:6px;display:none;vertical-align:middle;" src="${playerContorlsImgDir}seted_false.png">
                    <img id="timeshiftbtn_true_${paras.divId}" style="width:22px;height:6px;display:table-cell;vertical-align:middle;" src="${playerContorlsImgDir}seted_true.png">
                </div>

                <div id="timeshiftbtn_pointer_${paras.divId}" style="position:absolute;right:2px;padding:8px 0px;line-height:14px;">
                    <img style="width:14px;height:14px" src="${playerContorlsImgDir}seted_pointer.png">
                </div>
            </div>   
              
        `;

        right += 40;

        htmls += ` 
        <div id="return_to_live_${paras.divId}" style="position:absolute;bottom:9px;right:${right}px;height:30px;cursor:pointer;z-index:9;display:none;">
                <div id="return_to_live_text_${paras.divId}" style="position:absolute;right:35px;font-size:14px;line-height:14px;padding:8px 0px;width:60px;font-weight:400;color:rgb(180, 180, 180);">
                   返回直播
                </div>
                
            </div>   
              
        `;

        let timeLeft = 66;
        htmls += ` 
        <div id="timeshift_time_${paras.divId}" style="position:absolute;bottom:17px;width:auto;left:${timeLeft}px;height:14px;font-size:14px;line-height:14px;z-index:9;">
                <span id="timeshift_text_date_${paras.divId}" style="color:rgb(253,36,0);"></span><span id="timeshift_text_time_${paras.divId}" style="color:rgb(255,255,255);"></span>
                
            </div>   
              
        `;

        document.getElementById("control_bar" + "_" + paras.divId).insertAdjacentHTML("afterBegin", htmls);

        if (isTimeshift(paras)) {
            document.getElementById("return_to_live_" + paras.divId).style.display = "block";
        }

    }

    initEvents(paras) {
        let timeshiftbtn = document.getElementById("timeshiftbtn_" + paras.divId);
        timeshiftbtn.addEventListener("mouseover", this.textBtnByMouseover.bind(null, paras), false);
        timeshiftbtn.addEventListener("mouseout", this.textBtnByMouseout.bind(null, paras), false);
        timeshiftbtn.addEventListener("click", this.textBtnByClick.bind(null, paras), false);

        let returnToLiveBtn = document.getElementById("return_to_live_" + paras.divId);
        returnToLiveBtn.addEventListener("mouseover", this.returnToLiveBtnByMouseover.bind(null, paras), false);
        returnToLiveBtn.addEventListener("mouseout", this.returnToLiveBtnByMouseout.bind(null, paras), false);
        //returnToLiveBtn.addEventListener("click", this.returnToLiveBtnByClick.bind(null, paras), false);

        returnToLiveBtn.addEventListener("click", function(ev) {

            LiveTimeshiftSwitch.prototype.returnToLive(paras);

        }, false);

    }

    textBtnByMouseover(paras) {
        let textBtn = document.getElementById("timeshiftbtn_text_" + paras.divId);
        textBtn.style.color = "rgb(255, 255, 255)";

    }

    textBtnByMouseout(paras) {
        let textBtn = document.getElementById("timeshiftbtn_text_" + paras.divId);
        textBtn.style.color = "rgb(180, 180, 180)";

    }

    textBtnByClick(paras, isShow) {
        let timeshiftbtn = document.getElementById("timeshiftbtn_" + paras.divId);
        let isOn = timeshiftbtn.getAttribute("isOn");
        let pointerDot = document.getElementById("timeshiftbtn_pointer_" + paras.divId);
        let timeshiftBar = document.getElementById("timeshift_bar_" + paras.divId);
        let timeshiftPointer = document.getElementById("timeshift_pointer_" + paras.divId);

        if (isOn === "false" || isShow === true) {

            document.getElementById("timeshiftbtn_false_" + paras.divId).style.display = "none";
            document.getElementById("timeshiftbtn_true_" + paras.divId).style.display = "table-cell";
            pointerDot.style.right = "0px";
            pointerDot.style.transition = "right 0.2s";
            timeshiftbtn.setAttribute("isOn", "true");

            timeshiftBar.style.display = "block";
            timeshiftPointer.style.display = "block";
        } else {
            document.getElementById("timeshiftbtn_true_" + paras.divId).style.display = "none";
            document.getElementById("timeshiftbtn_false_" + paras.divId).style.display = "table-cell";
            pointerDot.style.right = "20px";
            pointerDot.style.transition = "right 0.2s";
            timeshiftbtn.setAttribute("isOn", "false");

            timeshiftBar.style.display = "none";
            timeshiftPointer.style.display = "none";

        }

        //调整banner广告位置
        let adBannerContainer = document.getElementById("adbanner_" + paras.divId);
        if (adBannerContainer) {
            if (isOn === "true") {
                adBannerContainer.style.bottom = "70px";
            } else {
                adBannerContainer.style.bottom = "120px";
            }
        }

    }

    returnToLiveBtnByMouseover(paras) {
        let textBtn = document.getElementById("return_to_live_text_" + paras.divId);
        textBtn.style.color = "rgb(255, 255, 255)";

    }

    returnToLiveBtnByMouseout(paras) {
        let textBtn = document.getElementById("return_to_live_text_" + paras.divId);
        textBtn.style.color = "rgb(180, 180, 180)";

    }

    playTimeshiftFromPos(paras, fromStart) {

        clearInterval(livePlayerObjs[paras.divId].liveTimer);
        paras.st = "";
        let oneSecWidth = 90 / 600;
        fromStart = parseInt(fromStart);
        let stamp = fromStart;
        let container = document.getElementById(paras.divId);
        let playerWidth = container.offsetWidth;
        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);
        let pointerLeft = getOffsetLeft(container) + parseInt(pointer.style.left);
        let scale = document.getElementById("scale_" + paras.divId);
        let scaleLeft = getOffsetLeft(scale);
        let pos = 0;

        livePlayerObjs[paras.divId].startStamp = stamp;

        pointer.style.zIndex = "12";

        let timeoutTime = 100;
        if (fromStart) {
            timeoutTime = 300;
        }

        let textBtn = document.getElementById("return_to_live_" + paras.divId);
        textBtn.style.display = "block";

        LiveControlsBar.prototype.controlBarShowOrHide("show", paras.divId);

        let timeshiftbtn = document.getElementById("timeshiftbtn_" + paras.divId);
        if (timeshiftbtn && timeshiftbtn.getAttribute("isOn") !== "true") {
            LiveTimeshiftSwitch.prototype.textBtnByClick(paras, true);
        }

        pos = oneSecWidth * (fromStart - livePlayerObjs[paras.divId].start);

        let pointerMoveValue = pos - (pointerLeft + 10 - scaleLeft);
        pointer.style.display = "block";
        let movedValue = parseFloat(pointer.style.left) + pointerMoveValue;
        if (movedValue < 60 || movedValue > playerWidth - 10) {
            pointer.style.transition = "left 0s";
            setTimeout(function() {

                pointerLeft = getOffsetLeft(container) + parseInt(pointer.style.left);
                scaleLeft = getOffsetLeft(scale);
                pos = oneSecWidth * (fromStart - livePlayerObjs[paras.divId].start);
                pointerMoveValue = pos - (pointerLeft + 10 - scaleLeft);
                pointer.style.left = parseFloat(pointer.style.left) + pointerMoveValue + "px";

                pos = parseFloat(pointer.style.left);

                pointerMoveValue = -pos + playerWidth / 2 + 60;
                LiveTimeshiftBar.prototype.moveEpgByValue(paras, pointerMoveValue);

            }, timeoutTime);

        } else {
            pointer.style.transition = "left 0.2s";
        }

        pointer.style.left = parseFloat(pointer.style.left) + pointerMoveValue + "px";

        clearInterval(livePlayerObjs[paras.divId].liveTimer);

        LiveTimeshiftBar.prototype.showTimeShiftTime(paras, stamp, 0);

        if (document.getElementById("error_msg_" + paras.divId) || fromStart) {

            setTimeout(function() {
                //LiveTimeshiftBar.prototype.liveTimeUpdate(paras);
                LiveTimeshiftBar.prototype.liveTimeUpdate(paras, stamp);

            }, 1200);
        } else {
            //LiveTimeshiftBar.prototype.liveTimeUpdate(paras);
            LiveTimeshiftBar.prototype.liveTimeUpdate(paras, stamp);

        }

        let videoUrl = livePlayerObjs[paras.divId].video.url;
        let startIndex = videoUrl.indexOf("?begintimeabs=");
        if (startIndex === -1) {
            startIndex = videoUrl.indexOf("&begintimeabs=");
        }

        if (startIndex > 0) {
            livePlayerObjs[paras.divId].video.url = videoUrl.substring(0, startIndex + 1) + "begintimeabs=" + fromStart * 1000;
        } else {
            if (videoUrl.indexOf("?") > 0) {
                livePlayerObjs[paras.divId].video.url = videoUrl + "&begintimeabs=" + fromStart * 1000;
            } else {
                livePlayerObjs[paras.divId].video.url = videoUrl + "?begintimeabs=" + fromStart * 1000;
            }
        }

        createLiveHls(paras);
    }

    returnToLiveBtnByClick(paras) {

        let returnToLiveBtn = document.getElementById("return_to_live_" + paras.divId);
        let startIndex = 0;
        let videoUrl = livePlayerObjs[paras.divId].video.url;
        startIndex = videoUrl.indexOf("?begintimeabs=") !== -1 ? videoUrl.indexOf("?begintimeabs=") : videoUrl.indexOf("&begintimeabs=");
        let stamp = livePlayerObjs[paras.divId].end;

        let pointer = document.getElementById("timeshift_pointer_" + paras.divId);

        pointer.style.zIndex = "12";

        let timeshiftbtn = document.getElementById("timeshiftbtn_" + paras.divId);

        if (timeshiftbtn && timeshiftbtn.getAttribute("isOn") !== "true") {
            pointer.style.display = "block";
            LiveTimeshiftSwitch.prototype.textBtnByClick(paras);
        }

        let timeshiftBar = document.getElementById("timeshift_time_" + paras.divId);
        timeshiftBar.style.display = "none";

        removeLiveErrorMsg(paras, true);

        if (startIndex !== -1) {
            videoUrl = videoUrl.substring(0, startIndex);
        }

        livePlayerObjs[paras.divId].video.url = videoUrl;

        clearInterval(livePlayerObjs[paras.divId].liveTimer);

        let oneSecWidth = 90 / 600;
        paras.st = "";

        if (livePlayerObjs[paras.divId].start && stamp >= livePlayerObjs[paras.divId].start && stamp < (livePlayerObjs[paras.divId].start + 24 * 3600)) {
            //LiveTimeshiftBar.prototype.movePointerToPos(paras, livePlayerObjs[paras.divId].end);
            //alert(livePlayerObjs[paras.divId].start);
            let container = document.getElementById(paras.divId);
            let playerWidth = container.offsetWidth;

            let pointerLeft = getOffsetLeft(container) + parseInt(pointer.style.left);
            let scale = document.getElementById("scale_" + paras.divId);
            let scaleLeft = getOffsetLeft(scale);

            let livePos = 0;

            //当天时移的处理
            if (livePlayerObjs[paras.divId].endTime && livePlayerObjs[paras.divId].endTime - (livePlayerObjs[paras.divId].start + 24 * 3600) < 0) {

                livePos = oneSecWidth * (livePlayerObjs[paras.divId].endTime - livePlayerObjs[paras.divId].start);

            } else {
                livePos = oneSecWidth * (livePlayerObjs[paras.divId].end - livePlayerObjs[paras.divId].start);
            }

            let pointerMoveValue = livePos - (pointerLeft + 10 - scaleLeft);

            let movedValue = parseFloat(pointer.style.left) + pointerMoveValue;

            pointer.style.transition = "left 0s";

            if (movedValue < 60 || movedValue > playerWidth - 10) {
                pointer.style.transition = "left 0s";
                setTimeout(function() {

                    livePlayerObjs[paras.divId].end = LiveTimeshiftBar.prototype.getNowTimestamp(paras);
                    pointerLeft = getOffsetLeft(container) + parseInt(pointer.style.left);
                    scaleLeft = getOffsetLeft(scale);
                    livePos = oneSecWidth * (livePlayerObjs[paras.divId].end - livePlayerObjs[paras.divId].start);
                    pointerMoveValue = livePos - (pointerLeft + 10 - scaleLeft);
                    pointer.style.left = parseFloat(pointer.style.left) + pointerMoveValue + "px";

                    let pos = parseFloat(pointer.style.left);
                    let playerWidth = container.offsetWidth;
                    pointerMoveValue = -pos + playerWidth / 2 + 60;
                    LiveTimeshiftBar.prototype.moveEpgByValue(paras, pointerMoveValue);

                }, 30);

            } else {
                pointer.style.transition = "left 0.2s";
            }

            pointer.style.left = parseFloat(pointer.style.left) + pointerMoveValue + "px";

            setTimeout(function() {
                LiveTimeshiftBar.prototype.liveTimeUpdate(paras);

            }, 1200);

        } else {
            livePlayerObjs[paras.divId].endTime = livePlayerObjs[paras.divId].start + 24 * 3600;
            //LiveTimeshiftBar.prototype.showEpg(paras);
        }

        createLiveHls(paras);

        returnToLiveBtn.style.display = "none";

    }

    returnToLive(paras, isLiveToLive) {
        let isLivetimeGeted = false;

        //如果到凌晨0点，加载下一天epg
        if (isLiveToLive && (livePlayerObjs[paras.divId].end - (livePlayerObjs[paras.divId].start - 0 + 24 * 3600) >= 0)) {
            livePlayerObjs[paras.divId].start = parseInt(livePlayerObjs[paras.divId].start);

            paras.st = "";
            livePlayerObjs[paras.divId].endTime = livePlayerObjs[paras.divId].start + 24 * 3600 + 1;
            livePlayerObjs[paras.divId].end = livePlayerObjs[paras.divId].endTime;

            livePlayerObjs[paras.divId].start = 0;
            livePlayerObjs[paras.divId].startStamp = 0;
            clearInterval(livePlayerObjs[paras.divId].liveTimer);
            livePlayerObjs[paras.divId].isNewDay = true;
            createLiveHls(paras);
            return;

        }

        if (livePlayerObjs[paras.divId].flv5) {
            LazyLoad.js(livePlayerObjs[paras.divId].flv5, function() {
                isLivetimeGeted = true;
                let stamp = 0;
                if (currentLiveTimeData && currentLiveTimeData.GT && currentLiveTimeData.GT - 0 > 1000000000) {
                    stamp = currentLiveTimeData.GT;

                }

                if (stamp - 10000000000 > 0) {
                    stamp = parseInt(stamp / 1000);
                } else {
                    stamp = Date.parse(new Date()) / 1000;
                    stamp = stamp - 50;
                }
                livePlayerObjs[paras.divId].end = stamp;

                /*
                if(isLiveToLive) {
                    createLiveHls(paras);
                    LiveTimeshiftBar.prototype.liveTimeUpdate(paras);
                } else{
                    LiveTimeshiftSwitch.prototype.returnToLiveBtnByClick(paras);
                }
                */
                LiveTimeshiftSwitch.prototype.returnToLiveBtnByClick(paras);

            });
        } else {
            isLivetimeGeted = true;
            LiveTimeshiftSwitch.prototype.returnToLiveBtnByClick(paras);
        }

        setTimeout(function() {
            if (!isLivetimeGeted) {
                isLivetimeGeted = true;
                LiveTimeshiftSwitch.prototype.returnToLiveBtnByClick(paras);
            }
        }, 6000);
    }
}

//画中画功能
class LivePictureInPicture {
    constructor(paras) {
        let player = document.getElementById('h5player_' + paras.divId);
        if (document.pictureInPictureEnabled && player.requestPictureInPicture && document.exitPictureInPicture || player.webkitSupportsPresentationMode && typeof player.webkitSetPresentationMode === "function") {
            this.initUi(paras);
            this.initEvents(paras);
            //设置播放器容器事件
        }

    }

    initUi(paras) {
        let htmls = "";

        htmls = ` 
        <div id="pic_in_pic_${paras.divId}" style="position:absolute;top:20px;right:20px;font-weight:400;height:32px;text-align:center;width:auto;border-radius:20px;color:#FFF;background-color:#000;opacity:0.7;cursor:pointer;z-index:9;">
                <span style="display:inline-block;">
                    <img style="display:inline-block;width:16px;height:14px;line-height:32px;padding:9px 2px 9px 16px" src="${playerContorlsImgDir}pic_in_pic.png">
                </span>
                
                <span id="pic_in_pic_text_${paras.divId}"  isOn="false" style="display:inline-block;vertical-align: top;font-size:14px;line-height:32px;padding-right:16px;">
                   画中画
                </span>               
            </div>   
              
        `;

        document.getElementById(paras.divId).insertAdjacentHTML("afterBegin", htmls);

    }

    initEvents(paras) {
        let togglePipButton = document.getElementById('pic_in_pic_' + paras.divId);

        togglePipButton.addEventListener("mouseover", this.picInPicByMouseover.bind(null, paras), false);
        togglePipButton.addEventListener("mouseout", this.picInPicByMouseout.bind(null, paras), false);
        togglePipButton.addEventListener("click", this.picInPicByClick.bind(null, paras), false);

    }

    picInPicByMouseover(paras) {
        let togglePipButton = document.getElementById('pic_in_pic_' + paras.divId);
        togglePipButton.style.opacity = "1";
        togglePipButton.style.backgroundColor = "#bf0614";
    }

    picInPicByMouseout(paras) {
        let togglePipButton = document.getElementById('pic_in_pic_' + paras.divId);
        togglePipButton.style.opacity = "0.7";
        togglePipButton.style.backgroundColor = "#000";
    }

    picInPicByClick(paras) {
        let togglePipButton = document.getElementById('pic_in_pic_' + paras.divId);
        let player = document.getElementById('h5player_' + paras.divId);

        // If there is no element in Picture-in-Picture yet, let’s request
        // Picture-in-Picture for the video, otherwise leave it.

        if (document.pictureInPictureEnabled && player.requestPictureInPicture && document.exitPictureInPicture) {

            if (!document.pictureInPictureElement) {
                player.requestPictureInPicture().catch(error=>{//Video failed to enter Picture-in-Picture mode.
                }
                );

            } else {

                document.exitPictureInPicture().catch(error=>{
                //Video failed to leave Picture-in-Picture mode.
                }
                );

            }

            //video元素添加事件
            player.addEventListener('enterpictureinpicture', function(event) {
                //console.log('Video entered Picture-in-Picture mode.');
                let picInPicText = document.getElementById('pic_in_pic_text_' + paras.divId);
                picInPicText.innerText = "画中画使用中";
                picInPicText.setAttribute("isOn", "true");
            }, false);
            //video元素添加事件
            player.addEventListener('leavepictureinpicture', function(e) {
                //console.log('Video left Picture-in-Picture mode.');
                let picInPicText = document.getElementById('pic_in_pic_text_' + paras.divId);
                picInPicText.innerText = "画中画";
                picInPicText.setAttribute("isOn", "false");
            }, false);
        } else {
            if (player.webkitPresentationMode === "inline") {
                player.webkitSetPresentationMode("picture-in-picture");
            } else if (player.webkitPresentationMode === "picture-in-picture") {
                player.webkitSetPresentationMode("inline");
            }

            player.addEventListener('webkitpresentationmodechanged', function(ev) {//let e = ev ? ev : window.event;
            //console.log(e);

            }, false);
        }

    }

}

function getOffsetTop(obj) {
    var tmp = obj.offsetTop;
    var val = obj.offsetParent;
    while (val != null) {
        tmp += val.offsetTop;
        val = val.offsetParent;
    }
    return tmp;
}

function getOffsetLeft(obj) {
    var tmp = obj.offsetLeft;
    var val = obj.offsetParent;
    while (val != null) {
        tmp += val.offsetLeft;
        val = val.offsetParent;
    }
    return tmp;
}

"undefined" != typeof window && function(e, t) {
    "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.Hls = t() : e.Hls = t()
}(this, function() {
    return (i = {},
    a.m = r = [function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = r(6);
        function a() {}
        var l, n = {
            trace: a,
            debug: a,
            log: a,
            warn: a,
            info: a,
            error: a
        }, o = n, u = i.getSelfScope();
        t.enableLogs = function(e) {
            if (!0 === e || "object" == typeof e) {
                !function(t) {
                    for (var e = [], r = 1; r < arguments.length; r++)
                        e[r - 1] = arguments[r];
                    e.forEach(function(e) {
                        o[e] = t[e] ? t[e].bind(t) : function(o) {
                            var s = u.console[o];
                            return s ? function() {
                                for (var e = [], t = 0; t < arguments.length; t++)
                                    e[t] = arguments[t];
                                var r, i, a, n;
                                e[0] && (e[0] = (r = o,
                                i = e[0],
                                a = Date.now(),
                                n = l ? "+" + (a - l) : "0",
                                l = a,
                                new Date(a).toISOString() + " | [" + r + "] > " + i + " ( " + n + " ms )")),
                                s.apply(u.console, e)
                            }
                            : a
                        }(e)
                    })
                }(e, "debug", "log", "info", "warn", "error");
                try {
                    o.log()
                } catch (e) {
                    o = n
                }
            } else
                o = n
        }
        ,
        t.logger = o
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.default = {
            MEDIA_ATTACHING: "hlsMediaAttaching",
            MEDIA_ATTACHED: "hlsMediaAttached",
            MEDIA_DETACHING: "hlsMediaDetaching",
            MEDIA_DETACHED: "hlsMediaDetached",
            BUFFER_RESET: "hlsBufferReset",
            BUFFER_CODECS: "hlsBufferCodecs",
            BUFFER_CREATED: "hlsBufferCreated",
            BUFFER_APPENDING: "hlsBufferAppending",
            BUFFER_APPENDED: "hlsBufferAppended",
            BUFFER_EOS: "hlsBufferEos",
            BUFFER_FLUSHING: "hlsBufferFlushing",
            BUFFER_FLUSHED: "hlsBufferFlushed",
            MANIFEST_LOADING: "hlsManifestLoading",
            MANIFEST_LOADED: "hlsManifestLoaded",
            MANIFEST_PARSED: "hlsManifestParsed",
            LEVEL_SWITCHING: "hlsLevelSwitching",
            LEVEL_SWITCHED: "hlsLevelSwitched",
            LEVEL_LOADING: "hlsLevelLoading",
            LEVEL_LOADED: "hlsLevelLoaded",
            LEVEL_UPDATED: "hlsLevelUpdated",
            LEVEL_PTS_UPDATED: "hlsLevelPtsUpdated",
            AUDIO_TRACKS_UPDATED: "hlsAudioTracksUpdated",
            AUDIO_TRACK_SWITCHING: "hlsAudioTrackSwitching",
            AUDIO_TRACK_SWITCHED: "hlsAudioTrackSwitched",
            AUDIO_TRACK_LOADING: "hlsAudioTrackLoading",
            AUDIO_TRACK_LOADED: "hlsAudioTrackLoaded",
            SUBTITLE_TRACKS_UPDATED: "hlsSubtitleTracksUpdated",
            SUBTITLE_TRACK_SWITCH: "hlsSubtitleTrackSwitch",
            SUBTITLE_TRACK_LOADING: "hlsSubtitleTrackLoading",
            SUBTITLE_TRACK_LOADED: "hlsSubtitleTrackLoaded",
            SUBTITLE_FRAG_PROCESSED: "hlsSubtitleFragProcessed",
            INIT_PTS_FOUND: "hlsInitPtsFound",
            FRAG_LOADING: "hlsFragLoading",
            FRAG_LOAD_PROGRESS: "hlsFragLoadProgress",
            FRAG_LOAD_EMERGENCY_ABORTED: "hlsFragLoadEmergencyAborted",
            FRAG_LOADED: "hlsFragLoaded",
            FRAG_DECRYPTED: "hlsFragDecrypted",
            FRAG_PARSING_INIT_SEGMENT: "hlsFragParsingInitSegment",
            FRAG_PARSING_USERDATA: "hlsFragParsingUserdata",
            FRAG_PARSING_METADATA: "hlsFragParsingMetadata",
            FRAG_PARSING_DATA: "hlsFragParsingData",
            FRAG_PARSED: "hlsFragParsed",
            FRAG_BUFFERED: "hlsFragBuffered",
            FRAG_CHANGED: "hlsFragChanged",
            FPS_DROP: "hlsFpsDrop",
            FPS_DROP_LEVEL_CAPPING: "hlsFpsDropLevelCapping",
            ERROR: "hlsError",
            DESTROYING: "hlsDestroying",
            KEY_LOADING: "hlsKeyLoading",
            KEY_LOADED: "hlsKeyLoaded",
            STREAM_STATE_TRANSITION: "hlsStreamStateTransition"
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = r(6).getSelfScope().Number;
        (t.Number = i).isFinite = i.isFinite || function(e) {
            return "number" == typeof e && isFinite(e)
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.ErrorTypes = {
            NETWORK_ERROR: "networkError",
            MEDIA_ERROR: "mediaError",
            KEY_SYSTEM_ERROR: "keySystemError",
            MUX_ERROR: "muxError",
            OTHER_ERROR: "otherError"
        },
        t.ErrorDetails = {
            KEY_SYSTEM_NO_KEYS: "keySystemNoKeys",
            KEY_SYSTEM_NO_ACCESS: "keySystemNoAccess",
            KEY_SYSTEM_NO_SESSION: "keySystemNoSession",
            KEY_SYSTEM_LICENSE_REQUEST_FAILED: "keySystemLicenseRequestFailed",
            MANIFEST_LOAD_ERROR: "manifestLoadError",
            MANIFEST_LOAD_TIMEOUT: "manifestLoadTimeOut",
            MANIFEST_PARSING_ERROR: "manifestParsingError",
            MANIFEST_INCOMPATIBLE_CODECS_ERROR: "manifestIncompatibleCodecsError",
            LEVEL_LOAD_ERROR: "levelLoadError",
            LEVEL_LOAD_TIMEOUT: "levelLoadTimeOut",
            LEVEL_SWITCH_ERROR: "levelSwitchError",
            AUDIO_TRACK_LOAD_ERROR: "audioTrackLoadError",
            AUDIO_TRACK_LOAD_TIMEOUT: "audioTrackLoadTimeOut",
            FRAG_LOAD_ERROR: "fragLoadError",
            FRAG_LOAD_TIMEOUT: "fragLoadTimeOut",
            FRAG_DECRYPT_ERROR: "fragDecryptError",
            FRAG_PARSING_ERROR: "fragParsingError",
            REMUX_ALLOC_ERROR: "remuxAllocError",
            KEY_LOAD_ERROR: "keyLoadError",
            KEY_LOAD_TIMEOUT: "keyLoadTimeOut",
            BUFFER_ADD_CODEC_ERROR: "bufferAddCodecError",
            BUFFER_APPEND_ERROR: "bufferAppendError",
            BUFFER_APPENDING_ERROR: "bufferAppendingError",
            BUFFER_STALLED_ERROR: "bufferStalledError",
            BUFFER_FULL_ERROR: "bufferFullError",
            BUFFER_SEEK_OVER_HOLE: "bufferSeekOverHole",
            BUFFER_NUDGE_ON_STALL: "bufferNudgeOnStall",
            INTERNAL_EXCEPTION: "internalException"
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = r(0)
          , a = r(3)
          , n = r(1)
          , o = {
            hlsEventGeneric: !0,
            hlsHandlerDestroying: !0,
            hlsHandlerDestroyed: !0
        }
          , s = (l.prototype.destroy = function() {
            this.onHandlerDestroying(),
            this.unregisterListeners(),
            this.onHandlerDestroyed()
        }
        ,
        l.prototype.onHandlerDestroying = function() {}
        ,
        l.prototype.onHandlerDestroyed = function() {}
        ,
        l.prototype.isEventHandler = function() {
            return "object" == typeof this.handledEvents && this.handledEvents.length && "function" == typeof this.onEvent
        }
        ,
        l.prototype.registerListeners = function() {
            this.isEventHandler() && this.handledEvents.forEach(function(e) {
                if (o[e])
                    throw new Error("Forbidden event-name: " + e);
                this.hls.on(e, this.onEvent)
            }, this)
        }
        ,
        l.prototype.unregisterListeners = function() {
            this.isEventHandler() && this.handledEvents.forEach(function(e) {
                this.hls.off(e, this.onEvent)
            }, this)
        }
        ,
        l.prototype.onEvent = function(e, t) {
            this.onEventGeneric(e, t)
        }
        ,
        l.prototype.onEventGeneric = function(e, t) {
            try {
                (function(e, t) {
                    var r = "on" + e.replace("hls", "");
                    if ("function" != typeof this[r])
                        throw new Error("Event " + e + " has no generic handler in this " + this.constructor.name + " class (tried " + r + ")");
                    return this[r].bind(this, t)
                }
                ).call(this, e, t).call()
            } catch (t) {
                i.logger.error("An internal error happened while handling event " + e + '. Error message: "' + t.message + '". Here is a stacktrace:', t),
                this.hls.trigger(n.default.ERROR, {
                    type: a.ErrorTypes.OTHER_ERROR,
                    details: a.ErrorDetails.INTERNAL_EXCEPTION,
                    fatal: !1,
                    event: e,
                    err: t
                })
            }
        }
        ,
        l);
        function l(e) {
            for (var t = [], r = 1; r < arguments.length; r++)
                t[r - 1] = arguments[r];
            this.hls = e,
            this.onEvent = this.onEvent.bind(this),
            this.handledEvents = t,
            this.useGenericHandler = !0,
            this.registerListeners()
        }
        t.default = s
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = (a.isBuffered = function(e, t) {
            try {
                if (e)
                    for (var r = e.buffered, i = 0; i < r.length; i++)
                        if (t >= r.start(i) && t <= r.end(i))
                            return !0
            } catch (e) {}
            return !1
        }
        ,
        a.bufferInfo = function(e, t, r) {
            try {
                if (e) {
                    var i = e.buffered
                      , a = []
                      , n = void 0;
                    for (n = 0; n < i.length; n++)
                        a.push({
                            start: i.start(n),
                            end: i.end(n)
                        });
                    return this.bufferedInfo(a, t, r)
                }
            } catch (e) {}
            return {
                len: 0,
                start: t,
                end: t,
                nextStart: void 0
            }
        }
        ,
        a.bufferedInfo = function(e, t, r) {
            var i, a, n, o, s, l = [];
            for (e.sort(function(e, t) {
                return e.start - t.start || t.end - e.end
            }),
            s = 0; s < e.length; s++) {
                var u = l.length;
                if (u) {
                    var d = l[u - 1].end;
                    e[s].start - d < r ? e[s].end > d && (l[u - 1].end = e[s].end) : l.push(e[s])
                } else
                    l.push(e[s])
            }
            for (i = s = 0,
            a = n = t; s < l.length; s++) {
                var f = l[s].start
                  , c = l[s].end;
                if (f <= t + r && t < c)
                    a = f,
                    i = (n = c) - t;
                else if (t + r < f) {
                    o = f;
                    break
                }
            }
            return {
                len: i,
                start: a,
                end: n,
                nextStart: o
            }
        }
        ,
        a);
        function a() {}
        t.BufferHelper = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.getSelfScope = function() {
            return "undefined" == typeof window ? self : window
        }
    }
    , function(e, l, u) {
        "use strict";
        (function(r) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(l, "__esModule", {
                value: !0
            });
            var t = u(4)
              , a = u(1);
            l.FragmentState = {
                NOT_LOADED: "NOT_LOADED",
                APPENDING: "APPENDING",
                PARTIAL: "PARTIAL",
                OK: "OK"
            };
            var n, o = (n = t.default,
            e(s, n),
            s.prototype.destroy = function() {
                this.fragments = Object.create(null),
                this.timeRanges = Object.create(null),
                this.config = null,
                t.default.prototype.destroy.call(this),
                n.prototype.destroy.call(this)
            }
            ,
            s.prototype.getBufferedFrag = function(i, a) {
                var n = this.fragments
                  , e = Object.keys(n).filter(function(e) {
                    var t = n[e];
                    if (t.body.type !== a)
                        return !1;
                    if (!t.buffered)
                        return !1;
                    var r = t.body;
                    return r.startPTS <= i && i <= r.endPTS
                });
                if (0 === e.length)
                    return null;
                var t = e.pop();
                return n[t].body
            }
            ,
            s.prototype.detectEvictedFragments = function(a, n) {
                var o, s, l = this;
                Object.keys(this.fragments).forEach(function(e) {
                    var t = l.fragments[e];
                    if (!0 === t.buffered) {
                        var r = t.range[a];
                        if (r) {
                            o = r.time;
                            for (var i = 0; i < o.length; i++)
                                if (s = o[i],
                                !1 === l.isTimeBuffered(s.startPTS, s.endPTS, n)) {
                                    l.removeFragment(t.body);
                                    break
                                }
                        }
                    }
                })
            }
            ,
            s.prototype.detectPartialFragments = function(r) {
                var i = this
                  , e = this.getFragmentKey(r)
                  , a = this.fragments[e];
                a && (a.buffered = !0,
                Object.keys(this.timeRanges).forEach(function(e) {
                    if (r.hasElementaryStream(e)) {
                        var t = i.timeRanges[e];
                        a.range[e] = i.getBufferedTimes(r.startPTS, r.endPTS, t)
                    }
                }))
            }
            ,
            s.prototype.getBufferedTimes = function(e, t, r) {
                for (var i, a, n = [], o = !1, s = 0; s < r.length; s++) {
                    if (i = r.start(s) - this.bufferPadding,
                    a = r.end(s) + this.bufferPadding,
                    i <= e && t <= a) {
                        n.push({
                            startPTS: Math.max(e, r.start(s)),
                            endPTS: Math.min(t, r.end(s))
                        });
                        break
                    }
                    if (e < a && i < t)
                        n.push({
                            startPTS: Math.max(e, r.start(s)),
                            endPTS: Math.min(t, r.end(s))
                        }),
                        o = !0;
                    else if (t <= i)
                        break
                }
                return {
                    time: n,
                    partial: o
                }
            }
            ,
            s.prototype.getFragmentKey = function(e) {
                return e.type + "_" + e.level + "_" + e.urlId + "_" + e.sn
            }
            ,
            s.prototype.getPartialFragment = function(r) {
                var i, a, n, o = this, s = null, l = 0;
                return Object.keys(this.fragments).forEach(function(e) {
                    var t = o.fragments[e];
                    o.isPartial(t) && (a = t.body.startPTS - o.bufferPadding,
                    n = t.body.endPTS + o.bufferPadding,
                    a <= r && r <= n && (i = Math.min(r - a, n - r),
                    l <= i && (s = t.body,
                    l = i)))
                }),
                s
            }
            ,
            s.prototype.getState = function(e) {
                var t = this.getFragmentKey(e)
                  , r = this.fragments[t]
                  , i = l.FragmentState.NOT_LOADED;
                return void 0 !== r && (i = r.buffered ? !0 === this.isPartial(r) ? l.FragmentState.PARTIAL : l.FragmentState.OK : l.FragmentState.APPENDING),
                i
            }
            ,
            s.prototype.isPartial = function(e) {
                return !0 === e.buffered && (void 0 !== e.range.video && !0 === e.range.video.partial || void 0 !== e.range.audio && !0 === e.range.audio.partial)
            }
            ,
            s.prototype.isTimeBuffered = function(e, t, r) {
                for (var i, a, n = 0; n < r.length; n++) {
                    if (i = r.start(n) - this.bufferPadding,
                    a = r.end(n) + this.bufferPadding,
                    i <= e && t <= a)
                        return !0;
                    if (t <= i)
                        return !1
                }
                return !1
            }
            ,
            s.prototype.onFragLoaded = function(e) {
                var t = e.frag;
                r.isFinite(t.sn) && !t.bitrateTest && (this.fragments[this.getFragmentKey(t)] = {
                    body: t,
                    range: Object.create(null),
                    buffered: !1
                })
            }
            ,
            s.prototype.onBufferAppended = function(e) {
                var r = this;
                this.timeRanges = e.timeRanges,
                Object.keys(this.timeRanges).forEach(function(e) {
                    var t = r.timeRanges[e];
                    r.detectEvictedFragments(e, t)
                })
            }
            ,
            s.prototype.onFragBuffered = function(e) {
                this.detectPartialFragments(e.frag)
            }
            ,
            s.prototype.hasFragment = function(e) {
                var t = this.getFragmentKey(e);
                return void 0 !== this.fragments[t]
            }
            ,
            s.prototype.removeFragment = function(e) {
                var t = this.getFragmentKey(e);
                delete this.fragments[t]
            }
            ,
            s.prototype.removeAllFragments = function() {
                this.fragments = Object.create(null)
            }
            ,
            s);
            function s(e) {
                var t = n.call(this, e, a.default.BUFFER_APPENDED, a.default.FRAG_BUFFERED, a.default.FRAG_LOADED) || this;
                return t.bufferPadding = .2,
                t.fragments = Object.create(null),
                t.timeRanges = Object.create(null),
                t.config = e.config,
                t
            }
            l.FragmentTracker = o
        }
        ).call(this, u(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        (function(h) {
            Object.defineProperty(t, "__esModule", {
                value: !0
            });
            var o = r(0);
            function p(e, t, r) {
                var i = e[t]
                  , a = e[r]
                  , n = a.startPTS;
                h.isFinite(n) ? t < r ? (i.duration = n - i.start,
                i.duration < 0 && o.logger.warn("negative duration computed for frag " + i.sn + ",level " + i.level + ", there should be some duration drift between playlist and fragment!")) : (a.duration = i.start - n,
                a.duration < 0 && o.logger.warn("negative duration computed for frag " + a.sn + ",level " + a.level + ", there should be some duration drift between playlist and fragment!")) : a.start = t < r ? i.start + i.duration : Math.max(i.start - a.duration, 0)
            }
            function s(e, t, r, i, a, n) {
                var o = r;
                if (h.isFinite(t.startPTS)) {
                    var s = Math.abs(t.startPTS - r);
                    h.isFinite(t.deltaPTS) ? t.deltaPTS = Math.max(s, t.deltaPTS) : t.deltaPTS = s,
                    o = Math.max(r, t.startPTS),
                    r = Math.min(r, t.startPTS),
                    i = Math.max(i, t.endPTS),
                    a = Math.min(a, t.startDTS),
                    n = Math.max(n, t.endDTS)
                }
                var l = r - t.start;
                t.start = t.startPTS = r,
                t.maxStartPTS = o,
                t.endPTS = i,
                t.startDTS = a,
                t.endDTS = n,
                t.duration = i - r;
                var u, d, f, c = t.sn;
                if (!e || c < e.startSN || c > e.endSN)
                    return 0;
                for (u = c - e.startSN,
                (d = e.fragments)[u] = t,
                f = u; 0 < f; f--)
                    p(d, f, f - 1);
                for (f = u; f < d.length - 1; f++)
                    p(d, f, f + 1);
                return e.PTSKnown = !0,
                l
            }
            function l(e, t, r) {
                if (e && t)
                    for (var i = Math.max(e.startSN, t.startSN) - t.startSN, a = Math.min(e.endSN, t.endSN) - t.startSN, n = t.startSN - e.startSN, o = i; o <= a; o++) {
                        var s = e.fragments[n + o]
                          , l = t.fragments[o];
                        if (!s || !l)
                            break;
                        r(s, l, o)
                    }
            }
            function u(e, t) {
                var r = t.startSN - e.startSN
                  , i = e.fragments
                  , a = t.fragments;
                if (!(r < 0 || r > i.length))
                    for (var n = 0; n < a.length; n++)
                        a[n].start += i[r].start
            }
            t.addGroupId = function(e, t, r) {
                switch (t) {
                case "audio":
                    e.audioGroupIds || (e.audioGroupIds = []),
                    e.audioGroupIds.push(r);
                    break;
                case "text":
                    e.textGroupIds || (e.textGroupIds = []),
                    e.textGroupIds.push(r)
                }
            }
            ,
            t.updatePTS = p,
            t.updateFragPTSDTS = s,
            t.mergeDetails = function(e, r) {
                r.initSegment && e.initSegment && (r.initSegment = e.initSegment);
                var i, a = 0;
                if (l(e, r, function(e, t) {
                    a = e.cc - t.cc,
                    h.isFinite(e.startPTS) && (t.start = t.startPTS = e.startPTS,
                    t.endPTS = e.endPTS,
                    t.duration = e.duration,
                    t.backtracked = e.backtracked,
                    t.dropped = e.dropped,
                    i = t),
                    r.PTSKnown = !0
                }),
                r.PTSKnown) {
                    if (a) {
                        o.logger.log("discontinuity sliding from playlist, take drift into account");
                        for (var t = r.fragments, n = 0; n < t.length; n++)
                            t[n].cc += a
                    }
                    i ? s(r, i, i.startPTS, i.endPTS, i.startDTS, i.endDTS) : u(e, r),
                    r.PTSKnown = e.PTSKnown
                }
            }
            ,
            t.mergeSubtitlePlaylists = function(e, t, r) {
                void 0 === r && (r = 0);
                var i = -1;
                l(e, t, function(e, t, r) {
                    t.start = e.start,
                    i = r
                });
                var a = t.fragments;
                if (i < 0)
                    a.forEach(function(e) {
                        e.start += r
                    });
                else
                    for (var n = i + 1; n < a.length; n++)
                        a[n].start = a[n - 1].start + a[n - 1].duration
            }
            ,
            t.mapFragmentIntersection = l,
            t.adjustSliding = u,
            t.computeReloadInterval = function(e, t, r) {
                var i = 1e3 * (t.averagetargetduration ? t.averagetargetduration : t.targetduration)
                  , a = i / 2;
                return e && t.endSN === e.endSN && (i = a),
                r && (i = Math.max(a, i - (window.performance.now() - r))),
                Math.round(i)
            }
        }
        ).call(this, r(2).Number)
    }
    , function(e, t, r) {
        var i, d, a, n, f;
        i = /^((?:[a-zA-Z0-9+\-.]+:)?)(\/\/[^\/?#]*)?((?:[^\/\?#]*\/)*.*?)??(;.*?)?(\?.*?)?(#.*?)?$/,
        d = /^([^\/?#]*)(.*)$/,
        a = /(?:\/|^)\.(?=\/)/g,
        n = /(?:\/|^)\.\.\/(?!\.\.\/).*?(?=\/)/g,
        f = {
            buildAbsoluteURL: function(e, t, r) {
                if (r = r || {},
                e = e.trim(),
                !(t = t.trim())) {
                    if (!r.alwaysNormalize)
                        return e;
                    var i = f.parseURL(e);
                    if (!i)
                        throw new Error("Error trying to parse base URL.");
                    return i.path = f.normalizePath(i.path),
                    f.buildURLFromParts(i)
                }
                var a = f.parseURL(t);
                if (!a)
                    throw new Error("Error trying to parse relative URL.");
                if (a.scheme)
                    return r.alwaysNormalize ? (a.path = f.normalizePath(a.path),
                    f.buildURLFromParts(a)) : t;
                var n = f.parseURL(e);
                if (!n)
                    throw new Error("Error trying to parse base URL.");
                if (!n.netLoc && n.path && "/" !== n.path[0]) {
                    var o = d.exec(n.path);
                    n.netLoc = o[1],
                    n.path = o[2]
                }
                n.netLoc && !n.path && (n.path = "/");
                var s = {
                    scheme: n.scheme,
                    netLoc: a.netLoc,
                    path: null,
                    params: a.params,
                    query: a.query,
                    fragment: a.fragment
                };
                if (!a.netLoc && (s.netLoc = n.netLoc,
                "/" !== a.path[0]))
                    if (a.path) {
                        var l = n.path
                          , u = l.substring(0, l.lastIndexOf("/") + 1) + a.path;
                        s.path = f.normalizePath(u)
                    } else
                        s.path = n.path,
                        a.params || (s.params = n.params,
                        a.query || (s.query = n.query));
                return null === s.path && (s.path = r.alwaysNormalize ? f.normalizePath(a.path) : a.path),
                f.buildURLFromParts(s)
            },
            parseURL: function(e) {
                var t = i.exec(e);
                return t ? {
                    scheme: t[1] || "",
                    netLoc: t[2] || "",
                    path: t[3] || "",
                    params: t[4] || "",
                    query: t[5] || "",
                    fragment: t[6] || ""
                } : null
            },
            normalizePath: function(e) {
                for (e = e.split("").reverse().join("").replace(a, ""); e.length !== (e = e.replace(n, "")).length; )
                    ;
                return e.split("").reverse().join("")
            },
            buildURLFromParts: function(e) {
                return e.scheme + e.netLoc + e.path + e.params + e.query + e.fragment
            }
        },
        e.exports = f
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.default = {
            search: function(e, t) {
                for (var r = 0, i = e.length - 1, a = null, n = null; r <= i; ) {
                    var o = t(n = e[a = (r + i) / 2 | 0]);
                    if (0 < o)
                        r = a + 1;
                    else {
                        if (!(o < 0))
                            return n;
                        i = a - 1
                    }
                }
                return null
            }
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = (s.isHeader = function(e, t) {
            return t + 10 <= e.length && 73 === e[t] && 68 === e[t + 1] && 51 === e[t + 2] && e[t + 3] < 255 && e[t + 4] < 255 && e[t + 6] < 128 && e[t + 7] < 128 && e[t + 8] < 128 && e[t + 9] < 128
        }
        ,
        s.isFooter = function(e, t) {
            return t + 10 <= e.length && 51 === e[t] && 68 === e[t + 1] && 73 === e[t + 2] && e[t + 3] < 255 && e[t + 4] < 255 && e[t + 6] < 128 && e[t + 7] < 128 && e[t + 8] < 128 && e[t + 9] < 128
        }
        ,
        s.getID3Data = function(e, t) {
            for (var r = t, i = 0; s.isHeader(e, t); )
                i += 10,
                i += s._readSize(e, t + 6),
                s.isFooter(e, t + 10) && (i += 10),
                t += i;
            if (0 < i)
                return e.subarray(r, r + i)
        }
        ,
        s._readSize = function(e, t) {
            var r = 0;
            return r = (127 & e[t]) << 21,
            r |= (127 & e[t + 1]) << 14,
            (r |= (127 & e[t + 2]) << 7) | 127 & e[t + 3]
        }
        ,
        s.getTimeStamp = function(e) {
            for (var t = s.getID3Frames(e), r = 0; r < t.length; r++) {
                var i = t[r];
                if (s.isTimeStampFrame(i))
                    return s._readTimeStamp(i)
            }
        }
        ,
        s.isTimeStampFrame = function(e) {
            return e && "PRIV" === e.key && "com.apple.streaming.transportStreamTimestamp" === e.info
        }
        ,
        s._getFrameData = function(e) {
            var t = String.fromCharCode(e[0], e[1], e[2], e[3])
              , r = s._readSize(e, 4);
            return {
                type: t,
                size: r,
                data: e.subarray(10, 10 + r)
            }
        }
        ,
        s.getID3Frames = function(e) {
            for (var t = 0, r = []; s.isHeader(e, t); ) {
                for (var i = s._readSize(e, t + 6), a = (t += 10) + i; t + 8 < a; ) {
                    var n = s._getFrameData(e.subarray(t))
                      , o = s._decodeFrame(n);
                    o && r.push(o),
                    t += n.size + 10
                }
                s.isFooter(e, t) && (t += 10)
            }
            return r
        }
        ,
        s._decodeFrame = function(e) {
            return "PRIV" === e.type ? s._decodePrivFrame(e) : "T" === e.type[0] ? s._decodeTextFrame(e) : "W" === e.type[0] ? s._decodeURLFrame(e) : void 0
        }
        ,
        s._readTimeStamp = function(e) {
            if (8 === e.data.byteLength) {
                var t = new Uint8Array(e.data)
                  , r = 1 & t[3]
                  , i = (t[4] << 23) + (t[5] << 15) + (t[6] << 7) + t[7];
                return i /= 45,
                r && (i += 47721858.84),
                Math.round(i)
            }
        }
        ,
        s._decodePrivFrame = function(e) {
            if (!(e.size < 2)) {
                var t = s._utf8ArrayToStr(e.data, !0)
                  , r = new Uint8Array(e.data.subarray(t.length + 1));
                return {
                    key: e.type,
                    info: t,
                    data: r.buffer
                }
            }
        }
        ,
        s._decodeTextFrame = function(e) {
            if (!(e.size < 2)) {
                if ("TXXX" === e.type) {
                    var t = 1
                      , r = s._utf8ArrayToStr(e.data.subarray(t));
                    t += r.length + 1;
                    var i = s._utf8ArrayToStr(e.data.subarray(t));
                    return {
                        key: e.type,
                        info: r,
                        data: i
                    }
                }
                var a = s._utf8ArrayToStr(e.data.subarray(1));
                return {
                    key: e.type,
                    data: a
                }
            }
        }
        ,
        s._decodeURLFrame = function(e) {
            if ("WXXX" === e.type) {
                if (e.size < 2)
                    return;
                var t = 1
                  , r = s._utf8ArrayToStr(e.data.subarray(t));
                t += r.length + 1;
                var i = s._utf8ArrayToStr(e.data.subarray(t));
                return {
                    key: e.type,
                    info: r,
                    data: i
                }
            }
            var a = s._utf8ArrayToStr(e.data);
            return {
                key: e.type,
                data: a
            }
        }
        ,
        s._utf8ArrayToStr = function(e, t) {
            void 0 === t && (t = !1);
            for (var r, i, a, n = e.length, o = "", s = 0; s < n; ) {
                if (0 === (r = e[s++]) && t)
                    return o;
                if (0 !== r && 3 !== r)
                    switch (r >> 4) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        o += String.fromCharCode(r);
                        break;
                    case 12:
                    case 13:
                        i = e[s++],
                        o += String.fromCharCode((31 & r) << 6 | 63 & i);
                        break;
                    case 14:
                        i = e[s++],
                        a = e[s++],
                        o += String.fromCharCode((15 & r) << 12 | (63 & i) << 6 | (63 & a) << 0)
                    }
            }
            return o
        }
        ,
        s)
          , a = i._utf8ArrayToStr;
        function s() {}
        t.utf8ArrayToStr = a,
        t.default = i
    }
    , function(e, n, o) {
        "use strict";
        (function(t) {
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var e = o(9)
              , i = o(18)
              , r = (Object.defineProperty(a, "ElementaryStreamTypes", {
                get: function() {
                    return {
                        AUDIO: "audio",
                        VIDEO: "video"
                    }
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(a.prototype, "url", {
                get: function() {
                    return !this._url && this.relurl && (this._url = e.buildAbsoluteURL(this.baseurl, this.relurl, {
                        alwaysNormalize: !0
                    })),
                    this._url
                },
                set: function(e) {
                    this._url = e
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(a.prototype, "byteRange", {
                get: function() {
                    if (!this._byteRange && !this.rawByteRange)
                        return [];
                    if (this._byteRange)
                        return this._byteRange;
                    var e = [];
                    if (this.rawByteRange) {
                        var t = this.rawByteRange.split("@", 2);
                        if (1 === t.length) {
                            var r = this.lastByteRangeEndOffset;
                            e[0] = r || 0
                        } else
                            e[0] = parseInt(t[1]);
                        e[1] = parseInt(t[0]) + e[0],
                        this._byteRange = e
                    }
                    return e
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(a.prototype, "byteRangeStartOffset", {
                get: function() {
                    return this.byteRange[0]
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(a.prototype, "byteRangeEndOffset", {
                get: function() {
                    return this.byteRange[1]
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(a.prototype, "decryptdata", {
                get: function() {
                    return this._decryptdata || (this._decryptdata = this.fragmentDecryptdataFromLevelkey(this.levelkey, this.sn)),
                    this._decryptdata
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(a.prototype, "endProgramDateTime", {
                get: function() {
                    if (!t.isFinite(this.programDateTime))
                        return null;
                    var e = t.isFinite(this.duration) ? this.duration : 0;
                    return this.programDateTime + 1e3 * e
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(a.prototype, "encrypted", {
                get: function() {
                    return !(!this.decryptdata || null === this.decryptdata.uri || null !== this.decryptdata.key)
                },
                enumerable: !0,
                configurable: !0
            }),
            a.prototype.addElementaryStream = function(e) {
                this._elementaryStreams[e] = !0
            }
            ,
            a.prototype.hasElementaryStream = function(e) {
                return !0 === this._elementaryStreams[e]
            }
            ,
            a.prototype.createInitializationVector = function(e) {
                for (var t = new Uint8Array(16), r = 12; r < 16; r++)
                    t[r] = e >> 8 * (15 - r) & 255;
                return t
            }
            ,
            a.prototype.fragmentDecryptdataFromLevelkey = function(e, t) {
                var r = e;
                return e && e.method && e.uri && !e.iv && ((r = new i.default).method = e.method,
                r.baseuri = e.baseuri,
                r.reluri = e.reluri,
                r.iv = this.createInitializationVector(t)),
                r
            }
            ,
            a);
            function a() {
                var e;
                this._url = null,
                this._byteRange = null,
                this._decryptdata = null,
                this.tagList = [],
                this.programDateTime = null,
                this.rawProgramDateTime = null,
                this._elementaryStreams = ((e = {})[a.ElementaryStreamTypes.AUDIO] = !1,
                e[a.ElementaryStreamTypes.VIDEO] = !1,
                e)
            }
            n.default = r
        }
        ).call(this, o(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var s = r(39)
          , l = r(40)
          , u = r(41)
          , n = r(3)
          , d = r(0)
          , o = r(1)
          , f = r(6).getSelfScope()
          , i = (a.prototype.isSync = function() {
            return this.disableWebCrypto && this.config.enableSoftwareAES
        }
        ,
        a.prototype.decrypt = function(t, r, i, a) {
            var n = this;
            if (this.disableWebCrypto && this.config.enableSoftwareAES) {
                this.logEnabled && (d.logger.log("JS AES decrypt"),
                this.logEnabled = !1);
                var e = this.decryptor;
                e || (this.decryptor = e = new u.default),
                e.expandKey(r),
                a(e.decrypt(t, 0, i, this.removePKCS7Padding))
            } else {
                this.logEnabled && (d.logger.log("WebCrypto AES decrypt"),
                this.logEnabled = !1);
                var o = this.subtle;
                this.key !== r && (this.key = r,
                this.fastAesKey = new l.default(o,r)),
                this.fastAesKey.expandKey().then(function(e) {
                    new s.default(o,i).decrypt(t, e).catch(function(e) {
                        n.onWebCryptoError(e, t, r, i, a)
                    }).then(function(e) {
                        a(e)
                    })
                }).catch(function(e) {
                    n.onWebCryptoError(e, t, r, i, a)
                })
            }
        }
        ,
        a.prototype.onWebCryptoError = function(e, t, r, i, a) {
            this.config.enableSoftwareAES ? (d.logger.log("WebCrypto Error, disable WebCrypto API"),
            this.disableWebCrypto = !0,
            this.logEnabled = !0,
            this.decrypt(t, r, i, a)) : (d.logger.error("decrypting error : " + e.message),
            this.observer.trigger(o.default.ERROR, {
                type: n.ErrorTypes.MEDIA_ERROR,
                details: n.ErrorDetails.FRAG_DECRYPT_ERROR,
                fatal: !0,
                reason: e.message
            }))
        }
        ,
        a.prototype.destroy = function() {
            var e = this.decryptor;
            e && (e.destroy(),
            this.decryptor = void 0)
        }
        ,
        a);
        function a(e, t, r) {
            var i = (void 0 === r ? {} : r).removePKCS7Padding
              , a = void 0 === i || i;
            if (this.logEnabled = !0,
            this.observer = e,
            this.config = t,
            this.removePKCS7Padding = a)
                try {
                    var n = f.crypto;
                    n && (this.subtle = n.subtle || n.webkitSubtle)
                } catch (e) {}
            this.disableWebCrypto = !this.subtle
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.getMediaSource = function() {
            if ("undefined" != typeof window)
                return window.MediaSource || window.WebKitMediaSource
        }
    }
    , function(e, h, s) {
        "use strict";
        (function(d) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(h, "__esModule", {
                value: !0
            });
            var t = s(28)
              , n = s(7)
              , f = s(5)
              , c = s(0);
            h.State = {
                STOPPED: "STOPPED",
                STARTING: "STARTING",
                IDLE: "IDLE",
                PAUSED: "PAUSED",
                KEY_LOADING: "KEY_LOADING",
                FRAG_LOADING: "FRAG_LOADING",
                FRAG_LOADING_WAITING_RETRY: "FRAG_LOADING_WAITING_RETRY",
                WAITING_TRACK: "WAITING_TRACK",
                PARSING: "PARSING",
                PARSED: "PARSED",
                BUFFER_FLUSHING: "BUFFER_FLUSHING",
                ENDED: "ENDED",
                ERROR: "ERROR",
                WAITING_INIT_PTS: "WAITING_INIT_PTS",
                WAITING_LEVEL: "WAITING_LEVEL"
            };
            var r, a = (r = t.default,
            e(o, r),
            o.prototype.doTick = function() {}
            ,
            o.prototype.startLoad = function() {}
            ,
            o.prototype.stopLoad = function() {
                var e = this.fragCurrent;
                e && (e.loader && e.loader.abort(),
                this.fragmentTracker.removeFragment(e)),
                this.demuxer && (this.demuxer.destroy(),
                this.demuxer = null),
                this.fragCurrent = null,
                this.fragPrevious = null,
                this.clearInterval(),
                this.clearNextTick(),
                this.state = h.State.STOPPED
            }
            ,
            o.prototype._streamEnded = function(e, t) {
                var r = this.fragCurrent
                  , i = this.fragmentTracker;
                if (t.live || !r || r.backtracked || r.sn !== t.endSN || e.nextStart)
                    return !1;
                var a = i.getState(r);
                return a === n.FragmentState.PARTIAL || a === n.FragmentState.OK
            }
            ,
            o.prototype.onMediaSeeking = function() {
                var e = this.config
                  , t = this.media
                  , r = this.mediaBuffer
                  , i = this.state
                  , a = t ? t.currentTime : null
                  , n = f.BufferHelper.bufferInfo(r || t, a, this.config.maxBufferHole);
                if (d.isFinite(a) && c.logger.log("media seeking to " + a.toFixed(3)),
                i === h.State.FRAG_LOADING) {
                    var o = this.fragCurrent;
                    if (0 === n.len && o) {
                        var s = e.maxFragLookUpTolerance
                          , l = o.start - s
                          , u = o.start + o.duration + s;
                        a < l || u < a ? (o.loader && (c.logger.log("seeking outside of buffer while fragment load in progress, cancel fragment load"),
                        o.loader.abort()),
                        this.fragCurrent = null,
                        this.fragPrevious = null,
                        this.state = h.State.IDLE) : c.logger.log("seeking outside of buffer but within currently loaded fragment range")
                    }
                } else
                    i === h.State.ENDED && (0 === n.len && (this.fragPrevious = null,
                    this.fragCurrent = null),
                    this.state = h.State.IDLE);
                t && (this.lastCurrentTime = a),
                this.loadedmetadata || (this.nextLoadPosition = this.startPosition = a),
                this.tick()
            }
            ,
            o.prototype.onMediaEnded = function() {
                this.startPosition = this.lastCurrentTime = 0
            }
            ,
            o.prototype.onHandlerDestroying = function() {
                this.stopLoad(),
                r.prototype.onHandlerDestroying.call(this)
            }
            ,
            o.prototype.onHandlerDestroyed = function() {
                this.state = h.State.STOPPED,
                this.fragmentTracker = null
            }
            ,
            o);
            function o() {
                return null !== r && r.apply(this, arguments) || this
            }
            h.default = a
        }
        ).call(this, s(2).Number)
    }
    , function(e, s, u) {
        "use strict";
        (function(g) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(s, "__esModule", {
                value: !0
            });
            var r, v = u(1), t = u(4), l = u(3), c = u(0), n = u(17), y = u(32), m = window.performance, E = {
                MANIFEST: "manifest",
                LEVEL: "level",
                AUDIO_TRACK: "audioTrack",
                SUBTITLE_TRACK: "subtitleTrack"
            }, a = {
                MAIN: "main",
                AUDIO: "audio",
                SUBTITLE: "subtitle"
            }, o = (r = t.default,
            e(_, r),
            Object.defineProperty(_, "ContextType", {
                get: function() {
                    return E
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(_, "LevelType", {
                get: function() {
                    return a
                },
                enumerable: !0,
                configurable: !0
            }),
            _.canHaveQualityLevels = function(e) {
                return e !== E.AUDIO_TRACK && e !== E.SUBTITLE_TRACK
            }
            ,
            _.mapContextToLevelType = function(e) {
                switch (e.type) {
                case E.AUDIO_TRACK:
                    return a.AUDIO;
                case E.SUBTITLE_TRACK:
                    return a.SUBTITLE;
                default:
                    return a.MAIN
                }
            }
            ,
            _.getResponseUrl = function(e, t) {
                var r = e.url;
                return void 0 !== r && 0 !== r.indexOf("data:") || (r = t.url),
                r
            }
            ,
            _.prototype.createInternalLoader = function(e) {
                var t = this.hls.config
                  , r = t.pLoader
                  , i = t.loader
                  , a = new (r || i)(t);
                return e.loader = a,
                this.loaders[e.type] = a
            }
            ,
            _.prototype.getInternalLoader = function(e) {
                return this.loaders[e.type]
            }
            ,
            _.prototype.resetInternalLoader = function(e) {
                this.loaders[e] && delete this.loaders[e]
            }
            ,
            _.prototype.destroyInternalLoaders = function() {
                for (var e in this.loaders) {
                    var t = this.loaders[e];
                    t && t.destroy(),
                    this.resetInternalLoader(e)
                }
            }
            ,
            _.prototype.destroy = function() {
                this.destroyInternalLoaders(),
                r.prototype.destroy.call(this)
            }
            ,
            _.prototype.onManifestLoading = function(e) {
                this.load(e.url, {
                    type: E.MANIFEST,
                    level: 0,
                    id: null
                })
            }
            ,
            _.prototype.onLevelLoading = function(e) {
                this.load(e.url, {
                    type: E.LEVEL,
                    level: e.level,
                    id: e.id
                })
            }
            ,
            _.prototype.onAudioTrackLoading = function(e) {
                this.load(e.url, {
                    type: E.AUDIO_TRACK,
                    level: null,
                    id: e.id
                })
            }
            ,
            _.prototype.onSubtitleTrackLoading = function(e) {
                this.load(e.url, {
                    type: E.SUBTITLE_TRACK,
                    level: null,
                    id: e.id
                })
            }
            ,
            _.prototype.load = function(e, t) {
                var r = this.hls.config;
                c.logger.debug("Loading playlist of type " + t.type + ", level: " + t.level + ", id: " + t.id);
                var i, a, n, o, s = this.getInternalLoader(t);
                if (s) {
                    var l = s.context;
                    if (l && l.url === e)
                        return c.logger.trace("playlist request ongoing"),
                        !1;
                    c.logger.warn("aborting previous loader for type: " + t.type),
                    s.abort()
                }
                switch (t.type) {
                case E.MANIFEST:
                    i = r.manifestLoadingMaxRetry,
                    a = r.manifestLoadingTimeOut,
                    n = r.manifestLoadingRetryDelay,
                    o = r.manifestLoadingMaxRetryTimeout;
                    break;
                case E.LEVEL:
                    i = 0,
                    a = r.levelLoadingTimeOut;
                    break;
                default:
                    i = r.levelLoadingMaxRetry,
                    a = r.levelLoadingTimeOut,
                    n = r.levelLoadingRetryDelay,
                    o = r.levelLoadingMaxRetryTimeout
                }
                s = this.createInternalLoader(t),
                t.url = e,
                t.responseType = t.responseType || "";
                var u = {
                    timeout: a,
                    maxRetry: i,
                    retryDelay: n,
                    maxRetryDelay: o
                }
                  , d = {
                    onSuccess: this.loadsuccess.bind(this),
                    onError: this.loaderror.bind(this),
                    onTimeout: this.loadtimeout.bind(this)
                };
                return c.logger.debug("Calling internal loader delegate for URL: " + e),
                s.load(t, u, d),
                !0
            }
            ,
            _.prototype.loadsuccess = function(e, t, r, i) {
                if (void 0 === i && (i = null),
                r.isSidxRequest)
                    return this._handleSidxRequest(e, r),
                    void this._handlePlaylistLoaded(e, t, r, i);
                this.resetInternalLoader(r.type);
                var a = e.data;
                t.tload = m.now(),
                0 === a.indexOf("#EXTM3U") ? 0 < a.indexOf("#EXTINF:") || 0 < a.indexOf("#EXT-X-TARGETDURATION:") ? this._handleTrackOrLevelPlaylist(e, t, r, i) : this._handleMasterPlaylist(e, t, r, i) : this._handleManifestParsingError(e, r, "no EXTM3U delimiter", i)
            }
            ,
            _.prototype.loaderror = function(e, t, r) {
                void 0 === r && (r = null),
                this._handleNetworkError(t, r, !1, e)
            }
            ,
            _.prototype.loadtimeout = function(e, t, r) {
                void 0 === r && (r = null),
                this._handleNetworkError(t, r, !0)
            }
            ,
            _.prototype._handleMasterPlaylist = function(e, t, r, i) {
                var a = this.hls
                  , n = e.data
                  , o = _.getResponseUrl(e, r)
                  , s = y.default.parseMasterPlaylist(n, o);
                if (s.length) {
                    var l = s.map(function(e) {
                        return {
                            id: e.attrs.AUDIO,
                            codec: e.audioCodec
                        }
                    })
                      , u = y.default.parseMasterPlaylistMedia(n, o, "AUDIO", l)
                      , d = y.default.parseMasterPlaylistMedia(n, o, "SUBTITLES");
                    if (u.length) {
                        var f = !1;
                        u.forEach(function(e) {
                            e.url || (f = !0)
                        }),
                        !1 === f && s[0].audioCodec && !s[0].attrs.AUDIO && (c.logger.log("audio codec signaled in quality level, but no embedded audio track signaled, create one"),
                        u.unshift({
                            type: "main",
                            name: "main"
                        }))
                    }
                    a.trigger(v.default.MANIFEST_LOADED, {
                        levels: s,
                        audioTracks: u,
                        subtitles: d,
                        url: o,
                        stats: t,
                        networkDetails: i
                    })
                } else
                    this._handleManifestParsingError(e, r, "no level found in manifest", i)
            }
            ,
            _.prototype._handleTrackOrLevelPlaylist = function(e, t, r, i) {
                var a = this.hls
                  , n = r.id
                  , o = r.level
                  , s = r.type
                  , l = _.getResponseUrl(e, r)
                  , u = g.isFinite(n) ? n : 0
                  , d = g.isFinite(o) ? o : u
                  , f = _.mapContextToLevelType(r)
                  , c = y.default.parseLevelPlaylist(e.data, l, d, f, u);
                if (c.tload = t.tload,
                s === E.MANIFEST) {
                    var h = {
                        url: l,
                        details: c
                    };
                    a.trigger(v.default.MANIFEST_LOADED, {
                        levels: [h],
                        audioTracks: [],
                        url: l,
                        stats: t,
                        networkDetails: i
                    })
                }
                if (t.tparsed = m.now(),
                c.needSidxRanges) {
                    var p = c.initSegment.url;
                    this.load(p, {
                        isSidxRequest: !0,
                        type: s,
                        level: o,
                        levelDetails: c,
                        id: n,
                        rangeStart: 0,
                        rangeEnd: 2048,
                        responseType: "arraybuffer"
                    })
                } else
                    r.levelDetails = c,
                    this._handlePlaylistLoaded(e, t, r, i)
            }
            ,
            _.prototype._handleSidxRequest = function(e, t) {
                var r = n.default.parseSegmentIndex(new Uint8Array(e.data));
                if (r) {
                    var i = r.references
                      , a = t.levelDetails;
                    i.forEach(function(e, t) {
                        var r = e.info
                          , i = a.fragments[t];
                        0 === i.byteRange.length && (i.rawByteRange = String(1 + r.end - r.start) + "@" + String(r.start))
                    }),
                    a.initSegment.rawByteRange = String(r.moovEndOffset) + "@0"
                }
            }
            ,
            _.prototype._handleManifestParsingError = function(e, t, r, i) {
                this.hls.trigger(v.default.ERROR, {
                    type: l.ErrorTypes.NETWORK_ERROR,
                    details: l.ErrorDetails.MANIFEST_PARSING_ERROR,
                    fatal: !0,
                    url: e.url,
                    reason: r,
                    networkDetails: i
                })
            }
            ,
            _.prototype._handleNetworkError = function(e, t, r, i) {
                var a, n;
                void 0 === r && (r = !1),
                void 0 === i && (i = null),
                c.logger.info("A network error occured while loading a " + e.type + "-type playlist");
                var o = this.getInternalLoader(e);
                switch (e.type) {
                case E.MANIFEST:
                    a = r ? l.ErrorDetails.MANIFEST_LOAD_TIMEOUT : l.ErrorDetails.MANIFEST_LOAD_ERROR,
                    n = !0;
                    break;
                case E.LEVEL:
                    a = r ? l.ErrorDetails.LEVEL_LOAD_TIMEOUT : l.ErrorDetails.LEVEL_LOAD_ERROR,
                    n = !1;
                    break;
                case E.AUDIO_TRACK:
                    a = r ? l.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT : l.ErrorDetails.AUDIO_TRACK_LOAD_ERROR,
                    n = !1;
                    break;
                default:
                    n = !1
                }
                o && (o.abort(),
                this.resetInternalLoader(e.type));
                var s = {
                    type: l.ErrorTypes.NETWORK_ERROR,
                    details: a,
                    fatal: n,
                    url: o.url,
                    loader: o,
                    context: e,
                    networkDetails: t
                };
                i && (s.response = i),
                this.hls.trigger(v.default.ERROR, s)
            }
            ,
            _.prototype._handlePlaylistLoaded = function(e, t, r, i) {
                var a = r.type
                  , n = r.level
                  , o = r.id
                  , s = r.levelDetails;
                if (s.targetduration)
                    if (_.canHaveQualityLevels(r.type))
                        this.hls.trigger(v.default.LEVEL_LOADED, {
                            details: s,
                            level: n || 0,
                            id: o || 0,
                            stats: t,
                            networkDetails: i
                        });
                    else
                        switch (a) {
                        case E.AUDIO_TRACK:
                            this.hls.trigger(v.default.AUDIO_TRACK_LOADED, {
                                details: s,
                                id: o,
                                stats: t,
                                networkDetails: i
                            });
                            break;
                        case E.SUBTITLE_TRACK:
                            this.hls.trigger(v.default.SUBTITLE_TRACK_LOADED, {
                                details: s,
                                id: o,
                                stats: t,
                                networkDetails: i
                            })
                        }
                else
                    this._handleManifestParsingError(e, r, "invalid target duration", i)
            }
            ,
            _);
            function _(e) {
                var t = r.call(this, e, v.default.MANIFEST_LOADING, v.default.LEVEL_LOADING, v.default.AUDIO_TRACK_LOADING, v.default.SUBTITLE_TRACK_LOADING) || this;
                return t.loaders = {},
                t
            }
            s.default = o
        }
        ).call(this, u(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var c = r(0)
          , l = r(1)
          , s = Math.pow(2, 32) - 1
          , i = (g.prototype.resetTimeStamp = function(e) {
            this.initPTS = e
        }
        ,
        g.prototype.resetInitSegment = function(e, t, r, i) {
            if (e && e.byteLength) {
                var a = this.initData = g.parseInitSegment(e);
                null == t && (t = "mp4a.40.5"),
                null == r && (r = "avc1.42e01e");
                var n = {};
                a.audio && a.video ? n.audiovideo = {
                    container: "video/mp4",
                    codec: t + "," + r,
                    initSegment: i ? e : null
                } : (a.audio && (n.audio = {
                    container: "audio/mp4",
                    codec: t,
                    initSegment: i ? e : null
                }),
                a.video && (n.video = {
                    container: "video/mp4",
                    codec: r,
                    initSegment: i ? e : null
                })),
                this.observer.trigger(l.default.FRAG_PARSING_INIT_SEGMENT, {
                    tracks: n
                })
            } else
                t && (this.audioCodec = t),
                r && (this.videoCodec = r)
        }
        ,
        g.probe = function(e) {
            return 0 < g.findBox({
                data: e,
                start: 0,
                end: Math.min(e.length, 16384)
            }, ["moof"]).length
        }
        ,
        g.bin2str = function(e) {
            return String.fromCharCode.apply(null, e)
        }
        ,
        g.readUint16 = function(e, t) {
            e.data && (t += e.start,
            e = e.data);
            var r = e[t] << 8 | e[t + 1];
            return r < 0 ? 65536 + r : r
        }
        ,
        g.readUint32 = function(e, t) {
            e.data && (t += e.start,
            e = e.data);
            var r = e[t] << 24 | e[t + 1] << 16 | e[t + 2] << 8 | e[t + 3];
            return r < 0 ? 4294967296 + r : r
        }
        ,
        g.writeUint32 = function(e, t, r) {
            e.data && (t += e.start,
            e = e.data),
            e[t] = r >> 24,
            e[t + 1] = r >> 16 & 255,
            e[t + 2] = r >> 8 & 255,
            e[t + 3] = 255 & r
        }
        ,
        g.findBox = function(e, t) {
            var r, i, a, n, o, s, l = [];
            if (e.data ? (o = e.start,
            a = e.end,
            e = e.data) : (o = 0,
            a = e.byteLength),
            !t.length)
                return null;
            for (r = o; r < a; )
                s = 1 < (i = g.readUint32(e, r)) ? r + i : a,
                g.bin2str(e.subarray(r + 4, r + 8)) === t[0] && (1 === t.length ? l.push({
                    data: e,
                    start: r + 8,
                    end: s
                }) : (n = g.findBox({
                    data: e,
                    start: r + 8,
                    end: s
                }, t.slice(1))).length && (l = l.concat(n))),
                r = s;
            return l
        }
        ,
        g.parseSegmentIndex = function(e) {
            var t, r = g.findBox(e, ["moov"])[0], i = r ? r.end : null, a = 0, n = g.findBox(e, ["sidx"]);
            if (!n || !n[0])
                return null;
            t = [];
            var o = (n = n[0]).data[0]
              , s = g.readUint32(n, a = 0 === o ? 8 : 16);
            a += 4,
            a += 0 === o ? 8 : 16,
            a += 2;
            var l = n.end + 0
              , u = g.readUint16(n, a);
            a += 2;
            for (var d = 0; d < u; d++) {
                var f = a
                  , c = g.readUint32(n, f);
                f += 4;
                var h = 2147483647 & c;
                if (1 == (2147483648 & c) >>> 31)
                    return void console.warn("SIDX has hierarchical references (not supported)");
                var p = g.readUint32(n, f);
                f += 4,
                t.push({
                    referenceSize: h,
                    subsegmentDuration: p,
                    info: {
                        duration: p / s,
                        start: l,
                        end: l + h - 1
                    }
                }),
                l += h,
                a = f += 4
            }
            return {
                earliestPresentationTime: 0,
                timescale: s,
                version: o,
                referencesCount: u,
                references: t,
                moovEndOffset: i
            }
        }
        ,
        g.parseInitSegment = function(e) {
            var f = [];
            return g.findBox(e, ["moov", "trak"]).forEach(function(e) {
                var t = g.findBox(e, ["tkhd"])[0];
                if (t) {
                    var r = t.data[t.start]
                      , i = 0 === r ? 12 : 20
                      , a = g.readUint32(t, i)
                      , n = g.findBox(e, ["mdia", "mdhd"])[0];
                    if (n) {
                        i = 0 === (r = n.data[n.start]) ? 12 : 20;
                        var o = g.readUint32(n, i)
                          , s = g.findBox(e, ["mdia", "hdlr"])[0];
                        if (s) {
                            var l = {
                                soun: "audio",
                                vide: "video"
                            }[g.bin2str(s.data.subarray(s.start + 8, s.start + 12))];
                            if (l) {
                                var u = g.findBox(e, ["mdia", "minf", "stbl", "stsd"]);
                                if (u.length) {
                                    u = u[0];
                                    var d = g.bin2str(u.data.subarray(u.start + 12, u.start + 16));
                                    c.logger.log("MP4Demuxer:" + l + ":" + d + " found")
                                }
                                f[a] = {
                                    timescale: o,
                                    type: l
                                },
                                f[l] = {
                                    timescale: o,
                                    id: a
                                }
                            }
                        }
                    }
                }
            }),
            f
        }
        ,
        g.getStartDTS = function(a, e) {
            var t, r, i;
            return t = g.findBox(e, ["moof", "traf"]),
            r = [].concat.apply([], t.map(function(i) {
                return g.findBox(i, ["tfhd"]).map(function(e) {
                    var t, r;
                    return t = g.readUint32(e, 4),
                    r = a[t].timescale || 9e4,
                    g.findBox(i, ["tfdt"]).map(function(e) {
                        var t, r;
                        return t = e.data[e.start],
                        r = g.readUint32(e, 4),
                        1 === t && (r *= Math.pow(2, 32),
                        r += g.readUint32(e, 8)),
                        r
                    })[0] / r
                })
            })),
            i = Math.min.apply(null, r),
            isFinite(i) ? i : 0
        }
        ,
        g.offsetStartDTS = function(i, e, o) {
            g.findBox(e, ["moof", "traf"]).map(function(r) {
                return g.findBox(r, ["tfhd"]).map(function(e) {
                    var t = g.readUint32(e, 4)
                      , n = i[t].timescale || 9e4;
                    g.findBox(r, ["tfdt"]).map(function(e) {
                        var t = e.data[e.start]
                          , r = g.readUint32(e, 4);
                        if (0 === t)
                            g.writeUint32(e, 4, r - o * n);
                        else {
                            r *= Math.pow(2, 32),
                            r += g.readUint32(e, 8),
                            r -= o * n,
                            r = Math.max(r, 0);
                            var i = Math.floor(r / (1 + s))
                              , a = Math.floor(r % (1 + s));
                            g.writeUint32(e, 4, i),
                            g.writeUint32(e, 8, a)
                        }
                    })
                })
            })
        }
        ,
        g.prototype.append = function(e, t, r, i) {
            var a = this.initData;
            a || (this.resetInitSegment(e, this.audioCodec, this.videoCodec, !1),
            a = this.initData);
            var n, o = this.initPTS;
            if (void 0 === o) {
                var s = g.getStartDTS(a, e);
                this.initPTS = o = s - t,
                this.observer.trigger(l.default.INIT_PTS_FOUND, {
                    initPTS: o
                })
            }
            g.offsetStartDTS(a, e, o),
            n = g.getStartDTS(a, e),
            this.remuxer.remux(a.audio, a.video, null, null, n, r, i, e)
        }
        ,
        g.prototype.destroy = function() {}
        ,
        g);
        function g(e, t) {
            this.observer = e,
            this.remuxer = t
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = r(9)
          , a = (Object.defineProperty(n.prototype, "uri", {
            get: function() {
                return !this._uri && this.reluri && (this._uri = i.buildAbsoluteURL(this.baseuri, this.reluri, {
                    alwaysNormalize: !0
                })),
                this._uri
            },
            enumerable: !0,
            configurable: !0
        }),
        n);
        function n() {
            this.method = null,
            this.key = null,
            this.iv = null,
            this._uri = null
        }
        t.default = a
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = {
            audio: {
                a3ds: !0,
                "ac-3": !0,
                "ac-4": !0,
                alac: !0,
                alaw: !0,
                dra1: !0,
                "dts+": !0,
                "dts-": !0,
                dtsc: !0,
                dtse: !0,
                dtsh: !0,
                "ec-3": !0,
                enca: !0,
                g719: !0,
                g726: !0,
                m4ae: !0,
                mha1: !0,
                mha2: !0,
                mhm1: !0,
                mhm2: !0,
                mlpa: !0,
                mp4a: !0,
                "raw ": !0,
                Opus: !0,
                samr: !0,
                sawb: !0,
                sawp: !0,
                sevc: !0,
                sqcp: !0,
                ssmv: !0,
                twos: !0,
                ulaw: !0
            },
            video: {
                avc1: !0,
                avc2: !0,
                avc3: !0,
                avc4: !0,
                avcp: !0,
                drac: !0,
                dvav: !0,
                dvhe: !0,
                encv: !0,
                hev1: !0,
                hvc1: !0,
                mjp2: !0,
                mp4v: !0,
                mvc1: !0,
                mvc2: !0,
                mvc3: !0,
                mvc4: !0,
                resv: !0,
                rv60: !0,
                s263: !0,
                svc1: !0,
                svc2: !0,
                "vc-1": !0,
                vp08: !0,
                vp09: !0
            }
        };
        t.isCodecType = function(e, t) {
            var r = i[t];
            return !!r && !0 === r[e.slice(0, 4)]
        }
        ,
        t.isCodecSupportedInMp4 = function(e, t) {
            return window.MediaSource.isTypeSupported((t || "video") + '/mp4;codecs="' + e + '"')
        }
    }
    , function(e, a, n) {
        "use strict";
        (function(y) {
            Object.defineProperty(a, "__esModule", {
                value: !0
            });
            var u = n(38)
              , d = n(1)
              , f = n(21)
              , m = n(0)
              , c = n(3)
              , e = n(14)
              , t = n(6)
              , h = n(24)
              , p = t.getSelfScope()
              , g = e.getMediaSource()
              , r = (i.prototype.destroy = function() {
                var e = this.w;
                if (e)
                    e.removeEventListener("message", this.onwmsg),
                    e.terminate(),
                    this.w = null;
                else {
                    var t = this.demuxer;
                    t && (t.destroy(),
                    this.demuxer = null)
                }
                var r = this.observer;
                r && (r.removeAllListeners(),
                this.observer = null)
            }
            ,
            i.prototype.push = function(e, t, r, i, a, n, o, s) {
                var l = this.w
                  , u = y.isFinite(a.startPTS) ? a.startPTS : a.start
                  , d = a.decryptdata
                  , f = this.frag
                  , c = !(f && a.cc === f.cc)
                  , h = !(f && a.level === f.level)
                  , p = f && a.sn === f.sn + 1
                  , g = !h && p;
                if (c && m.logger.log(this.id + ":discontinuity detected"),
                h && m.logger.log(this.id + ":switch detected"),
                this.frag = a,
                l)
                    l.postMessage({
                        cmd: "demux",
                        data: e,
                        decryptdata: d,
                        initSegment: t,
                        audioCodec: r,
                        videoCodec: i,
                        timeOffset: u,
                        discontinuity: c,
                        trackSwitch: h,
                        contiguous: g,
                        duration: n,
                        accurateTimeOffset: o,
                        defaultInitPTS: s
                    }, e instanceof ArrayBuffer ? [e] : []);
                else {
                    var v = this.demuxer;
                    v && v.push(e, d, t, r, i, u, c, h, g, n, o, s)
                }
            }
            ,
            i.prototype.onWorkerMessage = function(e) {
                var t = e.data
                  , r = this.hls;
                switch (t.event) {
                case "init":
                    p.URL.revokeObjectURL(this.w.objectURL);
                    break;
                case d.default.FRAG_PARSING_DATA:
                    t.data.data1 = new Uint8Array(t.data1),
                    t.data2 && (t.data.data2 = new Uint8Array(t.data2));
                default:
                    t.data = t.data || {},
                    t.data.frag = this.frag,
                    t.data.id = this.id,
                    r.trigger(t.event, t.data)
                }
            }
            ,
            i);
            function i(r, e) {
                var i = this;
                this.hls = r,
                this.id = e;
                function t(e, t) {
                    (t = t || {}).frag = i.frag,
                    t.id = i.id,
                    r.trigger(e, t)
                }
                var a = this.observer = new h.Observer
                  , n = r.config;
                a.on(d.default.FRAG_DECRYPTED, t),
                a.on(d.default.FRAG_PARSING_INIT_SEGMENT, t),
                a.on(d.default.FRAG_PARSING_DATA, t),
                a.on(d.default.FRAG_PARSED, t),
                a.on(d.default.ERROR, t),
                a.on(d.default.FRAG_PARSING_METADATA, t),
                a.on(d.default.FRAG_PARSING_USERDATA, t),
                a.on(d.default.INIT_PTS_FOUND, t);
                var o = {
                    mp4: g.isTypeSupported("video/mp4"),
                    mpeg: g.isTypeSupported("audio/mpeg"),
                    mp3: g.isTypeSupported('audio/mp4; codecs="mp3"')
                }
                  , s = navigator.vendor;
                if (n.enableWorker && "undefined" != typeof Worker) {
                    m.logger.log("demuxing in webworker");
                    var l = void 0;
                    try {
                        l = this.w = u(52),
                        this.onwmsg = this.onWorkerMessage.bind(this),
                        l.addEventListener("message", this.onwmsg),
                        l.onerror = function(e) {
                            r.trigger(d.default.ERROR, {
                                type: c.ErrorTypes.OTHER_ERROR,
                                details: c.ErrorDetails.INTERNAL_EXCEPTION,
                                fatal: !0,
                                event: "demuxerWorker",
                                err: {
                                    message: e.message + " (" + e.filename + ":" + e.lineno + ")"
                                }
                            })
                        }
                        ,
                        l.postMessage({
                            cmd: "init",
                            typeSupported: o,
                            vendor: s,
                            id: e,
                            config: JSON.stringify(n),
                            module: Module
                        })
                    } catch (r) {
                        l && p.URL.revokeObjectURL(l.objectURL),
                        this.demuxer = new f.default(a,o,n,s),
                        this.w = void 0
                    }
                } else
                    this.demuxer = new f.default(a,o,n,s)
            }
            a.default = r
        }
        ).call(this, n(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var g, b = r(1), A = r(3), v = r(13), R = r(42), D = r(17), L = r(43), O = r(46), w = r(47), I = r(50), i = r(6), a = r(0), n = i.getSelfScope();
        try {
            g = n.performance.now.bind(n.performance)
        } catch (e) {
            a.logger.debug("Unable to use Performance API on this environment"),
            g = n.Date.now
        }
        var o = (s.prototype.destroy = function() {
            var e = this.demuxer;
            e && e.destroy()
        }
        ,
        s.prototype.push = function(e, r, i, a, n, o, s, l, u, d, f, c) {
            var h = this;
            if (0 < e.byteLength && null != r && null != r.key && "AES-128" === r.method) {
                var t = this.decrypter;
                null == t && (t = this.decrypter = new v.default(this.observer,this.config));
                var p = g();
                t.decrypt(e, r.key.buffer, r.iv.buffer, function(e) {
                    var t = g();
                    h.observer.trigger(b.default.FRAG_DECRYPTED, {
                        stats: {
                            tstart: p,
                            tdecrypt: t
                        }
                    }),
                    h.pushDecrypted(new Uint8Array(e), r, new Uint8Array(i), a, n, o, s, l, u, d, f, c)
                })
            } else
                this.pushDecrypted(new Uint8Array(e), r, new Uint8Array(i), a, n, o, s, l, u, d, f, c)
        }
        ,
        s.prototype.pushDecrypted = function(e, t, r, i, a, n, o, s, l, u, d, f) {
            var c = this.demuxer;
            if (!c || (o || s) && !this.probe(e)) {
                for (var h = this.observer, p = this.typeSupported, g = this.config, v = [{
                    demux: L.default,
                    remux: w.default
                }, {
                    demux: D.default,
                    remux: I.default
                }, {
                    demux: R.default,
                    remux: w.default
                }, {
                    demux: O.default,
                    remux: w.default
                }], y = 0, m = v.length; y < m; y++) {
                    var E = v[y]
                      , _ = E.demux.probe;
                    if (_(e)) {
                        var S = this.remuxer = new E.remux(h,g,p,this.vendor);
                        c = new E.demux(h,S,g,p),
                        this.probe = _;
                        break
                    }
                }
                if (!c)
                    return void h.trigger(b.default.ERROR, {
                        type: A.ErrorTypes.MEDIA_ERROR,
                        details: A.ErrorDetails.FRAG_PARSING_ERROR,
                        fatal: !0,
                        reason: "no demux matching with content found"
                    });
                this.demuxer = c
            }
            var T = this.remuxer;
            (o || s) && (c.resetInitSegment(r, i, a, u),
            T.resetInitSegment()),
            o && (c.resetTimeStamp(f),
            T.resetTimeStamp(f)),
            "function" == typeof c.setDecryptData && c.setDecryptData(t),
            c.append(e, n, l, d)
        }
        ,
        s);
        function s(e, t, r, i) {
            this.observer = e,
            this.typeSupported = t,
            this.config = r,
            this.vendor = i
        }
        t.default = o
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var c = r(0)
          , h = r(3)
          , p = r(1);
        function o(e, t, r, i) {
            var a, n, o, s, l, u = navigator.userAgent.toLowerCase(), d = i, f = [96e3, 88200, 64e3, 48e3, 44100, 32e3, 24e3, 22050, 16e3, 12e3, 11025, 8e3, 7350];
            if (a = 1 + ((192 & t[r + 2]) >>> 6),
            !((n = (60 & t[r + 2]) >>> 2) > f.length - 1))
                return s = (1 & t[r + 2]) << 2,
                s |= (192 & t[r + 3]) >>> 6,
                c.logger.log("manifest codec:" + i + ",ADTS data:type:" + a + ",sampleingIndex:" + n + "[" + f[n] + "Hz],channelConfig:" + s),
                o = /firefox/i.test(u) ? 6 <= n ? (a = 5,
                l = new Array(4),
                n - 3) : (a = 2,
                l = new Array(2),
                n) : -1 !== u.indexOf("android") ? (a = 2,
                l = new Array(2),
                n) : (a = 5,
                l = new Array(4),
                i && (-1 !== i.indexOf("mp4a.40.29") || -1 !== i.indexOf("mp4a.40.5")) || !i && 6 <= n ? n - 3 : ((i && -1 !== i.indexOf("mp4a.40.2") && (6 <= n && 1 == s || /vivaldi/i.test(u)) || !i && 1 == s) && (a = 2,
                l = new Array(2)),
                n)),
                l[0] = a << 3,
                l[0] |= (14 & n) >> 1,
                l[1] |= (1 & n) << 7,
                l[1] |= s << 3,
                5 === a && (l[1] |= (14 & o) >> 1,
                l[2] = (1 & o) << 7,
                l[2] |= 8,
                l[3] = 0),
                {
                    config: l,
                    samplerate: f[n],
                    channelCount: s,
                    codec: "mp4a.40." + a,
                    manifestCodec: d
                };
            e.trigger(p.default.ERROR, {
                type: h.ErrorTypes.MEDIA_ERROR,
                details: h.ErrorDetails.FRAG_PARSING_ERROR,
                fatal: !0,
                reason: "invalid ADTS sampling index:" + n
            })
        }
        function a(e, t) {
            return 255 === e[t] && 240 == (246 & e[t + 1])
        }
        function l(e, t) {
            return 1 & e[t + 1] ? 7 : 9
        }
        function u(e, t) {
            return (3 & e[t + 3]) << 11 | e[t + 4] << 3 | (224 & e[t + 5]) >>> 5
        }
        function d(e) {
            return 9216e4 / e
        }
        function f(e, t, r, i, a) {
            var n, o, s = e.length;
            if (n = l(e, t),
            o = u(e, t),
            0 < (o -= n) && t + n + o <= s)
                return {
                    headerLength: n,
                    frameLength: o,
                    stamp: r + i * a
                }
        }
        t.getAudioConfig = o,
        t.isHeaderPattern = a,
        t.getHeaderLength = l,
        t.getFullFrameLength = u,
        t.isHeader = function(e, t) {
            return !!(t + 1 < e.length && a(e, t))
        }
        ,
        t.probe = function(e, t) {
            if (t + 1 < e.length && a(e, t)) {
                var r = l(e, t);
                t + 5 < e.length && (r = u(e, t));
                var i = t + r;
                if (i === e.length || i + 1 < e.length && a(e, i))
                    return !0
            }
            return !1
        }
        ,
        t.initTrackConfig = function(e, t, r, i, a) {
            if (!e.samplerate) {
                var n = o(t, r, i, a);
                e.config = n.config,
                e.samplerate = n.samplerate,
                e.channelCount = n.channelCount,
                e.codec = n.codec,
                e.manifestCodec = n.manifestCodec,
                c.logger.log("parsed codec:" + e.codec + ",rate:" + n.samplerate + ",nb channel:" + n.channelCount)
            }
        }
        ,
        t.getFrameDuration = d,
        t.parseFrameHeader = f,
        t.appendFrame = function(e, t, r, i, a) {
            var n = f(t, r, i, a, d(e.samplerate));
            if (n) {
                var o = n.stamp
                  , s = n.headerLength
                  , l = n.frameLength
                  , u = {
                    unit: t.subarray(r + s, r + s + l),
                    pts: o,
                    dts: o
                };
                return e.samples.push(u),
                e.len += l,
                {
                    sample: u,
                    length: l + s
                }
            }
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var g = {
            BitratesMap: [32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
            SamplingRateMap: [44100, 48e3, 32e3, 22050, 24e3, 16e3, 11025, 12e3, 8e3],
            SamplesCoefficients: [[0, 72, 144, 12], [0, 0, 0, 0], [0, 72, 144, 12], [0, 144, 144, 12]],
            BytesInSlot: [0, 1, 1, 4],
            appendFrame: function(e, t, r, i, a) {
                if (!(r + 24 > t.length)) {
                    var n = this.parseHeader(t, r);
                    if (n && r + n.frameLength <= t.length) {
                        var o = i + a * (9e4 * n.samplesPerFrame / n.sampleRate)
                          , s = {
                            unit: t.subarray(r, r + n.frameLength),
                            pts: o,
                            dts: o
                        };
                        return e.config = [],
                        e.channelCount = n.channelCount,
                        e.samplerate = n.sampleRate,
                        e.samples.push(s),
                        e.len += n.frameLength,
                        {
                            sample: s,
                            length: n.frameLength
                        }
                    }
                }
            },
            parseHeader: function(e, t) {
                var r = e[t + 1] >> 3 & 3
                  , i = e[t + 1] >> 1 & 3
                  , a = e[t + 2] >> 4 & 15
                  , n = e[t + 2] >> 2 & 3
                  , o = e[t + 2] >> 1 & 1;
                if (1 != r && 0 != a && 15 != a && 3 != n) {
                    var s = 3 == r ? 3 - i : 3 == i ? 3 : 4
                      , l = 1e3 * g.BitratesMap[14 * s + a - 1]
                      , u = 3 == r ? 0 : 2 == r ? 1 : 2
                      , d = g.SamplingRateMap[3 * u + n]
                      , f = e[t + 3] >> 6 == 3 ? 1 : 2
                      , c = g.SamplesCoefficients[r][i]
                      , h = g.BytesInSlot[i]
                      , p = 8 * c * h;
                    return {
                        sampleRate: d,
                        channelCount: f,
                        frameLength: parseInt(c * l / d + o, 10) * h,
                        samplesPerFrame: p
                    }
                }
            },
            isHeaderPattern: function(e, t) {
                return 255 === e[t] && 224 == (224 & e[t + 1]) && 0 != (6 & e[t + 1])
            },
            isHeader: function(e, t) {
                return !!(t + 1 < e.length && this.isHeaderPattern(e, t))
            },
            probe: function(e, t) {
                if (t + 1 < e.length && this.isHeaderPattern(e, t)) {
                    var r = this.parseHeader(e, t)
                      , i = 4;
                    r && r.frameLength && (i = r.frameLength);
                    var a = t + i;
                    if (a === e.length || a + 1 < e.length && this.isHeaderPattern(e, a))
                        return !0
                }
                return !1
            }
        };
        t.default = g
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, o = (n = r(51).EventEmitter,
        a(s, n),
        s.prototype.trigger = function(e) {
            for (var t = [], r = 1; r < arguments.length; r++)
                t[r - 1] = arguments[r];
            this.emit.apply(this, [e, e].concat(t))
        }
        ,
        s);
        function s() {
            return null !== n && n.apply(this, arguments) || this
        }
        t.Observer = o
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.default = {
            toString: function(e) {
                for (var t = "", r = e.length, i = 0; i < r; i++)
                    t += "[" + e.start(i).toFixed(3) + "," + e.end(i).toFixed(3) + "]";
                return t
            }
        }
    }
    , function(e, t, f) {
        "use strict";
        (function(a) {
            Object.defineProperty(t, "__esModule", {
                value: !0
            });
            var r = f(10)
              , n = f(0);
            function o(e, t) {
                for (var r = null, i = 0; i < e.length; i += 1) {
                    var a = e[i];
                    if (a && a.cc === t) {
                        r = a;
                        break
                    }
                }
                return r
            }
            function s(e, t, r) {
                var i = !1;
                return t && t.details && r && (r.endCC > r.startCC || e && e.cc < r.startCC) && (i = !0),
                i
            }
            function l(e, t) {
                var r = e.fragments
                  , i = t.fragments;
                if (i.length && r.length) {
                    var a = o(r, i[0].cc);
                    if (a && (!a || a.startPTS))
                        return a;
                    n.logger.log("No frag in previous level to align on")
                } else
                    n.logger.log("No fragments to align")
            }
            function u(r, e) {
                e.fragments.forEach(function(e) {
                    if (e) {
                        var t = e.start + r;
                        e.start = e.startPTS = t,
                        e.endPTS = t + e.duration
                    }
                }),
                e.PTSKnown = !0
            }
            function i(e, t, r) {
                if (s(e, r, t)) {
                    var i = l(r.details, t);
                    i && (n.logger.log("Adjusting PTS using last level due to CC increase within current level"),
                    u(i.start, t))
                }
            }
            function d(e, t) {
                if (t && t.fragments.length) {
                    if (!e.hasProgramDateTime || !t.hasProgramDateTime)
                        return;
                    var r = t.fragments[0].programDateTime
                      , i = (e.fragments[0].programDateTime - r) / 1e3 + t.fragments[0].start;
                    a.isFinite(i) && (n.logger.log("adjusting PTS using programDateTime delta, sliding:" + i.toFixed(3)),
                    u(i, e))
                }
            }
            t.findFirstFragWithCC = o,
            t.findFragWithCC = function(e, t) {
                return r.default.search(e, function(e) {
                    return e.cc < t ? 1 : e.cc > t ? -1 : 0
                })
            }
            ,
            t.shouldAlignOnDiscontinuities = s,
            t.findDiscontinuousReferenceFrag = l,
            t.adjustPts = u,
            t.alignStream = function(e, t, r) {
                i(e, r, t),
                !r.PTSKnown && t && d(r, t.details)
            }
            ,
            t.alignDiscontinuities = i,
            t.alignPDT = d
        }
        ).call(this, f(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        (function(n) {
            Object.defineProperty(t, "__esModule", {
                value: !0
            });
            var o = r(10);
            function s(e, t, r) {
                void 0 === e && (e = 0),
                void 0 === t && (t = 0);
                var i = Math.min(t, r.duration + (r.deltaPTS ? r.deltaPTS : 0));
                return r.start + r.duration - i <= e ? 1 : r.start - i > e && r.start ? -1 : 0
            }
            function l(e, t, r) {
                var i = 1e3 * Math.min(t, r.duration + (r.deltaPTS ? r.deltaPTS : 0));
                return r.endProgramDateTime - i > e
            }
            t.findFragmentByPDT = function(e, t, r) {
                if (!Array.isArray(e) || !e.length || !n.isFinite(t))
                    return null;
                if (t < e[0].programDateTime)
                    return null;
                if (t >= e[e.length - 1].endProgramDateTime)
                    return null;
                r = r || 0;
                for (var i = 0; i < e.length; ++i) {
                    var a = e[i];
                    if (l(t, r, a))
                        return a
                }
                return null
            }
            ,
            t.findFragmentByPTS = function(e, t, r, i) {
                void 0 === r && (r = 0),
                void 0 === i && (i = 0);
                var a = e ? t[e.sn - t[0].sn + 1] : null;
                return a && !s(r, i, a) ? a : o.default.search(t, s.bind(null, r, i))
            }
            ,
            t.fragmentWithinToleranceTest = s,
            t.pdtWithinToleranceTest = l
        }
        ).call(this, r(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, o = (n = r(4).default,
        a(s, n),
        s.prototype.onHandlerDestroying = function() {
            this.clearNextTick(),
            this.clearInterval()
        }
        ,
        s.prototype.hasInterval = function() {
            return !!this._tickInterval
        }
        ,
        s.prototype.hasNextTick = function() {
            return !!this._tickTimer
        }
        ,
        s.prototype.setInterval = function(e) {
            return !this._tickInterval && (this._tickInterval = setInterval(this._boundTick, e),
            !0)
        }
        ,
        s.prototype.clearInterval = function() {
            return !(!this._tickInterval || (clearInterval(this._tickInterval),
            this._tickInterval = null))
        }
        ,
        s.prototype.clearNextTick = function() {
            return !(!this._tickTimer || (clearTimeout(this._tickTimer),
            this._tickTimer = null))
        }
        ,
        s.prototype.tick = function() {
            this._tickCallCount++,
            1 === this._tickCallCount && (this.doTick(),
            1 < this._tickCallCount && (this.clearNextTick(),
            this._tickTimer = setTimeout(this._boundTick, 0)),
            this._tickCallCount = 0)
        }
        ,
        s.prototype.doTick = function() {}
        ,
        s);
        function s(e) {
            for (var t = [], r = 1; r < arguments.length; r++)
                t[r - 1] = arguments[r];
            var i = n.apply(this, [e].concat(t)) || this;
            return i._tickInterval = null,
            i._tickTimer = null,
            i._tickCallCount = 0,
            i._boundTick = i.tick.bind(i),
            i
        }
        t.default = o
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.sendAddTrackEvent = function(e, t) {
            var r = null;
            try {
                r = new window.Event("addtrack")
            } catch (e) {
                (r = document.createEvent("Event")).initEvent("addtrack", !1, !1)
            }
            r.track = e,
            t.dispatchEvent(r)
        }
        ,
        t.clearCurrentCues = function(e) {
            if (e && e.cues)
                for (; 0 < e.cues.length; )
                    e.removeCue(e.cues[0])
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        function i() {
            return {
                decode: function(e) {
                    if (!e)
                        return "";
                    if ("string" != typeof e)
                        throw new Error("Error - expected string data.");
                    return decodeURIComponent(encodeURIComponent(e))
                }
            }
        }
        var s = r(69);
        function a() {
            this.window = window,
            this.state = "INITIAL",
            this.buffer = "",
            this.decoder = new i,
            this.regionList = []
        }
        function l() {
            this.values = Object.create(null)
        }
        function u(e, t, r, i) {
            var a = i ? e.split(i) : [e];
            for (var n in a)
                if ("string" == typeof a[n]) {
                    var o = a[n].split(r);
                    2 === o.length && t(o[0], o[1])
                }
        }
        l.prototype = {
            set: function(e, t) {
                this.get(e) || "" === t || (this.values[e] = t)
            },
            get: function(e, t, r) {
                return r ? this.has(e) ? this.values[e] : t[r] : this.has(e) ? this.values[e] : t
            },
            has: function(e) {
                return e in this.values
            },
            alt: function(e, t, r) {
                for (var i = 0; i < r.length; ++i)
                    if (t === r[i]) {
                        this.set(e, t);
                        break
                    }
            },
            integer: function(e, t) {
                /^-?\d+$/.test(t) && this.set(e, parseInt(t, 10))
            },
            percent: function(e, t) {
                return !!(t.match(/^([\d]{1,3})(\.[\d]*)?%$/) && 0 <= (t = parseFloat(t)) && t <= 100) && (this.set(e, t),
                !0)
            }
        };
        var d = new s.default(0,0,0)
          , f = "middle" === d.align ? "middle" : "center";
        function c(i, e, o) {
            var a = i;
            function t() {
                var e, t = (e = i.match(/^(\d+):(\d{2})(:\d{2})?\.(\d{3})/)) ? e[3] ? r(e[1], e[2], e[3].replace(":", ""), e[4]) : 59 < e[1] ? r(e[1], e[2], 0, e[4]) : r(0, e[1], e[2], e[4]) : null;
                function r(e, t, r, i) {
                    return 3600 * (0 | e) + 60 * (0 | t) + (0 | r) + (0 | i) / 1e3
                }
                if (null === t)
                    throw new Error("Malformed timestamp: " + a);
                return i = i.replace(/^[^\sa-zA-Z-]+/, ""),
                t
            }
            function r() {
                i = i.replace(/^\s+/, "")
            }
            if (r(),
            e.startTime = t(),
            r(),
            "--\x3e" !== i.substr(0, 3))
                throw new Error("Malformed time stamp (time stamps must be separated by '--\x3e'): " + a);
            i = i.substr(3),
            r(),
            e.endTime = t(),
            r(),
            function(e, t) {
                var n = new l;
                u(e, function(e, t) {
                    switch (e) {
                    case "region":
                        for (var r = o.length - 1; 0 <= r; r--)
                            if (o[r].id === t) {
                                n.set(e, o[r].region);
                                break
                            }
                        break;
                    case "vertical":
                        n.alt(e, t, ["rl", "lr"]);
                        break;
                    case "line":
                        var i = t.split(",")
                          , a = i[0];
                        n.integer(e, a),
                        n.percent(e, a) && n.set("snapToLines", !1),
                        n.alt(e, a, ["auto"]),
                        2 === i.length && n.alt("lineAlign", i[1], ["start", f, "end"]);
                        break;
                    case "position":
                        i = t.split(","),
                        n.percent(e, i[0]),
                        2 === i.length && n.alt("positionAlign", i[1], ["start", f, "end", "line-left", "line-right", "auto"]);
                        break;
                    case "size":
                        n.percent(e, t);
                        break;
                    case "align":
                        n.alt(e, t, ["start", f, "end", "left", "right"])
                    }
                }, /:/, /\s/),
                t.region = n.get("region", null),
                t.vertical = n.get("vertical", "");
                var r = n.get("line", "auto");
                "auto" === r && -1 === d.line && (r = -1),
                t.line = r,
                t.lineAlign = n.get("lineAlign", "start"),
                t.snapToLines = n.get("snapToLines", !0),
                t.size = n.get("size", 100),
                t.align = n.get("align", f);
                var i = n.get("position", "auto");
                "auto" === i && 50 === d.position && (i = "start" === t.align || "left" === t.align ? 0 : "end" === t.align || "right" === t.align ? 100 : 50),
                t.position = i
            }(i, e)
        }
        function h(e) {
            return e.replace(/<br(?: \/)?>/gi, "\n")
        }
        t.fixLineBreaks = h,
        a.prototype = {
            parse: function(e) {
                var i = this;
                function t() {
                    var e = i.buffer
                      , t = 0;
                    for (e = h(e); t < e.length && "\r" !== e[t] && "\n" !== e[t]; )
                        ++t;
                    var r = e.substr(0, t);
                    return "\r" === e[t] && ++t,
                    "\n" === e[t] && ++t,
                    i.buffer = e.substr(t),
                    r
                }
                e && (i.buffer += i.decoder.decode(e, {
                    stream: !0
                }));
                try {
                    var r = void 0;
                    if ("INITIAL" === i.state) {
                        if (!/\r\n|\n/.test(i.buffer))
                            return this;
                        var a = (r = t()).match(/^(ï»¿)?WEBVTT([ \t].*)?$/);
                        if (!a || !a[0])
                            throw new Error("Malformed WebVTT signature.");
                        i.state = "HEADER"
                    }
                    for (var n = !1; i.buffer; ) {
                        if (!/\r\n|\n/.test(i.buffer))
                            return this;
                        switch (n ? n = !1 : r = t(),
                        i.state) {
                        case "HEADER":
                            /:/.test(r) ? u(r, function(e, t) {}, /:/) : r || (i.state = "ID");
                            continue;
                        case "NOTE":
                            r || (i.state = "ID");
                            continue;
                        case "ID":
                            if (/^NOTE($|[ \t])/.test(r)) {
                                i.state = "NOTE";
                                break
                            }
                            if (!r)
                                continue;
                            if (i.cue = new s.default(0,0,""),
                            i.state = "CUE",
                            -1 === r.indexOf("--\x3e")) {
                                i.cue.id = r;
                                continue
                            }
                        case "CUE":
                            try {
                                c(r, i.cue, i.regionList)
                            } catch (e) {
                                i.cue = null,
                                i.state = "BADCUE";
                                continue
                            }
                            i.state = "CUETEXT";
                            continue;
                        case "CUETEXT":
                            var o = -1 !== r.indexOf("--\x3e");
                            if (!r || o && (n = !0)) {
                                i.oncue && i.oncue(i.cue),
                                i.cue = null,
                                i.state = "ID";
                                continue
                            }
                            i.cue.text && (i.cue.text += "\n"),
                            i.cue.text += r;
                            continue;
                        case "BADCUE":
                            r || (i.state = "ID");
                            continue
                        }
                    }
                } catch (e) {
                    "CUETEXT" === i.state && i.cue && i.oncue && i.oncue(i.cue),
                    i.cue = null,
                    i.state = "INITIAL" === i.state ? "BADWEBVTT" : "BADCUE"
                }
                return this
            },
            flush: function() {
                try {
                    if (this.buffer += this.decoder.decode(),
                    !this.cue && "HEADER" !== this.state || (this.buffer += "\n\n",
                    this.parse()),
                    "INITIAL" === this.state)
                        throw new Error("Malformed WebVTT signature.")
                } catch (e) {
                    throw e
                }
                return this.onflush && this.onflush(),
                this
            }
        },
        t.default = a
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var _, n = r(9), o = r(3), S = r(16), T = r(35), b = r(36), A = r(7), R = r(37), D = r(55), L = r(56), s = r(57), O = r(0), l = r(58), u = r(1), d = (_ = r(24).Observer,
        a(w, _),
        Object.defineProperty(w, "version", {
            get: function() {
                return "0.12.4-e3287e6"
            },
            enumerable: !0,
            configurable: !0
        }),
        w.isSupported = function() {
            return s.isSupported()
        }
        ,
        Object.defineProperty(w, "Events", {
            get: function() {
                return u.default
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w, "ErrorTypes", {
            get: function() {
                return o.ErrorTypes
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w, "ErrorDetails", {
            get: function() {
                return o.ErrorDetails
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w, "DefaultConfig", {
            get: function() {
                return w.defaultConfig ? w.defaultConfig : l.hlsDefaultConfig
            },
            set: function(e) {
                w.defaultConfig = e
            },
            enumerable: !0,
            configurable: !0
        }),
        w.prototype.destroy = function() {
            O.logger.log("destroy"),
            this.trigger(u.default.DESTROYING),
            this.detachMedia(),
            this.coreComponents.concat(this.networkControllers).forEach(function(e) {
                e.destroy()
            }),
            this.url = null,
            this.removeAllListeners(),
            this._autoLevelCapping = -1
        }
        ,
        w.prototype.attachMedia = function(e) {
            O.logger.log("attachMedia"),
            this.media = e,
            this.trigger(u.default.MEDIA_ATTACHING, {
                media: e
            })
        }
        ,
        w.prototype.detachMedia = function() {
            O.logger.log("detachMedia"),
            this.trigger(u.default.MEDIA_DETACHING),
            this.media = null
        }
        ,
        w.prototype.loadSource = function(e) {
            e = n.buildAbsoluteURL(window.location.href, e, {
                alwaysNormalize: !0
            }),
            O.logger.log("loadSource:" + e),
            this.url = e,
            this.trigger(u.default.MANIFEST_LOADING, {
                url: e
            })
        }
        ,
        w.prototype.startLoad = function(t) {
            void 0 === t && (t = -1),
            O.logger.log("startLoad(" + t + ")"),
            this.networkControllers.forEach(function(e) {
                e.startLoad(t)
            })
        }
        ,
        w.prototype.stopLoad = function() {
            O.logger.log("stopLoad"),
            this.networkControllers.forEach(function(e) {
                e.stopLoad()
            })
        }
        ,
        w.prototype.swapAudioCodec = function() {
            O.logger.log("swapAudioCodec"),
            this.streamController.swapAudioCodec()
        }
        ,
        w.prototype.recoverMediaError = function() {
            O.logger.log("recoverMediaError");
            var e = this.media;
            this.detachMedia(),
            this.attachMedia(e)
        }
        ,
        Object.defineProperty(w.prototype, "levels", {
            get: function() {
                return this.levelController.levels
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "currentLevel", {
            get: function() {
                return this.streamController.currentLevel
            },
            set: function(e) {
                O.logger.log("set currentLevel:" + e),
                this.loadLevel = e,
                this.streamController.immediateLevelSwitch()
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "nextLevel", {
            get: function() {
                return this.streamController.nextLevel
            },
            set: function(e) {
                O.logger.log("set nextLevel:" + e),
                this.levelController.manualLevel = e,
                this.streamController.nextLevelSwitch()
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "loadLevel", {
            get: function() {
                return this.levelController.level
            },
            set: function(e) {
                O.logger.log("set loadLevel:" + e),
                this.levelController.manualLevel = e
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "nextLoadLevel", {
            get: function() {
                return this.levelController.nextLoadLevel
            },
            set: function(e) {
                this.levelController.nextLoadLevel = e
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "firstLevel", {
            get: function() {
                return Math.max(this.levelController.firstLevel, this.minAutoLevel)
            },
            set: function(e) {
                O.logger.log("set firstLevel:" + e),
                this.levelController.firstLevel = e
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "startLevel", {
            get: function() {
                return this.levelController.startLevel
            },
            set: function(e) {
                O.logger.log("set startLevel:" + e),
                -1 !== e && (e = Math.max(e, this.minAutoLevel)),
                this.levelController.startLevel = e
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "autoLevelCapping", {
            get: function() {
                return this._autoLevelCapping
            },
            set: function(e) {
                O.logger.log("set autoLevelCapping:" + e),
                this._autoLevelCapping = e
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "autoLevelEnabled", {
            get: function() {
                return -1 === this.levelController.manualLevel
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "manualLevel", {
            get: function() {
                return this.levelController.manualLevel
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "minAutoLevel", {
            get: function() {
                for (var e = this.levels, t = this.config.minAutoBitrate, r = e ? e.length : 0, i = 0; i < r; i++)
                    if ((e[i].realBitrate ? Math.max(e[i].realBitrate, e[i].bitrate) : e[i].bitrate) > t)
                        return i;
                return 0
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "maxAutoLevel", {
            get: function() {
                var e = this.levels
                  , t = this.autoLevelCapping;
                return -1 === t && e && e.length ? e.length - 1 : t
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "nextAutoLevel", {
            get: function() {
                return Math.min(Math.max(this.abrController.nextAutoLevel, this.minAutoLevel), this.maxAutoLevel)
            },
            set: function(e) {
                this.abrController.nextAutoLevel = Math.max(this.minAutoLevel, e)
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "audioTracks", {
            get: function() {
                var e = this.audioTrackController;
                return e ? e.audioTracks : []
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "audioTrack", {
            get: function() {
                var e = this.audioTrackController;
                return e ? e.audioTrack : -1
            },
            set: function(e) {
                var t = this.audioTrackController;
                t && (t.audioTrack = e)
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "liveSyncPosition", {
            get: function() {
                return this.streamController.liveSyncPosition
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "subtitleTracks", {
            get: function() {
                var e = this.subtitleTrackController;
                return e ? e.subtitleTracks : []
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "subtitleTrack", {
            get: function() {
                var e = this.subtitleTrackController;
                return e ? e.subtitleTrack : -1
            },
            set: function(e) {
                var t = this.subtitleTrackController;
                t && (t.subtitleTrack = e)
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(w.prototype, "subtitleDisplay", {
            get: function() {
                var e = this.subtitleTrackController;
                return !!e && e.subtitleDisplay
            },
            set: function(e) {
                var t = this.subtitleTrackController;
                t && (t.subtitleDisplay = e)
            },
            enumerable: !0,
            configurable: !0
        }),
        w);
        function w(e) {
            void 0 === e && (e = {});
            var t = _.call(this) || this
              , r = w.DefaultConfig;
            if ((e.liveSyncDurationCount || e.liveMaxLatencyDurationCount) && (e.liveSyncDuration || e.liveMaxLatencyDuration))
                throw new Error("Illegal hls.js config: don't mix up liveSyncDurationCount/liveMaxLatencyDurationCount and liveSyncDuration/liveMaxLatencyDuration");
            for (var i in r)
                i in e || (e[i] = r[i]);
            if (void 0 !== e.liveMaxLatencyDurationCount && e.liveMaxLatencyDurationCount <= e.liveSyncDurationCount)
                throw new Error('Illegal hls.js config: "liveMaxLatencyDurationCount" must be gt "liveSyncDurationCount"');
            if (void 0 !== e.liveMaxLatencyDuration && (e.liveMaxLatencyDuration <= e.liveSyncDuration || void 0 === e.liveSyncDuration))
                throw new Error('Illegal hls.js config: "liveMaxLatencyDuration" must be gt "liveSyncDuration"');
            O.enableLogs(e.debug),
            t.config = e,
            t._autoLevelCapping = -1;
            var a = t.abrController = new e.abrController(t)
              , n = new e.bufferController(t)
              , o = new e.capLevelController(t)
              , s = new e.fpsController(t)
              , l = new S.default(t)
              , u = new T.default(t)
              , d = new b.default(t)
              , f = new L.default(t)
              , c = t.levelController = new D.default(t)
              , h = new A.FragmentTracker(t)
              , p = [c, t.streamController = new R.default(t,h)]
              , g = e.audioStreamController;
            g && p.push(new g(t,h)),
            t.networkControllers = p;
            var v = [l, u, d, a, n, o, s, f, h];
            if (g = e.audioTrackController) {
                var y = new g(t);
                t.audioTrackController = y,
                v.push(y)
            }
            if (g = e.subtitleTrackController) {
                var m = new g(t);
                t.subtitleTrackController = m,
                p.push(m)
            }
            if (g = e.emeController) {
                var E = new g(t);
                t.emeController = E,
                v.push(E)
            }
            return (g = e.subtitleStreamController) && p.push(new g(t,h)),
            (g = e.timelineController) && v.push(new g(t)),
            t.coreComponents = v,
            t
        }
        t.default = d
    }
    , function(e, t, i) {
        "use strict";
        (function(P) {
            Object.defineProperty(t, "__esModule", {
                value: !0
            });
            var r = i(9)
              , k = i(12)
              , C = i(33)
              , F = i(18)
              , M = i(34)
              , x = i(0)
              , l = i(19)
              , u = /#EXT-X-STREAM-INF:([^\n\r]*)[\r\n]+([^\r\n]+)/g
              , d = /#EXT-X-MEDIA:(.*)/g
              , N = new RegExp([/#EXTINF:\s*(\d*(?:\.\d+)?)(?:,(.*)\s+)?/.source, /|(?!#)([\S+ ?]+)/.source, /|#EXT-X-BYTERANGE:*(.+)/.source, /|#EXT-X-PROGRAM-DATE-TIME:(.+)/.source, /|#.*/.source].join(""),"g")
              , U = /(?:(?:#(EXTM3U))|(?:#EXT-X-(PLAYLIST-TYPE):(.+))|(?:#EXT-X-(MEDIA-SEQUENCE): *(\d+))|(?:#EXT-X-(TARGETDURATION): *(\d+))|(?:#EXT-X-(KEY):(.+))|(?:#EXT-X-(START):(.+))|(?:#EXT-X-(ENDLIST))|(?:#EXT-X-(DISCONTINUITY-SEQ)UENCE:(\d+))|(?:#EXT-X-(DIS)CONTINUITY))|(?:#EXT-X-(VERSION):(\d+))|(?:#EXT-X-(MAP):(.+))|(?:(#)([^:]*):(.*))|(?:(#)(.*))(?:.*)\r?\n?/
              , B = /\.(mp4|m4s|m4v|m4a)$/i
              , e = (f.findGroup = function(e, t) {
                if (!e)
                    return null;
                for (var r = null, i = 0; i < e.length; i++) {
                    var a = e[i];
                    a.id === t && (r = a)
                }
                return r
            }
            ,
            f.convertAVC1ToAVCOTI = function(e) {
                var t, r = e.split(".");
                return 2 < r.length ? (t = r.shift() + ".",
                t += parseInt(r.shift()).toString(16),
                t += ("000" + parseInt(r.shift()).toString(16)).substr(-4)) : t = e,
                t
            }
            ,
            f.resolve = function(e, t) {
                return r.buildAbsoluteURL(t, e, {
                    alwaysNormalize: !0
                })
            }
            ,
            f.parseMasterPlaylist = function(e, t) {
                var r, i = [];
                function a(i, a) {
                    ["video", "audio"].forEach(function(t) {
                        var r = i.filter(function(e) {
                            return l.isCodecType(e, t)
                        });
                        if (r.length) {
                            var e = r.filter(function(e) {
                                return 0 === e.lastIndexOf("avc1", 0) || 0 === e.lastIndexOf("mp4a", 0)
                            });
                            a[t + "Codec"] = 0 < e.length ? e[0] : r[0],
                            i = i.filter(function(e) {
                                return -1 === r.indexOf(e)
                            })
                        }
                    }),
                    a.unknownCodecs = i
                }
                for (u.lastIndex = 0; null != (r = u.exec(e)); ) {
                    var n = {}
                      , o = n.attrs = new M.default(r[1]);
                    n.url = f.resolve(r[2], t);
                    var s = o.decimalResolution("RESOLUTION");
                    s && (n.width = s.width,
                    n.height = s.height),
                    n.bitrate = o.decimalInteger("AVERAGE-BANDWIDTH") || o.decimalInteger("BANDWIDTH"),
                    n.name = o.NAME,
                    a([].concat((o.CODECS || "").split(/[ ,]+/)), n),
                    n.videoCodec && -1 !== n.videoCodec.indexOf("avc1") && (n.videoCodec = f.convertAVC1ToAVCOTI(n.videoCodec)),
                    i.push(n)
                }
                return i
            }
            ,
            f.parseMasterPlaylistMedia = function(e, t, r, i) {
                var a;
                void 0 === i && (i = []);
                var n = []
                  , o = 0;
                for (d.lastIndex = 0; null !== (a = d.exec(e)); ) {
                    var s = {}
                      , l = new M.default(a[1]);
                    if (l.TYPE === r) {
                        if (s.groupId = l["GROUP-ID"],
                        s.name = l.NAME,
                        s.type = r,
                        s.default = "YES" === l.DEFAULT,
                        s.autoselect = "YES" === l.AUTOSELECT,
                        s.forced = "YES" === l.FORCED,
                        l.URI && (s.url = f.resolve(l.URI, t)),
                        s.lang = l.LANGUAGE,
                        s.name || (s.name = s.lang),
                        i.length) {
                            var u = f.findGroup(i, s.groupId);
                            s.audioCodec = u ? u.codec : i[0].codec
                        }
                        s.id = o++,
                        n.push(s)
                    }
                }
                return n
            }
            ,
            f.parseLevelPlaylist = function(e, t, r, i, a) {
                var n, o, s, l, u = 0, d = 0, f = new C.default(t), c = new F.default, h = 0, p = null, g = new k.default, v = null;
                for (N.lastIndex = 0; null !== (n = N.exec(e)); ) {
                    var y = n[1];
                    if (y) {
                        g.duration = parseFloat(y);
                        var m = (" " + n[2]).slice(1);
                        g.title = m || null,
                        g.tagList.push(m ? ["INF", y, m] : ["INF", y])
                    } else if (n[3]) {
                        if (P.isFinite(g.duration)) {
                            var E = u++;
                            g.type = i,
                            g.start = d,
                            g.levelkey = c,
                            g.sn = E,
                            g.level = r,
                            g.cc = h,
                            g.urlId = a,
                            g.baseurl = t,
                            g.relurl = (" " + n[3]).slice(1),
                            l = p,
                            (s = g).rawProgramDateTime ? s.programDateTime = Date.parse(s.rawProgramDateTime) : l && l.programDateTime && (s.programDateTime = l.endProgramDateTime),
                            P.isFinite(s.programDateTime) || (s.programDateTime = null,
                            s.rawProgramDateTime = null),
                            f.fragments.push(g),
                            d += (p = g).duration,
                            g = new k.default
                        }
                    } else if (n[4]) {
                        if (g.rawByteRange = (" " + n[4]).slice(1),
                        p) {
                            var _ = p.byteRangeEndOffset;
                            _ && (g.lastByteRangeEndOffset = _)
                        }
                    } else if (n[5])
                        g.rawProgramDateTime = (" " + n[5]).slice(1),
                        g.tagList.push(["PROGRAM-DATE-TIME", g.rawProgramDateTime]),
                        null === v && (v = f.fragments.length);
                    else {
                        for (n = n[0].match(U),
                        o = 1; o < n.length && void 0 === n[o]; o++)
                            ;
                        var S = (" " + n[o + 1]).slice(1)
                          , T = (" " + n[o + 2]).slice(1);
                        switch (n[o]) {
                        case "#":
                            g.tagList.push(T ? [S, T] : [S]);
                            break;
                        case "PLAYLIST-TYPE":
                            f.type = S.toUpperCase();
                            break;
                        case "MEDIA-SEQUENCE":
                            u = f.startSN = parseInt(S);
                            break;
                        case "TARGETDURATION":
                            f.targetduration = parseFloat(S);
                            break;
                        case "VERSION":
                            f.version = parseInt(S);
                            break;
                        case "EXTM3U":
                            break;
                        case "ENDLIST":
                            f.live = !1;
                            break;
                        case "DIS":
                            h++,
                            g.tagList.push(["DIS"]);
                            break;
                        case "DISCONTINUITY-SEQ":
                            h = parseInt(S);
                            break;
                        case "KEY":
                            var b = S
                              , A = new M.default(b)
                              , R = A.enumeratedString("METHOD")
                              , D = A.URI
                              , L = A.hexadecimalInteger("IV");
                            R && (c = new F.default,
                            D && 0 <= ["AES-128", "SAMPLE-AES", "SAMPLE-AES-CENC"].indexOf(R) && (c.method = R,
                            c.baseuri = t,
                            c.reluri = D,
                            c.key = null,
                            c.iv = L));
                            break;
                        case "START":
                            var O = S
                              , w = new M.default(O).decimalFloatingPoint("TIME-OFFSET");
                            P.isFinite(w) && (f.startTimeOffset = w);
                            break;
                        case "MAP":
                            var I = new M.default(S);
                            g.relurl = I.URI,
                            g.rawByteRange = I.BYTERANGE,
                            g.baseurl = t,
                            g.level = r,
                            g.type = i,
                            g.sn = "initSegment",
                            f.initSegment = g,
                            (g = new k.default).rawProgramDateTime = f.initSegment.rawProgramDateTime;
                            break;
                        default:
                            x.logger.warn("line parsed but not handled: " + n)
                        }
                    }
                }
                return (g = p) && !g.relurl && (f.fragments.pop(),
                d -= g.duration),
                f.totalduration = d,
                f.averagetargetduration = d / f.fragments.length,
                f.endSN = u - 1,
                f.startCC = f.fragments[0] ? f.fragments[0].cc : 0,
                f.endCC = h,
                !f.initSegment && f.fragments.length && f.fragments.every(function(e) {
                    return B.test(e.relurl)
                }) && (x.logger.warn("MP4 fragments found but no init segment (probably no MAP, incomplete M3U8), trying to fetch SIDX"),
                (g = new k.default).relurl = f.fragments[0].relurl,
                g.baseurl = t,
                g.level = r,
                g.type = i,
                g.sn = "initSegment",
                f.initSegment = g,
                f.needSidxRanges = !0),
                v && function(e, t) {
                    for (var r = e[t], i = t - 1; 0 <= i; i--) {
                        var a = e[i];
                        a.programDateTime = r.programDateTime - 1e3 * a.duration,
                        r = a
                    }
                }(f.fragments, v),
                f
            }
            ,
            f);
            function f() {}
            t.default = e
        }
        ).call(this, i(2).Number)
    }
    , function(e, i, t) {
        "use strict";
        (function(e) {
            Object.defineProperty(i, "__esModule", {
                value: !0
            });
            var t = (Object.defineProperty(r.prototype, "hasProgramDateTime", {
                get: function() {
                    return !(!this.fragments[0] || !e.isFinite(this.fragments[0].programDateTime))
                },
                enumerable: !0,
                configurable: !0
            }),
            r);
            function r(e) {
                this.endCC = 0,
                this.endSN = 0,
                this.fragments = [],
                this.initSegment = null,
                this.live = !0,
                this.needSidxRanges = !1,
                this.startCC = 0,
                this.startSN = 0,
                this.startTimeOffset = null,
                this.targetduration = 0,
                this.totalduration = 0,
                this.type = null,
                this.url = e,
                this.version = null
            }
            i.default = t
        }
        ).call(this, t(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        (function(r) {
            Object.defineProperty(t, "__esModule", {
                value: !0
            });
            var i = /^(\d+)x(\d+)$/
              , a = /\s*(.+?)\s*=((?:\".*?\")|.*?)(?:,|$)/g
              , e = (n.prototype.decimalInteger = function(e) {
                var t = parseInt(this[e], 10);
                return t > r.MAX_SAFE_INTEGER ? 1 / 0 : t
            }
            ,
            n.prototype.hexadecimalInteger = function(e) {
                if (this[e]) {
                    var t = (this[e] || "0x").slice(2);
                    t = (1 & t.length ? "0" : "") + t;
                    for (var r = new Uint8Array(t.length / 2), i = 0; i < t.length / 2; i++)
                        r[i] = parseInt(t.slice(2 * i, 2 * i + 2), 16);
                    return r
                }
                return null
            }
            ,
            n.prototype.hexadecimalIntegerAsNumber = function(e) {
                var t = parseInt(this[e], 16);
                return t > r.MAX_SAFE_INTEGER ? 1 / 0 : t
            }
            ,
            n.prototype.decimalFloatingPoint = function(e) {
                return parseFloat(this[e])
            }
            ,
            n.prototype.enumeratedString = function(e) {
                return this[e]
            }
            ,
            n.prototype.decimalResolution = function(e) {
                var t = i.exec(this[e]);
                if (null !== t)
                    return {
                        width: parseInt(t[1], 10),
                        height: parseInt(t[2], 10)
                    }
            }
            ,
            n.parseAttrList = function(e) {
                var t, r = {};
                for (a.lastIndex = 0; null !== (t = a.exec(e)); ) {
                    var i = t[2];
                    0 === i.indexOf('"') && i.lastIndexOf('"') === i.length - 1 && (i = i.slice(1, -1)),
                    r[t[1]] = i
                }
                return r
            }
            ,
            n);
            function n(e) {
                for (var t in "string" == typeof e && (e = n.parseAttrList(e)),
                e)
                    e.hasOwnProperty(t) && (this[t] = e[t])
            }
            t.default = e
        }
        ).call(this, r(2).Number)
    }
    , function(e, l, u) {
        "use strict";
        (function(h) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(l, "__esModule", {
                value: !0
            });
            var a, o = u(1), t = u(4), n = u(3), p = u(0), r = (a = t.default,
            e(s, a),
            s.prototype.destroy = function() {
                var e = this.loaders;
                for (var t in e) {
                    var r = e[t];
                    r && r.destroy()
                }
                this.loaders = {},
                a.prototype.destroy.call(this)
            }
            ,
            s.prototype.onFragLoading = function(e) {
                var t = e.frag
                  , r = t.type
                  , i = this.loaders
                  , a = this.hls.config
                  , n = a.fLoader
                  , o = a.loader;
                t.loaded = 0;
                var s, l, u, d = i[r];
                d && (p.logger.warn("abort previous fragment loader for type: " + r),
                d.abort()),
                d = i[r] = t.loader = a.fLoader ? new n(a) : new o(a),
                s = {
                    url: t.url,
                    frag: t,
                    responseType: "arraybuffer",
                    progressData: !1
                };
                var f = t.byteRangeStartOffset
                  , c = t.byteRangeEndOffset;
                h.isFinite(f) && h.isFinite(c) && (s.rangeStart = f,
                s.rangeEnd = c),
                l = {
                    timeout: a.fragLoadingTimeOut,
                    maxRetry: a.fragLoadingMaxRetry,
                    retryDelay: a.fragLoadingRetryDelay,
                    maxRetryDelay: a.fragLoadingMaxRetryTimeout
                },
                u = {
                    onSuccess: this.loadsuccess.bind(this),
                    onError: this.loaderror.bind(this),
                    onTimeout: this.loadtimeout.bind(this),
                    onProgress: this.loadprogress.bind(this)
                },
                d.load(s, l, u)
            }
            ,
            s.prototype.loadsuccess = function(e, t, r, i) {
                void 0 === i && (i = null);
                var a = e.data
                  , n = r.frag;
                n.loader = void 0,
                this.loaders[n.type] = void 0,
                this.hls.trigger(o.default.FRAG_LOADED, {
                    payload: a,
                    frag: n,
                    stats: t,
                    networkDetails: i
                })
            }
            ,
            s.prototype.loaderror = function(e, t, r) {
                void 0 === r && (r = null);
                var i = t.frag
                  , a = i.loader;
                a && a.abort(),
                this.loaders[i.type] = void 0,
                this.hls.trigger(o.default.ERROR, {
                    type: n.ErrorTypes.NETWORK_ERROR,
                    details: n.ErrorDetails.FRAG_LOAD_ERROR,
                    fatal: !1,
                    frag: t.frag,
                    response: e,
                    networkDetails: r
                })
            }
            ,
            s.prototype.loadtimeout = function(e, t, r) {
                void 0 === r && (r = null);
                var i = t.frag
                  , a = i.loader;
                a && a.abort(),
                this.loaders[i.type] = void 0,
                this.hls.trigger(o.default.ERROR, {
                    type: n.ErrorTypes.NETWORK_ERROR,
                    details: n.ErrorDetails.FRAG_LOAD_TIMEOUT,
                    fatal: !1,
                    frag: t.frag,
                    networkDetails: r
                })
            }
            ,
            s.prototype.loadprogress = function(e, t, r, i) {
                void 0 === i && (i = null);
                var a = t.frag;
                a.loaded = e.loaded,
                this.hls.trigger(o.default.FRAG_LOAD_PROGRESS, {
                    frag: a,
                    stats: e,
                    networkDetails: i
                })
            }
            ,
            s);
            function s(e) {
                var t = a.call(this, e, o.default.FRAG_LOADING) || this;
                return t.loaders = {},
                t
            }
            l.default = r
        }
        ).call(this, u(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, d = r(1), o = r(4), s = r(3), f = r(0), l = (n = o.default,
        a(u, n),
        u.prototype.destroy = function() {
            for (var e in this.loaders) {
                var t = this.loaders[e];
                t && t.destroy()
            }
            this.loaders = {},
            o.default.prototype.destroy.call(this)
        }
        ,
        u.prototype.onKeyLoading = function(e) {
            var t = e.frag
              , r = t.type
              , i = this.loaders[r]
              , a = t.decryptdata
              , n = a.uri;
            if (n !== this.decrypturl || null === this.decryptkey) {
                var o, s, l, u = this.hls.config;
                i && (f.logger.warn("abort previous key loader for type:" + r),
                i.abort()),
                t.loader = this.loaders[r] = new u.loader(u),
                this.decrypturl = n,
                this.decryptkey = null,
                o = {
                    url: n,
                    frag: t,
                    responseType: "arraybuffer"
                },
                s = {
                    timeout: u.fragLoadingTimeOut,
                    maxRetry: 0,
                    retryDelay: u.fragLoadingRetryDelay,
                    maxRetryDelay: u.fragLoadingMaxRetryTimeout
                },
                l = {
                    onSuccess: this.loadsuccess.bind(this),
                    onError: this.loaderror.bind(this),
                    onTimeout: this.loadtimeout.bind(this)
                },
                t.loader.load(o, s, l)
            } else
                this.decryptkey && (a.key = this.decryptkey,
                this.hls.trigger(d.default.KEY_LOADED, {
                    frag: t
                }))
        }
        ,
        u.prototype.loadsuccess = function(e, t, r) {
            var i = r.frag;
            this.decryptkey = i.decryptdata.key = new Uint8Array(e.data),
            i.loader = void 0,
            this.loaders[i.type] = void 0,
            this.hls.trigger(d.default.KEY_LOADED, {
                frag: i
            })
        }
        ,
        u.prototype.loaderror = function(e, t) {
            var r = t.frag
              , i = r.loader;
            i && i.abort(),
            this.loaders[t.type] = void 0,
            this.hls.trigger(d.default.ERROR, {
                type: s.ErrorTypes.NETWORK_ERROR,
                details: s.ErrorDetails.KEY_LOAD_ERROR,
                fatal: !1,
                frag: r,
                response: e
            })
        }
        ,
        u.prototype.loadtimeout = function(e, t) {
            var r = t.frag
              , i = r.loader;
            i && i.abort(),
            this.loaders[t.type] = void 0,
            this.hls.trigger(d.default.ERROR, {
                type: s.ErrorTypes.NETWORK_ERROR,
                details: s.ErrorDetails.KEY_LOAD_TIMEOUT,
                fatal: !1,
                frag: r
            })
        }
        ,
        u);
        function u(e) {
            var t = n.call(this, e, d.default.KEY_LOADING) || this;
            return t.loaders = {},
            t.decryptkey = null,
            t.decrypturl = null,
            t
        }
        t.default = l
    }
    , function(e, S, T) {
        "use strict";
        (function(u) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(S, "__esModule", {
                value: !0
            });
            var a, p = T(10), c = T(5), h = T(20), g = T(1), r = T(7), d = T(12), t = T(16), f = T(8), n = T(25), o = T(3), v = T(0), y = T(26), m = T(27), s = T(54), E = T(15), l = (a = E.default,
            e(_, a),
            _.prototype.startLoad = function(e) {
                if (this.levels) {
                    var t = this.lastCurrentTime
                      , r = this.hls;
                    if (this.stopLoad(),
                    this.setInterval(100),
                    this.level = -1,
                    this.fragLoadError = 0,
                    !this.startFragRequested) {
                        var i = r.startLevel;
                        -1 === i && (i = 0,
                        this.bitrateTest = !0),
                        this.level = r.nextLoadLevel = i,
                        this.loadedmetadata = !1
                    }
                    0 < t && -1 === e && (v.logger.log("override startPosition with lastCurrentTime @" + t.toFixed(3)),
                    e = t),
                    this.state = E.State.IDLE,
                    this.nextLoadPosition = this.startPosition = this.lastCurrentTime = e,
                    this.tick()
                } else
                    this.forceStartLoad = !0,
                    this.state = E.State.STOPPED
            }
            ,
            _.prototype.stopLoad = function() {
                this.forceStartLoad = !1,
                a.prototype.stopLoad.call(this)
            }
            ,
            _.prototype.doTick = function() {
                switch (this.state) {
                case E.State.BUFFER_FLUSHING:
                    this.fragLoadError = 0;
                    break;
                case E.State.IDLE:
                    this._doTickIdle();
                    break;
                case E.State.WAITING_LEVEL:
                    var e = this.levels[this.level];
                    e && e.details && (this.state = E.State.IDLE);
                    break;
                case E.State.FRAG_LOADING_WAITING_RETRY:
                    var t = window.performance.now()
                      , r = this.retryDate;
                    (!r || r <= t || this.media && this.media.seeking) && (v.logger.log("mediaController: retryDate reached, switch back to IDLE state"),
                    this.state = E.State.IDLE);
                    break;
                case E.State.ERROR:
                case E.State.STOPPED:
                case E.State.FRAG_LOADING:
                case E.State.PARSING:
                case E.State.PARSED:
                case E.State.ENDED:
                }
                this._checkBuffer(),
                this._checkFragmentChanged()
            }
            ,
            _.prototype._doTickIdle = function() {
                var e = this.hls
                  , t = e.config
                  , r = this.media;
                if (void 0 !== this.levelLastLoaded && (r || !this.startFragRequested && t.startFragPrefetch)) {
                    var i;
                    i = this.loadedmetadata ? r.currentTime : this.nextLoadPosition;
                    var a = e.nextLoadLevel
                      , n = this.levels[a];
                    if (n) {
                        var o, s = n.bitrate;
                        o = s ? Math.max(8 * t.maxBufferSize / s, t.maxBufferLength) : t.maxBufferLength,
                        o = Math.min(o, t.maxMaxBufferLength);
                        var l = c.BufferHelper.bufferInfo(this.mediaBuffer ? this.mediaBuffer : r, i, t.maxBufferHole)
                          , u = l.len;
                        if (!(o <= u)) {
                            v.logger.trace("buffer length of " + u.toFixed(3) + " is below max of " + o.toFixed(3) + ". checking for more payload ..."),
                            this.level = e.nextLoadLevel = a;
                            var d = n.details;
                            if (!d || d.live && this.levelLastLoaded !== a)
                                this.state = E.State.WAITING_LEVEL;
                            else {
                                if (this._streamEnded(l, d)) {
                                    var f = {};
                                    return this.altAudio && (f.type = "video"),
                                    this.hls.trigger(g.default.BUFFER_EOS, f),
                                    void (this.state = E.State.ENDED)
                                }
                                this._fetchPayloadOrEos(i, l, d)
                            }
                        }
                    }
                }
            }
            ,
            _.prototype._fetchPayloadOrEos = function(e, t, r) {
                var i = this.fragPrevious
                  , a = this.level
                  , n = r.fragments
                  , o = n.length;
                if (0 !== o) {
                    var s, l = n[0].start, u = n[o - 1].start + n[o - 1].duration, d = t.end;
                    if (r.initSegment && !r.initSegment.data)
                        s = r.initSegment;
                    else if (r.live) {
                        var f = this.config.initialLiveManifestSize;
                        if (o < f)
                            return void v.logger.warn("Can not start playback of a level, reason: not enough fragments " + o + " < " + f);
                        if (null === (s = this._ensureFragmentAtLivePoint(r, d, l, u, i, n, o)))
                            return
                    } else
                        d < l && (s = n[0]);
                    (s = s || this._findFragment(l, i, o, n, d, u, r)) && (s.encrypted ? (v.logger.log("Loading key for " + s.sn + " of [" + r.startSN + " ," + r.endSN + "],level " + a),
                    this._loadKey(s)) : (v.logger.log("Loading " + s.sn + " of [" + r.startSN + " ," + r.endSN + "],level " + a + ", currentTime:" + e.toFixed(3) + ",bufferEnd:" + d.toFixed(3)),
                    this._loadFragment(s)))
                }
            }
            ,
            _.prototype._ensureFragmentAtLivePoint = function(e, t, r, i, a, n, o) {
                var s, l = this.hls.config, u = this.media, d = void 0 !== l.liveMaxLatencyDuration ? l.liveMaxLatencyDuration : l.liveMaxLatencyDurationCount * e.targetduration;
                if (t < Math.max(r - l.maxFragLookUpTolerance, i - d)) {
                    var f = this.liveSyncPosition = this.computeLivePosition(r, e);
                    v.logger.log("buffer end: " + t.toFixed(3) + " is located too far from the end of live sliding playlist, reset currentTime to : " + f.toFixed(3)),
                    t = f,
                    u && u.readyState && u.duration > f && (u.currentTime = f),
                    this.nextLoadPosition = f
                }
                if (e.PTSKnown && i < t && u && u.readyState)
                    return null;
                if (this.startFragRequested && !e.PTSKnown) {
                    if (a)
                        if (e.hasProgramDateTime)
                            v.logger.log("live playlist, switching playlist, load frag with same PDT: " + a.programDateTime),
                            s = m.findFragmentByPDT(n, a.endProgramDateTime, l.maxFragLookUpTolerance);
                        else {
                            var c = a.sn + 1;
                            if (c >= e.startSN && c <= e.endSN) {
                                var h = n[c - e.startSN];
                                a.cc === h.cc && (s = h,
                                v.logger.log("live playlist, switching playlist, load frag with next SN: " + s.sn))
                            }
                            s || (s = p.default.search(n, function(e) {
                                return a.cc - e.cc
                            })) && v.logger.log("live playlist, switching playlist, load frag with same CC: " + s.sn)
                        }
                    s || (s = n[Math.min(o - 1, Math.round(o / 2))],
                    v.logger.log("live playlist, switching playlist, unknown, load middle frag : " + s.sn))
                }
                return s
            }
            ,
            _.prototype._findFragment = function(e, t, r, i, a, n, o) {
                var s, l = this.hls.config;
                if (a < n) {
                    var u = a > n - l.maxFragLookUpTolerance ? 0 : l.maxFragLookUpTolerance;
                    s = m.findFragmentByPTS(t, i, a, u)
                } else
                    s = i[r - 1];
                if (s) {
                    var d = s.sn - o.startSN
                      , f = t && s.level === t.level
                      , c = i[d - 1]
                      , h = i[1 + d];
                    if (t && s.sn === t.sn)
                        if (f && !s.backtracked)
                            if (s.sn < o.endSN) {
                                var p = t.deltaPTS;
                                p && p > l.maxBufferHole && t.dropped && d ? (s = c,
                                v.logger.warn("SN just loaded, with large PTS gap between audio and video, maybe frag is not starting with a keyframe ? load previous one to try to overcome this")) : (s = h,
                                v.logger.log("SN just loaded, load next one: " + s.sn, s))
                            } else
                                s = null;
                        else
                            s.backtracked && (h && h.backtracked ? (v.logger.warn("Already backtracked from fragment " + h.sn + ", will not backtrack to fragment " + s.sn + ". Loading fragment " + h.sn),
                            s = h) : (v.logger.warn("Loaded fragment with dropped frames, backtracking 1 segment to find a keyframe"),
                            s.dropped = 0,
                            c ? (s = c).backtracked = !0 : d && (s = null)))
                }
                return s
            }
            ,
            _.prototype._loadKey = function(e) {
                this.state = E.State.KEY_LOADING,
                this.hls.trigger(g.default.KEY_LOADING, {
                    frag: e
                })
            }
            ,
            _.prototype._loadFragment = function(e) {
                var t = this.fragmentTracker.getState(e);
                this.fragCurrent = e,
                this.startFragRequested = !0,
                u.isFinite(e.sn) && !e.bitrateTest && (this.nextLoadPosition = e.start + e.duration),
                e.backtracked || t === r.FragmentState.NOT_LOADED || t === r.FragmentState.PARTIAL ? (e.autoLevel = this.hls.autoLevelEnabled,
                e.bitrateTest = this.bitrateTest,
                this.hls.trigger(g.default.FRAG_LOADING, {
                    frag: e
                }),
                this.demuxer || (this.demuxer = new h.default(this.hls,"main")),
                this.state = E.State.FRAG_LOADING) : t === r.FragmentState.APPENDING && this._reduceMaxBufferLength(e.duration) && this.fragmentTracker.removeFragment(e)
            }
            ,
            Object.defineProperty(_.prototype, "state", {
                get: function() {
                    return this._state
                },
                set: function(e) {
                    if (this.state !== e) {
                        var t = this.state;
                        this._state = e,
                        v.logger.log("main stream:" + t + "->" + e),
                        this.hls.trigger(g.default.STREAM_STATE_TRANSITION, {
                            previousState: t,
                            nextState: e
                        })
                    }
                },
                enumerable: !0,
                configurable: !0
            }),
            _.prototype.getBufferedFrag = function(e) {
                return this.fragmentTracker.getBufferedFrag(e, t.default.LevelType.MAIN)
            }
            ,
            Object.defineProperty(_.prototype, "currentLevel", {
                get: function() {
                    var e = this.media;
                    if (e) {
                        var t = this.getBufferedFrag(e.currentTime);
                        if (t)
                            return t.level
                    }
                    return -1
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(_.prototype, "nextBufferedFrag", {
                get: function() {
                    var e = this.media;
                    return e ? this.followingBufferedFrag(this.getBufferedFrag(e.currentTime)) : null
                },
                enumerable: !0,
                configurable: !0
            }),
            _.prototype.followingBufferedFrag = function(e) {
                return e ? this.getBufferedFrag(e.endPTS + .5) : null
            }
            ,
            Object.defineProperty(_.prototype, "nextLevel", {
                get: function() {
                    var e = this.nextBufferedFrag;
                    return e ? e.level : -1
                },
                enumerable: !0,
                configurable: !0
            }),
            _.prototype._checkFragmentChanged = function() {
                var e, t, r = this.media;
                if (r && r.readyState && !1 === r.seeking && ((t = r.currentTime) > this.lastCurrentTime && (this.lastCurrentTime = t),
                c.BufferHelper.isBuffered(r, t) ? e = this.getBufferedFrag(t) : c.BufferHelper.isBuffered(r, t + .1) && (e = this.getBufferedFrag(t + .1)),
                e)) {
                    var i = e;
                    if (i !== this.fragPlaying) {
                        this.hls.trigger(g.default.FRAG_CHANGED, {
                            frag: i
                        });
                        var a = i.level;
                        this.fragPlaying && this.fragPlaying.level === a || this.hls.trigger(g.default.LEVEL_SWITCHED, {
                            level: a
                        }),
                        this.fragPlaying = i
                    }
                }
            }
            ,
            _.prototype.immediateLevelSwitch = function() {
                if (v.logger.log("immediateLevelSwitch"),
                !this.immediateSwitch) {
                    this.immediateSwitch = !0;
                    var e = this.media
                      , t = void 0;
                    e ? (t = e.paused,
                    e.pause()) : t = !0,
                    this.previouslyPaused = t
                }
                var r = this.fragCurrent;
                r && r.loader && r.loader.abort(),
                this.fragCurrent = null,
                this.flushMainBuffer(0, u.POSITIVE_INFINITY)
            }
            ,
            _.prototype.immediateLevelSwitchEnd = function() {
                var e = this.media;
                e && e.buffered.length && (this.immediateSwitch = !1,
                c.BufferHelper.isBuffered(e, e.currentTime) && (e.currentTime -= 1e-4),
                this.previouslyPaused || e.play())
            }
            ,
            _.prototype.nextLevelSwitch = function() {
                var e = this.media;
                if (e && e.readyState) {
                    var t, r = void 0, i = void 0;
                    if ((t = this.getBufferedFrag(e.currentTime)) && 1 < t.startPTS && this.flushMainBuffer(0, t.startPTS - 1),
                    e.paused)
                        r = 0;
                    else {
                        var a = this.hls.nextLoadLevel
                          , n = this.levels[a]
                          , o = this.fragLastKbps;
                        r = o && this.fragCurrent ? this.fragCurrent.duration * n.bitrate / (1e3 * o) + 1 : 0
                    }
                    if ((i = this.getBufferedFrag(e.currentTime + r)) && (i = this.followingBufferedFrag(i))) {
                        var s = this.fragCurrent;
                        s && s.loader && s.loader.abort(),
                        this.fragCurrent = null,
                        this.flushMainBuffer(i.maxStartPTS, u.POSITIVE_INFINITY)
                    }
                }
            }
            ,
            _.prototype.flushMainBuffer = function(e, t) {
                this.state = E.State.BUFFER_FLUSHING;
                var r = {
                    startOffset: e,
                    endOffset: t
                };
                this.altAudio && (r.type = "video"),
                this.hls.trigger(g.default.BUFFER_FLUSHING, r)
            }
            ,
            _.prototype.onMediaAttached = function(e) {
                var t = this.media = this.mediaBuffer = e.media;
                this.onvseeking = this.onMediaSeeking.bind(this),
                this.onvseeked = this.onMediaSeeked.bind(this),
                this.onvended = this.onMediaEnded.bind(this),
                t.addEventListener("seeking", this.onvseeking),
                t.addEventListener("seeked", this.onvseeked),
                t.addEventListener("ended", this.onvended);
                var r = this.config;
                this.levels && r.autoStartLoad && this.hls.startLoad(r.startPosition),
                this.gapController = new s.default(r,t,this.fragmentTracker,this.hls)
            }
            ,
            _.prototype.onMediaDetaching = function() {
                var e = this.media;
                e && e.ended && (v.logger.log("MSE detaching and video ended, reset startPosition"),
                this.startPosition = this.lastCurrentTime = 0);
                var t = this.levels;
                t && t.forEach(function(e) {
                    e.details && e.details.fragments.forEach(function(e) {
                        e.backtracked = void 0
                    })
                }),
                e && (e.removeEventListener("seeking", this.onvseeking),
                e.removeEventListener("seeked", this.onvseeked),
                e.removeEventListener("ended", this.onvended),
                this.onvseeking = this.onvseeked = this.onvended = null),
                this.media = this.mediaBuffer = null,
                this.loadedmetadata = !1,
                this.stopLoad()
            }
            ,
            _.prototype.onMediaSeeked = function() {
                var e = this.media
                  , t = e ? e.currentTime : void 0;
                u.isFinite(t) && v.logger.log("media seeked to " + t.toFixed(3)),
                this.tick()
            }
            ,
            _.prototype.onManifestLoading = function() {
                v.logger.log("trigger BUFFER_RESET"),
                this.hls.trigger(g.default.BUFFER_RESET),
                this.fragmentTracker.removeAllFragments(),
                this.stalled = !1,
                this.startPosition = this.lastCurrentTime = 0
            }
            ,
            _.prototype.onManifestParsed = function(e) {
                var t, r = !1, i = !1;
                e.levels.forEach(function(e) {
                    (t = e.audioCodec) && (-1 !== t.indexOf("mp4a.40.2") && (r = !0),
                    -1 !== t.indexOf("mp4a.40.5") && (i = !0))
                }),
                this.audioCodecSwitch = r && i,
                this.audioCodecSwitch && v.logger.log("both AAC/HE-AAC audio found in levels; declaring level codec as HE-AAC"),
                this.levels = e.levels,
                this.startFragRequested = !1;
                var a = this.config;
                (a.autoStartLoad || this.forceStartLoad) && this.hls.startLoad(a.startPosition)
            }
            ,
            _.prototype.onLevelLoaded = function(e) {
                var t = e.details
                  , r = e.level
                  , i = this.levels[this.levelLastLoaded]
                  , a = this.levels[r]
                  , n = t.totalduration
                  , o = 0;
                if (v.logger.log("level " + r + " loaded [" + t.startSN + "," + t.endSN + "],duration:" + n),
                t.live) {
                    var s = a.details;
                    s && 0 < t.fragments.length ? (f.mergeDetails(s, t),
                    o = t.fragments[0].start,
                    this.liveSyncPosition = this.computeLivePosition(o, s),
                    t.PTSKnown && u.isFinite(o) ? v.logger.log("live playlist sliding:" + o.toFixed(3)) : (v.logger.log("live playlist - outdated PTS, unknown sliding"),
                    y.alignStream(this.fragPrevious, i, t))) : (v.logger.log("live playlist - first load, unknown sliding"),
                    t.PTSKnown = !1,
                    y.alignStream(this.fragPrevious, i, t))
                } else
                    t.PTSKnown = !1;
                if (a.details = t,
                this.levelLastLoaded = r,
                this.hls.trigger(g.default.LEVEL_UPDATED, {
                    details: t,
                    level: r
                }),
                !1 === this.startFragRequested) {
                    if (-1 === this.startPosition || -1 === this.lastCurrentTime) {
                        var l = t.startTimeOffset;
                        u.isFinite(l) ? (l < 0 && (v.logger.log("negative start time offset " + l + ", count from end of last fragment"),
                        l = o + n + l),
                        v.logger.log("start time offset found in playlist, adjust startPosition to " + l),
                        this.startPosition = l) : t.live ? (this.startPosition = this.computeLivePosition(o, t),
                        v.logger.log("configure startPosition to " + this.startPosition)) : this.startPosition = 0,
                        this.lastCurrentTime = this.startPosition
                    }
                    this.nextLoadPosition = this.startPosition
                }
                this.state === E.State.WAITING_LEVEL && (this.state = E.State.IDLE),
                this.tick()
            }
            ,
            _.prototype.onKeyLoaded = function() {
                this.state === E.State.KEY_LOADING && (this.state = E.State.IDLE,
                this.tick())
            }
            ,
            _.prototype.onFragLoaded = function(e) {
                var t = this.fragCurrent
                  , r = this.hls
                  , i = this.levels
                  , a = this.media
                  , n = e.frag;
                if (this.state === E.State.FRAG_LOADING && t && "main" === n.type && n.level === t.level && n.sn === t.sn) {
                    var o = e.stats
                      , s = i[t.level]
                      , l = s.details;
                    if (this.bitrateTest = !1,
                    this.stats = o,
                    v.logger.log("Loaded " + t.sn + " of [" + l.startSN + " ," + l.endSN + "],level " + t.level),
                    n.bitrateTest && r.nextLoadLevel)
                        this.state = E.State.IDLE,
                        this.startFragRequested = !1,
                        o.tparsed = o.tbuffered = window.performance.now(),
                        r.trigger(g.default.FRAG_BUFFERED, {
                            stats: o,
                            frag: t,
                            id: "main"
                        }),
                        this.tick();
                    else if ("initSegment" === n.sn)
                        this.state = E.State.IDLE,
                        o.tparsed = o.tbuffered = window.performance.now(),
                        l.initSegment.data = e.payload,
                        r.trigger(g.default.FRAG_BUFFERED, {
                            stats: o,
                            frag: t,
                            id: "main"
                        }),
                        this.tick();
                    else {
                        v.logger.log("Parsing " + t.sn + " of [" + l.startSN + " ," + l.endSN + "],level " + t.level + ", cc " + t.cc),
                        this.state = E.State.PARSING,
                        this.pendingBuffering = !0,
                        this.appended = !1,
                        n.bitrateTest && (n.bitrateTest = !1,
                        this.fragmentTracker.onFragLoaded({
                            frag: n
                        }));
                        var u = !(a && a.seeking) && (l.PTSKnown || !l.live)
                          , d = l.initSegment ? l.initSegment.data : []
                          , f = this._getAudioCodec(s);
                        (this.demuxer = this.demuxer || new h.default(this.hls,"main")).push(e.payload, d, f, s.videoCodec, t, l.totalduration, u)
                    }
                }
                this.fragLoadError = 0
            }
            ,
            _.prototype.onFragParsingInitSegment = function(e) {
                var t = this.fragCurrent
                  , r = e.frag;
                if (t && "main" === e.id && r.sn === t.sn && r.level === t.level && this.state === E.State.PARSING) {
                    var i = e.tracks
                      , a = void 0
                      , n = void 0;
                    if (i.audio && this.altAudio && delete i.audio,
                    n = i.audio) {
                        var o = this.levels[this.level].audioCodec
                          , s = navigator.userAgent.toLowerCase();
                        o && this.audioCodecSwap && (v.logger.log("swapping playlist audio codec"),
                        o = -1 !== o.indexOf("mp4a.40.5") ? "mp4a.40.2" : "mp4a.40.5"),
                        this.audioCodecSwitch && 1 !== n.metadata.channelCount && -1 === s.indexOf("firefox") && (o = "mp4a.40.5"),
                        -1 !== s.indexOf("android") && "audio/mpeg" !== n.container && (o = "mp4a.40.2",
                        v.logger.log("Android: force audio codec to " + o)),
                        n.levelCodec = o,
                        n.id = e.id
                    }
                    for (a in (n = i.video) && (n.levelCodec = this.levels[this.level].videoCodec,
                    n.id = e.id),
                    this.hls.trigger(g.default.BUFFER_CODECS, i),
                    i) {
                        n = i[a],
                        v.logger.log("main track:" + a + ",container:" + n.container + ",codecs[level/parsed]=[" + n.levelCodec + "/" + n.codec + "]");
                        var l = n.initSegment;
                        l && (this.appended = !0,
                        this.pendingBuffering = !0,
                        this.hls.trigger(g.default.BUFFER_APPENDING, {
                            type: a,
                            data: l,
                            parent: "main",
                            content: "initSegment"
                        }))
                    }
                    this.tick()
                }
            }
            ,
            _.prototype.onFragParsingData = function(t) {
                var r = this
                  , e = this.fragCurrent
                  , i = t.frag;
                if (e && "main" === t.id && i.sn === e.sn && i.level === e.level && ("audio" !== t.type || !this.altAudio) && this.state === E.State.PARSING) {
                    var a = this.levels[this.level]
                      , n = e;
                    if (u.isFinite(t.endPTS) || (t.endPTS = t.startPTS + e.duration,
                    t.endDTS = t.startDTS + e.duration),
                    !0 === t.hasAudio && n.addElementaryStream(d.default.ElementaryStreamTypes.AUDIO),
                    !0 === t.hasVideo && n.addElementaryStream(d.default.ElementaryStreamTypes.VIDEO),
                    v.logger.log("Parsed " + t.type + ",PTS:[" + t.startPTS.toFixed(3) + "," + t.endPTS.toFixed(3) + "],DTS:[" + t.startDTS.toFixed(3) + "/" + t.endDTS.toFixed(3) + "],nb:" + t.nb + ",dropped:" + (t.dropped || 0)),
                    "video" === t.type)
                        if (n.dropped = t.dropped,
                        n.dropped)
                            if (n.backtracked)
                                v.logger.warn("Already backtracked on this fragment, appending with the gap", n.sn);
                            else {
                                var o = a.details;
                                if (!o || n.sn !== o.startSN)
                                    return v.logger.warn("missing video frame(s), backtracking fragment", n.sn),
                                    this.fragmentTracker.removeFragment(n),
                                    n.backtracked = !0,
                                    this.nextLoadPosition = t.startPTS,
                                    this.state = E.State.IDLE,
                                    this.fragPrevious = n,
                                    void this.tick();
                                v.logger.warn("missing video frame(s) on first frag, appending with gap", n.sn)
                            }
                        else
                            n.backtracked = !1;
                    var s = f.updateFragPTSDTS(a.details, n, t.startPTS, t.endPTS, t.startDTS, t.endDTS)
                      , l = this.hls;
                    l.trigger(g.default.LEVEL_PTS_UPDATED, {
                        details: a.details,
                        level: this.level,
                        drift: s,
                        type: t.type,
                        start: t.startPTS,
                        end: t.endPTS
                    }),
                    [t.data1, t.data2].forEach(function(e) {
                        e && e.length && r.state === E.State.PARSING && (r.appended = !0,
                        r.pendingBuffering = !0,
                        l.trigger(g.default.BUFFER_APPENDING, {
                            type: t.type,
                            data: e,
                            parent: "main",
                            content: "data"
                        }))
                    }),
                    this.tick()
                }
            }
            ,
            _.prototype.onFragParsed = function(e) {
                var t = this.fragCurrent
                  , r = e.frag;
                t && "main" === e.id && r.sn === t.sn && r.level === t.level && this.state === E.State.PARSING && (this.stats.tparsed = window.performance.now(),
                this.state = E.State.PARSED,
                this._checkAppendedParsed())
            }
            ,
            _.prototype.onAudioTrackSwitching = function(e) {
                var t = !!e.url
                  , r = e.id;
                if (!t) {
                    if (this.mediaBuffer !== this.media) {
                        v.logger.log("switching on main audio, use media.buffered to schedule main fragment loading"),
                        this.mediaBuffer = this.media;
                        var i = this.fragCurrent;
                        i.loader && (v.logger.log("switching to main audio track, cancel main fragment load"),
                        i.loader.abort()),
                        this.fragCurrent = null,
                        this.fragPrevious = null,
                        this.demuxer && (this.demuxer.destroy(),
                        this.demuxer = null),
                        this.state = E.State.IDLE
                    }
                    var a = this.hls;
                    a.trigger(g.default.BUFFER_FLUSHING, {
                        startOffset: 0,
                        endOffset: u.POSITIVE_INFINITY,
                        type: "audio"
                    }),
                    a.trigger(g.default.AUDIO_TRACK_SWITCHED, {
                        id: r
                    }),
                    this.altAudio = !1
                }
            }
            ,
            _.prototype.onAudioTrackSwitched = function(e) {
                var t = e.id
                  , r = !!this.hls.audioTracks[t].url;
                if (r) {
                    var i = this.videoBuffer;
                    i && this.mediaBuffer !== i && (v.logger.log("switching on alternate audio, use video.buffered to schedule main fragment loading"),
                    this.mediaBuffer = i)
                }
                this.altAudio = r,
                this.tick()
            }
            ,
            _.prototype.onBufferCreated = function(e) {
                var t, r, i = e.tracks, a = !1;
                for (var n in i) {
                    var o = i[n];
                    "main" === o.id ? (t = o,
                    "video" === (r = n) && (this.videoBuffer = i[n].buffer)) : a = !0
                }
                a && t ? (v.logger.log("alternate track found, use " + r + ".buffered to schedule main fragment loading"),
                this.mediaBuffer = t.buffer) : this.mediaBuffer = this.media
            }
            ,
            _.prototype.onBufferAppended = function(e) {
                if ("main" === e.parent) {
                    var t = this.state;
                    t !== E.State.PARSING && t !== E.State.PARSED || (this.pendingBuffering = 0 < e.pending,
                    this._checkAppendedParsed())
                }
            }
            ,
            _.prototype._checkAppendedParsed = function() {
                if (!(this.state !== E.State.PARSED || this.appended && this.pendingBuffering)) {
                    var e = this.fragCurrent;
                    if (e) {
                        var t = this.mediaBuffer ? this.mediaBuffer : this.media;
                        v.logger.log("main buffered : " + n.default.toString(t.buffered)),
                        this.fragPrevious = e;
                        var r = this.stats;
                        r.tbuffered = window.performance.now(),
                        this.fragLastKbps = Math.round(8 * r.total / (r.tbuffered - r.tfirst)),
                        this.hls.trigger(g.default.FRAG_BUFFERED, {
                            stats: r,
                            frag: e,
                            id: "main"
                        }),
                        this.state = E.State.IDLE
                    }
                    this.tick()
                }
            }
            ,
            _.prototype.onError = function(e) {
                var t = e.frag || this.fragCurrent;
                if (!t || "main" === t.type) {
                    var r = !!this.media && c.BufferHelper.isBuffered(this.media, this.media.currentTime) && c.BufferHelper.isBuffered(this.media, this.media.currentTime + .5);
                    switch (e.details) {
                    case o.ErrorDetails.FRAG_LOAD_ERROR:
                    case o.ErrorDetails.FRAG_LOAD_TIMEOUT:
                    case o.ErrorDetails.KEY_LOAD_ERROR:
                    case o.ErrorDetails.KEY_LOAD_TIMEOUT:
                        if (!e.fatal)
                            if (this.fragLoadError + 1 <= this.config.fragLoadingMaxRetry) {
                                var i = Math.min(Math.pow(2, this.fragLoadError) * this.config.fragLoadingRetryDelay, this.config.fragLoadingMaxRetryTimeout);
                                v.logger.warn("mediaController: frag loading failed, retry in " + i + " ms"),
                                this.retryDate = window.performance.now() + i,
                                this.loadedmetadata || (this.startFragRequested = !1,
                                this.nextLoadPosition = this.startPosition),
                                this.fragLoadError++,
                                this.state = E.State.FRAG_LOADING_WAITING_RETRY
                            } else
                                v.logger.error("mediaController: " + e.details + " reaches max retry, redispatch as fatal ..."),
                                e.fatal = !0,
                                this.state = E.State.ERROR;
                        break;
                    case o.ErrorDetails.LEVEL_LOAD_ERROR:
                    case o.ErrorDetails.LEVEL_LOAD_TIMEOUT:
                        this.state !== E.State.ERROR && (e.fatal ? (this.state = E.State.ERROR,
                        v.logger.warn("streamController: " + e.details + ",switch to " + this.state + " state ...")) : e.levelRetry || this.state !== E.State.WAITING_LEVEL || (this.state = E.State.IDLE));
                        break;
                    case o.ErrorDetails.BUFFER_FULL_ERROR:
                        "main" !== e.parent || this.state !== E.State.PARSING && this.state !== E.State.PARSED || (r ? (this._reduceMaxBufferLength(this.config.maxBufferLength),
                        this.state = E.State.IDLE) : (v.logger.warn("buffer full error also media.currentTime is not buffered, flush everything"),
                        this.fragCurrent = null,
                        this.flushMainBuffer(0, u.POSITIVE_INFINITY)))
                    }
                }
            }
            ,
            _.prototype._reduceMaxBufferLength = function(e) {
                var t = this.config;
                return t.maxMaxBufferLength >= e && (t.maxMaxBufferLength /= 2,
                v.logger.warn("main:reduce max buffer length to " + t.maxMaxBufferLength + "s"),
                !0)
            }
            ,
            _.prototype._checkBuffer = function() {
                var e = this.media;
                if (e && 0 !== e.readyState) {
                    var t = (this.mediaBuffer ? this.mediaBuffer : e).buffered;
                    !this.loadedmetadata && t.length ? (this.loadedmetadata = !0,
                    this._seekToStartPos()) : this.immediateSwitch ? this.immediateLevelSwitchEnd() : this.gapController.poll(this.lastCurrentTime, t)
                }
            }
            ,
            _.prototype.onFragLoadEmergencyAborted = function() {
                this.state = E.State.IDLE,
                this.loadedmetadata || (this.startFragRequested = !1,
                this.nextLoadPosition = this.startPosition),
                this.tick()
            }
            ,
            _.prototype.onBufferFlushed = function() {
                var e = this.mediaBuffer ? this.mediaBuffer : this.media;
                e && this.fragmentTracker.detectEvictedFragments(d.default.ElementaryStreamTypes.VIDEO, e.buffered),
                this.state = E.State.IDLE,
                this.fragPrevious = null
            }
            ,
            _.prototype.swapAudioCodec = function() {
                this.audioCodecSwap = !this.audioCodecSwap
            }
            ,
            _.prototype.computeLivePosition = function(e, t) {
                var r = void 0 !== this.config.liveSyncDuration ? this.config.liveSyncDuration : this.config.liveSyncDurationCount * t.targetduration;
                return e + Math.max(0, t.totalduration - r)
            }
            ,
            _.prototype._seekToStartPos = function() {
                var e = this.media
                  , t = e.currentTime
                  , r = e.seeking ? t : this.startPosition;
                t !== r && (v.logger.log("target start position not buffered, seek to buffered.start(0) " + r + " from current time " + t + " "),
                e.currentTime = r)
            }
            ,
            _.prototype._getAudioCodec = function(e) {
                var t = this.config.defaultAudioCodec || e.audioCodec;
                return this.audioCodecSwap && (v.logger.log("swapping playlist audio codec"),
                t = t && (-1 !== t.indexOf("mp4a.40.5") ? "mp4a.40.2" : "mp4a.40.5")),
                t
            }
            ,
            Object.defineProperty(_.prototype, "liveSyncPosition", {
                get: function() {
                    return this._liveSyncPosition
                },
                set: function(e) {
                    this._liveSyncPosition = e
                },
                enumerable: !0,
                configurable: !0
            }),
            _);
            function _(e, t) {
                var r = a.call(this, e, g.default.MEDIA_ATTACHED, g.default.MEDIA_DETACHING, g.default.MANIFEST_LOADING, g.default.MANIFEST_PARSED, g.default.LEVEL_LOADED, g.default.KEY_LOADED, g.default.FRAG_LOADED, g.default.FRAG_LOAD_EMERGENCY_ABORTED, g.default.FRAG_PARSING_INIT_SEGMENT, g.default.FRAG_PARSING_DATA, g.default.FRAG_PARSED, g.default.ERROR, g.default.AUDIO_TRACK_SWITCHING, g.default.AUDIO_TRACK_SWITCHED, g.default.BUFFER_CREATED, g.default.BUFFER_APPENDED, g.default.BUFFER_FLUSHED) || this;
                return r.fragmentTracker = t,
                r.config = e.config,
                r.audioCodecSwap = !1,
                r._state = E.State.STOPPED,
                r.stallReported = !1,
                r.gapController = null,
                r
            }
            S.default = l
        }
        ).call(this, T(2).Number)
    }
    , function(e, t, h) {
        function s(r) {
            var i = {};
            function a(e) {
                if (i[e])
                    return i[e].exports;
                var t = i[e] = {
                    i: e,
                    l: !1,
                    exports: {}
                };
                return r[e].call(t.exports, t, t.exports, a),
                t.l = !0,
                t.exports
            }
            a.m = r,
            a.c = i,
            a.i = function(e) {
                return e
            }
            ,
            a.d = function(e, t, r) {
                a.o(e, t) || Object.defineProperty(e, t, {
                    configurable: !1,
                    enumerable: !0,
                    get: r
                })
            }
            ,
            a.r = function(e) {
                Object.defineProperty(e, "__esModule", {
                    value: !0
                })
            }
            ,
            a.n = function(e) {
                var t = e && e.__esModule ? function() {
                    return e.default
                }
                : function() {
                    return e
                }
                ;
                return a.d(t, "a", t),
                t
            }
            ,
            a.o = function(e, t) {
                return Object.prototype.hasOwnProperty.call(e, t)
            }
            ,
            a.p = "/",
            a.oe = function(e) {
                throw console.error(e),
                e
            }
            ;
            var e = a(a.s = ENTRY_MODULE);
            return e.default || e
        }
        var p = "[\\.|\\-|\\+|\\w|/|@]+"
          , g = "\\((/\\*.*?\\*/)?s?.*?(" + p + ").*?\\)";
        function v(e) {
            return (e + "").replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")
        }
        function c(e, t, r) {
            var i = {};
            i[r] = [];
            var a, n = t.toString(), o = n.match(/^function\s?\(\w+,\s*\w+,\s*(\w+)\)/);
            if (!o)
                return i;
            for (var s, l = o[1], u = new RegExp("(\\\\n|\\W)" + v(l) + g,"g"); s = u.exec(n); )
                "dll-reference" !== s[3] && i[r].push(s[3]);
            for (u = new RegExp("\\(" + v(l) + '\\("(dll-reference\\s(' + p + '))"\\)\\)' + g,"g"); s = u.exec(n); )
                e[s[2]] || (i[r].push(s[1]),
                e[s[2]] = h(s[1]).m),
                i[s[2]] = i[s[2]] || [],
                i[s[2]].push(s[4]);
            for (var d = Object.keys(i), f = 0; f < d.length; f++)
                for (var c = 0; c < i[d[f]].length; c++)
                    a = i[d[f]][c],
                    isNaN(1 * a) || (i[d[f]][c] = 1 * i[d[f]][c]);
            return i
        }
        function y(r) {
            return Object.keys(r).reduce(function(e, t) {
                return e || 0 < r[t].length
            }, !1)
        }
        e.exports = function(f, e) {
            e = e || {};
            var r = {
                main: h.m
            }
              , i = e.all ? {
                main: Object.keys(r.main)
            } : function(e) {
                for (var t = {
                    main: [f]
                }, r = {
                    main: []
                }, i = {
                    main: {}
                }; y(t); )
                    for (var a = Object.keys(t), n = 0; n < a.length; n++) {
                        var o = a[n]
                          , s = t[o].pop();
                        if (i[o] = i[o] || {},
                        !i[o][s] && e[o][s]) {
                            i[o][s] = !0,
                            r[o] = r[o] || [],
                            r[o].push(s);
                            for (var l = c(e, e[o][s], o), u = Object.keys(l), d = 0; d < u.length; d++)
                                t[u[d]] = t[u[d]] || [],
                                t[u[d]] = t[u[d]].concat(l[u[d]])
                        }
                    }
                return r
            }(r)
              , a = "";
            Object.keys(i).filter(function(e) {
                return "main" !== e
            }).forEach(function(t) {
                for (var e = 0; i[t][e]; )
                    e++;
                i[t].push(e),
                r[t][e] = "(function(module, exports, __webpack_require__) { module.exports = __webpack_require__; })",
                a = a + "var " + t + " = (" + s.toString().replace("ENTRY_MODULE", JSON.stringify(e)) + ")({" + i[t].map(function(e) {
                    return JSON.stringify(e) + ": " + r[t][e].toString()
                }).join(",") + "});\n"
            }),
            a = a + "new ((" + s.toString().replace("ENTRY_MODULE", JSON.stringify(f)) + ")({" + i.main.map(function(e) {
                return JSON.stringify(e) + ": " + r.main[e].toString()
            }).join(",") + "}))(self);";
            var t = new window.Blob([a],{
                type: "text/javascript"
            });
            if (e.bare)
                return t;
            var n = (window.URL || window.webkitURL || window.mozURL || window.msURL).createObjectURL(t)
              , o = new window.Worker(n);
            return o.objectURL = n,
            o
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = (a.prototype.decrypt = function(e, t) {
            return this.subtle.decrypt({
                name: "AES-CBC",
                iv: this.aesIV
            }, t, e)
        }
        ,
        a);
        function a(e, t) {
            this.subtle = e,
            this.aesIV = t
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = (a.prototype.expandKey = function() {
            return this.subtle.importKey("raw", this.key, {
                name: "AES-CBC"
            }, !1, ["encrypt", "decrypt"])
        }
        ,
        a);
        function a(e, t) {
            this.subtle = e,
            this.key = t
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        function F(e) {
            var t = e.byteLength
              , r = t && new DataView(e).getUint8(t - 1);
            return r ? e.slice(0, t - r) : e
        }
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.removePadding = F;
        var i = (a.prototype.uint8ArrayToUint32Array_ = function(e) {
            for (var t = new DataView(e), r = new Uint32Array(4), i = 0; i < 4; i++)
                r[i] = t.getUint32(4 * i);
            return r
        }
        ,
        a.prototype.initTable = function() {
            var e = this.sBox
              , t = this.invSBox
              , r = this.subMix
              , i = r[0]
              , a = r[1]
              , n = r[2]
              , o = r[3]
              , s = this.invSubMix
              , l = s[0]
              , u = s[1]
              , d = s[2]
              , f = s[3]
              , c = new Uint32Array(256)
              , h = 0
              , p = 0
              , g = 0;
            for (g = 0; g < 256; g++)
                c[g] = g < 128 ? g << 1 : g << 1 ^ 283;
            for (g = 0; g < 256; g++) {
                var v = p ^ p << 1 ^ p << 2 ^ p << 3 ^ p << 4;
                v = v >>> 8 ^ 255 & v ^ 99;
                var y = c[t[e[h] = v] = h]
                  , m = c[y]
                  , E = c[m]
                  , _ = 257 * c[v] ^ 16843008 * v;
                i[h] = _ << 24 | _ >>> 8,
                a[h] = _ << 16 | _ >>> 16,
                n[h] = _ << 8 | _ >>> 24,
                o[h] = _,
                _ = 16843009 * E ^ 65537 * m ^ 257 * y ^ 16843008 * h,
                l[v] = _ << 24 | _ >>> 8,
                u[v] = _ << 16 | _ >>> 16,
                d[v] = _ << 8 | _ >>> 24,
                f[v] = _,
                h ? (h = y ^ c[c[c[E ^ y]]],
                p ^= c[c[p]]) : h = p = 1
            }
        }
        ,
        a.prototype.expandKey = function(e) {
            for (var t = this.uint8ArrayToUint32Array_(e), r = !0, i = 0; i < t.length && r; )
                r = t[i] === this.key[i],
                i++;
            if (!r) {
                this.key = t;
                var a = this.keySize = t.length;
                if (4 !== a && 6 !== a && 8 !== a)
                    throw new Error("Invalid aes key size=" + a);
                var n, o, s, l, u = this.ksRows = 4 * (a + 6 + 1), d = this.keySchedule = new Uint32Array(u), f = this.invKeySchedule = new Uint32Array(u), c = this.sBox, h = this.rcon, p = this.invSubMix, g = p[0], v = p[1], y = p[2], m = p[3];
                for (n = 0; n < u; n++)
                    n < a ? s = d[n] = t[n] : (l = s,
                    n % a == 0 ? (l = c[(l = l << 8 | l >>> 24) >>> 24] << 24 | c[l >>> 16 & 255] << 16 | c[l >>> 8 & 255] << 8 | c[255 & l],
                    l ^= h[n / a | 0] << 24) : 6 < a && n % a == 4 && (l = c[l >>> 24] << 24 | c[l >>> 16 & 255] << 16 | c[l >>> 8 & 255] << 8 | c[255 & l]),
                    d[n] = s = (d[n - a] ^ l) >>> 0);
                for (o = 0; o < u; o++)
                    n = u - o,
                    l = 3 & o ? d[n] : d[n - 4],
                    f[o] = o < 4 || n <= 4 ? l : g[c[l >>> 24]] ^ v[c[l >>> 16 & 255]] ^ y[c[l >>> 8 & 255]] ^ m[c[255 & l]],
                    f[o] = f[o] >>> 0
            }
        }
        ,
        a.prototype.networkToHostOrderSwap = function(e) {
            return e << 24 | (65280 & e) << 8 | (16711680 & e) >> 8 | e >>> 24
        }
        ,
        a.prototype.decrypt = function(e, t, r, i) {
            for (var a, n, o, s, l, u, d, f, c, h, p, g, v, y, m = this.keySize + 6, E = this.invKeySchedule, _ = this.invSBox, S = this.invSubMix, T = S[0], b = S[1], A = S[2], R = S[3], D = this.uint8ArrayToUint32Array_(r), L = D[0], O = D[1], w = D[2], I = D[3], P = new Int32Array(e), k = new Int32Array(P.length), C = this.networkToHostOrderSwap; t < P.length; ) {
                for (c = C(P[t]),
                h = C(P[t + 1]),
                p = C(P[t + 2]),
                g = C(P[t + 3]),
                l = c ^ E[0],
                u = g ^ E[1],
                d = p ^ E[2],
                f = h ^ E[3],
                v = 4,
                y = 1; y < m; y++)
                    a = T[l >>> 24] ^ b[u >> 16 & 255] ^ A[d >> 8 & 255] ^ R[255 & f] ^ E[v],
                    n = T[u >>> 24] ^ b[d >> 16 & 255] ^ A[f >> 8 & 255] ^ R[255 & l] ^ E[v + 1],
                    o = T[d >>> 24] ^ b[f >> 16 & 255] ^ A[l >> 8 & 255] ^ R[255 & u] ^ E[v + 2],
                    s = T[f >>> 24] ^ b[l >> 16 & 255] ^ A[u >> 8 & 255] ^ R[255 & d] ^ E[v + 3],
                    l = a,
                    u = n,
                    d = o,
                    f = s,
                    v += 4;
                a = _[l >>> 24] << 24 ^ _[u >> 16 & 255] << 16 ^ _[d >> 8 & 255] << 8 ^ _[255 & f] ^ E[v],
                n = _[u >>> 24] << 24 ^ _[d >> 16 & 255] << 16 ^ _[f >> 8 & 255] << 8 ^ _[255 & l] ^ E[v + 1],
                o = _[d >>> 24] << 24 ^ _[f >> 16 & 255] << 16 ^ _[l >> 8 & 255] << 8 ^ _[255 & u] ^ E[v + 2],
                s = _[f >>> 24] << 24 ^ _[l >> 16 & 255] << 16 ^ _[u >> 8 & 255] << 8 ^ _[255 & d] ^ E[v + 3],
                v += 3,
                k[t] = C(a ^ L),
                k[t + 1] = C(s ^ O),
                k[t + 2] = C(o ^ w),
                k[t + 3] = C(n ^ I),
                L = c,
                O = h,
                w = p,
                I = g,
                t += 4
            }
            return i ? F(k.buffer) : k.buffer
        }
        ,
        a.prototype.destroy = function() {
            this.key = void 0,
            this.keySize = void 0,
            this.ksRows = void 0,
            this.sBox = void 0,
            this.invSBox = void 0,
            this.subMix = void 0,
            this.invSubMix = void 0,
            this.keySchedule = void 0,
            this.invKeySchedule = void 0,
            this.rcon = void 0
        }
        ,
        a);
        function a() {
            this.rcon = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54],
            this.subMix = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)],
            this.invSubMix = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)],
            this.sBox = new Uint32Array(256),
            this.invSBox = new Uint32Array(256),
            this.key = new Uint32Array(0),
            this.initTable()
        }
        t.default = i
    }
    , function(e, r, i) {
        "use strict";
        (function(p) {
            Object.defineProperty(r, "__esModule", {
                value: !0
            });
            var g = i(22)
              , v = i(0)
              , y = i(11)
              , e = (t.prototype.resetInitSegment = function(e, t, r, i) {
                this._audioTrack = {
                    container: "audio/adts",
                    type: "audio",
                    id: 0,
                    sequenceNumber: 0,
                    isAAC: !0,
                    samples: [],
                    len: 0,
                    manifestCodec: t,
                    duration: i,
                    inputTimeScale: 9e4
                }
            }
            ,
            t.prototype.resetTimeStamp = function() {}
            ,
            t.probe = function(e) {
                if (!e)
                    return !1;
                for (var t = (y.default.getID3Data(e, 0) || []).length, r = e.length; t < r; t++)
                    if (g.probe(e, t))
                        return v.logger.log("ADTS sync word found !"),
                        !0;
                return !1
            }
            ,
            t.prototype.append = function(e, t, r, i) {
                for (var a = this._audioTrack, n = y.default.getID3Data(e, 0) || [], o = y.default.getTimeStamp(n), s = p.isFinite(o) ? 90 * o : 9e4 * t, l = 0, u = s, d = e.length, f = n.length, c = [{
                    pts: u,
                    dts: u,
                    data: n
                }]; f < d - 1; )
                    if (g.isHeader(e, f) && f + 5 < d) {
                        g.initTrackConfig(a, this.observer, e, f, a.manifestCodec);
                        var h = g.appendFrame(a, e, f, s, l);
                        if (!h) {
                            v.logger.log("Unable to parse AAC frame");
                            break
                        }
                        f += h.length,
                        u = h.sample.pts,
                        l++
                    } else
                        y.default.isHeader(e, f) ? (n = y.default.getID3Data(e, f),
                        c.push({
                            pts: u,
                            dts: u,
                            data: n
                        }),
                        f += n.length) : f++;
                this.remuxer.remux(a, {
                    samples: []
                }, {
                    samples: c,
                    inputTimeScale: 9e4
                }, {
                    samples: []
                }, t, r, i)
            }
            ,
            t.prototype.destroy = function() {}
            ,
            t);
            function t(e, t, r) {
                this.observer = e,
                this.config = r,
                this.remuxer = t
            }
            r.default = e
        }
        ).call(this, i(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var v = r(22)
          , s = r(23)
          , P = r(1)
          , R = r(44)
          , i = r(45)
          , k = r(0)
          , C = r(3)
          , a = {
            video: 1,
            audio: 2,
            id3: 3,
            text: 4
        }
          , F = !1
          , n = (M.prototype.setDecryptData = function(e) {
            null != e && null != e.key && "SAMPLE-AES" === e.method ? this.sampleAes = new i.default(this.observer,this.config,e,this.discardEPB) : this.sampleAes = null
        }
        ,
        M.probe = function(e) {
            var t = M._syncOffset(e);
            return !(t < 0 || (t && k.logger.warn("MPEG2-TS detected but first sync word found @ offset " + t + ", junk ahead ?"),
            0))
        }
        ,
        M._syncOffset = function(e) {
            for (var t = Math.min(1e3, e.length - 564), r = 0; r < t; ) {
                if (71 === e[r] && 71 === e[r + 188] && 71 === e[r + 376])
                    return r;
                r++
            }
            return -1
        }
        ,
        M.createTrack = function(e, t) {
            return {
                container: "video" === e || "audio" === e ? "video/mp2t" : void 0,
                type: e,
                id: a[e],
                pid: -1,
                inputTimeScale: 9e4,
                sequenceNumber: 0,
                samples: [],
                len: 0,
                dropped: "video" === e ? 0 : void 0,
                isAAC: "audio" === e || void 0,
                duration: "audio" === e ? t : void 0
            }
        }
        ,
        M.prototype.resetInitSegment = function(e, t, r, i) {
            this.pmtParsed = !1,
            this._pmtId = -1,
            this._avcTrack = M.createTrack("video", i),
            this._audioTrack = M.createTrack("audio", i),
            this._id3Track = M.createTrack("id3", i),
            this._txtTrack = M.createTrack("text", i),
            this.aacOverFlow = null,
            this.aacLastPTS = null,
            this.avcSample = null,
            this.audioCodec = t,
            this.videoCodec = r,
            this._duration = i
        }
        ,
        M.prototype.resetTimeStamp = function() {}
        ,
        M.prototype.append = function(e, t, r, i) {
            var a, n, o, s, l, u = e.length, d = !1;
            this.contiguous = r;
            var f = this.pmtParsed
              , c = this._avcTrack
              , h = this._audioTrack
              , p = this._id3Track
              , g = c.pid
              , v = h.pid
              , y = p.pid
              , m = this._pmtId
              , E = c.pesData
              , _ = h.pesData
              , S = p.pesData
              , T = this._parsePAT
              , b = this._parsePMT
              , A = this._parsePES
              , R = this._parseAVCPES.bind(this)
              , D = this._parseAACPES.bind(this)
              , L = this._parseMPEGPES.bind(this)
              , O = this._parseID3PES.bind(this)
              , w = M._syncOffset(e);
            for (F = !1,
            u -= (u + w) % 188,
            a = w; a < u; a += 188)
                if (71 === e[a]) {
                    if (n = !!(64 & e[a + 1]),
                    o = ((31 & e[a + 1]) << 8) + e[a + 2],
                    1 < (48 & e[a + 3]) >> 4) {
                        if ((s = a + 5 + e[a + 4]) === a + 188)
                            continue
                    } else
                        s = a + 4;
                    switch (o) {
                    case g:
                        n && (E && (l = A(E)) && void 0 !== l.pts && R(l, !1),
                        E = {
                            data: [],
                            size: 0
                        }),
                        E && (E.data.push(e.subarray(s, a + 188)),
                        E.size += a + 188 - s);
                        break;
                    case v:
                        n && (_ && (l = A(_)) && void 0 !== l.pts && (h.isAAC ? D(l) : L(l)),
                        _ = {
                            data: [],
                            size: 0
                        }),
                        _ && (_.data.push(e.subarray(s, a + 188)),
                        _.size += a + 188 - s);
                        break;
                    case y:
                        n && (S && (l = A(S)) && void 0 !== l.pts && O(l),
                        S = {
                            data: [],
                            size: 0
                        }),
                        S && (S.data.push(e.subarray(s, a + 188)),
                        S.size += a + 188 - s);
                        break;
                    case 0:
                        n && (s += e[s] + 1),
                        m = this._pmtId = T(e, s);
                        break;
                    case m:
                        n && (s += e[s] + 1);
                        var I = b(e, s, !0 === this.typeSupported.mpeg || !0 === this.typeSupported.mp3, null != this.sampleAes);
                        0 < (g = I.avc) && (c.pid = g),
                        0 < (v = I.audio) && (h.pid = v,
                        h.isAAC = I.isAAC),
                        0 < (y = I.id3) && (p.pid = y),
                        d && !f && (k.logger.log("reparse from beginning"),
                        d = !1,
                        a = w - 188),
                        f = this.pmtParsed = !0;
                        break;
                    case 17:
                    case 8191:
                        break;
                    default:
                        d = !0
                    }
                } else
                    this.observer.trigger(P.default.ERROR, {
                        type: C.ErrorTypes.MEDIA_ERROR,
                        details: C.ErrorDetails.FRAG_PARSING_ERROR,
                        fatal: !1,
                        reason: "TS packet did not start with 0x47"
                    });
            this.tsForRemux(h, c, p, _, E, S, l, t, r, i)
        }
        ,
        M.prototype.tsForRemux = function(e, t, r, i, a, n, o, s, l, u) {
            var d = this._parsePES
              , f = this._parseAVCPES.bind(this)
              , c = this._parseAACPES.bind(this)
              , h = this._parseMPEGPES.bind(this)
              , p = this._parseID3PES.bind(this);
            a && (o = d(a)) && void 0 !== o.pts ? (f(o, !0),
            t.pesData = null) : t.pesData = a,
            i && (o = d(i)) && void 0 !== o.pts ? (e.isAAC ? c(o) : h(o),
            e.pesData = null) : (i && i.size && k.logger.log("last AAC PES packet truncated,might overlap between fragments"),
            e.pesData = i),
            n && (o = d(n)) && void 0 !== o.pts ? (p(o),
            r.pesData = null) : r.pesData = n,
            null == this.sampleAes ? this.remuxer.remux(e, t, r, this._txtTrack, s, l, u) : this.decryptAndRemux(e, t, r, this._txtTrack, s, l, u)
        }
        ,
        M.prototype.decryptAndRemux = function(e, t, r, i, a, n, o) {
            if (e.samples && e.isAAC) {
                var s = this;
                this.sampleAes.decryptAacSamples(e.samples, 0, function() {
                    s.decryptAndRemuxAvc(e, t, r, i, a, n, o)
                })
            } else
                this.decryptAndRemuxAvc(e, t, r, i, a, n, o)
        }
        ,
        M.prototype.decryptAndRemuxAvc = function(e, t, r, i, a, n, o) {
            if (t.samples) {
                var s = this;
                this.sampleAes.decryptAvcSamples(t.samples, 0, 0, function() {
                    s.remuxer.remux(e, t, r, i, a, n, o)
                })
            } else
                this.remuxer.remux(e, t, r, i, a, n, o)
        }
        ,
        M.prototype.destroy = function() {
            this._initPTS = this._initDTS = void 0,
            this._duration = 0
        }
        ,
        M.prototype._parsePAT = function(e, t) {
            return (31 & e[t + 10]) << 8 | e[t + 11]
        }
        ,
        M.prototype._parsePMT = function(e, t, r, i) {
            var a, n, o = {
                audio: -1,
                avc: -1,
                id3: -1,
                isAAC: !0
            };
            for (a = t + 3 + ((15 & e[t + 1]) << 8 | e[t + 2]) - 4,
            t += 12 + ((15 & e[t + 10]) << 8 | e[t + 11]); t < a; ) {
                switch (n = (31 & e[t + 1]) << 8 | e[t + 2],
                e[t]) {
                case 207:
                    if (!i) {
                        k.logger.log("unkown stream type:" + e[t]);
                        break
                    }
                case 15:
                    -1 === o.audio && (o.audio = n);
                    break;
                case 21:
                    -1 === o.id3 && (o.id3 = n);
                    break;
                case 219:
                    if (!i) {
                        k.logger.log("unkown stream type:" + e[t]);
                        break
                    }
                case 27:
                    -1 === o.avc && (o.avc = n);
                    break;
                case 3:
                case 4:
                    r ? -1 === o.audio && (o.audio = n,
                    o.isAAC = !1) : k.logger.log("MPEG audio found, not supported in this browser for now");
                    break;
                case 36:
                    k.logger.warn("HEVC stream type found, not supported for now");
                    break;
                default:
                    k.logger.log("unkown stream type:" + e[t])
                }
                t += 5 + ((15 & e[t + 3]) << 8 | e[t + 4])
            }
            return o
        }
        ,
        M.prototype._parsePES = function(e) {
            var t, r, i, a, n, o, s, l, u = 0, d = e.data;
            if (!e || 0 === e.size)
                return null;
            for (; d[0].length < 19 && 1 < d.length; ) {
                var f = new Uint8Array(d[0].length + d[1].length);
                f.set(d[0]),
                f.set(d[1], d[0].length),
                d[0] = f,
                d.splice(1, 1)
            }
            if (1 !== ((t = d[0])[0] << 16) + (t[1] << 8) + t[2])
                return null;
            if ((i = (t[4] << 8) + t[5]) && i > e.size - 6)
                return null;
            192 & (r = t[7]) && (4294967295 < (o = 536870912 * (14 & t[9]) + 4194304 * (255 & t[10]) + 16384 * (254 & t[11]) + 128 * (255 & t[12]) + (254 & t[13]) / 2) && (o -= 8589934592),
            64 & r ? (4294967295 < (s = 536870912 * (14 & t[14]) + 4194304 * (255 & t[15]) + 16384 * (254 & t[16]) + 128 * (255 & t[17]) + (254 & t[18]) / 2) && (s -= 8589934592),
            54e5 < o - s && (k.logger.warn(Math.round((o - s) / 9e4) + "s delta between PTS and DTS, align them"),
            o = s)) : s = o),
            l = (a = t[8]) + 9,
            e.size -= l,
            n = new Uint8Array(e.size);
            for (var c = 0, h = d.length; c < h; c++) {
                var p = (t = d[c]).byteLength;
                if (l) {
                    if (p < l) {
                        l -= p;
                        continue
                    }
                    t = t.subarray(l),
                    p -= l,
                    l = 0
                }
                n.set(t, u),
                u += p
            }
            return i && (i -= a + 3),
            {
                data: n,
                pts: o,
                dts: s,
                len: i
            }
        }
        ,
        M.prototype.pushAccesUnit = function(e, t) {
            if (e.units.length && e.frame) {
                var r = t.samples
                  , i = r.length;
                !this.config.forceKeyFrameOnDiscontinuity || !0 === e.key || t.sps && (i || this.contiguous) ? (e.id = i,
                r.push(e)) : t.dropped++
            }
            e.debug.length && k.logger.log(e.pts + "/" + e.dts + ":" + e.debug)
        }
        ,
        M.prototype._parseAVCPES = function(p, e) {
            function g(e, t, r, i) {
                return {
                    key: e,
                    pts: t,
                    dts: r,
                    units: [],
                    debug: i
                }
            }
            var v, y, m, E = this, _ = this._avcTrack, t = this._parseAVCNALu(p.data), S = this.avcSample, T = !1, b = !1, A = this.pushAccesUnit.bind(this);
            return p.data = null,
            S && t.length && !_.audFound && (A(S, _),
            S = this.avcSample = g(!1, p.pts, p.dts, "")),
            t.forEach(function(e) {
                switch (5 !== e.type && 1 !== e.type || F && Module && (e.data = function(e) {
                    var t = 0
                      , r = 0;
                    try {
                        t = Module._jsmalloc(e.byteLength + 128);
                        for (var i = 0; i < e.byteLength; i++)
                            Module.HEAP8[t + i] = e[i];
                        r = Module._nalplay2(t, e.byteLength);
                        for (var a = new Uint8Array(r), n = 0; n < a.byteLength; n++)
                            a[n] = Module.HEAP8[t + n]
                    } catch (e) {}
                    return Module._jsfree(t),
                    t = null,
                    a
                }(e.data)),
                e.type) {
                case 1:
                    y = !0,
                    (S = S || (E.avcSample = g(!0, p.pts, p.dts, ""))).frame = !0;
                    var t = e.data;
                    if (T && 4 < t.length) {
                        var r = new R.default(t).readSliceType();
                        2 !== r && 4 !== r && 7 !== r && 9 !== r || (S.key = !0)
                    }
                    break;
                case 5:
                    y = b = !0,
                    (S = S || (E.avcSample = g(!0, p.pts, p.dts, ""))).key = !0,
                    S.frame = !0;
                    break;
                case 6:
                    y = !0,
                    (v = new R.default(E.discardEPB(e.data))).readUByte();
                    for (var i = 0, a = 0, n = !1, o = 0; !n && 1 < v.bytesAvailable; ) {
                        for (i = 0; i += o = v.readUByte(),
                        255 === o; )
                            ;
                        for (a = 0; a += o = v.readUByte(),
                        255 === o; )
                            ;
                        if (4 === i && 0 !== v.bytesAvailable) {
                            if (n = !0,
                            181 === v.readUByte() && 49 === v.readUShort() && 1195456820 === v.readUInt() && 3 === v.readUByte()) {
                                var s = v.readUByte()
                                  , l = 31 & s
                                  , u = [s, v.readUByte()];
                                for (m = 0; m < l; m++)
                                    u.push(v.readUByte()),
                                    u.push(v.readUByte()),
                                    u.push(v.readUByte());
                                E._insertSampleInOrder(E._txtTrack.samples, {
                                    type: 3,
                                    pts: p.pts,
                                    bytes: u
                                })
                            }
                        } else if (a < v.bytesAvailable)
                            for (m = 0; m < a; m++)
                                v.readUByte()
                    }
                    break;
                case 7:
                    if (T = y = !0,
                    F = F || 1 == (1 & e.data[2]),
                    e.data[2] = 254 & e.data[2],
                    !_.sps) {
                        var d = (v = new R.default(e.data)).readSPS();
                        _.width = d.width,
                        _.height = d.height,
                        _.pixelRatio = d.pixelRatio,
                        _.sps = [e.data],
                        _.duration = E._duration;
                        var f = e.data.subarray(1, 4)
                          , c = "avc1.";
                        for (m = 0; m < 3; m++) {
                            var h = f[m].toString(16);
                            h.length < 2 && (h = "0" + h),
                            c += h
                        }
                        _.codec = c
                    }
                    break;
                case 8:
                    y = !0,
                    _.pps || (_.pps = [e.data]);
                    break;
                case 9:
                    y = !1,
                    _.audFound = !0,
                    S && A(S, _),
                    S = E.avcSample = g(!1, p.pts, p.dts, "");
                    break;
                case 12:
                    y = !1;
                    break;
                default:
                    y = !1,
                    S && (S.debug += "unknown NAL " + e.type + " ")
                }
                S && y && S.units.push(e)
            }),
            e && S && (A(S, _),
            this.avcSample = null),
            b
        }
        ,
        M.prototype._insertSampleInOrder = function(e, t) {
            var r = e.length;
            if (0 < r) {
                if (t.pts >= e[r - 1].pts)
                    e.push(t);
                else
                    for (var i = r - 1; 0 <= i; i--)
                        if (t.pts < e[i].pts) {
                            e.splice(i, 0, t);
                            break
                        }
            } else
                e.push(t)
        }
        ,
        M.prototype._getLastNalUnit = function() {
            var e, t = this.avcSample;
            if (!t || 0 === t.units.length) {
                var r = this._avcTrack.samples;
                t = r[r.length - 1]
            }
            if (t) {
                var i = t.units;
                e = i[i.length - 1]
            }
            return e
        }
        ,
        M.prototype._parseAVCNALu = function(e) {
            var t, r, i, a, n = 0, o = e.byteLength, s = this._avcTrack, l = s.naluState || 0, u = l, d = [], f = -1;
            for (-1 === l && (a = 31 & e[f = 0],
            l = 0,
            n = 1); n < o; )
                if (t = e[n++],
                l)
                    if (1 !== l)
                        if (t)
                            if (1 === t) {
                                var c, h;
                                0 <= f ? (i = {
                                    data: e.subarray(f, n - l - 1),
                                    type: a
                                },
                                d.push(i)) : (c = this._getLastNalUnit()) && (u && n <= 4 - u && c.state && (c.data = c.data.subarray(0, c.data.byteLength - u)),
                                0 < (r = n - l - 1) && ((h = new Uint8Array(c.data.byteLength + r)).set(c.data, 0),
                                h.set(e.subarray(0, r), c.data.byteLength),
                                c.data = h)),
                                l = n < o ? (a = 31 & e[f = n],
                                0) : -1
                            } else
                                l = 0;
                        else
                            l = 3;
                    else
                        l = t ? 0 : 2;
                else
                    l = t ? 0 : 1;
            return 0 <= f && 0 <= l && (i = {
                data: e.subarray(f, o),
                type: a,
                state: l
            },
            d.push(i)),
            0 === d.length && (c = this._getLastNalUnit()) && ((h = new Uint8Array(c.data.byteLength + e.byteLength)).set(c.data, 0),
            h.set(e, c.data.byteLength),
            c.data = h),
            s.naluState = l,
            d
        }
        ,
        M.prototype.discardEPB = function(e) {
            for (var t, r, i = e.byteLength, a = [], n = 1; n < i - 2; )
                0 === e[n] && 0 === e[n + 1] && 3 === e[n + 2] ? (a.push(n + 2),
                n += 2) : n++;
            if (0 === a.length)
                return e;
            t = i - a.length,
            r = new Uint8Array(t);
            var o = 0;
            for (n = 0; n < t; o++,
            n++)
                o === a[0] && (o++,
                a.shift()),
                r[n] = e[o];
            return r
        }
        ,
        M.prototype._parseAACPES = function(e) {
            var t, r, i, a, n, o = this._audioTrack, s = e.data, l = e.pts, u = this.aacOverFlow, d = this.aacLastPTS;
            if (u) {
                var f = new Uint8Array(u.byteLength + s.byteLength);
                f.set(u, 0),
                f.set(s, u.byteLength),
                s = f
            }
            for (i = 0,
            n = s.length; i < n - 1 && !v.isHeader(s, i); i++)
                ;
            if (i) {
                var c = void 0
                  , h = void 0;
                if (h = i < n - 1 ? (c = "AAC PES did not start with ADTS header,offset:" + i,
                !1) : (c = "no ADTS header found in AAC PES",
                !0),
                k.logger.warn("parsing error:" + c),
                this.observer.trigger(P.default.ERROR, {
                    type: C.ErrorTypes.MEDIA_ERROR,
                    details: C.ErrorDetails.FRAG_PARSING_ERROR,
                    fatal: h,
                    reason: c
                }),
                h)
                    return
            }
            if (v.initTrackConfig(o, this.observer, s, i, this.audioCodec),
            r = 0,
            t = v.getFrameDuration(o.samplerate),
            u && d) {
                var p = d + t;
                1 < Math.abs(p - l) && (k.logger.log("AAC: align PTS for overlapping frames by " + Math.round((p - l) / 90)),
                l = p)
            }
            for (; i < n; )
                if (v.isHeader(s, i) && i + 5 < n) {
                    var g = v.appendFrame(o, s, i, l, r);
                    if (!g)
                        break;
                    i += g.length,
                    a = g.sample.pts,
                    r++
                } else
                    i++;
            u = i < n ? s.subarray(i, n) : null,
            this.aacOverFlow = u,
            this.aacLastPTS = a
        }
        ,
        M.prototype._parseMPEGPES = function(e) {
            for (var t = e.data, r = t.length, i = 0, a = 0, n = e.pts; a < r; )
                if (s.default.isHeader(t, a)) {
                    var o = s.default.appendFrame(this._audioTrack, t, a, n, i);
                    if (!o)
                        break;
                    a += o.length,
                    i++
                } else
                    a++
        }
        ,
        M.prototype._parseID3PES = function(e) {
            this._id3Track.samples.push(e)
        }
        ,
        M);
        function M(e, t, r, i) {
            this.observer = e,
            this.config = r,
            this.typeSupported = i,
            this.remuxer = t,
            this.sampleAes = null
        }
        t.default = n
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = r(0)
          , a = (n.prototype.loadWord = function() {
            var e = this.data
              , t = this.bytesAvailable
              , r = e.byteLength - t
              , i = new Uint8Array(4)
              , a = Math.min(4, t);
            if (0 === a)
                throw new Error("no bytes available");
            i.set(e.subarray(r, r + a)),
            this.word = new DataView(i.buffer).getUint32(0),
            this.bitsAvailable = 8 * a,
            this.bytesAvailable -= a
        }
        ,
        n.prototype.skipBits = function(e) {
            var t;
            this.bitsAvailable > e || (e -= this.bitsAvailable,
            e -= (t = e >> 3) >> 3,
            this.bytesAvailable -= t,
            this.loadWord()),
            this.word <<= e,
            this.bitsAvailable -= e
        }
        ,
        n.prototype.readBits = function(e) {
            var t = Math.min(this.bitsAvailable, e)
              , r = this.word >>> 32 - t;
            return 32 < e && i.logger.error("Cannot read more than 32 bits at a time"),
            this.bitsAvailable -= t,
            0 < this.bitsAvailable ? this.word <<= t : 0 < this.bytesAvailable && this.loadWord(),
            0 < (t = e - t) && this.bitsAvailable ? r << t | this.readBits(t) : r
        }
        ,
        n.prototype.skipLZ = function() {
            var e;
            for (e = 0; e < this.bitsAvailable; ++e)
                if (0 != (this.word & 2147483648 >>> e))
                    return this.word <<= e,
                    this.bitsAvailable -= e,
                    e;
            return this.loadWord(),
            e + this.skipLZ()
        }
        ,
        n.prototype.skipUEG = function() {
            this.skipBits(1 + this.skipLZ())
        }
        ,
        n.prototype.skipEG = function() {
            this.skipBits(1 + this.skipLZ())
        }
        ,
        n.prototype.readUEG = function() {
            var e = this.skipLZ();
            return this.readBits(e + 1) - 1
        }
        ,
        n.prototype.readEG = function() {
            var e = this.readUEG();
            return 1 & e ? 1 + e >>> 1 : -1 * (e >>> 1)
        }
        ,
        n.prototype.readBoolean = function() {
            return 1 === this.readBits(1)
        }
        ,
        n.prototype.readUByte = function() {
            return this.readBits(8)
        }
        ,
        n.prototype.readUShort = function() {
            return this.readBits(16)
        }
        ,
        n.prototype.readUInt = function() {
            return this.readBits(32)
        }
        ,
        n.prototype.skipScalingList = function(e) {
            var t, r = 8, i = 8;
            for (t = 0; t < e; t++)
                0 !== i && (i = (r + this.readEG() + 256) % 256),
                r = 0 === i ? r : i
        }
        ,
        n.prototype.readSPS = function() {
            var e, t, r, i, a, n, o, s = 0, l = 0, u = 0, d = 0, f = this.readUByte.bind(this), c = this.readBits.bind(this), h = this.readUEG.bind(this), p = this.readBoolean.bind(this), g = this.skipBits.bind(this), v = this.skipEG.bind(this), y = this.skipUEG.bind(this), m = this.skipScalingList.bind(this);
            if (f(),
            e = f(),
            c(5),
            g(3),
            f(),
            y(),
            100 === e || 110 === e || 122 === e || 244 === e || 44 === e || 83 === e || 86 === e || 118 === e || 128 === e) {
                var E = h();
                if (3 === E && g(1),
                y(),
                y(),
                g(1),
                p())
                    for (n = 3 !== E ? 8 : 12,
                    o = 0; o < n; o++)
                        p() && m(o < 6 ? 16 : 64)
            }
            y();
            var _ = h();
            if (0 === _)
                h();
            else if (1 === _)
                for (g(1),
                v(),
                v(),
                t = h(),
                o = 0; o < t; o++)
                    v();
            y(),
            g(1),
            r = h(),
            i = h(),
            0 === (a = c(1)) && g(1),
            g(1),
            p() && (s = h(),
            l = h(),
            u = h(),
            d = h());
            var S = [1, 1];
            if (p() && p())
                switch (f()) {
                case 1:
                    S = [1, 1];
                    break;
                case 2:
                    S = [12, 11];
                    break;
                case 3:
                    S = [10, 11];
                    break;
                case 4:
                    S = [16, 11];
                    break;
                case 5:
                    S = [40, 33];
                    break;
                case 6:
                    S = [24, 11];
                    break;
                case 7:
                    S = [20, 11];
                    break;
                case 8:
                    S = [32, 11];
                    break;
                case 9:
                    S = [80, 33];
                    break;
                case 10:
                    S = [18, 11];
                    break;
                case 11:
                    S = [15, 11];
                    break;
                case 12:
                    S = [64, 33];
                    break;
                case 13:
                    S = [160, 99];
                    break;
                case 14:
                    S = [4, 3];
                    break;
                case 15:
                    S = [3, 2];
                    break;
                case 16:
                    S = [2, 1];
                    break;
                case 255:
                    S = [f() << 8 | f(), f() << 8 | f()]
                }
            return {
                width: Math.ceil(16 * (r + 1) - 2 * s - 2 * l),
                height: (2 - a) * (i + 1) * 16 - (a ? 2 : 4) * (u + d),
                pixelRatio: S
            }
        }
        ,
        n.prototype.readSliceType = function() {
            return this.readUByte(),
            this.readUEG(),
            this.readUEG()
        }
        ,
        n);
        function n(e) {
            this.data = e,
            this.bytesAvailable = e.byteLength,
            this.word = 0,
            this.bitsAvailable = 0
        }
        t.default = a
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var a = r(13)
          , i = (n.prototype.decryptBuffer = function(e, t) {
            this.decrypter.decrypt(e, this.decryptdata.key.buffer, this.decryptdata.iv.buffer, t)
        }
        ,
        n.prototype.decryptAacSample = function(t, r, i, a) {
            var n = t[r].unit
              , e = n.subarray(16, n.length - n.length % 16)
              , o = e.buffer.slice(e.byteOffset, e.byteOffset + e.length)
              , s = this;
            this.decryptBuffer(o, function(e) {
                e = new Uint8Array(e),
                n.set(e, 16),
                a || s.decryptAacSamples(t, r + 1, i)
            })
        }
        ,
        n.prototype.decryptAacSamples = function(e, t, r) {
            for (; ; t++) {
                if (t >= e.length)
                    return void r();
                if (!(e[t].unit.length < 32)) {
                    var i = this.decrypter.isSync();
                    if (this.decryptAacSample(e, t, r, i),
                    !i)
                        return
                }
            }
        }
        ,
        n.prototype.getAvcEncryptedData = function(e) {
            for (var t = 16 * Math.floor((e.length - 48) / 160) + 16, r = new Int8Array(t), i = 0, a = 32; a <= e.length - 16; a += 160,
            i += 16)
                r.set(e.subarray(a, a + 16), i);
            return r
        }
        ,
        n.prototype.getAvcDecryptedUnit = function(e, t) {
            t = new Uint8Array(t);
            for (var r = 0, i = 32; i <= e.length - 16; i += 160,
            r += 16)
                e.set(t.subarray(r, r + 16), i);
            return e
        }
        ,
        n.prototype.decryptAvcSample = function(t, r, i, a, n, o) {
            var s = this.discardEPB(n.data)
              , e = this.getAvcEncryptedData(s)
              , l = this;
            this.decryptBuffer(e.buffer, function(e) {
                n.data = l.getAvcDecryptedUnit(s, e),
                o || l.decryptAvcSamples(t, r, i + 1, a)
            })
        }
        ,
        n.prototype.decryptAvcSamples = function(e, t, r, i) {
            for (; ; t++,
            r = 0) {
                if (t >= e.length)
                    return void i();
                for (var a = e[t].units; !(r >= a.length); r++) {
                    var n = a[r];
                    if (!(n.length <= 48 || 1 !== n.type && 5 !== n.type)) {
                        var o = this.decrypter.isSync();
                        if (this.decryptAvcSample(e, t, r, i, n, o),
                        !o)
                            return
                    }
                }
            }
        }
        ,
        n);
        function n(e, t, r, i) {
            this.decryptdata = r,
            this.discardEPB = i,
            this.decrypter = new a.default(e,t,{
                removePKCS7Padding: !1
            })
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var p = r(11)
          , a = r(0)
          , g = r(23)
          , i = (n.prototype.resetInitSegment = function(e, t, r, i) {
            this._audioTrack = {
                container: "audio/mpeg",
                type: "audio",
                id: -1,
                sequenceNumber: 0,
                isAAC: !1,
                samples: [],
                len: 0,
                manifestCodec: t,
                duration: i,
                inputTimeScale: 9e4
            }
        }
        ,
        n.prototype.resetTimeStamp = function() {}
        ,
        n.probe = function(e) {
            var t, r, i = p.default.getID3Data(e, 0);
            if (i && void 0 !== p.default.getTimeStamp(i))
                for (t = i.length,
                r = Math.min(e.length - 1, t + 100); t < r; t++)
                    if (g.default.probe(e, t))
                        return a.logger.log("MPEG Audio sync word found !"),
                        !0;
            return !1
        }
        ,
        n.prototype.append = function(e, t, r, i) {
            for (var a = p.default.getID3Data(e, 0), n = p.default.getTimeStamp(a), o = n ? 90 * n : 9e4 * t, s = a.length, l = e.length, u = 0, d = 0, f = this._audioTrack, c = [{
                pts: o,
                dts: o,
                data: a
            }]; s < l; )
                if (g.default.isHeader(e, s)) {
                    var h = g.default.appendFrame(f, e, s, o, u);
                    if (!h)
                        break;
                    s += h.length,
                    d = h.sample.pts,
                    u++
                } else
                    p.default.isHeader(e, s) ? (a = p.default.getID3Data(e, s),
                    c.push({
                        pts: d,
                        dts: d,
                        data: a
                    }),
                    s += a.length) : s++;
            this.remuxer.remux(f, {
                samples: []
            }, {
                samples: c,
                inputTimeScale: 9e4
            }, {
                samples: []
            }, t, r, i)
        }
        ,
        n.prototype.destroy = function() {}
        ,
        n);
        function n(e, t, r) {
            this.observer = e,
            this.config = r,
            this.remuxer = t
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var H = r(48)
          , z = r(49)
          , Q = r(1)
          , $ = r(3)
          , J = r(0)
          , i = (a.prototype.destroy = function() {}
        ,
        a.prototype.resetTimeStamp = function(e) {
            this._initPTS = this._initDTS = e
        }
        ,
        a.prototype.resetInitSegment = function() {
            this.ISGenerated = !1
        }
        ,
        a.prototype.remux = function(e, t, r, i, a, n, o) {
            if (this.ISGenerated || this.generateIS(e, t, a),
            this.ISGenerated) {
                var s = e.samples.length
                  , l = t.samples.length
                  , u = a
                  , d = a;
                if (s && l) {
                    var f = (e.samples[0].pts - t.samples[0].pts) / t.inputTimeScale;
                    u += Math.max(0, f),
                    d += Math.max(0, -f)
                }
                if (s) {
                    e.timescale || (J.logger.warn("regenerate InitSegment as audio detected"),
                    this.generateIS(e, t, a));
                    var c = this.remuxAudio(e, u, n, o);
                    if (l) {
                        var h = void 0;
                        c && (h = c.endPTS - c.startPTS),
                        t.timescale || (J.logger.warn("regenerate InitSegment as video detected"),
                        this.generateIS(e, t, a)),
                        this.remuxVideo(t, d, n, h, o)
                    }
                } else if (l) {
                    var p = this.remuxVideo(t, d, n, 0, o);
                    p && e.codec && this.remuxEmptyAudio(e, u, n, p)
                }
            }
            r.samples.length && this.remuxID3(r, a),
            i.samples.length && this.remuxText(i, a),
            this.observer.trigger(Q.default.FRAG_PARSED)
        }
        ,
        a.prototype.generateIS = function(e, t, r) {
            var i, a, n = this.observer, o = e.samples, s = t.samples, l = this.typeSupported, u = "audio/mp4", d = {}, f = {
                tracks: d
            }, c = void 0 === this._initPTS;
            if (c && (i = a = 1 / 0),
            e.config && o.length && (e.timescale = e.samplerate,
            J.logger.log("audio sampling rate : " + e.samplerate),
            e.isAAC || (l.mpeg ? (u = "audio/mpeg",
            e.codec = "") : l.mp3 && (e.codec = "mp3")),
            d.audio = {
                container: u,
                codec: e.codec,
                initSegment: !e.isAAC && l.mpeg ? new Uint8Array : z.default.initSegment([e]),
                metadata: {
                    channelCount: e.channelCount
                }
            },
            c && (i = a = o[0].pts - e.inputTimeScale * r)),
            t.sps && t.pps && s.length) {
                var h = t.inputTimeScale;
                t.timescale = h,
                d.video = {
                    container: "video/mp4",
                    codec: t.codec,
                    initSegment: z.default.initSegment([t]),
                    metadata: {
                        width: t.width,
                        height: t.height
                    }
                },
                c && (i = Math.min(i, s[0].pts - h * r),
                a = Math.min(a, s[0].dts - h * r),
                this.observer.trigger(Q.default.INIT_PTS_FOUND, {
                    initPTS: i
                }))
            }
            Object.keys(d).length ? (n.trigger(Q.default.FRAG_PARSING_INIT_SEGMENT, f),
            this.ISGenerated = !0,
            c && (this._initPTS = i,
            this._initDTS = a)) : n.trigger(Q.default.ERROR, {
                type: $.ErrorTypes.MEDIA_ERROR,
                details: $.ErrorDetails.FRAG_PARSING_ERROR,
                fatal: !1,
                reason: "no audio/video samples found"
            })
        }
        ,
        a.prototype.remuxVideo = function(e, t, r, i, a) {
            var n, o, s, l, u, d, f, c = 8, h = e.timescale, p = e.samples, g = [], v = p.length, y = this._PTSNormalize, m = this._initPTS, E = this.nextAvcDts, _ = this.isSafari;
            if (0 !== v) {
                _ && (r |= p.length && E && (a && Math.abs(t - E / h) < .1 || Math.abs(p[0].pts - E - m) < h / 5)),
                r || (E = t * h),
                p.forEach(function(e) {
                    e.pts = y(e.pts - m, E),
                    e.dts = y(e.dts - m, E)
                }),
                p.sort(function(e, t) {
                    var r = e.dts - t.dts
                      , i = e.pts - t.pts;
                    return r || i || e.id - t.id
                });
                var S = p.reduce(function(e, t) {
                    return Math.max(Math.min(e, t.pts - t.dts), -18e3)
                }, 0);
                if (S < 0) {
                    J.logger.warn("PTS < DTS detected in video samples, shifting DTS by " + Math.round(S / 90) + " ms to overcome this issue");
                    for (var T = 0; T < p.length; T++)
                        p[T].dts += S
                }
                var b = p[0];
                u = Math.max(b.dts, 0),
                l = Math.max(b.pts, 0);
                var A = Math.round((u - E) / 90);
                r && A && (1 < A ? J.logger.log("AVC:" + A + " ms hole between fragments detected,filling it") : A < -1 && J.logger.log("AVC:" + -A + " ms overlapping between fragments detected"),
                u = E,
                p[0].dts = u,
                l = Math.max(l - A, E),
                p[0].pts = l,
                J.logger.log("Video/PTS/DTS adjusted: " + Math.round(l / 90) + "/" + Math.round(u / 90) + ",delta:" + A + " ms")),
                b = p[p.length - 1],
                f = Math.max(b.dts, 0),
                d = Math.max(b.pts, 0, f),
                _ && (n = Math.round((f - u) / (p.length - 1)));
                var R = 0
                  , D = 0;
                for (T = 0; T < v; T++) {
                    for (var L = p[T], O = L.units, w = O.length, I = 0, P = 0; P < w; P++)
                        I += O[P].data.length;
                    D += I,
                    R += w,
                    L.length = I,
                    L.dts = _ ? u + T * n : Math.max(L.dts, u),
                    L.pts = Math.max(L.pts, L.dts)
                }
                var k = D + 4 * R + 8;
                try {
                    o = new Uint8Array(k)
                } catch (e) {
                    return void this.observer.trigger(Q.default.ERROR, {
                        type: $.ErrorTypes.MUX_ERROR,
                        details: $.ErrorDetails.REMUX_ALLOC_ERROR,
                        fatal: !1,
                        bytes: k,
                        reason: "fail allocating video mdat " + k
                    })
                }
                var C = new DataView(o.buffer);
                for (C.setUint32(0, k),
                o.set(z.default.types.mdat, 4),
                T = 0; T < v; T++) {
                    var F = p[T]
                      , M = F.units
                      , x = 0
                      , N = void 0;
                    for (P = 0,
                    w = M.length; P < w; P++) {
                        var U = M[P]
                          , B = U.data
                          , G = U.data.byteLength;
                        C.setUint32(c, G),
                        c += 4,
                        o.set(B, c),
                        c += G,
                        x += 4 + G
                    }
                    if (_)
                        N = Math.max(0, n * Math.round((F.pts - F.dts) / n));
                    else {
                        if (T < v - 1)
                            n = p[T + 1].dts - F.dts;
                        else {
                            var j = this.config
                              , K = F.dts - p[0 < T ? T - 1 : T].dts;
                            if (j.stretchShortVideoTrack) {
                                var H = j.maxBufferHole
                                  , V = Math.floor(H * h)
                                  , W = (i ? l + i * h : this.nextAudioPts) - F.pts;
                                V < W ? ((n = W - K) < 0 && (n = K),
                                J.logger.log("It is approximately " + W / 90 + " ms to the next segment; using duration " + n / 90 + " ms for the last video frame.")) : n = K
                            } else
                                n = K
                        }
                        N = Math.round(F.pts - F.dts)
                    }
                    g.push({
                        size: x,
                        duration: n,
                        cts: N,
                        flags: {
                            isLeading: 0,
                            isDependedOn: 0,
                            hasRedundancy: 0,
                            degradPrio: 0,
                            dependsOn: F.key ? 2 : 1,
                            isNonSync: F.key ? 0 : 1
                        }
                    })
                }
                this.nextAvcDts = f + n;
                var Y = e.dropped;
                if (e.len = 0,
                e.nbNalu = 0,
                e.dropped = 0,
                g.length && -1 < navigator.userAgent.toLowerCase().indexOf("chrome")) {
                    var q = g[0].flags;
                    q.dependsOn = 2,
                    q.isNonSync = 0
                }
                e.samples = g,
                s = z.default.moof(e.sequenceNumber++, u, e),
                e.samples = [];
                var X = {
                    data1: s,
                    data2: o,
                    startPTS: l / h,
                    endPTS: (d + n) / h,
                    startDTS: u / h,
                    endDTS: this.nextAvcDts / h,
                    type: "video",
                    hasAudio: !1,
                    hasVideo: !0,
                    nb: g.length,
                    dropped: Y
                };
                return this.observer.trigger(Q.default.FRAG_PARSING_DATA, X),
                X
            }
        }
        ,
        a.prototype.remuxAudio = function(e, t, r, i) {
            var a, n, o, s, l, u, d, f = e.inputTimeScale, c = e.timescale, h = f / c, p = (e.isAAC ? 1024 : 1152) * h, g = this._PTSNormalize, v = this._initPTS, y = !e.isAAC && this.typeSupported.mpeg, m = e.samples, E = [], _ = this.nextAudioPts;
            if (r |= m.length && _ && (i && Math.abs(t - _ / f) < .1 || Math.abs(m[0].pts - _ - v) < 20 * p),
            m.forEach(function(e) {
                e.pts = e.dts = g(e.pts - v, t * f)
            }),
            0 !== (m = m.filter(function(e) {
                return 0 <= e.pts
            })).length) {
                if (r || (_ = i ? t * f : m[0].pts),
                e.isAAC)
                    for (var S = this.config.maxAudioFramesDrift, T = 0, b = _; T < m.length; ) {
                        var A, R = m[T];
                        A = (C = R.pts) - b;
                        var D = Math.abs(1e3 * A / f);
                        if (A <= -S * p)
                            J.logger.warn("Dropping 1 audio frame @ " + (b / f).toFixed(3) + "s due to " + Math.round(D) + " ms overlap."),
                            m.splice(T, 1),
                            e.len -= R.unit.length;
                        else if (S * p <= A && D < 1e4 && b) {
                            var L = Math.round(A / p);
                            J.logger.warn("Injecting " + L + " audio frame @ " + (b / f).toFixed(3) + "s due to " + Math.round(1e3 * A / f) + " ms gap.");
                            for (var O = 0; O < L; O++) {
                                var w = Math.max(b, 0);
                                (o = H.default.getSilentFrame(e.manifestCodec || e.codec, e.channelCount)) || (J.logger.log("Unable to get silent frame for given audio codec; duplicating last frame instead."),
                                o = R.unit.subarray()),
                                m.splice(T, 0, {
                                    unit: o,
                                    pts: w,
                                    dts: w
                                }),
                                e.len += o.length,
                                b += p,
                                T++
                            }
                            R.pts = R.dts = b,
                            b += p,
                            T++
                        } else
                            Math.abs(A),
                            R.pts = R.dts = b,
                            b += p,
                            T++
                    }
                O = 0;
                for (var I = m.length; O < I; O++) {
                    var P = m[O]
                      , k = P.unit
                      , C = P.pts;
                    if (void 0 !== d)
                        n.duration = Math.round((C - d) / h);
                    else {
                        var F = Math.round(1e3 * (C - _) / f)
                          , M = 0;
                        if (r && e.isAAC && F) {
                            if (0 < F && F < 1e4)
                                M = Math.round((C - _) / p),
                                J.logger.log(F + " ms hole between AAC samples detected,filling it"),
                                0 < M && ((o = H.default.getSilentFrame(e.manifestCodec || e.codec, e.channelCount)) || (o = k.subarray()),
                                e.len += M * o.length);
                            else if (F < -12) {
                                J.logger.log("drop overlapping AAC sample, expected/parsed/delta:" + (_ / f).toFixed(3) + "s/" + (C / f).toFixed(3) + "s/" + -F + "ms"),
                                e.len -= k.byteLength;
                                continue
                            }
                            C = _
                        }
                        if (u = C,
                        !(0 < e.len))
                            return;
                        var x = y ? e.len : e.len + 8;
                        a = y ? 0 : 8;
                        try {
                            s = new Uint8Array(x)
                        } catch (e) {
                            return void this.observer.trigger(Q.default.ERROR, {
                                type: $.ErrorTypes.MUX_ERROR,
                                details: $.ErrorDetails.REMUX_ALLOC_ERROR,
                                fatal: !1,
                                bytes: x,
                                reason: "fail allocating audio mdat " + x
                            })
                        }
                        for (y || (new DataView(s.buffer).setUint32(0, x),
                        s.set(z.default.types.mdat, 4)),
                        T = 0; T < M; T++)
                            (o = H.default.getSilentFrame(e.manifestCodec || e.codec, e.channelCount)) || (J.logger.log("Unable to get silent frame for given audio codec; duplicating this frame instead."),
                            o = k.subarray()),
                            s.set(o, a),
                            a += o.byteLength,
                            n = {
                                size: o.byteLength,
                                cts: 0,
                                duration: 1024,
                                flags: {
                                    isLeading: 0,
                                    isDependedOn: 0,
                                    hasRedundancy: 0,
                                    degradPrio: 0,
                                    dependsOn: 1
                                }
                            },
                            E.push(n)
                    }
                    s.set(k, a);
                    var N = k.byteLength;
                    a += N,
                    n = {
                        size: N,
                        cts: 0,
                        duration: 0,
                        flags: {
                            isLeading: 0,
                            isDependedOn: 0,
                            hasRedundancy: 0,
                            degradPrio: 0,
                            dependsOn: 1
                        }
                    },
                    E.push(n),
                    d = C
                }
                var U = 0
                  , B = E.length;
                if (2 <= B && (U = E[B - 2].duration,
                n.duration = U),
                B) {
                    this.nextAudioPts = _ = d + h * U,
                    e.len = 0,
                    e.samples = E,
                    l = y ? new Uint8Array : z.default.moof(e.sequenceNumber++, u / h, e),
                    e.samples = [];
                    var G = u / f
                      , j = _ / f
                      , K = {
                        data1: l,
                        data2: s,
                        startPTS: G,
                        endPTS: j,
                        startDTS: G,
                        endDTS: j,
                        type: "audio",
                        hasAudio: !0,
                        hasVideo: !1,
                        nb: B
                    };
                    return this.observer.trigger(Q.default.FRAG_PARSING_DATA, K),
                    K
                }
                return null
            }
        }
        ,
        a.prototype.remuxEmptyAudio = function(e, t, r, i) {
            var a = e.inputTimeScale
              , n = a / (e.samplerate ? e.samplerate : a)
              , o = this.nextAudioPts
              , s = (void 0 !== o ? o : i.startDTS * a) + this._initDTS
              , l = i.endDTS * a + this._initDTS
              , u = 1024 * n
              , d = Math.ceil((l - s) / u)
              , f = H.default.getSilentFrame(e.manifestCodec || e.codec, e.channelCount);
            if (J.logger.warn("remux empty Audio"),
            f) {
                for (var c = [], h = 0; h < d; h++) {
                    var p = s + h * u;
                    c.push({
                        unit: f,
                        pts: p,
                        dts: p
                    }),
                    e.len += f.length
                }
                e.samples = c,
                this.remuxAudio(e, t, r)
            } else
                J.logger.trace("Unable to remuxEmptyAudio since we were unable to get a silent frame for given audio codec!")
        }
        ,
        a.prototype.remuxID3 = function(e) {
            var t, r = e.samples.length, i = e.inputTimeScale, a = this._initPTS, n = this._initDTS;
            if (r) {
                for (var o = 0; o < r; o++)
                    (t = e.samples[o]).pts = (t.pts - a) / i,
                    t.dts = (t.dts - n) / i;
                this.observer.trigger(Q.default.FRAG_PARSING_METADATA, {
                    samples: e.samples
                })
            }
            e.samples = []
        }
        ,
        a.prototype.remuxText = function(e) {
            e.samples.sort(function(e, t) {
                return e.pts - t.pts
            });
            var t, r = e.samples.length, i = e.inputTimeScale, a = this._initPTS;
            if (r) {
                for (var n = 0; n < r; n++)
                    (t = e.samples[n]).pts = (t.pts - a) / i;
                this.observer.trigger(Q.default.FRAG_PARSING_USERDATA, {
                    samples: e.samples
                })
            }
            e.samples = []
        }
        ,
        a.prototype._PTSNormalize = function(e, t) {
            var r;
            if (void 0 === t)
                return e;
            for (r = t < e ? -8589934592 : 8589934592; 4294967296 < Math.abs(e - t); )
                e += r;
            return e
        }
        ,
        a);
        function a(e, t, r, i) {
            this.observer = e,
            this.config = t,
            this.typeSupported = r;
            var a = navigator.userAgent;
            this.isSafari = i && -1 < i.indexOf("Apple") && a && !a.match("CriOS"),
            this.ISGenerated = !1
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = (a.getSilentFrame = function(e, t) {
            switch (e) {
            case "mp4a.40.2":
                if (1 === t)
                    return new Uint8Array([0, 200, 0, 128, 35, 128]);
                if (2 === t)
                    return new Uint8Array([33, 0, 73, 144, 2, 25, 0, 35, 128]);
                if (3 === t)
                    return new Uint8Array([0, 200, 0, 128, 32, 132, 1, 38, 64, 8, 100, 0, 142]);
                if (4 === t)
                    return new Uint8Array([0, 200, 0, 128, 32, 132, 1, 38, 64, 8, 100, 0, 128, 44, 128, 8, 2, 56]);
                if (5 === t)
                    return new Uint8Array([0, 200, 0, 128, 32, 132, 1, 38, 64, 8, 100, 0, 130, 48, 4, 153, 0, 33, 144, 2, 56]);
                if (6 === t)
                    return new Uint8Array([0, 200, 0, 128, 32, 132, 1, 38, 64, 8, 100, 0, 130, 48, 4, 153, 0, 33, 144, 2, 0, 178, 0, 32, 8, 224]);
                break;
            default:
                if (1 === t)
                    return new Uint8Array([1, 64, 34, 128, 163, 78, 230, 128, 186, 8, 0, 0, 0, 28, 6, 241, 193, 10, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 94]);
                if (2 === t)
                    return new Uint8Array([1, 64, 34, 128, 163, 94, 230, 128, 186, 8, 0, 0, 0, 0, 149, 0, 6, 241, 161, 10, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 94]);
                if (3 === t)
                    return new Uint8Array([1, 64, 34, 128, 163, 94, 230, 128, 186, 8, 0, 0, 0, 0, 149, 0, 6, 241, 161, 10, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 94])
            }
            return null
        }
        ,
        a);
        function a() {}
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var s = Math.pow(2, 32) - 1
          , i = (c.init = function() {
            var e;
            for (e in c.types = {
                avc1: [],
                avcC: [],
                btrt: [],
                dinf: [],
                dref: [],
                esds: [],
                ftyp: [],
                hdlr: [],
                mdat: [],
                mdhd: [],
                mdia: [],
                mfhd: [],
                minf: [],
                moof: [],
                moov: [],
                mp4a: [],
                ".mp3": [],
                mvex: [],
                mvhd: [],
                pasp: [],
                sdtp: [],
                stbl: [],
                stco: [],
                stsc: [],
                stsd: [],
                stsz: [],
                stts: [],
                tfdt: [],
                tfhd: [],
                traf: [],
                trak: [],
                trun: [],
                trex: [],
                tkhd: [],
                vmhd: [],
                smhd: []
            })
                c.types.hasOwnProperty(e) && (c.types[e] = [e.charCodeAt(0), e.charCodeAt(1), e.charCodeAt(2), e.charCodeAt(3)]);
            var t = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 118, 105, 100, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 105, 100, 101, 111, 72, 97, 110, 100, 108, 101, 114, 0])
              , r = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 115, 111, 117, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 83, 111, 117, 110, 100, 72, 97, 110, 100, 108, 101, 114, 0]);
            c.HDLR_TYPES = {
                video: t,
                audio: r
            };
            var i = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 12, 117, 114, 108, 32, 0, 0, 0, 1])
              , a = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
            c.STTS = c.STSC = c.STCO = a,
            c.STSZ = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            c.VMHD = new Uint8Array([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]),
            c.SMHD = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
            c.STSD = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]);
            var n = new Uint8Array([105, 115, 111, 109])
              , o = new Uint8Array([97, 118, 99, 49])
              , s = new Uint8Array([0, 0, 0, 1]);
            c.FTYP = c.box(c.types.ftyp, n, s, n, o),
            c.DINF = c.box(c.types.dinf, c.box(c.types.dref, i))
        }
        ,
        c.box = function(e) {
            for (var t, r = Array.prototype.slice.call(arguments, 1), i = 8, a = r.length, n = a; a--; )
                i += r[a].byteLength;
            for ((t = new Uint8Array(i))[0] = i >> 24 & 255,
            t[1] = i >> 16 & 255,
            t[2] = i >> 8 & 255,
            t[3] = 255 & i,
            t.set(e, 4),
            a = 0,
            i = 8; a < n; a++)
                t.set(r[a], i),
                i += r[a].byteLength;
            return t
        }
        ,
        c.hdlr = function(e) {
            return c.box(c.types.hdlr, c.HDLR_TYPES[e])
        }
        ,
        c.mdat = function(e) {
            return c.box(c.types.mdat, e)
        }
        ,
        c.mdhd = function(e, t) {
            t *= e;
            var r = Math.floor(t / (1 + s))
              , i = Math.floor(t % (1 + s));
            return c.box(c.types.mdhd, new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, 255 & e, r >> 24, r >> 16 & 255, r >> 8 & 255, 255 & r, i >> 24, i >> 16 & 255, i >> 8 & 255, 255 & i, 85, 196, 0, 0]))
        }
        ,
        c.mdia = function(e) {
            return c.box(c.types.mdia, c.mdhd(e.timescale, e.duration), c.hdlr(e.type), c.minf(e))
        }
        ,
        c.mfhd = function(e) {
            return c.box(c.types.mfhd, new Uint8Array([0, 0, 0, 0, e >> 24, e >> 16 & 255, e >> 8 & 255, 255 & e]))
        }
        ,
        c.minf = function(e) {
            return "audio" === e.type ? c.box(c.types.minf, c.box(c.types.smhd, c.SMHD), c.DINF, c.stbl(e)) : c.box(c.types.minf, c.box(c.types.vmhd, c.VMHD), c.DINF, c.stbl(e))
        }
        ,
        c.moof = function(e, t, r) {
            return c.box(c.types.moof, c.mfhd(e), c.traf(r, t))
        }
        ,
        c.moov = function(e) {
            for (var t = e.length, r = []; t--; )
                r[t] = c.trak(e[t]);
            return c.box.apply(null, [c.types.moov, c.mvhd(e[0].timescale, e[0].duration)].concat(r).concat(c.mvex(e)))
        }
        ,
        c.mvex = function(e) {
            for (var t = e.length, r = []; t--; )
                r[t] = c.trex(e[t]);
            return c.box.apply(null, [c.types.mvex].concat(r))
        }
        ,
        c.mvhd = function(e, t) {
            t *= e;
            var r = Math.floor(t / (1 + s))
              , i = Math.floor(t % (1 + s))
              , a = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, 255 & e, r >> 24, r >> 16 & 255, r >> 8 & 255, 255 & r, i >> 24, i >> 16 & 255, i >> 8 & 255, 255 & i, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255]);
            return c.box(c.types.mvhd, a)
        }
        ,
        c.sdtp = function(e) {
            var t, r, i = e.samples || [], a = new Uint8Array(4 + i.length);
            for (r = 0; r < i.length; r++)
                t = i[r].flags,
                a[r + 4] = t.dependsOn << 4 | t.isDependedOn << 2 | t.hasRedundancy;
            return c.box(c.types.sdtp, a)
        }
        ,
        c.stbl = function(e) {
            return c.box(c.types.stbl, c.stsd(e), c.box(c.types.stts, c.STTS), c.box(c.types.stsc, c.STSC), c.box(c.types.stsz, c.STSZ), c.box(c.types.stco, c.STCO))
        }
        ,
        c.avc1 = function(e) {
            var t, r, i, a = [], n = [];
            for (t = 0; t < e.sps.length; t++)
                i = (r = e.sps[t]).byteLength,
                a.push(i >>> 8 & 255),
                a.push(255 & i),
                a = a.concat(Array.prototype.slice.call(r));
            for (t = 0; t < e.pps.length; t++)
                i = (r = e.pps[t]).byteLength,
                n.push(i >>> 8 & 255),
                n.push(255 & i),
                n = n.concat(Array.prototype.slice.call(r));
            var o = c.box(c.types.avcC, new Uint8Array([1, a[3], a[4], a[5], 255, 224 | e.sps.length].concat(a).concat([e.pps.length]).concat(n)))
              , s = e.width
              , l = e.height
              , u = e.pixelRatio[0]
              , d = e.pixelRatio[1];
            return c.box(c.types.avc1, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, s >> 8 & 255, 255 & s, l >> 8 & 255, 255 & l, 0, 72, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0, 1, 18, 100, 97, 105, 108, 121, 109, 111, 116, 105, 111, 110, 47, 104, 108, 115, 46, 106, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 17, 17]), o, c.box(c.types.btrt, new Uint8Array([0, 28, 156, 128, 0, 45, 198, 192, 0, 45, 198, 192])), c.box(c.types.pasp, new Uint8Array([u >> 24, u >> 16 & 255, u >> 8 & 255, 255 & u, d >> 24, d >> 16 & 255, d >> 8 & 255, 255 & d])))
        }
        ,
        c.esds = function(e) {
            var t = e.config.length;
            return new Uint8Array([0, 0, 0, 0, 3, 23 + t, 0, 1, 0, 4, 15 + t, 64, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5].concat([t]).concat(e.config).concat([6, 1, 2]))
        }
        ,
        c.mp4a = function(e) {
            var t = e.samplerate;
            return c.box(c.types.mp4a, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, e.channelCount, 0, 16, 0, 0, 0, 0, t >> 8 & 255, 255 & t, 0, 0]), c.box(c.types.esds, c.esds(e)))
        }
        ,
        c.mp3 = function(e) {
            var t = e.samplerate;
            return c.box(c.types[".mp3"], new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, e.channelCount, 0, 16, 0, 0, 0, 0, t >> 8 & 255, 255 & t, 0, 0]))
        }
        ,
        c.stsd = function(e) {
            return "audio" === e.type ? e.isAAC || "mp3" !== e.codec ? c.box(c.types.stsd, c.STSD, c.mp4a(e)) : c.box(c.types.stsd, c.STSD, c.mp3(e)) : c.box(c.types.stsd, c.STSD, c.avc1(e))
        }
        ,
        c.tkhd = function(e) {
            var t = e.id
              , r = e.duration * e.timescale
              , i = e.width
              , a = e.height
              , n = Math.floor(r / (1 + s))
              , o = Math.floor(r % (1 + s));
            return c.box(c.types.tkhd, new Uint8Array([1, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, 255 & t, 0, 0, 0, 0, n >> 24, n >> 16 & 255, n >> 8 & 255, 255 & n, o >> 24, o >> 16 & 255, o >> 8 & 255, 255 & o, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, i >> 8 & 255, 255 & i, 0, 0, a >> 8 & 255, 255 & a, 0, 0]))
        }
        ,
        c.traf = function(e, t) {
            var r = c.sdtp(e)
              , i = e.id
              , a = Math.floor(t / (1 + s))
              , n = Math.floor(t % (1 + s));
            return c.box(c.types.traf, c.box(c.types.tfhd, new Uint8Array([0, 0, 0, 0, i >> 24, i >> 16 & 255, i >> 8 & 255, 255 & i])), c.box(c.types.tfdt, new Uint8Array([1, 0, 0, 0, a >> 24, a >> 16 & 255, a >> 8 & 255, 255 & a, n >> 24, n >> 16 & 255, n >> 8 & 255, 255 & n])), c.trun(e, r.length + 16 + 20 + 8 + 16 + 8 + 8), r)
        }
        ,
        c.trak = function(e) {
            return e.duration = e.duration || 4294967295,
            c.box(c.types.trak, c.tkhd(e), c.mdia(e))
        }
        ,
        c.trex = function(e) {
            var t = e.id;
            return c.box(c.types.trex, new Uint8Array([0, 0, 0, 0, t >> 24, t >> 16 & 255, t >> 8 & 255, 255 & t, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1]))
        }
        ,
        c.trun = function(e, t) {
            var r, i, a, n, o, s, l = e.samples || [], u = l.length, d = 12 + 16 * u, f = new Uint8Array(d);
            for (t += 8 + d,
            f.set([0, 0, 15, 1, u >>> 24 & 255, u >>> 16 & 255, u >>> 8 & 255, 255 & u, t >>> 24 & 255, t >>> 16 & 255, t >>> 8 & 255, 255 & t], 0),
            r = 0; r < u; r++)
                a = (i = l[r]).duration,
                n = i.size,
                o = i.flags,
                s = i.cts,
                f.set([a >>> 24 & 255, a >>> 16 & 255, a >>> 8 & 255, 255 & a, n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, 255 & n, o.isLeading << 2 | o.dependsOn, o.isDependedOn << 6 | o.hasRedundancy << 4 | o.paddingValue << 1 | o.isNonSync, 61440 & o.degradPrio, 15 & o.degradPrio, s >>> 24 & 255, s >>> 16 & 255, s >>> 8 & 255, 255 & s], 12 + 16 * r);
            return c.box(c.types.trun, f)
        }
        ,
        c.initSegment = function(e) {
            c.types || c.init();
            var t, r = c.moov(e);
            return (t = new Uint8Array(c.FTYP.byteLength + r.byteLength)).set(c.FTYP),
            t.set(r, c.FTYP.byteLength),
            t
        }
        ,
        c);
        function c() {}
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var d = r(1)
          , i = (a.prototype.destroy = function() {}
        ,
        a.prototype.resetTimeStamp = function() {}
        ,
        a.prototype.resetInitSegment = function() {}
        ,
        a.prototype.remux = function(e, t, r, i, a, n, o, s) {
            var l = this.observer
              , u = "";
            e && (u += "audio"),
            t && (u += "video"),
            l.trigger(d.default.FRAG_PARSING_DATA, {
                data1: s,
                startPTS: a,
                startDTS: a,
                type: u,
                hasAudio: !!e,
                hasVideo: !!t,
                nb: 1,
                dropped: 0
            }),
            l.trigger(d.default.FRAG_PARSED)
        }
        ,
        a);
        function a(e) {
            this.observer = e
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        var i = Object.prototype.hasOwnProperty
          , h = "~";
        function a() {}
        function n(e, t, r, i, a) {
            if ("function" != typeof r)
                throw new TypeError("The listener must be a function");
            var n = new function(e, t, r) {
                this.fn = e,
                this.context = t,
                this.once = r || !1
            }
            (r,i || e,a)
              , o = h ? h + t : t;
            return e._events[o] ? e._events[o].fn ? e._events[o] = [e._events[o], n] : e._events[o].push(n) : (e._events[o] = n,
            e._eventsCount++),
            e
        }
        function u(e, t) {
            0 == --e._eventsCount ? e._events = new a : delete e._events[t]
        }
        function o() {
            this._events = new a,
            this._eventsCount = 0
        }
        Object.create && (a.prototype = Object.create(null),
        (new a).__proto__ || (h = !1)),
        o.prototype.eventNames = function() {
            var e, t, r = [];
            if (0 === this._eventsCount)
                return r;
            for (t in e = this._events)
                i.call(e, t) && r.push(h ? t.slice(1) : t);
            return Object.getOwnPropertySymbols ? r.concat(Object.getOwnPropertySymbols(e)) : r
        }
        ,
        o.prototype.listeners = function(e) {
            var t = h ? h + e : e
              , r = this._events[t];
            if (!r)
                return [];
            if (r.fn)
                return [r.fn];
            for (var i = 0, a = r.length, n = new Array(a); i < a; i++)
                n[i] = r[i].fn;
            return n
        }
        ,
        o.prototype.listenerCount = function(e) {
            var t = h ? h + e : e
              , r = this._events[t];
            return r ? r.fn ? 1 : r.length : 0
        }
        ,
        o.prototype.emit = function(e, t, r, i, a, n) {
            var o = h ? h + e : e;
            if (!this._events[o])
                return !1;
            var s, l, u = this._events[o], d = arguments.length;
            if (u.fn) {
                switch (u.once && this.removeListener(e, u.fn, void 0, !0),
                d) {
                case 1:
                    return u.fn.call(u.context),
                    !0;
                case 2:
                    return u.fn.call(u.context, t),
                    !0;
                case 3:
                    return u.fn.call(u.context, t, r),
                    !0;
                case 4:
                    return u.fn.call(u.context, t, r, i),
                    !0;
                case 5:
                    return u.fn.call(u.context, t, r, i, a),
                    !0;
                case 6:
                    return u.fn.call(u.context, t, r, i, a, n),
                    !0
                }
                for (l = 1,
                s = new Array(d - 1); l < d; l++)
                    s[l - 1] = arguments[l];
                u.fn.apply(u.context, s)
            } else {
                var f, c = u.length;
                for (l = 0; l < c; l++)
                    switch (u[l].once && this.removeListener(e, u[l].fn, void 0, !0),
                    d) {
                    case 1:
                        u[l].fn.call(u[l].context);
                        break;
                    case 2:
                        u[l].fn.call(u[l].context, t);
                        break;
                    case 3:
                        u[l].fn.call(u[l].context, t, r);
                        break;
                    case 4:
                        u[l].fn.call(u[l].context, t, r, i);
                        break;
                    default:
                        if (!s)
                            for (f = 1,
                            s = new Array(d - 1); f < d; f++)
                                s[f - 1] = arguments[f];
                        u[l].fn.apply(u[l].context, s)
                    }
            }
            return !0
        }
        ,
        o.prototype.on = function(e, t, r) {
            return n(this, e, t, r, !1)
        }
        ,
        o.prototype.once = function(e, t, r) {
            return n(this, e, t, r, !0)
        }
        ,
        o.prototype.removeListener = function(e, t, r, i) {
            var a = h ? h + e : e;
            if (!this._events[a])
                return this;
            if (!t)
                return u(this, a),
                this;
            var n = this._events[a];
            if (n.fn)
                n.fn !== t || i && !n.once || r && n.context !== r || u(this, a);
            else {
                for (var o = 0, s = [], l = n.length; o < l; o++)
                    (n[o].fn !== t || i && !n[o].once || r && n[o].context !== r) && s.push(n[o]);
                s.length ? this._events[a] = 1 === s.length ? s[0] : s : u(this, a)
            }
            return this
        }
        ,
        o.prototype.removeAllListeners = function(e) {
            var t;
            return e ? (t = h ? h + e : e,
            this._events[t] && u(this, t)) : (this._events = new a,
            this._eventsCount = 0),
            this
        }
        ,
        o.prototype.off = o.prototype.removeListener,
        o.prototype.addListener = o.prototype.on,
        o.prefixed = h,
        o.EventEmitter = o,
        e.exports = o
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var o = r(21)
          , s = r(1)
          , l = r(0)
          , u = r(53);
        t.default = function(a) {
            var i = new u.EventEmitter;
            i.trigger = function(e) {
                for (var t = [], r = 1; r < arguments.length; r++)
                    t[r - 1] = arguments[r];
                i.emit.apply(i, [e, e].concat(t))
            }
            ,
            i.off = function(e) {
                for (var t = [], r = 1; r < arguments.length; r++)
                    t[r - 1] = arguments[r];
                i.removeListener.apply(i, [e].concat(t))
            }
            ;
            function n(e, t) {
                a.postMessage({
                    event: e,
                    data: t
                })
            }
            a.addEventListener("message", function(e) {
                var t = e.data;
                switch (t.cmd) {
                case "init":
                    var r = JSON.parse(t.config);
                    a.demuxer = new o.default(i,t.typeSupported,r,t.vendor),
                    l.enableLogs(r.debug),
                    n("init", null);
                    break;
                case "demux":
                    a.demuxer.push(t.data, t.decryptdata, t.initSegment, t.audioCodec, t.videoCodec, t.timeOffset, t.discontinuity, t.trackSwitch, t.contiguous, t.duration, t.accurateTimeOffset, t.defaultInitPTS)
                }
            }),
            i.on(s.default.FRAG_DECRYPTED, n),
            i.on(s.default.FRAG_PARSING_INIT_SEGMENT, n),
            i.on(s.default.FRAG_PARSED, n),
            i.on(s.default.ERROR, n),
            i.on(s.default.FRAG_PARSING_METADATA, n),
            i.on(s.default.FRAG_PARSING_USERDATA, n),
            i.on(s.default.INIT_PTS_FOUND, n),
            i.on(s.default.FRAG_PARSING_DATA, function(e, t) {
                var r = []
                  , i = {
                    event: e,
                    data: t
                };
                t.data1 && (i.data1 = t.data1.buffer,
                r.push(t.data1.buffer),
                delete t.data1),
                t.data2 && (i.data2 = t.data2.buffer,
                r.push(t.data2.buffer),
                delete t.data2),
                a.postMessage(i, r)
            })
        }
    }
    , function(e, t) {
        function i() {
            this._events = this._events || {},
            this._maxListeners = this._maxListeners || void 0
        }
        function l(e) {
            return "function" == typeof e
        }
        function u(e) {
            return "object" == typeof e && null !== e
        }
        function d(e) {
            return void 0 === e
        }
        ((e.exports = i).EventEmitter = i).prototype._events = void 0,
        i.prototype._maxListeners = void 0,
        i.defaultMaxListeners = 10,
        i.prototype.setMaxListeners = function(e) {
            if ("number" != typeof e || e < 0 || isNaN(e))
                throw TypeError("n must be a positive number");
            return this._maxListeners = e,
            this
        }
        ,
        i.prototype.emit = function(e) {
            var t, r, i, a, n, o;
            if (this._events || (this._events = {}),
            "error" === e && (!this._events.error || u(this._events.error) && !this._events.error.length)) {
                if ((t = arguments[1])instanceof Error)
                    throw t;
                var s = new Error('Uncaught, unspecified "error" event. (' + t + ")");
                throw s.context = t,
                s
            }
            if (d(r = this._events[e]))
                return !1;
            if (l(r))
                switch (arguments.length) {
                case 1:
                    r.call(this);
                    break;
                case 2:
                    r.call(this, arguments[1]);
                    break;
                case 3:
                    r.call(this, arguments[1], arguments[2]);
                    break;
                default:
                    a = Array.prototype.slice.call(arguments, 1),
                    r.apply(this, a)
                }
            else if (u(r))
                for (a = Array.prototype.slice.call(arguments, 1),
                i = (o = r.slice()).length,
                n = 0; n < i; n++)
                    o[n].apply(this, a);
            return !0
        }
        ,
        i.prototype.on = i.prototype.addListener = function(e, t) {
            var r;
            if (!l(t))
                throw TypeError("listener must be a function");
            return this._events || (this._events = {}),
            this._events.newListener && this.emit("newListener", e, l(t.listener) ? t.listener : t),
            this._events[e] ? u(this._events[e]) ? this._events[e].push(t) : this._events[e] = [this._events[e], t] : this._events[e] = t,
            u(this._events[e]) && !this._events[e].warned && (r = d(this._maxListeners) ? i.defaultMaxListeners : this._maxListeners) && 0 < r && this._events[e].length > r && (this._events[e].warned = !0,
            console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[e].length),
            "function" == typeof console.trace && console.trace()),
            this
        }
        ,
        i.prototype.once = function(e, t) {
            if (!l(t))
                throw TypeError("listener must be a function");
            var r = !1;
            function i() {
                this.removeListener(e, i),
                r || (r = !0,
                t.apply(this, arguments))
            }
            return i.listener = t,
            this.on(e, i),
            this
        }
        ,
        i.prototype.removeListener = function(e, t) {
            var r, i, a, n;
            if (!l(t))
                throw TypeError("listener must be a function");
            if (!this._events || !this._events[e])
                return this;
            if (a = (r = this._events[e]).length,
            i = -1,
            r === t || l(r.listener) && r.listener === t)
                delete this._events[e],
                this._events.removeListener && this.emit("removeListener", e, t);
            else if (u(r)) {
                for (n = a; 0 < n--; )
                    if (r[n] === t || r[n].listener && r[n].listener === t) {
                        i = n;
                        break
                    }
                if (i < 0)
                    return this;
                1 === r.length ? (r.length = 0,
                delete this._events[e]) : r.splice(i, 1),
                this._events.removeListener && this.emit("removeListener", e, t)
            }
            return this
        }
        ,
        i.prototype.removeAllListeners = function(e) {
            var t, r;
            if (!this._events)
                return this;
            if (!this._events.removeListener)
                return 0 === arguments.length ? this._events = {} : this._events[e] && delete this._events[e],
                this;
            if (0 === arguments.length) {
                for (t in this._events)
                    "removeListener" !== t && this.removeAllListeners(t);
                return this.removeAllListeners("removeListener"),
                this._events = {},
                this
            }
            if (l(r = this._events[e]))
                this.removeListener(e, r);
            else if (r)
                for (; r.length; )
                    this.removeListener(e, r[r.length - 1]);
            return delete this._events[e],
            this
        }
        ,
        i.prototype.listeners = function(e) {
            return this._events && this._events[e] ? l(this._events[e]) ? [this._events[e]] : this._events[e].slice() : []
        }
        ,
        i.prototype.listenerCount = function(e) {
            if (this._events) {
                var t = this._events[e];
                if (l(t))
                    return 1;
                if (t)
                    return t.length
            }
            return 0
        }
        ,
        i.listenerCount = function(e, t) {
            return e.listenerCount(t)
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var l = r(5)
          , s = r(3)
          , u = r(1)
          , d = r(0)
          , i = (a.prototype.poll = function(e, t) {
            var r = this.config
              , i = this.media
              , a = i.currentTime
              , n = window.performance.now();
            if (a !== e)
                return this.stallReported && (d.logger.warn("playback not stuck anymore @" + a + ", after " + Math.round(n - this.stalled) + "ms"),
                this.stallReported = !1),
                this.stalled = null,
                void (this.nudgeRetry = 0);
            if (!(i.ended || !i.buffered.length || 2 < i.readyState || i.seeking && l.BufferHelper.isBuffered(i, a))) {
                var o = n - this.stalled
                  , s = l.BufferHelper.bufferInfo(i, a, r.maxBufferHole);
                this.stalled ? (1e3 <= o && this._reportStall(s.len),
                this._tryFixBufferStall(s, o)) : this.stalled = n
            }
        }
        ,
        a.prototype._tryFixBufferStall = function(e, t) {
            var r = this.config
              , i = this.fragmentTracker
              , a = this.media.currentTime
              , n = i.getPartialFragment(a);
            n && this._trySkipBufferHole(n),
            .5 < e.len && t > 1e3 * r.highBufferWatchdogPeriod && (this.stalled = null,
            this._tryNudgeBuffer())
        }
        ,
        a.prototype._reportStall = function(e) {
            var t = this.hls
              , r = this.media;
            this.stallReported || (this.stallReported = !0,
            d.logger.warn("Playback stalling at @" + r.currentTime + " due to low buffer"),
            t.trigger(u.default.ERROR, {
                type: s.ErrorTypes.MEDIA_ERROR,
                details: s.ErrorDetails.BUFFER_STALLED_ERROR,
                fatal: !1,
                buffer: e
            }))
        }
        ,
        a.prototype._trySkipBufferHole = function(e) {
            for (var t = this.hls, r = this.media, i = r.currentTime, a = 0, n = 0; n < r.buffered.length; n++) {
                var o = r.buffered.start(n);
                if (a <= i && i < o)
                    return r.currentTime = Math.max(o, r.currentTime + .1),
                    d.logger.warn("skipping hole, adjusting currentTime from " + i + " to " + r.currentTime),
                    this.stalled = null,
                    void t.trigger(u.default.ERROR, {
                        type: s.ErrorTypes.MEDIA_ERROR,
                        details: s.ErrorDetails.BUFFER_SEEK_OVER_HOLE,
                        fatal: !1,
                        reason: "fragment loaded with buffer holes, seeking from " + i + " to " + r.currentTime,
                        frag: e
                    });
                a = r.buffered.end(n)
            }
        }
        ,
        a.prototype._tryNudgeBuffer = function() {
            var e = this.config
              , t = this.hls
              , r = this.media
              , i = r.currentTime
              , a = (this.nudgeRetry || 0) + 1;
            if ((this.nudgeRetry = a) < e.nudgeMaxRetry) {
                var n = i + a * e.nudgeOffset;
                d.logger.log("adjust currentTime from " + i + " to " + n),
                r.currentTime = n,
                t.trigger(u.default.ERROR, {
                    type: s.ErrorTypes.MEDIA_ERROR,
                    details: s.ErrorDetails.BUFFER_NUDGE_ON_STALL,
                    fatal: !1
                })
            } else
                d.logger.error("still stuck in high buffer @" + i + " after " + e.nudgeMaxRetry + ", raise fatal error"),
                t.trigger(u.default.ERROR, {
                    type: s.ErrorTypes.MEDIA_ERROR,
                    details: s.ErrorDetails.BUFFER_STALLED_ERROR,
                    fatal: !0
                })
        }
        ,
        a);
        function a(e, t, r, i) {
            this.config = e,
            this.media = t,
            this.fragmentTracker = r,
            this.hls = i,
            this.stallReported = !1
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var u, n, d = r(1), o = r(4), f = r(0), c = r(3), h = r(19), p = r(8), s = (window.performance,
        n = o.default,
        a(l, n),
        l.prototype.onHandlerDestroying = function() {
            this.clearTimer(),
            this.manualLevelIndex = -1
        }
        ,
        l.prototype.clearTimer = function() {
            null !== this.timer && (clearTimeout(this.timer),
            this.timer = null)
        }
        ,
        l.prototype.startLoad = function() {
            var e = this._levels;
            this.canload = !0,
            this.levelRetryCount = 0,
            e && e.forEach(function(e) {
                e.loadError = 0;
                var t = e.details;
                t && t.live && (e.details = void 0)
            }),
            null !== this.timer && this.loadLevel()
        }
        ,
        l.prototype.stopLoad = function() {
            this.canload = !1
        }
        ,
        l.prototype.onManifestLoaded = function(e) {
            var t, r = [], i = [], a = {}, n = null, o = !1, s = !1;
            if (e.levels.forEach(function(e) {
                var t = e.attrs;
                e.loadError = 0,
                e.fragmentError = !1,
                o = o || !!e.videoCodec,
                s = s || !!e.audioCodec,
                u && e.audioCodec && -1 !== e.audioCodec.indexOf("mp4a.40.34") && (e.audioCodec = void 0),
                (n = a[e.bitrate]) ? n.url.push(e.url) : (e.url = [e.url],
                e.urlId = 0,
                a[e.bitrate] = e,
                r.push(e)),
                t && (t.AUDIO && (s = !0,
                p.addGroupId(n || e, "audio", t.AUDIO)),
                t.SUBTITLES && p.addGroupId(n || e, "text", t.SUBTITLES))
            }),
            o && s && (r = r.filter(function(e) {
                return !!e.videoCodec
            })),
            r = r.filter(function(e) {
                var t = e.audioCodec
                  , r = e.videoCodec;
                return (!t || h.isCodecSupportedInMp4(t, "audio")) && (!r || h.isCodecSupportedInMp4(r, "video"))
            }),
            e.audioTracks && (i = e.audioTracks.filter(function(e) {
                return !e.audioCodec || h.isCodecSupportedInMp4(e.audioCodec, "audio")
            })).forEach(function(e, t) {
                e.id = t
            }),
            0 < r.length) {
                t = r[0].bitrate,
                r.sort(function(e, t) {
                    return e.bitrate - t.bitrate
                }),
                this._levels = r;
                for (var l = 0; l < r.length; l++)
                    if (r[l].bitrate === t) {
                        this._firstLevel = l,
                        f.logger.log("manifest loaded," + r.length + " level(s) found, first bitrate:" + t);
                        break
                    }
                this.hls.trigger(d.default.MANIFEST_PARSED, {
                    levels: r,
                    audioTracks: i,
                    firstLevel: this._firstLevel,
                    stats: e.stats,
                    audio: s,
                    video: o,
                    altAudio: i.some(function(e) {
                        return !!e.url
                    })
                })
            } else
                this.hls.trigger(d.default.ERROR, {
                    type: c.ErrorTypes.MEDIA_ERROR,
                    details: c.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
                    fatal: !0,
                    url: this.hls.url,
                    reason: "no level with compatible codecs found in manifest"
                })
        }
        ,
        Object.defineProperty(l.prototype, "levels", {
            get: function() {
                return this._levels
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(l.prototype, "level", {
            get: function() {
                return this.currentLevelIndex
            },
            set: function(e) {
                var t = this._levels;
                t && (e = Math.min(e, t.length - 1),
                this.currentLevelIndex === e && t[e].details || this.setLevelInternal(e))
            },
            enumerable: !0,
            configurable: !0
        }),
        l.prototype.setLevelInternal = function(e) {
            var t = this._levels
              , r = this.hls;
            if (0 <= e && e < t.length) {
                if (this.clearTimer(),
                this.currentLevelIndex !== e) {
                    f.logger.log("switching to level " + e);
                    var i = t[this.currentLevelIndex = e];
                    i.level = e,
                    r.trigger(d.default.LEVEL_SWITCHING, i)
                }
                var a = t[e]
                  , n = a.details;
                if (!n || n.live) {
                    var o = a.urlId;
                    r.trigger(d.default.LEVEL_LOADING, {
                        url: a.url[o],
                        level: e,
                        id: o
                    })
                }
            } else
                r.trigger(d.default.ERROR, {
                    type: c.ErrorTypes.OTHER_ERROR,
                    details: c.ErrorDetails.LEVEL_SWITCH_ERROR,
                    level: e,
                    fatal: !1,
                    reason: "invalid level idx"
                })
        }
        ,
        Object.defineProperty(l.prototype, "manualLevel", {
            get: function() {
                return this.manualLevelIndex
            },
            set: function(e) {
                this.manualLevelIndex = e,
                void 0 === this._startLevel && (this._startLevel = e),
                -1 !== e && (this.level = e)
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(l.prototype, "firstLevel", {
            get: function() {
                return this._firstLevel
            },
            set: function(e) {
                this._firstLevel = e
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(l.prototype, "startLevel", {
            get: function() {
                if (void 0 !== this._startLevel)
                    return this._startLevel;
                var e = this.hls.config.startLevel;
                return void 0 !== e ? e : this._firstLevel
            },
            set: function(e) {
                this._startLevel = e
            },
            enumerable: !0,
            configurable: !0
        }),
        l.prototype.onError = function(e) {
            if (e.fatal)
                e.type === c.ErrorTypes.NETWORK_ERROR && this.clearTimer();
            else {
                var t, r = !1, i = !1;
                switch (e.details) {
                case c.ErrorDetails.FRAG_LOAD_ERROR:
                case c.ErrorDetails.FRAG_LOAD_TIMEOUT:
                case c.ErrorDetails.KEY_LOAD_ERROR:
                case c.ErrorDetails.KEY_LOAD_TIMEOUT:
                    t = e.frag.level,
                    i = !0;
                    break;
                case c.ErrorDetails.LEVEL_LOAD_ERROR:
                case c.ErrorDetails.LEVEL_LOAD_TIMEOUT:
                    t = e.context.level,
                    r = !0;
                    break;
                case c.ErrorDetails.REMUX_ALLOC_ERROR:
                    t = e.level,
                    r = !0
                }
                void 0 !== t && this.recoverLevel(e, t, r, i)
            }
        }
        ,
        l.prototype.recoverLevel = function(e, t, r, i) {
            var a, n, o, s = this, l = this.hls.config, u = e.details, d = this._levels[t];
            if (d.loadError++,
            d.fragmentError = i,
            r) {
                if (!(this.levelRetryCount + 1 <= l.levelLoadingMaxRetry))
                    return f.logger.error("level controller, cannot recover from " + u + " error"),
                    this.currentLevelIndex = null,
                    this.clearTimer(),
                    void (e.fatal = !0);
                n = Math.min(Math.pow(2, this.levelRetryCount) * l.levelLoadingRetryDelay, l.levelLoadingMaxRetryTimeout),
                this.timer = setTimeout(function() {
                    return s.loadLevel()
                }, n),
                e.levelRetry = !0,
                this.levelRetryCount++,
                f.logger.warn("level controller, " + u + ", retry in " + n + " ms, current retry count is " + this.levelRetryCount)
            }
            (r || i) && (1 < (a = d.url.length) && d.loadError < a ? (d.urlId = (d.urlId + 1) % a,
            d.details = void 0,
            f.logger.warn("level controller, " + u + " for level " + t + ": switching to redundant URL-id " + d.urlId)) : -1 === this.manualLevelIndex ? (o = 0 === t ? this._levels.length - 1 : t - 1,
            f.logger.warn("level controller, " + u + ": switch to " + o),
            this.hls.nextAutoLevel = this.currentLevelIndex = o) : i && (f.logger.warn("level controller, " + u + ": reload a fragment"),
            this.currentLevelIndex = null))
        }
        ,
        l.prototype.onFragLoaded = function(e) {
            var t = e.frag;
            if (void 0 !== t && "main" === t.type) {
                var r = this._levels[t.level];
                void 0 !== r && (r.fragmentError = !1,
                r.loadError = 0,
                this.levelRetryCount = 0)
            }
        }
        ,
        l.prototype.onLevelLoaded = function(e) {
            var t = this
              , r = e.level
              , i = e.details;
            if (r === this.currentLevelIndex) {
                var a = this._levels[r];
                if (a.fragmentError || (a.loadError = 0,
                this.levelRetryCount = 0),
                this.clearTimer(),
                i.live) {
                    var n = p.computeReloadInterval(a.details, i, e.stats.trequest);
                    f.logger.log("live playlist, reload in " + Math.round(n) + " ms"),
                    this.timer = setTimeout(function() {
                        return t.loadLevel()
                    }, n)
                }
            }
        }
        ,
        l.prototype.onAudioTrackSwitched = function(e) {
            var t = this.hls.audioTracks[e.id].groupId
              , r = this.hls.levels[this.currentLevelIndex];
            if (r && r.audioGroupIds) {
                for (var i = -1, a = 0; a < r.audioGroupIds.length; a++)
                    if (r.audioGroupIds[a] === t) {
                        i = a;
                        break
                    }
                i !== r.urlId && (r.urlId = i,
                this.startLoad())
            }
        }
        ,
        l.prototype.loadLevel = function() {
            if (f.logger.debug("call to loadLevel"),
            null !== this.currentLevelIndex && this.canload) {
                var e = this._levels[this.currentLevelIndex];
                if ("object" == typeof e && 0 < e.url.length) {
                    var t = this.currentLevelIndex
                      , r = e.urlId
                      , i = e.url[r];
                    f.logger.log("Attempt loading level index " + t + " with URL-id " + r),
                    this.hls.trigger(d.default.LEVEL_LOADING, {
                        url: i,
                        level: t,
                        id: r
                    })
                }
            }
        }
        ,
        Object.defineProperty(l.prototype, "nextLoadLevel", {
            get: function() {
                return -1 !== this.manualLevelIndex ? this.manualLevelIndex : this.hls.nextAutoLevel
            },
            set: function(e) {
                this.level = e,
                -1 === this.manualLevelIndex && (this.hls.nextAutoLevel = e)
            },
            enumerable: !0,
            configurable: !0
        }),
        l);
        function l(e) {
            var t = n.call(this, e, d.default.MANIFEST_LOADED, d.default.LEVEL_LOADED, d.default.AUDIO_TRACK_SWITCHED, d.default.FRAG_LOADED, d.default.ERROR) || this;
            return t.canload = !1,
            t.currentLevelIndex = null,
            t.manualLevelIndex = -1,
            t.timer = null,
            u = /chrome|firefox/.test(navigator.userAgent.toLowerCase()),
            t
        }
        t.default = s
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, o = r(1), s = r(4), f = r(11), l = r(29), u = (n = s.default,
        a(d, n),
        d.prototype.destroy = function() {
            s.default.prototype.destroy.call(this)
        }
        ,
        d.prototype.onMediaAttached = function(e) {
            this.media = e.media,
            this.media
        }
        ,
        d.prototype.onMediaDetaching = function() {
            l.clearCurrentCues(this.id3Track),
            this.id3Track = void 0,
            this.media = void 0
        }
        ,
        d.prototype.getID3Track = function(e) {
            for (var t = 0; t < e.length; t++) {
                var r = e[t];
                if ("metadata" === r.kind && "id3" === r.label)
                    return l.sendAddTrackEvent(r, this.media),
                    r
            }
            return this.media.addTextTrack("metadata", "id3")
        }
        ,
        d.prototype.onFragParsingMetadata = function(e) {
            var t = e.frag
              , r = e.samples;
            this.id3Track || (this.id3Track = this.getID3Track(this.media.textTracks),
            this.id3Track.mode = "hidden");
            for (var i = window.WebKitDataCue || window.VTTCue || window.TextTrackCue, a = 0; a < r.length; a++) {
                var n = f.default.getID3Frames(r[a].data);
                if (n) {
                    var o = r[a].pts
                      , s = a < r.length - 1 ? r[a + 1].pts : t.endPTS;
                    o === s && (s += 1e-4);
                    for (var l = 0; l < n.length; l++) {
                        var u = n[l];
                        if (!f.default.isTimeStampFrame(u)) {
                            var d = new i(o,s,"");
                            d.value = u,
                            this.id3Track.addCue(d)
                        }
                    }
                }
            }
        }
        ,
        d);
        function d(e) {
            var t = n.call(this, e, o.default.MEDIA_ATTACHED, o.default.MEDIA_DETACHING, o.default.FRAG_PARSING_METADATA) || this;
            return t.id3Track = void 0,
            t.media = void 0,
            t
        }
        t.default = u
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var a = r(14);
        t.isSupported = function() {
            var e = a.getMediaSource()
              , t = window.SourceBuffer || window.WebKitSourceBuffer
              , r = e && "function" == typeof e.isTypeSupported && e.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')
              , i = !t || t.prototype && "function" == typeof t.prototype.appendBuffer && "function" == typeof t.prototype.remove;
            return !!r && !!i
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = r(59)
          , a = r(62)
          , n = r(63)
          , o = r(64)
          , s = r(65)
          , l = r(66)
          , u = r(67)
          , d = r(68)
          , f = r(70)
          , c = r(74)
          , h = r(75)
          , p = r(76)
          , g = r(77);
        t.hlsDefaultConfig = {
            autoStartLoad: !0,
            startPosition: -1,
            defaultAudioCodec: void 0,
            debug: !1,
            capLevelOnFPSDrop: !1,
            capLevelToPlayerSize: !1,
            initialLiveManifestSize: 1,
            maxBufferLength: 30,
            maxBufferSize: 6e7,
            maxBufferHole: .5,
            lowBufferWatchdogPeriod: .5,
            highBufferWatchdogPeriod: 3,
            nudgeOffset: .2,
            nudgeMaxRetry: 10,
            maxFragLookUpTolerance: .25,
            liveSyncDurationCount: 4,
            liveMaxLatencyDurationCount: 1 / 0,
            liveSyncDuration: void 0,
            liveMaxLatencyDuration: void 0,
            liveDurationInfinity: !0,
            isLive: !1,
            liveBackBufferLength: 1 / 0,
            maxMaxBufferLength: 600,
            enableWorker: !0,
            enableSoftwareAES: !0,
            manifestLoadingTimeOut: 1e4,
            manifestLoadingMaxRetry: 1,
            manifestLoadingRetryDelay: 1e3,
            manifestLoadingMaxRetryTimeout: 64e3,
            startLevel: void 0,
            levelLoadingTimeOut: 1e4,
            levelLoadingMaxRetry: 99,
            levelLoadingRetryDelay: 1e3,
            levelLoadingMaxRetryTimeout: 64e3,
            fragLoadingTimeOut: 2e4,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1e3,
            fragLoadingMaxRetryTimeout: 64e3,
            startFragPrefetch: !1,
            fpsDroppedMonitoringPeriod: 5e3,
            fpsDroppedMonitoringThreshold: .2,
            appendErrorMaxRetry: 3,
            loader: s.default,
            fLoader: void 0,
            pLoader: void 0,
            xhrSetup: void 0,
            licenseXhrSetup: void 0,
            abrController: i.default,
            bufferController: a.default,
            capLevelController: n.default,
            fpsController: o.default,
            stretchShortVideoTrack: !1,
            maxAudioFramesDrift: 1,
            forceKeyFrameOnDiscontinuity: !0,
            abrEwmaFastLive: 3,
            abrEwmaSlowLive: 9,
            abrEwmaFastVoD: 3,
            abrEwmaSlowVoD: 9,
            abrEwmaDefaultEstimate: 5e5,
            abrBandWidthFactor: .95,
            abrBandWidthUpFactor: .7,
            abrMaxWithRealBitrate: !1,
            maxStarvationDelay: 5,
            maxLoadingDelay: 12,
            minAutoBitrate: 0,
            emeEnabled: !1,
            widevineLicenseUrl: void 0,
            requestMediaKeySystemAccessFunc: g.requestMediaKeySystemAccess
        },
        t.hlsDefaultConfig.subtitleStreamController = h.SubtitleStreamController,
        t.hlsDefaultConfig.subtitleTrackController = c.default,
        t.hlsDefaultConfig.timelineController = f.default,
        t.hlsDefaultConfig.cueHandler = d,
        t.hlsDefaultConfig.enableCEA708Captions = !0,
        t.hlsDefaultConfig.enableWebVTT = !0,
        t.hlsDefaultConfig.captionsTextTrack1Label = "English",
        t.hlsDefaultConfig.captionsTextTrack1LanguageCode = "en",
        t.hlsDefaultConfig.captionsTextTrack2Label = "Spanish",
        t.hlsDefaultConfig.captionsTextTrack2LanguageCode = "es",
        t.hlsDefaultConfig.audioStreamController = u.default,
        t.hlsDefaultConfig.audioTrackController = l.default,
        t.hlsDefaultConfig.emeController = p.default
    }
    , function(e, u, d) {
        "use strict";
        (function(o) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(u, "__esModule", {
                value: !0
            });
            var r, E = d(1), t = d(4), _ = d(5), a = d(3), S = d(0), s = d(60), T = window.performance, n = (r = t.default,
            e(l, r),
            l.prototype.destroy = function() {
                this.clearTimer(),
                t.default.prototype.destroy.call(this)
            }
            ,
            l.prototype.onFragLoading = function(e) {
                var t = e.frag;
                if ("main" === t.type && (this.timer || (this.fragCurrent = t,
                this.timer = setInterval(this.onCheck, 100)),
                !this._bwEstimator)) {
                    var r = this.hls
                      , i = r.config
                      , a = t.level
                      , n = void 0
                      , o = void 0;
                    o = r.levels[a].details.live ? (n = i.abrEwmaFastLive,
                    i.abrEwmaSlowLive) : (n = i.abrEwmaFastVoD,
                    i.abrEwmaSlowVoD),
                    this._bwEstimator = new s.default(r,o,n,i.abrEwmaDefaultEstimate)
                }
            }
            ,
            l.prototype._abandonRulesCheck = function() {
                var e = this.hls
                  , t = e.media
                  , r = this.fragCurrent;
                if (r) {
                    var i = r.loader
                      , a = e.minAutoLevel;
                    if (!i || i.stats && i.stats.aborted)
                        return S.logger.warn("frag loader destroy or aborted, disarm abandonRules"),
                        this.clearTimer(),
                        void (this._nextAutoLevel = -1);
                    var n = i.stats;
                    if (t && n && (!t.paused && 0 !== t.playbackRate || !t.readyState) && r.autoLevel && r.level) {
                        var o = T.now() - n.trequest
                          , s = Math.abs(t.playbackRate);
                        if (o > 500 * r.duration / s) {
                            var l = e.levels
                              , u = Math.max(1, n.bw ? n.bw / 8 : 1e3 * n.loaded / o)
                              , d = l[r.level]
                              , f = d.realBitrate ? Math.max(d.realBitrate, d.bitrate) : d.bitrate
                              , c = n.total ? n.total : Math.max(n.loaded, Math.round(r.duration * f / 8))
                              , h = t.currentTime
                              , p = (c - n.loaded) / u
                              , g = (_.BufferHelper.bufferInfo(t, h, e.config.maxBufferHole).end - h) / s;
                            if (g < 2 * r.duration / s && g < p) {
                                var v = void 0
                                  , y = void 0;
                                for (y = r.level - 1; a < y; y--) {
                                    var m = l[y].realBitrate ? Math.max(l[y].realBitrate, l[y].bitrate) : l[y].bitrate;
                                    if ((v = r.duration * m / (6.4 * u)) < g)
                                        break
                                }
                                v < p && (S.logger.warn("loading too slow, abort fragment loading and switch to level " + y + ":fragLoadedDelay[" + y + "]<fragLoadedDelay[" + (r.level - 1) + "];bufferStarvationDelay:" + v.toFixed(1) + "<" + p.toFixed(1) + ":" + g.toFixed(1)),
                                e.nextLoadLevel = y,
                                this._bwEstimator.sample(o, n.loaded),
                                i.abort(),
                                this.clearTimer(),
                                e.trigger(E.default.FRAG_LOAD_EMERGENCY_ABORTED, {
                                    frag: r,
                                    stats: n
                                }))
                            }
                        }
                    }
                }
            }
            ,
            l.prototype.onFragLoaded = function(e) {
                var t = e.frag;
                if ("main" === t.type && o.isFinite(t.sn)) {
                    if (this.clearTimer(),
                    this.lastLoadedFragLevel = t.level,
                    this._nextAutoLevel = -1,
                    this.hls.config.abrMaxWithRealBitrate) {
                        var r = this.hls.levels[t.level]
                          , i = (r.loaded ? r.loaded.bytes : 0) + e.stats.loaded
                          , a = (r.loaded ? r.loaded.duration : 0) + e.frag.duration;
                        r.loaded = {
                            bytes: i,
                            duration: a
                        },
                        r.realBitrate = Math.round(8 * i / a)
                    }
                    if (e.frag.bitrateTest) {
                        var n = e.stats;
                        n.tparsed = n.tbuffered = n.tload,
                        this.onFragBuffered(e)
                    }
                }
            }
            ,
            l.prototype.onFragBuffered = function(e) {
                var t = e.stats
                  , r = e.frag;
                if (!0 !== t.aborted && "main" === r.type && o.isFinite(r.sn) && (!r.bitrateTest || t.tload === t.tbuffered)) {
                    var i = t.tparsed - t.trequest;
                    S.logger.log("latency/loading/parsing/append/kbps:" + Math.round(t.tfirst - t.trequest) + "/" + Math.round(t.tload - t.tfirst) + "/" + Math.round(t.tparsed - t.tload) + "/" + Math.round(t.tbuffered - t.tparsed) + "/" + Math.round(8 * t.loaded / (t.tbuffered - t.trequest))),
                    this._bwEstimator.sample(i, t.loaded),
                    t.bwEstimate = this._bwEstimator.getEstimate(),
                    r.bitrateTest ? this.bitrateTestDelay = i / 1e3 : this.bitrateTestDelay = 0
                }
            }
            ,
            l.prototype.onError = function(e) {
                switch (e.details) {
                case a.ErrorDetails.FRAG_LOAD_ERROR:
                case a.ErrorDetails.FRAG_LOAD_TIMEOUT:
                    this.clearTimer()
                }
            }
            ,
            l.prototype.clearTimer = function() {
                clearInterval(this.timer),
                this.timer = null
            }
            ,
            Object.defineProperty(l.prototype, "nextAutoLevel", {
                get: function() {
                    var e = this._nextAutoLevel
                      , t = this._bwEstimator;
                    if (!(-1 === e || t && t.canEstimate()))
                        return e;
                    var r = this._nextABRAutoLevel;
                    return -1 !== e && (r = Math.min(e, r)),
                    r
                },
                set: function(e) {
                    this._nextAutoLevel = e
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(l.prototype, "_nextABRAutoLevel", {
                get: function() {
                    var e = this.hls
                      , t = e.maxAutoLevel
                      , r = e.levels
                      , i = e.config
                      , a = e.minAutoLevel
                      , n = e.media
                      , o = this.lastLoadedFragLevel
                      , s = this.fragCurrent ? this.fragCurrent.duration : 0
                      , l = n ? n.currentTime : 0
                      , u = n && 0 !== n.playbackRate ? Math.abs(n.playbackRate) : 1
                      , d = this._bwEstimator ? this._bwEstimator.getEstimate() : i.abrEwmaDefaultEstimate
                      , f = (_.BufferHelper.bufferInfo(n, l, i.maxBufferHole).end - l) / u
                      , c = this._findBestLevel(o, s, d, a, t, f, i.abrBandWidthFactor, i.abrBandWidthUpFactor, r);
                    if (0 <= c)
                        return c;
                    S.logger.trace("rebuffering expected to happen, lets try to find a quality level minimizing the rebuffering");
                    var h = s ? Math.min(s, i.maxStarvationDelay) : i.maxStarvationDelay
                      , p = i.abrBandWidthFactor
                      , g = i.abrBandWidthUpFactor;
                    if (0 == f) {
                        var v = this.bitrateTestDelay;
                        v && (h = (s ? Math.min(s, i.maxLoadingDelay) : i.maxLoadingDelay) - v,
                        S.logger.trace("bitrate test took " + Math.round(1e3 * v) + "ms, set first fragment max fetchDuration to " + Math.round(1e3 * h) + " ms"),
                        p = g = 1)
                    }
                    return c = this._findBestLevel(o, s, d, a, t, f + h, p, g, r),
                    Math.max(c, 0)
                },
                enumerable: !0,
                configurable: !0
            }),
            l.prototype._findBestLevel = function(e, t, r, i, a, n, o, s, l) {
                for (var u = a; i <= u; u--) {
                    var d = l[u];
                    if (d) {
                        var f, c = d.details, h = c ? c.totalduration / c.fragments.length : t, p = !!c && c.live;
                        f = u <= e ? o * r : s * r;
                        var g = l[u].realBitrate ? Math.max(l[u].realBitrate, l[u].bitrate) : l[u].bitrate
                          , v = g * h / f;
                        if (S.logger.trace("level/adjustedbw/bitrate/avgDuration/maxFetchDuration/fetchDuration: " + u + "/" + Math.round(f) + "/" + g + "/" + h + "/" + n + "/" + v),
                        g < f && (!v || p && !this.bitrateTestDelay || v < n))
                            return u
                    }
                }
                return -1
            }
            ,
            l);
            function l(e) {
                var t = r.call(this, e, E.default.FRAG_LOADING, E.default.FRAG_LOADED, E.default.FRAG_BUFFERED, E.default.ERROR) || this;
                return t.lastLoadedFragLevel = 0,
                t._nextAutoLevel = -1,
                t.hls = e,
                t.timer = null,
                t._bwEstimator = null,
                t.onCheck = t._abandonRulesCheck.bind(t),
                t
            }
            u.default = n
        }
        ).call(this, d(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var a = r(61)
          , i = (n.prototype.sample = function(e, t) {
            var r = 8e3 * t / (e = Math.max(e, this.minDelayMs_))
              , i = e / 1e3;
            this.fast_.sample(i, r),
            this.slow_.sample(i, r)
        }
        ,
        n.prototype.canEstimate = function() {
            var e = this.fast_;
            return e && e.getTotalWeight() >= this.minWeight_
        }
        ,
        n.prototype.getEstimate = function() {
            return this.canEstimate() ? Math.min(this.fast_.getEstimate(), this.slow_.getEstimate()) : this.defaultEstimate_
        }
        ,
        n.prototype.destroy = function() {}
        ,
        n);
        function n(e, t, r, i) {
            this.hls = e,
            this.defaultEstimate_ = i,
            this.minWeight_ = .001,
            this.minDelayMs_ = 50,
            this.slow_ = new a.default(t),
            this.fast_ = new a.default(r)
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = (a.prototype.sample = function(e, t) {
            var r = Math.pow(this.alpha_, e);
            this.estimate_ = t * (1 - r) + r * this.estimate_,
            this.totalWeight_ += e
        }
        ,
        a.prototype.getTotalWeight = function() {
            return this.totalWeight_
        }
        ,
        a.prototype.getEstimate = function() {
            if (this.alpha_) {
                var e = 1 - Math.pow(this.alpha_, this.totalWeight_);
                return this.estimate_ / e
            }
            return this.estimate_
        }
        ,
        a);
        function a(e) {
            this.alpha_ = e ? Math.exp(Math.log(.5) / e) : 0,
            this.estimate_ = 0,
            this.totalWeight_ = 0
        }
        t.default = i
    }
    , function(e, f, c) {
        "use strict";
        (function(i) {
            var a, e = this && this.__extends || (a = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                a(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(f, "__esModule", {
                value: !0
            });
            var r, l = c(1), t = c(4), u = c(0), d = c(3), n = c(14).getMediaSource(), o = (r = t.default,
            e(s, r),
            s.prototype.destroy = function() {
                t.default.prototype.destroy.call(this)
            }
            ,
            s.prototype.onLevelPtsUpdated = function(e) {
                var t = e.type
                  , r = this.tracks.audio;
                if ("audio" === t && r && "audio/mpeg" === r.container) {
                    var i = this.sourceBuffer.audio;
                    if (.1 < Math.abs(i.timestampOffset - e.start)) {
                        var a = i.updating;
                        try {
                            i.abort()
                        } catch (e) {
                            u.logger.warn("can not abort audio buffer: " + e)
                        }
                        a ? this.audioTimestampOffset = e.start : (u.logger.warn("change mpeg audio timestamp offset from " + i.timestampOffset + " to " + e.start),
                        i.timestampOffset = e.start)
                    }
                }
            }
            ,
            s.prototype.onManifestParsed = function(e) {
                this.bufferCodecEventsExpected = e.altAudio ? 2 : 1,
                u.logger.log(this.bufferCodecEventsExpected + " bufferCodec event(s) expected")
            }
            ,
            s.prototype.onMediaAttaching = function(e) {
                var t = this.media = e.media;
                if (t) {
                    var r = this.mediaSource = new n;
                    this.onmso = this.onMediaSourceOpen.bind(this),
                    this.onmse = this.onMediaSourceEnded.bind(this),
                    this.onmsc = this.onMediaSourceClose.bind(this),
                    r.addEventListener("sourceopen", this.onmso),
                    r.addEventListener("sourceended", this.onmse),
                    r.addEventListener("sourceclose", this.onmsc),
                    t.src = window.URL.createObjectURL(r),
                    this._objectUrl = t.src
                }
            }
            ,
            s.prototype.onMediaDetaching = function() {
                u.logger.log("media source detaching");
                var e = this.mediaSource;
                if (e) {
                    if ("open" === e.readyState)
                        try {
                            e.endOfStream()
                        } catch (e) {
                            u.logger.warn("onMediaDetaching:" + e.message + " while calling endOfStream")
                        }
                    e.removeEventListener("sourceopen", this.onmso),
                    e.removeEventListener("sourceended", this.onmse),
                    e.removeEventListener("sourceclose", this.onmsc),
                    this.media && (window.URL.revokeObjectURL(this._objectUrl),
                    this.media.src === this._objectUrl ? (this.media.removeAttribute("src"),
                    this.media.load()) : u.logger.warn("media.src was changed by a third party - skip cleanup")),
                    this.mediaSource = null,
                    this.media = null,
                    this._objectUrl = null,
                    this.pendingTracks = {},
                    this.tracks = {},
                    this.sourceBuffer = {},
                    this.flushRange = [],
                    this.segments = [],
                    this.appended = 0
                }
                this.onmso = this.onmse = this.onmsc = null,
                this.hls.trigger(l.default.MEDIA_DETACHED)
            }
            ,
            s.prototype.onMediaSourceOpen = function() {
                u.logger.log("media source opened"),
                this.hls.trigger(l.default.MEDIA_ATTACHED, {
                    media: this.media
                });
                var e = this.mediaSource
                  , t = this.hls.config;
                e && e.removeEventListener("sourceopen", this.onmso),
                t.isLive && (e.duration = 1 / 0),
                this.checkPendingTracks()
            }
            ,
            s.prototype.checkPendingTracks = function() {
                var e = this.bufferCodecEventsExpected
                  , t = this.pendingTracks
                  , r = Object.keys(t).length;
                (r && !e || 2 === r) && (this.createSourceBuffers(t),
                this.pendingTracks = {},
                this.doAppending())
            }
            ,
            s.prototype.onMediaSourceClose = function() {
                u.logger.log("media source closed")
            }
            ,
            s.prototype.onMediaSourceEnded = function() {
                u.logger.log("media source ended")
            }
            ,
            s.prototype.onSBUpdateEnd = function() {
                if (this.audioTimestampOffset) {
                    var e = this.sourceBuffer.audio;
                    u.logger.warn("change mpeg audio timestamp offset from " + e.timestampOffset + " to " + this.audioTimestampOffset),
                    e.timestampOffset = this.audioTimestampOffset,
                    delete this.audioTimestampOffset
                }
                this._needsFlush && this.doFlush(),
                this._needsEos && this.checkEos(),
                this.appending = !1;
                var r = this.parent
                  , t = this.segments.reduce(function(e, t) {
                    return t.parent === r ? e + 1 : e
                }, 0)
                  , i = {}
                  , a = this.sourceBuffer;
                for (var n in a)
                    i[n] = a[n].buffered;
                this.hls.trigger(l.default.BUFFER_APPENDED, {
                    parent: r,
                    pending: t,
                    timeRanges: i
                }),
                this._needsFlush || this.doAppending(),
                this.updateMediaElementDuration(),
                0 === t && this.flushLiveBackBuffer()
            }
            ,
            s.prototype.onSBUpdateError = function(e) {
                u.logger.error("sourceBuffer error:", e),
                this.hls.trigger(l.default.ERROR, {
                    type: d.ErrorTypes.MEDIA_ERROR,
                    details: d.ErrorDetails.BUFFER_APPENDING_ERROR,
                    fatal: !1
                })
            }
            ,
            s.prototype.onBufferReset = function() {
                var e = this.sourceBuffer;
                for (var t in e) {
                    var r = e[t];
                    try {
                        this.mediaSource.removeSourceBuffer(r),
                        r.removeEventListener("updateend", this.onsbue),
                        r.removeEventListener("error", this.onsbe)
                    } catch (e) {}
                }
                this.sourceBuffer = {},
                this.flushRange = [],
                this.segments = [],
                this.appended = 0
            }
            ,
            s.prototype.onBufferCodecs = function(t) {
                var r = this;
                if (!Object.keys(this.sourceBuffer).length) {
                    Object.keys(t).forEach(function(e) {
                        r.pendingTracks[e] = t[e]
                    });
                    var e = this.mediaSource;
                    this.bufferCodecEventsExpected = Math.max(this.bufferCodecEventsExpected - 1, 0),
                    e && "open" === e.readyState && this.checkPendingTracks()
                }
            }
            ,
            s.prototype.createSourceBuffers = function(e) {
                var t = this.sourceBuffer
                  , r = this.mediaSource;
                for (var i in e)
                    if (!t[i]) {
                        var a = e[i]
                          , n = a.levelCodec || a.codec
                          , o = a.container + ";codecs=" + n;
                        u.logger.log("creating sourceBuffer(" + o + ")");
                        try {
                            var s = t[i] = r.addSourceBuffer(o);
                            s.addEventListener("updateend", this.onsbue),
                            s.addEventListener("error", this.onsbe),
                            this.tracks[i] = {
                                codec: n,
                                container: a.container
                            },
                            a.buffer = s
                        } catch (e) {
                            u.logger.error("error while trying to add sourceBuffer:" + e.message),
                            this.hls.trigger(l.default.ERROR, {
                                type: d.ErrorTypes.MEDIA_ERROR,
                                details: d.ErrorDetails.BUFFER_ADD_CODEC_ERROR,
                                fatal: !1,
                                err: e,
                                mimeType: o
                            })
                        }
                    }
                this.hls.trigger(l.default.BUFFER_CREATED, {
                    tracks: e
                })
            }
            ,
            s.prototype.onBufferAppending = function(e) {
                this._needsFlush || (this.segments ? this.segments.push(e) : this.segments = [e],
                this.doAppending())
            }
            ,
            s.prototype.onBufferAppendFail = function(e) {
                u.logger.error("sourceBuffer error:", e.event),
                this.hls.trigger(l.default.ERROR, {
                    type: d.ErrorTypes.MEDIA_ERROR,
                    details: d.ErrorDetails.BUFFER_APPENDING_ERROR,
                    fatal: !1
                })
            }
            ,
            s.prototype.onBufferEos = function(e) {
                var t = this.sourceBuffer
                  , r = e.type;
                for (var i in t)
                    r && i !== r || t[i].ended || (t[i].ended = !0,
                    u.logger.log(i + " sourceBuffer now EOS"));
                this.checkEos()
            }
            ,
            s.prototype.checkEos = function() {
                var e = this.sourceBuffer
                  , t = this.mediaSource;
                if (t && "open" === t.readyState) {
                    for (var r in e) {
                        var i = e[r];
                        if (!i.ended)
                            return;
                        if (i.updating)
                            return void (this._needsEos = !0)
                    }
                    u.logger.log("all media data are available, signal endOfStream() to MediaSource and stop loading fragment");
                    try {
                        t.endOfStream()
                    } catch (e) {
                        u.logger.warn("exception while calling mediaSource.endOfStream()")
                    }
                    this._needsEos = !1
                } else
                    this._needsEos = !1
            }
            ,
            s.prototype.onBufferFlushing = function(e) {
                this.flushRange.push({
                    start: e.startOffset,
                    end: e.endOffset,
                    type: e.type
                }),
                this.flushBufferCounter = 0,
                this.doFlush()
            }
            ,
            s.prototype.flushLiveBackBuffer = function() {
                if (this._live) {
                    var e = this.hls.config.liveBackBufferLength;
                    if (isFinite(e) && !(e < 0))
                        for (var t = this.media.currentTime, r = this.sourceBuffer, i = Object.keys(r), a = t - Math.max(e, this._levelTargetDuration), n = i.length - 1; 0 <= n; n--) {
                            var o = i[n]
                              , s = r[o].buffered;
                            0 < s.length && a > s.start(0) && this.removeBufferRange(o, r[o], 0, a)
                        }
                }
            }
            ,
            s.prototype.onLevelUpdated = function(e) {
                var t = e.details;
                0 < t.fragments.length && (this._levelDuration = t.totalduration + t.fragments[0].start,
                this._levelTargetDuration = t.averagetargetduration || t.targetduration || 10,
                this._live = t.live,
                this.updateMediaElementDuration())
            }
            ,
            s.prototype.updateMediaElementDuration = function() {
                var e, t = this.hls.config;
                if (null !== this._levelDuration && this.media && this.mediaSource && this.sourceBuffer && 0 !== this.media.readyState && "open" === this.mediaSource.readyState) {
                    for (var r in this.sourceBuffer)
                        if (!0 === this.sourceBuffer[r].updating)
                            return;
                    e = this.media.duration,
                    null === this._msDuration && (this._msDuration = this.mediaSource.duration),
                    !0 === this._live && !0 === t.liveDurationInfinity ? (u.logger.log("Media Source duration is set to Infinity"),
                    this._msDuration = this.mediaSource.duration = 1 / 0) : (this._levelDuration > this._msDuration && this._levelDuration > e || !i.isFinite(e)) && (u.logger.log("Updating Media Source duration to " + this._levelDuration.toFixed(3)),
                    this._msDuration = this.mediaSource.duration = this._levelDuration)
                }
            }
            ,
            s.prototype.doFlush = function() {
                for (; this.flushRange.length; ) {
                    var e = this.flushRange[0];
                    if (!this.flushBuffer(e.start, e.end, e.type))
                        return void (this._needsFlush = !0);
                    this.flushRange.shift(),
                    this.flushBufferCounter = 0
                }
                if (0 === this.flushRange.length) {
                    this._needsFlush = !1;
                    var t = 0
                      , r = this.sourceBuffer;
                    try {
                        for (var i in r)
                            t += r[i].buffered.length
                    } catch (e) {
                        u.logger.error("error while accessing sourceBuffer.buffered")
                    }
                    this.appended = t,
                    this.hls.trigger(l.default.BUFFER_FLUSHED)
                }
            }
            ,
            s.prototype.doAppending = function() {
                var e = this.hls
                  , t = this.segments
                  , r = this.sourceBuffer;
                if (u.logger.log("sourceBuffer,", r),
                Object.keys(r).length) {
                    if (this.media.error)
                        return this.segments = [],
                        void u.logger.error("trying to append although a media error occured, flush segment and abort");
                    if (this.appending)
                        return;
                    if (t && t.length) {
                        var i = t.shift();
                        try {
                            var a = r[i.type];
                            a ? a.updating ? t.unshift(i) : (a.ended = !1,
                            this.parent = i.parent,
                            a.appendBuffer(i.data),
                            this.appendError = 0,
                            this.appended++,
                            this.appending = !0) : this.onSBUpdateEnd()
                        } catch (r) {
                            u.logger.error("error while trying to append buffer:" + r.message),
                            t.unshift(i);
                            var n = {
                                type: d.ErrorTypes.MEDIA_ERROR,
                                parent: i.parent
                            };
                            22 !== r.code ? (this.appendError ? this.appendError++ : this.appendError = 1,
                            n.details = d.ErrorDetails.BUFFER_APPEND_ERROR,
                            this.appendError > e.config.appendErrorMaxRetry ? (u.logger.log("fail " + e.config.appendErrorMaxRetry + " times to append segment in sourceBuffer"),
                            this.segments = [],
                            n.fatal = !0) : n.fatal = !1) : (this.segments = [],
                            n.details = d.ErrorDetails.BUFFER_FULL_ERROR,
                            n.fatal = !1),
                            e.trigger(l.default.ERROR, n)
                        }
                    }
                }
            }
            ,
            s.prototype.flushBuffer = function(e, t, r) {
                var i, a = this.sourceBuffer;
                if (Object.keys(a).length) {
                    if (u.logger.log("flushBuffer,pos/start/end: " + this.media.currentTime.toFixed(3) + "/" + e + "/" + t),
                    this.flushBufferCounter < this.appended) {
                        for (var n in a)
                            if (!r || n === r) {
                                if ((i = a[n]).ended = !1,
                                i.updating)
                                    return u.logger.warn("cannot flush, sb updating in progress"),
                                    !1;
                                if (this.removeBufferRange(n, i, e, t))
                                    return this.flushBufferCounter++,
                                    !1
                            }
                    } else
                        u.logger.warn("abort flushing too many retries");
                    u.logger.log("buffer flushed")
                }
                return !0
            }
            ,
            s.prototype.removeBufferRange = function(e, t, r, i) {
                try {
                    for (var a = 0; a < t.buffered.length; a++) {
                        var n = t.buffered.start(a)
                          , o = t.buffered.end(a)
                          , s = Math.max(n, r)
                          , l = Math.min(o, i);
                        if (.5 < Math.min(l, o) - s)
                            return u.logger.log("sb remove " + e + " [" + s + "," + l + "], of [" + n + "," + o + "], pos:" + this.media.currentTime),
                            t.remove(s, l),
                            !0
                    }
                } catch (e) {
                    u.logger.warn("removeBufferRange failed", e)
                }
                return !1
            }
            ,
            s);
            function s(e) {
                var t = r.call(this, e, l.default.MEDIA_ATTACHING, l.default.MEDIA_DETACHING, l.default.MANIFEST_PARSED, l.default.BUFFER_RESET, l.default.BUFFER_APPENDING, l.default.BUFFER_CODECS, l.default.BUFFER_EOS, l.default.BUFFER_FLUSHING, l.default.LEVEL_PTS_UPDATED, l.default.LEVEL_UPDATED) || this;
                return t._msDuration = null,
                t._levelDuration = null,
                t._levelTargetDuration = 10,
                t._live = null,
                t._objectUrl = null,
                t.bufferCodecEventsExpected = 0,
                t.onsbue = t.onSBUpdateEnd.bind(t),
                t.onsbe = t.onSBUpdateError.bind(t),
                t.pendingTracks = {},
                t.tracks = {},
                t
            }
            f.default = o
        }
        ).call(this, c(2).Number)
    }
    , function(e, s, l) {
        "use strict";
        (function(r) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(s, "__esModule", {
                value: !0
            });
            var a, n = l(1), t = (a = l(4).default,
            e(o, a),
            o.prototype.destroy = function() {
                this.hls.config.capLevelToPlayerSize && (this.media = null,
                this._stopCapping())
            }
            ,
            o.prototype.onFpsDropLevelCapping = function(e) {
                o.isLevelAllowed(e.droppedLevel, this.restrictedLevels) && this.restrictedLevels.push(e.droppedLevel)
            }
            ,
            o.prototype.onMediaAttaching = function(e) {
                this.media = e.media instanceof window.HTMLVideoElement ? e.media : null
            }
            ,
            o.prototype.onManifestParsed = function(e) {
                var t = this.hls;
                this.restrictedLevels = [],
                this.levels = e.levels,
                this.firstLevel = e.firstLevel,
                t.config.capLevelToPlayerSize && e.video && this._startCapping()
            }
            ,
            o.prototype.onBufferCodecs = function(e) {
                this.hls.config.capLevelToPlayerSize && e.video && this._startCapping()
            }
            ,
            o.prototype.onLevelsUpdated = function(e) {
                this.levels = e.levels
            }
            ,
            o.prototype.onMediaDetaching = function() {
                this._stopCapping()
            }
            ,
            o.prototype.detectPlayerSize = function() {
                if (this.media) {
                    var e = this.levels ? this.levels.length : 0;
                    if (e) {
                        var t = this.hls;
                        t.autoLevelCapping = this.getMaxLevel(e - 1),
                        t.autoLevelCapping > this.autoLevelCapping && t.streamController.nextLevelSwitch(),
                        this.autoLevelCapping = t.autoLevelCapping
                    }
                }
            }
            ,
            o.prototype.getMaxLevel = function(r) {
                var i = this;
                if (!this.levels)
                    return -1;
                var e = this.levels.filter(function(e, t) {
                    return o.isLevelAllowed(t, i.restrictedLevels) && t <= r
                });
                return o.getMaxLevelByMediaSize(e, this.mediaWidth, this.mediaHeight)
            }
            ,
            o.prototype._startCapping = function() {
                this.timer || (this.autoLevelCapping = r.POSITIVE_INFINITY,
                this.hls.firstLevel = this.getMaxLevel(this.firstLevel),
                clearInterval(this.timer),
                this.timer = setInterval(this.detectPlayerSize.bind(this), 1e3),
                this.detectPlayerSize())
            }
            ,
            o.prototype._stopCapping = function() {
                this.restrictedLevels = [],
                this.firstLevel = null,
                this.autoLevelCapping = r.POSITIVE_INFINITY,
                this.timer && (this.timer = clearInterval(this.timer),
                this.timer = null)
            }
            ,
            Object.defineProperty(o.prototype, "mediaWidth", {
                get: function() {
                    var e, t = this.media;
                    return t && (e = t.width || t.clientWidth || t.offsetWidth,
                    e *= o.contentScaleFactor),
                    e
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(o.prototype, "mediaHeight", {
                get: function() {
                    var e, t = this.media;
                    return t && (e = t.height || t.clientHeight || t.offsetHeight,
                    e *= o.contentScaleFactor),
                    e
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(o, "contentScaleFactor", {
                get: function() {
                    var e = 1;
                    try {
                        e = window.devicePixelRatio
                    } catch (e) {}
                    return e
                },
                enumerable: !0,
                configurable: !0
            }),
            o.isLevelAllowed = function(e, t) {
                return void 0 === t && (t = []),
                -1 === t.indexOf(e)
            }
            ,
            o.getMaxLevelByMediaSize = function(e, t, r) {
                if (!e || e && !e.length)
                    return -1;
                for (var i = e.length - 1, a = 0; a < e.length; a += 1) {
                    var n = e[a];
                    if ((n.width >= t || n.height >= r) && (o = n,
                    !(s = e[a + 1]) || o.width !== s.width || o.height !== s.height)) {
                        i = a;
                        break
                    }
                }
                var o, s;
                return i
            }
            ,
            o);
            function o(e) {
                var t = a.call(this, e, n.default.FPS_DROP_LEVEL_CAPPING, n.default.MEDIA_ATTACHING, n.default.MANIFEST_PARSED, n.default.BUFFER_CODECS, n.default.MEDIA_DETACHING) || this;
                return t.autoLevelCapping = r.POSITIVE_INFINITY,
                t.firstLevel = null,
                t.levels = [],
                t.media = null,
                t.restrictedLevels = [],
                t.timer = null,
                t
            }
            s.default = t
        }
        ).call(this, l(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, d = r(1), o = r(4), f = r(0), c = window.performance, s = (n = o.default,
        a(l, n),
        l.prototype.destroy = function() {
            this.timer && clearInterval(this.timer),
            this.isVideoPlaybackQualityAvailable = !1
        }
        ,
        l.prototype.onMediaAttaching = function(e) {
            var t = this.hls.config;
            t.capLevelOnFPSDrop && ("function" == typeof (this.video = e.media instanceof window.HTMLVideoElement ? e.media : null).getVideoPlaybackQuality && (this.isVideoPlaybackQualityAvailable = !0),
            clearInterval(this.timer),
            this.timer = setInterval(this.checkFPSInterval.bind(this), t.fpsDroppedMonitoringPeriod))
        }
        ,
        l.prototype.checkFPS = function(e, t, r) {
            var i = c.now();
            if (t) {
                if (this.lastTime) {
                    var a = i - this.lastTime
                      , n = r - this.lastDroppedFrames
                      , o = t - this.lastDecodedFrames
                      , s = 1e3 * n / a
                      , l = this.hls;
                    if (l.trigger(d.default.FPS_DROP, {
                        currentDropped: n,
                        currentDecoded: o,
                        totalDroppedFrames: r
                    }),
                    0 < s && n > l.config.fpsDroppedMonitoringThreshold * o) {
                        var u = l.currentLevel;
                        f.logger.warn("drop FPS ratio greater than max allowed value for currentLevel: " + u),
                        0 < u && (-1 === l.autoLevelCapping || l.autoLevelCapping >= u) && (u -= 1,
                        l.trigger(d.default.FPS_DROP_LEVEL_CAPPING, {
                            level: u,
                            droppedLevel: l.currentLevel
                        }),
                        l.autoLevelCapping = u,
                        l.streamController.nextLevelSwitch())
                    }
                }
                this.lastTime = i,
                this.lastDroppedFrames = r,
                this.lastDecodedFrames = t
            }
        }
        ,
        l.prototype.checkFPSInterval = function() {
            var e = this.video;
            if (e)
                if (this.isVideoPlaybackQualityAvailable) {
                    var t = e.getVideoPlaybackQuality();
                    this.checkFPS(e, t.totalVideoFrames, t.droppedVideoFrames)
                } else
                    this.checkFPS(e, e.webkitDecodedFrameCount, e.webkitDroppedFrameCount)
        }
        ,
        l);
        function l(e) {
            return n.call(this, e, d.default.MEDIA_ATTACHING) || this
        }
        t.default = s
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var l = window.Request
          , u = window.Headers
          , d = window.fetch
          , f = window.performance
          , i = (a.prototype.destroy = function() {}
        ,
        a.prototype.abort = function() {}
        ,
        a.prototype.load = function(i, e, a) {
            var t, n = {
                trequest: f.now(),
                retry: 0
            }, o = i.url, r = {
                method: "GET",
                mode: "cors",
                credentials: "same-origin"
            }, s = {};
            i.rangeEnd && (s.Range = "bytes=" + i.rangeStart + "-" + String(i.rangeEnd - 1)),
            r.headers = new u(s),
            t = this.fetchSetup ? this.fetchSetup(i, r) : new l(i.url,r),
            d(t, r).then(function(e) {
                if (e.ok)
                    return n.tfirst = Math.max(n.trequest, f.now()),
                    o = e.url,
                    "arraybuffer" === i.responseType ? e.arrayBuffer() : e.text();
                a.onError({
                    text: "fetch, bad network response"
                }, i)
            }).catch(function(e) {
                a.onError({
                    text: e.message
                }, i)
            }).then(function(e) {
                if (e) {
                    var t;
                    n.tload = Math.max(n.tfirst, f.now()),
                    t = "string" == typeof e ? e.length : e.byteLength,
                    n.loaded = n.total = t;
                    var r = {
                        url: o,
                        data: e
                    };
                    a.onSuccess(r, n, i)
                }
            })
        }
        ,
        a);
        function a(e) {
            this.fetchSetup = e.fetchSetup
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, s = r(1), o = r(28), l = r(0), u = r(3), d = (n = o.default,
        a(f, n),
        f.prototype.onManifestLoading = function() {
            this.tracks = [],
            this._trackId = -1,
            this._selectDefaultTrack = !0
        }
        ,
        f.prototype.onManifestParsed = function(e) {
            var t = this.tracks = e.audioTracks || [];
            this.hls.trigger(s.default.AUDIO_TRACKS_UPDATED, {
                audioTracks: t
            })
        }
        ,
        f.prototype.onAudioTrackLoaded = function(e) {
            if (e.id >= this.tracks.length)
                l.logger.warn("Invalid audio track id:", e.id);
            else {
                if (l.logger.log("audioTrack " + e.id + " loaded"),
                this.tracks[e.id].details = e.details,
                e.details.live && !this.hasInterval()) {
                    var t = 1e3 * e.details.targetduration;
                    this.setInterval(t)
                }
                !e.details.live && this.hasInterval() && this.clearInterval()
            }
        }
        ,
        f.prototype.onAudioTrackSwitched = function(e) {
            var t = this.tracks[e.id].groupId;
            t && this.audioGroupId !== t && (this.audioGroupId = t)
        }
        ,
        f.prototype.onLevelLoaded = function(e) {
            var t = this.hls.levels[e.level];
            if (t.audioGroupIds) {
                var r = t.audioGroupIds[t.urlId];
                this.audioGroupId !== r && (this.audioGroupId = r,
                this._selectInitialAudioTrack())
            }
        }
        ,
        f.prototype.onError = function(e) {
            e.type === u.ErrorTypes.NETWORK_ERROR && (e.fatal && this.clearInterval(),
            e.details === u.ErrorDetails.AUDIO_TRACK_LOAD_ERROR && (l.logger.warn("Network failure on audio-track id:", e.context.id),
            this._handleLoadError()))
        }
        ,
        Object.defineProperty(f.prototype, "audioTracks", {
            get: function() {
                return this.tracks
            },
            enumerable: !0,
            configurable: !0
        }),
        Object.defineProperty(f.prototype, "audioTrack", {
            get: function() {
                return this._trackId
            },
            set: function(e) {
                this._setAudioTrack(e),
                this._selectDefaultTrack = !1
            },
            enumerable: !0,
            configurable: !0
        }),
        f.prototype._setAudioTrack = function(e) {
            if (this._trackId === e && this.tracks[this._trackId].details)
                l.logger.debug("Same id as current audio-track passed, and track details available -> no-op");
            else if (e < 0 || e >= this.tracks.length)
                l.logger.warn("Invalid id passed to audio-track controller");
            else {
                var t = this.tracks[e];
                l.logger.log("Now switching to audio-track index " + e),
                this.clearInterval(),
                this._trackId = e;
                var r = t.url
                  , i = t.type
                  , a = t.id;
                this.hls.trigger(s.default.AUDIO_TRACK_SWITCHING, {
                    id: a,
                    type: i,
                    url: r
                }),
                this._loadTrackDetailsIfNeeded(t)
            }
        }
        ,
        f.prototype.doTick = function() {
            this._updateTrack(this._trackId)
        }
        ,
        f.prototype._selectInitialAudioTrack = function() {
            var t = this
              , e = this.tracks;
            if (e.length) {
                var r = this.tracks[this._trackId]
                  , i = null;
                if (r && (i = r.name),
                this._selectDefaultTrack) {
                    var a = e.filter(function(e) {
                        return e.default
                    });
                    a.length ? e = a : l.logger.warn("No default audio tracks defined")
                }
                var n = !1
                  , o = function() {
                    e.forEach(function(e) {
                        n || t.audioGroupId && e.groupId !== t.audioGroupId || i && i !== e.name || (t._setAudioTrack(e.id),
                        n = !0)
                    })
                };
                o(),
                n || (i = null,
                o()),
                n || (l.logger.error("No track found for running audio group-ID: " + this.audioGroupId),
                this.hls.trigger(s.default.ERROR, {
                    type: u.ErrorTypes.MEDIA_ERROR,
                    details: u.ErrorDetails.AUDIO_TRACK_LOAD_ERROR,
                    fatal: !0
                }))
            }
        }
        ,
        f.prototype._needsTrackLoading = function(e) {
            var t = e.details
              , r = e.url;
            return !(t && !t.live || !r)
        }
        ,
        f.prototype._loadTrackDetailsIfNeeded = function(e) {
            if (this._needsTrackLoading(e)) {
                var t = e.url
                  , r = e.id;
                l.logger.log("loading audio-track playlist for id: " + r),
                this.hls.trigger(s.default.AUDIO_TRACK_LOADING, {
                    url: t,
                    id: r
                })
            }
        }
        ,
        f.prototype._updateTrack = function(e) {
            if (!(e < 0 || e >= this.tracks.length)) {
                this.clearInterval(),
                this._trackId = e,
                l.logger.log("trying to update audio-track " + e);
                var t = this.tracks[e];
                this._loadTrackDetailsIfNeeded(t)
            }
        }
        ,
        f.prototype._handleLoadError = function() {
            this.trackIdBlacklist[this._trackId] = !0;
            var e = this._trackId
              , t = this.tracks[e]
              , r = t.name
              , i = t.language
              , a = t.groupId;
            l.logger.warn("Loading failed on audio track id: " + e + ", group-id: " + a + ', name/language: "' + r + '" / "' + i + '"');
            for (var n = e, o = 0; o < this.tracks.length; o++)
                if (!this.trackIdBlacklist[o] && this.tracks[o].name === r) {
                    n = o;
                    break
                }
            n !== e ? (l.logger.log("Attempting audio-track fallback id:", n, "group-id:", this.tracks[n].groupId),
            this._setAudioTrack(n)) : l.logger.warn('No fallback audio-track found for name/language: "' + r + '" / "' + i + '"')
        }
        ,
        f);
        function f(e) {
            var t = n.call(this, e, s.default.MANIFEST_LOADING, s.default.MANIFEST_PARSED, s.default.AUDIO_TRACK_LOADED, s.default.AUDIO_TRACK_SWITCHED, s.default.LEVEL_LOADED, s.default.ERROR) || this;
            return t._trackId = -1,
            t._selectDefaultTrack = !0,
            t.tracks = [],
            t.trackIdBlacklist = Object.create(null),
            t.audioGroupId = null,
            t
        }
        t.default = d
    }
    , function(e, o, s) {
        "use strict";
        (function(C) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(o, "__esModule", {
                value: !0
            });
            var a, F = s(10), M = s(5), h = s(20), x = s(1), c = s(8), n = s(25), p = s(3), N = s(0), U = s(26), B = s(7), g = s(12), G = s(15), j = window.performance, t = (a = G.default,
            e(r, a),
            r.prototype.onInitPtsFound = function(e) {
                var t = e.id
                  , r = e.frag.cc
                  , i = e.initPTS;
                "main" === t && (this.initPTS[r] = i,
                this.videoTrackCC = r,
                N.logger.log("InitPTS for cc: " + r + " found from video track: " + i),
                this.state === G.State.WAITING_INIT_PTS && this.tick())
            }
            ,
            r.prototype.startLoad = function(e) {
                if (this.tracks) {
                    var t = this.lastCurrentTime;
                    this.stopLoad(),
                    this.setInterval(100),
                    (this.fragLoadError = 0) < t && -1 === e ? (N.logger.log("audio:override startPosition with lastCurrentTime @" + t.toFixed(3)),
                    this.state = G.State.IDLE) : (this.lastCurrentTime = this.startPosition ? this.startPosition : e,
                    this.state = G.State.STARTING),
                    this.nextLoadPosition = this.startPosition = this.lastCurrentTime,
                    this.tick()
                } else
                    this.startPosition = e,
                    this.state = G.State.STOPPED
            }
            ,
            Object.defineProperty(r.prototype, "state", {
                get: function() {
                    return this._state
                },
                set: function(e) {
                    if (this.state !== e) {
                        var t = this.state;
                        this._state = e,
                        N.logger.log("audio stream:" + t + "->" + e)
                    }
                },
                enumerable: !0,
                configurable: !0
            }),
            r.prototype.doTick = function() {
                var e, t, r, i = this.hls, a = i.config;
                switch (this.state) {
                case G.State.ERROR:
                case G.State.PAUSED:
                case G.State.BUFFER_FLUSHING:
                    break;
                case G.State.STARTING:
                    this.state = G.State.WAITING_TRACK,
                    this.loadedmetadata = !1;
                    break;
                case G.State.IDLE:
                    var n = this.tracks;
                    if (!n)
                        break;
                    if (!this.media && (this.startFragRequested || !a.startFragPrefetch))
                        break;
                    if (this.loadedmetadata)
                        e = this.media.currentTime;
                    else if (void 0 === (e = this.nextLoadPosition))
                        break;
                    var o = this.mediaBuffer ? this.mediaBuffer : this.media
                      , s = this.videoBuffer ? this.videoBuffer : this.media
                      , l = M.BufferHelper.bufferInfo(o, e, a.maxBufferHole)
                      , u = M.BufferHelper.bufferInfo(s, e, a.maxBufferHole)
                      , d = l.len
                      , f = l.end
                      , c = this.fragPrevious
                      , h = Math.min(a.maxBufferLength, a.maxMaxBufferLength)
                      , p = Math.max(h, u.len)
                      , g = this.audioSwitch
                      , v = this.trackId;
                    if ((d < p || g) && v < n.length) {
                        if (void 0 === (r = n[v].details)) {
                            this.state = G.State.WAITING_TRACK;
                            break
                        }
                        if (!g && this._streamEnded(l, r))
                            return this.hls.trigger(x.default.BUFFER_EOS, {
                                type: "audio"
                            }),
                            void (this.state = G.State.ENDED);
                        var y = r.fragments
                          , m = y.length
                          , E = y[0].start
                          , _ = y[m - 1].start + y[m - 1].duration
                          , S = void 0;
                        if (g)
                            if (r.live && !r.PTSKnown)
                                N.logger.log("switching audiotrack, live stream, unknown PTS,load first fragment"),
                                f = 0;
                            else if (f = e,
                            r.PTSKnown && e < E) {
                                if (!(l.end > E || l.nextStart))
                                    return;
                                N.logger.log("alt audio track ahead of main track, seek to start of alt audio track"),
                                this.media.currentTime = E + .05
                            }
                        if (r.initSegment && !r.initSegment.data)
                            S = r.initSegment;
                        else if (f <= E) {
                            if (S = y[0],
                            null !== this.videoTrackCC && S.cc !== this.videoTrackCC && (S = U.findFragWithCC(y, this.videoTrackCC)),
                            r.live && S.loadIdx && S.loadIdx === this.fragLoadIdx) {
                                var T = l.nextStart ? l.nextStart : E;
                                return N.logger.log("no alt audio available @currentTime:" + this.media.currentTime + ", seeking @" + (T + .05)),
                                void (this.media.currentTime = T + .05)
                            }
                        } else {
                            var b = void 0
                              , A = a.maxFragLookUpTolerance
                              , R = c ? y[c.sn - y[0].sn + 1] : void 0
                              , D = function(e) {
                                var t = Math.min(A, e.duration);
                                return e.start + e.duration - t <= f ? 1 : e.start - t > f && e.start ? -1 : 0
                            };
                            (b = f < _ ? (_ - A < f && (A = 0),
                            R && !D(R) ? R : F.default.search(y, D)) : y[m - 1]) && (E = (S = b).start,
                            c && S.level === c.level && S.sn === c.sn && (S.sn < r.endSN ? (S = y[S.sn + 1 - r.startSN],
                            N.logger.log("SN just loaded, load next one: " + S.sn)) : S = null))
                        }
                        S && (S.encrypted ? (N.logger.log("Loading key for " + S.sn + " of [" + r.startSN + " ," + r.endSN + "],track " + v),
                        this.state = G.State.KEY_LOADING,
                        i.trigger(x.default.KEY_LOADING, {
                            frag: S
                        })) : (N.logger.log("Loading " + S.sn + ", cc: " + S.cc + " of [" + r.startSN + " ," + r.endSN + "],track " + v + ", currentTime:" + e + ",bufferEnd:" + f.toFixed(3)),
                        this.fragCurrent = S,
                        !g && this.fragmentTracker.getState(S) !== B.FragmentState.NOT_LOADED || (this.startFragRequested = !0,
                        C.isFinite(S.sn) && (this.nextLoadPosition = S.start + S.duration),
                        i.trigger(x.default.FRAG_LOADING, {
                            frag: S
                        }),
                        this.state = G.State.FRAG_LOADING)))
                    }
                    break;
                case G.State.WAITING_TRACK:
                    (t = this.tracks[this.trackId]) && t.details && (this.state = G.State.IDLE);
                    break;
                case G.State.FRAG_LOADING_WAITING_RETRY:
                    var L = j.now()
                      , O = this.retryDate
                      , w = (o = this.media) && o.seeking;
                    (!O || O <= L || w) && (N.logger.log("audioStreamController: retryDate reached, switch back to IDLE state"),
                    this.state = G.State.IDLE);
                    break;
                case G.State.WAITING_INIT_PTS:
                    var I = this.videoTrackCC;
                    if (void 0 === this.initPTS[I])
                        break;
                    var P = this.waitingFragment;
                    if (P) {
                        var k = P.frag.cc;
                        I !== k ? (t = this.tracks[this.trackId]).details && t.details.live && (N.logger.warn("Waiting fragment CC (" + k + ") does not match video track CC (" + I + ")"),
                        this.waitingFragment = null,
                        this.state = G.State.IDLE) : (this.state = G.State.FRAG_LOADING,
                        this.onFragLoaded(this.waitingFragment),
                        this.waitingFragment = null)
                    } else
                        this.state = G.State.IDLE;
                    break;
                case G.State.STOPPED:
                case G.State.FRAG_LOADING:
                case G.State.PARSING:
                case G.State.PARSED:
                case G.State.ENDED:
                }
            }
            ,
            r.prototype.onMediaAttached = function(e) {
                var t = this.media = this.mediaBuffer = e.media;
                this.onvseeking = this.onMediaSeeking.bind(this),
                this.onvended = this.onMediaEnded.bind(this),
                t.addEventListener("seeking", this.onvseeking),
                t.addEventListener("ended", this.onvended);
                var r = this.config;
                this.tracks && r.autoStartLoad && this.startLoad(r.startPosition)
            }
            ,
            r.prototype.onMediaDetaching = function() {
                var e = this.media;
                e && e.ended && (N.logger.log("MSE detaching and video ended, reset startPosition"),
                this.startPosition = this.lastCurrentTime = 0),
                e && (e.removeEventListener("seeking", this.onvseeking),
                e.removeEventListener("ended", this.onvended),
                this.onvseeking = this.onvseeked = this.onvended = null),
                this.media = this.mediaBuffer = this.videoBuffer = null,
                this.loadedmetadata = !1,
                this.stopLoad()
            }
            ,
            r.prototype.onAudioTracksUpdated = function(e) {
                N.logger.log("audio tracks updated"),
                this.tracks = e.audioTracks
            }
            ,
            r.prototype.onAudioTrackSwitching = function(e) {
                var t = !!e.url;
                this.trackId = e.id,
                this.fragCurrent = null,
                this.state = G.State.PAUSED,
                this.waitingFragment = null,
                t ? this.setInterval(100) : this.demuxer && (this.demuxer.destroy(),
                this.demuxer = null),
                t && (this.audioSwitch = !0,
                this.state = G.State.IDLE),
                this.tick()
            }
            ,
            r.prototype.onAudioTrackLoaded = function(e) {
                var t = e.details
                  , r = e.id
                  , i = this.tracks[r]
                  , a = t.totalduration
                  , n = 0;
                if (N.logger.log("track " + r + " loaded [" + t.startSN + "," + t.endSN + "],duration:" + a),
                t.live) {
                    var o = i.details;
                    o && 0 < t.fragments.length ? (c.mergeDetails(o, t),
                    n = t.fragments[0].start,
                    t.PTSKnown ? N.logger.log("live audio playlist sliding:" + n.toFixed(3)) : N.logger.log("live audio playlist - outdated PTS, unknown sliding")) : (t.PTSKnown = !1,
                    N.logger.log("live audio playlist - first load, unknown sliding"))
                } else
                    t.PTSKnown = !1;
                if (i.details = t,
                !this.startFragRequested) {
                    if (-1 === this.startPosition) {
                        var s = t.startTimeOffset;
                        C.isFinite(s) ? (N.logger.log("start time offset found in playlist, adjust startPosition to " + s),
                        this.startPosition = s) : this.startPosition = 0
                    }
                    this.nextLoadPosition = this.startPosition
                }
                this.state === G.State.WAITING_TRACK && (this.state = G.State.IDLE),
                this.tick()
            }
            ,
            r.prototype.onKeyLoaded = function() {
                this.state === G.State.KEY_LOADING && (this.state = G.State.IDLE,
                this.tick())
            }
            ,
            r.prototype.onFragLoaded = function(e) {
                var t = this.fragCurrent
                  , r = e.frag;
                if (this.state === G.State.FRAG_LOADING && t && "audio" === r.type && r.level === t.level && r.sn === t.sn) {
                    var i = this.tracks[this.trackId]
                      , a = i.details
                      , n = a.totalduration
                      , o = t.level
                      , s = t.sn
                      , l = t.cc
                      , u = this.config.defaultAudioCodec || i.audioCodec || "mp4a.40.2"
                      , d = this.stats = e.stats;
                    if ("initSegment" === s)
                        this.state = G.State.IDLE,
                        d.tparsed = d.tbuffered = j.now(),
                        a.initSegment.data = e.payload,
                        this.hls.trigger(x.default.FRAG_BUFFERED, {
                            stats: d,
                            frag: t,
                            id: "audio"
                        }),
                        this.tick();
                    else {
                        this.state = G.State.PARSING,
                        this.appended = !1,
                        this.demuxer || (this.demuxer = new h.default(this.hls,"audio"));
                        var f = this.initPTS[l]
                          , c = a.initSegment ? a.initSegment.data : [];
                        a.initSegment || void 0 !== f ? (this.pendingBuffering = !0,
                        N.logger.log("Demuxing " + s + " of [" + a.startSN + " ," + a.endSN + "],track " + o),
                        this.demuxer.push(e.payload, c, u, null, t, n, !1, f)) : (N.logger.log("unknown video PTS for continuity counter " + l + ", waiting for video PTS before demuxing audio frag " + s + " of [" + a.startSN + " ," + a.endSN + "],track " + o),
                        this.waitingFragment = e,
                        this.state = G.State.WAITING_INIT_PTS)
                    }
                }
                this.fragLoadError = 0
            }
            ,
            r.prototype.onFragParsingInitSegment = function(e) {
                var t = this.fragCurrent
                  , r = e.frag;
                if (t && "audio" === e.id && r.sn === t.sn && r.level === t.level && this.state === G.State.PARSING) {
                    var i = e.tracks
                      , a = void 0;
                    if (i.video && delete i.video,
                    a = i.audio) {
                        a.levelCodec = a.codec,
                        a.id = e.id,
                        this.hls.trigger(x.default.BUFFER_CODECS, i),
                        N.logger.log("audio track:audio,container:" + a.container + ",codecs[level/parsed]=[" + a.levelCodec + "/" + a.codec + "]");
                        var n = a.initSegment;
                        if (n) {
                            var o = {
                                type: "audio",
                                data: n,
                                parent: "audio",
                                content: "initSegment"
                            };
                            this.audioSwitch ? this.pendingData = [o] : (this.appended = !0,
                            this.pendingBuffering = !0,
                            this.hls.trigger(x.default.BUFFER_APPENDING, o))
                        }
                        this.tick()
                    }
                }
            }
            ,
            r.prototype.onFragParsingData = function(t) {
                var r = this
                  , e = this.fragCurrent
                  , i = t.frag;
                if (e && "audio" === t.id && "audio" === t.type && i.sn === e.sn && i.level === e.level && this.state === G.State.PARSING) {
                    var a = this.trackId
                      , n = this.tracks[a]
                      , o = this.hls;
                    C.isFinite(t.endPTS) || (t.endPTS = t.startPTS + e.duration,
                    t.endDTS = t.startDTS + e.duration),
                    e.addElementaryStream(g.default.ElementaryStreamTypes.AUDIO),
                    N.logger.log("parsed " + t.type + ",PTS:[" + t.startPTS.toFixed(3) + "," + t.endPTS.toFixed(3) + "],DTS:[" + t.startDTS.toFixed(3) + "/" + t.endDTS.toFixed(3) + "],nb:" + t.nb),
                    c.updateFragPTSDTS(n.details, e, t.startPTS, t.endPTS);
                    var s = this.audioSwitch
                      , l = this.media
                      , u = !1;
                    if (s && l)
                        if (l.readyState) {
                            var d = l.currentTime;
                            N.logger.log("switching audio track : currentTime:" + d),
                            d >= t.startPTS && (N.logger.log("switching audio track : flushing all audio"),
                            this.state = G.State.BUFFER_FLUSHING,
                            o.trigger(x.default.BUFFER_FLUSHING, {
                                startOffset: 0,
                                endOffset: C.POSITIVE_INFINITY,
                                type: "audio"
                            }),
                            u = !0,
                            this.audioSwitch = !1,
                            o.trigger(x.default.AUDIO_TRACK_SWITCHED, {
                                id: a
                            }))
                        } else
                            this.audioSwitch = !1,
                            o.trigger(x.default.AUDIO_TRACK_SWITCHED, {
                                id: a
                            });
                    var f = this.pendingData;
                    if (!f)
                        return N.logger.warn("Apparently attempt to enqueue media payload without codec initialization data upfront"),
                        void o.trigger(x.default.ERROR, {
                            type: p.ErrorTypes.MEDIA_ERROR,
                            details: null,
                            fatal: !0
                        });
                    this.audioSwitch || ([t.data1, t.data2].forEach(function(e) {
                        e && e.length && f.push({
                            type: t.type,
                            data: e,
                            parent: "audio",
                            content: "data"
                        })
                    }),
                    !u && f.length && (f.forEach(function(e) {
                        r.state === G.State.PARSING && (r.pendingBuffering = !0,
                        r.hls.trigger(x.default.BUFFER_APPENDING, e))
                    }),
                    this.pendingData = [],
                    this.appended = !0)),
                    this.tick()
                }
            }
            ,
            r.prototype.onFragParsed = function(e) {
                var t = this.fragCurrent
                  , r = e.frag;
                t && "audio" === e.id && r.sn === t.sn && r.level === t.level && this.state === G.State.PARSING && (this.stats.tparsed = j.now(),
                this.state = G.State.PARSED,
                this._checkAppendedParsed())
            }
            ,
            r.prototype.onBufferReset = function() {
                this.mediaBuffer = this.videoBuffer = null,
                this.loadedmetadata = !1
            }
            ,
            r.prototype.onBufferCreated = function(e) {
                var t = e.tracks.audio;
                t && (this.mediaBuffer = t.buffer,
                this.loadedmetadata = !0),
                e.tracks.video && (this.videoBuffer = e.tracks.video.buffer)
            }
            ,
            r.prototype.onBufferAppended = function(e) {
                if ("audio" === e.parent) {
                    var t = this.state;
                    t !== G.State.PARSING && t !== G.State.PARSED || (this.pendingBuffering = 0 < e.pending,
                    this._checkAppendedParsed())
                }
            }
            ,
            r.prototype._checkAppendedParsed = function() {
                if (!(this.state !== G.State.PARSED || this.appended && this.pendingBuffering)) {
                    var e = this.fragCurrent
                      , t = this.stats
                      , r = this.hls;
                    if (e) {
                        this.fragPrevious = e,
                        t.tbuffered = j.now(),
                        r.trigger(x.default.FRAG_BUFFERED, {
                            stats: t,
                            frag: e,
                            id: "audio"
                        });
                        var i = this.mediaBuffer ? this.mediaBuffer : this.media;
                        N.logger.log("audio buffered : " + n.default.toString(i.buffered)),
                        this.audioSwitch && this.appended && (this.audioSwitch = !1,
                        r.trigger(x.default.AUDIO_TRACK_SWITCHED, {
                            id: this.trackId
                        })),
                        this.state = G.State.IDLE
                    }
                    this.tick()
                }
            }
            ,
            r.prototype.onError = function(e) {
                var t = e.frag;
                if (!t || "audio" === t.type)
                    switch (e.details) {
                    case p.ErrorDetails.FRAG_LOAD_ERROR:
                    case p.ErrorDetails.FRAG_LOAD_TIMEOUT:
                        var r = e.frag;
                        if (r && "audio" !== r.type)
                            break;
                        if (!e.fatal) {
                            var i = this.fragLoadError;
                            if (i ? i++ : i = 1,
                            i <= (n = this.config).fragLoadingMaxRetry) {
                                this.fragLoadError = i;
                                var a = Math.min(Math.pow(2, i - 1) * n.fragLoadingRetryDelay, n.fragLoadingMaxRetryTimeout);
                                N.logger.warn("AudioStreamController: frag loading failed, retry in " + a + " ms"),
                                this.retryDate = j.now() + a,
                                this.state = G.State.FRAG_LOADING_WAITING_RETRY
                            } else
                                N.logger.error("AudioStreamController: " + e.details + " reaches max retry, redispatch as fatal ..."),
                                e.fatal = !0,
                                this.state = G.State.ERROR
                        }
                        break;
                    case p.ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
                    case p.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
                    case p.ErrorDetails.KEY_LOAD_ERROR:
                    case p.ErrorDetails.KEY_LOAD_TIMEOUT:
                        this.state !== G.State.ERROR && (this.state = e.fatal ? G.State.ERROR : G.State.IDLE,
                        N.logger.warn("AudioStreamController: " + e.details + " while loading frag, now switching to " + this.state + " state ..."));
                        break;
                    case p.ErrorDetails.BUFFER_FULL_ERROR:
                        if ("audio" === e.parent && (this.state === G.State.PARSING || this.state === G.State.PARSED)) {
                            var n, o = this.mediaBuffer, s = this.media.currentTime;
                            o && M.BufferHelper.isBuffered(o, s) && M.BufferHelper.isBuffered(o, s + .5) ? ((n = this.config).maxMaxBufferLength >= n.maxBufferLength && (n.maxMaxBufferLength /= 2,
                            N.logger.warn("AudioStreamController: reduce max buffer length to " + n.maxMaxBufferLength + "s")),
                            this.state = G.State.IDLE) : (N.logger.warn("AudioStreamController: buffer full error also media.currentTime is not buffered, flush audio buffer"),
                            this.fragCurrent = null,
                            this.state = G.State.BUFFER_FLUSHING,
                            this.hls.trigger(x.default.BUFFER_FLUSHING, {
                                startOffset: 0,
                                endOffset: C.POSITIVE_INFINITY,
                                type: "audio"
                            }))
                        }
                    }
            }
            ,
            r.prototype.onBufferFlushed = function() {
                var t = this
                  , e = this.pendingData;
                e && e.length ? (N.logger.log("AudioStreamController: appending pending audio data after buffer flushed"),
                e.forEach(function(e) {
                    t.hls.trigger(x.default.BUFFER_APPENDING, e)
                }),
                this.appended = !0,
                this.pendingData = [],
                this.state = G.State.PARSED) : (this.state = G.State.IDLE,
                this.fragPrevious = null,
                this.tick())
            }
            ,
            r);
            function r(e, t) {
                var r = a.call(this, e, x.default.MEDIA_ATTACHED, x.default.MEDIA_DETACHING, x.default.AUDIO_TRACKS_UPDATED, x.default.AUDIO_TRACK_SWITCHING, x.default.AUDIO_TRACK_LOADED, x.default.KEY_LOADED, x.default.FRAG_LOADED, x.default.FRAG_PARSING_INIT_SEGMENT, x.default.FRAG_PARSING_DATA, x.default.FRAG_PARSED, x.default.ERROR, x.default.BUFFER_RESET, x.default.BUFFER_CREATED, x.default.BUFFER_APPENDED, x.default.BUFFER_FLUSHED, x.default.INIT_PTS_FOUND) || this;
                return r.fragmentTracker = t,
                r.config = e.config,
                r.audioCodecSwap = !1,
                r._state = G.State.STOPPED,
                r.initPTS = [],
                r.waitingFragment = null,
                r.videoTrackCC = null,
                r
            }
            o.default = t
        }
        ).call(this, s(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var c = r(30);
        t.newCue = function(e, t, r, i) {
            for (var a, n, o, s, l, u = window.VTTCue || window.TextTrackCue, d = 0; d < i.rows.length; d++)
                if (o = !0,
                s = 0,
                l = "",
                !(a = i.rows[d]).isEmpty()) {
                    for (var f = 0; f < a.chars.length; f++)
                        a.chars[f].uchar.match(/\s/) && o ? s++ : (l += a.chars[f].uchar,
                        o = !1);
                    (a.cueStartTime = t) === r && (r += 1e-4),
                    n = new u(t,r,c.fixLineBreaks(l.trim())),
                    16 <= s ? s-- : s++,
                    navigator.userAgent.match(/Firefox\//) ? n.line = d + 1 : n.line = 7 < d ? d - 2 : d + 1,
                    n.align = "left",
                    n.position = Math.max(0, Math.min(100, s / 32 * 100 + (navigator.userAgent.match(/Firefox\//) ? 50 : 0))),
                    e.addCue(n)
                }
        }
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        }),
        t.default = function() {
            if ("undefined" != typeof window && window.VTTCue)
                return window.VTTCue;
            var _ = {
                "": !0,
                lr: !0,
                rl: !0
            }
              , t = {
                start: !0,
                middle: !0,
                end: !0,
                left: !0,
                right: !0
            };
            function S(e) {
                return "string" == typeof e && !!t[e.toLowerCase()] && e.toLowerCase()
            }
            function T(e) {
                for (var t = 1; t < arguments.length; t++) {
                    var r = arguments[t];
                    for (var i in r)
                        e[i] = r[i]
                }
                return e
            }
            function e(e, t, r) {
                var i = this
                  , a = function() {
                    if ("undefined" != typeof navigator)
                        return /MSIE\s8\.0/.test(navigator.userAgent)
                }()
                  , n = {};
                a ? i = document.createElement("custom") : n.enumerable = !0,
                i.hasBeenReset = !1;
                var o = ""
                  , s = !1
                  , l = e
                  , u = t
                  , d = r
                  , f = null
                  , c = ""
                  , h = !0
                  , p = "auto"
                  , g = "start"
                  , v = 50
                  , y = "middle"
                  , m = 50
                  , E = "middle";
                if (Object.defineProperty(i, "id", T({}, n, {
                    get: function() {
                        return o
                    },
                    set: function(e) {
                        o = "" + e
                    }
                })),
                Object.defineProperty(i, "pauseOnExit", T({}, n, {
                    get: function() {
                        return s
                    },
                    set: function(e) {
                        s = !!e
                    }
                })),
                Object.defineProperty(i, "startTime", T({}, n, {
                    get: function() {
                        return l
                    },
                    set: function(e) {
                        if ("number" != typeof e)
                            throw new TypeError("Start time must be set to a number.");
                        l = e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "endTime", T({}, n, {
                    get: function() {
                        return u
                    },
                    set: function(e) {
                        if ("number" != typeof e)
                            throw new TypeError("End time must be set to a number.");
                        u = e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "text", T({}, n, {
                    get: function() {
                        return d
                    },
                    set: function(e) {
                        d = "" + e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "region", T({}, n, {
                    get: function() {
                        return f
                    },
                    set: function(e) {
                        f = e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "vertical", T({}, n, {
                    get: function() {
                        return c
                    },
                    set: function(e) {
                        var t, r = "string" == typeof (t = e) && !!_[t.toLowerCase()] && t.toLowerCase();
                        if (!1 === r)
                            throw new SyntaxError("An invalid or illegal string was specified.");
                        c = r,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "snapToLines", T({}, n, {
                    get: function() {
                        return h
                    },
                    set: function(e) {
                        h = !!e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "line", T({}, n, {
                    get: function() {
                        return p
                    },
                    set: function(e) {
                        if ("number" != typeof e && "auto" !== e)
                            throw new SyntaxError("An invalid number or illegal string was specified.");
                        p = e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "lineAlign", T({}, n, {
                    get: function() {
                        return g
                    },
                    set: function(e) {
                        var t = S(e);
                        if (!t)
                            throw new SyntaxError("An invalid or illegal string was specified.");
                        g = t,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "position", T({}, n, {
                    get: function() {
                        return v
                    },
                    set: function(e) {
                        if (e < 0 || 100 < e)
                            throw new Error("Position must be between 0 and 100.");
                        v = e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "positionAlign", T({}, n, {
                    get: function() {
                        return y
                    },
                    set: function(e) {
                        var t = S(e);
                        if (!t)
                            throw new SyntaxError("An invalid or illegal string was specified.");
                        y = t,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "size", T({}, n, {
                    get: function() {
                        return m
                    },
                    set: function(e) {
                        if (e < 0 || 100 < e)
                            throw new Error("Size must be between 0 and 100.");
                        m = e,
                        this.hasBeenReset = !0
                    }
                })),
                Object.defineProperty(i, "align", T({}, n, {
                    get: function() {
                        return E
                    },
                    set: function(e) {
                        var t = S(e);
                        if (!t)
                            throw new SyntaxError("An invalid or illegal string was specified.");
                        E = t,
                        this.hasBeenReset = !0
                    }
                })),
                i.displayState = void 0,
                a)
                    return i
            }
            return e.prototype.getCueAsHTML = function() {
                return window.WebVTT.convertCueToDOMTree(window, this.text)
            }
            ,
            e
        }()
    }
    , function(e, h, p) {
        "use strict";
        (function(o) {
            var i, e = this && this.__extends || (i = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                i(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(h, "__esModule", {
                value: !0
            });
            var s = p(1)
              , t = p(4)
              , a = p(71)
              , n = p(72)
              , l = p(73)
              , u = p(0)
              , d = p(29);
            var f, r = (f = t.default,
            e(c, f),
            c.prototype.addCues = function(e, t, r, i) {
                for (var a = this.cueRanges, n = !1, o = a.length; o--; ) {
                    var s = a[o]
                      , l = (u = s[0],
                    d = s[1],
                    f = t,
                    c = r,
                    Math.min(d, c) - Math.max(u, f));
                    if (0 <= l && (s[0] = Math.min(s[0], t),
                    s[1] = Math.max(s[1], r),
                    n = !0,
                    .5 < l / (r - t)))
                        return
                }
                var u, d, f, c;
                n || a.push([t, r]),
                this.Cues.newCue(this.captionsTracks[e], t, r, i)
            }
            ,
            c.prototype.onInitPtsFound = function(e) {
                var t = this;
                if ("main" === e.id && (this.initPTS[e.frag.cc] = e.initPTS),
                this.unparsedVttFrags.length) {
                    var r = this.unparsedVttFrags;
                    this.unparsedVttFrags = [],
                    r.forEach(function(e) {
                        t.onFragLoaded(e)
                    })
                }
            }
            ,
            c.prototype.getExistingTrack = function(e) {
                var t = this.media;
                if (t)
                    for (var r = 0; r < t.textTracks.length; r++) {
                        var i = t.textTracks[r];
                        if (i[e])
                            return i
                    }
                return null
            }
            ,
            c.prototype.createCaptionsTrack = function(e) {
                var t = this.captionsProperties[e]
                  , r = t.label
                  , i = t.languageCode
                  , a = this.captionsTracks;
                if (!a[e]) {
                    var n = this.getExistingTrack(e);
                    if (n)
                        a[e] = n,
                        d.clearCurrentCues(a[e]),
                        d.sendAddTrackEvent(a[e], this.media);
                    else {
                        var o = this.createTextTrack("captions", r, i);
                        o && (o[e] = !0,
                        a[e] = o)
                    }
                }
            }
            ,
            c.prototype.createTextTrack = function(e, t, r) {
                var i = this.media;
                if (i)
                    return i.addTextTrack(e, t, r)
            }
            ,
            c.prototype.destroy = function() {
                t.default.prototype.destroy.call(this)
            }
            ,
            c.prototype.onMediaAttaching = function(e) {
                this.media = e.media,
                this._cleanTracks()
            }
            ,
            c.prototype.onMediaDetaching = function() {
                var t = this.captionsTracks;
                Object.keys(t).forEach(function(e) {
                    d.clearCurrentCues(t[e]),
                    delete t[e]
                })
            }
            ,
            c.prototype.onManifestLoading = function() {
                this.lastSn = -1,
                this.prevCC = -1,
                this.vttCCs = {
                    ccOffset: 0,
                    presentationOffset: 0,
                    0: {
                        start: 0,
                        prevCC: -1,
                        new: !1
                    }
                },
                this._cleanTracks()
            }
            ,
            c.prototype._cleanTracks = function() {
                var e = this.media;
                if (e) {
                    var t = e.textTracks;
                    if (t)
                        for (var r = 0; r < t.length; r++)
                            d.clearCurrentCues(t[r])
                }
            }
            ,
            c.prototype.onManifestLoaded = function(e) {
                var s = this;
                if (this.textTracks = [],
                this.unparsedVttFrags = this.unparsedVttFrags || [],
                this.initPTS = [],
                this.cueRanges = [],
                this.config.enableWebVTT) {
                    this.tracks = e.subtitles || [];
                    var l = this.media ? this.media.textTracks : [];
                    this.tracks.forEach(function(e, t) {
                        var r, i, a;
                        if (t < l.length) {
                            for (var n = null, o = 0; o < l.length; o++)
                                if (i = l[o],
                                a = e,
                                i && i.label === a.name && !i.textTrack1 && !i.textTrack2) {
                                    n = l[o];
                                    break
                                }
                            n && (r = n)
                        }
                        r = r || s.createTextTrack("subtitles", e.name, e.lang),
                        e.default ? r.mode = s.hls.subtitleDisplay ? "showing" : "hidden" : r.mode = "disabled",
                        s.textTracks.push(r)
                    })
                }
            }
            ,
            c.prototype.onLevelSwitching = function() {
                this.enabled = "NONE" !== this.hls.currentLevel.closedCaptions
            }
            ,
            c.prototype.onFragLoaded = function(e) {
                var t = e.frag
                  , r = e.payload;
                if ("main" === t.type) {
                    var i = t.sn;
                    if (i !== this.lastSn + 1) {
                        var a = this.cea608Parser;
                        a && a.reset()
                    }
                    this.lastSn = i
                } else if ("subtitle" === t.type)
                    if (r.byteLength) {
                        if (!o.isFinite(this.initPTS[t.cc]))
                            return this.unparsedVttFrags.push(e),
                            void (this.initPTS.length && this.hls.trigger(s.default.SUBTITLE_FRAG_PROCESSED, {
                                success: !1,
                                frag: t
                            }));
                        var n = t.decryptdata;
                        null != n && null != n.key && "AES-128" === n.method || this._parseVTTs(t, r)
                    } else
                        this.hls.trigger(s.default.SUBTITLE_FRAG_PROCESSED, {
                            success: !1,
                            frag: t
                        })
            }
            ,
            c.prototype._parseVTTs = function(t, e) {
                var r = this.vttCCs;
                r[t.cc] || (r[t.cc] = {
                    start: t.start,
                    prevCC: this.prevCC,
                    new: !0
                },
                this.prevCC = t.cc);
                var a = this.textTracks
                  , n = this.hls;
                l.default.parse(e, this.initPTS[t.cc], r, t.cc, function(e) {
                    var i = a[t.level];
                    "disabled" !== i.mode ? (e.forEach(function(t) {
                        if (!i.cues.getCueById(t.id))
                            try {
                                i.addCue(t)
                            } catch (e) {
                                var r = new window.TextTrackCue(t.startTime,t.endTime,t.text);
                                r.id = t.id,
                                i.addCue(r)
                            }
                    }),
                    n.trigger(s.default.SUBTITLE_FRAG_PROCESSED, {
                        success: !0,
                        frag: t
                    })) : n.trigger(s.default.SUBTITLE_FRAG_PROCESSED, {
                        success: !1,
                        frag: t
                    })
                }, function(e) {
                    u.logger.log("Failed to parse VTT cue: " + e),
                    n.trigger(s.default.SUBTITLE_FRAG_PROCESSED, {
                        success: !1,
                        frag: t
                    })
                })
            }
            ,
            c.prototype.onFragDecrypted = function(e) {
                var t = e.payload
                  , r = e.frag;
                if ("subtitle" === r.type) {
                    if (!o.isFinite(this.initPTS[r.cc]))
                        return void this.unparsedVttFrags.push(e);
                    this._parseVTTs(r, t)
                }
            }
            ,
            c.prototype.onFragParsingUserdata = function(e) {
                if (this.enabled && this.config.enableCEA708Captions)
                    for (var t = 0; t < e.samples.length; t++) {
                        var r = this.extractCea608Data(e.samples[t].bytes);
                        this.cea608Parser.addData(e.samples[t].pts, r)
                    }
            }
            ,
            c.prototype.extractCea608Data = function(e) {
                for (var t, r, i, a = 31 & e[0], n = 2, o = [], s = 0; s < a; s++)
                    t = e[n++],
                    r = 127 & e[n++],
                    i = 127 & e[n++],
                    0 == r && 0 == i || 0 != (4 & t) && 0 == (3 & t) && (o.push(r),
                    o.push(i));
                return o
            }
            ,
            c);
            function c(e) {
                var t = f.call(this, e, s.default.MEDIA_ATTACHING, s.default.MEDIA_DETACHING, s.default.FRAG_PARSING_USERDATA, s.default.FRAG_DECRYPTED, s.default.MANIFEST_LOADING, s.default.MANIFEST_LOADED, s.default.FRAG_LOADED, s.default.LEVEL_SWITCHING, s.default.INIT_PTS_FOUND) || this;
                if (t.hls = e,
                t.config = e.config,
                t.enabled = !0,
                t.Cues = e.config.cueHandler,
                t.textTracks = [],
                t.tracks = [],
                t.unparsedVttFrags = [],
                t.initPTS = [],
                t.cueRanges = [],
                t.captionsTracks = {},
                t.captionsProperties = {
                    textTrack1: {
                        label: t.config.captionsTextTrack1Label,
                        languageCode: t.config.captionsTextTrack1LanguageCode
                    },
                    textTrack2: {
                        label: t.config.captionsTextTrack2Label,
                        languageCode: t.config.captionsTextTrack2LanguageCode
                    }
                },
                t.config.enableCEA708Captions) {
                    var r = new n.default(t,"textTrack1")
                      , i = new n.default(t,"textTrack2");
                    t.cea608Parser = new a.default(0,r,i)
                }
                return t
            }
            h.default = r
        }
        ).call(this, p(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        function s(e) {
            var t = e;
            return i.hasOwnProperty(e) && (t = i[e]),
            String.fromCharCode(t)
        }
        function l(e) {
            for (var t = [], r = 0; r < e.length; r++)
                t.push(e[r].toString(16));
            return t
        }
        var i = {
            42: 225,
            92: 233,
            94: 237,
            95: 243,
            96: 250,
            123: 231,
            124: 247,
            125: 209,
            126: 241,
            127: 9608,
            128: 174,
            129: 176,
            130: 189,
            131: 191,
            132: 8482,
            133: 162,
            134: 163,
            135: 9834,
            136: 224,
            137: 32,
            138: 232,
            139: 226,
            140: 234,
            141: 238,
            142: 244,
            143: 251,
            144: 193,
            145: 201,
            146: 211,
            147: 218,
            148: 220,
            149: 252,
            150: 8216,
            151: 161,
            152: 42,
            153: 8217,
            154: 9473,
            155: 169,
            156: 8480,
            157: 8226,
            158: 8220,
            159: 8221,
            160: 192,
            161: 194,
            162: 199,
            163: 200,
            164: 202,
            165: 203,
            166: 235,
            167: 206,
            168: 207,
            169: 239,
            170: 212,
            171: 217,
            172: 249,
            173: 219,
            174: 171,
            175: 187,
            176: 195,
            177: 227,
            178: 205,
            179: 204,
            180: 236,
            181: 210,
            182: 242,
            183: 213,
            184: 245,
            185: 123,
            186: 125,
            187: 92,
            188: 94,
            189: 95,
            190: 124,
            191: 8764,
            192: 196,
            193: 228,
            194: 214,
            195: 246,
            196: 223,
            197: 165,
            198: 164,
            199: 9475,
            200: 197,
            201: 229,
            202: 216,
            203: 248,
            204: 9487,
            205: 9491,
            206: 9495,
            207: 9499
        }
          , n = {
            17: 1,
            18: 3,
            21: 5,
            22: 7,
            23: 9,
            16: 11,
            19: 12,
            20: 14
        }
          , o = {
            17: 2,
            18: 4,
            21: 6,
            22: 8,
            23: 10,
            19: 13,
            20: 15
        }
          , u = {
            25: 1,
            26: 3,
            29: 5,
            30: 7,
            31: 9,
            24: 11,
            27: 12,
            28: 14
        }
          , d = {
            25: 2,
            26: 4,
            29: 6,
            30: 8,
            31: 10,
            27: 13,
            28: 15
        }
          , f = ["white", "green", "blue", "cyan", "red", "yellow", "magenta", "black", "transparent"]
          , c = {
            verboseFilter: {
                DATA: 3,
                DEBUG: 3,
                INFO: 2,
                WARNING: 2,
                TEXT: 1,
                ERROR: 0
            },
            time: null,
            verboseLevel: 0,
            setTime: function(e) {
                this.time = e
            },
            log: function(e, t) {
                this.verboseFilter[e],
                this.verboseLevel
            }
        }
          , h = (b.prototype.reset = function() {
            this.foreground = "white",
            this.underline = !1,
            this.italics = !1,
            this.background = "black",
            this.flash = !1
        }
        ,
        b.prototype.setStyles = function(e) {
            for (var t = ["foreground", "underline", "italics", "background", "flash"], r = 0; r < t.length; r++) {
                var i = t[r];
                e.hasOwnProperty(i) && (this[i] = e[i])
            }
        }
        ,
        b.prototype.isDefault = function() {
            return "white" === this.foreground && !this.underline && !this.italics && "black" === this.background && !this.flash
        }
        ,
        b.prototype.equals = function(e) {
            return this.foreground === e.foreground && this.underline === e.underline && this.italics === e.italics && this.background === e.background && this.flash === e.flash
        }
        ,
        b.prototype.copy = function(e) {
            this.foreground = e.foreground,
            this.underline = e.underline,
            this.italics = e.italics,
            this.background = e.background,
            this.flash = e.flash
        }
        ,
        b.prototype.toString = function() {
            return "color=" + this.foreground + ", underline=" + this.underline + ", italics=" + this.italics + ", background=" + this.background + ", flash=" + this.flash
        }
        ,
        b)
          , a = (T.prototype.reset = function() {
            this.uchar = " ",
            this.penState.reset()
        }
        ,
        T.prototype.setChar = function(e, t) {
            this.uchar = e,
            this.penState.copy(t)
        }
        ,
        T.prototype.setPenState = function(e) {
            this.penState.copy(e)
        }
        ,
        T.prototype.equals = function(e) {
            return this.uchar === e.uchar && this.penState.equals(e.penState)
        }
        ,
        T.prototype.copy = function(e) {
            this.uchar = e.uchar,
            this.penState.copy(e.penState)
        }
        ,
        T.prototype.isEmpty = function() {
            return " " === this.uchar && this.penState.isDefault()
        }
        ,
        T)
          , p = (S.prototype.equals = function(e) {
            for (var t = !0, r = 0; r < 100; r++)
                if (!this.chars[r].equals(e.chars[r])) {
                    t = !1;
                    break
                }
            return t
        }
        ,
        S.prototype.copy = function(e) {
            for (var t = 0; t < 100; t++)
                this.chars[t].copy(e.chars[t])
        }
        ,
        S.prototype.isEmpty = function() {
            for (var e = !0, t = 0; t < 100; t++)
                if (!this.chars[t].isEmpty()) {
                    e = !1;
                    break
                }
            return e
        }
        ,
        S.prototype.setCursor = function(e) {
            this.pos !== e && (this.pos = e),
            this.pos < 0 ? (c.log("ERROR", "Negative cursor position " + this.pos),
            this.pos = 0) : 100 < this.pos && (c.log("ERROR", "Too large cursor position " + this.pos),
            this.pos = 100)
        }
        ,
        S.prototype.moveCursor = function(e) {
            var t = this.pos + e;
            if (1 < e)
                for (var r = this.pos + 1; r < t + 1; r++)
                    this.chars[r].setPenState(this.currPenState);
            this.setCursor(t)
        }
        ,
        S.prototype.backSpace = function() {
            this.moveCursor(-1),
            this.chars[this.pos].setChar(" ", this.currPenState)
        }
        ,
        S.prototype.insertChar = function(e) {
            144 <= e && this.backSpace();
            var t = s(e);
            100 <= this.pos ? c.log("ERROR", "Cannot insert " + e.toString(16) + " (" + t + ") at position " + this.pos + ". Skipping it!") : (this.chars[this.pos].setChar(t, this.currPenState),
            this.moveCursor(1))
        }
        ,
        S.prototype.clearFromPos = function(e) {
            var t;
            for (t = e; t < 100; t++)
                this.chars[t].reset()
        }
        ,
        S.prototype.clear = function() {
            this.clearFromPos(0),
            this.pos = 0,
            this.currPenState.reset()
        }
        ,
        S.prototype.clearToEndOfRow = function() {
            this.clearFromPos(this.pos)
        }
        ,
        S.prototype.getTextString = function() {
            for (var e = [], t = !0, r = 0; r < 100; r++) {
                var i = this.chars[r].uchar;
                " " !== i && (t = !1),
                e.push(i)
            }
            return t ? "" : e.join("")
        }
        ,
        S.prototype.setPenStyles = function(e) {
            this.currPenState.setStyles(e),
            this.chars[this.pos].setPenState(this.currPenState)
        }
        ,
        S)
          , g = (_.prototype.reset = function() {
            for (var e = 0; e < 15; e++)
                this.rows[e].clear();
            this.currRow = 14
        }
        ,
        _.prototype.equals = function(e) {
            for (var t = !0, r = 0; r < 15; r++)
                if (!this.rows[r].equals(e.rows[r])) {
                    t = !1;
                    break
                }
            return t
        }
        ,
        _.prototype.copy = function(e) {
            for (var t = 0; t < 15; t++)
                this.rows[t].copy(e.rows[t])
        }
        ,
        _.prototype.isEmpty = function() {
            for (var e = !0, t = 0; t < 15; t++)
                if (!this.rows[t].isEmpty()) {
                    e = !1;
                    break
                }
            return e
        }
        ,
        _.prototype.backSpace = function() {
            this.rows[this.currRow].backSpace()
        }
        ,
        _.prototype.clearToEndOfRow = function() {
            this.rows[this.currRow].clearToEndOfRow()
        }
        ,
        _.prototype.insertChar = function(e) {
            this.rows[this.currRow].insertChar(e)
        }
        ,
        _.prototype.setPen = function(e) {
            this.rows[this.currRow].setPenStyles(e)
        }
        ,
        _.prototype.moveCursor = function(e) {
            this.rows[this.currRow].moveCursor(e)
        }
        ,
        _.prototype.setCursor = function(e) {
            c.log("INFO", "setCursor: " + e),
            this.rows[this.currRow].setCursor(e)
        }
        ,
        _.prototype.setPAC = function(e) {
            c.log("INFO", "pacData = " + JSON.stringify(e));
            var t = e.row - 1;
            if (this.nrRollUpRows && t < this.nrRollUpRows - 1 && (t = this.nrRollUpRows - 1),
            this.nrRollUpRows && this.currRow !== t) {
                for (var r = 0; r < 15; r++)
                    this.rows[r].clear();
                var i = this.currRow + 1 - this.nrRollUpRows
                  , a = this.lastOutputScreen;
                if (a) {
                    var n = a.rows[i].cueStartTime;
                    if (n && n < c.time)
                        for (r = 0; r < this.nrRollUpRows; r++)
                            this.rows[t - this.nrRollUpRows + r + 1].copy(a.rows[i + r])
                }
            }
            this.currRow = t;
            var o = this.rows[this.currRow];
            if (null !== e.indent) {
                var s = e.indent
                  , l = Math.max(s - 1, 0);
                o.setCursor(e.indent),
                e.color = o.chars[l].penState.foreground
            }
            var u = {
                foreground: e.color,
                underline: e.underline,
                italics: e.italics,
                background: "black",
                flash: !1
            };
            this.setPen(u)
        }
        ,
        _.prototype.setBkgData = function(e) {
            c.log("INFO", "bkgData = " + JSON.stringify(e)),
            this.backSpace(),
            this.setPen(e),
            this.insertChar(32)
        }
        ,
        _.prototype.setRollUpRows = function(e) {
            this.nrRollUpRows = e
        }
        ,
        _.prototype.rollUp = function() {
            if (null !== this.nrRollUpRows) {
                c.log("TEXT", this.getDisplayText());
                var e = this.currRow + 1 - this.nrRollUpRows
                  , t = this.rows.splice(e, 1)[0];
                t.clear(),
                this.rows.splice(this.currRow, 0, t),
                c.log("INFO", "Rolling up")
            } else
                c.log("DEBUG", "roll_up but nrRollUpRows not set yet")
        }
        ,
        _.prototype.getDisplayText = function(e) {
            e = e || !1;
            for (var t = [], r = "", i = -1, a = 0; a < 15; a++) {
                var n = this.rows[a].getTextString();
                n && (i = a + 1,
                e ? t.push("Row " + i + ": '" + n + "'") : t.push(n.trim()))
            }
            return 0 < t.length && (r = e ? "[" + t.join(" | ") + "]" : t.join("\n")),
            r
        }
        ,
        _.prototype.getTextAndFormat = function() {
            return this.rows
        }
        ,
        _)
          , v = (E.prototype.reset = function() {
            this.mode = null,
            this.displayedMemory.reset(),
            this.nonDisplayedMemory.reset(),
            this.lastOutputScreen.reset(),
            this.currRollUpRow = this.displayedMemory.rows[14],
            this.writeScreen = this.displayedMemory,
            this.mode = null,
            this.cueStartTime = null,
            this.lastCueEndTime = null
        }
        ,
        E.prototype.getHandler = function() {
            return this.outputFilter
        }
        ,
        E.prototype.setHandler = function(e) {
            this.outputFilter = e
        }
        ,
        E.prototype.setPAC = function(e) {
            this.writeScreen.setPAC(e)
        }
        ,
        E.prototype.setBkgData = function(e) {
            this.writeScreen.setBkgData(e)
        }
        ,
        E.prototype.setMode = function(e) {
            e !== this.mode && (this.mode = e,
            c.log("INFO", "MODE=" + e),
            "MODE_POP-ON" === this.mode ? this.writeScreen = this.nonDisplayedMemory : (this.writeScreen = this.displayedMemory,
            this.writeScreen.reset()),
            "MODE_ROLL-UP" !== this.mode && (this.displayedMemory.nrRollUpRows = null,
            this.nonDisplayedMemory.nrRollUpRows = null),
            this.mode = e)
        }
        ,
        E.prototype.insertChars = function(e) {
            for (var t = 0; t < e.length; t++)
                this.writeScreen.insertChar(e[t]);
            var r = this.writeScreen === this.displayedMemory ? "DISP" : "NON_DISP";
            c.log("INFO", r + ": " + this.writeScreen.getDisplayText(!0)),
            "MODE_PAINT-ON" !== this.mode && "MODE_ROLL-UP" !== this.mode || (c.log("TEXT", "DISPLAYED: " + this.displayedMemory.getDisplayText(!0)),
            this.outputDataUpdate())
        }
        ,
        E.prototype.ccRCL = function() {
            c.log("INFO", "RCL - Resume Caption Loading"),
            this.setMode("MODE_POP-ON")
        }
        ,
        E.prototype.ccBS = function() {
            c.log("INFO", "BS - BackSpace"),
            "MODE_TEXT" !== this.mode && (this.writeScreen.backSpace(),
            this.writeScreen === this.displayedMemory && this.outputDataUpdate())
        }
        ,
        E.prototype.ccAOF = function() {}
        ,
        E.prototype.ccAON = function() {}
        ,
        E.prototype.ccDER = function() {
            c.log("INFO", "DER- Delete to End of Row"),
            this.writeScreen.clearToEndOfRow(),
            this.outputDataUpdate()
        }
        ,
        E.prototype.ccRU = function(e) {
            c.log("INFO", "RU(" + e + ") - Roll Up"),
            this.writeScreen = this.displayedMemory,
            this.setMode("MODE_ROLL-UP"),
            this.writeScreen.setRollUpRows(e)
        }
        ,
        E.prototype.ccFON = function() {
            c.log("INFO", "FON - Flash On"),
            this.writeScreen.setPen({
                flash: !0
            })
        }
        ,
        E.prototype.ccRDC = function() {
            c.log("INFO", "RDC - Resume Direct Captioning"),
            this.setMode("MODE_PAINT-ON")
        }
        ,
        E.prototype.ccTR = function() {
            c.log("INFO", "TR"),
            this.setMode("MODE_TEXT")
        }
        ,
        E.prototype.ccRTD = function() {
            c.log("INFO", "RTD"),
            this.setMode("MODE_TEXT")
        }
        ,
        E.prototype.ccEDM = function() {
            c.log("INFO", "EDM - Erase Displayed Memory"),
            this.displayedMemory.reset(),
            this.outputDataUpdate(!0)
        }
        ,
        E.prototype.ccCR = function() {
            c.log("CR - Carriage Return"),
            this.writeScreen.rollUp(),
            this.outputDataUpdate(!0)
        }
        ,
        E.prototype.ccENM = function() {
            c.log("INFO", "ENM - Erase Non-displayed Memory"),
            this.nonDisplayedMemory.reset()
        }
        ,
        E.prototype.ccEOC = function() {
            if (c.log("INFO", "EOC - End Of Caption"),
            "MODE_POP-ON" === this.mode) {
                var e = this.displayedMemory;
                this.displayedMemory = this.nonDisplayedMemory,
                this.nonDisplayedMemory = e,
                this.writeScreen = this.nonDisplayedMemory,
                c.log("TEXT", "DISP: " + this.displayedMemory.getDisplayText())
            }
            this.outputDataUpdate(!0)
        }
        ,
        E.prototype.ccTO = function(e) {
            c.log("INFO", "TO(" + e + ") - Tab Offset"),
            this.writeScreen.moveCursor(e)
        }
        ,
        E.prototype.ccMIDROW = function(e) {
            var t = {
                flash: !1
            };
            if (t.underline = e % 2 == 1,
            t.italics = 46 <= e,
            t.italics)
                t.foreground = "white";
            else {
                var r = Math.floor(e / 2) - 16;
                t.foreground = ["white", "green", "blue", "cyan", "red", "yellow", "magenta"][r]
            }
            c.log("INFO", "MIDROW: " + JSON.stringify(t)),
            this.writeScreen.setPen(t)
        }
        ,
        E.prototype.outputDataUpdate = function(e) {
            void 0 === e && (e = !1);
            var t = c.time;
            null !== t && this.outputFilter && (null !== this.cueStartTime || this.displayedMemory.isEmpty() ? this.displayedMemory.equals(this.lastOutputScreen) || (this.outputFilter.newCue && (this.outputFilter.newCue(this.cueStartTime, t, this.lastOutputScreen),
            !0 === e && this.outputFilter.dispatchCue && this.outputFilter.dispatchCue()),
            this.cueStartTime = this.displayedMemory.isEmpty() ? null : t) : this.cueStartTime = t,
            this.lastOutputScreen.copy(this.displayedMemory))
        }
        ,
        E.prototype.cueSplitAtTime = function(e) {
            this.outputFilter && (this.displayedMemory.isEmpty() || (this.outputFilter.newCue && this.outputFilter.newCue(this.cueStartTime, e, this.displayedMemory),
            this.cueStartTime = e))
        }
        ,
        E)
          , y = (m.prototype.getHandler = function(e) {
            return this.channels[e].getHandler()
        }
        ,
        m.prototype.setHandler = function(e, t) {
            this.channels[e].setHandler(t)
        }
        ,
        m.prototype.addData = function(e, t) {
            var r, i, a, n = !1;
            this.lastTime = e,
            c.setTime(e);
            for (var o = 0; o < t.length; o += 2)
                i = 127 & t[o],
                a = 127 & t[o + 1],
                0 != i || 0 != a ? (c.log("DATA", "[" + l([t[o], t[o + 1]]) + "] -> (" + l([i, a]) + ")"),
                (r = this.parseCmd(i, a)) || (r = this.parseMidrow(i, a)),
                (r = (r = r || this.parsePAC(i, a)) || this.parseBackgroundAttributes(i, a)) || (n = this.parseChars(i, a)) && (this.currChNr && 0 <= this.currChNr ? this.channels[this.currChNr - 1].insertChars(n) : c.log("WARNING", "No channel found yet. TEXT-MODE?")),
                r ? this.dataCounters.cmd += 2 : n ? this.dataCounters.char += 2 : (this.dataCounters.other += 2,
                c.log("WARNING", "Couldn't parse cleaned data " + l([i, a]) + " orig: " + l([t[o], t[o + 1]])))) : this.dataCounters.padding += 2
        }
        ,
        m.prototype.parseCmd = function(e, t) {
            var r;
            if (!((20 === e || 28 === e) && 32 <= t && t <= 47 || (23 === e || 31 === e) && 33 <= t && t <= 35))
                return !1;
            if (e === this.lastCmdA && t === this.lastCmdB)
                return this.lastCmdA = null,
                this.lastCmdB = null,
                c.log("DEBUG", "Repeated command (" + l([e, t]) + ") is dropped"),
                !0;
            r = 20 === e || 23 === e ? 1 : 2;
            var i = this.channels[r - 1];
            return 20 === e || 28 === e ? 32 === t ? i.ccRCL() : 33 === t ? i.ccBS() : 34 === t ? i.ccAOF() : 35 === t ? i.ccAON() : 36 === t ? i.ccDER() : 37 === t ? i.ccRU(2) : 38 === t ? i.ccRU(3) : 39 === t ? i.ccRU(4) : 40 === t ? i.ccFON() : 41 === t ? i.ccRDC() : 42 === t ? i.ccTR() : 43 === t ? i.ccRTD() : 44 === t ? i.ccEDM() : 45 === t ? i.ccCR() : 46 === t ? i.ccENM() : 47 === t && i.ccEOC() : i.ccTO(t - 32),
            this.lastCmdA = e,
            this.lastCmdB = t,
            this.currChNr = r,
            !0
        }
        ,
        m.prototype.parseMidrow = function(e, t) {
            var r = null;
            return (17 === e || 25 === e) && 32 <= t && t <= 47 && ((r = 17 === e ? 1 : 2) !== this.currChNr ? (c.log("ERROR", "Mismatch channel in midrow parsing"),
            !1) : (this.channels[r - 1].ccMIDROW(t),
            c.log("DEBUG", "MIDROW (" + l([e, t]) + ")"),
            !0))
        }
        ,
        m.prototype.parsePAC = function(e, t) {
            var r, i;
            if (!((17 <= e && e <= 23 || 25 <= e && e <= 31) && 64 <= t && t <= 127 || (16 === e || 24 === e) && 64 <= t && t <= 95))
                return !1;
            if (e === this.lastCmdA && t === this.lastCmdB)
                return this.lastCmdA = null,
                !(this.lastCmdB = null);
            r = e <= 23 ? 1 : 2,
            i = 64 <= t && t <= 95 ? 1 == r ? n[e] : u[e] : 1 == r ? o[e] : d[e];
            var a = this.interpretPAC(i, t);
            return this.channels[r - 1].setPAC(a),
            this.lastCmdA = e,
            this.lastCmdB = t,
            this.currChNr = r,
            !0
        }
        ,
        m.prototype.interpretPAC = function(e, t) {
            var r, i = {
                color: null,
                italics: !1,
                indent: null,
                underline: !1,
                row: e
            };
            return r = 95 < t ? t - 96 : t - 64,
            i.underline = 1 == (1 & r),
            r <= 13 ? i.color = ["white", "green", "blue", "cyan", "red", "yellow", "magenta", "white"][Math.floor(r / 2)] : r <= 15 ? (i.italics = !0,
            i.color = "white") : i.indent = 4 * Math.floor((r - 16) / 2),
            i
        }
        ,
        m.prototype.parseChars = function(e, t) {
            var r, i = null, a = null, n = null;
            17 <= (n = 25 <= e ? (i = 2,
            e - 8) : (i = 1,
            e)) && n <= 19 ? (r = 17 === n ? t + 80 : 18 === n ? t + 112 : t + 144,
            c.log("INFO", "Special char '" + s(r) + "' in channel " + i),
            a = [r]) : 32 <= e && e <= 127 && (a = 0 === t ? [e] : [e, t]);
            if (a) {
                var o = l(a);
                c.log("DEBUG", "Char codes =  " + o.join(",")),
                this.lastCmdA = null,
                this.lastCmdB = null
            }
            return a
        }
        ,
        m.prototype.parseBackgroundAttributes = function(e, t) {
            var r, i, a;
            return ((16 === e || 24 === e) && 32 <= t && t <= 47 || (23 === e || 31 === e) && 45 <= t && t <= 47) && (r = {},
            16 === e || 24 === e ? (i = Math.floor((t - 32) / 2),
            r.background = f[i],
            t % 2 == 1 && (r.background = r.background + "_semi")) : 45 === t ? r.background = "transparent" : (r.foreground = "black",
            47 === t && (r.underline = !0)),
            a = e < 24 ? 1 : 2,
            this.channels[a - 1].setBkgData(r),
            this.lastCmdA = null,
            !(this.lastCmdB = null))
        }
        ,
        m.prototype.reset = function() {
            for (var e = 0; e < this.channels.length; e++)
                this.channels[e] && this.channels[e].reset();
            this.lastCmdA = null,
            this.lastCmdB = null
        }
        ,
        m.prototype.cueSplitAtTime = function(e) {
            for (var t = 0; t < this.channels.length; t++)
                this.channels[t] && this.channels[t].cueSplitAtTime(e)
        }
        ,
        m);
        function m(e, t, r) {
            this.field = e || 1,
            this.outputs = [t, r],
            this.channels = [new v(1,t), new v(2,r)],
            this.currChNr = -1,
            this.lastCmdA = null,
            this.lastCmdB = null,
            this.bufferedData = [],
            this.startTime = null,
            this.lastTime = null,
            this.dataCounters = {
                padding: 0,
                char: 0,
                cmd: 0,
                other: 0
            }
        }
        function E(e, t) {
            this.chNr = e,
            this.outputFilter = t,
            this.mode = null,
            this.verbose = 0,
            this.displayedMemory = new g,
            this.nonDisplayedMemory = new g,
            this.lastOutputScreen = new g,
            this.currRollUpRow = this.displayedMemory.rows[14],
            this.writeScreen = this.displayedMemory,
            this.mode = null,
            this.cueStartTime = null
        }
        function _() {
            this.rows = [];
            for (var e = 0; e < 15; e++)
                this.rows.push(new p);
            this.currRow = 14,
            this.nrRollUpRows = null,
            this.reset()
        }
        function S() {
            this.chars = [];
            for (var e = 0; e < 100; e++)
                this.chars.push(new a);
            this.pos = 0,
            this.currPenState = new h
        }
        function T(e, t, r, i, a, n) {
            this.uchar = e || " ",
            this.penState = new h(t,r,i,a,n)
        }
        function b(e, t, r, i, a) {
            this.foreground = e || "white",
            this.underline = t || !1,
            this.italics = r || !1,
            this.background = i || "black",
            this.flash = a || !1
        }
        t.default = y
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = (a.prototype.dispatchCue = function() {
            null !== this.startTime && (this.timelineController.addCues(this.trackName, this.startTime, this.endTime, this.screen),
            this.startTime = null)
        }
        ,
        a.prototype.newCue = function(e, t, r) {
            (null === this.startTime || this.startTime > e) && (this.startTime = e),
            this.endTime = t,
            this.screen = r,
            this.timelineController.createCaptionsTrack(this.trackName)
        }
        ,
        a);
        function a(e, t) {
            this.timelineController = e,
            this.trackName = t,
            this.startTime = null,
            this.endTime = null,
            this.screen = null
        }
        t.default = i
    }
    , function(e, t, r) {
        "use strict";
        (function(v) {
            Object.defineProperty(t, "__esModule", {
                value: !0
            });
            function y(e, t, r) {
                return e.substr(r || 0, t.length) === t
            }
            function n(e) {
                for (var t = 5381, r = e.length; r; )
                    t = 33 * t ^ e.charCodeAt(--r);
                return (t >>> 0).toString()
            }
            var m = r(30)
              , E = r(11)
              , e = {
                parse: function(e, o, s, l, t, r) {
                    var u, i = E.utf8ArrayToStr(new Uint8Array(e)).trim().replace(/\r\n|\n\r|\n|\r/g, "\n").split("\n"), d = "00:00.000", f = 0, c = 0, h = 0, a = [], p = !0, g = new m.default;
                    g.oncue = function(e) {
                        var t = s[l]
                          , r = s.ccOffset;
                        t && t.new && (void 0 !== c ? r = s.ccOffset = t.start : function(e, t, r) {
                            var i = e[l]
                              , a = e[i.prevCC];
                            if (!a || !a.new && i.new)
                                return e.ccOffset = e.presentationOffset = i.start,
                                i.new = !1;
                            for (; a && a.new; )
                                e.ccOffset += i.start - a.start,
                                i.new = !1,
                                a = e[(i = a).prevCC];
                            e.presentationOffset = r
                        }(s, 0, h)),
                        h && (r = h - s.presentationOffset),
                        e.startTime += r - c,
                        e.endTime += r - c,
                        e.id = n(e.startTime.toString()) + n(e.endTime.toString()) + n(e.text),
                        e.text = decodeURIComponent(encodeURIComponent(e.text)),
                        0 < e.endTime && a.push(e)
                    }
                    ,
                    g.onparsingerror = function(e) {
                        u = e
                    }
                    ,
                    g.onflush = function() {
                        u && r ? r(u) : t(a)
                    }
                    ,
                    i.forEach(function(t) {
                        if (p) {
                            if (y(t, "X-TIMESTAMP-MAP=")) {
                                p = !1,
                                t.substr(16).split(",").forEach(function(e) {
                                    y(e, "LOCAL:") ? d = e.substr(6) : y(e, "MPEGTS:") && (f = parseInt(e.substr(7)))
                                });
                                try {
                                    o + (9e4 * s[l].start || 0) < 0 && (o += 8589934592),
                                    f -= o,
                                    e = d,
                                    r = parseInt(e.substr(-3)),
                                    i = parseInt(e.substr(-6, 2)),
                                    a = parseInt(e.substr(-9, 2)),
                                    n = 9 < e.length ? parseInt(e.substr(0, e.indexOf(":"))) : 0,
                                    c = (v.isFinite(r) && v.isFinite(i) && v.isFinite(a) && v.isFinite(n) ? (r += 1e3 * i,
                                    r += 6e4 * a,
                                    r += 36e5 * n) : -1) / 1e3,
                                    h = f / 9e4,
                                    -1 === c && (u = new Error("Malformed X-TIMESTAMP-MAP: " + t))
                                } catch (e) {
                                    u = new Error("Malformed X-TIMESTAMP-MAP: " + t)
                                }
                                return
                            }
                            "" === t && (p = !1)
                        }
                        var e, r, i, a, n;
                        g.parse(t + "\n")
                    }),
                    g.flush()
                }
            };
            t.default = e
        }
        ).call(this, r(2).Number)
    }
    , function(e, f, c) {
        "use strict";
        (function(i) {
            var a, e = this && this.__extends || (a = Object.setPrototypeOf || {
                __proto__: []
            }instanceof Array && function(e, t) {
                e.__proto__ = t
            }
            || function(e, t) {
                for (var r in t)
                    t.hasOwnProperty(r) && (e[r] = t[r])
            }
            ,
            function(e, t) {
                function r() {
                    this.constructor = e
                }
                a(e, t),
                e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
                new r)
            }
            );
            Object.defineProperty(f, "__esModule", {
                value: !0
            });
            var r, n = c(1), t = c(4), l = c(0), u = c(8), o = (r = t.default,
            e(s, r),
            s.prototype.destroy = function() {
                t.default.prototype.destroy.call(this)
            }
            ,
            s.prototype.onMediaAttached = function(e) {
                var t = this;
                this.media = e.media,
                this.media && (this.queuedDefaultTrack && (this.subtitleTrack = this.queuedDefaultTrack,
                delete this.queuedDefaultTrack),
                this.trackChangeListener = this._onTextTracksChanged.bind(this),
                this.useTextTrackPolling = !(this.media.textTracks && "onchange"in this.media.textTracks),
                this.useTextTrackPolling ? this.subtitlePollingInterval = setInterval(function() {
                    t.trackChangeListener()
                }, 500) : this.media.textTracks.addEventListener("change", this.trackChangeListener))
            }
            ,
            s.prototype.onMediaDetaching = function() {
                this.media && (this.useTextTrackPolling ? clearInterval(this.subtitlePollingInterval) : this.media.textTracks.removeEventListener("change", this.trackChangeListener),
                this.media = null)
            }
            ,
            s.prototype.onManifestLoaded = function(e) {
                var t = this
                  , r = e.subtitles || [];
                this.tracks = r,
                this.hls.trigger(n.default.SUBTITLE_TRACKS_UPDATED, {
                    subtitleTracks: r
                }),
                r.forEach(function(e) {
                    e.default && (t.media ? t.subtitleTrack = e.id : t.queuedDefaultTrack = e.id)
                })
            }
            ,
            s.prototype.onSubtitleTrackLoaded = function(e) {
                var t = this
                  , r = e.id
                  , i = e.details
                  , a = this.trackId
                  , n = this.tracks
                  , o = n[a];
                if (r >= n.length || r !== a || !o || this.stopped)
                    this._clearReloadTimer();
                else if (l.logger.log("subtitle track " + r + " loaded"),
                i.live) {
                    var s = u.computeReloadInterval(o.details, i, e.stats.trequest);
                    l.logger.log("Reloading live subtitle playlist in " + s + "ms"),
                    this.timer = setTimeout(function() {
                        t._loadCurrentTrack()
                    }, s)
                } else
                    this._clearReloadTimer()
            }
            ,
            s.prototype.startLoad = function() {
                this.stopped = !1,
                this._loadCurrentTrack()
            }
            ,
            s.prototype.stopLoad = function() {
                this.stopped = !0,
                this._clearReloadTimer()
            }
            ,
            Object.defineProperty(s.prototype, "subtitleTracks", {
                get: function() {
                    return this.tracks
                },
                enumerable: !0,
                configurable: !0
            }),
            Object.defineProperty(s.prototype, "subtitleTrack", {
                get: function() {
                    return this.trackId
                },
                set: function(e) {
                    this.trackId !== e && (this._toggleTrackModes(e),
                    this._setSubtitleTrackInternal(e))
                },
                enumerable: !0,
                configurable: !0
            }),
            s.prototype._clearReloadTimer = function() {
                this.timer && (clearTimeout(this.timer),
                this.timer = null)
            }
            ,
            s.prototype._loadCurrentTrack = function() {
                var e = this.trackId
                  , t = this.tracks
                  , r = this.hls
                  , i = t[e];
                e < 0 || !i || i.details && !i.details.live || (l.logger.log("Loading subtitle track " + e),
                r.trigger(n.default.SUBTITLE_TRACK_LOADING, {
                    url: i.url,
                    id: e
                }))
            }
            ,
            s.prototype._toggleTrackModes = function(e) {
                var t = this.media
                  , r = this.subtitleDisplay
                  , i = this.trackId;
                if (t) {
                    var a = d(t.textTracks);
                    if (-1 === e)
                        [].slice.call(a).forEach(function(e) {
                            e.mode = "disabled"
                        });
                    else {
                        var n = a[i];
                        n && (n.mode = "disabled")
                    }
                    var o = a[e];
                    o && (o.mode = r ? "showing" : "hidden")
                }
            }
            ,
            s.prototype._setSubtitleTrackInternal = function(e) {
                var t = this.hls
                  , r = this.tracks;
                !i.isFinite(e) || e < -1 || e >= r.length || (this.trackId = e,
                l.logger.log("Switching to subtitle track " + e),
                t.trigger(n.default.SUBTITLE_TRACK_SWITCH, {
                    id: e
                }),
                this._loadCurrentTrack())
            }
            ,
            s.prototype._onTextTracksChanged = function() {
                if (this.media) {
                    for (var e = -1, t = d(this.media.textTracks), r = 0; r < t.length; r++)
                        if ("hidden" === t[r].mode)
                            e = r;
                        else if ("showing" === t[r].mode) {
                            e = r;
                            break
                        }
                    this.subtitleTrack = e
                }
            }
            ,
            s);
            function s(e) {
                var t = r.call(this, e, n.default.MEDIA_ATTACHED, n.default.MEDIA_DETACHING, n.default.MANIFEST_LOADED, n.default.SUBTITLE_TRACK_LOADED) || this;
                return t.tracks = [],
                t.trackId = -1,
                t.media = null,
                t.stopped = !0,
                t.subtitleDisplay = !0,
                t
            }
            function d(e) {
                for (var t = [], r = 0; r < e.length; r++) {
                    var i = e[r];
                    "subtitles" === i.kind && i.label && t.push(e[r])
                }
                return t
            }
            f.default = o
        }
        ).call(this, c(2).Number)
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, y = r(1), m = r(0), o = r(13), E = r(5), _ = r(27), S = r(7), T = r(15), s = r(8), l = window.performance, u = (n = T.default,
        a(d, n),
        d.prototype.onSubtitleFragProcessed = function(e) {
            var t = e.frag
              , r = e.success;
            if (this.fragPrevious = t,
            this.state = T.State.IDLE,
            r) {
                var i = this.tracksBuffered[this.currentTrackId];
                if (i) {
                    for (var a, n = t.start, o = 0; o < i.length; o++)
                        if (n >= i[o].start && n <= i[o].end) {
                            a = i[o];
                            break
                        }
                    var s = t.start + t.duration;
                    a ? a.end = s : (a = {
                        start: n,
                        end: s
                    },
                    i.push(a))
                }
            }
        }
        ,
        d.prototype.onMediaAttached = function(e) {
            var t = e.media;
            (this.media = t).addEventListener("seeking", this._onMediaSeeking),
            this.state = T.State.IDLE
        }
        ,
        d.prototype.onMediaDetaching = function() {
            this.media.removeEventListener("seeking", this._onMediaSeeking),
            this.media = null,
            this.state = T.State.STOPPED
        }
        ,
        d.prototype.onError = function(e) {
            var t = e.frag;
            t && "subtitle" === t.type && (this.state = T.State.IDLE)
        }
        ,
        d.prototype.onSubtitleTracksUpdated = function(e) {
            var t = this;
            m.logger.log("subtitle tracks updated"),
            this.tracksBuffered = [],
            this.tracks = e.subtitleTracks,
            this.tracks.forEach(function(e) {
                t.tracksBuffered[e.id] = []
            })
        }
        ,
        d.prototype.onSubtitleTrackSwitch = function(e) {
            if (this.currentTrackId = e.id,
            this.tracks && -1 !== this.currentTrackId) {
                var t = this.tracks[this.currentTrackId];
                t && t.details && this.setInterval(500)
            } else
                this.clearInterval()
        }
        ,
        d.prototype.onSubtitleTrackLoaded = function(e) {
            var t = e.id
              , r = e.details
              , i = this.currentTrackId
              , a = this.tracks
              , n = a[i];
            t >= a.length || t !== i || !n || (r.live && s.mergeSubtitlePlaylists(n.details, r, this.lastAVStart),
            n.details = r,
            this.setInterval(500))
        }
        ,
        d.prototype.onKeyLoaded = function() {
            this.state === T.State.KEY_LOADING && (this.state = T.State.IDLE)
        }
        ,
        d.prototype.onFragLoaded = function(e) {
            var t = this.fragCurrent
              , r = e.frag.decryptdata
              , i = e.frag
              , a = this.hls;
            if (this.state === T.State.FRAG_LOADING && t && "subtitle" === e.frag.type && t.sn === e.frag.sn && 0 < e.payload.byteLength && r && r.key && "AES-128" === r.method) {
                var n = l.now();
                this.decrypter.decrypt(e.payload, r.key.buffer, r.iv.buffer, function(e) {
                    var t = l.now();
                    a.trigger(y.default.FRAG_DECRYPTED, {
                        frag: i,
                        payload: e,
                        stats: {
                            tstart: n,
                            tdecrypt: t
                        }
                    })
                })
            }
        }
        ,
        d.prototype.onLevelUpdated = function(e) {
            var t = e.details.fragments;
            this.lastAVStart = t.length ? t[0].start : 0
        }
        ,
        d.prototype.doTick = function() {
            if (this.media)
                switch (this.state) {
                case T.State.IDLE:
                    var e = this.config
                      , t = this.currentTrackId
                      , r = this.fragmentTracker
                      , i = this.media
                      , a = this.tracks;
                    if (!a || !a[t] || !a[t].details)
                        break;
                    var n = e.maxBufferHole
                      , o = e.maxFragLookUpTolerance
                      , s = Math.min(e.maxBufferLength, e.maxMaxBufferLength)
                      , l = E.BufferHelper.bufferedInfo(this._getBuffered(), i.currentTime, n)
                      , u = l.end
                      , d = l.len
                      , f = a[t].details
                      , c = f.fragments
                      , h = c.length
                      , p = c[h - 1].start + c[h - 1].duration;
                    if (s < d)
                        return;
                    var g = void 0
                      , v = this.fragPrevious;
                    (g = u < p ? (v && f.hasProgramDateTime && (g = _.findFragmentByPDT(c, v.endProgramDateTime, o)),
                    g || _.findFragmentByPTS(v, c, u, o)) : c[h - 1]) && g.encrypted ? (m.logger.log("Loading key for " + g.sn),
                    this.state = T.State.KEY_LOADING,
                    this.hls.trigger(y.default.KEY_LOADING, {
                        frag: g
                    })) : g && r.getState(g) === S.FragmentState.NOT_LOADED && (this.fragCurrent = g,
                    this.state = T.State.FRAG_LOADING,
                    this.hls.trigger(y.default.FRAG_LOADING, {
                        frag: g
                    }))
                }
            else
                this.state = T.State.IDLE
        }
        ,
        d.prototype.stopLoad = function() {
            this.lastAVStart = 0,
            n.prototype.stopLoad.call(this)
        }
        ,
        d.prototype._getBuffered = function() {
            return this.tracksBuffered[this.currentTrackId] || []
        }
        ,
        d.prototype.onMediaSeeking = function() {
            this.fragPrevious = null
        }
        ,
        d);
        function d(e, t) {
            var r = n.call(this, e, y.default.MEDIA_ATTACHED, y.default.MEDIA_DETACHING, y.default.ERROR, y.default.KEY_LOADED, y.default.FRAG_LOADED, y.default.SUBTITLE_TRACKS_UPDATED, y.default.SUBTITLE_TRACK_SWITCH, y.default.SUBTITLE_TRACK_LOADED, y.default.SUBTITLE_FRAG_PROCESSED, y.default.LEVEL_UPDATED) || this;
            return r.fragmentTracker = t,
            r.config = e.config,
            r.state = T.State.STOPPED,
            r.tracks = [],
            r.tracksBuffered = [],
            r.currentTrackId = -1,
            r.decrypter = new o.default(e,e.config),
            r.lastAVStart = 0,
            r._onMediaSeeking = r.onMediaSeeking.bind(r),
            r
        }
        t.SubtitleStreamController = u
    }
    , function(e, t, r) {
        "use strict";
        var i, a = this && this.__extends || (i = Object.setPrototypeOf || {
            __proto__: []
        }instanceof Array && function(e, t) {
            e.__proto__ = t
        }
        || function(e, t) {
            for (var r in t)
                t.hasOwnProperty(r) && (e[r] = t[r])
        }
        ,
        function(e, t) {
            function r() {
                this.constructor = e
            }
            i(e, t),
            e.prototype = null === t ? Object.create(t) : (r.prototype = t.prototype,
            new r)
        }
        );
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var n, o = r(4), s = r(1), l = r(3), u = r(0), d = window.XMLHttpRequest, f = "com.widevine.alpha", c = (n = o.default,
        a(h, n),
        h.prototype.getLicenseServerUrl = function(e) {
            var t;
            switch (e) {
            case f:
                t = this._widevineLicenseUrl;
                break;
            default:
                t = null
            }
            return t || (u.logger.error('No license server URL configured for key-system "' + e + '"'),
            this.hls.trigger(s.default.ERROR, {
                type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                details: l.ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
                fatal: !0
            })),
            t
        }
        ,
        h.prototype._attemptKeySystemAccess = function(t, e, r) {
            var i = this
              , a = function(e, t, r) {
                switch (e) {
                case f:
                    return i = {
                        videoCapabilities: []
                    },
                    r.forEach(function(e) {
                        i.videoCapabilities.push({
                            contentType: 'video/mp4; codecs="' + e + '"'
                        })
                    }),
                    [i];
                default:
                    throw Error("Unknown key-system: " + e)
                }
                var i
            }(t, 0, r);
            a ? (u.logger.log("Requesting encrypted media key-system access"),
            this.requestMediaKeySystemAccess(t, a).then(function(e) {
                i._onMediaKeySystemAccessObtained(t, e)
            }).catch(function(e) {
                u.logger.error('Failed to obtain key-system "' + t + '" access:', e)
            })) : u.logger.warn("Can not create config for key-system (maybe because platform is not supported):", t)
        }
        ,
        Object.defineProperty(h.prototype, "requestMediaKeySystemAccess", {
            get: function() {
                if (!this._requestMediaKeySystemAccess)
                    throw new Error("No requestMediaKeySystemAccess function configured");
                return this._requestMediaKeySystemAccess
            },
            enumerable: !0,
            configurable: !0
        }),
        h.prototype._onMediaKeySystemAccessObtained = function(t, e) {
            var r = this;
            u.logger.log('Access for key-system "' + t + '" obtained');
            var i = {
                mediaKeys: null,
                mediaKeysSession: null,
                mediaKeysSessionInitialized: !1,
                mediaKeySystemAccess: e,
                mediaKeySystemDomain: t
            };
            this._mediaKeysList.push(i),
            e.createMediaKeys().then(function(e) {
                i.mediaKeys = e,
                u.logger.log('Media-keys created for key-system "' + t + '"'),
                r._onMediaKeysCreated()
            }).catch(function(e) {
                u.logger.error("Failed to create media-keys:", e)
            })
        }
        ,
        h.prototype._onMediaKeysCreated = function() {
            var t = this;
            this._mediaKeysList.forEach(function(e) {
                e.mediaKeysSession || (e.mediaKeysSession = e.mediaKeys.createSession(),
                t._onNewMediaKeySession(e.mediaKeysSession))
            })
        }
        ,
        h.prototype._onNewMediaKeySession = function(t) {
            var r = this;
            u.logger.log("New key-system session " + t.sessionId),
            t.addEventListener("message", function(e) {
                r._onKeySessionMessage(t, e.message)
            }, !1)
        }
        ,
        h.prototype._onKeySessionMessage = function(t, e) {
            u.logger.log("Got EME message event, creating license request"),
            this._requestLicense(e, function(e) {
                u.logger.log("Received license data, updating key-session"),
                t.update(e)
            })
        }
        ,
        h.prototype._onMediaEncrypted = function(e, t) {
            u.logger.log('Media is encrypted using "' + e + '" init data type'),
            this._isMediaEncrypted = !0,
            this._mediaEncryptionInitDataType = e,
            this._mediaEncryptionInitData = t,
            this._attemptSetMediaKeys(),
            this._generateRequestWithPreferredKeySession()
        }
        ,
        h.prototype._attemptSetMediaKeys = function() {
            if (!this._hasSetMediaKeys) {
                var e = this._mediaKeysList[0];
                if (!e || !e.mediaKeys)
                    return u.logger.error("Fatal: Media is encrypted but no CDM access or no keys have been obtained yet"),
                    void this.hls.trigger(s.default.ERROR, {
                        type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                        details: l.ErrorDetails.KEY_SYSTEM_NO_KEYS,
                        fatal: !0
                    });
                u.logger.log("Setting keys for encrypted media"),
                this._media.setMediaKeys(e.mediaKeys),
                this._hasSetMediaKeys = !0
            }
        }
        ,
        h.prototype._generateRequestWithPreferredKeySession = function() {
            var t = this
              , e = this._mediaKeysList[0];
            if (!e)
                return u.logger.error("Fatal: Media is encrypted but not any key-system access has been obtained yet"),
                void this.hls.trigger(s.default.ERROR, {
                    type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                    details: l.ErrorDetails.KEY_SYSTEM_NO_ACCESS,
                    fatal: !0
                });
            if (e.mediaKeysSessionInitialized)
                u.logger.warn("Key-Session already initialized but requested again");
            else {
                var r = e.mediaKeysSession;
                r || (u.logger.error("Fatal: Media is encrypted but no key-session existing"),
                this.hls.trigger(s.default.ERROR, {
                    type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                    details: l.ErrorDetails.KEY_SYSTEM_NO_SESSION,
                    fatal: !0
                }));
                var i = this._mediaEncryptionInitDataType
                  , a = this._mediaEncryptionInitData;
                u.logger.log('Generating key-session request for "' + i + '" init data type'),
                e.mediaKeysSessionInitialized = !0,
                r.generateRequest(i, a).then(function() {
                    u.logger.debug("Key-session generation succeeded")
                }).catch(function(e) {
                    u.logger.error("Error generating key-session request:", e),
                    t.hls.trigger(s.default.ERROR, {
                        type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                        details: l.ErrorDetails.KEY_SYSTEM_NO_SESSION,
                        fatal: !1
                    })
                })
            }
        }
        ,
        h.prototype._createLicenseXhr = function(e, t, r) {
            var i = new d
              , a = this._licenseXhrSetup;
            try {
                if (a)
                    try {
                        a(i, e)
                    } catch (t) {
                        i.open("POST", e, !0),
                        a(i, e)
                    }
                i.readyState || i.open("POST", e, !0)
            } catch (e) {
                return u.logger.error("Error setting up key-system license XHR", e),
                void this.hls.trigger(s.default.ERROR, {
                    type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                    details: l.ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
                    fatal: !0
                })
            }
            return i.responseType = "arraybuffer",
            i.onreadystatechange = this._onLicenseRequestReadyStageChange.bind(this, i, e, t, r),
            i
        }
        ,
        h.prototype._onLicenseRequestReadyStageChange = function(e, t, r, i) {
            switch (e.readyState) {
            case 4:
                if (200 === e.status)
                    this._requestLicenseFailureCount = 0,
                    u.logger.log("License request succeeded"),
                    i(e.response);
                else {
                    if (u.logger.error("License Request XHR failed (" + t + "). Status: " + e.status + " (" + e.statusText + ")"),
                    this._requestLicenseFailureCount++,
                    this._requestLicenseFailureCount <= 3) {
                        var a = 3 - this._requestLicenseFailureCount + 1;
                        return u.logger.warn("Retrying license request, " + a + " attempts left"),
                        void this._requestLicense(r, i)
                    }
                    this.hls.trigger(s.default.ERROR, {
                        type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                        details: l.ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
                        fatal: !0
                    })
                }
            }
        }
        ,
        h.prototype._generateLicenseRequestChallenge = function(e, t) {
            var r;
            return "com.microsoft.playready" === e.mediaKeySystemDomain ? u.logger.error("PlayReady is not supported (yet)") : e.mediaKeySystemDomain === f ? r = t : u.logger.error("Unsupported key-system:", e.mediaKeySystemDomain),
            r
        }
        ,
        h.prototype._requestLicense = function(e, t) {
            u.logger.log("Requesting content license for key-system");
            var r = this._mediaKeysList[0];
            if (!r)
                return u.logger.error("Fatal error: Media is encrypted but no key-system access has been obtained yet"),
                void this.hls.trigger(s.default.ERROR, {
                    type: l.ErrorTypes.KEY_SYSTEM_ERROR,
                    details: l.ErrorDetails.KEY_SYSTEM_NO_ACCESS,
                    fatal: !0
                });
            var i = this.getLicenseServerUrl(r.mediaKeySystemDomain)
              , a = this._createLicenseXhr(i, e, t);
            u.logger.log("Sending license request to URL: " + i),
            a.send(this._generateLicenseRequestChallenge(r, e))
        }
        ,
        h.prototype.onMediaAttached = function(e) {
            var t = this;
            if (this._emeEnabled) {
                var r = e.media;
                (this._media = r).addEventListener("encrypted", function(e) {
                    t._onMediaEncrypted(e.initDataType, e.initData)
                })
            }
        }
        ,
        h.prototype.onManifestParsed = function(e) {
            if (this._emeEnabled) {
                var t = e.levels.map(function(e) {
                    return e.audioCodec
                })
                  , r = e.levels.map(function(e) {
                    return e.videoCodec
                });
                this._attemptKeySystemAccess(f, t, r)
            }
        }
        ,
        h);
        function h(e) {
            var t = n.call(this, e, s.default.MEDIA_ATTACHED, s.default.MANIFEST_PARSED) || this;
            return t._widevineLicenseUrl = e.config.widevineLicenseUrl,
            t._licenseXhrSetup = e.config.licenseXhrSetup,
            t._emeEnabled = e.config.emeEnabled,
            t._requestMediaKeySystemAccess = e.config.requestMediaKeySystemAccessFunc,
            t._mediaKeysList = [],
            t._media = null,
            t._hasSetMediaKeys = !1,
            t._isMediaEncrypted = !1,
            t._requestLicenseFailureCount = 0,
            t
        }
        t.default = c
    }
    , function(e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = "undefined" != typeof window && window.navigator && window.navigator.requestMediaKeySystemAccess ? window.navigator.requestMediaKeySystemAccess.bind(window.navigator) : null;
        t.requestMediaKeySystemAccess = i
    }
    ],
    a.c = i,
    a.d = function(e, t, r) {
        a.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: r
        })
    }
    ,
    a.r = function(e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }),
        Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }
    ,
    a.t = function(t, e) {
        if (1 & e && (t = a(t)),
        8 & e)
            return t;
        if (4 & e && "object" == typeof t && t && t.__esModule)
            return t;
        var r = Object.create(null);
        if (a.r(r),
        Object.defineProperty(r, "default", {
            enumerable: !0,
            value: t
        }),
        2 & e && "string" != typeof t)
            for (var i in t)
                a.d(r, i, function(e) {
                    return t[e]
                }
                .bind(null, i));
        return r
    }
    ,
    a.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default
        }
        : function() {
            return e
        }
        ;
        return a.d(t, "a", t),
        t
    }
    ,
    a.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }
    ,
    a.p = "/dist/",
    a(a.s = 31)).default;
    function a(e) {
        if (i[e])
            return i[e].exports;
        var t = i[e] = {
            i: e,
            l: !1,
            exports: {}
        };
        return r[e].call(t.exports, t, t.exports, a),
        t.l = !0,
        t.exports
    }
    var r, i
});
/*2019-09-17 18:37:10*/
