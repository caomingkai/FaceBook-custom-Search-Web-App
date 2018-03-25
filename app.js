// create SPA app
var app = angular.module('FBSearch', ['ngRoute' , 'ngResource', 'ngAnimate'] );

var lon;
var lat;
//var a = new Date().getTime() / 1000;
//console.log( a );

navigator.geolocation.getCurrentPosition(success);
function success(pos){
    var crd = pos.coords;
    lon = crd.longitude;
    lat = crd.latitude;
//    console.log(new Date().getTime() / 1000 - a);

};
//---------------------main Ctrl----------------------
//------------------------------------------------------
app.controller("mainCtrl", ['$rootScope', '$scope','$window', '$http', '$location', 'storageService', 'dataService', '$q', '$timeout', function($rootScope, $scope, $window, $http, $location, storageService, dataService, $q, $timeout){
    $scope.showBarOrNot = false;
    $scope.showDetailBarOrNot ={state : true};
    $scope.searchType = 'user';
    $scope.main={animationSwap: "view-animate"};

    $scope.searchAJAX = function(){
        if($scope.keyword !== undefined &&  $scope.keyword !== ""){

            $scope.showBarOrNot = true;
            $scope.dataResultFavorite={'data' : ""};
            var i = 0;
            var key, value, favorite = {};
            var len = $window.localStorage.length;
            for(var i = 0; i < len; i++ ){
                var key = $window.localStorage.key(i);
                var value =  JSON.parse($window.localStorage[key] || false);
                favorite[key] = value;
            };
            $scope.dataResultFavorite.data = favorite;


            //---------Ajax from PHP----------------------
            $timeout(
                $http({
                        url: "result.php?kw="+$scope.keyword+"&lati="+lat+"&long="+lon,
                        method: "GET",
                        }).then(function (response) {
                            $scope.dataResult = response.data;
                            console.log(lon);
                            $scope.dataResult.favorite = $scope.dataResultFavorite;
                            $scope.showBarOrNot = false;
                            $location.path('/resultTable');})
            , 1000);
        }
    };

    $scope.clear = function(){
        storageService.clear();
        $scope.dataResult = {};
        $scope.dataDetail = {};
        $scope.keyword = "";
        $scope.showBarOrNot = false;
        $scope.searchType = 'user';
        $scope.main={animationSwap: "view-animate"};
        $location.path('/');
    };


    $scope.getSearchType = function(type){
        $scope.searchType = type;
        if( "undefined" !== typeof $scope.dataResult){
            if(!angular.equals({}, $scope.dataResult) ){
                $location.path('/resultTable');
            }
        }
    };

}]);

//---------------------ResultCtrl------------------------
//------------------------------------------------------
app.controller("resultCtrl", ['$scope', '$location', 'dataService', '$http', '$q' ,'storageService', function($scope, $location, dataService, $http, $q, storageService){
    // dataResult数据(user/places/...),由dataService传来
    // dataService的数据由search发出ajax后，得到JSON数据
//    $scope.showFavorTable = ($scope.dataResult.favorite.data!==undefined);
//    console.log($scope.dataResult.favorite.data!==undefined);
    $scope.paging = function(pageUrl, searchType){
         var a1=$http.get(pageUrl).then(function (response) {
             $scope.dataResult.searchTypeData = response.data;
             switch(searchType){
                     case 'user': $scope.dataResult.user = $scope.dataResult.searchTypeData;break;
                     case 'page': $scope.dataResult.page = $scope.dataResult.searchTypeData;break;
                     case 'event': $scope.dataResult.event = $scope.dataResult.searchTypeData;break;
                     case 'place': $scope.dataResult.place = $scope.dataResult.searchTypeData;break;
                     case 'group': $scope.dataResult.group = $scope.dataResult.searchTypeData;break;
                 default:      alert("searchType Error in paging() method"); break;
             }
             $location.path('/resultTable');
         });
    };

}]);

//----------------------DetailCtrl----------------------
//------------------------------------------------------
app.controller("detailCtrl", ['$scope', 'dataService', 'storageService', '$window', '$location', function($scope, dataService, storageService, $window, $location){

    //-------------Scope Initiate-----------------------
    console.log($scope.showDetailBarOrNot.state);
    $scope.itemDetail = dataService.dataDetail; // NOTE: item is the current object

    //------ function back()-----------------------------
    $scope.back = function() {
        $scope.main.animationSwap = "view-animate-reverse";
        $location.path('/resultTable');

    };

    //------ function favorDetail()-----------------------
    $scope.detailFavor = function(){
        if(Boolean($scope.dataResult.favorite.data[$scope.itemDetail.id] )){ //  favorite is  set
            storageService.remove($scope.itemDetail.id);
        }else{             // not yet set favorite
            storageService.setObject($scope.itemDetail.id,
                                     [$scope.itemDetail, $scope.searchType]);
        }

        // -Get the Localstorage items---
        var i = 0;
        var key, value, favorite = {};
        var len = $window.localStorage.length;
        for(var i = 0; i < len; i++ ){
            var key = $window.localStorage.key(i);
            var value =  JSON.parse($window.localStorage[key] || false);
            favorite[key] = value;
        };
        $scope.dataResult.favorite.data = favorite;
    };

    //----------------FB Initiate-----------------------
    window.fbAsyncInit = function() {
        FB.init({
          appId      : '1723426561284149',
          xfbml      : true,
          version    : 'v2.8'
        });
        FB.AppEvents.logPageView();
    };

    (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement(s); js.id = id;
         js.src = "//connect.facebook.net/en_US/sdk.js";
         fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    //------------------function post()------------------
    $scope.post = function( ){
        FB.ui({
            method: 'feed',
            link: window.location.href,
            caption: 'An example caption',
            picture: $scope.itemDetail.picture.data.url,
            name: $scope.itemDetail.name,
            caption: 'FB SEARCH FROM USC CSCI571'
        }, function(response){
            if(response ){
                alert("success");
            }else{
                alert("Failed");
            }
        });
    };
}]);


//----------------------DirectiveItem-------------------
//------------------------------------------------------
app.directive("trItems", function(){

    var itemController = ['$window','$scope', 'storageService', 'dataService', '$http', '$location',    function ($window, $scope, storageService, dataService, $http, $location) {
//        $scope.toggle = Boolean(dataService.dataResult.favorite.data[$scope.item.id] );
        $scope.toggle = Boolean($scope.dataResult.favorite.data[$scope.item.id] );

        //------------function: favorHandle()-----------------
        $scope.favorHandle = function(){

           if(Boolean($scope.dataResult.favorite.data[$scope.item.id] )){ //  favorite is  set
                storageService.remove($scope.item.id);

            }else{             // not yet set favorite
                storageService.setObject($scope.item.id,
                                         [$scope.item, $scope.searchType]);

            }

            // -----Get the Localstorage items
            var i = 0;
            var key, value, favorite = {};
            var len = $window.localStorage.length;
            for(var i = 0; i < len; i++ ){
                var key = $window.localStorage.key(i);
                var value =  JSON.parse($window.localStorage[key] || false);
                favorite[key] = value;
            };
            $scope.toggle = Boolean($scope.dataResult.favorite.data[$scope.item.id] );
            $scope.dataResult.favorite.data = favorite;

        };

        //------------function:searchDetail()------------------
        $scope.searchDetail = function(){
            $scope.showDetailBarOrNot.state = true;
            $scope.main.animationSwap = "view-animate";
            id = $scope.item.id;
            $location.path('/detailTable');
            $http({
                url: "result.php",
                method: "GET",
                params: { detailId: id }
            }).then(function (response) {

                $scope.dataDetail = response.data;
                dataService.dataDetail = $scope.dataDetail;
                $scope.showDetailBarOrNot.state = false;
                $location.path('/detailTable');
            });


        };

    }];


    return {
        restrict: "EA",
        controller: itemController,
        templateUrl: "directive/item.html",
        replace: true,
        scope:true
    };
})

//---------------------DirectiveFavor-------------------------
//------------------------------------------------------
app.directive("favor", function(){

    var favorController = ['$window', '$scope', 'storageService', 'dataService', '$http', '$location',  function ($window, $scope, storageService, dataService, $http, $location) {

        $scope.showOrNot = true;

//        $scope.toggle = Boolean(dataService.dataResult.favorite.data[$scope.item.id] );
        $scope.toggle = Boolean($scope.dataResult.favorite.data[$scope.item.id] );

        //------------function: favorRemove()-----------------
        $scope.favorRemove = function(){
            storageService.remove($scope.item[0].id);
            $scope.showOrNot = false;
          // -----Get the Localstorage items
            var i = 0;
            var key, value, favorite = {};
            var len = $window.localStorage.length;
            for(var i = 0; i < len; i++ ){
                var key = $window.localStorage.key(i);
                var value =  JSON.parse($window.localStorage[key] || false);
                favorite[key] = value;
            };
            $scope.dataResult.favorite.data = favorite;
        };

        $scope.searchDetail = function(){
            id = $scope.item[0].id;
            var token = "&access_token=EAAYfcoP7WDUBAP49wJZAgfysMH73JbFwy5XGHerUfoe01CmTio8RZCZCnF62svQa7AWP7rjPmiKnXueNSVV6jRZBfpZA6UhZAzt3mMn1zUYxnBTWdtV9ELy4s2NnvpmyIQ7FCI5xYQmLhGxMA4g2ZAEPu19TBKfADBnrCMGvxzpAQZDZD";

            //-----------------------------------------
            var url = "https://graph.facebook.com/v2.8/" + id + "?fields=id,name,picture.width(700).height(700),albums.limit(5){name,photos.limit(2){name, picture}},posts.limit(5)"+token;
            $http.get(url).then(function (response) {
                $scope.dataDetail = response.data;
                dataService.dataDetail = $scope.dataDetail;
                $location.path('/detailTable');
            });
        };
     }];

    return {
        restrict: "EA",
        controller: favorController,
        templateUrl: "directive/favor.html",
        replace: true,
        scope:true
    }
})

//----------------------Routing------------------------
//------------------------------------------------------
app.config(function($routeProvider){
    $routeProvider
    .when("/resultTable",{
        templateUrl: "webpage/resultTable.html",
        controller: 'resultCtrl'
    })
    .when("/detailTable", {
        templateUrl: "webpage/detailTable.html",
        controller: 'detailCtrl'
    })

});


//-------------------dataService------------------------
//------------------------------------------------------
app.service("dataService", function(){
    this.dataResult = {};
    this.dataDetail = {};
//    this.showDetailBarOrNot = true;
    this.clear = function(){
        this.dataResult = {};
        this.dataDetail = {};
        this.searchType = 'user';
    }
});


//-------------------storageService---------------------
//------------------------------------------------------
app.service('storageService', ['$window', function($window) {

    this.item ={};
    item = $window.localStorage;

    this.storageObj = function(){
        var objArr = [];
        var len =$window.localStorage.length;
        for(var i=0; i<len; i++){
            var curKey = $window.localStorage.key(i);
            objArr[i] = this.getObject(curKey);
        }
        this.item = objArr;
        return objArr;
    }

    this.setObject = function(key, value) {
        $window.localStorage[key] = JSON.stringify(value);
    };

    this.getObject = function(key) {
        if($window.localStorage[key] != undefined){
            return JSON.parse( $window.localStorage[key] || false );
        }
        return false;
    };

    this.remove = function(key){
        $window.localStorage.removeItem(key);
    };

    this.key = function(i){
        return $window.localStorage.key(i);
    };

    this.clear = function(){
        $window.localStorage.clear();
    };

    this.length = function(){
        return $window.localStorage.length;
    };
}]);
