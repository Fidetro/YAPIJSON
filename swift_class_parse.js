var text = "";
var protocols = "";
var dataType = "";
var swiftType = 0;
var modelNames = [];
function parseJSON(json) {
  text = "";
  protocols = "";
  dataType = "";
  modelNames = [];
  var req_query = json["data"]["req_query"];

  if (req_query.length <= 0) {
    req_query = json["data"]["req_body_form"];
  } else if (req_query.length <= 0) {
    req_query = extractProperties(json["data"]["req_body_other"]);
  }

  let body = JSON.parse(json["data"]["res_body"]);
  modelNames = [];
  parseProperties(body["properties"], modelNames, swiftParse);
  text = protocols + "\n" + text;


  text += "\n";
  var requestURI = json["data"]["path"];
  var method = json["data"]["method"] == "POST" ? "post" : "get";
  text += generateRequest(requestURI, req_query, method, "", "", "");

  copy(text, null);
}

function swiftParse(arr, properties, modelIndex) {
  text += "public struct " + "Model" + modelIndex + " : Decodable {" + "\n";
  var lastIndex = 0;
  for (var i in arr) {
    var propertyName = arr[i];
    var type = properties[propertyName]["type"];
    var desc = properties[propertyName]["description"];
    var wrapperDesc = "";
    if (type == "string") {
      type = "String";
      wrapperDesc = "@DefaultEmptyString";
    } else if (type == "boolean") {
      type = "Bool";
      wrapperDesc = "@DefaultFalse";
    } else if (type == "number") {
      type = "Int";
      wrapperDesc = "@DefaultZero";
    } else if (type == "integer") {
      type = "Int";
      wrapperDesc = "@DefaultZero";
    } else if (type == "object") {
      // modelNames中最后一个相同的属性名
      lastIndex = modelNames.lastIndexOf(propertyName);
      lastIndex = lastIndex == -1 ? modelNames.length : lastIndex;
      lastIndex = lastIndex + 1;
      type = "Model" + lastIndex + "?";
    } else if (type == "array") {
      var itemType = properties[propertyName]["items"]["type"];
      if (itemType == "string") {
        type = "[String]";
        wrapperDesc = "@DefaultEmptyArray<String>";
      } else if (itemType == "number") {
        type = "[Int]";
        wrapperDesc = "@DefaultEmptyArray<Int>";
      } else if (itemType == "long") {
        type = "[Int]";
        wrapperDesc = "@DefaultEmptyArray<Int>";
      } else if (itemType == "integer") {
        type = "[Int]";
        wrapperDesc = "@DefaultEmptyArray<Int>";
      } else {
        // modelNames中最后一个相同的属性名
        lastIndex = modelNames.lastIndexOf(propertyName);
        lastIndex = lastIndex == -1 ? modelNames.length : lastIndex;
        lastIndex = lastIndex + 1;
        type = "[" + "Model" + lastIndex + "]";
        wrapperDesc = "@DefaultEmptyArray<" + "Model" + lastIndex + ">";
      }
    } else {
      type = "Any";
    }
    if (desc == null) {
      text += "// <#Description#>";
    } else {
      text += "//" + desc + "";
    }
    if (modelIndex == 0 && propertyName == "data") {
      dataType = type;
      if (type.substr(-1) == "?") {
        dataType = dataType.slice(0, -1);
      }
    }

    text += "\n";
    if (wrapperDesc.length > 0) {
      text += wrapperDesc + " " + "var " + propertyName + " : " + type;
    } else {
      text += "var " + propertyName + " : " + type;
    }

    text += "\n";
  }
  text += "}" + "\n";
}


function extractProperties(jsonString) {
  try {
    // 解析 JSON 字符串
    const jsonObject = JSON.parse(jsonString);

    // 递归函数，用于从 properties 中提取默认值
    function parseProperties(properties) {
      const result = {};
      for (const key in properties) {
        const property = properties[key];
        if (property.type === 'object' && property.properties) {
          // 对象类型递归解析其内部 properties
          result[key] = parseProperties(property.properties);
        } else if (property.type === 'number') {
          result[key] = 0; // 数字类型默认值为 0
        } else if (property.type === 'string') {
          result[key] = ""; // 字符串类型默认值为空字符串
        } else if (property.type === 'boolean') {
          result[key] = false; // 布尔类型默认值为 false
        } else {
          result[key] = null; // 其他类型默认值为 null
        }
      }
      return result;
    }

    // 提取 properties 的 JSON 对象
    return parseProperties(jsonObject.properties);
  } catch (error) {
    console.error("解析 JSON 时出错:", error);
    return null;
  }
}


function generateRequest(path, queryBody, httpMethod, printer) {
  var key = "show.fx";
  let paths = path.split("/");
  //如果paths大于3个，只取后面的三个
  if (paths.length > 3) {
    paths = paths.slice(paths.length - 3);
  }

  paths.forEach(function (item, index) {
    if (item.length > 0) {
      key += "." + lcfirst(parsePathName(item));
    }
  });

  printer.print("\nFANetworking<" + dataType + ">");
  printer.print('(key: "' + key + '")');
  if (queryBody.length > 0) {
    printer.print(".params(params)");
  }

  if (httpMethod == "GET") {
    printer.print(".method(.GET)");
  } else {
    printer.print(".method(.POST)");
  }
  printer.print(".request {");
  printer.indent();
  printer.print("\n");

  printer.print("switch $0 {\n");

  printer.print("case .success(let model):");
  printer.indent();
  printer.print("\n");
  printer.outdent();
  if (swiftType == 1) {
    printer.print("success?(model)\n");
  } else {
    printer.print("observable.on(.next(model))\n");
  }


  printer.print("case .failure(let error):");
  printer.indent();
  printer.print("\n");
  printer.outdent();
  if (swiftType == 1) {
    printer.print("failure?(error)\n");
  } else {
    printer.print("observable.on(.error(error))\n");
  }
  printer.print("}");
  printer.outdent();
  printer.print("\n}");
  if (swiftType == 2) {
    printer.print("\nreturn observable");
  }
}


function objectToSwiftDictionary(obj) {
  if (obj == null
    || obj.length == 0) {
      return "nil";
    }
  // 递归处理对象，生成 Swift 字典格式字符串
  function parseObject(object) {
    let result = "[\n";
    for (const [key, value] of Object.entries(object)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // 如果值是嵌套对象，递归调用 parseObject
        result += `  "${key}": ${parseObject(value)},\n`;
      } else {
        // 直接使用 key 作为值
        result += `  "${key}": ${key},\n`;
      }
    }
    result += "]";
    return result;
  }

  // 将结果返回并格式化
  return parseObject(obj);
}

function objectToSwiftInit(obj) {
  if (obj == null
    || obj.length == 0) {
    return "";
  }

  let initParams = [];
  let initBody = [];

  // 递归解析对象的键值
  function parseObject(object, prefix = "") {
    for (const [key, value] of Object.entries(object)) {
      const paramName = key;

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // 对象类型：递归展开内部属性
        parseObject(value, paramName);
      } else {
        // 基础类型：根据 JavaScript 类型设置 Swift 类型
        let swiftType;
        if (typeof value === "number") {
          swiftType = Number.isInteger(value) ? "Int" : "Double";
        } else if (typeof value === "string") {
          swiftType = "String";
        } else if (typeof value === "boolean") {
          swiftType = "Bool";
        } else {
          swiftType = "Any"; // 其他类型作为 Any 处理
        }

        // 添加到 init 方法参数和 body
        initParams.push(`${paramName}: ${swiftType}`);
        initBody.push(`self.${paramName} = ${paramName}`);
      }
    }
  }

  // 解析顶层对象
  parseObject(obj);

  // 构建 Swift init 方法字符串
  const initMethod = `init(${initParams.join(", ")}) {\n  ${initBody.join("\n  ")}\n}`;
  return initMethod;
}



function objectToSwiftFlatProperties(obj) {
  let result = "";

  function parseObject(object) {
    for (const [key, value] of Object.entries(object)) {
      if (typeof value === "object" && value !== null) {
        // 如果是对象类型，递归解析其内部属性
        parseObject(value);
      } else if (typeof value === "string") {
        result += `let ${key}: String\n`;
      } else if (typeof value === "number") {
        result += `let ${key}: Int\n`;
      } else if (typeof value === "boolean") {
        result += `let ${key}: Bool\n`;
      } else {
        result += `let ${key}: Any?\n`;
      }
    }
  }

  parseObject(obj);
  return result;
}


function generateRequest(parseURI, queryBody, parseMethod, requestURI) {
  let swiftinit = objectToSwiftInit(queryBody);
  properties = objectToSwiftFlatProperties(queryBody);
  requestParam = objectToSwiftDictionary(queryBody);
  return `
public class XXXRequest {
  
  ${properties}
  
  ${swiftinit}
  
  public override func requestURI() -> String {
      return "${parseURI}"
  }
  
  public override func method() -> HTTPMethod {
      return .${parseMethod}
  }
  
  public override func parameters() -> Parameters? {
      return ${requestParam}
  }
  
  public func request(successHandler:((CommonResponse<Model1>) -> Void)? = nil ,failureHandler: ((Error) -> Void)?=nil ) {
      request(CommonResponse<Model1>.self) { result in
          switch result {
          case .success(let data):
              successHandler?(data)
          case .failure(let error):
              failureHandler?(error)
          }
      }
  }
  
}`;
}


//请求接口
function swiftMain(type) {
  swiftType = type;
  parseBlock((json) => {
    parseJSON(json);
  });
}

try {
  exports.swiftMain = swiftMain;
} catch (error) {
  swiftMain(1);
}
