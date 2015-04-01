var ProtoNodeView = require('./proto-node-view.jsx');

var protoNodes =[
  {
    "title": "Egg",
    "image": "https://dl.dropboxusercontent.com/u/73403/mysystem/images/egg2.png",
  },{  
    "title": "Chick",
    "image": "http://www.charlieschickencompany.com/IMAGES/pic5_09.jpg",
  },{
    "title": "Chicken",
    "image": "http://news.ucdavis.edu/photos_images/news_images/03_2011/chicken_lg.jpg",
  },{
    "title": "blank",
    "image": ""
  }];


var NodeWell = React.createClass({
  getInitialState: function() { 
    return {nodes: [] };
  },

 
  render: function() {
    var self = this;
 
    var nodeViews = protoNodes.map(function(node) {
      return (
        <ProtoNodeView key={node.title} image={node.image}/>
      );
    });
    return (
      <div className="node-well">
        {nodeViews}
      </div>
    );
  }

});

module.exports = NodeWell;