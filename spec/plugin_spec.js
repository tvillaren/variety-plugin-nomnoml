var plugin = require('../index');

// results of every analysis will be delivered in similar format
var mockedResults = [
  {
    "_id": {
      "key": "_id"
    },
    "value": {
      "types": [
        "ObjectId"
      ]
    },
    "totalOccurrences": 5,
    "percentContaining": 100
  },
  {
    "_id": {
      "key": "pets"
    },
    "value": {
      "types": [
        "Array",
        "String"
      ]
    },
    "totalOccurrences": 2,
    "percentContaining": 40
  }
];

describe('Nomnoml plugin for Variety', function() {

//	beforeEach(function(){
//		plugin.init({'delimiter' : '|'});
//	});

  it('should format results to Nomnoml', function() {
    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResults);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(
      '[No name|_id: ObjectId;pets: Array,String]'
    );
  });

  it('should handle displayStats passed through the plugin config', function() {

    plugin.init({'displayStats': true});

    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResults);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(
      '[No name|_id: ObjectId (100%);pets: Array,String (40%)]'
    );
  });

  it('should handle collectionName passed through the plugin config', function() {

    plugin.init({'collectionName': 'Main'});

    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResults);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(
      '[Main|_id: ObjectId;pets: Array,String]'
    );
  });
});