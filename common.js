function copy(id, attr) {
  try {
    var newWindow = window.open("");
    newWindow.document.write("<div class='copy'><pre class='pre'> </pre><div>");
    newWindow.document.getElementsByClassName("pre")[0].innerText = id;
    let target = null;
  
    target = newWindow.document.getElementsByClassName("pre")[0];
    newWindow.navigator.clipboard.writeText(id).then(() => {
      console.log("复制成功");
      newWindow.alert("复制成功");
    });
    newWindow.stop();
  } catch (error) {
    oldCopy(id,attr)
  }

}


function oldCopy(id,attr) {
  var newWindow = window.open("");
  newWindow.document.write("<div class='copy'><pre class='pre'> </pre><div>");
  newWindow.document.getElementsByClassName("pre")[0].innerText = id
  let target = null;
  
  target = newWindow.document.getElementsByClassName("pre")[0];    

  try {
    let range = newWindow.document.createRange();
    range.selectNode(target);
    newWindow.getSelection().removeAllRanges();
    newWindow.getSelection().addRange(range);
    newWindow.document.execCommand("copy");
    newWindow.getSelection().removeAllRanges();
    newWindow.alert("复制成功");


  } catch (e) {
    alert("复制失败");
  }

  if (attr) {
    // remove temp target
    target.parentElement.removeChild(target);
  }
}


  exports.copy = copy;

  function arrPushObj(arr,obj) {
    if (obj != null && Object.keys(obj).length != 0) {
      arr.push(obj)
    }
  }
  exports.arrPushObj = arrPushObj; 

  function getItemType(item) {
    //如果paramType为空，从type中获取
      if (item["paramType"] == null) {
        return item["type"];
      }
      return item["paramType"];
    }
    exports.getItemType = getItemType;
//首字母大写
function ucfirst(str) {
    str += '';
    return str.charAt(0).toUpperCase() + str.substr(1);
}
exports.ucfirst = ucfirst;
//首字母小写
function lcfirst(str) {
    str += '';
    return str.charAt(0).toLowerCase() + str.substr(1);
}

exports.lcfirst = lcfirst;

function parseBlock(block) {
    let arr = window.location.toString().split("/");
    let id = arr[arr.length - 1];
    let headers = new Headers();
    headers.append('Access-Control-Allow-Origin', '*');
    var host = window.location.host;
    fetch("http://"+host+"/api/interface/get?id=" + String(id),{
        credentials: 'include',
        headers:headers
    })
      .then((r) => r.text())
      .then((result) => {        
        var json = JSON.parse(result);
        if (json["errcode"] != 0) {
          alert(json["errmsg"]);
          return;
        }
        block(json);
      });
  }
  exports.parseBlock = parseBlock;

 //去掉-并-后面的字母大写
  function parsePathName2(name) {
    var arr = name.split("-");
    var newName = "";
    for (var i = 0; i < arr.length; i++) {
      if (i == 0) {
        newName += arr[i];
      } else {
        newName += ucfirst(arr[i]);
      }
    }
    return newName;
  }

  //去掉_并将_后面的字母大写
  function parsePathName(name) {
    let arr = name.split("_");
    let str = "";
    arr.forEach(function(item, index) {
      if (index == 0) {
        str += item;
      } else {
        str += ucfirst(item);
      }
    });
    str = parsePathName2(str);
    return str;
  }


  exports.parsePathName = parsePathName;


  

  function parseProperties(properties,modelNames,parseFunc) {
    var modelIndex = 0;
    var arr = [];
    var reArr = [];
    if (properties == null || Object.keys(properties).length == 0) {
      return;
    }
    for (var key in properties) {
      if (properties[key]["type"] == "object") {
        reArr.push(key);
        modelNames.push(key);
      } else if (properties[key]["type"] == "array") {
        reArr.push(key);
        if (properties[key]["items"]["type"] == "object") {
          modelNames.push(key);
        }
      } else if (Array.isArray(properties[key]["required"])) {
        reArr.push(key);
        modelNames.push(key);
      }
      arr.push(key);
    }
  
    parseFunc(arr, properties,modelIndex);

    modelIndex++;

    var recursionArr = [];
  
    for (var index in reArr) {
      var result = index == reArr.length - 1;
      let property = properties[reArr[index]];
      if (property["type"] == "object") {
        arrPushObj(recursionArr,property["properties"]);
      } else if (property["type"] == "array") {
        arrPushObj(recursionArr,property["items"]["properties"]);
      } else if (Array.isArray(property["required"])) {
        arrPushObj(recursionArr,property["properties"]);
      }
    }
    recursionProperties(recursionArr,modelIndex,modelNames,parseFunc);
  }

  exports.parseProperties = parseProperties;


  function recursionProperties(recursionArrs,modelIndex,modelNames,parseFunc) {
    var reArrs = [];
    for (var index in recursionArrs) {
      var properties = recursionArrs[index];
      var arr = [];
      var reArr = [];
      if (properties == null || Object.keys(properties).length == 0) {
        continue;
      }
      for (var key in properties) {    
        if (properties[key]["type"] == "object") {
          reArr.push(key);
          modelNames.push(key);
        } else if (properties[key]["type"] == "array") {
          reArr.push(key);        
          if (properties[key]["items"]["type"] == "object") {
          modelNames.push(key);
        }
        } else if (Array.isArray(properties[key]["required"])) {
          reArr.push(key);
          modelNames.push(key);
        }
        arr.push(key);
      }
      reArrs.push(reArr);
      parseFunc(arr, properties,modelIndex);
      modelIndex++;
    }
  
    var recursionArr = [];
    for (var x in recursionArrs) {
      let properties = recursionArrs[x];    
      if (properties == null || Object.keys(properties).length == 0) {
        continue;
      }
      for (var index in reArrs[x]) {
        let property = properties[reArrs[x][index]];
        if (property["type"] == "object") {    
          arrPushObj(recursionArr,property["properties"]);
        } else if (property["type"] == "array") {     
          arrPushObj(recursionArr,property["items"]["properties"]);        
        } else if (Array.isArray(property["required"])) {
          arrPushObj(recursionArr,property["properties"]);
        }
      }
    }
  
    if (recursionArr.length == 0) {
      return;
    }
    recursionProperties(recursionArr,modelIndex,modelNames,parseFunc)
  }