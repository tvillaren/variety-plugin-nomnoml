var getNomnoml = function(varietyResults) {

  var rootObject = {};
  rootObject.name = this.collectionName || "No name";

  for(var i=0; i<varietyResults.length; i++) {
    handleRootKey.bind(this)(varietyResults[i], rootObject);
  }

  return toString.bind(this)(rootObject);
};
  
var handleRootKey = function(key, currentObject) {

  if(key.value.types === 'Object')
    return handleLinkedObject.bind(this)(key, currentObject, false);
   
  if(key.value.types === 'Array')
    return handleLinkedObject.bind(this)(key, currentObject, true);

  // Handled in the linked object  
  if(key._id.key.indexOf('.') > -1) 
    return handleDeepKey.bind(this)(key, currentObject);
  
  return handleKey.bind(this)(key, currentObject);
};

var handleKey = function(key, currentObject) {
  if(!currentObject.fields)
    currentObject.fields = [];

  var current = key._id.key + ': ' + key.value.types;
  if(this.displayStats)
    current += ' ('+ (Math.round(key.percentContaining * 100) / 100) + '%)';
  currentObject.fields.push(current);
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
  if(typeof path === 'object' && this.displayStats) {
    fromObject.relatedObjects[name].related.stats = (Math.round(path.percentContaining * 100) / 100);
  }
  
  return fromObject.relatedObjects[name].related;
};

var toString = function(rootObject) {
  var toReturn = [];

  // Adding block
  toReturn.push(
    '[' + rootObject.name + (rootObject.stats !== undefined ? ('|' + rootObject.stats + '%') : '') + (rootObject.fields ? '|' + rootObject.fields.join(';') : '') + ']'
  );

  // Adding links if needed
  if(rootObject.relatedObjects) {
    for(var j=0; j<rootObject.relatedObjects.length; j++) {
      toReturn.push(toString(rootObject.relatedObjects[j].related));
      toReturn.push(
        '[' + rootObject.name + ']' + '-' + (rootObject.relatedObjects[j].isMany ? '*' : '1') + '[' + rootObject.relatedObjects[j].related.name + ']'
      );
    }
  }

  return toReturn.join('\n');
};


var setConfig = function(pluginConfig) {
  this.displayStats = pluginConfig && !!pluginConfig.displayStats;
  this.collectionName = pluginConfig && pluginConfig.collectionName;
};

module.exports = {
  init: setConfig,
  formatResults: getNomnoml
};