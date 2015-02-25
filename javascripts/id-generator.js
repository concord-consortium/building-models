var ids = {};

var idgen = function(scopeName) {
  ids[scopeName] = ids[scopeName] || 0;
  ids[scopeName] = ids[scopeName] + 1;
  return scopeName + "-" + ids[scopeName];
};

module.exports = idgen;