


var getUml = function(varietyResults) {

  var rootObject = {};
  rootObject.name = this.collectionName || "No name";

  for(var i=0; i<varietyResults.length; i++) {
    handleRootKey.bind(this)(varietyResults[i], rootObject);
  }

  factorArray.bind(this)(rootObject);

  if(this.nomnomuml) {
    return toStringNomnomUML.bind(this)(rootObject);
  }  
  return toStringPlantUML.bind(this)(rootObject);
};
  
var handleRootKey = function(key, currentObject) {

  // Handled in the linked object  
  if(key._id.key.indexOf('.') > -1) 
    return handleDeepKey.bind(this)(key, currentObject);

  return handleKey.bind(this)(key, currentObject);
};

var handleKey = function(key, currentObject) {
  if(key.value.types.hasOwnProperty('Object'))
    return handleLinkedObject.bind(this)(key, currentObject, false);
   
  if(key.value.types.hasOwnProperty('Array'))
    return handleLinkedObject.bind(this)(key, currentObject, true);
  
  if(!currentObject.fields)
    currentObject.fields = [];

  // var current = key._id.key + ': ' + Object.keys(key.value.types).join(',');
  // if(this.displayStats)
  //   current += ' ('+ (Math.round(key.percentContaining * 100) / 100) + '%)';
  currentObject.fields.push({
    name: key._id.key,
    types: Object.keys(key.value.types),
    stats: key.percentContaining
  });
  return;
};

var handleDeepKey = function(path, fromObject) {
  var splittedPath = path._id.key.split('.');

  var currentObject = fromObject, 
      currentPath = '';

  // Making sure we have all the chain before handling the field    
  for(var i=0; i<splittedPath.length-1; i++) {
    currentPath += (i > 0 ? '.' : '') + splittedPath[i];
  
    if(splittedPath[i+1] === 'XX') {
      currentObject = handleLinkedObject.bind(this)(currentPath, currentObject, true);
      i++; // ignoring Array 
    } else {
      currentObject = handleLinkedObject.bind(this)(currentPath, currentObject, false);
    }
  }

  if(!path.value.types.hasOwnProperty('Array') && !path.value.types.hasOwnProperty('Object'))
    path._id.key = splittedPath[splittedPath.length-1];
  else if(path.value.types.hasOwnProperty('Array')) {
    path._id.key = path._id.key.replace('.XX','');
  }

  // And adding the field to the last bit
  handleKey.bind(this)(path, currentObject);
};

var handleLinkedObject = function(path, fromObject, isArray) {
  var name = (typeof path === 'object') ? path._id.key : path;
  // var splittedPath = name.split('.');
  
  // if(splittedPath.length > 0) 
  //   name = splittedPath[splittedPath.length-1];

  if(!fromObject.relatedObjects)
    fromObject.relatedObjects = {};

  if(!fromObject.relatedObjects[name])
    fromObject.relatedObjects[name] = {};

  fromObject.relatedObjects[name].isMany = !!isArray;

  if(!fromObject.relatedObjects[name].related) {
    fromObject.relatedObjects[name].related = {
      name: name
    };
  }
  if(typeof path === 'object') {
    fromObject.relatedObjects[name].related.stats = path.percentContaining;
  }
  
  return fromObject.relatedObjects[name].related;
};

var getCandidateFieldInCollection = function(fieldList, fieldName) {
  return fieldList.filter(function(elt) { return elt.name === fieldName; });
};

var factorArray = function(rootObject) {
  if(rootObject.relatedObjects) {
    var keys = Object.keys(rootObject.relatedObjects);
    for(var j=0; j<keys.length; j++) {
      
      // First, going deeper recursively
      factorArray.bind(this)(rootObject.relatedObjects[keys[j]].related);

      // Check if we have a relation to an array with no fields
      // Which means we store in DB just a list of values and not a list of objects
      if(rootObject.relatedObjects[keys[j]].isMany && rootObject.relatedObjects[keys[j]].related.fields == undefined) {
        
        // In that case, we remove the link and add it as a field on the rootObject
        var fieldName = rootObject.relatedObjects[keys[j]].related.name;
        if(rootObject.fields) {
          var candidateField = getCandidateFieldInCollection(rootObject.fields, fieldName);
          if(candidateField.length > 0) {
            if(candidateField[0].types.indexOf('Array') === -1) {
              candidateField[0].types.push('Array');
            }
          } else {
            rootObject.fields.push({
              name: fieldName,
              types: ['Array'],
              stats: rootObject.relatedObjects[keys[j]].related.stats
            });
          }
        } else {
          rootObject.fields = [{
            name: fieldName,
            types: ['Array'],
            stats: rootObject.relatedObjects[keys[j]].related.stats
          }];
        }

        // Deleting the migrated key
        delete rootObject.relatedObjects[keys[j]];
      }
    }
  }
};

var setConfig = function(pluginConfig) {
  this.displayStats = pluginConfig && !!pluginConfig.displayStats;
  this.collectionName = pluginConfig && pluginConfig.collectionName;
  this.nomnomuml = pluginConfig && !!pluginConfig.nomnomuml;
};

module.exports = {
  init: setConfig,
  formatResults: getUml
};


// We store modules instead of in separate files because this plugin is called from the 
// command line and the CLI tool used doesn't use require() but load()


/********************
 *  PlantUML module *
 ********************/

var toStringPlantUML = function(rootObject) {
  
  var toReturn = [];

  toReturn.push('@startuml');
  toReturn.push(objectToStringPlantUML.bind(this)(rootObject));  
  toReturn.push('@enduml');

  return toReturn.join('\n');
};

var objectToStringPlantUML = function(currentObject) {
  var toReturn = [];
  var currentName = currentObject.name;

  // Adding block
  var objectName = 'object ';
  if(this.displayStats && currentObject.stats) {
    objectName += ' "' + currentName + ' (' +(Math.round(currentObject.stats * 100) / 100) + '%)" as ' + currentName;    
  } else {
    objectName += currentName;
  }
  objectName += ' {';
  toReturn.push(objectName);

  // adding fields
  toReturn = toReturn.concat(currentObject.fields ? currentObject.fields.sort(function(a,b) { return a.stats > b.stats ? -1 : 1; }).map(fieldToStringPlantUML.bind(this)) : []);  
  toReturn.push('}');

  // Adding links if needed
  if(currentObject.relatedObjects) {
    var keys = Object.keys(currentObject.relatedObjects);
    for(var j=0; j<keys.length; j++) {
      toReturn.push(objectToStringPlantUML.bind(this)(currentObject.relatedObjects[keys[j]].related));
      toReturn.push(
        currentName + ' "1" -- ' + (currentObject.relatedObjects[keys[j]].isMany ? '"*" ' : '"1" ' ) + currentObject.relatedObjects[keys[j]].related.name
      );
    }
  }
  return toReturn.join('\n');
};

var fieldToStringPlantUML = function(field) {
  var current = field.name + ': ' + field.types.join(',');
  if(this.displayStats)
    current += ' (' + (Math.round(field.stats * 100) / 100) + '%)';
 
  return '\t' + current;
};





/*********************
 *  NomnomUML module *
 ********************/



var toStringNomnomUML = function(rootObject) {
  if(!this.seenObjects)
    this.seenObjects = {};

  var toReturn = [];

  var currentName = rootObject.name, i=0;
  // while(this.seenObjects[currentName]) {
  //   i++;
  //   currentName = rootObject.name + i;
  // }
  // this.seenObjects[currentName] = true;

  // Adding block
  toReturn.push(
    '[' + currentName + (this.displayStats && rootObject.stats ? ('|' + (Math.round(rootObject.stats * 100) / 100) + '%') : '') + (rootObject.fields ? '|' + rootObject.fields.sort(function(a,b) { return a.stats > b.stats ? -1 : 1; }).map(fieldToStringNomNomUML.bind(this)).join(';') 
      : '') + ']'
  );

  // Adding links if needed
  if(rootObject.relatedObjects) {
    var keys = Object.keys(rootObject.relatedObjects);
    for(var j=0; j<keys.length; j++) {
      toReturn.push(toStringNomnomUML.bind(this)(rootObject.relatedObjects[keys[j]].related));
      toReturn.push(
        '[' + currentName + ']' + '1-' + (rootObject.relatedObjects[keys[j]].isMany ? '*' : '1') + '[' + rootObject.relatedObjects[keys[j]].related.name + ']'
      );
    }
  }

  return toReturn.join('\n');
};

var fieldToStringNomNomUML = function(field) {
  var current = field.name + ': ' + field.types.join(',');
  if(this.displayStats)
    current += ' ('+ (Math.round(field.stats * 100) / 100) + '%)';
 
  return current;
};
