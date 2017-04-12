initialResultSize = 40

module.exports = OpenClipArt =

  jqXHR: null

  search: (query, options, callback) ->
    # abort the last request
    OpenClipArt.jqXHR?.abort()

    url = "https://openclipart.org/search/json/?query=#{encodeURIComponent query}&sort=downloads&page=#{options.page}&amount=24"
    OpenClipArt.jqXHR = $.getJSON url, (data) ->
      results = []
      page = Math.min(data?.info?.current_page or 0, 20)
      numPages = Math.min(data?.info?.pages or 0, 20)
      for item in data?.payload
        results.push
          image: item.svg.png_thumb
          metadata:
            source: 'search'
            title: item.title
            description: item.description
            link: item.detail_link
      callback results, page, numPages

