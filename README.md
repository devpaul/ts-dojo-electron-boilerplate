# Electron with TypeScript and Dojo

This is a boilerplate for developing [Electron](http://electron.atom.io/) applications. 
It features a complete development environment including

* [TypeScript](https://www.typescriptlang.org/)
* [Dojo 2](http://dojotoolkit.org/community/roadmap/)
* [Intern](http://theintern.github.io/)
* [Docker](https://www.docker.com/)
* [Grunt](http://gruntjs.com/)

We hope this is a useful starting place to begin your electron project <3.


## Quick Start

* `npm install`
* `typings install`
* `grunt`
* `npm start`


## Building a Distribution

### For OSX

To create an installer run

```
	grunt osxinstaller
```

### For Windows

To create an installer on a Windows machine run

```
	grunt wininstaller
```

Many of the packaging options for electron require a Windows environment. If you are not on a Windows machine 
Docker can be used to build the application in a linux container with wine, nsis, and node installer. To do this we
need to build the docker image

```
	docker build --tag="winelectron" .
```

Once built, a windows installer can be build using

```
	docker run --rm -v `pwd`:/src -v /src/node_modules winelectron
```


## Running Tests

