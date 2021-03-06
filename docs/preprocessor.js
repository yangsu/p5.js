var DocumentedMethod = require('./yuidoc-p5-theme-src/scripts/documented-method');

function smokeTestMethods(data) {
  data.classitems.forEach(function(classitem) {
    if (classitem.itemtype === 'method') {
      new DocumentedMethod(classitem);
    }
  });
}

function mergeOverloadedMethods(data) {
  var methodsByFullName = {};
  var paramsForOverloadedMethods = {};

  data.classitems = data.classitems.filter(function(classitem) {
    var fullName, method;

    var assertEqual = function(a, b, msg) {
      if (a !== b) {
        throw new Error(
          'for ' + fullName + '() defined in ' + classitem.file + ':' +
          classitem.line + ', ' +
          msg + ' (' + JSON.stringify(a) + ' !== ' + JSON.stringify(b) + ')'
        );
      }
    };

    var processOverloadedParams = function(params) {
      var paramNames;

      if (!(fullName in paramsForOverloadedMethods)) {
        paramsForOverloadedMethods[fullName] = {};
      }

      paramNames = paramsForOverloadedMethods[fullName];

      params.forEach(function(param) {
        var origParam = paramNames[param.name];

        if (origParam) {
          assertEqual(origParam.type, param.type,
                      'types for param "' + param.name + '" must match ' +
                      'across all overloads');
          assertEqual(param.description, '',
                      'description for param "' + param.name + '" should ' +
                      'only be defined in its first use; subsequent ' +
                      'overloads should leave it empty');
        } else {
          paramNames[param.name] = param;
        }
      });

      return params;
    };

    if (classitem.itemtype && classitem.itemtype === 'method') {
      fullName = classitem.class + '.' + classitem.name;
      if (fullName in methodsByFullName) {
        // It's an overloaded version of a method that we've already
        // indexed. We need to make sure that we don't list it multiple
        // times in our index pages and such.

        method = methodsByFullName[fullName];

        assertEqual(method.file, classitem.file,
                    'all overloads must be defined in the same file');
        assertEqual(method.module, classitem.module,
                    'all overloads must be defined in the same module');
        assertEqual(method.submodule, classitem.submodule,
                    'all overloads must be defined in the same submodule');
        assertEqual(classitem.description || '', '',
                    'additional overloads should have no description');

        if (!method.overloads) {
          method.overloads = [{
            line: method.line,
            params: processOverloadedParams(method.params)
          }];
          delete method.params;
        }
        method.overloads.push({
          line: classitem.line,
          params: processOverloadedParams(classitem.params)
        });
        return false;
      } else {
        methodsByFullName[fullName] = classitem;
      }
    }
    return true;
  });
}

module.exports = function(data, options) {
  mergeOverloadedMethods(data);
  smokeTestMethods(data);
};

module.exports.mergeOverloadedMethods = mergeOverloadedMethods;
