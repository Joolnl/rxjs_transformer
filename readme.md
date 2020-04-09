1. navigate into angular project
2. npm i ngx-build-plus
3. npm i C:\Users\Roy\Documents\school\iWLAB\npm_transformer
4. ng add ngx-build-plus
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