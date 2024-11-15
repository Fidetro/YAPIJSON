function getCurrentTabUrl(callback) {

  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {

    var tab = tabs[0];

    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });


}



document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
  


  });

  var swiftClassBtn = document.getElementById("getSwiftClassResults");
  swiftClassBtn.onclick = getSwiftClassResults;


});



chrome.tabs.executeScript(null, { file: "common.js" });
chrome.tabs.executeScript(null, { file: "printer.js" });

function getSwiftClassResults() {
  chrome.tabs.executeScript(null, { file: "swift_class_parse.js" });
  window.close();
}
