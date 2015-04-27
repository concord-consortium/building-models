FLICKR_API_KEY = '1082174cc952ccc6a97412e9e14aaf88'

module.exports =
  search: (query, callback) ->
    url = "https://api.flickr.com/services/rest?method=flickr.photos.search&api_key=#{FLICKR_API_KEY}&tags=#{encodeURIComponent query}&is_commons=1&safe_search=1&format=json&jsoncallback=?"
    $.getJSON url, (data, textStatus, jqXHR) ->
      results = []
      for photo in data?.photos?.photo
        results.push
          title: photo.title
          image: "https://farm#{photo.farm}.staticflickr.com/#{photo.server}/#{photo.id}_#{photo.secret}_q.jpg"
      callback results
