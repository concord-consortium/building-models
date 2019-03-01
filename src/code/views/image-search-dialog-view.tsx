const _ = require("lodash");
import * as $ from "jquery";

import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { ImageDialogActions, ImageDialogMixinProps, ImageDialogMixinState, ImageDialogMixin } from "../stores/image-dialog-store";

import { OpenClipArt } from "../utils/open-clipart";
import { tr } from "../utils/translate";
import { ImageDialogViewMixin, ImageDialogViewMixinProps, ImageDialogViewMixinState } from "../mixins/image-dialog-view";
import { Mixer } from "../mixins/components";
import { internalLibrary, InternalLibraryItem } from "../data/internal-library";
import { Node } from "../models/node";
import { ImageInfo } from "./preview-image-dialog-view";

interface ImageSearchResultViewProps {
  imageInfo: ImageInfo;
  isDisabled: (imageInfo: ImageInfo) => boolean;
}

interface ImageSearchResultViewState {
  loaded: boolean;
}

class ImageSearchResultView extends React.Component<ImageSearchResultViewProps, ImageSearchResultViewState> {

  public static displayName = "ImageSearchResultView";

  public state = {loaded: false};

  private unmounted: boolean;

  public componentDidMount() {
    const image = new Image();
    image.src = this.props.imageInfo.image;
    image.onload = () => {
      if (!this.unmounted) { return this.setState({loaded: true}); }
    };
  }

  public componentWillUnmount() {
    this.unmounted = true;
  }

  public render() {
    const src = this.state.loaded ? this.props.imageInfo.image : "img/bb-chrome/spin.svg";
    if (!this.props.isDisabled(this.props.imageInfo)) {
      return <img src={src} onClick={this.handleClicked} title={this.props.imageInfo.metadata.title} />;
    } else {
      return null;
    }
  }

  private handleClicked = () => {
    ImageDialogActions.update(this.props.imageInfo);
  }
}

interface ImageSearchPageLinkViewProps {
  currentPage: number;
  page: number;
  selectPage: (page: number) => void;
}

interface ImageSearchPageLinkViewState {}

class ImageSearchPageLinkView extends React.Component<ImageSearchPageLinkViewProps, ImageSearchPageLinkViewState> {

  public static displayName = "ImageSearchPageLinkView";

  public render() {
    if (this.props.currentPage === this.props.page) {
      return <span className="image-search-page-link">{this.props.page}</span>;
    } else {
      return <a className="image-search-page-link" href="#" onClick={this.handleSelectPage}>{this.props.page}</a>;
    }
  }

  private handleSelectPage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.selectPage(this.props.page);
  }
}

interface ImageSearchPrevNextLinkViewProps {
  enabled: boolean;
  page: number;
  selectPage: (page: number) => void;
  label: string;
}

interface ImageSearchPrevNextLinkViewState {}

class ImageSearchPrevNextLinkView extends React.Component<ImageSearchPrevNextLinkViewProps, ImageSearchPrevNextLinkViewState> {

  public static displayName = "ImageSearchPrevNextLinkView";

  public render() {
    if (this.props.enabled) {
      return <a className="image-search-prev-next-link" href="#" onClick={this.handleSelectPage}>{this.props.label}</a>;
    } else {
      return <span className="image-search-prev-next-link" style={{color: "#777"}}>{this.props.label}</span>;
    }
  }

  private handleSelectPage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.selectPage(this.props.page);
  }
}

interface ImageSearchDialogViewOuterProps {
  internalLibrary: InternalLibraryItem[];
  inPalette: (node: Node) => boolean;
  inLibrary: (node: Node) => boolean;
}

type ImageSearchDialogViewProps = ImageSearchDialogViewOuterProps & ImageDialogMixinProps & ImageDialogViewMixinProps;

interface ImageSearchDialogViewOuterState {
  searching: boolean;
  searched: boolean;
  searchable: boolean;
  results: ImageInfo[];
  page: number;
  numPages: number;
  query: string;
}
type ImageSearchDialogViewState = ImageSearchDialogViewOuterState & ImageDialogMixinState & ImageDialogViewMixinState;

export class ImageSearchDialogView extends Mixer<ImageSearchDialogViewProps, ImageSearchDialogViewState> {

  public static displayName = "ImageSearchDialogView";

  private imageDialogViewMixin: ImageDialogViewMixin;
  private input: HTMLInputElement | null;

  constructor(props: ImageSearchDialogViewProps) {
    super(props);
    this.imageDialogViewMixin = new ImageDialogViewMixin(this);

    this.mixins = [new ImageDialogMixin(this), this.imageDialogViewMixin];

    const outerState: ImageSearchDialogViewOuterState = {
      searching: false,
      searched: false,
      searchable: false,
      results: [],
      page: 1,
      numPages: 0,
      query: ""
    };
    this.setInitialState(outerState, ImageDialogMixin.InitialState(), ImageDialogViewMixin.InitialState());
  }

  public componentDidMount() {
    // for mixins...
    super.componentDidMount();
    if (this.input) {
      this.input.focus();
    }
  }

  public render() {
    const havePreviewImage = !!(this.props.selectedImage && this.props.selectedImage.image);
    return (
      <div className="image-search-dialog">
        {havePreviewImage ? this.imageDialogViewMixin.renderPreviewImage() : this.renderDialogForm()}
      </div>
    );
  }

  private renderPagination() {
    let page;
    if (this.state.numPages > 0) {
      let asc, end;
      const links: JSX.Element[] = [];
      for (page = 1, end = this.state.numPages, asc = 1 <= end; asc ? page <= end : page >= end; asc ? page++ : page--) {
        links.push(<ImageSearchPageLinkView key={`page${page}`} page={page} currentPage={this.state.page} selectPage={this.handleSelectPage} />);
      }

      return (
        <div key="pagination" className="image-search-dialog-pagination">
          <ImageSearchPrevNextLinkView key="prev" page={this.state.page - 1} label={tr("~IMAGE-BROWSER.PREVIOUS")} selectPage={this.handleSelectPage} enabled={this.state.page > 1} />
          {links}
          <ImageSearchPrevNextLinkView key="next" page={this.state.page + 1} label={tr("~IMAGE-BROWSER.NEXT")} selectPage={this.handleSelectPage} enabled={this.state.page < this.state.numPages} />
        </div>
      );
    }
  }

  private renderDialogForm() {
    let index, node;
    const showNoResultsAlert = this.state.searchable && this.state.searched && (this.state.results.length === 0);
    const noResultsClass = showNoResultsAlert ? " no-results" : "";
    const noResultsItems: JSX.Element[] = [];
    const searchResultItems: JSX.Element[] = [];

    if (showNoResultsAlert) {
      const iterable = _.map(this.props.internalLibrary);
      for (index = 0; index < iterable.length; index++) {
        node = iterable[index];
        if (node.image) {
          if (node.image) {
            noResultsItems.push(<ImageSearchResultView key={index} imageInfo={node} isDisabled={this.handleIsDisabledInInternalLibrary} />);
          }
        }
      }
    }

    if (this.state.searched) {
      for (index = 0; index < this.state.results.length; index++) {
        node = this.state.results[index];
        searchResultItems.push(<ImageSearchResultView key={index} imageInfo={node} isDisabled={this.handleIsDisabledInExternalSearch} />);
      }
    }

    return (
      <div>
        <div className="image-search-dialog-form">
          <form>
            <input type="text" ref={el => this.input = el} defaultValue={this.state.query} placeholder={tr("~IMAGE-BROWSER.SEARCH_HEADER")} />
            <input type="submit" value={tr("~IMAGE-BROWSER.SEARCH_BUTTON_LABEL")} onClick={this.handleSearchClicked} />
          </form>
        </div>

        {showNoResultsAlert ?
          <div className="modal-dialog-alert">
            {tr("~IMAGE-BROWSER.NO_IMAGES_FOUND")}
            <br />
            {tr("~IMAGE-BROWSER.TRY_ANOTHER_SEARCH")}
          </div> : undefined}

        <div className={`image-search-main-results${noResultsClass}`}>
          {showNoResultsAlert ?
            <div key="image-search-section" className="image-search-section" style={{height: "100%"}}>
              <div key="image-search-results" className="image-search-dialog-results show-all">
                {noResultsItems}
              </div>
            </div>
            :
            <div key="image-search-section-post-search" className="image-search-section" style={{height: "100%"}}>
              <div key="results" className="image-search-dialog-results">
                {this.state.searching ?
                  <div>
                    <i className="icon-codap-options spin" /> {tr("~IMAGE-BROWSER.SEARCHING", {
                      page: this.state.page === 1 ? (tr("~IMAGE-BROWSER.SEARCHING_FIRST_PAGE")) : (tr("~IMAGE-BROWSER.SEARCHING_PAGE", {page: this.state.page})),
                      query: this.state.query
                    })}
                  </div>
                  : this.state.searched && (this.state.results.length === 0)
                    ? tr("~IMAGE-BROWSER.NO_EXTERNAL_FOUND", {query: this.state.query})
                    : searchResultItems}
              </div>
              {this.renderPagination()}
            </div>}
        </div>
      </div>
    );
  }

  private handleSearchClicked = (e) => {
    e.preventDefault();
    this.search({
      page: 1,
      newSearch: true
    });
  }

  private handleSelectPage = (page) => {
    this.search({
      page,
      newSearch: false
    });
  }

  private search(options) {
    const query = $.trim(this.input ? this.input.value : "");
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
      OpenClipArt.search(query, options, (results, page, numPages) => {
        this.setState({
          searching: false,
          searched: true,
          results,
          page,
          numPages
        });
      });
    }
  }

  private handleIsDisabledInInternalLibrary = (node) => {
    return this.props.inPalette(node);
  }

  private handleIsDisabledInExternalSearch = (node) => {
    return (this.props.inPalette(node)) || (this.props.inLibrary(node));
  }

}

