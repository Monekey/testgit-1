/**
 *
 */
var Diancai = function( dishStorageKeyOut,itemlist,jumpurl,changeDishTime ){

	var cw = document.documentElement.clientWidth;
	var ch = document.documentElement.clientHeight;

	//var dishStorageKey = "${bizType}_${mcid}"; //lStorage
	var dishStorageKey = dishStorageKeyOut; //lStorage
	//var _itemlist = ${ItemList};
	var _itemlist = itemlist;
	//console.log(_itemlist);
	var _dishclassCan = $(".dishClassScroller");
	var _bigDishclassCan = $("#dishClassHoriList");
	var _dishCan = $(".smallDishScroller");
	var _dishCanStr = "";
	var _bigDishScroller = $(".bigDishScroller");
	//var _selectedDishInClass = [];
	var _selectDishObj = {};//已点菜品数据
	var _currentSelectedClass = "0";
	var _currentOperateSingleDishObj = {};
	var classIdToName = {};
	var lastClickClassIndex = $.cookie("lastClickClass_" + dishStorageKey) || 0;
	var allDishInOneArr = [];//将所有菜品拼成一个数组  搜索菜品时候会用到
	var bigOrSmall = $.cookie( "bigorsmall" ) || "small";//区分当前是大图还是小图模式  small 小图模式   big 大图模式
	var isSearching = false;
	var doSearchObj = {};//把搜索功能中立即搜索功能放在这个闭包中

	//小图模式的显示菜品列表
	function _generateDishList(index, classID){

		var html = template('jsItemTemplate', {"oneClassItems":_itemlist[index].items,
			"twoClassItems":_itemlist[index].tcItems});

		_dishCan.html(html);
		/* 延迟加载  */
		$(".scrollLoading").scrollLoading({container:$(".smallDishScroller"),callback: function() {}});
		for(var i = 0; i < _selectDishObj[classID].length ; i++ ){
			//进入页面的时候就看看存的数据里面有木有数据，然后存进页面里，就是页面上的那个小红圈圈
			$("#dish"+_selectDishObj[classID][i].itemId)
			.find(".currentSelectedNum")
			.css("visibility","visible")
			.html(_selectDishObj[classID][i].itemcount).prev().css("visibility","visible");
			// if( _selectDishObj[classID][i].itemcount != 0 ){
			$("#dish"+_selectDishObj[classID][i].itemId)
			.find(".dishWithTaste")
			.css("visibility","visible")
			.html( _selectDishObj[classID][i].itemcount ).prev().css("visibility","visible");
			// }else{
			// 	$("#dish"+_selectDishObj[classID][i].itemId).find(".dishWithTaste").hide();
			// }

		}
		if( classID.indexOf("tc_") != -1 ){
			$("#smallImgRight>.smallDishScroller>div").each(function(){
				if( setMenu.calculateTcNum( $(this).children( ".operateNumBtnGroup" ).children(".hiddentId").val() ) != 0 ){
					$(this).children( ".operateNumBtnGroup" )
					.children(".dishWithSetMenu").html( setMenu.calculateTcNum(
															$(this)
															.children( ".operateNumBtnGroup" )
															.children(".hiddentId").val()
														)
													  ).css("visibility","visible");
					console.log( setMenu.calculateTcNum( $(this)
											.children( ".operateNumBtnGroup" )
											.children(".hiddentId").val() ) );
				}else{
					$(this).children( ".operateNumBtnGroup" )
					.children(".dishWithSetMenu").hide().prev().hide();

				}
			});
		}
		_addRightcCellEvent();
		_showDishDetail();
	}

	//大图模式的显示菜品列表
	function _bigImgGenerateDishList( index,classID ){
		template.helper('rMoney', function (rMoneyVal) {return ToolUtil.rMoney(rMoneyVal,2);});
		var html = template('bigImgJsItemTemplate', {"oneClassItems":_itemlist[index].items});
		_bigDishScroller.html(html);
		for(var i = 0; i < _selectDishObj[classID].length ; i++ ){
			//进入页面的时候就看看存的数据里面有木有数据，然后存进页面里，就是页面上的那个小红圈圈
			$("#bigDish"+_selectDishObj[classID][i].itemId).find(".bigCurrentSelectedNum").css("visibility","visible").html(_selectDishObj[classID][i].itemcount).prev().css("visibility","visible");
		}
		_bigImgDishAddEvent();
		_showDishDetail();
	}
	function assembleAddDish(jqobj, operatemethod){
		_currentOperateSingleDishObj = {};
		_currentOperateSingleDishObj.price = ToolUtil.rMoney( jqobj.siblings(".hiddenprice").val() );
		_currentOperateSingleDishObj.itemId = jqobj.siblings(".hiddenitemid").val();
		_currentOperateSingleDishObj.itemname = jqobj.siblings(".hiddenitemname").val();
		_currentOperateSingleDishObj.itemcount = 1;
		_currentOperateSingleDishObj.unitname = jqobj.siblings(".hiddenunitname").val();
		_currentOperateSingleDishObj.taFileName = jqobj.siblings(".hiddenImgSrc").val();
		_currentOperateSingleDishObj.vipPrice = jqobj.siblings(".hiddenMemberPrice").val();
		_currentOperateSingleDishObj.hyjFlg = jqobj.siblings(".hiddenVippriceflg").val();
		_currentOperateSingleDishObj.mljFlg = jqobj.siblings(".hiddenMljFlg").val();
		if( jqobj.siblings(".hiddenunid").length > 0 ){
			_currentOperateSingleDishObj.unId = jqobj.siblings(".hiddenunid").val();
		}
		//_currentOperateSingleDishObj.taFileName = jqobj.parent().siblings(".dishImage").attr("data-url");
		_currentSelectedClass = jqobj.siblings(".hiddenItemClassID").val();
		refreshDataInSingleClass(_currentOperateSingleDishObj, operatemethod);
		// 这个函数需要调用，需要构造，input的位置要对，可以取到对应的值
	}
	//function assembleAddDishInFloatSelectedLayer(jqobj, operatemethod){
	function _addRightcCellEvent(){
		var continuousPlusTouch = false;
		var plusTimeout = {};
		var plusInterval = {};
		var plusBtnFunction = function(target, event){
			$(target).prev().css("visibility","visible").html( Number( $(target).prev().html() ) + 1 );
			$(target).prev().prev().css("visibility","visible");
			$(target).siblings(".bigNum").html(Number( $(target).prev().html() ));
			$(".dishClassScroller .selected .selectedDN").show().html( Number($(".dishClassScroller .selected .selectedDN").html())+1  );//设置当前品类里面所选菜品的数字
			assembleAddDish($(target),"+");
		};
		var successionAdd = function(target, event) {
			var id = $(target).siblings(".hiddenitemid").val();
			$(target).siblings(".bigNum").show();
			plusInterval[id] = setInterval(function() {
				if (continuousPlusTouch){
					plusBtnFunction(target, event);
				} else {
					$(target).trigger("touchend");
				}
			}, 100);
		}
		$(".smallImgPlusBtn").on("touchstart", function(event) {
			event.preventDefault();
			// var id = $(this).siblings(".hiddenitemid").val();
			// var self = this;
			// plusTimeout[id] = setTimeout(function() {
			// 	continuousPlusTouch = true;
			// 	successionAdd(self, event);
			// }, 1000);
			plusBtnFunction(this, event);
		}).on("touchend",function(event){
			// var id = $(this).siblings(".hiddenitemid").val();
			// plusBtnFunction(this, event);
			// clearTimeout(plusTimeout[id]); delete plusTimeout[id];
			// clearInterval(plusInterval[id]); delete plusInterval[id];
			// $(this).siblings(".bigNum").hide();
			// continuousPlusTouch = false;
		});

		var continuousMinusTouch = false;
		var minusTimeout = {};
		var minusInterval = {};
		var minusBtnFunction = function(target, event){
			/*event.stopPropagation();*/
			if( $(target).next().html() === "1" ){
				var id = $(target).siblings(".hiddenitemid").val(); //这里注意是target
				clearTimeout(minusTimeout[id]); delete minusTimeout[id];
				clearInterval(minusInterval[id]); delete minusInterval[id];
				$(target).next().css("visibility","hidden").html(Number($(target).next().html()) - 1);
				$(target).css("visibility","hidden");
				$(target).siblings(".bigNum").hide();
				if( $(".dishClassScroller .selected .selectedDN").html() === "1" ){
					$(".dishClassScroller .selected .selectedDN").hide();
				}
			} else if( Number( $(target).next().html() ) >= 1 ){
				$(target).next().html( Number( $(target).next().html() )-1 );
				$(target).siblings(".bigNum").html(Number( $(target).next().html() ));
			}
			$(".dishClassScroller .selected .selectedDN").html( Number($(".dishClassScroller .selected .selectedDN").html())-1 );
			assembleAddDish($(target),"-");
		};
		var successionMinus = function(target, event){
			var id = $(target).siblings(".hiddenitemid").val();
			$(target).siblings(".bigNum").show();
			minusInterval[id] = setInterval(function() {
				if (continuousMinusTouch){
					minusBtnFunction(target, event);
				} else {
					$(target).trigger("touchend");
				}
			}, 100);
		};
		$(".smallImgMinusBtn").on("touchstart ",function(event){
			event.preventDefault();
			// var id = $(this).siblings(".hiddenitemid").val();
			// var self = this;
			// minusTimeout[id] = setTimeout(function() {
			// 	continuousMinusTouch = true;
			// 	successionMinus(self, event);
			// }, 1000);
			minusBtnFunction(this, event);
		}).on("touchend ",function(event){
			// var id = $(this).siblings(".hiddenitemid").val();
			// clearTimeout(minusTimeout[id]); delete minusTimeout[id];
			// clearInterval(minusInterval[id]); delete minusInterval[id];
			// $(this).siblings(".bigNum").hide();
			// continuousMinusTouch = false;
		});

		tasteCookMethod.addEventToTasteBtn();
		setMenu.addEventToSetMenu();
		addEventToMinusBtn();


		window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function(){
			continuousPlusTouch = false;
			continuousMinusTouch = false;
		}, false);
	}

	//大图模式的点菜加减号点一下算加一道菜
	function _bigImgDishAddEvent(){
		var continuousPlusTouch = false;
		var plusTimeout = {};
		var plusInterval = {};
		var plusBtnFunction = function(target, event){
			/*event.stopPropagation();*/
			// $(target).prev().css("visibility","visible").html( Number( $(target).prev().html() ) + 1 );
			// $(target).prev().prev().css("visibility","visible");
			// $(target).siblings(".bigNum").html(Number($(target).prev().html()));
			// $(".classDishList>.selected>.bigImgSelectedDN").show().html( Number( $(".classDishList>.selected>.bigImgSelectedDN").html() ) + 1 );
			assembleAddDish($(target), "+");
		};
		var successionAdd = function(target, event) {
			var id = $(target).siblings(".hiddenitemid").val();
			$(target).siblings(".bigNum").show();
			plusInterval[id] = setInterval(function() {
				if (continuousPlusTouch){
					plusBtnFunction(target, event);
				} else {
					$(target).trigger("touchend");
				}
			}, 100);
		}
		$(".bigImgPlusBtn").on("touchstart",function(event){
			event.preventDefault();
			// var id = $(this).siblings(".hiddenitemid").val();
			// var self = this;
			// plusTimeout[id] = setTimeout(function() {
			// 	continuousPlusTouch = true;
			// 	successionAdd(self, event);
			// }, 1000);
			plusBtnFunction(this, event)
		}).on("touchend",function(event){
			// var id = $(this).siblings(".hiddenitemid").val();
			// plusBtnFunction(this, event);
			// clearTimeout(plusTimeout[id]); delete plusTimeout[id];
			// clearInterval(plusInterval[id]); delete plusInterval[id];
			// $(this).siblings(".bigNum").hide();
			// continuousPlusTouch = false;
		});

		var continuousMinusTouch = false;
		var minusTimeout = {};
		var minusInterval = {};
		var minusBtnFunction = function(target, event) {
			/*event.stopPropagation();*/
			if( $(target).next().html() === "1" ){
				var id = $(target).siblings(".hiddenitemid").val();  //这里注意是target
				clearTimeout(minusTimeout[id]); delete minusTimeout[id];
				clearInterval(minusInterval[id]); delete minusInterval[id];
				$(target).next().css("visibility","hidden").html( Number( $(target).next().html() )-1 );
				$(target).css("visibility","hidden");
				$(target).siblings(".bigNum").hide();
				if( $(".classDishList>.selected>.bigImgSelectedDN").html() === "1" ){
					$(".classDishList>.selected>.bigImgSelectedDN").hide();
				}
			}else if( Number( $(target).next().html() ) >= 1 ){
				$(target).next().html( Number( $(target).next().html() )-1 );
				$(target).siblings(".bigNum").html(Number( $(target).next().html() ));
			}
			$(".classDishList>.selected>.bigImgSelectedDN").html( Number( $(".classDishList>.selected>.bigImgSelectedDN").html() ) - 1 );
			assembleAddDish($(target), "-");
		};
		var successionMinus = function(target, event){
			var id = $(target).siblings(".hiddenitemid").val();
			$(target).siblings(".bigNum").show();
			minusInterval[id] = setInterval(function() {
				if (continuousMinusTouch){
					minusBtnFunction(target, event);
				} else {
					$(target).trigger("touchend");
				}
			}, 100);
		};
		$(".bigImgMinusBtn").on("touchstart", function(event) {
			event.preventDefault();
			// var id = $(this).siblings(".hiddenitemid").val();
			// var self = this;
			// minusTimeout[id] = setTimeout(function() {
			// 	continuousMinusTouch = true;
			// 	successionMinus(self, event);
			// }, 1000);
			minusBtnFunction(this, event);
		}).on("touchend", function(event) {
			// var id = $(this).siblings(".hiddenitemid").val();
			// clearTimeout(minusTimeout[id]); delete(minusTimeout[id]);
			// clearInterval(minusInterval[id]); delete minusInterval[id];
			// $(this).siblings(".bigNum").hide();
			// continuousMinusTouch = false;
		});

		tasteCookMethod.addEventToTasteBtn();
		addEventToMinusBtn();
		window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function(){
			continuousPlusTouch = false;
			continuousMinusTouch = false;
		}, false);

	}

	function _showDishDetail(){	/*打开显示菜品详情页*/
		$(".dishImage, .dishPic").click(function(){
			var dishDetailData = {};
			var $operateNumBtnGroup = $(this).siblings(".operateNumBtnGroup");
			dishDetailData.dishName = $operateNumBtnGroup.find(".hiddenitemname").val();
			dishDetailData.unitName = $operateNumBtnGroup.find(".hiddenunitname").val();
			dishDetailData.dishPrice = ToolUtil.rMoney(String($operateNumBtnGroup.find(".hiddenprice").val()));
			dishDetailData.vipPrice = ToolUtil.rMoney(String($operateNumBtnGroup.find(".hiddenMemberPrice").val()));
			dishDetailData.dishDesc = $operateNumBtnGroup.find(".hiddenDesp").val();
			dishDetailData.dishImgUrl = $(this).attr("data-url");
			dishDetailData.isHuiYuan = !(!huiyuan_manjianAc.isHuiyuan() || $operateNumBtnGroup.find(".hiddenVippriceflg").val() != 1);
			$(".dishDetailCan").html(template("dishDetailTemplate", dishDetailData)).show();
			$(".icon_right").hide();
		});

		$(".searchBigImg, .searchSmallImg").click(function(){
			var dishDetailData = {};
			var $operateNumBtnGroup = $(this).siblings(".operateNumBtnGroup");
			dishDetailData.dishName = $operateNumBtnGroup.find(".searchDishName").val();
			dishDetailData.unitName = $operateNumBtnGroup.find(".searchUnitname").val();
			dishDetailData.dishPrice = ToolUtil.rMoney(String($operateNumBtnGroup.find(".searchPrice").val()));
			dishDetailData.vipPrice = ToolUtil.rMoney(String($operateNumBtnGroup.find(".hiddenMemberPrice").val()));
			dishDetailData.dishDesc = $operateNumBtnGroup.find(".hiddenDesp").val();
			dishDetailData.dishImgUrl = $(this).attr("data-url");
			dishDetailData.isHuiYuan = !(!huiyuan_manjianAc.isHuiyuan() || $operateNumBtnGroup.find(".hiddenVippriceflg").val() != 1);
			$(".dishDetailCan").html(template("dishDetailTemplate", dishDetailData)).show();
			$(".icon_right").hide();
		});

	}

	function refreshDataInSingleClass(dishobj, operatemethod){
		var isinarr = isDishObjInArray(dishobj, _selectDishObj[_currentSelectedClass]);
		if (operatemethod === "+") {
			if (isinarr === -1) {
				_selectDishObj[_currentSelectedClass].push(dishobj);
			} else {
				_selectDishObj[_currentSelectedClass][isinarr].itemcount += 1;
			}
		} else if (operatemethod === "-") {
			if (_selectDishObj[_currentSelectedClass][isinarr].itemcount === 1) {
				_selectDishObj[_currentSelectedClass].splice(isinarr, 1);
			} else {
				_selectDishObj[_currentSelectedClass][isinarr].itemcount -= 1;
			}
		} else if(operatemethod === "taste" ) {
			//console.log( dishobj );
			if (isinarr === -1) {
				_selectDishObj[_currentSelectedClass].push(dishobj);
			} else {
				_selectDishObj[_currentSelectedClass].splice( isinarr,1 );
				_selectDishObj[_currentSelectedClass].push(dishobj);
			}
		}
		lStorage.set(dishStorageKey, JSON.stringify(_selectDishObj));
		//计算下总价
		calculateTotalPrice();

	}
	function isDishObjInArray(dishObj, targetArr) {// 判断是不是有菜在存的字符串里面
		for (var i = 0; i < targetArr.length; i++) {
			if (dishObj.itemId === targetArr[i].itemId) {
				//console.log(i);
				return i;
			}
		}
		return -1;
	}

	function calculateTotalPrice(){//计算菜品总数量和菜品总价
		var totalPrice = 0;
		var totalQuantity = 0;
		var huiyuan_manjianPrice = 0;
		//为了满减再声明两个变量，如果开启单个菜品的满减，菜品的价格就分为连个部分
		var no_manjianTotalPrice = 0;
		var manjianTotalPrice = 0;
		//把会员价，优惠的总价存进来
		var huiyuanTotalReducePrice = 0;
		//套餐总价
		var tcTotalPrice = 0;
		//没有计算满减的总价
		var noManjianTotal = 0;

		tcTotalPrice = setMenu.calculateTctotal();
		totalQuantity += setMenu.calculateTcTotalQuantity();

		for( var p in _selectDishObj ){
			//console.log(p);
			if( _selectDishObj[p].length !== 0 ){
				//console.log(_selectDishObj[p]);
				for( var i = 0 ; i<_selectDishObj[p].length ; i++ ){
					totalQuantity += Number( _selectDishObj[p][i].itemcount );

					if( _selectDishObj[p][i].tasteGroup ){
						totalPrice = totalPrice + calculateSrcPrice( _selectDishObj[p][i] );
					}else{
						totalPrice = totalPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].price );
					}

					if( huiyuan_manjianAc.isHuiyuan() && !huiyuan_manjianAc.isManjian() ){//判断现在是不是有会员价，有则进行会员价总价计算
						if( _selectDishObj[p][i].hyjFlg === "1" ){

							if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){
								huiyuan_manjianPrice = huiyuan_manjianPrice + calculateTaste(  _selectDishObj[p][i] );
								huiyuanTotalReducePrice += calculateTasteTotalReduce( _selectDishObj[p][i] );
							}else{
								huiyuan_manjianPrice = huiyuan_manjianPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].vipPrice );

								huiyuanTotalReducePrice += ( Number( _selectDishObj[p][i].price ) - Number( _selectDishObj[p][i].vipPrice ) ) * Number( _selectDishObj[p][i].itemcount ) ;
							}



						}else{
							if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){
								huiyuan_manjianPrice = huiyuan_manjianPrice + calculateTaste(  _selectDishObj[p][i] );
							}else{
								huiyuan_manjianPrice = huiyuan_manjianPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].price );
							}


						}
					}
					if( huiyuan_manjianAc.isManjian() ){
						if( huiyuan_manjianAc.isHuiyuan() ){
							if( _selectDishObj[p][i].mljFlg === "1" ){
								if( _selectDishObj[p][i].hyjFlg === "1" ){

									if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){

										manjianTotalPrice = manjianTotalPrice + calculateTaste(_selectDishObj[p][i]);
										huiyuanTotalReducePrice += calculateTasteTotalReduce( _selectDishObj[p][i] ) ;

									}else{
										manjianTotalPrice = manjianTotalPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].vipPrice );
										huiyuanTotalReducePrice += ( Number( _selectDishObj[p][i].price ) - Number( _selectDishObj[p][i].vipPrice ) ) * Number( _selectDishObj[p][i].itemcount ) ;
									}

								}else{
									if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){
										manjianTotalPrice = manjianTotalPrice + calculateTaste(_selectDishObj[p][i]);
									}else{
										manjianTotalPrice = manjianTotalPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].price );
									}
								}
							}else{
								if( _selectDishObj[p][i].hyjFlg === "1" ){

									if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){
										no_manjianTotalPrice = no_manjianTotalPrice + calculateTaste(_selectDishObj[p][i]);
										huiyuanTotalReducePrice += calculateTasteTotalReduce( _selectDishObj[p][i] ) ;
									}else{
										no_manjianTotalPrice = no_manjianTotalPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].vipPrice );
										huiyuanTotalReducePrice += ( Number( _selectDishObj[p][i].price ) - Number( _selectDishObj[p][i].vipPrice ) ) * Number( _selectDishObj[p][i].itemcount ) ;
									}

								}else{

									if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){
										no_manjianTotalPrice = no_manjianTotalPrice + calculateTaste(_selectDishObj[p][i]);
									}else{
										no_manjianTotalPrice = no_manjianTotalPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].price );
									}

								}
							}
						}else{
							if( _selectDishObj[p][i].mljFlg === "1" ){

								if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){
									manjianTotalPrice = manjianTotalPrice + calculateTaste(_selectDishObj[p][i]);
								}else{
									manjianTotalPrice = manjianTotalPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].price );
								}

							}else{

								if( _selectDishObj[p][i].tasteGroup && _selectDishObj[p][i].tasteGroup[0].standard.hasOwnProperty("unName") ){
									no_manjianTotalPrice = no_manjianTotalPrice + calculateTaste(_selectDishObj[p][i]);
								}else{
									no_manjianTotalPrice = no_manjianTotalPrice + Number( _selectDishObj[p][i].itemcount ) * Number( _selectDishObj[p][i].price );
								}

							}
						}
					}
				}
			}
		}

		totalPrice = totalPrice + tcTotalPrice;
		huiyuan_manjianPrice = huiyuan_manjianPrice + tcTotalPrice;

		if( huiyuan_manjianAc.isManjian() ){
			if( huiyuan_manjianAc.isHuiyuan() ){
				//huiyuan_manjianPrice = huiyuan_manjianAc.caculateManjian( huiyuan_manjianPrice );
				manjianTotalPrice = huiyuan_manjianAc.caculateManjian( manjianTotalPrice );
				huiyuan_manjianPrice = manjianTotalPrice + no_manjianTotalPrice;
				if( huiyuan_manjianPrice < 0 ){
					huiyuan_manjianPrice = 0;
				}
				huiyuan_manjianAc.setEndPrice( huiyuan_manjianPrice,huiyuanTotalReducePrice );
			}else{
				//totalPrice = huiyuan_manjianAc.caculateManjian( totalPrice );
				noManjianTotal = manjianTotalPrice + no_manjianTotalPrice + tcTotalPrice;
				manjianTotalPrice = huiyuan_manjianAc.caculateManjian( manjianTotalPrice );
				totalPrice = manjianTotalPrice + no_manjianTotalPrice + tcTotalPrice;
				if( totalPrice < 0 ){
					totalPrice = 0;
				}
				huiyuan_manjianAc.setEndPrice( totalPrice );
			}
		}
		if( huiyuan_manjianPrice < 0 ){
			huiyuan_manjianPrice = 0;
		}
		if( totalPrice < 0 ){
			totalPrice = 0;
		}

		//根据包里返回的方法去判断是不是要更改【总价，这是没有会员价的】还是显示【原价，这是有会员价的】
		if( huiyuan_manjianAc.isHuiyuan() ){
			huiyuan_manjianAc.setEndPrice( huiyuan_manjianPrice,huiyuanTotalReducePrice );
		}

		//$("#dishQuantity").html(totalQuantity);
		$("#originalTotalPrice").html(ToolUtil.fMoney( String(totalPrice), 2));
		if( huiyuan_manjianAc.isManjian() ){
			$("#originalPriceName").html( "优惠价" );
			if( $("#manjianyuanjia").length != 1 ){
				$("#originalPricePanel").append("<s id='manjianyuanjia' style='color:#aaaaaa;'>原价&yen;" + noManjianTotal + "</s>");
			}else{
				$("#manjianyuanjia").html( "原价&yen;" + noManjianTotal );
			}
		}
		if( huiyuan_manjianAc.isHuiyuan() ){//判断现在是不是有会员价，有则进行显示会员价的操作
			$("#originalPricePanel").addClass("grayfont");
			$("#originalPriceName").text("原价");
			$("#originalTotalPrice").html("<del>" + $("#originalTotalPrice").html() + "</del>");
			$("#memberPricePanel").css("display","block");
			$("#memberTotalPrice").html( ToolUtil.rMoney(String(huiyuan_manjianPrice.toFixed(2))) );
		}

		if (totalQuantity == 0){
			$("#dishesOk").addClass("disabled").html("先选菜");
			$(".dishNum").html( totalQuantity ).hide();
		} else {
			$("#dishesOk").removeClass("disabled").html( "点好了(" + totalQuantity + ")" );
			$(".dishNum").html( totalQuantity ).show();
			$("#iconRotate").addClass( "ballbigsmall" );
			$("#shopcarUp").addClass( "ballbigsmall" );
			setTimeout(function(){
				$("#iconRotate").removeClass( "ballbigsmall" );
				$("#shopcarUp").removeClass( "ballbigsmall" );
			},1000);
		}
		waisongAction.setTotal( totalPrice );

		function calculateTaste( dish ){
			var total = 0;
			for( var i = 0 ; i < dish.tasteGroup.length ; i++ ){
					if( dish.hyjFlg == "1" ){
						if( dish.tasteGroup[i].standard.hasOwnProperty("hyPrice") ){
							total += ( Number( dish.tasteGroup[i].standard.hyPrice ) * dish.tasteGroup[i].num );
						}else{
							total += ( Number( dish.vipPrice ) * dish.itemcount );
						}
					}else if( dish.hyjFlg == "0" ){
						if( dish.tasteGroup[i].standard.hasOwnProperty("unPrice") ){
							total += ( Number( dish.tasteGroup[i].standard.unPrice ) * dish.tasteGroup[i].num );
						}else{
							total += ( Number( dish.price ) * dish.itemcount );
						}
					}
			}
			return total;
		}
		function calculateSrcPrice( dish ){//计算原价
			var total = 0;
			for( var i = 0 ; i < dish.tasteGroup.length ; i++ ){
				if( dish.tasteGroup[i].standard != undefined && dish.tasteGroup[i].standard.hasOwnProperty("unPrice") ){
					total += ( Number( dish.tasteGroup[i].standard.unPrice ) * dish.tasteGroup[i].num );
				}else{
					total += ( Number( dish.price ) * dish.itemcount );
				}
			}
			return total;
		}
		function calculateTasteTotalReduce( dish ){
			var total = 0;
			for( var i = 0 ; i < dish.tasteGroup.length ; i++ ){
				if( dish.tasteGroup[i].standard != undefined && dish.tasteGroup[i].standard.hasOwnProperty("hyprice") ){
					total += ( Number( dish.tasteGroup[i].standard.unprice )-Number( dish.tasteGroup[i].standard.hyprice ) ) * dish.tasteGroup[i].num;
				}
			}
			return total;
		}

	}
	function fillFloatCheckSelectedDish(){//填充已选菜品的，然后加减号也可以加减菜
		//填充已点菜品详情的列表
		//console.log( _selectDishObj );
		$("#alreadySelected").empty();
		//把套餐的已选数据填充进来
		setMenu.addTcToAlreadySelected( $("#alreadySelected") );
		//console.log( _selectDishObj );
		for( var p in _selectDishObj ){
			if ( _selectDishObj[p].length !== 0 ){
				var pauseClassObj = {};
				//console.log(classIdToName[p]);
				pauseClassObj.className = classIdToName[p].classname;
				pauseClassObj.classId = classIdToName[p].classid;
				pauseClassObj.itemList = _selectDishObj[p];
				//console.log(pauseClassObj);
				//template.helper('fMoney', function (fMoneyVal) {return ToolUtil.rMoney( String(fMoneyVal) ,2);});
				var html = template("alreadyOrderDishTpl",pauseClassObj);
				$("#alreadySelected").append(html);
			}
		}
		// 给已选菜品列表上面的加减号加事件，然后还得去更新本地的存的已点菜品，然后还得去更新当前页面的品类的已点菜品数量，还有单独品项上的数量
		$("#alreadySelected .selectedMinus").on("click",function(){
			var pauseNum = Number( $(this).next().html() );
			if( pauseNum > 1 ){
				pauseNum--;
				$(this).next().html( pauseNum );
				assembleAddDish( $(this),"-" );
			}else{
				var self = this;
				//confirmDlg("您确定要删除这道菜嘛",function(){
					if( _selectDishObj[_currentSelectedClass].length === 1 ){
						$(self).parent().parent().prev(".classNameStyle").remove();
					}
					$(self).parent().parent().parent().remove();
					_currentSelectedClass = $(this).siblings(".hiddenItemClassID").val();
					assembleAddDish( $(self),"-" );
				//});
			}
		});
		$("#alreadySelected .selectedPlus").on("click",function(){
			var pauseNum = Number( $(this).prev().html() );
			pauseNum ++;
			$(this).prev().html( pauseNum );
			//_currentSelectedClass = $(this).siblings(".hiddenItemClassID").val();
			assembleAddDish( $(this),"+" );
		});
		//给已选菜品中的带做法的按钮
		tasteCookMethod.alreadySelectedTasteAddEvent();
	}

	function refreshDishNumInClass(){
		//更新每个小类里面的菜品数量
		$(".dishClassScroller>ul>li").each(function(){
			if( _selectDishObj[$(this).attr("classid")].length !== 0 ){
				var totalnum = 0;
				for(var i=0; i < _selectDishObj[$(this).attr("classid")].length;i++){
					totalnum = totalnum + Number( _selectDishObj[$(this).attr("classid")][i].itemcount );
				}
				$(this).find(".selectedDN").show().html(totalnum);
			}else{
				$(this).find(".selectedDN").hide().html(0);
			}

			if( $(this).attr("classid").indexOf( "tc_" ) != -1 ){
				//console.log( setMenu.calculateTcClassNum( $(this).attr("tcclassid") ) );
				if( setMenu.calculateTcClassNum( $(this).attr("tcclassid") ) != 0 ){
					$(this).find(".selectedDN").show().html( setMenu.calculateTcClassNum( $(this).attr("tcclassid") ) );
				}else{
					$(this).find(".selectedDN").hide();
				}
			}
		});
	}

	function bigImgRefreshDishNumInClass(){
		//大图模式里面更新每个小类的菜品数量
		$(".classDishList>li").each(function(){
			if( _selectDishObj[$(this).attr("classid")].length !== 0 ){
				var totalnum = 0;
				for(var i=0; i < _selectDishObj[$(this).attr("classid")].length;i++){
					totalnum = totalnum + Number( _selectDishObj[$(this).attr("classid")][i].itemcount );
				}
				$(this).find(".bigImgSelectedDN").show().html(totalnum);
			}else{
				$(this).find(".bigImgSelectedDN").hide().html(0);
			}
		});
	}

	function doDishSearch(){

		var searchResult = [];

		$("#searchDish").css("display","block");
		$("#searchResultCan").css("height",ch-$(".commonHeaderBar").outerHeight(true) - $(".orderDishedInfoCan").outerHeight(true) - $(".mt10mb16").outerHeight(true));

		$("#searchVal").focus().keyboardEnter(function(){//回车事件
			doSearchObj.todoSearchRightNow();
		});

		return{ todoSearchRightNow : function (){
			isSearching = true;
			var searchVal = $.trim( $("#searchVal").val() );
			searchResult = [];
			if( searchVal === "" ){
				alertDlg("请您填写搜索条件");
			}else{
				// TODO 循环这个 _itemlist 然后找到匹配的 用indexOf函数，然后这个循环里面套循环 循环 _selectDishObj 这个对象，把数量写上，最后push到searchResult
				var allSelectedDishInOneArr = [];//将所有已选菜品拼成一个数组
				for( var p in _selectDishObj ){
					//_selectDishObj[p].classID = p;
					for( var q=0 ; q<_selectDishObj[p].length ; q++ ){
						_selectDishObj[p][q].classID = p;
					}
					allSelectedDishInOneArr = allSelectedDishInOneArr.concat( _selectDishObj[p] );
				}
				//console.log( allSelectedDishInOneArr );
				for( var j = 0 ; j < allDishInOneArr.length ; j++ ){
					if( allDishInOneArr[j].name.indexOf( searchVal ) !== -1 ){
						//写一个函数取获取已选菜品的数量
						allDishInOneArr[j].itemCount = getAlSelectedDishNum( allDishInOneArr[j].itemId );
						searchResult.push( allDishInOneArr[j] );
					}
				}
				//console.log( allDishInOneArr );
				// //console.log( searchResult );
				if( bigOrSmall === "big" ){
					//template.helper('fMoney', function (fMoneyVal) {return ToolUtil.rMoney(fMoneyVal,2);});
					var html = template("searchDishResultTplBig",{ searchResultObj : searchResult });
					$("#searchResultCan").html( html );
					$(".bigImgPlusBtnSearch").on("click",function(){
						var num = Number( $(this).prev().html() );
						if( num === 0 ){
							$(this).prev().css("visibility","visible");
							$(this).prev().prev().css("visibility","visible");
						}
						num++;
						$(this).prev().html( num );
						setAlSelectedDishNum( $(this),"+" );
					});
					$(".bigImgMinusBtnSearch").on("click",function(){
						var num = Number( $(this).next().html() );
						if( num === 1 ){
							$(this).css("visibility","hidden");
							$(this).next().css("visibility","hidden");
						}
						num--;
						$(this).next().html( num );
						setAlSelectedDishNum( $(this),"-" );
					});
				}else if( bigOrSmall === "small" ){
					//template.helper('fMoney', function (fMoneyVal) {return ToolUtil.rMoney(fMoneyVal,2);});
					var html = template("searchDishResultTpl",{ searchResultObj : searchResult });
					$("#searchResultCan").html( html );
					//给加减号按钮加事件
					$(".searchPlusBtn").on("click",function(){
						var num = Number( $(this).prev().html() );
						if( num === 0 ){
							$(this).prev().css("visibility","visible");
							$(this).prev().prev().css("visibility","visible");
						}
						num++;
						$(this).prev().html( num );
						setAlSelectedDishNum( $(this),"+" );
					});
					$(".searchMinusBtn").on("click",function(){
						var num = Number( $(this).next().html() );
						if( num === 1 ){
							$(this).css("visibility","hidden");
							$(this).next().css("visibility","hidden");
						}
						num--;
						$(this).next().html( num );
						setAlSelectedDishNum( $(this),"-" );
					});
				}
				refreshAllSearchDish();
				//根据菜品id获取当前菜品已点的数量
				function getAlSelectedDishNum(dishid){
					for( var i = 0 ; i < allSelectedDishInOneArr.length ; i++ ){
						if( allSelectedDishInOneArr[i].itemId === dishid ){
							return allSelectedDishInOneArr[i].itemcount;
						}
					}
					return 0;
				};
				//根据菜品id更改菜品的数量，加一或者减一
				function setAlSelectedDishNum(dishobj,method){
					_currentOperateSingleDishObj = {};
					_currentOperateSingleDishObj.price = ToolUtil.rMoney( dishobj.siblings(".searchPrice").val() );
					_currentOperateSingleDishObj.itemId = dishobj.siblings(".searchDishId").val();
					_currentOperateSingleDishObj.itemname = dishobj.siblings(".searchDishName").val();
					_currentOperateSingleDishObj.itemcount = 1;
					_currentOperateSingleDishObj.unitname = dishobj.siblings(".searchUnitname").val();
					_currentOperateSingleDishObj.taFileName = dishobj.siblings(".searchTaFileName").val();
					_currentOperateSingleDishObj.vipPrice = dishobj.siblings(".hiddenMemberPrice").val();
					_currentOperateSingleDishObj.hyjFlg = dishobj.siblings(".hiddenVippriceflg").val();
					_currentOperateSingleDishObj.mljFlg = dishobj.siblings(".hiddenMljFlg").val();
					_currentSelectedClass = dishobj.siblings(".hiddenItemClassID").val();
					refreshDataInSingleClass(_currentOperateSingleDishObj, method);
				}

			}
		} }//return的对象结束
		//return { dosearchOut : doDishSearch };
	};

	// 更新选择的小类的菜品数据
	function refreshSelectDish(){//已点菜品变化，刷新已选菜品列表
		if( bigOrSmall === "small" ){
			_generateDishList( $(".dishClassScroller>ul>.selected").attr("order") , $(".dishClassScroller>ul>.selected").attr("classid") );
			refreshDishNumInClass();
		}else{
			_bigImgGenerateDishList( $(".classDishList>.selected").attr("order") , $(".classDishList>.selected").attr("classid") );
			bigImgRefreshDishNumInClass();
		}
	}

	// 更新所有小类的检索的菜品数据
	function refreshAllSearchDish(){
		$(".dishClassScroller>ul>").each(function(){
			var classid = $(this).attr("classid");
			if( bigOrSmall === "small" ){
				_generateDishList( $(".dishClassScroller>ul>.selected").attr("order") , classid );
				refreshDishNumInClass();
			}else{
				_bigImgGenerateDishList( $(".classDishList>.selected").attr("order") , classid );
				bigImgRefreshDishNumInClass();
			}
		});
	}

	function isClearLStorage(){//得在 _selectDishObj 被初始化后在执行这个函数   1430203302000
		var _timeStampInStorage = lStorage.get( dishStorageKey+"_timeStamp" );

		if( changeDishTime == "" ){
			//不清LStorage
		}else if( Number( _timeStampInStorage ) ){
			if( Number( _timeStampInStorage ) < Number( changeDishTime ) ){
				//清LStorage
				lStorage.remove( dishStorageKey );
				lStorage.remove( dishStorageKey + "_allTc" );
				lStorage.remove( dishStorageKey + "_allSelectedTastes" );
				lStorage.remove( "hmSign_" + dishStorageKey);
				lStorage.remove( "hmSign_" + dishStorageKey);
				lStorage.set( dishStorageKey+"_timeStamp", changeDishTime );
			}
		}else{//本地没有存 changeDishTime 这个修改菜品是时间戳的，则给他加进去
			lStorage.set( dishStorageKey+"_timeStamp", changeDishTime );
		}
	}
	function smallBigPublic(){
		var topInfoHeight = parseInt($(".topInfo").css("height") || 0);
		/* 操作区域高度 */
		$(".dishlistCan").css("height", ch - 49 - 45 - topInfoHeight);
		/* 小图模式滚动区高度 */
		$(".dishClassScroller").css("height", ch - 49 - 48 - 45 - topInfoHeight);
		$(".smallDishScroller").css( "height", ch - 49 - 45 - topInfoHeight);
		/* 大图模式滚动区高度*/
		$(".bigDishScroller").css("height", ch - 49 - 45 - 45 - topInfoHeight);

		/* 菜品滚动区高度 */
		//$(".smallDishScroller").css("height", ch - 49 - 46);
		$(".dishDetailCan").css("height", ch - 49 - 45).click(function(){
			$(this).hide();
			$(".icon_right").show();
		});

		waisongAction.changeDishes();

		for( var i = 0;i<_itemlist.length;i++ ){//生成菜品类列表
			_selectDishObj[_itemlist[i].itemClassId] = [];//初始化存储已选菜品的对象
			//声明一个包内全局变量，然后品项ID和品项名称形成key，value的对象。
			classIdToName[_itemlist[i].itemClassId] = {classname:_itemlist[i].name,classid:_itemlist[i].itemClassId};
		}
		//将所有菜品数据拼到一个数组中，供搜索菜品使用
		allDishInOneArr = [];

		for( var i = 0 ; i < _itemlist.length ; i++ ){
			if( _itemlist[i].items ){
				allDishInOneArr = allDishInOneArr.concat( _itemlist[i].items );
			}
		}

	}
	function initSmallImg(){//小图页面的初始化
		$("#smallImgLeft").css("display","block");
		$("#smallImgRight").css("display","block");
		$("#bigImgCenter").css("display","none");
		$("#dishClassHoriList").css("display","none");
		$("#bigImgClassSearch").css("display","none");

		$(".horn-bg").show();
		waisongAction.switchBigOrSmall( bigOrSmall );

		//_selectDishObj = JSON.parse( lStorage.get("${mcid}") );
		smallBigPublic();//准备数据

		//传入模板引擎，生成html
		_dishclassCan.html( template('jsClassTemplate', {"allClass":_itemlist}) );
		isClearLStorage();
		if(lStorage.get(dishStorageKey) !== null ){//初始化从本地localstorage里面读取点餐数据，然后把点的那些菜的数量显示在类和品相上
			_selectDishObj = JSON.parse(lStorage.get(dishStorageKey) );
			//更新每个小类里面的菜品数量 小图模式的
			refreshDishNumInClass();
		}

		$(".dishClassScroller>ul>li").on("click",function(){//菜品类列表加点击事件
			//alert($(this).attr("order"));
			_generateDishList( $(this).attr("order"), $(this).attr("classid") );
			_currentSelectedClass = $(this).attr("classid");//赋予当下选的是列表中的第几个类
			$(this).siblings().removeClass("selected");
			$(this).addClass("selected");
			lastClickClassIndex = $(this).attr("order");
			$.cookie( "lastClickClass_" + dishStorageKey , lastClickClassIndex );
		});
		//首次进入的时候，显示第一个菜品类别里面的菜品，然后下面一句里面是让第一个菜品类别显示为选中的样子
		_generateDishList(lastClickClassIndex ,_itemlist[lastClickClassIndex].itemClassId);
		_currentSelectedClass = $(".dishClassScroller>ul>li").eq(lastClickClassIndex).addClass("selected").attr("classid");
		//计算下总价
		calculateTotalPrice();

		//小图菜品搜索按钮
		$(".smallImgSearchBtn").on("click",function(){
			doSearchObj = doDishSearch();
		});
	}
	function initBigImg(){//大图页面的初始化
		$("#smallImgLeft").css("display","none");
		$("#smallImgRight").css("display","none");
		$("#bigImgClassSearch").css("display","block");
		$("#dishClassHoriList").css("display","block");
		$("#bigImgCenter").css("display","block");
		waisongAction.switchBigOrSmall( bigOrSmall );

		smallBigPublic();//准备数据
		isClearLStorage();
		if(lStorage.get(dishStorageKey) !== null ){//初始化从本地localstorage里面读取点餐数据，然后把点的那些菜的数量显示在类和品相上
			_selectDishObj = JSON.parse(lStorage.get(dishStorageKey) );
			//更新每个小类里面的菜品数量 大图模式的
			//refreshDishNumInClassBig();
		}

		//传入模板引擎，生成html，填充菜品类列表
		_bigDishclassCan.html( template('bigJsClassTemplate', {"allClass":_itemlist}) );
		//console.log( _itemlist );
		if(lStorage.get(dishStorageKey) !== null ){//初始化从本地localstorage里面读取点餐数据，然后把点的那些菜的数量显示在类和品相上
			_selectDishObj = JSON.parse(lStorage.get(dishStorageKey) );
			//更新每个小类里面的菜品数量 小图模式的
			bigImgRefreshDishNumInClass();
		}

		//生成大图cell
		_bigImgGenerateDishList( lastClickClassIndex ,_itemlist[lastClickClassIndex].itemClassId );
		//默认选中某个类
		_currentSelectedClass = $(".classDishList>li").eq(lastClickClassIndex).addClass("selected").attr("classid");

		//大图模式dishclasslist的实际长度
		var totalWidth = 0;
		$(".classDishList li").each(function(){
		    //totalWidth = totalWidth + calculateHeight( $(this).css("width") ) ;
			totalWidth = totalWidth + $(this).outerWidth() ;
		});
		$(".classDishList").css("width", totalWidth );
		//myScroll.refresh();
		var myScroll = new iScroll('dishClassHoriList', {//用一个好用的滚动条
			useTransition: false,
			hScrollbar:false,
			vScrollbar:false,
			vScroll:false
		});

		//菜品类加事件
		$(".classDishList>li").on("click",function(){
			_bigImgGenerateDishList( $(this).attr("order"), $(this).attr("classid") );
			_currentSelectedClass = $(this).attr("classid");//赋予当下选的是列表中的第几个类
			$(this).siblings().removeClass("selected");
			$(this).addClass("selected");
			lastClickClassIndex = $(this).attr("order");
			$.cookie( "lastClickClass_" + dishStorageKey , lastClickClassIndex );
		});

		//计算下总价
		calculateTotalPrice();

		//大图菜品搜索按钮
		$(".bigImgSearchBtn").on("click",function(){
			doSearchObj = doDishSearch();
		});
	}
	//给特殊的减按钮加事件
	function addEventToMinusBtn(){
		$("#specialBtnComplete").off("click");
		$(".specialMinus").on("click",function(){

			var itemClassId = $(this).siblings(".hiddenItemClassID").val();
			var itemId = $(this).siblings(".hiddenitemid").val();
			var tId = $(this).siblings(".hiddentId").val();
			//var selectedTc ;

			var crtOperateNoTc = {};
			var crtOperateTcArr =[];
			if( tId == undefined ){
				// for( var i = 0 ; i < _selectDishObj[ itemClassId ].length ; i++ ){
				// 	if( _selectDishObj[ itemClassId ][i].itemId == itemId ){
				// 		//console.log( _selectDishObj[ itemClassId ][i] );
				// 		crtOperateNoTc = _selectDishObj[ itemClassId ][i];
				// 	}
				// }

				crtOperateNoTc = findNoTcDish().item;
				//console.log( crtOperateNoTc );
			}else{
				//console.log( setMenu.getSelectedTc() );
				for( var j = 0 ; j < setMenu.getSelectedTc().tcItems.length ; j++ ){
					if( setMenu.getSelectedTc().tcItems[j].tId == tId ){
						crtOperateTcArr.push( setMenu.getSelectedTc().tcItems[j] );
					}
				}
				//console.log( crtOperateTcArr );
			}

			$("#getherSelected").html( template("getherSelectedTemp",{
				NoTc:crtOperateNoTc,
				tcArr:crtOperateTcArr
			}) );

			$(".setmenuMinus").on("click",function(){
				var crtcount = Number($(this).attr("count"));
				if( crtcount == 1 ){
					$(this).attr("count", crtcount-1 ).next().html( crtcount-1 );
					$(this).parent().parent().css("display","none");
				}else{
					$(this).attr("count", crtcount-1 ).next().html( crtcount-1 );
				}
			});
			$(".setmenuPlus").on("click",function(){
				var crtcount = Number($(this).prev().prev().attr("count"));
				$(this).prev().html( crtcount+1 ).prev().attr("count", crtcount+1 );
			});
			$(".tasteMinus").on("click",function(){
				var crtcount = Number($(this).attr("count"));
				if( crtcount == 1 ){
					$(this).attr("count", crtcount-1 ).next().html( crtcount-1 );
					$(this).parent().parent().css("display","none");
				}else{
					$(this).attr("count", crtcount-1 ).next().html( crtcount-1 );
				}
			});
			$(".tastePlus").on("click",function(){
				var crtcount = Number($(this).prev().prev().attr("count"));
				$(this).prev().html( crtcount+1 ).prev().attr("count", crtcount+1 );
			});

			$("#specialBtnComplete").on("click",function(){
				var allSelectedTastes = tasteCookMethod.getAllSelectedTastes();
				$("#getherSelected>div>div>.minusBtn").each(function(){
					var tasteid = $(this).attr( "tasteid" );
					var twinsid = $(this).attr( "twinsid" );
					var itemId = $(this).attr( "itemid" );
					var count = $(this).attr( "count" );
					crtOperateNoTc.itemcount = 0;
					if( tasteid ){
						console.log( count,tasteid );
						for( var i = 0 ; i < crtOperateNoTc.tasteGroup.length ; i++ ){
							if( tasteid == crtOperateNoTc.tasteGroup[i].tasteId ){
								if( count != "0" ){
									crtOperateNoTc.tasteGroup[i].num = Number(count);
								}else{
									console.log( "带口味做法，带规格，或者都带的，从所有已选菜品中删除",crtOperateNoTc.tasteGroup[i] );
									if( crtOperateNoTc.tasteGroup.length > 1 ){
										crtOperateNoTc.tasteGroup.splice(i,1);
									}else{
										_selectDishObj[ itemClassId ].splice( findNoTcDish().index,1 );
									}
								}
							}
							crtOperateNoTc.itemcount += crtOperateNoTc.tasteGroup[i].num;
						}
						if( allSelectedTastes[itemId] ){
							for( var k = 0 ; k < allSelectedTastes[itemId].length ; k++ ){
								if( tasteid == allSelectedTastes[itemId][k].tasteId ){
									if( count != "0" ){
										allSelectedTastes[itemId][k].num = Number(count);
									}else{
										console.log( "带口味做法，带规格，或者都带的，从所有已选带口味做法规格的菜中删除",allSelectedTastes[itemId][k] );
										if( allSelectedTastes[itemId].length > 1 ){
											allSelectedTastes[itemId].splice(k,1);
										}else{
											delete allSelectedTastes[itemId];
											break;
										}
									}
								}
							}
						}
					}
					if( twinsid ){
						console.log( count,twinsid );
						for( var j = 0 ; j < crtOperateTcArr.length ; j++ ){
							if( twinsid == crtOperateTcArr[j].twinsId ){
								if( count != "0" ){
									crtOperateTcArr[j].tcCount = Number(count);
								}else{
									console.log( "从套餐对象中删除",crtOperateTcArr[j] );
									deleteTcInAllTc(twinsid);
								}
							}
						}
					}
				});
				lStorage.set( dishStorageKey + "_allSelectedTastes",JSON.stringify( allSelectedTastes ) );
				lStorage.set( dishStorageKey , JSON.stringify( _selectDishObj ));
				lStorage.set( dishStorageKey+'_allTc' , JSON.stringify( setMenu.getSelectedTc() ));

				hideFloat();
				//刷新菜品数量
				refreshDishNumInClass();
				refreshSelectDish();
				calculateTotalPrice();
			});
			//判断只有一道菜的时候不弹层了，在减号里面直接可以减掉
			if( crtOperateNoTc.tasteGroup && crtOperateNoTc.tasteGroup.length == 1 ){
				if( crtOperateNoTc.tasteGroup[0].num > 1 ){
					crtOperateNoTc.tasteGroup[0].num --;
					$("#getherSelected .dishInfoma .tasteMinus").attr("count",crtOperateNoTc.tasteGroup[0].num);
				}else{
					$("#getherSelected .dishInfoma .tasteMinus").attr("count","0");
				}
				//else{
					//_selectDishObj[ itemClassId ].splice( findNoTcDish().index,1 );
				//}
				$("#specialBtnComplete").click();
			}else{
				$("#special_minus_mask").addClass( "weui_fade_toggle" );
				$("#special_minus_mask").css("display","block");
				$("#weui_special_minus_actionsheet").addClass( "weui_actionsheet_toggle" );
			}

			$("#special_minus_mask").on("click",function(){
				hideFloat();
			});

			function findNoTcDish(){
				for( var i = 0 ; i < _selectDishObj[ itemClassId ].length ; i++ ){
					if( _selectDishObj[ itemClassId ][i].itemId == itemId ){
						//console.log( _selectDishObj[ itemClassId ][i] );
						return {item:_selectDishObj[ itemClassId ][i],index:i};
					}
				}
				return -1;
			}

			function deleteTcInAllTc( twinsid ){
				for( var j = 0 ; j < setMenu.getSelectedTc().tcItems.length ; j++ ){
					if( setMenu.getSelectedTc().tcItems[j].twinsId == twinsid ){
						setMenu.getSelectedTc().tcItems.splice( j,1 );
					}
				}
			}

			function hideFloat(){
				$("#special_minus_mask").removeClass( "weui_fade_toggle" );
				$("#special_minus_mask").css("display","none");
				$("#weui_special_minus_actionsheet").removeClass( "weui_actionsheet_toggle" );
			}

		});
	}

	//点菜详情弹出按钮加事件，还有隐藏弹出层
	$(".bigprice").on("click",function(){
		if( $(this).attr("isOpen") === "0" ){
			/*开启*/
			$(this).attr("isOpen", 1);
			$("#dishConfirm").css("display","block");
			$("#dishConfirmMark").css("display","block");
			$("#dishConfirmContent").slideToggle();
			//$("#iconRotate").addClass("rotateStyle");
			fillFloatCheckSelectedDish();
			$("#iconRotate").hide();
		}else if( $(this).attr("isOpen") === "1" ){
			/*关闭*/
			$("#iconRotate").show();
			$(this).attr("isOpen", 0);
			$("#dishConfirmContent").slideToggle();
			setTimeout('$("#dishConfirm").css("display","none");$("#dishConfirmMark").css("display","none")',500);
			//$("#iconRotate").removeClass("rotateStyle");
			_currentSelectedClass = $(".dishClassScroller>ul>.selected").attr("classid");
			refreshSelectDish();
		};
		//fillFloatCheakSelectedDish();
	});

	$("#dishListInformation").on("click",function(){

		$(".bigprice").attr("isOpen", 0);
		$("#dishConfirmContent").slideToggle();
		setTimeout('$("#dishConfirm").css("display","none");$("#dishConfirmMark").css("display","none")',500);
		//$("#iconRotate").removeClass("rotateStyle");
		_currentSelectedClass = $(".dishClassScroller>ul>.selected").attr("classid");
		refreshSelectDish();
		//计算下总价
		calculateTotalPrice();

		if ($("#searchVal").val() !== ""){
			doDishSearch().todoSearchRightNow();
		}
		$("#iconRotate").show();
	});

	$("#dishConfirmMark").on("click", function(e){
		e.stopPropagation();
		$("#dishListInformation").trigger("click");
	});

	$("#clearshopcart").on("click",function(e){
		e.stopPropagation();
		confirmDlg("确认清空已点菜品吗?",function(){
			for( p in _selectDishObj ){
				_selectDishObj[p] = [];
			}
			//console.log( tasteCookMethod.getAllSelectedTastes() );
			for( q in tasteCookMethod.getAllSelectedTastes() ){
				tasteCookMethod.getAllSelectedTastes()[q] = [];
			}
			lStorage.set(dishStorageKey + "_allSelectedTastes" , JSON.stringify(tasteCookMethod.getAllSelectedTastes()));
			lStorage.set(dishStorageKey, JSON.stringify(_selectDishObj));
			$("#alreadySelected").empty();
			setMenu.clearTcCan();

			$("#dishListInformation").trigger("click");
		})
	});

	//footer的按钮
	$(".icon_left").on("click", function(){
		if ($(".dishDetailCan").is(":visible")){
			$(".dishDetailCan").hide();
			$(".icon_right").show();
		} else if( $("#searchDish").css("display") === "block" ){
			$("#searchDish").css("display","none");
			$("#excuteSearchBtn").off("click");
			isSearching = false;
			$("#searchVal").val("");
			$("#searchResultCan").empty();
			_currentSelectedClass = $(".dishClassScroller>ul>.selected").attr("classid");
			refreshSelectDish();
		} else {
			//window.location.href='${url_index}';
			window.location.href = jumpurl ;
			//window.history.back();
		}
	});
	$(".icon_right").on("click",function(){
		if( !isSearching ){//&#xe619; &#xe61a;
			$("#excuteSearchBtn").off("click");
			if( bigOrSmall === "small" ){
				bigOrSmall = "big";
				initBigImg();
				$(this).html( "&#xe61a;" );
				$.cookie( "bigorsmall","big" );
			}else{
				bigOrSmall = "small";
				initSmallImg();
				$(this).html( "&#xe619;" );
				$.cookie( "bigorsmall","small" );
			}
		}else{
			//alertDlg("搜索模式不能修改大小图模式");
			//doSearchObj.dosearchOut();
			if( bigOrSmall === "small" ){
				bigOrSmall = "big";
				//initBigImg();
				doSearchObj.todoSearchRightNow();
				$(this).html( "&#xe61a;" );
				$.cookie( "bigorsmall","big" );
			}else{
				bigOrSmall = "small";
				//initSmallImg();
				doSearchObj.todoSearchRightNow();
				$(this).html( "&#xe619;" );
				$.cookie( "bigorsmall","small" );
			}
		}
	});

	//把菜品做法数据添加到菜品数据中
	tasteCookMethod.addAllTasteToAlldishes( _itemlist );
	//添加套餐数据到菜品数据中
	//_itemlist = _itemlist.concat( setMenu.getData() );
	_itemlist = setMenu.getData().concat( _itemlist );
	//console.log( _itemlist );
	//程序入口
	if( _itemlist.length !== 0 ){
		if( $.cookie( "bigorsmall" ) === "small" ){
			//调用小图模式的初始化的函数
			initSmallImg();
			$( ".icon_right" ).html( "&#xe619;" );
		}else if( $.cookie( "bigorsmall" ) === "big" ){
			//调用大图模式的初始化函数
			initBigImg();
			$( ".icon_right" ).html( "&#xe61a;" );
		}else{
			initSmallImg();
			$( ".icon_right" ).html( "&#xe619;" );
		}
	}else{
		$("#bigImgClassSearch").empty();
		$("#smallImgLeft").empty();
	}

	tasteCookMethod.showAllTaste();
	setMenu.logData();
	return{
		refreshDataInSingleClass : refreshDataInSingleClass,
		setCurrentSelectedClass:function( val ){
			_currentSelectedClass = val;
		},
		// refreshDishNumInClass:refreshDishNumInClass,
		// bigImgRefreshDishNumInClass:bigImgRefreshDishNumInClass,
		refreshSelectDish:refreshSelectDish,
		getSelectedDish:function(){
			return _selectDishObj;
		},
		refreshSelectDish:refreshSelectDish,
		calculateTotalPrice:calculateTotalPrice,
		findItemMulitUnits:function( itemClassId,itemId ){
			for( var i = 0 ; i < _itemlist.length ; i++ ){
				if( _itemlist[i].itemClassId == itemClassId ){
					for( var j = 0 ; j < _itemlist[i].items.length ; j++ ){
						if(  _itemlist[i].items[j].itemId == itemId ){
							return _itemlist[i].items[j].itemMulitUnits;
						}
					}
				}
			}
		}
	}
};
/**
 * 外送功能，在dishes.jsp上要加的
 */
 var Waisong = function( bizType,dePrice,minPrice,freeDeFlg,freeDePrice ){
	var cw = document.documentElement.clientWidth;
	var ch = document.documentElement.clientHeight;
 	var  isAddDepriceBox = false;
 	var dishTotal = 0;

 	return{
 			changeDishes:function(){
 				// //console.log( bizType );
 				var topInfoHeight = parseInt($(".topInfo").css("height") || 0);
 				if( bizType === "waisong" ){
	 				/* 小类滚动区高度 */
	 				$(".dishClassScroller").css("height", ch -  49 - 48 - 45 - topInfoHeight);
	 				/* 菜品滚动区高度 */
	 				$(".smallDishScroller").css("height", ch - 49 - 45 - topInfoHeight);
 				}
 			},
 			switchBigOrSmall:function( bigOrSmall ){
 				if( bizType === "waisong" ){
 					$(".topInfo").css("display","block");
 				}
 			},
 			isAboveMinPrice:function(){//根据起送费和点餐的总价格判断是不是可以允许跳转
 				if( bizType === "waisong" ){
 					if ( dishTotal < Number( minPrice ) ){
						$("#dishesOk").addClass("disabled").html("先选菜");
						alertDlg( "您选择的菜品总价没有超过起送费，再选一些菜吧" );
					} else {
						$("#dishesOk").removeClass("disabled").html("点好了");
					}
 				}
 			},
 			setTotal : function( total ){
 				dishTotal = total;
 				if( bizType === "waisong" ){
 					if( $("#waisongMinPrice").length == 0 ){
 						$("#originalPricePanel").addClass("pr").append( "<span id='waisongMinPrice' class='pa'>起送&yen;" + minPrice + "</span>" );
 					}
 					if ( dishTotal < Number( minPrice ) ){
						$("#dishesOk").addClass("disabled").html("先选菜");
					} else {
						$("#dishesOk").removeClass("disabled").html("点好了");
					}
 				}
 			}
 	}

 }
 /**
  * 会员，满减的活动
  * 会员和满减的逻辑包
  */
var huiyuan_manjian = function(memberPriceFlg,fullReduceFlg,fullReduces,biztypeMcid){
	//需要把点菜的数据传到点菜确认页，会员还是满减，得传过去。还有最终的价格也得传过去。如果是满减还有把满减的方案传过去
	//{ type:1,endPrice:180 } 会员价   localstorage 键值  ${bizType}_${mcid}_huiyuan_manian
	//{ type:2,manjianPlan:{ fullPrice:100,reducePrice:10 },endPrice:160 } 满减
	//传优惠方式，最终的价格。满减就传规则。
	//计算满减菜价的地方还有点问题，等于满减额度的时候没减
	var cw = document.documentElement.clientWidth;
	var ch = document.documentElement.clientHeight;
	var huiyuanAc;
	var manjianAc;
	var isAddManjianBox = false;
	var huiyuan_manjian_obj = {};
	var huiyuan_manjian_sign = "hmSign_" + biztypeMcid;

	//初始化，会员价和满减都没有
	template.helper('huiyuan', function ( huiyuanjia ) {return false;});
	template.helper('manjian', function(){return false;});

	var huiyuan = function(){
		//template.helper('huiyuan', function ( huiyuanjia ) {return ToolUtil.rMoney(huiyuanjia,2);});
		template.helper('huiyuan', function ( huiyuanjiaFlg ) {
//			if( huiyuanjiaFlg === "1" ){
//				return true;
//			}else{
//				return false;
//			}
			return true;
		});
		huiyuan_manjian_obj.type = 1;
		huiyuan_manjian_obj.hyjTag = 1;
		huiyuan_manjian_obj.mljTag = 0;
	}
	var manjian = function(){
		if( fullReduces !== "" ){//外送没有会员价满减，不用考虑外送了。下一步要做的是，得到满减的条件放到条中。然后计算价格。238行
			huiyuan_manjian_obj.type = 2;
			huiyuan_manjian_obj.hyjTag = 0;
			huiyuan_manjian_obj.mljTag = 1;
			template.helper('manjian', function(){return true;});
			var fullReducesObj = JSON.parse( fullReduces );
			//console.log( fullReducesObj );
			var manjianStr = "";
			var isAboveSmallestLevel = false;

			var sortedFullReducesObj = fullReducesObj.sort( function(a,b){//数组排序
				return Number( a.fullPrice ) - Number( b.fullPrice ) ;
			} );
			//console.log( sortedFullReducesObj );

			//var fullPriceList = [];
			for( var i = 0 ; i < fullReducesObj.length ; i++ ){
				//fullPriceList.push( fullReducesObj[i].description );
				manjianStr += fullReducesObj[i].description;
				if( i === fullReducesObj.length-1 ){
					manjianStr += "。";
				}else{
					manjianStr += "，";
				}
			}

			return {
				caculateManjian : function( total ){
					//var userTop = {reducePrice:0};用户达到的满减额,给一个初始值，如果刚开始点菜吗，没有菜的时候显示零
					var userTop = sortedFullReducesObj[0];
					isAboveSmallestLevel = false;
					for( var i = 0; i < sortedFullReducesObj.length ; i++ ){
						if( Number( total ) >= Number( sortedFullReducesObj[i].fullPrice ) ){
							//userTop = Number( sortedFullReducesObj[i].fullPrice );
							userTop = sortedFullReducesObj[i];
							isAboveSmallestLevel = true;
						}else{
							break;
							//return userTop;
						}
					}
					if( isAboveSmallestLevel ){
						var caculatedTotal = Number( total ) - Number( userTop.reducePrice );
						huiyuan_manjian_obj.isAboveSmallestLevel = true;
					}else{
						var caculatedTotal = Number( total );
						huiyuan_manjian_obj.isAboveSmallestLevel = false;
					}
					huiyuan_manjian_obj.manjianPlan = userTop;
					return caculatedTotal;
					//alert( total );
				}
			}
		}
	}

	if( memberPriceFlg === "1" && fullReduceFlg === "0" ){
		huiyuanAc = huiyuan();
	}else if( memberPriceFlg === "0" && fullReduceFlg === "1" ){
		manjianAc = manjian();
	}else if( memberPriceFlg === "1" && fullReduceFlg === "1" ){
		huiyuanAc = huiyuan();
		manjianAc = manjian();
		huiyuan_manjian_obj.type = 3;//既有会员，又有满减的情况
		huiyuan_manjian_obj.hyjTag = 1;
		huiyuan_manjian_obj.mljTag = 1;
	}else if( memberPriceFlg === "0" && fullReduceFlg === "0" ){
		template.helper('huiyuan', function ( huiyuanjia ) {return false;});
		huiyuan_manjian_obj.type = 0;
		huiyuan_manjian_obj.hyjTag = 0;
		huiyuan_manjian_obj.mljTag = 0;
	}

	return {
		isHuiyuan : function(){
			if( memberPriceFlg === "1" ){
				return true;
			}else{
				return false;
			}
		},
		isManjian : function(){
			if( fullReduceFlg === "1" ){
				return true;
			}else{
				return false;
			}
		},
		caculateManjian : function(total){
			if( manjianAc ){
				return manjianAc.caculateManjian(total);
			}else{
				return null;
			}
		},
		setEndPrice : function( endPrice,huiyuanTotalReducePrice ){
			huiyuan_manjian_obj.endPrice = endPrice;
			if( huiyuanTotalReducePrice ){
				huiyuan_manjian_obj.huiyuanTotalReducePrice = huiyuanTotalReducePrice;
			};
		},
		setDataToLocalStorage : function(){
			lStorage.set(huiyuan_manjian_sign, JSON.stringify( huiyuan_manjian_obj ) );
		}
	}

}
//原来的公告不要了，加新的公告。
var scrollNotice = function( ordernotice,waisongremark,bizType ){
	var scrollContent = "";
	if (bizType == "waisong") {
		scrollContent = waisongremark;
	} else if (bizType == "diancai") {
		scrollContent = ordernotice;
	}
	if (scrollContent !== ""){
		//原来的外送的加公告的位置不变，做修改，判断是不是新的功能包加了滚动显示，如果加了则不动，然后填入新的数据。点菜的用新的模块功能，判断外送还是点菜，显示谁的~
		//或者在这里判断是外送啊还是点菜什么的
		//$("<div class=\"horn-bg smallTopInfo \"><div class=\"col-xs-1\"><i class=\"iconfont\">&#xe64c;</i></div><div class=\"col-xs-10 ml10 \" id=\"gundong\">"+ scrollContent + "</div></div>").insertBefore("#smallImgLeft");

		$("body").append("<div class=\"col-xs-12 horn-bg topInfo\"><div class=\"row\"><i class=\"iconfont pull-left ml10 mr10\">&#xe64c;</i><div id=\"gundong\">" + scrollContent + "</div></div>");
		$("#gundong").tomakeitscroll(20);
		$("#dishlistCan").css("top","79px");
		//isAddManjianBox = true;
		$("#gundong").on("click",function(){
			$("body").append("<div class=\"publicInfoMark\"><div class=\"publicInfoTitle\">公告</div><pre class=\"publicInfoContent\">" + scrollContent + "</pre><div class=\"publicInfoClose\"><div class=\"publicInfoCloseBtn\"><div class=\"h\"></div><div class=\"v\"></div></div><div></div>");
			var publicInfoContentHeight = document.documentElement.clientHeight - 200;
			$(".publicInfoContent").css("height", publicInfoContentHeight);

			$(".publicInfoCloseBtn").on("click",function(){
				$(".publicInfoMark").remove();
			});
		});
	} else {
		$("#dishlistCan").css("top","49px");

	}
};

//增加口味

var tasteCookMethod = (function(){
	//var allTaste = ToolUtil.jsonStrToObj( '{1:[{"groupid":1,"groupname":"测试组别1","itemMakes":[{"groupid":1,"mcid":2790,"moid":1,"name":"测试做法1","orderno":1}],"itemId":1,"mcid":2790,"orderno":1,"selectmodel":0},{"groupid":3,"groupname":"测试组别3","itemMakes":[{"groupid":3,"mcid":2790,"moid":3,"name":"测试做法3","orderno":3},{"groupid":3,"mcid":2790,"moid":5,"name":"测试做法5","orderno":5}],"itemId":1,"mcid":2790,"orderno":3,"selectmodel":1}],10:[{"groupid":2,"groupname":"测试组别2","itemMakes":[{"groupid":2,"mcid":2790,"moid":6,"name":"测试做法6","orderno":6},{"groupid":2,"mcid":2790,"moid":4,"name":"测试做法4","orderno":4},{"groupid":2,"mcid":2790,"moid":2,"name":"测试做法2","orderno":2}],"itemId":10,"mcid":2790,"orderno":2,"selectmodel":1}]}' );//口味做法的选择的增加

	var allTaste = {};
	var allSelectedTastes = {};
	var selectedMakes = {};
	var self = {};
	var biz_shop = "";
	var crtdishobj = {};
	//所有的规格信息
	var standard = {};
	//已选的规格信息
	var selectedStandard ;

	function objInArr( attr,obj,arr ){
		for( var i = 0 ; i < arr.length ; i++ ){
			if( arr[i][attr] === obj[attr] ){
				return i;
			}
		}
		return -1;
	}

	function cloneTasteToAllDish( self ){
		crtdishobj.price = $(self).siblings("input[class=hiddenprice]").val();
		crtdishobj.itemId = $(self).siblings("input[class=hiddenitemid]").val();
		crtdishobj.itemname = $(self).siblings("input[class=hiddenitemname]").val();
		//crtdishobj.itemcount = 1;
		crtdishobj.unitname = $(self).siblings("input[class=hiddenunitname]").val();
		crtdishobj.taFileName = $(self).siblings("input[class=hiddenImgSrc]").val();
		crtdishobj.vipPrice = $(self).siblings("input[class=hiddenMemberPrice]").val();
		crtdishobj.hyjFlg = $(self).siblings("input[class=hiddenVippriceflg]").val();
		crtdishobj.mljFlg = $(self).siblings("input[class=hiddenMljFlg]").val();
		crtdishobj.tasteGroup = allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ];
		diancaiAction.setCurrentSelectedClass( $(self).siblings("input[class=hiddenItemClassID]").val() );
		var sender =  $.extend(true, {}, crtdishobj);
		diancaiAction.refreshDataInSingleClass( sender,"taste" );
	}

	function findDishInAllSelectedDish( itemid,method,newtaste ){
		var allSelectedDishes = diancaiAction.getSelectedDish();
		for( var p in allSelectedDishes ){
			for( var i = 0 ; i < allSelectedDishes[p].length ; i++ ){
				if( itemid == allSelectedDishes[p][i].itemId ){
					if( method == "+" ){
						allSelectedDishes[p][i].itemcount ++;
						allSelectedDishes[p][i].tasteGroup = newtaste;
						//findTasteIndish( allSelectedDishes[p][i].tasteGroup,tasteId ).num++;
						//console.log( "+",allSelectedDishes );
					}else if( method == "-" ){
						if( allSelectedDishes[p][i].itemcount > 1 ){
							allSelectedDishes[p][i].itemcount --;
							//findTasteIndish( allSelectedDishes[p][i].tasteGroup,tasteId ).num--;
							allSelectedDishes[p][i].tasteGroup = newtaste;
						}else{
							allSelectedDishes[p].splice( i,1 );
						}
						//console.log( "-",allSelectedDishes );
					}
				}
			}
		}
	lStorage.set(biz_shop, JSON.stringify( allSelectedDishes ));
	}
	//判断是不是有相同口味做法的菜品
	function isSameMakes( itemid,makes ){
		for( var i = 0 ; i < allSelectedTastes[itemid].length ; i++ ){
			if( allSelectedTastes[itemid][i].dishtastesStr == makes.dishtastesStr && allSelectedTastes[itemid][i].standard.unId == makes.standard.unId ){
				return allSelectedTastes[itemid][i];
			}
		}
		return -1;
	}

	return {
		getAllSelectedTastes : function(){
			return allSelectedTastes;
		},
		alreadySelectedTasteAddEvent : function(){
			$( ".tasteSelectedPlus" ).on( "click",function(){
				//console.log( allSelectedTastes );
				//console.log( $(this).siblings("input[class=hiddentasteId]").val() );
				//console.log( $(this).siblings("input[class=hiddenitemid]").val() );
				var tasteId = $(this).siblings("input[class=hiddentasteId]").val();
				var itemid = $(this).siblings("input[class=hiddenitemid]").val();

				for( var i = 0 ; i < allSelectedTastes[ itemid ].length ; i++ ){
					//for( var j = 0 ; j < allSelectedTastes[ itemid ][i].dishtastes.length ; j++ ){
						if( allSelectedTastes[ itemid ][i].tasteId == tasteId ){
							allSelectedTastes[ itemid ][i].num ++;
							findDishInAllSelectedDish( itemid,"+",allSelectedTastes[ itemid ] );
							$(this).prev().html( allSelectedTastes[ itemid ][i].num );
						}
					//}
				};
				//cloneTasteToAllDish( this );
				diancaiAction.calculateTotalPrice();
				lStorage.set( biz_shop+'_allSelectedTastes', JSON.stringify(allSelectedTastes));
			});
			$( ".tasteSelectedMinus" ).on( "click",function(){
				//console.log( $(this).siblings("input[class=hiddentasteId]").val() );
				var tasteId = $(this).siblings("input[class=hiddentasteId]").val();
				var itemid = $(this).siblings("input[class=hiddenitemid]").val();

				for( var i = 0 ; i < allSelectedTastes[ itemid ].length ; i++ ){
					if( allSelectedTastes[ itemid ][i].tasteId == tasteId ){
						if( allSelectedTastes[ itemid ][i].num > 1 ){
							allSelectedTastes[ itemid ][i].num --;
							$(this).next().html( allSelectedTastes[ itemid ][i].num );
							findDishInAllSelectedDish( itemid,"-",allSelectedTastes[ itemid ] );
						}else{
							allSelectedTastes[ itemid ].splice( i,1 );
							if( allSelectedTastes[ itemid ].length == 0 ){
								$(this).parent().parent().parent().parent().parent().prev().remove();
							}
							$(this).parent().parent().parent().remove();
							findDishInAllSelectedDish( itemid,"-",allSelectedTastes[ itemid ] );

						}

					}
				};
				//cloneTasteToAllDish( this );
				diancaiAction.calculateTotalPrice();
				lStorage.set( biz_shop+'_allSelectedTastes', JSON.stringify(allSelectedTastes));
			});
		},
		showAllTaste : function(){
			//设置口味容器的高度
			// $("#taseteCan").css( "max-height",document.documentElement.clientHeight );
		},
		getTaste:function( itemId ){//每一个菜都来这里取菜品做法
			if( allTaste[ itemId ] ){
				return allTaste[ itemId ];
			}else{
				return -1;
			}
		},
		addAllTasteToAlldishes : function( itemlist ){

			for( var i = 0 ; i < itemlist.length ; i++ ){
				for( var j = 0 ; j < itemlist[i].items.length ; j++ ){
					if( allTaste[itemlist[i].items[j].itemId] ){
						itemlist[i].items[j].itemMake = allTaste[itemlist[i].items[j].itemId]; //增加一个做法排序功能
					}else{
						itemlist[i].items[j].itemMake = [];
					}
					// if( standard[ itemlist[i].items[j].itemId ] ){
					// 	itemlist[i].items[j].standard = standard[ itemlist[i].items[j].itemId ];
					// }else{
					// 	itemlist[i].items[j].standard = [];
					// }
				}
			}
			console.log( itemlist,standard );
		},
		setAlltaste:function( itemMake,bizShop ){
			//设置口味容器的最大高度
			$("#taseteCan").css( "max-height",document.documentElement.clientHeight*3/4 );
			if( itemMake !== "{}" ){
				allTaste = ToolUtil.jsonStrToObj( itemMake );
				for( p in allTaste ){
					var tasteGroup = allTaste[p].sort(function( a , b ){ return a.orderno - b.orderno }); //口味做法组排序
					for( q in tasteGroup ){
						tasteGroup[q].itemMakes.sort(function( a , b ){ return a.orderno - b.orderno }); //口味做法排序
					}
				}
			}

			biz_shop = bizShop;
			//console.log( lStorage.get( bizShop+'_allSelectedTastes' ) );
			var lStorage_allSelectedTastes = lStorage.get( bizShop+'_allSelectedTastes' );
			if( lStorage_allSelectedTastes !== null ){
				allSelectedTastes = JSON.parse( lStorage_allSelectedTastes );
			}


		},
		addEventToTasteBtn : function(){
			$(".tasteMinusbtn").off("click");
			$(".tastePlusbtn").off("click");
			$("#dishtastesOk").off("click");

			$( ".selectTaste" ).on("click",function(){
				//把有默认规格大小份的菜放入已选规格的数据对象中
				var crtAllStandard = diancaiAction.findItemMulitUnits( $(this).siblings("input[class=hiddenItemClassID]").val(),$(this).siblings("input[class=hiddenitemid]").val() );
				$(".tasteSelectedNum").html( "1" );//初始化
				selectedStandard = {};
				//console.log( crtAllStandard );
				//找到默认的规格
				if( crtAllStandard ){
					for( var i = 0 ; i < crtAllStandard.length ; i++ ){
						if( crtAllStandard[i].isDefault == "1" ){
							selectedStandard = crtAllStandard[i];
							if( huiyuan_manjianAc.isHuiyuan() ){
								$("#tasteDishPrice").css("line-height","20px").empty();
								$("#tasteDishPrice").append( "<span style='color:#000;'>原价&nbsp;&nbsp;&nbsp;&nbsp;<s>&yen;" + selectedStandard.unPrice + "</s></span><br>" );
								$("#tasteDishPrice").append( "<span>会员价&yen;" + selectedStandard.hyPrice + "</span>" );
							}else{
								$("#tasteDishPrice").empty();
								$("#tasteDishPrice").append( "<span style='color:#000;line-height: 45px;'>价格&yen;" + selectedStandard.unPrice + "</span><br>" );
							}
						}
					}
				}
				//复制一个对象，存储已选做法
				var uuid = String( Math.random() ).slice(2);
				selectedMakes = $.extend(true, {}, { tasteId : uuid,num:1,itemId:$(this).siblings("input[class=hiddenitemid]").val() } );
				self = this;
				if( allTaste[ $(this).siblings("input[class=hiddenitemid]").val() ] ){
					selectedMakes = $.extend(true, {}, { tasteId : uuid,num:1,dishtastes : allTaste[ $(this).siblings("input[class=hiddenitemid]").val() ],itemId:$(this).siblings("input[class=hiddenitemid]").val() } );
					for( var i = 0 ; i < selectedMakes.dishtastes.length ; i++ ){
						selectedMakes.dishtastes[i].itemMakes = [];
					}
				}
				if( !crtAllStandard ){
					$("#tasteDishPrice").html( template( "tasteDishPriceTemp",{
						hyjFlg : $(this).siblings("input[class=hiddenVippriceflg]").val(),
						stdPrice :$(this).siblings("input[class=hiddenprice]").val(),
						vipPrice :$(this).siblings("input[class=hiddenMemberPrice]").val(),
						unitName:$(this).siblings("input[class=hiddenunitname]").val()
					}));
				}
				$("#taste_mask").addClass( "weui_fade_toggle" );
				$("#taste_mask").css("display","block");
				$("#weui_actionsheet").addClass( "weui_actionsheet_toggle" );

				$("#taste_mask").on("click",function(){
					$("#taste_mask").removeClass( "weui_fade_toggle" );
					$("#taste_mask").css("display","none");
					$("#weui_actionsheet").removeClass( "weui_actionsheet_toggle" );
				});

				//console.log( allTaste[ $(this).siblings("input[class=hiddenitemid]").val() ] );

				var html = template( "taseteCanTemp",{dishName:$(this).siblings("input[class=hiddenitemname]").val(), dishId:$(this).siblings("input[class=hiddenitemid]").val() ,taste:allTaste[ $(this).siblings("input[class=hiddenitemid]").val() ],standard:crtAllStandard});
				$("#taseteCan").html( html );
				$(".scrollControl").css( "max-height",document.documentElement.clientHeight*3/4-60 );

				//如果是带规格则初始化不显示价格
				if( diancaiAction.findItemMulitUnits( $(this).siblings("input[class=hiddenItemClassID]").val(),$(this).siblings("input[class=hiddenitemid]").val() ) ){
					$("#tasteDishPrice").css("line-height","20px");
				}

				$("#tasteCloseBtnOut").on("click",function(){
					$("#taste_mask").removeClass( "weui_fade_toggle" );
					$("#taste_mask").css("display","none");
					$("#weui_actionsheet").removeClass( "weui_actionsheet_toggle" );
					$("#tasteDishPrice").css("line-height","");
				});
				//每个口味做法按钮的事件
				$(".dishesMake").on("click",function(){
					var groupid = $(this).attr("groupid");
					for( var i = 0; i < selectedMakes.dishtastes.length ; i++ ){
						if( groupid == selectedMakes.dishtastes[i].groupid ){//找到做法组
							var moObj = { moid:$(this).attr("moid"),moname:$(this).attr("moname") };
							if( selectedMakes.dishtastes[i].selectmodel == 1 ){//多选

								var index = objInArr( "moid",moObj,selectedMakes.dishtastes[i].itemMakes );
								if( index == -1 ){
									selectedMakes.dishtastes[i].itemMakes.push( moObj );
									$(this).addClass("selected");
								}else{
									selectedMakes.dishtastes[i].itemMakes.splice( index,1 );
									$(this).removeClass("selected");
								};

							}else if( selectedMakes.dishtastes[i].selectmodel == 0 ){//单选
								selectedMakes.dishtastes[i].itemMakes = [];
								selectedMakes.dishtastes[i].itemMakes.push( moObj );
								$(this).parent().siblings().each(function(){
									$(this).children().removeClass( "selected");
								});
								$(this).addClass("selected");
							}
						}
					}
					//console.log( 'selectedMakes' , selectedMakes );
				});
				//每个口味做法按钮的事件
				$(".dishStandard").on( "click",function(){
					//console.log( diancaiAction.getSelectedDish() );
					selectedStandard = {};
					selectedStandard.unId = $(this).attr("unid");
					selectedStandard.unPrice = $(this).attr("unprice");
					selectedStandard.hyPrice = $(this).attr("hyprice");
					selectedStandard.unName = $(this).attr("unName");
					$(this).parent().siblings().each(function(){
						$(this).children().removeClass( "selected");
					});
					$(this).addClass("selected");

					if( huiyuan_manjianAc.isHuiyuan() ){
						// if ( $("#tasteDishPrice>span").length < 2 ) {
						// 	$("#tasteDishPrice").prepend("<span>菜品单价&yen;100/份</span><br>");
						// };

						$("#tasteDishPrice").css("line-height","20px").empty();

						$("#tasteDishPrice").append( "<span style='color:#000;'>原价&nbsp;&nbsp;&nbsp;&nbsp;<s>&yen;" + selectedStandard.unPrice + "</s></span><br>" );
						$("#tasteDishPrice").append( "<span>会员价&yen;" + selectedStandard.hyPrice + "</span>" );

					}else{
						$("#tasteDishPrice").empty();
						$("#tasteDishPrice").append( "<span style='color:#000;line-height: 45px;'>价格&yen;" + selectedStandard.unPrice + "</span><br>" );
					}

				} );



			});



			$(".tasteMinusbtn").on("click",function(){
				if( selectedMakes.num > 1 ){
					selectedMakes.num --;
					$(".tasteSelectedNum").html( selectedMakes.num );
					//console.log( 'selectedMakes' , selectedMakes );
				}
			});
			$(".tastePlusbtn").on("click",function(){
				selectedMakes.num ++;
				$(".tasteSelectedNum").html( selectedMakes.num );
				//console.log( 'selectedMakes' , selectedMakes );
			});
			$("#dishtastesOk").on("click",function(){
				//allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ] = selectedMakes;
				selectedMakes.standard = selectedStandard;

				// 尝试将特征组成字符串，首先得排序，然后比对字符串
				var dishtastesIdArr = [];
				if( selectedMakes.dishtastes ){
					for( var j = 0 ; j < selectedMakes.dishtastes.length ; j++ ){
						for( var k= 0 ; k < selectedMakes.dishtastes[j].itemMakes.length ; k++ ){
							dishtastesIdArr.push( Number(selectedMakes.dishtastes[j].itemMakes[k].moid) );
						}
					}
				}
				dishtastesIdArr.sort();
				selectedMakes.dishtastesStr = dishtastesIdArr.join("");
				console.log( selectedMakes );
				//console.log( dishtastesIdArr.join("") );

				if( allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ] ){
					//判断一下是不是有重复的，有重复则用原有的对象，没有重复则用当前的
					var sameMakesObj = isSameMakes( $(self).siblings("input[class=hiddenitemid]").val(),selectedMakes );
					if( sameMakesObj == -1 ){
						allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ].push( selectedMakes );
					}else{
						sameMakesObj.num += selectedMakes.num;
					}
				}else{
					allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ] = [];
					allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ].push( selectedMakes );
				}
				//计算不同的带口味的总数
				crtdishobj.itemcount = 0;
				for( var i = 0 ; i < allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ].length ; i++ ){
					crtdishobj.itemcount += Number( allSelectedTastes[ $(self).siblings("input[class=hiddenitemid]").val() ][i].num );
				}

				cloneTasteToAllDish( self );

				$("#taste_mask").removeClass( "weui_fade_toggle" );
				$("#taste_mask").css("display","none");
				$("#weui_actionsheet").removeClass( "weui_actionsheet_toggle" );

				//显示带口味菜品数量
				$("#dish"+crtdishobj.itemId)
				.find(".dishWithTaste").css("visibility","visible")
				.html( crtdishobj.itemcount ).prev().css("visibility","visible");

				//刷新小图模式的品类上的菜品数量
				diancaiAction.refreshSelectDish();
				// diancaiAction.refreshDishNumInClass();
				// diancaiAction.bigImgRefreshDishNumInClass();
				//console.log( 'allSelectedTastes',allSelectedTastes );
				//在这存一份老样式，存在本地存储。从老数据拆开，让两条不同做法的一道菜挨着
				//lStorage.set( biz_shop+'_singleDishAllSelectedTastes',diancaiAction.getSelectedDish() );
				$("#tasteDishPrice").css("line-height","");
				//存储一下已选做法的菜品,上面要用到
				lStorage.set( biz_shop+'_allSelectedTastes', JSON.stringify(allSelectedTastes));

			});
		}
	};
})();

//增加套餐
var setMenu = (function(){
	var setMenuData = [];
 	var submitTcItems = {};//保存在本地的对象，需要提交的
 	submitTcItems.tcItems = [];
 	//每次打开每个套餐的选择配菜的那个页面都会生成一个这个对象
	var crtOperateTc = {};
	//店铺id
	var biz_shop = "";

 	//判断套餐是不是已存在在提交对象中
 	//function isInSubmitTcItems( tcId ){
 	function isInSubmitTcItems( tId ){
 		for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
 			//if( tcId == submitTcItems.tcItems[i].tcId ){
 			if( tId == submitTcItems.tcItems[i].tId ){
 				return i;
 			}
 		}
 		return -1;
 	}
 	//判断套餐中的配菜组是不是已存在
 	//function isInSubmitTcGroups( grpId,tcGroups ){
 	function isInSubmitTcGroups( gId,tcGroups ){
 		for( var i = 0 ; i < tcGroups.length ; i++ ){
 			//if( grpId == tcGroups[i].grpId ){
 			if( gId == tcGroups[i].gId ){
 				return i;
 			}
 		}
 		return -1;
 	}
 	//判断配菜组中的配菜是不是已存在
 	//function isInSunmitTcGroupItems( itemId,tcGroupItems ){
 	function isInSunmitTcGroupItems( id,tcGroupItems ){
 		for( var i = 0 ; i < tcGroupItems.length ; i++ ){
 			//if( itemId == tcGroupItems[i].itemId ){
 			if( id == tcGroupItems[i].id ){
 				return i;
 			}
 		}
 		return -1;
 	}

 	//判断配菜是不是在已选套餐中
 	//function isTcGroupItemsInTcItems( tcId,grpId,itemId ){
 	function isTcGroupItemsInTcItems( tId,gId,id ){
 		//var tcIdIndex = isInSubmitTcItems( tcId );
 		var tcIdIndex = isInSubmitTcItems( tId );
 		if( tcIdIndex !== -1 ){
 			var tcGroupIndex = isInSubmitTcGroups( gId , submitTcItems.tcItems[ tcIdindex ].tcGroups );
 			if( tcGroupIndex !== -1 ){
 				var tcGroupItemIndex = isInSunmitTcGroupItems( id, submitTcItems.tcItems[ tcIdindex ].tcGroups[ tcGroupIndex ].tcGroupItems );
 				return submitTcItems.tcItems[ tcIdindex ].tcGroups[ tcGroupIndex ].tcGroupItems[ tcGroupItemIndex ];
 			}
 		}
 		return -1;
 	}
 	//从当前的还没插入提交对象的操作对象中搜索
 	function findDishInNosubmitObj( gId,id ){
 		var tcGroupIndex = isInSubmitTcGroups( gId , crtOperateTc.tcGroups );
		if( tcGroupIndex !== -1 ){
			var tcGroupItemIndex = isInSunmitTcGroupItems( id, crtOperateTc.tcGroups[ tcGroupIndex ].tcGroupItems );
			if( tcGroupItemIndex !== -1 ){
				return {
					obj:crtOperateTc.tcGroups[ tcGroupIndex ].tcGroupItems[ tcGroupItemIndex ],
					index:tcGroupItemIndex
				}
			}
		}
		return -1;
 	}
 	//计算套餐价格,需要显示出总价，并且将数据存入数据对象中
 	function calculateTcPrice(){
 		//console.log( crtOperateTc );
 		var tctotal = 0;

 		for( var i = 0 ; i < crtOperateTc.tcGroups.length ; i++ ){
 			for( var j = 0 ; j < crtOperateTc.tcGroups[i].tcGroupItems.length ; j++ ){
 				var singleDishTotal = 0;
 				singleDishTotal = crtOperateTc.tcGroups[i].tcGroupItems[j].itemCount * Number( crtOperateTc.tcGroups[i].tcGroupItems[j].addPrice );
 				tctotal += singleDishTotal;
 			}
 		}
 		crtOperateTc.price = tctotal + Number(crtOperateTc.tcPrice);
 		crtOperateTc.tcEndPrice = tctotal + Number(crtOperateTc.tcPrice);
 		$("#tcTotalPrice").html( Number( crtOperateTc.tcEndPrice ).toFixed(2) );
 	}
	return {
		getSelectedTc:function(){
			return submitTcItems;
		},
		clearTcCan:function(){
			submitTcItems.tcItems = [];
			lStorage.set( biz_shop+'_allTc', JSON.stringify(submitTcItems));
		},
		calculateTcTotalQuantity:function(){
			var tctotal = 0;
			for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
				tctotal += submitTcItems.tcItems[i].tcCount;
			}
			return tctotal;
		},
		calculateTctotal : function(){
			//console.log( "计算总价" , submitTcItems );
			var tctotal = 0;
			for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
				tctotal += submitTcItems.tcItems[i].tcCount * submitTcItems.tcItems[i].tcEndPrice;
			}
			return tctotal;
		},
		setData : function( val,biz_shop_out ){
			var cookedData = JSON.parse( val );
			for( var i = 0 ; i < cookedData.length ; i++ ){
				//生成一个区别于其他类的品类ID
				cookedData[i].itemClassId = "tc_" + cookedData[i].tcClassId;
			}
			setMenuData = cookedData;
			biz_shop = biz_shop_out;
			//初始化submitTcItems
			var lStorage_allSelectedTc = lStorage.get( biz_shop+'_allTc' );
			if( lStorage_allSelectedTc !== null ){
				submitTcItems = JSON.parse( lStorage_allSelectedTc );
			}
		},
		logData: function(){
			//console.log( "套餐数据",setMenuData );
		},
		getData : function(){
			return setMenuData;
		},
		//计算同一TCID的套餐数量
		//calculateTcNum : function( tcId ){
		calculateTcNum : function( tId ){
			//console.log( tcId,submitTcItems.tcItems );
			var tcIdCount = 0;
			for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
				//if( tcId == submitTcItems.tcItems[i].tcId ){
				if( tId == submitTcItems.tcItems[i].tId ){
					tcIdCount += submitTcItems.tcItems[i].tcCount;
				}
			}
			return tcIdCount;
		},
		//计算同一tcclass的套餐数量
		calculateTcClassNum : function( tcClassId ){
			//console.log( tcClassId,submitTcItems.tcItems );
			var tcClassIdCount = 0;
			for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
				if( tcClassId == submitTcItems.tcItems[i].tcClassId ){
					tcClassIdCount += submitTcItems.tcItems[i].tcCount;
				}
			}
			return tcClassIdCount;
		},
		addTcToAlreadySelected:function( target ){//target为jquery对象，为目标容器
			//console.log( "显示所有已选套餐",submitTcItems );
			if( submitTcItems.tcItems.length != 0 ){
				target.append( '<div class="row classNameStyle">已选套餐</div>' );
				for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
					var html = template( "tcAlreadySelectedTpl", submitTcItems.tcItems[i] );
					target.append( html );
				}
				$( ".tcSelectedPlus" ).on( "click",function(){
					var twinsId = $(this).siblings( "input[class=hiddentwinsId]" ).val() ;
					for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
						if( twinsId == submitTcItems.tcItems[i].twinsId ){
							submitTcItems.tcItems[i].tcCount ++;
							$(this).prev().html( submitTcItems.tcItems[i].tcCount );
						}
						if( submitTcItems.tcItems[i].tcCount == 1 ){
							$(this).prev().show().prev().show();
						}
					}
					diancaiAction.calculateTotalPrice();
					lStorage.set( biz_shop+'_allTc', JSON.stringify(submitTcItems));
				});
				$( ".tcSelectedMinus" ).on( "click",function(){
					var twinsId = $(this).siblings( "input[class=hiddentwinsId]" ).val() ;
					for( var i = 0 ; i < submitTcItems.tcItems.length ; i++ ){
						if( twinsId == submitTcItems.tcItems[i].twinsId ){
							if( submitTcItems.tcItems[i].tcCount > 1 ){
								submitTcItems.tcItems[i].tcCount --;
								//显示上变化
								$(this).next().html( submitTcItems.tcItems[i].tcCount );
							}else{
								//数组中去除这个对象
								submitTcItems.tcItems.splice( i,1 );
								//还得在本地存一下
								lStorage.set( biz_shop+'_allTc', JSON.stringify(submitTcItems));
								if( submitTcItems.tcItems.length == 0 ){
									$(this).parent().parent().prev().remove();
								}
								$(this).parent().parent().remove();

							}
						}
					};
					diancaiAction.calculateTotalPrice();
					lStorage.set( biz_shop+'_allTc', JSON.stringify(submitTcItems));
				});
			}

		},
		addEventToSetMenu : function(){

			$("#memberDishCan").css( "height",document.documentElement.clientHeight-45 );
			$("#tcDishCan").css( "height",document.documentElement.clientHeight-45 );

			$(".selectSetMenu").on("click",function(){
				//初始化
				$(".setMenuAllMinusBtn").off("click");
				$(".setMenuAllPlusBtn").off("click");
				$("#dishtSetMenuOk").off("click");
				$(".setMenu_icon_left").off("click");
				$("#tcTitle").html( $(this).siblings("input[class=hiddenitemname]").val() );

				$(".tctotalNum").html(1);

				$("#setMenu_mask").addClass( "weui_fade_toggle" );
				//$("#setMenu_mask").css("display","block");
				$("#weui_setMenu_actionsheet").addClass( "weui_actionsheet_toggle" );

				//var self = this;
				var tcClassId = $(this).siblings("input[class=hiddentcClassId]").val();
				var tcId = $(this).siblings("input[class=hiddentcId]").val();
				var tId = $(this).siblings("input[class=hiddentId]").val();
				//有一个初始化的过程，去看看当前这个套餐中有没有比选的，如果有就把它们放到要提交的对象中
				for( var i = 0 ; i < setMenuData.length ; i++ ){
					if( setMenuData[i].tcClassId === Number( tcClassId ) ){
						for( var j = 0 ; j < setMenuData[i].tcItems.length ; j++ ){
							if( setMenuData[i].tcItems[j].tId === Number( tId ) ){
								//console.log( "套餐对象",setMenuData[i].tcItems[j] );
								crtOperateTc.twinsId = String( Math.random() ).slice(2);
								crtOperateTc.tcId = setMenuData[i].tcItems[j].tcId;
								crtOperateTc.tId = setMenuData[i].tcItems[j].tId;
								crtOperateTc.name = setMenuData[i].tcItems[j].name;
								crtOperateTc.tcClassId = setMenuData[i].tcItems[j].tcClassId;
								//crtOperateTc.tcPriceInitial = setMenuData[i].tcItems[j].tcPrice;
								crtOperateTc.tcPrice = setMenuData[i].tcItems[j].tcPrice;
								crtOperateTc.gqFlg = setMenuData[i].tcItems[j].gqFlg;
								crtOperateTc.tcCount = 1;
								crtOperateTc.tcGroups = [];
								fillTcGroup( crtOperateTc.tcGroups,setMenuData[i].tcItems[j].tcGroups );
								//console.log("正在操作的套餐对象",crtOperateTc);
								var html = template( "tcDishCanTemp",{
									tcGroups:setMenuData[i].tcItems[j].tcGroups,
									tcId : tcId,
									name : $(this).siblings("input[class=hiddenname]").val(),
									tcClassId : tcClassId,
									tcPrice:$(this).siblings("input[class=hiddentcPrice]").val(),
									gqFlg:$(this).siblings("input[class=hiddengqFlg]").val(),
									tcCount:0
								});
								$("#tcDishCan").html( html );
							}
						}
					}
				};
				//计算一下默认的总价
				calculateTcPrice();
				//为了避免三层嵌套循环，把填充口味组的工作单提出一个函数
				function fillTcGroup( can,src ){
					for( var i = 0 ; i < src.length ; i++ ){
						var pauseObj = {};
						pauseObj.grpId = src[i].grpId;
						pauseObj.gId = src[i].gId;
						pauseObj.grpName = src[i].grpName;
						pauseObj.maxSelCount = src[i].maxSelCount;
						pauseObj.minSelCount = src[i].minSelCount;
						pauseObj.tcGroupItems = [];
						for( var j = 0 ; j < src[i].tcGroupItems.length ; j++ ){
							var pause = {};
							if( src[i].tcGroupItems[j].gqFlg == 0 ){
								if( src[i].tcGroupItems[j].mustSelFlg == 1 || src[i].tcGroupItems[j].defaultCount != 0 ){
									//看看哪个是必选的然后加进去
									pause.itemId = src[i].tcGroupItems[j].itemId;
									pause.id = src[i].tcGroupItems[j].id;
									pause.name = src[i].tcGroupItems[j].name;
									pause.unitName = src[i].tcGroupItems[j].unitName;
									pause.defaultCount = src[i].tcGroupItems[j].defaultCount;
									pause.maxCount = src[i].tcGroupItems[j].maxCount;
									pause.itemPrice = src[i].tcGroupItems[j].itemPrice;
									pause.addPrice = src[i].tcGroupItems[j].addPrice;
									if( src[i].tcGroupItems[j].defaultCount == 0 ){
										pause.itemCount = 1;
									}else{
										pause.itemCount = src[i].tcGroupItems[j].defaultCount;
									}
									pause.mustSelFlg = src[i].tcGroupItems[j].mustSelFlg;
									pause.gqFlg = src[i].tcGroupItems[j].gqFlg;
									pauseObj.tcGroupItems.push( pause );
								}
							}
						}
						can.push( pauseObj );
					}
				}
				//每个配菜加减按钮的事件
				$(".setMenuMinusBtn").on("click",function(){

					var tcId = $(this).siblings("input[name=tcId]").val();
					var tId = $(this).siblings("input[name=tId]").val();
					var grpId = $(this).siblings("input[name=grpId]").val();
					var gId = $(this).siblings("input[name=gId]").val();
					var itemId = $(this).siblings("input[name=itemId]").val();
					var id = $(this).siblings("input[name=id]").val();
					var isin = findDishInNosubmitObj( gId,id );


					if( isin.obj.itemCount > 1 ){
						isin.obj.itemCount -= 1;
						$(this).next().html( isin.obj.itemCount );
					}else{
						if( $(this).siblings("input[name=mustSelFlg]").val() != "1" ){
							$(this).css("visibility","hidden").next().css("visibility","hidden");
							var grpIdIndex = isInSubmitTcGroups( gId,crtOperateTc.tcGroups );
							crtOperateTc.tcGroups[ grpIdIndex ].tcGroupItems.splice( isin.index,1 );
						}else if( $(this).siblings("input[name=mustSelFlg]").val() == "1" ){
							alertDlg( "当前菜品为必选菜品" );
							return;
						}
					}
					calculateTcPrice();
					//console.log( crtOperateTc );
				});
				$(".setMenuPlusBtn").on("click",function(){

					var tcId = $(this).siblings("input[name=tcId]").val();
					var tId = $(this).siblings("input[name=tId]").val();
					var grpId = $(this).siblings("input[name=grpId]").val();
					var gId = $(this).siblings("input[name=gId]").val();
					var itemId = $(this).siblings("input[name=itemId]").val();
					var id = $(this).siblings("input[name=id]").val();
					var isin = findDishInNosubmitObj( gId,id );

					//检查套餐组数量
					for( var i = 0 ; i < crtOperateTc.tcGroups.length ; i++ ){
						if( crtOperateTc.tcGroups[i].gId == gId ){
							var total = 0;
							for( var j = 0 ; j < crtOperateTc.tcGroups[i].tcGroupItems.length ; j++ ){
								total += crtOperateTc.tcGroups[i].tcGroupItems[j].itemCount;
							}
							if( total + 1 > crtOperateTc.tcGroups[i].maxSelCount ){
								//alertDlg( "不能超过此套餐组的限额" + crtOperateTc.tcGroups[i].maxSelCount );
								//alertDlg( "当前套餐组限量" + crtOperateTc.tcGroups[i].minSelCount + "~" + crtOperateTc.tcGroups[i].maxSelCount + "份" );
								alertDlg( "不可以贪心哦，此组菜品已选够" );
								return;
							}
						}
					}

					if( isin == -1 ){
						//if( $(this).siblings("input[name=maxCount]").val() != "0" ){
							var pauseObj = {};
							//pauseObj.itemId = $(this).siblings("input[name=itemId]").val();
							pauseObj.itemId = itemId;
							//pauseObj.tId = tId;
							pauseObj.gId = gId;
							pauseObj.id = id;
							pauseObj.name = $(this).siblings("input[name=name]").val();
							pauseObj.unitName = $(this).siblings("input[name=unitName]").val();
							pauseObj.defaultCount = $(this).siblings("input[name=defaultCount]").val();
							pauseObj.maxCount = $(this).siblings("input[name=maxCount]").val();
							pauseObj.itemPrice = $(this).siblings("input[name=itemPrice]").val();
							pauseObj.addPrice = $(this).siblings("input[name=addPrice]").val();
							pauseObj.itemCount = 1;
							pauseObj.mustSelFlg = $(this).siblings("input[name=mustSelFlg]").val();
							pauseObj.gqFlg = $(this).siblings("input[name=gqFlg]").val();
							var gIdIndex = isInSubmitTcGroups( gId,crtOperateTc.tcGroups );
							crtOperateTc.tcGroups[ gIdIndex ].tcGroupItems.push( pauseObj );
							$(this).prev().css("visibility","visible").prev().css("visibility","visible");
							$(this).prev().html("1");
						//} else{
							//alertDlg( "当前菜品限量1" + $(this).siblings("input[name=maxCount]").val() + $(this).siblings("input[name=unitName]").val() );
						//}
					}else{
						//console.log( isin.obj );
						var singleDishMaxCount = $(this).siblings("input[name=maxCount]").val();
						var tcMaxSelCount = $(this).siblings("input[name=maxSelCount]").val();
						//var grpId = $(this).siblings("input[name=grpId]").val();
						//var itemId = $(this).siblings("input[name=itemId]").val();
						//console.log( "套餐数量限制",singleDishMaxCount,tcMaxSelCount,grpId,crtOperateTc );

						// checkTcgroupNum( grpId,itemId,isin );

						for( var i = 0 ; i < crtOperateTc.tcGroups.length ; i++ ){
							if( crtOperateTc.tcGroups[i].gId == gId ){
								var total = 0;
								for( var j = 0 ; j < crtOperateTc.tcGroups[i].tcGroupItems.length ; j++ ){
									if( id == crtOperateTc.tcGroups[i].tcGroupItems[j].id ){
										if((crtOperateTc.tcGroups[i].tcGroupItems[j].maxCount != 0) && (isin.obj.itemCount + 1 > crtOperateTc.tcGroups[i].tcGroupItems[j].maxCount) ){
											//alertDlg( "当前菜品限量" + crtOperateTc.tcGroups[i].tcGroupItems[j].maxCount + crtOperateTc.tcGroups[i].tcGroupItems[j].unitName);
											alertDlg( "不可以贪心哦，此菜品已选够" );
											return;
										}
									}
									total += crtOperateTc.tcGroups[i].tcGroupItems[j].itemCount;
								}
								if( total > crtOperateTc.tcGroups[i].maxSelCount ){
									//alertDlg( "当前套餐组限量" + crtOperateTc.tcGroups[i].maxSelCount + "~" + crtOperateTc.tcGroups[i].maxSelCount + "份" );
									alertDlg( "不可以贪心哦，此组菜品已选够" );
								}
							}
						}

						isin.obj.itemCount += 1;
						//还得考虑一个配菜最大数量，和配菜组的一个最大数量的问题，配菜组还有最小数量的规定
						$(this).prev().html( isin.obj.itemCount );
						//console.log( isin );
					}
					//console.log( crtOperateTc );
					calculateTcPrice();



				});

				$(".setMenuAllMinusBtn").on("click",function(){
					if( crtOperateTc.tcCount > 1 ){
						crtOperateTc.tcCount -= 1;
						//需要一个itemcount，在计算价格的时候用
						//crtOperateTc.itemcount = crtOperateTc.tcCount;
						$(this).next().html( crtOperateTc.tcCount );
					}else{
						$("#setMenu_mask").removeClass( "weui_fade_toggle" );
						$("#setMenu_mask").css("display","none");
						$("#weui_setMenu_actionsheet").removeClass( "weui_actionsheet_toggle" );
					}
				});
				$(".setMenuAllPlusBtn").on("click",function(){
					//套餐配菜沽清，整个套餐就沽清了？..应该后台判断，小菜如果有沽清，就大套餐就沽清了
					crtOperateTc.tcCount += 1;
					//crtOperateTc.itemcount = crtOperateTc.tcCount;
					$(this).prev().html( crtOperateTc.tcCount );
					//console.log( crtOperateTc );
				});


				$(".setMenu_icon_left").on("click",function(){
					$("#setMenu_mask").removeClass( "weui_fade_toggle" );
					$("#setMenu_mask").css("display","none");
					$("#weui_setMenu_actionsheet").removeClass( "weui_actionsheet_toggle" );
				});

				$("#dishtSetMenuOk").on("click",function(){

					for( var i = 0 ; i < crtOperateTc.tcGroups.length ; i++ ){
						//if( crtOperateTc.tcGroups[i].grpId == grpId ){
							var total = 0;
							for( var j = 0 ; j < crtOperateTc.tcGroups[i].tcGroupItems.length ; j++ ){
								total += crtOperateTc.tcGroups[i].tcGroupItems[j].itemCount;
							}
							// if( total > crtOperateTc.tcGroups[i].maxSelCount || total < crtOperateTc.tcGroups[i].minSelCount){
							// 	alertDlg( crtOperateTc.tcGroups[i].grpName + "套餐组的菜品限量" + crtOperateTc.tcGroups[i].minSelCount + "~" + crtOperateTc.tcGroups[i].maxSelCount + "份" );
							// 	return;
							// }
							if( total > crtOperateTc.tcGroups[i].maxSelCount ){
								alertDlg( "不可以贪心哦，此组菜品已选够" );
								return;
							}else if( total < crtOperateTc.tcGroups[i].minSelCount ){
								//alertDlg( crtOperateTc.tcGroups[i].grpName + "套餐组的菜品限量" + crtOperateTc.tcGroups[i].minSelCount + "~" + crtOperateTc.tcGroups[i].maxSelCount + "份" );
								alertDlg( "客官，" + crtOperateTc.tcGroups[i].grpName + "套餐组菜有点少,至少选" + crtOperateTc.tcGroups[i].minSelCount + "份哦" );
								return;
							}
						//}
					}

					//存到本地供确认页调用
					var cloneOne = $.extend(true,{},crtOperateTc);
					submitTcItems.tcItems.push( cloneOne );
					lStorage.set( biz_shop+'_allTc', JSON.stringify(submitTcItems));
					//存到已选菜品中
					$("#setMenu_mask").removeClass( "weui_fade_toggle" );
					$("#setMenu_mask").css("display","none");
					$("#weui_setMenu_actionsheet").removeClass( "weui_actionsheet_toggle" );
					//刷新套餐数
					diancaiAction.refreshSelectDish();
					diancaiAction.calculateTotalPrice();
				});

			});
		}
	}
})();

//增加多单位
// var multipleUnit = (function(){
// 	var multipleUnitData = {};

// 	return {
// 		setData : function( data ){
// 			multipleUnitData = data;

// 			console.log( multipleUnitData );
// 		}
// 	}
// })();