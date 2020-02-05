var plugin = require('../index');

// results of every analysis will be delivered in similar format
var mockedResults = [
  {
    "_id": {
      "key": "_id"
    },
    "value": {
      "types": {
        "ObjectId": 5
      }
    },
    "totalOccurrences": 5,
    "percentContaining": 100
  },
  {
    "_id": {
      "key": "pets"
    },
    "value": {
      "types": {
        "Number": 1,
        "String": 1
      }
    },
    "totalOccurrences": 2,
    "percentContaining": 40
  }
];

var mockedResultsWithObject = [
	{
		"_id" : {
			"key" : "_id"
		},
		"value" : {
			"types" : {
				"ObjectId" : 2
			}
		},
		"totalOccurrences" : 2,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "createdAt"
		},
		"value" : {
			"types" : {
				"Date" : 2
			}
		},
		"totalOccurrences" : 2,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "firstObject"
		},
		"value" : {
			"types" : {
				"Object" : 2
			}
		},
		"totalOccurrences" : 2,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "firstObject.listIds"
		},
		"value" : {
			"types" : {
				"Array" : 2
			}
		},
		"totalOccurrences" : 2,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "firstObject.name"
		},
		"value" : {
			"types" : {
				"String" : 2
			}
		},
		"totalOccurrences" : 2,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "firstObject.number"
		},
		"value" : {
			"types" : {
				"Number" : 2
			}
		},
		"totalOccurrences" : 2,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "comment"
		},
		"value" : {
			"types" : {
				"String" : 1
			}
		},
		"totalOccurrences" : 1,
		"percentContaining" : 50
	},
	{
		"_id" : {
			"key" : "isLocked"
		},
		"value" : {
			"types" : {
				"Boolean" : 1
			}
		},
		"totalOccurrences" : 1,
		"percentContaining" : 50
	}
];

var mockedResultsWithObjectInArray = [
	{
		"_id" : {
			"key" : "_id"
		},
		"value" : {
			"types" : {
				"ObjectId" : 14
			}
		},
		"totalOccurrences" : 14,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "title"
		},
		"value" : {
			"types" : {
				"String" : 14
			}
		},
		"totalOccurrences" : 14,
		"percentContaining" : 100
	},
	{
		"_id" : {
			"key" : "data"
		},
		"value" : {
			"types" : {
				"Array" : 13
			}
		},
		"totalOccurrences" : 13,
		"percentContaining" : 92.85714285714286
	},
	{
		"_id" : {
			"key" : "updatedAt"
		},
		"value" : {
			"types" : {
				"Date" : 6
			}
		},
		"totalOccurrences" : 6,
		"percentContaining" : 42.857142857142854
	},
	{
		"_id" : {
			"key" : "data.XX.category"
		},
		"value" : {
			"types" : {
				"String" : 2
			}
		},
		"totalOccurrences" : 2,
		"percentContaining" : 14.285714285714286
	},
	{
		"_id" : {
			"key" : "data.XX.code"
		},
		"value" : {
			"types" : {
				"String" : 1
			}
		},
		"totalOccurrences" : 1,
		"percentContaining" : 7.142857142857143
	},
	{
		"_id" : {
			"key" : "data.XX.zonename"
		},
		"value" : {
			"types" : {
				"String" : 1
			}
		},
		"totalOccurrences" : 1,
		"percentContaining" : 7.142857142857143
	}
]

describe('Nomnoml plugin for Variety', function() {

  it('should format results to Nomnoml', function() {
	plugin.init({nomnomuml: true});
	
    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResults);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(
      '[No name|_id: ObjectId;pets: Number,String]'
    );
  });

  it('should handle displayStats passed through the plugin config', function() {

    plugin.init({'displayStats': true, nomnomuml: true});

    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResults);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(
      '[No name|_id: ObjectId (100%);pets: Number,String (40%)]'
    );
  });

  it('should handle collectionName passed through the plugin config', function() {

    plugin.init({'collectionName': 'Main', nomnomuml: true});

    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResults);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(
      '[Main|_id: ObjectId;pets: Number,String]'
    );
  });

  it('should handle linked object', function() {

    plugin.init({'collectionName': 'Main', 'nomnomuml': true});

    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResultsWithObject);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(
      '[Main|createdAt: Date;_id: ObjectId;isLocked: Boolean;comment: String]\n' +
      '[firstObject|firstObject.listIds: Array;number: Number;name: String]\n' +
      '[Main]1-1[firstObject]'
    );
  });

  it('should handle linked array with objects', function() {

    plugin.init({'collectionName': 'Main','displayStats':true, nomnomuml: true});

    // let our plugin transform the variety results into own representation
    var output = plugin.formatResults(mockedResultsWithObjectInArray);

    // verify, that plugin transformed data to expected format
    // https://jasmine.github.io/1.3/introduction.html#section-Expectations
    expect(output).toEqual(	
      '[Main|title: String (100%);_id: ObjectId (100%);updatedAt: Date (42.86%)]\n' +
      '[data|92.86%|category: String (14.29%);zonename: String (7.14%);code: String (7.14%)]\n' +
      '[Main]1-*[data]'
    );
  });
});



describe('PlantUML plugin for Variety', function() {

	it('should format results to PlantUML', function() {
	  plugin.init({nomnomuml: false});
	  
	  // let our plugin transform the variety results into own representation
	  var output = plugin.formatResults(mockedResults);
  
	  // verify, that plugin transformed data to expected format
	  // https://jasmine.github.io/1.3/introduction.html#section-Expectations
	  expect(output).toEqual(
		'@startuml\n' +
		'object No name {\n' +
		'\t_id: ObjectId\n' +
		'\tpets: Number,String\n' +
	  	'}\n' +
	  	'@enduml'
	  );
	});
  
	it('should handle displayStats passed through the plugin config', function() {
  
	  plugin.init({'displayStats': true, nomnomuml: false});
  
	  // let our plugin transform the variety results into own representation
	  var output = plugin.formatResults(mockedResults);
  
	  // verify, that plugin transformed data to expected format
	  // https://jasmine.github.io/1.3/introduction.html#section-Expectations
	  expect(output).toEqual(
		
		'@startuml\n' +
		'object No name {\n' +
		'\t_id: ObjectId (100%)\n' +
		'\tpets: Number,String (40%)\n' +
	  	'}\n' +
	  	'@enduml'
	  );
	});
  
	it('should handle collectionName passed through the plugin config', function() {
  
	  plugin.init({'collectionName': 'Main', nomnomuml: false});
  
	  // let our plugin transform the variety results into own representation
	  var output = plugin.formatResults(mockedResults);
  
	  // verify, that plugin transformed data to expected format
	  // https://jasmine.github.io/1.3/introduction.html#section-Expectations
	  expect(output).toEqual(
		'@startuml\n' +
		'object Main {\n' +
		'\t_id: ObjectId\n' +
		'\tpets: Number,String\n' +
	  	'}\n' +
		'@enduml'	  
		);
	});
  
	it('should handle linked object', function() {
  
	  plugin.init({'collectionName': 'Main', 'nomnomuml': false});
  
	  // let our plugin transform the variety results into own representation
	  var output = plugin.formatResults(mockedResultsWithObject);
  
	  // verify, that plugin transformed data to expected format
	  // https://jasmine.github.io/1.3/introduction.html#section-Expectations
	  expect(output).toEqual(
		'@startuml\n' +
		'object Main {\n' +
			'\tnumber: Number\n' +
			'\tname: String\n' +
			'\tcreatedAt: Date\n' +
			'\t_id: ObjectId\n' +
			'\tisLocked: Boolean\n' +
			'\tcomment: String\n' +
		'}\n' +
		'object firstObject {\n' +
			'\tfirstObject.listIds: Array\n' +
		'}\n' +
		'Main "1" -- "1" firstObject\n' +
		'@enduml'
	  );
	});
  
	it('should handle linked array with objects', function() {
  
	  plugin.init({'collectionName': 'Main','displayStats':true, nomnomuml: false});
  
	  // let our plugin transform the variety results into own representation
	  var output = plugin.formatResults(mockedResultsWithObjectInArray);
  
	  // verify, that plugin transformed data to expected format
	  // https://jasmine.github.io/1.3/introduction.html#section-Expectations
	  expect(output).toEqual(	
		'@startuml\n' +
		'object Main {\n' +
		'\ttitle: String (100%)\n' +
		'\t_id: ObjectId (100%)\n' +
		'\tdata: Array (92.86%)\n' +
		'\tupdatedAt: Date (42.86%)\n' +
		'\tcategory: String (14.29%)\n' +
		'\tzonename: String (7.14%)\n' +
		'\tcode: String (7.14%)\n' +
		'}\n' +
	  	'@enduml'
		);
	});
  });
