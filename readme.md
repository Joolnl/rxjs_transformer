## Target
* Angular 6, 7, 8 (not for Ivy Compiler) (developed on 8.2.2)
* RxJS Version 6 (developed on 6.4.0)
* typescript ~3.5.3

## Known Bugs
* usage of unexecuted RxJS creation and merge operators like
combineLatest and of e.g.:
 ```console.log(of)```
 results in import errors.

## Usage
Install the transformer into an Angular Project (see installation below).
Install the chrome devtools extension: https://github.com/Joolnl/rxjs-devtools-extension

The transformer replaces RxJS nodes in the Typescript AST with wrapper versions,
these wrapper versions send metadata to the devtools extension and return the normal
behavior herafter.

## Build
- mention to use this package with the file directive in the package.json because it is not published yet
- mention to create a 'logs' directory in the dist folder because it is not created during build
- execute `npm run build` to build
- for now create a `logs` folder in `dist`

//todo@:switch order of ng add and install transformer
## Installation
1. navigate into angular project
2. install ngx-build-plus
2a. ```npm i ngx-build-plus``` (angular8)
2b. ```npm i ngx-build-plus@^7``` (angular 6 | 7)
3. add ngx-build-plus to project:
3a. ```ng add ngx-build-plus``` (angular 8)
3b. ```ng add ngx-build-plus@^7``` (angular 6 | 7)
4. ```npm i {placeholder for rxjs-transformer npm package, not yet public}``` for example: ```npm i ../rxjs_transformer```
5. mutate angular.json => under serve options add "plugin":  "rxjs-transformer",

e.g. plugin field in serve options:

```
"serve": {
          "builder": "ngx-build-plus:dev-server",
          "options": {
            "plugin":  "rxjs-transformer",
            "browserTarget": "test-app:build"
          },
          "configurations": {
            "production": {
              "browserTarget": "test-app:build:production"
            }
          }
        },
``` 

6. RxJS nodes now wrapped on ng serve.

## TODO
* Improve AngularCompilerPlugin detection in register-transformer.
* Look into Ivy Compiler integration for injecting transformer.
* RxJS 7 changes impact on node replacement.
* Look into splitting rxjs-transformer and rxjs-wrapper.
* Support for multiple typescript versions for angular6/7/8
* check if installing ngx-build-plus is necessary.
