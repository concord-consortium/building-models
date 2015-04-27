module.exports = OpenClipArt =
  
  jqXHR: null
  
  search: (query, options, callback) ->
    # abort the last request
    OpenClipArt.jqXHR?.abort()
    
    url = "https://openclipart.org/search/json/?query=#{encodeURIComponent query}&amount=#{if options.limitResults then 18 else 200}" # 200 is max amount for api
    OpenClipArt.jqXHR = $.getJSON url, (data) ->
      results = []
      numMatches = Math.min(parseInt(data?.info?.results or '0', 10), 200)
      for item in data?.payload
        results.push
          title: item.title
          image: item.svg.url #item.svg.png_thumb
      callback results, numMatches

