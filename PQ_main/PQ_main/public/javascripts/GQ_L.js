class L {
	constructor(dataList, ID, password, url) {
		this.dataList = dataList;
		this.player = videojs('MyVideo', {
			width: '600',
			height: '400px',
			controls: true,
			autoplay: false,
			preload: 'auto',
			muted: true,
		});
		this.ID = ID;
		this.password = password;
		this.url = url;
	}

	//method
	Go(round) {
		function randomsort(a, b) {
			return Math.random() > 0.5 ? -1 : 1;
			//用Math.random()函式生成0~1之間的隨機數與0.5比較，返回-1或1
		}
		function drawResult(x, y) {
			$('#table').hide();
			$('#Canvas').show();
			//畫答案
			var c = document.getElementById('Canvas');
			var ctx = c.getContext('2d');
			var ctx2 = c.getContext('2d');
			ctx.beginPath();
			ctx.arc(x, y, 10, 0, 2 * Math.PI);
			ctx.fillStyle = '#46C7C7';
			ctx.fill();
			ctx.stroke(); //點擊位置
			if (!feedback) {
				ctx2.beginPath();
				ctx2.arc(
					data[order[round]].X * (15 / 7),
					data[order[round]].Y * (-5 / 9) + 270,
					10,
					0,
					2 * Math.PI
				);
				ctx2.fillStyle = '#F76541';
				ctx2.fill();
				ctx2.stroke(); //答案
			}
		}

		function translateAns(ans) {
			var answer;
			switch (ans) {
				case '1':
					answer = '上旋';
					break;
				case '2':
					answer = '下旋';
					break;
				case '3':
					answer = '不轉';
					break;
				case '4':
					answer = '右旋側上旋';
					break;
				case '5':
					answer = '右旋側下旋';
					break;
				case '6':
					answer = '左旋側上旋';
					break;
				case '7':
					answer = '左旋側下旋';
					break;
				default:
					answer = '沒答案';
					break;
			}
			return answer;
		}
		//one:回傳數據, player:播放器,order:隨機順序,round:第幾回合,feedback是否回傳數據(練習模式不回傳)
		var ID = this.ID;
		var password = this.password;
		var url = this.url;
		var origin_round = round;
		var one = '';
		var player = this.player;
		var order = [];
		var data = this.dataList;
		var feedback = true;
		var wait = 1000;
		if (round <= 5) feedback = false;
		if (feedback) wait = 0;
		//建立order隨機順序
		for (var i = 0; i < round; i++) order.push(i);
		order.sort(randomsort);
		//初始化第一步影片
		$('#warning').text('僅有一次播放機會, 請等到縮圖出現再點擊播放');
		round--;
		var path =
			url +
			'?path=video/L/' + //'test.mp4'
			data[order[round]].human +
			'/' +
			data[order[round]].filepath;
		player.src({
			src: path,
			//type: 'video/mp4',
		});
		player.controls(false);
		//播放時關閉控制列
		player.on('play', () => {
			player.controls(false);
		});

		$('#pass').click(function () {
			one +=
				data[order[round]].filepath.replace(/_/g, '-') +
				'_NA_NA_NA_NA_NA_NA_NA';
			if (round > 0) {
				round--;
				one += '~';
				path =
					url +
					'?path=video/L/' + //'test.mp4'
					data[order[round]].human +
					'/' +
					data[order[round]].filepath;
				player.src({
					src: path,
					type: 'video/mp4',
				});
				player.controls(false);
			}
		});
		player.on('canplaythrough', function () {
			player.controls(true);
		});
		//核心事件: 影片播放完畢, 開始序列行為
		player.on('ended', () => {
			//console.log("結束影片" + data[order[round]].filepath);
			one += data[order[round]].filepath.replace(/_/g, '-') + '_';
			//播完影片,展示桌子
			$('#net').show();
			$('#MyVideo').hide();
			if (round > 0) {
				path =
					url +
					'?path=video/L/' + //'test.mp4'
					data[order[round - 1]].human +
					'/' +
					data[order[round - 1]].filepath;
				player.src({
					src: path,
					type: 'video/mp4',
				});
				//console.log("開始影片" + order[round]);
			}
			$('#warning').text(
				origin_round - round + '. 請選擇你覺得球落在哪, 再用滑鼠點擊該位置'
			);
			$('#table').show(function () {
				//點擊桌子,觸發紀錄與公布答案
				$('#table').one('click', function (e) {
					var offset = $(this).offset();
					var x = Math.floor((e.pageX - offset.left) * (7 / 15));
					var y = Math.floor((e.pageY - offset.top - 270) * -1 * (5 / 9));
					one +=
						data[order[round]].X +
						'_' +
						data[order[round]].Y +
						'_' +
						x +
						'_' +
						y +
						'_';
					//console.log("X:" + x);
					//console.log("Y:" + y)
					drawResult(e.pageX - offset.left, e.pageY - offset.top);
					//經過延遲後選擇旋轉
					setTimeout(function () {
						var tc = document.getElementById('Canvas');
						tc.height = tc.height; //清空畫布
						$('#Canvas').hide();
						$('#net').hide(); //隱藏桌子
						//顯示旋轉選擇區塊
						$('#warning').text(
							origin_round - round + '.請選擇你覺得球怎麼旋轉'
						);
						$('#Select').show();
						$('#confirm').show(function () {
							//點擊確認後記錄成果
							$('#confirm').one('click', function () {
								//console.log($("#Select").val());
								one += data[order[round]].ans + '_' + $('#Select').val() + '_';
								data[order[round]].ans == $('#Select').val()
									? (one += '1')
									: (one += '0');
								var answer = translateAns(data[order[round]].ans);
								$('#warning').text('答案是' + answer);
								$('#Select').hide();
								$('#confirm').hide();
								setTimeout(function () {
									$('#warning').text(
										'僅有一次播放機會, 請等到縮圖出現再點擊播放'
									);
									$('#MyVideo').show(function () {
										//影片重置,下一輪開始
										round--;
										if (round >= 0) {
											one += '~';
										} else {
											//回合終結,依模式操作
											if (feedback) {
												localStorage.setItem('GQone', one);
												localStorage.setItem('GQtype', 'L');
												$.post(
													'/GQ/SQ/saveData',
													{ ID, password, one, group: 'NA', type: 'L' },
													function (result, textStatus, jqXHR) {
													  try {
														if (textStatus == 'success') {
														  if (result.result == 'success') {
															localStorage.removeItem('GQone');
															$('form').submit();
														  } else {
															alert(
															  `${result.result}已紀錄資料在本電腦, 可先關閉程式, 下次開啟同系統問卷會要求上傳`
															);
															$('form').submit();
														  }
														} else {
														  alert('伺服器無回應,請稍後再試');
														}
													  } catch (error) {
														console.error('回調函數內的錯誤:', error);
														alert('處理伺服器響應時發生錯誤');
													  }
													}
												  ).fail(() => {
													alert('未預期錯誤.已紀錄資料在本電腦, 可先關閉程式, 下次開啟同系統問卷會要求上傳');
												  });
												  
											} else location.reload();
										}
									});
								}, wait);
							});
						});
					}, 1000);
				});
			});
		});
	}
}
