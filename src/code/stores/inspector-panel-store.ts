/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const InspectorPanelActions = Reflux.createActions(
  [
    "openInspectorPanel",
    "closeInspectorPanel"
  ]
);

const InspectorPanelStore = Reflux.createStore({
  listenables: [InspectorPanelActions],

  init() {
    return this.settings = {
      nowShowing: null,
      selectedLink: null
    };
  },

  onOpenInspectorPanel(nowShowing, options) {
    this.settings.nowShowing = nowShowing;
    if ((options != null ? options.link : undefined) != null) { this.settings.selectedLink = options.link; }
    return this.notifyChange();
  },

  onCloseInspectorPanel() {
    this.settings.nowShowing = null;
    return this.notifyChange();
  },

  notifyChange() {
    return this.trigger(_.clone(this.settings));
  }
});

const mixin = {
  getInitialState() {
    return _.clone(InspectorPanelStore.settings);
  },

  componentDidMount() {
    return this.inspectorPanelUnsubscribe = InspectorPanelStore.listen(this.onInspectorPanelStoreChange);
  },

  componentWillUnmount() {
    return this.inspectorPanelUnsubscribe();
  },

  onInspectorPanelStoreChange(newData) {
    return this.setState(_.clone(newData));
  }
};

module.exports = {
  actions: InspectorPanelActions,
  store: InspectorPanelStore,
  mixin
};
