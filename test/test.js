
var request = require('supertest');
var rimraf = require('rimraf');
var isUMD = require('is-umd');
var path = require('path');
var vm = require('vm');

var server = require('../lib/app').listen();

before(function (done) {
  rimraf(path.resolve('components'), done);
})

describe('/standalone', function () {
  it('should not UMD-wrap jQuery again', function (done) {
    request(server)
    .get('/standalone/components/jquery')
    .expect('Content-Type', 'application/javascript')
    .expect(200, function (err, res) {
      if (err) return done(err);

      var js = res.text;
      js.should.not.include('function require');
      done();
    })
  })

  it('should UMD-wrap component/emitter', function (done) {
    request(server)
    .get('/standalone/component/emitter')
    .expect('Content-Type', 'application/javascript')
    .expect(200, function (err, res) {
      if (err) return done(err);

      var js = res.text;
      isUMD(js).should.be.ok;
      done();
    })
  })

  it('should return nothing for CSS files', function (done) {
    request(server)
    .get('/standalone/necolas/normalize.css')
    .expect('Content-Type', 'application/javascript')
    .expect(200)
    .expect('', done);
  })
})

describe('/build.js', function () {
  it('should build reworkcss/rework@0.20.2', function (done) {
    request(server)
    .get('/build.js?reworkcss/rework=0.20.2')
    .expect('Content-Type', 'application/javascript')
    .expect(200, function (err, res) {
      if (err) return done(err);

      var ctx = vm.createContext();
      // make debug think we're in a browser environment
      ctx.window = {};
      vm.runInContext(res.text, ctx);
      ctx.require('rework');
      done();
    })
  })

  it('should build suitcss/suit@0.4.0', function (done) {
    request(server)
    .get('/build.js?suitcss/suit=0.4.0')
    .expect('Content-Type', 'application/javascript')
    .expect(200)
    .expect('', done);
  })

  it('should build reworkcss/rework and component/emitter', function (done) {
    request(server)
    .get('/build.js')
    .query({
      'reworkcss/rework': '*',
      'component/emitter': '*',
    })
    .expect('Content-Type', 'application/javascript')
    .expect(200, function (err, res) {
      if (err) return done(err);

      var ctx = vm.createContext();
      // make debug think we're in a browser environment
      ctx.window = {};
      vm.runInContext(res.text, ctx);
      ctx.require('rework');
      ctx.require('emitter');
      done();
    })
  })
})

describe('/build.css', function () {
  it('should build reworkcss/rework@0.20.2', function (done) {
    request(server)
    .get('/build.css?reworkcss/rework=0.20.2')
    .expect('Content-Type', 'text/css; charset=utf-8')
    .expect(200)
    .expect('', done);
  })

  it('should build suitcss/suit@0.4.0', function (done) {
    request(server)
    .get('/build.css?suitcss/suit=0.4.0')
    .expect('Content-Type', 'text/css; charset=utf-8')
    .expect(200)
    .expect(/\.Arrange/, done);
  })
})
