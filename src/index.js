// External modules
const Bluebird = require("bluebird");
const _ = require("lodash");

// Default options of this plugin
const defaultOptions = {
  limit$: 20, // Default limit of entity result (use for asyncList$)
  fields$: ["id"] // Default return fields
};

module.exports = function XEntity(options) {
  // Merge the options of user with plugin options
  // User's options have more important than plugin options
  const _limit =
    _.isNumber(options.limit$) && options.limit$ > 0
      ? options.limit$
      : defaultOptions.limit$;
  const _fields =
    _.isArray(options.fields$) && !_.isEmpty(options.fields$)
      ? options.fields$
      : defaultOptions.fields$;

  // Retrive Seneca Enitty
  const Entity = this.private$.exports.Entity.prototype;

  /**
	 * Assume you have an entity, let enity = this.make$("dog");
	 * enity.fields$ is a FUNCTION return what should be saved to entity
	 * 
	 * @param {object} opts 
	 * - opts.fields$ <Array> how many fields should be return
	 * @param {bool} returnEntity Return enitty instance instead of entity object
	 */
  Entity.asyncSave$ = function asyncSave$(opts = {}, returnEntity = false) {
    // Resolve options
    if (!_.isArray(opts.fields$) || _.isEmpty(opts.fields$)) opts.fields$ = [];

    // Create async method for seneca.entity.save$
    const _asyncSave$ = Bluebird.promisify(Entity.save$, {
      context: this
    });

    // Return entity instance instead of entity object
    if (returnEntity) {
      return _asyncSave$();
    }

    // Save and return entity object
    return _asyncSave$().then(ent =>
      Bluebird.resolve(_formatEntity(ent, [..._fields, ...opts.fields$]))
    );
  };

  /**
	 * Load one entity
	 * 
	 * @param {object} query 
	 * - query.fields$ <Array> how many fields should be return
	 * - query.native$ <Array|Object> (array -  use first element as query, second element as meta settings, object - use object as query, no meta settings)
	 * @param {bool} returnEntity Return enitty instance instead of entity object
	 */
  Entity.asyncLoad$ = function asyncLoad$(query = {}, returnEntity = false) {
    // Resolve query
    if (!_.isObject(query)) query = {};
    if (!_.isArray(query.fields$) || _.isEmpty(query.fields$)) {
      query.fields$ = _fields;
    }

    // Create async method for seneca.entity.load$
    const _asyncLoad$ = Bluebird.promisify(Entity.load$, {
      context: this
    });

    // Return entity instance instead of entity object
    if (returnEntity) return _asyncLoad$(query);

    // Return entity object
    return _asyncLoad$(query).then(ent => Bluebird.resolve(_formatEntity(ent)));
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
  Entity.asyncList$ = function asyncList$(query = {}, returnEntity = false) {
    // Resolve query
    if (!_.isObject(query)) query = {};
    if (!_.isArray(query.fields$) || _.isEmpty(query.fields$)) {
      query.fields$ = _fields;
    }

    // Create async method for seneca.entity.load$
    const _asyncList$ = Bluebird.promisify(Entity.list$, {
      context: this
    });

    // Return entity instance instead of entity object
    if (returnEntity) return _asyncList$(query);

    // Return array of entity object
    return _asyncList$(query).then(ents => {
      let result = [];
      _.each(ents, ent => result.push(_formatEntity(ent)));
      return Bluebird.resolve(result);
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
  Entity.asyncRemove$ = function asyncRemove$(query = {}) {
    // Resolve query
    if (!_.isBoolean(query.all$) || !query.all$) {
      query.all$ = false;
    }
    if (!_.isBoolean(query.load$) || !query.load$) {
      query.load$ = true;
    }
    if (!_.isArray(query.fields$) || _.isEmpty(query.fields$)) {
      query.fields$ = [];
    }

    const _asyncRemove$ = Bluebird.promisify(Entity.remove$, {
      context: this
    });

    return _asyncRemove$(query).then(attributes => {
      // Delete many fields, we cannot return deleted data because seneca return empty data,
      // just return empty array
      if (query.all$) return Bluebird.resolve([]);

      // Delete 1 row and load data after deleted
      if (query.load$) {
        return Bluebird.resolve(
          _formatEntity(attributes, [..._fields, ...query.fields$])
        );
      }

      // Delete 1 row and keep slient
      return Bluebird.resolve({});
    });
  };

  /**
   * Connect node-mongodb-native
   * @return connection to node-mongodb-native
   */
  Entity.asyncNative$ = function asyncNative$() {
    const _asyncNative$ = Bluebird.promisify(Entity.native$, {
      context: this
    });

    return _asyncNative$();
  };

  // Register our method
  const XEntity$ = {};
  // Inject our method to seneca
  this.decorate("XEntity$", XEntity$);

  this.add("init:XEntity", function initXEntity(args, done) {
    return done();
  });

  return { name: "XEntity" };
};

const _formatEntity = (ent, fields$) => {
  let result = {},
    attributes;

  // Invalid entity
  if (!_.isObject(ent) || _.isEmpty(ent)) return result;

  // ent is seneca entity - ent.data$ is a function
  if (_.isFunction(ent.data$)) {
    attributes = ent.data$();
  } else {
    // Result of remove function is a mongo object, convert it to entity-like
    attributes = _.merge(ent, { id: ent._id.toString() });
  }

  // Only return fields has been defined on fields$ if fields$ is defined
  const _attributes = _.isArray(fields$)
    ? _.pick(attributes, fields$)
    : attributes;
  // Only get public propeties
  _.each(
    _attributes,
    (v, c) => (!_.includes(c, "$") ? (result[c] = v) : result)
  );

  return result;
};
