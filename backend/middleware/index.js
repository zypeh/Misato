"use strict"

import bodyParser from 'koa-better-body'
import ratelimit from 'koa2-rate-limit'
import compose from 'koa-compose'
import compress from 'koa-compress'
import convert from 'koa-convert'
import path from 'path'

export default function middleware(app) {
  return compose([

    // X-Powered-By
    misato,

    // No Cache
    nocache,

    // Error handling
    errorhandling,

    // No cache
    // nocache,

    // Ratelimiting
    // TODO hand333 help me fill in all the API request you wish to limit
    /*
    ratelimit({
      routes: [
        { method: 'POST', path: '/'}
      ],
      interval: 1 * 60 * 60 * 1000,
      max: 100
    }),
    */
    // Compress response
    compress({
      filter: function(content_type) {
        return /text/i.test(content_type)
      },
      threshold: 2048,
      flush: require('zlib').Z_SYNC_FLUSH
    }),

    // Body Parser
    // TODO
    convert(bodyParser({
      uploadDir: path.join(__dirname, '../../public/temp')
    })),

    // Echo
    verbose

  ])
}

async function misato(ctx, next) {
  ctx.set('X-Written-By', 'Wizard-League')
  ctx.set('X-Powered-By', 'Wizard-Engine')
  await next()
}

async function nocache(ctx, next) {
  ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  ctx.set('Pragma', 'no-cache')
  ctx.set('Expire', '0')
  await next()
}

async function verbose(ctx, next) {
  console.log('  Request Header: '.yellow, ctx.header)
  console.log('  Request Body: '.yellow, ctx.request.fields)
  await next()
}

async function errorhandling(ctx, next) {
  try {
    await next()
  } catch (err) {
    let status = err.status || 500
    let message = err.message || 'Internal Error'

    ctx.status = status
    ctx.body = {
      success: false,
      message: message
    }

    if (status == 500)
      ctx.app.emit('error', err, ctx)
  }
}
