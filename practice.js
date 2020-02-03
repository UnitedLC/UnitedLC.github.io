/**
 * 录音模块加载等待对话框
 * @param content 初始化参数，或'close'关闭对话框
 */
function AudioModuleLoadingMessageBox(content){
	var settings = {
		dialogClass: 'loading-message-dialog green-dialog',
		width: 600,
		height: 200,
		autoOpen: true,
		modal: true,
		resizable: false,
		content : '正在加载',
		close: function( event, ui ) {
			$(this).dialog('destroy').remove();
		}
	};

	if(content == 'close'){
		if($('#TinSoAudioModuleLoadMessageBox').length > 0){
			AudioModuleLoadingMessageBox.loadingTime = new Date().getTime() - AudioModuleLoadingMessageBox.loadingTime - 1000;
			if(AudioModuleLoadingMessageBox.loadingTime < 0){
				AudioModuleLoadingMessageBox.loadingTime = 0 - AudioModuleLoadingMessageBox.loadingTime;
			}else{
				AudioModuleLoadingMessageBox.loadingTime = 0;
			}
			$('#TinSoAudioModuleLoadMessageBox').delay(AudioModuleLoadingMessageBox.loadingTime).dialog('close');
		}
		return;
	}else if(content != undefined){
		settings.content = content;
	}
	AudioModuleLoadingMessageBox.loadingTime = new Date().getTime();
	if($('#TinSoAudioModuleLoadMessageBox').length != 0){
		$('#TinSoAudioModuleLoadMessageBox').remove();
	}
	var div = '<div id="TinSoAudioModuleLoadMessageBox">';
	div += '<div class="dib-wrap messageContent">';
	div += '<div class="dib dialog-icon"></div>';
	div += '<div class="dib message-info">' + settings.content + '</div>';
	div += '</div></div>';
	$(div).appendTo('body');
	$('#TinSoAudioModuleLoadMessageBox').dialog(settings);
	$('#TinSoAudioModuleLoadMessageBox .messageContent .message-info').width(400);
	var height = ($('.loading-message-dialog #TinSoAudioModuleLoadMessageBox').height() - $('.loading-message-dialog #TinSoAudioModuleLoadMessageBox .messageContent').height()) / 2 - 10;
	$('.loading-message-dialog #TinSoAudioModuleLoadMessageBox .messageContent').css('margin-top', height);
}
AudioModuleLoadingMessageBox.loadingTime = 0;

/**
 * true : 多学生端使用, false : 多教师端使用(不显示答案按钮及不加载音频等功能)
 */
var page_mode = true;
/**
 * 扣词区域html
 */
var cur_html = [];
/**
 * 点读模式 句子数量
 */
videoRes_count = 0;
/**
 * 点读模式 句子开始时间数组
 */
sen_click_arr = {};

var config = new Object();
/**
 * 练习页面练习数据保存，用于网络连接异常时提交答案后存储答案
 */
practice_data = {};

/**
 * 练习页面练习数据保存标识
 */
practice_data_save = false;
/**
 * 取得浏览器的userAgent字符串
 */
var userAgent = navigator.userAgent; 
/**
 * 小学标识
 */
var is_primary = is_primary || false;
/**
 * 口语是否显示判分标识，针对免费用户
 */
var judge_speaking = judge_speaking || true;
/**
 * 设置循环判断口语判分问题
 */
var record_check_interval = undefined;
/**
 * 设置当前作业是否提交标识（仅作显示单句单词用）
 */
var isSubmitAAA = false;
/**
 * 单句出现0分的数量
 */
var isZeroNum = 0;
/**
 * 单句0分标识A
 */
var zeroTypeA = false;
/**
 * 提交答案0分引导标识
 */
var zeroTypeC = false;
/**
 * 是否已弹框 -- 提交答案
 */
var isDialogShow = false;
/**
 * 是否已弹框 -- 未提交答案
 */
var isDialogLook = false;
isNeedProtectDialog =  false;
/**
 * 听说科技试题解析、练习代码
 */
(function(){
	if(!window.console){
		window.console.log = function(){};
	}
	var TSP = {};
	window.TSP = TSP;
	/**
	 * 初始化所有对象
	 */
	TSP.init = function(options) {
		if(!!TSP.inited){
			return;
		}
		TSP.audio.init(options);
		TSP.inited = true;
//		console.log('TSP初始化');
	};
	/**
	 * 抛出错误
	 */
	var throwError = TSP.throwError = function(message) {
		console.log(message);
		MessageBox({
			content : message
		}, 'warning');
//		throw new function() {
//			this.toString = function() {
//				return message;
//			};
//		};
	};
	
	/**
	 * 音频播放、录音相关
	 */
	/**
	 * 音频处理对象
	 */
	var audio = TSP.audio = {};
	/**
	 * 
	 */
	var AudioContext = audio.AudioContext = null;
	/**
	 * 音频处理对象初始化
	 */
	audio.init = function(options) {
		if(!!audio.inited){
			return;
		}
		// 获取音频组件
		window.URL = window.URL || window.webkitURL;
		navigator.getUserMedia = navigator.getUserMedia
		|| navigator.webkitGetUserMedia || navigator.mozGetUserMedia
		|| navigator.msGetUserMedia;
		var errMsg = '当前浏览器无法获取麦克风，将无法使用口语功能!';

		if(!navigator.getUserMedia || userAgent.indexOf("Edge") > -1){
			if(!((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1)){
				if(isIOS()){
					var href = '<a href="' + TinSoConfig.iOSAPP + '" class="ios_app_scheme" style="display:none;"></a>';
					$('body').append(href);
					$('.ios_app_scheme').click(function() {
						var clickedAt = +new Date;
						setTimeout(function(){
							if (+new Date - clickedAt < 2000){
								window.location = TinSoConfig.iOSUrl;
							}
						}, 500);
					}).click();
					errMsg = 'iOS下浏览器无法进行口语练习，请使用外语通APP进行练习';
				}
				console.log(errMsg);
				MessageBox({
					content : errMsg
				}, 'warning');
				return;
			}
		}else{
			try{
				AudioContext = window.AudioContext || window.webkitAudioContext;
			}catch (e) {
				throwError(errMsg);
				return;
			}
			if(!AudioContext){
				throwError(errMsg);
				return ;
			}
		}
		if(!!options.player){
			player.init(options.player);
		}
		var TSPspos = navigator.userAgent.search('Chrome');
		if(TSPspos != -1 && navigator.userAgent.substr(TSPspos) > 'Chrome/66'){
			if(typeof window.TSPAudioContext == 'undefined'){
				window.TSPAudioContext = { TSP : false };
				MessageBox({
					content : '由于谷歌公司在Chromium内核中加入了新的安全策略，录音功能必须在用户操作页面后才能开启，请您点击“我知道了”以激活录音。',
					close: function( event, ui ) {
						if(!!options.recorder){
							recorder.init(options.recorder);
						}
						$(this).dialog('destroy').remove();
					}
				}, 'warning');
			}else{
				window.TSPAudioContext.TSP = false;
				var TSPHandle = setInterval(function(){
					if(typeof window.TSPAudioContext.RecWave != 'undefined' && window.TSPAudioContext.RecWave == false){
						return;
					}
					if(typeof window.TSPAudioContext.Peaks != 'undefined' && window.TSPAudioContext.Peaks == false){
						return;
					}
					clearInterval(TSPHandle);
					if(!!options.recorder){
						recorder.init(options.recorder);
					}
					window.TSPAudioContext.TSP = true;
				}, 500);
			}
		}else{
			if(!!options.recorder){
				recorder.init(options.recorder);
			}
		}
		audio.inited = true;
		console.log('TSP.audio初始化');
	}
	/**
	 * 音频文件对象
	 */
	audio.files = {
		/**
		 * 需要加载的总文件数
		 */
		length : 0,
		/**
		 * 已加载文件数
		 */
		loaded : 0,
		/**
		 * 文件对象集合{'110000001.mp3' : {url : '', elem : null, loaded : false}}
		 */
		list : {},
		/**
		 * 初始化加载文件
		 */
		initLoad : function(){
			audio.files.list = {};
			audio.files.loaded = 0;
			audio.files.length = 0;
		},
		/**
		 * 添加文件
		 */
		addFile : function(file, url){
			audio.files.list[file] = {url : url, elem : null, loaded : false};
		},
		/**
		 * 加载文件，加载过程中需要文件进度进行处理
		 */
		loadFiles : function(){
			var error_status = false;
			for(var i in audio.files.list){
				audio.files.length++;
				if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
					audio.files.list[i].elem = {};
					url = audio.files.list[i].url;
					$("#AsrRecorder")[0].loadElem(i,url);
				}else{
					audio.files.list[i].elem = document.createElement('audio');
				}
				var elem = audio.files.list[i].elem;
				elem.list = audio.files.list[i];
				elem.file = i;
				elem.onerror = function() {
					error_status = true;
					ResourceLoadingMessageBox('close');
				};
				elem.onloadeddata = function(duration){
					if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
						this.duration = duration / 1000;
					}
					this.list.loaded = true;
					audio.files.loaded = 0;
					for(var j in audio.files.list){
						if(audio.files.list[j].loaded){
							audio.files.loaded++;
						}
					}
					if(audio.files.loaded == audio.files.length){
						ResourceLoadingMessageBox('close');
					}else{
						if(audio.files.loaded == audio.files.length || error_status){
							ResourceLoadingMessageBox('close');
						}else{
							ResourceLoadingMessageBox('正在加载资源(' + audio.files.loaded + '/' + audio.files.length　+  ')');
						}
					}
				}
				elem.preload = 'auto';
				elem.src = audio.files.list[i].url;
				if(!!elem.load){
					elem.load();
				}
				elem.getCurrentTime = function(){
					if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
						return $("#AsrRecorder")[0].getCurrentTime() / 1000;
					}else{
						return this.currentTime;
					}
				}
				elem.setCurrentTime = function(time){
					// 设置起始时间
					if(!((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1)){
						this.currentTime = time;
					}else{
						$("#AsrRecorder")[0].setCurrentTime(time * 1000);
						this.currentTime = time * 1000;
					}
				}
			}
			if(audio.files.loaded == audio.files.length || error_status){
				ResourceLoadingMessageBox('close');
			}else{
				ResourceLoadingMessageBox('正在加载资源(' + audio.files.loaded + '/' + audio.files.length　+  ')');
			}
		},
		/**
		 * 某个音频文件是否已经加载
		 */
		isLoad : function(file){
			return !!audio.files.list[file] && !!audio.files.list[file].elem;
		},
		getAudio : function(file){
			if(!!audio.files.list[file] && !!audio.files.list[file].elem){
				return audio.files.list[file].elem;
			}else{
				throwError(file + '音频资源未加载');
			}
		}
	};
	
	/**
	 * 音频播放相关
	 */
	var player = audio.player = {
		/**
		 * 音频播放对象初始化
		 */
		init : function(config){
			if(!!player.inited){
				return;
			}
			if(!config){
				ThrowError('config参数值未设置');
				return ;
			}
			player.config = config;

			player.inited = true;
			console.log('TSP.audio.player初始化');
		},
		/**
		 * 加载某个音频
		 * @param file 音频名称
		 */
		load : function(file) {
			if(audio.files.length == 0 || audio.files.loaded == 0){
				throwError('资源可能未加载，浏览器可能出现问题，需要升级');
			}
			if(!audio.files.isLoad(file)){
				throwError(file + '音频资源未加载');
				return;
			}
			player.stop();
			player.audioElem = audio.files.getAudio(file);
		},
		/**
		 * 播放音频，播放前必须用audio.player.load加载音频
		 */
		play : function(){
			if(!!player.audioElem){
				if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
					$("#AsrRecorder")[0].playSounds(player.audioElem.file);
				}else{
					player.audioElem.play();
				}
			}else{
				throwError('尚未加载音频资源');
			}
		},
		/**
		 * 暂停音频播放
		 */
		pause : function(){
			if(!!player.audioElem){
				if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
					$("#AsrRecorder")[0].pauseSounds();	
				}else{
					player.audioElem.pause();
				}
			}
		},
		/**
		 * 停止音频播放
		 */
		stop : function(){
			//停止IE录音播放
			if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
				$("#AsrRecorder")[0].stopRecSound();
			}
			if(!!player.audioElem){
				if(!player.audioElem.ended){
					if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
						$("#AsrRecorder")[0].stopSounds();	
					}else{
						player.audioElem.pause();
						player.audioElem.currentTime = 0;
					}
					
				}
			}
		}
	};
	
	/**
	 * 录音及语音识别
	 */
	var recorder = audio.recorder = {};
	// 录音对象初始化
	recorder.init = function(config){
		if(!!recorder.inited){
			return;
		}
		if(!config){
			ThrowError('config参数值未设置');
			return ;
		}
		recorder.config = config;
		// 录音线程
		var recorderWorker = null;
		// 转换线程
		var ffmpegWorker = null;
		
		// 开始录音
		recorder.start = function(testId, type, content, time, recordTime) {
			// 第一次录音开启计时器，次/分
			if(typeof record_check_interval == 'undefined' || !record_check_interval){
				record_check_interval = setInterval(function(){
					TSP.practice.videoResult();
				}, 60000);
			}
			
			if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {//判断是否IE浏览器
				$(".trans_test_ctrl_info_area").addClass('recording');
				recorder.recording = true;
				$("#AsrRecorder")[0].startRecord(testId, type, content, time, recordTime);
			}else{
				recorderWorker.postMessage({
					command : 'start',
					testId : testId,
					type : type,
					content : content,
					time : time,
					recordTime : recordTime
				});
			}
		};
		// 停止
		recorder.stop = function() {
			recorder.recording = false;
			if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) { //判断是否IE浏览器
				//显示flash录音框
				$(".trans_test_ctrl_info_area").removeClass('recording');
				//停止录音
				$("#AsrRecorder")[0].stopRecord();
			}else{
				recorder.node.disconnect();
				recorderWorker.postMessage({
					command : 'stop'
				});
			
				// 停止画波形图
				RecWave.stopRecord();
			}
//			console.log('停止录音');
		};
		
		
		if (navigator.getUserMedia && userAgent.indexOf("Edge") == -1) {
			
			var storage;
			if(userAgent.indexOf("BIDUBrowser") == -1){
				storage = window.localStorage; // 非百度浏览器
			}else{
				storage = window.sessionStorage; //  百度浏览器
			}
			
			if(storage.isOpenAudioLimit != 1 && storage.isOpenAudioLimit != 2){
				// 提示用户启用浏览器录音功能
				AudioModuleLoadingMessageBox('本次练习有口语录音功能，请允许浏览器提供麦克风！');
			}
			
			
			navigator.getUserMedia({
				audio : true
			} // 只启用音频
			, function(stream) {
				// 如果启用
				AudioModuleLoadingMessageBox('close');
				
				// localStorage存值
				storage.isOpenAudioLimit = 1;
				
				var context = recorder.context = new AudioContext();
				var soucre = recorder.source = context.createMediaStreamSource(stream);

				var bufferLen = recorder.config.bufferLen || 4096;
				var channelNumber = recorder.config.channelNumber || 1;
				var sampleRate =  context.sampleRate;
				var sampleBits = 16;
				// 创建声音的缓存节点，createScriptProcessor方法的
				// 第二个和第三个参数指的是输入和输出都是双声道。
				recorder.node = context.createScriptProcessor(bufferLen, channelNumber, channelNumber);
				recorderWorker = new Worker(TinSoConfig.host + '/js/worker.html?path=' + TinSoConfig.recorder);
				ffmpegWorker = new Worker(TinSoConfig.host + '/js/worker.html?path=' + TinSoConfig.ffmpeg.worker);

				AudioModuleLoadingMessageBox('正在初始化录音模块，首次加载时会从服务器下载资源，可能需要一段时间，请耐心等待。');
				
				recorderWorker.postMessage({
					command : 'init',
					sampleRate : context.sampleRate,
					channelNumber : channelNumber,
					sampleBits : sampleBits,
					TinSoConfig : TinSoConfig
				});
				
				ffmpegWorker.postMessage({
					command : 'init',
					ffmpeg : TinSoConfig.ffmpeg.lib
				});
				
				var currCallback;
				recorder.recording = false;
				recorder.node.onaudioprocess = function(e) {
					if (!recorder.recording)
						return;
					if(channelNumber == 1){
						recorderWorker.postMessage({
							command : 'record',
							buffer : [
								e.inputBuffer.getChannelData(0)//左声道
							]
							
						});
						
						// 调用画波形方法
						if(RecWave.wf){
							RecWave.wf.drawWaveform(e.inputBuffer.getChannelData(0));
						}
					}else{
						recorderWorker.postMessage({
							command : 'record',
							buffer : [
								e.inputBuffer.getChannelData(0),//左声道
								e.inputBuffer.getChannelData(1) //右声道
							]
						});
						
						// 调用画波形方法
						if(RecWave.wf){
							RecWave.wf.drawWaveform(e.inputBuffer.getChannelData(0));
						}
					}
				};
				
				recorder.configure = function(cfg) {
					for ( var prop in cfg) {
						if (cfg.hasOwnProperty(prop)) {
							recorder.config[prop] = cfg[prop];
						}
					}
				};
				
				// 获取录音
				recorder.getWaveByTime = function(time) {
					recorderWorker.postMessage({
						command : 'getWaveByTime',
						time : time
					});
				};
				
				// 获取录音
				recorder.getWaveByTimes = function(times) {
					recorderWorker.postMessage({
						command : 'getWaveByTimes',
						times : times
					});
				};
				
				recorder.getWaveData = function(callback){
					recorder.exportWAV(callback);
				};
				
				recorder.getBuffer = function(cb) {
					currCallback = cb || recorder.config.callback;
					recorderWorker.postMessage({
						command : 'getBuffer'
					});
				};
				
				recorder.exportWAV = function(cb, type) {
					currCallback = cb || recorder.config.callback;
					type = type || recorder.config.type || 'audio/wav';
					if (!currCallback)
						throw new Error('exportWAV第一个参数为回调方法，不能缺省');
					recorderWorker.postMessage({
						command : 'exportWAV',
						type : type
					});
				};
				
				recorderWorker.onmessage = function(e) {
					switch (e.data.command) {
					case 'start':
						recorder.source.connect(recorder.node);
						recorder.node.connect(recorder.context.destination);
						recorder.recording = true;
						
						// 开始画波形图
						RecWave.startRecord();
						break;
						// 音频识别结果
					case 'setResult':
						// 录音句子索引
						var sen_index = e.data.time;
						// 结果
						var videoRes = e.data.result;
						// 为空
						if(videoRes && e.data && e.data.mp3){
							videoRes['mp3'] = e.data.mp3;
						}else{
							videoRes = new Object();
							videoRes['mp3'] = '';
						}
						
						var tid = e.data.testId;
						TSP.practice.setResult(sen_index, videoRes, tid);
						break;
						// 获取本地音频
					case 'getWaveByTime':
						// 音频结果
						var mp3_src = e.data.blob;
						
						// 音频存在
						if(mp3_src != null){
							/**
							 * 播放录音
							 */
							TSP.practice.ctrlOpr.play_user_video(mp3_src, '播放录音');
						}else{
							MessageBox({
								content : '录音数据不存在！',
								buttons : [{
									text : '我知道了',
									click : function(){
										$(this).dialog('close');
									}
								}]
							});
						}
						
						break;
						// 获取本地音频
					case 'getWaveByTimes':
						// 音频结果
						var mp3_srcs = e.data.blob;
						
						// 音频存在
						if(mp3_srcs.length){
							/**
							 * 播放录音
							 */
							TSP.practice.ctrlOpr.play_user_repeat_video(mp3_srcs, 0);
						}else{
							MessageBox({
								content : '录音数据不存在！',
								buttons : [{
									text : '我知道了',
									click : function(){
										$(this).dialog('close');
									}
								}]
							});
						}
						
						break;
					// 转换成mp2
					case 'convert':
						ffmpegWorker.postMessage(e.data);
						break;
					default:
						break;
					};
				};
				ffmpegWorker.onmessage = function(e) {
					switch (e.data.command) {
					case 'converted':
						recorderWorker.postMessage(e.data);
						break;
					case 'initFinished':
						AudioModuleLoadingMessageBox('close');
						
						// 判断是否开始自动答题
						TSP.practice.isAutoPractice();
						break;
					default:
						break;
					};
				};
				recorder.inited = true;
				LoadingMessageBox('close');
				console.log('TSP.audio.recorder初始化');
			}, function(error) {
				AudioModuleLoadingMessageBox('close');
				// localStorage存值
				storage.isOpenAudioLimit = 2;
				
				switch (error.code || error.name) {
				case 'PERMISSION_DENIED':
					throwError('用户拒绝提供硬件服务。');
					break;
				case 'PermissionDeniedError':
					throwError('您拒绝浏览器提供麦克风 ，请重新打开浏览器并允许浏览器提供麦克风！');
					break;
				case 'NOT_SUPPORTED_ERROR':
				case 'NotSupportedError':
					throwError('浏览器不支持硬件设备。');
					break;
				case 'MANDATORY_UNSATISFIED_ERROR':
				case 'MandatoryUnsatisfiedError':
					throwError('无法发现指定的硬件设备。');
					break;
				default:
					throwError('无法打开麦克风。异常信息:'
							+ (error.code || error.name));
					break;
				}
				recorder.inited = false;
			});
		}
		
		console.log('recorder初始化完成');
	}
	
	audio.peaks = function(){

		console.log('TSP.audio.peaks初始化');
	};
	
	
	var practice = TSP.practice = {
		/**
		 * 当前题号
		 */
		curIndex : 0,
		/**
		 * 试题数
		 */
		count: 0,
		/**
		 * 是否已经提交
		 */
		is_submit: false,
		/**
		 * 初始化练习模式等
		 */
		init : function(){
			practice.paperTest.init();
			practice.answerSheet.init();
			practice.testTime.calculateTime();
			practice.autoPracticeInit();
			// 竞赛练习页面
			if(window.location.pathname == '/Competition/paper.html'){
				practice.fixSubTitle();
			}
			
			if(page_mode || type=='preview'){
				// 显示波形
				if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {//判断是否IE浏览器
					var time_end = 0;
					myTime = null;
					myTime = setInterval(function() {
						if($("#AsrRecorder")[0].sendToActionScript || time_end == 200){
							console.log('time_end:'+time_end);
							TSP.practice.waveForm.initWaveForm();
							clearInterval(myTime);
						}else{
							time_end++;
						}
					}, 1000);
				}
				
				if(type == 'wrong'){
				 	//隐藏所有试题
					$('.test_sub_area,.bold_line_class,.stars').addClass('hide');
				 	//隐藏答题卡
				 	$('.p_answer_list').find('p,span').addClass('hide');
				 	//显示第一大题
				 	$('.test_sub_area:first').show();
					//显示答题卡第一大题
					$('.p_answer_list').find('p:first,span:first').show();
					//显示下一题按钮
				 	$('.next_test_btn').show();
				}
			}
			$('.p_paper_nature').prepend('<div class="vedio_tips">如果浏览器提示“使用/共享麦克风”，请点击允许/同意，否则将无法使用录音功能！</div>');
			// 默认选中第一题
			$('.question_content:first').click();
			
			// 增加样式
			$('.test_content[data-kind="2"]').find('.sub_type_1520 .question_li').addClass('question_li_1520');
			$('.test_content[data-kind="2"]').find('.sub_type_1520 .question_li .speak_sentence.answer').remove();
			// 显示题目
			$('.test_content[data-kind="2"]').find('.sub_type_1520 .question_division_line').show();
			$('.test_content[data-kind="2"]').find('.sub_type_1520 .question_li .speak_sentence.question').show();
		},
		/**
		 * 判断是否自动答题
		 */
		isAutoPractice : function(){
			// 练习模式
			var mode = $('.p_operation_box #test-mode').attr('data-mode');
			// 资源
			var source = $('.p_paper_cnt').attr('data-source');
			// 结构类型
			var struct_type = $('.p_paper_cnt').attr('data-struct-type');
			
			// 开始自动答题
			if(mode == 'exam' 
				&& (	// 单元测试、人机对话的考试模式
						(source == 'ts' || source == 'unit') 
						// 作业的试卷考试模式
						|| (source == 'hw' && (struct_type == 2 || struct_type == 3))
					)
			){
				TSP.practice.start();
			}
		},
		/**
		 * 标题宽度增加
		 */
		fixSubTitle : function(){
			$('.test_title .sub_title').each(function(i, obj){
				if($(this).html().length >= 8){
					$(this).width($(this).width() + 50);
				}
			});
		},
		/**
		 * 自动答题样式初始化
		 */
		autoPracticeInit : function(){
			// 练习模式
			var mode = $('.p_operation_box #test-mode').attr('data-mode');
			// 资源
			var source = $('.p_paper_cnt').attr('data-source');
			// 结构类型
			var struct_type = $('.p_paper_cnt').attr('data-struct-type');
			
			// 开始自动答题
			if(mode == 'exam' 
				&& (	// 单元测试、人机对话的考试模式
						(source == 'ts' || source == 'unit') 
						// 作业的试卷考试模式
						|| (source == 'hw' && (struct_type == 2 || struct_type == 3))
					)
			){
				// 添加自动答题标识
				$('.p_answer_list').addClass('auto_start');
				$('.p_question_switch div').addClass('auto_start');
				// 隐藏按钮区域
				$('.p_operationBtn_container').hide();
				
				// 自动练习标识
				$('.p_operationBtn_container .btn_play').addClass('enable');
			}
		},
		/**
		 * 展示练习记录
		 */
		showRecord : function(){
			practice.paperTest.setTestNumber();
			practice.paperTest.setOption();
			practice.paperTest.setImgSize();
			practice.paperTest.setVideoImg();
			practice.paperTest.setBoldLine();
			practice.paperTest.removeWhite();
			practice.paperTest.setTestStatus();
			practice.paperTest.setQjTest();
			practice.paperTest.setDWLJTest();
			practice.answerSheet.init();
			
			practice.waveForm.initWaveForm();
			
			$('.p_paper_cnt').find('input[type=text], textarea').attr('readonly', 'readonly');
			$('.p_paper_cnt').find('input[type=radio], select').attr('disabled', 'disabled');
			// 默认第一题选中高亮
			$('.question_container[data-qid="1"]').addClass('current_question');
			// 听力按钮
			$('.test_content[data-kind="1"] .p_operationBtn_container').html($('#listentBtnAnswerTemp').template());
			// 笔试按钮
			$('.test_content[data-kind="3"] .p_operationBtn_container').html($('#writeBtnAnswerTemp').template());
			
			// 作业类型
			var source = $('.p_paper_cnt').attr('data-source');
			// 是否已提交
			var isSubmit = !!parseInt($('.p_paper_cnt').attr('data-submit'));
			// 未提交作业标识
			var hw_not_submit = (source == 'hw' && !isSubmit);
			// 如果作业未提交，“查看答案”按钮去除
			if(hw_not_submit){
				$('.test_content .p_operationBtn_container').find('.btn_answer').remove();
			}
			
			$('.sub_test_area').each(function(x, y){
				// 试题分数
	    		var arr_score = $(this).find('.sub_info').attr('data-score').split('|');
	    		// 删除最后的空白
	    		arr_score.pop();
	    		
				$(y).find('.test_content').each(function(i, n){
					// 主题型
					var main_type = $(n).attr('data-type');
					// 子题型
					var sub_type = $(n).attr('data-subtype');
					// 熟练度
					var test_level = $(n).attr('data-test-level');
					// 总分
					var ascore = $(n).attr('data-all-score');
					// 得分
					var score = $(n).attr('data-user-score');
					// 小题数
					var count = $(n).attr('data-count');
					
					// 处理7100按钮区域
					if(main_type == 7100){
						var btn_area = '<div class="dib-wrap p_operationBtn_container"></div>';
						
						// 第一部分位置
						var that = $(this).find('.question_container .question_content .question_p.china:eq(1)');
						// 是否存在按钮区
						if(!$(that).next().hasClass('p_operationBtn_container')){
							$(that).after(btn_area);
						}
					}
					
					// 如果没有得分，则为0
					if(score == '' || score == undefined){
						score = 0;
					}
					
					// 用户答案 (未做的选择答案为空字符串)
					var user_answer = $(n).attr('data-user-answer');
					user_answer = user_answer == undefined ? '' : user_answer;
					
					// 用户答案数组
					var user_answer_array = new Array();
					
					if(user_answer.search(/\|/) >= 0){
						user_answer_array = user_answer.split(/\|/);
					}else if(user_answer.search(/\#/) >= 0){
						var user_answer_array = user_answer.split(/\#/);
						user_answer_array.pop();
					}else{
						user_answer_array.push(user_answer);
					}
					
					// APP端未做，答案为空字符串，小题数和答案数不一致，补全答案为空字符串
					if(count != user_answer_array.length && user_answer_array[0] == ''){
    					for(var c = 0; c < count; c++){
    						user_answer_array[c] = '';
    					}
    				}
					
					// 计算总分，有的题目中data-all-score没有数据
					var ascore_calc = 0;
					
					$(n).find('.question_content').each(function(j, m){
						var test_mold = $(m).attr('data-test-mold');
						var qid = $(m).closest('.question_container').attr('data-qid');
						// 显示知识点熟练度
						$(m).find('.p_knowledge_points .knowledge_point').each(function(w, obj){
							$(obj).append('('+$(this).attr('data-klevel')+'%)');
						});
						
						ascore_calc += parseFloat(!!arr_score[j] ? arr_score[j] : arr_score[0]);
						
						// 单选框(复选框)形式、子类型不为北师大题型(北师大题型1为填空题)
		    			if(test_mold == 1 && sub_type != 1621 && sub_type != 1626 && sub_type != 1631 && sub_type != 1321 && sub_type != 1323 && sub_type != 1324 && sub_type != 1326){
		    				// 正确答案，A...
		    				var right_answer_str = $(m).find('.right_answer_class').attr('data-right-answer');
		    				// 转换正确答案，从0开始
		    				right_answer = practice.process.convertAnswer(right_answer_str);
		    				
		    				// 题目满分，直接填充正确答案并添加正确样式
		    				if(score == ascore && score != 0){
		    					// 填充正确答案，正确选项颜色
//		    					$(m).find('input[type=radio]:eq(' + right_answer + ')').attr('checked', 'checked').closest('label').addClass('radio_right_answer');
		    					$(m).find('input[type=radio][value="' + right_answer + '"]').attr('checked', 'checked').closest('label').addClass('radio_right_answer');
		        				// 答题卡颜色变化
		        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
			    			}else{
			    				if(isNaN(user_answer_array[j])){
			    					user_answer_array[j] = 0;
			    				}
	        					// 用户答案序号，从0开始，未选或答案无效为-1
		        				var user_answer_index = parseInt(user_answer_array[j]);
		        				
		        				// 填充用户答案
		        				if(user_answer_index >= 0){
		        					$(m).find('input[type=radio][value="' + user_answer_index + '"]').attr('checked', 'checked');
		        				}
			    				// 答案是否正确
			        			if(user_answer_index == right_answer){
			        				// 用户答案变色
			        				if(user_answer_index >= 0){
				        				$(m).find('input[type=radio][value="' + user_answer_index + '"]').closest('label').addClass('radio_right_answer');
			        				}
			        				// 答题卡颜色变化
			        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
			        			}else{
			        				// 用户答案变色
			        				if(user_answer_index >= 0){
				        				$(m).find('input[type=radio][value="' + user_answer_index + '"]').closest('label').addClass('radio_wrong_answer');
			        				}
			        				// 提交的作业和非作业，显示正确答案
			        				if(!hw_not_submit){
			        					$(m).find('input[type=radio][value="' + right_answer + '"]').closest('label').addClass('radio_right_answer');
			        				}
			        				// 答题卡颜色变化
			        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_wrong_class');
			        			}
		    				}
		    			}
		    			// 填空形式、北师大题型1为填空题
		    			else if((test_mold == 2 && main_type != 2700) || (test_mold == 1 && (sub_type == 1621 || sub_type == 1631 || sub_type == 1626 
		    					|| sub_type == 1321 || sub_type == 1323 || sub_type == 1324 || sub_type == 1326))){
		    				// 正则表达式
		        			var reg = new RegExp("[.,;,:,\,，。\’\'\"\?][]*","g");
		        			// 正确答案
		        			var right_answer = $(m).find('.analysis .right_answer_class').attr('data-right-answer');
		        			// 拓展答案(笔试用)
		        			var ext_answer = $(m).find('.analysis .right_answer_class').attr('data-ext-answer');
		        			
		    				// 正确答案数组
		    				var right_answers = ext_answer == undefined ? new Array() : ext_answer.split('#');
		    				if(right_answers.length > 0){
		    					right_answers[right_answers.length - 1] = right_answer;
		    				}else{
		    					right_answers[0] = right_answer;
		    				}
		    				for(var a in right_answers){
	    						// right_answers: Array（小题所有正确答案）=> Array（某一种正确答案） => String（某一空格答案）
	    						right_answers[a] = right_answers[a].split(/\*/);
		    				}
		    				
		    				// 用户小题答案
		    				var user_answer_single = user_answer_array.length <= j ? [] : user_answer_array[j].split(/[\*\#]/);
							
		    				// 用户答案空格数大于正确答案的空格数，截取
							if(user_answer_single.length > right_answers[0].length){
								user_answer_single.splice(right_answers[0].length, user_answer_single.length- right_answers[0].length);
							// 用户答案空格数小于正确答案的空格数，填充空字符串
							}else if(user_answer_single.length < right_answers[0].length){
								for(var k = user_answer_single.length; k < right_answers[0].length;  k++){
									user_answer_single[k] = '';
								}
							}
		    				
		    				// 答案是否正确标识
		    				var flag_answer = true;
		    				
		    				for(var t in user_answer_single){
		    					// 空格
		    					var input_text = $(m).find('input[type=text]:eq(' + t +')');
		    					// 空不存在
		    					if(input_text.length == 0){
		    						break;
		    					}

		    					// 首字母标识
				    			var initial_flag = false;
		    					//	判断是否为首字母填空
		    	    			var prevNode = input_text.previousSibling;
		    	    			if(prevNode != null && prevNode.nodeType == 3 
		    	    					&& $.trim(prevNode.nodeValue.substr(-1)) != '' && prevNode.length == 1){
		    	    				initial_flag = true;
		    	    			}

		    					// 填充用户答案
		    					input_text.val(user_answer_single[t]);
		    					// 单个空正确标识
		    					var flag_single = false;
		    					
		    					// 题目满分
		    					if(score == ascore && score != 0){
		    						flag_single = true;
		    						input_text.addClass('right_answer');
		    					}else if(user_answer_single[t] == ''){
		    						flag_single = false;
			    				}else{
			    					for(var a in right_answers){
			    						// 答案是否为中文
			    						var isCh_flag = false;

			    						var right_answers_a_t = $.trim(right_answers[a][t].toLowerCase());
			    						right_answers_a_t = right_answers_a_t.replace(/[.,;,:,\,，\?]/g, ' ');
			    						right_answers_a_t = $.trim(right_answers_a_t);
			    						right_answers_a_t = right_answers_a_t.replace(reg, '');
			    						right_answers_a_t = right_answers_a_t.replace(/\r\n/g, '');
			    						right_answers_a_t = right_answers_a_t.replace(/\n/g, '');
			    						right_answers_a_t = right_answers_a_t.replace(/\s+/g, '*');

			    						var user_answer_single_t = user_answer_single[t].toLowerCase();
			    						user_answer_single_t = user_answer_single_t.replace(/[.,;,:,\,，\?]/g, ' ');
			    						user_answer_single_t = $.trim(user_answer_single_t);
			    						user_answer_single_t = user_answer_single_t.replace(reg, '');
			    						user_answer_single_t = user_answer_single_t.replace(/\r\n/g, '');
			    						user_answer_single_t = user_answer_single_t.replace(/\n/g, '');
			    						user_answer_single_t = user_answer_single_t.replace(/\s+/g, '*');

			    						if (initial_flag) {
			    							if (right_answers_a_t == user_answer_single_t.substr(1) || right_answers_a_t.substr(1) == user_answer_single_t || right_answers_a_t == user_answer_single_t) {
			    								flag_single = true;
			    								input_text.addClass('right_answer');
			    								break;
			    							}

			    						} else if(right_answers_a_t == user_answer_single_t){
			    							flag_single = true;
			    							input_text.addClass('right_answer');
			    							break;
			    						}
			    					}
			    				}
		    					// 单个空错误
		    					if(!flag_single){
		    						input_text.addClass('wrong_answer');
		    						// 提交的作业和非作业，显示正确答案
		    						if(!hw_not_submit){
			    						// 正确答案
			    						for(var s in right_answers){
			    							input_text.after('<span class="right_answer">('+ right_answers[s][t] +')</span>');
		    							}
		    						}
		    					}else{
		    						// 提交的作业和非作业，显示正确答案
		    						if(!hw_not_submit){
			    						// 正确答案
			    						for(var s in right_answers){
			    							input_text.after('<span class="right_answer">('+ right_answers[s][t] +')</span>');
		    							}
		    						}
		    					}
		    					flag_answer = flag_answer && flag_single;
		    				}
		    				
		    				// 答案是否正确
		        			if(flag_answer){
		        				// 答题卡颜色变化
		        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
		        			}else{
		        				// 答题卡颜色变化
		        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_wrong_class');
		        			}
		    			}
		    			// 下拉列表形式
		    			else if(test_mold == 5){
		    				// 正确答案
		    				var right_answer = $(m).find('.analysis .right_answer_class').attr('data-right-answer');
		    				
		    				// 转换正确答案
		    				if(user_answer_array[j] != '' 
		    					&& (user_answer_array[j].charCodeAt() <= 64 || user_answer_array[j].charCodeAt() >= 106)){
		    					user_answer_array[j] = practice.process.convertAnswerByNum(user_answer_array[j]);	
		    				}
		    				
		    				// 题目满分或答案正确，select设置正确答案，并标记正确样式
	    					if((score == ascore && score != 0) || user_answer_array[j] == right_answer){
			    				$(m).find('select').val(right_answer).addClass('select_right');
			    				// 答题卡颜色变化
		        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
		    				}else{
		    					// select设置用户答案，并标记错误样式
			    				$(m).find('select').val(user_answer_array[j]).addClass('select_wrong');
			    				// 提交的作业和非作业，显示正确答案
		        				$(m).find('span.right_answer').remove();
		        				if(!hw_not_submit){
		        					$(m).find('select').after('<span class="right_answer">('+right_answer+')</span>');
		        				}
			    				// 答题卡颜色变化
		        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_wrong_class');
		    				}
		    			}
		    			// 录音形式
		    			else if(test_mold == 6){
		    				// 显示每道小题的总分
		    				$(n).find('.question_division_line').each(function(s, t){
		    					$(this).find('.speak_sentence.question').each(function(ii, oo){
		    						if(arr_score[ii] == undefined){
		    							$(this).append("&nbsp;&nbsp;(" + arr_score[0] + ")");
		    						}else{
		    							$(this).append("&nbsp;&nbsp;(" + arr_score[ii] + ")");
		    						}
		    					});
		    				});
		    				
		    				if(user_answer == '' || user_answer == undefined){
		    					for(var u = 0; u < $(n).find('.speak_sentence.answer').length; u++){
		    						user_answer_array[u] = 0;
		    					}
		    				}else{
			    				// 用户答案数组
			    				user_answer_array = user_answer.split(',');
			    				// 用户答案数组删除最后多余的一个空值
			    				user_answer_array.pop();
		    				}
		    				
		    				// 显示每道小题的得分
		    				$(n).find('.speak_sentence.answer').each(function(s, t){
		    					if(user_answer_array[s] == undefined){
		    						$(t).append("&nbsp;&nbsp;(0)");
		    					}else{
		    						$(t).append("&nbsp;&nbsp;(" + user_answer_array[s] + ")");
		    					}
		    				});
		    				
		    				// 是否存在答案
	    					var answer_flag = $(n).find('.question_division_line').length > 0 ? true : false;
	    					// 是否存在音频
	    					var audio_flag = false;
	    					// 音频文件存在
	    					if($(n).find('.p_Laudio').length > 0 
								&& ($(n).find('.p_Laudio').attr('data-mp3') != undefined 
								&& $(n).find('.p_Laudio').attr('data-mp3') != ''
								&& $(n).find('.p_Laudio').attr('data-mp3') != 0)
							){
	    						audio_flag = true;
	    					}else{
	    						// 音频文件是否存在
	    						if($(n).find('.speak_sentence:not(.no_audio)') && $(n).find('.speak_sentence:not(.no_audio)').length){
	    							audio_flag = true;
	    						}
	    					}
	    					// 录音数量
	    					var video_flag = $(n).find('.question_li:not(.question_li_1520)').length > 0 ? false : true;
	    					
	    					// 按钮模型
	    					var btn_tmp = 'speackingBtn';
	    					
	    					// 原音按钮
	    					if(audio_flag && $(n).attr('data-subtype') != '1535'){
	    						btn_tmp = btn_tmp + 'Audio';
	    					}
	    					// 录音按钮
	    					if(video_flag){
	    						btn_tmp = btn_tmp + 'Video';
	    					}
	    					// 答案按钮
	    					if(answer_flag){
	    						btn_tmp = btn_tmp + 'Answer';
	    					}
	    					btn_tmp = btn_tmp + 'Temp';
	    					
	    					// 问题添加按钮 
	    					if($(n).attr('data-subtype') == 1540 || $(n).attr('data-subtype') == 1541){
	    						$(n).find('.question_li:not(.question_li_1520)').append($('#noSpeackingBtnQuestionTemp').template());
    						}else{
    							$(n).find('.question_li:not(.question_li_1520)').append($('#speackingBtnQuestionTemp').template());
    						}
	    					
	    					$(n).find('.sub_type_1520 .btn_question_area').remove();
	    					
	    					$(n).find('.p_operationBtn_container').html($('#'+btn_tmp).template());
	    					
	    					// 如果得分不为0，答题卡对应题号标绿
	    					if(score > 0){
	    						$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
	    					}else{
	    						$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_wrong_class');
	    					}
		    			}
		    			// 作文
		    			else if(test_mold == undefined && main_type == 2700){
		    				// textarea展示作文
		    				$(m).find('textarea').val(user_answer);
		    			}
					});
					if(main_type == 7100 && $(n).find('.p_operationBtn_container').length == 2){
						$(n).find('.p_operationBtn_container:eq(1) .left_area.toh').html('熟练度:' + test_level + '%,&nbsp;总分:' + (parseFloat(ascore) <= 0 ? (isNaN(ascore_calc) ? count : ascore_calc) : ascore) + ',&nbsp;得分:' + score);
					}else{
						// 特殊作业id
				    	var shids = [538777,538779,538782,538783,538784,538794,538802,538805,538806,538807,538875,538876,538877,538878,538879,538880,538881,
						    538882,538883,538884,538885,538886,538887,538888,538889,538890,538891,538892,538893,538894,538895,538896,538897,538898,538899,
						    538900,538901,538902,538903,538904,538905,538906,538907,538908,538909,538910,538911,538912,538913,538914,544241,
						    560248,560247,560246,560225,560224,560223,560222,560220,560217,560216];
				    	// 显示得分
						if(typeof practice_id && $.inArray(parseInt(practice_id), shids) > -1){
						}else{
							$(n).find('.left_area.toh').html('熟练度:' + test_level + '%,&nbsp;总分:' + (parseFloat(ascore) <= 0 ? (isNaN(ascore_calc) ? count : ascore_calc) : ascore) + ',&nbsp;得分:' + score);
						}
					}
				});
			});
			
			// 7100题型特殊处理
			$('.test_content[data-type="7100"]').each(function(i, obj){
				// 按钮区不唯一
				if($(obj).find('.p_operationBtn_container').length == 2){
					$(obj).find('.p_operationBtn_container:eq(1) .right_area').empty();
				}
				
				// 将第一部分原文移入题目内容中
				if($(obj).find('.question_division_line:eq(0)').length){
					// 第一部分
					var one_obj = $(obj).find('.question_container .question_content .question_p.china:eq(1)');
					// 存在
					if($(one_obj).next().hasClass('question_division_line')){
						$(one_obj).next().html($(obj).find('.question_division_line:eq(0)').html());
					}else{
						$(one_obj).after($(obj).find('.question_division_line:eq(0)'));
					}
				}
				
				// 删除旧问题
				$(obj).closest('.test_content').find('.question_container .question_content .question_content_str').remove();
				// 显示相应问题
				$(obj).closest('.test_content').find('.china_q').each(function(j, ebj){
					// 问题内容
					var qs_str = $(ebj).html();
					// 不为空
					if(qs_str != ''){
						// 是否存在
						if($(ebj).closest('.test_content').find('.question_container .question_content .question_content_str:eq("'+j+'")').length){
							qs_str = '<div class="dib question_content_str_num">' + (j + 1) + '.</div>'
								+ '<div class="dib question_content_str_info">' + qs_str + '</div>';
							// 显示问题
							$(obj).closest('.test_content').find('.question_container .question_content .question_content_str:eq("'+j+'")').html(qs_str);
						}else{
							// 内容
    						qs_str = '<div class="dib dib-wrap question_content_str">' 
								+ '<div class="dib question_content_str_num">' + (j + 1) + '.</div>'
								+ '<div class="dib question_content_str_info">' + qs_str + '</div>' + '</div>';
    						// 显示问题
							$(obj).closest('.test_content').find('.question_container .question_content').append(qs_str);
						}
					}
				});
				
				// 问题对象
				var tmp_obj = $(obj).find('.question_division_line:eq(1)');
				
				// 将第二部分小问移入题目内容中
				$(tmp_obj).find('.speak_sentence').each(function(j, ebj){
					if($(ebj).closest('.test_content').find('.question_content_str:eq("'+j+'") .question_content_str_info .question_division_line').length){
						$(ebj).closest('.test_content').find('.question_content_str:eq("'+j+'") .question_content_str_info .question_division_line').html($(ebj).html());
					}else{
						$(ebj).closest('.test_content').find('.question_content_str:eq("'+j+'") .question_content_str_info').append(ebj);
					}
				});
				
				// 按钮
				$(this).find('.question_content_str').each(function(j, ebj){
					if($(ebj).next().hasClass('.btn_info_area')){
						$(ebj).next().remove();
					}
					$(ebj).after($('#speackingBtnAudioVideoTemp').template());
				});
				
				// 删除对象
				$(tmp_obj).remove();
				
				// 按钮居右
				$(this).find('.btn_info_area').each(function(j, ebj){
					if($(ebj).find('.left_area.toh').html() == ''){
						$(ebj).find('.left_area.toh').hide();
						$(ebj).css('text-align', 'right');
					}
				});
			});
		},
		/**
		 * 开始练习(自动练习)
		 */
		start : function(){
			// 添加自动答题标识
			$('.p_answer_list').addClass('auto_start');
			$('.p_question_switch div').addClass('auto_start');
			// 隐藏按钮区域
			$('.p_operationBtn_container').hide();
			
			// 自动练习标识
			$('.p_operationBtn_container .btn_play').addClass('enable');
			// 开始循环读取每题内容
			self_practice_key = setInterval(function(){
				// 播放按钮
				var obj = $('.p_operationBtn_container .btn_play.enable:first');
				
				// 为空
				if(obj == undefined || obj.length == 0){
					// 停止时间
					clearInterval(self_practice_key);
					// 停止时间
					clearInterval(time_id);
					// 存在音频试题
					if($('.test_content[data-kind="1"]').length || $('.test_content[data-kind="2"]').length){
						// 停止音频
						TSP.audio.player.stop();
						// 停止时间
						clearInterval(remainder_key);
						// 停止时间
						clearInterval(play_key);
						// 停止时间
						clearInterval(tape_remainder_key);
						// 显示音频播放提示框
						$('.test_ctrl_info_area').hide();
						// 隐藏录音框
						$('.trans_test_ctrl_info_area').removeClass('recording');
					}
					
					// 考试模式
                    if($('#test-mode').attr('data-mode') == 'exam'){
                    	// 设置所有选项不可用
		    	    	$('.p_tests_area input').attr('disabled', 'disabled');
		    	    	// 设置所有文本框不可用
		    	    	$('.p_tests_area textarea').attr('disabled', 'disabled');
		    	    	// 设置所有下拉框不可用
		    	    	$('.p_tests_area select').attr('disabled', 'disabled');
                    }
					
                    // 等待时间
                    var wait_time = 60 * 5;
                    
                    // 循环判断是否判分结束
                    var self_answer_key = setInterval(function(){
                    	// 已结束
                    	if($('.p_tests_area').attr('data-page') == 'result'){
                    		// 停止时间
    						clearInterval(self_answer_key);
    						
                    		ResourceLoadingMessageBox('close');
                    		
                    		return;
                    	}
                    	// 录音判分
                    	var res = practice.videoResult();
                    	
                    	// 等待时间
                    	wait_time--;
                    	
                    	// 判分结束或等待时间结束
                    	if(($('.p_tests_area').attr('data-page') != 'result' 
                    			&& wait_time <= 0 && res) 
                    		|| ($('.p_tests_area').attr('data-page') != 'result' && res)){
                    		// 停止时间
    						clearInterval(self_answer_key);
    						
                    		ResourceLoadingMessageBox('close');
                    		// 提交试卷
    						if(is_primary){
                        		TSP.practice.primary.question.submitAnswer();
                        	}else{
                        		TSP.practice.process.submitAnswer();
                        	}
                    	}else{
                    		ResourceLoadingMessageBox('正在判分，请稍等！');
                    	}
                    }, 1000);
					
				}else if(!$(obj).hasClass('start')){
					// 自动定位到当前题
					var qid = $(obj).closest('.test_content').find('.question_container').attr('data-qid');
					if(qid > 0){
						TSP.practice.answerSheet.select(qid, -80);
					}
					// 触发开始答题事件
					$(obj).click();
				}
			}, 1000);
		},
		/**
		 * 判断录音判分是否结束
		 */
		videoResult : function(){
			// 存在录音时
			if(($('.test_content[data-kind="2"]') != undefined && $('.test_content[data-kind="2"]').length > 0) 
					|| $('.p_paper_cnt.beidanci_box[data-homework-type="30"]').length > 0){
				// 音频识别成功标识
				var video_status = true;
				// 循环判断音频识别情况
				$.each(videoResult, function(tid, objs){
					// 试题子类型
					var sub_type = $('.test_content[data-id="' + tid + '"]').attr('data-subtype');
					if(objs != undefined && objs != null){
						$.each(objs, function(time_flag, obj){
							if(obj['result'] == undefined || obj['result']['count'] == undefined){
								video_status = false;
								// 当前时间戳
								var cur_time = (new Date()).getTime();
								// 时间
								var big_time = 120000;
								// 为1428
								if(sub_type == 1428){
									big_time = 900000;
								}
								// 判断是否超时，超时得分为0
								if(cur_time - obj['end_time'] > big_time){
									TSP.practice.setResult(time_flag, {'count' : 0, 'mp3' : '', 'score' : 0}, tid);
								}
							}
						});
					}
				});
				
				// 存在在音频未识别
				if(!video_status){
					return false;
				}
			}
			
			return true;
		},
		setResult : function(time_flag, videoRes, tid){
			// 小学知识点练习录音
			if($('.primary_video_setResult').length > 0) {
				primaryVideoSetResult(videoRes);
			}else if($('.follow_danci_setResult').length > 0){
				gdWordVideoSetResult(time_flag,videoRes,tid);
			}

			// 点说单独处理
			var typeid = $('.test_content[data-id="' + tid + '"]').find('.chosBox').val();
			
			if(typeid == 5000){
				// 记录音频识别结果
				videoResult[tid][time_flag]['result'] = videoRes;
				
				var score = videoRes.count == 0 ? 0 : videoRes['score'];
				
				// 是否显示口语判分
				if(judge_speaking){
					if(score < 60){
						$('.test_content[data-id="'+tid+'"]').find('.question_content .speak_sentence[data-time-flag="'+time_flag+'"]').removeClass('high_light_font').addClass('no_pass_font');
						
					}else{
						$('.test_content[data-id="'+tid+'"]').find('.question_content .speak_sentence[data-time-flag="'+time_flag+'"]').removeClass('high_light_font').addClass('pass_font');
					}
					// $('.test_content[data-id="'+tid+'"]').find('.question_content .speak_sentence[data-time-flag="'+time_flag+'"]').next('.speak_sentence_score').remove();
					// $('.test_content[data-id="'+tid+'"]').find('.question_content .speak_sentence[data-time-flag="'+time_flag+'"]').after('<span class="speak_sentence_score">'+'('+score+')'+'</span>');
					$('.test_content[data-id="'+tid+'"]').find('.question_content .speak_sentence[data-time-flag="'+time_flag+'"]').next('.sentence_behind_space').removeClass('wait_background').html('('+score+')');
//					$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence').attr("data-time_flag",time_flag);
					$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence[data-time-flag="'+time_flag+'"]').attr("data-sen_score",score);
				}
			}else{
				// 找到当前录音的试题
				$.each(videoResult, function(tid, testResults){
					if(testResults == undefined || testResults == null){
						
					}else{
						// 试题序号
						var quesiton_index = 0;
						
						$.each(testResults, function(resultTime, video){
							// 试题序号
							quesiton_index++;
							// 如果时间戳相同
							if(resultTime == time_flag){
								// 记录音频识别结果
								videoResult[tid][resultTime]['result'] = videoRes;
								
								// 得分
	    						var sen_score = videoRes['score'];
	    						// 判断分值
	    						if(isNaN(sen_score)){
	    							sen_score = 0;
	    						}
	    						if(!sen_score){
	    							sen_score = 0;
	    						}
								// 主类型
	    						var main_type = $('.test_content[data-id="'+tid+'"]').attr('data-type');
	    						// 子类型
	    						var sub_type = $('.test_content[data-id="'+tid+'"]').attr('data-subtype');

								// 跟读
								if(typeid == 8000){
									// 是否显示口语判分
									if(judge_speaking){
										$('.test_content.current_test .speak_sentence[data-time-flag="' + time_flag + '"]').next('.sentence_behind_space').removeClass('wait_background').html('('+sen_score+')');
										// 判断分数情况
										if(sen_score > 60){
											$('.test_content.current_test .speak_sentence[data-time-flag="' + time_flag + '"]').removeClass('high_light_font').addClass('pass_font');
										}else{
											$('.test_content.current_test .speak_sentence[data-time-flag="' + time_flag + '"]').removeClass('high_light_font').addClass('no_pass_font');
										}
									}
									
									// 音频识别成功标识
									var video_status = true;
									// 长度
									var sentence_length = 0;
									// 循环判断音频识别情况
									if(videoResult != undefined){
										$.each(videoResult, function(i, objs){
											if(objs != undefined){
												$.each(objs, function(j, obj){
													if(obj == undefined || obj['count'] == undefined){
														video_status = false;
													}else{
														sentence_length++;
													}
												});
											}
										});
									}
									
									// 存在在音频未识别
									if(video_status && sentence_length >= $('.test_content.current_test[data-id="'+tid+'"]').find('.speak_sentence').length){
										// 关闭等待框
										ResourceLoadingMessageBox('close');
										// 删除开始标识
										$('.start_btn').removeClass('start');
										// 提交试卷
										TSP.practice.process.submitSpeakAnswer(videoResult, mode_type_gd);
									}
								}
								
	    						// 课外拓展
	    						var speak_sentence = $('.proverb_information[data-id="'+tid+'"]');
	    						if(speak_sentence.length){
    								// 记录音频识别结果
									videoResult[tid][resultTime]['result']['score'] = sen_score;
									// 单句得分
									var single_score = sen_score;
									// 记录最佳录音
									if(sen_score > bestScore[tid] || videoBest[tid] == undefined || videoBest[tid] == null){
										videoBest[tid] = videoResult[tid];
									}
									// 保存最高得分
									if(single_score > bestScore[tid] || bestScore[tid] == undefined || bestScore[tid] == null){
										bestScore[tid] = single_score;
										
										var params = {};
										params.expand_id = tid;
										params.score = bestScore[tid];
										
								    	$.post(TinSoConfig.student + '/Expand/followRead.html', params, function(data){
								    		if(data.status){
								    			// 显示分数
								    			speak_sentence.find('.prover_height_points_show').html(sen_score);;
								    			record_flag =false;
		    								}
								    	});
									}
									speak_sentence.closest('.proverb_information').find('.record_tips').html('');
									
									return;
	    						}
								
    							// 功能意念表页面判分用
    							var speak_sentence = $('.test_content .test_functional_content').find('.speak_sentence[data-id="'+tid+'"]');
	    						if(speak_sentence.length){
	    							if(sen_score == 0){
	    								// 记录音频识别结果
										videoResult[tid][resultTime]['result']['score'] = '0';
										// 单句得分
										var single_score = '0';
	    							}else{
	    								// 记录音频识别结果
										videoResult[tid][resultTime]['result']['score'] = sen_score;
										// 单句得分
										var single_score = sen_score;
	    							}
    								
									// 记录最佳录音
									if(single_score > bestScore[tid] || videoBest[tid] == undefined || videoBest[tid] == null){
										videoBest[tid] = videoResult[tid];
									}
									// 保存最高分
									if(single_score > bestScore[tid] || bestScore[tid] == undefined || bestScore[tid] == null){
										bestScore[tid] = single_score;
										var params = {};
										params.id = tid;
										params.level = bestScore[tid];
								    	$.post(TinSoConfig.student + '/Skill/submitFunctionalNotionalResult.html', params, function(data){
								    		if(data.status){
								    			// 显示分数
									    		speak_sentence.siblings('.sentence_score').html('(最高分：'+single_score+'分)');
									    		// 启用回放按钮
									    		speak_sentence.siblings().find('.single_record').addClass('current');
									    		//保存最高分
									    		$('.content_star_img[data-id='+tid+']').attr("data-score",single_score);
									    		//保存时间戳
									    		$('.content_star_img[data-id='+tid+']').attr("data-time",resultTime);
									    		// 星星变色
									    		if(single_score >= 69){
									    			$('.content_star_img[data-id='+tid+']').addClass('red');
									    		}
		    								}else{
		    									MessageBox({
		    										content : '提交得分失败，请重试！',
		    										buttons : [{
		    											text : '我知道了',
		    											click : function(){
		    												$(this).dialog('close');
		    											}
		    										}]
		    									});
		    								}
								    	});
									}
									var sentences = $('.test_content.current .test_ctrl_area').find('.test_ctrl[data-act-type="2"]');
									// 录音全部识别结束
									if(arr_index == sentences.length){
										// 录音识别提示
										speak_sentence.closest('.test_content').find('.record_tips').html('');
										arr_index = 1;
										record_flag = false;
									}else{
										arr_index++;
									}
									return;
	    						}
    							
	    						// 作业已提交
	    						if($('.p_answerSubmit_btn').length == 0 && $('.primary_submit_btn').length == 0){
	    							return false;
	    						}
	    						var typeid = $('.test_content.current_test').find('.chosBox').val();
	    						/**
	    						 * 练习页面
	    						 */
								// 试题分数
					    		var arr_score = $('.test_content[data-id="'+tid+'"]').closest('.test_sub_area').find('.sub_info').attr('data-score').split('|');
					    		// 删除最后的空白
					    		arr_score.splice(arr_score.length - 1, 1);
								
					    		// 小问分数
    							var question_ascore = 0;
					    		// 北京题型
					    		if(sub_type == 1621 || sub_type == 1626 || sub_type == 1631){
					    			// 小问分数
	    							question_ascore = arr_score[arr_score.length - 1];
					    		}
					    		// 小学知识点试题中的口语题没有结构分数，满分为1分
					    		else if(sub_type == 6403 || sub_type == 6406 || sub_type == 6410 || sub_type == 6413 || sub_type == 6417 || sub_type == 6420 || sub_type == 6424 || sub_type == 6427){
					    			question_ascore = 1;
					    		}else{
					    			// 小问分数
	    							question_ascore = quesiton_index > arr_score.length ? arr_score[0] : arr_score[quesiton_index - 1];
					    		}

    							// TODO 设置试题得分
					    		var score = (sen_score*question_ascore/100).toFixed(1);
					    		
					    		// 音频问题数量
	    						var video_question_num = $('.test_content[data-id="'+tid+'"]').find('.test_ctrl[data-act-type="2"]').length;
		    					
								// 是否显示口语判分
	    						if(judge_speaking){
			    					// 多问
			    					if(video_question_num > 1 || sub_type == 1435 || sub_type == 1627){
			    						// 7100特殊题型 quesiton_index
			    						if(main_type == '7100'){
			    							// 第一部分
			    							if(quesiton_index == 1){
			    								// 序号
					    						var result_index = 0;
					    						// 得分字符串
					    						var tmp_score = 0;
					    						// 不为空
						    					if(videoResult != undefined && videoResult != null 
						    							&& videoResult[tid] != undefined && videoResult[tid] != null){
						    						// 设置问题得分
						    						$.each(videoResult[tid], function(i, obj){
						    							if(obj['result'] != undefined && obj['result']['score'] != undefined && result_index == 0){
						    								tmp_score = obj['result']['score'];
						    							}
						    							
						    							result_index++;
						    						});
						    					}
					    						
			    								$('.test_content[data-id="'+tid+'"]').find('.left_area:eq(0)').html('得分：' + tmp_score);
			    							}else{
			    								// 序号
					    						var result_index = 0;
					    						// 得分字符串
					    						var str = '';
					    						// 不为空
						    					if(videoResult != undefined && videoResult != null 
						    							&& videoResult[tid] != undefined && videoResult[tid] != null){
						    						// 设置问题得分
						    						$.each(videoResult[tid], function(i, obj){
						    							// 不为空
						    							if(result_index > 0){
						    								if(obj['result'] != undefined && obj['result']['score'] != undefined && result_index > 0){
							    								str += '问题'+result_index+'得分:'+obj['result']['score']+'&nbsp;';
							    							}else{
							    								str += '问题'+result_index+'得分:0&nbsp;';
							    							}
						    							}
						    							
						    							result_index++;
						    						});
						    					}
					    						$('.test_content[data-id="'+tid+'"]').find('.left_area:eq(1)').html(str);
			    							}
			    						}else{
			    							// 序号
				    						var result_index = 0;
				    						// 得分字符串
				    						var str = '';
				    						// 不为空
					    					if(videoResult != undefined && videoResult != null 
					    							&& videoResult[tid] != undefined && videoResult[tid] != null){
					    						// 设置问题得分
					    						$.each(videoResult[tid], function(i, obj){
					    							result_index++;
					    							// 不为空
					    							if(obj['result'] != undefined && obj['result']['score'] != undefined){
					    								str += '问题'+result_index+'得分:'+obj['result']['score']+'&nbsp;';
					    							}else{
					    								if(sub_type == 1435){
					    									str += '得分:'+obj['result']['score']+'&nbsp;';
					    								}
					    							}
					    						});
					    					}
				    						$('.test_content[data-id="'+tid+'"]').find('.left_area').html(str);
			    						}
			    					}else{
			    						// 普通练习形式，朗读短文形式的录音得分显示在每句后面(一句一句录音并传输)
			    						if($('.test_content[data-id="'+tid+'"]').attr('data-type') == 1400 && sub_type != 1428 && sub_type != 1438){
			    							$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence:eq("'+(quesiton_index-1)+'")').attr("data-time_flag",time_flag);
			    							$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence:eq("'+(quesiton_index-1)+'")').attr("data-time-flag",time_flag);
			    							$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence:eq("'+(quesiton_index-1)+'")').attr("data-sen_score",sen_score);
			    							$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence:eq("'+(quesiton_index-1)+'")').next('.sentence_behind_space').removeClass('wait_background').html('('+sen_score+')');
			    							// 每句读完之后显示正确文本
			    							$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence:eq("'+(quesiton_index-1)+'") .kouarea').removeClass('henxian');
			    							// 判断分数情况
			    							if(sen_score > 60){
		    									$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence:eq("'+(quesiton_index-1)+'")').addClass('pass_font');
		    								}else{
		    									$('.test_content[data-id="'+tid+'"] .question_container .speak_sentence:eq("'+(quesiton_index-1)+'")').addClass('no_pass_font');
		    								}
		    							// 小学知识点试题分数显示在句子后面
			    						}else if(sub_type == 6403 || sub_type == 6406 || sub_type == 6410 || sub_type == 6413 || sub_type == 6417 || sub_type == 6420 || sub_type == 6424 || sub_type == 6427){
			    							var speak_sen = $('.test_content[data-id="'+tid+'"] .question_container .question_p:eq(0)');
			    							var sen_txt = speak_sen.text().replace(/(\(\d+\))/, '');
			    							
			    							speak_sen.removeClass('pass_font no_pass_font').text(sen_txt + '(' + sen_score + ')');
			    							if(sen_score > 60){
			    								speak_sen.addClass('pass_font');
			    							}else{
			    								speak_sen.addClass('no_pass_font');
			    							}
			    							// 关闭录音波形
			    							$('.test_ctrl_info_area').hide().find('.info_hint').empty();
			    						// 小学连词成句
			    						}else if(main_type == 6100){
			    							var font_class = sen_score < 60 ? 'no_pass_font' : 'pass_font';
			    							$('.test_content[data-id="'+tid+'"]').find('.sentence_show').addClass(font_class)
			    							$('.test_content[data-id="'+tid+'"]').find('.sentence_show .lccj_speak_sen_score').removeClass('sentence_behind_space wait_background').text('('+sen_score+')');
			    						}else{
			    							// 特殊作业id
			    					    	var shids = [538777,538779,538782,538783,538784,538794,538802,538805,538806,538807,538875,538876,538877,538878,538879,538880,538881,
			    							    538882,538883,538884,538885,538886,538887,538888,538889,538890,538891,538892,538893,538894,538895,538896,538897,538898,538899,
			    							    538900,538901,538902,538903,538904,538905,538906,538907,538908,538909,538910,538911,538912,538913,538914,544241,
			    							    560248,560247,560246,560225,560224,560223,560222,560220,560217,560216];
			    					    	// 显示得分
			    							if(typeof practice_id && $.inArray(parseInt(practice_id), shids) > -1){
			    								$('.test_content[data-id="'+tid+'"]').find('.left_area').html('录音判分结束！');
			    							}else{
			    								$('.test_content[data-id="'+tid+'"]').find('.left_area').html('录音得分：'+sen_score);
			    							}
			    						}
			    					}
	    						}
							}
						});
					}
				});
			}
			// 音频识别成功标识
			var video_status = true;
			// 循环判断音频识别情况
			if(videoResult != undefined){
				$.each(videoResult, function(tid, objs){
					if(objs != undefined){
						$.each(objs, function(i, obj){
							if(obj['result'] == undefined || obj['result']['count'] == undefined){
								video_status = false;
							}
						});
					}
				});
			}
			if(video_status){
				// 清空试题--0分引导
				$('body').attr('data-current-test-id' , '');
			}
			// 添加标识，作业提交后处于等待状态
	    	var wait_status = $('.main_content_box').attr('data-wait-status');
	    	// 处于已点击提交答案，等待录音识别阶段
	    	if(wait_status == '1'){
	    		// 循环判断音频识别情况
				if(videoResult != undefined){
					$.each(videoResult, function(tid, objs){
						if(objs != undefined){
							$.each(objs, function(i, obj){
								if(obj['result'] == undefined || obj['result']['count'] == undefined){
									video_status = false;
								}
							});
						}
					});
				}
				// 音频已全部识别
				if(video_status){
					// 设置提交按钮可用
		    		$('.p_answerSubmit_btn').removeClass('disabled');
		    		
					// 0分引导页
		    		isZeroDialog();
				}
	    	}
		},
		/**
		 * 处理asrrecorder中的数据
		 */
		asrrecorder : {
			/**
			 * 改变flash窗口大小
			 */
			sendToJavaScript : function() {
				$("#AsrRecorder").removeClass("full_screen").addClass('recorder_ctn');
				// 下载音频
				if(window.location.pathname == "/Skill/functionalNotional.html"){
					//加载页面默认打开第一章的第一节
					$('.chapter_cnt:first-child .list_chapter').click();
					$('.chapter_cnt:first-child').find('ul li:first-child').click();
				}else{
					// 下载音频
					if($('.test_content[data-kind="1"]').length || $('.test_content[data-kind="2"]').length 
							|| $('.test_content[data-kind="3"][data-type=6300]').length){
						TSP.practice.process.downloadAudioFile();
					}
					
					// 存在口语时，需要单独调用自动答题功能
					if($('.test_content[data-kind="2"]').length){
						TSP.practice.isAutoPractice();
					}
				}
			},
			/**
			 * 隐藏flash窗口
			 */
			hideFlash : function(){
				$("#AsrRecorder").hide();
			},
			/**
			 * 打印信息
			 */
			recordlog :　function(str){
				console.log(str);
			},
			/**
			 * 设置返回结果
			 */
			setResult　: function(time, result, mp3, testId){
				// 录音标识
				var time_flag = time;
				
				// 结果
				var videoRes = result;
				// 为空
				if(videoRes &&  mp3){
					videoRes['mp3'] = mp3;
				}else{
					videoRes = new Object();
					videoRes['mp3'] = '';
				}
				
				var tid = testId;
				TSP.practice.setResult(time_flag, videoRes, tid);
			},
			/**
			 * 回放音频时设置进度条
			 */
			playBackToJS : function(playbackPercent){
				// 显示音频播放提示框
				$('.test_ctrl_info_area').show();
				// 隐藏进度条
				$('.test_ctrl_info_area .percentage_gray').show();
				// 隐藏录音进度条
				$('.test_ctrl_info_area .waveform_container').hide();
				
				// 步骤说明
				$('.test_ctrl_info_area .info_hint').html('播放录音');
				// 隐藏秒
				$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
				
				// 进度条
				$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', playbackPercent+'%');
				
				if(playbackPercent == 100){
					// 隐藏音频播放提示框
					$('.test_ctrl_info_area').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
				}
			}
		},
		/**
		 * 试卷处理操作对象
		 */
		process : {
			/**
			 * 加载音频文件
			 */
			downloadAudioFile : function(){
				// 是否有录音
				var hasVideo = false;
				if(($('.test_content[data-kind="2"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6403"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6406"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6410"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6413"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6417"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6420"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6424"]').length
					|| $('.test_content[data-kind="3"][data-subtype="6427"]').length)
					&& $('.p_paper_cnt').attr('data-page') != 'record'
				){
					TSP.init({
						player : {},
						recorder : {}
					});
					hasVideo = true;
 				}else{
 					TSP.init({
 						player : {}
 					});
 					hasVideo = false;
 				}
				TSP.audio.files.list = {};
				TSP.audio.files.length = 0;
				// 音频文件
				var la_names = new Array();
				// 添加音频文件
				$('.test_content').find('.p_Laudio').each(function(i, n){
					// 音频名称
					var la_name = $(this).attr('data-mp3');
					// 是否存在
					if(la_name != undefined && la_name != '' && la_name != 0 && $.inArray(la_name, la_names) == -1 && la_name != '1.mp3'){
						// 添加音频文件
						TSP.audio.files.addFile(la_name, TinSoConfig.sta + '/book/mp3/'+la_name);
						// 保存数据
						la_names.push(la_name);
					}
				});
				
				// 添加音频文件
				$('.test_content').find('.test_ctrl_area li.test_ctrl').each(function(i, n){
					// 音频名称
					var la_name = $(this).attr('data-mp3-path');
					
					// 是否存在
					if(la_name != undefined && la_name != '' && $.inArray(la_name, la_names) == -1 && la_name != '1.mp3'){
						// 添加音频文件
						TSP.audio.files.addFile(la_name, TinSoConfig.sta + '/book/ctrl/'+la_name);
						// 保存数据
						la_names.push(la_name);
					}
				});
				
				// 添加口语音频文件
				$('.test_content').find('.speak_sentence').each(function(i, n){
					// 音频名称
					var la_name = $(this).attr('data-mp3');
					
					// 是否存在
					if(la_name != undefined && la_name != '' && $.inArray(la_name, la_names) == -1 && la_name != '1.mp3'){
						// 添加音频文件
						TSP.audio.files.addFile(la_name, TinSoConfig.sta + '/book/mp3/'+la_name);
						// 保存数据
						la_names.push(la_name);
					}
				});
				
				// 添加衢州口语音频文件
				$('.test_content').find('.question_container .question_p.china').each(function(i, n){
					// 音频名称
					var la_name = $(this).attr('data-mp3');
					
					// 是否存在
					if(la_name != undefined && la_name != '' && $.inArray(la_name, la_names) == -1 && la_name != '1.mp3'){
						// 添加音频文件
						TSP.audio.files.addFile(la_name, TinSoConfig.sta + '/book/mp3/'+la_name);
						// 保存数据
						la_names.push(la_name);
					}
				});
				
				// 添加录音音频文件
				$('.test_content').each(function(i, n){
					var record_mp3 = $(n).attr('data-record-mp3');
					if(record_mp3 != '' && record_mp3 != undefined){
						// mp3地址数组
						var mp3_arr = record_mp3.split(',');
						for(var j in mp3_arr){
							if(mp3_arr[j] == ''){
								continue;
							}
							// 音频名称
							if(mp3_arr[j].search('/')){
								var la_name = mp3_arr[j].substr(mp3_arr[j].lastIndexOf('/') + 1);
							}else{
								var la_name = mp3_arr[j];
							}
							if(mp3_arr[j].search('http') >= 0){
								// 添加音频文件
								TSP.audio.files.addFile(la_name, mp3_arr[j]);
								// 保存数据
								la_names.push(la_name);
							}
						}
					}
				});
				
				// 小学知识点练习（背单词、学语法）音频文件
				if(typeof learn_knowledges != 'undefined' && learn_knowledges.length){
					$.each(learn_knowledges, function(i, n){
						if(n.knowledge_type == 1){
							if(n.id == undefined){
								return true;
							}
							var id_path = parseInt(n.id) + '.mp3';
							var sen_path = parseInt(n.id) + '_1.mp3';
							// 添加单词文件
							TSP.audio.files.addFile(n.id, TinSoConfig.sta + '/book/mp3/'+ id_path);
							// 保存数据
							la_names.push(id_path);
							// 添加单词例句文件
							TSP.audio.files.addFile(sen_path, TinSoConfig.sta + '/book/mp3/'+ sen_path);
						}else{
							if(n.voice_path == undefined){
								return true;
							}
							var sen_path = parseInt(n.voice_path) + '_1.mp3';
							// 添加单词文件
							TSP.audio.files.addFile(n.voice_path, TinSoConfig.sta + '/book/mp3/'+ n.voice_path);
							// 保存数据
							la_names.push(n.voice_path);
							// 添加单词例句文件
							TSP.audio.files.addFile(sen_path, TinSoConfig.sta + '/book/mp3/'+ sen_path);
						}
						// 保存数据
						la_names.push(sen_path);
					});
				}
				
				// 加载音频文件
				TSP.audio.files.loadFiles();
				
				// 判断是否开始自动答题
				if(!hasVideo){
					TSP.practice.isAutoPractice();
				}
			},
			/**
			 * 根据得分计算加权准确性得分
			 */
			getReadVoiceScore : function(score){
				// 得分
				var iStandScore;
				// 得分70以上算2
				if(score >= 75){
		        	iStandScore = (score - 75) * 10 / 25 + 90;
	        	// 得分65以上算1.5
				}else if(score >= 65){
					iStandScore = score + 15;
				// 得分60以上算1.2
				}else if(score >= 50){
					iStandScore = (score - 50) * 10 / 15 + 70;
				}else{
					iStandScore = 0;
		        }
		        return iStandScore;
			},
			/**
			 * 计算得分句数
			 */
			getReadVoiceSenNumByScore : function(score){
				// 得分70以上算2句
				if(score >= 70){
		        	return 200;
	        	// 得分65以上算1.8句
				}else if(score >= 65){
					return 180;
				// 得分60以上算1.5句
				}else if(score >= 60){
					return 150;
				// 得分55以上算1.3句
				}else if(score >= 55){
					return 100;
				// 超过评分标准算1句
				}else{
					return 0;     
				}
			},
			/**
			 * 描述题根据得分计算加权完整性得分
			 */
			getTopicVoiceSenNumByScore : function(score){
				// 得分70以上算2句
				if(score >= 70){
					return 200;
				// 得分65以上算1.8句
				}else if(score >= 65){
					return 150;
				// 得分60以上算1.5句
				}else if(score >= 60){
					return 130;
				// 得分55以上算1.3句
				}else if(score >= 55){
					return 100;
				// 超过评分标准算1句
				}else{
					return 0;
				}
			},
			/**
			 * 描述题根据得分计算加权准确性得分
			 */
			getTopicVoiceScore : function(score){
				var iStandScore;
				
				if(score >= 75){
					iStandScore = (score-75)*10/25 + 90;
				}else if(score >= 65){
					iStandScore = score + 15;
				}else if(score >= 50){
					iStandScore = (score-50)*10/15 + 70;
				}else if(score >= 40){
					iStandScore = score + 20;
				}else{
					iStandScore = 0;
				}
				
				return iStandScore;
			},
			/**
			 * 计算录音每句得分
			 * @param	score		试题每句分数
			 */
			calculateVideoSenScore : function(score){
				if(score < 55){
					score = 0;
				}else if(score >= 55 && score < 70){
					score = parseInt(2 * score - 45);
					score = Math.random() > 0.5 ? score + 1 : score;
				}else if(score >= 70 && score < 100){
					score = parseInt(0.25 * score + 75);
				}
				
				return score;
			},
			/**
			 * 计算录音每句得分
			 * @param	score		试题每句分数
			 */
			calculateVideoHTJSScore : function(score){
				if(score < 55){
					score = 0;
				}else if(score >= 55 && score < 70){
					score = parseInt(2 * score - 45);
					score = Math.random() > 0.5 ? score + 1 : score;
				}else if(score >= 70 && score < 100){
					score = parseInt(0.25 * score + 75);
				}
				
				return score;
			},
			/**
			 * 计算录音得分
			 * @param tid 试题id
			 * @param main_type 试题主类型
			 * @param sub_type 试题子类型
			 * @param scores 试题分值字符串（格式：2|2|）
			 * @param video_num 试题录音次数
			 * @param sen_num 试题需要录音的句数(一般针对1400类题型)
			 * @param isSenNum 是否需要比较句数(1400的点说就不需要，true-需要，false-不需要)
			 */
			calculateVideoTotalScoreForNew : function(tid, main_type, sub_type, scores, video_num, sen_num, isSenNum){
				// 得分
				var score = 0;
				// 试题总分
				var ascore = 0;
				// 主类型
				main_type = parseInt(main_type);
				// 子类型
				sub_type = parseInt(sub_type);
				// 判断句数
				if(isNaN(sen_num)){
					sen_num = 1;
				}
				if(!sen_num){
					sen_num = 1;
				}
				// 判断录音次数
				if(isNaN(video_num)){
					video_num = 1;
				}
				if(!video_num){
					video_num = 1;
				}
				
				// 不为空
				if(videoResult != undefined && videoResult != null 
						&& videoResult[tid] != undefined && videoResult[tid] != null){
					// 录音数量
					var num = 0;
					// 不为空
					if(scores != undefined){
						scores = scores.split('|');
						// 长度超过1
						if(scores && scores.length){
							scores.splice(scores.length - 1, 1);
						}
						// 循环处理得分
						for(var i = 0; i < scores.length; i++){
							// 判断分值
							if(isNaN(scores[i])){
								scores[i] = 1;
							}
							if(!scores[i]){
								scores[i] = 1;
							}
						}
					}
					
					// 录音次数大于1次(1500类)
					if(video_num > 1){
						// 序号
						var index = 0;
						
						// 循环获取总得分
						$.each(videoResult[tid], function(i, obj){
							// 每问总分
							var qascore = parseFloat(scores.length ? (scores.length > index ? scores[index] : scores[0]) : 0);
							// 试题总分
							if(video_num > index){
								ascore += qascore;
							}
							// 判断总分
							if(isNaN(ascore)){
								ascore = 1;
							}
							if(!ascore){
								ascore = 1;
							}
							// 分值
							if(obj['result'] && obj['result']['score']){
								// 每问得分
								var qscore = parseInt(obj['result']['score']);
								// 判断总分
								if(isNaN(qscore)){
									qscore = 0;
								}
								if(!qscore){
									qscore = 0;
								}
								// 得分
								if(qscore){
									var tmp = parseFloat(Math.ceil(qscore * qascore / 100.0) * 2 / 2.0);
									tmp = tmp > qascore ? qascore : tmp;
									score += tmp;
								}
							}
							// 序号
							index++;
						});
						
					// 1400、1600类
					}else{
						// 总分
						if(sub_type == 1621 || sub_type == 1626 || sub_type == 1631){
							ascore  = parseFloat(scores.length ? scores[scores.length - 1] : 0);
						}else{
							ascore  = parseFloat(scores.length ? scores[0] : 0);
						}
						// 判断总分
						if(isNaN(ascore)){
							ascore = 1;
						}
						if(!ascore){
							ascore = 1;
						}
						
						// 朗读短文80分以上数量
						var eightyNum = 0;
						// 有分值的句子
						var scoreNum = 0;
						
						// 循环获取总得分
						$.each(videoResult[tid], function(i, obj){
							// 录音数量
							num++;
							// 分值
							if(obj['result'] && obj['result']['score']){
								var question_score = obj['result']['score'];
								// 判断录音得分
								if(isNaN(question_score)){
									question_score = 0;
								}
								if(!question_score){
									question_score = 0;
								}
								if(question_score >= 80){
									eightyNum++;
								}
								// 江苏的1403特别处理
								if(main_type == 1400 && sub_type == 1403 && question_score >= 70){
									question_score = 100;
								}
								if(question_score > 0){
									scoreNum++;
								}
								score += parseInt(question_score);
							}
						});
						
						// 朗读短文
						if(main_type == 1400){
							// 数量不够
							if(sen_num > num && isSenNum){
								num = sen_num;
							}
						}
						
						// 录音句数或者题目数
						if(num && ascore){
							if(main_type == 1400 && sub_type == 1403){
								score = parseFloat(score * ascore  * 2 / num / 100 / 2.0);
							}else if(main_type == 1400 && sub_type != 1428 && sub_type != 1438){
								score = parseFloat(score * ascore  * 2 / num / 100 / 2.0);
								// 所有句子都有分数，则总分在均分基础上加0.5分或者有句子为0分，但是80分以上超过一半，则总分加0.5分
								if(scoreNum == num || eightyNum * 2 >= num){
									score = score + 0.5;
								}
								if(score > 0 && score < 0.5){
									score = 0.5;
								}else{
									if(score > Math.round(score)){
										score = Math.round(score) + 0.5;
									}else if(score == Math.round(score)){
										score = Math.round(score);
									}else{
										if(score == Math.floor(score * 2) / 2){
											score = Math.floor(score * 2) / 2;
										}else{
											score = Math.round(score);
										}
									}
								}
							}else{
								if(main_type == 7200 || sub_type == 1428 || sub_type == 1438){
									score = (score / 100 * ascore).toFixed(1);
								}else{
									score = parseFloat((Math.floor(score * ascore / num / 100 + 0.5)) * 2 / 2.0);
								}
							}
						}
					}
					
					// 判断录音得分
					if(isNaN(score)){
						score = 0;
					}
					if(!score){
						score = 0;
					}
					
					// 江苏没有0.5分
					if (1403 == sub_type || 1503 == sub_type || 1603 == sub_type){
		            	score= Math.round(score);
		            }
					
					// 分数
		            score = score > ascore ? ascore : score;
				}
				
				return score;
			},
			/**
			 * 计算录音总得分
			 * @param	tid		试题id
			 */
			calculateVideoTotalScore : function(tid, ascore){
				// 主类型
				var main_type = $('.test_content[data-id="' + tid + '"]').attr('data-type');
				// 子类型
				var sub_type = $('.test_content[data-id="' + tid + '"]').attr('data-subtype');
				
				// 计算总分
				switch(main_type){
					// 朗读短文
					case 1400: 
						// 识别出来的句数
						var asrNum = 0;
						// 根据难易级别确定的识别分数线
						var levelScore = 65;
						// iW(完整性得分)
						var iW = 0;
						// iC(准确性得分)
						var iC = 0;
						// 句数
						var senNum = $('.test_content[data-id="'+tid+'"] .question_container .speak_sentence').length;
						// 零分句数
						var zeroNum = senNum;
						// 得分
						var sum = 0;
						// 不为空
    					if(videoResult != undefined && videoResult != null 
    							&& videoResult[tid] != undefined && videoResult[tid] != null){
    						// 计算分数
    						$.each(videoResult[tid], function(i, obj){
    							// 判断数组中各分数是否大于等于基准线
    							if (obj['result']['score'] >= levelScore) {
    								sum += practice.process.getReadVoiceScore(parseInt(obj['result']['score']));
    								asrNum += practice.process.getReadVoiceSenNumByScore(parseInt(obj['result']['score']));
    								zeroNum--;
    							}
    						});
    					}
						
						// 计算完整性
				        iW = asrNum * 1.0 / senNum;
				        iW = iW * 70 / 100;
				        if(iW >= 70){
				        	iW = 70;
				        }
				        
				        // 计算准确性
				        iC = sum * 1.0 / senNum;
				        iC = iC * 30 / 100;
				        if(iC >= 30){
				        	iC = 30;
				        }
				        
				        sum = (iW + iC);
				        if(sum >= 100){
				        	sum = 100;
				        }
				        
				        // 比较零分的句子百分比
			            if(sum > (1 - parseFloat(zeroNum * 1.0 / senNum)) * 100){
			            	sum = parseInt((1 - parseFloat(zeroNum * 1.0 / senNum)) * 100);
			            }
			            // 答案得分
			            var answer_score = parseFloat(Math.floor(sum / 100.0 * ascore) + parseInt(((sum / 100.0 * ascore) % 1) * 2 + 0.5) / 2.0);
						
			            // 江苏没有0.5分
			            if ('1403' == sub_type){
			            	answer_score= Math.round(answer_score);
			            }
			            
			            // 不能大于总分
			            if(answer_score > ascore){
			            	answer_score = ascore;
			            }
			            
			            return answer_score;
						
					// 情景对话
					case 1500: 
						var fScore_temp = 0;
						var fPercent = 0;
						
						var maxConf = 70;
						var minConf = 60;
						var midConf = 65;
						
						// 小题分数
						var fScore = ascore;
						// 答案得分
						var answer_score = 0;
						// 数量
						var question_num = $('.test_content[data-id="'+tid+'"] .test_ctrl[data-act-type="2"]').length;
						
						// 不为空
    					if(videoResult != undefined && videoResult != null 
    							&& videoResult[tid] != undefined && videoResult[tid] != null){
    						// 计算分数
    						$.each(videoResult[tid], function(i, obj){
    							// 温州有三档1.5分
    							if('1509' == sub_type){
    								if(obj['result']['score'] < minConf){
    									fPercent = 0;
    								}else if(minConf <= obj['result']['score'] && obj['result']['score'] < midConf){
    									fPercent = parseFloat(1/3.0);
    								}else if(midConf <= obj['result']['score'] && obj['result']['score'] < maxConf){
    									fPercent = parseFloat(2/3.0);
    								}else if(obj['result']['score'] >= maxConf){
    									fPercent = 1;
    								}
    								fScore_temp = Math.floor(fPercent * fScore) + parseInt(parseFloat(fPercent * fScore % 1) * 2 + 0.5) / 2.0;;
    							}else{
    								if(obj['result']['score'] < minConf){
    									fPercent = 0;
    								}else if(minConf <= obj['result']['score'] && obj['result']['score'] < maxConf){
    									fPercent = 0.5;
    								}else if(obj['result']['score'] >= maxConf) {
    									fPercent = 1;
    								}
    								
    								fScore_temp= Math.floor(fPercent * fScore) + parseInt(parseFloat(fPercent * fScore % 1) * 2 + 0.5) / 2.0;
    							}
    							
    							answer_score += fScore_temp;
    						});
    					}
						
						// 平均分数
						if(question_num > 0){
							answer_score = parseInt(parseFloat(answer_score / question_num) * 2) / 2.0;
						}
						
						// 江苏没有0.5分
						if ('1503' == sub_type) {
							answer_score= Math.round(answer_score);
						}
						
						// 不能大于总分
			            if(answer_score > ascore){
			            	answer_score = ascore;
			            }
						
						return answer_score;
					// 话题简述
					case 1600: 
						// 识别出来的句数
						var asrNum = 0;
						// 根据难易级别确定的识别分数线
						var levelScore = 60;
						// iW(完整性得分)
						var iW = 0;
						// iC(准确性得分)
						var iC = 0;
						// 句数
						var senNum = $('.test_content[data-id="'+tid+'"] .question_division_line .speak_sentence').length;
						// 得分
						var sum = 0;
						
						// 不为空
    					if(videoResult != undefined && videoResult != null 
    							&& videoResult[tid] != undefined && videoResult[tid] != null){
    						// 计算分数
    						$.each(videoResult[tid], function(i, obj){
    							if(obj['result']['score'] >= levelScore){
    								sum += practice.process.getTopicVoiceScore(obj['result']['score']);
    								asrNum += practice.process.getTopicVoiceSenNumByScore(obj['result']['score']);
    							}
    						});
    					}
						
					    // 计算完整性
				        iW = asrNum * 1.0 / senNum;
				        iW = iW * 70 / 100;
				        if(iW >= 70){
				        	iW = 70;
				        }
				        iC = sum * 1.0 / senNum;
				        iC = iC * 30 / 100;
				        if(iC >= 30){
				        	iC = 30;
				        }
				        sum = (iW + iC);
				        if(sum >= 100){
				        	sum = 100;
				        }
				        // 答案得分
				        var answer_score = parseFloat(Math.floor(sum / 100.0 * ascore) + parseInt(parseFloat(sum / 100.0 * ascore % 1) * 2 + 0.5) / 2.0);
				        
				        // 江苏没有0.5分
				        if('1603' == sub_type){
				        	answer_score= Math.round(answer_score);
				        }
						
				        // 不能大于总分
			            if(answer_score > ascore){
			            	answer_score = ascore;
			            }
				        
						return answer_score;
					default :
						return 0;
				}
			},
			/**
			 * 计算试题掌握情况
			 * @param	level		最后掌握情况
			 * @param	lastTime 	最近练习时间
			 * @param	ascore		试题总得分
			 * @param	score		本次试题得分
			 */
			calculateTestLevel : function(level, lastTime, ascore, score, curType){
				// 计算系数
				var decay = 0
				// 最近练习时间不为空
				if(lastTime == 0){
					decay = 0;
				}else{
					// 当前时间戳
					var nowTime = Date.parse(new Date());
					// 最近练习时间戳
					lastTime = new Date(lastTime.replace(/-/g, '/')).getTime();
					
					// 相差天数
					var diff = (nowTime - lastTime)/(60*60*24);
					
					// 天数大于一年
					if(diff > 365){
						decay = 1;
					}else{
						decay = 1 - (diff / 365.0).toFixed(2);
					}
				}
				
				// 总分
				if(ascore == 0){
					ascore = 1;
				}
				
				// 得分比率
				var rate = (score / ascore * 1.00).toFixed(2);
				
				// 如果试题练对，熟练度直接为100
				if(curType == 2){
					if((score/ascore)*100 >= 60){
						level = 100;
					}else{
						// 之前的熟练度取0.3*衰减，
						level = level * 0.3 * decay + rate * 100 * 0.7;
					}
				}else{
					if(ascore == score){
						level = 100;
					}else{
						// 之前的熟练度取0.3*衰减，
						level = level * 0.3 * decay + rate * 100 * 0.7;
					}	
				}
				
				// 熟练度大于100
				if(level > 100){
					level = 100;
				}
				
				return level.toFixed(0);
			},
			/**
			 * 计算知识点熟练度
			 * @param	level		最后掌握情况 
			 * @param	lastTime	最近练习时间
			 * @param	ascore		试题总得分  score: 本次试题得分
			 * @param	score		本次试题得分
			 */
			calculateKnowledgeLevel : function(level, lastTime, ascore, score){
				// 计算系数
				var decay = 0
				// 最近练习时间不为空
				if(lastTime == 0){
					decay = 0;
				}else{
					// 当前时间戳
					var nowTime = Date.parse(new Date());
					// 最近练习时间戳
					lastTime = new Date(lastTime.replace(/-/g, '/')).getTime();
					
					// 相差天数
					var diff = (nowTime - lastTime)/(60*60*24);
					
					// 天数大于一年
					if(diff > 365){
						decay = 1;
					}else{
						decay = 1 - (diff / 365.0).toFixed(2);
					}
				}
				
				// 总分
				if(ascore == 0){
					ascore = 1;
				}
				
				// 得分比率
				var rate = (score / ascore * 1.00).toFixed(2);
				// 之前的熟练度取0.3*衰减，
				level = level * 0.3 * decay + rate * 100 * 0.7;
				// 熟练度大于100
				if(level > 100){
					level = 100;
				}
				
				return level.toFixed(0);
			},
			/**
			 * 答案转换，字母转换成数字
			 */
			convertAnswer : function(str){
				return String.fromCharCode(String(str).charCodeAt() - 16);
			},
			/**
			 * 答案转换，数字转换成字母
			 */
			convertAnswerByNum : function(str){
				return String.fromCharCode(String(str).charCodeAt() + 16);
			},
			/**
			 * 提交作业
			 */
			submitHomework : function(answers, precord_id){
				// 是否口语判分、剩余免费练习次数，用于提交答案后作业信息和按钮的显示控制
				var judge_speaking = window.judge_speaking || false;
				//统计作业详情
		    	var homework = {
		    		'count' : 0, 'expect_time' : '','full_mark' : 0, 'detail' : new Array(),
		    		'total_score' : 0, 'precord_id' : precord_id, 'judge_speaking' : judge_speaking
		    	};
		    	
		    	// 特殊作业id
		    	var shids = [538777,538779,538782,538783,538784,538794,538802,538805,538806,538807,538875,538876,538877,538878,538879,538880,538881,
				    538882,538883,538884,538885,538886,538887,538888,538889,538890,538891,538892,538893,538894,538895,538896,538897,538898,538899,
				    538900,538901,538902,538903,538904,538905,538906,538907,538908,538909,538910,538911,538912,538913,538914,544241,
				    560248,560247,560246,560225,560224,560223,560222,560220,560217,560216];
		    	
		    	var count = 0;
		    	$('.test_sub_area').each(function(i, n){
		        	var score = 0;
		        	var ascore = 0;
		        	//统计每一大项的总分和得分
		        	homework['detail'][i] = new Object();
		        	homework['detail'][i]['sub_title'] = $(this).attr('data-title');
		    		test_content = $(this).find('.test_content');
		    		test_content.each(function(){
		    			var id = $(this).attr('data-id');	
		    			score = Math.formatFloat(score + parseFloat(answers[id]['score']));	
		    			ascore = Math.formatFloat(ascore + parseFloat(answers[id]['ascore']));
		    			count++;
		    		});
		    		//每一大项总分
		    		homework['detail'][i]['ascore'] = ascore;
		    		//每一大项实际得分
		    		if(typeof practice_id && $.inArray(parseInt(practice_id), shids) != -1){
		    			homework['detail'][i]['score'] = '--';
		    			//总得分
			    		homework['total_score'] = '--';
		    		}else{
		    			homework['detail'][i]['score'] = parseFloat(score) == 0 ? 0 : parseFloat(score);
		    			//总得分
			    		homework['total_score'] = Math.formatFloat(homework['total_score'] + parseFloat(score));
		    		}
		    		
		    		//题数
		    		homework['count'] = count;
		    		//满分
		    		homework['full_mark'] = Math.formatFloat(homework['full_mark'] + parseFloat(ascore));
		    		//预计用时
		    		homework['expect_time'] = Math.ceil((total_time)/60);
		    		
		    		// 正计时实际用时
		    		if(struct_type == 1 || struct_type == 2){
		    			homework['actual_time'] = Math.floor(time / 60);
		    			homework['actual_time_s'] = time % 60;
		    		// 倒计时实际用时
		    		}else{
		    			homework['actual_time'] = Math.floor((total_time - count_down_time)/60);
		    			homework['actual_time_s'] = (total_time - count_down_time)%60;
		    		}
				});
		    	
		    	//每一大项实际得分
	    		if(typeof practice_id && $.inArray(parseInt(practice_id), shids) > -1){
	    			//百分比
		    		homework['percent'] = '--';
	    		}else{
	    			//百分比
		    		homework['percent'] = Math.round(homework['total_score']/homework['full_mark']*100);
	    		}
		    	
		    	$('.H_submit_homework_cnt').html($('#submitHomework').template(homework));
		    	var height = $('.H_submit_homework_cnt').outerHeight();
		    	if(height < 580){
		    		$(".H_submit_homework_cnt").css({"height":height, "padding-top":(580-height)/2});
		    	}else{
		    		$(".H_submit_homework_cnt").css("padding","20px");
		    	}
		    	// 隐藏提交作业按钮
				var isSubmit = $('.p_paper_cnt').attr("data-submit");
				if(isSubmit){
					$('.submit_homework').hide();
					$('.results').removeClass('hide');
				}
				var endStatus = $('.p_paper_cnt').attr('data-end-status');
				if(endStatus == 4){
					if(2 == classType){
						$('.submit_homework.submit_teacher').html('补交给智慧老师');
					}else{
						$('.submit_homework.submit_teacher').html('补交给老师');
					}
				}
			},
			/**
			 * 提交答案检查口语情况
			 */
			submitAnswerCheck : function(){
				// 停止时间
				clearInterval(time_id);
				// 停止自动练习
				if(typeof self_practice_key != 'undefined'){
					clearInterval(self_practice_key);
				}
				// 存在音频试题
				if($('.test_content[data-kind="1"]').length || $('.test_content[data-kind="2"]').length){
					// 停止音频
					TSP.audio.player.stop();
					// 停止时间
					clearInterval(remainder_key);
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(tape_remainder_key);
					// 隐藏音频播放提示框
					$('.test_ctrl_info_area').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 播放按钮变字
					if(!is_primary){
						$('.btn_play').html('播放音频');
					}
					// 竞赛中心
					if(window.location.pathname == '/Competition/paper.html'){
						$('.btn_play').removeClass('start');
					}
				}
				
				// 存在录音时
				if($('.test_content[data-kind="2"]') != undefined && $('.test_content[data-kind="2"]').length > 0){
					// 音频识别成功标识
					var video_status = true;
					// 当前时间戳
					var cur_time = (new Date()).getTime();
					// 循环判断音频识别情况
					$.each(videoResult, function(i, objs){
						// 不为空
						if(objs != undefined && objs != null){
							$.each(objs, function(j, obj){
								if(obj['end_time'] == undefined){
									videoResult[i][j]['end_time'] = cur_time;
								}
								if(obj['result'] == undefined || obj['result']['count'] == undefined){
									video_status = false;
								}
							});
						}
					});
					
					// 存在在音频未识别
					if(!video_status){
						// 停止录音
						if(TSP.audio.recorder.inited){
							TSP.audio.recorder.stop();
						}
                        // 设置提交按钮不可用
    		    		$('.p_answerSubmit_btn').addClass('disabled');
                        // 设置所有答题按钮不可用
                    	$('.btn_play').addClass('disabled');
                    	// 设置所有选项不可用
		    	    	$('.p_tests_area input').attr('disabled', 'disabled');
		    	    	// 设置所有文本框不可用
		    	    	$('.p_tests_area textarea').attr('disabled', 'disabled');
		    	    	// 设置所有下拉框不可用
		    	    	$('.p_tests_area select').attr('disabled', 'disabled');
		    	    	// 添加标识，作业提交后处于等待状态
		    	    	$('.main_content_box').attr('data-wait-status', 1);
		    	    	
						MessageBox({
		                    content : '目前有音频未识别，请等待判分。',
		                    buttons : [
		                    {
		                        text : '等待判分',
		                        click : function(){
		                            $(this).dialog('close');
		                            return false;
		                        }
		                    }]
		                });
						// 两分钟强制提交答案
						setTimeout(submitAnswerFunc, 180000);
					}else{
						isZeroDialog();
					}
				}else{
					// 提交试卷
					if(is_primary){
                		TSP.practice.primary.question.submitAnswer();
                	}else{
                		TSP.practice.process.submitAnswer();
                	}
				}
			},
			/**
			 * 提交答案
			 */
			submitAnswer : function(){
				// 按钮
				LoadingMessageBox('数据计算中...');
				
				// 关闭录音检查定时器
				if(typeof record_check_interval != 'undefined' && !!record_check_interval){
					clearInterval(record_check_interval);
					record_check_interval = undefined;
				}
				
				// 不显示答题卡颜色
				if(type == 'homework' && isfree){
					$('.p_answer_list ul li').addClass('freeColor');
				}
				
				// 是否显示口语判分
				if(judge_speaking){
					// 竞赛中心
					if(window.location.pathname != '/Competition/paper.html'){
						/**
		    			 * 显示按钮
		    			 */
		    			// 听力按钮
		    			$('.test_content[data-kind="1"] .p_operationBtn_container').html($('#listentBtnAnswerTemp').template());
		    			// 口语按钮
		    			if($('.test_content[data-kind="2"]') != undefined && $('.test_content[data-kind="2"]').length > 0){
		    				// 删除选中样式
		    				$('.question_container .speak_sentence').removeClass('high_light_font');
		    				
		    				// 清空信息
		    				$('.test_content').find('.left_area').html('');
		    				
		    				// 循环给口语添加按钮
		    				$('.test_content[data-kind="2"]').each(function(i, obj){
		    					// 是否存在答案
		    					var answer_flag = $(this).find('.question_division_line').length > 0 ? true : false;
		    					// 是否存在音频
		    					var audio_flag = false;
		    					// 音频文件存在
		    					if($(this).find('.p_Laudio').length > 0 
		    							&& ($(this).find('.p_Laudio').attr('data-mp3') != undefined 
		    									&& $(this).find('.p_Laudio').attr('data-mp3') != ''
		    									&& $(this).find('.p_Laudio').attr('data-mp3') != 0)){
		    						audio_flag = true;
		    					}else{
		    						// 音频文件是否存在
		    						if($(this).find('.speak_sentence:not(.no_audio)') && $(this).find('.speak_sentence:not(.no_audio)').length){
		    							audio_flag = true;
		    						}
		    					}
		    					// 录音数量
		    					var video_flag = $(this).find('.question_li:not(.question_li_1520)').length > 0 ? false : true;
		    					
		    					// 按钮模型
		    					var btn_tmp = 'speackingBtn';
		    					
		    					// 原音按钮
		    					if(audio_flag && $(this).attr('data-subtype') != '1535'){
		    						btn_tmp = btn_tmp + 'Audio';
		    					}
		    					// 录音按钮
		    					if(video_flag){
		    						btn_tmp = btn_tmp + 'Video';
		    					}
		    					// 答案按钮
		    					if(answer_flag){
		    						btn_tmp = btn_tmp + 'Answer';
		    					}
		    					btn_tmp = btn_tmp + 'Temp';
		    					
		    					// 显示口语按钮
		    					$(this).find('.p_operationBtn_container').html($('#'+btn_tmp).template());
		    				});
		    				
		    				// 情景问答添加按钮 
		    				$('.test_content[data-kind="2"]').find('.question_li:not(.question_li_1520)').each(function(i, obj){
		    					if($(obj).html()){
		    						if($(obj).find('.btn_question_area').length){
			    						$(obj).find('.btn_question_area').html($('#speackingBtnQuestionTemp').template());
			    					}else{
			    						if($(obj).closest('.test_content').attr('data-subtype') == 1540 || $(obj).closest('.test_content').attr('data-subtype') == 1541){
			    							$(obj).append($('#noSpeackingBtnQuestionTemp').template());
			    						}else{
			    							$(obj).append($('#speackingBtnQuestionTemp').template());
			    						}
			    					}
		    					}
		    				});
		    				$('.test_content[data-kind="2"]').find('.sub_type_1520 .btn_question_area').remove();
		    				
		    				// 7100题型特殊处理
		    				$('.test_content[data-type="7100"]').each(function(i, obj){
		    					// 按钮区不唯一
		    					if($(obj).find('.p_operationBtn_container').length == 2){
		    						$(obj).find('.p_operationBtn_container:eq(1) .right_area').html('');
		    					}
		    					
		    					// 将第一部分原文移入题目内容中
		    					if($(obj).find('.question_division_line:eq(0)').length){
		    						// 第一部分
		    						var one_obj = $(obj).find('.question_container .question_content .question_p.china:eq(1)');
		    						// 存在
		    						if($(one_obj).next().hasClass('question_division_line')){
		    							$(one_obj).next().html($(obj).find('.question_division_line:eq(0)').html());
		    						}else{
		    							$(one_obj).after($(obj).find('.question_division_line:eq(0)'));
		    						}
		    					}
		    					
		    					// 删除旧问题
		    					$(obj).closest('.test_content').find('.question_container .question_content .question_content_str').remove();
		    					// 显示相应问题
		    					$(obj).closest('.test_content').find('.china_q').each(function(j, ebj){
		    						// 问题内容
		    						var qs_str = $(ebj).html();
		    						// 不为空
		    						if(qs_str != ''){
		    							// 是否存在
		        						if($(ebj).closest('.test_content').find('.question_container .question_content .question_content_str:eq("'+j+'")').length){
		        							qs_str = '<div class="dib question_content_str_num">' + (j + 1) + '.</div>'
		    									+ '<div class="dib question_content_str_info">' + qs_str + '</div>';
		        							// 显示问题
		        							$(obj).closest('.test_content').find('.question_container .question_content .question_content_str:eq("'+j+'")').html(qs_str);
		        						}else{
		        							// 内容
		            						qs_str = '<div class="dib dib-wrap question_content_str">' 
		        								+ '<div class="dib question_content_str_num">' + (j + 1) + '.</div>'
		        								+ '<div class="dib question_content_str_info">' + qs_str + '</div>' + '</div>';
		            						// 显示问题
		        							$(obj).closest('.test_content').find('.question_container .question_content').append(qs_str);
		        						}
		    						}
		    					});
		    					
		    					// 问题对象
		    					var tmp_obj = $(obj).find('.question_division_line:eq(1)');
		    					
		    					// 将第二部分小问移入题目内容中
		    					$(tmp_obj).find('.speak_sentence').each(function(j, ebj){
		    						if($(ebj).closest('.test_content').find('.question_content_str:eq("'+j+'") .question_content_str_info .question_division_line').length){
		    							$(ebj).closest('.test_content').find('.question_content_str:eq("'+j+'") .question_content_str_info .question_division_line').html($(ebj).html());
		    						}else{
		    							$(ebj).closest('.test_content').find('.question_content_str:eq("'+j+'") .question_content_str_info').append(ebj);
		    						}
		    					});
		    					
		    					// 按钮
		    					$(this).find('.question_content_str').each(function(j, ebj){
		    						if($(ebj).next().hasClass('.btn_info_area')){
		    							$(ebj).next().remove();
		    						}
		    						$(ebj).after($('#speackingBtnAudioVideoTemp').template());
		    					});
		    					
		    					// 删除对象
		    					$(tmp_obj).remove();
		    				});
		    			}
		    			// 笔试按钮
		    			$('.test_content[data-kind="3"] .p_operationBtn_container').html($('#writeBtnAnswerTemp').template());
					}
					
	    			// 练习类型
	    			var source = $('.p_paper_cnt').attr('data-source');
	    			// 是否已提交
	    			var isSubmit = !!parseInt($('.p_paper_cnt').attr('data-submit'));
	    			// 结构类型
	    			var struct_type = $('.p_paper_cnt').attr('data-struct-type');
	    			// 如果作业未提交，“查看答案”按钮去除
	    			if((source == 'hw' || type == 'homework') && !isSubmit){
	    				$('.test_content .p_operationBtn_container').find('.btn_answer').remove();
	    			}
				}
    			
    			// 试题答案对象
				var answers = new Object();
		    	// 总得分
		    	var practice_score = 0;
		    	// 总分
		    	var practice_total_score = 0;
		    	
    			if(!practice_data_save && $.isEmptyObject(practice_data)){
			    	$('.sub_test_area').each(function(r, s){
			    		if(is_primary){
			    			// 试题分数
				    		var arr_score = $(this).closest('.test_sub_area').find('.sub_info').attr('data-score').split('|');
			    		}else{
			    			// 试题分数
				    		var arr_score = $(this).find('.sub_info').attr('data-score').split('|');
			    		}
			    		// 删除最后的空白
			    		arr_score.splice(arr_score.length - 1, 1);
			    		
			    		// 记录问题数
			    		var question_num = 0;
			    		
			    		// 试题答案正误
			    		$(this).find('.test_content').each(function(i, n){
				    		// 试题序号
				    		var id = $(this).attr('data-id');
				    		// 主类型
				    		var main_type = $(this).attr('data-type');
				    		// 子类型
				    		var sub_type = $(this).attr('data-subtype');
				    		// 试题熟练度
				    		var test_level = $(this).attr('data-test-level');
				    		// 最近练习时间
				    		var last_time = $(this).attr('data-last-time');
				    		// 总分
				    		var ascore = 0;
				    		
				    		// 各试题
				    		answers[id] = {'id' : id, 'qstype' : main_type, 'score' : 0, 'answer' : '', 'ascore' : 0, 
				    				'qsnum' : $(this).attr('data-count'), 'item_order' : 0, 'detail' : new Array(), 
				    				'old_level' : test_level, 'new_level' : 0};
				    		
				    		// 循环各小题
				    		$(this).find('.question_container').each(function(j, m){
				    			// 每问加一
				    			question_num++;
				    			// 小题得分
								var small_test_score = question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1]);
								// 计算总分
								ascore = Math.formatFloat(ascore + small_test_score);
				    			// 小题得分
				    			var score = 0;
				    			// 正确答案
				    			var right_answer = $(this).find('.question_content .analysis .right_answer_class').attr('data-right-answer');
				    			// 用户答案
				    			var user_answer = null;
				    			
				    			// 小题序号
				    			var qid = $(this).attr('data-qid');
				    			// 试题类型
				    			var test_mold = $(this).find('.question_content').attr('data-test-mold');
				    			
				    			// 单选框(复选框)形式、子类型不为北师大题型(北师大题型1为填空题)
					    		if(test_mold == 1 && sub_type != 1621 && sub_type != 1631 && sub_type != 1626 && sub_type != 1321 && sub_type != 1323 && sub_type != 1324 && sub_type != 1326 && $(m).find('input[type=radio]').length > 0){
				    				// 不是第一题
				        			if(j > 0){
				        				// 答案
				        				answers[id]['answer'] = answers[id]['answer'] + '|';
				        			}
				    				// 用户答案 (未做的选择答案为空字符串)
				    				user_answer = $(this).find('.question_content input:checked').val();
				    				user_answer = user_answer == undefined ? '' : user_answer;

				    				// 转换用户答案为数字
				    				if(user_answer != '' && user_answer.charCodeAt() > 64 && user_answer.charCodeAt() < 106){
				    					user_answer = practice.process.convertAnswer(user_answer);
				    				}
				    				// 转换正确答案为数字
				    				if(right_answer != '' && right_answer.charCodeAt() > 64 && right_answer.charCodeAt() < 106){
				    					right_answer = practice.process.convertAnswer(right_answer);
				    				}
				    				// 答案是否正确
				        			if(user_answer == right_answer){
				        				score = small_test_score;
				        				// 是否显示口语判分
			    						if(judge_speaking){
					        				// 用户答案变色
					        				$(this).find('.question_content input:checked').closest('label').addClass('radio_right_answer');
					        				// 答题卡颜色变化
					        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
			    						}
				        			}else{
				        				// 小题得分
				        				score = small_test_score;
				        				// 是否显示口语判分
			    						if(judge_speaking){
					        				// 用户答案变色
					        				$(this).find('.question_content input:checked').closest('label').addClass('radio_right_answer');
					        				// 答题卡颜色变化
					        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
			    						}
				        			}
				    				
				    			// 填空形式、北师大题型1为填空题
					    		}else if(((test_mold == 2 && main_type != 2700) || (test_mold == 1 && (sub_type == 1621 || sub_type == 1631 || sub_type == 1626 || sub_type == 1321 || sub_type == 1323 || sub_type == 1324 || sub_type == 1326))) && $(m).find('input[type=text]').length > 0){
				    				// 用户答案数组
				    				user_answer = new Array();
				    				// 用户用于比较的答案数组
				    				user_cmp_answer = new Array();
				    				// 正则表达式
				        			var reg = new RegExp("[.,;,:,\,，。\’\'\"\?][]*","g");
				    				// 首字母标识
				    				var initial_flag = false;
				    				
				    				// 用户答案 (未做的答案为空字符串)
				    				$(this).find('.question_content input[type="text"]').each(function(k, obj){
				    					// 用户答案
				    					var tmp_answer = $.trim($(this).val());
				    					tmp_answer = tmp_answer == undefined ? '' : tmp_answer;
				    					// 用户真实答案
				    					user_answer.push(tmp_answer);
				    					// 替换
				    					tmp_answer = tmp_answer.replace(/[.,;,:,\,，\?]/g, ' ');
				    					tmp_answer = $.trim(tmp_answer);
				            			tmp_answer = tmp_answer.replace(reg, '');
				    	    			// 用于比较的答案
					    				user_cmp_answer.push(tmp_answer);
				    	    			
				    	    			//	判断是否为首字母填空
				    	    			var prevNode = this.previousSibling;
				    	    			if(prevNode != null && prevNode.nodeType == 3 && $.trim(prevNode.nodeValue.substr(-1)) != '' && prevNode.length == 1){
				    	    				initial_flag = true;
				    	    			}
				    				});
				    				// 拓展答案(笔试用)
				        			var ext_answer = $(this).find('.question_content .analysis .right_answer_class').attr('data-ext-answer');
				    				
				    				// 正确答案数组
				    				var right_answers = ext_answer == undefined ? new Array() : ext_answer.split('#');
				    				if(right_answers.length > 0){
				    					right_answers[right_answers.length - 1] = right_answer.toLowerCase();
				    				}else{
				    					right_answers[0] = right_answer;
				    				}
				    				
				    				// 答案是否正确标识
				    				var flag_answer = false;
				    				// 答对单词个数
				    				var right_word_num = 0;
				    				// 答案单词总个数
				    				var answer_word_num = 0;
				    				
				    				// 正确答案判断用户答案是否正确
				    				for(var x in user_cmp_answer){
				    					// 用户答案不为空
				    					if(user_cmp_answer[x] == ''){
				    						// 正确答案数组
				    						var right_answer_arr = right_answers[0].split('*');
				        					// 正确答案替换字符串
				        					var right_answer_str = $.trim(right_answer_arr[x]).replace(reg, '');

				        					// 统计答案中的单词个数
				        					right_answer_str = right_answer_str.replace(/\r\n/g, '');
				        					right_answer_str = right_answer_str.replace(/\n/g, '');
				        					right_answer_str = right_answer_str.replace(/\s+/g, '*');
				        					right_answer_str = right_answer_str.split('*');

				        					answer_word_num += right_answer_str.length;
				    					} else {
				    						var right_word_num1 = 0;
				    						var answer_word_num1 = 0;

				    						// 比较正确答案
					    					for(var s in right_answers){

					    						var user_cmp_answer_r = user_cmp_answer[x];

					    						// 正确答案数组
					    						var right_answer_arr = right_answers[s].split('*');
					        					// 正确答案替换字符串
					        					var right_answer_str = $.trim(right_answer_arr[x]).replace(/[.,;,:,\,，\?]/g, ' ');
					        					right_answer_str = $.trim(right_answer_str);
					        					right_answer_str = right_answer_str.replace(reg, '');

					        					// 判断答案是否时中文
					        					// var isCh_flag = false;

					        					// 取出单个单词进行比较
				        						right_answer_str = right_answer_str.replace(/\r\n/g, '');
				        						right_answer_str = right_answer_str.replace(/\n/g, '');
				        						right_answer_str = right_answer_str.replace(/\s+/g, '*');

				        						// var chReg = new RegExp("[\\u4E00-\\u9FFF]+","g");
												// if (chReg.test(right_answer_str)) {
												// 	// 答案为中文
												// 	isCh_flag = true;
												// }
				        						right_answer_str = right_answer_str.split('*');


				        						user_cmp_answer_r = user_cmp_answer_r.replace(/\r\n/g, '');
				        						user_cmp_answer_r = user_cmp_answer_r.replace(/\n/g, '');
				        						// if (isCh_flag) {
				        						// 	user_cmp_answer_r = user_cmp_answer_r.replace(/\s+/g, '');
				        						// }
				        						user_cmp_answer_r = user_cmp_answer_r.replace(/\s+/g, '*');
				        						user_cmp_answer_r = user_cmp_answer_r.split('*');

				        						// 把单词都转为小写
				        						for (var y = right_answer_str.length - 1; y >= 0; y--) {
				        							right_answer_str[y] = right_answer_str[y].toLowerCase();
				        						}

				        						for (var y = user_cmp_answer_r.length - 1; y >= 0; y--) {
				        							user_cmp_answer_r[y] = user_cmp_answer_r[y].toLowerCase();
				        						}

				        						var right_word_num2 = 0;
				    							var answer_word_num2 = right_answer_str.length;

				        						if (user_cmp_answer_r.length > right_answer_str.length) {
			        								for (var jx = 0; jx < user_cmp_answer_r.length; jx++) {
			        									// 去除用户答案首个单词首字母
			        									if (jx == 0 && initial_flag) {
			        										if (right_answer_str[jx] == user_cmp_answer_r[jx].substr(1) || right_answer_str[jx].substr(1) == user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
			        											right_word_num2 += 1;
			        										}
			        									} else if ($.inArray(user_cmp_answer_r[jx], right_answer_str) != -1) {
				        									right_word_num2 += 1;
				        								}
				        							}

				        							if (right_word_num2 > answer_word_num2 / 2) {
				        								right_word_num2 = Math.ceil(answer_word_num2 / 2);
				        								if (right_word_num2 == answer_word_num2 == 1) {
				        									right_word_num2 = 0.5;
				        								}
				        							}
				        						} else if (user_cmp_answer_r.length == right_answer_str.length) {

				        							var word_flag = true;

				        							for (var jx = 0; jx < right_answer_str.length; jx++) {
				        								// 去除用户答案首个单词首字母
				        								if (jx == 0 && initial_flag) {
				        									if (right_answer_str[jx] != user_cmp_answer_r[jx].substr(1) && right_answer_str[jx].substr(1) != user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
				        										word_flag = false;
				        									}
				        								} else if (user_cmp_answer_r[jx] != right_answer_str[jx]) {
				        									word_flag = false;
				        								}
				        							}

				        							if (word_flag) {
				        								right_word_num2 = answer_word_num2;
				        							} else {
				        								for (var jx = 0; jx < user_cmp_answer_r.length; jx++) {
				        									// 去除用户答案首个单词首字母
				        									if (jx == 0 && initial_flag) {
				        										if (right_answer_str[jx] == user_cmp_answer_r[jx].substr(1) || right_answer_str[jx].substr(1) == user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
				        											right_word_num2 += 1;
				        										}
				        									} else if ($.inArray(user_cmp_answer_r[jx], right_answer_str) != -1) {
					        									right_word_num2 += 1;
					        								}
					        							}

					        							if (right_word_num2 > answer_word_num2 / 2) {
					        								right_word_num2 = Math.ceil(answer_word_num2 / 2);
					        							}
				        							}
				        						} else {
				        							for (var jx = 0; jx < user_cmp_answer_r.length; jx++) {
				        								// 去除用户答案首个单词首字母
			        									if (jx == 0 && initial_flag) {
			        										if (right_answer_str[jx] == user_cmp_answer_r[jx].substr(1) || right_answer_str[jx].substr(1) == user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
			        											right_word_num2 += 1;
			        										}
			        									} else if ($.inArray(user_cmp_answer_r[jx], right_answer_str) != -1) {
				        									right_word_num2 += 1;
				        								}
				        							}

				        							if (right_word_num2 > answer_word_num2 / 2) {
				        								right_word_num2 = Math.ceil(answer_word_num2 / 2);
				        							}
				        						}

				        						// 第一次循环, 直接取当前答案单词个数和答对个数
				        						if (answer_word_num1 == 0) {
				        							right_word_num1 = right_word_num2;
				        							answer_word_num1 = answer_word_num2;
				        						} else {
				        						// 后面每次循环，取 答对个数/答案个数 大的值
				        							if (answer_word_num2 != 0 && right_word_num2/answer_word_num2 > right_word_num1/answer_word_num1) {
				        								right_word_num1 = right_word_num2;
				        								answer_word_num1 = answer_word_num2;
				        							}
				        						}
					        				}

					        				right_word_num += right_word_num1;
					        				answer_word_num += answer_word_num1;
				    					}
				    				}

				    				// 判断得分
				    				if (right_word_num >= answer_word_num) {
				    					score = small_test_score;
				    					flag_answer = true;
				    				} else if (right_word_num >= answer_word_num / 2) {
				    					score = small_test_score;
				    					flag_answer = true;
				    				} else {
				    					score = small_test_score;
				    					flag_answer = true;
				    				}
				    				
				    				// 答案是否正确
				        			if(flag_answer){
				        				// 是否显示口语判分
			    						if(judge_speaking){
					        				// 用户答案变色
					        				$(this).find('.question_content input[type="text"]').addClass('right_answer');
					        				// 答题卡颜色变化
					        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
					        				// 正确答案
					        				if(type != 'homework'){
					        					$(this).closest('.question_content').find('span.right_answer').remove();
					        					$(this).find('.question_content input[type="text"]').each(function(ix, obj){
					        						// $(this).closest('.question_content').find('span.right_answer').remove();
						        					// 比较正确答案
						        					for(var sx in right_answers){
						        						// 正确答案数组
						        						var right_answer_arr = right_answers[sx].split('*');
						        						if(right_answer_arr != ''){
						        							$(this).after('<span class="right_answer">('+right_answer_arr[ix]+')</span>');
						        						}
						        					}
						        				});
					        				}
			    						}
				        			}else{
				        				// 是否显示口语判分
			    						if(judge_speaking){
					        				// 用户答案变色
					        				$(this).find('.question_content input[type="text"]').addClass('wrong_answer');
					        				// 正确答案
					        				if(type != 'homework'){
					        					$(this).closest('.question_content').find('span.right_answer').remove();
					        					$(this).find('.question_content input[type="text"]').each(function(ix, obj){
					        						// $(this).closest('.question_content').find('span.right_answer').remove();
						        					// 比较正确答案
						        					for(var sx in right_answers){
						        						// 正确答案数组
						        						var right_answer_arr = right_answers[sx].split('*');
						        						if(right_answer_arr != ''){
						        							$(this).after('<span class="right_answer">('+right_answer_arr[ix]+')</span>');
						        						}
						        					}
						        				});
					        				}
					        				// 答题卡颜色变化
					        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_wrong_class');
			    						}
				        			}
				    				
				        			// 用户答案重组
				        			user_answer = user_answer.join('*') + '#';
				        			
				    			// 下拉列表形式
				    			}else if(test_mold == 5){
				    				// 不是第一题
				        			if(j > 0){
				        				// 答案
				        				answers[id]['answer'] = answers[id]['answer'] + '|';
				        			}
				    				// 用户答案 (未做的选择答案为空字符串)
				    				user_answer = $(this).find('.question_content select').val();
				    				user_answer = user_answer == -1 ? '' : user_answer;
				    				
				    				// 答案是否正确
				        			if(user_answer == right_answer){
				        				score = small_test_score;
				        				// 用户答案变色
	//			        				$(this).find('.question_content select').closest('label').addClass('radio_right_answer');
				        				// 是否显示口语判分
			    						if(judge_speaking){
					        				$(this).find('.question_content select').addClass('select_right');
					        				// 答题卡颜色变化
					        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
			    						}
				        			}else{
				        				score = small_test_score;
				        				// 用户答案变色
	//			        				$(this).find('.question_content select').closest('label').addClass('radio_right_answer');
				        				// 是否显示口语判分
			    						if(judge_speaking){
					        				$(this).find('.question_content select').addClass('select_right');
					        				// 答题卡颜色变化
					        				$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
			    						}
				        			}
				    				
				        			// 转换正确答案
				    				if(user_answer != '' && user_answer.charCodeAt()>64 && user_answer.charCodeAt()<106){
				    					user_answer = practice.process.convertAnswer(user_answer);	
				    				}
				        			
				    			// 录音形式
				    			}else if(test_mold == 6){
				    				// 总分设零、北师大不重置
				    				if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
				    					ascore = 0;
				    				}
				    				
				    				// 试题得分
			    					score = 0;
			    					
			    					// 音频问题数量
		    						var video_question_num = $(this).closest('.test_content').find('.test_ctrl[data-act-type="2"]').length;
			    					
		    						// 问题数
	    							if(video_question_num > 1){
			    						// 计算总分
					    				for(var r = 0; r < video_question_num; r++){
					    					ascore += r < arr_score.length ? parseFloat(arr_score[r]) : parseFloat(arr_score[0]);
					    				}
			    					}else if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
			    						ascore += parseFloat(arr_score[0]);
			    					}
				    				
				    				// 用户答案
	    							user_answer = '';
	    							
	    							// 不为空
			    					if(videoResult != undefined && videoResult != null 
			    							&& videoResult[id] != undefined && videoResult[id] != null){
			    						// mp3路径
			    						var mp3_path = '';
					    				// 多次录音的试题
					    				if(video_question_num > 1 || sub_type == 1435 || sub_type == 1627){
					    					// 获取问题得分
			    							var question_score = 0;
			    							
			    							// 记录问题序号
			    							var quesiton_index = 0;
			    							
			    							// 保存指针
			    							var video_that = this;
			    							
			    							// 试题得分 
			    							score = practice.process.calculateVideoTotalScoreForNew(id, main_type, sub_type, 
			    									$('.test_content[data-id="' + id + '"]').closest('.sub_test_area').find('.sub_info').attr('data-score'), 
			    									video_question_num, $('.test_content[data-id="' + id + '"]').find('.question_content .speak_sentence').length, true);
					    					
					    					// 获取得分平均分
					    					$.each(videoResult[id], function(tid, questionsRes){
					    						// 路径
					    						var mp3_path_str = '';
					    						// 得分
					    						var user_answer_str = 0;
					    						if(questionsRes['result'] && questionsRes['result']['mp3']){
					    							mp3_path_str = questionsRes['result']['mp3'];
					    						}
				    							// 循环录音结果
					    						if(questionsRes['result'] && questionsRes['result']['text']){
					    							// 用户答案
					    							user_answer_str = questionsRes['result']['score'];
				    							}
					    						
					    						// 路径
					    						mp3_path += mp3_path_str + ',';
					    						// 用户答案
					    						user_answer = user_answer + user_answer_str + ',';
					    						
				    							
					    						// 是否显示口语判分
					    						if(judge_speaking){
					    							// 小问分数
					    							var question_ascore = quesiton_index > arr_score.length ? arr_score[0] : arr_score[quesiton_index];
					    							
					    							if(question_ascore == undefined){
					    								question_ascore = arr_score[0];
					    							}
					    							// 设置试题得分
							    					$(video_that).closest('.test_content').find('.question_li:eq("'+ quesiton_index +'")').not('.question_li_1520').find('.speak_sentence.question').append('&nbsp;&nbsp;(' + question_ascore + ')');
					    							
					    							// 设置试题得分$(video_that).closest('.test_content').find('.question_li:eq("'+ quesiton_index +'")').find('.speak_sentence.answer').append('&nbsp;&nbsp;(' + questionsRes['score'] + ')');
							    					if(questionsRes['result'] == undefined || questionsRes['result']['score'] == undefined){
							    						$(video_that).closest('.test_content').find('.question_li:eq("'+ quesiton_index +'")').find('.speak_sentence.answer').append('&nbsp;&nbsp;(' + 0 + ')');
							    					}else{
							    						$(video_that).closest('.test_content').find('.question_li:eq("'+ quesiton_index +'")').find('.speak_sentence.answer').append('&nbsp;&nbsp;(' + questionsRes['result']['score'] + ')');
							    					}
					    							// 记录问题序号
					    						}
				    							quesiton_index++;
					    					});
					    					
					    				}else{
					    					// 试题总分
					    					var tmp_score = question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1]);
				    						// 获取得分平均分
					    					$.each(videoResult[id], function(tid, questionsRes){
					    						// 路径
					    						var mp3_path_str = '';
					    						// 得分
					    						var user_answer_str = 0;
					    						if(questionsRes['result'] && questionsRes['result']['mp3']){
					    							mp3_path_str = questionsRes['result']['mp3'];
					    						}
				    							// 循环录音结果
					    						if(questionsRes['result'] && questionsRes['result']['text']){
					    							// 用户答案
					    							user_answer_str = questionsRes['result']['score'];
				    							}
					    						
					    						// 路径
					    						mp3_path += mp3_path_str + ',';
					    						// 用户答案
					    						user_answer = user_answer + user_answer_str + ',';
					    					});
					    					
					    					score = practice.process.calculateVideoTotalScoreForNew(id, main_type, sub_type, 
			    									$('.test_content[data-id="' + id + '"]').closest('.sub_test_area').find('.sub_info').attr('data-score'), 
			    									video_question_num, $('.test_content[data-id="' + id + '"]').find('.question_content .speak_sentence').length, true);
					    				}
					    				
					    				// 保存答案
										answers[id]['Mp3'] = mp3_path;
										
										if(sub_type == 1626){
				    						// 如果得分不为0，答题卡对应题号标绿
					    					if(tmp_score > 0 && (score / tmp_score) >= 0.6){
					    						$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
					    					}else{
					    						$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_wrong_class');
					    					}
				    					}
			    					}
			    					score=ascore
			    					if(score == null || score == ''){
			    						// 试题得分
				    					score = 0;
			    					}
			    					
			    					// 是否显示口语判分
		    						if(judge_speaking && sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
				    					// 设置试题得分
				    					$(this).closest('.test_content').find('.left_area').html('总分:'+ascore + ',得分:'+ score);
		    						}
			    					
			    					// 设置问题数为1，不需要存放各问题的记录、北师大题型
			    					if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
			    						answers[id]['qsnum'] = 1;
			    					}
			    					
			    					if(sub_type != 1626){
			    						// 如果得分不为0，答题卡对应题号标绿
				    					if(ascore > 0 && (score / ascore) >= 0.6){
				    						$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_right_class');
				    					}else{
				    						$('.p_answer_list ul li[data-index='+qid+']').addClass('answer_list_wrong_class');
				    					}
			    					}
									
				    			// 作文
				    			}else if(test_mold == undefined && main_type == 2700){
				    				// 用户答案 (未做的选择答案为空字符串)
				    				user_answer = $(this).find('textarea').val();
				    				// 答案
				    				user_answer = user_answer == undefined ? '' : user_answer;
				    			}
				    			
				    			// 保存答案
								answers[id]['detail'].push({'item_order' : (j + 1), 'score' : score, 'answer' : user_answer, 'ascore' : question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1])});
				    			// 总得分
								answers[id]['score'] = parseFloat(answers[id]['score']) + score;
				    			// 答案、北师大题型特殊处理
								if(sub_type == 1621 || sub_type == 1626 || sub_type == 1631){
									answers[id]['answer'] = answers[id]['answer'] + user_answer + '|';
									// 为口语
									if(test_mold == 6){
										// 总分
										ascore = 0;
										// 得分
										score = 0;
										// 循环统计
										$.each(answers[id]['detail'], function(kk, oo){
											// 总分
											ascore += oo['ascore'];
											// 得分
											score += oo['score'];
										});
				    					$(this).closest('.test_content').find('.left_area').html('总分:'+ascore + ',得分:'+ score);
									}
								// 下拉列表+填空形式题目
								}else if(sub_type == 3305 && test_mold == 2){
									answers[id]['answer'] = answers[id]['answer']+ '|' + user_answer;
								}else{
									answers[id]['answer'] = answers[id]['answer'] + user_answer;
								}
								
				    		});
				    		
				    		// 各试题总分
				    		answers[id]['ascore'] = ascore;
				    		// 练习总分
							practice_total_score = Math.formatFloat(practice_total_score + ascore);
				    		// 计算试题熟练度
							// 获取当前题的类型
							var curType = $('.test_content[data-id="'+answers[id]['id']+'"]').attr('data-kind'); 
				    		answers[id]['new_level'] = practice.process.calculateTestLevel(answers[id]['old_level'], last_time, ascore, answers[id]['score'], curType);
				    		
				    		// 是否显示口语判分
    						if(judge_speaking){
					    		// 试题熟练度
					    		$('.test_content[data-id="'+id+'"] .left_area').html('熟练度:' + answers[id]['old_level']+'%->'
					    				+ answers[id]['new_level'] + '%'+'&nbsp;' + $('.test_content[data-id="'+id+'"] .left_area').html());
					    		
					    		// 计算知识点熟练度
								$(this).find('.p_knowledge_points .knowledge_point').each(function(w, obj){
									// 知识点熟练度
									var klevel = practice.process.calculateKnowledgeLevel($(this).attr('data-klevel'), $(this).attr('data-ktime'), ascore, answers[id]['score']);
									// 熟练度变化
									$(this).append('('+$(this).attr('data-klevel')+'%->'+klevel+'%)');
								});
    						}
				    		
				    		practice_score = Math.formatFloat(practice_score + parseFloat(answers[id]['score']));
				    	});
			    	});
    			}else{
			    	// 试题答案对象
    				answers = practice_data.test_record;
    				// 总得分
    				practice_score = practice_data.practice_score;
    				// 总分
    				practice_total_score = practice_data.practice_total_score;
    			}
		    	
		    	// 7100特殊处理
		    	$('.test_content[data-subtype="7100"] .question_container .question_content .btn_info_area .left_area').html('');
		    	
		    	// 完成时间
	    		var duration_time = '';
	    		if($('#test-mode[data-mode="free"]').is(':checked')){
		    		duration_time = time;
		    	}else{
		    		// 自主出题的考试模式采用正计时
		    		if(source == 'hw' && (struct_type == 1 || struct_type == 2)){
		    			duration_time = time;
		    		}else{
		    			duration_time = total_time - count_down_time;
		    		}
		    	}
		    	// 后台数据存储
	    		if(type == 'competition'){
	    			// 设置提交按钮不可用
		    		$('.p_answerSubmit_btn').addClass('disabled');
	    		}
	    		// 页面统计信息
		    	var record = {'time' : Math.ceil((duration_time)/60), 'practice_score' : Math.formatFloat(practice_score), 'practice_total_score' : practice_total_score.toString().length > 5 ? Math.formatFloat(practice_total_score) : practice_total_score};
		    	record.percent = Math.round(record.practice_score/record.practice_total_score * 100);
		    	if(!practice_data_save && !practice_data.practice_record){
			    	// 练习记录
			    	var practice_record = {'version_id' : version_id, 'grade_id' : grade_id, 'unit' : unit_ids, 
			    			'practice_type' : type, 'practice_id' : practice_id, 'duration_time' : duration_time, 
			    			'score' : practice_score, 'ascore' : practice_total_score.toString().length > 5 ? Math.formatFloat(practice_total_score) : practice_total_score, 'config' : (JSON.stringify(config) == '{}' ? '' : JSON.stringify(config))};
			    	// 参数
			    	var params = {'test_record' : answers, 'practice_record' : practice_record};
	    		}else{
	    			var params = {
	    				'test_record': practice_data.test_record,
	    				'practice_record': practice_data.practice_record
	    			};
	    		}
		    	$.ajax({
					url : TinSoConfig.student + '/Practice/submitAnwser.html',
					data : params,
					type : 'POST',
					global : false,
					success : function(data){
						LoadingMessageBox('close');
			    		if(data.status && data.info.flag === true){
			    			if(type == 'competition'){
			    				// 页面统计信息
						    	var params = {prid : data.info.practice_record_id, 'duration_time' : duration_time, 
						    			'score' : practice_score, 'score_id' : score_id, 'paper_id' : paper_id};
					    		$.post(TinSoConfig.student + '/Competition/submitCompetitionPaper.html', params, function(data){
					    			LoadingMessageBox('close');
					    			if(data.status){
										//让离开页面的事件不触发
										LoadingMessageBox('记录保存成功！即将跳转！');
										setTimeout(function(){
												window.onbeforeunload = function(){};
												window.location.href = TinSoConfig.student + '/Competition/myCompetition.html';
											}, 2000);
					    			}else{
					    				var msg = data.info ? data.info : '保存记录失败，请重试！';
					    				
					    				MessageBox({
											content : msg,
											buttons : [{
												text : '我知道了',
												click : function(){
													$(this).dialog('close');
												}
											}]
										});
					    			}
					    		});
				    		}else{
				    			// 隐藏按钮区域
				    			$('.p_operationBtn_container').show();
				    			// 时间显示
				    			TSP.practice.testTime.setPracticeTime(duration_time - 1);
				    			// 页面模式切换
				    	    	$('.p_tests_area').attr('data-page','result');
				    	    	// 设置所有选项不可用
				    	    	$('.p_tests_area input').attr('disabled', 'disabled');
				    	    	// 设置所有文本框不可用
				    	    	$('.p_tests_area textarea').attr('disabled', 'disabled');
				    	    	// 设置所有下拉框不可用
				    	    	$('.p_tests_area select').attr('disabled', 'disabled');
				    	    	// 设置提交按钮不可用
					    		$('.p_answerSubmit_btn').addClass('disabled');
					    		// 展开tips
				    	    	if($('.click_to_slide').hasClass('slideToDown')){
				    	    		$('.click_to_slide').click();
								}
				    	    	// 滚动到顶部
				    	    	$('html, body').stop().animate({scrollTop : '0px'}, 0);

				    	    	// 提交记录
				    	    	TSP.practice.is_submit = true;
				    	    	if(type == 'homework'){
					    	    	// 提示框数据
						    	    var paper_data = new Array();
									paper_data['title'] = $('.p_paper_title').text();
									paper_data['num'] = $('.p_answer_list li:last').attr("data-index");
									paper_data['score'] = $('.p_paper_cnt').attr("data-tatol-score");
									paper_data['time'] = $('.p_paper_cnt').attr("data-need-time"); 
									paper_data['random'] = Math.floor(Math.random() * 3);
									if(isfree && !ispractice){
										paper_data['stu_score'] = practice_record.score + '';
										paper_data['percent'] = Math.round(paper_data['stu_score']/paper_data['score'] *100);
									}
				    	    	}
				    			if(judge_speaking){
					    	    	// 默认选中第一题
					    			$('.question_content:first').click();
					    			if((type == 'homework' && (!isfree || (isfree && !ispractice))) || (type != 'homework')){
						    			// 结果
						    			$('.p_paperInfo_box').show();
						    			$('.slideToUp').show();
						    	    	$('.p_paper_info.p_paper_nature').html($('#resultInfoTemp').template(record));
						    	    	// “提交答案”按钮变成“再练一次”
						    	    	$('.p_answerSubmit_btn').text('再次练习').toggleClass('p_answerSubmit_btn p_practiceAgain_btn');
						    	    	// 答题卡正确标识提示
							    	    if($('.answerSheet_tf_tips').length == 0 && !is_primary){
						    	    		$('.p_answer_list').after('<div class="answerSheet_tf_tips">注：答题卡题号颜色，红色为错误，绿色为正确</div>');
						    	    		TSP.practice.answerSheet.setAnswerSheetHeight();
						    	    	}
					    			}
						    	    MessageBox({
										content : '记录保存成功',
										buttons : [{
											text : '我知道了',
											click : function(){
												isSubmitAAA = true;
												$(this).dialog('close');
											}
										}],
										close: function() {
											//如果是作业
											if(type == 'homework'){
												if(isfree){
													$('.freeUser_tips_cnt').append($('#freeUserTips').template(paper_data));
													$('.freeUser_tips_cnt').dialog({
														width: 620,
														hide : true,
														modal : true,
														resizable : false,
														dialogClass : 'small-dialog green-dialog',
														buttons : [{
															text : '以后再说',
															click : function(){
																window.onbeforeunload = undefined;
																window.location.href = TinSoConfig.student + '/Homework/lists.html';
															}
														},{
															text : '通知家长自愿升级资源',
															click : function(){
																window.onbeforeunload = undefined;
																// 购买链接
																var url = $('.notice_msg_err a.trail_confirm').attr('href');
							                                	if (!url || url == 'undefined') {
							                                		url = TinSoConfig.store + '/Course/derictBuyCourse.html';
							                                	}
							                                	
							                                	window.open(url);  
															}
														}]
													}).show();
													return;
												}
												
												$('.p_paper_cnt,.p_answerSheet_cnt').addClass('hide');
												$('.H_submit_homework_cnt').show();
												TSP.practice.process.submitHomework(answers, data.info.practice_record_id);
											}
										}
									});
				    			}else{
				    				MessageBox({
										content : '记录保存成功',
										buttons : [{
											text : '我知道了',
											click : function(){
												isSubmitAAA = true;
												$(this).dialog('close');
											}
										}],
										close: function() {
											//如果是作业
											if(type == 'homework'){
												if(isfree){
													$('.freeUser_tips_cnt').append($('#freeUserTips').template(paper_data));
													$('.freeUser_tips_cnt').dialog({
														width: 620,
														hide : true,
														modal : true,
														resizable : false,
														dialogClass : 'small-dialog green-dialog',
														buttons : [{
															text : '以后再说',
															click : function(){
																window.onbeforeunload = undefined;
																window.location.href = TinSoConfig.student + '/Homework/lists.html';
															}
														},{
															text : '通知家长自愿升级资源',
															click : function(){
																window.onbeforeunload = undefined;
																// window.location.href = TinSoConfig.student + '/Homework/lists.html';
																// 购买链接
																var url = $('.notice_msg_err a.trail_confirm').attr('href');
							                                	if (!url || url == 'undefined') {
							                                		url = TinSoConfig.store + '/Course/derictBuyCourse.html';
							                                	}
							                                	
							                                	window.open(url);  
															}
														}]
													}).show();
													return;
												}
												
												$('.p_paper_cnt,.p_answerSheet_cnt').addClass('hide');
												$('.H_submit_homework_cnt').show();
												TSP.practice.process.submitHomework(answers, precord_id);	
											}
										}
									});
				    			}
				    		}
			    		}else{
			    			// 未付费用户权限错误提示
			    			if(data.info && data.info.err_msg){
			    				MessageBox({
									content : data.info.err_msg,
									close : function(){
										window.onbeforeunload = undefined;
										window.location.href = TinSoConfig.student + '/Homework/lists.html';
									}
								});
			    			}else{
			    				MessageBox({
			    					content : '记录保存失败，请重试'
			    				});
			    			}
			    		}
			    		isNeedProtectDialog = true;
						// 答案提交成功初始化保存数据
						practice_data = {};
						practice_data_save = false;
					},
					error: function(XMLHttpRequest){
						LoadingMessageBox('close');
						if(!XMLHttpRequest.readyState){
							MessageBox({
								content : '网络异常，请联网后重试！请不要刷新或离开页面，以免数据丢失！',
								buttons : [{
									text : '我知道了',
									click : function(){
										$(this).dialog('close');
									}
								}]
							});
							
							// 存储练习数据
							practice_data = params;
							practice_data.practice_total_score = practice_total_score;
							practice_data.practice_score = practice_score;
							// 存储标识
							practice_data_save = true;
							isNeedProtectDialog = true;
						}
					}
				});
			},
			/**
			 * 保存答案，只保存不进行结果展示，切换练习模式时用
			 * @param callback 保存成功的回调函数
			 */
			saveAnswer : function(callback){
				LoadingMessageBox('保存记录中...');
				// 关闭录音检查定时器
				if(typeof record_check_interval != 'undefined' && !!record_check_interval){
					clearInterval(record_check_interval);
					record_check_interval = undefined;
				}
    			// 试题答案对象
				var answers = new Object();
		    	// 总得分
		    	var practice_score = 0;
		    	// 总分
		    	var practice_total_score = 0;
    			if(!practice_data_save && $.isEmptyObject(practice_data)){
			    	$('.sub_test_area').each(function(r, s){
			    		if(is_primary){
			    			// 试题分数
				    		var arr_score = $(this).closest('.test_sub_area').find('.sub_info').attr('data-score').split('|');
			    		}else{
			    			// 试题分数
				    		var arr_score = $(this).find('.sub_info').attr('data-score').split('|');
			    		}
			    		
			    		// 删除最后的空白
			    		arr_score.splice(arr_score.length - 1, 1);
			    		
			    		// 记录问题数
			    		var question_num = 0;
			    		
			    		// 试题答案正误
			    		$(this).find('.test_content').each(function(i, n){
				    		// 试题序号
				    		var id = $(this).attr('data-id');
				    		// 主类型
				    		var main_type = $(this).attr('data-type');
				    		// 子类型
				    		var sub_type = $(this).attr('data-subtype');
				    		// 试题熟练度
				    		var test_level = $(this).attr('data-test-level');
				    		// 最近练习时间
				    		var last_time = $(this).attr('data-last-time');
				    		// 总分
				    		var ascore = 0;
				    		// 各试题
				    		answers[id] = {'id' : id, 'qstype' : main_type, 'score' : 0, 'answer' : '', 'ascore' : 0, 
				    				'qsnum' : $(this).attr('data-count'), 'item_order' : 0, 'detail' : new Array(), 
				    				'old_level' : test_level, 'new_level' : 0};
				    		// 循环各小题
				    		$(this).find('.question_container').each(function(j, m){
				    			// 每问加一
				    			question_num++;
				    			// 小题得分
								var small_test_score = question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1]);
								// 计算总分
								ascore = ascore + small_test_score;
				    			// 小题得分
				    			var score = 0;
				    			// 正确答案
				    			var right_answer = $(this).find('.question_content .analysis .right_answer_class').attr('data-right-answer');
				    			// 用户答案
				    			var user_answer = null;
				    			// 小题序号
				    			var qid = $(this).attr('data-qid');
				    			// 试题类型
				    			var test_mold = $(this).find('.question_content').attr('data-test-mold');
				    			// 单选框(复选框)形式、子类型不为北师大题型(北师大题型1为填空题)
					    		if(test_mold == 1 && sub_type != 1621 && sub_type != 1631 && sub_type != 1626 && sub_type != 1321 && sub_type != 1323 && sub_type != 1324 && sub_type != 1326 && $(m).find('input[type=radio]').length > 0){
				    				// 不是第一题
				        			if(j > 0){
				        				// 答案
				        				answers[id]['answer'] = answers[id]['answer'] + '|';
				        			}
				    				// 用户答案 (未做的选择答案为空字符串)
				    				user_answer = $(this).find('.question_content input:checked').val();
				    				user_answer = user_answer == undefined ? '' : user_answer;
				    				// 转换正确答案
				    				if(right_answer.charCodeAt()>64 && right_answer.charCodeAt()<106){
					    				right_answer = practice.process.convertAnswer(right_answer);	
				    				}
				    				// 答案是否正确
			        				score = user_answer == right_answer ? small_test_score : 0;
				    			// 填空形式、北师大题型1为填空题
					    		}else if(((test_mold == 2 && main_type != 2700) || (test_mold == 1 && (sub_type == 1621 || sub_type == 1631 || sub_type == 1626 || sub_type == 1321 || sub_type == 1323 || sub_type == 1324 || sub_type == 1326))) && $(m).find('input[type=text]').length > 0){
				    				// 用户答案数组
				    				user_answer = new Array();
				    				// 用户用于比较的答案数组
				    				user_cmp_answer = new Array();
				    				// 正则表达式
				        			var reg = new RegExp("[.,;,:,\,，。\’\'\"\?][]*","g");
				    				// 首字母标识
				    				var initial_flag = false;
				    				
				    				// 用户答案 (未做的答案为空字符串)
				    				$(this).find('.question_content input[type="text"]').each(function(k, obj){
				    					// 用户答案
				    					var tmp_answer = $.trim($(this).val());
				    					tmp_answer = tmp_answer == undefined ? '' : tmp_answer;
				    					// 用户真实答案
				    					user_answer.push(tmp_answer);
				    					// 替换
				    					tmp_answer = tmp_answer.replace(/[.,;,:,\,，\?]/g, ' ');
				    					tmp_answer = $.trim(tmp_answer);
				            			tmp_answer = tmp_answer.replace(reg, '');
				    	    			// 用于比较的答案
					    				user_cmp_answer.push(tmp_answer);
				    	    			
				    	    			//	判断是否为首字母填空
				    	    			var prevNode = this.previousSibling;
				    	    			if(prevNode != null && prevNode.nodeType == 3 && $.trim(prevNode.nodeValue.substr(-1)) != '' && prevNode.length == 1){
				    	    				initial_flag = true;
				    	    			}
				    				});
				    				// 拓展答案(笔试用)
				        			var ext_answer = $(this).find('.question_content .analysis .right_answer_class').attr('data-ext-answer');
				    				
				    				// 正确答案数组
				    				var right_answers = ext_answer == undefined ? new Array() : ext_answer.split('#');
				    				if(right_answers.length > 0){
				    					right_answers[right_answers.length - 1] = right_answer.toLowerCase();
				    				}else{
				    					right_answers[0] = right_answer;
				    				}
				    				
				    				// 答案是否正确标识
				    				var flag_answer = false;
				    				// 答对单词个数
				    				var right_word_num = 0;
				    				// 答案单词总个数
				    				var answer_word_num = 0;
				    				
				    				// 正确答案判断用户答案是否正确
				    				for(var x in user_cmp_answer){
				    					// 用户答案不为空
				    					if(user_cmp_answer[x] == ''){
				    						// 正确答案数组
				    						var right_answer_arr = right_answers[0].split('*');
				        					// 正确答案替换字符串
				        					var right_answer_str = $.trim(right_answer_arr[x]).replace(reg, '');

				        					// 统计答案中的单词个数
				        					right_answer_str = right_answer_str.replace(/\r\n/g, '');
				        					right_answer_str = right_answer_str.replace(/\n/g, '');
				        					right_answer_str = right_answer_str.replace(/\s+/g, '*');
				        					right_answer_str = right_answer_str.split('*');

				        					answer_word_num += right_answer_str.length;
				    					} else {
				    						var right_word_num1 = 0;
				    						var answer_word_num1 = 0;

				    						// 比较正确答案
					    					for(var s in right_answers){

					    						var user_cmp_answer_r = user_cmp_answer[x];

					    						// 正确答案数组
					    						var right_answer_arr = right_answers[s].split('*');
					        					// 正确答案替换字符串
					        					var right_answer_str = $.trim(right_answer_arr[x]).replace(/[.,;,:,\,，\?]/g, ' ');
					        					right_answer_str = $.trim(right_answer_str);
					        					right_answer_str = right_answer_str.replace(reg, '');

					        					// 取出单个单词进行比较
				        						right_answer_str = right_answer_str.replace(/\r\n/g, '');
				        						right_answer_str = right_answer_str.replace(/\n/g, '');
				        						right_answer_str = right_answer_str.replace(/\s+/g, '*');

				        						right_answer_str = right_answer_str.split('*');


				        						user_cmp_answer_r = user_cmp_answer_r.replace(/\r\n/g, '');
				        						user_cmp_answer_r = user_cmp_answer_r.replace(/\n/g, '');
				        						user_cmp_answer_r = user_cmp_answer_r.replace(/\s+/g, '*');
				        						user_cmp_answer_r = user_cmp_answer_r.split('*');

				        						// 把单词都转为小写
				        						for (var y = right_answer_str.length - 1; y >= 0; y--) {
				        							right_answer_str[y] = right_answer_str[y].toLowerCase();
				        						}

				        						for (var y = user_cmp_answer_r.length - 1; y >= 0; y--) {
				        							user_cmp_answer_r[y] = user_cmp_answer_r[y].toLowerCase();
				        						}

				        						var right_word_num2 = 0;
				    							var answer_word_num2 = right_answer_str.length;

				        						if (user_cmp_answer_r.length > right_answer_str.length) {
			        								for (var jx = 0; jx < user_cmp_answer_r.length; jx++) {
			        									// 去除用户答案首个单词首字母
			        									if (j == 0 && initial_flag) {
			        										if (right_answer_str[jx] == user_cmp_answer_r[jx].substr(1) || right_answer_str[jx].substr(1) == user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
			        											right_word_num2 += 1;
			        										}
			        									} else if ($.inArray(user_cmp_answer_r[jx], right_answer_str) != -1) {
				        									right_word_num2 += 1;
				        								}
				        							}

				        							if (right_word_num2 > answer_word_num2 / 2) {
				        								right_word_num2 = Math.ceil(answer_word_num2 / 2);
				        								if (right_word_num2 == answer_word_num2 == 1) {
				        									right_word_num2 = 0.5;
				        								}
				        							}
				        						} else if (user_cmp_answer_r.length == right_answer_str.length) {

				        							var word_flag = true;

				        							for (var jx = 0; jx < right_answer_str.length; jx++) {
				        								// 去除用户答案首个单词首字母
				        								if (jx == 0 && initial_flag) {
				        									if (right_answer_str[jx] != user_cmp_answer_r[jx].substr(1) && right_answer_str[jx].substr(1) != user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
				        										word_flag = false;
				        									}
				        								} else if (user_cmp_answer_r[jx] != right_answer_str[jx]) {
				        									word_flag = false;
				        								}
				        							}

				        							if (word_flag) {
				        								right_word_num2 = answer_word_num2;
				        							} else {
				        								for (var jx = 0; jx < user_cmp_answer_r.length; jx++) {
				        									// 去除用户答案首个单词首字母
				        									if (jx == 0 && initial_flag) {
				        										if (right_answer_str[jx] == user_cmp_answer_r[jx].substr(1) || right_answer_str[jx].substr(1) == user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
				        											right_word_num2 += 1;
				        										}
				        									} else if ($.inArray(user_cmp_answer_r[jx], right_answer_str) != -1) {
					        									right_word_num2 += 1;
					        								}
					        							}

					        							if (right_word_num2 > answer_word_num2 / 2) {
					        								right_word_num2 = Math.ceil(answer_word_num2 / 2);
					        							}
				        							}
				        						} else {
				        							for (var jx = 0; jx < user_cmp_answer_r.length; jx++) {
				        								// 去除用户答案首个单词首字母
			        									if (jx == 0 && initial_flag) {
			        										if (right_answer_str[jx] == user_cmp_answer_r[jx].substr(1) || right_answer_str[jx].substr(1) == user_cmp_answer_r[jx] || right_answer_str[jx] == user_cmp_answer_r[jx]) {
			        											right_word_num2 += 1;
			        										}
			        									} else if ($.inArray(user_cmp_answer_r[jx], right_answer_str) != -1) {
				        									right_word_num2 += 1;
				        								}
				        							}

				        							if (right_word_num2 > answer_word_num2 / 2) {
				        								right_word_num2 = Math.ceil(answer_word_num2 / 2);
				        							}
				        						}

				        						// 第一次循环, 直接取当前答案单词个数和答对个数
				        						if (answer_word_num1 == 0) {
				        							right_word_num1 = right_word_num2;
				        							answer_word_num1 = answer_word_num2;
				        						} else {
				        						// 后面每次循环，取 答对个数/答案个数 大的值
				        							if (answer_word_num2 != 0 && right_word_num2/answer_word_num2 > right_word_num1/answer_word_num1) {
				        								right_word_num1 = right_word_num2;
				        								answer_word_num1 = answer_word_num2;
				        							}
				        						}
					        				}

					        				right_word_num += right_word_num1;
					        				answer_word_num += answer_word_num1;
				    					}
				    				}

				    				// 判断得分
				    				if (right_word_num >= answer_word_num) {
				    					score = small_test_score;
				    					flag_answer = true;
				    				} else if (right_word_num >= answer_word_num / 2) {
				    					score = small_test_score / 2;
				    					score = Math.floor(score / 0.5) * 0.5;
				    				} else {
				    					score = 0;
				    				}
		
				    				
				        			// 用户答案重组
				        			user_answer = user_answer.join('*') + '#';
				    			// 下拉列表形式
				    			}else if(test_mold == 5){
				    				// 不是第一题
				        			if(j > 0){
				        				// 答案
				        				answers[id]['answer'] = answers[id]['answer'] + '|';
				        			}
				    				// 用户答案 (未做的选择答案为空字符串)
				    				user_answer = $(this).find('.question_content select').val();
				    				user_answer = user_answer == -1 ? '' : user_answer;
				    				// 答案是否正确
			        				score = user_answer == right_answer ? small_test_score : 0;
			        				
			        				// 转换正确答案
				    				if(user_answer != '' && user_answer.charCodeAt()>64 && user_answer.charCodeAt()<106){
				    					user_answer = practice.process.convertAnswer(user_answer);	
				    				}
				    			// 录音形式
				    			}else if(test_mold == 6){
				    				// 总分设零、北师大不重置
				    				if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
				    					ascore = 0;
				    				}
				    				// 试题得分
			    					score = 0;
			    					// 音频问题数量
		    						var video_question_num = $(this).closest('.test_content').find('.test_ctrl[data-act-type="2"]').length;
		    						// 问题数
	    							if(video_question_num > 1){
			    						// 计算总分
					    				for(var r = 0; r < video_question_num; r++){
					    					ascore += r < arr_score.length ? parseFloat(arr_score[r]) : parseFloat(arr_score[0]);
					    				}
			    					}else if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
			    						ascore += parseFloat(arr_score[0]);
			    					}
				    				// 用户答案
	    							user_answer = '';
	    							// 不为空
			    					if(videoResult != undefined && videoResult != null 
			    							&& videoResult[id] != undefined && videoResult[id] != null){
			    						// mp3路径
			    						var mp3_path = '';
					    				// 多次录音的试题
					    				if(video_question_num > 1 || sub_type == 1435 || sub_type == 1627){
					    					// 获取问题得分
			    							var question_score = 0;
			    							
			    							// 记录问题序号
			    							var quesiton_index = 0;
			    							
			    							// 保存指针
			    							var video_that = this;
			    							
			    							// 试题得分
					    					score = practice.process.calculateVideoTotalScore(id, $(this).closest('.test_content').attr('data-subtype'), ascore);
			    							
				    						// 获取得分平均分
				    						$.each(videoResult[id], function(tid, questionsRes){
				    							// 路径
				    							var mp3_path_str = '';
				    							// 得分
				    							var user_answer_str = 0;
				    							if(questionsRes['result'] && questionsRes['result']['mp3']){
				    								mp3_path_str = questionsRes['result']['mp3'];
				    							}
				    							// 循环录音结果
				    							if(questionsRes['result'] && questionsRes['result']['text']){
				    								// 用户答案
				    								user_answer_str = questionsRes['result']['score'];
				    							}
				    							
				    							// 路径
				    							mp3_path += mp3_path_str + ',';
				    							// 用户答案
				    							user_answer = user_answer + user_answer_str + ',';
				    							
				    							// 小问分数
				    							var question_ascore = quesiton_index > arr_score.length ? arr_score[0] : arr_score[quesiton_index];
				    							// 记录问题序号
				    							quesiton_index++;
				    						});
					    				}else{
					    					// 试题总分
					    					var tmp_score = question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1]);
				    						// 获取得分平均分
				    						$.each(videoResult[id], function(tid, questionsRes){
				    							// 路径
				    							var mp3_path_str = '';
				    							// 得分
				    							var user_answer_str = 0;
				    							if(questionsRes['result'] && questionsRes['result']['mp3']){
				    								mp3_path_str = questionsRes['result']['mp3'];
				    							}
				    							// 循环录音结果
				    							if(questionsRes['result'] && questionsRes['result']['text']){
				    								// 用户答案
				    								user_answer_str = questionsRes['result']['score'];
				    							}
				    							
				    							// 路径
				    							mp3_path += mp3_path_str + ',';
				    							// 用户答案
				    							user_answer = user_answer + user_answer_str + ',';
				    							
				    						});
					    					// 试题得分
					    					if(main_type == 1600 || (($('.p_paper_cnt').attr('data-source') == 'ts' 
			    								|| $('.p_paper_cnt').attr('data-source') == 'unit') 
			    								&& main_type == 1400)){
					    						// 获取得分平均分
					    						$.each(videoResult[id], function(tid, questionsRes){
					    							if(questionsRes['result'] && questionsRes['result']['score']){
					    								score = questionsRes['result']['score'];
					    							}
					    						});
						    					score = Math.ceil(score * tmp_score * 2 / 100) / 2.0;
					    					}else{
					    						score = practice.process.calculateVideoTotalScore(id, $(this).closest('.test_content').attr('data-subtype'), tmp_score);
					    					}
					    				}
					    				// 保存答案
										answers[id]['Mp3'] = mp3_path;
			    					}
			    					if(score == null || score == ''){
			    						// 试题得分
				    					score = 0;
			    					}
			    					// 设置问题数为1，不需要存放各问题的记录、北师大题型
			    					if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
			    						answers[id]['qsnum'] = 1;
			    					}
				    			// 作文
				    			}else if(test_mold == undefined && main_type == 2700){
				    				// 用户答案 (未做的选择答案为空字符串)
				    				user_answer = $(this).find('textarea').val();
				    				// 答案
				    				user_answer = user_answer == undefined ? '' : user_answer;
				    			}
				    			// 保存答案
								answers[id]['detail'].push({'item_order' : (j + 1), 'score' : score, 'answer' : user_answer, 'ascore' : question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1])});
				    			// 总得分
								answers[id]['score'] = parseFloat(answers[id]['score']) + score;
				    			// 答案、北师大题型特殊处理
								if(sub_type == 1621 || sub_type == 1626 || sub_type == 1631){
									answers[id]['answer'] = answers[id]['answer'] + user_answer + '|';
								}else{
									answers[id]['answer'] = answers[id]['answer'] + user_answer;
								}
				    		});
				    		
				    		// 各试题总分
				    		answers[id]['ascore'] = ascore;
				    		// 练习总分
							practice_total_score += ascore;
							console.log(answers);
							console.log(answers[id]);
							// 获取当前题的类型
							var curType = $('.test_content[data-id="'+answers[id]['id']+'"]').attr('data-kind'); 
				    		// 计算试题熟练度
				    		answers[id]['new_level'] = practice.process.calculateTestLevel(answers[id]['old_level'], last_time, ascore, answers[id]['score'], curType);
				    		practice_score = practice_score + parseFloat(answers[id]['score']);
				    	});
			    	});
    			}else{
			    	// 试题答案对象
    				answers = practice_data.test_record;
    				// 总得分
    				practice_score = practice_data.practice_score;
    				// 总分
    				practice_total_score = practice_data.practice_total_score;
    			}
		    	// 完成时间
	    		var duration_time = '';
	    		if($('#test-mode[data-mode="free"]').is(':checked')){
		    		duration_time = time;
		    	}else{
		    		duration_time = total_time - count_down_time;
		    	}
		    	// 后台数据存储
		    	var record = {'time' : Math.ceil((duration_time)/60), 'practice_score' : Math.formatFloat(practice_score), 'practice_total_score' : practice_total_score.toString().length > 5 ? Math.formatFloat(practice_total_score) : practice_total_score};
		    	record.percent = Math.round(record.practice_score/record.practice_total_score * 100);
		    	if(!practice_data_save && !practice_data.practice_record){
			    	// 练习记录
			    	var practice_record = {'version_id' : version_id, 'grade_id' : grade_id, 'unit' : unit_ids, 
			    			'practice_type' : type, 'practice_id' : practice_id, 'duration_time' : duration_time, 
			    			'score' : practice_score, 'ascore' : practice_total_score.toString().length > 5 ? Math.formatFloat(practice_total_score) : practice_total_score, 'config' : JSON.stringify(config)};
			    	// 参数
			    	var params = {'test_record' : answers, 'practice_record' : practice_record};		    	
	    		}else{
	    			var params = {
	    				'test_record': practice_data.test_record,
	    				'practice_record': practice_data.practice_record
	    			};
	    		}
		    	$.ajax({
					url : TinSoConfig.student + '/Practice/submitAnwser.html',
					data : params,
					type : 'POST',
					global : false,
					success : function(data){
						LoadingMessageBox('close');
			    		if(data.status && data.info.flag === true){
			    			typeof callback == 'function' && callback();
			    		}else{
			    			// 未付费用户权限错误提示
			    			if(data.info.err_msg){
			    				MessageBox({
									content : data.info.err_msg,
									close : function(){
										window.onbeforeunload = undefined;
										window.location.href = TinSoConfig.student + '/Homework/lists.html';
									}
								});
			    			}else{
				    			MessageBox({
									content : '记录保存失败，请重试'
								});
			    			}
			    		}
						// 答案提交成功初始化保存数据
						practice_data = {};
						practice_data_save = false;
						isNeedProtectDialog = true;
					},
					error: function(XMLHttpRequest){
						LoadingMessageBox('close');
						if(!XMLHttpRequest.readyState){
							MessageBox({
								content : '网络异常，请联网后重试！请不要刷新或离开页面，以免数据丢失！'
							});
							// 存储练习数据
							practice_data = params;
							practice_data.practice_total_score = practice_total_score;
							practice_data.practice_score = practice_score;
							// 存储标识
							practice_data_save = true;
							isNeedProtectDialog = true;
						}
					}
				});
			},
			checkAnswer : function(){
				var test = $('.current_test');
				// 试题序号
	    		var id = test.attr('data-id');
	    		// 主类型
	    		var main_type = test.attr('data-type');
	    		// 试题熟练度
	    		var test_level = test.attr('data-test-level');
	    		// 最近练习时间
	    		var last_time = test.attr('data-last-time');
	    		// 总分
	    		var ascore = 0;
				// 定义大题答案是否正确标志
				var answers_flag = true;
				// 试题分数
	    		var arr_score = $('.current_test').siblings('.sub_info').attr('data-score').split('|');
	    		// 删除最后的空白
	    		arr_score.splice(arr_score.length - 1, 1);
				// 记录问题数
	    		var question_num = 0;
	    		// 各试题
	    		answers[done] = {'id' : id, 'qstype' : test.attr('data-type'), 'score' : 0, 'answer' : '', 
	    				'ascore' : 0, 'qsnum' : test.attr('data-count'), 'item_order' : 0, 'detail' : new Array(), 
	    				'old_level' : test_level, 'new_level' : 0};
	    		
	    		var question = test.find('.question_container');		
	    		// 循环各小题
	    		question.each(function(j, m){
	    			// 每问加一
	    			question_num++;
	    			// 小题得分
					var small_test_score = question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1]);
					// 计算总分
					ascore = ascore + small_test_score;
	    			// 小题得分
	    			var score = 0;
	    			// 正确答案
	    			var right_answer = $(this).find('.question_content .analysis .right_answer_class').attr('data-right-answer');
	    			// 用户答案
	    			var user_answer = null;
	    			// 小题序号
	    			var qid = $(this).attr('data-qid');
	    			// 试题类型
	    			var test_mold = $(this).find('.question_content').attr('data-test-mold');
	    			
	    			// 单选框(复选框)形式
	    			if(test_mold == 1){
	    				// 不是第一题
	        			if(j > 0){
	        				// 答案
	        				answers[done]['answer'] = answers[done]['answer'] + '|';
	        			}
	    				// 用户答案 (未做的选择答案为空字符串)
	    				user_answer = $(this).find('.question_content input:checked').val();
			    		user_answer = user_answer == undefined ? '' : user_answer;
			    		if(user_answer != ''){
	    					noanswers_flag = false;
	    				}
	    				// 转换正确答案
	    				right_answer = practice.process.convertAnswer(right_answer);
	    				
	    				// 答案是否正确
	        			if(user_answer == right_answer){
	        				//小题得分
	        				score = small_test_score;
	        			}else{
	        				//答案错误
	        				answers_flag = false;
	        				// 小题不得分
	        				score = 0;
	        			}
	    				
	    			// 填空形式
	    			}else if(test_mold == 2){
	    				// 用户答案数组
	    				user_answer = new Array();
	    				// 正则表达式
	        			var reg = new RegExp("[.,;,:,\,，\’\'\"][ ]*","g");
	    				
	    				// 用户答案 (未做的答案为空字符串)
	    				$(this).find('.question_content input[type="text"]').each(function(i, obj){
	    					// 用户答案
	    					var tmp_answer = $.trim($(this).val());
	    					tmp_answer = tmp_answer == undefined ? '' : tmp_answer;
	    					if(tmp_answer != ''){
		    					noanswers_flag = false;
		    				}
	    					// 替换
	            			tmp_answer = tmp_answer.replace(reg, ",");
	    	    			// 答案
		    				user_answer.push(tmp_answer);
	    	    			
		    				//判断是否为首字母填空
	    	    			var prevNode = this.previousSibling;
	    	    			if(prevNode != null && prevNode.nodeType == 3 && $.trim(prevNode.nodeValue.substr(-1)) != '' && prevNode.length == 1){
	    	    				initial_flag = true;
	    	    			}
	    				});
	    				// 拓展答案(笔试用)
	        			var ext_answer = $(this).find('.question_content .analysis .right_answer_class').attr('data-ext-answer');
	    				// 正确答案数组
	    				var right_answers = ext_answer == undefined ? new Array() : ext_answer.split('#');
	    				if(right_answers.length > 0){
	    					right_answers[right_answers.length - 1] = right_answer;
	    				}else{
	    					right_answers[0] = right_answer;
	    				}
	    				
	    				// 答案是否正确标识
	    				var flag_answer = false;
	    				
	    				// 正确答案判断用户答案是否正确
	    				for(var r in user_answer){
	    					// 用户答案不为空
	    					if(user_answer[r] == ''){
	    						flag_answer = false;
	    						break;
	    					}
	    					
	    					// 比较正确答案
	    					for(var s in right_answers){
	    						// 正确答案数组
	    						var right_answer_arr = right_answers[s].split('*');
	        					// 正确答案替换字符串
	        					var right_answer_str = $.trim(right_answer_arr[r]).replace(reg, ",");
	        					
	        					// 直接比较
	        					if(right_answer_str == user_answer[r]){
	        						flag_answer = true;
	        						break;
	        					}
	        					// 用户答案去除首字母
	        					if(right_answer_str == user_answer[r].substr(1)){
	        						flag_answer = true;
	        						break;
	        					}
	        					// 正确答案去除首字母
	        					if(right_answer_str.substr(1) == user_answer[r]){
	        						flag_answer = true;
	        						break;
	        					}
	        				}
	    					
	    					// 答案错误
	    					if(!flag_answer){
	    						break;
	    					}
	    				}
	    				
	    				// 答案是否正确
	        			if(flag_answer){
	        				//小题得分
	        				score = small_test_score;
	        			}else{
	        				//答案错误
	        				answers_flag = false;
	        				// 小题不得分
	        				score = 0;
	        			}
	    				
	        			// 用户答案重组
	        			user_answer = user_answer.join('*') + '#';
	    			// 下拉列表形式
	    			}else if(test_mold == 5){
	    				// 不是第一题
	        			if(j > 0){
	        				// 答案
	        				answers[done]['answer'] = answers[done]['answer'] + '|';
	        			}
	    				// 用户答案 (未做的选择答案为空字符串)
	    				user_answer = $(this).find('.question_content select').val();
	    				user_answer = user_answer == -1 ? '' : user_answer;
	    				if(user_answer != ''){
	    					noanswers_flag = false;
	    				}
	    				// 答案是否正确
	        			if(user_answer == right_answer){
	        				//小题得分
	        				score = small_test_score;
	        			}else{
	        				//答案错误
	        				answers_flag = false;
	        				// 小题不得分
	        				score = 0;
	        			}
	        			
	        			// 转换正确答案
	    				if(user_answer != '' && user_answer.charCodeAt()>64 && user_answer.charCodeAt()<106){
	    					user_answer = practice.process.convertAnswer(user_answer);	
	    				}
	    			// 录音形式
	    			}else if(test_mold == 6){
	    				// 总分设零、北师大不重置
	    				if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
	    					ascore = 0;
	    				}
	    				// 试题得分
						score = 0;
						
						// 音频问题数量
						var video_question_num = $(this).closest('.test_content').find('.test_ctrl[data-act-type="2"]').length;
    					
    					if(video_question_num > 1){
    						// 计算总分
		    				for(var r = 0; r < video_question_num; r++){
		    					ascore += r < arr_score.length ? parseFloat(arr_score[r]) : parseFloat(arr_score[0]);
		    				}
    					}else if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
    						ascore += parseFloat(arr_score[0]);
    					}
	    				
	    				// 用户答案
						user_answer = '';
						
						// 不为空
    					if(videoResult != undefined && videoResult != null 
    							&& videoResult[id] != undefined && videoResult[id] != null){
							// mp3路径
							var mp3_path = '';
		    				// 多次录音的试题
		    				if(video_question_num > 1 || sub_type == 1435 || sub_type == 1627){
		    					// 获取问题得分
								var question_score = 0;
								
	    						// 获取得分平均分
	    						$.each(videoResult[id], function(tid, questionsRes){
	    							// 获取问题得分
	    							var sen_score = 0;
	    							
	    							// 循环录音结果
	    							if(questionsRes['result'] && questionsRes['result']['text']){
	    								// 句子平均分
	    								$.each(questionsRes['result']['text'], function(senIndex, senObj){
	    									sen_score += parseInt(senObj['score']);
	    								});
	    								
	    								// 获取句子得分
	    								sen_score = sen_score/questionsRes['result']['text'].length;
	    								
	    								// 记录各问的分数
	    								question_score += sen_score;
	    								
	    								// 用户答案
	    								user_answer = user_answer + sen_score + ',';
	    								
	    								// 路径
	    								mp3_path += questionsRes['result']['mp3'] + ',';
	    							}
	    						});
		    					
		    					// 试题得分
		    					score = (question_score * ascore /100/video_question_num).toFixed(1);
		    				}else{
		    					// 获取句子得分
								var sen_score = 0;
	    						// 获取得分平均分
	    						$.each(videoResult[id], function(tid, questionsRes){
	    							// 路径
	    							var mp3_path_str = '';
	    							// 得分
	    							var user_answer_str = 0;
	    							if(questionsRes['result'] && questionsRes['result']['mp3']){
	    								mp3_path_str = questionsRes['result']['mp3'];
	    							}
	    							// 循环录音结果
	    							if(questionsRes['result'] && questionsRes['result']['text']){
	    								// 用户答案
	    								user_answer_str = questionsRes['result']['score'];
	    							}
	    							
	    							// 路径
	    							mp3_path += mp3_path_str + ',';
	    							// 用户答案
	    							user_answer = user_answer + user_answer_str + ',';
	    						});
		    					// 试题总分
		    					var tmp_score = question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1]);
		    					
		    					// 试题得分
		    					if(main_type == 1600){
		    						// 获取得分平均分
		    						$.each(videoResult[id], function(tid, questionsRes){
		    							if(questionsRes['result'] && questionsRes['result']['score']){
		    								score = questionsRes['result']['score'];
		    							}
		    						});
			    					
			    					score = Math.ceil(score * tmp_score * 2 / 100) / 2.0;
		    					}else{
		    						score = practice.process.calculateVideoTotalScore(id, $(this).closest('.test_content').attr('data-subtype'), tmp_score);
		    					}
		    					
		    					// 试题得分
		    					score = (sen_score * tmp_score / 100).toFixed(1);
		    				}
		    				
		    				// 保存答案
							answers[done]['Mp3'] = mp3_path;
						}else{
							//答案错误
	        				answers_flag = false;
							// 试题不得分
	    					score = 0;
						}
						
						if(score == null || score == ''){
    						// 试题得分
	    					score = 0;
    					}
						
						// 设置问题数为1，不需要存放各问题的记录、北师大题型不做处理
						if(sub_type != 1621 && sub_type != 1626 && sub_type != 1631){
							answers[done]['qsnum'] = 1;
						}
	    			// 作文
	    			}else if(test_mold == undefined && main_type == 2700){
	    				// 用户答案 (未做的选择答案为空字符串)
	    				user_answer = $(this).find('textarea').val();
	    				// 答案
	    				user_answer = user_answer == undefined ? '' : user_answer;
	    			}
	    			// 保存答案
					answers[done]['detail'].push({'item_order' : (j + 1), 'score' : score, 'answer' : user_answer, 'ascore' : question_num > arr_score.length ? parseFloat(arr_score[0]) : parseFloat(arr_score[question_num-1])});
	    			// 总得分
					answers[done]['score'] = parseFloat(answers[done]['score']) + score;
	    			// 答案
					answers[done]['answer'] = answers[done]['answer'] + user_answer;
	    		});
	    		// 各试题总分
	    		answers[done]['ascore'] = ascore;
	    		// 练习总分
				practice_total_score += ascore;
	    		//累计总得分
	    		practice_score = practice_score + parseFloat(answers[done]['score']);
	    		//累计总题数
	    		done = done + 1;
	    		
		    	return answers_flag;
			}, 
			/**
			 *  移除错题
			 */
			removeWrong : function(testId, callback){
				remove_flag = true;
				$.post(TinSoConfig.student + '/Questions/removeWrongByTestId.html', {'testId' : testId}, function(data){
					if(data.info === true){
				    	MessageBox({
							content : '移除错题成功！',
							close: function( event, ui ) {
								$(this).dialog('destroy').remove();
							},
							buttons : [{
								text : '我知道了',
								click : function(){
									$(this).dialog('close');
									callback();
								}
							}]
						});
				    }else{
				    	MessageBox({
							content : '移除错题失败，请重试',
							close: function( event, ui ) {
								$(this).dialog('destroy').remove();
							},
							buttons : [{
								text : '我知道了',
								click : function(){
									$(this).dialog('close');
									callback();
								}
							}]
						});
				    }
				});
			},
			/**
			 *  错题库结果展示对话框
			 */
			showResult : function(result){
				$('.dialog_cnt').html($('#resultInfoTemp').template(result));
				$('.dialog_cnt').dialog({
					dialogClass : 'small-dialog green-dialog',
					width : 480,
					modal : true,
					resizable : false,
					close: function() {
						$(this).dialog('destroy').remove();
						location.href = TinSoConfig.student + '/Questions/wrong.html';
					},
					buttons:{ 
						'确定':function(){ 
							$(this).dialog("close");
						}
					}
				}).show();
			},
			/**
			 *  获取地址栏参数值
			 */
			getQueryString :　function (name) {
			    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
			    var r = window.location.search.substr(1).match(reg);
			    if (r != null) return decodeURI(r[2]); return null;
			},
			/**
			 *  返回上一页面
			 */
			backToSource : function(){
				var source = new Array();
				source['/Practice/smartPractice'] = '/Practice/smartPracticeList';		 // 智能练习
				source['/Practice/singlePractice'] = '/Practice/single';			     // 单元同步题型突破
				source['/Practice/homework'] = '/Homework/lists';                        // 在线作业
				source['/Practice/tsSinglePractice'] = '/Paper/tsSingle';                // 人机对话题型突破
				source['/Practice/bsSinglePractice'] = '/Paper/bsSingle';                // 笔试考场题型突破
				source['/Questions/practiceSingleWrong'] = '/Questions/wrong';           // 单题狙杀
				source['/Questions/practiceMultipleWrong'] = '/Questions/wrong';         // 错题大会战
				source['/Questions/practiceSingleFavorite'] = '/Questions/favorite';     // 单题练习
				source['/Questions/practiceMultipleFavorite'] = '/Questions/favorite';   // 综合练习
				
				source['/Practice/paperPractice'] = new Array();
				source['/Practice/paperPractice']['unit'] = '/Practice/papers';			 // 单元测试
				source['/Practice/paperPractice']['ts'] = '/Paper/renjiduihua';          // 人机对话模拟考场
				source['/Practice/paperPractice']['bs'] = '/Paper/bishi';                // 笔试考场模拟考场
				
				source['/Practice/knowledgePractice'] = new Array();
				source['/Practice/knowledgePractice']['unit'] = '/Teachingpurpose/index';			 // 单元同步教学目标
				source['/Practice/knowledgePractice']['details'] = '/Grammar/teachingPurpose';       // 教学目标详情
				source['/Practice/knowledgePractice']['dycs'] = '/Practice/papers';                  // 单元测试
				source['/Practice/knowledgePractice']['bs'] = '/Teachingpurpose/paper';              // 笔试考场教学目标
				source['/Practice/knowledgePractice']['bsmn'] = '/Paper/bishi';                      // 笔试考场模拟考场 
				source['/Practice/knowledgePractice']['zymn'] = '/Homework/lists';                   // 在线作业
				
				source['/Practice/paperRecord'] = new Array();
				source['/Practice/paperRecord']['unit'] = '/Practice/papers';			// 单元测试
				source['/Practice/paperRecord']['ts'] = '/Paper/renjiduihua';       	// 人机对话模拟考场
				source['/Practice/paperRecord']['bs'] = '/Paper/bishi';              	// 笔试考场模拟考场
				source['/Practice/paperRecord']['hw'] = '/Homework/lists';              // 在线作业
				source['/Practice/wordReciteRecord'] = '/Homework/lists';               // 在线作业
				
				//获取当前文件路径
				var path = window.location.pathname.split('.')[0];
				
				if (!Array.isArray) {
					Array.isArray = function(arg) {
						return Object.prototype.toString.call(arg) === '[object Array]';
					};
				}
				if(Array.isArray(source[path])){
					//获取参数
					var url_type =　TSP.practice.process.getQueryString("type");
					//语法详情页面
					if(path == '/Practice/knowledgePractice' && url_type == 'details'){
						var url_knowledge =　TSP.practice.process.getQueryString("knowledge");
						var kid =　TSP.practice.process.getQueryString("kid");
						if(kid != '' && kid != undefined && kid != null){
							url_knowledge = kid;
						}
						var version =　TSP.practice.process.getQueryString("version");
						var grade =　TSP.practice.process.getQueryString("grade");
						var unit =　TSP.practice.process.getQueryString("unit");
						var source_path = source[path][url_type] +'.html?knowledge='+url_knowledge+'&versionId='+version+'&gradeId='+grade+'&unitId='+unit;	
					}else{
						var source_path = source[path][url_type] +'.html';
					}
				}else{
					var source_path = source[path] +'.html';
				}
				location.href = TinSoConfig.student + source_path;
				return false;
			}
		},
		/**
		 * 答题卡处理对象，与答题卡相关的代码写在这里
		 */
		answerSheet : {
			/**
			 * 答题卡拉是否伸至底部
			 */
			stretch : false,
			
			/**
			 * 初始化答题卡
			 */
			init : function(){
				// 左侧导航模式(教师端)
				if(!(page_mode || type == 'preview')){
					practice.answerSheet.setSidebar();
				// 学生端答题卡模式
				}else{
					practice.answerSheet.setAnswerSheetNumber();
					practice.answerSheet.setAnswerSheetHeight();
				}
			},
			/**
			 * 选中某个小题
			 * @index int 小题题号
			 * @offset number 定位偏移量
			 */
			select : function(index, offset){
				offset = offset || 0;
				if(isNaN(offset)){
					offset = 0;
				}
				var curIndex = practice.curIndex = index;
				practice.paperTest.select(curIndex);
				if(!is_primary){
					//定位试题
					var top = $('.question_container[data-qid=' + index + ']').offset().top;
					var title_top = $('.p_paper_title').offset().top;
					var title_height = $('.p_paper_title').outerHeight(true);
					
					if($('.p_paper_title').css('position') == 'fixed'){
						top = top - 28 - 45 - title_height;
					}else{
						top = top - 28 - 45 - title_height - title_height;
					}
					
					// 教师端预览作业特殊处理
					if(page_mode === false && type == 'preview'){
						top = top - 32;
					}
					
					$('html, body').stop().animate({scrollTop : (top + offset) + 'px'}, 0);
				}else{
					// 隐藏test_ctrl_info_area
					$('.test_ctrl_info_area ').hide();
					// 答题按钮
					$('.btn_play').removeClass('primary_btn_replay').addClass('primary_btn_play');
					// 停止时间
					clearInterval(tape_remainder_key);
					// 停止播放
					TSP.audio.player.stop();
					// 停止录音
					if(TSP.audio.recorder.inited){
						TSP.audio.recorder.stop();
					}
					var sub_type = $('.test_content[data-test-index='+index+']').attr('data-subtype');
					// 图片排序
					if((sub_type == 1121 || sub_type == 1122 || sub_type == 1123 || sub_type == 1124)){
						// 停止时间
						if(typeof pause_play_key != 'undefined'){
							clearInterval(pause_play_key);
						}
						// 移除当前句边框样式，添加顺序标识
						$('.test_content[data-test-index='+index+']').find('.images_sort_cnt .images_sort_option_cnt').removeClass('current_sort_option').addClass('enable');
						// 移除当前句星星图标
						$('.test_content[data-test-index='+index+']').find('.images_sort_cnt .images_sort_option_cnt .option_flag').removeClass('current_flag');
						// 初始化选择的图片
						if(!($('.primary_test_assheet ul li[data-index="' + index + '"]').hasClass('done') 
								|| $('.primary_test_cnt[data-page="result"]').length)){
							$('.test_content[data-test-index='+index+']').find('.images_sort_cnt .images_sort_option_cnt .images_sort_option').html('<div class="question_mark"></div>');
							// 打乱图片顺序
							TSP.practice.primary.question.randomChildNodes($('.test_content[data-test-index='+index+']').find('.question_content'), '.option_label');
							// 随机设定音频播放顺序，也是答案的顺序
							TSP.practice.primary.question.randomChildNodes($('.test_content[data-test-index='+index+']').find('.images_sort_cnt'), '.images_sort_option_cnt');
							// 打乱后的顺序
							$('.test_content[data-test-index='+index+']').find('.images_sort_cnt .images_sort_option_cnt').attr('data-rd-index', function(){
								return $(this).index() + 1;
							});
						}
					}
				}
			},
			/**
			 * 设置答题卡编号
			 */
			setAnswerSheetNumber : function(callback){
				if(type == "wrong"){
					//试题编号(答题卡)
					$('.test_sub_area').each(function(i, n){
						// 标题
						$('.p_answer_list').append('<p data-index=' + Number(temp_index + i) + '>' + $(this).attr('data-title') + '</p>');
						//题号
						var temp = '';
						$(this).find('.test_content').each(function(j, m){
							temp += '<span data-id="' + $(this).attr('data-id') + '">';
							$(this).find('.question_container').each(function(k, v){
								temp += '<li class="dib" data-index="' + $(this).attr('data-qid') + '">' + $(this).attr('data-qid') + '</li>';
							});
							temp += '</span>';
						});
						$('.p_answer_list').append('<ul  data-index=' + Number(temp_index + i) + '>' + temp + '</ul>');
					});
				}else if(is_primary){
					// 试题编号(答题卡)
					var temp = '';
					$('.test_sub_area').find('.test_content').each(function(j, m){
						temp += '<li class="dib" data-index="' + $(this).attr('data-test-index') + '">' + $(this).attr('data-test-index') + '</li>';
					});
					$('.p_answer_list').append('<ul>' + temp + '</ul>').mCustomScrollbar('destroy').mCustomScrollbar({theme: 'dark'});
				}else{
					// 试题编号(答题卡)
					$('.test_sub_area').each(function(i, n){
						// 标题
						$('.p_answer_list').append('<p>' + $(this).attr('data-title') + '</p>');
						// 题号
						var temp = '';
						$(this).find('.question_container').each(function(j, m){
							temp += '<li class="dib" data-index="' + $(this).attr('data-qid') + '">' + $(this).attr('data-qid') + '</li>';
						});
						$('.p_answer_list').append('<ul>' + temp + '</ul>');
					});
				}
				typeof callback == 'function' && callback();
			},
			/**
			 * 设置导航
			 */
			setSidebar : function(){
				// 导航数据
				var objs = new Object();
				// 顺序
				var kindIndexs = new Object();
				// 顺序呢
				var kind_index = 0;
				//	试题编号(答题卡)
				$('.test_sub_area').each(function(i, n){
					// 标题
					var title = $(this).attr('data-title');
					// 试题类型
					var kind = 0;
					// 主类型
					var main_type = 0;
					// 子类型
					var sub_type = 0;
					// 结构说明id
					var part_id = $(this).attr('data-part-id');
					
					// 试题
					$(this).find('.test_content').each(function(j, m){
						// 试题id
						var test_id = $(this).attr('data-id');
						// 题号
						var numArr = new Array();
						// 循环获取题号
						$(this).find('.question_container').each(function(k, o){
							// 题号
							numArr.push($(this).attr('data-qid'));
							// 试题类型
							kind = $(this).closest('.test_content').attr('data-kind');
							// 主类型
							main_type = $(this).closest('.test_content').attr('data-type');
							// 子类型
							sub_type = $(this).closest('.test_content').attr('data-subtype');
						});
						
						// 不存在此类型
						if(kindIndexs[kind] == undefined){
							// 保存下标
							kindIndexs[kind] = kind_index;
							// 顺序呢
							kind_index++;
						}
						
						// 不存在此类型
						if(objs[kindIndexs[kind]] == undefined){
							// 序号
							objs[kindIndexs[kind]] = {'kind' : kind, 'kind_name' : practice.util.getKindName(kind), 'tests' : new Object()};
						}
						
						// 题型是否存在 $.base64.encode(put1)
						if(objs[kindIndexs[kind]]['tests'][$.md5(title)] == undefined){
							objs[kindIndexs[kind]]['tests'][$.md5(title)] = {'title' : title, 'main_type' : main_type, 'sub_type' : sub_type, 'part_id' : part_id, 'indexs' : new Array()}
						}
						
						// 保存数据
						objs[kindIndexs[kind]]['tests'][$.md5(title)]['indexs'].push({'index' : numArr.length > 1 ? numArr[0]+'~'+numArr[numArr.length-1] : numArr[0], 'test_id' : test_id});
					});
				});
				
				if($('.edit_homework .sidebar').length){
					// 导航数据
					$('.edit_homework .sidebar').mCustomScrollbar('destroy').html($('#test_tree_tpl').template(objs)).mCustomScrollbar({theme: 'dark'});
				}else if($('.preview_sidebar').length){
					// 导航数据
					$('.preview_sidebar').mCustomScrollbar('destroy').html($('#test_tree_tpl').template(objs)).mCustomScrollbar({theme: 'dark'});
				}
			},
			/**
			 * 设置答题卡区域高度
			 */
			setAnswerSheetHeight : function(){
				// 重新计算试卷显示区域距离底部的距离
				window.paperBottom = $('body').height() - paperTop - paper.height();
				// ie版本
				var ieVersion = null;
				if($.browser.msie){
					ieVersion = parseInt($.browser.version);
				}
				
				// 浏览器窗口的高度
				if($.browser.msie && ieVersion < 7){
					winHeight = document.body.clientHeight;
				}else if($.browser.msie && parseInt(ieVersion) < 9){
					winHeight = document.documentElement.clientHeight;
				}else if(window.innerHeight){
					winHeight = window.innerHeight;
				}else if(document.body.clientHeight){
					winHeight = document.body.clientHeight;
				}
				
				// 浏览器窗口的宽度
				if($.browser.msie && ieVersion < 7){
					winWidth = document.body.clientWidth;
				}else if($.browser.msie && ieVersion < 9){
					winWidth = document.documentElement.clientWidth;
				}else if(window.innerWidth){
					winWidth = window.innerWidth;
				}else if(document.body.clientWidth){
					winWidth = document.body.clientWidth;
				}
				
				// 浏览器底部出现滚动条时，滚动条宽度（17）
				if(winWidth - 16 <= $('.main_content').width()){
					var slidebarWidth = 17;
				}else{
					var slidebarWidth = 0;
				}
				
				// 答题卡正确错误样式提示语高度,-11为外边距
				var tfTipsHeight = $('.answerSheet_tf_tips').length > 0 ? $('.answerSheet_tf_tips').height() - 11 : 0;
				
				var answerSheetHeight = 0;
				if(type == 'preview'){
					answerSheetHeight = winHeight - paperBottom - slidebarWidth - 60;
				}else{
					answerSheetHeight = winHeight - paperBottom - slidebarWidth - 28 - 60;	// 28和60-两个导航栏高度
				}
				
				$('.p_answerSheet_cnt').css({'height' : answerSheetHeight + 'px'});
				
				var reduceHeight = 0;
				// 减去的高度,40为间距,60为导航栏高度
				if(window.location.pathname == '/Competition/paper.html'){
					reduceHeight = $('.time_box').height() + $('.p_operation_box').height() + tfTipsHeight + 40 + 60 + 10;
				}else{
					reduceHeight = $('.time_box').height() + $('.p_operation_box').height() + tfTipsHeight + 40;
				}
				
				// 如果包含口语练习，加上等待判分图标信息提示的高度 20
				if($('.test_content[data-type=1400]').length > 0) {
					reduceHeight = reduceHeight + 20;
				}
				
				// 答题卡中题号区域高度
				var NumbersAreaHeight = answerSheetHeight - reduceHeight;
				$('.p_answer_list').css({
					'height' : NumbersAreaHeight + 'px',
					'min-height' : parseInt($('.p_answerSheet_cnt').css('min-height')) - reduceHeight + 'px'
				});
				this.stretch = false;
			},
			
			/**
			 * 答题卡和标题的定位
			 */
			setAnswerSheetTitlePos : function(){
				scrollY = ( document.body.scrollTop 			//chrome、Opera等
						|| window.pageYOffset 					//safari
						|| document.documentElement.scrollTop	//IE、FireFox等
						) + 28;
				scrollX = document.body.scrollLeft || window.pageXOffset || document.documentElement.scrollLeft;
				
				if($('.sec_nav_menu').css('position') == 'fixed'){
					scrollY += 60;
				}
				
				if(scrollY > titleTop){
					if(window.location.pathname != '/Competition/paper.html'){
						if(title.css('position') != 'fixed'){
							if(page_mode === false && type == 'preview'){
								title.css({'position' : 'fixed', 'top' : '60px'});
							}else{
								title.css({'position' : 'fixed', 'top' : '73px'});
							}
						}
					}
					
					if(answerSheet.css('position') != 'fixed'){
						if(page_mode === false && type == 'preview'){
							answerSheet.css({'position' : 'fixed', 'top' : '60px'});
						}else{
							answerSheet.css({'position' : 'fixed', 'top' : '73px'});
						}
					}
					TSP.practice.answerSheet.stretchAnswerSheet();
				}else{
					if(window.location.pathname != '/Competition/paper.html'){
						if(title.css('position') != 'static'){
							title.css({'position' : 'static'});
						}
					}
					
					if(answerSheet.css('position') != 'static'){
						answerSheet.css({'position' : 'static'});
					}
					TSP.practice.answerSheet.setAnswerSheetHeight();
				}
				
				TSP.practice.answerSheet.setAnswerSheetPosX();
			},
			
			/**
			 * 触发resize事件，重新计算答题卡的水平定位
			 */
			setAnswerSheetPosX : function(){
				// 重新获取试卷区域距离窗口左侧的距离
				paperLeft = $('.main_content')[0].offsetLeft;
				
				if(window.location.pathname != '/Competition/paper.html'){
					if(answerSheet.css('position') == 'fixed'){
						answerSheet.css({'left' : (paperLeft + paperWidth + 6 - scrollX) + 'px'});
					}
				
					if(title.css('position') == 'fixed'){
						title.css({'left' : (paperLeft - scrollX) + 'px'});
					}
				}
			},
			/**
			 * 答题卡定位时，底部拉长至浏览器边缘。当底部footer显现时逐渐恢复正常高度
			 */
			stretchAnswerSheet : function(){
				if(typeof paperBottom === 'undefined'){
					paperBottom = $('body').height() - paperTop - paper.height();
				}
				if(typeof winHeight === 'undefined'){
					// ie版本
					var ieVersion = null;
					if($.browser.msie){
						ieVersion = parseInt($.browser.version);
					}
					// 浏览器窗口的高度
					if($.browser.msie && ieVersion < 7){
						winHeight = document.body.clientHeight;
					}else if($.browser.msie && parseInt(ieVersion) < 9){
						winHeight = document.documentElement.clientHeight;
					}else if(window.innerHeight){
						winHeight = window.innerHeight;
					}else if(document.body.clientHeight){
						winHeight = document.body.clientHeight;
					}
				}
				
				// 如果答题卡未拉伸，且高度小于窗口高度减去顶部导航栏的高度（28）
				if(!this.stretch && $('.p_answerSheet_cnt').height() < winHeight - 28 - 45){
					$('.p_answer_list').css('height', $('.p_answer_list').height() + paperBottom + 15 - 1 + 'px');
					$('.p_answerSheet_cnt').css('height', $('.p_answerSheet_cnt').height() + paperBottom + 15 - 1 + 'px'); // 1-边框线宽
					this.stretch = true;
				}
				
				if(paper.height() - scrollY + title.height() + paperBottom - 26 < winHeight){
					this.setAnswerSheetHeight();
				}
			}
		},
		/**
		 * 试卷练习区域处理对象
		 */
		paperTest : {
			/**
			 * 初始化试卷练习区域
			 */
			init : function(){
				// 练习形式
				$('.p_tests_area').attr('data-page', 'practice');
				practice.paperTest.hideTestTitle();
				practice.paperTest.setXSZSTest();
				practice.paperTest.setQjTest();
				practice.paperTest.setDWLJTest();
				practice.paperTest.setTestNumber();
				practice.paperTest.setOption();
				practice.paperTest.setImgSize();
				// 显示试题按钮等数据(学生端)
				if(page_mode){
					practice.paperTest.setTestStatus();
					practice.paperTest.initButton();
				}
				
				practice.paperTest.setVideoImg();
				// 竞赛练习页面
				if(window.location.pathname != '/Competition/paper.html'){
					practice.paperTest.setBoldLine();
				}
				practice.paperTest.removeWhite();
			},
			/**
			 * 隐藏不需要的标题
			 */
			hideTestTitle : function(){
				var part_ids = ['2101', '3335', '3721', '4078'];
				$('.test_sub_area').each(function(i, obj){
					var part_id = $(this).attr('data-part-id');
					if($.inArray(part_id, part_ids) != -1){
						$(this).find('.sub_test_area').each(function(j, om){
							if(j != 0){
								$(this).find('.sub_info').hide();
							}
						});
					}
				});
				
				$('.sub_test_area').each(function(i, obj){
					var part_id = $(this).attr('data-struct-part-id');
					if($.inArray(part_id, part_ids) != -1){
						$(this).closest('.test_sub_area').find('.sub_test_area').each(function(j, om){
							if(j != 0){
								$(this).find('.sub_info').hide();
							}
						});
					}
				});
			},
			/**
			 * 设置短文理解(1701)
			 */
			setDWLJTest : function(){
				$('.test_content[data-subtype="1701"]').each(function(i, obj){
					var question_container = $(this).find('.question_container:first');
					var option_box = $(this).find('.option_box');
					option_box.prev('.qs_t').addClass('box_option_content');
					question_container.before(option_box.prev('.qs_t'));
					$(this).find('.question_content[data-test-mold=5]').each(function(){
						var select = $(this).find('select');
						select.html('<option class="gettheanswerfromhere" value="">请选择...</option>');
						option_box.find('.box_item').each(function(){
							var option = $(this).attr("data-option");
							var num_value = $(this).attr("data-value");
							select.append('<option class="gettheanswerfromhere" data-value="' + num_value + '" value="'+option+'">'+option+'</option>');
						});
					});
				});
			},
			/**
			 * 设置信息转述与询问显示情况(7100)
			 */
			setXSZSTest : function(){
				// 按钮区域
				var btn_area = '<div class="dib-wrap p_operationBtn_container"></div>';
				// 7100试题特殊处理
				$('.test_content[data-type="7100"]').each(function(i, obj){
					// 第一部分位置
					var that = $(this).find('.question_container .question_content .question_p.china:eq(1)');
					// 是否存在按钮区
					if(!$(that).next().hasClass('p_operationBtn_container')){
						$(that).after(btn_area);
					}
				});
			},
			/**
			 * 设置情景问答试题显示情况
			 */
			setQjTest : function(){
				// 循环处理情景问答试题
				$('.test_content[data-type="1500"]').each(function(i, obj){
					// 子类型
					var sub_type = $(obj).attr('data-subtype');
					// 符合要求子类型
					if(sub_type == 1522 || sub_type == 1523 || sub_type == 1524 || sub_type == 1528 || sub_type == 1530 || sub_type == 1537 
							|| sub_type == 1539 || sub_type == 1540){
						// 问题
						var question_str = '';
						// 循环获取问题
						$(obj).find('.china_q').each(function(j, o){
							if($(o).html() != '' && $(o).html() != null && $(o).html() != undefined){
								question_str += '<div class="dib dib-wrap question_content_str">' 
									+ '<div class="dib question_content_str_num">' + (j+1) + '.</div>'
									+ '<div class="dib question_content_str_info">' + $(o).html() + '</div>' + '</div>';
							}
						});
						// 显示问题
						if(sub_type == 1540){
							$(obj).find('.question_container .question_content').append(question_str);
                            // 删除对象
                            $(obj).find('.china_q').remove();
						}else{
							$(obj).find('.question_container .question_content').html(question_str);
                            //当前页面地址
                            var pathname = window.location.pathname;
                            // 删除对象(考试系统不用删)
                            if(pathname.indexOf('Exam') == -1){
                                $(obj).find('.china_q').remove();
                            }
						}
					}else if(sub_type == 1514 || sub_type == 1529 || sub_type == 1526 || sub_type == 1527){
						// 问题
						var question_str = '';
						// 循环获取问题
						$(obj).find('.question_li .speak_sentence.question').each(function(j, o){
							if($(o).html() != '' && $(o).html() != null && $(o).html() != undefined){
								question_str += '<div class="dib dib-wrap question_content_str">' 
									+ '<div class="dib question_content_str_info">' + $(o).html() + '</div>' + '</div>';
							}
						});
						// 显示问题
						$(obj).find('.question_container .question_content').html(question_str);
					}else if((sub_type == 1508 || sub_type == 1520 || sub_type == 1511 || sub_type == 1538) && TinSoConfig.host.indexOf('student') == -1){//除学生端，情景问答显示问题
						// 问题obj
						var question_obj = $(obj).find('.question_container .question_content');
                        // 问题
                        var question_str = '';
                        // 先清空内容
                        question_obj.html('');
                        $(obj).find('.question_division_line').find('.question_li').each(function(j, o){
                            if($(o).html() != '' && $(o).html() != null && $(o).html() != undefined){
                                // 获取问题
                                question_str += '<p>' + $(o).children(':first').html() + '</p>';
                            }
						});
                        // 显示问题
                        question_obj.html(question_str);
					}else if(sub_type == 1541){
						// 听力内容
						var str = $(obj).find('.listening_text .listening_text_p').html();
						// 显示信息
						$(obj).find('.question_container .question_content').html(str);
						$(obj).find('.question_container .question_content p').attr('style', 'text-indent: 2em;');
					}
				});
			},
			/**
			 * 点击小题或者大题，选中题目
			 * @param mixed param 小题题号或event对象
			 */
			select : function(param){
				var index;	//	选中的题号
				
				if(typeof param == 'number' && (page_mode || type == 'preview')){
					index = param;
					if(is_primary){
						$('.test_sub_area').removeClass('current_area');
						$('.test_content[data-test-index=' + index + ']').closest('.test_sub_area').addClass('current_area');
						$('.test_content').removeClass('current_test');
						$('.test_content[data-test-index=' + index + ']').addClass('current_test');
					}else{
						$('.question_container').removeClass('current_question');
						$('.question_container[data-qid=' + index + ']').addClass('current_question');
						$('.test_content').removeClass('current_test');
						$('.question_container[data-qid=' + index + ']').closest('.test_content').addClass('current_test');
					}
					$('.p_answer_list ul li').removeClass('as_current');
					$('.p_answer_list ul li[data-index=' + index + ']').addClass('as_current');
				}else if(typeof param == 'object' && param.target !== undefined && (page_mode || type == 'preview')){
					if(is_primary){
						return;
					}
					var e = param;
					var test_content = $(e.target).closest('.test_content');
 					var question_cnt = $(e.target).closest('.question_container');
 					var count = test_content.attr('data-count');
 					
 					if(!test_content.hasClass('current_test')){
 						$('.test_content').removeClass('current_test');
						test_content.addClass('current_test');
 					}
 					//	点击在小题区域上
 					if(question_cnt.length != 0){
 						$('.question_container').removeClass('current_question');
 						question_cnt.addClass('current_question');
 						index = question_cnt.attr('data-qid');
 					}
 					//	未点击在小题上，且该大题没有被选中的小题
 					else if(test_content.find('.current_question').length == 0){
 						$('.question_container').removeClass('current_question');
 						test_content.find('.question_container').first().addClass('current_question');
 						index = test_content.find('.question_container').first().attr('data-qid');
 					}
 					//	未点击在小题上，且该大题有被选中的小题
 					else{
 						return false;
 					}
 					$('.p_answer_list ul li').removeClass('as_current');
 					$('.p_answer_list ul li[data-index=' + index + ']').addClass('as_current');
 					
					// 定位试题
					var li_top = $('.p_answer_list ul li[data-index=' + index + ']').offset().top;
					// 答题卡顶部高度
					var answer_list_top = $('.p_answer_list').offset().top;
					// 滚动条位置
					var answer_list_scroll_top= $('.p_answer_list').scrollTop();
					// 滚动条滚动
					$('.p_answer_list').stop().animate({scrollTop : (li_top - answer_list_top + answer_list_scroll_top) + 'px'}, 0);
				}
				
				$('.p_switch_current span').text(index);
				
				// 是否为小学
				if(is_primary){
					practice.primary.question.setStyle();
				}
			},
			/**
			 * 设置试题编号及阅读材料横线编号
			 */
			setTestNumber : function(){
				// 小学
				if(is_primary){
					$('.test_content').each(function(i, n){
						$(n).attr('data-test-index', (i+1));
					});
					return;
				}
				if(type != 'wrong'){
					temp_id = 0;
				}
				if(!page_mode && window.location.pathname == '/Homework/newHomework.html'){
					// 试题编号(小题)
					$('.homework_area.editModel .question_id').each(function(i, n){
						$(this).html((temp_id +　i + 1) + '.'); 
						$(this).closest('.question_container').attr('data-qid', (temp_id　+ i + 1));
					});
				}else{
					// 试题编号(小题)
					$('.question_id').each(function(i, n){
						$(this).html((temp_id +　i + 1) + '.'); 
						$(this).closest('.question_container').attr('data-qid', (temp_id　+ i + 1));
					});
				}
				
				//	阅读材料横线编号
				$('.text_content').has($('.readingBlk_num')).each(function(i, n){
					var startNum = parseInt($(n).closest('.test_content').find('.question_container').attr('data-qid'));
					$(n).find('.readingBlk_num').each(function(j, m){
						$(m).text(j + startNum);
					});
				});
				practice.count = $('.question_id').length;
			},
			/**
			 * 设置选项长度
			 */
			setOption : function(removeABC){
				// 小学练习有的ABC用图片显示，不需要文字，需要将文字移除
				removeABC = removeABC || false;
				var abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
				//设置选项长度
				$('.question_content').each(function(){
					var sub_type = $(this).closest('.test_content').attr('data-subtype');
					var lengthArr = new Array();
					var option_label = $(this).find('.option_label');
					// 选项区域总宽度
					var width = !is_primary ? $(this).width() : $('.primary_test_question_cnt').width() * 0.7;
					// 选项宽度数组
					option_label.each(function(i, n){
						// 小学的除图片排序外的选项独占一行
						if(is_primary){
							if(sub_type != 1121 && sub_type != 1122 && sub_type != 1123 && sub_type != 1124){
								$(this).css('width', width).attr('data-option', abc[i]);
							}
							if(removeABC === true){
								var input_obj = $(this).find('input');
								// 有图片
								if($(this).find('img').length > 0 
										|| (sub_type == 1121 || sub_type == 1122 || sub_type == 1123 || sub_type == 1124)){
									var opt_content = $(this).find('img').prop('outerHTML');
								}else{
									// 去除选项中的A. B. C.
									var opt_content = $(this).text();
									if(opt_content.match(/[ABCDEFG]\.(\s)?/)){
										opt_content = opt_content.replace(/[ABCDEFG]\.(\s)?/, '');
									}
								}
								$(this).html(input_obj);
								opt_content = '<div class="opt_content">' + opt_content + '</div>';
								$(this).find('input').after(opt_content);
							}
							return true;
						}
						// jquery的width()和css('width')最终获取的是offsetWidth(int)(jquery 6953行)。如果宽度不是整数，存在误差！
						// 获取计算的宽度
						if(this.currentStyle){
							var each_width = this.currentStyle.width;
						}else{
							var each_width = parseFloat(document.defaultView.getComputedStyle(this, null).width);
						}
						lengthArr.push(each_width);
					});
					// 最长选项的宽度
					var maxLength = Math.max.apply(null, lengthArr);
					//平均宽度
					var	avg_length = width / lengthArr.length;
					
					if(maxLength < avg_length){
						option_label.css('width',avg_length);
					}else{
						if(lengthArr.length % 2){
							option_label.css('width',width);	
						}else{
							if(maxLength > width/2){
								option_label.css('width',width);	
							}else{
								option_label.css('width',width/2);	
							}
						}
					}
					option_label.addClass('dib');
				});
			},
			/**
			 * 如果图片宽度过大，缩小
			 */
			setImgSize : function(){
				$('.p_tests_area,.homework_box').find('img').each(function(i, n){
					if($(n).context.previousSibling == null
						&& $(n).context.nextSibling == null
						&& $(n).parent()[0].nodeName == 'P'
					){
						$(n).parent().css({
							'text-indent' : '0px',
							'text-align' : 'center'
						});
					}
					// 图片加载完成之后进行判断
					$(n).load(function(){
						if($(n).width() > $(n).parent().width()){
							$(n).width($(n).parent().width());
						}
					});
				});
			},
			/**
			 * 试题加入题库或移除题库状态
			 */
			setTestStatus : function(){
				// 试题加入题库或移除题库
				$('.test_content').each(function(i,n){
					// 设置加入/移出题库标志
			 		var bank_flag = $(this).attr('data-bankflag');
					var add_div = '<span class="dib add_to_bank stars" title="加入我的题库"></span>';
					var remove_div = '<span class="dib remove_from_bank stars" title="移出我的题库"></span>';
					if(bank_flag == 1){
						$(this).find('.qid_area:first').append(remove_div);
					}else{
						$(this).find('.qid_area:first').append(add_div);	
					}

				});
			},
			/**
			 * 听录音选图需要在一行显示图片
			 */
			setVideoImg : function(){
				// 听录音选图需要在一行显示图片
				$('.test_content[data-type="1100"] label').addClass('img_label');
			},
			/**
			 * 给大题加底线
			 */ 
			setBoldLine : function(){
				var num = $('.test_sub_area').length;
				$('.test_sub_area').each(function(i, obj){
					if((i + 1) < num){
						$(this).append('<div class="bold_line_class"></div>');
					}
				});
			},
			/**
			 * 去除空白行
			 */
			removeWhite : function(){
				$('.question_content .question_p').each(function(){
					var sub_type = $(this).closest('.test_content').attr('data-subtype');
					if(sub_type == 1227 || sub_type == 1228){
						
					}else{
						var text = $(this).html();	
						if($.trim(text) == ''){
							$(this).remove();
						}
					}
				});
			},
			/**
			 * 初始化按钮
			 */
			initButton : function(){
				// 听力按钮
				if(!is_primary){
					$('.test_content[data-kind="1"] .p_operationBtn_container').html($('#listentBtnTemp').template());
				}else{
					$('.test_content[data-kind="1"] .p_operationBtn_container').html($('#primaryListenBtnTemp').template());
				}
				// 口语按钮
				$('.test_content[data-kind="2"] .p_operationBtn_container').each(function(i, n){
					var main_type = $(n).closest('.test_content').attr('data-type');
					var sub_type = $(n).closest('.test_content').attr('data-subtype');
					// 需要强化练习的题型
					if(main_type == 1400 && sub_type != 1428 && sub_type != 1438 && $('#speackingBtnBTemp').length != 0){
						$(n).html($('#speackingBtnBTemp').template());
					}
					// 小学连词成句
					else if(main_type == 6100 && $('#speackingBtnLCCJTemp').length != 0){
						$(n).html($('#speackingBtnLCCJTemp').template());
					}
					// 基本模式练习的题型
					else{
						$(n).html($('#speackingBtnTemp').template());
					}
				});
				if($('.test_content[data-kind="2"] .p_operationBtn_container input').length){
					$('.test_content[data-kind="2"] .p_operationBtn_container input').iCheck({
						radioClass: 'iradio_square-green',
						increaseArea: '20%' // optional
					});
				}
				// 7100特殊题型
				$('.test_content[data-type="7100"]').each(function(i, obj){
					// 按钮区不唯一
					if($(this).find('.p_operationBtn_container').length == 2){
						$(this).find('.p_operationBtn_container:eq(0) .right_area').html('');
					}
				});
				
				// 小学三会四会的听力题型以及知识点试题中的口语题型
				$('.test_content[data-type="6300"][data-kind="1"],.test_content[data-subtype="6403"],.test_content[data-subtype="6406"],.test_content[data-subtype="6410"],.test_content[data-subtype="6413"],.test_content[data-subtype="6417"],.test_content[data-subtype="6420"],.test_content[data-subtype="6424"],.test_content[data-subtype="6427"]').each(function(i, obj){
					$(obj).find('.p_operationBtn_container').addClass('knowledge_test_btn_container').html($('#kSpeackingBtnTemp').template());
				});
				
				// 阅读选择、阅读判断
				$('.test_content[data-subtype="2907"], .test_content[data-subtype="2908"], .test_content[data-subtype="3307"], .test_content[data-subtype="3308"]').each(function(i, obj){
					$(obj).find('.p_operationBtn_container').html($('#readQuestionBtnTemp').template());
				});
			}
		},
		/**
		 * 练习时间对象
		 */
		testTime : {
			/**
			 * 计算练习时间
			 */
			calculateTime : function(val){
				if($('#test-mode[data-mode="free"]').is(':checked')){
					$('.p_answerSheet_cnt .practice_time').html('用时');
				}else{
					$('.p_answerSheet_cnt .practice_time').html('剩余');
				}
				// 计算练习用时并倒计时(学生端)
				if(page_mode){
					// 页面类型
					var source = $('.p_paper_cnt').attr('data-source');
					// 作业结构类型
					var struct_type = $('.p_paper_cnt').attr('data-struct-type');
					// 练习模式
					var mode = $('.p_operation_box #test-mode').attr('data-mode');
					// 总时间(秒)
					if(mode == 'exam' && (source == 'ts' || source == 'unit')){
						total_time = $('.p_paper_cnt').attr('data-need-time') * 60;
					}else{
						total_time = $('.p_paper_cnt').attr('data-need-time') * 60;
					}
					
					// 如果初始化了录音模块
					if(!!TSP.audio.recorder && !!TSP.audio.recorder.config){
						var audio_dialog_key = setInterval(function(){
							// 录音模块初始化对话框存在且消失或麦克风开启失败，且音频文件加载完毕
							if(((TSP.audio.recorder.inited && $('#TinSoAudioModuleLoadMessageBox').length == 0)
								|| TSP.audio.recorder.inited === false)
								&& TSP.audio.files.length == TSP.audio.files.loaded
							){
								// 自由普通作业的自由练习模式，正计时
								if(source == 'hw' && (struct_type == 1 || struct_type == 2) && mode == 'free'){
									if(val != 1){
										// 正计时时间初始化
										time = 0;
									}
									// 答题时间过长，提示交卷时间，最初为3小时。若提示过后依然选择继续答题，时间递增半小时。
									var time_prompt = 10800;
									practice.testTime.positiveTime(time_prompt);
								}else{
									count_down_time = total_time;
									// 倒计时,单位：秒  练习总时间
									practice.testTime.countdown();
								}
								clearInterval(audio_dialog_key);
							}
						}, 100);
					}else{
						var loaded_dialog_key = setInterval(function(){
							// 音频文件加载完毕
							if(TSP.audio.files.length == TSP.audio.files.loaded){
								// 自由练习的作业类型，正计时
								if(source == 'hw' && (struct_type == 1 || struct_type == 2) && mode == 'free'){
									// 正计时时间初始化
									time = 0;
									// 答题时间过长，提示交卷时间，最初为3小时。若提示过后依然选择继续答题，时间递增半小时。
									var time_prompt = 10800;
									practice.testTime.positiveTime(time_prompt);
								}else{
									count_down_time = total_time;
									// 倒计时,单位：秒  练习总时间
									practice.testTime.countdown();
								}
								clearInterval(loaded_dialog_key);
							}
						}, 100);
					}
				}
			},
			/**
			 * 计时,单位：秒
			 */
			countdown : function(){
				if($('#test-mode[data-mode="free"]').is(':checked')){
					$('.p_answerSheet_cnt .practice_time').html('用时');
					time_id = setInterval(practice.testTime.timeCount, 1000);
				}else{
					$('.p_answerSheet_cnt .practice_time').html('剩余');
					time_id = setInterval(practice.testTime.timer, 1000);
				}
			},
			/**
			 * 时间倒计时器
			 */
			timer : function(){
				var h = Math.floor(count_down_time / 3600);//时
				var m = Math.floor((count_down_time - h * 3600) / 60);//分
				var s = count_down_time - h * 3600 - m * 60;//秒
				$('.countdown_hour').html(h < 10 ? '0' + h : h);
				$('.countdown_minute').html(m < 10 ? '0' + m : m);
				$('.countdown_second').html(s < 10 ? '0' + s : s);
				count_down_time--;
				time++;
				s--;
				if(s < 0){
					s = 59;
					m--;
				}
				if(m < 0){
					m = 59
					h--;
				}
				if(count_down_time < 0){
					// 停止时间
					clearInterval(time_id);
					
					// 练习模式
					var mode = $('.p_operation_box #test-mode').attr('data-mode');
					// 资源
					var source = $('.p_paper_cnt').attr('data-source');
					// 结构类型
					var struct_type = $('.p_paper_cnt').attr('data-struct-type');
					// 自动练习模式
					if(mode == 'exam' 
						&& (	
								(source == 'ts' || source == 'unit') // 单元测试、人机对话的考试模式
								|| (source == 'hw' && (struct_type == 2 || struct_type == 3))	// 作业的试卷考试模式
							)
					){
						return false;
					}
					if(type == 'competition' || type == 'competition_preview'){
						TSP.practice.process.submitAnswerCheck();
					}else{
						MessageBox({
							content : '答题时间到，提交答案或返回？点击提交答案查看练习结果，点击返回回到前一页面。',
							buttons : [{
								text : '提交答案',
								click : function(){
									$( this ).dialog('close');
									// 提交试卷
									TSP.practice.process.submitAnswerCheck();
									
								}
							},
							{
								text : '返  回',
								click : function(){
									$(this).dialog('close');
									//返回前一页面
									TSP.practice.process.backToSource();
								}
							}]
						});
					}					
				}
			},
			/**
			 * 计时器
			 */
			timeCount : function(){
				var h = Math.floor(time / 3600);//时
				var m = Math.floor((time - h * 3600) / 60);//分
				var s = time - h * 3600 - m * 60;//秒
				$('.countdown_hour').html(h < 10 ? '0' + h : h);
				$('.countdown_minute').html(m < 10 ? '0' + m : m);
				$('.countdown_second').html(s < 10 ? '0' + s : s);
				time++;
				s++;
				if(s > 59){
					s = 0;
					m++;
				}
				if(m > 59){
					m = 0;
					h++;
				}
			},
			/**
			 * 正计时，时间过长提示交卷
			 * @param prompt 提示交卷时间
			 */
			positiveTime : function(prompt){
				$('.p_answerSheet_cnt .practice_time').html('用时');
				time_id = setInterval(function(){
					if(time >= prompt){
						clearInterval(time_id);
						MessageBox({
							content : '答题时间过长，是否提交答案？',
							buttons : [
							    {
							    	text : '提交答案',
							    	click : function(){
										$( this ).dialog('close');
										// 提交试卷
										TSP.practice.process.submitAnswerCheck();
									}
								},
								{
									text : '继续答题',
									click : function(){
										$(this).dialog('close');
										practice.testTime.positiveTime(prompt + 1800);
									}
								}
							]
						});
					}
					practice.testTime.timeCount();
				}, 1000);
			},
			/**
			 * 时间显示
			 */
			setPracticeTime : function(time){
				$('.time_box .practice_time').html('用时');
				var h = Math.floor(time / 3600);//时
				var m = Math.floor((time - h * 3600) / 60);//分
				var s = Math.ceil(time - h * 3600 - m * 60);//秒
				$('.countdown_hour').html(h < 10 ? '0' + h : h);
				$('.countdown_minute').html(m < 10 ? '0' + m : m);
				$('.countdown_second').html(s < 10 ? '0' + s : s);
			}
		},
		// 试题展示
		parseTest : {
			/**
			 * 试卷试题解析
			 * structObj 对应结构
			 * parseTests 试题数据
			 */
			initPaperTest : function(structObj, parseTests){
				// 结构信息
				var struct = structObj['struct'];
				// 结构说明信息
				var structParts = structObj['structParts'];
				// 结构详细信息
				var structureInfos = structObj['structureInfos'];
				// 整理后数据
				var tests = new Object();
				// 作业总分
				var tatol_score = 0;
				// 预计用时
				var tatol_need_time = 0;
				// 同一主题型试题序号 默认第一题
				var index_order = 1;
				// 保存已去除的试题数组下标
				var indexs = new Array();
				
				// 相关配置
				config = new Object();
				if(parseTests[0].config){
					// 选项随机数
					config = parseTests[0].config;
				}
				
				// 整理试题数据
				$.each(structureInfos, function(i, structureInfo){
					// 试题数量
					var testNum = structureInfo['test_num'];

					// 结构说明id
					var structPartId = structureInfo['struct_part_id'];
					
					// 试题整理数据
					var structInfoTest = new Array();
					
					// 序号
					if(i > 0 && structureInfo['sub_type'] == structureInfos[i-1]['sub_type']){
						index_order ++;
						structureInfo['index_order'] = index_order;
					}else{
						index_order = 1;
						structureInfo['index_order'] = index_order;
					}

					// 循环获取试题
					$.each(parseTests, function(j, test){
						// 每道题的分数
						var score = 0;
						// 问题数
						var question_num = test['question_num'];
						// 1610题型
						if(test['sub_type'] == 1610){
							question_num = 1;
						}else if(test['main_type'] == 7100){
							question_num = 3;
						}
						// 分数数组
						var scores = structureInfo['score'].split('|');
						// 累加试题分数
						for(var k = 0; k < question_num; k++){
							score += parseFloat(k >= scores.length - 1 ? scores[0] : scores[k]);
						}
						// 子类型存在
						if(testNum >0 && ((indexs.length && $.inArray(j, indexs) == -1) || indexs.length == 0)){
							// 子类型一样
							if(structureInfo['sub_type'].indexOf(test['sub_type']) != -1){
								// 试题数量减一
								testNum--;
								// 保存数据
								test['need_time'] = parseInt(structureInfo['need_time']);
								structInfoTest.push(test);
								// 保存需要删除的数组下标
								indexs.push(j);
								// 总时间
								tatol_need_time += parseInt(structureInfo['need_time']);
								// 作业总分
								tatol_score += score;
							}
						// 主类型存在
						}else if(testNum >0 && ((indexs.length && $.inArray(j, indexs) == -1) || indexs.length == 0)){
							// 主类型一样
							if(test['main_type'] == structureInfo['main_type']){
								// 试题数量减一
								testNum--;
								// 保存数据
								test['need_time'] = parseInt(structureInfo['need_time']);
								structInfoTest.push(test);
								// 保存需要删除的数组下标
								indexs.push(j);
								
								// 总时间
								tatol_need_time += parseInt(structureInfo['need_time']);
								// 作业总分
								tatol_score += score;
							}
						}
					});

					// 类型试题数量足够
					if(testNum == 0){
						structureInfos[i]['test_num_status'] = false;
					}else{
						structureInfos[i]['test_num_status'] = true;
					}
															
					// 不为空
					if(structInfoTest.length > 0){
						// 如果不存在
						if(tests[structPartId] == undefined){
							tests[structPartId] = {'struct_part_id' : structPartId, 
									'part_name' : structParts[structPartId]['name'], 
									'struct_order' : structParts[structPartId]['struct_order'], 
									'bshow' : structParts[structPartId]['bshow'] === false ? false : true,
									'struct_info' : new Object()};
						}
						
						// 整理数据
						structureInfo['tests'] = structInfoTest;
						
						// 试题数据
						tests[structPartId]['struct_info'][structureInfo['id']] = structureInfo;
					}
				});
				
				// 试题没有匹配完，以主类型匹配试题
				if(indexs.length < parseTests.length){
					// 循环结构
					$.each(structureInfos, function(i, structureInfo){
						// 结构试题数量完整
						if(structureInfo['test_num_status']){
							// 试题数量
							var testNum = structureInfo['test_num'];
							
							// 结构说明id
							var structPartId = structureInfo['struct_part_id'];
							
							// 试题整理数据
							var structInfoTest = new Array();
							
							// 序号
							if(i > 0 && structureInfo['sub_type'] == structureInfos[i-1]['sub_type']){
								index_order ++;
								structureInfo['index_order'] = index_order;
							}else{
								index_order = 1;
								structureInfo['index_order'] = index_order;
							}
							
							// 循环获取试题
							$.each(parseTests, function(j, test){
								// 每道题的分数
								var score = 0;
								// 问题数
								var question_num = test['question_num'];
								// 1610题型
								if(test['sub_type'] == 1610){
									question_num = 1;
								}
								// 分数数组
								var scores = structureInfo['score'].split('|');
								// 累加试题分数
								for(var k = 0; k < question_num; k++){
									score += parseFloat(k >= scores.length - 1 ? scores[0] : scores[k]);
								}
								
								// 主类型一样
								if(testNum >0 && test['main_type'] == structureInfo['main_type'] 
									&& ((indexs.length && $.inArray(j, indexs) == -1) || indexs.length == 0)){
									// 试题数量减一
									testNum--;
									// 保存数据
									test['need_time'] = parseInt(structureInfo['need_time']);
									structInfoTest.push(test);
									// 保存需要删除的数组下标
									indexs.push(j);
									
									// 总时间
									tatol_need_time += parseInt(structureInfo['need_time']);
									// 作业总分
									tatol_score += score;
								}
							});
							
							// 不为空
							if(structInfoTest.length > 0){
								// 如果不存在
								if(tests[structPartId] == undefined 
										|| tests[structPartId]['struct_info'][structureInfo['id']] == undefined){
									if(tests[structPartId] == undefined){
										tests[structPartId] = {'struct_part_id' : structPartId, 
												'part_name' : structParts[structPartId]['name'], 
												'struct_order' : structParts[structPartId]['struct_order'], 
												'bshow' : structParts[structPartId]['bshow'] === false ? false : true,
												'struct_info' : new Object()};
									}
									
									// 整理数据
									structureInfo['tests'] = structInfoTest;
									// 试题数据
									tests[structPartId]['struct_info'][structureInfo['id']] = structureInfo;
								}else{
									// 试题数据
									var tmpTestArr = tests[structPartId]['struct_info'][structureInfo['id']]['tests'];
									// 循环添加数据
									$.each(structInfoTest, function(ii, vvk){
										tmpTestArr.push(vvk);
									});
									tmpTestArr.sort(function(a, b) {
						                if (a['test_order'] > b['test_order']) {
						                    return 1;
						                } else if (a['test_order'] < b['test_order']) {
						                    return -1;
						                } else {
						                    return 0;
						                }
						            });
									// 试题数据
									tests[structPartId]['struct_info'][structureInfo['id']]['tests'] = tmpTestArr;
								}
							}
						}
					});
				}
				
				// 试题没有匹配完，以主类型匹配试题
				if(indexs.length < parseTests.length){
					// 循环结构
					$.each(structureInfos, function(i, structureInfo){
						// 结构说明id
						var structPartId = structureInfo['struct_part_id'];
						
						// 试题整理数据
						var structInfoTest = new Array();
						
						// 序号
						if(i > 0 && structureInfo['sub_type'] == structureInfos[i-1]['sub_type']){
							index_order ++;
							structureInfo['index_order'] = index_order;
						}else{
							index_order = 1;
							structureInfo['index_order'] = index_order;
						}
						// 循环获取试题
						$.each(parseTests, function(j, test){
							// 每道题的分数
							var score = 0;
							// 问题数
							var question_num = test['question_num'];
							// 1610题型
							if(test['sub_type'] == 1610){
								question_num = 1;
							}
							// 分数数组
							var scores = structureInfo['score'].split('|');
							// 累加试题分数
							for(var k = 0; k < question_num; k++){
								score += parseFloat(k >= scores.length - 1 ? scores[0] : scores[k]);
							}
							
							// 主类型一样
							if(test['main_type'] == structureInfo['main_type'] 
								&& ((indexs.length && $.inArray(j, indexs) == -1) || indexs.length == 0)){
								// 保存数据
								test['need_time'] = parseInt(structureInfo['need_time']);
								structInfoTest.push(test);
								// 保存需要删除的数组下标
								indexs.push(j);
								
								// 总时间
								tatol_need_time += parseInt(structureInfo['need_time']);
								// 作业总分
								tatol_score += score;
							}
						});
						
						// 不为空
						if(structInfoTest.length > 0){
							// 如果不存在
							if(tests[structPartId] == undefined 
									|| tests[structPartId]['struct_info'][structureInfo['id']] == undefined){
								if(tests[structPartId] == undefined){
									tests[structPartId] = {'struct_part_id' : structPartId, 
											'part_name' : structParts[structPartId]['name'], 
											'struct_order' : structParts[structPartId]['struct_order'], 
											'bshow' : structParts[structPartId]['bshow'] === false ? false : true,
											'struct_info' : new Object()};
								}
								
								// 整理数据
								structureInfo['tests'] = structInfoTest;
								// 试题数据
								tests[structPartId]['struct_info'][structureInfo['id']] = structureInfo;
							}else{
								// 试题数据
								var tmpTestArr = tests[structPartId]['struct_info'][structureInfo['id']]['tests'];
								// 循环添加数据
								$.each(structInfoTest, function(ii, vvk){
									tmpTestArr.push(vvk);
								});
								tmpTestArr.sort(function(a, b) {
					                if (a['test_order'] > b['test_order']) {
					                    return 1;
					                } else if (a['test_order'] < b['test_order']) {
					                    return -1;
					                } else {
					                    return 0;
					                }
					            });
								// 试题数据
								tests[structPartId]['struct_info'][structureInfo['id']]['tests'] = tmpTestArr;
							}
						}
					});
				}
				
				// 有口语练习标识
				var kyKindFlag = false;
				
				// 判断是否只有口语练习
				$.each(parseTests, function(i, obj){
					if(obj['kind'] == 2){
						kyKindFlag = true;
					}
				});
				
				// 试卷时间
				if(struct['need_time'] > 0){
					tatol_need_time = 10 + parseInt(struct['need_time']);
				}else{
					tatol_need_time = 10 + Math.ceil(tatol_need_time/60);
				}
				
				tatol_score = Math.formatFloat(tatol_score);
				
				// 存在
				if($('.p_paper_cnt').length){
					// 时间
					$('.p_paper_cnt').attr('data-need-time', tatol_need_time);
					// 作业分数
					$('.p_paper_cnt').attr('data-tatol-score', tatol_score);
				}
				// 存在
				if($('.edit_homework .info_time').length){
					// 时间
					$('.edit_homework .info_time').attr('data-time', tatol_need_time).html(tatol_need_time);
				}
				// 存在
				if($('.edit_homework .info_score').length){
					// 作业分数
					$('.edit_homework .info_score').attr('data-score', tatol_score).html(tatol_score);
				}
				// 存在
				if($('.new_homework_cnt').length){
					// 作业预计时间
					$('.new_homework_cnt').attr('data-time', tatol_need_time);
					// 作业分数
					$('.new_homework_cnt').attr('data-score', tatol_score);
				}
				
				// 排序
				$.each(tests, function(i, obj){
					// 试题内容
					var tmpTests = new Object();
					// 循环处理数据
					$.each(obj['struct_info'], function(j, o){
						tmpTests[o['test_order']] = o;
					});
					// 保存数据
					tests[i]['struct_info'] = tmpTests;
				});
				
				return tests;
			},
			/**
			 * 六项普通练习解析
			 */
			initTest : function(structObj, parseTests){
				// 结构信息
				var struct = structObj['struct'];
				// 结构说明信息
				var structParts = structObj['structParts'];
				// 结构详细信息
				var structureInfos = structObj['structureInfos'];
				// 整理后数据
				var tests = new Object();
				// 预计用时
				var tatol_need_time = 0;
				// 作业总分
				var tatol_score = 0;
				// 保存需要删除的数组下标
				var indexs = new Array();
				// 相关配置
				config = null;
				if(parseTests[0].config){
					// 选项随机数
					config = parseTests[0].config;
				}
				
				// 结构包含的所有子类型
				var subTypes = new Array();
				// 整理试题数据
				$.each(structureInfos, function(i, structureInfo){
					subTypes.push(structureInfo['sub_type']);
				});
				
				// 整理试题数据
				$.each(structureInfos, function(i, structureInfo){
					// 结构说明id
					var structPartId = structureInfo['struct_part_id'];
					
					// 试题整理数据
					var structInfoTest = new Array();
					
					// 循环获取试题
					$.each(parseTests, function(j, test){
						// 每道题的分数
						var score = 0;
						// 问题数
						var question_num = test['question_num'];
						// 1610题型
						if(test['sub_type'] == 1610){
							question_num = 1;
						}
						// 分数数组
						var scores = structureInfo['score'].split('|');
						// 累加试题分数
						for(var k = 0; k < question_num; k++){
							score += parseFloat(k >= scores.length - 1 ? scores[0] : scores[k]);
						}
						
						// 子类型存在
						if(structureInfo['sub_type'] > 0){
							// 子类型一样
							if(test['sub_type'] == structureInfo['sub_type'] && $.inArray(j, indexs) == -1){
								// 序号
								test['index'] = j;
								// 保存数据
								structInfoTest.push(test);
								// 保存需要删除的数组下标
								indexs.push(j);
								
								// 预计用时
								tatol_need_time += parseInt(structureInfo['need_time']);
								// 作业总分
								tatol_score += score;
							// 子类型不一样， 主类型一样；且子类型不在结构包含的所有子类型中
							}else if($.inArray(test['sub_type'], subTypes) == -1 && test['main_type'] == structureInfo['main_type'] && $.inArray(j, indexs) == -1){
								// 序号
								test['index'] = j;
								// 保存数据
								structInfoTest.push(test);
								// 保存需要删除的数组下标
								indexs.push(j);
								
								// 预计用时
								tatol_need_time += parseInt(structureInfo['need_time']);
								// 作业总分
								tatol_score += score;
							}
						// 主类型存在
						}else{
							// 主类型一样
							if(test['main_type'] == structureInfo['main_type'] && $.inArray(j, indexs) == -1){
								// 序号
								test['index'] = j;
								// 保存数据
								structInfoTest.push(test);
								// 保存需要删除的数组下标
								indexs.push(j);
								
								// 预计用时
								tatol_need_time += parseInt(structureInfo['need_time']);
								// 作业总分
								tatol_score += score;
							}
						}
					});
					
					// 不为空
					if(structInfoTest.length > 0){
						
						// 如果不存在
						if(tests[structPartId] == undefined){
							tests[structPartId] = {'struct_part_id' : structPartId, 'part_name' : structParts[structPartId]['name'], 
									'struct_order' : structParts[structPartId]['struct_order'], 'struct_info' : new Object()};
						}
						
						// 整理数据
						structureInfo['tests'] = structInfoTest;
						
						// 试题数据
						tests[structPartId]['struct_info'][structureInfo['id']] = structureInfo;
						
					}
				});
				
				// 有口语练习标识
				var kyKindFlag = false;
				
				// 判断是否只有口语练习
				$.each(parseTests, function(i, obj){
					if(obj['kind'] == 2){
						kyKindFlag = true;
					}
				});
				
				// 试卷时间
				if(kyKindFlag){
					tatol_need_time = Math.ceil(tatol_need_time*140/100/60);
				}else{
					tatol_need_time = Math.ceil(tatol_need_time*110/100/60);
				}
				
				tatol_score = Math.formatFloat(tatol_score);

				// 存在
				if($('.p_paper_cnt').length){
					// 时间
					$('.p_paper_cnt').attr('data-need-time', tatol_need_time);
					// 作业分数
					$('.p_paper_cnt').attr('data-tatol-score', tatol_score);
				}
				// 存在
				if($('.edit_homework .info_time').length){
					// 时间
					$('.edit_homework .info_time').attr('data-time', tatol_need_time).html(tatol_need_time);
				}
				// 存在
				if($('.edit_homework .info_score').length){
					// 作业分数
					$('.edit_homework .info_score').attr('data-score', tatol_score).html(tatol_score);
				}
				// 存在
				if($('.new_homework_cnt').length){
					// 作业预计时间
					$('.new_homework_cnt').attr('data-time', tatol_need_time);
					// 作业分数
					$('.new_homework_cnt').attr('data-score', tatol_score);
				}
				
				return tests;
			},
			/**
			 * 人机对话/笔试考场练习解析
			 */
			initTestByTsOrBs : function(struct, parseTests){
				// 整理后数据
				var tests = new Object();
				// 保存需要删除的数组下标
				var indexs = new Array();
				// 预计用时
				var tatol_need_time = 0;
				// 作业总分
				var tatol_score = 0;
				
				// 相关配置
				config = new Object();
				if(parseTests[0].config){
					// 选项随机数
					config = parseTests[0].config;
				}
				
				$.each(struct, function(i, structObj){
					// 结构信息
					var struct = structObj['struct'];
					// 结构说明信息
					var structParts = structObj['structParts'];
					// 结构详细信息
					var structureInfos = structObj['structureInfos'];
					
					// 结构包含的所有子类型
					var subTypes = new Array();
					// 整理试题数据
					$.each(structureInfos, function(i, structureInfo){
						subTypes.push(structureInfo['sub_type']);
					});
					
					// 整理试题数据
					$.each(structureInfos, function(i, structureInfo){
						// 结构说明id
						var structPartId = structureInfo['struct_part_id'];
						
						// 试题整理数据
						var structInfoTest = new Array();
						
						// 循环获取试题
						$.each(parseTests, function(j, test){
							// 每道题的分数
							var score = 0;
							// 问题数
							var question_num = test['question_num'];
							// 1610题型
							if(test['sub_type'] == 1610){
								question_num = 1;
							}
							// 分数数组
							var scores = structureInfo['score'].split('|');
							// 累加试题分数
							for(var k = 0; k < question_num; k++){
								score += parseFloat(k >= scores.length - 1 ? scores[0] : scores[k]);
							}
							
							// 子类型存在
							if(structureInfo['sub_type'] > 0){
								// 子类型一样
								if(test['sub_type'] == structureInfo['sub_type'] && $.inArray(j, indexs) == -1){
									// 序号
									test['index'] = j;
									// 保存数据
									structInfoTest.push(test);
									// 保存需要删除的数组下标
									indexs.push(j);
									// 预计用时
									tatol_need_time += parseInt(structureInfo['need_time']);
									// 作业总分
									tatol_score += score;
								// 子类型不一样， 主类型一样；且子类型不在结构包含的所有子类型中
								}else if($.inArray(test['sub_type'], subTypes) == -1 && test['main_type'] == structureInfo['main_type'] && $.inArray(j, indexs) == -1){
									// 序号
									test['index'] = j;
									// 保存数据
									structInfoTest.push(test);
									// 保存需要删除的数组下标
									indexs.push(j);
									// 预计用时
									tatol_need_time += parseInt(structureInfo['need_time']);
									// 作业总分
									tatol_score += score;
								}
							// 主类型存在
							}else{
								// 主类型一样
								if(test['main_type'] == structureInfo['main_type'] && $.inArray(j, indexs) == -1){
									// 序号
									test['index'] = j;
									// 保存数据
									structInfoTest.push(test);
									// 保存需要删除的数组下标
									indexs.push(j);
									// 预计用时
									tatol_need_time += parseInt(structureInfo['need_time']);
									// 作业总分
									tatol_score += score;
								}
							}
						});
						
						// 不为空
						if(structInfoTest.length > 0){
							// 如果不存在
							if(tests[structPartId] == undefined){
								tests[structPartId] = {'struct_part_id' : structPartId, 'part_name' : structParts[structPartId]['name'], 
										'struct_order' : structParts[structPartId]['struct_order'], 'struct_info' : new Object()};
							}
							
							// 整理数据
							structureInfo['tests'] = structInfoTest;
							
							// 试题数据
							tests[structPartId]['struct_info'][structureInfo['id']] = structureInfo;
							
						}
					});
					
				});
				
				// 有口语练习标识
				var kyKindFlag = false;
				
				// 判断是否只有口语练习
				$.each(parseTests, function(i, obj){
					if(obj['kind'] == 2){
						kyKindFlag = true;
					}
				});
				
				// 试卷时间
				if(kyKindFlag){
					tatol_need_time = Math.ceil(tatol_need_time*140/100/60);
				}else{
					tatol_need_time = Math.ceil(tatol_need_time*110/100/60);
				}
				
				tatol_score = Math.formatFloat(tatol_score);
				
				// 存在
				if($('.p_paper_cnt').length){
					// 时间
					$('.p_paper_cnt').attr('data-need-time', tatol_need_time);
					// 作业分数
					$('.p_paper_cnt').attr('data-tatol-score', tatol_score);
				}
				// 存在
				if($('.edit_homework .info_time').length){
					// 时间
					$('.edit_homework .info_time').attr('data-time', tatol_need_time).html(tatol_need_time);
				}
				// 存在
				if($('.edit_homework .info_score').length){
					// 作业分数
					$('.edit_homework .info_score').attr('data-score', tatol_score).html(tatol_score);
				}
				// 存在
				if($('.new_homework_cnt').length){
					// 作业预计时间
					$('.new_homework_cnt').attr('data-time', tatol_need_time);
					// 作业分数
					$('.new_homework_cnt').attr('data-score', tatol_score);
				}
				return tests;
			},
			/**
			 * 按试题顺序，套用结构解析
			 */
			initTestStruct : function(structObj, parseTests, isOrderByTest){
				// 结构信息
				var struct = structObj['struct'];
				// 结构说明信息
				var structParts = structObj['structParts'];
				// 结构详细信息
				var structureInfos = structObj['structureInfos'];
				// 整理后数据
				var tests = new Array();
				// 预计用时
				var tatol_need_time = 0;
				// 作业总分
				var tatol_score = 0;
				// 保存数组下标
				var index = 0;
				
				// 保存整理后的结构数据
				var structInfos = new Object();
				
				// 相关配置
				config = new Object();
				if(parseTests[0].config){
					// 选项随机数
					config = parseTests[0].config;
				}
				
				// 整理结构详细数据
				$.each(structureInfos, function(j, obj){
					// 主类型不存在
					if(structInfos[obj['main_type']] == undefined){
						structInfos[obj['main_type']] = new Object();
					}
					// 子类型不存在
					if(structInfos[obj['main_type']][obj['sub_type']] == undefined){
						structInfos[obj['main_type']][obj['sub_type']] = new Array();
					}
					// 保存结构
					structInfos[obj['main_type']][obj['sub_type']].push(obj);
				});
				
				// 循环获取数据
				while(true){
					// 循环结束判断
					if(index >= parseTests.length){
						break;
					}
					
					// 试题数组
					var tmpTests = new Array();
					
					// 比较的主类型
					var compare_main_type = 0;
					// 比较子类型
					var compare_sub_type = 0;
					
					// 起始标识
					var flag = true;
					// 结构数据
					var selectedStructInfo = null;
					
					// 循环试题
					for(var i = index; i < parseTests.length; i++){
						// 主类型
						var main_type = parseTests[i]['main_type'];
						// 子类型
						var sub_type = parseTests[i]['sub_type'];
						
						// 7100
						if(main_type == 7100){
							parseTests[i]['question_num'] = 3;
						}
						
						// 起始试题
						if(flag){
							// 结构详细信息子类型存在
							if(structInfos[main_type] != undefined && structInfos[main_type][sub_type]){
								// 结构数据
								if(structInfos[main_type][sub_type].length > 1){
									selectedStructInfo = deepCopy(structInfos[main_type][sub_type][0]);
									
									// 比较的主类型
									compare_main_type = 'main_type' + structInfos[main_type][sub_type].length + main_type;
									// 比较子类型
									compare_sub_type = 'sub_type' + structInfos[main_type][sub_type].length + sub_type;
									// 保存试题
									parseTests[i]['need_time'] = parseInt(selectedStructInfo['need_time']);
									tmpTests.push(parseTests[i]);
									// 起始标识
									flag = false;
									// 累加起始
									index++;
									
									// 删除数组数据
									structInfos[main_type][sub_type].splice(0, 1)
									
									continue;
								}else{
									selectedStructInfo = deepCopy(structInfos[main_type][sub_type][0]);
								}
							// 结构详细信息主类型存在
							}else if(structInfos[main_type]){
								// 通用结构标识
								var tmpStatus = false;
								// 循环获取结构信息
								$.each(structInfos[main_type], function(k, infoObj){
									if(k == 0){
										// 结构数据
										selectedStructInfo = infoObj;
										// 通用标识
										tmpStatus = true;
									}
									
									if(!tmpStatus){
										// 结构数据
										selectedStructInfo = infoObj;
									}
								});
							// 结构详细信息主类型不存在
							}else{
								// 累加起始
								index++;
								// 结束此次循环
								break;
							}

							if($.isArray(selectedStructInfo)){
								selectedStructInfo = selectedStructInfo[0];
							}

							// 比较的主类型
							compare_main_type = main_type;
							// 比较子类型
							compare_sub_type = sub_type;
							// 保存试题
							parseTests[i]['need_time'] = parseInt(selectedStructInfo['need_time']);
							parseTests[i]['score'] = selectedStructInfo['score'];
							tmpTests.push(parseTests[i]);
							// 起始标识
							flag = false;
							// 累加起始
							index++;
							// 下一题
							continue;
						}

						// 结构详细信息子类型存在
						if(structInfos[main_type] != undefined && structInfos[main_type][sub_type]){
							// 试题类型存在
							if(main_type == compare_main_type && sub_type == compare_sub_type){
								// 保存试题
								parseTests[i]['need_time'] = parseInt(selectedStructInfo['need_time']);
								parseTests[i]['score'] = selectedStructInfo['score'];
								tmpTests.push(parseTests[i]);
								// 累加起始
								index++;
								// 下一题
								continue;
							}else{
								// 结束此次循环
								break;
							}
						// 结构详细信息主类型存在、且存在通用结构
						}else if(structInfos[main_type] && structInfos[main_type][0]){
							// 试题类型存在
							if(main_type == compare_main_type && sub_type == compare_sub_type){
								// 保存试题
								parseTests[i]['need_time'] = parseInt(selectedStructInfo['need_time']);
								parseTests[i]['score'] = selectedStructInfo['score'];
								tmpTests.push(parseTests[i]);
								// 累加起始
								index++;
								// 下一题
								continue;
							}else{
								// 结束此次循环
								break;
							}
						// 结构详细信息主类型存在
						}else if(structInfos[main_type]){
							// 试题类型存在
							if(main_type == compare_main_type){
								// 保存试题
								parseTests[i]['need_time'] = parseInt(selectedStructInfo['need_time']);
								parseTests[i]['score'] = selectedStructInfo['score'];
								tmpTests.push(parseTests[i]);
								// 累加起始
								index++;
								// 下一题
								continue;
							}else{
								// 结束此次循环
								break;
							}
						// 结构详细信息主类型不存在
						}else{
							// 结束此次循环
							break;
						}
					}
					// 保存结构
					if(tmpTests.length > 0 && selectedStructInfo != null){
						// 结构说明id
						var structPartId = selectedStructInfo['struct_part_id'];
						
						// 结构说明信息
						selectedStructInfo['tests'] = deepCopy(tmpTests);
						
						// 数据
						var test = {'struct_part_id' : structPartId, 'part_name' : structParts[structPartId]['name'], 
							'struct_info' : [deepCopy(selectedStructInfo)], 'struct_order' : structParts[structPartId]['struct_order']};
						
						// 保存试题
						tests.push(test);
						// 预计用时
						tatol_need_time += parseInt(selectedStructInfo['need_time']) * tmpTests.length;
						
						// 分数数组
						var scores = selectedStructInfo['score'].split('|');
						
						// 循环计算总分
						$.each(selectedStructInfo['tests'], function(n, obj){
							// 问题数
							var question_num = obj['question_num'];
							
							// 累加试题分数
							for(var n = 0; n < question_num; n++){
								tatol_score += parseFloat(n >= scores.length - 1 ? scores[0] : scores[n]);
							}
						});
					}
				}
				
				// 有口语练习标识
				var kyKindFlag = false;
				
				// 判断是否只有口语练习
				$.each(parseTests, function(i, obj){
					if(obj['kind'] == 2){
						kyKindFlag = true;
					}
				});
				
				// 试卷时间
				if(kyKindFlag){
					tatol_need_time = Math.ceil(tatol_need_time*140/100/60);
				}else{
					tatol_need_time = Math.ceil(tatol_need_time*110/100/60);
				}
				
				tatol_score = Math.formatFloat(tatol_score);
				
				// 存在
				if($('.p_paper_cnt').length){
					// 时间
					$('.p_paper_cnt').attr('data-need-time', tatol_need_time);
					// 作业分数
					$('.p_paper_cnt').attr('data-tatol-score', tatol_score);
				}
				// 存在
				if($('.edit_homework .info_time').length){
					// 时间
					$('.edit_homework .info_time').attr('data-time', tatol_need_time).html(tatol_need_time);
				}
				// 存在
				if($('.edit_homework .info_score').length){
					// 作业分数
					$('.edit_homework .info_score').attr('data-score', tatol_score).html(tatol_score);
				}
				// 存在
				if($('.new_homework_cnt').length){
					// 作业预计时间
					$('.new_homework_cnt').attr('data-time', tatol_need_time);
					// 作业分数
					$('.new_homework_cnt').attr('data-score', tatol_score);
				}
				
				// 返回值
				var dtests = new Object();
				
				// 按试题排序
				if(isOrderByTest){
					// 数据
					var parts = new Array();
					// 试题数据
					var resTests = new Object();
					// 循环合并数据
					$.each(tests, function(i, obj){
						// 是否存在数据
						if($.inArray(obj['struct_part_id'], parts) == -1){
							parts.push(obj['struct_part_id']);
						}
						// 存在信息
						if(resTests[obj['struct_part_id']]){
							// 合并标识
							var hstatus = false;
							// 循环处理数据
							$.each(resTests[obj['struct_part_id']]['struct_info'], function(o, l){
								// structure_info_id相同
								if(l['id'] == obj['struct_info'][0]['id']){
									// 下表
									var j = 0;
									// 循环获取数据
									$.each(l['tests'], function(k, m){
										j = k;
									});
									// 合并数据
									$.each(obj['struct_info'][0]['tests'], function(n, m){
										j = parseInt(j)+1;
										resTests[obj['struct_part_id']]['struct_info'][o]['tests'][j] = m;
									});
									
									// 合并标识
									hstatus = true;
								}
							});
							
							// 未合并
							if(!hstatus){
								// 合并数据
								resTests[obj['struct_part_id']]['struct_info'].push(obj['struct_info'][0]);
							}
						}else{
							resTests[obj['struct_part_id']] = obj;
						}
					});
					
					// 循环处理数据
					$.each(resTests, function(i, obj){
						// 序号
						var dIndex = $.inArray(obj['struct_part_id'], parts);
						dtests[dIndex] = obj;
					});
				}else{
					// 循环合并数据
					$.each(tests, function(i, obj){
						// 存在信息
						if(dtests[obj['struct_order']]){
							// 合并标识
							var hstatus = false;
							// 循环处理数据
							$.each(dtests[obj['struct_order']]['struct_info'], function(o, l){
								// structure_info_id相同
								if(l['id'] == obj['struct_info'][0]['id']){
									// 下表
									var j = 0;
									// 循环获取数据
									$.each(l['tests'], function(k, m){
										j = k;
									});
									// 合并数据
									$.each(obj['struct_info'][0]['tests'], function(n, m){
										j = parseInt(j)+1;
										dtests[obj['struct_order']]['struct_info'][o]['tests'][j] = m;
									});
									
									// 合并标识
									hstatus = true;
								}
							});
							
							// 未合并
							if(!hstatus){
								// 合并数据
								dtests[obj['struct_order']]['struct_info'].push(obj['struct_info'][0]);
							}
						}else{
							dtests[obj['struct_order']] = obj;
						}
					});
				}
				
				return dtests;
			}
		},
		// 听力口语的音频控制
		ctrlOpr : {
			/**
			 * 设置听力口语的步骤
			 * testCtrls : 步骤数据形式为{main_type:{sub_type:object}}
			 */
			setTestCtrl : function(testCtrls){
				// 没有听力口语步骤
				if(!testCtrls){
					return;
				}
				
				// 所有子类型
				var subtypes = new Array();
				
				$.each(testCtrls, function(i, objs){
					$.each(objs, function(j, obj){
						subtypes.push(obj['sub_type']);
					});
				});
				
				// 初始化对象,用于音频步骤使用情况记录
				var tmpTestCtrls = new Object();
				// 初始化对象,用于试题步骤使用情况记录
				var tmpTests = new Object();
				
				// 循环赋值
				$('.test_content[data-kind!="3"]').each(function(i, obj){
					// 类型
					var datakind = $(this).attr('data-kind');
					// 该题在所在题型的题号
					var isindex = $(this).attr('data-index-order');// 主类型
					// 主类型
					var main_type = $(this).attr('data-type');
					// 主子类型
					var sub_type = $(this).attr('data-struct-subtype');
					
					// 为空
					if(tmpTests[main_type] == undefined){
						tmpTests[main_type] = new Object();
					}
					
					// 为空
					if(tmpTests[main_type][sub_type] == undefined){
						tmpTests[main_type][sub_type] = '';
					}
					
					// 不为空
					if((isindex == 1 || isindex == undefined) && tmpTests[main_type][sub_type] != ''){
						if(datakind != 2){
							$(this).append($('#testCtrlTemp').template(tmpTests[main_type][sub_type]));
						}else{
							if(sub_type == 1510){
								$(this).append($('#testCtrlTemp').template(tmpTests[main_type][sub_type]));
							}else{
//								var ctrsinfo= tmpTests[main_type][sub_type].slice(2);
//								$(this).append($('#testCtrlTemp').template(ctrsinfo));
								$(this).append($('#testCtrlTemp').template(tmpTests[main_type][sub_type]));
							}
						}
					}else{
						// 结构控制存在
						if(testCtrls[main_type] != undefined && testCtrls[main_type][sub_type] != undefined){
							// 步骤集顺序
							var block_order = 0;
							if($(this).closest('.sub_test_area').find('.test_content').length == 1){
								block_order = $(this).closest('.sub_test_area').attr('data-index');
								
								if(testCtrls[main_type][sub_type]['infos'][block_order] == undefined){
									block_order = 0;
								}
							}
							
							// 为空
							if(tmpTestCtrls[main_type] == undefined){
								tmpTestCtrls[main_type] = new Object();
							}
							
							// 为空
							if(tmpTestCtrls[main_type][sub_type] == undefined){
								tmpTestCtrls[main_type][sub_type] = true;
							}
							
							if(isindex == 1 || datakind != 2 || isindex == undefined 
									|| testCtrls[main_type][sub_type]['infos'].length > 1){
								// 保存同一类型试题使用步骤
								tmpTests[main_type][sub_type] = testCtrls[main_type][sub_type]['infos'][block_order];
								
								$(this).append($('#testCtrlTemp').template(testCtrls[main_type][sub_type]['infos'][block_order]));
							}else{
								// 保存同一类型试题使用步骤
								tmpTests[main_type][sub_type] = testCtrls[main_type][sub_type]['infos'][block_order];
								
//								var ctrsinfo= testCtrls[main_type][sub_type]['infos'][block_order].slice(2);
//								$(this).append($('#testCtrlTemp').template(ctrsinfo));
								
								$(this).append($('#testCtrlTemp').template(testCtrls[main_type][sub_type]['infos'][block_order]));
							}
						// 主类型结构控制存在
						}else if(testCtrls[main_type] != undefined && testCtrls[main_type][0] 
							&& (tmpTestCtrls[main_type] == undefined || tmpTestCtrls[main_type][0] == undefined)){
							// 步骤集顺序
							var block_order = 0;
							if($(this).closest('.sub_test_area').find('.test_content').length == 1){
								block_order = $(this).closest('.sub_test_area').attr('data-index');
								
								if(testCtrls[main_type][0]['infos'][block_order] == undefined){
									block_order = 0;
								}
							}
							
							// 为空
							if(tmpTestCtrls[main_type] == undefined){
								tmpTestCtrls[main_type] = new Object();
							}
							
							// 为空
							if(tmpTestCtrls[main_type][0] == undefined){
								tmpTestCtrls[main_type][0] = true;
							}
							
							if(isindex == 1 || datakind != 2 || isindex == undefined 
									|| testCtrls[main_type][0]['infos'].length > 1){
								// 保存同一类型试题使用步骤
								tmpTests[main_type][sub_type] = testCtrls[main_type][0]['infos'][block_order];
								
								$(this).append($('#testCtrlTemp').template(testCtrls[main_type][0]['infos'][block_order]));
							}else{
								// 保存同一类型试题使用步骤
								tmpTests[main_type][sub_type] = testCtrls[main_type][0]['infos'][block_order];
								
//								testCtrls[main_type][0]['infos'][0].slice(2);
								$(this).append($('#testCtrlTemp').template(testCtrls[main_type][0]['infos'][block_order]));
							}
						// 子类型与主类型控制一样时
						}else if(testCtrls[main_type] != undefined && testCtrls[main_type][main_type]
							&& (tmpTestCtrls[main_type] == undefined || tmpTestCtrls[main_type][main_type] == undefined)){
							// 步骤集顺序
							var block_order = 0;
							if($(this).closest('.sub_test_area').find('.test_content').length == 1){
								block_order = $(this).closest('.sub_test_area').attr('data-index');
								
								if(testCtrls[main_type][main_type]['infos'][block_order] == undefined){
									block_order = 0;
								}
							}
							
							// 为空
							if(tmpTestCtrls[main_type] == undefined){
								tmpTestCtrls[main_type] = new Object();
							}
							
							// 为空
							if(tmpTestCtrls[main_type][main_type] == undefined){
								tmpTestCtrls[main_type][main_type] = true;
							}
							
							if(isindex == 1 || datakind != 2 || isindex == undefined 
									|| testCtrls[main_type][main_type]['infos'].length > 1){
								// 保存同一类型试题使用步骤
								tmpTests[main_type][sub_type] = testCtrls[main_type][main_type]['infos'][block_order];
								
								$(this).append($('#testCtrlTemp').template(testCtrls[main_type][main_type]['infos'][block_order]));
							}else{
								// 保存同一类型试题使用步骤
								tmpTests[main_type][sub_type] = testCtrls[main_type][main_type]['infos'][block_order];
								
//								testCtrls[main_type][main_type]['infos'][0].splice(1,2);
								$(this).append($('#testCtrlTemp').template(testCtrls[main_type][main_type]['infos'][block_order]));
							}
						// 主类型存在，子类型不存在控制时
						}else if(testCtrls[main_type] != undefined && $.inArray(sub_type, subtypes) == -1){
							// 选择的控制
							var chosenType = 0;
							$.each(testCtrls[main_type], function(j, object){
								// 步骤使用过
								if(tmpTestCtrls[main_type] == undefined || tmpTestCtrls[main_type][object['sub_type']] == undefined){
									chosenType = object['sub_type'];
								}
							});
							
							// 为空
							if(tmpTestCtrls[main_type] == undefined){
								tmpTestCtrls[main_type] = new Object();
							}
							
							// 为空
							if(tmpTestCtrls[main_type][chosenType] == undefined){
								tmpTestCtrls[main_type][chosenType] = true;
							}
							
							// 步骤集顺序
							var block_order = 0;
							if($(this).closest('.sub_test_area').find('.test_content').length == 1){
								block_order = $(this).closest('.sub_test_area').attr('data-index');
								
								if(testCtrls[main_type][chosenType]['infos'][block_order] == undefined){
									block_order = 0;
								}
							}
							
							// 保存同一类型试题使用步骤
							if(testCtrls[main_type][chosenType]){
								tmpTests[main_type][sub_type] = testCtrls[main_type][chosenType]['infos'][block_order];
							}else{
								tmpTests[main_type][sub_type] = testCtrls[main_type][main_type]['infos'][block_order];
							}
							
							$(this).append($('#testCtrlTemp').template(tmpTests[main_type][sub_type]));
						}
					}
				});

				//给朗读短文（1400
				if($('.test_content[data-type=1400]').length > 0) {
					//的每个句子后面添加一个固定宽度的span
					//用于显示等待评分和最后的分数
					// $('.test_content[data-type=1400]').each(function() {
					// 	$(this).find('.speak_sentence').after('<span class="sentence_behind_space"></span>');
					// });
					//答题卡下方添加“等待判分”图标意思提示
					$('.p_answerSheet_cnt .p_answerSheet_details .p_answer_list').after('<div class="wait_record_info">"<span class="wait_record_icon"></span>"图标表示录音等待判分！</div>')
				}
			},
			/**
			 * 音频播放操作
			 * that : 当前试题按钮的指代
			 */
			execute_ctrl : function(that){
				// 删除选中样式
				$('.question_container .speak_sentence').removeClass('high_light_font');
				// 停止时间
				clearInterval(play_key);
				
				// 子题型，用于判断小学图片排序
				var sub_type = $(that).closest('.test_content').attr('data-subtype');
				
				// 获取音频步骤
				var obj = $(that).closest('.test_content').find('.test_ctrl_area li.test_ctrl.enable:first');
				// 为空
				if(obj == undefined || obj.length == 0){
					// 添加标识
					$(that).closest('.test_content').find('.test_ctrl_area li.test_ctrl').addClass('enable');
					// 隐藏音频播放提示框
					$('.test_ctrl_info_area').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 设置按钮名称
					if(!is_primary){
						// 竞赛练习页面
						if(window.location.pathname != '/Competition/paper.html'){
							// 按钮字样
							$(that).html('开始答题');
						}
					}else{
						$(that).removeClass('primary_btn_replay').addClass('primary_btn_play');
					}
					// 自动练习标识
					$(that).closest('.test_content').find('.btn_play').removeClass('enable');
					// 自动练习标识
					$(that).closest('.test_content').find('.btn_play').removeClass('start');
					if(sub_type == 1541){
						// 清楚数据
						$(that).closest('.test_content').find('.question_container .question_content').html('');
					}
					return false;
				}
				
				// 音频情况
				var act_type = $(obj).attr('data-act-type');
				// 等待时间(准备时间、答题时间)
				if(act_type == 0){
					// 主类型
					var main_type = $(obj).closest('.test_content').attr('data-type');
					// 为7100
					if(main_type == '7100'){
						var qs_index = $(obj).attr('data-qs-index');
						// 问题序号
						if(qs_index > 0){
							// 显示相应问题
							var qs_str = $(obj).closest('.test_content').find('.china_q:eq("'+(qs_index-1)+'")').html();
							
							// 是否存在
							if($(obj).closest('.test_content').find('.question_container .question_content .question_content_str').length){
								qs_str = '<div class="dib question_content_str_num">' + (qs_index) + '.</div>'
									+ '<div class="dib question_content_str_info">' + qs_str + '</div>';
								
								// 显示问题
								$(obj).closest('.test_content').find('.question_container .question_content .question_content_str').html(qs_str);
							}else{
								qs_str = '<div class="dib dib-wrap question_content_str">' 
									+ '<div class="dib question_content_str_num">' + (qs_index) + '.</div>'
									+ '<div class="dib question_content_str_info">' + qs_str + '</div>' + '</div>';
								
								// 显示问题
								$(obj).closest('.test_content').find('.question_container .question_content').append(qs_str);
							}
						}
					}
					// 删除标识样式，便于执行下一步骤
					$(that).closest('.test_content').find('.test_ctrl_area li.test_ctrl.enable:first').removeClass('enable');
					// 隐藏进度条
					$('.test_ctrl_info_area .percentage_gray').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					
					// 等待时间
					var total_time = parseInt($(obj).attr('data-wait-time'));
					var remainder_time = parseInt($(obj).attr('data-wait-time'));
					// 步骤说明
					$('.test_ctrl_info_area .info_hint').html($(obj).attr('data-hint'));
					// 显示秒
					$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').show();
					// 设置倒计时
					$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
					
					// 问题序号
					var index = $(obj).attr('data-qs-index');
					var qimg = $(obj).closest('.test_content').find('.imageSize');
					if(qimg != undefined && qimg.length > 0){
						$(qimg).each(function(){
							$(this).parent('.question_p').addClass('hide');
						});
						qimg.eq(index).parent('.question_p').removeClass('hide');
					}

					// 循环倒计时
					remainder_key = setInterval(function(){
						// 倒计时
						remainder_time = remainder_time - 100;
						
						// 进度条
						$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', ((total_time - remainder_time)/total_time * 100)+'%');
						
						// 设置倒计时
						$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
						
						if(remainder_time < 0){
							// 停止时间
							clearInterval(remainder_key);
							// 下一步骤
							practice.ctrlOpr.execute_ctrl(that);
						}
					}, 100);
				// 播放音频(题目说明、试题内容等)
				}else if(act_type == 1 || act_type == 6 || act_type == 7){
					// 1541
					if(sub_type == 1541){
						// 顺序
						var item_order = $(obj).attr('data-order');
						// 试题顺序
						var test_index = $(obj).attr('data-qs-index');
						// 第6步
						if(item_order > 6){
							// 清楚数据
							$(that).closest('.test_content').find('.question_container .question_content').html('');
							// 显示问题
							var q_str = $(obj).closest('.test_content').find('.question_division_line .question_li:eq('+test_index+') .speak_sentence.question').html();
							$(that).closest('.test_content').find('.question_container .question_content').html(q_str);
						}
					}
					
					// 删除标识样式，便于执行下一步骤
					$(that).closest('.test_content').find('.test_ctrl_area li.test_ctrl.enable:first').removeClass('enable');
					// 隐藏进度条
					$('.test_ctrl_info_area .percentage_gray').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					
					// 音频类型
					var mp3_type = $(obj).attr('data-mp3-type');
					// 步骤说明
					$('.test_ctrl_info_area .info_hint').html($(obj).attr('data-hint'));
					// 隐藏秒
					$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
					// 通用音频
					if(mp3_type == 0){
						// 音频文件
						var file_name = $(obj).attr('data-mp3-path');
						
						if(file_name != undefined && file_name != ''){
							// 播放音频
							practice.ctrlOpr.play_video(that, file_name);
						}else{
							// 下一步骤
							practice.ctrlOpr.execute_ctrl(that);
						}
					// 试题音频
					}else if(mp3_type == 1){
						// 音频文件
						var file_name = $(obj).closest('.test_content').find('.p_Laudio').attr('data-mp3');
						
						if(file_name != undefined && file_name != ''){
							// 播放音频
							practice.ctrlOpr.play_video(that, file_name);
						}else{
							// 图片排序没有步骤问题音频，进入播放图片排序音频步骤
							if(sub_type == 1121 || sub_type == 1122 || sub_type == 1123 || sub_type == 1124){
								practice.ctrlOpr.play_video_tppx(that, file_name);
							}else{
								// 下一步骤
								practice.ctrlOpr.execute_ctrl(that);
							}
						}
					// 口语音频
					}else if(mp3_type > 1){
						// 主类型
						var main_type = $(obj).closest('.test_content').attr('data-type');
						// 子类型
						var sub_type = $(obj).closest('.test_content').attr('data-subtype');
						// 7100试题
						if(main_type == 7100 || sub_type == '1227' || sub_type == '1228'){
							// 音频文件
							var file_name = $(obj).closest('.test_content').find('.question_content .question_p.china:eq("' + (mp3_type-2) + '")').attr('data-mp3');
							// 文件不存在
							if(file_name != undefined && file_name != ''){
								// 播放音频
								practice.ctrlOpr.play_video(that, file_name);
							}else{
								// 下一步骤
								practice.ctrlOpr.execute_ctrl(that);
							}
						}else{
							// 问题序号
							var index = $(obj).attr('data-qs-index');
							// 存在问题
							var q_li = $(obj).closest('.test_content').find('.question_li:eq('+index+')').not('.question_li_1520');
							// 不存在
							if(q_li == undefined || q_li.length == 0){
								// 播放音频
								practice.ctrlOpr.play_ky_video(obj, that);
							}else{
								// 播放音频
								practice.ctrlOpr.play_ky_li_video(obj, that, index);
							}
						}
					}
				// 录音
				}else if(act_type == 2){
					// 删除标识样式，便于执行下一步骤
					$(that).closest('.test_content').find('.test_ctrl_area li.test_ctrl.enable:first').removeClass('enable');
					// 隐藏进度条
					$('.test_ctrl_info_area .percentage_gray').hide();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').show();
					
					// 标识已做
					var qid = $(that).closest('.test_content').find('.question_container .question_content[data-test-mold=6]').closest('.question_container').attr('data-qid');
					// 听力口语，点击“开始答题”在答题卡上对应题号标记已做
					$('.p_answer_list ul li[data-index='+qid+']').addClass('done');
					
					// 非自动练习模式下、朗读短文类型题型
					if((($(that).closest('.test_content').attr('data-type') == 1400 
								&& $(that).closest('.test_content').find('.question_content .speak_sentence').length > 1) 
								|| $(that).closest('.test_content').attr('data-subtype') == 1441) 
							&& $(that).closest('.test_content').attr('data-subtype') != 1428){
						// 下一步骤
						practice.ctrlOpr.ky_read_video(obj, that);
					}else{
						// 停止时间
						clearInterval(tape_remainder_key);
						// 停止录音
						if(TSP.audio.recorder.inited){
							TSP.audio.recorder.stop();
						}
						// 等待时间
						var remainder_time = parseInt($(obj).attr('data-wait-time'));
						// 获取步骤名称
						var info_hint = $(obj).attr('data-hint');
						// 显示秒
						$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
						// 步骤说明
						$('.test_ctrl_info_area .info_hint').html('初始化录音');
						/**
						 * 设置波形配置
						 */
						practice.waveForm.initWaveForm();
						
						// 当前试题
						var tid = $(that).closest('.test_content').attr('data-id');
						// 试题id为空
						if(videoResult[tid] == undefined || videoResult[tid] == null){
							videoResult[tid] = new Object();
							if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {//判断是否IE浏览器
								$("#AsrRecorder")[0].arrayEmpty(tid);
							}
						}
						
						// 当前时间戳
						var time_flag = (new Date()).getTime();
						// 试题录音标识
						videoResult[tid][time_flag] = new Object();
						// 保存录音时间戳
						$(obj).attr('data-time-flag', time_flag);
						// 问题序号
						var qs_index = $(obj).attr('data-qs-index');
						
						// 主类型
						var main_type = $(that).closest('.test_content').attr('data-type');
						// 子类型
						var sub_type = $(that).closest('.test_content').attr('data-subtype');
						// 7100特殊题型
						if(main_type == '7100'){
							// 第一部分
							if(qs_index == 0){
								$('.test_content[data-id="'+tid+'"]').find('.left_area:eq(0)').html('<span class="wait_video_css">正在录音，请稍候！</span>');
							}else{
								$('.test_content[data-id="'+tid+'"]').find('.left_area:eq(1)').html('<span class="wait_video_css">正在录音，请稍候！</span>');
							}
						// 连词成句
						}else if(main_type == 6100){
							$('.test_ctrl_info_area .info_hint').text('录音中...');
						}else{
							$('.test_content[data-id="'+tid+'"]').find('.left_area').html('<span class="wait_video_css">正在录音，请稍候！</span>');
						}
						
						// 开始录音
						// 小学连词成句
						if($(that).closest('.test_content').attr('data-type') == 6100){
							var sen_content = $(that).closest('.test_content').find('.lccj_sentence_cnt').text();
							TSP.audio.recorder.start(tid, 2, sen_content, time_flag, remainder_time);
						}else{
							// 1500题型
							if($(that).closest('.test_content').attr('data-type') == 1500 
									|| $(that).closest('.test_content').attr('data-type') == 7100){
								// id传输时修改格式
								TSP.audio.recorder.start(tid, 3, tid + '#' + qs_index, time_flag, remainder_time);
							}else if($(that).closest('.test_content').attr('data-type') == 7200){
								var word_text = $(that).closest('.test_content').find('.word_text .speak_sentence').attr('data-text');
								// id传输时修改格式
								TSP.audio.recorder.start(tid, 2, word_text, time_flag, remainder_time);
							}else{
								TSP.audio.recorder.start(tid, 3, tid, time_flag, remainder_time);
							}
						}
						// 循环倒计时
						tape_remainder_key = setInterval(function(){
							if(!TSP.audio.recorder.recording){
								return;
							}
							// 显示秒
							$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').show();
							// 步骤说明
							$('.test_ctrl_info_area .info_hint').html(info_hint);
							// 倒计时
							remainder_time = remainder_time - 100;
							
							// 设置倒计时
							$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
							
							if(remainder_time < 0){
								// 停止时间
								clearInterval(tape_remainder_key);
								// 停止录音
								if(TSP.audio.recorder.inited){
									TSP.audio.recorder.stop();
								}
								
								// 截止时间戳
								videoResult[tid][time_flag]['end_time'] = (new Date()).getTime();
								
								// 7100特殊题型
								if(main_type == '7100'){
									// 问题序号
									var qs_index = $(obj).attr('data-qs-index');
									// 第一部分
									if(qs_index == 0){
										$('.test_content[data-id="'+tid+'"]').find('.left_area:eq(0)').html('<span class="wait_video_css pf">正在判分，请稍候！</span>');
									}else{
										$('.test_content[data-id="'+tid+'"]').find('.left_area:eq(1)').html('<span class="wait_video_css pf">正在判分，请稍候！</span>');
									}
								// 连词成句
								}else if(main_type == 6100){
									if($('.test_content[data-id="'+tid+'"]').find('.sentence_show .lccj_speak_sen_score').length == 0){
										$('.test_content[data-id="'+tid+'"]').find('.sentence_show').append('<span class="lccj_speak_sen_score sentence_behind_space"></span>');
									}
									if(judge_speaking){
										$('.test_content[data-id="'+tid+'"]').find('.sentence_show .sentence_behind_space').addClass('wait_background').text('');
									}else{
										$('.test_content[data-id="'+tid+'"]').find('.sentence_show .sentence_behind_space').addClass('hidden_speaking_result').text('');
									}
								}else{
									$('.test_content[data-id="'+tid+'"]').find('.left_area').html('<span class="wait_video_css pf">正在判分，请稍候！</span>');
								}
								
								// 下一步骤
								practice.ctrlOpr.execute_ctrl(that);
							}
						}, 100);
					}
				// 跟读模式
				}else if(act_type == 3){
					// 为空
					if($(that).closest('.test_content').find('.question_content .speak_sentence.enable:first') == undefined 
							|| $(that).closest('.test_content').find('.question_content .speak_sentence.enable:first').length == 0){
						// 删除标识样式，便于执行下一步骤
						$(that).closest('.test_content').find('.test_ctrl_area li.test_ctrl.enable:first').removeClass('enable');
						
						// 停止时间
						clearInterval(play_key);
						
						$(that).closest('.test_content').find('.question_content .speak_sentence').each(function(i, object){
							// 添加样式
							$(this).addClass('enable');
						});
						
						// 下一步骤
						practice.ctrlOpr.execute_ctrl(that);
						
						return false;
					}
					// 播放音频
					practice.ctrlOpr.play_ky_gd_video(obj, that);
				// 看图说话
				}else if(act_type == 4){
					// 删除标识样式，便于执行下一步骤
					$(that).closest('.test_content').find('.test_ctrl_area li.test_ctrl.enable:first').removeClass('enable');
					// 隐藏进度条
					$('.test_ctrl_info_area .percentage_gray').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					
					// 音频类型
					var mp3_type = $(obj).attr('data-mp3-type');
					// 步骤说明
					$('.test_ctrl_info_area .info_hint').html($(obj).attr('data-hint'));
					// 隐藏秒
					$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();					
					if(mp3_type == 10){
						var firstsen = $(that).closest('.test_content').find('.speak_sentence.enable:first');
						
						if(firstsen != undefined && firstsen.length > 0){
							// 音频文件
							var file_name = firstsen.attr('data-mp3');
							// 开始时间
							var start_time = parseInt(firstsen.attr('data-starttime'));
							// 结束时间
							var end_time = parseInt(firstsen.attr('data-endtime'));
							// 删除标识位
							firstsen.removeClass('enable');
							
							// 装载音频文件
							TSP.audio.player.load(file_name);
							
							// 为空
							if(start_time == undefined || start_time === ''){
								start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
							}
							
							// 为空
							if(end_time == undefined || end_time == '' || end_time == 1){
								end_time = TSP.audio.player.audioElem.duration * 1000;
							}
							
							// 设置起始时间
							TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
							
							// 播放音频
							TSP.audio.player.play();
							
							// 音频总时间
							var total_time = end_time/1000.0 - start_time/1000.0;
							
							// 标识
							var flag = false;
							
							// 循环倒计时
							play_key = setInterval(function(){
								// 音频播放当前时间
								var remainder_time = TSP.audio.player.audioElem.getCurrentTime() - start_time/1000.0;
								// 进度条
								$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
								
								if(total_time - remainder_time <= 0){
									// 停止时间
									clearInterval(tape_remainder_key);
									// 停止录音
									TSP.audio.player.stop();
									// 下一步骤
									practice.ctrlOpr.execute_ctrl(that);
								}
							}, 4);
						}
					}
				}
			},
			/**
			 * 播放音频(口语音频除外)
			 */
			play_video : function(that, file_name){
				// 装载音频文件
				TSP.audio.player.load(file_name);
				
				// 播放音频
				TSP.audio.player.play();
				
				// 音频总时间
				var total_time = TSP.audio.player.audioElem.duration;
				// 循环倒计时
				play_key = setInterval(function(){
					// 音频播放当前时间
					var remainder_time = TSP.audio.player.audioElem.getCurrentTime();
					
					$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
					
					if(total_time - remainder_time <= 0){
						// 停止时间
						clearInterval(play_key);
					}
				}, 100);
				
				// 获取音频对象
				TSP.audio.files.getAudio(file_name).onended = function(){
					// 停止时间
					clearInterval(play_key);
					// 下一步骤
					practice.ctrlOpr.execute_ctrl(that);
				};
			},
			/**
			 * 播放图片排序音频（答题音频播放）
			 */
			play_video_tppx : function(that){
				// 移除当前句标识
				$(that).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt').removeClass('current_sort_option');
				// 移除高亮闪烁图标提示
				$(that).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt .option_flag').removeClass('current_flag');
				// 当前句的容器
				var cur_cnt = $(that).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt.enable:first');
				// 音频已播完
				if(cur_cnt.length == 0){
					// 隐藏音频播放提示框
					$('.test_ctrl_info_area').hide();
					return;
				}
				// 当前句高亮闪烁图标提示
				cur_cnt.find('.option_flag').addClass('current_flag').effect('pulsate', {times: 3}, 1000);
				// 当前句标识
				cur_cnt.addClass('current_sort_option');
								
				// 当前音频序号
				var obj_index = cur_cnt.attr('data-as-index');
				// 当前播放音频
				var obj = $(that).closest('.test_content').find('.listen_sa .speak_sentence:eq(' + (obj_index - 1) + ')');
				
				// 移除标识
				cur_cnt.removeClass('enable');
				// 当前播放音频属性
				var file_name = obj.attr('data-mp3');
				// 开始时间
				var start_time = parseFloat(obj.attr('data-starttime')) / 1000.0;
				// 截止时间
				var end_time = parseFloat(obj.attr('data-endtime')) / 1000.0;
				// 装载音频文件
				TSP.audio.player.load(file_name);
				// 设置起始时间
				TSP.audio.player.audioElem.setCurrentTime(start_time);
				// 音频总时间
				var total_time = (end_time - start_time).toFixed(3);
				// 播放音频
				TSP.audio.player.play();
				// 提示语
				$('.test_ctrl_info_area .info_hint').text('播放音频');
				// 循环倒计时
				play_key = setInterval(function(){
					// 音频播放当前时间
					var remainder_time = TSP.audio.player.audioElem.getCurrentTime();
					// 计时
					var procee_time = remainder_time - start_time;
					$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (procee_time/total_time * 100)+'%');
					if(remainder_time >= end_time){
						// 停止时间
						clearInterval(play_key);
						// 停止播放
						TSP.audio.player.stop();
						
						// 停顿时间
						var pause_time = 15000; // 15秒
						// 开始时间
						var cur_time = 0;
						// 设置提示
						$('.test_ctrl_info_area .info_hint').text('你还有 '+ (pause_time / 1000) +' 秒钟可以选择');
						// 停顿时间循环倒计时
						pause_play_key = setInterval(function(){
							// 进度条
							$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (cur_time/pause_time * 100)+'%');
							// 计时
							cur_time += 100;
							if(cur_time % 1000 == 0){
								// 剩余选择图片时间，单位秒
								var pause_remain = Math.floor((pause_time - cur_time) / 1000);
								$('.test_ctrl_info_area .info_hint').text('你还有 ' + pause_remain + ' 秒钟可以选择');
							}
							if(cur_time - pause_time >= 0){
								// 停止时间
								clearInterval(pause_play_key);
								// 下一句音频
								practice.ctrlOpr.play_video_tppx(that);
							}
						}, 100);
					}
				}, 10);
				
				// 获取音频对象,由于音频截止时间可能大于试题设置的截止时间导致题目卡住，增加一个音频播放完成的操作
				TSP.audio.files.getAudio(file_name).onended = function(){
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(pause_play_key);
					// 停止播放
					TSP.audio.player.stop();
					
					// 停顿时间
					var pause_time = 15000; // 15秒
					// 开始时间
					var cur_time = 0;
					// 设置提示
					$('.test_ctrl_info_area .info_hint').text('你还有 '+ (pause_time / 1000) +' 秒钟可以选择');
					// 停顿时间循环倒计时
					pause_play_key = setInterval(function(){
						// 进度条
						$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (cur_time/pause_time * 100)+'%');
						// 计时
						cur_time += 100;
						if(cur_time % 1000 == 0){
							// 剩余选择图片时间，单位秒
							var pause_remain = Math.floor((pause_time - cur_time) / 1000);
							$('.test_ctrl_info_area .info_hint').text('你还有 ' + pause_remain + ' 秒钟可以选择');
						}
						if(cur_time - pause_time >= 0){
							// 停止时间
							clearInterval(pause_play_key);
							// 下一句音频
							practice.ctrlOpr.play_video_tppx(that);
						}
					}, 100);
				};
			},
			/**
			 * 播放口语音频
			 */
			play_ky_video : function(obj, that){
				// 获取音频信息
				var v_obj = $(obj).closest('.test_content').find('.speak_sentence.enable:first').not('.question_li_1520').not('.answer');
				// 为空
				if(v_obj == undefined || v_obj.length == 0){
					// 停止时间
					clearInterval(play_key);
					
					setTimeout(function(){
						// 添加标识
						$(that).closest('.test_content').find('.speak_sentence').removeClass('enable').addClass('enable');
						
						// 下一步骤
						practice.ctrlOpr.execute_ctrl(that);
					}, 200);
					
					return false;
				}
				
				// 音频文件
				var file_name = $(v_obj).attr('data-mp3');
				// 开始时间
				var start_time = parseInt($(v_obj).attr('data-starttime'));
				// 结束时间
				var end_time = parseInt($(v_obj).attr('data-endtime'));
				// 删除标识位
				$(v_obj).removeClass('enable');
				
				// 装载音频文件
				TSP.audio.player.load(file_name);
				// 为空
				if(start_time == undefined || start_time === ''){
					start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
				}
				
				// 为空
				if(end_time == undefined || end_time == ''){
					end_time = TSP.audio.player.audioElem.duration * 1000;
				}
				
				// 设置起始时间
				TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
				
				var suffix = file_name.substring(file_name.length - 4,file_name.length);
				if(suffix == '.ogg' || suffix == '.mp4'){
					//var video =$(obj).closest('.test_content').find('.videoinfo').attr('data-ogg');
					// var vplayer = VideoJS(video);
					// vplayer.width(620);
					// vplayer.height(250);
					// // 停止时间
					// clearInterval(play_key);
					// vplayer.play();
					// vplayer.volume(0);
					//practice.ctrlOpr.play_video(that, video);
				}
				// 播放音频
				TSP.audio.player.play();
				
				// 音频总时间
				var total_time = end_time/1000.0 - start_time/1000.0;
				
				// 标识
				var flag = false;
				
				// 循环倒计时
				play_key = setInterval(function(){
					// 音频播放当前时间
					var remainder_time = TSP.audio.player.audioElem.getCurrentTime() - start_time/1000.0;
					
					// 进度条
					$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
					
					if(total_time - remainder_time <= 0){
						// 停止时间
						clearInterval(play_key);
						
						// 标识
						if(!flag){
							// 下一步骤
							practice.ctrlOpr.play_ky_video(obj, that);
							// 标识
							flag = true;
						}
					}
				}, 4);
				
				// 获取音频对象
				TSP.audio.files.getAudio(file_name).onended = function(){
					// 停止时间
					clearInterval(play_key);
					// 标识
					if(!flag){
						// 下一步骤
						practice.ctrlOpr.play_ky_video(obj, that);
						// 标识
						flag = true;
					}
				};
			},
			/**
			 * TODO修改朗读短文录音形式
			 */
			ky_read_video : function(obj, that){
				// 获取音频信息
				var v_obj = $(that).closest('.test_content').find('.question_container .speak_sentence.enable:first');
				// 为空
				if(v_obj == undefined || v_obj.length == 0){
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(tape_remainder_key);
					// 停止录音
					if(TSP.audio.recorder.inited){
						TSP.audio.recorder.stop();
					}

					$(v_obj).closest('.test_content').find('.question_container .speak_sentence').removeClass('high_light_font');
					
					setTimeout(function(){
						// 下一步骤
						practice.ctrlOpr.execute_ctrl(that);
					}, 200);
					
					return false;
				}
				
				// 在该句后面添加一个空白区域，用于显示判分等待图标和分数
				$(v_obj).next('.sentence_behind_space').remove();
				$(v_obj).after('<span class="sentence_behind_space"></span>');

				// 删除高亮样式
				$(v_obj).closest('.test_content').find('.question_container .speak_sentence').removeClass('high_light_font');
				// 音频文件
				var file_name = $(v_obj).attr('data-mp3');
				// 开始时间
				var start_time = parseInt($(v_obj).attr('data-starttime'));
				// 结束时间
				var end_time = parseInt($(v_obj).attr('data-endtime'));
				// 删除标识位
				$(v_obj).removeClass('enable');
				
				// 装载音频文件
				TSP.audio.player.load(file_name);
				// 为空
				if(start_time == undefined || start_time === ''){
					start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
				}
				
				// 为空
				if(end_time == undefined || end_time == '' || end_time == 1){
					end_time = TSP.audio.player.audioElem.duration * 1000;
				}
				
				// 设置起始时间
				TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
				
				// 音频总时间
				var total_time = (end_time - start_time)/1000.0;
				
				// 隐藏进度条
				$('.test_ctrl_info_area .percentage_gray').hide();
				// 隐藏录音进度条
				$('.test_ctrl_info_area .waveform_container').show();
				// 等待时间
				var remainder_time = practice.util.getRecordFunction(total_time) * 1000;
				// 显示秒
				$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
				// 步骤说明
				$('.test_ctrl_info_area .info_hint').html('初始化录音');
				
				/**
				 * 设置波形配置
				 */
				practice.waveForm.initWaveForm();
				
				// 当前试题
				var tid = $(that).closest('.test_content').attr('data-id');
				// 试题id为空
				if(videoResult[tid] == undefined || videoResult[tid] == null){
					videoResult[tid] = new Object();
					if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) { //判断是否IE浏览器
						$("#AsrRecorder")[0].arrayEmpty(tid);
					}
				}
				
				// 当前时间戳
				var time_flag = (new Date()).getTime();
				// 试题录音标识
				videoResult[tid][time_flag] = new Object();
				// 开始录音
				TSP.audio.recorder.start(tid, 2, $(v_obj).attr('data-text'), time_flag, remainder_time);
				// 循环倒计时
				tape_remainder_key = setInterval(function(){
					if(!TSP.audio.recorder.recording){
						return;
					}
					// 添加高亮样式
					$(v_obj).removeClass('high_light_font').addClass('high_light_font');
					// 显示秒
					$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').show();
					// 步骤说明
					$('.test_ctrl_info_area .info_hint').html('录音');
					// 倒计时
					remainder_time = remainder_time - 100;
					
					// 设置倒计时
					$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
					
					if(remainder_time < 0){
						// 停止时间
						clearInterval(tape_remainder_key);
						// 停止录音
						if(TSP.audio.recorder.inited){
							TSP.audio.recorder.stop();
						}
						// 截止时间戳
						videoResult[tid][time_flag]['end_time'] = (new Date()).getTime();
						// 等待判分
						// $(v_obj).after('<span class="speak_sentence_score">(等待判分)</span>');
						if(judge_speaking){
							$(v_obj).next('.sentence_behind_space').addClass('wait_background').text('');
						}else{
							$(v_obj).next('.sentence_behind_space').addClass('hidden_speaking_result').text('');
						}
						
						// 等待200毫秒进行下一次录音
						setTimeout(function(){
							// 下一步骤
							practice.ctrlOpr.ky_read_video(obj, that);
						}, 200);
					}
				}, 100);
			},
			/**
			 * 播放口语音频(跟读)
			 */
			play_ky_gd_video : function(obj, that){
				// 停止录音
				if(TSP.audio.recorder.inited){
					TSP.audio.recorder.stop();
				}
				// 高亮
				$(that).closest('.test_content').find('.speak_sentence').removeClass('high_light_font');
				// 获取音频信息
				var v_obj = $(that).closest('.test_content').find('.question_container .speak_sentence.enable:first');
				// 为空
				if(v_obj == undefined || v_obj.length == 0){
					// 停止时间
					clearInterval(play_key);
					
					setTimeout(function(){
						// 下一步骤
						practice.ctrlOpr.execute_ctrl(that);
					}, 200);
					
					return false;
				}
				// 跟读样式
				$(v_obj).closest('.test_content').find('.speak_sentence').removeClass('high_light_font');
				
				// 隐藏进度条
				$('.test_ctrl_info_area .percentage_gray').show();
				// 隐藏录音进度条
				$('.test_ctrl_info_area .waveform_container').hide();
				
				// 步骤说明
				$('.test_ctrl_info_area .info_hint').html($(obj).attr('data-hint'));
				// 隐藏秒
				$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
				
				// 音频文件
				var file_name = $(v_obj).attr('data-mp3');
				// 开始时间
				var start_time = parseInt($(v_obj).attr('data-starttime'));
				// 结束时间
				var end_time = parseInt($(v_obj).attr('data-endtime'));
				// 删除标识位
				$(v_obj).removeClass('enable');
				
				// 装载音频文件
				TSP.audio.player.load(file_name);
				// 为空
				if(start_time == undefined || start_time === ''){
					start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
				}
				
				// 为空
				if(end_time == undefined || end_time == '' || end_time == 1){
					end_time = TSP.audio.player.audioElem.duration * 1000;
				}
				
				// 设置起始时间
				TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
				
				// 播放音频
				TSP.audio.player.play();
				
				// 音频总时间
				var total_time = (end_time - start_time)/1000.0;
				
				// 标识
				var flag = false;
				
				// 循环倒计时
				play_key = setInterval(function(){
					// 音频播放当前时间
					var remainder_time = TSP.audio.player.audioElem.getCurrentTime() - start_time/1000.0;
					
					// 进度条
					$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
					
					if(total_time - remainder_time <= 0){
						// 停止时间
						clearInterval(play_key);
						// 停止音频
						TSP.audio.player.stop();
						// 标识
						if(!flag){
							// 下一步骤(开始录音)
							practice.ctrlOpr.tape_video(obj, that, total_time, v_obj);
							// 标识
							flag = true;
						}
					}
				}, 4);
				
				// 获取音频对象
				TSP.audio.files.getAudio(file_name).onended = function(){
					// 停止时间
					clearInterval(play_key);
					// 停止音频
					TSP.audio.player.stop();
					// 标识
					if(!flag){
						// 下一步骤(开始录音)
						practice.ctrlOpr.tape_video(obj, that, total_time, v_obj);
						// 标识
						flag = true;
					}
				};
			},
			/**
			 * 跟读录音
			 */
			tape_video : function(obj, that, total_time, v_obj){
				// 隐藏进度条
				$('.test_ctrl_info_area .percentage_gray').hide();
				// 隐藏录音进度条
				$('.test_ctrl_info_area .waveform_container').show();
				// 等待时间
				var remainder_time = practice.util.getRecordFunction(total_time) * 1000;
				// 获取步骤名称
				var info_hint = $(obj).attr('data-hint');
				// 显示秒
				$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
				// 步骤说明
				$('.test_ctrl_info_area .info_hint').html('初始化录音');
				
				/**
				 * 设置波形配置
				 */
				practice.waveForm.initWaveForm();
				
				// 当前试题
				var tid = $(that).closest('.test_content').attr('data-id');
				// 试题id为空
				if(videoResult[tid] == undefined || videoResult[tid] == null){
					videoResult[tid] = new Object();
					if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) { //判断是否IE浏览器
						$("#AsrRecorder")[0].arrayEmpty(tid);
					}
				}
				
				// 当前时间戳
				var time_flag = (new Date()).getTime();
				// 试题录音标识
				videoResult[tid][time_flag] = new Object();
				// 录音的时间戳
				$(v_obj).attr('data-time-flag', time_flag);
				// 开始录音
				TSP.audio.recorder.start(tid, 2, $(v_obj).attr('data-text'), time_flag, remainder_time);
				// 循环倒计时
				tape_remainder_key = setInterval(function(){
					if(!TSP.audio.recorder.recording){
						return;
					}
					// 高亮样式
					$(v_obj).removeClass('high_light_font').addClass('high_light_font');
					// 步骤说明
					$('.test_ctrl_info_area .info_hint').html(info_hint);
					// 显示秒
					$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').show();
					
					// 倒计时
					remainder_time = remainder_time - 100;
					
					// 设置倒计时
					$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
					
					if(remainder_time < 0){
						// 停止时间
						clearInterval(tape_remainder_key);
						// 停止录音
						if(TSP.audio.recorder.inited){
							TSP.audio.recorder.stop();
						}
						// 下一步骤
						practice.ctrlOpr.play_ky_gd_video(obj, that);
					}
				}, 100);
			},
			/**
			 * 播放口语音频
			 */
			play_ky_li_video : function(obj, that, index){
				// 获取试题类型
				var main_type = $(obj).closest('.test_content').attr('data-type');
				// 获取试题类型
				var sub_type = $(obj).closest('.test_content').attr('data-subtype');
				// 情景对话
				if(main_type == 1500 && sub_type != 1509 && sub_type != 1510 && sub_type != 1512 && sub_type != 1514 && sub_type != 1516
						&& sub_type != 1520 && sub_type != 1522 && sub_type != 1523 && sub_type != 1524 && sub_type != 1526 && sub_type != 1527 
						&& sub_type != 1528 && sub_type != 1529 && sub_type != 1530 && sub_type != 1537 && sub_type != 1539 && sub_type != 1540){
					// 问题内容
					var question_str = $(obj).closest('.test_content').find('.question_division_line .question_li:eq('+index+')').not('.question_li_1520').find('.speak_sentence.question').html();
					// 将问题内容放入显示框中
					$(obj).closest('.test_content').find('.question_container .question_content').html(question_str);
				}
				
				// 停止音频
				TSP.audio.player.stop();
				// 获取音频信息
				var v_obj = $(obj).closest('.test_content').find('.question_li:eq('+index+')').not('.question_li_1520').find('.speak_sentence.question.enable:first');
				
				// 为空
				if(v_obj == undefined || v_obj.length == 0){
					// 停止时间
					clearInterval(play_key);
					
					setTimeout(function(){
						// 添加标识
						$(that).closest('.test_content').find('.question_li:eq('+index+')').not('.question_li_1520').find('.speak_sentence.question').removeClass('enable').addClass('enable');
						
						// 下一步骤
						practice.ctrlOpr.execute_ctrl(that);
					}, 200);
					
					return false;
				}
				
				// 音频文件
				var file_name = $(v_obj).attr('data-mp3');
				// 开始时间
				var start_time = parseInt($(v_obj).attr('data-starttime'));
				// 结束时间
				var end_time = parseInt($(v_obj).attr('data-endtime'));
				// 删除标识位
				$(v_obj).removeClass('enable');
				
				// 装载音频文件
				TSP.audio.player.load(file_name);
				// 为空
				if(start_time == undefined || start_time === ''){
					start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
				}
				// 为空
				if(end_time == undefined || end_time == '' || end_time == 1 
						|| $(obj).closest('.test_content').attr('data-subtype') == '1508'){
					end_time = TSP.audio.player.audioElem.duration * 1000;
				}
				// 设置起始时间
				TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
				
				var suffix = file_name.substring(file_name.length - 4,file_name.length);
				if(suffix == '.ogg' || suffix == '.mp4'){
					var video =$(obj).closest('.test_content').find('.videoinfo').attr('data-ogg');
					var vplayer = VideoJS(video);
					vplayer.width(620);
					vplayer.height(250);
					// 停止时间
					//clearInterval(play_key);
					vplayer.play();
					vplayer.volume(0);
					//practice.ctrlOpr.play_video(that, video);
				}
				// 播放音频
				TSP.audio.player.play();
				
				// 音频总时间
				var total_time = end_time/1000.0 - start_time/1000.0;
				
				// 标识
				var flag = false;
				// 循环倒计时
				play_key = setInterval(function(){
					// 音频播放当前时间
					var remainder_time = TSP.audio.player.audioElem.getCurrentTime() - start_time/1000.0;
					// 进度条
					$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
					
					if(total_time - remainder_time <= 0){
						// 停止时间
						clearInterval(play_key);
						// 标识
						if(!flag){
							// 下一步骤
							practice.ctrlOpr.play_ky_li_video(obj, that, index);
							// 标识
							flag = true;
						}
					}
				}, 4);
				
				// 音频播放结束
				TSP.audio.files.getAudio(file_name).onended = function(){
					// 停止时间
					clearInterval(play_key);
					// 标识
					if(!flag){
						// 下一步骤
						practice.ctrlOpr.play_ky_li_video(obj, that, index);
						// 标识
						flag = true;
					}
				};
			},
			/**
			 * 播放图片排序音频（结果展示播放）
			 * @that 按钮dom对象
			 */
			play_audio_tppx : function(that){
				// 音频数组
				var audio_arr = [];
				// 所有句总时长
				var total_time = 0;
				$(that).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt').each(function(i, n){
					// 当前句实际序号
					var cur_index = $(n).attr('data-as-index');
					// 当前句dom
					var obj = $(that).closest('.test_content').find('.listen_sa .speak_sentence:eq('+ (cur_index - 1) +')');
					audio_arr[i] = {};
					// 当前句音频
					audio_arr[i].file_name = obj.attr('data-mp3');
					// 当前句起始时间
					audio_arr[i].start_time = parseFloat(obj.attr('data-starttime')) / 1000.0;
					// 当前句截止时间
					audio_arr[i].end_time = parseFloat(obj.attr('data-endtime')) / 1000.0;
					
					total_time += (audio_arr[i].end_time - audio_arr[i].start_time);
				});
				
				$('.test_ctrl_info_area .info_hint').show().text('播放原音');
				
				// 已播放时间
				var time_played = 0;
				
				var play_img_sen = function(i){
					if(i >= audio_arr.length){
						$('.test_ctrl_info_area').hide();
						// 停止时间
						clearInterval(play_key);
						// 停止播放
						TSP.audio.player.stop();
						// 置空
						$('body').attr('data-play-test-id', '');
						return;
					}
					// 停止音频
					TSP.audio.player.stop();
					// 装载音频文件
					TSP.audio.player.load(audio_arr[i].file_name);
					// 设置起始时间
					TSP.audio.player.audioElem.setCurrentTime(audio_arr[i].start_time);
					// 播放音频
					TSP.audio.player.play();
					
					// 循环倒计时
					play_key = setInterval(function(){
						// 音频播放当前时间
						var current_time = TSP.audio.player.audioElem.getCurrentTime();
						// 进度时间
						var process_time = current_time - audio_arr[i].start_time;
						
						// 进度条
						$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', ((time_played + process_time) / total_time * 100)+'%');
						
						$('.test_ctrl_info_area .remainder_time_area').show();
						// 剩余播放时间
						$('.test_ctrl_info_area .play_mp3_area .remainder_time').text(parseInt(total_time - time_played - process_time));
						
						// 单句播放完
						if(current_time >= audio_arr[i].end_time){
							time_played += process_time;
							// 停止时间
							clearInterval(play_key);
							// 停止播放
							TSP.audio.player.stop();
							i++;
							play_img_sen(i);
						}
						
						// 音频播放完
						TSP.audio.player.audioElem.onended = function(){
							time_played += process_time;
							// 停止时间
							clearInterval(play_key);
							// 停止播放
							TSP.audio.player.stop();
							i++;
							play_img_sen(i);
						}
						
					}, 10);
				}
				
				play_img_sen(0);
			},
			/**
			 * 播放音频
			 */
			play_audio : function(that, file_name, ctrl_name){
				// 停止音频
				TSP.audio.player.stop();
				// 装载音频文件
				TSP.audio.player.load(file_name);
				// 播放音频
				TSP.audio.player.play();
				// 音频总时间
				var total_time = TSP.audio.player.audioElem.duration;
				
				// 显示音频播放提示框
				$('.test_ctrl_info_area').show();
				// 隐藏进度条
				$('.test_ctrl_info_area .percentage_gray').show();
				// 隐藏录音进度条
				$('.test_ctrl_info_area .waveform_container').hide();
				
				// 步骤说明
				$('.test_ctrl_info_area .info_hint').show().html(ctrl_name);
				// 隐藏秒
				$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
				
				// 循环倒计时
				play_key = setInterval(function(){
					// 音频播放当前时间
					var remainder_time = TSP.audio.player.audioElem.getCurrentTime();
					
					// 进度条
					$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
					
					if(total_time - remainder_time <= 0){
						// 隐藏音频播放提示框
						$('.test_ctrl_info_area').hide();
						// 隐藏录音框
						$('.trans_test_ctrl_info_area').removeClass('recording');
						// 停止时间
						clearInterval(play_key);
						// 置空
						$('body').attr('data-play-test-id', '');
						// 对象不为空
						if(that != null){
							if(!is_primary){
								// 按钮字样
								$(that).html(ctrl_name);
							}
						}
					}
				}, 100);
				
				// 获取音频对象
				TSP.audio.files.getAudio(file_name).onended = function(){
					// 隐藏音频播放提示框
					$('.test_ctrl_info_area').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 停止时间
					clearInterval(play_key);
					// 置空
					$('body').attr('data-play-test-id', '');
					// 对象不为空
					if(that != null){
						if(!is_primary){
							// 按钮字样
							$(that).html(ctrl_name);
						}
					}
				};
			},
			/**
			 * 播放录音
			 */
			play_user_repeat_video : function(fileNames, index){
				// 音频文件存在且数量在播放范围内
				if(fileNames.length && fileNames.length >= index + 1){
					// 停止音频
					TSP.audio.player.stop();
					// MP3路径
					var file_name = window.URL.createObjectURL(fileNames[index]);
					// 音频对象
					TSP.audio.player.audioElem = document.createElement('audio');
					// 音频对象
					TSP.audio.player.audioElem.src = file_name;
					// 创建获取播放当前时间
					TSP.audio.player.audioElem.getCurrentTime = function(){
						if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
							return $("#AsrRecorder")[0].getCurrentTime() / 1000;
						}else{
							return this.currentTime;
						}
					}
					// 播放音频
					TSP.audio.player.play();
					
					// 显示音频播放提示框
					$('.test_ctrl_info_area').show();
					// 隐藏进度条
					$('.test_ctrl_info_area .percentage_gray').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					
					// 步骤说明
					$('.test_ctrl_info_area .info_hint').html('播放录音');
					// 隐藏秒
					$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
					
					// 循环倒计时
					play_key = setInterval(function(){
						// 音频总时间
						var total_time = TSP.audio.player.audioElem.duration;
						// 音频播放当前时间
						var remainder_time = TSP.audio.player.audioElem.getCurrentTime();
						
						// 进度条
						$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
						
						if(total_time - remainder_time <= 0){
							// 隐藏音频播放提示框
							$('.test_ctrl_info_area').hide();
							// 隐藏录音框
							$('.trans_test_ctrl_info_area').removeClass('recording');
							// 停止时间
							clearInterval(play_key);
						}
					}, 100);
					
					// 获取音频对象
					TSP.audio.player.audioElem.onended = function(){
						// 隐藏音频播放提示框
						$('.test_ctrl_info_area').hide();
						// 隐藏录音框
						$('.trans_test_ctrl_info_area').removeClass('recording');
						// 停止时间
						clearInterval(play_key);
						// 下一个音频
						index++;
						// 继续播放
						practice.ctrlOpr.play_user_repeat_video(fileNames, index);
					};
				}
				
				// 置空
				$('body').attr('data-play-test-id', '');
			},
			/**
			 * 播放录音
			 */
			play_user_video : function(file_name, ctrl_name, video_time){
				// 停止音频
				TSP.audio.player.stop();
				// MP3路径
				file_name = window.URL.createObjectURL(file_name);
				// 音频对象
				TSP.audio.player.audioElem = document.createElement('audio');
				// 音频对象
				TSP.audio.player.audioElem.src = file_name;
				// 创建获取播放当前时间
				TSP.audio.player.audioElem.getCurrentTime = function(){
					if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
						return $("#AsrRecorder")[0].getCurrentTime() / 1000;
					}else{
						return this.currentTime;
					}
				}
				
				// 播放音频
				TSP.audio.player.play();
				
				// 显示音频播放提示框
				$('.test_ctrl_info_area').show();
				// 隐藏进度条
				$('.test_ctrl_info_area .percentage_gray').show();
				// 隐藏录音进度条
				$('.test_ctrl_info_area .waveform_container').hide();
				
				// 步骤说明
				$('.test_ctrl_info_area .info_hint').html(ctrl_name);
				// 隐藏秒
				$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
				
				// 循环倒计时
				play_key = setInterval(function(){
					// 音频总时间
					var total_time = TSP.audio.player.audioElem.duration;
					// 音频播放当前时间
					var remainder_time = TSP.audio.player.audioElem.getCurrentTime();
					
					// 进度条
					$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
					
					if(total_time - remainder_time <= 0){
						// 隐藏音频播放提示框
						$('.test_ctrl_info_area').hide();
						// 隐藏录音框
						$('.trans_test_ctrl_info_area').removeClass('recording');
						// 停止时间
						clearInterval(play_key);
					}
				}, 100);
				
				// 获取音频对象
				TSP.audio.player.audioElem.onended = function(){
					// 隐藏音频播放提示框
					$('.test_ctrl_info_area').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 停止时间
					clearInterval(play_key);
				};
			}
		},
		// 波形
		waveForm : {
			/**
			 * 设置波形配置
			 */
			initWaveForm : function(){
				if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {//判断是否IE浏览器
					if(!$("#AsrRecorder")[0].sendToActionScript){
						ResourceLoadingMessageBox('close');
						$('body').css({
							'overflow' : 'hidden',
							'height' : '60px'
						});
						$('.full_screen#AsrRecorder').css({
							'top' : '60px'
						});

						var html = '<div style="background:#fff"><div class="flash_disabled_hint">如果出现本提示，说明Edge浏览器默认阻止 了Flash内容，请点击下方区域，并选择“始终允许”，以启用Flash录音功能。</div></div>';
						$('body').prepend(html);
						$('.flash_disabled_hint').css({
							'color' : 'red',
							'font-size' : '24px',
							'text-align' : 'center',
							'width' : '840px',
							'margin' : '0 auto',
							'font-family' : 'Hiragino Sans GB,Lantinghei SC,Microsoft Yahei,SimSun'
						});
						return;
					}
					$("#AsrRecorder")[0].sendToActionScript(TinSoConfig.asr);
				}else{
					$("#AsrRecorder").hide();
					var TSPspos = navigator.userAgent.search('Chrome');
					if(TSPspos != -1 && navigator.userAgent.substr(TSPspos) > 'Chrome/66'){
						var TSPRecWaveHandle = setInterval(function(){
							if(!!window.TSPAudioContext.TSP){
								clearInterval(TSPRecWaveHandle);
								if(!RecWave.inited){
									// 配置项
									var options = {
										container : document.getElementById('waveform_container'),
										interval : 1,				// 生成波形间隔
										zoom : 1					// 波形放大倍数
									}
									RecWave.record(options);
								}
							}
						}, 500);
					}else{
						if(!RecWave.inited){
							// 配置项
							var options = {
								container : document.getElementById('waveform_container'),
								interval : 1,				// 生成波形间隔
								zoom : 1					// 波形放大倍数
							}
							RecWave.record(options);
						}
					}
				}
			}
		},
		// 工具
		util : {
			/**
			 * 获取结构名称
			 */
			getKindName : function(kind){
				if(kind == 1){
					return '听力';
				}else if(kind == 2){
					return '口语';
				}else if(kind == 3){
					return '笔试';
				}else{
					return '未知';
				}
			},
			/**
			 * 计算录音用时数据
			 */
			getRecordFunction : function(time){
				var result = 0.0;
				if (time <= 1) {
					result = 2;
				}else if (time > 1 && time <= 2) {
					result = 2 * time;
				}else if (time > 2 && time <= 3) {
					result = 1.5 * time;
				}else if (time > 3) {
					result = time + 2;
				}
				return result + 2;
			}
		}
	};
}());

$(function(){
	$('body').onEvent({
		'click':{
			// 切换练习模式，自由练习->考试模式
			'#test-mode:not(:disabled)' : function(e){
				e.preventDefault();
				var mode = $(this).attr('data-mode');
				// 自由模式切换考试模式
				if(mode == 'free' || mode == 'exam'){
					var mode_str = mode == 'free' ? '考试' : '自由';
					var mode_replace = mode == 'free' ? 'exam' : 'free';
					MessageBox({
						content : '是否确定切换成'+ mode_str +'模式？',
						buttons : [{
					    	text : '确定',
					    	click : function(){
								$( this ).dialog('close');
								$(e.target).removeAttr('checked');
								// 保存答案
								TSP.practice.process.saveAnswer(function(){
									window.onbeforeunload = undefined;
									window.location.href = window.location.href.replace(/mode\=\w+/g, 'mode=' + mode_replace);
								});
							}
						}, {
							text : '取消',
							click : function(){
								$(this).dialog('close');
//								MessageBox({
//									content : '不保存将丢失练习记录，是否继续？',
//									buttons : [{
//										text : '继续',
//										click : function(){
//											$( this ).dialog('close');
//											window.location.href = window.location.href.replace(/mode\=\w+/g, 'mode=' + mode_replace);
//										}
//									}, {
//										text : '取消',
//										click : function(){
//											$( this ).dialog('close');
//										}
//									}]
//								});
							}
						}]
					});
				}
			},
			// 隐藏或显示原文
			'.btn_show_cnt' : function(){
				$('.test_content .question_content.blue_font').removeClass('blue_font').addClass('white_font');
				
				if($(this).closest('.test_content').find('.question_content').hasClass('blue_font')
						|| $(this).closest('.test_content').find('.question_content').hasClass('white_font')){
					$(this).closest('.test_content').find('.question_content').removeClass('white_font').removeClass('blue_font');
					$(this).html('隐藏原文');
				}else{
					$(this).closest('.test_content').find('.question_content').removeClass('white_font').addClass('blue_font');
					$(this).html('显示原文');
				}
			},
			// 暂停播放
			'.btn_pause' : function(){
				// 当前播放试题id
				var tid = $('body').attr('data-play-test-id');
				// 本按钮包含的试题id
				var btn_tid = $(this).closest('.test_content').attr('data-id');
				// 不为当前按钮
				if(btn_tid != tid){
					return false;
				}
				// 状态
				var status = $(this).attr('data-pause-status');
				if(status == undefined || status == 'play'){
					// 暂停音频
					TSP.audio.player.pause();
					// 状态
					$(this).attr('data-pause-status', 'pause').html('继续播放');
					
				}else{
					// 继续播放音频
					TSP.audio.player.play();
					// 状态
					$(this).attr('data-pause-status', 'play').html('暂停播放');
				}
			},
			// 开始答题
			'.btn_play:not(.disabled)':function(){
				zeroTypeA = false;
				var tid = $(this).closest('.test_content').attr('data-id');
				if($('.test_content[data-id="'+tid+'"]').attr('data-type') == 1400){
					// 保存试题
					$('body').attr('data-current-test-id' , tid);
				}
				if(window.location.pathname != '/Competition/paper.html' && !$(this).hasClass('primary_btn_play') && !$(this).hasClass('primary_btn_replay')){
					$('.btn_play:not(.disabled)').html('开始答题');
				}
				
				// 自动练习标识wait_video_css
				$('.wait_video_css:not(.pf)').remove();
				// 停止录音
				if(TSP.audio.recorder.inited){
					TSP.audio.recorder.stop();
				}
				// 重设录音
				if(videoResult[tid]){
					videoResult[tid] = undefined;
				}
				// 获取练习模式类型:1000-普通模式,2000-自动扣词,3000-手动扣词,4000-点读,5000-点说,6000-背诵全文
				var typeid = $(this).closest('.test_content').find('.chosBox').val();
				// 普通模式
				if(typeid == 1000 || typeid == null || typeid == undefined){
					// 删除样式
					$(this).closest('.test_content').find('.question_container .speak_sentence').removeClass('no_pass_font pass_font');
					// $(this).closest('.test_content').find('.question_container .speak_sentence_score').remove();
					$(this).closest('.test_content').find('.question_container .sentence_behind_space').remove();
					
					// 自动练习标识
					$(this).addClass('start');
					
					// 标识已做，题目序号
					if(is_primary){
						var id = $(this).closest('.test_content').attr('data-test-index');
					}else{
						var id = $(this).closest('.test_content').find('.question_container').attr('data-qid');
					}
					
					// 试题类型
					var kind = $(this).closest('.test_content').attr('data-kind');
					// 主题型
					var main_type = $(this).closest('.test_content').attr('data-type')
					// 子题型
					var sub_type = $(this).closest('.test_content').attr('data-subtype')
					// 听力口语，点击“开始答题”在答题卡上对应题号标记已做
					if(kind == 2 && sub_type != 1621 && sub_type != 1626 && main_type != 6200 && sub_type != 1631){
						$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					}
					// 图片排序
					if((sub_type == 1121 || sub_type == 1122 || sub_type == 1123 || sub_type == 1124) 
							&& $(this).hasClass('primary_btn_replay')){
						// 停止时间
						if(typeof pause_play_key != 'undefined'){
							clearInterval(pause_play_key);
						}
						// 移除当前句边框样式，添加顺序标识
						$(this).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt').removeClass('current_sort_option').addClass('enable');
						// 移除当前句星星图标
						$(this).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt .option_flag').removeClass('current_flag');
						// 初始化选择的图片
						$(this).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt .images_sort_option').html('<div class="question_mark"></div>');
						// 打乱图片顺序
						TSP.practice.primary.question.randomChildNodes($(this).closest('.test_content').find('.question_content'), '.option_label');
						// 随机设定音频播放顺序，也是答案的顺序
						TSP.practice.primary.question.randomChildNodes($(this).closest('.test_content').find('.images_sort_cnt'), '.images_sort_option_cnt');
						// 打乱后的顺序
						$(this).closest('.test_content').find('.images_sort_cnt .images_sort_option_cnt').attr('data-rd-index', function(){
							return $(this).index() + 1;
						});
					}
					
					// 按钮字样
					$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
					// 按钮字样
					if(is_primary){
						$(this).removeClass('primary_btn_replay').addClass('primary_btn_play');
					}else{
						// 竞赛练习页面
						if(window.location.pathname != '/Competition/paper.html'){
							$(this).html('开始答题');
						}
					}
					// 按钮字样
					$('.btn_play_audio').html('播放原音');
					// 按钮字样
					$('.btn_play_question').html('播放问题');
					// 按钮字样
					$('.btn_play_answer').html('播放答案');
					// 添加标识
					$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl').removeClass('enable').addClass('enable');
					// 添加标识
					$(this).closest('.test_content').find('.speak_sentence').removeClass('enable').addClass('enable');
					// 获取当前试题的id
					var tid = $(this).closest('.test_content').attr('data-id');
					// 记录当前播放音频试题id
					$('body').attr('data-play-id', tid);
					// 显示问题
					$(this).closest('.test_content').find('.question_question').show();
					if($(this).closest('.test_content').attr('data-type') != 1400 
							&& main_type!= 6100){
						// 清除结果区
						$(this).closest('.test_content').find('.left_area').html('');
					}
					// 获取该题目下第一试题
					var first_id = $(this).closest('.sub_test_area').find('.test_content:first').attr('data-id');
					// 来源
					var source = $('.p_paper_cnt').attr('data-source');
					// 结构part_id
					var struct_part_id = $(this).closest('.sub_test_area').attr('data-struct-part-id');
					// 过滤数据
					var part_ids = ['2703', '3282', '3723', '3730', '3731', '3732', '3931', '3932', '3933', '3934', '3994', '4025', '4034', 
						'5628', '5659', '5660', '5663', '5673', '5674', '5732', '5733', '5965', '5970', '5971', '5972', '5973', '5974', 
						'5921', '6881', '6928', '6929', '6934', '6935', '6940', '6941', '6998', '7028'];
					// 如果为自由练习模式
					if($('#test-mode[data-mode="free"]').is(':checked')){
						// 提示音、标题、等待时间
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl[data-is-test="1"]').removeClass('enable');
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl[data-is-test="2"]').removeClass('enable');
					}else{
						// 如果不是第一试题
						if(first_id == tid 
								&& (
										(type == 'paper' && source == 'ts')
										|| (type == 'homework' && source == 'hw' 
												&& (struct_type == 2 || struct_type == 3)
											)
									)
								&& $.inArray(struct_part_id, part_ids) == -1
						){}else{
							// 提示音
							$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(0)').removeClass('enable');
							// 标题音
							$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(1)').removeClass('enable');
							
							// 过滤数据
							var wait_part_ids = ['2702', '2703', '3338', '3723', '3930', '3931', '3932', '3933', '3934', '3936', '3988', '3995', '4023',
								'4026', '4077', '4078', '5674', '5736', '5970', '5971', '5972', '5973', '5974', '6996', '6999', '7001', '7028'];
							// 准备时间
							if($.inArray(struct_part_id, wait_part_ids) == -1 
									&& $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-act-type') == 0 
									&& $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-wait-time') > 0){
								$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').removeClass('enable');
							}
							
							// 判断是否读内容
							if($(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-act-type') == 1 
									&& $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-mp3-type') == 0){
								// 当前部分第一题试题id
								var first_test_id = $(this).closest('.test_sub_area').find('.sub_test_area:eq(0) .test_content:eq(0)').attr('data-id');
								// 当前标题MP3
								var now_title_mp3 = $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-mp3-path');
								// 不为空
								if(first_test_id != tid && (now_title_mp3 != undefined || now_title_mp3 != null)){
									// 本部分第一题的音频
									var first_test_mp3 = $(this).closest('.test_sub_area').find('.sub_test_area:eq(0) .test_ctrl_area li.test_ctrl:eq(3)').attr('data-mp3-path');
									// 如果名字相同
									if(now_title_mp3 == first_test_mp3){
										// 标题音
										$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').removeClass('enable');
									}
								}
							}
						}
					}
					
					// 按钮标签
					if(is_primary){
						$(this).removeClass('primary_btn_play').addClass('primary_btn_replay');
					}else{
						// 竞赛练习页面
						if(window.location.pathname != '/Competition/paper.html'){
							$(this).html('重新答题');
						}
					}
					// 停止时间
					clearInterval(remainder_key);
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(tape_remainder_key);
					
					// 重设录音
					if(videoResult[tid]){
						videoResult[tid] = undefined;
					}
					
					// 显示音频播放提示框
					$('.test_ctrl_info_area').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 停止音频
					TSP.audio.player.stop();
					
					// 1516济南情景问答显示问题
					if(sub_type == 1516){
						// 获取问题
						var qs_str = $(this).closest('.test_content').find('.question_division_line .question_li .speak_sentence.question').html();
						// 判断原来有没有信息
						if($(this).closest('.test_content').find('.question_content .question_info').length){
							$(this).closest('.test_content').find('.question_content .question_info').remove();
						}
						// 添加问题
						$(this).closest('.test_content').find('.question_content').append('<div class="question_info">' + qs_str + '</div>');
					}else if(main_type == 1500 && sub_type != 1520 && sub_type != 1510 && sub_type != 1512 && sub_type != 1514 && sub_type != 1516
								&& sub_type != 1522 && sub_type != 1523 && sub_type != 1524 && sub_type != 1526 && sub_type != 1527 
								&& sub_type != 1528 && sub_type != 1529 && sub_type != 1530 && sub_type != 1537 && sub_type != 1539 
								&& sub_type != 1540){
						// 保留数据
						var question_content_str = $(this).closest('.test_content').attr('data-question-content');
						// 存在
						if(question_content_str){
							$(this).closest('.test_content').find('.question_container .question_content').html(question_content_str);
						}else{
							// 保留数据
							question_content_str = $(this).closest('.test_content').find('.question_container .question_content').html();
							// 保存在试题上
							$(this).closest('.test_content').attr('data-question-content', question_content_str);
						}
					}
					
					// 执行步骤
					TSP.practice.ctrlOpr.execute_ctrl(this);
				
				}
				// 自动扣词
				else if(typeid == 2000){
					// 执行答题流程
					// 删除样式
					$(this).closest('.test_content').find('.question_container .speak_sentence').removeClass('no_pass_font pass_font');
					// $(this).closest('.test_content').find('.question_container .speak_sentence_score').remove();
					$(this).closest('.test_content').find('.question_container .sentence_behind_space').remove();
					
					// 自动练习标识
					$(this).addClass('start');
					
					// 标识已做
					var id = $(this).closest('.test_content').find('.question_container').attr('data-qid');
					
					// 试题类型
					var kind = $(this).closest('.test_content').attr('data-kind');
					// 听力口语，点击“开始答题”在答题卡上对应题号标记已做
					if((kind == 1 || kind == 2) && $(this).closest('.test_content').attr('data-subtype') != 1621 && $(this).closest('.test_content').attr('data-subtype') != 1626 && $(this).closest('.test_content').attr('data-subtype') != 1631){
						$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					}
					
					// 按钮字样
					$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
					// 按钮字样
					if(!is_primary){
						$(this).html('开始答题');
					}else{
						$(this).removeClass('primary_btn_replay').addClass('primary_btn_play');
					}
					// 按钮字样
					$('.btn_play_audio').html('播放原音');
					// 按钮字样
					$('.btn_play_question').html('播放问题');
					// 按钮字样
					$('.btn_play_answer').html('播放答案');
					// 添加标识
					$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl').removeClass('enable').addClass('enable');
					// 添加标识
					$(this).closest('.test_content').find('.speak_sentence').removeClass('enable').addClass('enable');
					// 获取当前试题的id
					var tid = $(this).closest('.test_content').attr('data-id');
					// 记录当前播放音频试题id
					$('body').attr('data-play-id', tid);
					// 显示问题
					$(this).closest('.test_content').find('.question_question').show();
					
					// 获取该题目下第一试题
					var first_id = $(this).closest('.sub_test_area').find('.test_content:first').attr('data-id');
					// 如果不是第一试题
					if(first_id == tid && ((type == 'paper' && $('.p_paper_cnt').attr('data-source') == 'ts')
						|| (type == 'homework' && $('.p_paper_cnt').attr('data-source') == 'hw' && struct_type == 3))
					){}else{
						// 提示音
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(0)').removeClass('enable');
						// 标题音
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(1)').removeClass('enable');
						
						// 准备时间
						if($(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-act-type') == 0 
								&& $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-wait-time') > 0){
							$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').removeClass('enable');
						}
					}
					
					// 按钮标签
					if(!is_primary){
						$(this).html('重新答题');
					}else{
						$(this).removeClass('primary_btn_play').addClass('primary_btn_replay');
					}
					// 停止时间
					clearInterval(remainder_key);
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(tape_remainder_key);
					
					// 重设录音
					if(videoResult[tid]){
						videoResult[tid] = undefined;
					}
					
					// 显示音频播放提示框
					$('.test_ctrl_info_area').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 停止音频
					TSP.audio.player.stop();
					
					// 执行步骤
					TSP.practice.ctrlOpr.execute_ctrl(this);
				}
				// 手动扣词
				else if(typeid == 3000){
					if(!$(this).closest('.p_operationBtn_container').siblings('.question_container').find('.kouarea').length){
						MessageBox({
							content : '请先手动进行扣词，再点击"开始答题"！',
							buttons : [{
								text : '我知道了',
								click : function(){
									$(this).dialog('close');
								}
							}]
						});
						return;
					}else{
						// 执行答题流程
						// 删除样式
						$(this).closest('.test_content').find('.question_container .speak_sentence').removeClass('no_pass_font pass_font');
						// $(this).closest('.test_content').find('.question_container .speak_sentence_score').remove();
						$(this).closest('.test_content').find('.question_container .sentence_behind_space').remove();
						
						// 自动练习标识
						$(this).addClass('start');
						
						// 标识已做
						var id = $(this).closest('.test_content').find('.question_container').attr('data-qid');
						
						// 试题类型
						var kind = $(this).closest('.test_content').attr('data-kind');
						// 听力口语，点击“开始答题”在答题卡上对应题号标记已做
						if((kind == 1 || kind == 2) && $(this).closest('.test_content').attr('data-subtype') != 1621 && $(this).closest('.test_content').attr('data-subtype') != 1626 && $(this).closest('.test_content').attr('data-subtype') != 1631){
							$('.p_answer_list ul li[data-index='+id+']').addClass('done');
						}
						
						// 按钮字样
						$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
						// 按钮字样
						if(!is_primary){
							$(this).html('开始答题');
						}else{
							$(this).removeClass('primary_btn_replay').addClass('primary_btn_play');
						}
						// 按钮字样
						$('.btn_play_audio').html('播放原音');
						// 按钮字样
						$('.btn_play_question').html('播放问题');
						// 按钮字样
						$('.btn_play_answer').html('播放答案');
						// 添加标识
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl').removeClass('enable').addClass('enable');
						// 添加标识
						$(this).closest('.test_content').find('.speak_sentence').removeClass('enable').addClass('enable');
						// 获取当前试题的id
						var tid = $(this).closest('.test_content').attr('data-id');
						// 记录当前播放音频试题id
						$('body').attr('data-play-id', tid);
						// 显示问题
						$(this).closest('.test_content').find('.question_question').show();
						
						// 获取该题目下第一试题
						var first_id = $(this).closest('.sub_test_area').find('.test_content:first').attr('data-id');
						// 如果不是第一试题
						if(first_id == tid && ((type == 'paper' && $('.p_paper_cnt').attr('data-source') == 'ts')
							|| (type == 'homework' && $('.p_paper_cnt').attr('data-source') == 'hw' && struct_type == 3))
						){}else{
							// 提示音
							$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(0)').removeClass('enable');
							// 标题音
							$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(1)').removeClass('enable');
							
							// 准备时间
							if($(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-act-type') == 0 
									&& $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-wait-time') > 0){
								$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').removeClass('enable');
							}
						}
						
						// 按钮标签
						if(!is_primary){
							$(this).html('重新答题');
						}else{
							$(this).removeClass('primary_btn_play').addClass('primary_btn_replay');
						}
						// 停止时间
						clearInterval(remainder_key);
						// 停止时间
						clearInterval(play_key);
						// 停止时间
						clearInterval(tape_remainder_key);
						
						// 重设录音
						if(videoResult[tid]){
							videoResult[tid] = undefined;
						}
						
						// 显示音频播放提示框
						$('.test_ctrl_info_area').show();
						// 隐藏录音进度条
						$('.test_ctrl_info_area .waveform_container').hide();
						// 隐藏录音框
						$('.trans_test_ctrl_info_area').removeClass('recording');
						// 停止音频
						TSP.audio.player.stop();
						
						// 执行步骤
						TSP.practice.ctrlOpr.execute_ctrl(this);
						
					}
				}
				// 背诵全文
				else if(typeid == 6000){
					// 执行答题流程
					// 删除样式
					$(this).closest('.test_content').find('.question_container .speak_sentence').removeClass('no_pass_font pass_font');
					// $(this).closest('.test_content').find('.question_container .speak_sentence_score').remove();
					$(this).closest('.test_content').find('.question_container .sentence_behind_space').remove();
					
					// 自动练习标识
					$(this).addClass('start');
					
					// 标识已做
					var id = $(this).closest('.test_content').find('.question_container').attr('data-qid');
					
					// 试题类型
					var kind = $(this).closest('.test_content').attr('data-kind');
					// 听力口语，点击“开始答题”在答题卡上对应题号标记已做
					if((kind == 1 || kind == 2) && $(this).closest('.test_content').attr('data-subtype') != 1621 && $(this).closest('.test_content').attr('data-subtype') != 1626 && $(this).closest('.test_content').attr('data-subtype') != 1631){
						$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					}
					
					// 按钮字样
					$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
					// 按钮字样
					if(!is_primary){
						$(this).html('开始答题');
					}else{
						$(this).removeClass('primary_btn_replay').addClass('primary_btn_play');
					}
					// 按钮字样
					$('.btn_play_audio').html('播放原音');
					// 按钮字样
					$('.btn_play_question').html('播放问题');
					// 按钮字样
					$('.btn_play_answer').html('播放答案');
					// 添加标识
					$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl').removeClass('enable').addClass('enable');
					// 添加标识
					$(this).closest('.test_content').find('.speak_sentence').removeClass('enable').addClass('enable');
					// 获取当前试题的id
					var tid = $(this).closest('.test_content').attr('data-id');
					// 记录当前播放音频试题id
					$('body').attr('data-play-id', tid);
					// 显示问题
					$(this).closest('.test_content').find('.question_question').show();
					
					// 获取该题目下第一试题
					var first_id = $(this).closest('.sub_test_area').find('.test_content:first').attr('data-id');
					// 如果不是第一试题
					if(first_id == tid && ((type == 'paper' && $('.p_paper_cnt').attr('data-source') == 'ts')
						|| (type == 'homework' && $('.p_paper_cnt').attr('data-source') == 'hw' && struct_type == 3))
					){}else{
						// 提示音
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(0)').removeClass('enable');
						// 标题音
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(1)').removeClass('enable');
						
						// 准备时间
						if($(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-act-type') == 0 
								&& $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-wait-time') > 0){
							$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').removeClass('enable');
						}
					}
					
					// 按钮标签
					if(!is_primary){
						$(this).html('重新答题');
					}else{
						$(this).removeClass('primary_btn_play').addClass('primary_btn_replay');
					}
					// 停止时间
					clearInterval(remainder_key);
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(tape_remainder_key);
					
					// 重设录音
					if(videoResult[tid]){
						videoResult[tid] = undefined;
					}
					
					// 显示音频播放提示框
					$('.test_ctrl_info_area').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 停止音频
					TSP.audio.player.stop();
					
					// 执行步骤
					TSP.practice.ctrlOpr.execute_ctrl(this);
				}
				// 补句
				else if(typeid == 7000){
					// 执行答题流程
					// 删除样式
					$(this).closest('.test_content').find('.question_container .speak_sentence').removeClass('no_pass_font pass_font');
					// $(this).closest('.test_content').find('.question_container .speak_sentence_score').remove();
					$(this).closest('.test_content').find('.question_container .sentence_behind_space').remove();
					
					// 自动练习标识
					$(this).addClass('start');
					
					// 标识已做
					var id = $(this).closest('.test_content').find('.question_container').attr('data-qid');
					
					// 试题类型
					var kind = $(this).closest('.test_content').attr('data-kind');
					// 听力口语，点击“开始答题”在答题卡上对应题号标记已做
					if((kind == 1 || kind == 2) && $(this).closest('.test_content').attr('data-subtype') != 1621 && $(this).closest('.test_content').attr('data-subtype') != 1626 && $(this).closest('.test_content').attr('data-subtype') != 1631){
						$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					}
					
					// 按钮字样
					$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
					// 按钮字样
					if(!is_primary){
						$(this).html('开始答题');
					}else{
						$(this).removeClass('primary_btn_replay').addClass('primary_btn_play');
					}
					// 按钮字样
					$('.btn_play_audio').html('播放原音');
					// 按钮字样
					$('.btn_play_question').html('播放问题');
					// 按钮字样
					$('.btn_play_answer').html('播放答案');
					// 添加标识
					$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl').removeClass('enable').addClass('enable');
					// 添加标识
					$(this).closest('.test_content').find('.speak_sentence').removeClass('enable').addClass('enable');
					// 获取当前试题的id
					var tid = $(this).closest('.test_content').attr('data-id');
					// 记录当前播放音频试题id
					$('body').attr('data-play-id', tid);
					// 显示问题
					$(this).closest('.test_content').find('.question_question').show();
					
					// 获取该题目下第一试题
					var first_id = $(this).closest('.sub_test_area').find('.test_content:first').attr('data-id');
					// 如果不是第一试题
					if(first_id == tid && ((type == 'paper' && $('.p_paper_cnt').attr('data-source') == 'ts')
						|| (type == 'homework' && $('.p_paper_cnt').attr('data-source') == 'hw' && struct_type == 3))
					){}else{
						// 提示音
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(0)').removeClass('enable');
						// 标题音
						$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(1)').removeClass('enable');
						
						// 准备时间
						if($(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-act-type') == 0 
								&& $(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').attr('data-wait-time') > 0){
							$(this).closest('.test_content').find('.test_ctrl_area li.test_ctrl:eq(3)').removeClass('enable');
						}
					}
					
					// 按钮标签
					if(!is_primary){
						$(this).html('重新答题');
					}else{
						$(this).removeClass('primary_btn_play').addClass('primary_btn_replay');
					}
					// 停止时间
					clearInterval(remainder_key);
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(tape_remainder_key);
					
					// 重设录音
					if(videoResult[tid]){
						videoResult[tid] = undefined;
					}
					
					// 显示音频播放提示框
					$('.test_ctrl_info_area').show();
					// 隐藏录音进度条
					$('.test_ctrl_info_area .waveform_container').hide();
					// 隐藏录音框
					$('.trans_test_ctrl_info_area').removeClass('recording');
					// 停止音频
					TSP.audio.player.stop();
					
					// 执行步骤
					TSP.practice.ctrlOpr.execute_ctrl(this);
				}
				// 点读、点说
				else if(typeid == 4000 || typeid == 5000){
					// 标识已做
					var id = $(this).closest('.test_content').find('.question_container').attr('data-qid');
					$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					MessageBox({
						content : '请直接在题目内容区域进行操作！',
						buttons : [{
							text : '我知道了',
							click : function(){
								$(this).dialog('close');
							}
						}]
					});
					return;
				}
				// 跟读
				else if(typeid == 8000){
					// 标识已做
					var id = $(this).closest('.test_content').find('.question_container').attr('data-qid');
					$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					// 获取当前试题的id
					var tid = $(this).closest('.test_content').attr('data-id');
					// 重设录音
					if(videoResult[tid]){
						videoResult[tid] = undefined;
					}
					$(this).addClass('start');
					// 停止播放
					TSP.audio.player.stop();
					// 停止时间
					clearInterval(play_key);
					// 停止时间
					clearInterval(tape_remainder_key);
					// 删除选中样式
					$('.test_content .speak_sentence').removeClass('high_light_font');
					// 隐藏音频播放提示框
					$('.test_ctrl_info_area').hide();
					// 显示分数
					$('.ctrl_info_span .score').hide();
					// 移除分数
					// $(this).closest('.test_content').find('.speak_sentence_score').remove();
					$(this).closest('.test_content').find('.sentence_behind_space').remove();
					// 初始化单句样式
					$(this).closest('.test_content').find('.speak_sentence').removeAttr('data-time-flag').removeClass('no_pass_font pass_font enable').addClass('enable');
					// 停止音频
					TSP.audio.player.stop();
					
					gd(this);
				}
				
				
			},
			// 点击题目单句
			'.speak_sentence' :function(){
				var tid = $(this).closest('.test_content').attr("data-id");
				// 子类型
				var sub_type = $(this).closest('.test_content').attr('data-subtype');
				// 为贵阳题型
				if(sub_type == 1428 || sub_type == 1438){
					return false;
				}
				var typeid = $(this).closest('.test_content').find('.p_operationBtn_container .chosBox').val();
				if(typeid == 1000 || typeid == 4000 || typeid == 5000){
					$('body').off("selectstart");
				}else{
					$('body').on("selectstart",function(){
						return false;
					});
				}
				if(zeroTypeC){
					
				}else{
					if(typeid == 5000){
						if($(this).hasClass('pass_font') || $(this).hasClass('no_pass_font') || $(this).hasClass('high_light_font')){
							MessageBox({
								content : '此句您已经进行过点说判分！请操作其余单句！',
								buttons : [{
									text : '我知道了',
									click : function(){
										$(this).dialog('close');
									}
								}]
							});
							return;
						}
					}
					var sen_starttime = $(this).attr('data-starttime');
					if(typeid == 4000 || typeid == 5000){
						$('.speak_sentence').removeClass('high_light_font');
						$(this).addClass('high_light_font');
					}
					// 获取练习模式类型:1000-普通模式,2000-自动扣词,3000-手动扣词,4000-点读,5000-点说,6000-背诵全文
					if(typeid == 4000){
						initSpeakArea();
						// $(this).closest('.test_content .speak_sentence_score').remove();
						$(this).closest('.test_content .sentence_behind_space').remove();
						dd(this);
					}else if(typeid == 5000){
						initSpeakArea();
						$('.test_content .speak_sentence').removeClass('high_light_font');
						ds(this);
					}
				}
				
			},
			// 播放音频
			'.btn_play_audio' : function(){
				btn_play_audio = true;
				// 停止时间
				clearInterval(play_key);
				// 按钮字样
				if(!is_primary){
					$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
					// 按钮字样
					$('.btn_play_audio').html('播放原音');
					// 按钮字样
					$('.btn_play_question').html('播放问题');
					// 按钮字样
					$('.btn_play_answer').html('播放答案');
					// 按钮字样
					$(this).html('重新播放');
					$('.btn_play_audio').removeClass('current_play');
					$('.btn_play_video').removeClass('current_play');
					$(this).addClass('current_play');
				}
				
				// 试题类型
				var kind = $(this).closest('.test_content').attr('data-kind');
				// 试题id
				var tid = $(this).closest('.test_content').attr('data-id');
				// 保存当前播放音频的id
				$('body').attr('data-play-test-id', tid);
				
				// 音频名称
				var file_name = '';
				
				// 听力题型
				if(kind == 1){
					var sub_type = $(this).closest('.test_content').attr('data-subtype');
					// 播放图片排序音频
					if(1121 == sub_type || sub_type == 1122 || sub_type == 1123 || sub_type == 1124){
						// 显示音频播放提示框
						$('.test_ctrl_info_area').show();
						// 隐藏进度条
						$('.test_ctrl_info_area .percentage_gray').show();
						// 隐藏录音进度条
						$('.test_ctrl_info_area .waveform_container').hide();
						// 播放图片排序图片对应音频
						TSP.practice.ctrlOpr.play_audio_tppx(this);
						return;
					}else{
						// 音频名称
						file_name = $(this).closest('.test_content').find('.p_Laudio').attr('data-mp3');
					}
				}else if(kind == 2){
					// 主类型
					var main_type = $(this).closest('.test_content').attr('data-type');
					// 子类型
					var sub_type = $(this).closest('.test_content').attr('data-subtype');
					// 7100题型
					if(main_type == '7100'){
						if($(this).closest('.p_operationBtn_container').length){
							// 音频名称
							file_name = $(this).closest('.p_operationBtn_container').prev().find('.speak_sentence').attr('data-mp3');
						}else{
							// 音频名称
							file_name = $(this).closest('.btn_info_area').prev().find('.speak_sentence').attr('data-mp3');
						}
					}else{
						// 音频对象
						var audio_obj = $(this).closest('.test_content').find('.p_Laudio');
						
						// 为空
						if(audio_obj != undefined && audio_obj.length > 0){
							// 音频名称
							file_name = $(audio_obj).attr('data-mp3');
						}
						
						// 文件为空
						if(file_name == undefined || file_name == '' || file_name == 0){
							// 音频文件
							$(this).closest('.test_content').find('.speak_sentence:not(.no_audio)').each(function(i, obj){
								file_name = $(this).attr('data-mp3');
							});
						}
					}
				}
				// 播放音频
				TSP.practice.ctrlOpr.play_audio(this, file_name, '播放原音');
			},
			// 播放问题
			'.btn_play_question' : function(){
				// 停止时间
				clearInterval(play_key);
				// 停止音频
				TSP.audio.player.stop();
				// 按钮字样
				$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
				// 按钮字样
				$('.btn_play_audio').html('播放原音');
				// 按钮字样
				$('.btn_play_question').html('播放问题');
				// 按钮字样
				$('.btn_play_answer').html('播放答案');
				// 按钮字样
				$(this).html('重新播放');
				
				// 音频名称
				var file_name = $(this).closest('.question_li:not(.question_li_1520)').find('.speak_sentence.question').attr('data-mp3');
				if(file_name == undefined){
					// 音频对象
					var audio_obj = $(this).closest('.test_content').find('.p_Laudio');
					
					// 为空
					if(audio_obj != undefined && audio_obj.length > 0){
						// 音频名称
						file_name = $(audio_obj).attr('data-mp3');
					}
					
					// 文件为空
					if(file_name == undefined || file_name == '' || file_name == 0){
						// 音频文件
						$(this).closest('.test_content').find('.speak_sentence:not(.no_audio)').each(function(i, obj){
							file_name = $(this).attr('data-mp3');
						});
					}
				}
				// 试题id
				var tid = $(this).closest('.test_content').attr('data-id');
				// 保存试题id
				$('body').attr('data-play-test-id', tid);
				var point = file_name.lastIndexOf("."); 			       
			    var suffix = file_name.substr(point); 
				if(suffix == '.mp3'){
					// 播放音频
					TSP.practice.ctrlOpr.play_audio(this, file_name, '播放问题');			
				}else if(suffix == '.ogg' || suffix == '.mp4'){
					var video =$(this).closest('.test_content').find('.videoinfo').attr('data-ogg');
					var player = VideoJS(video);
					player.width(620);
					player.height(250);
					// 停止时间
					//clearInterval(play_key);
					player.play();
				}
			},
			// 播放答案
			'.btn_play_answer' : function(){
				// 停止时间
				clearInterval(play_key);
				// 停止音频
				TSP.audio.player.stop();
				// 按钮字样
				$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
				// 按钮字样
				$('.btn_play_audio').html('播放原音');
				// 按钮字样
				$('.btn_play_question').html('播放问题');
				// 按钮字样
				$('.btn_play_answer').html('播放答案');
				// 按钮字样
				$(this).html('重新播放');
				
				// 音频名称
				var file_name = $(this).closest('.question_li:not(.question_li_1520)').find('.speak_sentence.answer').attr('data-mp3');
				// 试题id
				var tid = $(this).closest('.test_content').attr('data-id');
				// 保存当前播放音频的id
				$('body').attr('data-play-test-id', tid);
				// 播放音频
				TSP.practice.ctrlOpr.play_audio(this, file_name, '播放答案');
			},
			// 播放录音(朗读短文、话题简述)
			'.btn_play_video:not(.question)' : function(){
				btn_play_audio = true;
				// 主题型
				var main_type = $(this).closest('.test_content').attr('data-type');
				// 子题型
				var sub_type = $(this).closest('.test_content').attr('data-subtype');
				// 试题id
				var tid = $(this).closest('.test_content').attr('data-id');
				// 停止时间
				clearInterval(play_key);
				// 停止音频
				TSP.audio.player.stop();
				// 保存当前播放音频的id
				$('body').attr('data-play-test-id', tid);
				
				// 如果是练习记录页面
				if($('.p_paper_cnt').attr('data-page') == 'record'){
					var count = $(this).closest('.test_content').attr('data-count');
					// mp3地址
					var mp3 = $(this).closest('.test_content').attr('data-record-mp3');
					if(mp3 == undefined || mp3.search('data.waiyutong.org/asr/') < 0){
						// 没有录音文件
						MessageBox({
							content : '没有录音信息',
							buttons : [{
								text : '我知道了',
								click : function(){
									$(this).dialog('close');
								}
							}]
						});
						return;
					}
					
					// 按钮字样
					$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
					// 按钮字样
					$('.btn_play_audio').html('播放原音');
					// 按钮字样
					$('.btn_play_question').html('播放问题');
					// 按钮字样
					$('.btn_play_answer').html('播放答案');
					// 按钮字样
					$(this).html('重新播放');
					// mp3地址数组
					var mp3_arr = mp3.split(',');
					// 删除最后一个空元素
					mp3_arr.pop();
					
					/**
					 * @param file_src string 音频文件地址	如：http://data.waiyutong.org/asr/00000000000004057881.mp3
					 */
					var record_play = function(file_src){
						if(file_src.search('/') >= 0){
							var file_name = file_src.substr(file_src.lastIndexOf('/') + 1);
						}else{
							var file_name = file_src;
						}
						
						if(file_name == '' || file_src == ''){
							// 没有录音文件
							MessageBox({
								content : '没有录音信息',
								buttons : [{
									text : '我知道了',
									click : function(){
										$(this).dialog('close');
									}
								}]
							});
							return;
						}
						
						// 音频对象
						TSP.audio.player.audioElem = TSP.audio.files.getAudio(file_name);
						// 音频地址
						TSP.audio.player.audioElem.src = file_src;
						// 播放音频
						TSP.audio.player.play();
						
						// 显示音频播放提示框
						$('.test_ctrl_info_area').show();
						// 隐藏进度条
						$('.test_ctrl_info_area .percentage_gray').show();
						// 隐藏录音进度条
						$('.test_ctrl_info_area .waveform_container').hide();
						
						// 步骤说明
						$('.test_ctrl_info_area .info_hint').html('播放录音');
						// 隐藏秒
						$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
						
						// 循环倒计时
						play_key = setInterval(function(){
							// 音频总时间
							var total_time = TSP.audio.player.audioElem.duration;
							// 音频播放当前时间
							var remainder_time = TSP.audio.player.audioElem.getCurrentTime();
							
							// 进度条
							$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
							
							if(total_time - remainder_time <= 0){
								// 隐藏音频播放提示框
								$('.test_ctrl_info_area').hide();
								// 隐藏录音框
								$('.trans_test_ctrl_info_area').removeClass('recording');
								// 停止时间
								clearInterval(play_key);
								// 置空
								$('body').attr('data-play-test-id', '');
							}
						}, 100);
					}
					
					// 7100题型录音播放
					if(main_type == 7100){
						var index = $(this).closest('.test_content').find('.btn_play_video').index(this);
						var file_src = mp3_arr[index];
						
						record_play(file_src);
					}else{
						// 一个小题，多个音频文件
						if(mp3_arr.length > 1 && count == 1){
							// 当前播放的音频文件序号
							var mp3_cur = 0;
							
							(function multi_record_play(mp3_cur){
								// 音频地址为空
								if($.trim(mp3_arr[mp3_cur]) == ''){
									mp3_cur++;
									multi_record_play(mp3_cur);
									return;
								}
								record_play(mp3_arr[mp3_cur]);
								// 音频播放完毕
								TSP.audio.player.audioElem.onended = function(){
									// 隐藏音频播放提示框
									$('.test_ctrl_info_area').hide();
									// 隐藏录音框
									$('.trans_test_ctrl_info_area').removeClass('recording');
									// 停止时间
									clearInterval(play_key);
									// 置空
									$('body').attr('data-play-test-id', '');
									mp3_cur++;
									if(mp3_cur < mp3_arr.length){
										multi_record_play(mp3_cur);
									}
								};
							})(mp3_cur);
						}
						/**
						 * 一个小题有一个音频文件	或
						 * 多个小题有多个音频文件
						 */
						else{
							// 播放的小题序号
							var idx = $(this).closest('.question_li').index();
							idx = idx < 0 ? 0 : idx;
							// 音频地址
							var file_src = mp3_arr[idx];
							
							record_play(file_src);
							
							// 音频播放完毕
							TSP.audio.player.audioElem.onended = function(){
								// 隐藏音频播放提示框
								$('.test_ctrl_info_area').hide();
								// 隐藏录音框
								$('.trans_test_ctrl_info_area').removeClass('recording');
								// 停止时间
								clearInterval(play_key);
								// 置空
								$('body').attr('data-play-test-id', '');
							};
						}
					}
					return;
				}
				$('.btn_play_audio').removeClass('current_play');
				$('.btn_play_video').removeClass('current_play');
				$(this).addClass('current_play');
				
				// 录音的时间戳
				var video_time = 0;
				
				// 不为空
				if(videoResult != undefined && videoResult != null 
						&& videoResult[tid] != undefined && videoResult[tid] != null){
					// 7100特殊题型
					if(main_type == '7100'){
						// 按钮序号
						var btn_index = 0;
						$(this).closest('.test_content').find('.btn_play_video').each(function(m, nm){
							if($(this).hasClass('current_play')){
								btn_index = m;
							}
						});
						
						// 序号
						var video_num = 0;
						
						// 获取音频时间戳
						$.each(videoResult[tid], function(key, obj){
							if(video_num == btn_index){
								video_time = key;
							}
							video_num++;
						});
						
						// 时间戳存在
						if(video_time > 0){
							// 获取音频
							if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
								$("#AsrRecorder")[0].playBack(tid);
							}else{
								TSP.audio.recorder.getWaveByTime(video_time);
							}
							return;
						}
					}else{
						if($(this).closest('.test_content').find('.question_container .speak_sentence').length > 1){
							var times = new Array();
							// 获取音频时间戳
							$.each(videoResult[tid], function(key, obj){
								times.push(key);
							});
							
							// 时间戳存在
							if(times.length){
								// 获取音频
								if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
									$("#AsrRecorder")[0].playBack(tid);
								}else{
									TSP.audio.recorder.getWaveByTimes(times);
								}
								
								return;
							}
						}else{
    						// 获取音频时间戳
    						$.each(videoResult[tid], function(key, obj){
    							video_time = key;
    						});
							
							// 时间戳存在
							if(video_time > 0){
								// 获取音频
								if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
									$("#AsrRecorder")[0].playBack(tid);
								}else{
									TSP.audio.recorder.getWaveByTime(video_time);
								}
								return;
							}
						}
					}
				}
				
				// 没有录音文件
				MessageBox({
					content : '没有录音信息',
					buttons : [{
						text : '我知道了',
						click : function(){
							$(this).dialog('close');
						}
					}]
				});
			},
			// 播放录音(情景问答)
			'.btn_play_video.question' : function(){
				// 如果是练习记录页面
				if($('.p_paper_cnt').attr('data-page') == 'record'){
					// 停止时间
					clearInterval(play_key);
					// 停止音频
					TSP.audio.player.stop();
					var count = $(this).closest('.test_content').attr('data-count');
					// mp3地址
					var mp3 = $(this).closest('.test_content').attr('data-record-mp3');
					if(mp3 == undefined || mp3.search('data.waiyutong.org/asr/') < 0){
						// 没有录音文件
						MessageBox({
							content : '没有录音信息',
							buttons : [{
								text : '我知道了',
								click : function(){
									$(this).dialog('close');
								}
							}]
						});
						return;
					}
					// 试题id
					var tid = $(this).closest('.test_content').attr('data-id');
					// 保存当前播放音频的id
					$('body').attr('data-play-test-id', tid);
					// 按钮字样
					$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
					// 按钮字样
					$('.btn_play_audio').html('播放原音');
					// 按钮字样
					$('.btn_play_question').html('播放问题');
					// 按钮字样
					$('.btn_play_answer').html('播放答案');
					// 按钮字样
					$(this).html('重新播放');
					// mp3地址数组
					var mp3_arr = mp3.split(',');
					// 最后一个数组元素是空字符串
					if(mp3_arr[mp3_arr.length - 1] == ''){
						// 删除最后一个空元素
						mp3_arr.pop();
					}
					
					/**
					 * @param file_src string 音频文件地址	如：http://data.waiyutong.org/asr/00000000000004057881.mp3
					 */
					var record_play = function(file_src){
						if(file_src.search('/') >= 0){
							var file_name = file_src.substr(file_src.lastIndexOf('/') + 1);
						}else{
							var file_name = file_src;
						}
						
						// 音频对象
						TSP.audio.player.audioElem = TSP.audio.files.getAudio(file_name);
						// 音频地址
						TSP.audio.player.audioElem.src = file_src;
						// 播放音频
						TSP.audio.player.play();
						
						// 显示音频播放提示框
						$('.test_ctrl_info_area').show();
						// 隐藏进度条
						$('.test_ctrl_info_area .percentage_gray').show();
						// 隐藏录音进度条
						$('.test_ctrl_info_area .waveform_container').hide();
						
						// 步骤说明
						$('.test_ctrl_info_area .info_hint').html('播放录音');
						// 隐藏秒
						$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
						
						// 循环倒计时
						play_key = setInterval(function(){
							// 音频总时间
							var total_time = TSP.audio.player.audioElem.duration;
							// 音频播放当前时间
							var remainder_time = TSP.audio.player.audioElem.getCurrentTime();
							
							// 进度条
							$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
							
							if(total_time - remainder_time <= 0){
								// 隐藏音频播放提示框
								$('.test_ctrl_info_area').hide();
								// 隐藏录音框
								$('.trans_test_ctrl_info_area').removeClass('recording');
								// 停止时间
								clearInterval(play_key);
								// 置空
								$('body').attr('data-play-test-id', '');
							}
						}, 100);
					}
					
					// 一个小题，多个音频文件
					if(mp3_arr.length > 1 && count == 1){
						// 当前播放的音频文件序号
						var mp3_cur = 0;
						
						(function multi_record_play(mp3_cur){
							// 音频地址为空
							if($.trim(mp3_arr[mp3_cur]) == ''){
								mp3_cur++;
								multi_record_play(mp3_cur);
								return;
							}
							record_play(mp3_arr[mp3_cur]);
							// 音频播放完毕
							TSP.audio.player.audioElem.onended = function(){
								// 隐藏音频播放提示框
								$('.test_ctrl_info_area').hide();
								// 隐藏录音框
								$('.trans_test_ctrl_info_area').removeClass('recording');
								// 停止时间
								clearInterval(play_key);
								// 置空
								$('body').attr('data-play-test-id', '');
								mp3_cur++;
								if(mp3_cur < mp3_arr.length){
									multi_record_play(mp3_cur);
								}
							};
						})(mp3_cur);
					}
					/**
					 * 一个小题有一个音频文件	或
					 * 多个小题有多个音频文件
					 */
					else{
						// 播放的小题序号
						var idx = $(this).closest('.question_li').index();
						idx = idx < 0 ? 0 : idx;
						// 音频地址
						var file_src = mp3_arr[idx];
						
						record_play(file_src);
						
						// 音频播放完毕
						TSP.audio.player.audioElem.onended = function(){
							// 隐藏音频播放提示框
							$('.test_ctrl_info_area').hide();
							// 隐藏录音框
							$('.trans_test_ctrl_info_area').removeClass('recording');
							// 停止时间
							clearInterval(play_key);
							// 置空
							$('body').attr('data-play-test-id', '');
						};
					}
					return;
				}
				
				// 停止时间
				clearInterval(play_key);
				// 停止音频
				TSP.audio.player.stop();
				// 获取该题id
				var tid = $(this).closest('.test_content').attr('data-id');
				// 保存当前播放音频的id
				$('body').attr('data-play-test-id', tid);
				$('.btn_play_audio').removeClass('current_play');
				$('.btn_play_video').removeClass('current_play');
				$(this).addClass('current_play');
				
				// 录音的时间戳
				var video_time = 0;
				
				// 不为空
				if(videoResult != undefined && videoResult != null 
						&& videoResult[tid] != undefined && videoResult[tid] != null){
					// 问题的序号
					var index = $(this).closest('.question_li:not(.question_li_1520)').index();
					
					// 计数
					var num = 0;
					// 获取音频时间戳
					$.each(videoResult[tid], function(key, obj){
						// 当前录音
						if(num == index){
							video_time = key;
						}
						// 序号自增
						num++;
					});
					
					// 时间戳存在
					if(video_time > 0){
						// 获取音频
						if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) {
							$("#AsrRecorder")[0].playBackForDialogue(tid, index);
						}else{
							TSP.audio.recorder.getWaveByTime(video_time);
						}
						return;
					}
				}
				
				// 没有录音文件
				MessageBox({
					content : '没有录音信息',
					buttons : [{
						text : '我知道了',
						click : function(){
							$(this).dialog('close');
						}
					}]
				});
			},
			// 显示解析及答案
			'.btn_answer' : function(){
				// 显示答案
				$(this).closest('.test_content').find('.analysis').toggle();
				// 显示答案
				$(this).closest('.test_content').find('.question_dialogue').toggle();
				// 显示知识点
				$(this).closest('.test_content').find('.p_knowledge_points').toggle();
				// 显示听力原文
				$(this).closest('.test_content').find('.listening_text').toggle();
				// 显示情景对话问题
				$(this).closest('.test_content').find('.sub_type_1520 .question_division_line').show();
				// 主类型
				var main_type = $(this).closest('.test_content').attr('data-type');
				// 子类型
				var sub_type = $(this).closest('.test_content').attr('data-subtype');
				// 7100试题处理
				if(main_type == '7100'){
					// 显示口语(情景对话)原文
					$(this).closest('.test_content').find('.question_division_line').toggle();
				}else{
					// 显示口语(情景对话)原文
					$(this).closest('.test_content').find('.question_division_line').toggle();
				}
			},
			//展开收起试卷信息
			'.click_to_slide' : function(){
				$(this).hide();
				if($(this).hasClass('slideToUp')){
					$(this).find('i').toggleClass('triangle_up triangle_down');
					$(this).find('span').text('点击展开');
					$('.p_paperInfo_box').slideUp(function(){
						$('.click_to_slide').css({'margin-top' : '0'}).show();
					});
				}else if($(this).hasClass('slideToDown')){
					$(this).find('i').toggleClass('triangle_up triangle_down');
					$(this).find('span').text('点击收起');
					$('.p_paperInfo_box').slideDown(function(){
						$('.click_to_slide').css({'margin-top' : '-32px'}).show();
					});
				}
				$(this).toggleClass('slideToUp slideToDown');
			},
			//加入题库
			'.add_to_bank' : function(){
				var id = $(this).closest('.test_content').attr('data-id');
				var main_type = $(this).closest('.test_content').attr('data-type');
				
				// 初始化
				$('.P_add_to_bank_area input[name="reason"]').attr('checked', false);
				$('.P_add_to_bank_area .extra_reasons textarea[name=reasons_input]').val('');
				
				$('.P_add_to_bank_area').dialog({
					hide : true,
					modal : true,
					resizable : false,
					width : 600,
					title : '加入题库',
					dialogClass: 'message-dialog green-dialog',
					buttons:{
						'确定':function(){
							var reasons = '';
							$('input[name=reason]:checked').each(function(i, n){
								if(i != 0){
									reasons += '/';
								}
								reasons += $(n).val();
							});
							var extReason = $('.extra_reasons textarea[name=reasons_input]').val();
							if(!extReason.match(/^\s*$/)){
								if(reasons != '' && !extReason.match(/^\s*$/)){
									reasons += '/';
								}
								reasons += extReason;
							}
							if(reasons.match(/^\s*$/)){
								MessageBox({
									content : '请添加收藏的原因~',
									buttons : [{
										text : '我知道了',
										click : function(){
											$(this).dialog('close');
										}
									}]
								});
								return;
							}
							
							var params = {};
							params.savereason = reasons;
							params.testid = id;
							params.MainType = main_type;
							params.SaveVersion = version_id;
							params.SaveGrade = grade_id;
							params.SaveUnit = unit_ids;
							params.PracticeType = type;
							
							$.post(TinSoConfig.student + '/Questions/addFavorite.html', params, function(data){
								if(data.status){
									data = data.info;
									if(data > 0){
										$('.test_content[data-id="'+ id + '"] .add_to_bank').removeClass('add_to_bank').addClass('remove_from_bank').attr('title','移出我的题库');
									}										
								}else{
									MessageBox({
										content : '加入精题库失败！',
										buttons : [{
											text : '我知道了',
											click : function(){
												$( this ).dialog( 'close' );
											}
										}]
									}, 'warning');
								}
							});
							
							$(this).dialog('close');
						}, 
						'取消':function(){ 
							$(this).dialog('close');
						} 
					}
			   }); 
			},
	        //移出题库
	        '.remove_from_bank' : function(){
	        	var id = $(this).closest('.test_content').attr('data-id');
	            MessageBox({
	                content : '您确定要移除该题？',
	                buttons : [{
	                    text : '确定',
	                    click : function(){
							$.post(TinSoConfig.student + '/Questions/deleteFavoriteByTestId.html', {testId : id, type : 0}, function(data){								
								if(data.status){
									$('.test_content[data-id="'+ id + '"] .remove_from_bank').removeClass('remove_from_bank').addClass('add_to_bank').attr('title','加入我的题库');
								}else{
									MessageBox({
										content : '从精题库移除该题失败！',
										buttons : [{
											text : '我知道了',
											click : function(){
												$( this ).dialog( 'close' );
											}
										}]
									}, 'warning');
								}
							});
	                    	
	                    	$(this).dialog('close');
	                    }
	                },
	                {
	                    text : '取消',
	                    click : function(){
	                        $(this).dialog('close');
	                    }
	                }]
	            });     
	        },
	        // 点击答题卡题号，整套试卷的考试模式为全自动答题，点击答题卡题号和切题按钮都失效！
			'.p_answer_list:not(.auto_start) ul li,.p_switch_current:not(.auto_start)':function(){
				var id = parseInt($(this).text());
				TSP.practice.answerSheet.select(id);
			},
			// 点击上一题
			'.p_switch_prev:not(.auto_start)' : function(){
				// 获取当前题号
				var current_qid = parseInt($(this).siblings('.p_switch_current').find('span').text());
				//获取当前大题的第一小题题号
				var foremost =  Number($('.current_test').find('.question_container:first').attr('data-qid'));
				if(type == 'wrong'){
					// 存在上一小题
					if(current_qid > foremost){
						var qid = current_qid - 1;
						$('.p_switch_current span').text(qid);
						$('.p_answer_list ul li[data-index='+qid+']').click();
					}
				}else{
					// 不是第一题
					if(current_qid > 1){
						TSP.practice.answerSheet.select(current_qid - 1);
					}
				}
			},
			// 点击下一题
			'.p_switch_next:not(.auto_start)' : function(){
				// 获取当前题号
				var current_qid = parseInt($(this).siblings('.p_switch_current').find('span').text());
				//获取当前大题的最后一小题题号
				
				if(is_primary){
					var rearmost = $('.primary_test_question_cnt').find('.test_content').length;
				}else{
					var rearmost = Number($('.current_test').find('.question_container:last').attr('data-qid'));
				}
				if(type == 'wrong'){
					// 存在下一小题
					if(current_qid < rearmost){
						TSP.practice.answerSheet.select(current_qid + 1);
					}else if(current_qid == rearmost){
						$('.next_test').click();	
					}
				}else{
					if(is_primary){
						// 不是最后一题
						if(current_qid < $('.test_content').length){
							TSP.practice.answerSheet.select(current_qid + 1);
						}
					}else{
						// 不是最后一题
						if(current_qid < $('.question_id').length){
							TSP.practice.answerSheet.select(current_qid + 1);
						}
					}
				}
			},
			//点击大题
			'.test_content' : function(e){
				if(!is_primary){
					TSP.practice.paperTest.select(e);
				}
			},
			//提交答案
	        '.p_answerSubmit_btn:not(.disabled)' : function(){
				// 未做完标识
				var flag = false;
				// 判断是否全部做完
				$('.p_answer_list ul li').each(function(i, obj){
					if(!$(this).hasClass('done')){
						flag = true;
					}
				});
//				var mainType = $('.test_content.current_test').attr('data-type');
				// 未做完
				if(flag){
					MessageBox({
						content : '未完成全部试题，是否保存答案？',
						buttons : [{
							text : '继续练习',
							click : function(){
								$(this).dialog('close');
							}
						},
						{
							text : '保存答案',
							click : function(){
								$(this).dialog('close');
								if(type != 'wrong'){
									TSP.practice.process.submitAnswerCheck();
								}
								
							}
						}]
					});
				}else{
					MessageBox({
						content : '已完成全部试题，是否保存答案？',
						buttons : [{
							text : '继续练习',
							click : function(){
								$(this).dialog('close');
							}
						},
						{
							text : '保存答案',
							click : function(){
								$(this).dialog('close');
								if(type != 'wrong'){
									TSP.practice.process.submitAnswerCheck();
								}
							}
						}]
					});
				}
	        },
	        '.p_practiceAgain_btn' : function(){
	        	var page = $('.p_paper_cnt').attr('data-page');
	        	MessageBox({
					content : '确定要再练一次吗？',
					buttons : [
					    {
					    	text : '确定',
					    	click : function(){
					    		$(this).dialog('close');
					    		isSubmitAAA = false;
					    		// 练习记录页面
					        	if(page == 'record'){
					        		// 试卷id
					        		var id = $('.p_paper_cnt').attr('data-id');
					        		// 考试模式mode
					        		var mode = $('#test-mode').attr('data-mode');
					        		// 来源
					        		var type = $('.p_paper_cnt').attr('data-source');
					        		// 版本-来源为单元测试时需要
					        		var version = $('.p_paper_cnt').attr('data-version');
					        		// 年级-来源为单元测试时需要
					        		var grade = $('.p_paper_cnt').attr('data-grade');
					        		// 年级-来源为单元测试时需要
					        		var unit = $('.p_paper_cnt').attr('data-unit');
					        		// 省id
					        		var province_id = $('.p_paper_cnt').attr('data-province-id');
					        		// 市id
					        		var city_id = $('.p_paper_cnt').attr('data-city-id');
					        		
					        		var str = '';
					        		if(version != ''){
					        			str += '&version=' + version;
					        		}
					        		if(grade != ''){
					        			str += '&grade=' + grade;
					        		}
					        		if(unit != ''){
					        			str += '&unit=' + unit;
					        		}
					        		// 跳转地址
					        		var url = '';
					        		
					        		// 在线作业
					        		if(source == 'hw'){
					        			var url = 'homework.html?hid=' + id;
					        		}
					        		// 试卷练习（单元测试、人机对话和笔试）
					        		else{
					        			if(is_primary){
					        				//获取参数
					    					var title =　TSP.practice.process.getQueryString("title");
					    					if(title != '' || title != null  || title != undefined){
					    						str += '&title=' + title;
					    					}
					        				var url = 'unitTest.html?type=' + type + '&id=' + id
											+ '&mode=exam' + str;
					        			}else{
					        				var url = 'paperPractice.html?type=' + type + '&id=' + id
											+ '&mode=' + mode + '&province_id=' + province_id + '&city_id=' + city_id + str;
					        			}
					        		}
					        		
									window.location.href = url;
					        	}else{
					        		history.go(0);
					        	}
							}
					    },
					    {
					    	text : '取消',
					    	click : function(){
								$(this).dialog('close');
							}
					    }
					]
				});
	        },
	        //答题卡返回按钮
	        '.p_back_btn' : function(){
	        	if (TSP.practice.is_submit || $('.p_paper_cnt').attr('data-page') == "record") {
	        		MessageBox({
						content : '确认返回？',
						buttons : [{
							text : '确认',
							click : function(){
								$(this).dialog('close');
								TSP.practice.process.backToSource();
							}
						},{
							text : '取消',
							click　: function(){
								$(this).dialog('close');
							}
						}],
						close :　function(){
							$(this).dialog('close');
						}
					});
	        	} else {
	        		MessageBox({
						content : '如果退出，本次练习记录将不会保存。',
						buttons : [{
							text : '退出练习',
							click : function(){
								$(this).dialog('close');
								TSP.practice.process.backToSource();
							}
						},{
							text : '继续练习',
							click　: function(){
								$(this).dialog('close');
							}
						}],
						close :　function(){
							$(this).dialog('close');
						}
					});
	        	}
					
	        },
	      //练习记录返回按钮
	        '.p_back_btn_spe' : function(){
	        	TSP.practice.process.backToSource();
	        },
	        //听力原文
	        '.btn_listeining_text': function(){
	            $(this).closest('.test_content').find('.listening_text').toggle(); 
	        },
	      	//选择题是否已做
			'.question_content input[type=radio]' : function(){
				if(is_primary){
					// 当前选中题
					$(this).closest('.question_content').find('label.option_label').removeClass('label_selected');
					$(this).closest('label.option_label').addClass('label_selected');
					var id = $(this).closest('.test_content').attr('data-test-index');
					$('.p_answer_list ul li[data-index='+id+']').addClass('done');
				}else{
					// 当前选中题
					var id = $(this).closest('.question_container').attr('data-qid');
					$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					
					// 记录当前播放音频试题id
					var play_test_id = $('body').attr('data-play-id');
					
					// 获取试题的类型
					var kind = $(this).closest('.test_content').attr('data-kind');
					
					// 获取当前试题的id
					var tid = $(this).closest('.test_content').attr('data-id');
					
					// 练习模式
					var mode = $('.p_operation_box #test-mode').attr('data-mode');
					// 资源
					var source = $('.p_paper_cnt').attr('data-source');
					// 结构类型
					var struct_type = $('.p_paper_cnt').attr('data-struct-type');
					
					// 非自动练习模式
					if(!(mode == 'exam' 
							&& (
									(source == 'ts' || source == 'unit') // 单元测试、人机对话的考试模式
									|| (source == 'hw' && (struct_type == 2 || struct_type == 3))// 作业的试卷考试模式
								)
						)
					){
						// 如果是笔试题
						if(kind == 3 || (play_test_id && play_test_id != tid)){
							// 竞赛练习页面
							if(window.location.pathname != '/Competition/paper.html'){
								// 按钮字样
								$('.btn_play').html('开始答题');
							}
							
							// 按钮字样
							$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
							// 按钮字样
							$('.btn_play_audio').html('播放原音');
							// 按钮字样
							$('.btn_play_question').html('播放问题');
							// 按钮字样
							$('.btn_play_answer').html('播放答案');
							// 停止时间
							clearInterval(remainder_key);
							// 停止时间
							clearInterval(play_key);
							// 停止时间
							clearInterval(tape_remainder_key);
							// 显示音频播放提示框
							$('.test_ctrl_info_area').hide();
							// 隐藏录音框
							$('.trans_test_ctrl_info_area').removeClass('recording');
							// 停止音频
							TSP.audio.player.stop();
							
							// 清空试题--0分引导
							$('body').attr('data-current-test-id' , '');
						}
					}
				}
			},
			//再做一次
			'.practice_again' : function(){
				window.location.reload();
			},
			//提交作业
			'.submit_homework' : function(){
				var endStatus = $('.p_paper_cnt').attr('data-end-status');
				if(endStatus == 4){
					$content = '确定补交作业？';
				}else{
					$content = '确定提交作业？';
				}
				var precord_id = $(this).attr('data-precord-id');
				MessageBox({
					content : $content,
					buttons : [{
						text : '确定',
						click : function(){
							ResourceLoadingMessageBox('正在提交作业，请稍候...');
							var params = {'precord_id' : precord_id, 'hid' : practice_id};
				        	$.post(TinSoConfig.student + '/Practice/submitHomework.html', params, function(data){
				        		ResourceLoadingMessageBox('close');
								MessageBox({
									content : data.info.msg,
									buttons : [{
										text : '我知道了',
										click : function(){
											$(this).dialog('close');
											$('.p_paper_cnt,.p_answerSheet_cnt').removeClass('hide');
											$('html,body').animate({scrollTop : 0}, 0);
											$('.H_submit_homework_cnt').hide();
											$('.submit_homework').addClass('hide');
											window.onbeforeunload = function(){}
								 			var url = TinSoConfig.student+'/Homework/lists.html';
								 			window.location.href = url;
										}
									}]
								});
								isNeedProtectDialog = true;
				        	});		
						}
					},
					{
						text : '取消',
						click : function(){
							$(this).dialog('close');
						}
					}]
				});
			},
			'.results' : function(){
				$('.H_submit_homework_cnt').hide();
				$('.p_paper_cnt,.main_content_cnt,.p_answerSheet_cnt').removeClass('hide');
				$('.main_content').removeClass('homework_result');
			}
		},
		'change':{
			'select' : function(){
				var val = $(this).val();
				var id = $(this).closest('.question_container').attr('data-qid');
				if(val != ''){
	                $('.p_answer_list ul li[data-index='+id+']').addClass('done');	
				}else{
	                $('.p_answer_list ul li[data-index='+id+']').removeClass('done');	
				}
				
				// 记录当前播放音频试题id
				var play_test_id = $('body').attr('data-play-id');
				
				// 获取试题的类型
				var kind = $(this).closest('.test_content').attr('data-kind');
				
				// 获取当前试题的id
				var tid = $(this).closest('.test_content').attr('data-id');
				
				// 练习模式
				var mode = $('.p_operation_box #test-mode').attr('data-mode');
				// 资源
				var source = $('.p_paper_cnt').attr('data-source');
				// 结构类型
				var struct_type = $('.p_paper_cnt').attr('data-struct-type');
				
				// 非自动练习模式
				if(!(mode == 'exam' 
					&& (
							(source == 'ts' || source == 'unit') // 单元测试、人机对话的考试模式
							|| (source == 'hw' && (struct_type == 2 || struct_type == 3))// 作业的试卷考试模式
						)
					)
				){
					// 如果是笔试题
					if(kind == 3 || (play_test_id && play_test_id != tid)){
						// 按钮字样
						if(!is_primary){
							// 竞赛练习页面
							if(window.location.pathname != '/Competition/paper.html'){
								// 按钮字样
								$('.btn_play').html('开始答题');
							}
						}else{
							$('.btn_play').removeClass('primary_btn_replay').addClass('primary_btn_play');
						}
						// 按钮字样
						$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
						// 按钮字样
						$('.btn_play_audio').html('播放原音');
						// 按钮字样
						$('.btn_play_question').html('播放问题');
						// 按钮字样
						$('.btn_play_answer').html('播放答案');
						// 停止时间
						clearInterval(remainder_key);
						// 停止时间
						clearInterval(play_key);
						// 停止时间
						clearInterval(tape_remainder_key);
						// 隐藏音频播放提示框
						$('.test_ctrl_info_area').hide();
						// 隐藏录音框
						$('.trans_test_ctrl_info_area').removeClass('recording');
						// 停止音频
						TSP.audio.player.stop();
						
						// 清空试题--0分引导
						$('body').attr('data-current-test-id' , '');
					}
				}
			},
			// 模式选择
			'.chosBox' : function(){
				// 模式选择--val值
				var val = $(this).val();
				var that = this;
				if(type == 'homework'){
					// 设置权限
					if(isfree && val != 1000){
						MessageBox({
							content : '免费用户只能使用普通模式，若想使用更多模式请升级资源!',
							buttons : [{
								text : '我知道了',
								click : function(){
									$(that).val(1000).change();
									$(this).dialog('close');
								}
							}]
						});
						return;
					}
				}
				
				//判断当前题目区域是否有current_question
				$(".speak_sentence").removeClass('high_light_font');
				$(this).closest('.test_content').find(".speak_sentence").addClass('enable');
				if(is_primary){
					var qid = $(this).closest('.test_content').attr('data-test-index');
				}else{
					var qid = $(this).closest('.test_content').find('.question_container').attr('data-qid');
				}
				// 获取当前试题的id
				var tid = $(this).closest('.test_content').attr('data-id');
				if(typeof(cur_html[qid]) != 'undefined'){
					$(this).closest('.test_content').find('.question_container .question_content').html(cur_html[qid]);
				}
				
				// 初始化当前试题
				// 停止时间
				clearInterval(remainder_key);
				// 停止时间
				clearInterval(play_key);
				// 停止时间
				clearInterval(tape_remainder_key);
				// 隐藏音频播放提示框
				$('.test_ctrl_info_area').hide();
				// 隐藏录音框
				$('.trans_test_ctrl_info_area').removeClass('recording');
				// 停止音频
				TSP.audio.player.stop();
				// 停止录音
				if(TSP.audio.recorder.inited){
					TSP.audio.recorder.stop();
				}
				
				videoResult[tid] = new Object();
				// $(this).closest('.test_content').find('.speak_sentence_score').remove();
				$(this).closest('.test_content').find('.sentence_behind_space').remove();
				$(this).closest('.test_content').find(".speak_sentence").removeClass('no_pass_font pass_font');
				
				// 自动练习标识
				$(this).closest('.test_content').find('.btn_play').removeClass('start');
				if(!is_primary){
					// 竞赛练习页面
					if(window.location.pathname != '/Competition/paper.html'){
						// 按钮字样
						$('.btn_play').html('开始答题');
					}
				}else{
					$('.btn_play').removeClass('primary_btn_replay').addClass('primary_btn_play');
				}
				// 初始化点读点说句子数量和开始时间数组
				videoRes_count = 0;
				sen_click_arr[tid] = [];
				
				if(val == 1000 || val == 4000 || val == 5000){
					$('body').off("selectstart");
				}else{
					$('body').on("selectstart",function(){
						return false;
					});
				}
				
				// 手动扣词
				if(val == 3000){
					MessageBox({
						content : '请先手动进行扣词，再点击"开始答题"！',
						buttons : [{
							text : '我知道了',
							click : function(){
								$(this).dialog('close');
							}
						}]
					});
					$(this).closest('.test_content').find('.question_container .question_content').handmade();
				}
				// 自动扣词
				else if(val == 2000){
					// 扣词区域container
					$(this).closest('.p_operationBtn_container').siblings('.question_container').find('.question_content').kouci();
				}
				// 补句
				else if(val == 7000){
					// 扣词区域container
					$(this).closest('.p_operationBtn_container').siblings('.question_container').find('.question_content').buju();
				}
				// 背诵全文
				else if(val == 6000){
					// 扣词区域container
					$(this).closest('.p_operationBtn_container').siblings('.question_container').find('.question_content').kouci(1);
				}
			}
		},
		'keyup' : {
			'input[type=text], textarea' : function(){
				if(is_primary){
					var id = $(this).closest('.test_content').attr('data-test-index');
					// 是否练习过
					var done_flag = true;
					$(this).closest('.test_content').find('input[type=text]').each(function(i, n){
						if($(n).val() != ''){
							done_flag = false;
							return false;
						}
					});
					if(!done_flag){
						$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					}else{
						$('.p_answer_list ul li[data-index='+id+']').removeClass('done');
					}
				}else{
					var id = $(this).closest('.question_container').attr('data-qid');
					// 是否练习过
					var done_flag = true;
					$(this).closest('.question_container').find('input[type=text]').each(function(i, n){
						if($(n).val() != ''){
							done_flag = false;
							return false;
						}
					});
					if(!done_flag){
						$('.p_answer_list ul li[data-index='+id+']').addClass('done');
					}else{
						$('.p_answer_list ul li[data-index='+id+']').removeClass('done');
					}
				}
				
				// 记录当前播放音频试题id
				var play_test_id = $('body').attr('data-play-id');
				
				// 获取试题的类型
				var kind = $(this).closest('.test_content').attr('data-kind');
				
				// 获取当前试题的id
				var tid = $(this).closest('.test_content').attr('data-id');
				
				// 获取当前试题的id
				var itemid = $(this).closest('.test_content').attr('data-itemid');
				
				// 练习模式
				var mode = $('.p_operation_box #test-mode').attr('data-mode');
				// 资源
				var source = $('.p_paper_cnt').attr('data-source');
				// 结构类型
				var struct_type = $('.p_paper_cnt').attr('data-struct-type');
				
				// 非自动练习模式
				if(!(mode == 'exam' 
					&& (
							(source == 'ts' || source == 'unit') // 单元测试、人机对话的考试模式
							|| (source == 'hw' && (struct_type == 2 || struct_type == 3))// 作业的试卷考试模式
						)
					)
				){
					// 如果是笔试题
					if(kind == 3 || (play_test_id && play_test_id != tid)){
						// 按钮字样
						if(!is_primary){
							// 竞赛练习页面
							if(window.location.pathname != '/Competition/paper.html'){
								// 按钮字样
								$('.btn_play').html('开始答题');
							}
						}else{
							$('.btn_play').removeClass('primary_btn_replay').addClass('primary_btn_play');
						}
						// 按钮字样
						$('.btn_pause').attr('data-pause-status', 'play').html('暂停播放');
						// 按钮字样
						$('.btn_play_audio').html('播放原音');
						// 按钮字样
						$('.btn_play_question').html('播放问题');
						// 按钮字样
						$('.btn_play_answer').html('播放答案');
						// 停止时间
						clearInterval(remainder_key);
						// 停止时间
						clearInterval(play_key);
						// 停止时间
						clearInterval(tape_remainder_key);
						// 隐藏音频播放提示框
						$('.test_ctrl_info_area').hide();
						// 隐藏录音框
						$('.trans_test_ctrl_info_area').removeClass('recording');
						// 停止音频
						TSP.audio.player.stop();
						
						// 清空试题--0分引导
						$('body').attr('data-current-test-id' , '');
					}
				}
			}
		}
	});
	
	$.fn.extend({
		/**
		 *	扣词
		 *	blank_p	空格数占单词数的百分比 0-1之间，默认0.5
		 */
		kouci : function(blank_p){
			var kou = $(this).attr('data-kou');
			if(is_primary){
				var qid = $(this).closest('.test_content').attr('data-test-index');
			}else{
				var qid = $(this).closest('.test_content').find('.question_container').attr('data-qid');
			}
			// 未扣过
			if(kou != 1){
				cur_html[qid] = $(this).html();
				$(this).attr('data-kou', 1);
			}else{
				$(this).html(cur_html[qid]);
			}

			var reg = /\b([a-zA-Z]+[\'\-]?[a-zA-Z]*)\b|(\d+)/g;
			var split_reg = /\b(?=[\,\.\?\!\s]\w+)/g;
			$(this).find('p span').each(function(i, n){
				var html  = $(n).html();
				var word_arr = html.split(split_reg);
				var r_idx = randomIndex(word_arr, blank_p);
				for(var i in r_idx){
					word_arr[r_idx[i]] = word_arr[r_idx[i]].replace(reg, '<span class="kouarea henxian" data-answer="$1$2">$1$2</span>');
				}
				var res = '';
				for(var j in word_arr){
					res += word_arr[j];
					if(j < word_arr.length - 1){
						res += ' ';
					}
				}
				$(n).html(res);
			});
		},
		/**
		 * 补句
		 */
		buju : function(){
			var kou = $(this).attr('data-kou');
			if(is_primary){
				var qid = $(this).closest('.test_content').attr('data-test-index');
			}else{
				var qid = $(this).closest('.test_content').find('.question_container').attr('data-qid');
			}
			// 未扣过
			if(kou != 1){
				cur_html[qid] = $(this).html();
				$(this).attr('data-kou', 1);
			}else{
				$(this).html(cur_html[qid]);
			}
			if($(this).find('.kouarea').length){
				$(this).html(cur_html[qid]);
				$(this).buju();
				return;
			}
			var reg = /\b([a-zA-Z]+[\'\-]?[a-zA-Z]*)\b|(\d+)/g;
			$(this).find('p').each(function(i, n){
				if($(n).html() == ''){
					return true;
				}
				// 随机的句子序号数组	
				var r_idx = randomIndex($(n).find('span'));
				for(var j in r_idx){
					var text = $(n).find('span:eq(' + r_idx[j] + ')').text();
					$(n).find('span:eq(' + r_idx[j] + ')').html(text.replace(reg, '<span class="kouarea henxian" data-answer="$1$2">$1$2</span>'));
				}
			});
		},
		/**
		 * 手动扣词
		 */
		handmade : function(){
			var kou = $(this).attr('data-kou');
			if(is_primary){
				var qid = $(this).closest('.test_content').attr('data-test-index');
			}else{
				var qid = $(this).closest('.test_content').find('.question_container').attr('data-qid');
			}
			// 未扣过
			if(kou != 1){
				cur_html[qid] = $(this).html();
				$(this).attr('data-kou', 1);
			}else{
				$(this).html(cur_html[qid]);
			}
//			// 已经扣词过了
//			if($(this).find('input').length){
//				MessageBox({
//					content : '已经扣过啦！请继续答题！',
//					buttons : [{
//						text : '我知道了',
//						click : function(){
//							$(this).dialog('close');
//						}
//					}]
//				});
//				return;
//			}
			var reg = /\b([a-zA-Z]+[\'\-]?[a-zA-Z]*)\b|(\d+)/g;
			$(this).find('p span').each(function(i, n){
				var html  = $(n).html();
				html = html.replace(reg, "<span class='hand_span'>$1$2</span>");
				$(n).html(html);
			});
		}
		
	});
});

function deepCopy(source) { 
	var result={};
	for (var key in source) {
		if(key == 'indexOf'){
			continue;
		}
		result[key] = typeof source[key]==='object'? deepCopy(source[key]): source[key];
	} 
	return result; 
}

/**
 * 点说
 */
function ds(obj){
	var id = $(obj).closest('.test_content.current_test').find('.question_container.current_question').attr('data-qid');
	$('.p_answer_list ul li[data-index='+id+']').addClass('done');
	// 删除选中样式
	$('.text_area .lddw_content .speak_sentence').removeClass('high_light_font');
	// 在该句后面添加一个空白区域，用于显示判分等待图标和分数
	$(obj).next('.sentence_behind_space').remove();
	$(obj).after('<span class="sentence_behind_space"></span>');
	// 添加选中样式
	$(obj).addClass('high_light_font');
	// 隐藏音频播放提示框
	$('.test_ctrl_info_area').show();
	// 隐藏进度条
	$('.test_ctrl_info_area .percentage_gray').show();
	// 隐藏录音进度条
	$('.test_ctrl_info_area .waveform_container').hide();
	// 隐藏秒
	$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
	// 答题提示
	$('.test_ctrl_info_area .info_hint').html('播放音频').show();
	// 音频文件
	var file_name = $(obj).attr('data-mp3');
	// 开始时间
	var start_time = parseInt($(obj).attr('data-starttime'));
	// 结束时间
	var end_time = parseInt($(obj).attr('data-endtime'));
	
	// 装载音频文件
	TSP.audio.player.load(file_name);
	// 为空
	if(start_time == undefined || start_time === ''){
		start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
	}
	
	// 为空
	if(end_time == undefined || end_time == ''){
		end_time = TSP.audio.player.audioElem.duration * 1000;
	}
	
	// 设置起始时间
	TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
	
	// 播放音频
	TSP.audio.player.play();
	
	// 音频总时间
	var total_time = end_time/1000.0 - start_time/1000.0;
	// 标识
	var flag = false;
	
	// 循环倒计时
	play_key = setInterval(function(){
		// 音频播放当前时间
		var remainder_time = TSP.audio.player.audioElem.getCurrentTime(1) - start_time/1000.0;
		
		// 进度条
		$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
		
		if(total_time - remainder_time <= 0){
			// 停止时间
			clearInterval(play_key);
			// 播放音频
			TSP.audio.player.stop();
			// 标识
			if(!flag){
				// 标识
				flag = true;
				// 录音
				ds_tape_video(total_time, obj);
			}
		}
	}, 4);
	
	// 获取音频对象
	TSP.audio.files.getAudio(file_name).onended = function(){
		$(".speak_sentence").removeClass('high_light_font');
		// 停止时间
		clearInterval(play_key);
		// 播放音频
		TSP.audio.player.stop();
		// 标识
		if(!flag){
			// 标识
			flag = true;
			// 录音
			ds_tape_video(total_time, obj);
		}
	};
}
/**
 * 点读
 */
function dd(obj){
	var id = $(obj).closest('.test_content.current_test').find('.question_container.current_question').attr('data-qid');
	$('.p_answer_list ul li[data-index='+id+']').addClass('done');
	// 隐藏音频播放提示框
	$('.test_ctrl_info_area').show();
	// 隐藏进度条
	$('.test_ctrl_info_area .percentage_gray').show();
	// 隐藏录音进度条
	$('.test_ctrl_info_area .waveform_container').hide();
	// 隐藏秒
	$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
	// 答题提示
	$('.test_ctrl_info_area .info_hint').html('播放音频').show();
	// 音频文件
	var file_name = $(obj).attr('data-mp3');
	// 开始时间
	var start_time = parseInt($(obj).attr('data-starttime'));
	// 结束时间
	var end_time = parseInt($(obj).attr('data-endtime'));
	
	// 装载音频文件
	TSP.audio.player.load(file_name);
	// 为空
	if(start_time == undefined || start_time === ''){
		start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
	}
	
	// 为空
	if(end_time == undefined || end_time == ''){
		end_time = TSP.audio.player.audioElem.duration * 1000;
	}
	
	// 设置起始时间
	TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
	
	// 播放音频
	TSP.audio.player.play();
	
	// 音频总时间
	var total_time = end_time/1000.0 - start_time/1000.0;
	// 标识
	var flag = false;
	
	// 循环倒计时
	play_key = setInterval(function(){
		// 音频播放当前时间
		var remainder_time = TSP.audio.player.audioElem.getCurrentTime(1) - start_time/1000.0;
		
		// 进度条
		$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
		
		if(total_time - remainder_time <= 0){
			// 停止时间
			clearInterval(play_key);
			// 播放音频
			TSP.audio.player.stop();
			// 隐藏音频播放提示框
			$('.test_ctrl_info_area').hide();
			// 添加选中样式
			$(obj).removeClass('high_light_font');
		}
	}, 4);
	
	// 获取音频对象
	TSP.audio.files.getAudio(file_name).onended = function(){
		// 停止时间
		clearInterval(play_key);
		// 播放音频
		TSP.audio.player.stop();
		// 隐藏音频播放提示框
		$('.test_ctrl_info_area').hide();
		// 添加选中样式
		$(obj).removeClass('high_light_font');
	};
}
/**
 * 录音
 */
function ds_tape_video(total_time, v_obj){
	// 停止录音
	if(TSP.audio.recorder.inited){
		TSP.audio.recorder.stop();
	}
	// 隐藏进度条
	$('.test_ctrl_info_area .percentage_gray').hide();
	// 隐藏录音进度条
	$('.test_ctrl_info_area .waveform_container').show();
	// 等待时间
	var remainder_time = Math.ceil(total_time) * 1000 * 2;
	// 显示秒
	$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
	
	/**
	 * 设置波形配置
	 */
	 TSP.practice.waveForm.initWaveForm();
	
	// 当前试题
	var tid = $(v_obj).closest('.test_content').attr('data-id');
	// 试题id为空
	if(videoResult[tid] == undefined || videoResult[tid] == null){
		videoResult[tid] = new Object();
		if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) { //判断是否IE浏览器
			$("#AsrRecorder")[0].arrayEmpty(tid);
		}
	}
	if(zeroTypeA){ // 低分强化练习
		// 取原时间戳
		var time_flag = $(v_obj).attr('data-time-flag');
		$(v_obj).removeClass('no_pass_font');
	}else{
		// 当前时间戳
		var time_flag = (new Date()).getTime();
	}
	// 保存时间戳
	$(v_obj).attr('data-time-flag', time_flag);
	$(v_obj).attr('data-time_flag', time_flag);
	// 试题录音标识
	videoResult[tid][time_flag] = new Object();
	// 开始录音
	TSP.audio.recorder.start(tid, 2, $(v_obj).attr('data-text'), time_flag, remainder_time);
	$('.test_ctrl_info_area .info_hint').html('初始化录音');
	// 循环倒计时
	tape_remainder_key = setInterval(function(){
		if(!TSP.audio.recorder.recording){
			return;
		}
		// 显示秒
		$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').show();
		// 录音文字提示
		$('.test_ctrl_info_area .info_hint').html('录音');
		// 倒计时
		remainder_time = remainder_time - 100;
		
		// 设置倒计时
		$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
		
		if(remainder_time < 0){
			// 停止时间
			clearInterval(tape_remainder_key);
			// 停止录音
			if(TSP.audio.recorder.inited){
				TSP.audio.recorder.stop();
			}
			// 等待判分
			// $(v_obj).after('<span class="speak_sentence_score">(等待判分)</span>');
			if(judge_speaking){
				$(v_obj).next('.sentence_behind_space').addClass('wait_background').text('');
			}else{
				$(v_obj).next('.sentence_behind_space').addClass('hidden_speaking_result').text('');
			}
			// 删除样式
			$(v_obj).removeClass('high_light_font');
			// 隐藏音频播放提示框
			$('.test_ctrl_info_area').hide();
		}
	}, 100);
}
/**
 * 录音
 */
function tape_video(total_time, v_obj){
	// 隐藏进度条
	$('.test_ctrl_info_area .percentage_gray').hide();
	// 隐藏录音进度条
	$('.test_ctrl_info_area .waveform_container').show();
	// 等待时间
	var remainder_time = Math.ceil(total_time) * 1000 * 2;
	// 显示秒
	$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
	// 设置倒计时
	$('.test_ctrl_info_area .play_mp3_area .remainder_time').html('');
	
	/**
	 * 设置波形配置
	 */
	 TSP.practice.waveForm.initWaveForm();
	
	// 当前试题
	var tid = $(v_obj).closest('.test_content.current_test').attr('data-id');
	// 试题id为空
	if(videoResult[tid] == undefined || videoResult[tid] == null){
		videoResult[tid] = new Object();
		if ((!!window.ActiveXObject || "ActiveXObject" in window) || userAgent.indexOf("Edge") > -1) { //判断是否IE浏览器
			$("#AsrRecorder")[0].arrayEmpty(tid);
		}
	}
	
	// 当前时间戳
	var time_flag = (new Date()).getTime();
	$(v_obj).attr('data-time-flag', time_flag);
	// 试题录音标识
	videoResult[tid][time_flag] = new Object();
	// 开始录音
	TSP.audio.recorder.start(tid, 2, $(v_obj).attr('data-text'), time_flag, remainder_time);
	// 循环倒计时
	tape_remainder_key = setInterval(function(){
		if(!TSP.audio.recorder.recording){
			return;
		}
		// 显示秒
		$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').show();
		// 倒计时
		remainder_time = remainder_time - 100;
		
		// 设置倒计时
		$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
		
		if(remainder_time < 0){
			// 停止时间
			clearInterval(tape_remainder_key);
			// 停止录音
			if(TSP.audio.recorder.inited){
				TSP.audio.recorder.stop();
			}
			// $(v_obj).after('<span class="speak_sentence_score">(等待判分)</span>');
			if(judge_speaking){
				$(v_obj).next('.sentence_behind_space').addClass('wait_background').text('');
			}else{
				$(v_obj).next('.sentence_behind_space').addClass('hidden_speaking_result').text('');
			}
			// 删除样式
			$(v_obj).closest('.test_content.current_content').find('.speak_sentence').removeClass('high_light_font');
			// 下一步骤
			gd(v_obj);
		}
	}, 100);
}

// 初始化口语练习内容
function initSpeakArea(){
	// 播放音频
	TSP.audio.player.stop();
	// 停止时间
//	clearInterval(answer_key);
	// 停止时间
//	clearTimeout(show_answer_key);
	// 停止时间
	clearInterval(play_key);
	// 停止时间
	clearInterval(tape_remainder_key);
	// 删除选中样式
//	$('.test_content .speak_sentence').removeClass('high_light_font');
	// 隐藏音频播放提示框
	$('.test_ctrl_info_area').hide();
	// 初始化信息
	$('.test_content.current .speak_sentence').removeClass('enable').addClass('enable');
	// 显示分数
	$('.ctrl_info_span .score').hide();
	// 删除不需要数据
//	$('.test_content .speak_sentence_score').remove();
}


//blank_p 0-1之间
function randomIndex(ar, blank_p){
	if(blank_p != 0){
		blank_p = blank_p || 0.2;
	}
	blank_p = 1 - blank_p;
	if(blank_p < 0 || blank_p > 1){
		throw Error('参数blank_p介于0-1之间');
	}
	var idxArr = new Array();	// 声明一个数组，用来存放随机产生的序号，长度等于ar的长度
	for(var i = 0; i < ar.length; i++){
		idxArr.push(i);
	}
	var temp = new Array();
	var blank_num = Math.floor(ar.length * blank_p);	// 产生空格的大概个数
	
	while(idxArr.length > blank_num){
		var r = Math.floor(Math.random() * idxArr.length);
		temp.push(idxArr[r]);	// 返回的结果数组，盛放随机的序号
		idxArr.splice(r, 1);	// 产生一个随机数，idxArr的长度减一
	}
	// 从小到大排序
	temp.sort(function(a, b){
		if(a == b){
			return 0;
		}
		return a > b ? 1 : -1;
	});
	return temp;
}

/**
 * 跟读
 */
function gd(obj){
	// 停止录音
	if(TSP.audio.recorder.inited){
		TSP.audio.recorder.stop();
	}
	// 获取音频信息
	var v_obj = $(obj).closest('.test_content').find('.speak_sentence.enable:first');
	// 为空
	if(v_obj == undefined || v_obj.length == 0){
		// 停止时间
		clearInterval(play_key);
		// 停止时间
		clearInterval(tape_remainder_key);
		// 停止录音
		if(TSP.audio.recorder.inited){
			TSP.audio.recorder.stop();
		}
		// 隐藏音频播放提示框
		$('.test_ctrl_info_area').hide();
		
		setTimeout(function(){
			// 添加标识
			$('.test_content.current_test').find('.speak_sentence').removeClass('enable').addClass('enable');
		}, 200);
		
//		// 跟读
//		ResourceLoadingMessageBox('正在判分，请稍等！');
		$('.test_content.current_test').find('.speak_sentence').removeClass('high_light_font');
		return false;
	}

	// 在该句后面添加一个空白区域，用于显示判分等待图标和分数
	$(v_obj).next('.sentence_behind_space').remove();
	$(v_obj).after('<span class="sentence_behind_space"></span>');
	
	// 添加样式
	$(v_obj).closest('.test_content.current_test').find('.speak_sentence').removeClass('high_light_font');
	$(v_obj).addClass('high_light_font');
	// 隐藏音频播放提示框
	$('.test_ctrl_info_area').show();
	// 隐藏进度条
	$('.test_ctrl_info_area .percentage_gray').show();
	// 隐藏录音进度条
	$('.test_ctrl_info_area .waveform_container').hide();
	// 隐藏秒
	$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').hide();
//	// 答题提示
	$('.test_ctrl_info_area .info_hint').html('播放音频');
	// 循环倒计时
	tape_remainder_key = setInterval(function(){
		if(!TSP.audio.recorder.recording){
			return;
		}
		// 显示秒
		$('.test_ctrl_info_area .play_mp3_area .remainder_time_area').show();
		// 录音文字提示
		$('.test_ctrl_info_area .info_hint').html('录音');
		// 倒计时
		remainder_time = remainder_time - 100;
		
		// 设置倒计时
		$('.test_ctrl_info_area .play_mp3_area .remainder_time').html(Math.ceil(remainder_time/1000));
		
		if(remainder_time < 0){
			// 停止时间
			clearInterval(tape_remainder_key);
			// 停止录音
			if(TSP.audio.recorder.inited){
				TSP.audio.recorder.stop();
			}
			// 等待判分
			// $(v_obj).after('<span class="speak_sentence_score">(等待判分)</span>');
			if(judge_speaking){
				$(v_obj).next('.sentence_behind_space').addClass('wait_background').text('');
			}else{
				$(v_obj).next('.sentence_behind_space').addClass('hidden_speaking_result').text('');
			}
			// 删除样式
			$(v_obj).removeClass('high_light_font');
			// 隐藏音频播放提示框
			$('.test_ctrl_info_area').hide();
		}
	}, 100);
	// 音频文件
	var file_name = $(v_obj).attr('data-mp3');
	// 开始时间
	var start_time = parseInt($(v_obj).attr('data-starttime'));
	// 结束时间
	var end_time = parseInt($(v_obj).attr('data-endtime'));
	// 删除标识位
	$(v_obj).removeClass('enable');
	
	// 装载音频文件
	TSP.audio.player.load(file_name);
	
	// 为空
	if(start_time == undefined || start_time === ''){
		start_time = TSP.audio.player.audioElem.getCurrentTime() * 1000;
	}
	
	// 为空
	if(end_time == undefined || end_time == ''){
		end_time = TSP.audio.player.audioElem.duration * 1000;
	}
	
	// 设置起始时间
	TSP.audio.player.audioElem.setCurrentTime(start_time/1000.0);
	
	// 播放音频
	TSP.audio.player.play();
	
	// 音频总时间
	var total_time = end_time/1000.0 - start_time/1000.0;
	
	// 标识
	var flag = false;
	
	// 循环倒计时
	play_key = setInterval(function(){
		// 音频播放当前时间
		var remainder_time = TSP.audio.player.audioElem.getCurrentTime() - start_time/1000.0;
		
		// 进度条
		$('.test_ctrl_info_area .play_mp3_area .percentage_bule').css('width', (remainder_time/total_time * 100)+'%');
		
		if(total_time - remainder_time <= 0){
			// 停止时间
			clearInterval(play_key);
			// 停止音频
			TSP.audio.player.stop();
			// 标识
			if(!flag){
				// 录音
				tape_video(total_time, v_obj);
				// 标识
				flag = true;
			}
		}
	}, 4);
	
	// 获取音频对象
	TSP.audio.files.getAudio(file_name).onended = function(){
		// 停止时间
		clearInterval(play_key);
		// 停止音频
		TSP.audio.player.stop();
		// 标识
		if(!flag){
			// 录音
			tape_video(total_time, v_obj);
			// 标识
			flag = true;
		}
	};
}

/**
 * 三分钟后录音答案设0
 */
function submitAnswerFunc(){
	// 存在录音时
	if($('.test_content[data-kind="2"]') != undefined && $('.test_content[data-kind="2"]').length > 0){
		// 不为空
		if(videoResult != undefined && videoResult != null){
			// 循环判断音频识别情况
			$.each(videoResult, function(tid, objs){
				if(objs != undefined && objs != null){
					$.each(objs, function(time_flag, obj){
						if(obj['result'] == undefined || obj['result']['count'] == undefined){
							TSP.practice.setResult(time_flag, {'count' : 0, 'mp3' : '', 'score' : 0}, tid);
						}
					});
				}
			});
		}
	}
}
Math.formatFloat = function (f) {
    var m = Math.pow(10, 2);
    return Math.round(f * m, 10) / m;
}


function isZeroDialog(){
	// 初始化当前试题
	// 停止时间
	clearInterval(remainder_key);
	// 停止时间
	clearInterval(play_key);
	// 停止时间
	clearInterval(tape_remainder_key);
	// 隐藏音频播放提示框
	$('.test_ctrl_info_area').hide();
	// 隐藏录音框
	$('.trans_test_ctrl_info_area').removeClass('recording');
	// 停止音频
	TSP.audio.player.stop();
	// 停止录音
	if(TSP.audio.recorder.inited){
		TSP.audio.recorder.stop();
	}
	// 循环判断音频识别情况
	if(videoResult != undefined && JSON.stringify(videoResult) != "{}"){
		// 是否需要0分引导弹框
		var isNeedZeroPromat = false;
		$.each(videoResult, function(tid, objs){
			if($('.test_content[data-id="'+tid+'"]').attr('data-type') == 1400 
					&& $('.test_content[data-id="'+tid+'"]').attr('data-subtype') != 1428
					&& $('.test_content[data-id="'+tid+'"]').attr('data-subtype') != 1438){
				// 音频识别成功标识
				var zeroNum = 0;
				if(objs != undefined){
					$.each(objs, function(i, obj){
						if(obj['result'] == undefined || obj['result']['count'] == undefined){
						}else{
							if(obj['result']['score'] < 60){
								zeroNum++;
							}
						}
					});
				}
				
				// 60分以下句子超出规定数量
				if(zeroNum > 0){
					isNeedZeroPromat = true;
				}
			}
		});
		// 未弹出过弹框
		if(!isDialogShow && isNeedZeroPromat && $('.zeroTips').length){
			// 已弹框
			isDialogShow = true;
			zeroTypeC = true;
			$('.zeroTips').show();
			$('.zeroTips').dialog({
				width : 630,
				height: 300,
				dialogClass: 'small-dialog green-dialog',
				modal : true,
				resizable : false,
				buttons: {
					'继续提交': function(){
						$(this).dialog('close');
						zeroTypeC = false;
						MessageBox({
							content : '音频已全部识别完成，是否提交答案？',
							buttons : [{
								text : '不提交',
								click : function(){
									$(this).dialog('close');
								}
							},{

								text : '提交',
								click : function(){
									$(this).dialog('close');
									// 提交试卷
									if(is_primary){
			                    		TSP.practice.primary.question.submitAnswer();
			                    	}else{
			                    		TSP.practice.process.submitAnswer();
			                    	}
									isDialogShow =  false;
								}
							}]
		                });
					},
					'低分强化':function(){
						$(this).dialog('close');
						isDialogShow =  true;
						zeroTypeC = true;
						zeroTypeA = true;
						$('.btn_play').removeClass('disabled');
						$('.btn_play').html('开始答题');
						$('.main_content_box').attr('data-wait-status', 0);
						// 设置所有答题区域可用
						// 设置所有选项不可用
		    	    	$('.p_tests_area input').removeAttr('disabled');
		    	    	// 设置所有文本框不可用
		    	    	$('.p_tests_area textarea').removeAttr('disabled');
		    	    	// 设置所有下拉框不可用
		    	    	$('.p_tests_area select').removeAttr('disabled');
						
					}
				},
				close: function(event, ui) {
					$(this).dialog('close');
					isDialogShow =  true;
					zeroTypeC = true;
					zeroTypeA = true;
					$('.btn_play').removeClass('disabled');
					$('.btn_play').html('开始答题');
					$('.main_content_box').attr('data-wait-status', 0);
					// 设置所有选项不可用
	    	    	$('.p_tests_area input').removeAttr('disabled');
	    	    	// 设置所有文本框不可用
	    	    	$('.p_tests_area textarea').removeAttr('disabled');
	    	    	// 设置所有下拉框不可用
	    	    	$('.p_tests_area select').removeAttr('disabled');
	    	    	TSP.practice.testTime.calculateTime(1);
				}
			});
		}else{
			// 提交试卷
			if(is_primary){
	    		TSP.practice.primary.question.submitAnswer();
	    	}else{
	    		TSP.practice.process.submitAnswer();
	    	}
		}
	}else{
		// 提交试卷
		if(is_primary){
    		TSP.practice.primary.question.submitAnswer();
    	}else{
    		TSP.practice.process.submitAnswer();
    	}
	}
	
}

