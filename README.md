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

## Schema

```
type INTERNAL_BUS_COMMAND =
    'REGISTER_ACTOR' |
    'UPDATE_ACTOR_ADDRESS' |
    'DEREGISTER_ACTOR'

type ActorID = string
type ActorAddress = string

interface Action {
  type: string;
  payload: any;
}

interface InternalCommandMessage {
  type: INTERNAL_BUS_COMMAND;
  payload: {
    actor_id: ActorID,
    actor_address?: ActorAddress
  }
}

interface ExternalMessage {
  action: Action;
  receiver_id: ActorID
}
```

## Example Commands

_**Register Actor to be able to receive messages**_

```
{
  type: 'REGISTER_ACTOR',
  payload: {
    actor_id: '1234',
    actor_address: 'localhost:5000'
  }
}
```

_**Update Actor's address**_

```
{
  type: 'UPDATE_ACTOR_ADDRESS',
  payload: {
    actor_id: '1234',
    actor_address: 'localhost:5000'
  }
}
```

_**Remove Actor from bus**_

```
{
  type: 'DEREGISTER_ACTOR',
  payload: {
     actor_id: '1234',
  }
}
```

_**Send Actor a message**_

```
{
  action: {
    type: 'Some action that means something to that person',
    payload: {
      some: {
        payload: 'stuff'
      }
    }
  },
  reciever_id: '1234'
}
```