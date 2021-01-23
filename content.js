// keys for saved data layer names
var keys =	[
	"customDataLayer1", 
	"customDataLayer2", 
	"customDataLayer3", 
	"customDataLayer4", 
	"customDataLayer5", 
	"customDataLayer6", 
	"customDataLayer7", 
	"customDataLayer8"
];

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.action == "getData"){
		
		// listen for custom event from injected code
		document.addEventListener('sendDataLayerInformation', function(e) {
			if (e.detail != undefined){
				sendResponse(e.detail);
			}
		});
		
		// get saved data layer names to search for
		chrome.storage.sync.get(["customDataLayer1", "customDataLayer2", "customDataLayer3", "customDataLayer4", "customDataLayer5", "customDataLayer6", "customDataLayer7", "customDataLayer8"], function(items) {
			
			// get a list of non empty values
			var values = [];
			for(var i = 1; i <= Object.keys(items).length; i++) {
				var currentValue = items["customDataLayer"+i];
				(currentValue.length>0) && (values.push(items["customDataLayer"+i]))
			}

			// return no data if no data layer name is declared
			if(values.length===0) {
				var injectionCode = `
					document.dispatchEvent(new CustomEvent('sendDataLayerInformation', {
						detail: {
							url: document.location.href,
							data: []
						}
					}));
				`
			}
			
			// create injection code to search for provided data layer names
			var injectionCode = `setTimeout(function(){
				var keyList = ['`+values.join("','")+`'];
				var resultList = [];	
				for(var i=0; i<keyList.length; i++) {
					if(keyList[i].indexOf(".")!==-1) {
						if(window[keyList[i].split(".")[0]]) {
							var keyArray = keyList[i].split(".");
							var dataObject = window[keyArray[0]];
							for(var j = 1; j < keyArray.length; j++) {
								if(typeof(dataObject)=='object') {
									dataObject = dataObject[keyArray[j]];
								}
							}
							nestedObject = [keyArray[0], (JSON.stringify(dataObject, null, 2)||"")];
							resultList.push(nestedObject);
						}
					} else if(window[keyList[i]]) {
						dataObject = [keyList[i], (JSON.stringify(window[keyList[i]], null, 2)||"")];
						resultList.push(dataObject);
					}
				}
				document.dispatchEvent(new CustomEvent('sendDataLayerInformation', {
					detail: {
						url: document.location.href,
						data: resultList
					}
				}));
				document.getElementById('simpleDataLayerScript').remove();
			}, 0);
			`;
			
			// append script to current page
			var script = document.createElement('script');
			script.id = 'simpleDataLayerScript';
			script.textContent = injectionCode;
			(document.head||document.documentElement).appendChild(script);	
		});				
	}
});