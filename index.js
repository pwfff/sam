// import the emscripten glue code
import emscripten from './build/module.js'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

// this is where the magic happens
// we send our own instantiateWasm function
// to the emscripten module
// so we can initialize the WASM instance ourselves
// since Workers puts your wasm file in global scope
// as a binding. In this case, this binding is called
// `wasm` as that is the name Wrangler uses
// for any uploaded wasm module
let emscripten_module = new Promise((resolve, reject) => {
  emscripten({
    instantiateWasm(info, receive) {
      let instance = new WebAssembly.Instance(wasm, info)
      receive(instance)
      return instance.exports
    },
  }).then(module => {
    resolve({
      Speak: module.cwrap('Speak', 'number', ['string']),
      GetWavLength: module.cwrap('GetWavLength', 'number', []),
      module: module,
    })
  })
})

async function handleRequest(event) {
  try {
    let url = new URL(event.request.url)
    if (url.pathname.endsWith('favicon.ico')) {
      return new Response()
    }

    let SAM = await emscripten_module

    let params = new URLSearchParams(url.search)
    let input = params.get('s')
    if (input == null) {
      input = 'hello i am stuck in a worker, please send help'
    }

    let ptr = SAM.Speak(input)
    let wavLength = SAM.GetWavLength()

    console.log(ptr)

    let resultBytes = new Uint8Array(SAM.module.HEAPU8.subarray(ptr, ptr+wavLength))

    console.log(resultBytes.length)

    let response = new Response(resultBytes)
    response.headers.set('Content-Type', 'audio/wav')
    response.headers.set('Content-Disposition', 'inline')

    // Return the response.
    return response
  } catch (err) {
    console.error(err)
    return new Response(err)
  }
}
