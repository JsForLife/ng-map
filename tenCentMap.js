/**
 * Created by Administrator on 2016/9/9.
 */
/**
 * Created by Administrator on 2016/5/18 0018.
 */
window._tenCenMap_init = function () {
}

define(function (require, exports, module) {
    require("http://map.qq.com/api/js?v=2.exp&callback=_tenCenMap_init")

    module.exports = function (app) {
        app.directive('tenCentMap', ['$q', function ($q) {
            return {
                restrict: 'ECMA',
                scope: {
                    province: '=',
                    city: '=',
                    area: '=',
                    address: '=',
                    latLng: '=',
                    areaArr: '=',
                    isDisabled: '=',
                    mapStyle: '=',
                    isFind: '=',
                    type: '=',
                    isWatch: '=',
                    shopName: '=',
                    branch: '=',
                    areaCode: '=',
                    telCode: '=',
                },
                templateUrl: G.path.src + '/tenCentMap.html?v=' + G.load_version,
                link: function (scope, ele, attr) {
                    /**
                     * 初始化变量
                     * **/
                        //精确查询对象，模糊查询对象，地图对象，消息提示框对象（地点名片）
                    scope.mapStyle = scope.mapStyle || {width: '100%'}
                    var geocoder, searchService, map, infoWin = null;
                    var markers = []; //地点标记对象
                    var infoDiv = document.getElementById('infoDiv')
                    var preLatLng = false//最近一次点击的地点标记的坐标
                    scope.isWatch = !!scope.isWatch || false
                    //初始化地图
                    var init = function () {
                        var center = new qq.maps.LatLng(39.916527, 116.397128);
                        map = new qq.maps.Map(document.getElementById('container'), {
                            center: center,
                            zoom: 13
                        });
                        //创建信息提示窗口（地点名片）
                        infoWin = new qq.maps.InfoWindow({
                            map: map
                        });
                    }
                    //初始化地图
                    init()

                    //设置精确查询对象
                    var geocoder = new qq.maps.Geocoder({
                        complete: function (result) {
                            //改动地图的聚焦中心
                            map.setCenter(result.detail.location);
                        }
                    });

                    //设置地图区域
                    var latlngBounds = new qq.maps.LatLngBounds();

                    //创建模糊查询对象,设置Poi检索服务，用于本地检索、周边检索
                    var searchService = new qq.maps.SearchService({
                        //设置搜索范围
                        location: scope.city || '广州',
                        //设置搜索页码为0
                        pageIndex: 0,
                        //设置每页的结果数为1000
                        pageCapacity: 1000,
                        //设置展现查询结构到infoDIV上
                        panel: infoDiv,
                        //设置动扩大检索区域。默认值为true时，会自动检索指定城市以外区域。
                        autoExtend: false,
                        //检索成功的回调函数
                        complete: function (results) {
                            /**
                             * 查询成功的回调操作
                             * **/
                                //标志查询成功
                            scope.isFind = 'true'
                            scope.$apply()

                            //清除所有地图标记
                            clearOverlays(markers)
                            //过滤腾讯接口返回的结果，去除不全街道信息的项
                            var promiss = searchFilter(results.detail.pois)
                            promiss.then(function (res) {
                                var pois = results.detail.pois = res

                                setTimeout(function(){
                                    //绑定地点标记的点击事件,用了forEach之后，这里就形成了闭包了
                                    markers.forEach(function (item, index) {
                                        qq.maps.event.addListener(item, 'click', function () {
                                            OpenInfo(pois, index)
                                        })
                                    })
                                },3000)


                                setTimeout(function () {
                                    //设置信息提示窗口的内容和位置
                                    OpenInfo(pois, 0)
                                    //对左侧列表的点击添加监听事件
                                    listListener(pois)
                                }, 200)

                            })

                            /**
                             * 设置地点名片信息
                             * **/
                                //调整地图视野
                            map.fitBounds(latlngBounds);
                        },

                        /**
                         * 查询失败的回调操作
                         * **/
                        error: function () {
                            //失败时的地图初始操作：清除地图上所有图标，再在最近点击的地点打上标记，重置窗口
                            falseFind('false')
                            //F.tips('不存在该地理名称！',2000)
                        }
                    });

                    //清除地图上所有的marker(清除地图上的标志点)
                    var clearOverlays = function (overlays) {
                        if (!markers || markers.length == 0) {
                            return
                        }
                        //console.log(markers)
                        var overlay;
                        while (overlay = overlays.pop()) {
                            overlay.setMap(null);
                        }
                    }

                    //精确查询方法,返回结果只有一个
                    var codeAddress = function (address) {
                        //通过getLocation();方法获取位置信息值
                        geocoder.getLocation(address);
                    }

                    //设置模糊查询方法，返回结果会有多个,并且会显示左侧列表
                    var searchKeyword = function (keyword) {
                        //设置搜索的城市
                        if (scope.city == '市辖区' || scope.city == '县') {
                            //微信那边不存在县的概念，都是区
                            var area = scope.area.replace('县','')
                            searchService.setLocation(scope.province + area);
                        } else {
                            if(scope.area == '县区' || scope.area == '市辖区'){
                                searchService.setLocation(scope.province + scope.city);
                            }else{
                                searchService.setLocation(scope.city + scope.area);
                            }
                            //searchService.setLocation(scope.city + scope.area);
                        }
                        //根据输入的关键字在搜索范围内检索
                        searchService.search(keyword);
                    }

                    //生成新的地图标志点的方法
                    var creatMarker = function (latLng, draggable, animation) {
                        latLng = latLng || {lat: 0, Lng: 0} //坐标
                        draggable = draggable || false  //能否拖拽
                        animation = animation || 'DOWN'
                        return new qq.maps.Marker({
                            map: map,
                            position: latLng,
                            draggable: draggable,
                            animation: qq.maps.MarkerAnimation[animation]
                        });
                    }

                    //对模糊查询的结果进行过滤
                    var searchFilter = function (org) {
                        var deferred = $q.defer();
                        var promise = deferred.promise;
                        var poisArr = new Array()
                        var len = org.length
                        var areaLegth = scope.area.length
                        for (var i = 0; i < len; i++) {
                            !function (i) {
                                var index = org[i].address.indexOf(scope.area)
                                if (index > -1) {
                                    var address = org[i].address.substr(index + areaLegth)
                                    //console.log(results.detail.pois[i].name.indexOf(scope.address))
                                    if (address.length >= 2) {
                                        poisArr.push(org[i])
                                        //利用过滤后的结果生成左侧列表和地图标点
                                        setSearchResult(org[i])
                                    }
                                }
                            }(i)
                        }
                        deferred.resolve(poisArr);
                        return deferred.promise;
                    }

                    //精确查询：利用过滤后的信息制作左侧列表和地图标志点
                    var setSearchResult = function (poi) {
                        var poi = poi || false;
                        if (poi) {
                            //扩展边界范围，用来包含搜索到的Poi点
                            latlngBounds.extend(poi.latLng);
                            //创建新的坐标
                            var marker = creatMarker(poi.latLng)
                            //设置标记名称
                            marker.setTitle(poi.name);
                            //将标记加入标记列表
                            markers.push(marker);
                            //console.log(markers)
                        }
                    }

                    //裁剪地址字符串，去除省市区
                    var getAddress = function (address) {
                        if (!address) {
                            return address = null
                        }
                        var index = address.indexOf(scope.area) || -1
                        if (index > -1) {
                            var length = scope.area.length
                            address = address.slice(index + length)
                        } else {
                            var len = scope.areaArr.length
                            for (var i = 0; i < len; i++) {
                                !function (i) {
                                    var area = scope.areaArr[i].area
                                    var index = address.indexOf(area) || -1
                                    if (index > -1) {
                                        scope.isWatch = false
                                        scope.area = area
                                        var length = area.length
                                        address = address.slice(index + length)
                                        return address
                                    }
                                }(i)
                            }
                        }
                        return address = address.length > 1 ? address : null
                    }

                    //门店名称和分店名称的获取
                    var getName = function (name) {
                        if (!name) {
                            return
                        }
                        var index = name.indexOf('(') || -1
                        if (index > -1) {
                            scope.shopName = name.substring(0, index)
                            scope.branch = name.slice(index + 1, -1)
                        } else {
                            scope.shopName = name
                            scope.branch = null
                        }
                    }

                    //获取门店电话
                    var getPhone = function (phone) {
                        if (!phone || phone.length <= 1) {
                            scope.areaCode = null
                            scope.telCode = null
                            scope.formObj.fixedTelBody.$dirty = true
                            return
                        }
                        var index = phone.indexOf('-') || -1
                        if (index > -1) {
                            scope.areaCode = phone.substring(0, index)
                        } else {
                            scope.areaCode = null
                        }
                        var end = phone.indexOf(';') || -1
                        scope.telCode = end > -1 ? phone.slice(index + 1, end) : phone.slice(index + 1)
                    }

                    //通过点击地点名片导入门店信息的方法
                    setShopMsg = function (target, kind) {
                        target = target || ''
                        kind = kind || false //默认为非拖拽的坐标
                        var latLng = {}      //要获取的地理坐标
                        if (kind == false) {
                            var shopCar = target.parentNode
                            //名称
                            var totalName = shopCar.childNodes[0].firstChild.nodeValue
                            //地址
                            var address = shopCar.childNodes[1].firstChild.nodeValue
                            //电话
                            var phone = shopCar.childNodes[2].firstChild.nodeValue
                            var index = shopCar.childNodes[1].getAttribute('data-index')
                            latLng = markers[index].position
                            //利用选取的地理坐标精确查询
                            geocoder.getAddress(latLng)
                            //清除所有地图标记
                            clearOverlays(markers)
                            //创建新的地图标记点
                            var marker = new qq.maps.Marker({
                                map: map,
                                position: latLng
                            });
                            markers.push(marker)
                            scope.isDisabled = true
                            //设置门店名称和分店名称
                            getName(totalName)
                            //设置门店街道地址和所在区域
                            scope.address = getAddress(address)
                            scope.address = scope.address && scope.address.length > 1 ? scope.address : null
                            //设置门店电话
                            getPhone(phone)
                            scope.isWatch = true
                        } else {
                            latLng = markers[0].position
                            markers[0].setDraggable(false)
                        }
                        //关闭地点卡片
                        infoWin.close();
                        scope.latLng = {lat: latLng.getLat().toFixed(5), lng: latLng.getLng().toFixed(5)}
                        scope.isFind = ''
                        scope.$apply()
                    }

                    //地点卡片的信息设置
                    var setCardMsg = function (name, address, phone, index) {
                        var name = '<p>' + name + '</p>'
                        var address = '<p data-index="' + index + '">' + address + '</p>'
                        var phone = phone ? '<p data-index="' + index + '">' + phone + '</p>' : null
                        var button = '<button class="input-btn" type="button" onclick="setShopMsg(this)">导入该门店信息</button>'
                        return '<div class="infoWin">' + name + address + phone + button + '</div>'
                    }

                    //设置信息提示窗口的内容
                    var OpenInfo = function (pois, index) {
                        //打开信息提示窗口
                        infoWin.open();
                        //设置提示窗的位置
                        //console.log(pois[index])
                        preLatLng = pois[index].latLng
                        infoWin.setPosition(preLatLng);
                        //填充信息提示窗口(地点名片)的内容
                        infoWin.setContent(setCardMsg(pois[index].name, pois[index].address, pois[index].phone, index))
                        //设置左侧列表的样式
                        setListStyle(index)
                    }

                    //设置左侧列表的样式
                    var setListStyle = function (index) {
                        var ol = searchService.panel.getElementsByTagName('ol')[0] || false
                        if (ol) {
                            var liArr = ol.childNodes
                            for (var i = 0; i < liArr.length; i++) {
                                !function (i, index) {
                                    if (i != index) {
                                        liArr[i].style.backgroundColor = ''
                                    } else {
                                        liArr[index].style.backgroundColor = 'rgb(238, 238, 238)'
                                    }
                                }(i, index)
                            }
                        }
                    }

                    //添加左侧列表的监听事件
                    var listListener = function (pois) {
                        var list = infoDiv.getElementsByTagName('li')
                        for (var i = 0; i < list.length; i++) {
                            !function (i) {
                                qq.maps.event.addListener(list[i], 'click', function () {
                                    OpenInfo(pois, i)
                                })
                            }(i)
                        }
                        var falseTip = document.createElement('li')
                        falseTip.innerHTML = "<div class='tip'>找不到合适门店？ <a onclick='falseFind()'" + ">标注新门店</a></div>"
                        infoDiv.firstChild.childNodes[1].appendChild(falseTip)
                    }


                    //搜索不到结果时的操作
                    falseFind = function (flag) {
                        //关闭左侧列表
                        scope.isFind = flag || ''
                        scope.$apply()
                        //清除所有标记
                        clearOverlays(markers)
                        //聚焦到最近所点击的坐标
                        var center = preLatLng || map.getCenter()
                        var marker = creatMarker(center, true)
                        //给坐标添加拖拽的事件监听
                        qq.maps.event.addListener(marker, 'dragstart', function () {
                            infoWin.close()
                        })
                        qq.maps.event.addListener(marker, 'dragend', function () {
                            marker.setAnimation(qq.maps.MarkerAnimation.DOWN)
                            infoWin.setPosition(marker.getPosition());
                            infoWin.setContent('<div class="infoWin"><p>是否使用此位置作为门店的定位？</p>' +
                                '<button type="button" class="input-btn" onclick="setShopMsg(null,true)">确定</button></div>')
                            infoWin.open()
                        })
                        markers.push(marker)
                        //更改地点名片的位置和内容
                        infoWin.close()
                        infoWin.setPosition(center);
                        infoWin.setContent('<div class="infoWin"><p>找不到门店地址，拖拽创建新标注</p>')
                        infoWin.open()
                    }

                    //初始化地图坐标
                    var initMarker = function (latLngObj) {
                        if (latLngObj) {
                            var latLng = new qq.maps.LatLng(latLngObj.lat, latLngObj.lng);
                            //console.log(latLng)
                            var marker = creatMarker(latLng)
                            markers.push(marker)
                            map.setCenter(latLng)
                        } else {
                            codeAddress('中国' + scope.province + scope.city + scope.area)
                        }
                    }

                    /**
                     * 业务逻辑代码
                     * ***/
                        //监听省份变化,改变地图聚焦中心
                    scope.$watch('province', function () {
                        if (scope.province && scope.isWatch) {
                            //精确查询
                            codeAddress('中国' + scope.province)
                        }
                    })

                    //监听城市变化,改变地图聚焦中心
                    scope.$watch('city', function () {
                        if (scope.city && scope.isWatch) {
                            //精确查询
                            codeAddress('中国' + scope.province + scope.city)
                        }
                    })

                    //监听区域变化,改变地图聚焦中心
                    scope.$watch('area', function () {
                        if (scope.area && scope.isWatch) {
                            //精确查询
                            if (scope.city == '市辖区' || scope.city == '县') {
                                codeAddress('中国' + scope.province + scope.area)
                            } else {
                                codeAddress('中国' + scope.province + scope.city + scope.area)
                            }
                        }
                    })

                    //编辑和查看时初始化地图定位
                    scope.$watch('type', function () {
                        switch (scope.type) {
                            case 'edit':
                                if (scope.latLng) {
                                    initMarker(scope.latLng)
                                    scope.isWatch = true
                                } else {
                                    if (scope.city == '市辖区' || scope.city == '县') {
                                        codeAddress('中国' + scope.province + scope.area)
                                    } else {
                                        codeAddress('中国' + scope.province + scope.city + scope.area)
                                    }
                                }
                                break;
                            case 'show':
                                initMarker(scope.latLng)
                                map.setOptions({
                                    draggable: false,
                                    scrollwheel: false,
                                    mapTypeControl: false,
                                    panControl: false,
                                    zoomControl: false,
                                    scaleControl: false,
                                    disableDoubleClickZoom: true,
                                    keyboardShortcuts: false
                                })
                                break;
                        }
                    })

                    //触发街道的模糊搜索
                    scope.$on('mapSearch',function(){
                        var keyword = scope.address
                        //判断查询条件是否和之前一样
                        searchService.setPageIndex(0)
                        searchKeyword(keyword)
                        scope.latLng = ''
                    })

                }
            }
        }])
    }
})