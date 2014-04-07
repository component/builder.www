
var koa = require('koa')

var app = module.exports = koa()

app.use(require('koa-favicon')())

if (!~['test', 'production'].indexOf(app.env)) app.use(require('koa-logger')())

app.use(require('koa-compress')())
app.use(require('koa-cdn'))

app.use(function* home(next) {
  if (this.request.path !== '/') return yield* next
  this.response.status = 301
  this.response.redirect('https://github.com/component/builder.www')
})

app.use(require('.').standalone)
app.use(require('.').build)

if (!module.parent) {
  var port = process.env.PORT || 3444
  app.listen(port)
  console.log('gitproximus listening on port ' + port)
}
