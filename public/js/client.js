// Credit to https://auth0.com/blog/2014/01/07/angularjs-authentication-with-cookies-vs-token/

var nodePortal = angular.module('nodePortal', [
    'ngRoute',
    'nodeControllers'
]);

nodePortal.factory('authInterceptor', function ($rootScope, $q, $window) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($window.sessionStorage.jwt) {
                config.headers.Authorization = 'Bearer ' + $window.sessionStorage.jwt;
            }
            return config;
        }
    };
});

nodePortal.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/django', {
                templateUrl: 'views/django-list.html',
                controller: 'DjangoListController'
            }).
            when('/django/edit/:itemId?', {
                templateUrl: 'views/django-edit.html',
                controller: 'DjangoEditController'
            }).
        when('/spring', {
            templateUrl: 'views/spring-list.html',
            controller: 'SpringListController'
        }).
        when('/spring/edit/:itemId?', {
            templateUrl: 'views/spring-edit.html',
            controller: 'SpringEditController'
        })
    }]);

nodePortal.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});


var nodeControllers = angular.module('nodeControllers', []);


var apiListController = function(urlprefix) {
    return ['$scope', '$http',
        function ($scope, $http) {

            var refreshData = function() {
                $http.defaults.cache = false
                $http.get('/' + urlprefix + '/').then(
                    function success(response) {
                        $scope.data = response.data
                    },
                    function error(data) {
                        console.log(data)
                    }
                );
            }

            $http.defaults.cache = false
            refreshData()

            $scope.delete = function(id) {
                $http.delete('/' + urlprefix + '/' + id).success(function(data) {
                    refreshData()
                })
            }
        }
    ]
}

var apiEditController = function(urlprefix) {
    return ['$scope', '$http', '$routeParams', '$location',
        function($scope, $http, $routeParams, $location) {
            if ($routeParams.itemId) {
                $http.get('/' + urlprefix + '/' + $routeParams.itemId).success(function(item) {
                    $scope.item = item;
                });
            } else {
                $scope.item = { text: "" }
            }

            $scope.update = function(item) {
                //$location.url('django')
                $http({
                    method: item.id ? 'PUT' : 'POST',
                    url: item.id ? '/' + urlprefix + '/' + item.id : '/' + urlprefix,
                    data: item
                }).then(
                    function successCallback(response) {
                        $location.url(urlprefix)
                    },
                    function errorCallback(response) {
                        console.log(response);
                    }
                );
            }
        }
    ]
}

nodeControllers.controller('DjangoListController', new apiListController('django'));
nodeControllers.controller('DjangoEditController', new apiEditController('django'));

nodeControllers.controller('SpringListController', new apiListController('spring'));
nodeControllers.controller('SpringEditController', new apiEditController('spring'));
