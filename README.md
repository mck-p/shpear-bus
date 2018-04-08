# @shpear/bus

> Message bus for the @shpear microservice framework

## Usage

```js
// Import our factory function
const makeBus = require('@shpear/bus')

// Some cache interface
// Has no Default value
const cache = {
  get: id => Promise.resolve(address),
  set: (id, address) => Promise.resolve(),
  has: id => Promise.resolve(boolean),
  delete: id => Promise.resolve()
}

// Bus Server Interface
// can be created via `makeServer` from `@shpear/utils`
// Has no default value
const server = {
  _server: net.Server,
  messages: Observable<Actions>
}

// A function that given a JSON object,
// will return an Observable of a TCP message
// Defaults to Observable.of(JSON.stringify(msg))
const encode = msg => Observable<EncodedValue>
// A function that given a TCP message,
// will return an Observable of a JSON object
// Defaults to Observable.of(JSON.parse(msg))
const decode = msg => Observable<DecodedValue>

// Our logging interface for the Bus
// Defaults to console
const logger = {
  log: (...args) => void,
  warn: (...args) => void,
  error: (...args) => void,
  info: (...args) => void
}

// our bus instance
const bus = makeBus({
  cache,
  server,
  decode,
  encode,
  logger,
})

// Start the bus
bus.start()

// Sometime later...
// stop the bus
bus.stop()
```