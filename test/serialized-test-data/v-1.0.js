module.exports = {
  'version': 1,
  'filename': 'sample model',
  'nodes': [
    {
      'key': 'a',
      'data': {
        'title': 'Chicken',
        'x': 200,
        'y': 180,
        'image': 'img/nodes/chicken.png',
        'key': 'a'
      }
    },
    {
      'key': 'b',
      'data': {
        'title': 'Egg',
        'x': 90,
        'y': 74,
        'image': 'img/nodes/egg.png',
        'key': 'b'
      }
    }
  ],
  'links': [ {
    'sourceNode': 'a',
    'targetNode': 'b',
    'sourceTerminal': 'a',
    'targetTerminal': 'b',
    'title': 'Becomes a',
    'color': '#777'
  } ],
  'palette': [
    {
      'image': 'img/nodes/chicken.png',
      'key': 'img/nodes/chicken.png',
      'title': 'Chicken',
      'metadata': {
        'title': 'Chicken',
        'source': 'external',
        'link': null,
        'license': 'public domain'
      }
    },
    {
      'image': 'img/nodes/egg.png',
      'key': 'img/nodes/egg.png',
      'title': 'Egg',
      'metadata': {
        'title': 'Egg',
        'source': 'external',
        'link': null,
        'license': 'public domain'
      }
    },
    {
      'title': '',
      'image': 'img/nodes/blank.png',
      'key': 'img/nodes/blank.png',
      'metadata': {
        'source': 'internal',
        'title': 'Blank',
        'link': null,
        'license': 'public domain'
      }
    }
  ]
};
