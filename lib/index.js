const { Observable } = require('rxjs')
const { makeServer, sendMessageAcrossTCP } = require('@shpear/utils')

const validCache = cache => cache && (
  (cache.get && typeof cache.get === 'function')
  && 
  (cache.set && typeof cache.set === 'function')
  &&
  (cache.has && typeof cache.has === 'function')
  &&
  (cache.delete && typeof cache.delete === 'function')
)

const validServer = ({ _server, messages }) => _server && messages && (
  (_server.listen && typeof _server.listen === 'function')
  &&
  (_server.close && typeof _server.close === 'function')
  &&
  (messages.subscribe && typeof messages.subscribe === 'function')
)

const defaultDecode = msg => Observable.create(obs => {
  let message
  try {
    message = JSON.parse(msg)
  } catch (e) {
    message = {
      type: 'MESSAGE_DECODE_ERROR',
      payload: {
        message: 'There was an error decoding the message',
        original_error: e
      }
    }
  } finally {
    obs.next(message)
    obs.complete()
  }
})

const defaultEncode = msg => Observable.create(obs => {
  let message
  try {
    message = JSON.stringify(msg)
  } catch (e) {
    message = {
      type: 'MESSAGE_ENCODE_ERROR',
      payload: {
        message: 'There was an error encoding the message',
        original_error: e
      }
    }
  } finally {
    obs.next(message)
    obs.complete()
  }
})

/**
 * Message Bus 
 */
class Bus {
  constructor ({
    cache,
    server,
    decode = defaultDecode,
    encode = defaultEncode,
    logger = console
  } = {}) {
    // Validate input
    if (!validCache(cache)) {
      throw new TypeError(`You must give a valid cache, with methods of get, set, has, delete.`)
    }

    if (!validServer(server)) {
      throw new TypeError(`You must give a valid server, with properties of _server and messages.`)
    }

    // Set instance values
    this.cache = cache
    this._encode = encode
    this._decode = decode
    this.logger = logger
    this._server = server._server
    this.incomingMessages = server.messages

    // Connect to Observable
    this.handleIncomingMessages()
  }

  handleIncomingMessages () {
    this
      .incomingMessages
      // Decode each incoming message to
      // this._server
      .flatMap(this._decode)
      // Each time it gets a message
      .subscribe(async message => {
        const { type = '', action, receiver_id } = message
        // If there is a `type`, it is a special message for us!
        switch(type) {
          // In both cases of registering or updating
          case 'REGISTER_ACTOR':
          case 'UPDATE_ACTOR_ADDRESS':
            // we want to set the cache
            await this.cache.set(message.payload.actor_id, message.payload.actor_address)
            break;
          // If we want to deregister the actor
          case 'DEREGISTER_ACTOR':
            // we just remove it from cache
            await this.cache.delete(message.payload.actor_id)
            break;
          // I want to be able to peek into the cache
          case 'TEST_CACHE_GET':
            const address = await this.cache.get(message.payload.actor_id)
            // so I just log out the result
            this.logger.log(address)
            break;
          // If I don't know this type or if
          // there is no type, I try to send it
          default:
            this.send(action, receiver_id)
            return;
        }
      })
  }

  // How we start our underlying server
  start (port = 5000) {
    // Just call listen with the passed port
    this._server.listen(port, () =>
      // Log that this is listening
      this.logger.log(`Bus listening at: localhost:${this._server.address().port}`)
    )
  }

  // Stop listening on the port
  stop () {
    // Just call close and log it
    this._server.close(() => this.logger.log('Bus no longer listening'))
  }

  // A bus is just a way to send messages
  // to other people without knowing their
  // address, just an ID
  send(msg, actor_id) {
    this
      // We first encode the message
      ._encode(msg)
      // Then once it's encoded
      .subscribe(async message => {
        // We try to get the address
        const address = await this.cache.get(actor_id)
        if (!address) {
          // We can't really send it without the address!
          this.logger.warn('I can\'t send that! No address found')
        } else {
          // we get the host and port from the cached address
          const [host, port] = address.split(':')

          // Then we send the message across TCP
          sendMessageAcrossTCP({ port, host }, message)
        }
      })
  }
}

module.exports = (...args) => new Bus(...args)
