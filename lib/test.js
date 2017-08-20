"use strict";

var _seneca = require("seneca");

var _seneca2 = _interopRequireDefault(_seneca);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _chai = require("chai");

var _ = require(".");

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Defined function - what will return test app instance
// External modules
var App = function App(fn) {
  return (0, _seneca2.default)({
    log: "test",
    debug: { undead: true }
  }).test(fn);
};

// Defined basic test


// Internal modules
describe("XEntity - Basic", function () {
  var id = void 0,
      returnFields = ["name", "createdAt", "status"];
  // Init test app
  var app = App();
  // Use memory store
  app.use("basic");
  // Use seneca-entity
  app.use("entity");

  // Register XEntity
  app.use(_2.default);

  // Before hook for test, all thing you need will be prepare at there
  before(function (done) {
    // App is ready to test
    app.ready(function () {
      return done();
    });
  });

  it("Create", function (done) {
    var dog = app.make$("dogs");
    dog.name = "Mihoo";
    dog.createdAt = new Date();
    dog.status = 1; // LIVE
    dog.asyncSave$({ fields$: returnFields }).then(function (savedDog) {
      // By default, result of asyncSave$ will be convert to object
      (0, _chai.expect)(savedDog).to.be.an("object");

      // All properties has been saved
      (0, _chai.expect)(savedDog.name).to.be.equal(dog.name);
      (0, _chai.expect)(savedDog.createdAt.toString()).to.be.equal(dog.createdAt.toString());
      (0, _chai.expect)(savedDog.status).to.be.equal(dog.status);

      // Id must be auto created
      (0, _chai.expect)(savedDog.id).to.be.exist;

      // Store id
      id = savedDog.id;
      // Test is successful
      done();
    }).catch(done);
  });

  it("Read one row", function (done) {
    var dog = app.make$("dogs");
    dog.asyncLoad$({ id: id, fields$: returnFields }).then(function (loadedDog) {
      // By default, result of asyncLoad$ will be convert to object
      (0, _chai.expect)(loadedDog).to.be.an("object");

      // All properties has been loaded
      (0, _chai.expect)(loadedDog.name).to.be.exist;
      (0, _chai.expect)(loadedDog.createdAt).to.be.exist;
      (0, _chai.expect)(loadedDog.status).to.be.exist;

      // Test is successful
      done();
    }).catch(done);
  });

  it("Read many row", function (done) {
    var dog = app.make$("dogs");
    dog.asyncList$({ fields$: returnFields }).then(function (loadedDogs) {
      // By default, result of asyncList$ will be convert to array of object
      (0, _chai.expect)(loadedDogs).to.be.an("array");
      (0, _chai.expect)(loadedDogs[0]).to.be.an("object");

      // All properties has been loaded
      (0, _chai.expect)(loadedDogs[0].name).to.be.exist;
      (0, _chai.expect)(loadedDogs[0].createdAt).to.be.exist;
      (0, _chai.expect)(loadedDogs[0].status).to.be.exist;

      // Test is successful
      done();
    }).catch(done);
  });

  it("Update", function (done) {
    var dog = app.make$("dogs"),
        newName = "Gau";
    dog.asyncLoad$({ id: id, fields$: returnFields }, true) // The second params will make asyncLoad$ return entity instead of object
    .then(function (loadedDog) {
      // By default, result of asyncLoad$ will be convert to object
      (0, _chai.expect)(loadedDog).to.be.an("object");

      // All properties has been loaded
      (0, _chai.expect)(loadedDog.name).to.be.exist;
      (0, _chai.expect)(loadedDog.createdAt).to.be.exist;
      (0, _chai.expect)(loadedDog.status).to.be.exist;

      loadedDog.name = newName;
      return loadedDog.asyncSave$({ fields$: returnFields });
    }).then(function (savedDog) {
      // By default, result of asyncSave$ will be convert to object
      (0, _chai.expect)(savedDog).to.be.an("object");

      // All properties has been saved
      (0, _chai.expect)(savedDog.name).to.be.equal(newName);

      // Id must be keep
      (0, _chai.expect)(savedDog.id).to.be.equal(id);

      // Test is successful
      done();
    }).catch(done);
  });

  it("Delete", function (done) {
    var dog = app.make$("dogs");
    dog.asyncRemove$({ id: id, fields$: returnFields }).then(function (removedDog) {
      // By default, result of asyncRemove$ will be convert to object
      (0, _chai.expect)(removedDog).to.be.an("object");

      // All properties has been return after delete
      (0, _chai.expect)(removedDog.name).to.be.exist;
      (0, _chai.expect)(removedDog.createdAt).to.be.exist;
      (0, _chai.expect)(removedDog.status).to.be.exist;

      // Delete the right entity
      (0, _chai.expect)(removedDog.id).to.be.equal(id);

      // Test is successful
      done();
    }).catch(done);
  });
});