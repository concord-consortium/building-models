RelationFactory  = require "../models/relation-factory"

linkColors = module.exports =
  default             :'#777'
  defaultFaded        : "rgba(120,120,120,0)"
  increase            : "rgba(232,93,100,1)"
  decrease            : "rgba(142,162,225,1)"
  transferModifier    : "rgba(232,93,100,1)"
  transferPipe        : "rgba(185,185,185,1)"
  increaseFaded       : "rgba(232,93,100,0.2)"
  decreaseFaded       : "rgba(142,162,225,0.2)"
  dashed              : "#aaa"
  selectedOutline     : "rgba(250,200,60,0.7)"
  customRelationship  : "#778"
  defaultLight        : '#233'
  fromLink            : (link) ->
    return linkColors.default if not link.relation?.formula?
    switch link.relation.formula
      when RelationFactory.added.formula then linkColors.increase
      when RelationFactory.subtracted.formula then linkColors.decrease
      when RelationFactory.proportionalSourceLess.formula then linkColors.decrease
      when RelationFactory.proportionalSourceMore.formula then linkColors.increase
      else linkColors.default
