'use strict';

angular.module('application', ['ui.router'])
  .config(function ($urlRouterProvider, $stateProvider, $locationProvider) {

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode(true);

    $stateProvider
      .state('root', {
        url: '/',
        templateUrl: 'views/main.html'
      })
      .state('second', {
        url: '/second',
        templateUrl: 'views/second.html'
      })
  });
