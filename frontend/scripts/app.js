'use strict';

var moscowjs = angular.module('moscowjs', ['ui.router'])
  .config(function ($urlRouterProvider, $stateProvider, $locationProvider) {

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode(true);

    $stateProvider
      .state('root', {
        url: '/',
        templateUrl: 'views/reg.html'
      })
  });
