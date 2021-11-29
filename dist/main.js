(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("resumablejs", [], factory);
	else if(typeof exports === 'object')
		exports["resumablejs"] = factory();
	else
		root["resumablejs"] = factory();
})(this, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(2);

/***/ }),
/* 2 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(3);

module.exports = parent;


/***/ }),
/* 3 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(4);
var path = __webpack_require__(21);

module.exports = path.Reflect.construct;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var getBuiltIn = __webpack_require__(20);
var aFunction = __webpack_require__(39);
var anObject = __webpack_require__(42);
var isObject = __webpack_require__(18);
var create = __webpack_require__(43);
var bind = __webpack_require__(55);
var fails = __webpack_require__(9);

var nativeConstruct = getBuiltIn('Reflect', 'construct');

// `Reflect.construct` method
// https://tc39.es/ecma262/#sec-reflect.construct
// MS Edge supports only 2 arguments and argumentsList argument is optional
// FF Nightly sets third argument as `new.target`, but does not create `this` from it
var NEW_TARGET_BUG = fails(function () {
  function F() { /* empty */ }
  return !(nativeConstruct(function () { /* empty */ }, [], F) instanceof F);
});
var ARGS_BUG = !fails(function () {
  nativeConstruct(function () { /* empty */ });
});
var FORCED = NEW_TARGET_BUG || ARGS_BUG;

$({ target: 'Reflect', stat: true, forced: FORCED, sham: FORCED }, {
  construct: function construct(Target, args /* , newTarget */) {
    aFunction(Target);
    anObject(args);
    var newTarget = arguments.length < 3 ? Target : aFunction(arguments[2]);
    if (ARGS_BUG && !NEW_TARGET_BUG) return nativeConstruct(Target, args, newTarget);
    if (Target == newTarget) {
      // w/o altered newTarget, optimization for 0-4 arguments
      switch (args.length) {
        case 0: return new Target();
        case 1: return new Target(args[0]);
        case 2: return new Target(args[0], args[1]);
        case 3: return new Target(args[0], args[1], args[2]);
        case 4: return new Target(args[0], args[1], args[2], args[3]);
      }
      // w/o altered newTarget, lot of arguments case
      var $args = [null];
      $args.push.apply($args, args);
      return new (bind.apply(Target, $args))();
    }
    // with altered newTarget, not support built-in constructors
    var proto = newTarget.prototype;
    var instance = create(isObject(proto) ? proto : Object.prototype);
    var result = Function.apply.call(Target, instance, args);
    return isObject(result) ? result : instance;
  }
});


/***/ }),
/* 5 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var global = __webpack_require__(6);
var getOwnPropertyDescriptor = __webpack_require__(7).f;
var isForced = __webpack_require__(37);
var path = __webpack_require__(21);
var bind = __webpack_require__(38);
var createNonEnumerableProperty = __webpack_require__(40);
var has = __webpack_require__(32);

var wrapConstructor = function (NativeConstructor) {
  var Wrapper = function (a, b, c) {
    if (this instanceof NativeConstructor) {
      switch (arguments.length) {
        case 0: return new NativeConstructor();
        case 1: return new NativeConstructor(a);
        case 2: return new NativeConstructor(a, b);
      } return new NativeConstructor(a, b, c);
    } return NativeConstructor.apply(this, arguments);
  };
  Wrapper.prototype = NativeConstructor.prototype;
  return Wrapper;
};

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var PROTO = options.proto;

  var nativeSource = GLOBAL ? global : STATIC ? global[TARGET] : (global[TARGET] || {}).prototype;

  var target = GLOBAL ? path : path[TARGET] || (path[TARGET] = {});
  var targetPrototype = target.prototype;

  var FORCED, USE_NATIVE, VIRTUAL_PROTOTYPE;
  var key, sourceProperty, targetProperty, nativeProperty, resultProperty, descriptor;

  for (key in source) {
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contains in native
    USE_NATIVE = !FORCED && nativeSource && has(nativeSource, key);

    targetProperty = target[key];

    if (USE_NATIVE) if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(nativeSource, key);
      nativeProperty = descriptor && descriptor.value;
    } else nativeProperty = nativeSource[key];

    // export native or implementation
    sourceProperty = (USE_NATIVE && nativeProperty) ? nativeProperty : source[key];

    if (USE_NATIVE && typeof targetProperty === typeof sourceProperty) continue;

    // bind timers to global for call from export context
    if (options.bind && USE_NATIVE) resultProperty = bind(sourceProperty, global);
    // wrap global constructors for prevent changs in this version
    else if (options.wrap && USE_NATIVE) resultProperty = wrapConstructor(sourceProperty);
    // make static versions for prototype methods
    else if (PROTO && typeof sourceProperty == 'function') resultProperty = bind(Function.call, sourceProperty);
    // default case
    else resultProperty = sourceProperty;

    // add a flag to not completely full polyfills
    if (options.sham || (sourceProperty && sourceProperty.sham) || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(resultProperty, 'sham', true);
    }

    target[key] = resultProperty;

    if (PROTO) {
      VIRTUAL_PROTOTYPE = TARGET + 'Prototype';
      if (!has(path, VIRTUAL_PROTOTYPE)) {
        createNonEnumerableProperty(path, VIRTUAL_PROTOTYPE, {});
      }
      // export virtual prototype methods
      path[VIRTUAL_PROTOTYPE][key] = sourceProperty;
      // export real prototype methods
      if (options.real && targetPrototype && !targetPrototype[key]) {
        createNonEnumerableProperty(targetPrototype, key, sourceProperty);
      }
    }
  }
};


/***/ }),
/* 6 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof __webpack_require__.g == 'object' && __webpack_require__.g) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8);
var propertyIsEnumerableModule = __webpack_require__(10);
var createPropertyDescriptor = __webpack_require__(11);
var toIndexedObject = __webpack_require__(12);
var toPropertyKey = __webpack_require__(16);
var has = __webpack_require__(32);
var IE8_DOM_DEFINE = __webpack_require__(35);

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPropertyKey(P);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};


/***/ }),
/* 8 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(9);

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});


/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),
/* 12 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// toObject with fallback for non-array-like ES3 strings
var IndexedObject = __webpack_require__(13);
var requireObjectCoercible = __webpack_require__(15);

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};


/***/ }),
/* 13 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(9);
var classof = __webpack_require__(14);

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;


/***/ }),
/* 14 */
/***/ ((module) => {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),
/* 15 */
/***/ ((module) => {

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};


/***/ }),
/* 16 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toPrimitive = __webpack_require__(17);
var isSymbol = __webpack_require__(19);

// `ToPropertyKey` abstract operation
// https://tc39.es/ecma262/#sec-topropertykey
module.exports = function (argument) {
  var key = toPrimitive(argument, 'string');
  return isSymbol(key) ? key : String(key);
};


/***/ }),
/* 17 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(18);
var isSymbol = __webpack_require__(19);
var ordinaryToPrimitive = __webpack_require__(26);
var wellKnownSymbol = __webpack_require__(27);

var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
module.exports = function (input, pref) {
  if (!isObject(input) || isSymbol(input)) return input;
  var exoticToPrim = input[TO_PRIMITIVE];
  var result;
  if (exoticToPrim !== undefined) {
    if (pref === undefined) pref = 'default';
    result = exoticToPrim.call(input, pref);
    if (!isObject(result) || isSymbol(result)) return result;
    throw TypeError("Can't convert object to primitive value");
  }
  if (pref === undefined) pref = 'number';
  return ordinaryToPrimitive(input, pref);
};


/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),
/* 19 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(20);
var USE_SYMBOL_AS_UID = __webpack_require__(22);

module.exports = USE_SYMBOL_AS_UID ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn('Symbol');
  return typeof $Symbol == 'function' && Object(it) instanceof $Symbol;
};


/***/ }),
/* 20 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var path = __webpack_require__(21);
var global = __webpack_require__(6);

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global[namespace])
    : path[namespace] && path[namespace][method] || global[namespace] && global[namespace][method];
};


/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = {};


/***/ }),
/* 22 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = __webpack_require__(23);

module.exports = NATIVE_SYMBOL
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';


/***/ }),
/* 23 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = __webpack_require__(24);
var fails = __webpack_require__(9);

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol();
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});


/***/ }),
/* 24 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var userAgent = __webpack_require__(25);

var process = global.process;
var Deno = global.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] < 4 ? 1 : match[0] + match[1];
} else if (userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

module.exports = version && +version;


/***/ }),
/* 25 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(20);

module.exports = getBuiltIn('navigator', 'userAgent') || '';


/***/ }),
/* 26 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(18);

// `OrdinaryToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
module.exports = function (input, pref) {
  var fn, val;
  if (pref === 'string' && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (pref !== 'string' && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),
/* 27 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var shared = __webpack_require__(28);
var has = __webpack_require__(32);
var uid = __webpack_require__(34);
var NATIVE_SYMBOL = __webpack_require__(23);
var USE_SYMBOL_AS_UID = __webpack_require__(22);

var WellKnownSymbolsStore = shared('wks');
var Symbol = global.Symbol;
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!has(WellKnownSymbolsStore, name) || !(NATIVE_SYMBOL || typeof WellKnownSymbolsStore[name] == 'string')) {
    if (NATIVE_SYMBOL && has(Symbol, name)) {
      WellKnownSymbolsStore[name] = Symbol[name];
    } else {
      WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    }
  } return WellKnownSymbolsStore[name];
};


/***/ }),
/* 28 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var IS_PURE = __webpack_require__(29);
var store = __webpack_require__(30);

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.16.0',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
});


/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = true;


/***/ }),
/* 30 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var setGlobal = __webpack_require__(31);

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});

module.exports = store;


/***/ }),
/* 31 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);

module.exports = function (key, value) {
  try {
    // eslint-disable-next-line es/no-object-defineproperty -- safe
    Object.defineProperty(global, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    global[key] = value;
  } return value;
};


/***/ }),
/* 32 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toObject = __webpack_require__(33);

var hasOwnProperty = {}.hasOwnProperty;

module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty.call(toObject(it), key);
};


/***/ }),
/* 33 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var requireObjectCoercible = __webpack_require__(15);

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};


/***/ }),
/* 34 */
/***/ ((module) => {

var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};


/***/ }),
/* 35 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8);
var fails = __webpack_require__(9);
var createElement = __webpack_require__(36);

// Thank's IE8 for his funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});


/***/ }),
/* 36 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var isObject = __webpack_require__(18);

var document = global.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};


/***/ }),
/* 37 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(9);

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;


/***/ }),
/* 38 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var aFunction = __webpack_require__(39);

// optional / simple context binding
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};


/***/ }),
/* 40 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8);
var definePropertyModule = __webpack_require__(41);
var createPropertyDescriptor = __webpack_require__(11);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8);
var IE8_DOM_DEFINE = __webpack_require__(35);
var anObject = __webpack_require__(42);
var toPropertyKey = __webpack_require__(16);

// eslint-disable-next-line es/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),
/* 42 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(18);

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};


/***/ }),
/* 43 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* global ActiveXObject -- old IE, WSH */
var anObject = __webpack_require__(42);
var defineProperties = __webpack_require__(44);
var enumBugKeys = __webpack_require__(52);
var hiddenKeys = __webpack_require__(51);
var html = __webpack_require__(53);
var documentCreateElement = __webpack_require__(36);
var sharedKey = __webpack_require__(54);

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  if (iframe.style) {
    iframe.style.display = 'none';
    html.appendChild(iframe);
    // https://github.com/zloirock/core-js/issues/475
    iframe.src = String(JS);
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(scriptTag('document.F=Object'));
    iframeDocument.close();
    return iframeDocument.F;
  }
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = document.domain && activeXDocument ?
    NullProtoObjectViaActiveX(activeXDocument) : // old IE
    NullProtoObjectViaIFrame() ||
    NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : defineProperties(result, Properties);
};


/***/ }),
/* 44 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8);
var definePropertyModule = __webpack_require__(41);
var anObject = __webpack_require__(42);
var objectKeys = __webpack_require__(45);

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es/no-object-defineproperties -- safe
module.exports = DESCRIPTORS ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule.f(O, key = keys[index++], Properties[key]);
  return O;
};


/***/ }),
/* 45 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var internalObjectKeys = __webpack_require__(46);
var enumBugKeys = __webpack_require__(52);

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es/no-object-keys -- safe
module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};


/***/ }),
/* 46 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(32);
var toIndexedObject = __webpack_require__(12);
var indexOf = __webpack_require__(47).indexOf;
var hiddenKeys = __webpack_require__(51);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};


/***/ }),
/* 47 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toIndexedObject = __webpack_require__(12);
var toLength = __webpack_require__(48);
var toAbsoluteIndex = __webpack_require__(50);

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};


/***/ }),
/* 48 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(49);

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};


/***/ }),
/* 49 */
/***/ ((module) => {

var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.es/ecma262/#sec-tointeger
module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};


/***/ }),
/* 50 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(49);

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};


/***/ }),
/* 51 */
/***/ ((module) => {

module.exports = {};


/***/ }),
/* 52 */
/***/ ((module) => {

// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/***/ }),
/* 53 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(20);

module.exports = getBuiltIn('document', 'documentElement');


/***/ }),
/* 54 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var shared = __webpack_require__(28);
var uid = __webpack_require__(34);

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};


/***/ }),
/* 55 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var aFunction = __webpack_require__(39);
var isObject = __webpack_require__(18);

var slice = [].slice;
var factories = {};

var construct = function (C, argsLength, args) {
  if (!(argsLength in factories)) {
    for (var list = [], i = 0; i < argsLength; i++) list[i] = 'a[' + i + ']';
    // eslint-disable-next-line no-new-func -- we have no proper alternatives, IE8- only
    factories[argsLength] = Function('C,a', 'return new C(' + list.join(',') + ')');
  } return factories[argsLength](C, args);
};

// `Function.prototype.bind` method implementation
// https://tc39.es/ecma262/#sec-function.prototype.bind
module.exports = Function.bind || function bind(that /* , ...args */) {
  var fn = aFunction(this);
  var partArgs = slice.call(arguments, 1);
  var boundFunction = function bound(/* args... */) {
    var args = partArgs.concat(slice.call(arguments));
    return this instanceof boundFunction ? construct(fn, args.length, args) : fn.apply(that, args);
  };
  if (isObject(fn.prototype)) boundFunction.prototype = fn.prototype;
  return boundFunction;
};


/***/ }),
/* 56 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(57);

/***/ }),
/* 57 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(58);
__webpack_require__(99);

module.exports = parent;


/***/ }),
/* 58 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(59);
__webpack_require__(65);
__webpack_require__(66);
__webpack_require__(82);
__webpack_require__(83);
__webpack_require__(84);
__webpack_require__(85);
__webpack_require__(86);
__webpack_require__(87);
__webpack_require__(88);
__webpack_require__(89);
__webpack_require__(90);
__webpack_require__(91);
__webpack_require__(92);
__webpack_require__(93);
__webpack_require__(94);
__webpack_require__(95);
__webpack_require__(96);
__webpack_require__(97);
__webpack_require__(98);
var path = __webpack_require__(21);

module.exports = path.Symbol;


/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var fails = __webpack_require__(9);
var isArray = __webpack_require__(60);
var isObject = __webpack_require__(18);
var toObject = __webpack_require__(33);
var toLength = __webpack_require__(48);
var createProperty = __webpack_require__(61);
var arraySpeciesCreate = __webpack_require__(62);
var arrayMethodHasSpeciesSupport = __webpack_require__(64);
var wellKnownSymbol = __webpack_require__(27);
var V8_VERSION = __webpack_require__(24);

var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT = V8_VERSION >= 51 || !fails(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

var isConcatSpreadable = function (O) {
  if (!isObject(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE];
  return spreadable !== undefined ? !!spreadable : isArray(O);
};

var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

// `Array.prototype.concat` method
// https://tc39.es/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
$({ target: 'Array', proto: true, forced: FORCED }, {
  // eslint-disable-next-line no-unused-vars -- required for `.length`
  concat: function concat(arg) {
    var O = toObject(this);
    var A = arraySpeciesCreate(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable(E)) {
        len = toLength(E.length);
        if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        createProperty(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});


/***/ }),
/* 60 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(14);

// `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es/no-array-isarray -- safe
module.exports = Array.isArray || function isArray(arg) {
  return classof(arg) == 'Array';
};


/***/ }),
/* 61 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var toPropertyKey = __webpack_require__(16);
var definePropertyModule = __webpack_require__(41);
var createPropertyDescriptor = __webpack_require__(11);

module.exports = function (object, key, value) {
  var propertyKey = toPropertyKey(key);
  if (propertyKey in object) definePropertyModule.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
};


/***/ }),
/* 62 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arraySpeciesConstructor = __webpack_require__(63);

// `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
module.exports = function (originalArray, length) {
  return new (arraySpeciesConstructor(originalArray))(length === 0 ? 0 : length);
};


/***/ }),
/* 63 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(18);
var isArray = __webpack_require__(60);
var wellKnownSymbol = __webpack_require__(27);

var SPECIES = wellKnownSymbol('species');

// a part of `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
module.exports = function (originalArray) {
  var C;
  if (isArray(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    else if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};


/***/ }),
/* 64 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(9);
var wellKnownSymbol = __webpack_require__(27);
var V8_VERSION = __webpack_require__(24);

var SPECIES = wellKnownSymbol('species');

module.exports = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return V8_VERSION >= 51 || !fails(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};


/***/ }),
/* 65 */
/***/ (() => {

// empty


/***/ }),
/* 66 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var global = __webpack_require__(6);
var getBuiltIn = __webpack_require__(20);
var IS_PURE = __webpack_require__(29);
var DESCRIPTORS = __webpack_require__(8);
var NATIVE_SYMBOL = __webpack_require__(23);
var fails = __webpack_require__(9);
var has = __webpack_require__(32);
var isArray = __webpack_require__(60);
var isObject = __webpack_require__(18);
var isSymbol = __webpack_require__(19);
var anObject = __webpack_require__(42);
var toObject = __webpack_require__(33);
var toIndexedObject = __webpack_require__(12);
var toPropertyKey = __webpack_require__(16);
var $toString = __webpack_require__(67);
var createPropertyDescriptor = __webpack_require__(11);
var nativeObjectCreate = __webpack_require__(43);
var objectKeys = __webpack_require__(45);
var getOwnPropertyNamesModule = __webpack_require__(68);
var getOwnPropertyNamesExternal = __webpack_require__(69);
var getOwnPropertySymbolsModule = __webpack_require__(70);
var getOwnPropertyDescriptorModule = __webpack_require__(7);
var definePropertyModule = __webpack_require__(41);
var propertyIsEnumerableModule = __webpack_require__(10);
var createNonEnumerableProperty = __webpack_require__(40);
var redefine = __webpack_require__(71);
var shared = __webpack_require__(28);
var sharedKey = __webpack_require__(54);
var hiddenKeys = __webpack_require__(51);
var uid = __webpack_require__(34);
var wellKnownSymbol = __webpack_require__(27);
var wrappedWellKnownSymbolModule = __webpack_require__(72);
var defineWellKnownSymbol = __webpack_require__(73);
var setToStringTag = __webpack_require__(74);
var InternalStateModule = __webpack_require__(78);
var $forEach = __webpack_require__(81).forEach;

var HIDDEN = sharedKey('hidden');
var SYMBOL = 'Symbol';
var PROTOTYPE = 'prototype';
var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(SYMBOL);
var ObjectPrototype = Object[PROTOTYPE];
var $Symbol = global.Symbol;
var $stringify = getBuiltIn('JSON', 'stringify');
var nativeGetOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
var nativeDefineProperty = definePropertyModule.f;
var nativeGetOwnPropertyNames = getOwnPropertyNamesExternal.f;
var nativePropertyIsEnumerable = propertyIsEnumerableModule.f;
var AllSymbols = shared('symbols');
var ObjectPrototypeSymbols = shared('op-symbols');
var StringToSymbolRegistry = shared('string-to-symbol-registry');
var SymbolToStringRegistry = shared('symbol-to-string-registry');
var WellKnownSymbolsStore = shared('wks');
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDescriptor = DESCRIPTORS && fails(function () {
  return nativeObjectCreate(nativeDefineProperty({}, 'a', {
    get: function () { return nativeDefineProperty(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor(ObjectPrototype, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
  nativeDefineProperty(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
    nativeDefineProperty(ObjectPrototype, P, ObjectPrototypeDescriptor);
  }
} : nativeDefineProperty;

var wrap = function (tag, description) {
  var symbol = AllSymbols[tag] = nativeObjectCreate($Symbol[PROTOTYPE]);
  setInternalState(symbol, {
    type: SYMBOL,
    tag: tag,
    description: description
  });
  if (!DESCRIPTORS) symbol.description = description;
  return symbol;
};

var $defineProperty = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
  anObject(O);
  var key = toPropertyKey(P);
  anObject(Attributes);
  if (has(AllSymbols, key)) {
    if (!Attributes.enumerable) {
      if (!has(O, HIDDEN)) nativeDefineProperty(O, HIDDEN, createPropertyDescriptor(1, {}));
      O[HIDDEN][key] = true;
    } else {
      if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
      Attributes = nativeObjectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
    } return setSymbolDescriptor(O, key, Attributes);
  } return nativeDefineProperty(O, key, Attributes);
};

var $defineProperties = function defineProperties(O, Properties) {
  anObject(O);
  var properties = toIndexedObject(Properties);
  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
  $forEach(keys, function (key) {
    if (!DESCRIPTORS || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
  });
  return O;
};

var $create = function create(O, Properties) {
  return Properties === undefined ? nativeObjectCreate(O) : $defineProperties(nativeObjectCreate(O), Properties);
};

var $propertyIsEnumerable = function propertyIsEnumerable(V) {
  var P = toPropertyKey(V);
  var enumerable = nativePropertyIsEnumerable.call(this, P);
  if (this === ObjectPrototype && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
  return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
};

var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject(O);
  var key = toPropertyKey(P);
  if (it === ObjectPrototype && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor(it, key);
  if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames(toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
  });
  return result;
};

var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
  var names = nativeGetOwnPropertyNames(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))) {
      result.push(AllSymbols[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.es/ecma262/#sec-symbol-constructor
if (!NATIVE_SYMBOL) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : $toString(arguments[0]);
    var tag = uid(description);
    var setter = function (value) {
      if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
    };
    if (DESCRIPTORS && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
    return wrap(tag, description);
  };

  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return getInternalState(this).tag;
  });

  redefine($Symbol, 'withoutSetter', function (description) {
    return wrap(uid(description), description);
  });

  propertyIsEnumerableModule.f = $propertyIsEnumerable;
  definePropertyModule.f = $defineProperty;
  getOwnPropertyDescriptorModule.f = $getOwnPropertyDescriptor;
  getOwnPropertyNamesModule.f = getOwnPropertyNamesExternal.f = $getOwnPropertyNames;
  getOwnPropertySymbolsModule.f = $getOwnPropertySymbols;

  wrappedWellKnownSymbolModule.f = function (name) {
    return wrap(wellKnownSymbol(name), name);
  };

  if (DESCRIPTORS) {
    // https://github.com/tc39/proposal-Symbol-description
    nativeDefineProperty($Symbol[PROTOTYPE], 'description', {
      configurable: true,
      get: function description() {
        return getInternalState(this).description;
      }
    });
    if (!IS_PURE) {
      redefine(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
    }
  }
}

$({ global: true, wrap: true, forced: !NATIVE_SYMBOL, sham: !NATIVE_SYMBOL }, {
  Symbol: $Symbol
});

$forEach(objectKeys(WellKnownSymbolsStore), function (name) {
  defineWellKnownSymbol(name);
});

$({ target: SYMBOL, stat: true, forced: !NATIVE_SYMBOL }, {
  // `Symbol.for` method
  // https://tc39.es/ecma262/#sec-symbol.for
  'for': function (key) {
    var string = $toString(key);
    if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
    var symbol = $Symbol(string);
    StringToSymbolRegistry[string] = symbol;
    SymbolToStringRegistry[symbol] = string;
    return symbol;
  },
  // `Symbol.keyFor` method
  // https://tc39.es/ecma262/#sec-symbol.keyfor
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
    if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
  },
  useSetter: function () { USE_SETTER = true; },
  useSimple: function () { USE_SETTER = false; }
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL, sham: !DESCRIPTORS }, {
  // `Object.create` method
  // https://tc39.es/ecma262/#sec-object.create
  create: $create,
  // `Object.defineProperty` method
  // https://tc39.es/ecma262/#sec-object.defineproperty
  defineProperty: $defineProperty,
  // `Object.defineProperties` method
  // https://tc39.es/ecma262/#sec-object.defineproperties
  defineProperties: $defineProperties,
  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.es/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames,
  // `Object.getOwnPropertySymbols` method
  // https://tc39.es/ecma262/#sec-object.getownpropertysymbols
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
$({ target: 'Object', stat: true, forced: fails(function () { getOwnPropertySymbolsModule.f(1); }) }, {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    return getOwnPropertySymbolsModule.f(toObject(it));
  }
});

// `JSON.stringify` method behavior with symbols
// https://tc39.es/ecma262/#sec-json.stringify
if ($stringify) {
  var FORCED_JSON_STRINGIFY = !NATIVE_SYMBOL || fails(function () {
    var symbol = $Symbol();
    // MS Edge converts symbol values to JSON as {}
    return $stringify([symbol]) != '[null]'
      // WebKit converts symbol values to JSON as null
      || $stringify({ a: symbol }) != '{}'
      // V8 throws on boxed symbols
      || $stringify(Object(symbol)) != '{}';
  });

  $({ target: 'JSON', stat: true, forced: FORCED_JSON_STRINGIFY }, {
    // eslint-disable-next-line no-unused-vars -- required for `.length`
    stringify: function stringify(it, replacer, space) {
      var args = [it];
      var index = 1;
      var $replacer;
      while (arguments.length > index) args.push(arguments[index++]);
      $replacer = replacer;
      if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
      if (!isArray(replacer)) replacer = function (key, value) {
        if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
        if (!isSymbol(value)) return value;
      };
      args[1] = replacer;
      return $stringify.apply(null, args);
    }
  });
}

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
if (!$Symbol[PROTOTYPE][TO_PRIMITIVE]) {
  createNonEnumerableProperty($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
}
// `Symbol.prototype[@@toStringTag]` property
// https://tc39.es/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag($Symbol, SYMBOL);

hiddenKeys[HIDDEN] = true;


/***/ }),
/* 67 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isSymbol = __webpack_require__(19);

module.exports = function (argument) {
  if (isSymbol(argument)) throw TypeError('Cannot convert a Symbol value to a string');
  return String(argument);
};


/***/ }),
/* 68 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var internalObjectKeys = __webpack_require__(46);
var enumBugKeys = __webpack_require__(52);

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};


/***/ }),
/* 69 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable es/no-object-getownpropertynames -- safe */
var toIndexedObject = __webpack_require__(12);
var $getOwnPropertyNames = __webpack_require__(68).f;

var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return $getOwnPropertyNames(it);
  } catch (error) {
    return windowNames.slice();
  }
};

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]'
    ? getWindowNames(it)
    : $getOwnPropertyNames(toIndexedObject(it));
};


/***/ }),
/* 70 */
/***/ ((__unused_webpack_module, exports) => {

// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;


/***/ }),
/* 71 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var createNonEnumerableProperty = __webpack_require__(40);

module.exports = function (target, key, value, options) {
  if (options && options.enumerable) target[key] = value;
  else createNonEnumerableProperty(target, key, value);
};


/***/ }),
/* 72 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(27);

exports.f = wellKnownSymbol;


/***/ }),
/* 73 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var path = __webpack_require__(21);
var has = __webpack_require__(32);
var wrappedWellKnownSymbolModule = __webpack_require__(72);
var defineProperty = __webpack_require__(41).f;

module.exports = function (NAME) {
  var Symbol = path.Symbol || (path.Symbol = {});
  if (!has(Symbol, NAME)) defineProperty(Symbol, NAME, {
    value: wrappedWellKnownSymbolModule.f(NAME)
  });
};


/***/ }),
/* 74 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var TO_STRING_TAG_SUPPORT = __webpack_require__(75);
var defineProperty = __webpack_require__(41).f;
var createNonEnumerableProperty = __webpack_require__(40);
var has = __webpack_require__(32);
var toString = __webpack_require__(76);
var wellKnownSymbol = __webpack_require__(27);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

module.exports = function (it, TAG, STATIC, SET_METHOD) {
  if (it) {
    var target = STATIC ? it : it.prototype;
    if (!has(target, TO_STRING_TAG)) {
      defineProperty(target, TO_STRING_TAG, { configurable: true, value: TAG });
    }
    if (SET_METHOD && !TO_STRING_TAG_SUPPORT) {
      createNonEnumerableProperty(target, 'toString', toString);
    }
  }
};


/***/ }),
/* 75 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(27);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

module.exports = String(test) === '[object z]';


/***/ }),
/* 76 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var TO_STRING_TAG_SUPPORT = __webpack_require__(75);
var classof = __webpack_require__(77);

// `Object.prototype.toString` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.tostring
module.exports = TO_STRING_TAG_SUPPORT ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};


/***/ }),
/* 77 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var TO_STRING_TAG_SUPPORT = __webpack_require__(75);
var classofRaw = __webpack_require__(14);
var wellKnownSymbol = __webpack_require__(27);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};


/***/ }),
/* 78 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var NATIVE_WEAK_MAP = __webpack_require__(79);
var global = __webpack_require__(6);
var isObject = __webpack_require__(18);
var createNonEnumerableProperty = __webpack_require__(40);
var objectHas = __webpack_require__(32);
var shared = __webpack_require__(30);
var sharedKey = __webpack_require__(54);
var hiddenKeys = __webpack_require__(51);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function (it, metadata) {
    if (wmhas.call(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset.call(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store, it) || {};
  };
  has = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (objectHas(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};


/***/ }),
/* 79 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var inspectSource = __webpack_require__(80);

var WeakMap = global.WeakMap;

module.exports = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));


/***/ }),
/* 80 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var store = __webpack_require__(30);

var functionToString = Function.toString;

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof store.inspectSource != 'function') {
  store.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

module.exports = store.inspectSource;


/***/ }),
/* 81 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var bind = __webpack_require__(38);
var IndexedObject = __webpack_require__(13);
var toObject = __webpack_require__(33);
var toLength = __webpack_require__(48);
var arraySpeciesCreate = __webpack_require__(62);

var push = [].push;

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex, filterReject }` methods implementation
var createMethod = function (TYPE) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var IS_FILTER_REJECT = TYPE == 7;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject($this);
    var self = IndexedObject(O);
    var boundFunction = bind(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate;
    var target = IS_MAP ? create($this, length) : IS_FILTER || IS_FILTER_REJECT ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push.call(target, value); // filter
        } else switch (TYPE) {
          case 4: return false;             // every
          case 7: push.call(target, value); // filterReject
        }
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

module.exports = {
  // `Array.prototype.forEach` method
  // https://tc39.es/ecma262/#sec-array.prototype.foreach
  forEach: createMethod(0),
  // `Array.prototype.map` method
  // https://tc39.es/ecma262/#sec-array.prototype.map
  map: createMethod(1),
  // `Array.prototype.filter` method
  // https://tc39.es/ecma262/#sec-array.prototype.filter
  filter: createMethod(2),
  // `Array.prototype.some` method
  // https://tc39.es/ecma262/#sec-array.prototype.some
  some: createMethod(3),
  // `Array.prototype.every` method
  // https://tc39.es/ecma262/#sec-array.prototype.every
  every: createMethod(4),
  // `Array.prototype.find` method
  // https://tc39.es/ecma262/#sec-array.prototype.find
  find: createMethod(5),
  // `Array.prototype.findIndex` method
  // https://tc39.es/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod(6),
  // `Array.prototype.filterReject` method
  // https://github.com/tc39/proposal-array-filtering
  filterReject: createMethod(7)
};


/***/ }),
/* 82 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.asyncIterator` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.asynciterator
defineWellKnownSymbol('asyncIterator');


/***/ }),
/* 83 */
/***/ (() => {

// empty


/***/ }),
/* 84 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.hasInstance` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.hasinstance
defineWellKnownSymbol('hasInstance');


/***/ }),
/* 85 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.isConcatSpreadable` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.isconcatspreadable
defineWellKnownSymbol('isConcatSpreadable');


/***/ }),
/* 86 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.iterator` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.iterator
defineWellKnownSymbol('iterator');


/***/ }),
/* 87 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.match` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.match
defineWellKnownSymbol('match');


/***/ }),
/* 88 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.matchAll` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.matchall
defineWellKnownSymbol('matchAll');


/***/ }),
/* 89 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.replace` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.replace
defineWellKnownSymbol('replace');


/***/ }),
/* 90 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.search` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.search
defineWellKnownSymbol('search');


/***/ }),
/* 91 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.species` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.species
defineWellKnownSymbol('species');


/***/ }),
/* 92 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.split` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.split
defineWellKnownSymbol('split');


/***/ }),
/* 93 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.toPrimitive` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.toprimitive
defineWellKnownSymbol('toPrimitive');


/***/ }),
/* 94 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.toStringTag` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.tostringtag
defineWellKnownSymbol('toStringTag');


/***/ }),
/* 95 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.unscopables` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.unscopables
defineWellKnownSymbol('unscopables');


/***/ }),
/* 96 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var setToStringTag = __webpack_require__(74);

// JSON[@@toStringTag] property
// https://tc39.es/ecma262/#sec-json-@@tostringtag
setToStringTag(global.JSON, 'JSON', true);


/***/ }),
/* 97 */
/***/ (() => {

// empty


/***/ }),
/* 98 */
/***/ (() => {

// empty


/***/ }),
/* 99 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(100);
var DOMIterables = __webpack_require__(110);
var global = __webpack_require__(6);
var classof = __webpack_require__(77);
var createNonEnumerableProperty = __webpack_require__(40);
var Iterators = __webpack_require__(102);
var wellKnownSymbol = __webpack_require__(27);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

for (var COLLECTION_NAME in DOMIterables) {
  var Collection = global[COLLECTION_NAME];
  var CollectionPrototype = Collection && Collection.prototype;
  if (CollectionPrototype && classof(CollectionPrototype) !== TO_STRING_TAG) {
    createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG, COLLECTION_NAME);
  }
  Iterators[COLLECTION_NAME] = Iterators.Array;
}


/***/ }),
/* 100 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var toIndexedObject = __webpack_require__(12);
var addToUnscopables = __webpack_require__(101);
var Iterators = __webpack_require__(102);
var InternalStateModule = __webpack_require__(78);
var defineIterator = __webpack_require__(103);

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');


/***/ }),
/* 101 */
/***/ ((module) => {

module.exports = function () { /* empty */ };


/***/ }),
/* 102 */
/***/ ((module) => {

module.exports = {};


/***/ }),
/* 103 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var createIteratorConstructor = __webpack_require__(104);
var getPrototypeOf = __webpack_require__(106);
var setPrototypeOf = __webpack_require__(108);
var setToStringTag = __webpack_require__(74);
var createNonEnumerableProperty = __webpack_require__(40);
var redefine = __webpack_require__(71);
var wellKnownSymbol = __webpack_require__(27);
var IS_PURE = __webpack_require__(29);
var Iterators = __webpack_require__(102);
var IteratorsCore = __webpack_require__(105);

var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () { return this; };

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (IteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (typeof CurrentIteratorPrototype[ITERATOR] != 'function') {
          createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  }

  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;
    defaultIterator = function values() { return nativeIterator.call(this); };
  }

  // define iterator
  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    createNonEnumerableProperty(IterablePrototype, ITERATOR, defaultIterator);
  }
  Iterators[NAME] = defaultIterator;

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else $({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
  }

  return methods;
};


/***/ }),
/* 104 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var IteratorPrototype = __webpack_require__(105).IteratorPrototype;
var create = __webpack_require__(43);
var createPropertyDescriptor = __webpack_require__(11);
var setToStringTag = __webpack_require__(74);
var Iterators = __webpack_require__(102);

var returnThis = function () { return this; };

module.exports = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, { next: createPropertyDescriptor(1, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};


/***/ }),
/* 105 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fails = __webpack_require__(9);
var getPrototypeOf = __webpack_require__(106);
var createNonEnumerableProperty = __webpack_require__(40);
var has = __webpack_require__(32);
var wellKnownSymbol = __webpack_require__(27);
var IS_PURE = __webpack_require__(29);

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function () { return this; };

// `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

/* eslint-disable es/no-array-prototype-keys -- safe */
if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = IteratorPrototype == undefined || fails(function () {
  var test = {};
  // FF44- legacy iterators case
  return IteratorPrototype[ITERATOR].call(test) !== test;
});

if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};

// `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
if ((!IS_PURE || NEW_ITERATOR_PROTOTYPE) && !has(IteratorPrototype, ITERATOR)) {
  createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis);
}

module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};


/***/ }),
/* 106 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(32);
var toObject = __webpack_require__(33);
var sharedKey = __webpack_require__(54);
var CORRECT_PROTOTYPE_GETTER = __webpack_require__(107);

var IE_PROTO = sharedKey('IE_PROTO');
var ObjectPrototype = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
// eslint-disable-next-line es/no-object-getprototypeof -- safe
module.exports = CORRECT_PROTOTYPE_GETTER ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectPrototype : null;
};


/***/ }),
/* 107 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(9);

module.exports = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});


/***/ }),
/* 108 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable no-proto -- safe */
var anObject = __webpack_require__(42);
var aPossiblePrototype = __webpack_require__(109);

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es/no-object-setprototypeof -- safe
module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);


/***/ }),
/* 109 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(18);

module.exports = function (it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  } return it;
};


/***/ }),
/* 110 */
/***/ ((module) => {

// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
module.exports = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};


/***/ }),
/* 111 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(112);

/***/ }),
/* 112 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(100);
__webpack_require__(113);
__webpack_require__(99);
var getIteratorMethod = __webpack_require__(115);

module.exports = getIteratorMethod;


/***/ }),
/* 113 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var charAt = __webpack_require__(114).charAt;
var toString = __webpack_require__(67);
var InternalStateModule = __webpack_require__(78);
var defineIterator = __webpack_require__(103);

var STRING_ITERATOR = 'String Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: toString(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt(string, index);
  state.index += point.length;
  return { value: point, done: false };
});


/***/ }),
/* 114 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(49);
var toString = __webpack_require__(67);
var requireObjectCoercible = __webpack_require__(15);

// `String.prototype.codePointAt` methods implementation
var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = toString(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

module.exports = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};


/***/ }),
/* 115 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(77);
var Iterators = __webpack_require__(102);
var wellKnownSymbol = __webpack_require__(27);

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};


/***/ }),
/* 116 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(117);

/***/ }),
/* 117 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(118);

module.exports = parent;


/***/ }),
/* 118 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(119);
var path = __webpack_require__(21);

module.exports = path.Array.isArray;


/***/ }),
/* 119 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var isArray = __webpack_require__(60);

// `Array.isArray` method
// https://tc39.es/ecma262/#sec-array.isarray
$({ target: 'Array', stat: true }, {
  isArray: isArray
});


/***/ }),
/* 120 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _toConsumableArray)
/* harmony export */ });
/* harmony import */ var _arrayWithoutHoles_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(121);
/* harmony import */ var _iterableToArray_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(125);
/* harmony import */ var _unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(144);
/* harmony import */ var _nonIterableSpread_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(151);




function _toConsumableArray(arr) {
  return (0,_arrayWithoutHoles_js__WEBPACK_IMPORTED_MODULE_0__.default)(arr) || (0,_iterableToArray_js__WEBPACK_IMPORTED_MODULE_1__.default)(arr) || (0,_unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__.default)(arr) || (0,_nonIterableSpread_js__WEBPACK_IMPORTED_MODULE_3__.default)();
}

/***/ }),
/* 121 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayWithoutHoles)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(122);
/* harmony import */ var _arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(124);


function _arrayWithoutHoles(arr) {
  if (_babel_runtime_corejs3_core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0__(arr)) return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_1__.default)(arr);
}

/***/ }),
/* 122 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(123);

/***/ }),
/* 123 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(118);

module.exports = parent;


/***/ }),
/* 124 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayLikeToArray)
/* harmony export */ });
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

/***/ }),
/* 125 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _iterableToArray)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(126);
/* harmony import */ var _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(111);
/* harmony import */ var _babel_runtime_corejs3_core_js_array_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(135);



function _iterableToArray(iter) {
  if (typeof _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ !== "undefined" && _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_1__(iter) != null || iter["@@iterator"] != null) return _babel_runtime_corejs3_core_js_array_from__WEBPACK_IMPORTED_MODULE_2__(iter);
}

/***/ }),
/* 126 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(127);

/***/ }),
/* 127 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(58);
__webpack_require__(128);
__webpack_require__(129);
__webpack_require__(130);
__webpack_require__(131);
__webpack_require__(132);
// TODO: Remove from `core-js@4`
__webpack_require__(133);
// TODO: Remove from `core-js@4`
__webpack_require__(134);

module.exports = parent;


/***/ }),
/* 128 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.asyncDispose` well-known symbol
// https://github.com/tc39/proposal-using-statement
defineWellKnownSymbol('asyncDispose');


/***/ }),
/* 129 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.dispose` well-known symbol
// https://github.com/tc39/proposal-using-statement
defineWellKnownSymbol('dispose');


/***/ }),
/* 130 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.matcher` well-known symbol
// https://github.com/tc39/proposal-pattern-matching
defineWellKnownSymbol('matcher');


/***/ }),
/* 131 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.metadata` well-known symbol
// https://github.com/tc39/proposal-decorators
defineWellKnownSymbol('metadata');


/***/ }),
/* 132 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.observable` well-known symbol
// https://github.com/tc39/proposal-observable
defineWellKnownSymbol('observable');


/***/ }),
/* 133 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

// TODO: remove from `core-js@4`
var defineWellKnownSymbol = __webpack_require__(73);

// `Symbol.patternMatch` well-known symbol
// https://github.com/tc39/proposal-pattern-matching
defineWellKnownSymbol('patternMatch');


/***/ }),
/* 134 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

// TODO: remove from `core-js@4`
var defineWellKnownSymbol = __webpack_require__(73);

defineWellKnownSymbol('replaceAll');


/***/ }),
/* 135 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(136);

/***/ }),
/* 136 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(137);

module.exports = parent;


/***/ }),
/* 137 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(113);
__webpack_require__(138);
var path = __webpack_require__(21);

module.exports = path.Array.from;


/***/ }),
/* 138 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var from = __webpack_require__(139);
var checkCorrectnessOfIteration = __webpack_require__(143);

var INCORRECT_ITERATION = !checkCorrectnessOfIteration(function (iterable) {
  // eslint-disable-next-line es/no-array-from -- required for testing
  Array.from(iterable);
});

// `Array.from` method
// https://tc39.es/ecma262/#sec-array.from
$({ target: 'Array', stat: true, forced: INCORRECT_ITERATION }, {
  from: from
});


/***/ }),
/* 139 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var bind = __webpack_require__(38);
var toObject = __webpack_require__(33);
var callWithSafeIterationClosing = __webpack_require__(140);
var isArrayIteratorMethod = __webpack_require__(142);
var toLength = __webpack_require__(48);
var createProperty = __webpack_require__(61);
var getIteratorMethod = __webpack_require__(115);

// `Array.from` method implementation
// https://tc39.es/ecma262/#sec-array.from
module.exports = function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
  var O = toObject(arrayLike);
  var C = typeof this == 'function' ? this : Array;
  var argumentsLength = arguments.length;
  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
  var mapping = mapfn !== undefined;
  var iteratorMethod = getIteratorMethod(O);
  var index = 0;
  var length, result, step, iterator, next, value;
  if (mapping) mapfn = bind(mapfn, argumentsLength > 2 ? arguments[2] : undefined, 2);
  // if the target is not iterable or it's an array with the default iterator - use a simple case
  if (iteratorMethod != undefined && !(C == Array && isArrayIteratorMethod(iteratorMethod))) {
    iterator = iteratorMethod.call(O);
    next = iterator.next;
    result = new C();
    for (;!(step = next.call(iterator)).done; index++) {
      value = mapping ? callWithSafeIterationClosing(iterator, mapfn, [step.value, index], true) : step.value;
      createProperty(result, index, value);
    }
  } else {
    length = toLength(O.length);
    result = new C(length);
    for (;length > index; index++) {
      value = mapping ? mapfn(O[index], index) : O[index];
      createProperty(result, index, value);
    }
  }
  result.length = index;
  return result;
};


/***/ }),
/* 140 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(42);
var iteratorClose = __webpack_require__(141);

// call something on iterator step with safe closing on error
module.exports = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  } catch (error) {
    iteratorClose(iterator);
    throw error;
  }
};


/***/ }),
/* 141 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(42);

module.exports = function (iterator) {
  var returnMethod = iterator['return'];
  if (returnMethod !== undefined) {
    return anObject(returnMethod.call(iterator)).value;
  }
};


/***/ }),
/* 142 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(27);
var Iterators = __webpack_require__(102);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};


/***/ }),
/* 143 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(27);

var ITERATOR = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR] = function () {
    return this;
  };
  // eslint-disable-next-line es/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

module.exports = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};


/***/ }),
/* 144 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _unsupportedIterableToArray)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_instance_slice__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(145);
/* harmony import */ var _babel_runtime_corejs3_core_js_array_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(135);
/* harmony import */ var _arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(124);



function _unsupportedIterableToArray(o, minLen) {
  var _context;

  if (!o) return;
  if (typeof o === "string") return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_2__.default)(o, minLen);

  var n = _babel_runtime_corejs3_core_js_instance_slice__WEBPACK_IMPORTED_MODULE_0__(_context = Object.prototype.toString.call(o)).call(_context, 8, -1);

  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return _babel_runtime_corejs3_core_js_array_from__WEBPACK_IMPORTED_MODULE_1__(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_2__.default)(o, minLen);
}

/***/ }),
/* 145 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(146);

/***/ }),
/* 146 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(147);

module.exports = parent;


/***/ }),
/* 147 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var slice = __webpack_require__(148);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.slice;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.slice) ? slice : own;
};


/***/ }),
/* 148 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(149);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').slice;


/***/ }),
/* 149 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var isObject = __webpack_require__(18);
var isArray = __webpack_require__(60);
var toAbsoluteIndex = __webpack_require__(50);
var toLength = __webpack_require__(48);
var toIndexedObject = __webpack_require__(12);
var createProperty = __webpack_require__(61);
var wellKnownSymbol = __webpack_require__(27);
var arrayMethodHasSpeciesSupport = __webpack_require__(64);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('slice');

var SPECIES = wellKnownSymbol('species');
var nativeSlice = [].slice;
var max = Math.max;

// `Array.prototype.slice` method
// https://tc39.es/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  slice: function slice(start, end) {
    var O = toIndexedObject(this);
    var length = toLength(O.length);
    var k = toAbsoluteIndex(start, length);
    var fin = toAbsoluteIndex(end === undefined ? length : end, length);
    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
    var Constructor, result, n;
    if (isArray(O)) {
      Constructor = O.constructor;
      // cross-realm fallback
      if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
        Constructor = undefined;
      } else if (isObject(Constructor)) {
        Constructor = Constructor[SPECIES];
        if (Constructor === null) Constructor = undefined;
      }
      if (Constructor === Array || Constructor === undefined) {
        return nativeSlice.call(O, k, fin);
      }
    }
    result = new (Constructor === undefined ? Array : Constructor)(max(fin - k, 0));
    for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
    result.length = n;
    return result;
  }
});


/***/ }),
/* 150 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var path = __webpack_require__(21);

module.exports = function (CONSTRUCTOR) {
  return path[CONSTRUCTOR + 'Prototype'];
};


/***/ }),
/* 151 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _nonIterableSpread)
/* harmony export */ });
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

/***/ }),
/* 152 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _asyncToGenerator)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_promise__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(153);


function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    _babel_runtime_corejs3_core_js_promise__WEBPACK_IMPORTED_MODULE_0__.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new _babel_runtime_corejs3_core_js_promise__WEBPACK_IMPORTED_MODULE_0__(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

/***/ }),
/* 153 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(154);

/***/ }),
/* 154 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(155);
__webpack_require__(177);
// TODO: Remove from `core-js@4`
__webpack_require__(178);
__webpack_require__(179);
__webpack_require__(180);

module.exports = parent;


/***/ }),
/* 155 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(156);
__webpack_require__(100);
__webpack_require__(65);
__webpack_require__(158);
__webpack_require__(174);
__webpack_require__(175);
__webpack_require__(176);
__webpack_require__(113);
var path = __webpack_require__(21);

module.exports = path.Promise;


/***/ }),
/* 156 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var getPrototypeOf = __webpack_require__(106);
var setPrototypeOf = __webpack_require__(108);
var create = __webpack_require__(43);
var createNonEnumerableProperty = __webpack_require__(40);
var createPropertyDescriptor = __webpack_require__(11);
var iterate = __webpack_require__(157);
var toString = __webpack_require__(67);

var $AggregateError = function AggregateError(errors, message) {
  var that = this;
  if (!(that instanceof $AggregateError)) return new $AggregateError(errors, message);
  if (setPrototypeOf) {
    // eslint-disable-next-line unicorn/error-message -- expected
    that = setPrototypeOf(new Error(undefined), getPrototypeOf(that));
  }
  if (message !== undefined) createNonEnumerableProperty(that, 'message', toString(message));
  var errorsArray = [];
  iterate(errors, errorsArray.push, { that: errorsArray });
  createNonEnumerableProperty(that, 'errors', errorsArray);
  return that;
};

$AggregateError.prototype = create(Error.prototype, {
  constructor: createPropertyDescriptor(5, $AggregateError),
  message: createPropertyDescriptor(5, ''),
  name: createPropertyDescriptor(5, 'AggregateError')
});

// `AggregateError` constructor
// https://tc39.es/ecma262/#sec-aggregate-error-constructor
$({ global: true }, {
  AggregateError: $AggregateError
});


/***/ }),
/* 157 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(42);
var isArrayIteratorMethod = __webpack_require__(142);
var toLength = __webpack_require__(48);
var bind = __webpack_require__(38);
var getIteratorMethod = __webpack_require__(115);
var iteratorClose = __webpack_require__(141);

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that, 1 + AS_ENTRIES + INTERRUPTED);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    }
    iterator = iterFn.call(iterable);
  }

  next = iterator.next;
  while (!(step = next.call(iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator);
      throw error;
    }
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};


/***/ }),
/* 158 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var IS_PURE = __webpack_require__(29);
var global = __webpack_require__(6);
var getBuiltIn = __webpack_require__(20);
var NativePromise = __webpack_require__(159);
var redefine = __webpack_require__(71);
var redefineAll = __webpack_require__(160);
var setPrototypeOf = __webpack_require__(108);
var setToStringTag = __webpack_require__(74);
var setSpecies = __webpack_require__(161);
var isObject = __webpack_require__(18);
var aFunction = __webpack_require__(39);
var anInstance = __webpack_require__(162);
var inspectSource = __webpack_require__(80);
var iterate = __webpack_require__(157);
var checkCorrectnessOfIteration = __webpack_require__(143);
var speciesConstructor = __webpack_require__(163);
var task = __webpack_require__(164).set;
var microtask = __webpack_require__(167);
var promiseResolve = __webpack_require__(169);
var hostReportErrors = __webpack_require__(171);
var newPromiseCapabilityModule = __webpack_require__(170);
var perform = __webpack_require__(172);
var InternalStateModule = __webpack_require__(78);
var isForced = __webpack_require__(37);
var wellKnownSymbol = __webpack_require__(27);
var IS_BROWSER = __webpack_require__(173);
var IS_NODE = __webpack_require__(166);
var V8_VERSION = __webpack_require__(24);

var SPECIES = wellKnownSymbol('species');
var PROMISE = 'Promise';
var getInternalState = InternalStateModule.get;
var setInternalState = InternalStateModule.set;
var getInternalPromiseState = InternalStateModule.getterFor(PROMISE);
var NativePromisePrototype = NativePromise && NativePromise.prototype;
var PromiseConstructor = NativePromise;
var PromiseConstructorPrototype = NativePromisePrototype;
var TypeError = global.TypeError;
var document = global.document;
var process = global.process;
var newPromiseCapability = newPromiseCapabilityModule.f;
var newGenericPromiseCapability = newPromiseCapability;
var DISPATCH_EVENT = !!(document && document.createEvent && global.dispatchEvent);
var NATIVE_REJECTION_EVENT = typeof PromiseRejectionEvent == 'function';
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;
var SUBCLASSING = false;
var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

var FORCED = isForced(PROMISE, function () {
  var PROMISE_CONSTRUCTOR_SOURCE = inspectSource(PromiseConstructor);
  var GLOBAL_CORE_JS_PROMISE = PROMISE_CONSTRUCTOR_SOURCE !== String(PromiseConstructor);
  // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
  // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
  // We can't detect it synchronously, so just check versions
  if (!GLOBAL_CORE_JS_PROMISE && V8_VERSION === 66) return true;
  // We need Promise#finally in the pure version for preventing prototype pollution
  if (IS_PURE && !PromiseConstructorPrototype['finally']) return true;
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (V8_VERSION >= 51 && /native code/.test(PROMISE_CONSTRUCTOR_SOURCE)) return false;
  // Detect correctness of subclassing with @@species support
  var promise = new PromiseConstructor(function (resolve) { resolve(1); });
  var FakePromise = function (exec) {
    exec(function () { /* empty */ }, function () { /* empty */ });
  };
  var constructor = promise.constructor = {};
  constructor[SPECIES] = FakePromise;
  SUBCLASSING = promise.then(function () { /* empty */ }) instanceof FakePromise;
  if (!SUBCLASSING) return true;
  // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
  return !GLOBAL_CORE_JS_PROMISE && IS_BROWSER && !NATIVE_REJECTION_EVENT;
});

var INCORRECT_ITERATION = FORCED || !checkCorrectnessOfIteration(function (iterable) {
  PromiseConstructor.all(iterable)['catch'](function () { /* empty */ });
});

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};

var notify = function (state, isReject) {
  if (state.notified) return;
  state.notified = true;
  var chain = state.reactions;
  microtask(function () {
    var value = state.value;
    var ok = state.state == FULFILLED;
    var index = 0;
    // variable length - can't use forEach
    while (chain.length > index) {
      var reaction = chain[index++];
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (state.rejection === UNHANDLED) onHandleUnhandled(state);
            state.rejection = HANDLED;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // can throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (error) {
        if (domain && !exited) domain.exit();
        reject(error);
      }
    }
    state.reactions = [];
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    global.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (!NATIVE_REJECTION_EVENT && (handler = global['on' + name])) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (state) {
  task.call(global, function () {
    var promise = state.facade;
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE) {
          process.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (state) {
  task.call(global, function () {
    var promise = state.facade;
    if (IS_NODE) {
      process.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, state, unwrap) {
  return function (value) {
    fn(state, value, unwrap);
  };
};

var internalReject = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify(state, true);
};

var internalResolve = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (state.facade === value) throw TypeError("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          then.call(value,
            bind(internalResolve, wrapper, state),
            bind(internalReject, wrapper, state)
          );
        } catch (error) {
          internalReject(wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify(state, false);
    }
  } catch (error) {
    internalReject({ done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromiseConstructor, PROMISE);
    aFunction(executor);
    Internal.call(this);
    var state = getInternalState(this);
    try {
      executor(bind(internalResolve, state), bind(internalReject, state));
    } catch (error) {
      internalReject(state, error);
    }
  };
  PromiseConstructorPrototype = PromiseConstructor.prototype;
  // eslint-disable-next-line no-unused-vars -- required for `.length`
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: [],
      rejection: false,
      state: PENDING,
      value: undefined
    });
  };
  Internal.prototype = redefineAll(PromiseConstructorPrototype, {
    // `Promise.prototype.then` method
    // https://tc39.es/ecma262/#sec-promise.prototype.then
    then: function then(onFulfilled, onRejected) {
      var state = getInternalPromiseState(this);
      var reaction = newPromiseCapability(speciesConstructor(this, PromiseConstructor));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = IS_NODE ? process.domain : undefined;
      state.parent = true;
      state.reactions.push(reaction);
      if (state.state != PENDING) notify(state, false);
      return reaction.promise;
    },
    // `Promise.prototype.catch` method
    // https://tc39.es/ecma262/#sec-promise.prototype.catch
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, state);
    this.reject = bind(internalReject, state);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if (!IS_PURE && typeof NativePromise == 'function' && NativePromisePrototype !== Object.prototype) {
    nativeThen = NativePromisePrototype.then;

    if (!SUBCLASSING) {
      // make `Promise#then` return a polyfilled `Promise` for native promise-based APIs
      redefine(NativePromisePrototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          nativeThen.call(that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });

      // makes sure that native promise-based APIs `Promise#catch` properly works with patched `Promise#then`
      redefine(NativePromisePrototype, 'catch', PromiseConstructorPrototype['catch'], { unsafe: true });
    }

    // make `.constructor === Promise` work for native promise-based APIs
    try {
      delete NativePromisePrototype.constructor;
    } catch (error) { /* empty */ }

    // make `instanceof Promise` work for native promise-based APIs
    if (setPrototypeOf) {
      setPrototypeOf(NativePromisePrototype, PromiseConstructorPrototype);
    }
  }
}

$({ global: true, wrap: true, forced: FORCED }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false, true);
setSpecies(PROMISE);

PromiseWrapper = getBuiltIn(PROMISE);

// statics
$({ target: PROMISE, stat: true, forced: FORCED }, {
  // `Promise.reject` method
  // https://tc39.es/ecma262/#sec-promise.reject
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    capability.reject.call(undefined, r);
    return capability.promise;
  }
});

$({ target: PROMISE, stat: true, forced: IS_PURE || FORCED }, {
  // `Promise.resolve` method
  // https://tc39.es/ecma262/#sec-promise.resolve
  resolve: function resolve(x) {
    return promiseResolve(IS_PURE && this === PromiseWrapper ? PromiseConstructor : this, x);
  }
});

$({ target: PROMISE, stat: true, forced: INCORRECT_ITERATION }, {
  // `Promise.all` method
  // https://tc39.es/ecma262/#sec-promise.all
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        $promiseResolve.call(C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  },
  // `Promise.race` method
  // https://tc39.es/ecma262/#sec-promise.race
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction(C.resolve);
      iterate(iterable, function (promise) {
        $promiseResolve.call(C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),
/* 159 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);

module.exports = global.Promise;


/***/ }),
/* 160 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var redefine = __webpack_require__(71);

module.exports = function (target, src, options) {
  for (var key in src) {
    if (options && options.unsafe && target[key]) target[key] = src[key];
    else redefine(target, key, src[key], options);
  } return target;
};


/***/ }),
/* 161 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var getBuiltIn = __webpack_require__(20);
var definePropertyModule = __webpack_require__(41);
var wellKnownSymbol = __webpack_require__(27);
var DESCRIPTORS = __webpack_require__(8);

var SPECIES = wellKnownSymbol('species');

module.exports = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = definePropertyModule.f;

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineProperty(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};


/***/ }),
/* 162 */
/***/ ((module) => {

module.exports = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};


/***/ }),
/* 163 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(42);
var aFunction = __webpack_require__(39);
var wellKnownSymbol = __webpack_require__(27);

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.es/ecma262/#sec-speciesconstructor
module.exports = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? defaultConstructor : aFunction(S);
};


/***/ }),
/* 164 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var fails = __webpack_require__(9);
var bind = __webpack_require__(38);
var html = __webpack_require__(53);
var createElement = __webpack_require__(36);
var IS_IOS = __webpack_require__(165);
var IS_NODE = __webpack_require__(166);

var set = global.setImmediate;
var clear = global.clearImmediate;
var process = global.process;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var location, defer, channel, port;

try {
  // Deno throws a ReferenceError on `location` access without `--location` flag
  location = global.location;
} catch (error) { /* empty */ }

var run = function (id) {
  // eslint-disable-next-line no-prototype-builtins -- safe
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var listener = function (event) {
  run(event.data);
};

var post = function (id) {
  // old engines have not location.origin
  global.postMessage(String(id), location.protocol + '//' + location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(fn) {
    var args = [];
    var argumentsLength = arguments.length;
    var i = 1;
    while (argumentsLength > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func -- spec requirement
      (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (IS_NODE) {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !IS_IOS) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = bind(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    global.addEventListener &&
    typeof postMessage == 'function' &&
    !global.importScripts &&
    location && location.protocol !== 'file:' &&
    !fails(post)
  ) {
    defer = post;
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
};


/***/ }),
/* 165 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var userAgent = __webpack_require__(25);

module.exports = /(?:iphone|ipod|ipad).*applewebkit/i.test(userAgent);


/***/ }),
/* 166 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(14);
var global = __webpack_require__(6);

module.exports = classof(global.process) == 'process';


/***/ }),
/* 167 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);
var getOwnPropertyDescriptor = __webpack_require__(7).f;
var macrotask = __webpack_require__(164).set;
var IS_IOS = __webpack_require__(165);
var IS_WEBOS_WEBKIT = __webpack_require__(168);
var IS_NODE = __webpack_require__(166);

var MutationObserver = global.MutationObserver || global.WebKitMutationObserver;
var document = global.document;
var process = global.process;
var Promise = global.Promise;
// Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
var queueMicrotaskDescriptor = getOwnPropertyDescriptor(global, 'queueMicrotask');
var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

var flush, head, last, notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!queueMicrotask) {
  flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (error) {
        if (head) notify();
        else last = undefined;
        throw error;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  // also except WebOS Webkit https://github.com/zloirock/core-js/issues/898
  if (!IS_IOS && !IS_NODE && !IS_WEBOS_WEBKIT && MutationObserver && document) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise.resolve(undefined);
    // workaround of WebKit ~ iOS Safari 10.1 bug
    promise.constructor = Promise;
    then = promise.then;
    notify = function () {
      then.call(promise, flush);
    };
  // Node.js without promises
  } else if (IS_NODE) {
    notify = function () {
      process.nextTick(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }
}

module.exports = queueMicrotask || function (fn) {
  var task = { fn: fn, next: undefined };
  if (last) last.next = task;
  if (!head) {
    head = task;
    notify();
  } last = task;
};


/***/ }),
/* 168 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var userAgent = __webpack_require__(25);

module.exports = /web0s(?!.*chrome)/i.test(userAgent);


/***/ }),
/* 169 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(42);
var isObject = __webpack_require__(18);
var newPromiseCapability = __webpack_require__(170);

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};


/***/ }),
/* 170 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var aFunction = __webpack_require__(39);

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
};

// `NewPromiseCapability` abstract operation
// https://tc39.es/ecma262/#sec-newpromisecapability
module.exports.f = function (C) {
  return new PromiseCapability(C);
};


/***/ }),
/* 171 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(6);

module.exports = function (a, b) {
  var console = global.console;
  if (console && console.error) {
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  }
};


/***/ }),
/* 172 */
/***/ ((module) => {

module.exports = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};


/***/ }),
/* 173 */
/***/ ((module) => {

module.exports = typeof window == 'object';


/***/ }),
/* 174 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var aFunction = __webpack_require__(39);
var newPromiseCapabilityModule = __webpack_require__(170);
var perform = __webpack_require__(172);
var iterate = __webpack_require__(157);

// `Promise.allSettled` method
// https://tc39.es/ecma262/#sec-promise.allsettled
$({ target: 'Promise', stat: true }, {
  allSettled: function allSettled(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aFunction(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        promiseResolve.call(C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'fulfilled', value: value };
          --remaining || resolve(values);
        }, function (error) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'rejected', reason: error };
          --remaining || resolve(values);
        });
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),
/* 175 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var aFunction = __webpack_require__(39);
var getBuiltIn = __webpack_require__(20);
var newPromiseCapabilityModule = __webpack_require__(170);
var perform = __webpack_require__(172);
var iterate = __webpack_require__(157);

var PROMISE_ANY_ERROR = 'No one promise resolved';

// `Promise.any` method
// https://tc39.es/ecma262/#sec-promise.any
$({ target: 'Promise', stat: true }, {
  any: function any(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aFunction(C.resolve);
      var errors = [];
      var counter = 0;
      var remaining = 1;
      var alreadyResolved = false;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyRejected = false;
        errors.push(undefined);
        remaining++;
        promiseResolve.call(C, promise).then(function (value) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyResolved = true;
          resolve(value);
        }, function (error) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyRejected = true;
          errors[index] = error;
          --remaining || reject(new (getBuiltIn('AggregateError'))(errors, PROMISE_ANY_ERROR));
        });
      });
      --remaining || reject(new (getBuiltIn('AggregateError'))(errors, PROMISE_ANY_ERROR));
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),
/* 176 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var IS_PURE = __webpack_require__(29);
var NativePromise = __webpack_require__(159);
var fails = __webpack_require__(9);
var getBuiltIn = __webpack_require__(20);
var speciesConstructor = __webpack_require__(163);
var promiseResolve = __webpack_require__(169);
var redefine = __webpack_require__(71);

// Safari bug https://bugs.webkit.org/show_bug.cgi?id=200829
var NON_GENERIC = !!NativePromise && fails(function () {
  NativePromise.prototype['finally'].call({ then: function () { /* empty */ } }, function () { /* empty */ });
});

// `Promise.prototype.finally` method
// https://tc39.es/ecma262/#sec-promise.prototype.finally
$({ target: 'Promise', proto: true, real: true, forced: NON_GENERIC }, {
  'finally': function (onFinally) {
    var C = speciesConstructor(this, getBuiltIn('Promise'));
    var isFunction = typeof onFinally == 'function';
    return this.then(
      isFunction ? function (x) {
        return promiseResolve(C, onFinally()).then(function () { return x; });
      } : onFinally,
      isFunction ? function (e) {
        return promiseResolve(C, onFinally()).then(function () { throw e; });
      } : onFinally
    );
  }
});

// makes sure that native promise-based APIs `Promise#finally` properly works with patched `Promise#then`
if (!IS_PURE && typeof NativePromise == 'function') {
  var method = getBuiltIn('Promise').prototype['finally'];
  if (NativePromise.prototype['finally'] !== method) {
    redefine(NativePromise.prototype, 'finally', method, { unsafe: true });
  }
}


/***/ }),
/* 177 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

// TODO: Remove from `core-js@4`
__webpack_require__(156);


/***/ }),
/* 178 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

// TODO: Remove from `core-js@4`
__webpack_require__(174);


/***/ }),
/* 179 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var newPromiseCapabilityModule = __webpack_require__(170);
var perform = __webpack_require__(172);

// `Promise.try` method
// https://github.com/tc39/proposal-promise-try
$({ target: 'Promise', stat: true }, {
  'try': function (callbackfn) {
    var promiseCapability = newPromiseCapabilityModule.f(this);
    var result = perform(callbackfn);
    (result.error ? promiseCapability.reject : promiseCapability.resolve)(result.value);
    return promiseCapability.promise;
  }
});


/***/ }),
/* 180 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

// TODO: Remove from `core-js@4`
__webpack_require__(175);


/***/ }),
/* 181 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _classCallCheck)
/* harmony export */ });
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/***/ }),
/* 182 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _createClass)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(183);


function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;

    _babel_runtime_corejs3_core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

/***/ }),
/* 183 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(184);

/***/ }),
/* 184 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(185);

module.exports = parent;


/***/ }),
/* 185 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(186);
var path = __webpack_require__(21);

var Object = path.Object;

var defineProperty = module.exports = function defineProperty(it, key, desc) {
  return Object.defineProperty(it, key, desc);
};

if (Object.defineProperty.sham) defineProperty.sham = true;


/***/ }),
/* 186 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var DESCRIPTORS = __webpack_require__(8);
var objectDefinePropertyModile = __webpack_require__(41);

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
$({ target: 'Object', stat: true, forced: !DESCRIPTORS, sham: !DESCRIPTORS }, {
  defineProperty: objectDefinePropertyModile.f
});


/***/ }),
/* 187 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _inherits)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_object_create__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(188);
/* harmony import */ var _setPrototypeOf_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(192);


function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = _babel_runtime_corejs3_core_js_object_create__WEBPACK_IMPORTED_MODULE_0__(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) (0,_setPrototypeOf_js__WEBPACK_IMPORTED_MODULE_1__.default)(subClass, superClass);
}

/***/ }),
/* 188 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(189);

/***/ }),
/* 189 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(190);

module.exports = parent;


/***/ }),
/* 190 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(191);
var path = __webpack_require__(21);

var Object = path.Object;

module.exports = function create(P, D) {
  return Object.create(P, D);
};


/***/ }),
/* 191 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var DESCRIPTORS = __webpack_require__(8);
var create = __webpack_require__(43);

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
$({ target: 'Object', stat: true, sham: !DESCRIPTORS }, {
  create: create
});


/***/ }),
/* 192 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _setPrototypeOf)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(193);

function _setPrototypeOf(o, p) {
  _setPrototypeOf = _babel_runtime_corejs3_core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0__ || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

/***/ }),
/* 193 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(194);

/***/ }),
/* 194 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(195);

module.exports = parent;


/***/ }),
/* 195 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(196);
var path = __webpack_require__(21);

module.exports = path.Object.setPrototypeOf;


/***/ }),
/* 196 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var setPrototypeOf = __webpack_require__(108);

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
$({ target: 'Object', stat: true }, {
  setPrototypeOf: setPrototypeOf
});


/***/ }),
/* 197 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _possibleConstructorReturn)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(198);
/* harmony import */ var _assertThisInitialized_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(202);


function _possibleConstructorReturn(self, call) {
  if (call && ((0,_babel_runtime_corejs3_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__.default)(call) === "object" || typeof call === "function")) {
    return call;
  }

  return (0,_assertThisInitialized_js__WEBPACK_IMPORTED_MODULE_1__.default)(self);
}

/***/ }),
/* 198 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _typeof)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(126);
/* harmony import */ var _babel_runtime_corejs3_core_js_symbol_iterator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(199);


function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ === "function" && typeof _babel_runtime_corejs3_core_js_symbol_iterator__WEBPACK_IMPORTED_MODULE_1__ === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ === "function" && obj.constructor === _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ && obj !== _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

/***/ }),
/* 199 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(200);

/***/ }),
/* 200 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(201);

module.exports = parent;


/***/ }),
/* 201 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(100);
__webpack_require__(65);
__webpack_require__(113);
__webpack_require__(86);
var WrappedWellKnownSymbolModule = __webpack_require__(72);

module.exports = WrappedWellKnownSymbolModule.f('iterator');


/***/ }),
/* 202 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _assertThisInitialized)
/* harmony export */ });
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

/***/ }),
/* 203 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _getPrototypeOf)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(193);
/* harmony import */ var _babel_runtime_corejs3_core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(204);


function _getPrototypeOf(o) {
  _getPrototypeOf = _babel_runtime_corejs3_core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0__ ? _babel_runtime_corejs3_core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_1__ : function _getPrototypeOf(o) {
    return o.__proto__ || _babel_runtime_corejs3_core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_1__(o);
  };
  return _getPrototypeOf(o);
}

/***/ }),
/* 204 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(205);

/***/ }),
/* 205 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(206);

module.exports = parent;


/***/ }),
/* 206 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(207);
var path = __webpack_require__(21);

module.exports = path.Object.getPrototypeOf;


/***/ }),
/* 207 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var fails = __webpack_require__(9);
var toObject = __webpack_require__(33);
var nativeGetPrototypeOf = __webpack_require__(106);
var CORRECT_PROTOTYPE_GETTER = __webpack_require__(107);

var FAILS_ON_PRIMITIVES = fails(function () { nativeGetPrototypeOf(1); });

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
$({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES, sham: !CORRECT_PROTOTYPE_GETTER }, {
  getPrototypeOf: function getPrototypeOf(it) {
    return nativeGetPrototypeOf(toObject(it));
  }
});



/***/ }),
/* 208 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(209);

/***/ }),
/* 209 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(147);

module.exports = parent;


/***/ }),
/* 210 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(211);

/***/ }),
/* 211 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(137);

module.exports = parent;


/***/ }),
/* 212 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(213);


/***/ }),
/* 213 */
/***/ ((module) => {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  define(Gp, "constructor", GeneratorFunctionPrototype);
  define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  });
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  define(Gp, iteratorSymbol, function() {
    return this;
  });

  define(Gp, "toString", function() {
    return "[object Generator]";
  });

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   true ? module.exports : 0
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, in modern engines
  // we can explicitly access globalThis. In older engines we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}


/***/ }),
/* 214 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(215);
var exec = __webpack_require__(266);

// `RegExp.prototype.exec` method
// https://tc39.es/ecma262/#sec-regexp.prototype.exec
$({ target: 'RegExp', proto: true, forced: /./.exec !== exec }, {
  exec: exec
});


/***/ }),
/* 215 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var getOwnPropertyDescriptor = __webpack_require__(217).f;
var createNonEnumerableProperty = __webpack_require__(246);
var redefine = __webpack_require__(249);
var setGlobal = __webpack_require__(240);
var copyConstructorProperties = __webpack_require__(255);
var isForced = __webpack_require__(265);

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};


/***/ }),
/* 216 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof __webpack_require__.g == 'object' && __webpack_require__.g) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();


/***/ }),
/* 217 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(218);
var propertyIsEnumerableModule = __webpack_require__(220);
var createPropertyDescriptor = __webpack_require__(221);
var toIndexedObject = __webpack_require__(222);
var toPropertyKey = __webpack_require__(226);
var has = __webpack_require__(241);
var IE8_DOM_DEFINE = __webpack_require__(244);

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPropertyKey(P);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};


/***/ }),
/* 218 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(219);

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});


/***/ }),
/* 219 */
/***/ ((module) => {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};


/***/ }),
/* 220 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;


/***/ }),
/* 221 */
/***/ ((module) => {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),
/* 222 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// toObject with fallback for non-array-like ES3 strings
var IndexedObject = __webpack_require__(223);
var requireObjectCoercible = __webpack_require__(225);

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};


/***/ }),
/* 223 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(219);
var classof = __webpack_require__(224);

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;


/***/ }),
/* 224 */
/***/ ((module) => {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),
/* 225 */
/***/ ((module) => {

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};


/***/ }),
/* 226 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toPrimitive = __webpack_require__(227);
var isSymbol = __webpack_require__(229);

// `ToPropertyKey` abstract operation
// https://tc39.es/ecma262/#sec-topropertykey
module.exports = function (argument) {
  var key = toPrimitive(argument, 'string');
  return isSymbol(key) ? key : String(key);
};


/***/ }),
/* 227 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(228);
var isSymbol = __webpack_require__(229);
var ordinaryToPrimitive = __webpack_require__(235);
var wellKnownSymbol = __webpack_require__(236);

var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
module.exports = function (input, pref) {
  if (!isObject(input) || isSymbol(input)) return input;
  var exoticToPrim = input[TO_PRIMITIVE];
  var result;
  if (exoticToPrim !== undefined) {
    if (pref === undefined) pref = 'default';
    result = exoticToPrim.call(input, pref);
    if (!isObject(result) || isSymbol(result)) return result;
    throw TypeError("Can't convert object to primitive value");
  }
  if (pref === undefined) pref = 'number';
  return ordinaryToPrimitive(input, pref);
};


/***/ }),
/* 228 */
/***/ ((module) => {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),
/* 229 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(230);
var USE_SYMBOL_AS_UID = __webpack_require__(231);

module.exports = USE_SYMBOL_AS_UID ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn('Symbol');
  return typeof $Symbol == 'function' && Object(it) instanceof $Symbol;
};


/***/ }),
/* 230 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(global[namespace]) : global[namespace] && global[namespace][method];
};


/***/ }),
/* 231 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = __webpack_require__(232);

module.exports = NATIVE_SYMBOL
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';


/***/ }),
/* 232 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = __webpack_require__(233);
var fails = __webpack_require__(219);

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol();
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});


/***/ }),
/* 233 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var userAgent = __webpack_require__(234);

var process = global.process;
var Deno = global.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] < 4 ? 1 : match[0] + match[1];
} else if (userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

module.exports = version && +version;


/***/ }),
/* 234 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(230);

module.exports = getBuiltIn('navigator', 'userAgent') || '';


/***/ }),
/* 235 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(228);

// `OrdinaryToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
module.exports = function (input, pref) {
  var fn, val;
  if (pref === 'string' && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (pref !== 'string' && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),
/* 236 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var shared = __webpack_require__(237);
var has = __webpack_require__(241);
var uid = __webpack_require__(243);
var NATIVE_SYMBOL = __webpack_require__(232);
var USE_SYMBOL_AS_UID = __webpack_require__(231);

var WellKnownSymbolsStore = shared('wks');
var Symbol = global.Symbol;
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!has(WellKnownSymbolsStore, name) || !(NATIVE_SYMBOL || typeof WellKnownSymbolsStore[name] == 'string')) {
    if (NATIVE_SYMBOL && has(Symbol, name)) {
      WellKnownSymbolsStore[name] = Symbol[name];
    } else {
      WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    }
  } return WellKnownSymbolsStore[name];
};


/***/ }),
/* 237 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var IS_PURE = __webpack_require__(238);
var store = __webpack_require__(239);

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.16.1',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
});


/***/ }),
/* 238 */
/***/ ((module) => {

module.exports = false;


/***/ }),
/* 239 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var setGlobal = __webpack_require__(240);

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});

module.exports = store;


/***/ }),
/* 240 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);

module.exports = function (key, value) {
  try {
    // eslint-disable-next-line es/no-object-defineproperty -- safe
    Object.defineProperty(global, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    global[key] = value;
  } return value;
};


/***/ }),
/* 241 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toObject = __webpack_require__(242);

var hasOwnProperty = {}.hasOwnProperty;

module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty.call(toObject(it), key);
};


/***/ }),
/* 242 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var requireObjectCoercible = __webpack_require__(225);

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};


/***/ }),
/* 243 */
/***/ ((module) => {

var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};


/***/ }),
/* 244 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(218);
var fails = __webpack_require__(219);
var createElement = __webpack_require__(245);

// Thank's IE8 for his funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});


/***/ }),
/* 245 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var isObject = __webpack_require__(228);

var document = global.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};


/***/ }),
/* 246 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(218);
var definePropertyModule = __webpack_require__(247);
var createPropertyDescriptor = __webpack_require__(221);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),
/* 247 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(218);
var IE8_DOM_DEFINE = __webpack_require__(244);
var anObject = __webpack_require__(248);
var toPropertyKey = __webpack_require__(226);

// eslint-disable-next-line es/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),
/* 248 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(228);

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};


/***/ }),
/* 249 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var createNonEnumerableProperty = __webpack_require__(246);
var has = __webpack_require__(241);
var setGlobal = __webpack_require__(240);
var inspectSource = __webpack_require__(250);
var InternalStateModule = __webpack_require__(251);

var getInternalState = InternalStateModule.get;
var enforceInternalState = InternalStateModule.enforce;
var TEMPLATE = String(String).split('String');

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  var state;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) {
      createNonEnumerableProperty(value, 'name', key);
    }
    state = enforceInternalState(value);
    if (!state.source) {
      state.source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
  }
  if (O === global) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});


/***/ }),
/* 250 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var store = __webpack_require__(239);

var functionToString = Function.toString;

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof store.inspectSource != 'function') {
  store.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

module.exports = store.inspectSource;


/***/ }),
/* 251 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var NATIVE_WEAK_MAP = __webpack_require__(252);
var global = __webpack_require__(216);
var isObject = __webpack_require__(228);
var createNonEnumerableProperty = __webpack_require__(246);
var objectHas = __webpack_require__(241);
var shared = __webpack_require__(239);
var sharedKey = __webpack_require__(253);
var hiddenKeys = __webpack_require__(254);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function (it, metadata) {
    if (wmhas.call(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset.call(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store, it) || {};
  };
  has = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (objectHas(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};


/***/ }),
/* 252 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var inspectSource = __webpack_require__(250);

var WeakMap = global.WeakMap;

module.exports = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));


/***/ }),
/* 253 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var shared = __webpack_require__(237);
var uid = __webpack_require__(243);

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};


/***/ }),
/* 254 */
/***/ ((module) => {

module.exports = {};


/***/ }),
/* 255 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(241);
var ownKeys = __webpack_require__(256);
var getOwnPropertyDescriptorModule = __webpack_require__(217);
var definePropertyModule = __webpack_require__(247);

module.exports = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};


/***/ }),
/* 256 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(230);
var getOwnPropertyNamesModule = __webpack_require__(257);
var getOwnPropertySymbolsModule = __webpack_require__(264);
var anObject = __webpack_require__(248);

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};


/***/ }),
/* 257 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var internalObjectKeys = __webpack_require__(258);
var enumBugKeys = __webpack_require__(263);

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};


/***/ }),
/* 258 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(241);
var toIndexedObject = __webpack_require__(222);
var indexOf = __webpack_require__(259).indexOf;
var hiddenKeys = __webpack_require__(254);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};


/***/ }),
/* 259 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toIndexedObject = __webpack_require__(222);
var toLength = __webpack_require__(260);
var toAbsoluteIndex = __webpack_require__(262);

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};


/***/ }),
/* 260 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(261);

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};


/***/ }),
/* 261 */
/***/ ((module) => {

var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.es/ecma262/#sec-tointeger
module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};


/***/ }),
/* 262 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(261);

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};


/***/ }),
/* 263 */
/***/ ((module) => {

// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/***/ }),
/* 264 */
/***/ ((__unused_webpack_module, exports) => {

// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;


/***/ }),
/* 265 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(219);

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;


/***/ }),
/* 266 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

/* eslint-disable regexp/no-assertion-capturing-group, regexp/no-empty-group, regexp/no-lazy-ends -- testing */
/* eslint-disable regexp/no-useless-quantifier -- testing */
var toString = __webpack_require__(267);
var regexpFlags = __webpack_require__(268);
var stickyHelpers = __webpack_require__(269);
var shared = __webpack_require__(237);
var create = __webpack_require__(270);
var getInternalState = __webpack_require__(251).get;
var UNSUPPORTED_DOT_ALL = __webpack_require__(274);
var UNSUPPORTED_NCG = __webpack_require__(275);

var nativeExec = RegExp.prototype.exec;
var nativeReplace = shared('native-string-replace', String.prototype.replace);

var patchedExec = nativeExec;

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/;
  var re2 = /b*/g;
  nativeExec.call(re1, 'a');
  nativeExec.call(re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
})();

var UNSUPPORTED_Y = stickyHelpers.UNSUPPORTED_Y || stickyHelpers.BROKEN_CARET;

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y || UNSUPPORTED_DOT_ALL || UNSUPPORTED_NCG;

if (PATCH) {
  // eslint-disable-next-line max-statements -- TODO
  patchedExec = function exec(string) {
    var re = this;
    var state = getInternalState(re);
    var str = toString(string);
    var raw = state.raw;
    var result, reCopy, lastIndex, match, i, object, group;

    if (raw) {
      raw.lastIndex = re.lastIndex;
      result = patchedExec.call(raw, str);
      re.lastIndex = raw.lastIndex;
      return result;
    }

    var groups = state.groups;
    var sticky = UNSUPPORTED_Y && re.sticky;
    var flags = regexpFlags.call(re);
    var source = re.source;
    var charsAdded = 0;
    var strCopy = str;

    if (sticky) {
      flags = flags.replace('y', '');
      if (flags.indexOf('g') === -1) {
        flags += 'g';
      }

      strCopy = str.slice(re.lastIndex);
      // Support anchored sticky behavior.
      if (re.lastIndex > 0 && (!re.multiline || re.multiline && str.charAt(re.lastIndex - 1) !== '\n')) {
        source = '(?: ' + source + ')';
        strCopy = ' ' + strCopy;
        charsAdded++;
      }
      // ^(? + rx + ) is needed, in combination with some str slicing, to
      // simulate the 'y' flag.
      reCopy = new RegExp('^(?:' + source + ')', flags);
    }

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

    match = nativeExec.call(sticky ? reCopy : re, strCopy);

    if (sticky) {
      if (match) {
        match.input = match.input.slice(charsAdded);
        match[0] = match[0].slice(charsAdded);
        match.index = re.lastIndex;
        re.lastIndex += match[0].length;
      } else re.lastIndex = 0;
    } else if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      nativeReplace.call(match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    if (match && groups) {
      match.groups = object = create(null);
      for (i = 0; i < groups.length; i++) {
        group = groups[i];
        object[group[0]] = match[group[1]];
      }
    }

    return match;
  };
}

module.exports = patchedExec;


/***/ }),
/* 267 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isSymbol = __webpack_require__(229);

module.exports = function (argument) {
  if (isSymbol(argument)) throw TypeError('Cannot convert a Symbol value to a string');
  return String(argument);
};


/***/ }),
/* 268 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var anObject = __webpack_require__(248);

// `RegExp.prototype.flags` getter implementation
// https://tc39.es/ecma262/#sec-get-regexp.prototype.flags
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};


/***/ }),
/* 269 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var fails = __webpack_require__(219);

// babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError,
var RE = function (s, f) {
  return RegExp(s, f);
};

exports.UNSUPPORTED_Y = fails(function () {
  var re = RE('a', 'y');
  re.lastIndex = 2;
  return re.exec('abcd') != null;
});

exports.BROKEN_CARET = fails(function () {
  // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
  var re = RE('^r', 'gy');
  re.lastIndex = 2;
  return re.exec('str') != null;
});


/***/ }),
/* 270 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* global ActiveXObject -- old IE, WSH */
var anObject = __webpack_require__(248);
var defineProperties = __webpack_require__(271);
var enumBugKeys = __webpack_require__(263);
var hiddenKeys = __webpack_require__(254);
var html = __webpack_require__(273);
var documentCreateElement = __webpack_require__(245);
var sharedKey = __webpack_require__(253);

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  if (iframe.style) {
    iframe.style.display = 'none';
    html.appendChild(iframe);
    // https://github.com/zloirock/core-js/issues/475
    iframe.src = String(JS);
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(scriptTag('document.F=Object'));
    iframeDocument.close();
    return iframeDocument.F;
  }
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = document.domain && activeXDocument ?
    NullProtoObjectViaActiveX(activeXDocument) : // old IE
    NullProtoObjectViaIFrame() ||
    NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : defineProperties(result, Properties);
};


/***/ }),
/* 271 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(218);
var definePropertyModule = __webpack_require__(247);
var anObject = __webpack_require__(248);
var objectKeys = __webpack_require__(272);

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es/no-object-defineproperties -- safe
module.exports = DESCRIPTORS ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule.f(O, key = keys[index++], Properties[key]);
  return O;
};


/***/ }),
/* 272 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var internalObjectKeys = __webpack_require__(258);
var enumBugKeys = __webpack_require__(263);

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es/no-object-keys -- safe
module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};


/***/ }),
/* 273 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(230);

module.exports = getBuiltIn('document', 'documentElement');


/***/ }),
/* 274 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(219);

module.exports = fails(function () {
  // babel-minify transpiles RegExp('.', 's') -> /./s and it causes SyntaxError
  var re = RegExp('.', (typeof '').charAt(0));
  return !(re.dotAll && re.exec('\n') && re.flags === 's');
});


/***/ }),
/* 275 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(219);

module.exports = fails(function () {
  // babel-minify transpiles RegExp('.', 'g') -> /./g and it causes SyntaxError
  var re = RegExp('(?<a>b)', (typeof '').charAt(5));
  return re.exec('b').groups.a !== 'b' ||
    'b'.replace(re, '$<a>c') !== 'bc';
});


/***/ }),
/* 276 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fixRegExpWellKnownSymbolLogic = __webpack_require__(277);
var fails = __webpack_require__(219);
var anObject = __webpack_require__(248);
var toInteger = __webpack_require__(261);
var toLength = __webpack_require__(260);
var toString = __webpack_require__(267);
var requireObjectCoercible = __webpack_require__(225);
var advanceStringIndex = __webpack_require__(278);
var getSubstitution = __webpack_require__(280);
var regExpExec = __webpack_require__(281);
var wellKnownSymbol = __webpack_require__(236);

var REPLACE = wellKnownSymbol('replace');
var max = Math.max;
var min = Math.min;

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// IE <= 11 replaces $0 with the whole match, as if it was $&
// https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
var REPLACE_KEEPS_$0 = (function () {
  // eslint-disable-next-line regexp/prefer-escape-replacement-dollar-char -- required for testing
  return 'a'.replace(/./, '$0') === '$0';
})();

// Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
  if (/./[REPLACE]) {
    return /./[REPLACE]('a', '$0') === '';
  }
  return false;
})();

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  return ''.replace(re, '$<a>') !== '7';
});

// @@replace logic
fixRegExpWellKnownSymbolLogic('replace', function (_, nativeReplace, maybeCallNative) {
  var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE ? '$' : '$0';

  return [
    // `String.prototype.replace` method
    // https://tc39.es/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = requireObjectCoercible(this);
      var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
      return replacer !== undefined
        ? replacer.call(searchValue, O, replaceValue)
        : nativeReplace.call(toString(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@replace
    function (string, replaceValue) {
      var rx = anObject(this);
      var S = toString(string);

      if (
        typeof replaceValue === 'string' &&
        replaceValue.indexOf(UNSAFE_SUBSTITUTE) === -1 &&
        replaceValue.indexOf('$<') === -1
      ) {
        var res = maybeCallNative(nativeReplace, rx, S, replaceValue);
        if (res.done) return res.value;
      }

      var functionalReplace = typeof replaceValue === 'function';
      if (!functionalReplace) replaceValue = toString(replaceValue);

      var global = rx.global;
      if (global) {
        var fullUnicode = rx.unicode;
        rx.lastIndex = 0;
      }
      var results = [];
      while (true) {
        var result = regExpExec(rx, S);
        if (result === null) break;

        results.push(result);
        if (!global) break;

        var matchStr = toString(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
      }

      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var matched = toString(result[0]);
        var position = max(min(toInteger(result.index), S.length), 0);
        var captures = [];
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = [matched].concat(captures, position, S);
          if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
          var replacement = toString(replaceValue.apply(undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }
      return accumulatedResult + S.slice(nextSourcePosition);
    }
  ];
}, !REPLACE_SUPPORTS_NAMED_GROUPS || !REPLACE_KEEPS_$0 || REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE);


/***/ }),
/* 277 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// TODO: Remove from `core-js@4` since it's moved to entry points
__webpack_require__(214);
var redefine = __webpack_require__(249);
var regexpExec = __webpack_require__(266);
var fails = __webpack_require__(219);
var wellKnownSymbol = __webpack_require__(236);
var createNonEnumerableProperty = __webpack_require__(246);

var SPECIES = wellKnownSymbol('species');
var RegExpPrototype = RegExp.prototype;

module.exports = function (KEY, exec, FORCED, SHAM) {
  var SYMBOL = wellKnownSymbol(KEY);

  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegEp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;

    if (KEY === 'split') {
      // We can't use real regex here since it causes deoptimization
      // and serious performance degradation in V8
      // https://github.com/zloirock/core-js/issues/306
      re = {};
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES] = function () { return re; };
      re.flags = '';
      re[SYMBOL] = /./[SYMBOL];
    }

    re.exec = function () { execCalled = true; return null; };

    re[SYMBOL]('');
    return !execCalled;
  });

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    FORCED
  ) {
    var nativeRegExpMethod = /./[SYMBOL];
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      var $exec = regexp.exec;
      if ($exec === regexpExec || $exec === RegExpPrototype.exec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
        }
        return { done: true, value: nativeMethod.call(str, regexp, arg2) };
      }
      return { done: false };
    });

    redefine(String.prototype, KEY, methods[0]);
    redefine(RegExpPrototype, SYMBOL, methods[1]);
  }

  if (SHAM) createNonEnumerableProperty(RegExpPrototype[SYMBOL], 'sham', true);
};


/***/ }),
/* 278 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var charAt = __webpack_require__(279).charAt;

// `AdvanceStringIndex` abstract operation
// https://tc39.es/ecma262/#sec-advancestringindex
module.exports = function (S, index, unicode) {
  return index + (unicode ? charAt(S, index).length : 1);
};


/***/ }),
/* 279 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(261);
var toString = __webpack_require__(267);
var requireObjectCoercible = __webpack_require__(225);

// `String.prototype.codePointAt` methods implementation
var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = toString(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

module.exports = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};


/***/ }),
/* 280 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toObject = __webpack_require__(242);

var floor = Math.floor;
var replace = ''.replace;
var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d{1,2}|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d{1,2})/g;

// `GetSubstitution` abstract operation
// https://tc39.es/ecma262/#sec-getsubstitution
module.exports = function (matched, str, position, captures, namedCaptures, replacement) {
  var tailPos = position + matched.length;
  var m = captures.length;
  var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
  if (namedCaptures !== undefined) {
    namedCaptures = toObject(namedCaptures);
    symbols = SUBSTITUTION_SYMBOLS;
  }
  return replace.call(replacement, symbols, function (match, ch) {
    var capture;
    switch (ch.charAt(0)) {
      case '$': return '$';
      case '&': return matched;
      case '`': return str.slice(0, position);
      case "'": return str.slice(tailPos);
      case '<':
        capture = namedCaptures[ch.slice(1, -1)];
        break;
      default: // \d\d?
        var n = +ch;
        if (n === 0) return match;
        if (n > m) {
          var f = floor(n / 10);
          if (f === 0) return match;
          if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
          return match;
        }
        capture = captures[n - 1];
    }
    return capture === undefined ? '' : capture;
  });
};


/***/ }),
/* 281 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(224);
var regexpExec = __webpack_require__(266);

// `RegExpExec` abstract operation
// https://tc39.es/ecma262/#sec-regexpexec
module.exports = function (R, S) {
  var exec = R.exec;
  if (typeof exec === 'function') {
    var result = exec.call(R, S);
    if (typeof result !== 'object') {
      throw TypeError('RegExp exec method returned something other than an Object or null');
    }
    return result;
  }

  if (classof(R) !== 'RegExp') {
    throw TypeError('RegExp#exec called on incompatible receiver');
  }

  return regexpExec.call(R, S);
};



/***/ }),
/* 282 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(218);
var defineProperty = __webpack_require__(247).f;

var FunctionPrototype = Function.prototype;
var FunctionPrototypeToString = FunctionPrototype.toString;
var nameRE = /^\s*function ([^ (]*)/;
var NAME = 'name';

// Function instances `.name` property
// https://tc39.es/ecma262/#sec-function-instances-name
if (DESCRIPTORS && !(NAME in FunctionPrototype)) {
  defineProperty(FunctionPrototype, NAME, {
    configurable: true,
    get: function () {
      try {
        return FunctionPrototypeToString.call(this).match(nameRE)[1];
      } catch (error) {
        return '';
      }
    }
  });
}


/***/ }),
/* 283 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var toIndexedObject = __webpack_require__(222);
var addToUnscopables = __webpack_require__(284);
var Iterators = __webpack_require__(285);
var InternalStateModule = __webpack_require__(251);
var defineIterator = __webpack_require__(286);

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');


/***/ }),
/* 284 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(236);
var create = __webpack_require__(270);
var definePropertyModule = __webpack_require__(247);

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] == undefined) {
  definePropertyModule.f(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: create(null)
  });
}

// add a key to Array.prototype[@@unscopables]
module.exports = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};


/***/ }),
/* 285 */
/***/ ((module) => {

module.exports = {};


/***/ }),
/* 286 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(215);
var createIteratorConstructor = __webpack_require__(287);
var getPrototypeOf = __webpack_require__(289);
var setPrototypeOf = __webpack_require__(292);
var setToStringTag = __webpack_require__(291);
var createNonEnumerableProperty = __webpack_require__(246);
var redefine = __webpack_require__(249);
var wellKnownSymbol = __webpack_require__(236);
var IS_PURE = __webpack_require__(238);
var Iterators = __webpack_require__(285);
var IteratorsCore = __webpack_require__(288);

var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () { return this; };

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (IteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (typeof CurrentIteratorPrototype[ITERATOR] != 'function') {
          createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  }

  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;
    defaultIterator = function values() { return nativeIterator.call(this); };
  }

  // define iterator
  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    createNonEnumerableProperty(IterablePrototype, ITERATOR, defaultIterator);
  }
  Iterators[NAME] = defaultIterator;

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else $({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
  }

  return methods;
};


/***/ }),
/* 287 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var IteratorPrototype = __webpack_require__(288).IteratorPrototype;
var create = __webpack_require__(270);
var createPropertyDescriptor = __webpack_require__(221);
var setToStringTag = __webpack_require__(291);
var Iterators = __webpack_require__(285);

var returnThis = function () { return this; };

module.exports = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, { next: createPropertyDescriptor(1, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};


/***/ }),
/* 288 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fails = __webpack_require__(219);
var getPrototypeOf = __webpack_require__(289);
var createNonEnumerableProperty = __webpack_require__(246);
var has = __webpack_require__(241);
var wellKnownSymbol = __webpack_require__(236);
var IS_PURE = __webpack_require__(238);

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function () { return this; };

// `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

/* eslint-disable es/no-array-prototype-keys -- safe */
if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = IteratorPrototype == undefined || fails(function () {
  var test = {};
  // FF44- legacy iterators case
  return IteratorPrototype[ITERATOR].call(test) !== test;
});

if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};

// `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
if ((!IS_PURE || NEW_ITERATOR_PROTOTYPE) && !has(IteratorPrototype, ITERATOR)) {
  createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis);
}

module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};


/***/ }),
/* 289 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(241);
var toObject = __webpack_require__(242);
var sharedKey = __webpack_require__(253);
var CORRECT_PROTOTYPE_GETTER = __webpack_require__(290);

var IE_PROTO = sharedKey('IE_PROTO');
var ObjectPrototype = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
// eslint-disable-next-line es/no-object-getprototypeof -- safe
module.exports = CORRECT_PROTOTYPE_GETTER ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectPrototype : null;
};


/***/ }),
/* 290 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(219);

module.exports = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});


/***/ }),
/* 291 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var defineProperty = __webpack_require__(247).f;
var has = __webpack_require__(241);
var wellKnownSymbol = __webpack_require__(236);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

module.exports = function (it, TAG, STATIC) {
  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
    defineProperty(it, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};


/***/ }),
/* 292 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable no-proto -- safe */
var anObject = __webpack_require__(248);
var aPossiblePrototype = __webpack_require__(293);

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es/no-object-setprototypeof -- safe
module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);


/***/ }),
/* 293 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(228);

module.exports = function (it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  } return it;
};


/***/ }),
/* 294 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var TO_STRING_TAG_SUPPORT = __webpack_require__(295);
var redefine = __webpack_require__(249);
var toString = __webpack_require__(296);

// `Object.prototype.toString` method
// https://tc39.es/ecma262/#sec-object.prototype.tostring
if (!TO_STRING_TAG_SUPPORT) {
  redefine(Object.prototype, 'toString', toString, { unsafe: true });
}


/***/ }),
/* 295 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(236);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

module.exports = String(test) === '[object z]';


/***/ }),
/* 296 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var TO_STRING_TAG_SUPPORT = __webpack_require__(295);
var classof = __webpack_require__(297);

// `Object.prototype.toString` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.tostring
module.exports = TO_STRING_TAG_SUPPORT ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};


/***/ }),
/* 297 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var TO_STRING_TAG_SUPPORT = __webpack_require__(295);
var classofRaw = __webpack_require__(224);
var wellKnownSymbol = __webpack_require__(236);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};


/***/ }),
/* 298 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(215);
var IS_PURE = __webpack_require__(238);
var global = __webpack_require__(216);
var getBuiltIn = __webpack_require__(230);
var NativePromise = __webpack_require__(299);
var redefine = __webpack_require__(249);
var redefineAll = __webpack_require__(300);
var setPrototypeOf = __webpack_require__(292);
var setToStringTag = __webpack_require__(291);
var setSpecies = __webpack_require__(301);
var isObject = __webpack_require__(228);
var aFunction = __webpack_require__(302);
var anInstance = __webpack_require__(303);
var inspectSource = __webpack_require__(250);
var iterate = __webpack_require__(304);
var checkCorrectnessOfIteration = __webpack_require__(309);
var speciesConstructor = __webpack_require__(310);
var task = __webpack_require__(311).set;
var microtask = __webpack_require__(314);
var promiseResolve = __webpack_require__(317);
var hostReportErrors = __webpack_require__(319);
var newPromiseCapabilityModule = __webpack_require__(318);
var perform = __webpack_require__(320);
var InternalStateModule = __webpack_require__(251);
var isForced = __webpack_require__(265);
var wellKnownSymbol = __webpack_require__(236);
var IS_BROWSER = __webpack_require__(321);
var IS_NODE = __webpack_require__(313);
var V8_VERSION = __webpack_require__(233);

var SPECIES = wellKnownSymbol('species');
var PROMISE = 'Promise';
var getInternalState = InternalStateModule.get;
var setInternalState = InternalStateModule.set;
var getInternalPromiseState = InternalStateModule.getterFor(PROMISE);
var NativePromisePrototype = NativePromise && NativePromise.prototype;
var PromiseConstructor = NativePromise;
var PromiseConstructorPrototype = NativePromisePrototype;
var TypeError = global.TypeError;
var document = global.document;
var process = global.process;
var newPromiseCapability = newPromiseCapabilityModule.f;
var newGenericPromiseCapability = newPromiseCapability;
var DISPATCH_EVENT = !!(document && document.createEvent && global.dispatchEvent);
var NATIVE_REJECTION_EVENT = typeof PromiseRejectionEvent == 'function';
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;
var SUBCLASSING = false;
var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

var FORCED = isForced(PROMISE, function () {
  var PROMISE_CONSTRUCTOR_SOURCE = inspectSource(PromiseConstructor);
  var GLOBAL_CORE_JS_PROMISE = PROMISE_CONSTRUCTOR_SOURCE !== String(PromiseConstructor);
  // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
  // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
  // We can't detect it synchronously, so just check versions
  if (!GLOBAL_CORE_JS_PROMISE && V8_VERSION === 66) return true;
  // We need Promise#finally in the pure version for preventing prototype pollution
  if (IS_PURE && !PromiseConstructorPrototype['finally']) return true;
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (V8_VERSION >= 51 && /native code/.test(PROMISE_CONSTRUCTOR_SOURCE)) return false;
  // Detect correctness of subclassing with @@species support
  var promise = new PromiseConstructor(function (resolve) { resolve(1); });
  var FakePromise = function (exec) {
    exec(function () { /* empty */ }, function () { /* empty */ });
  };
  var constructor = promise.constructor = {};
  constructor[SPECIES] = FakePromise;
  SUBCLASSING = promise.then(function () { /* empty */ }) instanceof FakePromise;
  if (!SUBCLASSING) return true;
  // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
  return !GLOBAL_CORE_JS_PROMISE && IS_BROWSER && !NATIVE_REJECTION_EVENT;
});

var INCORRECT_ITERATION = FORCED || !checkCorrectnessOfIteration(function (iterable) {
  PromiseConstructor.all(iterable)['catch'](function () { /* empty */ });
});

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};

var notify = function (state, isReject) {
  if (state.notified) return;
  state.notified = true;
  var chain = state.reactions;
  microtask(function () {
    var value = state.value;
    var ok = state.state == FULFILLED;
    var index = 0;
    // variable length - can't use forEach
    while (chain.length > index) {
      var reaction = chain[index++];
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (state.rejection === UNHANDLED) onHandleUnhandled(state);
            state.rejection = HANDLED;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // can throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (error) {
        if (domain && !exited) domain.exit();
        reject(error);
      }
    }
    state.reactions = [];
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    global.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (!NATIVE_REJECTION_EVENT && (handler = global['on' + name])) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (state) {
  task.call(global, function () {
    var promise = state.facade;
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE) {
          process.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (state) {
  task.call(global, function () {
    var promise = state.facade;
    if (IS_NODE) {
      process.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, state, unwrap) {
  return function (value) {
    fn(state, value, unwrap);
  };
};

var internalReject = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify(state, true);
};

var internalResolve = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (state.facade === value) throw TypeError("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          then.call(value,
            bind(internalResolve, wrapper, state),
            bind(internalReject, wrapper, state)
          );
        } catch (error) {
          internalReject(wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify(state, false);
    }
  } catch (error) {
    internalReject({ done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromiseConstructor, PROMISE);
    aFunction(executor);
    Internal.call(this);
    var state = getInternalState(this);
    try {
      executor(bind(internalResolve, state), bind(internalReject, state));
    } catch (error) {
      internalReject(state, error);
    }
  };
  PromiseConstructorPrototype = PromiseConstructor.prototype;
  // eslint-disable-next-line no-unused-vars -- required for `.length`
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: [],
      rejection: false,
      state: PENDING,
      value: undefined
    });
  };
  Internal.prototype = redefineAll(PromiseConstructorPrototype, {
    // `Promise.prototype.then` method
    // https://tc39.es/ecma262/#sec-promise.prototype.then
    then: function then(onFulfilled, onRejected) {
      var state = getInternalPromiseState(this);
      var reaction = newPromiseCapability(speciesConstructor(this, PromiseConstructor));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = IS_NODE ? process.domain : undefined;
      state.parent = true;
      state.reactions.push(reaction);
      if (state.state != PENDING) notify(state, false);
      return reaction.promise;
    },
    // `Promise.prototype.catch` method
    // https://tc39.es/ecma262/#sec-promise.prototype.catch
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, state);
    this.reject = bind(internalReject, state);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if (!IS_PURE && typeof NativePromise == 'function' && NativePromisePrototype !== Object.prototype) {
    nativeThen = NativePromisePrototype.then;

    if (!SUBCLASSING) {
      // make `Promise#then` return a polyfilled `Promise` for native promise-based APIs
      redefine(NativePromisePrototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          nativeThen.call(that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });

      // makes sure that native promise-based APIs `Promise#catch` properly works with patched `Promise#then`
      redefine(NativePromisePrototype, 'catch', PromiseConstructorPrototype['catch'], { unsafe: true });
    }

    // make `.constructor === Promise` work for native promise-based APIs
    try {
      delete NativePromisePrototype.constructor;
    } catch (error) { /* empty */ }

    // make `instanceof Promise` work for native promise-based APIs
    if (setPrototypeOf) {
      setPrototypeOf(NativePromisePrototype, PromiseConstructorPrototype);
    }
  }
}

$({ global: true, wrap: true, forced: FORCED }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false, true);
setSpecies(PROMISE);

PromiseWrapper = getBuiltIn(PROMISE);

// statics
$({ target: PROMISE, stat: true, forced: FORCED }, {
  // `Promise.reject` method
  // https://tc39.es/ecma262/#sec-promise.reject
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    capability.reject.call(undefined, r);
    return capability.promise;
  }
});

$({ target: PROMISE, stat: true, forced: IS_PURE || FORCED }, {
  // `Promise.resolve` method
  // https://tc39.es/ecma262/#sec-promise.resolve
  resolve: function resolve(x) {
    return promiseResolve(IS_PURE && this === PromiseWrapper ? PromiseConstructor : this, x);
  }
});

$({ target: PROMISE, stat: true, forced: INCORRECT_ITERATION }, {
  // `Promise.all` method
  // https://tc39.es/ecma262/#sec-promise.all
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        $promiseResolve.call(C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  },
  // `Promise.race` method
  // https://tc39.es/ecma262/#sec-promise.race
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction(C.resolve);
      iterate(iterable, function (promise) {
        $promiseResolve.call(C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),
/* 299 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);

module.exports = global.Promise;


/***/ }),
/* 300 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var redefine = __webpack_require__(249);

module.exports = function (target, src, options) {
  for (var key in src) redefine(target, key, src[key], options);
  return target;
};


/***/ }),
/* 301 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var getBuiltIn = __webpack_require__(230);
var definePropertyModule = __webpack_require__(247);
var wellKnownSymbol = __webpack_require__(236);
var DESCRIPTORS = __webpack_require__(218);

var SPECIES = wellKnownSymbol('species');

module.exports = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = definePropertyModule.f;

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineProperty(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};


/***/ }),
/* 302 */
/***/ ((module) => {

module.exports = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};


/***/ }),
/* 303 */
/***/ ((module) => {

module.exports = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};


/***/ }),
/* 304 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(248);
var isArrayIteratorMethod = __webpack_require__(305);
var toLength = __webpack_require__(260);
var bind = __webpack_require__(306);
var getIteratorMethod = __webpack_require__(307);
var iteratorClose = __webpack_require__(308);

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that, 1 + AS_ENTRIES + INTERRUPTED);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    }
    iterator = iterFn.call(iterable);
  }

  next = iterator.next;
  while (!(step = next.call(iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator);
      throw error;
    }
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};


/***/ }),
/* 305 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(236);
var Iterators = __webpack_require__(285);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};


/***/ }),
/* 306 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var aFunction = __webpack_require__(302);

// optional / simple context binding
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),
/* 307 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(297);
var Iterators = __webpack_require__(285);
var wellKnownSymbol = __webpack_require__(236);

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};


/***/ }),
/* 308 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(248);

module.exports = function (iterator) {
  var returnMethod = iterator['return'];
  if (returnMethod !== undefined) {
    return anObject(returnMethod.call(iterator)).value;
  }
};


/***/ }),
/* 309 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(236);

var ITERATOR = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR] = function () {
    return this;
  };
  // eslint-disable-next-line es/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

module.exports = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};


/***/ }),
/* 310 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(248);
var aFunction = __webpack_require__(302);
var wellKnownSymbol = __webpack_require__(236);

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.es/ecma262/#sec-speciesconstructor
module.exports = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? defaultConstructor : aFunction(S);
};


/***/ }),
/* 311 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var fails = __webpack_require__(219);
var bind = __webpack_require__(306);
var html = __webpack_require__(273);
var createElement = __webpack_require__(245);
var IS_IOS = __webpack_require__(312);
var IS_NODE = __webpack_require__(313);

var set = global.setImmediate;
var clear = global.clearImmediate;
var process = global.process;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var location, defer, channel, port;

try {
  // Deno throws a ReferenceError on `location` access without `--location` flag
  location = global.location;
} catch (error) { /* empty */ }

var run = function (id) {
  // eslint-disable-next-line no-prototype-builtins -- safe
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var listener = function (event) {
  run(event.data);
};

var post = function (id) {
  // old engines have not location.origin
  global.postMessage(String(id), location.protocol + '//' + location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(fn) {
    var args = [];
    var argumentsLength = arguments.length;
    var i = 1;
    while (argumentsLength > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func -- spec requirement
      (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (IS_NODE) {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !IS_IOS) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = bind(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    global.addEventListener &&
    typeof postMessage == 'function' &&
    !global.importScripts &&
    location && location.protocol !== 'file:' &&
    !fails(post)
  ) {
    defer = post;
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
};


/***/ }),
/* 312 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var userAgent = __webpack_require__(234);

module.exports = /(?:iphone|ipod|ipad).*applewebkit/i.test(userAgent);


/***/ }),
/* 313 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(224);
var global = __webpack_require__(216);

module.exports = classof(global.process) == 'process';


/***/ }),
/* 314 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var getOwnPropertyDescriptor = __webpack_require__(217).f;
var macrotask = __webpack_require__(311).set;
var IS_IOS = __webpack_require__(312);
var IS_IOS_PEBBLE = __webpack_require__(315);
var IS_WEBOS_WEBKIT = __webpack_require__(316);
var IS_NODE = __webpack_require__(313);

var MutationObserver = global.MutationObserver || global.WebKitMutationObserver;
var document = global.document;
var process = global.process;
var Promise = global.Promise;
// Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
var queueMicrotaskDescriptor = getOwnPropertyDescriptor(global, 'queueMicrotask');
var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

var flush, head, last, notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!queueMicrotask) {
  flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (error) {
        if (head) notify();
        else last = undefined;
        throw error;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  // also except WebOS Webkit https://github.com/zloirock/core-js/issues/898
  if (!IS_IOS && !IS_NODE && !IS_WEBOS_WEBKIT && MutationObserver && document) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (!IS_IOS_PEBBLE && Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise.resolve(undefined);
    // workaround of WebKit ~ iOS Safari 10.1 bug
    promise.constructor = Promise;
    then = promise.then;
    notify = function () {
      then.call(promise, flush);
    };
  // Node.js without promises
  } else if (IS_NODE) {
    notify = function () {
      process.nextTick(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }
}

module.exports = queueMicrotask || function (fn) {
  var task = { fn: fn, next: undefined };
  if (last) last.next = task;
  if (!head) {
    head = task;
    notify();
  } last = task;
};


/***/ }),
/* 315 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var userAgent = __webpack_require__(234);
var global = __webpack_require__(216);

module.exports = /iphone|ipod|ipad/i.test(userAgent) && global.Pebble !== undefined;


/***/ }),
/* 316 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var userAgent = __webpack_require__(234);

module.exports = /web0s(?!.*chrome)/i.test(userAgent);


/***/ }),
/* 317 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(248);
var isObject = __webpack_require__(228);
var newPromiseCapability = __webpack_require__(318);

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};


/***/ }),
/* 318 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var aFunction = __webpack_require__(302);

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
};

// `NewPromiseCapability` abstract operation
// https://tc39.es/ecma262/#sec-newpromisecapability
module.exports.f = function (C) {
  return new PromiseCapability(C);
};


/***/ }),
/* 319 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);

module.exports = function (a, b) {
  var console = global.console;
  if (console && console.error) {
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  }
};


/***/ }),
/* 320 */
/***/ ((module) => {

module.exports = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};


/***/ }),
/* 321 */
/***/ ((module) => {

module.exports = typeof window == 'object';


/***/ }),
/* 322 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var charAt = __webpack_require__(279).charAt;
var toString = __webpack_require__(267);
var InternalStateModule = __webpack_require__(251);
var defineIterator = __webpack_require__(286);

var STRING_ITERATOR = 'String Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: toString(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt(string, index);
  state.index += point.length;
  return { value: point, done: false };
});


/***/ }),
/* 323 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(216);
var DOMIterables = __webpack_require__(324);
var ArrayIteratorMethods = __webpack_require__(283);
var createNonEnumerableProperty = __webpack_require__(246);
var wellKnownSymbol = __webpack_require__(236);

var ITERATOR = wellKnownSymbol('iterator');
var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var ArrayValues = ArrayIteratorMethods.values;

for (var COLLECTION_NAME in DOMIterables) {
  var Collection = global[COLLECTION_NAME];
  var CollectionPrototype = Collection && Collection.prototype;
  if (CollectionPrototype) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype[ITERATOR] !== ArrayValues) try {
      createNonEnumerableProperty(CollectionPrototype, ITERATOR, ArrayValues);
    } catch (error) {
      CollectionPrototype[ITERATOR] = ArrayValues;
    }
    if (!CollectionPrototype[TO_STRING_TAG]) {
      createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG, COLLECTION_NAME);
    }
    if (DOMIterables[COLLECTION_NAME]) for (var METHOD_NAME in ArrayIteratorMethods) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[METHOD_NAME] !== ArrayIteratorMethods[METHOD_NAME]) try {
        createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, ArrayIteratorMethods[METHOD_NAME]);
      } catch (error) {
        CollectionPrototype[METHOD_NAME] = ArrayIteratorMethods[METHOD_NAME];
      }
    }
  }
}


/***/ }),
/* 324 */
/***/ ((module) => {

// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
module.exports = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};


/***/ }),
/* 325 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fixRegExpWellKnownSymbolLogic = __webpack_require__(277);
var isRegExp = __webpack_require__(326);
var anObject = __webpack_require__(248);
var requireObjectCoercible = __webpack_require__(225);
var speciesConstructor = __webpack_require__(310);
var advanceStringIndex = __webpack_require__(278);
var toLength = __webpack_require__(260);
var toString = __webpack_require__(267);
var callRegExpExec = __webpack_require__(281);
var regexpExec = __webpack_require__(266);
var stickyHelpers = __webpack_require__(269);
var fails = __webpack_require__(219);

var UNSUPPORTED_Y = stickyHelpers.UNSUPPORTED_Y;
var arrayPush = [].push;
var min = Math.min;
var MAX_UINT32 = 0xFFFFFFFF;

// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
// Weex JS has frozen built-in prototypes, so use try / catch wrapper
var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
  // eslint-disable-next-line regexp/no-empty-group -- required for testing
  var re = /(?:)/;
  var originalExec = re.exec;
  re.exec = function () { return originalExec.apply(this, arguments); };
  var result = 'ab'.split(re);
  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
});

// @@split logic
fixRegExpWellKnownSymbolLogic('split', function (SPLIT, nativeSplit, maybeCallNative) {
  var internalSplit;
  if (
    'abbc'.split(/(b)*/)[1] == 'c' ||
    // eslint-disable-next-line regexp/no-empty-group -- required for testing
    'test'.split(/(?:)/, -1).length != 4 ||
    'ab'.split(/(?:ab)*/).length != 2 ||
    '.'.split(/(.?)(.?)/).length != 4 ||
    // eslint-disable-next-line regexp/no-assertion-capturing-group, regexp/no-empty-group -- required for testing
    '.'.split(/()()/).length > 1 ||
    ''.split(/.?/).length
  ) {
    // based on es5-shim implementation, need to rework it
    internalSplit = function (separator, limit) {
      var string = toString(requireObjectCoercible(this));
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (separator === undefined) return [string];
      // If `separator` is not a regex, use native split
      if (!isRegExp(separator)) {
        return nativeSplit.call(string, separator, lim);
      }
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var match, lastIndex, lastLength;
      while (match = regexpExec.call(separatorCopy, string)) {
        lastIndex = separatorCopy.lastIndex;
        if (lastIndex > lastLastIndex) {
          output.push(string.slice(lastLastIndex, match.index));
          if (match.length > 1 && match.index < string.length) arrayPush.apply(output, match.slice(1));
          lastLength = match[0].length;
          lastLastIndex = lastIndex;
          if (output.length >= lim) break;
        }
        if (separatorCopy.lastIndex === match.index) separatorCopy.lastIndex++; // Avoid an infinite loop
      }
      if (lastLastIndex === string.length) {
        if (lastLength || !separatorCopy.test('')) output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output.length > lim ? output.slice(0, lim) : output;
    };
  // Chakra, V8
  } else if ('0'.split(undefined, 0).length) {
    internalSplit = function (separator, limit) {
      return separator === undefined && limit === 0 ? [] : nativeSplit.call(this, separator, limit);
    };
  } else internalSplit = nativeSplit;

  return [
    // `String.prototype.split` method
    // https://tc39.es/ecma262/#sec-string.prototype.split
    function split(separator, limit) {
      var O = requireObjectCoercible(this);
      var splitter = separator == undefined ? undefined : separator[SPLIT];
      return splitter !== undefined
        ? splitter.call(separator, O, limit)
        : internalSplit.call(toString(O), separator, limit);
    },
    // `RegExp.prototype[@@split]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@split
    //
    // NOTE: This cannot be properly polyfilled in engines that don't support
    // the 'y' flag.
    function (string, limit) {
      var rx = anObject(this);
      var S = toString(string);
      var res = maybeCallNative(internalSplit, rx, S, limit, internalSplit !== nativeSplit);

      if (res.done) return res.value;

      var C = speciesConstructor(rx, RegExp);

      var unicodeMatching = rx.unicode;
      var flags = (rx.ignoreCase ? 'i' : '') +
                  (rx.multiline ? 'm' : '') +
                  (rx.unicode ? 'u' : '') +
                  (UNSUPPORTED_Y ? 'g' : 'y');

      // ^(? + rx + ) is needed, in combination with some S slicing, to
      // simulate the 'y' flag.
      var splitter = new C(UNSUPPORTED_Y ? '^(?:' + rx.source + ')' : rx, flags);
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (S.length === 0) return callRegExpExec(splitter, S) === null ? [S] : [];
      var p = 0;
      var q = 0;
      var A = [];
      while (q < S.length) {
        splitter.lastIndex = UNSUPPORTED_Y ? 0 : q;
        var z = callRegExpExec(splitter, UNSUPPORTED_Y ? S.slice(q) : S);
        var e;
        if (
          z === null ||
          (e = min(toLength(splitter.lastIndex + (UNSUPPORTED_Y ? q : 0)), S.length)) === p
        ) {
          q = advanceStringIndex(S, q, unicodeMatching);
        } else {
          A.push(S.slice(p, q));
          if (A.length === lim) return A;
          for (var i = 1; i <= z.length - 1; i++) {
            A.push(z[i]);
            if (A.length === lim) return A;
          }
          q = p = e;
        }
      }
      A.push(S.slice(p));
      return A;
    }
  ];
}, !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC, UNSUPPORTED_Y);


/***/ }),
/* 326 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(228);
var classof = __webpack_require__(224);
var wellKnownSymbol = __webpack_require__(236);

var MATCH = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.es/ecma262/#sec-isregexp
module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classof(it) == 'RegExp');
};


/***/ }),
/* 327 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(215);
var IndexedObject = __webpack_require__(223);
var toIndexedObject = __webpack_require__(222);
var arrayMethodIsStrict = __webpack_require__(328);

var nativeJoin = [].join;

var ES3_STRINGS = IndexedObject != Object;
var STRICT_METHOD = arrayMethodIsStrict('join', ',');

// `Array.prototype.join` method
// https://tc39.es/ecma262/#sec-array.prototype.join
$({ target: 'Array', proto: true, forced: ES3_STRINGS || !STRICT_METHOD }, {
  join: function join(separator) {
    return nativeJoin.call(toIndexedObject(this), separator === undefined ? ',' : separator);
  }
});


/***/ }),
/* 328 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fails = __webpack_require__(219);

module.exports = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal -- required for testing
    method.call(null, argument || function () { throw 1; }, 1);
  });
};


/***/ }),
/* 329 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fixRegExpWellKnownSymbolLogic = __webpack_require__(277);
var anObject = __webpack_require__(248);
var toLength = __webpack_require__(260);
var toString = __webpack_require__(267);
var requireObjectCoercible = __webpack_require__(225);
var advanceStringIndex = __webpack_require__(278);
var regExpExec = __webpack_require__(281);

// @@match logic
fixRegExpWellKnownSymbolLogic('match', function (MATCH, nativeMatch, maybeCallNative) {
  return [
    // `String.prototype.match` method
    // https://tc39.es/ecma262/#sec-string.prototype.match
    function match(regexp) {
      var O = requireObjectCoercible(this);
      var matcher = regexp == undefined ? undefined : regexp[MATCH];
      return matcher !== undefined ? matcher.call(regexp, O) : new RegExp(regexp)[MATCH](toString(O));
    },
    // `RegExp.prototype[@@match]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@match
    function (string) {
      var rx = anObject(this);
      var S = toString(string);
      var res = maybeCallNative(nativeMatch, rx, S);

      if (res.done) return res.value;

      if (!rx.global) return regExpExec(rx, S);

      var fullUnicode = rx.unicode;
      rx.lastIndex = 0;
      var A = [];
      var n = 0;
      var result;
      while ((result = regExpExec(rx, S)) !== null) {
        var matchStr = toString(result[0]);
        A[n] = matchStr;
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
        n++;
      }
      return n === 0 ? null : A;
    }
  ];
});


/***/ }),
/* 330 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(331);

/***/ }),
/* 331 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(332);

module.exports = parent;


/***/ }),
/* 332 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var map = __webpack_require__(333);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.map;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.map) ? map : own;
};


/***/ }),
/* 333 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(334);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').map;


/***/ }),
/* 334 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var $map = __webpack_require__(81).map;
var arrayMethodHasSpeciesSupport = __webpack_require__(64);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map');

// `Array.prototype.map` method
// https://tc39.es/ecma262/#sec-array.prototype.map
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),
/* 335 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(336);

/***/ }),
/* 336 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(337);

module.exports = parent;


/***/ }),
/* 337 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var concat = __webpack_require__(338);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.concat;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.concat) ? concat : own;
};


/***/ }),
/* 338 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(59);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').concat;


/***/ }),
/* 339 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(340);

/***/ }),
/* 340 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(155);
__webpack_require__(99);

module.exports = parent;


/***/ }),
/* 341 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(342);

/***/ }),
/* 342 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(343);

module.exports = parent;


/***/ }),
/* 343 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayIncludes = __webpack_require__(344);
var stringIncludes = __webpack_require__(346);

var ArrayPrototype = Array.prototype;
var StringPrototype = String.prototype;

module.exports = function (it) {
  var own = it.includes;
  if (it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.includes)) return arrayIncludes;
  if (typeof it === 'string' || it === StringPrototype || (it instanceof String && own === StringPrototype.includes)) {
    return stringIncludes;
  } return own;
};


/***/ }),
/* 344 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(345);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').includes;


/***/ }),
/* 345 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var $includes = __webpack_require__(47).includes;
var addToUnscopables = __webpack_require__(101);

// `Array.prototype.includes` method
// https://tc39.es/ecma262/#sec-array.prototype.includes
$({ target: 'Array', proto: true }, {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('includes');


/***/ }),
/* 346 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(347);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('String').includes;


/***/ }),
/* 347 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var notARegExp = __webpack_require__(348);
var requireObjectCoercible = __webpack_require__(15);
var toString = __webpack_require__(67);
var correctIsRegExpLogic = __webpack_require__(350);

// `String.prototype.includes` method
// https://tc39.es/ecma262/#sec-string.prototype.includes
$({ target: 'String', proto: true, forced: !correctIsRegExpLogic('includes') }, {
  includes: function includes(searchString /* , position = 0 */) {
    return !!~toString(requireObjectCoercible(this))
      .indexOf(toString(notARegExp(searchString)), arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),
/* 348 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isRegExp = __webpack_require__(349);

module.exports = function (it) {
  if (isRegExp(it)) {
    throw TypeError("The method doesn't accept regular expressions");
  } return it;
};


/***/ }),
/* 349 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(18);
var classof = __webpack_require__(14);
var wellKnownSymbol = __webpack_require__(27);

var MATCH = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.es/ecma262/#sec-isregexp
module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classof(it) == 'RegExp');
};


/***/ }),
/* 350 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(27);

var MATCH = wellKnownSymbol('match');

module.exports = function (METHOD_NAME) {
  var regexp = /./;
  try {
    '/./'[METHOD_NAME](regexp);
  } catch (error1) {
    try {
      regexp[MATCH] = false;
      return '/./'[METHOD_NAME](regexp);
    } catch (error2) { /* empty */ }
  } return false;
};


/***/ }),
/* 351 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(352);

/***/ }),
/* 352 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(353);

module.exports = parent;


/***/ }),
/* 353 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var some = __webpack_require__(354);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.some;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.some) ? some : own;
};


/***/ }),
/* 354 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(355);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').some;


/***/ }),
/* 355 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var $some = __webpack_require__(81).some;
var arrayMethodIsStrict = __webpack_require__(356);

var STRICT_METHOD = arrayMethodIsStrict('some');

// `Array.prototype.some` method
// https://tc39.es/ecma262/#sec-array.prototype.some
$({ target: 'Array', proto: true, forced: !STRICT_METHOD }, {
  some: function some(callbackfn /* , thisArg */) {
    return $some(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),
/* 356 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fails = __webpack_require__(9);

module.exports = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal -- required for testing
    method.call(null, argument || function () { throw 1; }, 1);
  });
};


/***/ }),
/* 357 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(358);

/***/ }),
/* 358 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(359);

module.exports = parent;


/***/ }),
/* 359 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var indexOf = __webpack_require__(360);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.indexOf;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.indexOf) ? indexOf : own;
};


/***/ }),
/* 360 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(361);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').indexOf;


/***/ }),
/* 361 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

/* eslint-disable es/no-array-prototype-indexof -- required for testing */
var $ = __webpack_require__(5);
var $indexOf = __webpack_require__(47).indexOf;
var arrayMethodIsStrict = __webpack_require__(356);

var nativeIndexOf = [].indexOf;

var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
var STRICT_METHOD = arrayMethodIsStrict('indexOf');

// `Array.prototype.indexOf` method
// https://tc39.es/ecma262/#sec-array.prototype.indexof
$({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || !STRICT_METHOD }, {
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? nativeIndexOf.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),
/* 362 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(363);

/***/ }),
/* 363 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(364);

module.exports = parent;


/***/ }),
/* 364 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var filter = __webpack_require__(365);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.filter;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.filter) ? filter : own;
};


/***/ }),
/* 365 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(366);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').filter;


/***/ }),
/* 366 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var $filter = __webpack_require__(81).filter;
var arrayMethodHasSpeciesSupport = __webpack_require__(64);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter');

// `Array.prototype.filter` method
// https://tc39.es/ecma262/#sec-array.prototype.filter
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),
/* 367 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(368);

/***/ }),
/* 368 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(369);

module.exports = parent;


/***/ }),
/* 369 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var bind = __webpack_require__(370);

var FunctionPrototype = Function.prototype;

module.exports = function (it) {
  var own = it.bind;
  return it === FunctionPrototype || (it instanceof Function && own === FunctionPrototype.bind) ? bind : own;
};


/***/ }),
/* 370 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(371);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Function').bind;


/***/ }),
/* 371 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var bind = __webpack_require__(55);

// `Function.prototype.bind` method
// https://tc39.es/ecma262/#sec-function.prototype.bind
$({ target: 'Function', proto: true }, {
  bind: bind
});


/***/ }),
/* 372 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(373);

/***/ }),
/* 373 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(374);

module.exports = parent;


/***/ }),
/* 374 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var reduce = __webpack_require__(375);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.reduce;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.reduce) ? reduce : own;
};


/***/ }),
/* 375 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(376);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').reduce;


/***/ }),
/* 376 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var $reduce = __webpack_require__(377).left;
var arrayMethodIsStrict = __webpack_require__(356);
var CHROME_VERSION = __webpack_require__(24);
var IS_NODE = __webpack_require__(166);

var STRICT_METHOD = arrayMethodIsStrict('reduce');
// Chrome 80-82 has a critical bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
var CHROME_BUG = !IS_NODE && CHROME_VERSION > 79 && CHROME_VERSION < 83;

// `Array.prototype.reduce` method
// https://tc39.es/ecma262/#sec-array.prototype.reduce
$({ target: 'Array', proto: true, forced: !STRICT_METHOD || CHROME_BUG }, {
  reduce: function reduce(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),
/* 377 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var aFunction = __webpack_require__(39);
var toObject = __webpack_require__(33);
var IndexedObject = __webpack_require__(13);
var toLength = __webpack_require__(48);

// `Array.prototype.{ reduce, reduceRight }` methods implementation
var createMethod = function (IS_RIGHT) {
  return function (that, callbackfn, argumentsLength, memo) {
    aFunction(callbackfn);
    var O = toObject(that);
    var self = IndexedObject(O);
    var length = toLength(O.length);
    var index = IS_RIGHT ? length - 1 : 0;
    var i = IS_RIGHT ? -1 : 1;
    if (argumentsLength < 2) while (true) {
      if (index in self) {
        memo = self[index];
        index += i;
        break;
      }
      index += i;
      if (IS_RIGHT ? index < 0 : length <= index) {
        throw TypeError('Reduce of empty array with no initial value');
      }
    }
    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
    return memo;
  };
};

module.exports = {
  // `Array.prototype.reduce` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduce
  left: createMethod(false),
  // `Array.prototype.reduceRight` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduceright
  right: createMethod(true)
};


/***/ }),
/* 378 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(379);

/***/ }),
/* 379 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(380);

module.exports = parent;


/***/ }),
/* 380 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var splice = __webpack_require__(381);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.splice;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.splice) ? splice : own;
};


/***/ }),
/* 381 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(382);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').splice;


/***/ }),
/* 382 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var toAbsoluteIndex = __webpack_require__(50);
var toInteger = __webpack_require__(49);
var toLength = __webpack_require__(48);
var toObject = __webpack_require__(33);
var arraySpeciesCreate = __webpack_require__(62);
var createProperty = __webpack_require__(61);
var arrayMethodHasSpeciesSupport = __webpack_require__(64);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('splice');

var max = Math.max;
var min = Math.min;
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

// `Array.prototype.splice` method
// https://tc39.es/ecma262/#sec-array.prototype.splice
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  splice: function splice(start, deleteCount /* , ...items */) {
    var O = toObject(this);
    var len = toLength(O.length);
    var actualStart = toAbsoluteIndex(start, len);
    var argumentsLength = arguments.length;
    var insertCount, actualDeleteCount, A, k, from, to;
    if (argumentsLength === 0) {
      insertCount = actualDeleteCount = 0;
    } else if (argumentsLength === 1) {
      insertCount = 0;
      actualDeleteCount = len - actualStart;
    } else {
      insertCount = argumentsLength - 2;
      actualDeleteCount = min(max(toInteger(deleteCount), 0), len - actualStart);
    }
    if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER) {
      throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
    }
    A = arraySpeciesCreate(O, actualDeleteCount);
    for (k = 0; k < actualDeleteCount; k++) {
      from = actualStart + k;
      if (from in O) createProperty(A, k, O[from]);
    }
    A.length = actualDeleteCount;
    if (insertCount < actualDeleteCount) {
      for (k = actualStart; k < len - actualDeleteCount; k++) {
        from = k + actualDeleteCount;
        to = k + insertCount;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
      for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
    } else if (insertCount > actualDeleteCount) {
      for (k = len - actualDeleteCount; k > actualStart; k--) {
        from = k + actualDeleteCount - 1;
        to = k + insertCount - 1;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
    }
    for (k = 0; k < insertCount; k++) {
      O[k + actualStart] = arguments[k + 2];
    }
    O.length = len - actualDeleteCount + insertCount;
    return A;
  }
});


/***/ }),
/* 383 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(384);

/***/ }),
/* 384 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(385);

module.exports = parent;


/***/ }),
/* 385 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var find = __webpack_require__(386);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.find;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.find) ? find : own;
};


/***/ }),
/* 386 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(387);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').find;


/***/ }),
/* 387 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var $find = __webpack_require__(81).find;
var addToUnscopables = __webpack_require__(101);

var FIND = 'find';
var SKIPS_HOLES = true;

// Shouldn't skip holes
if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

// `Array.prototype.find` method
// https://tc39.es/ecma262/#sec-array.prototype.find
$({ target: 'Array', proto: true, forced: SKIPS_HOLES }, {
  find: function find(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables(FIND);


/***/ }),
/* 388 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(389);

/***/ }),
/* 389 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(390);

module.exports = parent;


/***/ }),
/* 390 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var every = __webpack_require__(391);

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.every;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.every) ? every : own;
};


/***/ }),
/* 391 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(392);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').every;


/***/ }),
/* 392 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var $every = __webpack_require__(81).every;
var arrayMethodIsStrict = __webpack_require__(356);

var STRICT_METHOD = arrayMethodIsStrict('every');

// `Array.prototype.every` method
// https://tc39.es/ecma262/#sec-array.prototype.every
$({ target: 'Array', proto: true, forced: !STRICT_METHOD }, {
  every: function every(callbackfn /* , thisArg */) {
    return $every(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),
/* 393 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ResumableHelpers)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(394);
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(181);
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(182);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(116);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(372);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(335);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_set__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(398);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_set__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_set__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(362);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(357);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(330);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_entries__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(406);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_entries__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_object_entries__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(282);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(214);
/* harmony import */ var core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(276);
/* harmony import */ var core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var core_js_modules_es_number_to_fixed_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(411);
/* harmony import */ var core_js_modules_es_number_to_fixed_js__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_number_to_fixed_js__WEBPACK_IMPORTED_MODULE_14__);
/* harmony import */ var core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(327);
/* harmony import */ var core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_15__);

















// INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
var ResumableHelpers = /*#__PURE__*/function () {
  function ResumableHelpers() {
    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__.default)(this, ResumableHelpers);
  }

  (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__.default)(ResumableHelpers, null, [{
    key: "stopEvent",
    value:
    /**
     * Stop the propagation and default behavior of the given event `e`.
     * @param {Event} e
     */
    function stopEvent(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    /**
     * Some confusion in different versions of Firefox using different attribute names for the file name
     * @param {File} file The file whose filename should be retrieved
     * @returns {string} The filename of the given file object
     */

  }, {
    key: "getFileNameFromFile",
    value: function getFileNameFromFile(file) {
      return file.fileName || file.name;
    }
    /**
     * Generate a unique identifier for the given file based on its size, filename and relative path.
     * @param {File} file The file for which the identifier should be generated
     * @returns {string} The unique identifier for the given file object
     */

  }, {
    key: "generateUniqueIdentifier",
    value: function generateUniqueIdentifier(file) {
      var relativePath = file.webkitRelativePath || file.relativePath || this.getFileNameFromFile(file);
      var size = file.size;
      return size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, '');
    }
    /**
     * Flatten the given array and all contained subarrays.
     * Credit: {@link https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_flattendeep}
     * @param {*[]} array
     * @returns {*[]} The flattened array
     */

  }, {
    key: "flattenDeep",
    value: function flattenDeep(array) {
      var _this = this;

      return _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3___default()(array) ? _babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_4___default()(array).call(array, function (a, b) {
        return _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_5___default()(a).call(a, _this.flattenDeep(b));
      }, []) : [array];
    }
    /**
     * Filter the given array based on the predicate inside `callback`
     * and executes `errorCallback` for duplicate elements.
     * @param {*[]} array
     * @param {function(*): *} callback
     * @param {function(*): void} errorCallback
     */

  }, {
    key: "uniqBy",
    value: function uniqBy(array, callback, errorCallback) {
      var seen = new (_babel_runtime_corejs3_core_js_stable_set__WEBPACK_IMPORTED_MODULE_6___default())();
      return _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_7___default()(array).call(array, function (item) {
        var k = callback(item);

        if (seen.has(k)) {
          errorCallback(item);
          return false;
        } else {
          seen.add(k);
          return true;
        }
      });
    }
    /**
     * Format the size given in Bytes in a human readable format.
     * @param {number} size
     */

  }, {
    key: "formatSize",
    value: function formatSize(size) {
      if (size < 1024) {
        return size + ' bytes';
      }

      if (size < 1024 * 1024) {
        return (size / 1024.0).toFixed(0) + ' KB';
      }

      if (size < 1024 * 1024 * 1024) {
        return (size / 1024.0 / 1024.0).toFixed(1) + ' MB';
      }

      return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' GB';
    }
    /**
     * Get the target url for the specified request type and params
     * @param {string} requestType
     * @param {string} sendTarget
     * @param {string} testTarget
     * @param {Object} params
     * @param {string} parameterNamespace
     */

  }, {
    key: "getTarget",
    value: function getTarget(requestType, sendTarget, testTarget, params) {
      var _context;

      var parameterNamespace = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';
      var target = sendTarget;

      if (requestType === 'test' && testTarget) {
        target = testTarget === '/' ? sendTarget : testTarget;
      }

      var separator = _babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_8___default()(target).call(target, '?') < 0 ? '?' : '&';

      var joinedParams = _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_9___default()(_context = _babel_runtime_corejs3_core_js_stable_object_entries__WEBPACK_IMPORTED_MODULE_10___default()(params)).call(_context, function (_ref) {
        var _ref2 = (0,_babel_runtime_corejs3_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0__.default)(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];

        return [encodeURIComponent(parameterNamespace + key), encodeURIComponent(value)].join('=');
      }).join('&');

      if (joinedParams) target = target + separator + joinedParams;
      return target;
    }
  }]);

  return ResumableHelpers;
}();



/***/ }),
/* 394 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _slicedToArray)
/* harmony export */ });
/* harmony import */ var _arrayWithHoles_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(395);
/* harmony import */ var _iterableToArrayLimit_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(396);
/* harmony import */ var _unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(144);
/* harmony import */ var _nonIterableRest_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(397);




function _slicedToArray(arr, i) {
  return (0,_arrayWithHoles_js__WEBPACK_IMPORTED_MODULE_0__.default)(arr) || (0,_iterableToArrayLimit_js__WEBPACK_IMPORTED_MODULE_1__.default)(arr, i) || (0,_unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__.default)(arr, i) || (0,_nonIterableRest_js__WEBPACK_IMPORTED_MODULE_3__.default)();
}

/***/ }),
/* 395 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayWithHoles)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(122);

function _arrayWithHoles(arr) {
  if (_babel_runtime_corejs3_core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0__(arr)) return arr;
}

/***/ }),
/* 396 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _iterableToArrayLimit)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(126);
/* harmony import */ var _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(111);


function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof _babel_runtime_corejs3_core_js_symbol__WEBPACK_IMPORTED_MODULE_0__ !== "undefined" && _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_1__(arr) || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

/***/ }),
/* 397 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _nonIterableRest)
/* harmony export */ });
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

/***/ }),
/* 398 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(399);

/***/ }),
/* 399 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(400);
__webpack_require__(99);

module.exports = parent;


/***/ }),
/* 400 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(100);
__webpack_require__(65);
__webpack_require__(401);
__webpack_require__(113);
var path = __webpack_require__(21);

module.exports = path.Set;


/***/ }),
/* 401 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var collection = __webpack_require__(402);
var collectionStrong = __webpack_require__(405);

// `Set` constructor
// https://tc39.es/ecma262/#sec-set-objects
module.exports = collection('Set', function (init) {
  return function Set() { return init(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong);


/***/ }),
/* 402 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var global = __webpack_require__(6);
var InternalMetadataModule = __webpack_require__(403);
var fails = __webpack_require__(9);
var createNonEnumerableProperty = __webpack_require__(40);
var iterate = __webpack_require__(157);
var anInstance = __webpack_require__(162);
var isObject = __webpack_require__(18);
var setToStringTag = __webpack_require__(74);
var defineProperty = __webpack_require__(41).f;
var forEach = __webpack_require__(81).forEach;
var DESCRIPTORS = __webpack_require__(8);
var InternalStateModule = __webpack_require__(78);

var setInternalState = InternalStateModule.set;
var internalStateGetterFor = InternalStateModule.getterFor;

module.exports = function (CONSTRUCTOR_NAME, wrapper, common) {
  var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1;
  var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1;
  var ADDER = IS_MAP ? 'set' : 'add';
  var NativeConstructor = global[CONSTRUCTOR_NAME];
  var NativePrototype = NativeConstructor && NativeConstructor.prototype;
  var exported = {};
  var Constructor;

  if (!DESCRIPTORS || typeof NativeConstructor != 'function'
    || !(IS_WEAK || NativePrototype.forEach && !fails(function () { new NativeConstructor().entries().next(); }))
  ) {
    // create collection constructor
    Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
    InternalMetadataModule.enable();
  } else {
    Constructor = wrapper(function (target, iterable) {
      setInternalState(anInstance(target, Constructor, CONSTRUCTOR_NAME), {
        type: CONSTRUCTOR_NAME,
        collection: new NativeConstructor()
      });
      if (iterable != undefined) iterate(iterable, target[ADDER], { that: target, AS_ENTRIES: IS_MAP });
    });

    var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

    forEach(['add', 'clear', 'delete', 'forEach', 'get', 'has', 'set', 'keys', 'values', 'entries'], function (KEY) {
      var IS_ADDER = KEY == 'add' || KEY == 'set';
      if (KEY in NativePrototype && !(IS_WEAK && KEY == 'clear')) {
        createNonEnumerableProperty(Constructor.prototype, KEY, function (a, b) {
          var collection = getInternalState(this).collection;
          if (!IS_ADDER && IS_WEAK && !isObject(a)) return KEY == 'get' ? undefined : false;
          var result = collection[KEY](a === 0 ? 0 : a, b);
          return IS_ADDER ? this : result;
        });
      }
    });

    IS_WEAK || defineProperty(Constructor.prototype, 'size', {
      configurable: true,
      get: function () {
        return getInternalState(this).collection.size;
      }
    });
  }

  setToStringTag(Constructor, CONSTRUCTOR_NAME, false, true);

  exported[CONSTRUCTOR_NAME] = Constructor;
  $({ global: true, forced: true }, exported);

  if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

  return Constructor;
};


/***/ }),
/* 403 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var hiddenKeys = __webpack_require__(51);
var isObject = __webpack_require__(18);
var has = __webpack_require__(32);
var defineProperty = __webpack_require__(41).f;
var getOwnPropertyNamesModule = __webpack_require__(68);
var getOwnPropertyNamesExternalModule = __webpack_require__(69);
var uid = __webpack_require__(34);
var FREEZING = __webpack_require__(404);

var REQUIRED = false;
var METADATA = uid('meta');
var id = 0;

// eslint-disable-next-line es/no-object-isextensible -- safe
var isExtensible = Object.isExtensible || function () {
  return true;
};

var setMetadata = function (it) {
  defineProperty(it, METADATA, { value: {
    objectID: 'O' + id++, // object ID
    weakData: {}          // weak collections IDs
  } });
};

var fastKey = function (it, create) {
  // return a primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMetadata(it);
  // return object ID
  } return it[METADATA].objectID;
};

var getWeakData = function (it, create) {
  if (!has(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMetadata(it);
  // return the store of weak collections IDs
  } return it[METADATA].weakData;
};

// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZING && REQUIRED && isExtensible(it) && !has(it, METADATA)) setMetadata(it);
  return it;
};

var enable = function () {
  meta.enable = function () { /* empty */ };
  REQUIRED = true;
  var getOwnPropertyNames = getOwnPropertyNamesModule.f;
  var splice = [].splice;
  var test = {};
  test[METADATA] = 1;

  // prevent exposing of metadata key
  if (getOwnPropertyNames(test).length) {
    getOwnPropertyNamesModule.f = function (it) {
      var result = getOwnPropertyNames(it);
      for (var i = 0, length = result.length; i < length; i++) {
        if (result[i] === METADATA) {
          splice.call(result, i, 1);
          break;
        }
      } return result;
    };

    $({ target: 'Object', stat: true, forced: true }, {
      getOwnPropertyNames: getOwnPropertyNamesExternalModule.f
    });
  }
};

var meta = module.exports = {
  enable: enable,
  fastKey: fastKey,
  getWeakData: getWeakData,
  onFreeze: onFreeze
};

hiddenKeys[METADATA] = true;


/***/ }),
/* 404 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(9);

module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-isextensible, es/no-object-preventextensions -- required for testing
  return Object.isExtensible(Object.preventExtensions({}));
});


/***/ }),
/* 405 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var defineProperty = __webpack_require__(41).f;
var create = __webpack_require__(43);
var redefineAll = __webpack_require__(160);
var bind = __webpack_require__(38);
var anInstance = __webpack_require__(162);
var iterate = __webpack_require__(157);
var defineIterator = __webpack_require__(103);
var setSpecies = __webpack_require__(161);
var DESCRIPTORS = __webpack_require__(8);
var fastKey = __webpack_require__(403).fastKey;
var InternalStateModule = __webpack_require__(78);

var setInternalState = InternalStateModule.set;
var internalStateGetterFor = InternalStateModule.getterFor;

module.exports = {
  getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, CONSTRUCTOR_NAME);
      setInternalState(that, {
        type: CONSTRUCTOR_NAME,
        index: create(null),
        first: undefined,
        last: undefined,
        size: 0
      });
      if (!DESCRIPTORS) that.size = 0;
      if (iterable != undefined) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
    });

    var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

    var define = function (that, key, value) {
      var state = getInternalState(that);
      var entry = getEntry(that, key);
      var previous, index;
      // change existing entry
      if (entry) {
        entry.value = value;
      // create new entry
      } else {
        state.last = entry = {
          index: index = fastKey(key, true),
          key: key,
          value: value,
          previous: previous = state.last,
          next: undefined,
          removed: false
        };
        if (!state.first) state.first = entry;
        if (previous) previous.next = entry;
        if (DESCRIPTORS) state.size++;
        else that.size++;
        // add to index
        if (index !== 'F') state.index[index] = entry;
      } return that;
    };

    var getEntry = function (that, key) {
      var state = getInternalState(that);
      // fast case
      var index = fastKey(key);
      var entry;
      if (index !== 'F') return state.index[index];
      // frozen object case
      for (entry = state.first; entry; entry = entry.next) {
        if (entry.key == key) return entry;
      }
    };

    redefineAll(C.prototype, {
      // `{ Map, Set }.prototype.clear()` methods
      // https://tc39.es/ecma262/#sec-map.prototype.clear
      // https://tc39.es/ecma262/#sec-set.prototype.clear
      clear: function clear() {
        var that = this;
        var state = getInternalState(that);
        var data = state.index;
        var entry = state.first;
        while (entry) {
          entry.removed = true;
          if (entry.previous) entry.previous = entry.previous.next = undefined;
          delete data[entry.index];
          entry = entry.next;
        }
        state.first = state.last = undefined;
        if (DESCRIPTORS) state.size = 0;
        else that.size = 0;
      },
      // `{ Map, Set }.prototype.delete(key)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.delete
      // https://tc39.es/ecma262/#sec-set.prototype.delete
      'delete': function (key) {
        var that = this;
        var state = getInternalState(that);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.next;
          var prev = entry.previous;
          delete state.index[entry.index];
          entry.removed = true;
          if (prev) prev.next = next;
          if (next) next.previous = prev;
          if (state.first == entry) state.first = next;
          if (state.last == entry) state.last = prev;
          if (DESCRIPTORS) state.size--;
          else that.size--;
        } return !!entry;
      },
      // `{ Map, Set }.prototype.forEach(callbackfn, thisArg = undefined)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.foreach
      // https://tc39.es/ecma262/#sec-set.prototype.foreach
      forEach: function forEach(callbackfn /* , that = undefined */) {
        var state = getInternalState(this);
        var boundFunction = bind(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.next : state.first) {
          boundFunction(entry.value, entry.key, this);
          // revert to the last existing entry
          while (entry && entry.removed) entry = entry.previous;
        }
      },
      // `{ Map, Set}.prototype.has(key)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.has
      // https://tc39.es/ecma262/#sec-set.prototype.has
      has: function has(key) {
        return !!getEntry(this, key);
      }
    });

    redefineAll(C.prototype, IS_MAP ? {
      // `Map.prototype.get(key)` method
      // https://tc39.es/ecma262/#sec-map.prototype.get
      get: function get(key) {
        var entry = getEntry(this, key);
        return entry && entry.value;
      },
      // `Map.prototype.set(key, value)` method
      // https://tc39.es/ecma262/#sec-map.prototype.set
      set: function set(key, value) {
        return define(this, key === 0 ? 0 : key, value);
      }
    } : {
      // `Set.prototype.add(value)` method
      // https://tc39.es/ecma262/#sec-set.prototype.add
      add: function add(value) {
        return define(this, value = value === 0 ? 0 : value, value);
      }
    });
    if (DESCRIPTORS) defineProperty(C.prototype, 'size', {
      get: function () {
        return getInternalState(this).size;
      }
    });
    return C;
  },
  setStrong: function (C, CONSTRUCTOR_NAME, IS_MAP) {
    var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator';
    var getInternalCollectionState = internalStateGetterFor(CONSTRUCTOR_NAME);
    var getInternalIteratorState = internalStateGetterFor(ITERATOR_NAME);
    // `{ Map, Set }.prototype.{ keys, values, entries, @@iterator }()` methods
    // https://tc39.es/ecma262/#sec-map.prototype.entries
    // https://tc39.es/ecma262/#sec-map.prototype.keys
    // https://tc39.es/ecma262/#sec-map.prototype.values
    // https://tc39.es/ecma262/#sec-map.prototype-@@iterator
    // https://tc39.es/ecma262/#sec-set.prototype.entries
    // https://tc39.es/ecma262/#sec-set.prototype.keys
    // https://tc39.es/ecma262/#sec-set.prototype.values
    // https://tc39.es/ecma262/#sec-set.prototype-@@iterator
    defineIterator(C, CONSTRUCTOR_NAME, function (iterated, kind) {
      setInternalState(this, {
        type: ITERATOR_NAME,
        target: iterated,
        state: getInternalCollectionState(iterated),
        kind: kind,
        last: undefined
      });
    }, function () {
      var state = getInternalIteratorState(this);
      var kind = state.kind;
      var entry = state.last;
      // revert to the last existing entry
      while (entry && entry.removed) entry = entry.previous;
      // get next entry
      if (!state.target || !(state.last = entry = entry ? entry.next : state.state.first)) {
        // or finish the iteration
        state.target = undefined;
        return { value: undefined, done: true };
      }
      // return step by kind
      if (kind == 'keys') return { value: entry.key, done: false };
      if (kind == 'values') return { value: entry.value, done: false };
      return { value: [entry.key, entry.value], done: false };
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // `{ Map, Set }.prototype[@@species]` accessors
    // https://tc39.es/ecma262/#sec-get-map-@@species
    // https://tc39.es/ecma262/#sec-get-set-@@species
    setSpecies(CONSTRUCTOR_NAME);
  }
};


/***/ }),
/* 406 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(407);

/***/ }),
/* 407 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(408);

module.exports = parent;


/***/ }),
/* 408 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(409);
var path = __webpack_require__(21);

module.exports = path.Object.entries;


/***/ }),
/* 409 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var $entries = __webpack_require__(410).entries;

// `Object.entries` method
// https://tc39.es/ecma262/#sec-object.entries
$({ target: 'Object', stat: true }, {
  entries: function entries(O) {
    return $entries(O);
  }
});


/***/ }),
/* 410 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8);
var objectKeys = __webpack_require__(45);
var toIndexedObject = __webpack_require__(12);
var propertyIsEnumerable = __webpack_require__(10).f;

// `Object.{ entries, values }` methods implementation
var createMethod = function (TO_ENTRIES) {
  return function (it) {
    var O = toIndexedObject(it);
    var keys = objectKeys(O);
    var length = keys.length;
    var i = 0;
    var result = [];
    var key;
    while (length > i) {
      key = keys[i++];
      if (!DESCRIPTORS || propertyIsEnumerable.call(O, key)) {
        result.push(TO_ENTRIES ? [key, O[key]] : O[key]);
      }
    }
    return result;
  };
};

module.exports = {
  // `Object.entries` method
  // https://tc39.es/ecma262/#sec-object.entries
  entries: createMethod(true),
  // `Object.values` method
  // https://tc39.es/ecma262/#sec-object.values
  values: createMethod(false)
};


/***/ }),
/* 411 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(215);
var toInteger = __webpack_require__(261);
var thisNumberValue = __webpack_require__(412);
var repeat = __webpack_require__(413);
var fails = __webpack_require__(219);

var nativeToFixed = 1.0.toFixed;
var floor = Math.floor;

var pow = function (x, n, acc) {
  return n === 0 ? acc : n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc);
};

var log = function (x) {
  var n = 0;
  var x2 = x;
  while (x2 >= 4096) {
    n += 12;
    x2 /= 4096;
  }
  while (x2 >= 2) {
    n += 1;
    x2 /= 2;
  } return n;
};

var multiply = function (data, n, c) {
  var index = -1;
  var c2 = c;
  while (++index < 6) {
    c2 += n * data[index];
    data[index] = c2 % 1e7;
    c2 = floor(c2 / 1e7);
  }
};

var divide = function (data, n) {
  var index = 6;
  var c = 0;
  while (--index >= 0) {
    c += data[index];
    data[index] = floor(c / n);
    c = (c % n) * 1e7;
  }
};

var dataToString = function (data) {
  var index = 6;
  var s = '';
  while (--index >= 0) {
    if (s !== '' || index === 0 || data[index] !== 0) {
      var t = String(data[index]);
      s = s === '' ? t : s + repeat.call('0', 7 - t.length) + t;
    }
  } return s;
};

var FORCED = nativeToFixed && (
  0.00008.toFixed(3) !== '0.000' ||
  0.9.toFixed(0) !== '1' ||
  1.255.toFixed(2) !== '1.25' ||
  1000000000000000128.0.toFixed(0) !== '1000000000000000128'
) || !fails(function () {
  // V8 ~ Android 4.3-
  nativeToFixed.call({});
});

// `Number.prototype.toFixed` method
// https://tc39.es/ecma262/#sec-number.prototype.tofixed
$({ target: 'Number', proto: true, forced: FORCED }, {
  toFixed: function toFixed(fractionDigits) {
    var number = thisNumberValue(this);
    var fractDigits = toInteger(fractionDigits);
    var data = [0, 0, 0, 0, 0, 0];
    var sign = '';
    var result = '0';
    var e, z, j, k;

    if (fractDigits < 0 || fractDigits > 20) throw RangeError('Incorrect fraction digits');
    // eslint-disable-next-line no-self-compare -- NaN check
    if (number != number) return 'NaN';
    if (number <= -1e21 || number >= 1e21) return String(number);
    if (number < 0) {
      sign = '-';
      number = -number;
    }
    if (number > 1e-21) {
      e = log(number * pow(2, 69, 1)) - 69;
      z = e < 0 ? number * pow(2, -e, 1) : number / pow(2, e, 1);
      z *= 0x10000000000000;
      e = 52 - e;
      if (e > 0) {
        multiply(data, 0, z);
        j = fractDigits;
        while (j >= 7) {
          multiply(data, 1e7, 0);
          j -= 7;
        }
        multiply(data, pow(10, j, 1), 0);
        j = e - 1;
        while (j >= 23) {
          divide(data, 1 << 23);
          j -= 23;
        }
        divide(data, 1 << j);
        multiply(data, 1, 1);
        divide(data, 2);
        result = dataToString(data);
      } else {
        multiply(data, 0, z);
        multiply(data, 1 << -e, 0);
        result = dataToString(data) + repeat.call('0', fractDigits);
      }
    }
    if (fractDigits > 0) {
      k = result.length;
      result = sign + (k <= fractDigits
        ? '0.' + repeat.call('0', fractDigits - k) + result
        : result.slice(0, k - fractDigits) + '.' + result.slice(k - fractDigits));
    } else {
      result = sign + result;
    } return result;
  }
});


/***/ }),
/* 412 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(224);

// `thisNumberValue` abstract operation
// https://tc39.es/ecma262/#sec-thisnumbervalue
module.exports = function (value) {
  if (typeof value != 'number' && classof(value) != 'Number') {
    throw TypeError('Incorrect invocation');
  }
  return +value;
};


/***/ }),
/* 413 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var toInteger = __webpack_require__(261);
var toString = __webpack_require__(267);
var requireObjectCoercible = __webpack_require__(225);

// `String.prototype.repeat` method implementation
// https://tc39.es/ecma262/#sec-string.prototype.repeat
module.exports = function repeat(count) {
  var str = toString(requireObjectCoercible(this));
  var result = '';
  var n = toInteger(count);
  if (n < 0 || n == Infinity) throw RangeError('Wrong number of repetitions');
  for (;n > 0; (n >>>= 1) && (str += str)) if (n & 1) result += str;
  return result;
};


/***/ }),
/* 414 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ResumableFile)
/* harmony export */ });
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(294);
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(282);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(208);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(210);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(56);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(111);
/* harmony import */ var _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(116);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(181);
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(182);
/* harmony import */ var _babel_runtime_corejs3_helpers_assertThisInitialized__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(202);
/* harmony import */ var _babel_runtime_corejs3_helpers_inherits__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(187);
/* harmony import */ var _babel_runtime_corejs3_helpers_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(197);
/* harmony import */ var _babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(203);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(351);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_14__);
/* harmony import */ var _resumableChunk_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(415);
/* harmony import */ var _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(393);
/* harmony import */ var _resumableEventHandler_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(449);
















function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof (_babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_5___default()) !== "undefined" && _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_6___default()(o) || o["@@iterator"]; if (!it) { if (_babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_7___default()(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { var _context3; if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_3___default()(_context3 = Object.prototype.toString.call(o)).call(_context3, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_4___default()(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0,_babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_13__.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0,_babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_13__.default)(this).constructor; result = _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_2___default()(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0,_babel_runtime_corejs3_helpers_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_12__.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_2___default())) return false; if ((_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_2___default().sham)) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_2___default()(Boolean, [], function () {})); return true; } catch (e) { return false; } }

// INTERNAL OBJECT TYPES




var ResumableFile = /*#__PURE__*/function (_ResumableEventHandle) {
  (0,_babel_runtime_corejs3_helpers_inherits__WEBPACK_IMPORTED_MODULE_11__.default)(ResumableFile, _ResumableEventHandle);

  var _super = _createSuper(ResumableFile);

  function ResumableFile(file, uniqueIdentifier, options) {
    var _this;

    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_8__.default)(this, ResumableFile);

    _this = _super.call(this);
    _this.opts = options;

    _this.setOptions(options);

    _this._prevProgress = 0;
    _this.file = file;
    _this.fileName = _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_16__.default.getFileNameFromFile(file);
    _this.size = file.size;
    _this.relativePath = file.relativePath || file.webkitRelativePath || _this.fileName;
    _this.uniqueIdentifier = uniqueIdentifier;
    _this._pause = false;
    _this._error = uniqueIdentifier !== undefined;
    _this.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished
    // Main code to set up a file object with chunks,
    // packaged to be able to handle retries if needed.

    /**
     * @type {ResumableChunk[]}
     */

    _this.chunks = []; // Bootstrap and return

    _this.fire('chunkingStart', (0,_babel_runtime_corejs3_helpers_assertThisInitialized__WEBPACK_IMPORTED_MODULE_10__.default)(_this));

    _this.bootstrap();

    return (0,_babel_runtime_corejs3_helpers_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_12__.default)(_this, (0,_babel_runtime_corejs3_helpers_assertThisInitialized__WEBPACK_IMPORTED_MODULE_10__.default)(_this));
  }

  (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_9__.default)(ResumableFile, [{
    key: "pause",
    get: function get() {
      return this._pause;
    },
    set: function set(pause) {
      if (pause === undefined) {
        this._pause = !this._pause;
      } else {
        this._pause = pause;
      }
    }
    /**
     * @param {{forceChunkSize: boolean, preprocessFile: null}} options
     */

  }, {
    key: "setOptions",
    value: function setOptions(options) {
      // Options
      var _options$chunkSize = options.chunkSize;
      this.chunkSize = _options$chunkSize === void 0 ? 1 * 1024 * 1024 : _options$chunkSize;
      var _options$forceChunkSi = options.forceChunkSize;
      this.forceChunkSize = _options$forceChunkSi === void 0 ? false : _options$forceChunkSi;
      var _options$preprocessFi = options.preprocessFile;
      this.preprocessFile = _options$preprocessFi === void 0 ? null : _options$preprocessFi;
    }
    /**
     * Stop current uploads
     */

  }, {
    key: "abort",
    value: function abort() {
      var abortCount = 0;

      var _iterator = _createForOfIteratorHelper(this.chunks),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var chunk = _step.value;

          if (chunk.status === 'chunkUploading') {
            chunk.abort();
            abortCount++;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      if (abortCount > 0) this.fire('fileProgress', this);
    }
    /**
     * Cancel uploading this file and remove it from the file list
     */

  }, {
    key: "cancel",
    value: function cancel() {
      var _iterator2 = _createForOfIteratorHelper(this.chunks),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var chunk = _step2.value;

          if (chunk.status === 'chunkUploading') {
            chunk.abort();
            this.fire('chunkCancel', chunk);
          }
        } // Reset this file to be void

      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      this.chunks = [];
      this.fire('fileCancel', this);
      this.fire('fileProgress', this);
    }
  }, {
    key: "retry",
    value: function retry() {
      var _this2 = this;

      this.bootstrap();
      var firedRetry = false;
      this.on('chunkingComplete', function () {
        if (!firedRetry) _this2.fire('fileRetry');
        firedRetry = true;
      });
    }
  }, {
    key: "bootstrap",
    value: function bootstrap() {
      var _this3 = this;

      var progressHandler = function progressHandler(message) {
        return _this3.fire('fileProgress', _this3, message);
      };

      var retryHandler = function retryHandler() {
        return _this3.fire('fileRetry', _this3);
      };

      var successHandler = function successHandler(message) {
        if (_this3._error) return;

        _this3.fire('chunkSuccess');

        _this3.fire('fileProgress', _this3, message); // it's at least progress


        if (_this3.isComplete()) {
          _this3.fire('fileSuccess', _this3, message);
        }
      };

      var errorHandler = function errorHandler(message) {
        _this3.fire('chunkError', message);

        _this3.abort();

        _this3._error = true;
        _this3.chunks = [];

        _this3.fire('fileError', _this3, message);
      };

      this.abort();
      this._error = false; // Rebuild stack of chunks from file

      this.chunks = [];
      this._prevProgress = 0;
      var round = this.forceChunkSize ? Math.ceil : Math.floor;
      var maxOffset = Math.max(round(this.file.size / this.chunkSize), 1);

      for (var offset = 0; offset < maxOffset; offset++) {
        var chunk = new _resumableChunk_js__WEBPACK_IMPORTED_MODULE_15__.default(this, offset, this.opts);
        chunk.on('chunkProgress', progressHandler);
        chunk.on('chunkError', errorHandler);
        chunk.on('chunkSuccess', successHandler);
        chunk.on('chunkRetry', retryHandler);
        this.chunks.push(chunk);
        this.fire('chunkingProgress', this, offset / maxOffset);
      }

      this.fire('chunkingComplete', this);
    }
  }, {
    key: "progress",
    value: function progress() {
      if (this._error) return 1; // Sum up progress across everything

      var ret = 0;
      var error = false;

      var _iterator3 = _createForOfIteratorHelper(this.chunks),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var chunk = _step3.value;
          if (chunk.status === 'chunkError') error = true;
          ret += chunk.progress(true); // get chunk progress relative to entire file
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      ret = error ? 1 : ret > 0.99999 ? 1 : ret;
      ret = Math.max(this._prevProgress, ret); // We don't want to lose percentages when an upload is paused

      this._prevProgress = ret;
      return ret;
    }
  }, {
    key: "isUploading",
    value: function isUploading() {
      var _context;

      return _babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_14___default()(_context = this.chunks).call(_context, function (chunk) {
        return chunk.status === 'chunkUploading';
      });
    }
  }, {
    key: "isComplete",
    value: function isComplete() {
      var _context2;

      if (this.preprocessState === 1) {
        return false;
      }

      return !_babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_14___default()(_context2 = this.chunks).call(_context2, function (chunk) {
        return chunk.status === 'chunkPending' || chunk.status === 'chunkUploading' || chunk.preprocessState === 1;
      });
    }
  }, {
    key: "preprocessFinished",
    value: function preprocessFinished() {
      this.preprocessState = 2;
      this.upload();
    }
  }, {
    key: "upload",
    value: function upload() {
      if (this.pause) {
        return false;
      }

      if (typeof this.preprocessFile === 'function') {
        switch (this.preprocessState) {
          case 0:
            this.preprocessState = 1;
            this.preprocessFile(this);
            return true;

          case 1:
            return true;

          case 2:
            break;
        }
      }

      var _iterator4 = _createForOfIteratorHelper(this.chunks),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var chunk = _step4.value;

          if (chunk.status === 'chunkPending' && chunk.preprocessState !== 1) {
            chunk.send();
            return true;
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }

      return false;
    }
  }, {
    key: "markChunksCompleted",
    value: function markChunksCompleted(chunkNumber) {
      if (!this.chunks || this.chunks.length <= chunkNumber) {
        return;
      }

      for (var num = 0; num < chunkNumber; num++) {
        this.chunks[num].markComplete = true;
      }
    }
  }]);

  return ResumableFile;
}(_resumableEventHandler_js__WEBPACK_IMPORTED_MODULE_17__.default);



/***/ }),
/* 415 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ResumableChunk)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_keys__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(416);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_keys__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_object_keys__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(420);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(362);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(423);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(427);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptors__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(433);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptors__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptors__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_define_properties__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(438);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_define_properties__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_object_define_properties__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_define_property__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(442);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_object_define_property__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_object_define_property__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(444);
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(181);
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(182);
/* harmony import */ var _babel_runtime_corejs3_helpers_inherits__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(187);
/* harmony import */ var _babel_runtime_corejs3_helpers_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(197);
/* harmony import */ var _babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(203);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(341);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_15__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(445);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_16___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_16__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(208);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_17__);
/* harmony import */ var core_js_modules_es_date_to_string_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(448);
/* harmony import */ var core_js_modules_es_date_to_string_js__WEBPACK_IMPORTED_MODULE_18___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_date_to_string_js__WEBPACK_IMPORTED_MODULE_18__);
/* harmony import */ var _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(393);
/* harmony import */ var _resumableEventHandler_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(449);



















function ownKeys(object, enumerableOnly) { var keys = _babel_runtime_corejs3_core_js_stable_object_keys__WEBPACK_IMPORTED_MODULE_1___default()(object); if ((_babel_runtime_corejs3_core_js_stable_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_2___default())) { var symbols = _babel_runtime_corejs3_core_js_stable_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_2___default()(object); if (enumerableOnly) { symbols = _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_3___default()(symbols).call(symbols, function (sym) { return _babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_4___default()(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context3; _babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_5___default()(_context3 = ownKeys(Object(source), true)).call(_context3, function (key) { (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(target, key, source[key]); }); } else if ((_babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptors__WEBPACK_IMPORTED_MODULE_6___default())) { _babel_runtime_corejs3_core_js_stable_object_define_properties__WEBPACK_IMPORTED_MODULE_7___default()(target, _babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptors__WEBPACK_IMPORTED_MODULE_6___default()(source)); } else { var _context4; _babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_5___default()(_context4 = ownKeys(Object(source))).call(_context4, function (key) { _babel_runtime_corejs3_core_js_stable_object_define_property__WEBPACK_IMPORTED_MODULE_8___default()(target, key, _babel_runtime_corejs3_core_js_stable_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_4___default()(source, key)); }); } } return target; }



function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0,_babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_14__.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0,_babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_14__.default)(this).constructor; result = _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default()(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0,_babel_runtime_corejs3_helpers_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_13__.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default())) return false; if ((_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default().sham)) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default()(Boolean, [], function () {})); return true; } catch (e) { return false; } }




var ResumableChunk = /*#__PURE__*/function (_ResumableEventHandle) {
  (0,_babel_runtime_corejs3_helpers_inherits__WEBPACK_IMPORTED_MODULE_12__.default)(ResumableChunk, _ResumableEventHandle);

  var _super = _createSuper(ResumableChunk);

  function ResumableChunk(fileObj, offset, options) {
    var _this;

    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_10__.default)(this, ResumableChunk);

    _this = _super.call(this, fileObj);

    _this.setOptions(options);

    _this.fileObj = fileObj;
    _this.fileObjSize = fileObj.size;
    _this.fileObjType = fileObj.file.type;
    _this.offset = offset;
    _this.lastProgressCallback = new Date();
    _this.tested = false;
    _this.retries = 0;
    _this.pendingRetry = false;
    _this.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished

    _this.markComplete = false; // Computed properties

    _this.loaded = 0;
    _this.startByte = _this.offset * _this.chunkSize;
    _this.endByte = Math.min(_this.fileObjSize, (_this.offset + 1) * _this.chunkSize);

    if (_this.fileObjSize - _this.endByte < _this.chunkSize && !_this.forceChunkSize) {
      // The last chunk will be bigger than the chunk size, but less than 2*chunkSize
      _this.endByte = _this.fileObjSize;
    }

    _this.xhr = null;
    return _this;
  }

  (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_11__.default)(ResumableChunk, [{
    key: "formattedQuery",
    get: function get() {
      var _extraData;

      var customQuery = this.query;
      if (typeof customQuery == 'function') customQuery = customQuery(this.fileObj, this); // Add extra data to identify chunk

      var extraData = (_extraData = {}, (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.chunkNumberParameterName, this.offset + 1), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.chunkSizeParameterName, this.chunkSize), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.currentChunkSizeParameterName, this.endByte - this.startByte), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.totalSizeParameterName, this.fileObjSize), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.typeParameterName, this.fileObjType), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.identifierParameterName, this.fileObj.uniqueIdentifier), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.fileNameParameterName, this.fileObj.fileName), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.relativePathParameterName, this.fileObj.relativePath), (0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_9__.default)(_extraData, this.totalChunksParameterName, this.fileObj.chunks.length), _extraData);
      return _objectSpread(_objectSpread({}, extraData), customQuery);
    }
    /**
     * @returns 'chunkPending' | 'chunkUploading' | 'chunkSuccess'  | 'chunkError'
     */

  }, {
    key: "status",
    get: function get() {
      var _context;

      if (this.pendingRetry) {
        // if pending retry then that's effectively the same as actively uploading,
        // there might just be a slight delay before the retry starts
        return 'chunkUploading';
      } else if (this.markComplete) {
        return 'chunkSuccess';
      } else if (!this.xhr) {
        return 'chunkPending';
      } else if (this.xhr.readyState < 4) {
        // Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
        return 'chunkUploading';
      } else if (this.xhr.status === 200 || this.xhr.status === 201) {
        // HTTP 200, 201 (created)
        return 'chunkSuccess';
      } else if (_babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_15___default()(_context = this.permanentErrors).call(_context, this.xhr.status) || this.retries >= this.maxChunkRetries) {
        // HTTP 400, 404, 409, 415, 500, 501 (permanent error)
        return 'chunkError';
      } else {
        // this should never happen, but we'll reset and queue a retry
        // a likely case for this would be 503 service unavailable
        this.abort();
        return 'chunkPending';
      }
    }
  }, {
    key: "setOptions",
    value:
    /**
     * @param {{
     * permanentErrors: number[],
     * chunkRetryInterval: undefined,
     * chunkFormat: string,
     * chunkNumberParameterName: string,
     * uploadMethod: string,
     * typeParameterName: string,
     * preprocess: null,
     * maxChunkRetries: number,
     * setChunkTypeFromFile: boolean,
     * xhrTimeout: number,
     * fileNameParameterName: string,
     * parameterNamespace: string,
     * relativePathParameterName: string,
     * chunkSizeParameterName: string,
     * testChunks: boolean,
     * throttleProgressCallbacks: number,
     * totalChunksParameterName: string,
     * headers: {},
     * chunkSize: number,
     * method: string,
     * query: {},
     * testTarget: null,
     * fileParameterName: string,
     * target: string,
     * withCredentials: boolean,
     * testMethod: string,
     * identifierParameterName: string,
     * currentChunkSizeParameterName: string,
     * totalSizeParameterName: string}} options
     */
    function setOptions(options) {
      // Options
      var _options$chunkSize = options.chunkSize;
      this.chunkSize = _options$chunkSize === void 0 ? 1 * 1024 * 1024 : _options$chunkSize;
      var _options$forceChunkSi = options.forceChunkSize;
      this.forceChunkSize = _options$forceChunkSi === void 0 ? false : _options$forceChunkSi;
      var _options$fileParamete = options.fileParameterName;
      this.fileParameterName = _options$fileParamete === void 0 ? 'file' : _options$fileParamete;
      var _options$chunkNumberP = options.chunkNumberParameterName;
      this.chunkNumberParameterName = _options$chunkNumberP === void 0 ? 'resumableChunkNumber' : _options$chunkNumberP;
      var _options$chunkSizePar = options.chunkSizeParameterName;
      this.chunkSizeParameterName = _options$chunkSizePar === void 0 ? 'resumableChunkSize' : _options$chunkSizePar;
      var _options$currentChunk = options.currentChunkSizeParameterName;
      this.currentChunkSizeParameterName = _options$currentChunk === void 0 ? 'resumableCurrentChunkSize' : _options$currentChunk;
      var _options$totalSizePar = options.totalSizeParameterName;
      this.totalSizeParameterName = _options$totalSizePar === void 0 ? 'resumableTotalSize' : _options$totalSizePar;
      var _options$typeParamete = options.typeParameterName;
      this.typeParameterName = _options$typeParamete === void 0 ? 'resumableType' : _options$typeParamete;
      var _options$identifierPa = options.identifierParameterName;
      this.identifierParameterName = _options$identifierPa === void 0 ? 'resumableIdentifier' : _options$identifierPa;
      var _options$fileNamePara = options.fileNameParameterName;
      this.fileNameParameterName = _options$fileNamePara === void 0 ? 'resumableFilename' : _options$fileNamePara;
      var _options$relativePath = options.relativePathParameterName;
      this.relativePathParameterName = _options$relativePath === void 0 ? 'resumableRelativePath' : _options$relativePath;
      var _options$totalChunksP = options.totalChunksParameterName;
      this.totalChunksParameterName = _options$totalChunksP === void 0 ? 'resumableTotalChunks' : _options$totalChunksP;
      var _options$throttleProg = options.throttleProgressCallbacks;
      this.throttleProgressCallbacks = _options$throttleProg === void 0 ? 0.5 : _options$throttleProg;
      var _options$query = options.query;
      this.query = _options$query === void 0 ? {} : _options$query;
      var _options$headers = options.headers;
      this.headers = _options$headers === void 0 ? {} : _options$headers;
      var _options$preprocess = options.preprocess;
      this.preprocess = _options$preprocess === void 0 ? null : _options$preprocess;
      var _options$method = options.method;
      this.method = _options$method === void 0 ? 'multipart' : _options$method;
      var _options$uploadMethod = options.uploadMethod;
      this.uploadMethod = _options$uploadMethod === void 0 ? 'POST' : _options$uploadMethod;
      var _options$testMethod = options.testMethod;
      this.testMethod = _options$testMethod === void 0 ? 'GET' : _options$testMethod;
      var _options$parameterNam = options.parameterNamespace;
      this.parameterNamespace = _options$parameterNam === void 0 ? '' : _options$parameterNam;
      var _options$testChunks = options.testChunks;
      this.testChunks = _options$testChunks === void 0 ? true : _options$testChunks;
      var _options$maxChunkRetr = options.maxChunkRetries;
      this.maxChunkRetries = _options$maxChunkRetr === void 0 ? 100 : _options$maxChunkRetr;
      var _options$chunkRetryIn = options.chunkRetryInterval;
      this.chunkRetryInterval = _options$chunkRetryIn === void 0 ? undefined : _options$chunkRetryIn;
      var _options$permanentErr = options.permanentErrors;
      this.permanentErrors = _options$permanentErr === void 0 ? [400, 401, 403, 404, 409, 415, 500, 501] : _options$permanentErr;
      var _options$withCredenti = options.withCredentials;
      this.withCredentials = _options$withCredenti === void 0 ? false : _options$withCredenti;
      var _options$xhrTimeout = options.xhrTimeout;
      this.xhrTimeout = _options$xhrTimeout === void 0 ? 0 : _options$xhrTimeout;
      var _options$chunkFormat = options.chunkFormat;
      this.chunkFormat = _options$chunkFormat === void 0 ? 'blob' : _options$chunkFormat;
      var _options$setChunkType = options.setChunkTypeFromFile;
      this.setChunkTypeFromFile = _options$setChunkType === void 0 ? false : _options$setChunkType;
      var _options$target = options.target;
      this.target = _options$target === void 0 ? '/' : _options$target;
      var _options$testTarget = options.testTarget;
      this.testTarget = _options$testTarget === void 0 ? null : _options$testTarget;
    }
  }, {
    key: "setCustomHeaders",
    value: function setCustomHeaders() {
      if (!this.xhr) {
        return;
      }

      var customHeaders = this.headers;

      if (typeof customHeaders === 'function') {
        customHeaders = customHeaders(this.fileObj, this);
      }

      for (var header in customHeaders) {
        if (!customHeaders.hasOwnProperty(header)) continue;
        this.xhr.setRequestHeader(header, customHeaders[header]);
      }
    }
  }, {
    key: "getTarget",
    value: function getTarget(requestType) {
      return _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_19__.default.getTarget(requestType, this.target, this.testTarget, this.formattedQuery, this.parameterNamespace);
    }
  }, {
    key: "preprocessFinished",
    value: function preprocessFinished() {
      this.preprocessState = 2;
      this.send();
    }
  }, {
    key: "test",
    value:
    /**
     * Makes a GET request without any data to see if the chunk has already been uploaded in a previous session
     */
    function test() {
      var _this2 = this;

      // Set up request and listen for event
      this.xhr = new XMLHttpRequest();

      var testHandler = function testHandler() {
        _this2.tested = true;
        var status = _this2.status;

        if (status === 'success') {
          _this2.fire('chunkSuccess', _this2.message());
        } else {
          _this2.send();
        }
      };

      this.xhr.addEventListener('load', testHandler, false);
      this.xhr.addEventListener('error', testHandler, false);
      this.xhr.addEventListener('timeout', testHandler, false); // Append the relevant chunk and send it

      this.xhr.open(this.testMethod, this.getTarget('test'));
      this.xhr.timeout = this.xhrTimeout;
      this.xhr.withCredentials = this.withCredentials; // Add data from header options

      this.setCustomHeaders();
      this.xhr.send(null);
    }
    /**
     * Abort and reset a request
     */

  }, {
    key: "abort",
    value: function abort() {
      if (this.xhr) this.xhr.abort();
      this.xhr = null;
    }
    /**
     *  Uploads the actual data in a POST call
     */

  }, {
    key: "send",
    value: function send() {
      var _this3 = this,
          _context2;

      if (typeof this.preprocess === 'function') {
        switch (this.preprocessState) {
          case 0:
            this.preprocessState = 1;
            this.preprocess(this);
            return;

          case 1:
            return;

          case 2:
            break;
        }
      }

      if (this.testChunks && !this.tested) {
        this.test();
        return;
      } // Set up request and listen for event


      this.xhr = new XMLHttpRequest(); // Progress

      this.xhr.upload.addEventListener('progress', function (e) {
        if (new Date() - _this3.lastProgressCallback > _this3.throttleProgressCallbacks * 1000) {
          _this3.fire('chunkProgress');

          _this3.lastProgressCallback = new Date();
        }

        _this3.loaded = e.loaded || 0;
      }, false);
      this.loaded = 0;
      this.pendingRetry = false;
      this.fire('chunkProgress');
      /**
       * Handles the different xhr registeredEventHandlers based on the status of this chunk
       */

      var doneHandler = function doneHandler() {
        var status = _this3.status;

        switch (status) {
          case 'chunkSuccess':
          case 'chunkError':
            _this3.fire(status, _this3.message());

            break;

          default:
            _this3.fire('chunkRetry', _this3.message());

            _this3.abort();

            _this3.retries++;
            var retryInterval = _this3.chunkRetryInterval;

            if (retryInterval !== undefined) {
              _this3.pendingRetry = true;

              _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_16___default()(_this3.send, retryInterval);
            } else {
              _this3.send();
            }

            break;
        }
      };

      this.xhr.addEventListener('load', doneHandler, false);
      this.xhr.addEventListener('error', doneHandler, false);
      this.xhr.addEventListener('timeout', doneHandler, false); // Set up the basic query data from Resumable

      var bytes = _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_17___default()(_context2 = this.fileObj.file).call(_context2, this.startByte, this.endByte, this.setChunkTypeFromFile ? this.fileObj.file.type : '');

      var data = null;
      var parameterNamespace = this.parameterNamespace; // Add data from the query options

      if (this.method === 'octet') {
        data = bytes;
      } else {
        data = new FormData();

        for (var queryKey in this.formattedQuery) {
          data.append(parameterNamespace + queryKey, this.formattedQuery[queryKey]);
        }

        switch (this.chunkFormat) {
          case 'blob':
            data.append(parameterNamespace + this.fileParameterName, bytes, this.fileObj.fileName);
            break;

          case 'base64':
            var fr = new FileReader();

            fr.onload = function (e) {
              data.append(parameterNamespace + this.fileParameterName, fr.result);
              this.xhr.send(data);
            };

            fr.readAsDataURL(bytes);
            break;
        }
      }

      var target = this.getTarget('upload');
      this.xhr.open(this.uploadMethod, target);

      if (this.method === 'octet') {
        this.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      }

      this.xhr.timeout = this.xhrTimeout;
      this.xhr.withCredentials = this.withCredentials; // Add data from header options

      this.setCustomHeaders();

      if (this.chunkFormat === 'blob') {
        this.xhr.send(data);
      }
    }
  }, {
    key: "message",
    value: function message() {
      return this.xhr ? this.xhr.responseText : '';
    }
  }, {
    key: "progress",
    value: function progress() {
      var relative = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var factor = relative ? (this.endByte - this.startByte) / this.fileObjSize : 1;
      if (this.pendingRetry) return 0;
      if ((!this.xhr || !this.xhr.status) && !this.markComplete) factor *= .95;

      switch (this.status) {
        case 'chunkSuccess':
        case 'chunkError':
          return factor;

        case 'chunkPending':
          return 0;

        default:
          return this.loaded / (this.endByte - this.startByte) * factor;
      }
    }
  }]);

  return ResumableChunk;
}(_resumableEventHandler_js__WEBPACK_IMPORTED_MODULE_20__.default);



/***/ }),
/* 416 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(417);

/***/ }),
/* 417 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(418);

module.exports = parent;


/***/ }),
/* 418 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(419);
var path = __webpack_require__(21);

module.exports = path.Object.keys;


/***/ }),
/* 419 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var toObject = __webpack_require__(33);
var nativeKeys = __webpack_require__(45);
var fails = __webpack_require__(9);

var FAILS_ON_PRIMITIVES = fails(function () { nativeKeys(1); });

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
$({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES }, {
  keys: function keys(it) {
    return nativeKeys(toObject(it));
  }
});


/***/ }),
/* 420 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(421);

/***/ }),
/* 421 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(422);

module.exports = parent;


/***/ }),
/* 422 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(66);
var path = __webpack_require__(21);

module.exports = path.Object.getOwnPropertySymbols;


/***/ }),
/* 423 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(424);

/***/ }),
/* 424 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(425);

module.exports = parent;


/***/ }),
/* 425 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(426);
var path = __webpack_require__(21);

var Object = path.Object;

var getOwnPropertyDescriptor = module.exports = function getOwnPropertyDescriptor(it, key) {
  return Object.getOwnPropertyDescriptor(it, key);
};

if (Object.getOwnPropertyDescriptor.sham) getOwnPropertyDescriptor.sham = true;


/***/ }),
/* 426 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var fails = __webpack_require__(9);
var toIndexedObject = __webpack_require__(12);
var nativeGetOwnPropertyDescriptor = __webpack_require__(7).f;
var DESCRIPTORS = __webpack_require__(8);

var FAILS_ON_PRIMITIVES = fails(function () { nativeGetOwnPropertyDescriptor(1); });
var FORCED = !DESCRIPTORS || FAILS_ON_PRIMITIVES;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
$({ target: 'Object', stat: true, forced: FORCED, sham: !DESCRIPTORS }, {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
    return nativeGetOwnPropertyDescriptor(toIndexedObject(it), key);
  }
});


/***/ }),
/* 427 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(428);

/***/ }),
/* 428 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(99);
var forEach = __webpack_require__(429);
var classof = __webpack_require__(77);
var ArrayPrototype = Array.prototype;

var DOMIterables = {
  DOMTokenList: true,
  NodeList: true
};

module.exports = function (it) {
  var own = it.forEach;
  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.forEach)
    // eslint-disable-next-line no-prototype-builtins -- safe
    || DOMIterables.hasOwnProperty(classof(it)) ? forEach : own;
};


/***/ }),
/* 429 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(430);

module.exports = parent;


/***/ }),
/* 430 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(431);
var entryVirtual = __webpack_require__(150);

module.exports = entryVirtual('Array').forEach;


/***/ }),
/* 431 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(5);
var forEach = __webpack_require__(432);

// `Array.prototype.forEach` method
// https://tc39.es/ecma262/#sec-array.prototype.foreach
// eslint-disable-next-line es/no-array-prototype-foreach -- safe
$({ target: 'Array', proto: true, forced: [].forEach != forEach }, {
  forEach: forEach
});


/***/ }),
/* 432 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $forEach = __webpack_require__(81).forEach;
var arrayMethodIsStrict = __webpack_require__(356);

var STRICT_METHOD = arrayMethodIsStrict('forEach');

// `Array.prototype.forEach` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.foreach
module.exports = !STRICT_METHOD ? function forEach(callbackfn /* , thisArg */) {
  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
// eslint-disable-next-line es/no-array-prototype-foreach -- safe
} : [].forEach;


/***/ }),
/* 433 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(434);

/***/ }),
/* 434 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(435);

module.exports = parent;


/***/ }),
/* 435 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(436);
var path = __webpack_require__(21);

module.exports = path.Object.getOwnPropertyDescriptors;


/***/ }),
/* 436 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var DESCRIPTORS = __webpack_require__(8);
var ownKeys = __webpack_require__(437);
var toIndexedObject = __webpack_require__(12);
var getOwnPropertyDescriptorModule = __webpack_require__(7);
var createProperty = __webpack_require__(61);

// `Object.getOwnPropertyDescriptors` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
$({ target: 'Object', stat: true, sham: !DESCRIPTORS }, {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
    var O = toIndexedObject(object);
    var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
    var keys = ownKeys(O);
    var result = {};
    var index = 0;
    var key, descriptor;
    while (keys.length > index) {
      descriptor = getOwnPropertyDescriptor(O, key = keys[index++]);
      if (descriptor !== undefined) createProperty(result, key, descriptor);
    }
    return result;
  }
});


/***/ }),
/* 437 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(20);
var getOwnPropertyNamesModule = __webpack_require__(68);
var getOwnPropertySymbolsModule = __webpack_require__(70);
var anObject = __webpack_require__(42);

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};


/***/ }),
/* 438 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(439);

/***/ }),
/* 439 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(440);

module.exports = parent;


/***/ }),
/* 440 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(441);
var path = __webpack_require__(21);

var Object = path.Object;

var defineProperties = module.exports = function defineProperties(T, D) {
  return Object.defineProperties(T, D);
};

if (Object.defineProperties.sham) defineProperties.sham = true;


/***/ }),
/* 441 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var DESCRIPTORS = __webpack_require__(8);
var defineProperties = __webpack_require__(44);

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
$({ target: 'Object', stat: true, forced: !DESCRIPTORS, sham: !DESCRIPTORS }, {
  defineProperties: defineProperties
});


/***/ }),
/* 442 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(443);

/***/ }),
/* 443 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(185);

module.exports = parent;


/***/ }),
/* 444 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _defineProperty)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(183);

function _defineProperty(obj, key, value) {
  if (key in obj) {
    _babel_runtime_corejs3_core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

/***/ }),
/* 445 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(446);

/***/ }),
/* 446 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(447);
var path = __webpack_require__(21);

module.exports = path.setTimeout;


/***/ }),
/* 447 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(5);
var global = __webpack_require__(6);
var userAgent = __webpack_require__(25);

var slice = [].slice;
var MSIE = /MSIE .\./.test(userAgent); // <- dirty ie9- check

var wrap = function (scheduler) {
  return function (handler, timeout /* , ...arguments */) {
    var boundArgs = arguments.length > 2;
    var args = boundArgs ? slice.call(arguments, 2) : undefined;
    return scheduler(boundArgs ? function () {
      // eslint-disable-next-line no-new-func -- spec requirement
      (typeof handler == 'function' ? handler : Function(handler)).apply(this, args);
    } : handler, timeout);
  };
};

// ie9- setTimeout & setInterval additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
$({ global: true, bind: true, forced: MSIE }, {
  // `setTimeout` method
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
  setTimeout: wrap(global.setTimeout),
  // `setInterval` method
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
  setInterval: wrap(global.setInterval)
});


/***/ }),
/* 448 */
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var redefine = __webpack_require__(249);

var DatePrototype = Date.prototype;
var INVALID_DATE = 'Invalid Date';
var TO_STRING = 'toString';
var nativeDateToString = DatePrototype[TO_STRING];
var getTime = DatePrototype.getTime;

// `Date.prototype.toString` method
// https://tc39.es/ecma262/#sec-date.prototype.tostring
if (String(new Date(NaN)) != INVALID_DATE) {
  redefine(DatePrototype, TO_STRING, function toString() {
    var value = getTime.call(this);
    // eslint-disable-next-line no-self-compare -- NaN check
    return value === value ? nativeDateToString.call(this) : INVALID_DATE;
  });
}


/***/ }),
/* 449 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ResumableEventHandler)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(181);
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(182);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(335);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(427);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(282);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_4__);






var ResumableEventHandler = /*#__PURE__*/function () {
  function ResumableEventHandler() {
    var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__.default)(this, ResumableEventHandler);

    this.parent = parent;
    this.registeredEventHandlers = {};
  }
  /**
   * @param {string} event
   * @param {function} callback
   */


  (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__.default)(ResumableEventHandler, [{
    key: "on",
    value: function on(event, callback) {
      event = event.toLowerCase();

      if (!this.registeredEventHandlers.hasOwnProperty(event)) {
        this.registeredEventHandlers[event] = [];
      }

      this.registeredEventHandlers[event].push(callback);
    }
  }, {
    key: "fire",
    value: function fire(event) {
      var _context, _context2;

      // Find event listeners, and support wildcard-event `*` to catch all
      event = event.toLowerCase();

      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      console.log(this.constructor.name, event, args);
      this.executeEventCallback.apply(this, _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_2___default()(_context = [event]).call(_context, args));
      this.executeEventCallback.apply(this, _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_2___default()(_context2 = ['*', event]).call(_context2, args)); //Let the event bubble up to the parent if present
      //if (this.parent !== undefined) this.parent.fire(event, ...args);
    }
  }, {
    key: "executeEventCallback",
    value: function executeEventCallback(event) {
      var _context3;

      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      if (!this.registeredEventHandlers.hasOwnProperty(event)) return;

      _babel_runtime_corejs3_core_js_stable_instance_for_each__WEBPACK_IMPORTED_MODULE_3___default()(_context3 = this.registeredEventHandlers[event]).call(_context3, function (callback) {
        return callback.apply(void 0, args);
      });
    }
  }]);

  return ResumableEventHandler;
}();



/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Resumable": () => (/* binding */ Resumable)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(56);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(111);
/* harmony import */ var _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(116);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _babel_runtime_corejs3_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(120);
/* harmony import */ var _babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(152);
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(181);
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(182);
/* harmony import */ var _babel_runtime_corejs3_helpers_inherits__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(187);
/* harmony import */ var _babel_runtime_corejs3_helpers_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(197);
/* harmony import */ var _babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(203);
/* harmony import */ var _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(212);
/* harmony import */ var _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(214);
/* harmony import */ var core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_14__);
/* harmony import */ var core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(276);
/* harmony import */ var core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_15__);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(282);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_16___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_16__);
/* harmony import */ var core_js_modules_es_array_iterator_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(283);
/* harmony import */ var core_js_modules_es_array_iterator_js__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_iterator_js__WEBPACK_IMPORTED_MODULE_17__);
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(294);
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_18___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_18__);
/* harmony import */ var core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(298);
/* harmony import */ var core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_19___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_19__);
/* harmony import */ var core_js_modules_es_string_iterator_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(322);
/* harmony import */ var core_js_modules_es_string_iterator_js__WEBPACK_IMPORTED_MODULE_20___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_iterator_js__WEBPACK_IMPORTED_MODULE_20__);
/* harmony import */ var core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(323);
/* harmony import */ var core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_21___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_21__);
/* harmony import */ var core_js_modules_es_string_split_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(325);
/* harmony import */ var core_js_modules_es_string_split_js__WEBPACK_IMPORTED_MODULE_22___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_split_js__WEBPACK_IMPORTED_MODULE_22__);
/* harmony import */ var core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(327);
/* harmony import */ var core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_23___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_23__);
/* harmony import */ var core_js_modules_es_string_match_js__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(329);
/* harmony import */ var core_js_modules_es_string_match_js__WEBPACK_IMPORTED_MODULE_24___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_match_js__WEBPACK_IMPORTED_MODULE_24__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(208);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(330);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(335);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_26___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_26__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(339);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(341);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_28___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_28__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(351);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_29___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_29__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(357);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_30___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_30__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(362);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_31___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_31__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(210);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(367);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(372);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_33___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_33__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_splice__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(378);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_splice__WEBPACK_IMPORTED_MODULE_34___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_splice__WEBPACK_IMPORTED_MODULE_34__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_find__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(383);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_find__WEBPACK_IMPORTED_MODULE_35___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_find__WEBPACK_IMPORTED_MODULE_35__);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_every__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(388);
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_every__WEBPACK_IMPORTED_MODULE_36___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs3_core_js_stable_instance_every__WEBPACK_IMPORTED_MODULE_36__);
/* harmony import */ var _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(393);
/* harmony import */ var _resumableFile_js__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(414);
/* harmony import */ var _resumableEventHandler_js__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(449);












function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof (_babel_runtime_corejs3_core_js_stable_symbol__WEBPACK_IMPORTED_MODULE_1___default()) !== "undefined" && _babel_runtime_corejs3_core_js_get_iterator_method__WEBPACK_IMPORTED_MODULE_2___default()(o) || o["@@iterator"]; if (!it) { if (_babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3___default()(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { var _context30; if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = _babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_11___default()(_context30 = Object.prototype.toString.call(o)).call(_context30, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_12___default()(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }




























function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0,_babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_10__.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0,_babel_runtime_corejs3_helpers_getPrototypeOf__WEBPACK_IMPORTED_MODULE_10__.default)(this).constructor; result = _babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default()(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0,_babel_runtime_corejs3_helpers_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_9__.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default())) return false; if ((_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default().sham)) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_babel_runtime_corejs3_core_js_stable_reflect_construct__WEBPACK_IMPORTED_MODULE_0___default()(Boolean, [], function () {})); return true; } catch (e) { return false; } }




/*
* MIT Licensed
* http://www.23developer.com/opensource
* http://github.com/23/resumable.js
* Steffen Tiedemann Christensen, steffen@23company.com
*/

var Resumable = /*#__PURE__*/function (_ResumableEventHandle) {
  (0,_babel_runtime_corejs3_helpers_inherits__WEBPACK_IMPORTED_MODULE_8__.default)(Resumable, _ResumableEventHandle);

  var _super = _createSuper(Resumable);

  function Resumable(options) {
    var _this;

    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_6__.default)(this, Resumable);

    _this = _super.call(this);

    _this.setOptions({
      options: options
    });

    _this.opts = options;
    _this.files = [];
    _this.validators = {};

    _this.checkSupport();

    return _this;
  }

  (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_7__.default)(Resumable, [{
    key: "version",
    get: function get() {
      return 1.0;
    }
  }, {
    key: "checkSupport",
    value: function checkSupport() {
      // SUPPORTED BY BROWSER?
      // Check if these features are supported by the browser:
      // - File object type
      // - Blob object type
      // - FileList object type
      // - slicing files
      this.support = typeof File !== 'undefined' && typeof Blob !== 'undefined' && typeof FileList !== 'undefined' && (!!Blob.prototype.webkitSlice || !!Blob.prototype.mozSlice || !!_babel_runtime_corejs3_core_js_stable_instance_slice__WEBPACK_IMPORTED_MODULE_11___default()(Blob.prototype) || false);

      if (!this.support) {
        throw new Error('Not supported by Browser');
      }
    }
    /**
     * Assign the attributes of this instance via destructuring of the options object.
     * @param {{options}|{
     * maxFileSizeErrorCallback: Resumable.maxFileSizeErrorCallback,
     * minFileSizeErrorCallback: Resumable.minFileSizeErrorCallback,
     * clearInput: boolean,
     * generateUniqueIdentifier: null,
     * minFileSize: number,
     * simultaneousUploads: number,
     * maxFileSize: undefined,
     * fileTypeErrorCallback: Resumable.fileTypeErrorCallback,
     * maxFilesErrorCallback: Resumable.maxFilesErrorCallback,
     * dragOverClass: string,
     * prioritizeFirstAndLastChunk: boolean,
     * fileTypes: string[],
     * maxFiles: undefined}} options
     */

  }, {
    key: "setOptions",
    value: function setOptions(options) {
      var _context,
          _this2 = this;

      var _options$clearInput = options.clearInput;
      this.clearInput = _options$clearInput === void 0 ? true : _options$clearInput;
      var _options$dragOverClas = options.dragOverClass;
      this.dragOverClass = _options$dragOverClas === void 0 ? 'dragover' : _options$dragOverClas;
      var _options$fileTypes = options.fileTypes;
      this.fileTypes = _options$fileTypes === void 0 ? [] : _options$fileTypes;
      var _options$fileTypeErro = options.fileTypeErrorCallback;
      this.fileTypeErrorCallback = _options$fileTypeErro === void 0 ? function (file) {
        var _context2;

        alert(_babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_26___default()(_context2 = "".concat(file.fileName || file.name, " has an unsupported file type, please upload files of type ")).call(_context2, _this2.fileTypes, "."));
      } : _options$fileTypeErro;
      var _options$generateUniq = options.generateUniqueIdentifier;
      this._generateUniqueIdentifier = _options$generateUniq === void 0 ? null : _options$generateUniq;
      var _options$maxFileSize = options.maxFileSize;
      this.maxFileSize = _options$maxFileSize === void 0 ? undefined : _options$maxFileSize;
      var _options$maxFileSizeE = options.maxFileSizeErrorCallback;
      this.maxFileSizeErrorCallback = _options$maxFileSizeE === void 0 ? function (file) {
        alert(file.fileName || file.name + ' is too large, please upload files less than ' + _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_37__.default.formatSize(_this2.maxFileSize) + '.');
      } : _options$maxFileSizeE;
      var _options$maxFiles = options.maxFiles;
      this.maxFiles = _options$maxFiles === void 0 ? undefined : _options$maxFiles;
      var _options$maxFilesErro = options.maxFilesErrorCallback;
      this.maxFilesErrorCallback = _options$maxFilesErro === void 0 ? function (files) {
        var maxFiles = _this2.maxFiles;
        alert('Please upload no more than ' + maxFiles + ' file' + (maxFiles === 1 ? '' : 's') + ' at a time.');
      } : _options$maxFilesErro;
      var _options$minFileSize = options.minFileSize;
      this.minFileSize = _options$minFileSize === void 0 ? 1 : _options$minFileSize;
      var _options$minFileSizeE = options.minFileSizeErrorCallback;
      this.minFileSizeErrorCallback = _options$minFileSizeE === void 0 ? function (file) {
        alert(file.fileName || file.name + ' is too small, please upload files larger than ' + _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_37__.default.formatSize(_this2.minFileSize) + '.');
      } : _options$minFileSizeE;
      var _options$prioritizeFi = options.prioritizeFirstAndLastChunk;
      this.prioritizeFirstAndLastChunk = _options$prioritizeFi === void 0 ? false : _options$prioritizeFi;
      var _options$fileValidati = options.fileValidationErrorCallback;
      this.fileValidationErrorCallback = _options$fileValidati === void 0 ? function (file) {} : _options$fileValidati;
      var _options$simultaneous = options.simultaneousUploads;
      this.simultaneousUploads = _options$simultaneous === void 0 ? 3 : _options$simultaneous;
      // For good behaviour we do some initial sanitizing. Remove spaces and dots and lowercase all
      this.fileTypes = _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25___default()(_context = this.fileTypes).call(_context, function (type) {
        return type.replace(/[\s.]/g, '').toLowerCase();
      });
    }
    /**
     * Transforms a single fileEntry or dirEntry item into one or multiple File objects
     * @param {Object} item item to upload, may be file or directory entry
     * @param {string} path current file path
     */

  }, {
    key: "mapItemToFile",
    value: function () {
      var _mapItemToFile = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__.default)( /*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().mark(function _callee(item, path) {
        var entry, file;
        return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().wrap(function _callee$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!item.isFile) {
                  _context3.next = 8;
                  break;
                }

                _context3.next = 3;
                return new (_babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27___default())(function (resolve, reject) {
                  return item.file(resolve, reject);
                });

              case 3:
                file = _context3.sent;
                file.relativePath = path + file.name;
                return _context3.abrupt("return", file);

              case 8:
                if (!item.isDirectory) {
                  _context3.next = 12;
                  break;
                }

                // item is already a directory entry, just assign
                entry = item;
                _context3.next = 14;
                break;

              case 12:
                if (!(item instanceof File)) {
                  _context3.next = 14;
                  break;
                }

                return _context3.abrupt("return", item);

              case 14:
                if (typeof item.webkitGetAsEntry === 'function') {
                  // get entry from file object
                  entry = item.webkitGetAsEntry();
                }

                if (!(entry && entry.isDirectory)) {
                  _context3.next = 19;
                  break;
                }

                _context3.next = 18;
                return this.processDirectory(entry, path + entry.name + '/');

              case 18:
                return _context3.abrupt("return", _context3.sent);

              case 19:
                if (!(typeof item.getAsFile === 'function')) {
                  _context3.next = 24;
                  break;
                }

                // item represents a File object, convert it
                item = item.getAsFile();

                if (!(item instanceof File)) {
                  _context3.next = 24;
                  break;
                }

                item.relativePath = path + item.name;
                return _context3.abrupt("return", item);

              case 24:
                console.warn('Item mapping did not return a file object. This might be due to an unknown file type.');

              case 25:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee, this);
      }));

      function mapItemToFile(_x, _x2) {
        return _mapItemToFile.apply(this, arguments);
      }

      return mapItemToFile;
    }()
    /**
     * recursively traverse directory and collect files to upload
     * @param  {Object}   directory directory to process
     * @param  {string}   path      current path
     */

  }, {
    key: "processDirectory",
    value: function processDirectory(directory, path) {
      var _this3 = this;

      return new (_babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27___default())(function (resolve, reject) {
        var dirReader = directory.createReader();
        var allEntries = [];

        var readEntries = function readEntries() {
          dirReader.readEntries( /*#__PURE__*/function () {
            var _ref = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__.default)( /*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().mark(function _callee2(entries) {
              return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().wrap(function _callee2$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      if (!entries.length) {
                        _context4.next = 3;
                        break;
                      }

                      allEntries = _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_26___default()(allEntries).call(allEntries, entries);
                      return _context4.abrupt("return", readEntries());

                    case 3:
                      // After collecting all files, map all fileEntries to File objects
                      allEntries = _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25___default()(allEntries).call(allEntries, function (entry) {
                        return _this3.mapItemToFile(entry, path);
                      }); // Wait until all files are collected.

                      _context4.t0 = resolve;
                      _context4.next = 7;
                      return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27___default().all(allEntries);

                    case 7:
                      _context4.t1 = _context4.sent;
                      (0, _context4.t0)(_context4.t1);

                    case 9:
                    case "end":
                      return _context4.stop();
                  }
                }
              }, _callee2);
            }));

            return function (_x3) {
              return _ref.apply(this, arguments);
            };
          }(), reject);
        };

        readEntries();
      });
    }
  }, {
    key: "onDrop",
    value: function () {
      var _onDrop = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__.default)( /*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().mark(function _callee3(e) {
        var _context5,
            _this4 = this;

        var items, promises, files;
        return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().wrap(function _callee3$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                e.currentTarget.classList.remove(this.dragOverClass);
                _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_37__.default.stopEvent(e);
                items = []; //handle dropped things as items if we can (this lets us deal with folders nicer in some cases)

                if (e.dataTransfer && e.dataTransfer.items) {
                  items = e.dataTransfer.items;
                } //else handle them as files
                else if (e.dataTransfer && e.dataTransfer.files) {
                  items = e.dataTransfer.files;
                }

                if (items.length) {
                  _context6.next = 6;
                  break;
                }

                return _context6.abrupt("return");

              case 6:
                this.fire('fileProcessingBegin', items);
                promises = _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25___default()(_context5 = (0,_babel_runtime_corejs3_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_4__.default)(items)).call(_context5, function (item) {
                  return _this4.mapItemToFile(item, '');
                });
                _context6.t0 = _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_37__.default;
                _context6.next = 11;
                return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27___default().all(promises);

              case 11:
                _context6.t1 = _context6.sent;
                files = _context6.t0.flattenDeep.call(_context6.t0, _context6.t1);

                if (files.length) {
                  // at least one file found
                  this.appendFilesFromFileList(files, e);
                }

              case 14:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee3, this);
      }));

      function onDrop(_x4) {
        return _onDrop.apply(this, arguments);
      }

      return onDrop;
    }()
  }, {
    key: "onDragLeave",
    value: function onDragLeave(e) {
      e.currentTarget.classList.remove(this.dragOverClass);
    }
  }, {
    key: "onDragOverEnter",
    value: function onDragOverEnter(e) {
      var _context7;

      e.preventDefault();
      var dt = e.dataTransfer;

      if (_babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_28___default()(_context7 = dt.types).call(_context7, 'Files')) {
        // only for file drop
        e.stopPropagation();
        dt.dropEffect = 'copy';
        dt.effectAllowed = 'copy';
        e.currentTarget.classList.add(this.dragOverClass);
      } else {
        // not work on IE/Edge....
        dt.dropEffect = 'none';
        dt.effectAllowed = 'none';
      }
    }
  }, {
    key: "validateFiles",
    value:
    /**
     * Validate and clean a list of files. This includes the removal of duplicates, a check whether the file type is
     * allowed and custom validation functions defined per file type.
     * @param {File[]} files
     */
    function () {
      var _validateFiles = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__.default)( /*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().mark(function _callee5(files) {
        var _this5 = this;

        var uniqueFiles, validationPromises, results;
        return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().wrap(function _callee5$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                // Remove files that are duplicated in the original array, based on their unique identifiers
                uniqueFiles = _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_37__.default.uniqBy(files, function (file) {
                  return file.uniqueIdentifier;
                }, function (file) {
                  return _this5.fire('fileProcessingFailed', file, 'duplicate');
                });
                validationPromises = _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25___default()(uniqueFiles).call(uniqueFiles, /*#__PURE__*/function () {
                  var _ref2 = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__.default)( /*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().mark(function _callee4(file) {
                    var _context8;

                    var fileType, fileExtension, _context9, fileTypeFound;

                    return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().wrap(function _callee4$(_context10) {
                      while (1) {
                        switch (_context10.prev = _context10.next) {
                          case 0:
                            if (!_babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_29___default()(_context8 = _this5.files).call(_context8, function (addedFile) {
                              return addedFile.uniqueIdentifier === file.uniqueIdentifier;
                            })) {
                              _context10.next = 3;
                              break;
                            }

                            _this5.fire('fileProcessingFailed', file, 'duplicate');

                            return _context10.abrupt("return", false);

                          case 3:
                            fileType = file.type.toLowerCase(); // e.g video/mp4

                            fileExtension = file.name.split('.').pop().toLowerCase();

                            if (!(_this5.fileTypes.length > 0)) {
                              _context10.next = 11;
                              break;
                            }

                            fileTypeFound = _babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_29___default()(_context9 = _this5.fileTypes).call(_context9, function (type) {
                              // Check whether the extension inside the filename is an allowed file type
                              return fileExtension === type || // If MIME type, check for wildcard or if extension matches the file's tile type
                              _babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_28___default()(type).call(type, '/') && (_babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_28___default()(type).call(type, '*') && fileType.substr(0, _babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_30___default()(type).call(type, '*')) === type.substr(0, _babel_runtime_corejs3_core_js_stable_instance_index_of__WEBPACK_IMPORTED_MODULE_30___default()(type).call(type, '*')) || fileType === type);
                            });

                            if (fileTypeFound) {
                              _context10.next = 11;
                              break;
                            }

                            _this5.fire('fileProcessingFailed', file, 'fileType');

                            _this5.fileTypeErrorCallback(file);

                            return _context10.abrupt("return", false);

                          case 11:
                            if (!(_this5.minFileSize !== undefined && file.size < _this5.minFileSize)) {
                              _context10.next = 15;
                              break;
                            }

                            _this5.fire('fileProcessingFailed', file, 'minFileSize');

                            _this5.minFileSizeErrorCallback(file, errorCount++);

                            return _context10.abrupt("return", false);

                          case 15:
                            if (!(_this5.maxFileSize !== undefined && file.size > _this5.maxFileSize)) {
                              _context10.next = 19;
                              break;
                            }

                            _this5.fire('fileProcessingFailed', file, 'maxFileSize');

                            _this5.maxFileSizeErrorCallback(file, errorCount++);

                            return _context10.abrupt("return", false);

                          case 19:
                            _context10.t0 = fileExtension in _this5.validators;

                            if (!_context10.t0) {
                              _context10.next = 24;
                              break;
                            }

                            _context10.next = 23;
                            return _this5.validators[fileExtension](file);

                          case 23:
                            _context10.t0 = !_context10.sent;

                          case 24:
                            if (!_context10.t0) {
                              _context10.next = 28;
                              break;
                            }

                            _this5.fire('fileProcessingFailed', file, 'validation');

                            _this5.fileValidationErrorCallback(file, errorCount++);

                            return _context10.abrupt("return", false);

                          case 28:
                            return _context10.abrupt("return", true);

                          case 29:
                          case "end":
                            return _context10.stop();
                        }
                      }
                    }, _callee4);
                  }));

                  return function (_x6) {
                    return _ref2.apply(this, arguments);
                  };
                }());
                _context11.next = 4;
                return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27___default().all(validationPromises);

              case 4:
                results = _context11.sent;
                return _context11.abrupt("return", _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_31___default()(files).call(files, function (_v, index) {
                  return results[index];
                }));

              case 6:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee5);
      }));

      function validateFiles(_x5) {
        return _validateFiles.apply(this, arguments);
      }

      return validateFiles;
    }()
  }, {
    key: "appendFilesFromFileList",
    value: function () {
      var _appendFilesFromFileList = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__.default)( /*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().mark(function _callee7(fileListObject, event) {
        var _this6 = this;

        var fileList, filesWithUniqueIdentifiers, validatedFiles, skippedFiles, _iterator, _step, file, f;

        return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().wrap(function _callee7$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                fileList = _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_12___default()(fileListObject); // check for uploading too many files

                if (!(this.maxFiles !== undefined && this.maxFiles < fileList.length + this.files.length)) {
                  _context13.next = 9;
                  break;
                }

                if (!(this.maxFiles === 1 && this.files.length === 1 && fileList.length === 1)) {
                  _context13.next = 6;
                  break;
                }

                this.removeFile(this.files[0]);
                _context13.next = 9;
                break;

              case 6:
                this.fire('fileProcessingFailed', undefined, 'maxFiles');
                this.maxFilesErrorCallback(fileList);
                return _context13.abrupt("return", false);

              case 9:
                _context13.next = 11;
                return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_27___default().all(_babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25___default()(fileList).call(fileList, /*#__PURE__*/function () {
                  var _ref3 = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_5__.default)( /*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().mark(function _callee6(file) {
                    return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_13___default().wrap(function _callee6$(_context12) {
                      while (1) {
                        switch (_context12.prev = _context12.next) {
                          case 0:
                            _context12.next = 2;
                            return _this6.generateUniqueIdentifier(file, event);

                          case 2:
                            file.uniqueIdentifier = _context12.sent;
                            return _context12.abrupt("return", file);

                          case 4:
                          case "end":
                            return _context12.stop();
                        }
                      }
                    }, _callee6);
                  }));

                  return function (_x9) {
                    return _ref3.apply(this, arguments);
                  };
                }()));

              case 11:
                filesWithUniqueIdentifiers = _context13.sent;
                _context13.next = 14;
                return this.validateFiles(filesWithUniqueIdentifiers);

              case 14:
                validatedFiles = _context13.sent;
                skippedFiles = _babel_runtime_corejs3_core_js_stable_instance_filter__WEBPACK_IMPORTED_MODULE_31___default()(filesWithUniqueIdentifiers).call(filesWithUniqueIdentifiers, function (file) {
                  return !_babel_runtime_corejs3_core_js_stable_instance_includes__WEBPACK_IMPORTED_MODULE_28___default()(validatedFiles).call(validatedFiles, file);
                });
                _iterator = _createForOfIteratorHelper(validatedFiles);

                try {
                  for (_iterator.s(); !(_step = _iterator.n()).done;) {
                    file = _step.value;
                    f = new _resumableFile_js__WEBPACK_IMPORTED_MODULE_38__.default(this, file, file.uniqueIdentifier, this.opts);
                    f.on('chunkSuccess', function () {
                      return _this6.handleChunkSuccess();
                    });
                    f.on('chunkError', function () {
                      return _this6.handleChunkError();
                    });
                    f.on('chunkCancel', function () {
                      return _this6.handleChunkCancel();
                    });
                    f.on('fileProgress', function () {
                      return _this6.handleFileProgress();
                    });
                    f.on('fileError', function () {
                      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                      }

                      return _this6.handleFileError(args);
                    });
                    f.on('fileSuccess', function () {
                      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                        args[_key2] = arguments[_key2];
                      }

                      return _this6.handleFileSuccess(args);
                    });
                    f.on('fileCancel', function () {
                      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                        args[_key3] = arguments[_key3];
                      }

                      return _this6.handleFileCancel(args);
                    });
                    f.on('fileRetry', function () {
                      return _this6.handleFileRetry();
                    });
                    this.files.push(f);
                    this.fire('fileAdded', f, event);
                  } // all files processed, trigger event

                } catch (err) {
                  _iterator.e(err);
                } finally {
                  _iterator.f();
                }

                if (!(!validatedFiles.length && !skippedFiles.length)) {
                  _context13.next = 20;
                  break;
                }

                return _context13.abrupt("return");

              case 20:
                this.fire('filesAdded', validatedFiles, skippedFiles);

              case 21:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee7, this);
      }));

      function appendFilesFromFileList(_x7, _x8) {
        return _appendFilesFromFileList.apply(this, arguments);
      }

      return appendFilesFromFileList;
    }() // QUEUE

  }, {
    key: "uploadNextChunk",
    value: function uploadNextChunk() {
      // In some cases (such as videos) it's really handy to upload the first
      // and last chunk of a file quickly; this lets the server check the file's
      // metadata and determine if there's even a point in continuing.
      if (this.prioritizeFirstAndLastChunk) {
        var _iterator2 = _createForOfIteratorHelper(this.files),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var file = _step2.value;

            if (file.chunks.length && file.chunks[0].status === 'chunkPending' && file.chunks[0].preprocessState === 0) {
              file.chunks[0].send();
              return;
            }

            if (file.chunks.length > 1 && file.chunks[file.chunks.length - 1].status === 'chunkPending' && file.chunks[file.chunks.length - 1].preprocessState === 0) {
              file.chunks[file.chunks.length - 1].send();
              return;
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      } // Now, simply look for the next, best thing to upload


      var _iterator3 = _createForOfIteratorHelper(this.files),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var _file = _step3.value;
          if (_file.upload()) return;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    } // PUBLIC METHODS FOR RESUMABLE.JS

  }, {
    key: "assignBrowse",
    value: function assignBrowse(domNodes) {
      var _this7 = this;

      var isDirectory = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (domNodes.length === undefined) domNodes = [domNodes];

      var _iterator4 = _createForOfIteratorHelper(domNodes),
          _step4;

      try {
        var _loop = function _loop() {
          var domNode = _step4.value;
          var input = void 0;

          if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
            input = domNode;
          } else {
            input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.style.display = 'none';
            domNode.addEventListener('click', function () {
              input.style.opacity = 0;
              input.style.display = 'block';
              input.focus();
              input.click();
              input.style.display = 'none';
            }, false);
            domNode.appendChild(input);
          }

          if (_this7.maxFiles !== 1) {
            input.setAttribute('multiple', 'multiple');
          } else {
            input.removeAttribute('multiple');
          }

          if (isDirectory) {
            input.setAttribute('webkitdirectory', 'webkitdirectory');
          } else {
            input.removeAttribute('webkitdirectory');
          }

          if (_this7.fileTypes.length >= 1) {
            var _context14;

            input.setAttribute('accept', _babel_runtime_corejs3_core_js_stable_instance_map__WEBPACK_IMPORTED_MODULE_25___default()(_context14 = _this7.fileTypes).call(_context14, function (type) {
              type = type.replace(/\s/g, '').toLowerCase();

              if (type.match(/^[^.][^/]+$/)) {
                type = '.' + type;
              }

              return type;
            }).join(','));
          } else {
            input.removeAttribute('accept');
          } // When new files are added, simply append them to the overall list


          input.addEventListener('change', function (e) {
            _this7.fire('fileProcessingBegin', e.target.files);

            _this7.appendFilesFromFileList(e.target.files, e);

            if (_this7.clearInput) {
              e.target.value = '';
            }
          }, false);
        };

        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          _loop();
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
  }, {
    key: "assignDrop",
    value: function assignDrop(domNodes) {
      if (domNodes.length === undefined) domNodes = [domNodes];

      var _iterator5 = _createForOfIteratorHelper(domNodes),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var _context15, _context16, _context17, _context18;

          var domNode = _step5.value;
          domNode.addEventListener('dragover', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context15 = this.onDragOverEnter).call(_context15, this), false);
          domNode.addEventListener('dragenter', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context16 = this.onDragOverEnter).call(_context16, this), false);
          domNode.addEventListener('dragleave', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context17 = this.onDragLeave).call(_context17, this), false);
          domNode.addEventListener('drop', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context18 = this.onDrop).call(_context18, this), false);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
  }, {
    key: "unAssignDrop",
    value: function unAssignDrop(domNodes) {
      if (domNodes.length === undefined) domNodes = [domNodes];

      var _iterator6 = _createForOfIteratorHelper(domNodes),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var _context19, _context20, _context21, _context22;

          var domNode = _step6.value;
          domNode.removeEventListener('dragover', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context19 = this.onDragOverEnter).call(_context19, this));
          domNode.removeEventListener('dragenter', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context20 = this.onDragOverEnter).call(_context20, this));
          domNode.removeEventListener('dragleave', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context21 = this.onDragLeave).call(_context21, this));
          domNode.removeEventListener('drop', _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_32___default()(_context22 = this.onDrop).call(_context22, this));
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
    }
  }, {
    key: "isUploading",
    value: function isUploading() {
      var _context23;

      return _babel_runtime_corejs3_core_js_stable_instance_some__WEBPACK_IMPORTED_MODULE_29___default()(_context23 = this.files).call(_context23, function (file) {
        return file.isUploading();
      });
    }
  }, {
    key: "upload",
    value: function upload() {
      // Make sure we don't start too many uploads at once
      if (this.isUploading()) return; // Kick off the queue

      this.fire('uploadStart');

      for (var num = 1; num <= this.simultaneousUploads; num++) {
        this.uploadNextChunk();
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      // Resume all chunks currently being uploaded
      var _iterator7 = _createForOfIteratorHelper(this.files),
          _step7;

      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var file = _step7.value;
          file.abort();
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }

      this.fire('pause');
    }
  }, {
    key: "cancel",
    value: function cancel() {
      this.fire('beforeCancel');

      for (var i = this.files.length - 1; i >= 0; i--) {
        this.files[i].cancel();
      }

      this.fire('cancel');
    }
  }, {
    key: "progress",
    value: function progress() {
      var _context24;

      var totalDone = _babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_33___default()(_context24 = this.files).call(_context24, function (accumulator, file) {
        return accumulator + file.size * file.progress();
      }, 0);

      var totalSize = this.getSize();
      return totalSize > 0 ? totalDone / totalSize : 0;
    }
  }, {
    key: "addFile",
    value: function addFile(file, event) {
      this.appendFilesFromFileList([file], event);
    }
  }, {
    key: "addFiles",
    value: function addFiles(files, event) {
      this.appendFilesFromFileList(files, event);
    }
  }, {
    key: "addFileValidator",
    value: function addFileValidator(fileType, validator) {
      if (fileType in this.validators) {
        console.warn("Overwriting validator for file type: ".concat(fileType));
      }

      this.validators[fileType] = validator;
    }
  }, {
    key: "removeFile",
    value: function removeFile(file) {
      for (var i = this.files.length - 1; i >= 0; i--) {
        if (this.files[i] === file) {
          var _context25;

          _babel_runtime_corejs3_core_js_stable_instance_splice__WEBPACK_IMPORTED_MODULE_34___default()(_context25 = this.files).call(_context25, i, 1);

          break;
        }
      }
    }
  }, {
    key: "generateUniqueIdentifier",
    value: function generateUniqueIdentifier(file, event) {
      return typeof this._generateUniqueIdentifier === 'function' ? this._generateUniqueIdentifier(file, event) : _resumableHelpers_js__WEBPACK_IMPORTED_MODULE_37__.default.generateUniqueIdentifier(file);
    }
  }, {
    key: "getFromUniqueIdentifier",
    value: function getFromUniqueIdentifier(uniqueIdentifier) {
      var _context26;

      return _babel_runtime_corejs3_core_js_stable_instance_find__WEBPACK_IMPORTED_MODULE_35___default()(_context26 = this.files).call(_context26, function (file) {
        return file.uniqueIdentifier === uniqueIdentifier;
      });
    }
  }, {
    key: "getSize",
    value: function getSize() {
      var _context27;

      return _babel_runtime_corejs3_core_js_stable_instance_reduce__WEBPACK_IMPORTED_MODULE_33___default()(_context27 = this.files).call(_context27, function (accumulator, file) {
        return accumulator + file.size;
      }, 0);
    }
  }, {
    key: "handleDropEvent",
    value: function handleDropEvent(e) {
      this.onDrop(e);
    }
  }, {
    key: "handleChangeEvent",
    value: function handleChangeEvent(e) {
      this.appendFilesFromFileList(e.target.files, e);
      e.target.value = '';
    }
  }, {
    key: "updateQuery",
    value: function updateQuery(query) {
      this.query = query;
    }
  }, {
    key: "checkUploadComplete",
    value: function checkUploadComplete() {
      var _context28;

      // The are no more outstanding chunks to upload, check if everything is done
      var uploadCompleted = _babel_runtime_corejs3_core_js_stable_instance_every__WEBPACK_IMPORTED_MODULE_36___default()(_context28 = this.files).call(_context28, function (file) {
        return file.isComplete();
      });

      if (uploadCompleted) {
        // All chunks have been uploaded, complete
        this.fire('complete');
      }
    }
    /**
     * Event Handlers: This section should only include methods that are used to
     * handle events coming from the files or chunks.
     */

  }, {
    key: "handleChunkSuccess",
    value: function handleChunkSuccess() {
      this.uploadNextChunk();
    }
  }, {
    key: "handleChunkError",
    value: function handleChunkError() {
      this.uploadNextChunk();
    }
  }, {
    key: "handleChunkCancel",
    value: function handleChunkCancel() {
      this.uploadNextChunk();
    }
  }, {
    key: "handleFileError",
    value: function handleFileError(args) {
      this.fire('error', args[1], args[0]);
    }
  }, {
    key: "handleFileSuccess",
    value: function handleFileSuccess(args) {
      var _context29;

      this.fire.apply(this, _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_26___default()(_context29 = ['fileSuccess']).call(_context29, (0,_babel_runtime_corejs3_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_4__.default)(args)));
      this.checkUploadComplete();
    }
  }, {
    key: "handleFileProgress",
    value: function handleFileProgress() {
      this.fire('progress');
    }
  }, {
    key: "handleFileCancel",
    value: function handleFileCancel(args) {
      this.removeFile(args[0]);
    }
  }, {
    key: "handleFileRetry",
    value: function handleFileRetry() {
      this.upload();
    }
  }]);

  return Resumable;
}(_resumableEventHandler_js__WEBPACK_IMPORTED_MODULE_39__.default);
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});