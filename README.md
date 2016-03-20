# moscowjs.ru

Site of MoscowJS, JavaScript meetup group in Moscow.


## Install

```bash
npm install -g bower gulp     # optional
bower install && npm install
```

## Run

Node <1.0.0:

```bash
node --harmony-generators $(which gulp) watch
```

Node >1.0.0:

```bash
gulp serve
```

## Build

Node <1.0.0:

```bash
node --harmony-generators $(which gulp) build
```

Node >1.0.0:

```bash
gulp build
```

[co-db]: https://github.com/filipovskii/co-db
