exports.config =
  # See http://brunch.io/#documentation for docs.
  plugins:
    # react:
    #   harmony: yes # include some es6 transforms
    #   autoIncludeCommentBlock: yes
    coffeescript:
      bare: true
  files:
    javascripts:
      joinTo:
        'app.js': /^app/
        'vendor.js': /^(bower_components|vendor)/
    stylesheets:
      joinTo:
        'app.css': /^app/
        'vendor.css': /^(bower_components|vendor)/
    templates:
      joinTo: 'app.js'