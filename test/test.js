
var request = require('supertest');
var rimraf = require('rimraf');
var isUMD = require('is-umd');
var path = require('path');

var server = require('../lib/app').listen();

before(function (done) {
  rimraf(path.resolve('components'), done);
})

describe('/standalone', function () {
  it('should not UMD-wrap jQuery again', function (done) {
    request(server)
    .get('/standalone/components/jquery')
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
    .expect(200)
    .expect('', done);
  })
})

describe('/build.js', function () {

})

describe('/build.css', function () {
  
})
