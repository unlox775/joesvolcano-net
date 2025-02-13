onEvent("button1", "click", function( ) {
  createRecord("test", {name:'Alice'}, function(record) {
    readRecords("test", {}, function(records) {
      setText("data", "Total Rows: "+ records.length);
    });
  });
  playSound("assets/default.mp3", false);
});
