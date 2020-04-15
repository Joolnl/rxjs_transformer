## Target
* Angular 8 (not for Ivy Compiler) (developed on 8.2.2)
* RxJS Version 6 (developed on 6.4.0)

## Usage
Install the transformer into an Angular Project (see installation below).
Install the chrome devtools extension: https://github.com/Joolnl/rxjs-devtools-extension

The transformer replaces RxJS nodes in the Typescript AST with wrapper versions,
these wrapper versions send metadata to the devtools extension and return the normal
behavior herafter.

## Installation
1. navigate into angular project
2. ```npm i --save-dev ngx-build-plus```
3. ```npm i --save-dev C:\Users\Roy\Documents\school\iWLAB\npm_transformer```
4. add ngx-build-plus to project:
4a. ```ng add ngx-build-plus``` (for angular 8)
4b. ```ng add ngx-build-plus@7``` (for angular versions 6 and 7)
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
