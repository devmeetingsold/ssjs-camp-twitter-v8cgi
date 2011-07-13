{
  "views": {
    "all": {
      "map": "function(doc) { emit(doc.timestamp, doc); }"
    },
    "by_author": {
      "map": "function(doc) { emit(doc.author, doc); }"
    }
  }
}