"use strict"

// Configurations
import { fbConf, adminEmail } from '../config'

import compose from 'koa-compose'
import convert from 'koa-convert'
import passport from 'koa-passport'
import session from 'koa-generic-session'
import sqlite3Store from 'koa-sqlite3-session'
import { Strategy as FacebookStrategy } from 'passport-facebook'

// Recaptcha
import {
  recaptcha_development,
  recaptcha_test,
  recaptcha_production } from '../config'

import recaptcha from 'recaptcha-validator'

const RecaptchaConfig =
        (process.env.NODE_ENV == 'production') ? recaptcha_production :
        (process.env.NODE_ENV == 'development') ? recaptcha_development :
        recaptcha_test

passport.use(new FacebookStrategy({
  clientID:     fbConf.appId,
  clientSecret: fbConf.appSecret,
  callbackURL: `http://localhost:${process.env.PORT || 3000}/api/auth/fb/callback`,
  profileFields: ['id', 'displayName', 'email'],
  enableProof: true
}, function(token, tokenSecret, profile, cb) {
  // retrieve user ...
  profile.accessToken = token
  return cb(null, profile);
}))

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

export default function auth() {
  return compose([

    // session 
    convert(session({
      store: new sqlite3Store('./session.db', {})
    })),

    // passport initialization
    passport.initialize(),

    // passport session initialization
    passport.session(),
    
  ])
}

export function recaptchaCheck() {
  return async (ctx, next) => {
    if (process.env.NODEDEV == 'development') {
      console.log('Dev mode, skipping recaptcha')
      await next()
    }

    if (!ctx.request.fields['g-recaptcha-response'])
      ctx.throw(500, `Please remember to complete the human test.`)

    try {
      await recaptcha.promise(
        RecaptchaConfig.secret,
        ctx.request.fields['g-recaptcha-response'],
        ctx.request.ip
      )
    } catch (err) {
      if (typeof err === 'string')
        ctx.throw(500, err)
      else
        ctx.throw(500, err)
    }
  }
}
export function isAuthenticated() {
  return async (ctx, next) => {
    if (ctx.isAuthenticated())
      await next()
    else
      ctx.throw(401)
  }
}

export function isAdmin() {
  return async (ctx, nect) => {
    if(adminEmail.includes(ctx.state.user.emails[0]))
      await next()
    else
      ctx.throw(401)
  }
}