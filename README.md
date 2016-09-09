# ng-map
A map for angular with tencentMap in PC

一、添加以下代码进控制器
require('tenCentMap')		//CMD规范，你可以按需求用AMD加入依赖
//if use for search
$scope.searchTouch = function(){
      $scope.$broadcast('mapSearch')
}

二、在引用的页面添加以下代码
<!--if just for show-->
<ten-cent-map type="'show'" province="provinceId" city="cityId"  area="areaId" address="streetAddress"  lat-lng="latLng" area-arr="areas" ></ten-cent-map>

<!--if use for search and edit-->
<!--地址三级联动的数据/api请自行解决-->
<select 
                        ng-model="provinceId"
                        ng-options="..." >
                    <option value="" >省份</option>
<select 
                        ng-model="cityId"
                        ng-options="..." >
                    <option value="" >城市</option>
 <select 
                        ng-model="areaId"
                        ng-options="..." >
                    <option value="" >区域</option>
 <input type="text"  ng-model="streetAddress">
<button ng-click="searchTouch()">search</button>
<ten-cent-map type="'edit'" province="provinceId" city="cityId"  area="areaId" address="streetAddress"  lat-lng="latLng" area-arr="areas" ></ten-cent-map>

三、指令内部逻辑
1.配置项
scope: {
    	province: '=',                	//省份
        city: '=',                       	//城市
        area: '=',                       	//县区
        address: '=',               	//街道
        latLng: '=',              	   	//坐标
        areaArr: '=',                 	//县区select的数据，格式是数组对象
 pageSize:'=',			 //每页显示多少条数据
        isDisabled: '=',               	//是否禁止修改搜索的省/市/区/街道关键字
        mapStyle: '=',                 //地图的样式对象
        isFind: '=',                     	//是否查询目标地点，会影响左侧选择结果的显示
        type: '=',                         //操作类型，‘show’是只展示，‘edit’是修改，默认只展示
        isWatch: '=',                   //是否通过监听省市区街道的选项变化来改变地图展示的区域
        shopName: '=',             //门店名称
        branch: '=',                   //商家名称
        areaCode: '=',                //门店固话的区号
        telCode: '=',                  //门店固话的除区号外的部分
}

2.内部公共对象
geocoder：精确查询对象，用于设置精确查询方法
searchService：模糊查询对象，用于设置模糊查询方法
map：地图对象，配置地图杂项
infoWin：左侧搜索结果展示对象
markers：地图所以标点的集合，数组格式
preLatLng ：最近一次点击的地图标点的坐标

3.主要api
（1）initMarker：初始化地图中心和地图标志的方法
参数：经纬度坐标对象（注意别弄反经纬度）
{
lat,	//纬度
lng	//经度
}

（2）codeAddress：精确查询方法,返回结果只有一个
参数：由省市区街道拼接的字符串

（3）searchKeyword：设置模糊查询方法，返回结果会有多个
参数：由省市区街道拼接的字符串

（4）creatMarker：生成新的地图标志点的方法
参数：
{
latLng, 		//经纬度坐标对象
draggable,	//是否可拖拽
animation	//是否带过渡动画
}

（5）searchFilter：对精确查询的结果进行过滤的方法
参数：调取精确/模糊查询方法后返回的结果，数组格式

（6）setSearchResult：将搜索结果设置到左侧列表中以及生产地图坐标点的方法
参数：调取精确/模糊查询方法后返回的结果的某一项，对象格式

（7）setShopMsg：通过点击地点名片的确认按钮导入门店信息的方法
参数：{
target, 	//所点击的地点名片的按钮
kind		//是否为可拖拽的类型
}

（8）getAddress：从选择的地图坐标点钟获取格式化街道信息的方法（在setShopMsg中调取）
参数：地点名片上的地址

（9）getName:格式化门店名称和分店名称的方法（在setShopMsg中调取）
参数：地点名片上的门店名称

（10）getPhone：格式化门店电话（区号和后半部分）的方法（在setShopMsg中调取）
参数：地点名片上的电话

（11）setCardMsg：设置地点卡片信息的方法（在OpenInfo中调取）
参数：{
name, 	//门店名称
address, 	//门店地址
phone, 	//门店电话
index	//在搜索结果数组中的下标
}

（12）OpenInfo：设置信息提示窗口内容的方法
参数：{
pois, 	//搜索结果数组
index	//要显示的那一项的下标
}

（13）falseFind：搜索不到结果时的操作（清楚地图坐标点并产生一个可拖拽的坐标点）
参数：bool值，为true时显示搜索搜索结果，为false时只显示‘找不到合适门店？ ’的提示

（14）setListStyle：设置左侧列表被选中的一项，添加样式
参数：所选中项的的下标

（15）listListener：为左侧列表的选项绑定事件
参数：搜索结果数组
