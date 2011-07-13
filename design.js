{
  "language": "javascript",
  "views":
  {
    "all": {
      "map": "function(doc) { emit(null, doc) }"
    },
    "by_lastname": {
      "map": "function(doc) { emit(doc.test, doc) }"
    }
  }
}