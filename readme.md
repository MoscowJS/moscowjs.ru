Minimalistic boilerplate that has express server and supports angular.js with html5mode routing

## Features

* minimalistic backend server
* html5mode
* auto-reloading
* short and clean grunt scenario

## Installed scripts
* angular
* jquery
* bootstrap

## Installed modules
* angular-cookies
* angular-resource
* angular-sanitize
* angular-ui
* angular-ui-router
* angular-bootstrap

## Install

```bash
git clone https://github.com/tenphi/grunt-express-angular-html5mode-boilerplate.git boilerplate
cd boilerplate
npm install --save-dev
bower install
```

## Commands
`grunt server` - start development server (8080 port by default) and open browser

`grunt server:production` - build frontend and start production server (80 port by default, requires `sudo`)

`grunt build` - build project

Edit `config.json` to change default configuration
