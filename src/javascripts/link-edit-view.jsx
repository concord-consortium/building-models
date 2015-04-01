var palettes    = [
  ['#4D6A6D','#798478', "#A0A083", "#C9ADA1", "#EAE0CC"],
  ['#351431','#775253', "#BDC696", "#D1D3C4", "#DFE0DC"],
  ['#D6F49D','#EAD637', "#CBA328", "#230C0F", "#A2D3C2"]
];
var LinkEditView = React.createClass({

  notifyChange: function(title, color, deleted) {
    deleted = !!deleted;
    var changeListener = this.props.onLinkChanged;
    var link = this.props.link;
    if (changeListener) { changeListener(link, title, color, deleted); }
  },
  
  changeTitle: function(evnt) {
    var link = this.props.link;
    var color = link.color;
    var title = evnt.target.value;
    this.notifyChange(title, color);
  },

  changeColor: function(color) {
    var link = this.props.link;
    var title = link.title;
    this.notifyChange(title, color);
  },

  render: function() {
    var link  = this.props.link;
    if (link) {
      var title = link.title;
      var color = link.color;
      var changeTitle = this.changeTitle;
      var changeColor = this.changeColor;
      var paletteNo = 2;

      var deleteLink = function(evnt) {
        this.notifyChange(title,color,true);
      }.bind(this);

      var pickColor = function(evnt){ 
        var color = $(evnt.target).css('background-color');
        this.changeColor(color);
      }.bind(this);
      
      var palette = palettes[paletteNo].map(function(colorCode) {
        var style = {"background-color": colorCode};
        return (<div className="colorChoice" style={style} onTouchEnd={pickColor} onClick={pickColor} />)
      });

      var deleteButton = (<button type='button' className="delete" onClick={deleteLink}> delete this link</button>);
      return (
        <div className="link-edit-view">
          <h2>{title}</h2>
          <div className="edit-row">
            {deleteButton}
          </div>
          <div className="edit-row">
            <label name="title">
              Title
            </label>
            <input type="text" name="title" value={title} onChange={changeTitle}/>
          </div>
          <div className="edit-row">
            <label name="color">
              Color
            </label>
            {palette}
          </div>
        </div>
      );
    }
    else {
      return (
        <div className="link-edit-view hidden"/>
      )
    }
  }

});

module.exports = LinkEditView;