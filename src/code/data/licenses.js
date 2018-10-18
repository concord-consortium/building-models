/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {option, optgroup} = React.DOM;

module.exports = {
  map: {
    'public domain': {
      label: 'Public Domain',
      fullLabel: 'Public Domain',
      link: 'http://en.wikipedia.org/wiki/Public_domain'
    },
    'creative commons': {
      'cc by': {
        label: 'Attribution Only',
        fullLabel: 'Creative Commons: Attribution Only',
        link: 'http://creativecommons.org/licenses/by/4.0'
      },
      'cc by-sa': {
        label: 'ShareAlike',
        fullLabel: 'Creative Commons: ShareAlike',
        link: 'http://creativecommons.org/licenses/by-sa/4.0'
      },
      'cc by-nd': {
        label: 'NoDerivatives',
        fullLabel: 'Creative Commons: NoDerivatives',
        link: 'http://creativecommons.org/licenses/by-nd/4.0'
      },
      'cc by-nc': {
        label: 'NonCommercial (NC)',
        fullLabel: 'Creative Commons: NonCommercial (NC)',
        link: 'http://creativecommons.org/licenses/by-nc/4.0'
      },
      'cc by-nc-sa': {
        label: 'NC-ShareAlike',
        fullLabel: 'Creative Commons: NC-ShareAlike',
        link: 'http://creativecommons.org/licenses/by-nc-sa/4.0'
      },
      'cc by-nc-nd': {
        label: 'NC-NoDerivatives',
        fullLabel: 'Creative Commons: NC-NoDerivatives',
        link: 'http://creativecommons.org/licenses/by-nc-nd/4.0'
      }
    }
  },

  getLicense(slug) {
    return this.map[slug] || this.map['creative commons'][slug] || {label: 'n/a', link: null};
  },

  getLicenseLabel(slug) {
    return (this.getLicense(slug)).label;
  },

  getRenderOptions(slug) {
    var slug;
    return [
      (option({key: `${slug}-public-domain`, value: 'public domain'}, (this.getLicenseLabel('public domain')))),
      (optgroup({key: `${slug}-opt-group`, label: 'Creative Commons'},
        (() => {
        const result = [];
        for (slug in this.map['creative commons']) {
          const license = this.map['creative commons'][slug];
          result.push((option({key: slug, value: slug}, license.label)));
        }
        return result;
      })())
      )
    ];
  }
};
