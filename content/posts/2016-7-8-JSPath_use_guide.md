---
layout: post
title: "JSPatch学习笔记"
description: "Tutorial"
comments: true
category: "iOS"
tags: [JSPatch, iOS, 开发]
---



## 依赖

* `JavascriptCore.framework`

* `<objc/runtime.h>`

## 原理

利用OC运行时特性，动态对指定类的方法进行增添或替换，以及注册新类等。

* 消息传递

通过JSContext以Block形式进行方法定义，然后在OC下执行，将返回值传给JS。参数类型都会通过JavascriptCore进行自动转换。


## 关键词

* **require**

	在JS全局作用域上创建一个同名变量，变量指向一个对象，对象属性 __clsName 保存类名，同时表明这个对象是一个 OC Class。

```js

var _require = function(clsName) {
  if (!global[clsName]) {
    global[clsName] = {
      __clsName: clsName
    }
  }
  return global[clsName]
}

```

* **defineClass**

	通过在`JPEngine`中向脚本全局注入`_OC_defineClass`方法，然后在JSPatch.js中调用`defineClass`方法，实质即调用OC的`_OC_defineClass`方法。

```objc

context[@"_OC_defineClass"] = ^(NSString *classDeclaration, JSValue *instanceMethods, JSValue *classMethods) {
        return defineClass(classDeclaration, instanceMethods, classMethods);
    };

```
	然后在js中的defineClass实现如下。
	参数列表：
	1. 类名字符串
	2. 属性列表，已经被转换为JS的数据类型
	3. 类的实例方法和类方法列表
```js

global.defineClass = function(declaration, properties, instMethods, clsMethods) {
    var newInstMethods = {}, newClsMethods = {}
    if (!(properties instanceof Array)) {
      clsMethods = instMethods
      instMethods = properties
      properties = null
    }

    var realClsName = declaration.split(':')[0].trim()

    _formatDefineMethods(instMethods, newInstMethods, realClsName)
    _formatDefineMethods(clsMethods, newClsMethods, realClsName)

    var ret = _OC_defineClass(declaration, newInstMethods, newClsMethods)
    var className = ret['cls']
    var superCls = ret['superCls']

    _ocCls[className] = {
      instMethods: {},
      clsMethods: {},
      props: {}
    }

    if (superCls.length && _ocCls[superCls]) {
      for (var funcName in _ocCls[superCls]['instMethods']) {
        _ocCls[className]['instMethods'][funcName] = _ocCls[superCls]['instMethods'][funcName]
      }
      for (var funcName in _ocCls[superCls]['clsMethods']) {
        _ocCls[className]['clsMethods'][funcName] = _ocCls[superCls]['clsMethods'][funcName]
      }
      if (_ocCls[superCls]['props']) {
        _ocCls[className]['props'] = JSON.parse(JSON.stringify(_ocCls[superCls]['props']));
      }
    }

    _setupJSMethod(className, instMethods, 1, realClsName)
    _setupJSMethod(className, clsMethods, 0, realClsName)

    if (properties) {
      properties.forEach(function(o){
        _ocCls[className]['props'][o] = 1
        _ocCls[className]['props']['set' + o.substr(0,1).toUpperCase() + o.substr(1)] = 1
      })
    }
    return require(className)
  }

```
* **_formatDefineMethods**


	规范化JS方法
```js
 var _formatDefineMethods = function(methods, newMethods, realClsName) {
    for (var methodName in methods) {
      if (!(methods[methodName] instanceof Function)) return;
      (function(){
        var originMethod = methods[methodName]
        newMethods[methodName] = [originMethod.length, function() {
          try {
            var args = _formatOCToJS(Array.prototype.slice.call(arguments))
            var lastSelf = global.self
            global.self = args[0]
            if (global.self) global.self.__realClsName = realClsName
            args.splice(0,1)
            var ret = originMethod.apply(originMethod, args)
            global.self = lastSelf
            return ret
          } catch(e) {
            _OC_catch(e.message, e.stack)
          }
        }]
      })()
    }
  }

将传进来的JS对象进行修改

原来的形式是：
    {
        handleBtn：function（）｛...｝
    ｝
修改之后是：
    {
        handleBtn: [argCount,function (){...新的实现}]
    }
```
	因为无法直接解析原始的js实现函数，那么就不知道参数的个数，特别是在创建新的方法的时候，需要根据参数个数生成方法签名，所以只能在js端拿到js函数的参数个数，传递到OC端


* **_c()函数**

	实际并不存在，为自定义，用来将不存在的方法转发到特定函数中。

```js

UIView.__c('alloc')().__c('init')()
UIView.alloc().init()


Object.defineProperty(Object.prototype, '__c', {value: function(methodName) {
  if (!this.__obj && !this.__clsName) return this[methodName].bind(this);
  var self = this
  return function(){
    var args = Array.prototype.slice.call(arguments)
    return _methodFunc(self.__obj, self.__clsName, methodName, args, self.__isSuper)
  }
}})


```

## 使用

```objc

[JPEngine startEngine];
NSString *sourcePath = [[NSBundle mainBundle] pathForResource:@"demo" ofType:@"js"];
NSString *script = [NSString stringWithContentsOfFile:sourcePath encoding:NSUTF8StringEncoding error:nil];
[JPEngine evaluateScript:script];

```
## 坑

* 所有基本数据类型无需转换成NSNumber/NSValue, 会自动转换

* CGRect 要按照规定格式书写，例如 `CGRectMake(1, 2, 4.2, 1)` 或 `CGRectMake(x, y, width, height)`

* 类别方法无法调用

* weakSelf无法使用typedef, 直接定义新变量即可

* 不要使用GCD

* 不支持枚举变量，使用Int

* 方法内不要出现_，因为方法会被转化成xxx_xxx_xxx

* NSLog无效，使用MBProgressHUD弹出信息进行调试

```js
var weakSelf = self;
``` 


## 扩展

* Struct

* Extension

## 安全性

* 完整文件检验值，服务端与本地加密结果对比

* 使用URL，非JS明文传递，并且使用https,避免中间人攻击

* 防止本地沙盒文件篡改

* JSLoader

	官方提供的下发Class

## Convertor

* [项目主页](https://github.com/bang590/JSPatchConvertor)

* [试用页面](http://bang590.github.io/JSPatchConvertor/)

	* 不支持的内容：
		1. Macro / constant variable / Enum
		2. C function calling
		3. GCD functions
		4. Pointer / Struct
		5. Getting / Setting private variable


## Plugin

[JSPatchX](https://github.com/bang590/JSPatchX)
