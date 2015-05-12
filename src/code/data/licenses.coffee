{option, optgroup} = React.DOM

module.exports =
  map:
    'public domain':
      label: 'Public Domain'
      fullLabel: 'Public Domain'
      link: 'http://en.wikipedia.org/wiki/Public_domain'
    'creative commons':
      'cc by':
        label: 'Attribution Only'
        fullLabel: 'Creative Commons: Attribution Only'
        link: 'http://creativecommons.org/licenses/by/4.0'
      'cc by-sa':
        label: 'ShareAlike'
        fullLabel: 'Creative Commons: ShareAlike'
        link: 'http://creativecommons.org/licenses/by-sa/4.0'
      'cc by-nd':
        label: 'NoDerivatives'
        fullLabel: 'Creative Commons: NoDerivatives'
        link: 'http://creativecommons.org/licenses/by-nd/4.0'
      'cc by-nc':
        label: 'NonCommercial (NC)'
        fullLabel: 'Creative Commons: NonCommercial (NC)'
        link: 'http://creativecommons.org/licenses/by-nc/4.0'
      'cc by-nc-sa':
        label: 'NC-ShareAlike'
        fullLabel: 'Creative Commons: NC-ShareAlike'
        link: 'http://creativecommons.org/licenses/by-nc-sa/4.0'
      'cc by-nc-nd':
        label: 'NC-NoDerivatives'
        fullLabel: 'Creative Commons: NC-NoDerivatives'
        link: 'http://creativecommons.org/licenses/by-nc-nd/4.0'

  getLicense: (slug) ->
    @map[slug] or @map['creative commons'][slug] or {label: 'n/a', link: null}

  getLicenseLabel: (slug) ->
    (@getLicense slug).label

  getRenderOptions: (slug) ->
    [
      (option {value: 'public domain'}, (@getLicenseLabel 'public domain'))
      (optgroup {label: 'Creative Commons'},
        (option {key: slug, value: slug}, license.label) for slug, license of @map['creative commons']
      )
    ]
