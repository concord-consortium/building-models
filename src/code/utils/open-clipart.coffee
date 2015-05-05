initialResultSize = 12

module.exports = OpenClipArt =

  jqXHR: null

  search: (query, options, callback) ->
    # abort the last request
    OpenClipArt.jqXHR?.abort()

    url = "https://openclipart.org/search/json/?query=#{encodeURIComponent query}&sort=downloads&amount=#{if options.limitResults then initialResultSize else 200}" # 200 is max amount for api
    OpenClipArt.jqXHR = $.getJSON url, (data) ->
      results = []
      numMatches = Math.min(parseInt(data?.info?.results or '0', 10), 200)
      for item in data?.payload
        results.push
          image: item.svg.png_thumb
          metadata:
            title: item.title
            description: item.description
            link: item.detail_link
      callback results, numMatches

