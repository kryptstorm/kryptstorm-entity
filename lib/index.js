"use strict";

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } // External modules


// Default options of this plugin
var defaultOptions = {
  limit$: 20, // Default limit of entity result (use for asyncList$)
  fields$: ["id"] // Default return fields
};

module.exports = function XEntity(options) {
  // Merge the options of user with plugin options
  // User's options have more important than plugin options
  var _limit = _lodash2.default.isNumber(options.limit$) && options.limit$ > 0 ? options.limit$ : defaultOptions.limit$;
  var _fields = _lodash2.default.isArray(options.fields$) && !_lodash2.default.isEmpty(options.fields$) ? options.fields$ : defaultOptions.fields$;

  // Retrive Seneca Enitty
  var Entity = this.private$.exports.Entity.prototype;

  /**
  * Assume you have an entity, let enity = this.make$("dog");
  * enity.fields$ is a FUNCTION return what should be saved to entity
  * 
  * @param {object} opts 
  * - opts.fields$ <Array> how many fields should be return
  * @param {bool} returnEntity Return enitty instance instead of entity object
  */
  Entity.asyncSave$ = function asyncSave$() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var returnEntity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    // Resolve options
    if (!_lodash2.default.isArray(opts.fields$) || _lodash2.default.isEmpty(opts.fields$)) opts.fields$ = [];

    // Create async method for seneca.entity.save$
    var _asyncSave$ = _bluebird2.default.promisify(Entity.save$, {
      context: this
    });

    // Return entity instance instead of entity object
    if (returnEntity) {
      return _asyncSave$();
    }

    // Save and return entity object
    return _asyncSave$().then(function (ent) {
      return _bluebird2.default.resolve(_formatEntity(ent, [].concat(_toConsumableArray(_fields), _toConsumableArray(opts.fields$))));
    });
  };

  /**
  * Load one entity
  * 
  * @param {object} query 
  * - query.fields$ <Array> how many fields should be return
  * - query.native$ <Array|Object> (array -  use first element as query, second element as meta settings, object - use object as query, no meta settings)
  * @param {bool} returnEntity Return enitty instance instead of entity object
  */
  Entity.asyncLoad$ = function asyncLoad$() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var returnEntity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    // Resolve query
    if (!_lodash2.default.isObject(query)) query = {};
    if (!_lodash2.default.isArray(query.fields$) || _lodash2.default.isEmpty(query.fields$)) {
      query.fields$ = _fields;
    }

    // Create async method for seneca.entity.load$
    var _asyncLoad$ = _bluebird2.default.promisify(Entity.load$, {
      context: this
    });

    // Return entity instance instead of entity object
    if (returnEntity) return _asyncLoad$(query);

    // Return entity object
    return _asyncLoad$(query).then(function (ent) {
      return _bluebird2.default.resolve(_formatEntity(ent));
    });
  };

  /**
  * Load list entity
  * 
  * @param {object} query 
  * - query.fields$ <Array> how many fields should be return
  * - query.limit$ number of entities should be return
  * - query.skip$ number of entities should be skip
  * - query.sort$ {field_1: -1, field_2: 1}
  * - query.native$ <Array|Object> (array -  use first element as query, second element as meta settings, object - use object as query, no meta settings)
  * @param {bool} returnEntity Return enitty instance instead of entity object
  */
  Entity.asyncList$ = function asyncList$() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var returnEntity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    // Resolve query
    if (!_lodash2.default.isObject(query)) query = {};
    if (!_lodash2.default.isArray(query.fields$) || _lodash2.default.isEmpty(query.fields$)) {
      query.fields$ = _fields;
    }

    // Create async method for seneca.entity.load$
    var _asyncList$ = _bluebird2.default.promisify(Entity.list$, {
      context: this
    });

    // Return entity instance instead of entity object
    if (returnEntity) return _asyncList$(query);

    // Return array of entity object
    return _asyncList$(query).then(function (ents) {
      var result = [];
      _lodash2.default.each(ents, function (ent) {
        return result.push(_formatEntity(ent));
      });
      return _bluebird2.default.resolve(result);
    });
  };

  /**
  * Remove entities
  * 
  * @param {object} query 
  * - query.fields$ <Array> how many fields should be return
  * - query.all$ (default is false) Delete all entities match condition
  * - query.load$ (default is true) Return data after deleted an entity
  * - query.native$ <Array|Object> (array -  use first element as query, second element as meta settings, object - use object as query, no meta settings)
  */
  Entity.asyncRemove$ = function asyncRemove$() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Resolve query
    if (!_lodash2.default.isBoolean(query.all$) || !query.all$) {
      query.all$ = false;
    }
    if (!_lodash2.default.isBoolean(query.load$) || !query.load$) {
      query.load$ = true;
    }
    if (!_lodash2.default.isArray(query.fields$) || _lodash2.default.isEmpty(query.fields$)) {
      query.fields$ = [];
    }

    var _asyncRemove$ = _bluebird2.default.promisify(Entity.remove$, {
      context: this
    });

    return _asyncRemove$(query).then(function (attributes) {
      // Delete many fields, we cannot return deleted data because seneca return empty data,
      // just return empty array
      if (query.all$) return _bluebird2.default.resolve([]);

      // Delete 1 row and load data after deleted
      if (query.load$) {
        return _bluebird2.default.resolve(_formatEntity(attributes, [].concat(_toConsumableArray(_fields), _toConsumableArray(query.fields$))));
      }

      // Delete 1 row and keep slient
      return _bluebird2.default.resolve({});
    });
  };

  /**
   * Connect node-mongodb-native
   * @return connection to node-mongodb-native
   */
  Entity.asyncNative$ = function asyncNative$() {
    var _asyncNative$ = _bluebird2.default.promisify(Entity.native$, {
      context: this
    });

    return _asyncNative$();
  };

  // Register our method
  var XEntity$ = {};
  // Inject our method to seneca
  this.decorate("XEntity$", XEntity$);

  this.add("init:XEntity", function initXEntity(args, done) {
    return done();
  });

  return { name: "XEntity" };
};

var _formatEntity = function _formatEntity(ent, fields$) {
  var result = {},
      attributes = void 0;

  // Invalid entity
  if (!_lodash2.default.isObject(ent) || _lodash2.default.isEmpty(ent)) return result;

  // ent is seneca entity - ent.data$ is a function
  if (_lodash2.default.isFunction(ent.data$)) {
    attributes = ent.data$();
  } else {
    // Result of remove function is a mongo object, convert it to entity-like
    attributes = _lodash2.default.merge(ent, { id: ent._id.toString() });
  }

  // Only return fields has been defined on fields$ if fields$ is defined
  var _attributes = _lodash2.default.isArray(fields$) ? _lodash2.default.pick(attributes, fields$) : attributes;
  // Only get public propeties
  _lodash2.default.each(_attributes, function (v, c) {
    return !_lodash2.default.includes(c, "$") ? result[c] = v : result;
  });

  return result;
};