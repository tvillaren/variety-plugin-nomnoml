var getNomnoml = function(varietyResults) {

  var rootObject = {};
  rootObject.name = this.collectionName || "No name";

  for(var i=0; i<varietyResults.length; i++) {
    handleRootKey.bind(this)(varietyResults[i], rootObject);
  }

  factorArray.bind(this)(rootObject);

  return toString.bind(this)(rootObject);
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

  path._id.key = splittedPath[splittedPath.length-1];

  // And adding the field to the last bit
  handleKey(path, currentObject);
};

var handleLinkedObject = function(path, fromObject, isArray) {
  var name = (typeof path === 'object') ? path._id.key : path;

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
      if(rootObject.relatedObjects[keys[j]].isMany && !rootObject.relatedObjects[keys[j]].related.fields) {
        
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

var toString = function(rootObject) {
  var toReturn = [];

  // Adding block
  toReturn.push(
    '[' + rootObject.name + (this.displayStats && rootObject.stats ? ('|' + (Math.round(rootObject.stats * 100) / 100) + '%') : '') + (rootObject.fields ? '|' + rootObject.fields.map(fieldToString.bind(this)).join(';') : '') + ']'
  );

  // Adding links if needed
  if(rootObject.relatedObjects) {
    var keys = Object.keys(rootObject.relatedObjects);
    for(var j=0; j<keys.length; j++) {
      toReturn.push(toString.bind(this)(rootObject.relatedObjects[keys[j]].related));
      toReturn.push(
        '[' + rootObject.name + ']' + '1-' + (rootObject.relatedObjects[keys[j]].isMany ? '*' : '1') + '[' + rootObject.relatedObjects[keys[j]].related.name + ']'
      );
    }
  }

  return toReturn.join('\n');
};

var fieldToString = function(field) {
  var current = field.name + ': ' + field.types.join(',');
  if(this.displayStats)
    current += ' ('+ (Math.round(field.stats * 100) / 100) + '%)';
 
  return current;
};


var setConfig = function(pluginConfig) {
  this.displayStats = pluginConfig && !!pluginConfig.displayStats;
  this.collectionName = pluginConfig && pluginConfig.collectionName;
};

module.exports = {
  init: setConfig,
  formatResults: getNomnoml
};