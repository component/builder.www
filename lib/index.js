
var Resolve = require('component-resolver');
var flatten = require('component-flatten');
var Build = require('component-build');
var crypto = require('crypto');
var isUMD = require('is-umd');
var path = require('path');
var fs = require('fs');

var route = require('koa-path')({
  sensitive: false,
  strict: true,
  end: false,
});

// resolver options
var options = {
  install: true,
  // only download the files that are used to create builds
  fields: [
    'scripts',
    'json',
    'templates',
    'styles',
  ],
};

exports.build = route('/build.:format(js|css)', function* () {
  var dependencies = validateDependencies(this.request.query);
  var tree = yield* Resolve({
    dependencies: dependencies
  }, options);

  var format = this.params.format;
  var build = new Build(tree, {
    autorequire: false,
    alias: true,
  });
  var string = yield build[format === 'js' ? 'scripts' : 'styles'].bind(build);

  this.response.type = format;
  serve.call(this, string);
})

exports.standalone = route('/standalone/:user([\\w-]+)/:project([\\w\\.-]+)/:version?', function* () {
  var params = this.params;
  var repo = params.user + '/' + params.project;
  repo = repo.toLowerCase();

  var dependencies = {};
  dependencies[repo] = params.version || '*';

  var tree = yield* Resolve({
    dependencies: dependencies
  }, options);

  tree = tree.dependencies[repo];

  // if there's only one script, and it's already UMD,
  // and there's no dependencies, just serve that script
  var json = tree.node;
  if (json.scripts && json.scripts.length === 1 && flatten(tree).length === 1) {
    var filename = path.join(tree.path, json.scripts[0]);
    var js = yield fs.readFile.bind(null, filename, 'utf8');
    if (isUMD(js)) {
      var stats = yield fs.stat.bind(null, filename);
      this.response.type = 'js';
      this.response.body = js;
      this.response.lastModified = stats.mtime;
      this.response.etag = etag(js);
      if (this.request.fresh) this.response.status = 304;
      return;
    }
  }

  var build = new Build(tree, {
    standalone: true
  });
  var string = yield build.scripts.bind(build);

  this.response.type = 'js';
  serve.call(this, string);
})

function serve(string) {
  string = string || '';
  this.response.body = string;
  this.response.lastModified = new Date();
  this.response.etag = etag(string);
  if (this.request.fresh) this.response.status = 304;
}

function etag(string) {
  return crypto.createHash('sha256')
    .update(string)
    .digest('hex');
}

function validateDependencies(obj) {
  var names = Object.keys(obj)
  if (!names.length) this.throw(400, 'at least one dependency required to build');
  names.forEach(function (name) {
    if (!/^[\w-]+\/[\w-\.]+$/.test(name)) this.throw(400, 'invalid dependency name: ' + name);
  });
  return obj;
}
