var $ = require('shelljs')

if (!$.which('docker')) {
  $.echo(
    'This template requires Docker. Please install Docker and try again.',
  )
  $.exit(1)
}

$.mkdir('-p', 'build')
$.exec(
  'docker run --rm -v $(pwd):/src emscripten/emsdk:latest emcc -O2 -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS=\'["cwrap", "setValue", "intArrayFromString"]\' -s ALLOW_MEMORY_GROWTH=1 -s DYNAMIC_EXECUTION=0 -s TEXTDECODER=0 -s MODULARIZE=1 -s ENVIRONMENT=\'web\' -s EXPORT_NAME="emscripten" --pre-js \'./pre.js\' -o ./build/module.js ./src/main.c ./src/reciter.c ./src/sam.c ./src/render.c ./src/debug.c ./src/processframes.c ./src/createtransitions.c',
)
