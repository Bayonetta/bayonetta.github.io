---
layout: post
title: "JSPatch学习笔记"
description: "JSPatch 的原理、defineClass 的实现细节与踩过的坑。"
comments: true
category: "iOS"
tags: [iOS, 开发]
---

补一句前提：JSPatch 这类热修复方案在 2017 年之后被 App Store 审核条款禁止，项目本身也已停止维护。这篇笔记留在这里只作为 OC 运行时和 JSContext 桥接的学习材料，不要照着往线上接。

## 依赖

* `JavascriptCore.framework`

* `<objc/runtime.h>`

## 原理

利用 OC 运行时特性，动态对指定类的方法进行增添或替换，以及注册新类等。

* 消息传递

通过 JSContext 以 Block 形式进行方法定义，然后在 OC 下执行，将返回值传给 JS。参数类型都会通过 JavascriptCore 自动转换。

## 关键词

* **require**

	在 JS 全局作用域上创建一个同名变量，变量指向一个对象，对象属性 `__clsName` 保存类名，同时表明这个对象是一个 OC Class。

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

	通过在 `JPEngine` 中向脚本全局注入 `_OC_defineClass` 方法，然后在 JSPatch.js 中调用 `defineClass` 方法，实质即调用 OC 的 `_OC_defineClass` 方法。

```objc

context[@"_OC_defineClass"] = ^(NSString *classDeclaration, JSValue *instanceMethods, JSValue *classMethods) {
        return defineClass(classDeclaration, instanceMethods, classMethods);
    };

```

	然后在 js 中的 defineClass 实现如下。参数列表：

	1. 类名字符串
	2. 属性列表，已经被转换为 JS 的数据类型
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

	规范化 JS 方法：

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

```

这一步是把传进来的 JS 对象改形。原来是：

```js
{
  handleBtn: function() { ... }
}
```

改完之后是：

```js
{
  handleBtn: [argCount, function() { ...新的实现 }]
}
```

为什么要这么绕：OC 侧没法直接解析原始的 JS 函数，也就不知道参数个数。而创建新方法时必须按参数个数生成方法签名（selector 里的冒号数量对不上就找不到方法），所以只能先在 JS 端拿到 `Function.length`，再连同函数一起传到 OC。

* **_c()函数**

	实际并不存在，是自定义的，用来把不存在的方法转发到特定函数中。

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

* 所有基本数据类型无需转换成 NSNumber / NSValue，会自动转换

* CGRect 要按照规定格式书写，例如 `CGRectMake(1, 2, 4.2, 1)` 或 `CGRectMake(x, y, width, height)`

* 类别方法无法调用

* weakSelf 无法使用 typedef，直接定义新变量即可

* 不要使用 GCD

* 不支持枚举变量，用 Int

* 方法内不要出现下划线，因为方法名会被转换成 `xxx_xxx_xxx` 的形式

* NSLog 无效，调试时用 MBProgressHUD 弹提示代替

```js
var weakSelf = self;
```

## 扩展

* Struct

* Extension

## 安全性

* 完整文件校验值，服务端与本地加密结果对比

* 使用 URL 而非 JS 明文传递，并且走 https，避免中间人攻击

* 防止本地沙盒文件被篡改

* JSLoader

	官方提供的下发 Class

## Convertor

* [项目主页](https://github.com/bang590/JSPatchConvertor)

* [试用页面](http://bang590.github.io/JSPatchConvertor/)

	不支持的内容：

	1. Macro / constant variable / Enum
	2. C function calling
	3. GCD functions
	4. Pointer / Struct
	5. Getting / Setting private variable

## Plugin

[JSPatchX](https://github.com/bang590/JSPatchX)
