/**
 * 新门店二维码，带参二维码，大V
 */
"use strict";

define(['application-configuration','accountsService','toolsService','ajaxService','alertsService','jquery'], function (app,jquery) {

	app.register.controller('shopqrcodenewController', ['$scope','$rootScope', 'accountsService','toolsService','ajaxService','alertsService','$modal','$sce', function ($scope, $rootScope ,accountsService,toolsService,ajaxService,alertsService,$modal,$sce) {
    	//每一个controller都要加上这么一个判断，验证当前用户是不是登录状态
    	//图文和文本关键词的两个过滤函数
    	accountsService.authenicateUser( $rootScope );
    	$rootScope.alerts = [];
    	$rootScope.closeAlert = alertsService.closeAlert;

    	$scope.getQrCode = function(){
	    	$scope.getQRcodeListSuccess = function( response ){
	    		if (response.status == 0) {
		    		$scope.QRcodeList=response.result;
		    	    //console.log( $scope.QRcodeList);
		    		var temp_url=window.location.href.split("/");
		    		$scope.url=temp_url[0]+"//"+temp_url[2]+"/"+temp_url[3];
	    		} else {
	    			toolsService.alertInfo( response.message,function(){
		    			 toolsService.jumpStaticUrl( "main/authorize" );
		    		});
	    		}
	    	}
	    	$scope.getQRcodeLiError = function( response ){
	    		toolsService.alertInfo( response );
	    	}

			ajaxService.AjaxPostWithNoAuthenication( "", "qrcode/index.html", $scope.getQRcodeListSuccess, $scope.getQRcodeLiError );
    	}
    	$scope.getQrCode();

        $scope.getTableqrcode = function(){
            $scope.getTableqrcodeSuccess = function( res ){
                //console.log( res );
                if( res.status == 0 ){
                    $scope.tableQrcode = toolsService.stringToJson(res.result);

                    //console.log( $scope.tableQrcode );
                }else{
                    toolsService.alertInfo( res.message,function(){
                         toolsService.jumpStaticUrl( "main/authorize" );
                    });
                }
            }
            $scope.getTableqrcodeError = function( res ){
                toolsService.alertInfo( response );
            }
            ajaxService.AjaxPostWithNoAuthenication( "", "tableqrcode/getshopstable.html", $scope.getTableqrcodeSuccess, $scope.getTableqrcodeError );
        }
        $scope.getTableqrcode();

    	$scope.newCouponQRcode = function(){
    		var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'newCouponQRcode.html',
                controller: 'newCouponQRcodeCtrl',
                resolve: {
                  items: function () {
                      return $scope;
                  }
                }
    		});
    	};

    	$scope.newShopQRcode = function(){
    		var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'newShopQRcode.html',
                controller: 'newShopQRcodeCtrl',
                resolve: {
                  items: function () {
                      return $scope;
                  }
                }
    		});
    	}

    	$scope.serviceUrl=function (i){
    		if( i ){
	    		if (i.indexOf('"')>0){
	    			var j=JSON.parse(i);
	    			return $scope.url+"/lingquan/"+$rootScope.userName+"/"+$rootScope.apiname+"/"+"index.html?"+"activityid="+j.activityid;
	    		}
	    		else {
	    			return "-";
	    		}
    		}
    	}

    	$scope.deleteQrCode = function(index){
    		var postData = { "qrid" : index };

        	$scope.deleteQrCodeSuccess = function( response ){
	        	console.log( response );
        		if (response.status == 0) {
        			$scope.getQrCode();
        		} else {
        			toolsService.alertInfo( response.message );
        		}
	        };
	        $scope.deleteQrCodeError = function( response ){
	        	toolsService.alertInfo( response );
	        };

	        ajaxService.AjaxPostWithNoAuthenication($.param( postData ), "qrcode/deleteqrcode.html",$scope.deleteQrCodeSuccess,$scope.deleteQrCodeError );
        }

    	$scope.deleteApiConfirm = function( index ){
        	toolsService.dialogInfo("确认要删除该带参二维码吗？", function(){
        		$scope.deleteQrCode(index);
        	});
        }

    	$scope.showQrCodePic = function( index ){

        	var showQrCodePicPop = $modal.open({
		    	      animation: true,
		    	      templateUrl: 'showQrCodePicPop.html',
		    	      controller: 'showQrCodePicPopCtrl',
		    	      backdrop:'static',
		    	      resolve: {
		    	        ticket: function (){return index;}
		    	      }
	  	    });

        }

        $scope.couponFilter = function( item ){
            return item.biztype == 1;
        }

        $scope.shopFilter = function( item ){
            return item.biztype == 0;
        }
        
        $scope.mcnameComparator = function (expected, actual) {
        	return (expected.indexOf(actual)!=-1);
         }

        $scope.downloadQrcode = function( code ){
            var setPicTxtStylePop = $modal.open({
                  animation: true,
                  templateUrl: 'setPicTxtStyle.html',
                  controller: 'setPicTxtStyleCtrl',
                  backdrop:'static',
                  resolve:{ code:function(){
                     return { code:code,callback:$scope.getTableqrcode };
                  }}
            });
        }

        $scope.downloadInfo = function( code ){
            //门店桌号二维码的数量，
            var mctablenoCounts = Number(code.tableqrcodeCount);
            if(isNaN(mctablenoCounts) || mctablenoCounts <= 0){
                //二维码未生成的时候，提示信息
                toolsService.alertInfo("请先生成二维码");
            }else {
                //二维码已经生成的时候，下载二维码
                window.open("qrcode/mctableqrcode/" + code.mcId + ".zip");
            }
        }

	}]);

    app.register.controller( "setPicTxtStyleCtrl", ["$scope",'$modalInstance','ajaxService','toolsService','alertsService','code',function( $scope,$modalInstance,ajaxService,toolsService,alertsService,code ){
        //console.log( code );

        $scope.submitObj = {};

        if( code.code.returnmsgdata ){
            //console.log( toolsService.stringToJson(code.returnmsgdata) );
            $scope.submitObj = toolsService.stringToJson(code.code.returnmsgdata).news.articles[0];
        }

        $scope.ok = function () {
            console.log( $scope.submitObj );
            if($scope.submitObj.title==null || $scope.submitObj.title==""){
            	alert("标题不能为空");
            	return;
            }else if( $scope.submitObj.description==null || $scope.submitObj.description=="" ){
            	alert("摘要不能为空");
            	return;
            }
            else if($scope.submitObj.picurl==null || $scope.submitObj.picurl=="" ){
            	alert("图片链接不能为空");
            	return;
            }
            
           
            
            $scope.sendPicInfoSuccess = function( res ){
                console.log( res );
                if( res.status == 0 ){
                    code.callback();
                    $modalInstance.close();
                }else{
                    alert( res.message );
                }
            }
            $scope.sendPicInfoError = function( res ){
                console.log( res );
            }
            ajaxService.AjaxPostWithNoAuthenication( $.param( $scope.submitObj ),"qrcode/createtableqrcode/"+ code.code.mcId +".html", $scope.sendPicInfoSuccess , $scope.sendPicInfoError );
           
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);    

	app.register.controller( "showQrCodePicPopCtrl", ["$scope","ticket",'$modalInstance','ajaxService','toolsService','alertsService','$sce', '$rootScope',function( $scope, ticket ,$modalInstance,ajaxService,toolsService,alertsService,$sce,$rootScope ){

    	$scope.ok = function () {
			$modalInstance.close();
    	};

    	$scope.showPic = function () {
    		return "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=" + ticket;
    	}
    }]);

	app.register.controller( "newCouponQRcodeCtrl", ["$scope","items",'$modalInstance','ajaxService','toolsService','$sce',function( $scope, items ,$modalInstance,ajaxService,toolsService,$sce ){

		//$scope.hello = items.hello;

		$scope.marketActs = [];

        $scope.getmarketactSuc = function( res ){

        	$scope.marketActs = res.result;

            console.log( res );
        }
        $scope.getmarketactErr = function( res ){
            console.log( res );
        }

		ajaxService.AjaxGet( "qrcode/getmarketactivity.html", $scope.getmarketactSuc , $scope.getmarketactErr );

		$scope.newCouponQRcodeSuccess = function( response ){
			$modalInstance.close();
			if (response.status == 0) {
				items.getQrCode();
    		} else {
    			toolsService.alertInfo( response.message );
    		}
        }
        $scope.newCouponQRcodeError = function( response ){
        	toolsService.alertInfo( response );
        }

        $scope.returnmsgdata = {
            content: "",   //回复文字的文字
            contentshow: "",   //回复文字的文字
            title: "",     //回复图文的标题
            description: "",    //回复图文的摘要
            picurl: ""      //回复图文的图片地址
        };

        //$scope.returnmsgdataStr = JSON.stringify( $scope.returnmsgdata );

		$scope.newCouponQRdata = {
            scenevalue: "",   //场景值
            bizremark: "",        //业务场景说明
            bizdata: "",
            returnmsgtype: "",         //根据选择的消息类型决定，0：文本；1：图文
            //"returnmsgdata": $scope.returnmsgdataStr
            returnmsgdata: ""
		};

		$scope.currentTab = "tab1";
        $scope.newCouponQRdata.returnmsgtype = "0";

        $scope.getCurrentTime = function(){
        	var now = new Date(); //获取系统日期
        	var year = now.getFullYear(); //截取年
        	var month = now.getMonth()+1; //截取月
        	var day = now.getDate(); //截取日
        	var hh = now.getHours(); //截取小时
        	var mm = now.getMinutes(); //截取分钟
        	var ss = now.getTime() % 60000; //获取时间，因为系统中时间是以毫秒计算的， 所以秒要通过余60000得到。
        	ss= (ss - (ss % 1000)) / 1000; //然后，将得到的毫秒数再处理成秒
        	var clock = year + (month < 10?"0"+month:month) + (day < 10?"0"+day:day) + (hh < 10?"0"+hh:hh) + (mm < 10?"0"+mm:mm) + (ss < 10?"0"+ss:ss);

        	return clock;
        }
		$scope.newCouponQRdata.scenevalue = $scope.getCurrentTime();

        $scope.changeRetmsgtype = function( currentTab,msgtype ){
            $scope.currentTab = currentTab;
            $scope.newCouponQRdata.returnmsgtype = msgtype;
        }

        $scope.returnmsgdata.content = "{{{戳这里}}}，就能获得优惠券喽~~";
        $scope.notice = "(“{{{” 和 “}}}”用于标注超链接文字，请勿修改或删除)";

        $scope.changeContent = function( rawstr ) {
        	var htmlshow = $scope.returnmsgdata.content.replace( /{{{/g , "<u style='color:blue;'>" );
        	var htmlshow2 = htmlshow.replace( /}}}/g, "</u>" );
        	$("#replypreview").html( htmlshow2 );
        	return htmlshow2;
        }
        $scope.contentshow = $sce.trustAsHtml( $scope.changeContent(  $scope.returnmsgdata.content ) );

        $scope.noChin = function( val ){
        	$scope.newCouponQRdata.scenevalue = toolsService.replaceChiChar( val );
        }

		$scope.ok = function () {
			if ( $scope.newCouponQRdata.bizdata === "" || $scope.newCouponQRdata.bizdata === undefined ) {
    			toolsService.alertInfo("请选择一个活动！");
    			return;
    		}
			if ( $scope.newCouponQRdata.returnmsgtype === "1" && ($scope.returnmsgdata.title === "" || $scope.returnmsgdata.title === undefined) ) {
    			toolsService.alertInfo("图文标题不能为空！");
    			return;
    		}
			if ( $scope.newCouponQRdata.returnmsgtype === "1" && ($scope.returnmsgdata.description === "" || $scope.returnmsgdata.description === undefined) ) {
    			toolsService.alertInfo("图文摘要不能为空！");
    			return;
    		}
			if ( $scope.newCouponQRdata.returnmsgtype === "1" && ($scope.returnmsgdata.picurl === "" || $scope.returnmsgdata.picurl === undefined) ) {
    			toolsService.alertInfo("图文图片地址不能为空！");
    			return;
    		}

			$scope.newCouponQRdata.returnmsgdata = JSON.stringify( $scope.returnmsgdata );
			ajaxService.AjaxPostWithNoAuthenication( $.param( $scope.newCouponQRdata ),"qrcode/createcouponqrcode.html", $scope.newCouponQRcodeSuccess , $scope.newCouponQRcodeError );
    	};

    	$scope.cancel = function () {
    	    $modalInstance.dismiss('cancel');
    	};

	}]);

	app.register.controller( "newShopQRcodeCtrl", ["$scope","items",'$modalInstance','ajaxService','alertsService','toolsService','$sce',function( $scope, items ,$modalInstance,ajaxService, alertsService,toolsService,$sce ){

		//$scope.hello = items.hello;
		$scope.shoplist = [];

        $scope.getshopqrcodeSuc = function( res ){
            //console.log( res );
            if( res.status == 0 ){

                for( var i = 0; i < res.result.length ; i++ ){
                    res.result[i].scenevalue = res.result[i].mcId;
                    res.result[i].bizScene = res.result[i].mcName;
                }

                $scope.shoplist = res.result;
            } else {
    			toolsService.alertInfo( res.message );
    		}
        }

        $scope.getshopqrcodeErr = function( res ){
        	toolsService.alertInfo( res );
        }

		ajaxService.AjaxGet( "qrcode/getshopqrcode.html",$scope.getshopqrcodeSuc,$scope.getshopqrcodeErr );

		$scope.createshopqrcodeSuccess = function( res ){
			if (res.status == 0) {
				items.getQrCode();
				console.log(res.result.length);
				var errormsgArray = res.result;
				var errormsg = "";
				if (errormsgArray.length > 0) {
					for (var i = 0; i < errormsgArray.length; i++) {
						errormsg += "[" + errormsgArray[i] + "]</br>";
					}
					alertsService.RenderSuccessMessage( $sce.trustAsHtml( errormsg ) );
				}
    		} else {
    			toolsService.alertInfo( res.message );
    		}
        }

        $scope.createshopqrcodeError = function( res ){
        	toolsService.alertInfo( res );
        }
        $scope.noNum = function( index,val ){
        	$scope.shoplist[index].scenevalue = toolsService.replceExtraNumChar( val );
        }
        $scope.ok = function () {
			var submitObj = [];
            //console.log( $scope.shoplist );

			for( var i = 0; i < $scope.shoplist.length ; i++ ){
                var pauseObj = {};
                pauseObj.scenevalue = $scope.shoplist[i].scenevalue;
                if( $scope.shoplist[i].bizScene ){
                	pauseObj.bizremark = $scope.shoplist[i].bizScene;
                }else{
                	pauseObj.bizremark = "";
                }


                if( Number( $scope.shoplist[i].scenevalue ) > 100000 ){
                	toolsService.alertInfo( "场景值不能大于十万" );
                	return;
                }else{
                	pauseObj.bizdata = $scope.shoplist[i].scenevalue;
                }

                submitObj.push( pauseObj );
            }

            ajaxService.AjaxPostWithNoAuthenication( submitObj ,"qrcode/createshopqrcode.html", $scope.createshopqrcodeSuccess , $scope.createshopqrcodeError );

    		$modalInstance.close();
    	};

    	$scope.cancel = function () {
    	    $modalInstance.dismiss('cancel');
    	};

	}]);
});