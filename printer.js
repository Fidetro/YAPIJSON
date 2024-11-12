var Printer = {
  init: function () {
    var printer = {};
    printer.dent = "";
    printer.str = "";
    printer.indent = function () {      
      printer.dent += printer.tab();      
    }

    printer.outdent = function () {      
      //删除最后一个tab
      printer.dent = printer.dent.substring(0, printer.dent.length - printer.tab().length);            
    }

    printer.tab = function () {
       return "\t";
    }
    

    printer.print = function (str) {     
     //所有换行符后面加上printer.dent
    //  console.log(str);
      str = str.replace(/\n/g, "\n" + printer.dent);
      printer.str += str;     
    }
    return printer
  },
};
