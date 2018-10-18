/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ImageDialogStore = require("../stores/image-dialog-store");

const OpenClipart = require('../utils/open-clipart');
const tr = require('../utils/translate');

const {div, input, button, img, i, a, form, br, span} = React.DOM;

const ImageSearchResult = React.createFactory(React.createClass({
  displayName: 'ImageSearchResult',

  getInitialState() {
    return {loaded: false};
  },

  componentDidMount() {
    const image = new Image();
    image.src = this.props.imageInfo.image;
    return image.onload = () => {
      if (!this.unmounted) { return this.setState({loaded: true}); }
    };
  },

  componentWillUnmount() {
    return this.unmounted = true;
  },

  clicked() {
    return ImageDialogStore.actions.update(this.props.imageInfo);
  },

  render() {
    const src = this.state.loaded ? this.props.imageInfo.image : 'img/bb-chrome/spin.svg';
    if (!this.props.isDisabled(this.props.imageInfo)) {
      return (img({src, onClick: this.clicked, title: this.props.imageInfo.metadata.title}));
    } else {
      return null;
    }
  }
})
);

const ImageSearchPageLink = React.createFactory(React.createClass({
  displayName: 'ImageSearchPageLink',

  selectPage(e) {
    e.preventDefault();
    e.stopPropagation();
    return this.props.selectPage(this.props.page);
  },

  render() {
    if (this.props.currentPage === this.props.page) {
      return (span({className: 'image-search-page-link'}, this.props.page));
    } else {
      return (a({className: 'image-search-page-link', href: '#', onClick: this.selectPage}, this.props.page));
    }
  }
})
);

const ImageSearchPrevNextLink = React.createFactory(React.createClass({
  displayName: 'ImageSearchPrevNextLink',

  selectPage(e) {
    e.preventDefault();
    e.stopPropagation();
    return this.props.selectPage(this.props.page);
  },

  render() {
    if (this.props.enabled) {
      return (a({className: 'image-search-prev-next-link', href: '#', onClick: this.selectPage}, this.props.label));
    } else {
      return (span({className: 'image-search-prev-next-link', style: {color: "#777"}}, this.props.label));
    }
  }
})
);

module.exports = React.createClass({
  displayName: 'ImageSearch',

  mixins: [require('../mixins/image-dialog-view', ImageDialogStore.mixin)],

  getInitialState() {
    return this.getInitialImageDialogViewState({
      searching: false,
      searched: false,
      results: [],
      page: 1,
      numPages: 0
    });
  },

  searchClicked(e) {
    e.preventDefault();
    return this.search({
      page: 1,
      newSearch: true
    });
  },

  selectPage(page) {
    return this.search({
      page,
      newSearch: false
    });
  },

  search(options) {
    const query = $.trim(this.refs.search.value);
    const validQuery = query.length > 0;
    this.setState({
      query,
      searchable: validQuery,
      searching: validQuery,
      searched: false,
      results: [],
      page: options.newSearch ? 1 : options.page,
      numPages: options.newSearch ? 0 : this.state.numPages
    });

    if (validQuery) {
      return OpenClipart.search(query, options, (results, page, numPages) => {
        return this.setState({
          searching: false,
          searched: true,
          results,
          page,
          numPages
        });
      });
    }
  },

  componentDidMount() {
    return this.refs.search.focus();
  },

  isDisabledInInternalLibrary(node) {
    return this.props.inPalette(node);
  },

  isDisabledInExternalSearch(node) {
    return (this.props.inPalette(node)) || (this.props.inLibrary(node));
  },

  renderPagination() {
    let page;
    if (this.state.numPages > 0) {
      return (div({key: "pagination", className: "image-search-dialog-pagination"},
        (ImageSearchPrevNextLink({key: "prev", page: this.state.page - 1, label: (tr("~IMAGE-BROWSER.PREVIOUS")), selectPage: this.selectPage, enabled: this.state.page > 1})),
        ((() => {
        let asc, end;
        const result = [];
        for (page = 1, end = this.state.numPages, asc = 1 <= end; asc ? page <= end : page >= end; asc ? page++ : page--) {
          result.push(ImageSearchPageLink({key: `page${page}`, page, currentPage: this.state.page, selectPage: this.selectPage}));
        }
        return result;
      })()),
        (ImageSearchPrevNextLink({key: "next", page: this.state.page + 1, label: (tr("~IMAGE-BROWSER.NEXT")), selectPage: this.selectPage, enabled: this.state.page < this.state.numPages}))
      ));
    }
  },

  render() {
    let index, node;
    const showNoResultsAlert = this.state.searchable && this.state.searched && (this.state.results.length === 0);
    const noResultsClass = showNoResultsAlert ? ' no-results' : '';

    return (div({className: 'image-search-dialog'},
      (this.props.selectedImage != null ? this.props.selectedImage.image : undefined) ?
        this.renderPreviewImage()
      :
        (div({},
          (div({className: 'image-search-dialog-form'},
            (form({},
              (input({type: 'text', ref: 'search', defaultValue: this.state.query, placeholder: tr('~IMAGE-BROWSER.SEARCH_HEADER')})),
              (input({type: 'submit', value: (tr("~IMAGE-BROWSER.SEARCH_BUTTON_LABEL")), onClick: this.searchClicked}))
            ))
          )),

          showNoResultsAlert ?
            (div({className: 'modal-dialog-alert'},
              tr('~IMAGE-BROWSER.NO_IMAGES_FOUND'),
              (br({})),
              tr('~IMAGE-BROWSER.TRY_ANOTHER_SEARCH')
            )) : undefined,

          (div({className: `image-search-main-results${noResultsClass}`},[
            showNoResultsAlert ?
              (div({key: 'image-search-section', className: 'image-search-section', style: {height: '100%'}},[
                (div({key:'image-search-results', className: 'image-search-dialog-results show-all'},
                  (() => {
                  const result = [];
                  const iterable = _.map(this.props.internalLibrary);
                  for (index = 0; index < iterable.length; index++) {
                    node = iterable[index];
                    if (node.image) {
                      if (node.image) { result.push((ImageSearchResult({key: index, imageInfo: node, clicked: this.imageSelected, isDisabled: this.isDisabledInInternalLibrary}))); } else {
                        result.push(undefined);
                      }
                    } else {
                      result.push(undefined);
                    }
                  }
                  return result;
                })()
                ))
              ]))
            :
              (div({key: 'image-search-section-post-search', className: 'image-search-section', style: {height: '100%'}},[
                (div({key: 'results', className: "image-search-dialog-results"},
                  this.state.searching ?
                    (div({},
                      (i({className: "icon-codap-options spin"})),
                      ' ',
                      tr("~IMAGE-BROWSER.SEARCHING", {
                        page: this.state.page === 1 ? (tr("~IMAGE-BROWSER.SEARCHING_FIRST_PAGE")) : (tr("~IMAGE-BROWSER.SEARCHING_PAGE", {page: this.state.page})),
                        query: this.state.query
                      })
                    ))
                  : this.state.searched && (this.state.results.length === 0) ?
                    tr('~IMAGE-BROWSER.NO_EXTERNAL_FOUND', {query: this.state.query})
                  :
                    (() => {
                      const result1 = [];
                      for (index = 0; index < this.state.results.length; index++) {
                        node = this.state.results[index];
                        result1.push((ImageSearchResult({key: index, imageInfo: node, clicked: this.imageSelected, isDisabled: this.isDisabledInExternalSearch})));
                      }
                      return result1;
                    })()
                )),
                this.renderPagination()
              ]))
          ]))
        ))
    ));
  }
});
