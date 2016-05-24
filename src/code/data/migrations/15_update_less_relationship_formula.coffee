migration =
  version: "1.14.0"
  description: "Clamp less-and-less relationship to go down to zero. Fixes case where input values below 0 would produce imaginary number results"
  date: "2016-05-24"

  doUpdate: (data) ->
  
    for link in data.links
      if link.relation.formula == "maxIn - 21.7 * log(in+1)"
        link.relation.formula = "maxIn - 21.7 * log(max(1,in))"
      if link.relation.formula == "1 * 21.7 * log(in+1)"
        link.relation.formula = "1 * 21.7 * log(max(1,in))"

module.exports = _.mixin migration, require './migration-mixin'

