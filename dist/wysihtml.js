/**
 * @license wysihtml v0.5.0-beta13
 * https://github.com/Voog/wysihtml
 *
 * Author: Christopher Blum (https://github.com/tiff)
 * Secondary author of extended features: Oliver Pulges (https://github.com/pulges)
 *
 * Copyright (C) 2012 XING AG
 * Licensed under the MIT license (MIT)
 *
 */
var wysihtml5 = {
  version: "0.5.0-beta13",

  // namespaces
  commands:   {},
  dom:        {},
  quirks:     {},
  toolbar:    {},
  lang:       {},
  selection:  {},
  views:      {},

  INVISIBLE_SPACE: "\uFEFF",
  INVISIBLE_SPACE_REG_EXP: /\uFEFF/g,

  EMPTY_FUNCTION: function() {},

  ELEMENT_NODE: 1,
  TEXT_NODE:    3,

  BACKSPACE_KEY:  8,
  ENTER_KEY:      13,
  ESCAPE_KEY:     27,
  SPACE_KEY:      32,
  TAB_KEY:        9,
  DELETE_KEY:     46
};
;wysihtml5.polyfills = function(win, doc) {

  // TODO: in future try to replace most inline compability checks with polyfills for code readability 

  // IE8 SUPPORT BLOCK
  // You can compile without all this if IE8 is not needed

  // String trim for ie8
  if (!String.prototype.trim) {
    (function() {
      // Make sure we trim BOM and NBSP
      var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
      String.prototype.trim = function() {
        return this.replace(rtrim, '');
      };
    })();
  }

  // addEventListener, removeEventListener
  (function() {
    var s_add = 'addEventListener',
        s_rem = 'removeEventListener';
    if( doc[s_add] ) return;
    win.Element.prototype[ s_add ] = win[ s_add ] = doc[ s_add ] = function( on, fn, self ) {
      return (self = this).attachEvent( 'on' + on, function(e){
        var e = e || win.event;
        e.target = e.target || e.srcElement;
        e.preventDefault  = e.preventDefault  || function(){e.returnValue = false};
        e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true};
        e.which = e.button ? ( e.button === 2 ? 3 : e.button === 4 ? 2 : e.button ) : e.keyCode;
        fn.call(self, e);
      });
    };
    win.Element.prototype[ s_rem ] = win[ s_rem ] = doc[ s_rem ] = function( on, fn ) {
      return this.detachEvent( 'on' + on, fn );
    };
  })();

  // element.textContent polyfill.
  if (Object.defineProperty && Object.getOwnPropertyDescriptor && Object.getOwnPropertyDescriptor(win.Element.prototype, "textContent") && !Object.getOwnPropertyDescriptor(win.Element.prototype, "textContent").get) {
  	(function() {
  		var innerText = Object.getOwnPropertyDescriptor(win.Element.prototype, "innerText");
  		Object.defineProperty(win.Element.prototype, "textContent",
  			{
  				get: function() {
  					return innerText.get.call(this);
  				},
  				set: function(s) {
  					return innerText.set.call(this, s);
  				}
  			}
  		);
  	})();
  }

  // isArray polyfill for ie8
  if(!Array.isArray) {
    Array.isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }

  // Array indexOf for ie8
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(a,f) {
      for(var c=this.length,r=-1,d=f>>>0; ~(c-d); r=this[--c]===a?c:r);
      return r;
    };
  }

  // Function.prototype.bind()
  // TODO: clean the code from variable 'that' as it can be confusing
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs   = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP    = function() {},
          fBound  = function() {
            return fToBind.apply(this instanceof fNOP && oThis
                   ? this
                   : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }

  // Element.matches Adds ie8 support and unifies nonstandard function names in other browsers
  win.Element && function(ElementPrototype) {
    ElementPrototype.matches = ElementPrototype.matches ||
    ElementPrototype.matchesSelector ||
    ElementPrototype.mozMatchesSelector ||
    ElementPrototype.msMatchesSelector ||
    ElementPrototype.oMatchesSelector ||
    ElementPrototype.webkitMatchesSelector ||
    function (selector) {
      var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
      while (nodes[++i] && nodes[i] != node);
      return !!nodes[i];
    };
  }(win.Element.prototype);

  // Element.classList for ie8-9 (toggle all IE)
  // source http://purl.eligrey.com/github/classList.js/blob/master/classList.js

  if ("document" in win) {
    // Full polyfill for browsers with no classList support
    if (!("classList" in doc.createElement("_"))) {
      (function(view) {
        "use strict";
        if (!('Element' in view)) return;

        var
          classListProp = "classList",
          protoProp = "prototype",
          elemCtrProto = view.Element[protoProp],
          objCtr = Object,
          strTrim = String[protoProp].trim || function() {
            return this.replace(/^\s+|\s+$/g, "");
          },
          arrIndexOf = Array[protoProp].indexOf || function(item) {
            var
              i = 0,
              len = this.length;
            for (; i < len; i++) {
              if (i in this && this[i] === item) {
                return i;
              }
            }
            return -1;
          }, // Vendors: please allow content code to instantiate DOMExceptions
          DOMEx = function(type, message) {
            this.name = type;
            this.code = DOMException[type];
            this.message = message;
          },
          checkTokenAndGetIndex = function(classList, token) {
            if (token === "") {
              throw new DOMEx(
                "SYNTAX_ERR", "An invalid or illegal string was specified"
              );
            }
            if (/\s/.test(token)) {
              throw new DOMEx(
                "INVALID_CHARACTER_ERR", "String contains an invalid character"
              );
            }
            return arrIndexOf.call(classList, token);
          },
          ClassList = function(elem) {
            var
              trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
              classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
              i = 0,
              len = classes.length;
            for (; i < len; i++) {
              this.push(classes[i]);
            }
            this._updateClassName = function() {
              elem.setAttribute("class", this.toString());
            };
          },
          classListProto = ClassList[protoProp] = [],
          classListGetter = function() {
            return new ClassList(this);
          };
        // Most DOMException implementations don't allow calling DOMException's toString()
        // on non-DOMExceptions. Error's toString() is sufficient here.
        DOMEx[protoProp] = Error[protoProp];
        classListProto.item = function(i) {
          return this[i] || null;
        };
        classListProto.contains = function(token) {
          token += "";
          return checkTokenAndGetIndex(this, token) !== -1;
        };
        classListProto.add = function() {
          var
            tokens = arguments,
            i = 0,
            l = tokens.length,
            token, updated = false;
          do {
            token = tokens[i] + "";
            if (checkTokenAndGetIndex(this, token) === -1) {
              this.push(token);
              updated = true;
            }
          }
          while (++i < l);

          if (updated) {
            this._updateClassName();
          }
        };
        classListProto.remove = function() {
          var
            tokens = arguments,
            i = 0,
            l = tokens.length,
            token, updated = false,
            index;
          do {
            token = tokens[i] + "";
            index = checkTokenAndGetIndex(this, token);
            while (index !== -1) {
              this.splice(index, 1);
              updated = true;
              index = checkTokenAndGetIndex(this, token);
            }
          }
          while (++i < l);

          if (updated) {
            this._updateClassName();
          }
        };
        classListProto.toggle = function(token, force) {
          token += "";

          var
            result = this.contains(token),
            method = result ?
            force !== true && "remove" :
            force !== false && "add";

          if (method) {
            this[method](token);
          }

          if (force === true || force === false) {
            return force;
          } else {
            return !result;
          }
        };
        classListProto.toString = function() {
          return this.join(" ");
        };

        if (objCtr.defineProperty) {
          var classListPropDesc = {
            get: classListGetter,
            enumerable: true,
            configurable: true
          };
          try {
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          } catch (ex) { // IE 8 doesn't support enumerable:true
            if (ex.number === -0x7FF5EC54) {
              classListPropDesc.enumerable = false;
              objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
            }
          }
        } else if (objCtr[protoProp].__defineGetter__) {
          elemCtrProto.__defineGetter__(classListProp, classListGetter);
        }

      }(win));

    } else if ("DOMTokenList" in win) {
      // There is full or partial native classList support, so just check if we need
      // to normalize the add/remove and toggle APIs.
      // DOMTokenList is expected to exist (removes conflicts with multiple polyfills present on site)

      (function() {
        "use strict";

        var testElement = doc.createElement("_");

        testElement.classList.add("c1", "c2");

        // Polyfill for IE 10/11 and Firefox <26, where classList.add and
        // classList.remove exist but support only one argument at a time.
        if (!testElement.classList.contains("c2")) {
          var createMethod = function(method) {
            var original = win.DOMTokenList.prototype[method];

            win.DOMTokenList.prototype[method] = function(token) {
              var i, len = arguments.length;

              for (i = 0; i < len; i++) {
                token = arguments[i];
                original.call(this, token);
              }
            };
          };
          createMethod('add');
          createMethod('remove');
        }

        testElement.classList.toggle("c3", false);

        // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
        // support the second argument.
        if (testElement.classList.contains("c3")) {
          var _toggle = win.DOMTokenList.prototype.toggle;

          win.DOMTokenList.prototype.toggle = function(token, force) {
            if (1 in arguments && !this.contains(token) === !force) {
              return force;
            } else {
              return _toggle.call(this, token);
            }
          };

        }

        testElement = null;
      }());

    }

  }

  // Safary has a bug of not restoring selection after node.normalize correctly.
  // Detects the misbegaviour and patches it
  var normalizeHasCaretError = function() {
    if ("createRange" in document && "getSelection" in window) {
      var e = document.createElement('div'),
          t1 = document.createTextNode('a'),
          t2 = document.createTextNode('a'),
          t3 = document.createTextNode('a'),
          r = document.createRange(),
          s, ret;

      e.setAttribute('contenteditable', 'true');
      e.appendChild(t1);
      e.appendChild(t2);
      e.appendChild(t3);
      document.body.appendChild(e);
      r.setStart(t2, 1);
      r.setEnd(t2, 1);

      s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      e.normalize();
      s = window.getSelection();

      ret = (e.childNodes.length !== 1 || s.anchorNode !== e.firstChild || s.anchorOffset !== 2);
      e.parentNode.removeChild(e);
      s.removeAllRanges();
      return ret;
    }
  };

  var getTextNodes = function(node){
    var all = [];
    for (node=node.firstChild;node;node=node.nextSibling){
      if (node.nodeType == 3) {
          all.push(node);
      } else {
        all = all.concat(getTextNodes(node));
      }
    }
    return all;
  };



  var normalizeFix = function() {
    var f = Node.prototype.normalize;
    var nf = function() {
      var texts = getTextNodes(this),
          s = this.ownerDocument.defaultView.getSelection(),
          anode = s.anchorNode,
          aoffset = s.anchorOffset,
          aelement = anode && anode.nodeType === 1 && anode.childNodes.length > 0 ? anode.childNodes[aoffset] : undefined,
          fnode = s.focusNode,
          foffset = s.focusOffset,
          felement = fnode && fnode.nodeType === 1 && foffset > 0 ? fnode.childNodes[foffset -1] : undefined,
          r = this.ownerDocument.createRange(),
          prevTxt = texts.shift(),
          curText = prevTxt ? texts.shift() : null;

      if (felement && felement.nodeType === 3) {
        fnode = felement;
        foffset = felement.nodeValue.length;
        felement = undefined;
      }

      if (aelement && aelement.nodeType === 3) {
        anode = aelement;
        aoffset = 0;
        aelement = undefined;
      }

      if ((anode === fnode && foffset < aoffset) || (anode !== fnode && (anode.compareDocumentPosition(fnode) & Node.DOCUMENT_POSITION_PRECEDING) && !(anode.compareDocumentPosition(fnode) & Node.DOCUMENT_POSITION_CONTAINS))) {
        fnode = [anode, anode = fnode][0];
        foffset = [aoffset, aoffset = foffset][0];
      }

      while(prevTxt && curText) {
        if (curText.previousSibling && curText.previousSibling === prevTxt) {
          if (anode === curText) {
            anode = prevTxt;
            aoffset = prevTxt.nodeValue.length +  aoffset;
          }
          if (fnode === curText) {
            fnode = prevTxt;
            foffset = prevTxt.nodeValue.length +  foffset;
          }
          prevTxt.nodeValue = prevTxt.nodeValue + curText.nodeValue;
          curText.parentNode.removeChild(curText);
          curText = texts.shift();
        } else {
          prevTxt = curText;
          curText = texts.shift();
        }
      }

      if (felement) {
        foffset = Array.prototype.indexOf.call(felement.parentNode.childNodes, felement) + 1;
      }

      if (aelement) {
        aoffset = Array.prototype.indexOf.call(aelement.parentNode.childNodes, aelement);
      }

      if (anode && anode.parentNode && fnode && fnode.parentNode) {
        r.setStart(anode, aoffset);
        r.setEnd(fnode, foffset);
        s.removeAllRanges();
        s.addRange(r);
      }
    };
    Node.prototype.normalize = nf;
  };

  if ("Node" in window && "normalize" in Node.prototype && normalizeHasCaretError()) {
    normalizeFix();
  }
};

wysihtml5.polyfills(window, document);
;/*
	Base.js, version 1.1a
	Copyright 2006-2010, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
*/

var Base = function() {
	// dummy
};

Base.extend = function(_instance, _static) { // subclass
	var extend = Base.prototype.extend;
	
	// build the prototype
	Base._prototyping = true;
	var proto = new this;
	extend.call(proto, _instance);
  proto.base = function() {
    // call this method from any other method to invoke that method's ancestor
  };
	delete Base._prototyping;
	
	// create the wrapper for the constructor function
	//var constructor = proto.constructor.valueOf(); //-dean
	var constructor = proto.constructor;
	var klass = proto.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == klass) { // instantiation
				this._constructing = true;
				constructor.apply(this, arguments);
				delete this._constructing;
			} else if (arguments[0] != null) { // casting
				return (arguments[0].extend || extend).call(arguments[0], proto);
			}
		}
	};
	
	// build the class interface
	klass.ancestor = this;
	klass.extend = this.extend;
	klass.forEach = this.forEach;
	klass.implement = this.implement;
	klass.prototype = proto;
	klass.toString = this.toString;
	klass.valueOf = function(type) {
		//return (type == "object") ? klass : constructor; //-dean
		return (type == "object") ? klass : constructor.valueOf();
	};
	extend.call(klass, _static);
	// class initialisation
	if (typeof klass.init == "function") klass.init();
	return klass;
};

Base.prototype = {	
	extend: function(source, value) {
		if (arguments.length > 1) { // extending with a name/value pair
			var ancestor = this[source];
			if (ancestor && (typeof value == "function") && // overriding a method?
				// the valueOf() comparison is to avoid circular references
				(!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
				/\bbase\b/.test(value)) {
				// get the underlying method
				var method = value.valueOf();
				// override
				value = function() {
					var previous = this.base || Base.prototype.base;
					this.base = ancestor;
					var returnValue = method.apply(this, arguments);
					this.base = previous;
					return returnValue;
				};
				// point to the underlying method
				value.valueOf = function(type) {
					return (type == "object") ? value : method;
				};
				value.toString = Base.toString;
			}
			this[source] = value;
		} else if (source) { // extending with an object literal
			var extend = Base.prototype.extend;
			// if this object has a customised extend method then use it
			if (!Base._prototyping && typeof this != "function") {
				extend = this.extend || extend;
			}
			var proto = {toSource: null};
			// do the "toString" and other methods manually
			var hidden = ["constructor", "toString", "valueOf"];
			// if we are prototyping then include the constructor
			var i = Base._prototyping ? 0 : 1;
			while (key = hidden[i++]) {
				if (source[key] != proto[key]) {
					extend.call(this, key, source[key]);

				}
			}
			// copy each of the source object's properties to this object
			for (var key in source) {
				if (!proto[key]) extend.call(this, key, source[key]);
			}
		}
		return this;
	}
};

// initialise
Base = Base.extend({
	constructor: function() {
		this.extend(arguments[0]);
	}
}, {
	ancestor: Object,
	version: "1.1",
	
	forEach: function(object, block, context) {
		for (var key in object) {
			if (this.prototype[key] === undefined) {
				block.call(context, object[key], key, object);
			}
		}
	},
		
	implement: function() {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == "function") {
				// if it's a function, call it
				arguments[i](this.prototype);
			} else {
				// add the interface using the extend method
				this.prototype.extend(arguments[i]);
			}
		}
		return this;
	},
	
	toString: function() {
		return String(this.valueOf());
	}
});;/**
 * Detect browser support for specific features
 */
wysihtml5.browser = (function() {
  var userAgent   = navigator.userAgent,
      testElement = document.createElement("div"),
      // Browser sniffing is unfortunately needed since some behaviors are impossible to feature detect
      isGecko     = userAgent.indexOf("Gecko")        !== -1 && userAgent.indexOf("KHTML") === -1,
      isWebKit    = userAgent.indexOf("AppleWebKit/") !== -1,
      isChrome    = userAgent.indexOf("Chrome/")      !== -1,
      isOpera     = userAgent.indexOf("Opera/")       !== -1;

  function iosVersion(userAgent) {
    return +((/ipad|iphone|ipod/.test(userAgent) && userAgent.match(/ os (\d+).+? like mac os x/)) || [undefined, 0])[1];
  }

  function androidVersion(userAgent) {
    return +(userAgent.match(/android (\d+)/) || [undefined, 0])[1];
  }

  function isIE(version, equation) {
    var rv = -1,
        re;

    if (navigator.appName == 'Microsoft Internet Explorer') {
      re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    } else if (navigator.appName == 'Netscape') {
      re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
    }

    if (re && re.exec(navigator.userAgent) != null) {
      rv = parseFloat(RegExp.$1);
    }

    if (rv === -1) { return false; }
    if (!version) { return true; }
    if (!equation) { return version === rv; }
    if (equation === "<") { return version < rv; }
    if (equation === ">") { return version > rv; }
    if (equation === "<=") { return version <= rv; }
    if (equation === ">=") { return version >= rv; }
  }

  return {
    // Static variable needed, publicly accessible, to be able override it in unit tests
    USER_AGENT: userAgent,

    /**
     * Exclude browsers that are not capable of displaying and handling
     * contentEditable as desired:
     *    - iPhone, iPad (tested iOS 4.2.2) and Android (tested 2.2) refuse to make contentEditables focusable
     *    - IE < 8 create invalid markup and crash randomly from time to time
     *
     * @return {Boolean}
     */
    supported: function() {
      var userAgent                   = this.USER_AGENT.toLowerCase(),
          // Essential for making html elements editable
          hasContentEditableSupport   = "contentEditable" in testElement,
          // Following methods are needed in order to interact with the contentEditable area
          hasEditingApiSupport        = document.execCommand && document.queryCommandSupported && document.queryCommandState,
          // document selector apis are only supported by IE 8+, Safari 4+, Chrome and Firefox 3.5+
          hasQuerySelectorSupport     = document.querySelector && document.querySelectorAll,
          // contentEditable is unusable in mobile browsers (tested iOS 4.2.2, Android 2.2, Opera Mobile, WebOS 3.05)
          isIncompatibleMobileBrowser = (this.isIos() && iosVersion(userAgent) < 5) || (this.isAndroid() && androidVersion(userAgent) < 4) || userAgent.indexOf("opera mobi") !== -1 || userAgent.indexOf("hpwos/") !== -1;
      return hasContentEditableSupport
        && hasEditingApiSupport
        && hasQuerySelectorSupport
        && !isIncompatibleMobileBrowser;
    },

    isTouchDevice: function() {
      return this.supportsEvent("touchmove");
    },

    isIos: function() {
      return (/ipad|iphone|ipod/i).test(this.USER_AGENT);
    },

    isAndroid: function() {
      return this.USER_AGENT.indexOf("Android") !== -1;
    },

    /**
     * Whether the browser supports sandboxed iframes
     * Currently only IE 6+ offers such feature <iframe security="restricted">
     *
     * http://msdn.microsoft.com/en-us/library/ms534622(v=vs.85).aspx
     * http://blogs.msdn.com/b/ie/archive/2008/01/18/using-frames-more-securely.aspx
     *
     * HTML5 sandboxed iframes are still buggy and their DOM is not reachable from the outside (except when using postMessage)
     */
    supportsSandboxedIframes: function() {
      return isIE();
    },

    /**
     * IE6+7 throw a mixed content warning when the src of an iframe
     * is empty/unset or about:blank
     * window.querySelector is implemented as of IE8
     */
    throwsMixedContentWarningWhenIframeSrcIsEmpty: function() {
      return !("querySelector" in document);
    },

    /**
     * Whether the caret is correctly displayed in contentEditable elements
     * Firefox sometimes shows a huge caret in the beginning after focusing
     */
    displaysCaretInEmptyContentEditableCorrectly: function() {
      return isIE();
    },

    /**
     * Opera and IE are the only browsers who offer the css value
     * in the original unit, thx to the currentStyle object
     * All other browsers provide the computed style in px via window.getComputedStyle
     */
    hasCurrentStyleProperty: function() {
      return "currentStyle" in testElement;
    },

    /**
     * Whether the browser inserts a <br> when pressing enter in a contentEditable element
     */
    insertsLineBreaksOnReturn: function() {
      return isGecko;
    },

    supportsPlaceholderAttributeOn: function(element) {
      return "placeholder" in element;
    },

    supportsEvent: function(eventName) {
      return "on" + eventName in testElement || (function() {
        testElement.setAttribute("on" + eventName, "return;");
        return typeof(testElement["on" + eventName]) === "function";
      })();
    },

    /**
     * Opera doesn't correctly fire focus/blur events when clicking in- and outside of iframe
     */
    supportsEventsInIframeCorrectly: function() {
      return !isOpera;
    },

    /**
     * Everything below IE9 doesn't know how to treat HTML5 tags
     *
     * @param {Object} context The document object on which to check HTML5 support
     *
     * @example
     *    wysihtml5.browser.supportsHTML5Tags(document);
     */
    supportsHTML5Tags: function(context) {
      var element = context.createElement("div"),
          html5   = "<article>foo</article>";
      element.innerHTML = html5;
      return element.innerHTML.toLowerCase() === html5;
    },

    /**
     * Checks whether a document supports a certain queryCommand
     * In particular, Opera needs a reference to a document that has a contentEditable in it's dom tree
     * in oder to report correct results
     *
     * @param {Object} doc Document object on which to check for a query command
     * @param {String} command The query command to check for
     * @return {Boolean}
     *
     * @example
     *    wysihtml5.browser.supportsCommand(document, "bold");
     */
    supportsCommand: (function() {
      // Following commands are supported but contain bugs in some browsers
      var buggyCommands = {
        // formatBlock fails with some tags (eg. <blockquote>)
        "formatBlock":          isIE(10, "<="),
         // When inserting unordered or ordered lists in Firefox, Chrome or Safari, the current selection or line gets
         // converted into a list (<ul><li>...</li></ul>, <ol><li>...</li></ol>)
         // IE and Opera act a bit different here as they convert the entire content of the current block element into a list
        "insertUnorderedList":  isIE(9, ">="),
        "insertOrderedList":    isIE(9, ">=")
      };

      // Firefox throws errors for queryCommandSupported, so we have to build up our own object of supported commands
      var supported = {
        "insertHTML": isGecko
      };

      return function(doc, command) {
        var isBuggy = buggyCommands[command];
        if (!isBuggy) {
          // Firefox throws errors when invoking queryCommandSupported or queryCommandEnabled
          try {
            return doc.queryCommandSupported(command);
          } catch(e1) {}

          try {
            return doc.queryCommandEnabled(command);
          } catch(e2) {
            return !!supported[command];
          }
        }
        return false;
      };
    })(),

    /**
     * IE: URLs starting with:
     *    www., http://, https://, ftp://, gopher://, mailto:, new:, snews:, telnet:, wasis:, file://,
     *    nntp://, newsrc:, ldap://, ldaps://, outlook:, mic:// and url:
     * will automatically be auto-linked when either the user inserts them via copy&paste or presses the
     * space bar when the caret is directly after such an url.
     * This behavior cannot easily be avoided in IE < 9 since the logic is hardcoded in the mshtml.dll
     * (related blog post on msdn
     * http://blogs.msdn.com/b/ieinternals/archive/2009/09/17/prevent-automatic-hyperlinking-in-contenteditable-html.aspx).
     */
    doesAutoLinkingInContentEditable: function() {
      return isIE();
    },

    /**
     * As stated above, IE auto links urls typed into contentEditable elements
     * Since IE9 it's possible to prevent this behavior
     */
    canDisableAutoLinking: function() {
      return this.supportsCommand(document, "AutoUrlDetect");
    },

    /**
     * IE leaves an empty paragraph in the contentEditable element after clearing it
     * Chrome/Safari sometimes an empty <div>
     */
    clearsContentEditableCorrectly: function() {
      return isGecko || isOpera || isWebKit;
    },

    /**
     * IE gives wrong results for getAttribute
     */
    supportsGetAttributeCorrectly: function() {
      var td = document.createElement("td");
      return td.getAttribute("rowspan") != "1";
    },

    /**
     * When clicking on images in IE, Opera and Firefox, they are selected, which makes it easy to interact with them.
     * Chrome and Safari both don't support this
     */
    canSelectImagesInContentEditable: function() {
      return isGecko || isIE() || isOpera;
    },

    /**
     * All browsers except Safari and Chrome automatically scroll the range/caret position into view
     */
    autoScrollsToCaret: function() {
      return !isWebKit;
    },

    /**
     * Check whether the browser automatically closes tags that don't need to be opened
     */
    autoClosesUnclosedTags: function() {
      var clonedTestElement = testElement.cloneNode(false),
          returnValue,
          innerHTML;

      clonedTestElement.innerHTML = "<p><div></div>";
      innerHTML                   = clonedTestElement.innerHTML.toLowerCase();
      returnValue                 = innerHTML === "<p></p><div></div>" || innerHTML === "<p><div></div></p>";

      // Cache result by overwriting current function
      this.autoClosesUnclosedTags = function() { return returnValue; };

      return returnValue;
    },

    /**
     * Whether the browser supports the native document.getElementsByClassName which returns live NodeLists
     */
    supportsNativeGetElementsByClassName: function() {
      return String(document.getElementsByClassName).indexOf("[native code]") !== -1;
    },

    /**
     * As of now (19.04.2011) only supported by Firefox 4 and Chrome
     * See https://developer.mozilla.org/en/DOM/Selection/modify
     */
    supportsSelectionModify: function() {
      return "getSelection" in window && "modify" in window.getSelection();
    },

    /**
     * Opera needs a white space after a <br> in order to position the caret correctly
     */
    needsSpaceAfterLineBreak: function() {
      return isOpera;
    },

    /**
     * Whether the browser supports the speech api on the given element
     * See http://mikepultz.com/2011/03/accessing-google-speech-api-chrome-11/
     *
     * @example
     *    var input = document.createElement("input");
     *    if (wysihtml5.browser.supportsSpeechApiOn(input)) {
     *      // ...
     *    }
     */
    supportsSpeechApiOn: function(input) {
      var chromeVersion = userAgent.match(/Chrome\/(\d+)/) || [undefined, 0];
      return chromeVersion[1] >= 11 && ("onwebkitspeechchange" in input || "speech" in input);
    },

    /**
     * IE9 crashes when setting a getter via Object.defineProperty on XMLHttpRequest or XDomainRequest
     * See https://connect.microsoft.com/ie/feedback/details/650112
     * or try the POC http://tifftiff.de/ie9_crash/
     */
    crashesWhenDefineProperty: function(property) {
      return isIE(9) && (property === "XMLHttpRequest" || property === "XDomainRequest");
    },

    /**
     * IE is the only browser who fires the "focus" event not immediately when .focus() is called on an element
     */
    doesAsyncFocus: function() {
      return isIE();
    },

    /**
     * In IE it's impssible for the user and for the selection library to set the caret after an <img> when it's the lastChild in the document
     */
    hasProblemsSettingCaretAfterImg: function() {
      return isIE();
    },

    hasUndoInContextMenu: function() {
      return isGecko || isChrome || isOpera;
    },

    /**
     * Opera sometimes doesn't insert the node at the right position when range.insertNode(someNode)
     * is used (regardless if rangy or native)
     * This especially happens when the caret is positioned right after a <br> because then
     * insertNode() will insert the node right before the <br>
     */
    hasInsertNodeIssue: function() {
      return isOpera;
    },

    /**
     * IE 8+9 don't fire the focus event of the <body> when the iframe gets focused (even though the caret gets set into the <body>)
     */
    hasIframeFocusIssue: function() {
      return isIE();
    },

    /**
     * Chrome + Safari create invalid nested markup after paste
     *
     *  <p>
     *    foo
     *    <p>bar</p> <!-- BOO! -->
     *  </p>
     */
    createsNestedInvalidMarkupAfterPaste: function() {
      return isWebKit;
    },

    supportsMutationEvents: function() {
      return ("MutationEvent" in window);
    },

    /**
      IE (at least up to 11) does not support clipboardData on event.
      It is on window but cannot return text/html
      Should actually check for clipboardData on paste event, but cannot in firefox
    */
    supportsModernPaste: function () {
      return !("clipboardData" in window);
    },

    // Unifies the property names of element.style by returning the suitable property name for current browser
    // Input property key must be the standard
    fixStyleKey: function(key) {
      if (key === "cssFloat") {
        return ("styleFloat" in document.createElement("div").style) ? "styleFloat" : "cssFloat";
      }
      return key;
    }
  };
})();
;wysihtml5.lang.array = function(arr) {
  return {
    /**
     * Check whether a given object exists in an array
     *
     * @example
     *    wysihtml5.lang.array([1, 2]).contains(1);
     *    // => true
     *
     * Can be used to match array with array. If intersection is found true is returned
     */
    contains: function(needle) {
      if (Array.isArray(needle)) {
        for (var i = needle.length; i--;) {
          if (wysihtml5.lang.array(arr).indexOf(needle[i]) !== -1) {
            return true;
          }
        }
        return false;
      } else {
        return wysihtml5.lang.array(arr).indexOf(needle) !== -1;
      }
    },

    /**
     * Check whether a given object exists in an array and return index
     * If no elelemt found returns -1
     *
     * @example
     *    wysihtml5.lang.array([1, 2]).indexOf(2);
     *    // => 1
     */
    indexOf: function(needle) {
        if (arr.indexOf) {
          return arr.indexOf(needle);
        } else {
          for (var i=0, length=arr.length; i<length; i++) {
            if (arr[i] === needle) { return i; }
          }
          return -1;
        }
    },

    /**
     * Substract one array from another
     *
     * @example
     *    wysihtml5.lang.array([1, 2, 3, 4]).without([3, 4]);
     *    // => [1, 2]
     */
    without: function(arrayToSubstract) {
      arrayToSubstract = wysihtml5.lang.array(arrayToSubstract);
      var newArr  = [],
          i       = 0,
          length  = arr.length;
      for (; i<length; i++) {
        if (!arrayToSubstract.contains(arr[i])) {
          newArr.push(arr[i]);
        }
      }
      return newArr;
    },

    /**
     * Return a clean native array
     *
     * Following will convert a Live NodeList to a proper Array
     * @example
     *    var childNodes = wysihtml5.lang.array(document.body.childNodes).get();
     */
    get: function() {
      var i        = 0,
          length   = arr.length,
          newArray = [];
      for (; i<length; i++) {
        newArray.push(arr[i]);
      }
      return newArray;
    },

    /**
     * Creates a new array with the results of calling a provided function on every element in this array.
     * optionally this can be provided as second argument
     *
     * @example
     *    var childNodes = wysihtml5.lang.array([1,2,3,4]).map(function (value, index, array) {
            return value * 2;
     *    });
     *    // => [2,4,6,8]
     */
    map: function(callback, thisArg) {
      if (Array.prototype.map) {
        return arr.map(callback, thisArg);
      } else {
        var len = arr.length >>> 0,
            A = new Array(len),
            i = 0;
        for (; i < len; i++) {
           A[i] = callback.call(thisArg, arr[i], i, arr);
        }
        return A;
      }
    },

    /* ReturnS new array without duplicate entries
     *
     * @example
     *    var uniq = wysihtml5.lang.array([1,2,3,2,1,4]).unique();
     *    // => [1,2,3,4]
     */
    unique: function() {
      var vals = [],
          max = arr.length,
          idx = 0;

      while (idx < max) {
        if (!wysihtml5.lang.array(vals).contains(arr[idx])) {
          vals.push(arr[idx]);
        }
        idx++;
      }
      return vals;
    }

  };
};
;wysihtml5.lang.Dispatcher = Base.extend(
  /** @scope wysihtml5.lang.Dialog.prototype */ {
  on: function(eventName, handler) {
    this.events = this.events || {};
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(handler);
    return this;
  },

  off: function(eventName, handler) {
    this.events = this.events || {};
    var i = 0,
        handlers,
        newHandlers;
    if (eventName) {
      handlers    = this.events[eventName] || [],
      newHandlers = [];
      for (; i<handlers.length; i++) {
        if (handlers[i] !== handler && handler) {
          newHandlers.push(handlers[i]);
        }
      }
      this.events[eventName] = newHandlers;
    } else {
      // Clean up all events
      this.events = {};
    }
    return this;
  },

  fire: function(eventName, payload) {
    this.events = this.events || {};
    var handlers = this.events[eventName] || [],
        i        = 0;
    for (; i<handlers.length; i++) {
      handlers[i].call(this, payload);
    }
    return this;
  },

  // deprecated, use .on()
  observe: function() {
    return this.on.apply(this, arguments);
  },

  // deprecated, use .off()
  stopObserving: function() {
    return this.off.apply(this, arguments);
  }
});
;wysihtml5.lang.object = function(obj) {
  return {
    /**
     * @example
     *    wysihtml5.lang.object({ foo: 1, bar: 1 }).merge({ bar: 2, baz: 3 }).get();
     *    // => { foo: 1, bar: 2, baz: 3 }
     */
    merge: function(otherObj, deep) {
      for (var i in otherObj) {
        if (deep && wysihtml5.lang.object(otherObj[i]).isPlainObject() && (typeof obj[i] === "undefined" || wysihtml5.lang.object(obj[i]).isPlainObject())) {
          if (typeof obj[i] === "undefined") {
            obj[i] = wysihtml5.lang.object(otherObj[i]).clone(true);
          } else {
            wysihtml5.lang.object(obj[i]).merge(wysihtml5.lang.object(otherObj[i]).clone(true));
          }
        } else {
          obj[i] = wysihtml5.lang.object(otherObj[i]).isPlainObject() ? wysihtml5.lang.object(otherObj[i]).clone(true) : otherObj[i];
        }
      }
      return this;
    },

    difference: function (otherObj) {
      var diffObj = {};

      // Get old values not in comparing object
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (!otherObj.hasOwnProperty(i)) {
            diffObj[i] = obj[i];
          }
        }
      }

      // Get new and different values in comparing object
      for (var o in otherObj) {
        if (otherObj.hasOwnProperty(o)) {
          if (!obj.hasOwnProperty(o) || obj[o] !== otherObj[o]) {
            diffObj[0] = obj[0];
          }
        }
      }
      return diffObj;
    },

    get: function() {
      return obj;
    },

    /**
     * @example
     *    wysihtml5.lang.object({ foo: 1 }).clone();
     *    // => { foo: 1 }
     *
     *    v0.4.14 adds options for deep clone : wysihtml5.lang.object({ foo: 1 }).clone(true);
     */
    clone: function(deep) {
      var newObj = {},
          i;

      if (obj === null || !wysihtml5.lang.object(obj).isPlainObject()) {
        return obj;
      }

      for (i in obj) {
        if(obj.hasOwnProperty(i)) {
          if (deep) {
            newObj[i] = wysihtml5.lang.object(obj[i]).clone(deep);
          } else {
            newObj[i] = obj[i];
          }
        }
      }
      return newObj;
    },

    /**
     * @example
     *    wysihtml5.lang.object([]).isArray();
     *    // => true
     */
    isArray: function() {
      return Object.prototype.toString.call(obj) === "[object Array]";
    },

    /**
     * @example
     *    wysihtml5.lang.object(function() {}).isFunction();
     *    // => true
     */
    isFunction: function() {
      return Object.prototype.toString.call(obj) === '[object Function]';
    },

    isPlainObject: function () {
      return obj && Object.prototype.toString.call(obj) === '[object Object]' && !(("Node" in window) ? obj instanceof Node : obj instanceof Element || obj instanceof Text);
    },

    /**
     * @example
     *    wysihtml5.lang.object({}).isEmpty();
     *    // => true
     */
    isEmpty: function() {
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          return false;
        }
      }
      return true;
    }
  };
};
;(function() {
  var WHITE_SPACE_START = /^\s+/,
      WHITE_SPACE_END   = /\s+$/,
      ENTITY_REG_EXP    = /[&<>\t"]/g,
      ENTITY_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': "&quot;",
        '\t':"&nbsp; "
      };
  wysihtml5.lang.string = function(str) {
    str = String(str);
    return {
      /**
       * @example
       *    wysihtml5.lang.string("   foo   ").trim();
       *    // => "foo"
       */
      trim: function() {
        return str.replace(WHITE_SPACE_START, "").replace(WHITE_SPACE_END, "");
      },

      /**
       * @example
       *    wysihtml5.lang.string("Hello #{name}").interpolate({ name: "Christopher" });
       *    // => "Hello Christopher"
       */
      interpolate: function(vars) {
        for (var i in vars) {
          str = this.replace("#{" + i + "}").by(vars[i]);
        }
        return str;
      },

      /**
       * @example
       *    wysihtml5.lang.string("Hello Tom").replace("Tom").with("Hans");
       *    // => "Hello Hans"
       */
      replace: function(search) {
        return {
          by: function(replace) {
            return str.split(search).join(replace);
          }
        };
      },

      /**
       * @example
       *    wysihtml5.lang.string("hello<br>").escapeHTML();
       *    // => "hello&lt;br&gt;"
       */
      escapeHTML: function(linebreaks, convertSpaces) {
        var html = str.replace(ENTITY_REG_EXP, function(c) { return ENTITY_MAP[c]; });
        if (linebreaks) {
          html = html.replace(/(?:\r\n|\r|\n)/g, '<br />');
        }
        if (convertSpaces) {
          html = html.replace(/  /gi, "&nbsp; ");
        }
        return html;
      }
    };
  };
})();
;/**
 * Find urls in descendant text nodes of an element and auto-links them
 * Inspired by http://james.padolsey.com/javascript/find-and-replace-text-with-javascript/
 *
 * @param {Element} element Container element in which to search for urls
 *
 * @example
 *    <div id="text-container">Please click here: www.google.com</div>
 *    <script>wysihtml5.dom.autoLink(document.getElementById("text-container"));</script>
 */
(function(wysihtml5) {
  var /**
       * Don't auto-link urls that are contained in the following elements:
       */
      IGNORE_URLS_IN        = wysihtml5.lang.array(["CODE", "PRE", "A", "SCRIPT", "HEAD", "TITLE", "STYLE"]),
      /**
       * revision 1:
       *    /(\S+\.{1}[^\s\,\.\!]+)/g
       *
       * revision 2:
       *    /(\b(((https?|ftp):\/\/)|(www\.))[-A-Z0-9+&@#\/%?=~_|!:,.;\[\]]*[-A-Z0-9+&@#\/%=~_|])/gim
       *
       * put this in the beginning if you don't wan't to match within a word
       *    (^|[\>\(\{\[\s\>])
       */
      URL_REG_EXP           = /((https?:\/\/|www\.)[^\s<]{3,})/gi,
      TRAILING_CHAR_REG_EXP = /([^\w\/\-](,?))$/i,
      MAX_DISPLAY_LENGTH    = 100,
      BRACKETS              = { ")": "(", "]": "[", "}": "{" };

  function autoLink(element, ignoreInClasses) {
    if (_hasParentThatShouldBeIgnored(element, ignoreInClasses)) {
      return element;
    }

    if (element === element.ownerDocument.documentElement) {
      element = element.ownerDocument.body;
    }

    return _parseNode(element, ignoreInClasses);
  }

  /**
   * This is basically a rebuild of
   * the rails auto_link_urls text helper
   */
  function _convertUrlsToLinks(str) {
    return str.replace(URL_REG_EXP, function(match, url) {
      var punctuation = (url.match(TRAILING_CHAR_REG_EXP) || [])[1] || "",
          opening     = BRACKETS[punctuation];
      url = url.replace(TRAILING_CHAR_REG_EXP, "");

      if (url.split(opening).length > url.split(punctuation).length) {
        url = url + punctuation;
        punctuation = "";
      }
      var realUrl    = url,
          displayUrl = url;
      if (url.length > MAX_DISPLAY_LENGTH) {
        displayUrl = displayUrl.substr(0, MAX_DISPLAY_LENGTH) + "...";
      }
      // Add http prefix if necessary
      if (realUrl.substr(0, 4) === "www.") {
        realUrl = "http://" + realUrl;
      }

      return '<a href="' + realUrl + '">' + displayUrl + '</a>' + punctuation;
    });
  }

  /**
   * Creates or (if already cached) returns a temp element
   * for the given document object
   */
  function _getTempElement(context) {
    var tempElement = context._wysihtml5_tempElement;
    if (!tempElement) {
      tempElement = context._wysihtml5_tempElement = context.createElement("div");
    }
    return tempElement;
  }

  /**
   * Replaces the original text nodes with the newly auto-linked dom tree
   */
  function _wrapMatchesInNode(textNode) {
    var parentNode  = textNode.parentNode,
        nodeValue   = wysihtml5.lang.string(textNode.data).escapeHTML(),
        tempElement = _getTempElement(parentNode.ownerDocument);

    // We need to insert an empty/temporary <span /> to fix IE quirks
    // Elsewise IE would strip white space in the beginning
    tempElement.innerHTML = "<span></span>" + _convertUrlsToLinks(nodeValue);
    tempElement.removeChild(tempElement.firstChild);

    while (tempElement.firstChild) {
      // inserts tempElement.firstChild before textNode
      parentNode.insertBefore(tempElement.firstChild, textNode);
    }
    parentNode.removeChild(textNode);
  }

  function _hasParentThatShouldBeIgnored(node, ignoreInClasses) {
    var nodeName;
    while (node.parentNode) {
      node = node.parentNode;
      nodeName = node.nodeName;
      if (node.className && wysihtml5.lang.array(node.className.split(' ')).contains(ignoreInClasses)) {
        return true;
      }
      if (IGNORE_URLS_IN.contains(nodeName)) {
        return true;
      } else if (nodeName === "body") {
        return false;
      }
    }
    return false;
  }

  function _parseNode(element, ignoreInClasses) {
    if (IGNORE_URLS_IN.contains(element.nodeName)) {
      return;
    }

    if (element.className && wysihtml5.lang.array(element.className.split(' ')).contains(ignoreInClasses)) {
      return;
    }

    if (element.nodeType === wysihtml5.TEXT_NODE && element.data.match(URL_REG_EXP)) {
      _wrapMatchesInNode(element);
      return;
    }

    var childNodes        = wysihtml5.lang.array(element.childNodes).get(),
        childNodesLength  = childNodes.length,
        i                 = 0;

    for (; i<childNodesLength; i++) {
      _parseNode(childNodes[i], ignoreInClasses);
    }

    return element;
  }

  wysihtml5.dom.autoLink = autoLink;

  // Reveal url reg exp to the outside
  wysihtml5.dom.autoLink.URL_REG_EXP = URL_REG_EXP;
})(wysihtml5);
;(function(wysihtml5) {
  var api = wysihtml5.dom;

  api.addClass = function(element, className) {
    var classList = element.classList;
    if (classList) {
      return classList.add(className);
    }
    if (api.hasClass(element, className)) {
      return;
    }
    element.className += " " + className;
  };

  api.removeClass = function(element, className) {
    var classList = element.classList;
    if (classList) {
      return classList.remove(className);
    }

    element.className = element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), " ");
  };

  api.hasClass = function(element, className) {
    var classList = element.classList;
    if (classList) {
      return classList.contains(className);
    }

    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  };
})(wysihtml5);
;wysihtml5.dom.contains = (function() {
  var documentElement = document.documentElement;
  if (documentElement.contains) {
    return function(container, element) {
      if (element.nodeType !== wysihtml5.ELEMENT_NODE) {
        if (element.parentNode === container) {
          return true;
        }
        element = element.parentNode;
      }
      return container !== element && container.contains(element);
    };
  } else if (documentElement.compareDocumentPosition) {
    return function(container, element) {
      // https://developer.mozilla.org/en/DOM/Node.compareDocumentPosition
      return !!(container.compareDocumentPosition(element) & 16);
    };
  }
})();
;/**
 * Converts an HTML fragment/element into a unordered/ordered list
 *
 * @param {Element} element The element which should be turned into a list
 * @param {String} listType The list type in which to convert the tree (either "ul" or "ol")
 * @return {Element} The created list
 *
 * @example
 *    <!-- Assume the following dom: -->
 *    <span id="pseudo-list">
 *      eminem<br>
 *      dr. dre
 *      <div>50 Cent</div>
 *    </span>
 *
 *    <script>
 *      wysihtml5.dom.convertToList(document.getElementById("pseudo-list"), "ul");
 *    </script>
 *
 *    <!-- Will result in: -->
 *    <ul>
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ul>
 */
wysihtml5.dom.convertToList = (function() {
  function _createListItem(doc, list) {
    var listItem = doc.createElement("li");
    list.appendChild(listItem);
    return listItem;
  }

  function _createList(doc, type) {
    return doc.createElement(type);
  }

  function convertToList(element, listType, uneditableClass) {
    if (element.nodeName === "UL" || element.nodeName === "OL" || element.nodeName === "MENU") {
      // Already a list
      return element;
    }

    var doc               = element.ownerDocument,
        list              = _createList(doc, listType),
        lineBreaks        = element.querySelectorAll("br"),
        lineBreaksLength  = lineBreaks.length,
        childNodes,
        childNodesLength,
        childNode,
        lineBreak,
        parentNode,
        isBlockElement,
        isLineBreak,
        currentListItem,
        i;

    // First find <br> at the end of inline elements and move them behind them
    for (i=0; i<lineBreaksLength; i++) {
      lineBreak = lineBreaks[i];
      while ((parentNode = lineBreak.parentNode) && parentNode !== element && parentNode.lastChild === lineBreak) {
        if (wysihtml5.dom.getStyle("display").from(parentNode) === "block") {
          parentNode.removeChild(lineBreak);
          break;
        }
        wysihtml5.dom.insert(lineBreak).after(lineBreak.parentNode);
      }
    }

    childNodes        = wysihtml5.lang.array(element.childNodes).get();
    childNodesLength  = childNodes.length;

    for (i=0; i<childNodesLength; i++) {
      currentListItem   = currentListItem || _createListItem(doc, list);
      childNode         = childNodes[i];
      isBlockElement    = wysihtml5.dom.getStyle("display").from(childNode) === "block";
      isLineBreak       = childNode.nodeName === "BR";

      // consider uneditable as an inline element
      if (isBlockElement && (!uneditableClass || !wysihtml5.dom.hasClass(childNode, uneditableClass))) {
        // Append blockElement to current <li> if empty, otherwise create a new one
        currentListItem = currentListItem.firstChild ? _createListItem(doc, list) : currentListItem;
        currentListItem.appendChild(childNode);
        currentListItem = null;
        continue;
      }

      if (isLineBreak) {
        // Only create a new list item in the next iteration when the current one has already content
        currentListItem = currentListItem.firstChild ? null : currentListItem;
        continue;
      }

      currentListItem.appendChild(childNode);
    }

    if (childNodes.length === 0) {
      _createListItem(doc, list);
    }

    element.parentNode.replaceChild(list, element);
    return list;
  }

  return convertToList;
})();
;/**
 * Copy a set of attributes from one element to another
 *
 * @param {Array} attributesToCopy List of attributes which should be copied
 * @return {Object} Returns an object which offers the "from" method which can be invoked with the element where to
 *    copy the attributes from., this again returns an object which provides a method named "to" which can be invoked
 *    with the element where to copy the attributes to (see example)
 *
 * @example
 *    var textarea    = document.querySelector("textarea"),
 *        div         = document.querySelector("div[contenteditable=true]"),
 *        anotherDiv  = document.querySelector("div.preview");
 *    wysihtml5.dom.copyAttributes(["spellcheck", "value", "placeholder"]).from(textarea).to(div).andTo(anotherDiv);
 *
 */
wysihtml5.dom.copyAttributes = function(attributesToCopy) {
  return {
    from: function(elementToCopyFrom) {
      return {
        to: function(elementToCopyTo) {
          var attribute,
              i         = 0,
              length    = attributesToCopy.length;
          for (; i<length; i++) {
            attribute = attributesToCopy[i];
            if (typeof(elementToCopyFrom[attribute]) !== "undefined" && elementToCopyFrom[attribute] !== "") {
              elementToCopyTo[attribute] = elementToCopyFrom[attribute];
            }
          }
          return { andTo: arguments.callee };
        }
      };
    }
  };
};
;/**
 * Copy a set of styles from one element to another
 * Please note that this only works properly across browsers when the element from which to copy the styles
 * is in the dom
 *
 * Interesting article on how to copy styles
 *
 * @param {Array} stylesToCopy List of styles which should be copied
 * @return {Object} Returns an object which offers the "from" method which can be invoked with the element where to
 *    copy the styles from., this again returns an object which provides a method named "to" which can be invoked
 *    with the element where to copy the styles to (see example)
 *
 * @example
 *    var textarea    = document.querySelector("textarea"),
 *        div         = document.querySelector("div[contenteditable=true]"),
 *        anotherDiv  = document.querySelector("div.preview");
 *    wysihtml5.dom.copyStyles(["overflow-y", "width", "height"]).from(textarea).to(div).andTo(anotherDiv);
 *
 */
(function(dom) {

  /**
   * Mozilla, WebKit and Opera recalculate the computed width when box-sizing: boder-box; is set
   * So if an element has "width: 200px; -moz-box-sizing: border-box; border: 1px;" then
   * its computed css width will be 198px
   *
   * See https://bugzilla.mozilla.org/show_bug.cgi?id=520992
   */
  var BOX_SIZING_PROPERTIES = ["-webkit-box-sizing", "-moz-box-sizing", "-ms-box-sizing", "box-sizing"];

  var shouldIgnoreBoxSizingBorderBox = function(element) {
    if (hasBoxSizingBorderBox(element)) {
       return parseInt(dom.getStyle("width").from(element), 10) < element.offsetWidth;
    }
    return false;
  };

  var hasBoxSizingBorderBox = function(element) {
    var i       = 0,
        length  = BOX_SIZING_PROPERTIES.length;
    for (; i<length; i++) {
      if (dom.getStyle(BOX_SIZING_PROPERTIES[i]).from(element) === "border-box") {
        return BOX_SIZING_PROPERTIES[i];
      }
    }
  };

  dom.copyStyles = function(stylesToCopy) {
    return {
      from: function(element) {
        if (shouldIgnoreBoxSizingBorderBox(element)) {
          stylesToCopy = wysihtml5.lang.array(stylesToCopy).without(BOX_SIZING_PROPERTIES);
        }

        var cssText = "",
            length  = stylesToCopy.length,
            i       = 0,
            property;
        for (; i<length; i++) {
          property = stylesToCopy[i];
          cssText += property + ":" + dom.getStyle(property).from(element) + ";";
        }

        return {
          to: function(element) {
            dom.setStyles(cssText).on(element);
            return { andTo: arguments.callee };
          }
        };
      }
    };
  };
})(wysihtml5.dom);
;/**
 * Event Delegation
 *
 * @example
 *    wysihtml5.dom.delegate(document.body, "a", "click", function() {
 *      // foo
 *    });
 */
(function(wysihtml5) {
  wysihtml5.dom.delegate = function(container, selector, eventName, handler) {
    var callback = function(event) {
      var target = event.target,
          element = (target.nodeType === 3) ? target.parentNode : target, // IE has .contains only seeing elements not textnodes
          matches  = container.querySelectorAll(selector);

      for (var i = 0, max = matches.length; i < max; i++) {
        if (matches[i].contains(element)) {
          handler.call(matches[i], event);
        }
      }
    };

    container.addEventListener(eventName, callback, false);
    return {
      stop: function() {
        container.removeEventListener(eventName, callback, false);
      }
    };
  };
})(wysihtml5);
;// TODO: Refactor dom tree traversing here
(function(wysihtml5) {

  // Finds parents of a node, returning the outermost node first in Array
  // if contain node is given parents search is stopped at the container
  function parents(node, container) {
    var nodes = [node], n = node;

    // iterate parents while parent exists and it is not container element
    while((container && n && n !== container) || (!container && n)) {
      nodes.unshift(n);
      n = n.parentNode;
    }
    return nodes;
  }

  wysihtml5.dom.domNode = function(node) {
    var defaultNodeTypes = [wysihtml5.ELEMENT_NODE, wysihtml5.TEXT_NODE];

    return {

      is: {
        emptyTextNode: function(ignoreWhitespace) {
          var regx = ignoreWhitespace ? (/^\s*$/g) : (/^[\r\n]*$/g);
          return node.nodeType === wysihtml5.TEXT_NODE && (regx).test(node.data);
        },

        visible: function() {
          var isVisible = !(/^\s*$/g).test(wysihtml5.dom.getTextContent(node));

          if (!isVisible) {
            if (node.nodeType === 1 && node.querySelector('img, br, hr, object, embed, canvas, input, textarea')) {
              isVisible = true;
            }
          }
          return isVisible;
        }
      },

      // var node = wysihtml5.dom.domNode(element).prev({nodeTypes: [1,3], ignoreBlankTexts: true});
      prev: function(options) {
        var prevNode = node.previousSibling,
            types = (options && options.nodeTypes) ? options.nodeTypes : defaultNodeTypes;
        
        if (!prevNode) {
          return null;
        }

        if (
          (!wysihtml5.lang.array(types).contains(prevNode.nodeType)) || // nodeTypes check.
          (options && options.ignoreBlankTexts && wysihtml5.dom.domNode(prevNode).is.emptyTextNode(true)) // Blank text nodes bypassed if set
        ) {
          return wysihtml5.dom.domNode(prevNode).prev(options);
        }
        
        return prevNode;
      },

      // var node = wysihtml5.dom.domNode(element).next({nodeTypes: [1,3], ignoreBlankTexts: true});
      next: function(options) {
        var nextNode = node.nextSibling,
            types = (options && options.nodeTypes) ? options.nodeTypes : defaultNodeTypes;
        
        if (!nextNode) {
          return null;
        }

        if (
          (!wysihtml5.lang.array(types).contains(nextNode.nodeType)) || // nodeTypes check.
          (options && options.ignoreBlankTexts && wysihtml5.dom.domNode(nextNode).is.emptyTextNode(true)) // blank text nodes bypassed if set
        ) {
          return wysihtml5.dom.domNode(nextNode).next(options);
        }
        
        return nextNode;
      },

      // Finds the common acnestor container of two nodes
      // If container given stops search at the container
      // If no common ancestor found returns null
      // var node = wysihtml5.dom.domNode(element).commonAncestor(node2, container);
      commonAncestor: function(node2, container) {
        var parents1 = parents(node, container),
            parents2 = parents(node2, container);

        // Ensure we have found a common ancestor, which will be the first one if anything
        if (parents1[0] != parents2[0]) {
          return null;
        }

        // Traverse up the hierarchy of parents until we reach where they're no longer
        // the same. Then return previous which was the common ancestor.
        for (var i = 0; i < parents1.length; i++) {
          if (parents1[i] != parents2[i]) {
            return parents1[i - 1];
          }
        }

        return null;
      },

      // Traverses a node for last children and their chidren (including itself), and finds the last node that has no children.
      // Array of classes for forced last-leaves (ex: uneditable-container) can be defined (options = {leafClasses: [...]})
      // Useful for finding the actually visible element before cursor
      lastLeafNode: function(options) {
        var lastChild;

        // Returns non-element nodes
        if (node.nodeType !== 1) {
          return node;
        }

        // Returns if element is leaf
        lastChild = node.lastChild;
        if (!lastChild) {
          return node;
        }

        // Returns if element is of of options.leafClasses leaf
        if (options && options.leafClasses) {
          for (var i = options.leafClasses.length; i--;) {
            if (wysihtml5.dom.hasClass(node, options.leafClasses[i])) {
              return node;
            }
          }
        }

        return wysihtml5.dom.domNode(lastChild).lastLeafNode(options);
      },

      // Splits element at childnode and extracts the childNode out of the element context
      // Example:
      //   var node = wysihtml5.dom.domNode(node).escapeParent(parentNode);
      escapeParent: function(element, newWrapper) {
        var parent, split2, nodeWrap,
            curNode = node;
        
        // Stop if node is not a descendant of element
        if (!wysihtml5.dom.contains(element, node)) {
          throw new Error("Child is not a descendant of node.");
        }

        // Climb up the node tree untill node is reached
        do {
          // Get current parent of node
          parent = curNode.parentNode;

          // Move after nodes to new clone wrapper
          split2 = parent.cloneNode(false);
          while (parent.lastChild && parent.lastChild !== curNode) {
            split2.insertBefore(parent.lastChild, split2.firstChild);
          }

          // Move node up a level. If parent is not yet the container to escape, clone the parent around node, so inner nodes are escaped out too
          if (parent !== element) {
            nodeWrap = parent.cloneNode(false);
            nodeWrap.appendChild(curNode);
            curNode = nodeWrap;
          }
          parent.parentNode.insertBefore(curNode, parent.nextSibling);

          // Add after nodes (unless empty)
          if (split2.innerHTML !== '') {
            // if contents are empty insert without wrap
            if ((/^\s+$/).test(split2.innerHTML)) {
              while (split2.lastChild) {
                parent.parentNode.insertBefore(split2.lastChild, curNode.nextSibling);
              }
            } else {
              parent.parentNode.insertBefore(split2, curNode.nextSibling);
            }
          }

          // If the node left behind before the split (parent) is now empty then remove
          if (parent.innerHTML === '') {
            parent.parentNode.removeChild(parent);
          } else if ((/^\s+$/).test(parent.innerHTML)) {
            while (parent.firstChild) {
              parent.parentNode.insertBefore(parent.firstChild, parent);
            }
            parent.parentNode.removeChild(parent);
          }

        } while (parent && parent !== element);

        if (newWrapper && curNode) {
          curNode.parentNode.insertBefore(newWrapper, curNode);
          newWrapper.appendChild(curNode);
        }
      },

      /*
        Tests a node against properties, and returns true if matches.
        Tests on principle that all properties defined must have at least one match.
        styleValue parameter works in context of styleProperty and has no effect otherwise.
        Returns true if element matches and false if it does not.
        
        Properties for filtering element:
        {
          query: selector string,
          nodeName: string (uppercase),
          className: string,
          classRegExp: regex,
          styleProperty: string or [],
          styleValue: string, [] or regex
        }

        Example:
        var node = wysihtml5.dom.domNode(element).test({})
      */
      test: function(properties) {
        var prop;

        // retuern false if properties object is not defined
        if (!properties) {
          return false;
        }

        // Only element nodes can be tested for these properties
        if (node.nodeType !== 1) {
          return false;
        }

        if (properties.query) {
          if (!node.matches(properties.query)) {
            return false;
          }
        }

        if (properties.nodeName && node.nodeName !== properties.nodeName) {
          return false;
        }

        if (properties.className && !node.classList.contains(properties.className)) {
          return false;
        }

        // classRegExp check (useful for classname begins with logic)
        if (properties.classRegExp) {
          var matches = (node.className || "").match(properties.classRegExp) || [];
          if (matches.length === 0) {
            return false;
          }
        }

        // styleProperty check
        if (properties.styleProperty && properties.styleProperty.length > 0) {
          var hasOneStyle = false,
              styles = (Array.isArray(properties.styleProperty)) ? properties.styleProperty : [properties.styleProperty];
          for (var j = 0, maxStyleP = styles.length; j < maxStyleP; j++) {
            // Some old IE-s have different property name for cssFloat
            prop = wysihtml5.browser.fixStyleKey(styles[j]);
            if (node.style[prop]) {
              if (properties.styleValue) {
                // Style value as additional parameter
                if (properties.styleValue instanceof RegExp) {
                  // style value as Regexp
                  if (node.style[prop].trim().match(properties.styleValue).length > 0) {
                    hasOneStyle = true;
                    break;
                  }
                } else if (Array.isArray(properties.styleValue)) {
                  // style value as array
                  if (properties.styleValue.indexOf(node.style[prop].trim())) {
                    hasOneStyle = true;
                    break;
                  }
                } else {
                  // style value as string
                  if (properties.styleValue === node.style[prop].trim().replace(/, /g, ",")) {
                    hasOneStyle = true;
                    break;
                  }
                }
              } else {
                hasOneStyle = true;
                break;
              }
            }
            if (!hasOneStyle) {
              return false;
            }
          }
        }

        if (properties.attribute) {
          var attr = wysihtml5.dom.getAttributes(node),
              attrList = [],
              hasOneAttribute = false;

          if (Array.isArray(properties.attribute)) {
            attrList = properties.attribute;
          } else {
            attrList[properties.attribute] = properties.attributeValue;
          }

          for (var a in attrList) {
            if (attrList.hasOwnProperty(a)) {
              if (typeof attrList[a] === "undefined") {
                if (typeof attr[a] !== "undefined") {
                  hasOneAttribute = true;
                  break;
                }
              } else if (attr[a] === attrList[a]) {
                hasOneAttribute = true;
                break;
              }
            }
          }

          if (!hasOneAttribute) {
            return false;
          }

        }

        return true;
      }

    };
  };
})(wysihtml5);
;/**
 * Returns the given html wrapped in a div element
 *
 * Fixing IE's inability to treat unknown elements (HTML5 section, article, ...) correctly
 * when inserted via innerHTML
 *
 * @param {String} html The html which should be wrapped in a dom element
 * @param {Obejct} [context] Document object of the context the html belongs to
 *
 * @example
 *    wysihtml5.dom.getAsDom("<article>foo</article>");
 */
wysihtml5.dom.getAsDom = (function() {

  var _innerHTMLShiv = function(html, context) {
    var tempElement = context.createElement("div");
    tempElement.style.display = "none";
    context.body.appendChild(tempElement);
    // IE throws an exception when trying to insert <frameset></frameset> via innerHTML
    try { tempElement.innerHTML = html; } catch(e) {}
    context.body.removeChild(tempElement);
    return tempElement;
  };

  /**
   * Make sure IE supports HTML5 tags, which is accomplished by simply creating one instance of each element
   */
  var _ensureHTML5Compatibility = function(context) {
    if (context._wysihtml5_supportsHTML5Tags) {
      return;
    }
    for (var i=0, length=HTML5_ELEMENTS.length; i<length; i++) {
      context.createElement(HTML5_ELEMENTS[i]);
    }
    context._wysihtml5_supportsHTML5Tags = true;
  };


  /**
   * List of html5 tags
   * taken from http://simon.html5.org/html5-elements
   */
  var HTML5_ELEMENTS = [
    "abbr", "article", "aside", "audio", "bdi", "canvas", "command", "datalist", "details", "figcaption",
    "figure", "footer", "header", "hgroup", "keygen", "mark", "meter", "nav", "output", "progress",
    "rp", "rt", "ruby", "svg", "section", "source", "summary", "time", "track", "video", "wbr"
  ];

  return function(html, context) {
    context = context || document;
    var tempElement;
    if (typeof(html) === "object" && html.nodeType) {
      tempElement = context.createElement("div");
      tempElement.appendChild(html);
    } else if (wysihtml5.browser.supportsHTML5Tags(context)) {
      tempElement = context.createElement("div");
      tempElement.innerHTML = html;
    } else {
      _ensureHTML5Compatibility(context);
      tempElement = _innerHTMLShiv(html, context);
    }
    return tempElement;
  };
})();
;/**
 * Walks the dom tree from the given node up until it finds a match
 *
 * @param {Element} node The from which to check the parent nodes
 * @param {Object} matchingSet Object to match against, Properties for filtering element:
 *   {
 *     query: selector string,
 *     classRegExp: regex,
 *     styleProperty: string or [],
 *     styleValue: string, [] or regex
 *   }
 * @param {Number} [levels] How many parents should the function check up from the current node (defaults to 50)
 * @param {Element} Optional, defines the container that limits the search
 *
 * @return {null|Element} Returns the first element that matched the desiredNodeName(s)
*/

wysihtml5.dom.getParentElement = (function() {

  return function(node, properties, levels, container) {
    levels = levels || 50;
    while (levels-- && node && node.nodeName !== "BODY" && (!container || node !== container)) {
      if (wysihtml5.dom.domNode(node).test(properties)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  };

})();
;/**
 * Get element's style for a specific css property
 *
 * @param {Element} element The element on which to retrieve the style
 * @param {String} property The CSS property to retrieve ("float", "display", "text-align", ...)
 *
 * @example
 *    wysihtml5.dom.getStyle("display").from(document.body);
 *    // => "block"
 */
wysihtml5.dom.getStyle = (function() {
  var stylePropertyMapping = {
        "float": ("styleFloat" in document.createElement("div").style) ? "styleFloat" : "cssFloat"
      },
      REG_EXP_CAMELIZE = /\-[a-z]/g;

  function camelize(str) {
    return str.replace(REG_EXP_CAMELIZE, function(match) {
      return match.charAt(1).toUpperCase();
    });
  }

  return function(property) {
    return {
      from: function(element) {
        if (element.nodeType !== wysihtml5.ELEMENT_NODE) {
          return;
        }

        var doc               = element.ownerDocument,
            camelizedProperty = stylePropertyMapping[property] || camelize(property),
            style             = element.style,
            currentStyle      = element.currentStyle,
            styleValue        = style[camelizedProperty];
        if (styleValue) {
          return styleValue;
        }

        // currentStyle is no standard and only supported by Opera and IE but it has one important advantage over the standard-compliant
        // window.getComputedStyle, since it returns css property values in their original unit:
        // If you set an elements width to "50%", window.getComputedStyle will give you it's current width in px while currentStyle
        // gives you the original "50%".
        // Opera supports both, currentStyle and window.getComputedStyle, that's why checking for currentStyle should have higher prio
        if (currentStyle) {
          try {
            return currentStyle[camelizedProperty];
          } catch(e) {
            //ie will occasionally fail for unknown reasons. swallowing exception
          }
        }

        var win                 = doc.defaultView || doc.parentWindow,
            needsOverflowReset  = (property === "height" || property === "width") && element.nodeName === "TEXTAREA",
            originalOverflow,
            returnValue;

        if (win.getComputedStyle) {
          // Chrome and Safari both calculate a wrong width and height for textareas when they have scroll bars
          // therfore we remove and restore the scrollbar and calculate the value in between
          if (needsOverflowReset) {
            originalOverflow = style.overflow;
            style.overflow = "hidden";
          }
          returnValue = win.getComputedStyle(element, null).getPropertyValue(property);
          if (needsOverflowReset) {
            style.overflow = originalOverflow || "";
          }
          return returnValue;
        }
      }
    };
  };
})();
;wysihtml5.dom.getTextNodes = function(node, ingoreEmpty){
  var all = [];
  for (node=node.firstChild;node;node=node.nextSibling){
    if (node.nodeType == 3) {
      if (!ingoreEmpty || !(/^\s*$/).test(node.innerText || node.textContent)) {
        all.push(node);
      }
    } else {
      all = all.concat(wysihtml5.dom.getTextNodes(node, ingoreEmpty));
    }
  }
  return all;
};
;/**
 * High performant way to check whether an element with a specific tag name is in the given document
 * Optimized for being heavily executed
 * Unleashes the power of live node lists
 *
 * @param {Object} doc The document object of the context where to check
 * @param {String} tagName Upper cased tag name
 * @example
 *    wysihtml5.dom.hasElementWithTagName(document, "IMG");
 */
wysihtml5.dom.hasElementWithTagName = (function() {
  var LIVE_CACHE          = {},
      DOCUMENT_IDENTIFIER = 1;

  function _getDocumentIdentifier(doc) {
    return doc._wysihtml5_identifier || (doc._wysihtml5_identifier = DOCUMENT_IDENTIFIER++);
  }

  return function(doc, tagName) {
    var key         = _getDocumentIdentifier(doc) + ":" + tagName,
        cacheEntry  = LIVE_CACHE[key];
    if (!cacheEntry) {
      cacheEntry = LIVE_CACHE[key] = doc.getElementsByTagName(tagName);
    }

    return cacheEntry.length > 0;
  };
})();
;/**
 * High performant way to check whether an element with a specific class name is in the given document
 * Optimized for being heavily executed
 * Unleashes the power of live node lists
 *
 * @param {Object} doc The document object of the context where to check
 * @param {String} tagName Upper cased tag name
 * @example
 *    wysihtml5.dom.hasElementWithClassName(document, "foobar");
 */
(function(wysihtml5) {
  var LIVE_CACHE          = {},
      DOCUMENT_IDENTIFIER = 1;

  function _getDocumentIdentifier(doc) {
    return doc._wysihtml5_identifier || (doc._wysihtml5_identifier = DOCUMENT_IDENTIFIER++);
  }

  wysihtml5.dom.hasElementWithClassName = function(doc, className) {
    // getElementsByClassName is not supported by IE<9
    // but is sometimes mocked via library code (which then doesn't return live node lists)
    if (!wysihtml5.browser.supportsNativeGetElementsByClassName()) {
      return !!doc.querySelector("." + className);
    }

    var key         = _getDocumentIdentifier(doc) + ":" + className,
        cacheEntry  = LIVE_CACHE[key];
    if (!cacheEntry) {
      cacheEntry = LIVE_CACHE[key] = doc.getElementsByClassName(className);
    }

    return cacheEntry.length > 0;
  };
})(wysihtml5);
;wysihtml5.dom.insert = function(elementToInsert) {
  return {
    after: function(element) {
      element.parentNode.insertBefore(elementToInsert, element.nextSibling);
    },

    before: function(element) {
      element.parentNode.insertBefore(elementToInsert, element);
    },

    into: function(element) {
      element.appendChild(elementToInsert);
    }
  };
};
;wysihtml5.dom.insertCSS = function(rules) {
  rules = rules.join("\n");

  return {
    into: function(doc) {
      var styleElement = doc.createElement("style");
      styleElement.type = "text/css";

      if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = rules;
      } else {
        styleElement.appendChild(doc.createTextNode(rules));
      }

      var link = doc.querySelector("head link");
      if (link) {
        link.parentNode.insertBefore(styleElement, link);
        return;
      } else {
        var head = doc.querySelector("head");
        if (head) {
          head.appendChild(styleElement);
        }
      }
    }
  };
};
;// TODO: Refactor dom tree traversing here
(function(wysihtml5) {
  wysihtml5.dom.lineBreaks = function(node) {

    function _isLineBreak(n) {
      return n.nodeName === "BR";
    }

    /**
     * Checks whether the elment causes a visual line break
     * (<br> or block elements)
     */
    function _isLineBreakOrBlockElement(element) {
      if (_isLineBreak(element)) {
        return true;
      }

      if (wysihtml5.dom.getStyle("display").from(element) === "block") {
        return true;
      }

      return false;
    }

    return {

      /* wysihtml5.dom.lineBreaks(element).add();
       *
       * Adds line breaks before and after the given node if the previous and next siblings
       * aren't already causing a visual line break (block element or <br>)
       */
      add: function(options) {
        var doc             = node.ownerDocument,
          nextSibling     = wysihtml5.dom.domNode(node).next({ignoreBlankTexts: true}),
          previousSibling = wysihtml5.dom.domNode(node).prev({ignoreBlankTexts: true});

        if (nextSibling && !_isLineBreakOrBlockElement(nextSibling)) {
          wysihtml5.dom.insert(doc.createElement("br")).after(node);
        }
        if (previousSibling && !_isLineBreakOrBlockElement(previousSibling)) {
          wysihtml5.dom.insert(doc.createElement("br")).before(node);
        }
      },

      /* wysihtml5.dom.lineBreaks(element).remove();
       *
       * Removes line breaks before and after the given node
       */
      remove: function(options) {
        var nextSibling     = wysihtml5.dom.domNode(node).next({ignoreBlankTexts: true}),
            previousSibling = wysihtml5.dom.domNode(node).prev({ignoreBlankTexts: true});

        if (nextSibling && _isLineBreak(nextSibling)) {
          nextSibling.parentNode.removeChild(nextSibling);
        }
        if (previousSibling && _isLineBreak(previousSibling)) {
          previousSibling.parentNode.removeChild(previousSibling);
        }
      }
    };
  };
})(wysihtml5);;/**
 * Method to set dom events
 *
 * @example
 *    wysihtml5.dom.observe(iframe.contentWindow.document.body, ["focus", "blur"], function() { ... });
 */
wysihtml5.dom.observe = function(element, eventNames, handler) {
  eventNames = typeof(eventNames) === "string" ? [eventNames] : eventNames;

  var handlerWrapper,
      eventName,
      i       = 0,
      length  = eventNames.length;

  for (; i<length; i++) {
    eventName = eventNames[i];
    if (element.addEventListener) {
      element.addEventListener(eventName, handler, false);
    } else {
      handlerWrapper = function(event) {
        if (!("target" in event)) {
          event.target = event.srcElement;
        }
        event.preventDefault = event.preventDefault || function() {
          this.returnValue = false;
        };
        event.stopPropagation = event.stopPropagation || function() {
          this.cancelBubble = true;
        };
        handler.call(element, event);
      };
      element.attachEvent("on" + eventName, handlerWrapper);
    }
  }

  return {
    stop: function() {
      var eventName,
          i       = 0,
          length  = eventNames.length;
      for (; i<length; i++) {
        eventName = eventNames[i];
        if (element.removeEventListener) {
          element.removeEventListener(eventName, handler, false);
        } else {
          element.detachEvent("on" + eventName, handlerWrapper);
        }
      }
    }
  };
};
;/**
 * HTML Sanitizer
 * Rewrites the HTML based on given rules
 *
 * @param {Element|String} elementOrHtml HTML String to be sanitized OR element whose content should be sanitized
 * @param {Object} [rules] List of rules for rewriting the HTML, if there's no rule for an element it will
 *    be converted to a "span". Each rule is a key/value pair where key is the tag to convert, and value the
 *    desired substitution.
 * @param {Object} context Document object in which to parse the html, needed to sandbox the parsing
 *
 * @return {Element|String} Depends on the elementOrHtml parameter. When html then the sanitized html as string elsewise the element.
 *
 * @example
 *    var userHTML = '<div id="foo" onclick="alert(1);"><p><font color="red">foo</font><script>alert(1);</script></p></div>';
 *    wysihtml5.dom.parse(userHTML, {
 *      tags {
 *        p:      "div",      // Rename p tags to div tags
 *        font:   "span"      // Rename font tags to span tags
 *        div:    true,       // Keep them, also possible (same result when passing: "div" or true)
 *        script: undefined   // Remove script elements
 *      }
 *    });
 *    // => <div><div><span>foo bar</span></div></div>
 *
 *    var userHTML = '<table><tbody><tr><td>I'm a table!</td></tr></tbody></table>';
 *    wysihtml5.dom.parse(userHTML);
 *    // => '<span><span><span><span>I'm a table!</span></span></span></span>'
 *
 *    var userHTML = '<div>foobar<br>foobar</div>';
 *    wysihtml5.dom.parse(userHTML, {
 *      tags: {
 *        div: undefined,
 *        br:  true
 *      }
 *    });
 *    // => ''
 *
 *    var userHTML = '<div class="red">foo</div><div class="pink">bar</div>';
 *    wysihtml5.dom.parse(userHTML, {
 *      classes: {
 *        red:    1,
 *        green:  1
 *      },
 *      tags: {
 *        div: {
 *          rename_tag:     "p"
 *        }
 *      }
 *    });
 *    // => '<p class="red">foo</p><p>bar</p>'
 */

wysihtml5.dom.parse = function(elementOrHtml_current, config_current) {
  /* TODO: Currently escaped module pattern as otherwise folloowing default swill be shared among multiple editors.
   * Refactor whole code as this method while workind is kind of awkward too */

  /**
   * It's not possible to use a XMLParser/DOMParser as HTML5 is not always well-formed XML
   * new DOMParser().parseFromString('<img src="foo.gif">') will cause a parseError since the
   * node isn't closed
   *
   * Therefore we've to use the browser's ordinary HTML parser invoked by setting innerHTML.
   */
  var NODE_TYPE_MAPPING = {
        "1": _handleElement,
        "3": _handleText,
        "8": _handleComment
      },
      // Rename unknown tags to this
      DEFAULT_NODE_NAME   = "span",
      WHITE_SPACE_REG_EXP = /\s+/,
      defaultRules        = { tags: {}, classes: {} },
      currentRules        = {},
      blockElements       = ["ADDRESS" ,"BLOCKQUOTE" ,"CENTER" ,"DIR" ,"DIV" ,"DL" ,"FIELDSET" ,
                             "FORM", "H1" ,"H2" ,"H3" ,"H4" ,"H5" ,"H6" ,"ISINDEX" ,"MENU",
                             "NOFRAMES", "NOSCRIPT" ,"OL" ,"P" ,"PRE","TABLE", "UL"];

  /**
   * Iterates over all childs of the element, recreates them, appends them into a document fragment
   * which later replaces the entire body content
   */
   function parse(elementOrHtml, config) {
    wysihtml5.lang.object(currentRules).merge(defaultRules).merge(config.rules).get();

    var context       = config.context || elementOrHtml.ownerDocument || document,
        fragment      = context.createDocumentFragment(),
        isString      = typeof(elementOrHtml) === "string",
        clearInternals = false,
        element,
        newNode,
        firstChild;

    if (config.clearInternals === true) {
      clearInternals = true;
    }

    if (isString) {
      element = wysihtml5.dom.getAsDom(elementOrHtml, context);
    } else {
      element = elementOrHtml;
    }

    if (currentRules.selectors) {
      _applySelectorRules(element, currentRules.selectors);
    }

    while (element.firstChild) {
      firstChild = element.firstChild;
      newNode = _convert(firstChild, config.cleanUp, clearInternals, config.uneditableClass);
      if (newNode) {
        fragment.appendChild(newNode);
      }
      if (firstChild !== newNode) {
        element.removeChild(firstChild);
      }
    }

    if (config.unjoinNbsps) {
      // replace joined non-breakable spaces with unjoined
      var txtnodes = wysihtml5.dom.getTextNodes(fragment);
      for (var n = txtnodes.length; n--;) {
        txtnodes[n].nodeValue = txtnodes[n].nodeValue.replace(/([\S\u00A0])\u00A0/gi, "$1 ");
      }
    }

    // Clear element contents
    element.innerHTML = "";

    // Insert new DOM tree
    element.appendChild(fragment);

    return isString ? wysihtml5.quirks.getCorrectInnerHTML(element) : element;
  }

  function _convert(oldNode, cleanUp, clearInternals, uneditableClass) {
    var oldNodeType     = oldNode.nodeType,
        oldChilds       = oldNode.childNodes,
        oldChildsLength = oldChilds.length,
        method          = NODE_TYPE_MAPPING[oldNodeType],
        i               = 0,
        fragment,
        newNode,
        newChild,
        nodeDisplay;

    // Passes directly elemets with uneditable class
    if (uneditableClass && oldNodeType === 1 && wysihtml5.dom.hasClass(oldNode, uneditableClass)) {
        return oldNode;
    }

    newNode = method && method(oldNode, clearInternals);

    // Remove or unwrap node in case of return value null or false
    if (!newNode) {
        if (newNode === false) {
            // false defines that tag should be removed but contents should remain (unwrap)
            fragment = oldNode.ownerDocument.createDocumentFragment();

            for (i = oldChildsLength; i--;) {
              if (oldChilds[i]) {
                newChild = _convert(oldChilds[i], cleanUp, clearInternals, uneditableClass);
                if (newChild) {
                  if (oldChilds[i] === newChild) {
                    i--;
                  }
                  fragment.insertBefore(newChild, fragment.firstChild);
                }
              }
            }

            nodeDisplay = wysihtml5.dom.getStyle("display").from(oldNode);

            if (nodeDisplay === '') {
              // Handle display style when element not in dom
              nodeDisplay = wysihtml5.lang.array(blockElements).contains(oldNode.tagName) ? "block" : "";
            }
            if (wysihtml5.lang.array(["block", "flex", "table"]).contains(nodeDisplay)) {
              fragment.appendChild(oldNode.ownerDocument.createElement("br"));
            }

            // TODO: try to minimize surplus spaces
            if (wysihtml5.lang.array([
                "div", "pre", "p",
                "table", "td", "th",
                "ul", "ol", "li",
                "dd", "dl",
                "footer", "header", "section",
                "h1", "h2", "h3", "h4", "h5", "h6"
            ]).contains(oldNode.nodeName.toLowerCase()) && oldNode.parentNode.lastChild !== oldNode) {
                // add space at first when unwraping non-textflow elements
                if (!oldNode.nextSibling || oldNode.nextSibling.nodeType !== 3 || !(/^\s/).test(oldNode.nextSibling.nodeValue)) {
                  fragment.appendChild(oldNode.ownerDocument.createTextNode(" "));
                }
            }

            if (fragment.normalize) {
              fragment.normalize();
            }
            return fragment;
        } else {
          // Remove
          return null;
        }
    }

    // Converts all childnodes
    for (i=0; i<oldChildsLength; i++) {
      if (oldChilds[i]) {
        newChild = _convert(oldChilds[i], cleanUp, clearInternals, uneditableClass);
        if (newChild) {
          if (oldChilds[i] === newChild) {
            i--;
          }
          newNode.appendChild(newChild);
        }
      }
    }

    // Cleanup senseless <span> elements
    if (cleanUp &&
        newNode.nodeName.toLowerCase() === DEFAULT_NODE_NAME &&
        (!newNode.childNodes.length ||
         ((/^\s*$/gi).test(newNode.innerHTML) && (clearInternals || (oldNode.className !== "_wysihtml5-temp-placeholder" && oldNode.className !== "rangySelectionBoundary"))) ||
         !newNode.attributes.length)
        ) {
      fragment = newNode.ownerDocument.createDocumentFragment();
      while (newNode.firstChild) {
        fragment.appendChild(newNode.firstChild);
      }
      if (fragment.normalize) {
        fragment.normalize();
      }
      return fragment;
    }

    if (newNode.normalize) {
      newNode.normalize();
    }
    return newNode;
  }

  function _applySelectorRules (element, selectorRules) {
    var sel, method, els;

    for (sel in selectorRules) {
      if (selectorRules.hasOwnProperty(sel)) {
        if (wysihtml5.lang.object(selectorRules[sel]).isFunction()) {
          method = selectorRules[sel];
        } else if (typeof(selectorRules[sel]) === "string" && elementHandlingMethods[selectorRules[sel]]) {
          method = elementHandlingMethods[selectorRules[sel]];
        }
        els = element.querySelectorAll(sel);
        for (var i = els.length; i--;) {
          method(els[i]);
        }
      }
    }
  }

  function _handleElement(oldNode, clearInternals) {
    var rule,
        newNode,
        tagRules    = currentRules.tags,
        nodeName    = oldNode.nodeName.toLowerCase(),
        scopeName   = oldNode.scopeName,
        renameTag;

    /**
     * We already parsed that element
     * ignore it! (yes, this sometimes happens in IE8 when the html is invalid)
     */
    if (oldNode._wysihtml5) {
      return null;
    }
    oldNode._wysihtml5 = 1;

    if (oldNode.className === "wysihtml5-temp") {
      return null;
    }

    /**
     * IE is the only browser who doesn't include the namespace in the
     * nodeName, that's why we have to prepend it by ourselves
     * scopeName is a proprietary IE feature
     * read more here http://msdn.microsoft.com/en-us/library/ms534388(v=vs.85).aspx
     */
    if (scopeName && scopeName != "HTML") {
      nodeName = scopeName + ":" + nodeName;
    }
    /**
     * Repair node
     * IE is a bit bitchy when it comes to invalid nested markup which includes unclosed tags
     * A <p> doesn't need to be closed according HTML4-5 spec, we simply replace it with a <div> to preserve its content and layout
     */
    if ("outerHTML" in oldNode) {
      if (!wysihtml5.browser.autoClosesUnclosedTags() &&
          oldNode.nodeName === "P" &&
          oldNode.outerHTML.slice(-4).toLowerCase() !== "</p>") {
        nodeName = "div";
      }
    }

    if (nodeName in tagRules) {
      rule = tagRules[nodeName];
      if (!rule || rule.remove) {
        return null;
      } else if (rule.unwrap) {
        return false;
      }
      rule = typeof(rule) === "string" ? { rename_tag: rule } : rule;
    } else if (oldNode.firstChild) {
      rule = { rename_tag: DEFAULT_NODE_NAME };
    } else {
      // Remove empty unknown elements
      return null;
    }

    // tests if type condition is met or node should be removed/unwrapped/renamed
    if (rule.one_of_type && !_testTypes(oldNode, currentRules, rule.one_of_type, clearInternals)) {
      if (rule.remove_action) {
        if (rule.remove_action === "unwrap") {
          return false;
        } else if (rule.remove_action === "rename") {
          renameTag = rule.remove_action_rename_to || DEFAULT_NODE_NAME;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    newNode = oldNode.ownerDocument.createElement(renameTag || rule.rename_tag || nodeName);
    _handleAttributes(oldNode, newNode, rule, clearInternals);
    _handleStyles(oldNode, newNode, rule);

    oldNode = null;

    if (newNode.normalize) { newNode.normalize(); }
    return newNode;
  }

  function _testTypes(oldNode, rules, types, clearInternals) {
    var definition, type;

    // do not interfere with placeholder span or pasting caret position is not maintained
    if (oldNode.nodeName === "SPAN" && !clearInternals && (oldNode.className === "_wysihtml5-temp-placeholder" || oldNode.className === "rangySelectionBoundary")) {
      return true;
    }

    for (type in types) {
      if (types.hasOwnProperty(type) && rules.type_definitions && rules.type_definitions[type]) {
        definition = rules.type_definitions[type];
        if (_testType(oldNode, definition)) {
          return true;
        }
      }
    }
    return false;
  }

  function array_contains(a, obj) {
      var i = a.length;
      while (i--) {
         if (a[i] === obj) {
             return true;
         }
      }
      return false;
  }

  function _testType(oldNode, definition) {

    var nodeClasses = oldNode.getAttribute("class"),
        nodeStyles =  oldNode.getAttribute("style"),
        classesLength, s, s_corrected, a, attr, currentClass, styleProp;

    // test for methods
    if (definition.methods) {
      for (var m in definition.methods) {
        if (definition.methods.hasOwnProperty(m) && typeCeckMethods[m]) {

          if (typeCeckMethods[m](oldNode)) {
            return true;
          }
        }
      }
    }

    // test for classes, if one found return true
    if (nodeClasses && definition.classes) {
      nodeClasses = nodeClasses.replace(/^\s+/g, '').replace(/\s+$/g, '').split(WHITE_SPACE_REG_EXP);
      classesLength = nodeClasses.length;
      for (var i = 0; i < classesLength; i++) {
        if (definition.classes[nodeClasses[i]]) {
          return true;
        }
      }
    }

    // test for styles, if one found return true
    if (nodeStyles && definition.styles) {

      nodeStyles = nodeStyles.split(';');
      for (s in definition.styles) {
        if (definition.styles.hasOwnProperty(s)) {
          for (var sp = nodeStyles.length; sp--;) {
            styleProp = nodeStyles[sp].split(':');

            if (styleProp[0].replace(/\s/g, '').toLowerCase() === s) {
              if (definition.styles[s] === true || definition.styles[s] === 1 || wysihtml5.lang.array(definition.styles[s]).contains(styleProp[1].replace(/\s/g, '').toLowerCase()) ) {
                return true;
              }
            }
          }
        }
      }
    }

    // test for attributes in general against regex match
    if (definition.attrs) {
        for (a in definition.attrs) {
            if (definition.attrs.hasOwnProperty(a)) {
                attr = wysihtml5.dom.getAttribute(oldNode, a);
                if (typeof(attr) === "string") {
                    if (attr.search(definition.attrs[a]) > -1) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
  }

  function _handleStyles(oldNode, newNode, rule) {
    var s, v;
    if(rule && rule.keep_styles) {
      for (s in rule.keep_styles) {
        if (rule.keep_styles.hasOwnProperty(s)) {
          v = (s === "float") ? oldNode.style.styleFloat || oldNode.style.cssFloat : oldNode.style[s];
          // value can be regex and if so should match or style skipped
          if (rule.keep_styles[s] instanceof RegExp && !(rule.keep_styles[s].test(v))) {
            continue;
          }
          if (s === "float") {
            // IE compability
            newNode.style[(oldNode.style.styleFloat) ? 'styleFloat': 'cssFloat'] = v;
           } else if (oldNode.style[s]) {
             newNode.style[s] = v;
           }
        }
      }
    }
  };

  function _getAttributesBeginningWith(beginning, attributes) {
    var returnAttributes = [];
    for (var attr in attributes) {
      if (attributes.hasOwnProperty(attr) && attr.indexOf(beginning) === 0) {
        returnAttributes.push(attr);
      }
    }
    return returnAttributes;
  }

  function _checkAttribute(attributeName, attributeValue, methodName, nodeName) {
    var method = wysihtml5.lang.object(methodName).isFunction() ? methodName : attributeCheckMethods[methodName],
        newAttributeValue;

    if (method) {
      newAttributeValue = method(attributeValue, nodeName);
      if (typeof(newAttributeValue) === "string") {
        return newAttributeValue;
      }
    }

    return false;
  }

  function _checkAttributes(oldNode, local_attributes) {
    var globalAttributes  = wysihtml5.lang.object(currentRules.attributes || {}).clone(), // global values for check/convert values of attributes
        checkAttributes   = wysihtml5.lang.object(globalAttributes).merge( wysihtml5.lang.object(local_attributes || {}).clone()).get(),
        attributes        = {},
        oldAttributes     = wysihtml5.dom.getAttributes(oldNode),
        attributeName, newValue, matchingAttributes;

    for (attributeName in checkAttributes) {
      if ((/\*$/).test(attributeName)) {

        matchingAttributes = _getAttributesBeginningWith(attributeName.slice(0,-1), oldAttributes);
        for (var i = 0, imax = matchingAttributes.length; i < imax; i++) {

          newValue = _checkAttribute(matchingAttributes[i], oldAttributes[matchingAttributes[i]], checkAttributes[attributeName], oldNode.nodeName);
          if (newValue !== false) {
            attributes[matchingAttributes[i]] = newValue;
          }
        }
      } else {
        newValue = _checkAttribute(attributeName, oldAttributes[attributeName], checkAttributes[attributeName], oldNode.nodeName);
        if (newValue !== false) {
          attributes[attributeName] = newValue;
        }
      }
    }

    return attributes;
  }

  // TODO: refactor. Too long to read
  function _handleAttributes(oldNode, newNode, rule, clearInternals) {
    var attributes          = {},                         // fresh new set of attributes to set on newNode
        setClass            = rule.set_class,             // classes to set
        addClass            = rule.add_class,             // add classes based on existing attributes
        addStyle            = rule.add_style,             // add styles based on existing attributes
        setAttributes       = rule.set_attributes,        // attributes to set on the current node
        allowedClasses      = currentRules.classes,
        i                   = 0,
        classes             = [],
        styles              = [],
        newClasses          = [],
        oldClasses          = [],
        classesLength,
        newClassesLength,
        currentClass,
        newClass,
        attributeName,
        method;

    if (setAttributes) {
      attributes = wysihtml5.lang.object(setAttributes).clone();
    }

    // check/convert values of attributes
    attributes = wysihtml5.lang.object(attributes).merge(_checkAttributes(oldNode,  rule.check_attributes)).get();

    if (setClass) {
      classes.push(setClass);
    }

    if (addClass) {
      for (attributeName in addClass) {
        method = addClassMethods[addClass[attributeName]];
        if (!method) {
          continue;
        }
        newClass = method(wysihtml5.dom.getAttribute(oldNode, attributeName));
        if (typeof(newClass) === "string") {
          classes.push(newClass);
        }
      }
    }

    if (addStyle) {
      for (attributeName in addStyle) {
        method = addStyleMethods[addStyle[attributeName]];
        if (!method) {
          continue;
        }

        newStyle = method(wysihtml5.dom.getAttribute(oldNode, attributeName));
        if (typeof(newStyle) === "string") {
          styles.push(newStyle);
        }
      }
    }


    if (typeof(allowedClasses) === "string" && allowedClasses === "any" && oldNode.getAttribute("class")) {
      if (currentRules.classes_blacklist) {
        oldClasses = oldNode.getAttribute("class");
        if (oldClasses) {
          classes = classes.concat(oldClasses.split(WHITE_SPACE_REG_EXP));
        }

        classesLength = classes.length;
        for (; i<classesLength; i++) {
          currentClass = classes[i];
          if (!currentRules.classes_blacklist[currentClass]) {
            newClasses.push(currentClass);
          }
        }

        if (newClasses.length) {
          attributes["class"] = wysihtml5.lang.array(newClasses).unique().join(" ");
        }

      } else {
        attributes["class"] = oldNode.getAttribute("class");
      }
    } else {
      // make sure that wysihtml5 temp class doesn't get stripped out
      if (!clearInternals) {
        allowedClasses["_wysihtml5-temp-placeholder"] = 1;
        allowedClasses["_rangySelectionBoundary"] = 1;
        allowedClasses["wysiwyg-tmp-selected-cell"] = 1;
      }

      // add old classes last
      oldClasses = oldNode.getAttribute("class");
      if (oldClasses) {
        classes = classes.concat(oldClasses.split(WHITE_SPACE_REG_EXP));
      }
      classesLength = classes.length;
      for (; i<classesLength; i++) {
        currentClass = classes[i];
        if (allowedClasses[currentClass]) {
          newClasses.push(currentClass);
        }
      }

      if (newClasses.length) {
        attributes["class"] = wysihtml5.lang.array(newClasses).unique().join(" ");
      }
    }

    // remove table selection class if present
    if (attributes["class"] && clearInternals) {
      attributes["class"] = attributes["class"].replace("wysiwyg-tmp-selected-cell", "");
      if ((/^\s*$/g).test(attributes["class"])) {
        delete attributes["class"];
      }
    }

    if (styles.length) {
      attributes["style"] = wysihtml5.lang.array(styles).unique().join(" ");
    }

    // set attributes on newNode
    for (attributeName in attributes) {
      // Setting attributes can cause a js error in IE under certain circumstances
      // eg. on a <img> under https when it's new attribute value is non-https
      // TODO: Investigate this further and check for smarter handling
      try {
        newNode.setAttribute(attributeName, attributes[attributeName]);
      } catch(e) {}
    }

    // IE8 sometimes loses the width/height attributes when those are set before the "src"
    // so we make sure to set them again
    if (attributes.src) {
      if (typeof(attributes.width) !== "undefined") {
        newNode.setAttribute("width", attributes.width);
      }
      if (typeof(attributes.height) !== "undefined") {
        newNode.setAttribute("height", attributes.height);
      }
    }
  }

  function _handleText(oldNode) {
    var nextSibling = oldNode.nextSibling;
    if (nextSibling && nextSibling.nodeType === wysihtml5.TEXT_NODE) {
      // Concatenate text nodes
      nextSibling.data = oldNode.data.replace(wysihtml5.INVISIBLE_SPACE_REG_EXP, "") + nextSibling.data.replace(wysihtml5.INVISIBLE_SPACE_REG_EXP, "");
    } else {
      // \uFEFF = wysihtml5.INVISIBLE_SPACE (used as a hack in certain rich text editing situations)
      var data = oldNode.data.replace(wysihtml5.INVISIBLE_SPACE_REG_EXP, "");
      return oldNode.ownerDocument.createTextNode(data);
    }
  }

  function _handleComment(oldNode) {
    if (currentRules.comments) {
      return oldNode.ownerDocument.createComment(oldNode.nodeValue);
    }
  }

  // ------------ attribute checks ------------ \\
  var attributeCheckMethods = {
    url: (function() {
      var REG_EXP = /^https?:\/\//i;
      return function(attributeValue) {
        if (!attributeValue || !attributeValue.match(REG_EXP)) {
          return null;
        }
        return attributeValue.replace(REG_EXP, function(match) {
          return match.toLowerCase();
        });
      };
    })(),

    src: (function() {
      var REG_EXP = /^(\/|https?:\/\/)/i;
      return function(attributeValue) {
        if (!attributeValue || !attributeValue.match(REG_EXP)) {
          return null;
        }
        return attributeValue.replace(REG_EXP, function(match) {
          return match.toLowerCase();
        });
      };
    })(),

    href: (function() {
      var REG_EXP = /^(#|\/|https?:\/\/|mailto:|tel:)/i;
      return function(attributeValue) {
        if (!attributeValue || !attributeValue.match(REG_EXP)) {
          return null;
        }
        return attributeValue.replace(REG_EXP, function(match) {
          return match.toLowerCase();
        });
      };
    })(),

    alt: (function() {
      var REG_EXP = /[^ a-z0-9_\-]/gi;
      return function(attributeValue, nodeName) {
        if (!attributeValue) {
          if (nodeName === "IMG") {
            return "";
          } else {
            return null;
          }
        }
        return attributeValue.replace(REG_EXP, "");
      };
    })(),

    // Integers. Does not work with floating point numbers and units
    numbers: (function() {
      var REG_EXP = /\D/g;
      return function(attributeValue) {
        attributeValue = (attributeValue || "").replace(REG_EXP, "");
        return attributeValue || null;
      };
    })(),

    // Useful for with/height attributes where floating points and percentages are allowed
    dimension: (function() {
      var REG_EXP = /\D*(\d+)(\.\d+)?\s?(%)?\D*/;
      return function(attributeValue) {
        attributeValue = (attributeValue || "").replace(REG_EXP, "$1$2$3");
        return attributeValue || null;
      };
    })(),

    any: (function() {
      return function(attributeValue) {
        if (!attributeValue) {
          return null;
        }
        return attributeValue;
      };
    })()
  };

  // ------------ style converter (converts an html attribute to a style) ------------ \\
  var addStyleMethods = {
    align_text: (function() {
      var mapping = {
        left:     "text-align: left;",
        right:    "text-align: right;",
        center:   "text-align: center;"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),
  };

  // ------------ class converter (converts an html attribute to a class name) ------------ \\
  var addClassMethods = {
    align_img: (function() {
      var mapping = {
        left:   "wysiwyg-float-left",
        right:  "wysiwyg-float-right"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),

    align_text: (function() {
      var mapping = {
        left:     "wysiwyg-text-align-left",
        right:    "wysiwyg-text-align-right",
        center:   "wysiwyg-text-align-center",
        justify:  "wysiwyg-text-align-justify"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),

    clear_br: (function() {
      var mapping = {
        left:   "wysiwyg-clear-left",
        right:  "wysiwyg-clear-right",
        both:   "wysiwyg-clear-both",
        all:    "wysiwyg-clear-both"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),

    size_font: (function() {
      var mapping = {
        "1": "wysiwyg-font-size-xx-small",
        "2": "wysiwyg-font-size-small",
        "3": "wysiwyg-font-size-medium",
        "4": "wysiwyg-font-size-large",
        "5": "wysiwyg-font-size-x-large",
        "6": "wysiwyg-font-size-xx-large",
        "7": "wysiwyg-font-size-xx-large",
        "-": "wysiwyg-font-size-smaller",
        "+": "wysiwyg-font-size-larger"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).charAt(0)];
      };
    })()
  };

  // checks if element is possibly visible
  var typeCeckMethods = {
    has_visible_contet: (function() {
      var txt,
          isVisible = false,
          visibleElements = ['img', 'video', 'picture', 'br', 'script', 'noscript',
                             'style', 'table', 'iframe', 'object', 'embed', 'audio',
                             'svg', 'input', 'button', 'select','textarea', 'canvas'];

      return function(el) {

        // has visible innertext. so is visible
        txt = (el.innerText || el.textContent).replace(/\s/g, '');
        if (txt && txt.length > 0) {
          return true;
        }

        // matches list of visible dimensioned elements
        for (var i = visibleElements.length; i--;) {
          if (el.querySelector(visibleElements[i])) {
            return true;
          }
        }

        // try to measure dimesions in last resort. (can find only of elements in dom)
        if (el.offsetWidth && el.offsetWidth > 0 && el.offsetHeight && el.offsetHeight > 0) {
          return true;
        }

        return false;
      };
    })()
  };

  var elementHandlingMethods = {
    unwrap: function (element) {
      wysihtml5.dom.unwrap(element);
    },

    remove: function (element) {
      element.parentNode.removeChild(element);
    }
  };

  return parse(elementOrHtml_current, config_current);
};
;/**
 * Checks for empty text node childs and removes them
 *
 * @param {Element} node The element in which to cleanup
 * @example
 *    wysihtml5.dom.removeEmptyTextNodes(element);
 */
wysihtml5.dom.removeEmptyTextNodes = function(node) {
  var childNode,
      childNodes        = wysihtml5.lang.array(node.childNodes).get(),
      childNodesLength  = childNodes.length,
      i                 = 0;

  for (; i<childNodesLength; i++) {
    childNode = childNodes[i];
    if (childNode.nodeType === wysihtml5.TEXT_NODE && (/^[\n\r]*$/).test(childNode.data)) {
      childNode.parentNode.removeChild(childNode);
    }
  }
};
;/**
 * Renames an element (eg. a <div> to a <p>) and keeps its childs
 *
 * @param {Element} element The list element which should be renamed
 * @param {Element} newNodeName The desired tag name
 *
 * @example
 *    <!-- Assume the following dom: -->
 *    <ul id="list">
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ul>
 *
 *    <script>
 *      wysihtml5.dom.renameElement(document.getElementById("list"), "ol");
 *    </script>
 *
 *    <!-- Will result in: -->
 *    <ol>
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ol>
 */
wysihtml5.dom.renameElement = function(element, newNodeName) {
  var newElement = element.ownerDocument.createElement(newNodeName),
      firstChild;
  while (firstChild = element.firstChild) {
    newElement.appendChild(firstChild);
  }
  wysihtml5.dom.copyAttributes(["align", "className"]).from(element).to(newElement);
  
  if (element.parentNode) {
    element.parentNode.replaceChild(newElement, element);
  }

  return newElement;
};
;/**
 * Takes an element, removes it and replaces it with it's childs
 *
 * @param {Object} node The node which to replace with it's child nodes
 * @example
 *    <div id="foo">
 *      <span>hello</span>
 *    </div>
 *    <script>
 *      // Remove #foo and replace with it's children
 *      wysihtml5.dom.replaceWithChildNodes(document.getElementById("foo"));
 *    </script>
 */
wysihtml5.dom.replaceWithChildNodes = function(node) {
  if (!node.parentNode) {
    return;
  }

  if (!node.firstChild) {
    node.parentNode.removeChild(node);
    return;
  }

  var fragment = node.ownerDocument.createDocumentFragment();
  while (node.firstChild) {
    fragment.appendChild(node.firstChild);
  }
  node.parentNode.replaceChild(fragment, node);
  node = fragment = null;
};
;/**
 * Unwraps an unordered/ordered list
 *
 * @param {Element} element The list element which should be unwrapped
 *
 * @example
 *    <!-- Assume the following dom: -->
 *    <ul id="list">
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ul>
 *
 *    <script>
 *      wysihtml5.dom.resolveList(document.getElementById("list"));
 *    </script>
 *
 *    <!-- Will result in: -->
 *    eminem<br>
 *    dr. dre<br>
 *    50 Cent<br>
 */
(function(dom) {
  function _isBlockElement(node) {
    return dom.getStyle("display").from(node) === "block";
  }

  function _isLineBreak(node) {
    return node.nodeName === "BR";
  }

  function _appendLineBreak(element) {
    var lineBreak = element.ownerDocument.createElement("br");
    element.appendChild(lineBreak);
  }

  function resolveList(list, useLineBreaks) {
    if (!list.nodeName.match(/^(MENU|UL|OL)$/)) {
      return;
    }

    var doc             = list.ownerDocument,
        fragment        = doc.createDocumentFragment(),
        previousSibling = wysihtml5.dom.domNode(list).prev({ignoreBlankTexts: true}),
        nextSibling = wysihtml5.dom.domNode(list).next({ignoreBlankTexts: true}),
        firstChild,
        lastChild,
        isLastChild,
        shouldAppendLineBreak,
        paragraph,
        listItem,
        lastListItem = list.lastElementChild || list.lastChild,
        isLastItem;

    if (useLineBreaks) {
      // Insert line break if list is after a non-block element
      if (previousSibling && !_isBlockElement(previousSibling) && !_isLineBreak(previousSibling)) {
        _appendLineBreak(fragment);
      }

      while (listItem = (list.firstElementChild || list.firstChild)) {
        lastChild = listItem.lastChild;
        isLastItem = listItem === lastListItem;
        while (firstChild = listItem.firstChild) {
          isLastChild           = firstChild === lastChild;
          // This needs to be done before appending it to the fragment, as it otherwise will lose style information
          shouldAppendLineBreak = (!isLastItem || (nextSibling && !_isBlockElement(nextSibling))) && isLastChild && !_isBlockElement(firstChild) && !_isLineBreak(firstChild);
          fragment.appendChild(firstChild);
          if (shouldAppendLineBreak) {
            _appendLineBreak(fragment);
          }
        }

        listItem.parentNode.removeChild(listItem);
      }
    } else {
      while (listItem = (list.firstElementChild || list.firstChild)) {
        if (listItem.querySelector && listItem.querySelector("div, p, ul, ol, menu, blockquote, h1, h2, h3, h4, h5, h6")) {
          while (firstChild = listItem.firstChild) {
            fragment.appendChild(firstChild);
          }
        } else {
          paragraph = doc.createElement("p");
          while (firstChild = listItem.firstChild) {
            paragraph.appendChild(firstChild);
          }
          fragment.appendChild(paragraph);
        }
        listItem.parentNode.removeChild(listItem);
      }
    }

    list.parentNode.replaceChild(fragment, list);
  }

  dom.resolveList = resolveList;
})(wysihtml5.dom);
;/**
 * Sandbox for executing javascript, parsing css styles and doing dom operations in a secure way
 *
 * Browser Compatibility:
 *  - Secure in MSIE 6+, but only when the user hasn't made changes to his security level "restricted"
 *  - Partially secure in other browsers (Firefox, Opera, Safari, Chrome, ...)
 *
 * Please note that this class can't benefit from the HTML5 sandbox attribute for the following reasons:
 *    - sandboxing doesn't work correctly with inlined content (src="javascript:'<html>...</html>'")
 *    - sandboxing of physical documents causes that the dom isn't accessible anymore from the outside (iframe.contentWindow, ...)
 *    - setting the "allow-same-origin" flag would fix that, but then still javascript and dom events refuse to fire
 *    - therefore the "allow-scripts" flag is needed, which then would deactivate any security, as the js executed inside the iframe
 *      can do anything as if the sandbox attribute wasn't set
 *
 * @param {Function} [readyCallback] Method that gets invoked when the sandbox is ready
 * @param {Object} [config] Optional parameters
 *
 * @example
 *    new wysihtml5.dom.Sandbox(function(sandbox) {
 *      sandbox.getWindow().document.body.innerHTML = '<img src=foo.gif onerror="alert(document.cookie)">';
 *    });
 */
(function(wysihtml5) {
  var /**
       * Default configuration
       */
      doc                 = document,
      /**
       * Properties to unset/protect on the window object
       */
      windowProperties    = [
        "parent", "top", "opener", "frameElement", "frames",
        "localStorage", "globalStorage", "sessionStorage", "indexedDB"
      ],
      /**
       * Properties on the window object which are set to an empty function
       */
      windowProperties2   = [
        "open", "close", "openDialog", "showModalDialog",
        "alert", "confirm", "prompt",
        "openDatabase", "postMessage",
        "XMLHttpRequest", "XDomainRequest"
      ],
      /**
       * Properties to unset/protect on the document object
       */
      documentProperties  = [
        "referrer",
        "write", "open", "close"
      ];

  wysihtml5.dom.Sandbox = Base.extend(
    /** @scope wysihtml5.dom.Sandbox.prototype */ {

    constructor: function(readyCallback, config) {
      this.callback = readyCallback || wysihtml5.EMPTY_FUNCTION;
      this.config   = wysihtml5.lang.object({}).merge(config).get();
      if (!this.config.className) {
        this.config.className = "wysihtml5-sandbox";
      }
      this.editableArea   = this._createIframe();
    },

    insertInto: function(element) {
      if (typeof(element) === "string") {
        element = doc.getElementById(element);
      }

      element.appendChild(this.editableArea);
    },

    getIframe: function() {
      return this.editableArea;
    },

    getWindow: function() {
      this._readyError();
    },

    getDocument: function() {
      this._readyError();
    },

    destroy: function() {
      var iframe = this.getIframe();
      iframe.parentNode.removeChild(iframe);
    },

    _readyError: function() {
      throw new Error("wysihtml5.Sandbox: Sandbox iframe isn't loaded yet");
    },

    /**
     * Creates the sandbox iframe
     *
     * Some important notes:
     *  - We can't use HTML5 sandbox for now:
     *    setting it causes that the iframe's dom can't be accessed from the outside
     *    Therefore we need to set the "allow-same-origin" flag which enables accessing the iframe's dom
     *    But then there's another problem, DOM events (focus, blur, change, keypress, ...) aren't fired.
     *    In order to make this happen we need to set the "allow-scripts" flag.
     *    A combination of allow-scripts and allow-same-origin is almost the same as setting no sandbox attribute at all.
     *  - Chrome & Safari, doesn't seem to support sandboxing correctly when the iframe's html is inlined (no physical document)
     *  - IE needs to have the security="restricted" attribute set before the iframe is
     *    inserted into the dom tree
     *  - Believe it or not but in IE "security" in document.createElement("iframe") is false, even
     *    though it supports it
     *  - When an iframe has security="restricted", in IE eval() & execScript() don't work anymore
     *  - IE doesn't fire the onload event when the content is inlined in the src attribute, therefore we rely
     *    on the onreadystatechange event
     */
    _createIframe: function() {
      var that   = this,
          iframe = doc.createElement("iframe");
      iframe.className = this.config.className;
      wysihtml5.dom.setAttributes({
        "security":           "restricted",
        "allowtransparency":  "true",
        "frameborder":        0,
        "width":              0,
        "height":             0,
        "marginwidth":        0,
        "marginheight":       0
      }).on(iframe);

      // Setting the src like this prevents ssl warnings in IE6
      if (wysihtml5.browser.throwsMixedContentWarningWhenIframeSrcIsEmpty()) {
        iframe.src = "javascript:'<html></html>'";
      }

      iframe.onload = function() {
        iframe.onreadystatechange = iframe.onload = null;
        that._onLoadIframe(iframe);
      };

      iframe.onreadystatechange = function() {
        if (/loaded|complete/.test(iframe.readyState)) {
          iframe.onreadystatechange = iframe.onload = null;
          that._onLoadIframe(iframe);
        }
      };

      return iframe;
    },

    /**
     * Callback for when the iframe has finished loading
     */
    _onLoadIframe: function(iframe) {
      // don't resume when the iframe got unloaded (eg. by removing it from the dom)
      if (!wysihtml5.dom.contains(doc.documentElement, iframe)) {
        return;
      }

      var that           = this,
          iframeWindow   = iframe.contentWindow,
          iframeDocument = iframe.contentWindow.document,
          charset        = doc.characterSet || doc.charset || "utf-8",
          sandboxHtml    = this._getHtml({
            charset:      charset,
            stylesheets:  this.config.stylesheets
          });

      // Create the basic dom tree including proper DOCTYPE and charset
      iframeDocument.open("text/html", "replace");
      iframeDocument.write(sandboxHtml);
      iframeDocument.close();

      this.getWindow = function() { return iframe.contentWindow; };
      this.getDocument = function() { return iframe.contentWindow.document; };

      // Catch js errors and pass them to the parent's onerror event
      // addEventListener("error") doesn't work properly in some browsers
      // TODO: apparently this doesn't work in IE9!
      iframeWindow.onerror = function(errorMessage, fileName, lineNumber) {
        throw new Error("wysihtml5.Sandbox: " + errorMessage, fileName, lineNumber);
      };

      if (!wysihtml5.browser.supportsSandboxedIframes()) {
        // Unset a bunch of sensitive variables
        // Please note: This isn't hack safe!
        // It more or less just takes care of basic attacks and prevents accidental theft of sensitive information
        // IE is secure though, which is the most important thing, since IE is the only browser, who
        // takes over scripts & styles into contentEditable elements when copied from external websites
        // or applications (Microsoft Word, ...)
        var i, length;
        for (i=0, length=windowProperties.length; i<length; i++) {
          this._unset(iframeWindow, windowProperties[i]);
        }
        for (i=0, length=windowProperties2.length; i<length; i++) {
          this._unset(iframeWindow, windowProperties2[i], wysihtml5.EMPTY_FUNCTION);
        }
        for (i=0, length=documentProperties.length; i<length; i++) {
          this._unset(iframeDocument, documentProperties[i]);
        }
        // This doesn't work in Safari 5
        // See http://stackoverflow.com/questions/992461/is-it-possible-to-override-document-cookie-in-webkit
        this._unset(iframeDocument, "cookie", "", true);
      }

      if (wysihtml5.polyfills) {
        wysihtml5.polyfills(iframeWindow, iframeDocument);
      }

      this.loaded = true;

      // Trigger the callback
      setTimeout(function() { that.callback(that); }, 0);
    },

    _getHtml: function(templateVars) {
      var stylesheets = templateVars.stylesheets,
          html        = "",
          i           = 0,
          length;
      stylesheets = typeof(stylesheets) === "string" ? [stylesheets] : stylesheets;
      if (stylesheets) {
        length = stylesheets.length;
        for (; i<length; i++) {
          html += '<link rel="stylesheet" href="' + stylesheets[i] + '">';
        }
      }
      templateVars.stylesheets = html;

      return wysihtml5.lang.string(
        '<!DOCTYPE html><html><head>'
        + '<meta charset="#{charset}">#{stylesheets}</head>'
        + '<body></body></html>'
      ).interpolate(templateVars);
    },

    /**
     * Method to unset/override existing variables
     * @example
     *    // Make cookie unreadable and unwritable
     *    this._unset(document, "cookie", "", true);
     */
    _unset: function(object, property, value, setter) {
      try { object[property] = value; } catch(e) {}

      try { object.__defineGetter__(property, function() { return value; }); } catch(e) {}
      if (setter) {
        try { object.__defineSetter__(property, function() {}); } catch(e) {}
      }

      if (!wysihtml5.browser.crashesWhenDefineProperty(property)) {
        try {
          var config = {
            get: function() { return value; }
          };
          if (setter) {
            config.set = function() {};
          }
          Object.defineProperty(object, property, config);
        } catch(e) {}
      }
    }
  });
})(wysihtml5);
;(function(wysihtml5) {
  var doc = document;
  wysihtml5.dom.ContentEditableArea = Base.extend({
      getContentEditable: function() {
        return this.element;
      },

      getWindow: function() {
        return this.element.ownerDocument.defaultView || this.element.ownerDocument.parentWindow;
      },

      getDocument: function() {
        return this.element.ownerDocument;
      },

      constructor: function(readyCallback, config, contentEditable) {
        this.callback = readyCallback || wysihtml5.EMPTY_FUNCTION;
        this.config   = wysihtml5.lang.object({}).merge(config).get();
        if (!this.config.className) {
          this.config.className = "wysihtml5-sandbox";
        }
        if (contentEditable) {
            this.element = this._bindElement(contentEditable);
        } else {
            this.element = this._createElement();
        }
      },

      destroy: function() {

      },

      // creates a new contenteditable and initiates it
      _createElement: function() {
        var element = doc.createElement("div");
        element.className = this.config.className;
        this._loadElement(element);
        return element;
      },

      // initiates an allready existent contenteditable
      _bindElement: function(contentEditable) {
        contentEditable.className = contentEditable.className ? contentEditable.className + " wysihtml5-sandbox" : "wysihtml5-sandbox";
        this._loadElement(contentEditable, true);
        return contentEditable;
      },

      _loadElement: function(element, contentExists) {
        var that = this;

        if (!contentExists) {
            var innerHtml = this._getHtml();
            element.innerHTML = innerHtml;
        }

        this.loaded = true;
        // Trigger the callback
        setTimeout(function() { that.callback(that); }, 0);
      },

      _getHtml: function(templateVars) {
        return '';
      }

  });
})(wysihtml5);
;(function() {
  var mapping = {
    "className": "class"
  };
  wysihtml5.dom.setAttributes = function(attributes) {
    return {
      on: function(element) {
        for (var i in attributes) {
          element.setAttribute(mapping[i] || i, attributes[i]);
        }
      }
    };
  };
})();
;wysihtml5.dom.setStyles = function(styles) {
  return {
    on: function(element) {
      var style = element.style;
      if (typeof(styles) === "string") {
        style.cssText += ";" + styles;
        return;
      }
      for (var i in styles) {
        if (i === "float") {
          style.cssFloat = styles[i];
          style.styleFloat = styles[i];
        } else {
          style[i] = styles[i];
        }
      }
    }
  };
};
;/**
 * Simulate HTML5 placeholder attribute
 *
 * Needed since
 *    - div[contentEditable] elements don't support it
 *    - older browsers (such as IE8 and Firefox 3.6) don't support it at all
 *
 * @param {Object} parent Instance of main wysihtml5.Editor class
 * @param {Element} view Instance of wysihtml5.views.* class
 * @param {String} placeholderText
 *
 * @example
 *    wysihtml.dom.simulatePlaceholder(this, composer, "Foobar");
 */
(function(dom) {
  dom.simulatePlaceholder = function(editor, view, placeholderText, placeholderClassName) {
    var CLASS_NAME = placeholderClassName || "wysihtml5-placeholder",
        unset = function() {
          var composerIsVisible   = view.element.offsetWidth > 0 && view.element.offsetHeight > 0;
          if (view.hasPlaceholderSet()) {
            view.clear();
            view.element.focus();
            if (composerIsVisible ) {
              setTimeout(function() {
                var sel = view.selection.getSelection();
                if (!sel.focusNode || !sel.anchorNode) {
                  view.selection.selectNode(view.element.firstChild || view.element);
                }
              }, 0);
            }
          }
          view.placeholderSet = false;
          dom.removeClass(view.element, CLASS_NAME);
        },
        set = function() {
          if (view.isEmpty() && !view.placeholderSet) {
            view.placeholderSet = true;
            view.setValue(placeholderText);
            dom.addClass(view.element, CLASS_NAME);
          }
        };

    editor
      .on("set_placeholder", set)
      .on("unset_placeholder", unset)
      .on("focus:composer", unset)
      .on("paste:composer", unset)
      .on("blur:composer", set);

    set();
  };
})(wysihtml5.dom);
;(function(dom) {
  var documentElement = document.documentElement;
  if ("textContent" in documentElement) {
    dom.setTextContent = function(element, text) {
      element.textContent = text;
    };

    dom.getTextContent = function(element) {
      return element.textContent;
    };
  } else if ("innerText" in documentElement) {
    dom.setTextContent = function(element, text) {
      element.innerText = text;
    };

    dom.getTextContent = function(element) {
      return element.innerText;
    };
  } else {
    dom.setTextContent = function(element, text) {
      element.nodeValue = text;
    };

    dom.getTextContent = function(element) {
      return element.nodeValue;
    };
  }
})(wysihtml5.dom);
;/**
 * Get a set of attribute from one element
 *
 * IE gives wrong results for hasAttribute/getAttribute, for example:
 *    var td = document.createElement("td");
 *    td.getAttribute("rowspan"); // => "1" in IE
 *
 * Therefore we have to check the element's outerHTML for the attribute
*/

wysihtml5.dom.getAttribute = function(node, attributeName) {
  var HAS_GET_ATTRIBUTE_BUG = !wysihtml5.browser.supportsGetAttributeCorrectly();
  attributeName = attributeName.toLowerCase();
  var nodeName = node.nodeName;
  if (nodeName == "IMG" && attributeName == "src" && wysihtml5.dom.isLoadedImage(node) === true) {
    // Get 'src' attribute value via object property since this will always contain the
    // full absolute url (http://...)
    // this fixes a very annoying bug in firefox (ver 3.6 & 4) and IE 8 where images copied from the same host
    // will have relative paths, which the sanitizer strips out (see attributeCheckMethods.url)
    return node.src;
  } else if (HAS_GET_ATTRIBUTE_BUG && "outerHTML" in node) {
    // Don't trust getAttribute/hasAttribute in IE 6-8, instead check the element's outerHTML
    var outerHTML      = node.outerHTML.toLowerCase(),
        // TODO: This might not work for attributes without value: <input disabled>
        hasAttribute   = outerHTML.indexOf(" " + attributeName +  "=") != -1;

    return hasAttribute ? node.getAttribute(attributeName) : null;
  } else{
    return node.getAttribute(attributeName);
  }
};
;/**
 * Get all attributes of an element
 *
 * IE gives wrong results for hasAttribute/getAttribute, for example:
 *    var td = document.createElement("td");
 *    td.getAttribute("rowspan"); // => "1" in IE
 *
 * Therefore we have to check the element's outerHTML for the attribute
*/

wysihtml5.dom.getAttributes = function(node) {
  var HAS_GET_ATTRIBUTE_BUG = !wysihtml5.browser.supportsGetAttributeCorrectly(),
      nodeName = node.nodeName,
      attributes = [],
      attr;

  for (attr in node.attributes) {
    if ((node.attributes.hasOwnProperty && node.attributes.hasOwnProperty(attr)) || (!node.attributes.hasOwnProperty && Object.prototype.hasOwnProperty.call(node.attributes, attr)))  {
      if (node.attributes[attr].specified) {
        if (nodeName == "IMG" && node.attributes[attr].name.toLowerCase() == "src" && wysihtml5.dom.isLoadedImage(node) === true) {
          attributes['src'] = node.src;
        } else if (wysihtml5.lang.array(['rowspan', 'colspan']).contains(node.attributes[attr].name.toLowerCase()) && HAS_GET_ATTRIBUTE_BUG) {
          if (node.attributes[attr].value !== 1) {
            attributes[node.attributes[attr].name] = node.attributes[attr].value;
          }
        } else {
          attributes[node.attributes[attr].name] = node.attributes[attr].value;
        }
      }
    }
  }
  return attributes;
};
;/**
   * Check whether the given node is a proper loaded image
   * FIXME: Returns undefined when unknown (Chrome, Safari)
*/

wysihtml5.dom.isLoadedImage = function (node) {
  try {
    return node.complete && !node.mozMatchesSelector(":-moz-broken");
  } catch(e) {
    if (node.complete && node.readyState === "complete") {
      return true;
    }
  }
};
;(function(wysihtml5) {

  var api = wysihtml5.dom;

  var MapCell = function(cell) {
    this.el = cell;
    this.isColspan= false;
    this.isRowspan= false;
    this.firstCol= true;
    this.lastCol= true;
    this.firstRow= true;
    this.lastRow= true;
    this.isReal= true;
    this.spanCollection= [];
    this.modified = false;
  };

  var TableModifyerByCell = function (cell, table) {
    if (cell) {
      this.cell = cell;
      this.table = api.getParentElement(cell, { query: "table" });
    } else if (table) {
      this.table = table;
      this.cell = this.table.querySelectorAll('th, td')[0];
    }
  };

  function queryInList(list, query) {
    var ret = [],
      q;
    for (var e = 0, len = list.length; e < len; e++) {
      q = list[e].querySelectorAll(query);
      if (q) {
        for(var i = q.length; i--; ret.unshift(q[i]));
      }
    }
    return ret;
  }

  function removeElement(el) {
    el.parentNode.removeChild(el);
  }

  function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  function nextNode(node, tag) {
    var element = node.nextSibling;
    while (element.nodeType !=1) {
      element = element.nextSibling;
      if (!tag || tag == element.tagName.toLowerCase()) {
        return element;
      }
    }
    return null;
  }

  TableModifyerByCell.prototype = {

    addSpannedCellToMap: function(cell, map, r, c, cspan, rspan) {
      var spanCollect = [],
        rmax = r + ((rspan) ? parseInt(rspan, 10) - 1 : 0),
        cmax = c + ((cspan) ? parseInt(cspan, 10) - 1 : 0);

      for (var rr = r; rr <= rmax; rr++) {
        if (typeof map[rr] == "undefined") { map[rr] = []; }
        for (var cc = c; cc <= cmax; cc++) {
          map[rr][cc] = new MapCell(cell);
          map[rr][cc].isColspan = (cspan && parseInt(cspan, 10) > 1);
          map[rr][cc].isRowspan = (rspan && parseInt(rspan, 10) > 1);
          map[rr][cc].firstCol = cc == c;
          map[rr][cc].lastCol = cc == cmax;
          map[rr][cc].firstRow = rr == r;
          map[rr][cc].lastRow = rr == rmax;
          map[rr][cc].isReal = cc == c && rr == r;
          map[rr][cc].spanCollection = spanCollect;

          spanCollect.push(map[rr][cc]);
        }
      }
    },

    setCellAsModified: function(cell) {
      cell.modified = true;
      if (cell.spanCollection.length > 0) {
        for (var s = 0, smax = cell.spanCollection.length; s < smax; s++) {
        cell.spanCollection[s].modified = true;
        }
      }
    },

    setTableMap: function() {
      var map = [];
      var tableRows = this.getTableRows(),
        ridx, row, cells, cidx, cell,
        c,
        cspan, rspan;

      for (ridx = 0; ridx < tableRows.length; ridx++) {
        row = tableRows[ridx];
        cells = this.getRowCells(row);
        c = 0;
        if (typeof map[ridx] == "undefined") { map[ridx] = []; }
        for (cidx = 0; cidx < cells.length; cidx++) {
          cell = cells[cidx];

          // If cell allready set means it is set by col or rowspan,
          // so increase cols index until free col is found
          while (typeof map[ridx][c] != "undefined") { c++; }

          cspan = api.getAttribute(cell, 'colspan');
          rspan = api.getAttribute(cell, 'rowspan');

          if (cspan || rspan) {
            this.addSpannedCellToMap(cell, map, ridx, c, cspan, rspan);
            c = c + ((cspan) ? parseInt(cspan, 10) : 1);
          } else {
            map[ridx][c] = new MapCell(cell);
            c++;
          }
        }
      }
      this.map = map;
      return map;
    },

    getRowCells: function(row) {
      var inlineTables = this.table.querySelectorAll('table'),
        inlineCells = (inlineTables) ? queryInList(inlineTables, 'th, td') : [],
        allCells = row.querySelectorAll('th, td'),
        tableCells = (inlineCells.length > 0) ? wysihtml5.lang.array(allCells).without(inlineCells) : allCells;

      return tableCells;
    },

    getTableRows: function() {
      var inlineTables = this.table.querySelectorAll('table'),
        inlineRows = (inlineTables) ? queryInList(inlineTables, 'tr') : [],
        allRows = this.table.querySelectorAll('tr'),
        tableRows = (inlineRows.length > 0) ? wysihtml5.lang.array(allRows).without(inlineRows) : allRows;

      return tableRows;
    },

    getMapIndex: function(cell) {
      var r_length = this.map.length,
        c_length = (this.map && this.map[0]) ? this.map[0].length : 0;

      for (var r_idx = 0;r_idx < r_length; r_idx++) {
        for (var c_idx = 0;c_idx < c_length; c_idx++) {
          if (this.map[r_idx][c_idx].el === cell) {
            return {'row': r_idx, 'col': c_idx};
          }
        }
      }
      return false;
    },

    getElementAtIndex: function(idx) {
      this.setTableMap();
      if (this.map[idx.row] && this.map[idx.row][idx.col] && this.map[idx.row][idx.col].el) {
        return this.map[idx.row][idx.col].el;
      }
      return null;
    },

    getMapElsTo: function(to_cell) {
      var els = [];
      this.setTableMap();
      this.idx_start = this.getMapIndex(this.cell);
      this.idx_end = this.getMapIndex(to_cell);

      // switch indexes if start is bigger than end
      if (this.idx_start.row > this.idx_end.row || (this.idx_start.row == this.idx_end.row && this.idx_start.col > this.idx_end.col)) {
        var temp_idx = this.idx_start;
        this.idx_start = this.idx_end;
        this.idx_end = temp_idx;
      }
      if (this.idx_start.col > this.idx_end.col) {
        var temp_cidx = this.idx_start.col;
        this.idx_start.col = this.idx_end.col;
        this.idx_end.col = temp_cidx;
      }

      if (this.idx_start != null && this.idx_end != null) {
        for (var row = this.idx_start.row, maxr = this.idx_end.row; row <= maxr; row++) {
          for (var col = this.idx_start.col, maxc = this.idx_end.col; col <= maxc; col++) {
            els.push(this.map[row][col].el);
          }
        }
      }
      return els;
    },

    orderSelectionEnds: function(secondcell) {
      this.setTableMap();
      this.idx_start = this.getMapIndex(this.cell);
      this.idx_end = this.getMapIndex(secondcell);

      // switch indexes if start is bigger than end
      if (this.idx_start.row > this.idx_end.row || (this.idx_start.row == this.idx_end.row && this.idx_start.col > this.idx_end.col)) {
        var temp_idx = this.idx_start;
        this.idx_start = this.idx_end;
        this.idx_end = temp_idx;
      }
      if (this.idx_start.col > this.idx_end.col) {
        var temp_cidx = this.idx_start.col;
        this.idx_start.col = this.idx_end.col;
        this.idx_end.col = temp_cidx;
      }

      return {
        "start": this.map[this.idx_start.row][this.idx_start.col].el,
        "end": this.map[this.idx_end.row][this.idx_end.col].el
      };
    },

    createCells: function(tag, nr, attrs) {
      var doc = this.table.ownerDocument,
        frag = doc.createDocumentFragment(),
        cell;
      for (var i = 0; i < nr; i++) {
        cell = doc.createElement(tag);

        if (attrs) {
          for (var attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
              cell.setAttribute(attr, attrs[attr]);
            }
          }
        }

        // add non breaking space
        cell.appendChild(document.createTextNode("\u00a0"));
        frag.appendChild(cell);
      }
      return frag;
    },

    // Returns next real cell (not part of spanned cell unless first) on row if selected index is not real. I no real cells -1 will be returned
    correctColIndexForUnreals: function(col, row) {
      var r = this.map[row],
        corrIdx = -1;
      for (var i = 0, max = col; i < col; i++) {
        if (r[i].isReal){
          corrIdx++;
        }
      }
      return corrIdx;
    },

    getLastNewCellOnRow: function(row, rowLimit) {
      var cells = this.getRowCells(row),
        cell, idx;

      for (var cidx = 0, cmax = cells.length; cidx < cmax; cidx++) {
        cell = cells[cidx];
        idx = this.getMapIndex(cell);
        if (idx === false || (typeof rowLimit != "undefined" && idx.row != rowLimit)) {
          return cell;
        }
      }
      return null;
    },

    removeEmptyTable: function() {
      var cells = this.table.querySelectorAll('td, th');
      if (!cells || cells.length == 0) {
        removeElement(this.table);
        return true;
      } else {
        return false;
      }
    },

    // Splits merged cell on row to unique cells
    splitRowToCells: function(cell) {
      if (cell.isColspan) {
        var colspan = parseInt(api.getAttribute(cell.el, 'colspan') || 1, 10),
          cType = cell.el.tagName.toLowerCase();
        if (colspan > 1) {
          var newCells = this.createCells(cType, colspan -1);
          insertAfter(cell.el, newCells);
        }
        cell.el.removeAttribute('colspan');
      }
    },

    getRealRowEl: function(force, idx) {
      var r = null,
        c = null;

      idx = idx || this.idx;

      for (var cidx = 0, cmax = this.map[idx.row].length; cidx < cmax; cidx++) {
        c = this.map[idx.row][cidx];
        if (c.isReal) {
          r = api.getParentElement(c.el, { query: "tr" });
          if (r) {
            return r;
          }
        }
      }

      if (r === null && force) {
        r = api.getParentElement(this.map[idx.row][idx.col].el, { query: "tr" }) || null;
      }

      return r;
    },

    injectRowAt: function(row, col, colspan, cType, c) {
      var r = this.getRealRowEl(false, {'row': row, 'col': col}),
        new_cells = this.createCells(cType, colspan);

      if (r) {
        var n_cidx = this.correctColIndexForUnreals(col, row);
        if (n_cidx >= 0) {
          insertAfter(this.getRowCells(r)[n_cidx], new_cells);
        } else {
          r.insertBefore(new_cells, r.firstChild);
        }
      } else {
        var rr = this.table.ownerDocument.createElement('tr');
        rr.appendChild(new_cells);
        insertAfter(api.getParentElement(c.el, { query: "tr" }), rr);
      }
    },

    canMerge: function(to) {
      this.to = to;
      this.setTableMap();
      this.idx_start = this.getMapIndex(this.cell);
      this.idx_end = this.getMapIndex(this.to);

      // switch indexes if start is bigger than end
      if (this.idx_start.row > this.idx_end.row || (this.idx_start.row == this.idx_end.row && this.idx_start.col > this.idx_end.col)) {
        var temp_idx = this.idx_start;
        this.idx_start = this.idx_end;
        this.idx_end = temp_idx;
      }
      if (this.idx_start.col > this.idx_end.col) {
        var temp_cidx = this.idx_start.col;
        this.idx_start.col = this.idx_end.col;
        this.idx_end.col = temp_cidx;
      }

      for (var row = this.idx_start.row, maxr = this.idx_end.row; row <= maxr; row++) {
        for (var col = this.idx_start.col, maxc = this.idx_end.col; col <= maxc; col++) {
          if (this.map[row][col].isColspan || this.map[row][col].isRowspan) {
            return false;
          }
        }
      }
      return true;
    },

    decreaseCellSpan: function(cell, span) {
      var nr = parseInt(api.getAttribute(cell.el, span), 10) - 1;
      if (nr >= 1) {
        cell.el.setAttribute(span, nr);
      } else {
        cell.el.removeAttribute(span);
        if (span == 'colspan') {
          cell.isColspan = false;
        }
        if (span == 'rowspan') {
          cell.isRowspan = false;
        }
        cell.firstCol = true;
        cell.lastCol = true;
        cell.firstRow = true;
        cell.lastRow = true;
        cell.isReal = true;
      }
    },

    removeSurplusLines: function() {
      var row, cell, ridx, rmax, cidx, cmax, allRowspan;

      this.setTableMap();
      if (this.map) {
        ridx = 0;
        rmax = this.map.length;
        for (;ridx < rmax; ridx++) {
          row = this.map[ridx];
          allRowspan = true;
          cidx = 0;
          cmax = row.length;
          for (; cidx < cmax; cidx++) {
            cell = row[cidx];
            if (!(api.getAttribute(cell.el, "rowspan") && parseInt(api.getAttribute(cell.el, "rowspan"), 10) > 1 && cell.firstRow !== true)) {
              allRowspan = false;
              break;
            }
          }
          if (allRowspan) {
            cidx = 0;
            for (; cidx < cmax; cidx++) {
              this.decreaseCellSpan(row[cidx], 'rowspan');
            }
          }
        }

        // remove rows without cells
        var tableRows = this.getTableRows();
        ridx = 0;
        rmax = tableRows.length;
        for (;ridx < rmax; ridx++) {
          row = tableRows[ridx];
          if (row.childNodes.length == 0 && (/^\s*$/.test(row.textContent || row.innerText))) {
            removeElement(row);
          }
        }
      }
    },

    fillMissingCells: function() {
      var r_max = 0,
        c_max = 0,
        prevcell = null;

      this.setTableMap();
      if (this.map) {

        // find maximal dimensions of broken table
        r_max = this.map.length;
        for (var ridx = 0; ridx < r_max; ridx++) {
          if (this.map[ridx].length > c_max) { c_max = this.map[ridx].length; }
        }

        for (var row = 0; row < r_max; row++) {
          for (var col = 0; col < c_max; col++) {
            if (this.map[row] && !this.map[row][col]) {
              if (col > 0) {
                this.map[row][col] = new MapCell(this.createCells('td', 1));
                prevcell = this.map[row][col-1];
                if (prevcell && prevcell.el && prevcell.el.parent) { // if parent does not exist element is removed from dom
                  insertAfter(this.map[row][col-1].el, this.map[row][col].el);
                }
              }
            }
          }
        }
      }
    },

    rectify: function() {
      if (!this.removeEmptyTable()) {
        this.removeSurplusLines();
        this.fillMissingCells();
        return true;
      } else {
        return false;
      }
    },

    unmerge: function() {
      if (this.rectify()) {
        this.setTableMap();
        this.idx = this.getMapIndex(this.cell);

        if (this.idx) {
          var thisCell = this.map[this.idx.row][this.idx.col],
            colspan = (api.getAttribute(thisCell.el, "colspan")) ? parseInt(api.getAttribute(thisCell.el, "colspan"), 10) : 1,
            cType = thisCell.el.tagName.toLowerCase();

          if (thisCell.isRowspan) {
            var rowspan = parseInt(api.getAttribute(thisCell.el, "rowspan"), 10);
            if (rowspan > 1) {
              for (var nr = 1, maxr = rowspan - 1; nr <= maxr; nr++){
                this.injectRowAt(this.idx.row + nr, this.idx.col, colspan, cType, thisCell);
              }
            }
            thisCell.el.removeAttribute('rowspan');
          }
          this.splitRowToCells(thisCell);
        }
      }
    },

    // merges cells from start cell (defined in creating obj) to "to" cell
    merge: function(to) {
      if (this.rectify()) {
        if (this.canMerge(to)) {
          var rowspan = this.idx_end.row - this.idx_start.row + 1,
            colspan = this.idx_end.col - this.idx_start.col + 1;

          for (var row = this.idx_start.row, maxr = this.idx_end.row; row <= maxr; row++) {
            for (var col = this.idx_start.col, maxc = this.idx_end.col; col <= maxc; col++) {

              if (row == this.idx_start.row && col == this.idx_start.col) {
                if (rowspan > 1) {
                  this.map[row][col].el.setAttribute('rowspan', rowspan);
                }
                if (colspan > 1) {
                  this.map[row][col].el.setAttribute('colspan', colspan);
                }
              } else {
                // transfer content
                if (!(/^\s*<br\/?>\s*$/.test(this.map[row][col].el.innerHTML.toLowerCase()))) {
                  this.map[this.idx_start.row][this.idx_start.col].el.innerHTML += ' ' + this.map[row][col].el.innerHTML;
                }
                removeElement(this.map[row][col].el);
              }

            }
          }
          this.rectify();
        } else {
          if (window.console) {
            console.log('Do not know how to merge allready merged cells.');
          }
        }
      }
    },

    // Decreases rowspan of a cell if it is done on first cell of rowspan row (real cell)
    // Cell is moved to next row (if it is real)
    collapseCellToNextRow: function(cell) {
      var cellIdx = this.getMapIndex(cell.el),
        newRowIdx = cellIdx.row + 1,
        newIdx = {'row': newRowIdx, 'col': cellIdx.col};

      if (newRowIdx < this.map.length) {

        var row = this.getRealRowEl(false, newIdx);
        if (row !== null) {
          var n_cidx = this.correctColIndexForUnreals(newIdx.col, newIdx.row);
          if (n_cidx >= 0) {
            insertAfter(this.getRowCells(row)[n_cidx], cell.el);
          } else {
            var lastCell = this.getLastNewCellOnRow(row, newRowIdx);
            if (lastCell !== null) {
              insertAfter(lastCell, cell.el);
            } else {
              row.insertBefore(cell.el, row.firstChild);
            }
          }
          if (parseInt(api.getAttribute(cell.el, 'rowspan'), 10) > 2) {
            cell.el.setAttribute('rowspan', parseInt(api.getAttribute(cell.el, 'rowspan'), 10) - 1);
          } else {
            cell.el.removeAttribute('rowspan');
          }
        }
      }
    },

    // Removes a cell when removing a row
    // If is rowspan cell then decreases the rowspan
    // and moves cell to next row if needed (is first cell of rowspan)
    removeRowCell: function(cell) {
      if (cell.isReal) {
        if (cell.isRowspan) {
          this.collapseCellToNextRow(cell);
        } else {
          removeElement(cell.el);
        }
      } else {
        if (parseInt(api.getAttribute(cell.el, 'rowspan'), 10) > 2) {
          cell.el.setAttribute('rowspan', parseInt(api.getAttribute(cell.el, 'rowspan'), 10) - 1);
        } else {
          cell.el.removeAttribute('rowspan');
        }
      }
    },

    getRowElementsByCell: function() {
      var cells = [];
      this.setTableMap();
      this.idx = this.getMapIndex(this.cell);
      if (this.idx !== false) {
        var modRow = this.map[this.idx.row];
        for (var cidx = 0, cmax = modRow.length; cidx < cmax; cidx++) {
          if (modRow[cidx].isReal) {
            cells.push(modRow[cidx].el);
          }
        }
      }
      return cells;
    },

    getColumnElementsByCell: function() {
      var cells = [];
      this.setTableMap();
      this.idx = this.getMapIndex(this.cell);
      if (this.idx !== false) {
        for (var ridx = 0, rmax = this.map.length; ridx < rmax; ridx++) {
          if (this.map[ridx][this.idx.col] && this.map[ridx][this.idx.col].isReal) {
            cells.push(this.map[ridx][this.idx.col].el);
          }
        }
      }
      return cells;
    },

    // Removes the row of selected cell
    removeRow: function() {
      var oldRow = api.getParentElement(this.cell, { query: "tr" });
      if (oldRow) {
        this.setTableMap();
        this.idx = this.getMapIndex(this.cell);
        if (this.idx !== false) {
          var modRow = this.map[this.idx.row];
          for (var cidx = 0, cmax = modRow.length; cidx < cmax; cidx++) {
            if (!modRow[cidx].modified) {
              this.setCellAsModified(modRow[cidx]);
              this.removeRowCell(modRow[cidx]);
            }
          }
        }
        removeElement(oldRow);
      }
    },

    removeColCell: function(cell) {
      if (cell.isColspan) {
        if (parseInt(api.getAttribute(cell.el, 'colspan'), 10) > 2) {
          cell.el.setAttribute('colspan', parseInt(api.getAttribute(cell.el, 'colspan'), 10) - 1);
        } else {
          cell.el.removeAttribute('colspan');
        }
      } else if (cell.isReal) {
        removeElement(cell.el);
      }
    },

    removeColumn: function() {
      this.setTableMap();
      this.idx = this.getMapIndex(this.cell);
      if (this.idx !== false) {
        for (var ridx = 0, rmax = this.map.length; ridx < rmax; ridx++) {
          if (!this.map[ridx][this.idx.col].modified) {
            this.setCellAsModified(this.map[ridx][this.idx.col]);
            this.removeColCell(this.map[ridx][this.idx.col]);
          }
        }
      }
    },

    // removes row or column by selected cell element
    remove: function(what) {
      if (this.rectify()) {
        switch (what) {
          case 'row':
            this.removeRow();
          break;
          case 'column':
            this.removeColumn();
          break;
        }
        this.rectify();
      }
    },

    addRow: function(where) {
      var doc = this.table.ownerDocument;

      this.setTableMap();
      this.idx = this.getMapIndex(this.cell);
      if (where == "below" && api.getAttribute(this.cell, 'rowspan')) {
        this.idx.row = this.idx.row + parseInt(api.getAttribute(this.cell, 'rowspan'), 10) - 1;
      }

      if (this.idx !== false) {
        var modRow = this.map[this.idx.row],
          newRow = doc.createElement('tr');

        for (var ridx = 0, rmax = modRow.length; ridx < rmax; ridx++) {
          if (!modRow[ridx].modified) {
            this.setCellAsModified(modRow[ridx]);
            this.addRowCell(modRow[ridx], newRow, where);
          }
        }

        switch (where) {
          case 'below':
            insertAfter(this.getRealRowEl(true), newRow);
          break;
          case 'above':
            var cr = api.getParentElement(this.map[this.idx.row][this.idx.col].el, { query: "tr" });
            if (cr) {
              cr.parentNode.insertBefore(newRow, cr);
            }
          break;
        }
      }
    },

    addRowCell: function(cell, row, where) {
      var colSpanAttr = (cell.isColspan) ? {"colspan" : api.getAttribute(cell.el, 'colspan')} : null;
      if (cell.isReal) {
        if (where != 'above' && cell.isRowspan) {
          cell.el.setAttribute('rowspan', parseInt(api.getAttribute(cell.el,'rowspan'), 10) + 1);
        } else {
          row.appendChild(this.createCells('td', 1, colSpanAttr));
        }
      } else {
        if (where != 'above' && cell.isRowspan && cell.lastRow) {
          row.appendChild(this.createCells('td', 1, colSpanAttr));
        } else if (c.isRowspan) {
          cell.el.attr('rowspan', parseInt(api.getAttribute(cell.el, 'rowspan'), 10) + 1);
        }
      }
    },

    add: function(where) {
      if (this.rectify()) {
        if (where == 'below' || where == 'above') {
          this.addRow(where);
        }
        if (where == 'before' || where == 'after') {
          this.addColumn(where);
        }
      }
    },

    addColCell: function (cell, ridx, where) {
      var doAdd,
        cType = cell.el.tagName.toLowerCase();

      // defines add cell vs expand cell conditions
      // true means add
      switch (where) {
        case "before":
          doAdd = (!cell.isColspan || cell.firstCol);
        break;
        case "after":
          doAdd = (!cell.isColspan || cell.lastCol || (cell.isColspan && c.el == this.cell));
        break;
      }

      if (doAdd){
        // adds a cell before or after current cell element
        switch (where) {
          case "before":
            cell.el.parentNode.insertBefore(this.createCells(cType, 1), cell.el);
          break;
          case "after":
            insertAfter(cell.el, this.createCells(cType, 1));
          break;
        }

        // handles if cell has rowspan
        if (cell.isRowspan) {
          this.handleCellAddWithRowspan(cell, ridx+1, where);
        }

      } else {
        // expands cell
        cell.el.setAttribute('colspan',  parseInt(api.getAttribute(cell.el, 'colspan'), 10) + 1);
      }
    },

    addColumn: function(where) {
      var row, modCell;

      this.setTableMap();
      this.idx = this.getMapIndex(this.cell);
      if (where == "after" && api.getAttribute(this.cell, 'colspan')) {
        this.idx.col = this.idx.col + parseInt(api.getAttribute(this.cell, 'colspan'), 10) - 1;
      }

      if (this.idx !== false) {
        for (var ridx = 0, rmax = this.map.length; ridx < rmax; ridx++ ) {
          row = this.map[ridx];
          if (row[this.idx.col]) {
            modCell = row[this.idx.col];
            if (!modCell.modified) {
              this.setCellAsModified(modCell);
              this.addColCell(modCell, ridx , where);
            }
          }
        }
      }
    },

    handleCellAddWithRowspan: function (cell, ridx, where) {
      var addRowsNr = parseInt(api.getAttribute(this.cell, 'rowspan'), 10) - 1,
        crow = api.getParentElement(cell.el, { query: "tr" }),
        cType = cell.el.tagName.toLowerCase(),
        cidx, temp_r_cells,
        doc = this.table.ownerDocument,
        nrow;

      for (var i = 0; i < addRowsNr; i++) {
        cidx = this.correctColIndexForUnreals(this.idx.col, (ridx + i));
        crow = nextNode(crow, 'tr');
        if (crow) {
          if (cidx > 0) {
            switch (where) {
              case "before":
                temp_r_cells = this.getRowCells(crow);
                if (cidx > 0 && this.map[ridx + i][this.idx.col].el != temp_r_cells[cidx] && cidx == temp_r_cells.length - 1) {
                   insertAfter(temp_r_cells[cidx], this.createCells(cType, 1));
                } else {
                  temp_r_cells[cidx].parentNode.insertBefore(this.createCells(cType, 1), temp_r_cells[cidx]);
                }

              break;
              case "after":
                insertAfter(this.getRowCells(crow)[cidx], this.createCells(cType, 1));
              break;
            }
          } else {
            crow.insertBefore(this.createCells(cType, 1), crow.firstChild);
          }
        } else {
          nrow = doc.createElement('tr');
          nrow.appendChild(this.createCells(cType, 1));
          this.table.appendChild(nrow);
        }
      }
    }
  };

  api.table = {
    getCellsBetween: function(cell1, cell2) {
      var c1 = new TableModifyerByCell(cell1);
      return c1.getMapElsTo(cell2);
    },

    addCells: function(cell, where) {
      var c = new TableModifyerByCell(cell);
      c.add(where);
    },

    removeCells: function(cell, what) {
      var c = new TableModifyerByCell(cell);
      c.remove(what);
    },

    mergeCellsBetween: function(cell1, cell2) {
      var c1 = new TableModifyerByCell(cell1);
      c1.merge(cell2);
    },

    unmergeCell: function(cell) {
      var c = new TableModifyerByCell(cell);
      c.unmerge();
    },

    orderSelectionEnds: function(cell, cell2) {
      var c = new TableModifyerByCell(cell);
      return c.orderSelectionEnds(cell2);
    },

    indexOf: function(cell) {
      var c = new TableModifyerByCell(cell);
      c.setTableMap();
      return c.getMapIndex(cell);
    },

    findCell: function(table, idx) {
      var c = new TableModifyerByCell(null, table);
      return c.getElementAtIndex(idx);
    },

    findRowByCell: function(cell) {
      var c = new TableModifyerByCell(cell);
      return c.getRowElementsByCell();
    },

    findColumnByCell: function(cell) {
      var c = new TableModifyerByCell(cell);
      return c.getColumnElementsByCell();
    },

    canMerge: function(cell1, cell2) {
      var c = new TableModifyerByCell(cell1);
      return c.canMerge(cell2);
    }
  };

})(wysihtml5);
;// does a selector query on element or array of elements
wysihtml5.dom.query = function(elements, query) {
    var ret = [],
        q;

    if (elements.nodeType) {
        elements = [elements];
    }

    for (var e = 0, len = elements.length; e < len; e++) {
        q = elements[e].querySelectorAll(query);
        if (q) {
            for(var i = q.length; i--; ret.unshift(q[i]));
        }
    }
    return ret;
};
;wysihtml5.dom.compareDocumentPosition = (function() {
  var documentElement = document.documentElement;
  if (documentElement.compareDocumentPosition) {
    return function(container, element) {
      return container.compareDocumentPosition(element);
    };
  } else {
    return function( container, element ) {
      // implementation borrowed from https://github.com/tmpvar/jsdom/blob/681a8524b663281a0f58348c6129c8c184efc62c/lib/jsdom/level3/core.js // MIT license
      var thisOwner, otherOwner;

      if( container.nodeType === 9) // Node.DOCUMENT_NODE
        thisOwner = container;
      else
        thisOwner = container.ownerDocument;

      if( element.nodeType === 9) // Node.DOCUMENT_NODE
        otherOwner = element;
      else
        otherOwner = element.ownerDocument;

      if( container === element ) return 0;
      if( container === element.ownerDocument ) return 4 + 16; //Node.DOCUMENT_POSITION_FOLLOWING + Node.DOCUMENT_POSITION_CONTAINED_BY;
      if( container.ownerDocument === element ) return 2 + 8;  //Node.DOCUMENT_POSITION_PRECEDING + Node.DOCUMENT_POSITION_CONTAINS;
      if( thisOwner !== otherOwner ) return 1; // Node.DOCUMENT_POSITION_DISCONNECTED;

      // Text nodes for attributes does not have a _parentNode. So we need to find them as attribute child.
      if( container.nodeType === 2 /*Node.ATTRIBUTE_NODE*/ && container.childNodes && wysihtml5.lang.array(container.childNodes).indexOf( element ) !== -1)
        return 4 + 16; //Node.DOCUMENT_POSITION_FOLLOWING + Node.DOCUMENT_POSITION_CONTAINED_BY;

      if( element.nodeType === 2 /*Node.ATTRIBUTE_NODE*/ && element.childNodes && wysihtml5.lang.array(element.childNodes).indexOf( container ) !== -1)
        return 2 + 8; //Node.DOCUMENT_POSITION_PRECEDING + Node.DOCUMENT_POSITION_CONTAINS;

      var point = container;
      var parents = [ ];
      var previous = null;
      while( point ) {
        if( point == element ) return 2 + 8; //Node.DOCUMENT_POSITION_PRECEDING + Node.DOCUMENT_POSITION_CONTAINS;
        parents.push( point );
        point = point.parentNode;
      }
      point = element;
      previous = null;
      while( point ) {
        if( point == container ) return 4 + 16; //Node.DOCUMENT_POSITION_FOLLOWING + Node.DOCUMENT_POSITION_CONTAINED_BY;
        var location_index = wysihtml5.lang.array(parents).indexOf( point );
        if( location_index !== -1) {
         var smallest_common_ancestor = parents[ location_index ];
         var this_index = wysihtml5.lang.array(smallest_common_ancestor.childNodes).indexOf( parents[location_index - 1]);//smallest_common_ancestor.childNodes.toArray().indexOf( parents[location_index - 1] );
         var other_index = wysihtml5.lang.array(smallest_common_ancestor.childNodes).indexOf( previous ); //smallest_common_ancestor.childNodes.toArray().indexOf( previous );
         if( this_index > other_index ) {
               return 2; //Node.DOCUMENT_POSITION_PRECEDING;
         }
         else {
           return 4; //Node.DOCUMENT_POSITION_FOLLOWING;
         }
        }
        previous = point;
        point = point.parentNode;
      }
      return 1; //Node.DOCUMENT_POSITION_DISCONNECTED;
    };
  }
})();
;/* Unwraps element and returns list of childNodes that the node contained.
 *
 * Example:
 *    var childnodes = wysihtml5.dom.unwrap(document.querySelector('.unwrap-me'));
*/

wysihtml5.dom.unwrap = function(node) {
  var children = [];
  if (node.parentNode) {
    while (node.lastChild) {
      children.unshift(node.lastChild);
      wysihtml5.dom.insert(node.lastChild).after(node);
    }
    node.parentNode.removeChild(node);
  }
  return children;
};
;/* 
 * Methods for fetching pasted html before it gets inserted into content
**/

/* Modern event.clipboardData driven approach.
 * Advantage is that it does not have to loose selection or modify dom to catch the data. 
 * IE does not support though.
**/
wysihtml5.dom.getPastedHtml = function(event) {
  var html;
  if (event.clipboardData) {
    if (wysihtml5.lang.array(event.clipboardData.types).contains('text/html')) {
      html = event.clipboardData.getData('text/html');
    } else if (wysihtml5.lang.array(event.clipboardData.types).contains('text/plain')) {
      html = wysihtml5.lang.string(event.clipboardData.getData('text/plain')).escapeHTML(true, true);
    }
  }
  return html;
};

/* Older temprorary contenteditable as paste source catcher method for fallbacks */
wysihtml5.dom.getPastedHtmlWithDiv = function (composer, f) {
  var selBookmark = composer.selection.getBookmark(),
      doc = composer.element.ownerDocument,
      cleanerDiv = doc.createElement('DIV'),
      scrollPos = composer.getScrollPos();
  
  doc.body.appendChild(cleanerDiv);

  cleanerDiv.style.width = "1px";
  cleanerDiv.style.height = "1px";
  cleanerDiv.style.overflow = "hidden";
  cleanerDiv.style.position = "absolute";
  cleanerDiv.style.top = scrollPos.y + "px";
  cleanerDiv.style.left = scrollPos.x + "px";

  cleanerDiv.setAttribute('contenteditable', 'true');
  cleanerDiv.focus();

  setTimeout(function () {
    var html;

    composer.selection.setBookmark(selBookmark);
    html = cleanerDiv.innerHTML;
    if (html && (/^<br\/?>$/i).test(html.trim())) {
      html = false;
    }
    f(html);
    cleanerDiv.parentNode.removeChild(cleanerDiv);
  }, 0);
};
;wysihtml5.dom.removeInvisibleSpaces = function(node) {
  var textNodes = wysihtml5.dom.getTextNodes(node);
  for (var n = textNodes.length; n--;) {
    textNodes[n].nodeValue = textNodes[n].nodeValue.replace(wysihtml5.INVISIBLE_SPACE_REG_EXP, "");
  }
};
;/**
 * Fix most common html formatting misbehaviors of browsers implementation when inserting
 * content via copy & paste contentEditable
 *
 * @author Christopher Blum
 */
wysihtml5.quirks.cleanPastedHTML = (function() {

  var styleToRegex = function (styleStr) {
    var trimmedStr = wysihtml5.lang.string(styleStr).trim(),
        escapedStr = trimmedStr.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

    return new RegExp("^((?!^" + escapedStr + "$).)*$", "i");
  };

  var extendRulesWithStyleExceptions = function (rules, exceptStyles) {
    var newRules = wysihtml5.lang.object(rules).clone(true),
        tag, style;

    for (tag in newRules.tags) {

      if (newRules.tags.hasOwnProperty(tag)) {
        if (newRules.tags[tag].keep_styles) {
          for (style in newRules.tags[tag].keep_styles) {
            if (newRules.tags[tag].keep_styles.hasOwnProperty(style)) {
              if (exceptStyles[style]) {
                newRules.tags[tag].keep_styles[style] = styleToRegex(exceptStyles[style]);
              }
            }
          }
        }
      }
    }

    return newRules;
  };

  var pickRuleset = function(ruleset, html) {
    var pickedSet, defaultSet;

    if (!ruleset) {
      return null;
    }

    for (var i = 0, max = ruleset.length; i < max; i++) {
      if (!ruleset[i].condition) {
        defaultSet = ruleset[i].set;
      }
      if (ruleset[i].condition && ruleset[i].condition.test(html)) {
        return ruleset[i].set;
      }
    }

    return defaultSet;
  };

  return function(html, options) {
    var exceptStyles = {
          'color': wysihtml5.dom.getStyle("color").from(options.referenceNode),
          'fontSize': wysihtml5.dom.getStyle("font-size").from(options.referenceNode)
        },
        rules = extendRulesWithStyleExceptions(pickRuleset(options.rules, html) || {}, exceptStyles),
        newHtml;

    newHtml = wysihtml5.dom.parse(html, {
      "rules": rules,
      "cleanUp": true, // <span> elements, empty or without attributes, should be removed/replaced with their content
      "context": options.referenceNode.ownerDocument,
      "uneditableClass": options.uneditableClass,
      "clearInternals" : true, // don't paste temprorary selection and other markings
      "unjoinNbsps" : true
    });

    return newHtml;
  };

})();
;/**
 * IE and Opera leave an empty paragraph in the contentEditable element after clearing it
 *
 * @param {Object} contentEditableElement The contentEditable element to observe for clearing events
 * @exaple
 *    wysihtml5.quirks.ensureProperClearing(myContentEditableElement);
 */
wysihtml5.quirks.ensureProperClearing = (function() {
  var clearIfNecessary = function() {
    var element = this;
    setTimeout(function() {
      var innerHTML = element.innerHTML.toLowerCase();
      if (innerHTML == "<p>&nbsp;</p>" ||
          innerHTML == "<p>&nbsp;</p><p>&nbsp;</p>") {
        element.innerHTML = "";
      }
    }, 0);
  };

  return function(composer) {
    wysihtml5.dom.observe(composer.element, ["cut", "keydown"], clearIfNecessary);
  };
})();
;// See https://bugzilla.mozilla.org/show_bug.cgi?id=664398
//
// In Firefox this:
//      var d = document.createElement("div");
//      d.innerHTML ='<a href="~"></a>';
//      d.innerHTML;
// will result in:
//      <a href="%7E"></a>
// which is wrong
(function(wysihtml5) {
  var TILDE_ESCAPED = "%7E";
  wysihtml5.quirks.getCorrectInnerHTML = function(element) {
    var innerHTML = element.innerHTML;
    if (innerHTML.indexOf(TILDE_ESCAPED) === -1) {
      return innerHTML;
    }

    var elementsWithTilde = element.querySelectorAll("[href*='~'], [src*='~']"),
        url,
        urlToSearch,
        length,
        i;
    for (i=0, length=elementsWithTilde.length; i<length; i++) {
      url         = elementsWithTilde[i].href || elementsWithTilde[i].src;
      urlToSearch = wysihtml5.lang.string(url).replace("~").by(TILDE_ESCAPED);
      innerHTML   = wysihtml5.lang.string(innerHTML).replace(urlToSearch).by(url);
    }
    return innerHTML;
  };
})(wysihtml5);
;/**
 * Force rerendering of a given element
 * Needed to fix display misbehaviors of IE
 *
 * @param {Element} element The element object which needs to be rerendered
 * @example
 *    wysihtml5.quirks.redraw(document.body);
 */
(function(wysihtml5) {
  var CLASS_NAME = "wysihtml5-quirks-redraw";

  wysihtml5.quirks.redraw = function(element) {
    wysihtml5.dom.addClass(element, CLASS_NAME);
    wysihtml5.dom.removeClass(element, CLASS_NAME);

    // Following hack is needed for firefox to make sure that image resize handles are properly removed
    try {
      var doc = element.ownerDocument;
      doc.execCommand("italic", false, null);
      doc.execCommand("italic", false, null);
    } catch(e) {}
  };
})(wysihtml5);
;wysihtml5.quirks.tableCellsSelection = function(editable, editor) {

  var dom = wysihtml5.dom,
    select = {
      table: null,
      start: null,
      end: null,
      cells: null,
      select: selectCells
    },
    selection_class = "wysiwyg-tmp-selected-cell";

  function init () {
    editable.addEventListener("mousedown", handleMouseDown);
    return select;
  }

  var handleMouseDown = function(event) {
    var target = wysihtml5.dom.getParentElement(event.target, { query: "td, th" }, false, editable);
    if (target) {
      handleSelectionMousedown(target);
    }
  };

  function handleSelectionMousedown (target) {
    select.start = target;
    select.end = target;
    select.cells = [target];
    select.table = dom.getParentElement(select.start, { query: "table" }, false, editable);

    if (select.table) {
      removeCellSelections();
      dom.addClass(target, selection_class);
      editable.addEventListener("mousemove", handleMouseMove);
      editable.addEventListener("mouseup", handleMouseUp);
      editor.fire("tableselectstart").fire("tableselectstart:composer");
    }
  }

  // remove all selection classes
  function removeCellSelections () {
    if (editable) {
      var selectedCells = editable.querySelectorAll('.' + selection_class);
      if (selectedCells.length > 0) {
        for (var i = 0; i < selectedCells.length; i++) {
          dom.removeClass(selectedCells[i], selection_class);
        }
      }
    }
  }

  function addSelections (cells) {
    for (var i = 0; i < cells.length; i++) {
      dom.addClass(cells[i], selection_class);
    }
  }

  function handleMouseMove (event) {
    var curTable = null,
      cell = dom.getParentElement(event.target, { query: "td, th" }, false, editable),
      oldEnd;

    if (cell && select.table && select.start) {
      curTable =  dom.getParentElement(cell, { query: "table" }, false, editable);
      if (curTable && curTable === select.table) {
        removeCellSelections();
        oldEnd = select.end;
        select.end = cell;
        select.cells = dom.table.getCellsBetween(select.start, cell);
        if (select.cells.length > 1) {
          editor.composer.selection.deselect();
        }
        addSelections(select.cells);
        if (select.end !== oldEnd) {
          editor.fire("tableselectchange").fire("tableselectchange:composer");
        }
      }
    }
  }

  function handleMouseUp (event) {
    editable.removeEventListener("mousemove", handleMouseMove);
    editable.removeEventListener("mouseup", handleMouseUp);
    editor.fire("tableselect").fire("tableselect:composer");
    setTimeout(function() {
      bindSideclick();
    },0);
  }

  var sideClickHandler = function(event) {
    editable.ownerDocument.removeEventListener("click", sideClickHandler);
    if (dom.getParentElement(event.target, { query: "table" }, false, editable) != select.table) {
      removeCellSelections();
      select.table = null;
      select.start = null;
      select.end = null;
      editor.fire("tableunselect").fire("tableunselect:composer");
    }
  };

  function bindSideclick () {
    editable.ownerDocument.addEventListener("click", sideClickHandler);
  }

  function selectCells (start, end) {
    select.start = start;
    select.end = end;
    select.table = dom.getParentElement(select.start, { query: "table" }, false, editable);
    selectedCells = dom.table.getCellsBetween(select.start, select.end);
    addSelections(selectedCells);
    bindSideclick();
    editor.fire("tableselect").fire("tableselect:composer");
  }

  return init();

};
;(function(wysihtml5) {
  
  // List of supported color format parsing methods
  // If radix is not defined 10 is expected as default
  var colorParseMethods = {
        rgba : {
          regex: /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d\.]+)\s*\)/i,
          name: "rgba"
        },
        rgb : {
          regex: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i,
          name: "rgb"
        },
        hex6 : {
          regex: /^#([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])/i,
          name: "hex",
          radix: 16
        },
        hex3 : {
          regex: /^#([0-9a-f])([0-9a-f])([0-9a-f])/i,
          name: "hex",
          radix: 16
        }
      },
      // Takes a style key name as an argument and makes a regex that can be used to the match key:value pair from style string
      makeParamRegExp = function (p) {
        return new RegExp("(^|\\s|;)" + p + "\\s*:\\s*[^;$]+", "gi");
      };

  // Takes color string value ("#abc", "rgb(1,2,3)", ...) as an argument and returns suitable parsing method for it
  function getColorParseMethod (colorStr) {
    var prop, colorTypeConf;

    for (prop in colorParseMethods) {
      if (!colorParseMethods.hasOwnProperty(prop)) { continue; }

      colorTypeConf = colorParseMethods[prop];

      if (colorTypeConf.regex.test(colorStr)) {
        return colorTypeConf;
      }
    }
  }

  // Takes color string value ("#abc", "rgb(1,2,3)", ...) as an argument and returns the type of that color format "hex", "rgb", "rgba". 
  function getColorFormat (colorStr) {
    var type = getColorParseMethod(colorStr);

    return type ? type.name : undefined;
  }

  // Public API functions for styleParser
  wysihtml5.quirks.styleParser = {

    // Takes color string value as an argument and returns suitable parsing method for it
    getColorParseMethod : getColorParseMethod,

    // Takes color string value as an argument and returns the type of that color format "hex", "rgb", "rgba". 
    getColorFormat : getColorFormat,
    
    /* Parses a color string to and array of [red, green, blue, alpha].
     * paramName: optional argument to parse color value directly from style string parameter
     *
     * Examples:
     *    var colorArray = wysihtml5.quirks.styleParser.parseColor("#ABC");            // [170, 187, 204, 1]
     *    var colorArray = wysihtml5.quirks.styleParser.parseColor("#AABBCC");         // [170, 187, 204, 1]
     *    var colorArray = wysihtml5.quirks.styleParser.parseColor("rgb(1,2,3)");      // [1, 2, 3, 1]
     *    var colorArray = wysihtml5.quirks.styleParser.parseColor("rgba(1,2,3,0.5)"); // [1, 2, 3, 0.5]
     *
     *    var colorArray = wysihtml5.quirks.styleParser.parseColor("background-color: #ABC; color: #000;", "background-color"); // [170, 187, 204, 1]
     *    var colorArray = wysihtml5.quirks.styleParser.parseColor("background-color: #ABC; color: #000;", "color");            // [0, 0, 0, 1]
     */
    parseColor : function (stylesStr, paramName) {
      var paramsRegex, params, colorType, colorMatch, radix,
          colorStr = stylesStr;

      if (paramName) {
        paramsRegex = makeParamRegExp(paramName);

        if (!(params = stylesStr.match(paramsRegex))) { return false; }

        params = params.pop().split(":")[1];
        colorStr = wysihtml5.lang.string(params).trim();
      }

      if (!(colorType = getColorParseMethod(colorStr))) { return false; }
      if (!(colorMatch = colorStr.match(colorType.regex))) { return false; }

      radix = colorType.radix || 10;

      if (colorType === colorParseMethods.hex3) {
        colorMatch.shift();
        colorMatch.push(1);
        return wysihtml5.lang.array(colorMatch).map(function(d, idx) {
          return (idx < 3) ? (parseInt(d, radix) * radix) + parseInt(d, radix): parseFloat(d);
        });
      }

      colorMatch.shift();

      if (!colorMatch[3]) {
        colorMatch.push(1);
      }

      return wysihtml5.lang.array(colorMatch).map(function(d, idx) {
        return (idx < 3) ? parseInt(d, radix): parseFloat(d);
      });
    },

    /* Takes rgba color array [r,g,b,a] as a value and formats it to color string with given format type
     * If no format is given, rgba/rgb is returned based on alpha value
     *
     * Example:
     *    var colorStr = wysihtml5.quirks.styleParser.unparseColor([170, 187, 204, 1], "hash");  // "#AABBCC"
     *    var colorStr = wysihtml5.quirks.styleParser.unparseColor([170, 187, 204, 1], "hex");  // "AABBCC"
     *    var colorStr = wysihtml5.quirks.styleParser.unparseColor([170, 187, 204, 1], "csv");  // "170, 187, 204, 1"
     *    var colorStr = wysihtml5.quirks.styleParser.unparseColor([170, 187, 204, 1], "rgba");  // "rgba(170,187,204,1)"
     *    var colorStr = wysihtml5.quirks.styleParser.unparseColor([170, 187, 204, 1], "rgb");  // "rgb(170,187,204)"
     *
     *    var colorStr = wysihtml5.quirks.styleParser.unparseColor([170, 187, 204, 0.5]);  // "rgba(170,187,204,0.5)"
     *    var colorStr = wysihtml5.quirks.styleParser.unparseColor([170, 187, 204, 1]);  // "rgb(170,187,204)"
     */
    unparseColor: function(val, colorFormat) {
      var hexRadix = 16;

      if (colorFormat === "hex") {
        return (val[0].toString(hexRadix) + val[1].toString(hexRadix) + val[2].toString(hexRadix)).toUpperCase();
      } else if (colorFormat === "hash") {
        return "#" + (val[0].toString(hexRadix) + val[1].toString(hexRadix) + val[2].toString(hexRadix)).toUpperCase();
      } else if (colorFormat === "rgb") {
        return "rgb(" + val[0] + "," + val[1] + "," + val[2] + ")";
      } else if (colorFormat === "rgba") {
        return "rgba(" + val[0] + "," + val[1] + "," + val[2] + "," + val[3] + ")";
      } else if (colorFormat === "csv") {
        return  val[0] + "," + val[1] + "," + val[2] + "," + val[3];
      }

      if (val[3] && val[3] !== 1) {
        return "rgba(" + val[0] + "," + val[1] + "," + val[2] + "," + val[3] + ")";
      } else {
        return "rgb(" + val[0] + "," + val[1] + "," + val[2] + ")";
      }
    },

    // Parses font size value from style string
    parseFontSize: function(stylesStr) {
      var params = stylesStr.match(makeParamRegExp("font-size"));
      if (params) {
        return wysihtml5.lang.string(params[params.length - 1].split(":")[1]).trim();
      }
      return false;
    }
  };

})(wysihtml5);
;/**
 * Selection API
 *
 * @example
 *    var selection = new wysihtml5.Selection(editor);
 */
(function(wysihtml5) {
  var dom = wysihtml5.dom;

  function _getCumulativeOffsetTop(element) {
    var top = 0;
    if (element.parentNode) {
      do {
        top += element.offsetTop || 0;
        element = element.offsetParent;
      } while (element);
    }
    return top;
  }

  // Provides the depth of ``descendant`` relative to ``ancestor``
  function getDepth(ancestor, descendant) {
      var ret = 0;
      while (descendant !== ancestor) {
          ret++;
          descendant = descendant.parentNode;
          if (!descendant)
              throw new Error("not a descendant of ancestor!");
      }
      return ret;
  }

  function getWebkitSelectionFixNode(container) {
    var blankNode = document.createElement('span');

    var placeholderRemover = function(event) {
      // Self-destructs the caret and keeps the text inserted into it by user
      var lastChild;

      container.removeEventListener('mouseup', placeholderRemover);
      container.removeEventListener('keydown', placeholderRemover);
      container.removeEventListener('touchstart', placeholderRemover);
      container.removeEventListener('focus', placeholderRemover);
      container.removeEventListener('blur', placeholderRemover);
      container.removeEventListener('paste', delayedPlaceholderRemover);
      container.removeEventListener('drop', delayedPlaceholderRemover);
      container.removeEventListener('beforepaste', delayedPlaceholderRemover);

      if (blankNode && blankNode.parentNode) {
        blankNode.parentNode.removeChild(blankNode);
      }
    },
    delayedPlaceholderRemover = function (event) {
      if (blankNode && blankNode.parentNode) {
        setTimeout(placeholderRemover, 0);
      }
    };

    blankNode.appendChild(document.createTextNode(wysihtml5.INVISIBLE_SPACE));
    blankNode.className = '_wysihtml5-temp-caret-fix';
    blankNode.style.display = 'block';
    blankNode.style.minWidth = '1px';
    blankNode.style.height = '0px';

    container.addEventListener('mouseup', placeholderRemover);
    container.addEventListener('keydown', placeholderRemover);
    container.addEventListener('touchstart', placeholderRemover);
    container.addEventListener('focus', placeholderRemover);
    container.addEventListener('blur', placeholderRemover);
    container.addEventListener('paste', delayedPlaceholderRemover);
    container.addEventListener('drop', delayedPlaceholderRemover);
    container.addEventListener('beforepaste', delayedPlaceholderRemover);

    return blankNode;
  }

  // Should fix the obtained ranges that cannot surrond contents normally to apply changes upon
  // Being considerate to firefox that sets range start start out of span and end inside on doubleclick initiated selection
  function expandRangeToSurround(range) {
      if (range.canSurroundContents()) return;

      var common = range.commonAncestorContainer,
          start_depth = getDepth(common, range.startContainer),
          end_depth = getDepth(common, range.endContainer);

      while(!range.canSurroundContents()) {
        // In the following branches, we cannot just decrement the depth variables because the setStartBefore/setEndAfter may move the start or end of the range more than one level relative to ``common``. So we need to recompute the depth.
        if (start_depth > end_depth) {
            range.setStartBefore(range.startContainer);
            start_depth = getDepth(common, range.startContainer);
        }
        else {
            range.setEndAfter(range.endContainer);
            end_depth = getDepth(common, range.endContainer);
        }
      }
  }

  wysihtml5.Selection = Base.extend(
    /** @scope wysihtml5.Selection.prototype */ {
    constructor: function(editor, contain, unselectableClass) {
      // Make sure that our external range library is initialized
      rangy.init();

      this.editor   = editor;
      this.composer = editor.composer;
      this.doc      = this.composer.doc;
      this.win      = this.composer.win;
      this.contain = contain;
      this.unselectableClass = unselectableClass || false;
    },

    /**
     * Get the current selection as a bookmark to be able to later restore it
     *
     * @return {Object} An object that represents the current selection
     */
    getBookmark: function() {
      var range = this.getRange();
      return range && range.cloneRange();
    },

    /**
     * Restore a selection retrieved via wysihtml5.Selection.prototype.getBookmark
     *
     * @param {Object} bookmark An object that represents the current selection
     */
    setBookmark: function(bookmark) {
      if (!bookmark) {
        return;
      }

      this.setSelection(bookmark);
    },

    /**
     * Set the caret in front of the given node
     *
     * @param {Object} node The element or text node where to position the caret in front of
     * @example
     *    selection.setBefore(myElement);
     */
    setBefore: function(node) {
      var range = rangy.createRange(this.doc);
      range.setStartBefore(node);
      range.setEndBefore(node);
      return this.setSelection(range);
    },

    // Constructs a self removing whitespace (ain absolute positioned span) for placing selection caret when normal methods fail.
    // Webkit has an issue with placing caret into places where there are no textnodes near by.
    createTemporaryCaretSpaceAfter: function (node) {
      var caretPlaceholder = this.doc.createElement('span'),
          caretPlaceholderText = this.doc.createTextNode(wysihtml5.INVISIBLE_SPACE),
          placeholderRemover = (function(event) {
            // Self-destructs the caret and keeps the text inserted into it by user
            var lastChild;

            this.contain.removeEventListener('mouseup', placeholderRemover);
            this.contain.removeEventListener('keydown', keyDownHandler);
            this.contain.removeEventListener('touchstart', placeholderRemover);
            this.contain.removeEventListener('focus', placeholderRemover);
            this.contain.removeEventListener('blur', placeholderRemover);
            this.contain.removeEventListener('paste', delayedPlaceholderRemover);
            this.contain.removeEventListener('drop', delayedPlaceholderRemover);
            this.contain.removeEventListener('beforepaste', delayedPlaceholderRemover);

            // If user inserted sth it is in the placeholder and sgould be unwrapped and stripped of invisible whitespace hack
            // Otherwise the wrapper can just be removed
            if (caretPlaceholder && caretPlaceholder.parentNode) {
              caretPlaceholder.innerHTML = caretPlaceholder.innerHTML.replace(wysihtml5.INVISIBLE_SPACE_REG_EXP, "");
              if ((/[^\s]+/).test(caretPlaceholder.innerHTML)) {
                lastChild = caretPlaceholder.lastChild;
                wysihtml5.dom.unwrap(caretPlaceholder);
                this.setAfter(lastChild);
              } else {
                caretPlaceholder.parentNode.removeChild(caretPlaceholder);
              }

            }
          }).bind(this),
          delayedPlaceholderRemover = function (event) {
            if (caretPlaceholder && caretPlaceholder.parentNode) {
              setTimeout(placeholderRemover, 0);
            }
          },
          keyDownHandler = function(event) {
            if (event.which !== 8 && event.which !== 91 && event.which !== 17 && (event.which !== 86 || (!event.ctrlKey && !event.metaKey))) {
              placeholderRemover();
            }
          };

      caretPlaceholder.className = '_wysihtml5-temp-caret-fix';
      caretPlaceholder.style.position = 'absolute';
      caretPlaceholder.style.display = 'block';
      caretPlaceholder.style.minWidth = '1px';
      caretPlaceholder.style.zIndex = '99999';
      caretPlaceholder.appendChild(caretPlaceholderText);

      node.parentNode.insertBefore(caretPlaceholder, node.nextSibling);
      this.setBefore(caretPlaceholderText);

      // Remove the caret fix on any of the following events (some are delayed as content change happens after event)
      this.contain.addEventListener('mouseup', placeholderRemover);
      this.contain.addEventListener('keydown', keyDownHandler);
      this.contain.addEventListener('touchstart', placeholderRemover);
      this.contain.addEventListener('focus', placeholderRemover);
      this.contain.addEventListener('blur', placeholderRemover);
      this.contain.addEventListener('paste', delayedPlaceholderRemover);
      this.contain.addEventListener('drop', delayedPlaceholderRemover);
      this.contain.addEventListener('beforepaste', delayedPlaceholderRemover);

      return caretPlaceholder;
    },

    /**
     * Set the caret after the given node
     *
     * @param {Object} node The element or text node where to position the caret in front of
     * @example
     *    selection.setBefore(myElement);
     * callback is an optional parameter accepting a function to execute when selection ahs been set
     */
    setAfter: function(node, notVisual, callback) {
      var win = this.win,
          range = rangy.createRange(this.doc),
          fixWebkitSelection = function() {
            // Webkit fails to add selection if there are no textnodes in that region
            // (like an uneditable container at the end of content).
            var parent = node.parentNode,
                lastSibling = parent ? parent.childNodes[parent.childNodes.length - 1] : null;

            if (!sel || (lastSibling === node && node.nodeType === 1 && win.getComputedStyle(node).display === "block")) {
              if (notVisual) {
                // If setAfter is used as internal between actions, self-removing caretPlaceholder has simpler implementation
                // and remove itself in call stack end instead on user interaction
                var caretPlaceholder = this.doc.createTextNode(wysihtml5.INVISIBLE_SPACE);
                node.parentNode.insertBefore(caretPlaceholder, node.nextSibling);
                this.selectNode(caretPlaceholder);
                setTimeout(function() {
                  if (caretPlaceholder && caretPlaceholder.parentNode) {
                    caretPlaceholder.parentNode.removeChild(caretPlaceholder);
                  }
                }, 0);
              } else {
                this.createTemporaryCaretSpaceAfter(node);
              }
            }
          }.bind(this),
          sel;

      range.setStartAfter(node);
      range.setEndAfter(node);

      // In IE contenteditable must be focused before we can set selection
      // thus setting the focus if activeElement is not this composer
      if (!document.activeElement || document.activeElement !== this.composer.element) {
        var scrollPos = this.composer.getScrollPos();
        this.composer.element.focus();
        this.composer.setScrollPos(scrollPos);
        setTimeout(function() {
          sel = this.setSelection(range);
          fixWebkitSelection();
          if (callback) {
            callback(sel);
          }
        }.bind(this), 0);
      } else {
        sel = this.setSelection(range);
        fixWebkitSelection();
        if (callback) {
          callback(sel);
        }
      }
    },

    /**
     * Ability to select/mark nodes
     *
     * @param {Element} node The node/element to select
     * @example
     *    selection.selectNode(document.getElementById("my-image"));
     */
    selectNode: function(node, avoidInvisibleSpace) {
      var range           = rangy.createRange(this.doc),
          isElement       = node.nodeType === wysihtml5.ELEMENT_NODE,
          canHaveHTML     = "canHaveHTML" in node ? node.canHaveHTML : (node.nodeName !== "IMG"),
          content         = isElement ? node.innerHTML : node.data,
          isEmpty         = (content === "" || content === wysihtml5.INVISIBLE_SPACE),
          displayStyle    = dom.getStyle("display").from(node),
          isBlockElement  = (displayStyle === "block" || displayStyle === "list-item");

      if (isEmpty && isElement && canHaveHTML && !avoidInvisibleSpace) {
        // Make sure that caret is visible in node by inserting a zero width no breaking space
        try { node.innerHTML = wysihtml5.INVISIBLE_SPACE; } catch(e) {}
      }
      if (canHaveHTML) {
        range.selectNodeContents(node);
      } else {
        range.selectNode(node);
      }

      if (canHaveHTML && isEmpty && isElement) {
        range.collapse(isBlockElement);
      } else if (canHaveHTML && isEmpty) {
        range.setStartAfter(node);
        range.setEndAfter(node);
      }

      this.setSelection(range);
    },

    /**
     * Get the node which contains the selection
     *
     * @param {Boolean} [controlRange] (only IE) Whether it should return the selected ControlRange element when the selection type is a "ControlRange"
     * @return {Object} The node that contains the caret
     * @example
     *    var nodeThatContainsCaret = selection.getSelectedNode();
     */
    getSelectedNode: function(controlRange) {
      var selection,
          range;

      if (controlRange && this.doc.selection && this.doc.selection.type === "Control") {
        range = this.doc.selection.createRange();
        if (range && range.length) {
          return range.item(0);
        }
      }

      selection = this.getSelection(this.doc);
      if (selection.focusNode === selection.anchorNode) {
        return selection.focusNode;
      } else {
        range = this.getRange(this.doc);
        return range ? range.commonAncestorContainer : this.doc.body;
      }
    },

    fixSelBorders: function() {
      var range = this.getRange();
      expandRangeToSurround(range);
      this.setSelection(range);
    },

    getSelectedOwnNodes: function(controlRange) {
      var selection,
          ranges = this.getOwnRanges(),
          ownNodes = [];

      for (var i = 0, maxi = ranges.length; i < maxi; i++) {
          ownNodes.push(ranges[i].commonAncestorContainer || this.doc.body);
      }
      return ownNodes;
    },

    findNodesInSelection: function(nodeTypes) {
      var ranges = this.getOwnRanges(),
          nodes = [], curNodes;
      for (var i = 0, maxi = ranges.length; i < maxi; i++) {
        curNodes = ranges[i].getNodes([1], function(node) {
            return wysihtml5.lang.array(nodeTypes).contains(node.nodeName);
        });
        nodes = nodes.concat(curNodes);
      }
      return nodes;
    },

    filterElements: function(filter) {
      var ranges = this.getOwnRanges(),
          nodes = [], curNodes;

      for (var i = 0, maxi = ranges.length; i < maxi; i++) {
        curNodes = ranges[i].getNodes([1], function(element){
          return filter(element, ranges[i]);
        });
        nodes = nodes.concat(curNodes);
      }
      return nodes;
    },

    containsUneditable: function() {
      var uneditables = this.getOwnUneditables(),
          selection = this.getSelection();

      for (var i = 0, maxi = uneditables.length; i < maxi; i++) {
        if (selection.containsNode(uneditables[i])) {
          return true;
        }
      }

      return false;
    },

    // Deletes selection contents making sure uneditables/unselectables are not partially deleted
    // Triggers wysihtml5:uneditable:delete custom event on all deleted uneditables if customevents suppoorted
    deleteContents: function()  {
      var range = this.getRange(),
          startParent, endParent, uneditables, ev;

      if (this.unselectableClass) {
        if ((startParent = wysihtml5.dom.getParentElement(range.startContainer, { query: "." + this.unselectableClass }, false, this.contain))) {
          range.setStartBefore(startParent);
        }
        if ((endParent = wysihtml5.dom.getParentElement(range.endContainer, { query: "." + this.unselectableClass }, false, this.contain))) {
          range.setEndAfter(endParent);
        }

        // If customevents present notify uneditable elements of being deleted
        uneditables = range.getNodes([1], (function (node) {
          return wysihtml5.dom.hasClass(node, this.unselectableClass);
        }).bind(this));
        for (var i = uneditables.length; i--;) {
          try {
            ev = new CustomEvent("wysihtml5:uneditable:delete");
            uneditables[i].dispatchEvent(ev);
          } catch (err) {}
        }

      }
      range.deleteContents();
      this.setSelection(range);
    },

    getPreviousNode: function(node, ignoreEmpty) {
      var displayStyle;
      if (!node) {
        var selection = this.getSelection();
        node = selection.anchorNode;
      }

      if (node === this.contain) {
          return false;
      }

      var ret = node.previousSibling,
          parent;

      if (ret === this.contain) {
          return false;
      }

      if (ret && ret.nodeType !== 3 && ret.nodeType !== 1) {
         // do not count comments and other node types
         ret = this.getPreviousNode(ret, ignoreEmpty);
      } else if (ret && ret.nodeType === 3 && (/^\s*$/).test(ret.textContent)) {
        // do not count empty textnodes as previous nodes
        ret = this.getPreviousNode(ret, ignoreEmpty);
      } else if (ignoreEmpty && ret && ret.nodeType === 1) {
        // Do not count empty nodes if param set.
        // Contenteditable tends to bypass and delete these silently when deleting with caret when element is inline-like
        displayStyle = wysihtml5.dom.getStyle("display").from(ret);
        if (
            !wysihtml5.lang.array(["BR", "HR", "IMG"]).contains(ret.nodeName) &&
            !wysihtml5.lang.array(["block", "inline-block", "flex", "list-item", "table"]).contains(displayStyle) &&
            (/^[\s]*$/).test(ret.innerHTML)
          ) {
            ret = this.getPreviousNode(ret, ignoreEmpty);
          }
      } else if (!ret && node !== this.contain) {
        parent = node.parentNode;
        if (parent !== this.contain) {
            ret = this.getPreviousNode(parent, ignoreEmpty);
        }
      }

      return (ret !== this.contain) ? ret : false;
    },

    getSelectionParentsByTag: function(tagName) {
      var nodes = this.getSelectedOwnNodes(),
          curEl, parents = [];

      for (var i = 0, maxi = nodes.length; i < maxi; i++) {
        curEl = (nodes[i].nodeName &&  nodes[i].nodeName === 'LI') ? nodes[i] : wysihtml5.dom.getParentElement(nodes[i], { query: 'li'}, false, this.contain);
        if (curEl) {
          parents.push(curEl);
        }
      }
      return (parents.length) ? parents : null;
    },

    getRangeToNodeEnd: function() {
      if (this.isCollapsed()) {
        var range = this.getRange(),
            sNode = range.startContainer,
            pos = range.startOffset,
            lastR = rangy.createRange(this.doc);

        lastR.selectNodeContents(sNode);
        lastR.setStart(sNode, pos);
        return lastR;
      }
    },

    caretIsLastInSelection: function() {
      var r = rangy.createRange(this.doc),
          s = this.getSelection(),
          endc = this.getRangeToNodeEnd().cloneContents(),
          endtxt = endc.textContent;

      return (/^\s*$/).test(endtxt);
    },

    caretIsFirstInSelection: function() {
      var r = rangy.createRange(this.doc),
          s = this.getSelection(),
          range = this.getRange(),
          startNode = range.startContainer;

      if (startNode) {
        if (startNode.nodeType === wysihtml5.TEXT_NODE) {
          return this.isCollapsed() && (startNode.nodeType === wysihtml5.TEXT_NODE && (/^\s*$/).test(startNode.data.substr(0,range.startOffset)));
        } else {
          r.selectNodeContents(this.getRange().commonAncestorContainer);
          r.collapse(true);
          return (this.isCollapsed() && (r.startContainer === s.anchorNode || r.endContainer === s.anchorNode) && r.startOffset === s.anchorOffset);
        }
      }
    },

    caretIsInTheBeginnig: function(ofNode) {
        var selection = this.getSelection(),
            node = selection.anchorNode,
            offset = selection.anchorOffset;
        if (ofNode && node) {
          return (offset === 0 && (node.nodeName && node.nodeName === ofNode.toUpperCase() || wysihtml5.dom.getParentElement(node.parentNode, { query: ofNode }, 1)));
        } else if (node) {
          return (offset === 0 && !this.getPreviousNode(node, true));
        }
    },

    // Returns object describing node/text before selection
    // If includePrevLeaves is true returns  also previous last leaf child if selection is in the beginning of current node
    getBeforeSelection: function(includePrevLeaves) {
      var sel = this.getSelection(),
          startNode = (sel.isBackwards()) ? sel.focusNode : sel.anchorNode,
          startOffset = (sel.isBackwards()) ? sel.focusOffset : sel.anchorOffset,
          rng = this.createRange(), endNode, inTmpCaret;

      // Escape temproray helper nodes if selection in them
      inTmpCaret = wysihtml5.dom.getParentElement(startNode, { query: '._wysihtml5-temp-caret-fix' }, 1);
      if (inTmpCaret) {
        startNode = inTmpCaret.parentNode;
        startOffset = Array.prototype.indexOf.call(startNode.childNodes, inTmpCaret);
      }

      if (startNode) {
        if (startOffset > 0) {
          if (startNode.nodeType === 3) {
            rng.setStart(startNode, 0);
            rng.setEnd(startNode, startOffset);
            return {
              type: "text",
              range: rng,
              offset : startOffset,
              node: startNode
            };
          } else {
            rng.setStartBefore(startNode.childNodes[0]);
            endNode = startNode.childNodes[startOffset - 1];
            rng.setEndAfter(endNode);
            return {
              type: "element",
              range: rng,
              offset : startOffset,
              node: endNode
            };
          }
        } else {
          rng.setStartAndEnd(startNode, 0);

          if (includePrevLeaves) {
            var prevNode = this.getPreviousNode(startNode, true),
                prevLeaf = null;

            if(prevNode) {
              if (prevNode.nodeType === 1 && wysihtml5.dom.hasClass(prevNode, this.unselectableClass)) {
                prevLeaf = prevNode;
              } else {
                prevLeaf = wysihtml5.dom.domNode(prevNode).lastLeafNode();
              }
            }

            if (prevLeaf) {
              return {
                type: "leafnode",
                range: rng,
                offset : startOffset,
                node: prevLeaf
              };
            }
          }

          return {
            type: "none",
            range: rng,
            offset : startOffset,
            node: startNode
          };
        }
      }
      return null;
    },

    // TODO: Figure out a method from following 2 that would work universally
    executeAndRestoreRangy: function(method, restoreScrollPosition) {
      var sel = rangy.saveSelection(this.win);
      if (!sel) {
        method();
      } else {
        try {
          method();
        } catch(e) {
          setTimeout(function() { throw e; }, 0);
        }
      }
      rangy.restoreSelection(sel);
    },

    // TODO: has problems in chrome 12. investigate block level and uneditable area inbetween
    executeAndRestore: function(method, restoreScrollPosition) {
      var body                  = this.doc.body,
          oldScrollTop          = restoreScrollPosition && body.scrollTop,
          oldScrollLeft         = restoreScrollPosition && body.scrollLeft,
          className             = "_wysihtml5-temp-placeholder",
          placeholderHtml       = '<span class="' + className + '">' + wysihtml5.INVISIBLE_SPACE + '</span>',
          range                 = this.getRange(true),
          caretPlaceholder,
          newCaretPlaceholder,
          nextSibling, prevSibling,
          node, node2, range2,
          newRange;

      // Nothing selected, execute and say goodbye
      if (!range) {
        method(body, body);
        return;
      }

      if (!range.collapsed) {
        range2 = range.cloneRange();
        node2 = range2.createContextualFragment(placeholderHtml);
        range2.collapse(false);
        range2.insertNode(node2);
        range2.detach();
      }

      node = range.createContextualFragment(placeholderHtml);
      range.insertNode(node);

      if (node2) {
        caretPlaceholder = this.contain.querySelectorAll("." + className);
        range.setStartBefore(caretPlaceholder[0]);
        range.setEndAfter(caretPlaceholder[caretPlaceholder.length -1]);
      }
      this.setSelection(range);

      // Make sure that a potential error doesn't cause our placeholder element to be left as a placeholder
      try {
        method(range.startContainer, range.endContainer);
      } catch(e) {
        setTimeout(function() { throw e; }, 0);
      }
      caretPlaceholder = this.contain.querySelectorAll("." + className);
      if (caretPlaceholder && caretPlaceholder.length) {
        newRange = rangy.createRange(this.doc);
        nextSibling = caretPlaceholder[0].nextSibling;
        if (caretPlaceholder.length > 1) {
          prevSibling = caretPlaceholder[caretPlaceholder.length -1].previousSibling;
        }
        if (prevSibling && nextSibling) {
          newRange.setStartBefore(nextSibling);
          newRange.setEndAfter(prevSibling);
        } else {
          newCaretPlaceholder = this.doc.createTextNode(wysihtml5.INVISIBLE_SPACE);
          dom.insert(newCaretPlaceholder).after(caretPlaceholder[0]);
          newRange.setStartBefore(newCaretPlaceholder);
          newRange.setEndAfter(newCaretPlaceholder);
        }
        this.setSelection(newRange);
        for (var i = caretPlaceholder.length; i--;) {
          caretPlaceholder[i].parentNode.removeChild(caretPlaceholder[i]);
        }

      } else {
        // fallback for when all hell breaks loose
        this.contain.focus();
      }

      if (restoreScrollPosition) {
        body.scrollTop  = oldScrollTop;
        body.scrollLeft = oldScrollLeft;
      }

      // Remove it again, just to make sure that the placeholder is definitely out of the dom tree
      try {
        caretPlaceholder.parentNode.removeChild(caretPlaceholder);
      } catch(e2) {}
    },

    set: function(node, offset) {
      var newRange = rangy.createRange(this.doc);
      newRange.setStart(node, offset || 0);
      this.setSelection(newRange);
    },

    /**
     * Insert html at the caret position and move the cursor after the inserted html
     *
     * @param {String} html HTML string to insert
     * @example
     *    selection.insertHTML("<p>foobar</p>");
     */
    insertHTML: function(html) {
      var range     = rangy.createRange(this.doc),
          node = this.doc.createElement('DIV'),
          fragment = this.doc.createDocumentFragment(),
          lastChild;

      node.innerHTML = html;
      lastChild = node.lastChild;

      while (node.firstChild) {
        fragment.appendChild(node.firstChild);
      }
      this.insertNode(fragment);

      if (lastChild) {
        this.setAfter(lastChild);
      }
    },

    /**
     * Insert a node at the caret position and move the cursor behind it
     *
     * @param {Object} node HTML string to insert
     * @example
     *    selection.insertNode(document.createTextNode("foobar"));
     */
    insertNode: function(node) {
      var range = this.getRange();
      if (range) {
        range.insertNode(node);
      }
    },

    canAppendChild: function (node) {
      var anchorNode, anchorNodeTagNameLower,
          voidElements = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"],
          range = this.getRange();

      anchorNode = node || range.startContainer;

      if (anchorNode) {
        anchorNodeTagNameLower = (anchorNode.tagName || anchorNode.nodeName).toLowerCase();
      }

      return voidElements.indexOf(anchorNodeTagNameLower) === -1;
    },

    splitElementAtCaret: function (element, insertNode) {
      var sel = this.getSelection(),
          range, contentAfterRangeStart,
          firstChild, lastChild, childNodes;

      if (sel.rangeCount > 0) {
        range = sel.getRangeAt(0).cloneRange(); // Create a copy of the selection range to work with

        range.setEndAfter(element); // Place the end of the range after the element
        contentAfterRangeStart = range.extractContents(); // Extract the contents of the element after the caret into a fragment

        childNodes = contentAfterRangeStart.childNodes;

        // Empty elements are cleaned up from extracted content
        for (var i = childNodes.length; i --;) {
          if (!wysihtml5.dom.domNode(childNodes[i]).is.visible()) {
            contentAfterRangeStart.removeChild(childNodes[i]);
          }
        }

        element.parentNode.insertBefore(contentAfterRangeStart, element.nextSibling);

        if (insertNode) {
          firstChild = insertNode.firstChild || insertNode;
          lastChild = insertNode.lastChild || insertNode;

          element.parentNode.insertBefore(insertNode, element.nextSibling);

          // Select inserted node contents
          if (firstChild && lastChild) {
             range.setStartBefore(firstChild);
             range.setEndAfter(lastChild);
             this.setSelection(range);
          }
        } else {
          range.setStartAfter(element);
          range.setEndAfter(element);
        }

        if (!wysihtml5.dom.domNode(element).is.visible()) {
          if (wysihtml5.dom.getTextContent(element) === '') {
            element.parentNode.removeChild(element);
          } else {
            element.parentNode.replaceChild(this.doc.createTextNode(" "), element);
          }
        }


      }
    },

    /**
     * Wraps current selection with the given node
     *
     * @param {Object} node The node to surround the selected elements with
     */
    surround: function(nodeOptions) {
      var ranges = this.getOwnRanges(),
          node, nodes = [];
      if (ranges.length == 0) {
        return nodes;
      }

      for (var i = ranges.length; i--;) {
        node = this.doc.createElement(nodeOptions.nodeName);
        nodes.push(node);
        if (nodeOptions.className) {
          node.className = nodeOptions.className;
        }
        if (nodeOptions.cssStyle) {
          node.setAttribute('style', nodeOptions.cssStyle);
        }
        try {
          // This only works when the range boundaries are not overlapping other elements
          ranges[i].surroundContents(node);
          this.selectNode(node);
        } catch(e) {
          // fallback
          node.appendChild(ranges[i].extractContents());
          ranges[i].insertNode(node);
        }
      }
      return nodes;
    },

    deblockAndSurround: function(nodeOptions) {
      var tempElement = this.doc.createElement('div'),
          range = rangy.createRange(this.doc),
          tempDivElements,
          tempElements,
          firstChild;

      tempElement.className = nodeOptions.className;

      this.composer.commands.exec("formatBlock", nodeOptions);
      tempDivElements = this.contain.querySelectorAll("." + nodeOptions.className);
      if (tempDivElements[0]) {
        tempDivElements[0].parentNode.insertBefore(tempElement, tempDivElements[0]);

        range.setStartBefore(tempDivElements[0]);
        range.setEndAfter(tempDivElements[tempDivElements.length - 1]);
        tempElements = range.extractContents();

        while (tempElements.firstChild) {
          firstChild = tempElements.firstChild;
          if (firstChild.nodeType == 1 && wysihtml5.dom.hasClass(firstChild, nodeOptions.className)) {
            while (firstChild.firstChild) {
              tempElement.appendChild(firstChild.firstChild);
            }
            if (firstChild.nodeName !== "BR") { tempElement.appendChild(this.doc.createElement('br')); }
            tempElements.removeChild(firstChild);
          } else {
            tempElement.appendChild(firstChild);
          }
        }
      } else {
        tempElement = null;
      }

      return tempElement;
    },

    /**
     * Scroll the current caret position into the view
     * FIXME: This is a bit hacky, there might be a smarter way of doing this
     *
     * @example
     *    selection.scrollIntoView();
     */
    scrollIntoView: function() {
      var doc           = this.doc,
          tolerance     = 5, // px
          hasScrollBars = doc.documentElement.scrollHeight > doc.documentElement.offsetHeight,
          tempElement   = doc._wysihtml5ScrollIntoViewElement = doc._wysihtml5ScrollIntoViewElement || (function() {
            var element = doc.createElement("span");
            // The element needs content in order to be able to calculate it's position properly
            element.innerHTML = wysihtml5.INVISIBLE_SPACE;
            return element;
          })(),
          offsetTop;

      if (hasScrollBars) {
        this.insertNode(tempElement);
        offsetTop = _getCumulativeOffsetTop(tempElement);
        tempElement.parentNode.removeChild(tempElement);
        if (offsetTop >= (doc.body.scrollTop + doc.documentElement.offsetHeight - tolerance)) {
          doc.body.scrollTop = offsetTop;
        }
      }
    },

    /**
     * Select line where the caret is in
     */
    selectLine: function() {
      if (wysihtml5.browser.supportsSelectionModify()) {
        this._selectLine_W3C();
      } else if (this.doc.selection) {
        this._selectLine_MSIE();
      }
    },

    /**
     * See https://developer.mozilla.org/en/DOM/Selection/modify
     */
    _selectLine_W3C: function() {
      var selection = this.win.getSelection();
      selection.modify("move", "left", "lineboundary");
      selection.modify("extend", "right", "lineboundary");
    },

    // collapses selection to current line beginning or end
    toLineBoundary: function (location, collapse) {
      collapse = (typeof collapse === 'undefined') ? false : collapse;
      if (wysihtml5.browser.supportsSelectionModify()) {
        var selection = this.win.getSelection();

        selection.modify("extend", location, "lineboundary");
        if (collapse) {
          if (location === "left") {
            selection.collapseToStart();
          } else if (location === "right") {
            selection.collapseToEnd();
          }
        }
      }
    },

    _selectLine_MSIE: function() {
      var range       = this.doc.selection.createRange(),
          rangeTop    = range.boundingTop,
          scrollWidth = this.doc.body.scrollWidth,
          rangeBottom,
          rangeEnd,
          measureNode,
          i,
          j;

      if (!range.moveToPoint) {
        return;
      }

      if (rangeTop === 0) {
        // Don't know why, but when the selection ends at the end of a line
        // range.boundingTop is 0
        measureNode = this.doc.createElement("span");
        this.insertNode(measureNode);
        rangeTop = measureNode.offsetTop;
        measureNode.parentNode.removeChild(measureNode);
      }

      rangeTop += 1;

      for (i=-10; i<scrollWidth; i+=2) {
        try {
          range.moveToPoint(i, rangeTop);
          break;
        } catch(e1) {}
      }

      // Investigate the following in order to handle multi line selections
      // rangeBottom = rangeTop + (rangeHeight ? (rangeHeight - 1) : 0);
      rangeBottom = rangeTop;
      rangeEnd = this.doc.selection.createRange();
      for (j=scrollWidth; j>=0; j--) {
        try {
          rangeEnd.moveToPoint(j, rangeBottom);
          break;
        } catch(e2) {}
      }

      range.setEndPoint("EndToEnd", rangeEnd);
      range.select();
    },

    getText: function() {
      var selection = this.getSelection();
      return selection ? selection.toString() : "";
    },

    getNodes: function(nodeType, filter) {
      var range = this.getRange();
      if (range) {
        return range.getNodes(Array.isArray(nodeType) ? nodeType : [nodeType], filter);
      } else {
        return [];
      }
    },

    // Gets all the elements in selection with nodeType
    // Ignores the elements not belonging to current editable area
    // If filter is defined nodes must pass the filter function with true to be included in list
    getOwnNodes: function(nodeType, filter, splitBounds) {
      var ranges = this.getOwnRanges(),
          nodes = [];
      for (var r = 0, rmax = ranges.length; r < rmax; r++) {
        if (ranges[r]) {
          if (splitBounds) {
            ranges[r].splitBoundaries();
          }
          nodes = nodes.concat(ranges[r].getNodes(Array.isArray(nodeType) ? nodeType : [nodeType], filter));
        }
      }

      return nodes;
    },

    fixRangeOverflow: function(range) {
      if (this.contain && this.contain.firstChild && range) {
        var containment = range.compareNode(this.contain);
        if (containment !== 2) {
          if (containment === 1) {
            range.setStartBefore(this.contain.firstChild);
          }
          if (containment === 0) {
            range.setEndAfter(this.contain.lastChild);
          }
          if (containment === 3) {
            range.setStartBefore(this.contain.firstChild);
            range.setEndAfter(this.contain.lastChild);
          }
        } else if (this._detectInlineRangeProblems(range)) {
          var previousElementSibling = range.endContainer.previousElementSibling;
          if (previousElementSibling) {
            range.setEnd(previousElementSibling, this._endOffsetForNode(previousElementSibling));
          }
        }
      }
    },

    _endOffsetForNode: function(node) {
      var range = document.createRange();
      range.selectNodeContents(node);
      return range.endOffset;
    },

    _detectInlineRangeProblems: function(range) {
      var position = dom.compareDocumentPosition(range.startContainer, range.endContainer);
      return (
        range.endOffset == 0 &&
        position & 4 //Node.DOCUMENT_POSITION_FOLLOWING
      );
    },

    getRange: function(dontFix) {
      var selection = this.getSelection(),
          range = selection && selection.rangeCount && selection.getRangeAt(0);

      if (dontFix !== true) {
        this.fixRangeOverflow(range);
      }

      return range;
    },

    getOwnUneditables: function() {
      var allUneditables = dom.query(this.contain, '.' + this.unselectableClass),
          deepUneditables = dom.query(allUneditables, '.' + this.unselectableClass);

      return wysihtml5.lang.array(allUneditables).without(deepUneditables);
    },

    // Returns an array of ranges that belong only to this editable
    // Needed as uneditable block in contenteditabel can split range into pieces
    // If manipulating content reverse loop is usually needed as manipulation can shift subsequent ranges
    getOwnRanges: function()  {
      var ranges = [],
          r = this.getRange(),
          tmpRanges;

      if (r) { ranges.push(r); }

      if (this.unselectableClass && this.contain && r) {
        var uneditables = this.getOwnUneditables(),
            tmpRange;
        if (uneditables.length > 0) {
          for (var i = 0, imax = uneditables.length; i < imax; i++) {
            tmpRanges = [];
            for (var j = 0, jmax = ranges.length; j < jmax; j++) {
              if (ranges[j]) {
                switch (ranges[j].compareNode(uneditables[i])) {
                  case 2:
                    // all selection inside uneditable. remove
                  break;
                  case 3:
                    //section begins before and ends after uneditable. spilt
                    tmpRange = ranges[j].cloneRange();
                    tmpRange.setEndBefore(uneditables[i]);
                    tmpRanges.push(tmpRange);

                    tmpRange = ranges[j].cloneRange();
                    tmpRange.setStartAfter(uneditables[i]);
                    tmpRanges.push(tmpRange);
                  break;
                  default:
                    // in all other cases uneditable does not touch selection. dont modify
                    tmpRanges.push(ranges[j]);
                }
              }
              ranges = tmpRanges;
            }
          }
        }
      }
      return ranges;
    },

    getSelection: function() {
      return rangy.getSelection(this.win);
    },

    // Sets selection in document to a given range
    // Set selection method detects if it fails to set any selection in document and returns null on fail
    // (especially needed in webkit where some ranges just can not create selection for no reason)
    setSelection: function(range) {
      var selection = rangy.getSelection(this.win);
      selection.setSingleRange(range);
      return (selection && selection.anchorNode && selection.focusNode) ? selection : null;
    },



    // Webkit has an ancient error of not selecting all contents when uneditable block element is first or last in editable area
    selectAll: function() {
      var range = this.createRange(),
          composer = this.composer,
          that = this,
          blankEndNode = getWebkitSelectionFixNode(this.composer.element),
          blankStartNode = getWebkitSelectionFixNode(this.composer.element),
          s;

      var doSelect = function() {
        range.setStart(composer.element, 0);
        range.setEnd(composer.element, composer.element.childNodes.length);
        s = that.setSelection(range);
      };

      var notSelected = function() {
        return !s || (s.nativeSelection && s.nativeSelection.type && (s.nativeSelection.type === "Caret" || s.nativeSelection.type === "None"));
      }

      wysihtml5.dom.removeInvisibleSpaces(this.composer.element);
      doSelect();
      
      if (this.composer.element.firstChild && notSelected())  {
        // Try fixing end
        this.composer.element.appendChild(blankEndNode);
        doSelect();

        if (notSelected()) {
          // Remove end fix
          blankEndNode.parentNode.removeChild(blankEndNode);
          
          // Try fixing beginning
          this.composer.element.insertBefore(blankStartNode, this.composer.element.firstChild);
          doSelect();
          
          if (notSelected()) {
            // Try fixing both
            this.composer.element.appendChild(blankEndNode);
            doSelect();
          }
        }
      }
    },

    createRange: function() {
      return rangy.createRange(this.doc);
    },

    isCollapsed: function() {
        return this.getSelection().isCollapsed;
    },

    getHtml: function() {
      return this.getSelection().toHtml();
    },

    getPlainText: function () {
      return this.getSelection().toString();
    },

    isEndToEndInNode: function(nodeNames) {
      var range = this.getRange(),
          parentElement = range.commonAncestorContainer,
          startNode = range.startContainer,
          endNode = range.endContainer;


        if (parentElement.nodeType === wysihtml5.TEXT_NODE) {
          parentElement = parentElement.parentNode;
        }

        if (startNode.nodeType === wysihtml5.TEXT_NODE && !(/^\s*$/).test(startNode.data.substr(range.startOffset))) {
          return false;
        }

        if (endNode.nodeType === wysihtml5.TEXT_NODE && !(/^\s*$/).test(endNode.data.substr(range.endOffset))) {
          return false;
        }

        while (startNode && startNode !== parentElement) {
          if (startNode.nodeType !== wysihtml5.TEXT_NODE && !wysihtml5.dom.contains(parentElement, startNode)) {
            return false;
          }
          if (wysihtml5.dom.domNode(startNode).prev({ignoreBlankTexts: true})) {
            return false;
          }
          startNode = startNode.parentNode;
        }

        while (endNode && endNode !== parentElement) {
          if (endNode.nodeType !== wysihtml5.TEXT_NODE && !wysihtml5.dom.contains(parentElement, endNode)) {
            return false;
          }
          if (wysihtml5.dom.domNode(endNode).next({ignoreBlankTexts: true})) {
            return false;
          }
          endNode = endNode.parentNode;
        }

        return (wysihtml5.lang.array(nodeNames).contains(parentElement.nodeName)) ? parentElement : false;
    },

    isInThisEditable: function() {
      var sel = this.getSelection(),
          fnode = sel.focusNode,
          anode = sel.anchorNode;

      // In IE node contains will not work for textnodes, thus taking parentNode
      if (fnode && fnode.nodeType !== 1) {
        fnode = fnode.parentNode;
      }

      if (anode && anode.nodeType !== 1) {
        anode = anode.parentNode;
      }

      return anode && fnode &&
             (wysihtml5.dom.contains(this.composer.element, fnode) || this.composer.element === fnode) &&
             (wysihtml5.dom.contains(this.composer.element, anode) || this.composer.element === anode);
    },

    deselect: function() {
      var sel = this.getSelection();
      sel && sel.removeAllRanges();
    }
  });

})(wysihtml5);
;/**
 * Inspired by the rangy CSS Applier module written by Tim Down and licensed under the MIT license.
 * http://code.google.com/p/rangy/
 *
 * changed in order to be able ...
 *    - to use custom tags
 *    - to detect and replace similar css classes via reg exp
 */
(function(wysihtml5, rangy) {
  var defaultTagName = "span";

  var REG_EXP_WHITE_SPACE = /\s+/g;

  function hasClass(el, cssClass, regExp) {
    if (!el.className) {
      return false;
    }

    var matchingClassNames = el.className.match(regExp) || [];
    return matchingClassNames[matchingClassNames.length - 1] === cssClass;
  }

  function hasStyleAttr(el, regExp) {
    if (!el.getAttribute || !el.getAttribute('style')) {
      return false;
    }
    var matchingStyles = el.getAttribute('style').match(regExp);
    return  (el.getAttribute('style').match(regExp)) ? true : false;
  }

  function addStyle(el, cssStyle, regExp) {
    if (el.getAttribute('style')) {
      removeStyle(el, regExp);
      if (el.getAttribute('style') && !(/^\s*$/).test(el.getAttribute('style'))) {
        el.setAttribute('style', cssStyle + ";" + el.getAttribute('style'));
      } else {
        el.setAttribute('style', cssStyle);
      }
    } else {
      el.setAttribute('style', cssStyle);
    }
  }

  function addClass(el, cssClass, regExp) {
    if (el.className) {
      removeClass(el, regExp);
      el.className += " " + cssClass;
    } else {
      el.className = cssClass;
    }
  }

  function removeClass(el, regExp) {
    if (el.className) {
      el.className = el.className.replace(regExp, "");
    }
  }

  function removeStyle(el, regExp) {
    var s,
        s2 = [];
    if (el.getAttribute('style')) {
      s = el.getAttribute('style').split(';');
      for (var i = s.length; i--;) {
        if (!s[i].match(regExp) && !(/^\s*$/).test(s[i])) {
          s2.push(s[i]);
        }
      }
      if (s2.length) {
        el.setAttribute('style', s2.join(';'));
      } else {
        el.removeAttribute('style');
      }
    }
  }

  function getMatchingStyleRegexp(el, style) {
    var regexes = [],
        sSplit = style.split(';'),
        elStyle = el.getAttribute('style');

    if (elStyle) {
      elStyle = elStyle.replace(/\s/gi, '').toLowerCase();
      regexes.push(new RegExp("(^|\\s|;)" + style.replace(/\s/gi, '').replace(/([\(\)])/gi, "\\$1").toLowerCase().replace(";", ";?").replace(/rgb\\\((\d+),(\d+),(\d+)\\\)/gi, "\\s?rgb\\($1,\\s?$2,\\s?$3\\)"), "gi"));

      for (var i = sSplit.length; i-- > 0;) {
        if (!(/^\s*$/).test(sSplit[i])) {
          regexes.push(new RegExp("(^|\\s|;)" + sSplit[i].replace(/\s/gi, '').replace(/([\(\)])/gi, "\\$1").toLowerCase().replace(";", ";?").replace(/rgb\\\((\d+),(\d+),(\d+)\\\)/gi, "\\s?rgb\\($1,\\s?$2,\\s?$3\\)"), "gi"));
        }
      }
      for (var j = 0, jmax = regexes.length; j < jmax; j++) {
        if (elStyle.match(regexes[j])) {
          return regexes[j];
        }
      }
    }

    return false;
  }

  function isMatchingAllready(node, tags, style, className) {
    if (style) {
      return getMatchingStyleRegexp(node, style);
    } else if (className) {
      return wysihtml5.dom.hasClass(node, className);
    } else {
      return rangy.dom.arrayContains(tags, node.tagName.toLowerCase());
    }
  }

  function areMatchingAllready(nodes, tags, style, className) {
    for (var i = nodes.length; i--;) {
      if (!isMatchingAllready(nodes[i], tags, style, className)) {
        return false;
      }
    }
    return nodes.length ? true : false;
  }

  function removeOrChangeStyle(el, style, regExp) {

    var exactRegex = getMatchingStyleRegexp(el, style);
    if (exactRegex) {
      // adding same style value on property again removes style
      removeStyle(el, exactRegex);
      return "remove";
    } else {
      // adding new style value changes value
      addStyle(el, style, regExp);
      return "change";
    }
  }

  function hasSameClasses(el1, el2) {
    return el1.className.replace(REG_EXP_WHITE_SPACE, " ") == el2.className.replace(REG_EXP_WHITE_SPACE, " ");
  }

  function replaceWithOwnChildren(el) {
    var parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  }

  function elementsHaveSameNonClassAttributes(el1, el2) {
    if (el1.attributes.length != el2.attributes.length) {
      return false;
    }
    for (var i = 0, len = el1.attributes.length, attr1, attr2, name; i < len; ++i) {
      attr1 = el1.attributes[i];
      name = attr1.name;
      if (name != "class") {
        attr2 = el2.attributes.getNamedItem(name);
        if (attr1.specified != attr2.specified) {
          return false;
        }
        if (attr1.specified && attr1.nodeValue !== attr2.nodeValue) {
          return false;
        }
      }
    }
    return true;
  }

  function isSplitPoint(node, offset) {
    if (rangy.dom.isCharacterDataNode(node)) {
      if (offset == 0) {
        return !!node.previousSibling;
      } else if (offset == node.length) {
        return !!node.nextSibling;
      } else {
        return true;
      }
    }

    return offset > 0 && offset < node.childNodes.length;
  }

  function splitNodeAt(node, descendantNode, descendantOffset, container) {
    var newNode;
    if (rangy.dom.isCharacterDataNode(descendantNode)) {
      if (descendantOffset == 0) {
        descendantOffset = rangy.dom.getNodeIndex(descendantNode);
        descendantNode = descendantNode.parentNode;
      } else if (descendantOffset == descendantNode.length) {
        descendantOffset = rangy.dom.getNodeIndex(descendantNode) + 1;
        descendantNode = descendantNode.parentNode;
      } else {
        newNode = rangy.dom.splitDataNode(descendantNode, descendantOffset);
      }
    }
    if (!newNode) {
      if (!container || descendantNode !== container) {

        newNode = descendantNode.cloneNode(false);
        if (newNode.id) {
          newNode.removeAttribute("id");
        }
        var child;
        while ((child = descendantNode.childNodes[descendantOffset])) {
          newNode.appendChild(child);
        }
        rangy.dom.insertAfter(newNode, descendantNode);

      }
    }
    return (descendantNode == node) ? newNode :  splitNodeAt(node, newNode.parentNode, rangy.dom.getNodeIndex(newNode), container);
  }

  function Merge(firstNode) {
    this.isElementMerge = (firstNode.nodeType == wysihtml5.ELEMENT_NODE);
    this.firstTextNode = this.isElementMerge ? firstNode.lastChild : firstNode;
    this.textNodes = [this.firstTextNode];
  }

  Merge.prototype = {
    doMerge: function() {
      var textBits = [], textNode, parent, text;
      for (var i = 0, len = this.textNodes.length; i < len; ++i) {
        textNode = this.textNodes[i];
        parent = textNode.parentNode;
        textBits[i] = textNode.data;
        if (i) {
          parent.removeChild(textNode);
          if (!parent.hasChildNodes()) {
            parent.parentNode.removeChild(parent);
          }
        }
      }
      this.firstTextNode.data = text = textBits.join("");
      return text;
    },

    getLength: function() {
      var i = this.textNodes.length, len = 0;
      while (i--) {
        len += this.textNodes[i].length;
      }
      return len;
    },

    toString: function() {
      var textBits = [];
      for (var i = 0, len = this.textNodes.length; i < len; ++i) {
        textBits[i] = "'" + this.textNodes[i].data + "'";
      }
      return "[Merge(" + textBits.join(",") + ")]";
    }
  };

  function HTMLApplier(tagNames, cssClass, similarClassRegExp, normalize, cssStyle, similarStyleRegExp, container) {
    this.tagNames = tagNames || [defaultTagName];
    this.cssClass = cssClass || ((cssClass === false) ? false : "");
    this.similarClassRegExp = similarClassRegExp;
    this.cssStyle = cssStyle || "";
    this.similarStyleRegExp = similarStyleRegExp;
    this.normalize = normalize;
    this.applyToAnyTagName = false;
    this.container = container;
  }

  HTMLApplier.prototype = {
    getAncestorWithClass: function(node) {
      var cssClassMatch;
      while (node) {
        cssClassMatch = this.cssClass ? hasClass(node, this.cssClass, this.similarClassRegExp) : (this.cssStyle !== "") ? false : true;
        if (node.nodeType == wysihtml5.ELEMENT_NODE && node.getAttribute("contenteditable") != "false" &&  rangy.dom.arrayContains(this.tagNames, node.tagName.toLowerCase()) && cssClassMatch) {
          return node;
        }
        node = node.parentNode;
      }
      return false;
    },

    // returns parents of node with given style attribute
    getAncestorWithStyle: function(node) {
      var cssStyleMatch;
      while (node) {
        cssStyleMatch = this.cssStyle ? hasStyleAttr(node, this.similarStyleRegExp) : false;

        if (node.nodeType == wysihtml5.ELEMENT_NODE && node.getAttribute("contenteditable") != "false" && rangy.dom.arrayContains(this.tagNames, node.tagName.toLowerCase()) && cssStyleMatch) {
          return node;
        }
        node = node.parentNode;
      }
      return false;
    },

    getMatchingAncestor: function(node) {
      var ancestor = this.getAncestorWithClass(node),
          matchType = false;

      if (!ancestor) {
        ancestor = this.getAncestorWithStyle(node);
        if (ancestor) {
          matchType = "style";
        }
      } else {
        if (this.cssStyle) {
          matchType = "class";
        }
      }

      return {
        "element": ancestor,
        "type": matchType
      };
    },

    // Normalizes nodes after applying a CSS class to a Range.
    postApply: function(textNodes, range) {
      var firstNode = textNodes[0], lastNode = textNodes[textNodes.length - 1];

      var merges = [], currentMerge;

      var rangeStartNode = firstNode, rangeEndNode = lastNode;
      var rangeStartOffset = 0, rangeEndOffset = lastNode.length;

      var textNode, precedingTextNode;

      for (var i = 0, len = textNodes.length; i < len; ++i) {
        textNode = textNodes[i];
        precedingTextNode = null;
        if (textNode && textNode.parentNode) {
          precedingTextNode = this.getAdjacentMergeableTextNode(textNode.parentNode, false);
        }
        if (precedingTextNode) {
          if (!currentMerge) {
            currentMerge = new Merge(precedingTextNode);
            merges.push(currentMerge);
          }
          currentMerge.textNodes.push(textNode);
          if (textNode === firstNode) {
            rangeStartNode = currentMerge.firstTextNode;
            rangeStartOffset = rangeStartNode.length;
          }
          if (textNode === lastNode) {
            rangeEndNode = currentMerge.firstTextNode;
            rangeEndOffset = currentMerge.getLength();
          }
        } else {
          currentMerge = null;
        }
      }
      // Test whether the first node after the range needs merging
      if(lastNode && lastNode.parentNode) {
        var nextTextNode = this.getAdjacentMergeableTextNode(lastNode.parentNode, true);
        if (nextTextNode) {
          if (!currentMerge) {
            currentMerge = new Merge(lastNode);
            merges.push(currentMerge);
          }
          currentMerge.textNodes.push(nextTextNode);
        }
      }
      // Do the merges
      if (merges.length) {
        for (i = 0, len = merges.length; i < len; ++i) {
          merges[i].doMerge();
        }
        // Set the range boundaries
        range.setStart(rangeStartNode, rangeStartOffset);
        range.setEnd(rangeEndNode, rangeEndOffset);
      }
    },

    getAdjacentMergeableTextNode: function(node, forward) {
      var isTextNode = (node.nodeType == wysihtml5.TEXT_NODE);
      var el = isTextNode ? node.parentNode : node;
      var adjacentNode;
      var propName = forward ? "nextSibling" : "previousSibling";
      if (isTextNode) {
        // Can merge if the node's previous/next sibling is a text node
        adjacentNode = node[propName];
        if (adjacentNode && adjacentNode.nodeType == wysihtml5.TEXT_NODE) {
          return adjacentNode;
        }
      } else {
        // Compare element with its sibling
        adjacentNode = el[propName];
        if (adjacentNode && this.areElementsMergeable(node, adjacentNode)) {
          return adjacentNode[forward ? "firstChild" : "lastChild"];
        }
      }
      return null;
    },

    areElementsMergeable: function(el1, el2) {
      return rangy.dom.arrayContains(this.tagNames, (el1.tagName || "").toLowerCase())
        && rangy.dom.arrayContains(this.tagNames, (el2.tagName || "").toLowerCase())
        && hasSameClasses(el1, el2)
        && elementsHaveSameNonClassAttributes(el1, el2);
    },

    createContainer: function(doc) {
      var el = doc.createElement(this.tagNames[0]);
      if (this.cssClass) {
        el.className = this.cssClass;
      }
      if (this.cssStyle) {
        el.setAttribute('style', this.cssStyle);
      }
      return el;
    },

    applyToTextNode: function(textNode) {
      var parent = textNode.parentNode;
      if (parent.childNodes.length == 1 && rangy.dom.arrayContains(this.tagNames, parent.tagName.toLowerCase())) {

        if (this.cssClass) {
          addClass(parent, this.cssClass, this.similarClassRegExp);
        }
        if (this.cssStyle) {
          addStyle(parent, this.cssStyle, this.similarStyleRegExp);
        }
      } else {
        var el = this.createContainer(rangy.dom.getDocument(textNode));
        textNode.parentNode.insertBefore(el, textNode);
        el.appendChild(textNode);
      }
    },

    isRemovable: function(el) {
      return rangy.dom.arrayContains(this.tagNames, el.tagName.toLowerCase()) &&
              wysihtml5.lang.string(el.className).trim() === "" &&
              (
                !el.getAttribute('style') ||
                wysihtml5.lang.string(el.getAttribute('style')).trim() === ""
              );
    },

    undoToTextNode: function(textNode, range, ancestorWithClass, ancestorWithStyle) {
      var styleMode = (ancestorWithClass) ? false : true,
          ancestor = ancestorWithClass || ancestorWithStyle,
          styleChanged = false;
      if (!range.containsNode(ancestor)) {
        // Split out the portion of the ancestor from which we can remove the CSS class
        var ancestorRange = range.cloneRange();
            ancestorRange.selectNode(ancestor);

        if (ancestorRange.isPointInRange(range.endContainer, range.endOffset) && isSplitPoint(range.endContainer, range.endOffset)) {
            splitNodeAt(ancestor, range.endContainer, range.endOffset, this.container);
            range.setEndAfter(ancestor);
        }
        if (ancestorRange.isPointInRange(range.startContainer, range.startOffset) && isSplitPoint(range.startContainer, range.startOffset)) {
            ancestor = splitNodeAt(ancestor, range.startContainer, range.startOffset, this.container);
        }
      }

      if (!styleMode && this.similarClassRegExp) {
        removeClass(ancestor, this.similarClassRegExp);
      }

      if (styleMode && this.similarStyleRegExp) {
        styleChanged = (removeOrChangeStyle(ancestor, this.cssStyle, this.similarStyleRegExp) === "change");
      }
      if (this.isRemovable(ancestor) && !styleChanged) {
        replaceWithOwnChildren(ancestor);
      }
    },

    applyToRange: function(range) {
      var textNodes;
      for (var ri = range.length; ri--;) {
          textNodes = range[ri].getNodes([wysihtml5.TEXT_NODE]);

        if (!textNodes.length) {
          try {
            var node = this.createContainer(range[ri].endContainer.ownerDocument);
            range[ri].surroundContents(node);
            this.selectNode(range[ri], node);
            return;
          } catch(e) {}
        }

        range[ri].splitBoundaries();
        textNodes = range[ri].getNodes([wysihtml5.TEXT_NODE]);
        if (textNodes.length) {
          var textNode;

          for (var i = 0, len = textNodes.length; i < len; ++i) {
            textNode = textNodes[i];
            if (!this.getMatchingAncestor(textNode).element) {
              this.applyToTextNode(textNode);
            }
          }

          range[ri].setStart(textNodes[0], 0);
          textNode = textNodes[textNodes.length - 1];
          range[ri].setEnd(textNode, textNode.length);

          if (this.normalize) {
            this.postApply(textNodes, range[ri]);
          }
        }

      }
    },

    undoToRange: function(range) {
      var textNodes, textNode, ancestorWithClass, ancestorWithStyle, ancestor;
      for (var ri = range.length; ri--;) {

        textNodes = range[ri].getNodes([wysihtml5.TEXT_NODE]);
        if (textNodes.length) {
          range[ri].splitBoundaries();
          textNodes = range[ri].getNodes([wysihtml5.TEXT_NODE]);
        } else {
          var doc = range[ri].endContainer.ownerDocument,
              node = doc.createTextNode(wysihtml5.INVISIBLE_SPACE);
          range[ri].insertNode(node);
          range[ri].selectNode(node);
          textNodes = [node];
        }

        for (var i = 0, len = textNodes.length; i < len; ++i) {
          if (range[ri].isValid()) {
            textNode = textNodes[i];

            ancestor = this.getMatchingAncestor(textNode);
            if (ancestor.type === "style") {
              this.undoToTextNode(textNode, range[ri], false, ancestor.element);
            } else if (ancestor.element) {
              this.undoToTextNode(textNode, range[ri], ancestor.element);
            }
          }
        }

        if (len == 1) {
          this.selectNode(range[ri], textNodes[0]);
        } else {
          range[ri].setStart(textNodes[0], 0);
          textNode = textNodes[textNodes.length - 1];
          range[ri].setEnd(textNode, textNode.length);

          if (this.normalize) {
            this.postApply(textNodes, range[ri]);
          }
        }

      }
    },

    selectNode: function(range, node) {
      var isElement       = node.nodeType === wysihtml5.ELEMENT_NODE,
          canHaveHTML     = "canHaveHTML" in node ? node.canHaveHTML : true,
          content         = isElement ? node.innerHTML : node.data,
          isEmpty         = (content === "" || content === wysihtml5.INVISIBLE_SPACE);

      if (isEmpty && isElement && canHaveHTML) {
        // Make sure that caret is visible in node by inserting a zero width no breaking space
        try { node.innerHTML = wysihtml5.INVISIBLE_SPACE; } catch(e) {}
      }
      range.selectNodeContents(node);
      if (isEmpty && isElement) {
        range.collapse(false);
      } else if (isEmpty) {
        range.setStartAfter(node);
        range.setEndAfter(node);
      }
    },

    getTextSelectedByRange: function(textNode, range) {
      var textRange = range.cloneRange();
      textRange.selectNodeContents(textNode);

      var intersectionRange = textRange.intersection(range);
      var text = intersectionRange ? intersectionRange.toString() : "";
      textRange.detach();

      return text;
    },

    isAppliedToRange: function(range) {
      var ancestors = [],
          appliedType = "full",
          ancestor, styleAncestor, textNodes;

      for (var ri = range.length; ri--;) {

        textNodes = range[ri].getNodes([wysihtml5.TEXT_NODE]);
        if (!textNodes.length) {
          ancestor = this.getMatchingAncestor(range[ri].startContainer).element;

          return (ancestor) ? {
            "elements": [ancestor],
            "coverage": appliedType
          } : false;
        }

        for (var i = 0, len = textNodes.length, selectedText; i < len; ++i) {
          selectedText = this.getTextSelectedByRange(textNodes[i], range[ri]);
          ancestor = this.getMatchingAncestor(textNodes[i]).element;
          if (ancestor && selectedText != "") {
            ancestors.push(ancestor);

            if (wysihtml5.dom.getTextNodes(ancestor, true).length === 1) {
              appliedType = "full";
            } else if (appliedType === "full") {
              appliedType = "inline";
            }
          } else if (!ancestor) {
            appliedType = "partial";
          }
        }

      }

      return (ancestors.length) ? {
        "elements": ancestors,
        "coverage": appliedType
      } : false;
    },

    toggleRange: function(range) {
      var isApplied = this.isAppliedToRange(range),
          parentsExactMatch;

      if (isApplied) {
        if (isApplied.coverage === "full") {
          this.undoToRange(range);
        } else if (isApplied.coverage === "inline") {
          parentsExactMatch = areMatchingAllready(isApplied.elements, this.tagNames, this.cssStyle, this.cssClass);
          this.undoToRange(range);
          if (!parentsExactMatch) {
            this.applyToRange(range);
          }
        } else {
          // partial
          if (!areMatchingAllready(isApplied.elements, this.tagNames, this.cssStyle, this.cssClass)) {
            this.undoToRange(range);
          }
          this.applyToRange(range);
        }
      } else {
        this.applyToRange(range);
      }
    }
  };

  wysihtml5.selection.HTMLApplier = HTMLApplier;

})(wysihtml5, rangy);
;/**
 * Rich Text Query/Formatting Commands
 *
 * @example
 *    var commands = new wysihtml5.Commands(editor);
 */
wysihtml5.Commands = Base.extend(
  /** @scope wysihtml5.Commands.prototype */ {
  constructor: function(editor) {
    this.editor   = editor;
    this.composer = editor.composer;
    this.doc      = this.composer.doc;
  },

  /**
   * Check whether the browser supports the given command
   *
   * @param {String} command The command string which to check (eg. "bold", "italic", "insertUnorderedList")
   * @example
   *    commands.supports("createLink");
   */
  support: function(command) {
    return wysihtml5.browser.supportsCommand(this.doc, command);
  },

  /**
   * Check whether the browser supports the given command
   *
   * @param {String} command The command string which to execute (eg. "bold", "italic", "insertUnorderedList")
   * @param {String} [value] The command value parameter, needed for some commands ("createLink", "insertImage", ...), optional for commands that don't require one ("bold", "underline", ...)
   * @example
   *    commands.exec("insertImage", "http://a1.twimg.com/profile_images/113868655/schrei_twitter_reasonably_small.jpg");
   */
  exec: function(command, value) {
    var obj     = wysihtml5.commands[command],
        args    = wysihtml5.lang.array(arguments).get(),
        method  = obj && obj.exec,
        result  = null;

    // If composer ahs placeholder unset it before command
    // Do not apply on commands that are behavioral 
    if (this.composer.hasPlaceholderSet() && !wysihtml5.lang.array(['styleWithCSS', 'enableObjectResizing', 'enableInlineTableEditing']).contains(command)) {
      this.composer.element.innerHTML = "";
      this.composer.selection.selectNode(this.composer.element);
    }

    this.editor.fire("beforecommand:composer");

    if (method) {
      args.unshift(this.composer);
      result = method.apply(obj, args);
    } else {
      try {
        // try/catch for buggy firefox
        result = this.doc.execCommand(command, false, value);
      } catch(e) {}
    }

    this.editor.fire("aftercommand:composer");
    return result;
  },

  remove: function(command, commandValue) {
    var obj     = wysihtml5.commands[command],
        args    = wysihtml5.lang.array(arguments).get(),
        method  = obj && obj.remove;
    if (method) {
      args.unshift(this.composer);
      return method.apply(obj, args);
    }
  },

  /**
   * Check whether the current command is active
   * If the caret is within a bold text, then calling this with command "bold" should return true
   *
   * @param {String} command The command string which to check (eg. "bold", "italic", "insertUnorderedList")
   * @param {String} [commandValue] The command value parameter (eg. for "insertImage" the image src)
   * @return {Boolean} Whether the command is active
   * @example
   *    var isCurrentSelectionBold = commands.state("bold");
   */
  state: function(command, commandValue) {
    var obj     = wysihtml5.commands[command],
        args    = wysihtml5.lang.array(arguments).get(),
        method  = obj && obj.state;
    if (method) {
      args.unshift(this.composer);
      return method.apply(obj, args);
    } else {
      try {
        // try/catch for buggy firefox
        return this.doc.queryCommandState(command);
      } catch(e) {
        return false;
      }
    }
  },

  /* Get command state parsed value if command has stateValue parsing function */
  stateValue: function(command) {
    var obj     = wysihtml5.commands[command],
        args    = wysihtml5.lang.array(arguments).get(),
        method  = obj && obj.stateValue;
    if (method) {
      args.unshift(this.composer);
      return method.apply(obj, args);
    } else {
      return false;
    }
  }
});
;(function(wysihtml5) {
  
  var nodeOptions = {
    nodeName: "B",
    toggle: true
  };
  
  wysihtml5.commands.bold = {
    exec: function(composer, command) {
      wysihtml5.commands.formatInline.exec(composer, command, nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, nodeOptions);
    }
  };

}(wysihtml5));
;(function(wysihtml5) {

  var nodeOptions = {
    nodeName: "A",
    toggle: false
  };

  function getOptions(value) {
    var options = typeof value === 'object' ? value : {'href': value};
    return wysihtml5.lang.object({}).merge(nodeOptions).merge({'attribute': value}).get();
  }

  wysihtml5.commands.createLink  = {
    exec: function(composer, command, value) {
      var opts = getOptions(value);

      if (composer.selection.isCollapsed() && !this.state(composer, command)) {
        var textNode = composer.doc.createTextNode(opts.attribute.href);
        composer.selection.insertNode(textNode);
        composer.selection.selectNode(textNode);
      }
      wysihtml5.commands.formatInline.exec(composer, command, opts);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, nodeOptions);
    }
  };

})(wysihtml5);
;(function(wysihtml5) {

  var nodeOptions = {
    nodeName: "A"
  };

  wysihtml5.commands.removeLink = {
    exec: function(composer, command) {
      wysihtml5.commands.formatInline.remove(composer, command, nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, nodeOptions);
    }
  };

})(wysihtml5);
;/**
 * Set font size css class
 */
(function(wysihtml5) {
  var REG_EXP = /wysiwyg-font-size-[0-9a-z\-]+/g;

  wysihtml5.commands.fontSize = {
    exec: function(composer, command, size) {
      wysihtml5.commands.formatInline.exec(composer, command, {className: "wysiwyg-font-size-" + size, classRegExp: REG_EXP, toggle: true});
    },

    state: function(composer, command, size) {
      return wysihtml5.commands.formatInline.state(composer, command, {className: "wysiwyg-font-size-" + size});
    }
  };
})(wysihtml5);
;/**
 * Set font size by inline style
 */
(function(wysihtml5) {

  wysihtml5.commands.fontSizeStyle = {
    exec: function(composer, command, size) {
      size = size.size || size;
      if (!(/^\s*$/).test(size)) {
        wysihtml5.commands.formatInline.exec(composer, command, {styleProperty: "fontSize", styleValue: size, toggle: false});
      }
    },

    state: function(composer, command, size) {
      return wysihtml5.commands.formatInline.state(composer, command, {styleProperty: "fontSize", styleValue: size || undefined});
    },

    remove: function(composer, command) {
      return wysihtml5.commands.formatInline.remove(composer, command, {styleProperty: "fontSize"});
    },

    stateValue: function(composer, command) {
      var styleStr,
          st = this.state(composer, command);

      if (st && wysihtml5.lang.object(st).isArray()) {
          st = st[0];
      }
      if (st) {
        styleStr = st.getAttribute("style");
        if (styleStr) {
          return wysihtml5.quirks.styleParser.parseFontSize(styleStr);
        }
      }
      return false;
    }
  };
})(wysihtml5);
;/**
 * Set color css class
 */
(function(wysihtml5) {
  var REG_EXP = /wysiwyg-color-[0-9a-z]+/g;

  wysihtml5.commands.foreColor = {
    exec: function(composer, command, color) {
      wysihtml5.commands.formatInline.exec(composer, command, {className: "wysiwyg-color-" + color, classRegExp: REG_EXP, toggle: true});
    },

    state: function(composer, command, color) {
      return wysihtml5.commands.formatInline.state(composer, command, {className: "wysiwyg-color-" + color});
    }
  };
})(wysihtml5);
;/**
 * Sets text color by inline styles
 */
(function(wysihtml5) {

  wysihtml5.commands.foreColorStyle = {
    exec: function(composer, command, color) {
      var colorVals, colString;

      if (!color) { return; }

      colorVals = wysihtml5.quirks.styleParser.parseColor("color:" + (color.color || color), "color");

      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(", ") : "rgba(" + colorVals.join(', ')) + ')';
        wysihtml5.commands.formatInline.exec(composer, command, {styleProperty: "color", styleValue: colString});
      }
    },

    state: function(composer, command, color) {
      var colorVals  = color ? wysihtml5.quirks.styleParser.parseColor("color:" + (color.color || color), "color") : null,
          colString;


      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(", ") : "rgba(" + colorVals.join(', ')) + ')';
      }

      return wysihtml5.commands.formatInline.state(composer, command, {styleProperty: "color", styleValue: colString});
    },

    remove: function(composer, command) {
      return wysihtml5.commands.formatInline.remove(composer, command, {styleProperty: "color"});
    },

    stateValue: function(composer, command, props) {
      var st = this.state(composer, command),
          colorStr,
          val = false;

      if (st && wysihtml5.lang.object(st).isArray()) {
        st = st[0];
      }

      if (st) {
        colorStr = st.getAttribute("style");
        if (colorStr) {
          val = wysihtml5.quirks.styleParser.parseColor(colorStr, "color");
          return wysihtml5.quirks.styleParser.unparseColor(val, props);
        }
      }
      return false;
    }

  };
})(wysihtml5);
;/**
 * Sets text background color by inline styles
 */
(function(wysihtml5) {

  wysihtml5.commands.bgColorStyle = {
    exec: function(composer, command, color) {
      var colorVals  = wysihtml5.quirks.styleParser.parseColor("background-color:" + (color.color || color), "background-color"),
          colString;

      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(', ') : "rgba(" + colorVals.join(', ')) + ')';
        wysihtml5.commands.formatInline.exec(composer, command, {styleProperty: 'backgroundColor', styleValue: colString});
      }
    },

    state: function(composer, command, color) {
      var colorVals  = color ? wysihtml5.quirks.styleParser.parseColor("background-color:" + (color.color || color), "background-color") : null,
          colString;


      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(', ') : "rgba(" + colorVals.join(', ')) + ')';
      }

      return wysihtml5.commands.formatInline.state(composer, command, {styleProperty: 'backgroundColor', styleValue: colString});
    },

    remove: function(composer, command) {
      return wysihtml5.commands.formatInline.remove(composer, command, {styleProperty: 'backgroundColor'});
    },

    stateValue: function(composer, command, props) {
      var st = this.state(composer, command),
          colorStr,
          val = false;

      if (st && wysihtml5.lang.object(st).isArray()) {
        st = st[0];
      }

      if (st) {
        colorStr = st.getAttribute('style');
        if (colorStr) {
          val = wysihtml5.quirks.styleParser.parseColor(colorStr, "background-color");
          return wysihtml5.quirks.styleParser.unparseColor(val, props);
        }
      }
      return false;
    }

  };
})(wysihtml5);
;/* Formatblock
 * Is used to insert block level elements 
 * It tries to solve the case that some block elements should not contain other block level elements (h1-6, p, ...)
 * 
*/
(function(wysihtml5) {

  var dom = wysihtml5.dom,
      // When the caret is within a H1 and the H4 is invoked, the H1 should turn into H4
      // instead of creating a H4 within a H1 which would result in semantically invalid html
      UNNESTABLE_BLOCK_ELEMENTS = "h1, h2, h3, h4, h5, h6, p, pre",
      BLOCK_ELEMENTS = "h1, h2, h3, h4, h5, h6, p, pre, div, blockquote",
      INLINE_ELEMENTS = "b, big, i, small, tt, abbr, acronym, cite, code, dfn, em, kbd, strong, samp, var, a, bdo, br, q, span, sub, sup, button, label, textarea, input, select, u";

  function correctOptionsForSimilarityCheck(options) {
    return {
      nodeName: options.nodeName || null,
      className: (!options.classRegExp) ? options.className || null : null,
      classRegExp: options.classRegExp || null,
      styleProperty: options.styleProperty || null
    };
  }

  // Removes empty block level elements
  function cleanup(composer) {
    var container = composer.element,
        allElements = container.querySelectorAll(BLOCK_ELEMENTS),
        uneditables = container.querySelectorAll(composer.config.classNames.uneditableContainer),
        elements = wysihtml5.lang.array(allElements).without(uneditables);

    for (var i = elements.length; i--;) {
      if (elements[i].innerHTML.replace(/[\uFEFF]/g, '') === "") {
        elements[i].parentNode.removeChild(elements[i]);
      }
    }
  }

  function defaultNodeName(composer) {
    return composer.config.useLineBreaks ? "DIV" : "P";
  }

  // The outermost un-nestable block element parent of from node
  function findOuterBlock(node, container, allBlocks) {
    var n = node,
        block = null;
        
    while (n && container && n !== container) {
      if (n.nodeType === 1 && n.matches(allBlocks ? BLOCK_ELEMENTS : UNNESTABLE_BLOCK_ELEMENTS)) {
        block = n;
      }
      n = n.parentNode;
    }

    return block;
  }

  function cloneOuterInlines(node, container) {
    var n = node,
        innerNode,
        parentNode,
        el = null,
        el2;
        
    while (n && container && n !== container) {
      if (n.nodeType === 1 && n.matches(INLINE_ELEMENTS)) {
        parentNode = n;
        if (el === null) {
          el = n.cloneNode(false);
          innerNode = el;
        } else {
          el2 = n.cloneNode(false);
          el2.appendChild(el);
          el = el2;
        }
      }
      n = n.parentNode;
    }

    return {
      parent: parentNode,
      outerNode: el,
      innerNode: innerNode
    };
  }

  // Formats an element according to options nodeName, className, styleProperty, styleValue
  // If element is not defined, creates new element
  // if opotions is null, remove format instead
  function applyOptionsToElement(element, options, composer) {

    if (!element) {
      element = composer.doc.createElement(options.nodeName || defaultNodeName(composer));
      // Add invisible space as otherwise webkit cannot set selection or range to it correctly
      element.appendChild(composer.doc.createTextNode(wysihtml5.INVISIBLE_SPACE));
    }

    if (options.nodeName && element.nodeName !== options.nodeName) {
      element = dom.renameElement(element, options.nodeName);
    }

    // Remove similar classes before applying className
    if (options.classRegExp) {
      element.className = element.className.replace(options.classRegExp, "");
    }
    if (options.className) {
      element.classList.add(options.className);
    }

    if (options.styleProperty && typeof options.styleValue !== "undefined") {
      element.style[wysihtml5.browser.fixStyleKey(options.styleProperty)] = options.styleValue;
    }

    return element;
  }

  // Unsets element properties by options
  // If nodename given and matches current element, element is unwrapped or converted to default node (depending on presence of class and style attributes)
  function removeOptionsFromElement(element, options, composer) {
    var style, classes;

    if (options.styleProperty) {
      element.style[wysihtml5.browser.fixStyleKey(options.styleProperty)] = '';
    }
    if (options.className) {
      element.classList.remove(options.className);
    }

    if (options.classRegExp) {
      element.className = element.className.replace(options.classRegExp, "");
    }

    // Clean up blank class attribute
    if (element.getAttribute('class') !== null && element.getAttribute('class').trim() === "") {
      element.removeAttribute('class');
    }

    if (options.nodeName && element.nodeName === options.nodeName) {
      style = element.getAttribute('style');
      if (!style || style.trim() === '') {
        dom.unwrap(element);
      } else {
        element = dom.renameElement(element, defaultNodeName(composer));
      }
    }

    // Clean up blank style attribute
    if (element.getAttribute('style') !== null && element.getAttribute('style').trim() === "") {
      element.removeAttribute('style');
    }
  }

  // Unwraps block level elements from inside content
  // Useful as not all block level elements can contain other block-levels
  function unwrapBlocksFromContent(element) {
    var contentBlocks = element.querySelectorAll(BLOCK_ELEMENTS) || []; // Find unnestable block elements in extracted contents

    for (var i = contentBlocks.length; i--;) {
      if (!contentBlocks[i].nextSibling || contentBlocks[i].nextSibling.nodeType !== 1 || contentBlocks[i].nextSibling.nodeName !== 'BR') {
        if ((contentBlocks[i].innerHTML || contentBlocks[i].nodeValue || '').trim() !== '') {
          contentBlocks[i].parentNode.insertBefore(contentBlocks[i].ownerDocument.createElement('BR'), contentBlocks[i].nextSibling);
        }
      }
      wysihtml5.dom.unwrap(contentBlocks[i]);
    }
  }

  // Fix ranges that visually cover whole block element to actually cover the block
  function fixRangeCoverage(range, composer) {
    var node;

    if (range.startContainer && range.startContainer.nodeType === 1 && range.startContainer === range.endContainer) {
      if (range.startContainer.firstChild === range.startContainer.lastChild && range.endOffset === 1) {
        if (range.startContainer !== composer.element) {
          range.setStartBefore(range.startContainer);
          range.setEndAfter(range.endContainer);
        }
      }
      return;
    }

    if (range.startContainer && range.startContainer.nodeType === 1 && range.endContainer.nodeType === 3) {
      if (range.startContainer.firstChild === range.endContainer && range.endOffset === 1) {
        if (range.startContainer !== composer.element) {
          range.setEndAfter(range.startContainer);
        }
      }
      return;
    }

    if (range.endContainer && range.endContainer.nodeType === 1 && range.startContainer.nodeType === 3) {
      if (range.endContainer.firstChild === range.startContainer && range.endOffset === 1) {
        if (range.endContainer !== composer.element) {
          range.setStartBefore(range.endContainer);
        }
      }
      return;
    }


    if (range.startContainer && range.startContainer.nodeType === 3 && range.startContainer === range.endContainer && range.startContainer.parentNode) {
      if (range.startContainer.parentNode.firstChild === range.startContainer && range.endOffset == range.endContainer.length && range.startOffset === 0) {
        node = range.startContainer.parentNode;
        if (node !== composer.element) {
          range.setStartBefore(node);
          range.setEndAfter(node);
        }
      }
      return;
    }
  }

  // Wrap the range with a block level element
  // If element is one of unnestable block elements (ex: h2 inside h1), split nodes and insert between so nesting does not occur
  function wrapRangeWithElement(range, options, defaultName, composer) {
    var defaultOptions = (options) ? wysihtml5.lang.object(options).clone(true) : null;
    if (defaultOptions) {
      defaultOptions.nodeName = defaultOptions.nodeName || defaultName || defaultNodeName(composer);
    }
    fixRangeCoverage(range, composer);

    var r = range.cloneRange(),
        rangeStartContainer = r.startContainer,
        content = r.extractContents(),
        fragment = composer.doc.createDocumentFragment(),
        similarOptions = defaultOptions ? correctOptionsForSimilarityCheck(defaultOptions) : null,
        similarOuterBlock = similarOptions ? wysihtml5.dom.getParentElement(rangeStartContainer, similarOptions, null, composer.element) : null,
        splitAllBlocks = !defaultOptions || (defaultName === "BLOCKQUOTE" && defaultOptions.nodeName && defaultOptions.nodeName === "BLOCKQUOTE"),
        firstOuterBlock = similarOuterBlock || findOuterBlock(rangeStartContainer, composer.element, splitAllBlocks), // The outermost un-nestable block element parent of selection start
        wrapper, blocks, children;

    if (options && options.nodeName && options.nodeName === "BLOCKQUOTE") {
      var tmpEl = applyOptionsToElement(null, options, composer);
      tmpEl.appendChild(content);
      fragment.appendChild(tmpEl);
      blocks = [tmpEl];
    } else {

      if (!content.firstChild) {
        fragment.appendChild(applyOptionsToElement(null, options, composer));
      } else {

        while(content.firstChild) {
          
          if (content.firstChild.nodeType == 1 && content.firstChild.matches(BLOCK_ELEMENTS)) {
            
            if (options) {
              // Escape(split) block formatting at caret
              applyOptionsToElement(content.firstChild, options, composer);
              if (content.firstChild.matches(UNNESTABLE_BLOCK_ELEMENTS)) {
                unwrapBlocksFromContent(content.firstChild);
              }
              fragment.appendChild(content.firstChild);
            
            } else {
              // Split block formating and add new block to wrap caret
              unwrapBlocksFromContent(content.firstChild);
              children = wysihtml5.dom.unwrap(content.firstChild);
              for (var c = 0, cmax = children.length; c < cmax; c++) {
                fragment.appendChild(children[c]);
              }

              if (fragment.childNodes.length > 0) {
                fragment.appendChild(composer.doc.createElement('BR'));
              }
            }
          } else {

            if (options) {
              // Wrap subsequent non-block nodes inside new block element
              wrapper = applyOptionsToElement(null, defaultOptions, composer);
              while(content.firstChild && (content.firstChild.nodeType !== 1 || !content.firstChild.matches(BLOCK_ELEMENTS))) {
                if (content.firstChild.nodeType == 1 && wrapper.matches(UNNESTABLE_BLOCK_ELEMENTS)) {
                  unwrapBlocksFromContent(content.firstChild);
                }
                wrapper.appendChild(content.firstChild);
              }
              fragment.appendChild(wrapper);
            
            } else {
              // Escape(split) block formatting at selection 
              if (content.firstChild.nodeType == 1) {
                unwrapBlocksFromContent(content.firstChild);
              }
              fragment.appendChild(content.firstChild);
            }

          }
        }
      }

      blocks = wysihtml5.lang.array(fragment.childNodes).get();
    }
    if (firstOuterBlock) {
      // If selection starts inside un-nestable block, split-escape the unnestable point and insert node between
      composer.selection.splitElementAtCaret(firstOuterBlock, fragment);
    } else {
      // Ensure node does not get inserted into an inline where it is not allowed
      var outerInlines = cloneOuterInlines(rangeStartContainer, composer.element);
      if (outerInlines.outerNode && outerInlines.innerNode && outerInlines.parent) {
        if (fragment.childNodes.length === 1) {
          while(fragment.firstChild.firstChild) {
            outerInlines.innerNode.appendChild(fragment.firstChild.firstChild);
          }
          fragment.firstChild.appendChild(outerInlines.outerNode);
        }
        composer.selection.splitElementAtCaret(outerInlines.parent, fragment);
      } else {
        // Otherwise just insert
        r.insertNode(fragment);
      }
    }

    return blocks;
  }

  // Find closest block level element
  function getParentBlockNodeName(element, composer) {
    var parentNode = wysihtml5.dom.getParentElement(element, {
          query: BLOCK_ELEMENTS
        }, null, composer.element);

    return (parentNode) ? parentNode.nodeName : null;
  }

  wysihtml5.commands.formatBlock = {
    exec: function(composer, command, options) {
      var newBlockElements = [],
          placeholder, ranges, range, parent, bookmark, state;

      // If properties is passed as a string, look for tag with that tagName/query 
      if (typeof options === "string") {
        options = {
          nodeName: options.toUpperCase()
        };
      }

      // Remove state if toggle set and state on and selection is collapsed
      if (options && options.toggle) {
        state = this.state(composer, command, options);
        if (state) {
          bookmark = rangy.saveSelection(composer.win);
          for (var j = 0, jmax = state.length; j < jmax; j++) {
            removeOptionsFromElement(state[j], options, composer);
          }
        }
      }

      // Otherwise expand selection so it will cover closest block if option caretSelectsBlock is true and selection is collapsed
      if (!state) {

        if (composer.selection.isCollapsed()) {
          parent = wysihtml5.dom.getParentElement(composer.selection.getOwnRanges()[0].startContainer, {
            query: UNNESTABLE_BLOCK_ELEMENTS + ', ' + (options && options.nodeName ? options.nodeName.toLowerCase() : 'div'),
          }, null, composer.element);
          if (parent) {
            bookmark = rangy.saveSelection(composer.win);
            range = composer.selection.createRange();
            range.selectNode(parent);
            composer.selection.setSelection(range);
          } else if (!composer.isEmpty()) {
            bookmark = rangy.saveSelection(composer.win);
            composer.selection.selectLine();
          }
        }

        // And get all selection ranges of current composer and iterate
        ranges = composer.selection.getOwnRanges();
        for (var i = ranges.length; i--;) {
          newBlockElements = newBlockElements.concat(wrapRangeWithElement(ranges[i], options, getParentBlockNodeName(ranges[i].startContainer, composer), composer));
        }

      }

      // Remove empty block elements that may be left behind
      cleanup(composer);
      // If cleanup removed some new block elements. remove them from array too
      for (var e = newBlockElements.length; e--;) {
        if (!newBlockElements[e].parentNode) {
          newBlockElements.splice(e, 1);
        }
      }
      
      // Restore correct selection
      if (bookmark) {
        rangy.restoreSelection(bookmark);
      } else {
        range = composer.selection.createRange();
        range.setStartBefore(newBlockElements[0]);
        range.setEndAfter(newBlockElements[newBlockElements.length - 1]);
        composer.selection.setSelection(range);
      }

      wysihtml5.dom.removeInvisibleSpaces(composer.element);

    },

    // If properties as null is passed returns status describing all block level elements
    state: function(composer, command, properties) {
      
      // If properties is passed as a string, look for tag with that tagName/query 
      if (typeof properties === "string") {
        properties = {
          query: properties
        };
      }

      var nodes = composer.selection.filterElements((function (element) { // Finds matching elements inside selection
            return wysihtml5.dom.domNode(element).test(properties || { query: BLOCK_ELEMENTS });
          }).bind(this)),
          parentNodes = composer.selection.getSelectedOwnNodes(),
          parent;

      // Finds matching elements that are parents of selection and adds to nodes list
      for (var i = 0, maxi = parentNodes.length; i < maxi; i++) {
        parent = dom.getParentElement(parentNodes[i], properties || { query: BLOCK_ELEMENTS }, null, composer.element);
        if (parent && nodes.indexOf(parent) === -1) {
          nodes.push(parent);
        }
      }

      return (nodes.length === 0) ? false : nodes;
    }

  };
})(wysihtml5);
;/* Formats block for as a <pre><code class="classname"></code></pre> block
 * Useful in conjuction for sytax highlight utility: highlight.js
 *
 * Usage:
 *
 * editorInstance.composer.commands.exec("formatCode", "language-html");
*/

(function(wysihtml5){
  wysihtml5.commands.formatCode = {

    exec: function(composer, command, classname) {
      var pre = this.state(composer)[0],
          code, range, selectedNodes;

      if (pre) {
        // caret is already within a <pre><code>...</code></pre>
        composer.selection.executeAndRestore(function() {
          code = pre.querySelector("code");
          wysihtml5.dom.replaceWithChildNodes(pre);
          if (code) {
            wysihtml5.dom.replaceWithChildNodes(code);
          }
        });
      } else {
        // Wrap in <pre><code>...</code></pre>
        range = composer.selection.getRange();
        selectedNodes = range.extractContents();
        pre = composer.doc.createElement("pre");
        code = composer.doc.createElement("code");

        if (classname) {
          code.className = classname;
        }

        pre.appendChild(code);
        code.appendChild(selectedNodes);
        range.insertNode(pre);
        composer.selection.selectNode(pre);
      }
    },

    state: function(composer) {
      var selectedNode = composer.selection.getSelectedNode(), node;
      if (selectedNode && selectedNode.nodeName && selectedNode.nodeName == "PRE"&&
          selectedNode.firstChild && selectedNode.firstChild.nodeName && selectedNode.firstChild.nodeName == "CODE") {
        return [selectedNode];
      } else {
        node = wysihtml5.dom.getParentElement(selectedNode, { query: "pre code" });
        return node ? [node.parentNode] : false;
      }
    }
  };
}(wysihtml5));
;/**
 * Unifies all inline tags additions and removals
 * See https://github.com/Voog/wysihtml/pull/169 for specification of action
 */

(function(wysihtml5) {

  var defaultTag = "SPAN",
      INLINE_ELEMENTS = "b, big, i, small, tt, abbr, acronym, cite, code, dfn, em, kbd, strong, samp, var, a, bdo, br, q, span, sub, sup, button, label, textarea, input, select, u",
      queryAliasMap = {
        "b": "b, strong",
        "strong": "b, strong",
        "em": "em, i",
        "i": "em, i"
      };

  function hasNoClass(element) {
    return (/^\s*$/).test(element.className);
  }

  function hasNoStyle(element) {
    return !element.getAttribute('style') || (/^\s*$/).test(element.getAttribute('style'));
  }

  // Associative arrays in javascript are really objects and do not have length defined
  // Thus have to check emptyness in a different way
  function hasNoAttributes(element) {
    var attr = wysihtml5.dom.getAttributes(element);
    return wysihtml5.lang.object(attr).isEmpty();
  }

  // compares two nodes if they are semantically the same
  // Used in cleanup to find consequent semantically similar elements for merge
  function isSameNode(element1, element2) {
    var classes1, classes2,
        attr1, attr2;

    if (element1.nodeType !== 1 || element2.nodeType !== 1) {
      return false;
    }

    if (element1.nodeName !== element2.nodeName) {
      return false;
    }

    classes1 = element1.className.trim().replace(/\s+/g, ' ').split(' ');
    classes2 = element2.className.trim().replace(/\s+/g, ' ').split(' ');
    if (wysihtml5.lang.array(classes1).without(classes2).length > 0) {
      return false;
    }

    attr1 = wysihtml5.dom.getAttributes(element1);
    attr2 = wysihtml5.dom.getAttributes(element2);

    if (attr1.length !== attr2.length || !wysihtml5.lang.object(wysihtml5.lang.object(attr1).difference(attr2)).isEmpty()) {
      return false;
    }

    return true;
  }

  function createWrapNode(textNode, options) {
    var nodeName = options && options.nodeName || defaultTag,
        element = textNode.ownerDocument.createElement(nodeName);

    // Remove similar classes before applying className
    if (options.classRegExp) {
      element.className = element.className.replace(options.classRegExp, "");
    }

    if (options.className) {
      element.classList.add(options.className);
    }

    if (options.styleProperty && typeof options.styleValue !== "undefined") {
      element.style[wysihtml5.browser.fixStyleKey(options.styleProperty)] = options.styleValue;
    }

    if (options.attribute) {
      if (typeof options.attribute === "object") {
        for (var a in options.attribute) {
          if (options.attribute.hasOwnProperty(a)) {
            element.setAttribute(a, options.attribute[a]);
          }
        }
      } else if (typeof options.attributeValue !== "undefined") {
        element.setAttribute(options.attribute, options.attributeValue);
      }
    }

    return element;
  }

  // Tests if attr2 list contains all attributes present in attr1
  // Note: attr 1 can have more attributes than attr2
  function containsSameAttributes(attr1, attr2) {
    for (var a in attr1) {
      if (attr1.hasOwnProperty(a)) {
        if (typeof attr2[a] === undefined || attr2[a] !== attr1[a]) {
          return false;
        }
      }
    }
    return true;
  }

  // If attrbutes and values are the same > remove
  // if attributes or values 
  function updateElementAttributes(element, newAttributes, toggle) {
    var attr = wysihtml5.dom.getAttributes(element),
        fullContain = containsSameAttributes(newAttributes, attr),
        attrDifference = wysihtml5.lang.object(attr).difference(newAttributes),
        a, b;

    if (fullContain && toggle !== false) {
      for (a in newAttributes) {
        if (newAttributes.hasOwnProperty(a)) {
          element.removeAttribute(a);
        }
      }
    } else {

      /*if (!wysihtml5.lang.object(attrDifference).isEmpty()) {
        for (b in attrDifference) {
          if (attrDifference.hasOwnProperty(b)) {
            element.removeAttribute(b);
          }
        }
      }*/

      for (a in newAttributes) {
        if (newAttributes.hasOwnProperty(a)) {
          element.setAttribute(a, newAttributes[a]);
        }
      }
    }
  }

  function updateFormatOfElement(element, options) {
    var attr, newNode, a, newAttributes, nodeNameQuery, nodeQueryMatch;

    if (options.className) {
      if (options.toggle !== false && element.classList.contains(options.className)) {
        element.classList.remove(options.className);
      } else {
        element.classList.add(options.className);
      }
      if (hasNoClass(element)) {
        element.removeAttribute('class');
      }
    }

    // change/remove style
    if (options.styleProperty) {
      if (options.toggle !== false && element.style[wysihtml5.browser.fixStyleKey(options.styleProperty)].trim().replace(/, /g, ",") === options.styleValue) {
        element.style[wysihtml5.browser.fixStyleKey(options.styleProperty)] = '';
      } else {
        element.style[wysihtml5.browser.fixStyleKey(options.styleProperty)] = options.styleValue;
      }
    }
    if (hasNoStyle(element)) {
      element.removeAttribute('style');
    }

    if (options.attribute) {
      if (typeof options.attribute === "object") {
        newAttributes =  options.attribute;
      } else {
        newAttributes = {};
        newAttributes[options.attribute] = options.attributeValue || '';
      }
      updateElementAttributes(element, newAttributes, options.toggle);
    }


    // Handle similar semantically same elements (queryAliasMap)
    nodeNameQuery = options.nodeName ? queryAliasMap[options.nodeName.toLowerCase()] || options.nodeName.toLowerCase() : null;
    nodeQueryMatch = nodeNameQuery ? wysihtml5.dom.domNode(element).test({ query: nodeNameQuery }) : false;
    
    // Unwrap element if no attributes present and node name given
    // or no attributes and if no nodename set but node is the default
    if (!options.nodeName || options.nodeName === defaultTag || nodeQueryMatch) {
      if (
        ((options.toggle !== false && nodeQueryMatch) || (!options.nodeName && element.nodeName === defaultTag)) &&
        hasNoClass(element) && hasNoStyle(element) && hasNoAttributes(element)
      ) {
        wysihtml5.dom.unwrap(element);
      }

    }
  }

  // Fetch all textnodes in selection
  // Empty textnodes are ignored except the one containing text caret
  function getSelectedTextNodes(selection, splitBounds) {
    var textNodes = [];

    if (!selection.isCollapsed()) {
      textNodes = textNodes.concat(selection.getOwnNodes([3], function(node) {
        // Exclude empty nodes except caret node
        return (!wysihtml5.dom.domNode(node).is.emptyTextNode());
      }, splitBounds));
    }

    return textNodes;
  }

  function findSimilarTextNodeWrapper(textNode, options, container, exact) {
    var node = textNode,
        similarOptions = exact ? options : correctOptionsForSimilarityCheck(options);

    do {
      if (node.nodeType === 1 && isSimilarNode(node, similarOptions)) {
        return node;
      }
      node = node.parentNode;
    } while (node && node !== container);

    return null;
  }

  function correctOptionsForSimilarityCheck(options) {
    return {
      nodeName: options.nodeName || null,
      className: (!options.classRegExp) ? options.className || null : null,
      classRegExp: options.classRegExp || null,
      styleProperty: options.styleProperty || null
    };
  }

  // Finds inline node with similar nodeName/style/className
  // If nodeName is specified inline node with the same (or alias) nodeName is expected to prove similar regardless of attributes
  function isSimilarNode(node, options) {
    var o;
    if (options.nodeName) {
      var query = queryAliasMap[options.nodeName.toLowerCase()] || options.nodeName.toLowerCase();
      return wysihtml5.dom.domNode(node).test({ query: query });
    } else {
      o = wysihtml5.lang.object(options).clone();
      o.query = INLINE_ELEMENTS; // make sure only inline elements with styles and classes are counted
      return wysihtml5.dom.domNode(node).test(o);
    }
  }

  function selectRange(composer, range) {
    var d = document.documentElement || document.body,
        oldScrollTop  = d.scrollTop,
        oldScrollLeft = d.scrollLeft,
        selection = rangy.getSelection(composer.win);

    rangy.getSelection(composer.win).removeAllRanges();
    
    // IE looses focus of contenteditable on removeallranges and can not set new selection unless contenteditable is focused again
    try {
      rangy.getSelection(composer.win).addRange(range);
    } catch (e) {}
    if (!composer.doc.activeElement || !wysihtml5.dom.contains(composer.element, composer.doc.activeElement)) {
      composer.element.focus();
      d.scrollTop  = oldScrollTop;
      d.scrollLeft = oldScrollLeft;
      rangy.getSelection(composer.win).addRange(range);
    }
  }

  function selectTextNodes(textNodes, composer) {
    var range = rangy.createRange(composer.doc),
        lastText = textNodes[textNodes.length - 1];

    if (textNodes[0] && lastText) {
      range.setStart(textNodes[0], 0);
      range.setEnd(lastText, lastText.length);
      selectRange(composer, range);
    }
    
  }

  function selectTextNode(composer, node, start, end) {
    var range = rangy.createRange(composer.doc);
    if (node) {
      range.setStart(node, start);
      range.setEnd(node, typeof end !== 'undefined' ? end : start);
      selectRange(composer, range);
    }
  }

  function getState(composer, options, exact) {
    var searchNodes = getSelectedTextNodes(composer.selection),
        nodes = [],
        partial = false,
        node, range, caretNode;

    if (composer.selection.isInThisEditable()) {

      if (searchNodes.length === 0 && composer.selection.isCollapsed()) {
        caretNode = composer.selection.getSelection().anchorNode;
        if (!caretNode) {
          // selection not in editor
          return {
              nodes: [],
              partial: false
          };
        }
        if (caretNode.nodeType === 3) {
          searchNodes = [caretNode];
        }
      }

      // Handle collapsed selection caret
      if (!searchNodes.length) {
        range = composer.selection.getOwnRanges()[0];
        if (range) {
          searchNodes = [range.endContainer];
        }
      }

      for (var i = 0, maxi = searchNodes.length; i < maxi; i++) {
        node = findSimilarTextNodeWrapper(searchNodes[i], options, composer.element, exact);
        if (node) {
          nodes.push(node);
        } else {
          partial = true;
        }
      }

    }
    
    return {
      nodes: nodes,
      partial: partial
    };
  }

  // Returns if caret is inside a word in textnode (not on boundary)
  // If selection anchornode is not text node, returns false
  function caretIsInsideWord(selection) {
    var anchor, offset, beforeChar, afterChar;
    if (selection) {
      anchor = selection.anchorNode;
      offset = selection.anchorOffset;
      if (anchor && anchor.nodeType === 3 && offset > 0 && offset < anchor.data.length) {
        beforeChar = anchor.data[offset - 1];
        afterChar = anchor.data[offset];
        return (/\w/).test(beforeChar) && (/\w/).test(afterChar);
      }
    }
    return false;
  }

  // Returns a range and textnode containing object from caret position covering a whole word
  // wordOffsety describes the original position of caret in the new textNode 
  // Caret has to be inside a textNode.
  function getRangeForWord(selection) {
    var anchor, offset, doc, range, offsetStart, offsetEnd, beforeChar, afterChar,
        txtNodes = [];
    if (selection) {
      anchor = selection.anchorNode;
      offset = offsetStart = offsetEnd = selection.anchorOffset;
      doc = anchor.ownerDocument;
      range = rangy.createRange(doc);

      if (anchor && anchor.nodeType === 3) {

        while (offsetStart > 0 && (/\w/).test(anchor.data[offsetStart - 1])) {
          offsetStart--;
        }

        while (offsetEnd < anchor.data.length && (/\w/).test(anchor.data[offsetEnd])) {
          offsetEnd++;
        }

        range.setStartAndEnd(anchor, offsetStart, offsetEnd);
        range.splitBoundaries();
        txtNodes = range.getNodes([3], function(node) {
          return (!wysihtml5.dom.domNode(node).is.emptyTextNode());
        });

        return {
          wordOffset: offset - offsetStart,
          range: range,
          textNode: txtNodes[0]
        };

      }
    }
    return false;
  }

  // Contents of 2 elements are merged to fitst element. second element is removed as consequence
  function mergeContents(element1, element2) {
    while (element2.firstChild) {
      element1.appendChild(element2.firstChild);
    }
    element2.parentNode.removeChild(element2);
  }

  function mergeConsequentSimilarElements(elements) {
    for (var i = elements.length; i--;) {
      
      if (elements[i] && elements[i].parentNode) { // Test if node is not allready removed in cleanup

        if (elements[i].nextSibling && isSameNode(elements[i], elements[i].nextSibling)) {
          mergeContents(elements[i], elements[i].nextSibling);
        }

        if (elements[i].previousSibling && isSameNode(elements[i]  , elements[i].previousSibling)) {
          mergeContents(elements[i].previousSibling, elements[i]);
        }

      }
    }
  }

  function cleanupAndSetSelection(composer, textNodes, options) {
    if (textNodes.length > 0) {
      selectTextNodes(textNodes, composer);
    }
    mergeConsequentSimilarElements(getState(composer, options).nodes);
    if (textNodes.length > 0) {
      selectTextNodes(textNodes, composer);
    }
  }

  function cleanupAndSetCaret(composer, textNode, offset, options) {
    selectTextNode(composer, textNode, offset);
    mergeConsequentSimilarElements(getState(composer, options).nodes);
    selectTextNode(composer, textNode, offset);
  }

  // Formats a textnode with given options
  function formatTextNode(textNode, options) {
    var wrapNode = createWrapNode(textNode, options);

    textNode.parentNode.insertBefore(wrapNode, textNode);
    wrapNode.appendChild(textNode);
  }

  // Changes/toggles format of a textnode
  function unformatTextNode(textNode, composer, options) {
    var container = composer.element,
        wrapNode = findSimilarTextNodeWrapper(textNode, options, container),
        newWrapNode;

    if (wrapNode) {
      newWrapNode = wrapNode.cloneNode(false);

      wysihtml5.dom.domNode(textNode).escapeParent(wrapNode, newWrapNode);
      updateFormatOfElement(newWrapNode, options);
    }
  }

  // Removes the format around textnode
  function removeFormatFromTextNode(textNode, composer, options) {
    var container = composer.element,
        wrapNode = findSimilarTextNodeWrapper(textNode, options, container);

    if (wrapNode) {
      wysihtml5.dom.domNode(textNode).escapeParent(wrapNode);
    }
  }

  // Creates node around caret formated with options
  function formatTextRange(range, composer, options) {
    var wrapNode = createWrapNode(range.endContainer, options);

    range.surroundContents(wrapNode);
    composer.selection.selectNode(wrapNode);
  }

  // Changes/toggles format of whole selection
  function updateFormat(composer, textNodes, state, options) {
    var exactState = getState(composer, options, true),
        selection = composer.selection.getSelection(),
        wordObj, textNode, newNode, i;

    if (!textNodes.length) {
      // Selection is caret


      if (options.toggle !== false) {
        if (caretIsInsideWord(selection)) {

          // Unformat whole word 
          wordObj = getRangeForWord(selection);
          textNode = wordObj.textNode;
          unformatTextNode(wordObj.textNode, composer, options);
          cleanupAndSetCaret(composer, wordObj.textNode, wordObj.wordOffset, options);

        } else {

          // Escape caret out of format
          textNode = composer.doc.createTextNode(wysihtml5.INVISIBLE_SPACE);
          newNode = state.nodes[0].cloneNode(false);
          newNode.appendChild(textNode);
          composer.selection.splitElementAtCaret(state.nodes[0], newNode);
          updateFormatOfElement(newNode, options);
          cleanupAndSetSelection(composer, [textNode], options);
          var s = composer.selection.getSelection();
          if (s.anchorNode && s.focusNode) {
            // Has an error in IE when collapsing selection. probably from rangy
            try {
              s.collapseToEnd();
            } catch (e) {}
          }
        }
      } else {
        // In non-toggle mode the closest state element has to be found and the state updated differently
        for (i = state.nodes.length; i--;) {
          updateFormatOfElement(state.nodes[i], options);
        }
      }

    } else {

      if (!exactState.partial && options.toggle !== false) {

        // If whole selection (all textnodes) are in the applied format
        // remove the format from selection
        // Non-toggle mode never removes. Remove has to be called explicitly
        for (i = textNodes.length; i--;) {
          unformatTextNode(textNodes[i], composer, options);
        }

      } else {
        
        // Selection is partially in format
        // change it to new if format if textnode allreafy in similar state
        // else just apply
        
        for (i = textNodes.length; i--;) {
          
          if (findSimilarTextNodeWrapper(textNodes[i], options, composer.element)) {
            unformatTextNode(textNodes[i], composer, options);
          }

          if (!findSimilarTextNodeWrapper(textNodes[i], options, composer.element)) {
            formatTextNode(textNodes[i], options);
          }
        }

      }

      cleanupAndSetSelection(composer, textNodes, options);
    }
  }

  // Removes format from selection
  function removeFormat(composer, textNodes, state, options) {
    var textNode, textOffset, newNode, i,
        selection = composer.selection.getSelection();

    if (!textNodes.length) {    
      textNode = selection.anchorNode;
      textOffset = selection.anchorOffset;

      for (i = state.nodes.length; i--;) {
        wysihtml5.dom.unwrap(state.nodes[i]);
      }

      cleanupAndSetCaret(composer, textNode, textOffset, options);
    } else {
      for (i = textNodes.length; i--;) {
        removeFormatFromTextNode(textNodes[i], composer, options);
      }
      cleanupAndSetSelection(composer, textNodes, options);
    }
  }

  // Adds format to selection
  function applyFormat(composer, textNodes, options) {
    var wordObj, i,
        selection = composer.selection.getSelection();
 
    if (!textNodes.length) {
      // Handle collapsed selection caret and return
      if (caretIsInsideWord(selection)) {

        wordObj = getRangeForWord(selection);
        formatTextNode(wordObj.textNode, options);
        cleanupAndSetCaret(composer, wordObj.textNode, wordObj.wordOffset, options);

      } else {
        var r = composer.selection.getOwnRanges()[0];
        if (r) {
          formatTextRange(r, composer, options);
        }
      }
      
    } else {
      // Handle textnodes in selection and apply format
      for (i = textNodes.length; i--;) {
        formatTextNode(textNodes[i], options);
      }
      cleanupAndSetSelection(composer, textNodes, options);
    }
  }
  
  // If properties is passed as a string, correct options with that nodeName
  function fixOptions(options) {
    options = (typeof options === "string") ? { nodeName: options } : options;
    if (options.nodeName) { options.nodeName = options.nodeName.toUpperCase(); }
    return options;
  }

  wysihtml5.commands.formatInline = {

    // Basics:
    // In case of plain text or inline state not set wrap all non-empty textnodes with
    // In case a similar inline wrapper node is detected on one of textnodes, the wrapper node is changed (if fully contained) or split and changed (partially contained)
    //    In case of changing mode every textnode is addressed separatly
    exec: function(composer, command, options) {
      options = fixOptions(options);

      // Join adjactent textnodes first
      composer.element.normalize();

      var textNodes = getSelectedTextNodes(composer.selection, true),
          state = getState(composer, options);
      if (state.nodes.length > 0) {
        // Text allready has the format applied
        updateFormat(composer, textNodes, state, options);
      } else {
        // Selection is not in the applied format
        applyFormat(composer, textNodes, options);
      }
      composer.element.normalize();
    },

    remove: function(composer, command, options) {
      options = fixOptions(options);
      composer.element.normalize();

      var textNodes = getSelectedTextNodes(composer.selection, true),
          state = getState(composer, options);

      if (state.nodes.length > 0) {
        // Text allready has the format applied
        removeFormat(composer, textNodes, state, options);
      }
      
      composer.element.normalize();
    },

    state: function(composer, command, options) {
      options = fixOptions(options);
      var nodes = getState(composer, options, true).nodes;
      return (nodes.length === 0) ? false : nodes;
    }
  };

})(wysihtml5);
;(function(wysihtml5) {

  var nodeOptions = {
    nodeName: "BLOCKQUOTE",
    toggle: true
  };

  wysihtml5.commands.insertBlockQuote = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };

})(wysihtml5);
;(function(wysihtml5){
  wysihtml5.commands.insertHTML = {
    exec: function(composer, command, html) {
      if (composer.commands.support(command)) {
        composer.doc.execCommand(command, false, html);
      } else {
        composer.selection.insertHTML(html);
      }
    },

    state: function() {
      return false;
    }
  };
}(wysihtml5));
;(function(wysihtml5) {
  var NODE_NAME = "IMG";

  wysihtml5.commands.insertImage = {
    /**
     * Inserts an <img>
     * If selection is already an image link, it removes it
     *
     * @example
     *    // either ...
     *    wysihtml5.commands.insertImage.exec(composer, "insertImage", "http://www.google.de/logo.jpg");
     *    // ... or ...
     *    wysihtml5.commands.insertImage.exec(composer, "insertImage", { src: "http://www.google.de/logo.jpg", title: "foo" });
     */
    exec: function(composer, command, value) {
      value = typeof(value) === "object" ? value : { src: value };

      var doc     = composer.doc,
          image   = this.state(composer),
          textNode,
          parent;

      // If image is selected and src ie empty, set the caret before it and delete the image
      if (image && !value.src) {
        composer.selection.setBefore(image);
        parent = image.parentNode;
        parent.removeChild(image);

        // and it's parent <a> too if it hasn't got any other relevant child nodes
        wysihtml5.dom.removeEmptyTextNodes(parent);
        if (parent.nodeName === "A" && !parent.firstChild) {
          composer.selection.setAfter(parent);
          parent.parentNode.removeChild(parent);
        }

        // firefox and ie sometimes don't remove the image handles, even though the image got removed
        wysihtml5.quirks.redraw(composer.element);
        return;
      }

      // If image selected change attributes accordingly
      if (image) {
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            image.setAttribute(key === "className" ? "class" : key, value[key]);
          }
        }
        return;
      }

      // Otherwise lets create the image
      image = doc.createElement(NODE_NAME);

      for (var i in value) {
        image.setAttribute(i === "className" ? "class" : i, value[i]);
      }

      composer.selection.insertNode(image);
      if (wysihtml5.browser.hasProblemsSettingCaretAfterImg()) {
        textNode = doc.createTextNode(wysihtml5.INVISIBLE_SPACE);
        composer.selection.insertNode(textNode);
        composer.selection.setAfter(textNode);
      } else {
        composer.selection.setAfter(image);
      }
    },

    state: function(composer) {
      var doc = composer.doc,
          selectedNode,
          text,
          imagesInSelection;

      if (!wysihtml5.dom.hasElementWithTagName(doc, NODE_NAME)) {
        return false;
      }

      selectedNode = composer.selection.getSelectedNode();
      if (!selectedNode) {
        return false;
      }

      if (selectedNode.nodeName === NODE_NAME) {
        // This works perfectly in IE
        return selectedNode;
      }

      if (selectedNode.nodeType !== wysihtml5.ELEMENT_NODE) {
        return false;
      }

      text = composer.selection.getText();
      text = wysihtml5.lang.string(text).trim();
      if (text) {
        return false;
      }

      imagesInSelection = composer.selection.getNodes(wysihtml5.ELEMENT_NODE, function(node) {
        return node.nodeName === "IMG";
      });

      if (imagesInSelection.length !== 1) {
        return false;
      }

      return imagesInSelection[0];
    }
  };
})(wysihtml5);
;(function(wysihtml5) {
  var LINE_BREAK = "<br>" + (wysihtml5.browser.needsSpaceAfterLineBreak() ? " " : "");

  wysihtml5.commands.insertLineBreak = {
    exec: function(composer, command) {
      if (composer.commands.support(command)) {
        composer.doc.execCommand(command, false, null);
        if (!wysihtml5.browser.autoScrollsToCaret()) {
          composer.selection.scrollIntoView();
        }
      } else {
        composer.commands.exec("insertHTML", LINE_BREAK);
      }
    },

    state: function() {
      return false;
    }
  };
})(wysihtml5);
;(function(wysihtml5){
  wysihtml5.commands.insertOrderedList = {
    exec: function(composer, command) {
      wysihtml5.commands.insertList.exec(composer, command, "OL");
    },

    state: function(composer, command) {
      return wysihtml5.commands.insertList.state(composer, command, "OL");
    }
  };
}(wysihtml5));
;(function(wysihtml5){
  wysihtml5.commands.insertUnorderedList = {
    exec: function(composer, command) {
      wysihtml5.commands.insertList.exec(composer, command, "UL");
    },

    state: function(composer, command) {
      return wysihtml5.commands.insertList.state(composer, command, "UL");
    }
  };
}(wysihtml5));
;wysihtml5.commands.insertList = (function(wysihtml5) {

  var isNode = function(node, name) {
    if (node && node.nodeName) {
      if (typeof name === 'string') {
        name = [name];
      }
      for (var n = name.length; n--;) {
        if (node.nodeName === name[n]) {
          return true;
        }
      }
    }
    return false;
  };

  var findListEl = function(node, nodeName, composer) {
    var ret = {
          el: null,
          other: false
        };

    if (node) {
      var parentLi = wysihtml5.dom.getParentElement(node, { query: "li" }, false, composer.element),
          otherNodeName = (nodeName === "UL") ? "OL" : "UL";

      if (isNode(node, nodeName)) {
        ret.el = node;
      } else if (isNode(node, otherNodeName)) {
        ret = {
          el: node,
          other: true
        };
      } else if (parentLi) {
        if (isNode(parentLi.parentNode, nodeName)) {
          ret.el = parentLi.parentNode;
        } else if (isNode(parentLi.parentNode, otherNodeName)) {
          ret = {
            el : parentLi.parentNode,
            other: true
          };
        }
      }
    }

    // do not count list elements outside of composer
    if (ret.el && !composer.element.contains(ret.el)) {
      ret.el = null;
    }

    return ret;
  };

  var handleSameTypeList = function(el, nodeName, composer) {
    var otherNodeName = (nodeName === "UL") ? "OL" : "UL",
        otherLists, innerLists;
    // Unwrap list
    // <ul><li>foo</li><li>bar</li></ul>
    // becomes:
    // foo<br>bar<br>

    composer.selection.executeAndRestoreRangy(function() {
      otherLists = getListsInSelection(otherNodeName, composer);
      if (otherLists.length) {
        for (var l = otherLists.length; l--;) {
          wysihtml5.dom.renameElement(otherLists[l], nodeName.toLowerCase());
        }
      } else {
        innerLists = getListsInSelection(['OL', 'UL'], composer);
        for (var i = innerLists.length; i--;) {
          wysihtml5.dom.resolveList(innerLists[i], composer.config.useLineBreaks);
        }
        wysihtml5.dom.resolveList(el, composer.config.useLineBreaks);
      }
    });
  };

  var handleOtherTypeList =  function(el, nodeName, composer) {
    var otherNodeName = (nodeName === "UL") ? "OL" : "UL";
    // Turn an ordered list into an unordered list
    // <ol><li>foo</li><li>bar</li></ol>
    // becomes:
    // <ul><li>foo</li><li>bar</li></ul>
    // Also rename other lists in selection
    composer.selection.executeAndRestoreRangy(function() {
      var renameLists = [el].concat(getListsInSelection(otherNodeName, composer));

      // All selection inner lists get renamed too
      for (var l = renameLists.length; l--;) {
        wysihtml5.dom.renameElement(renameLists[l], nodeName.toLowerCase());
      }
    });
  };

  var getListsInSelection = function(nodeName, composer) {
      var ranges = composer.selection.getOwnRanges(),
          renameLists = [];

      for (var r = ranges.length; r--;) {
        renameLists = renameLists.concat(ranges[r].getNodes([1], function(node) {
          return isNode(node, nodeName);
        }));
      }

      return renameLists;
  };

  var createListFallback = function(nodeName, composer) {
    // Fallback for Create list
    composer.selection.executeAndRestoreRangy(function() {
      var tempClassName =  "_wysihtml5-temp-" + new Date().getTime(),
          tempElement = composer.selection.deblockAndSurround({
            "nodeName": "div",
            "className": tempClassName
          }),
          isEmpty, list;

      // This space causes new lists to never break on enter
      var INVISIBLE_SPACE_REG_EXP = /\uFEFF/g;
      tempElement.innerHTML = tempElement.innerHTML.replace(wysihtml5.INVISIBLE_SPACE_REG_EXP, "");

      if (tempElement) {
        isEmpty = wysihtml5.lang.array(["", "<br>", wysihtml5.INVISIBLE_SPACE]).contains(tempElement.innerHTML);
        list = wysihtml5.dom.convertToList(tempElement, nodeName.toLowerCase(), composer.parent.config.classNames.uneditableContainer);
        if (isEmpty) {
          composer.selection.selectNode(list.querySelector("li"), true);
        }
      }
    });
  };

  return {
    exec: function(composer, command, nodeName) {
      var doc           = composer.doc,
          cmd           = (nodeName === "OL") ? "insertOrderedList" : "insertUnorderedList",
          selectedNode  = composer.selection.getSelectedNode(),
          list          = findListEl(selectedNode, nodeName, composer);


      if (!list.el) {
        if (composer.commands.support(cmd)) {
          doc.execCommand(cmd, false, null);
        } else {
          createListFallback(nodeName, composer);
        }
      } else if (list.other) {
        handleOtherTypeList(list.el, nodeName, composer);
      } else {
        handleSameTypeList(list.el, nodeName, composer);
      }
    },

    state: function(composer, command, nodeName) {
      var selectedNode = composer.selection.getSelectedNode(),
          list         = findListEl(selectedNode, nodeName, composer);

      return (list.el && !list.other) ? list.el : false;
    }
  };

})(wysihtml5);
;(function(wysihtml5){
  
  var nodeOptions = {
    nodeName: "I",
    toggle: true
  };

  wysihtml5.commands.italic = {
    exec: function(composer, command) {
      wysihtml5.commands.formatInline.exec(composer, command, nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, nodeOptions);
    }
  };

}(wysihtml5));
;(function(wysihtml5) {

  var nodeOptions = {
    className: "wysiwyg-text-align-center",
    classRegExp: /wysiwyg-text-align-[0-9a-z]+/g,
    toggle: true
  };

  wysihtml5.commands.justifyCenter = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };
  
})(wysihtml5);
;(function(wysihtml5) {

  var nodeOptions = {
    className: "wysiwyg-text-align-left",
    classRegExp: /wysiwyg-text-align-[0-9a-z]+/g,
    toggle: true
  };

  wysihtml5.commands.justifyLeft = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };
})(wysihtml5);
;(function(wysihtml5) {

  var nodeOptions = {
    className: "wysiwyg-text-align-right",
    classRegExp: /wysiwyg-text-align-[0-9a-z]+/g,
    toggle: true
  };

  wysihtml5.commands.justifyRight = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };
})(wysihtml5);
;(function(wysihtml5) {

  var nodeOptions = {
    className: "wysiwyg-text-align-justify",
    classRegExp: /wysiwyg-text-align-[0-9a-z]+/g,
    toggle: true
  };

  wysihtml5.commands.justifyFull = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };
})(wysihtml5);
;(function(wysihtml5) {
  
  var nodeOptions = {
    styleProperty: "textAlign",
    styleValue: "right",
    toggle: true
  };

  wysihtml5.commands.alignRightStyle = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };
})(wysihtml5);
;(function(wysihtml5) {

  var nodeOptions = {
    styleProperty: "textAlign",
    styleValue: "left",
    toggle: true
  };

  wysihtml5.commands.alignLeftStyle = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };

})(wysihtml5);
;(function(wysihtml5) {

  var nodeOptions = {
    styleProperty: "textAlign",
    styleValue: "center",
    toggle: true
  };

  wysihtml5.commands.alignCenterStyle = {
    exec: function(composer, command) {
      return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatBlock.state(composer, "formatBlock", nodeOptions);
    }
  };

})(wysihtml5);
;(function(wysihtml5){
  wysihtml5.commands.redo = {
    exec: function(composer) {
      return composer.undoManager.redo();
    },

    state: function(composer) {
      return false;
    }
  };
}(wysihtml5));
;(function(wysihtml5){

  var nodeOptions = {
    nodeName: "U",
    toggle: true
  };

  wysihtml5.commands.underline = {
    exec: function(composer, command) {
      wysihtml5.commands.formatInline.exec(composer, command, nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, nodeOptions);
    }
  };

}(wysihtml5));
;(function(wysihtml5){
  wysihtml5.commands.undo = {
    exec: function(composer) {
      return composer.undoManager.undo();
    },

    state: function(composer) {
      return false;
    }
  };
}(wysihtml5));
;(function(wysihtml5){
  wysihtml5.commands.createTable = {
    exec: function(composer, command, value) {
      var col, row, html;
      if (value && value.cols && value.rows && parseInt(value.cols, 10) > 0 && parseInt(value.rows, 10) > 0) {
        if (value.tableStyle) {
          html = "<table style=\"" + value.tableStyle + "\">";
        } else {
          html = "<table>";
        }
        html += "<tbody>";
        for (row = 0; row < value.rows; row ++) {
          html += '<tr>';
          for (col = 0; col < value.cols; col ++) {
            html += "<td><br></td>";
          }
          html += '</tr>';
        }
        html += "</tbody></table>";
        composer.commands.exec("insertHTML", html);
        //composer.selection.insertHTML(html);
      }
    },

    state: function(composer, command) {
      return false;
    }
  };

}(wysihtml5));
;(function(wysihtml5){
  wysihtml5.commands.mergeTableCells = {
    exec: function(composer, command) {
      if (composer.tableSelection && composer.tableSelection.start && composer.tableSelection.end) {
        if (this.state(composer, command)) {
          wysihtml5.dom.table.unmergeCell(composer.tableSelection.start);
        } else {
          wysihtml5.dom.table.mergeCellsBetween(composer.tableSelection.start, composer.tableSelection.end);
        }
      }
    },

    state: function(composer, command) {
      if (composer.tableSelection) {
        var start = composer.tableSelection.start,
          end = composer.tableSelection.end;
        if (start && end && start == end &&
          ((
            wysihtml5.dom.getAttribute(start, "colspan") &&
            parseInt(wysihtml5.dom.getAttribute(start, "colspan"), 10) > 1
          ) || (
            wysihtml5.dom.getAttribute(start, "rowspan") &&
            parseInt(wysihtml5.dom.getAttribute(start, "rowspan"), 10) > 1
          ))
        ) {
          return [start];
        }
      }
      return false;
    }
  };
}(wysihtml5));
;(function(wysihtml5){
  wysihtml5.commands.addTableCells = {
    exec: function(composer, command, value) {
      if (composer.tableSelection && composer.tableSelection.start && composer.tableSelection.end) {

        // switches start and end if start is bigger than end (reverse selection)
        var tableSelect = wysihtml5.dom.table.orderSelectionEnds(composer.tableSelection.start, composer.tableSelection.end);
        if (value == "before" || value == "above") {
          wysihtml5.dom.table.addCells(tableSelect.start, value);
        } else if (value == "after" || value == "below") {
          wysihtml5.dom.table.addCells(tableSelect.end, value);
        }
        setTimeout(function() {
          composer.tableSelection.select(tableSelect.start, tableSelect.end);
        },0);
      }
    },

    state: function(composer, command) {
      return false;
    }
  };
}(wysihtml5));
;(function(wysihtml5){
  wysihtml5.commands.deleteTableCells = {
  exec: function(composer, command, value) {
    if (composer.tableSelection && composer.tableSelection.start && composer.tableSelection.end) {
      var tableSelect = wysihtml5.dom.table.orderSelectionEnds(composer.tableSelection.start, composer.tableSelection.end),
        idx = wysihtml5.dom.table.indexOf(tableSelect.start),
        selCell,
        table = composer.tableSelection.table;

      wysihtml5.dom.table.removeCells(tableSelect.start, value);
      setTimeout(function() {
        // move selection to next or previous if not present
        selCell = wysihtml5.dom.table.findCell(table, idx);

        if (!selCell){
          if (value == "row") {
            selCell = wysihtml5.dom.table.findCell(table, {
              "row": idx.row - 1,
              "col": idx.col
            });
          }

          if (value == "column") {
            selCell = wysihtml5.dom.table.findCell(table, {
              "row": idx.row,
              "col": idx.col - 1
            });
          }
        }
        if (selCell) {
          composer.tableSelection.select(selCell, selCell);
        }
      }, 0);
    }
  },

  state: function(composer, command) {
    return false;
  }
  };
}(wysihtml5));
;(function(wysihtml5){
  wysihtml5.commands.indentList = {
    exec: function(composer, command, value) {
      var listEls = composer.selection.getSelectionParentsByTag('LI');
      if (listEls) {
        return this.tryToPushLiLevel(listEls, composer.selection);
      }
      return false;
    },

    state: function(composer, command) {
        return false;
    },

    tryToPushLiLevel: function(liNodes, selection) {
      var listTag, list, prevLi, liNode, prevLiList,
          found = false;

      selection.executeAndRestoreRangy(function() {

        for (var i = liNodes.length; i--;) {
          liNode = liNodes[i];
          listTag = (liNode.parentNode.nodeName === 'OL') ? 'OL' : 'UL';
          list = liNode.ownerDocument.createElement(listTag);
          prevLi = wysihtml5.dom.domNode(liNode).prev({nodeTypes: [wysihtml5.ELEMENT_NODE]});
          prevLiList = (prevLi) ? prevLi.querySelector('ul, ol') : null;

          if (prevLi) {
            if (prevLiList) {
              prevLiList.appendChild(liNode);
            } else {
              list.appendChild(liNode);
              prevLi.appendChild(list);
            }
            found = true;
          }
        }

      });
      return found;
    }
  };
}(wysihtml5));
;(function(wysihtml5){

  wysihtml5.commands.outdentList = {
    exec: function(composer, command, value) {
      var listEls = composer.selection.getSelectionParentsByTag('LI');
      if (listEls) {
        return this.tryToPullLiLevel(listEls, composer);
      }
      return false;
    },

    state: function(composer, command) {
        return false;
    },

    tryToPullLiLevel: function(liNodes, composer) {
      var listNode, outerListNode, outerLiNode, list, prevLi, liNode, afterList,
          found = false,
          that = this;

      composer.selection.executeAndRestoreRangy(function() {

        for (var i = liNodes.length; i--;) {
          liNode = liNodes[i];
          if (liNode.parentNode) {
            listNode = liNode.parentNode;

            if (listNode.tagName === 'OL' || listNode.tagName === 'UL') {
              found = true;

              outerListNode = wysihtml5.dom.getParentElement(listNode.parentNode, { query: 'ol, ul' }, false, composer.element);
              outerLiNode = wysihtml5.dom.getParentElement(listNode.parentNode, { query: 'li' }, false, composer.element);

              if (outerListNode && outerLiNode) {

                if (liNode.nextSibling) {
                  afterList = that.getAfterList(listNode, liNode);
                  liNode.appendChild(afterList);
                }
                outerListNode.insertBefore(liNode, outerLiNode.nextSibling);

              } else {

                if (liNode.nextSibling) {
                  afterList = that.getAfterList(listNode, liNode);
                  liNode.appendChild(afterList);
                }

                for (var j = liNode.childNodes.length; j--;) {
                  listNode.parentNode.insertBefore(liNode.childNodes[j], listNode.nextSibling);
                }

                listNode.parentNode.insertBefore(document.createElement('br'), listNode.nextSibling);
                liNode.parentNode.removeChild(liNode);

              }

              // cleanup
              if (listNode.childNodes.length === 0) {
                  listNode.parentNode.removeChild(listNode);
              }
            }
          }
        }

      });
      return found;
    },

    getAfterList: function(listNode, liNode) {
      var nodeName = listNode.nodeName,
          newList = document.createElement(nodeName);

      while (liNode.nextSibling) {
        newList.appendChild(liNode.nextSibling);
      }
      return newList;
    }

  };
}(wysihtml5));
;(function(wysihtml5){
  
  var nodeOptions = {
    nodeName: "SUB",
    toggle: true
  };

  wysihtml5.commands.subscript = {
    exec: function(composer, command) {
      wysihtml5.commands.formatInline.exec(composer, command, nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, nodeOptions);
    }
  };
}(wysihtml5));
;(function(wysihtml5) {

	var nodeOptions = {
    nodeName: "SUP",
    toggle: true
  };

  wysihtml5.commands.superscript = {
    exec: function(composer, command) {
      wysihtml5.commands.formatInline.exec(composer, command, nodeOptions);
    },

    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, nodeOptions);
    }
  };
}(wysihtml5));
;/**
 * Undo Manager for wysihtml5
 * slightly inspired by http://rniwa.com/editing/undomanager.html#the-undomanager-interface
 */
(function(wysihtml5) {
  var Z_KEY               = 90,
      Y_KEY               = 89,
      BACKSPACE_KEY       = 8,
      DELETE_KEY          = 46,
      MAX_HISTORY_ENTRIES = 25,
      DATA_ATTR_NODE      = "data-wysihtml5-selection-node",
      DATA_ATTR_OFFSET    = "data-wysihtml5-selection-offset",
      UNDO_HTML           = '<span id="_wysihtml5-undo" class="_wysihtml5-temp">' + wysihtml5.INVISIBLE_SPACE + '</span>',
      REDO_HTML           = '<span id="_wysihtml5-redo" class="_wysihtml5-temp">' + wysihtml5.INVISIBLE_SPACE + '</span>',
      dom                 = wysihtml5.dom;

  function cleanTempElements(doc) {
    var tempElement;
    while (tempElement = doc.querySelector("._wysihtml5-temp")) {
      tempElement.parentNode.removeChild(tempElement);
    }
  }

  wysihtml5.UndoManager = wysihtml5.lang.Dispatcher.extend(
    /** @scope wysihtml5.UndoManager.prototype */ {
    constructor: function(editor) {
      this.editor = editor;
      this.composer = editor.composer;
      this.element = this.composer.element;

      this.position = 0;
      this.historyStr = [];
      this.historyDom = [];

      this.transact();

      this._observe();
    },

    _observe: function() {
      var that      = this,
          doc       = this.composer.sandbox.getDocument(),
          lastKey;

      // Catch CTRL+Z and CTRL+Y
      dom.observe(this.element, "keydown", function(event) {
        if (event.altKey || (!event.ctrlKey && !event.metaKey)) {
          return;
        }

        var keyCode = event.keyCode,
            isUndo = keyCode === Z_KEY && !event.shiftKey,
            isRedo = (keyCode === Z_KEY && event.shiftKey) || (keyCode === Y_KEY);

        if (isUndo) {
          that.undo();
          event.preventDefault();
        } else if (isRedo) {
          that.redo();
          event.preventDefault();
        }
      });

      // Catch delete and backspace
      dom.observe(this.element, "keydown", function(event) {
        var keyCode = event.keyCode;
        if (keyCode === lastKey) {
          return;
        }

        lastKey = keyCode;

        if (keyCode === BACKSPACE_KEY || keyCode === DELETE_KEY) {
          that.transact();
        }
      });

      this.editor
        .on("newword:composer", function() {
          that.transact();
        })

        .on("beforecommand:composer", function() {
          that.transact();
        });
    },

    transact: function() {
      var previousHtml      = this.historyStr[this.position - 1],
          currentHtml       = this.composer.getValue(false, false),
          composerIsVisible   = this.element.offsetWidth > 0 && this.element.offsetHeight > 0,
          range, node, offset, element, position;

      if (currentHtml === previousHtml) {
        return;
      }

      var length = this.historyStr.length = this.historyDom.length = this.position;
      if (length > MAX_HISTORY_ENTRIES) {
        this.historyStr.shift();
        this.historyDom.shift();
        this.position--;
      }

      this.position++;

      if (composerIsVisible) {
        // Do not start saving selection if composer is not visible
        range   = this.composer.selection.getRange();
        node    = (range && range.startContainer) ? range.startContainer : this.element;
        offset  = (range && range.startOffset) ? range.startOffset : 0;

        if (node.nodeType === wysihtml5.ELEMENT_NODE) {
          element = node;
        } else {
          element  = node.parentNode;
          position = this.getChildNodeIndex(element, node);
        }

        element.setAttribute(DATA_ATTR_OFFSET, offset);
        if (typeof(position) !== "undefined") {
          element.setAttribute(DATA_ATTR_NODE, position);
        }
      }

      var clone = this.element.cloneNode(!!currentHtml);
      this.historyDom.push(clone);
      this.historyStr.push(currentHtml);

      if (element) {
        element.removeAttribute(DATA_ATTR_OFFSET);
        element.removeAttribute(DATA_ATTR_NODE);
      }

    },

    undo: function() {
      this.transact();

      if (!this.undoPossible()) {
        return;
      }

      this.set(this.historyDom[--this.position - 1]);
      this.editor.fire("undo:composer");
    },

    redo: function() {
      if (!this.redoPossible()) {
        return;
      }

      this.set(this.historyDom[++this.position - 1]);
      this.editor.fire("redo:composer");
    },

    undoPossible: function() {
      return this.position > 1;
    },

    redoPossible: function() {
      return this.position < this.historyStr.length;
    },

    set: function(historyEntry) {
      this.element.innerHTML = "";

      var i = 0,
          childNodes = historyEntry.childNodes,
          length = historyEntry.childNodes.length;

      for (; i<length; i++) {
        this.element.appendChild(childNodes[i].cloneNode(true));
      }

      // Restore selection
      var offset,
          node,
          position;

      if (historyEntry.hasAttribute(DATA_ATTR_OFFSET)) {
        offset    = historyEntry.getAttribute(DATA_ATTR_OFFSET);
        position  = historyEntry.getAttribute(DATA_ATTR_NODE);
        node      = this.element;
      } else {
        node      = this.element.querySelector("[" + DATA_ATTR_OFFSET + "]") || this.element;
        offset    = node.getAttribute(DATA_ATTR_OFFSET);
        position  = node.getAttribute(DATA_ATTR_NODE);
        node.removeAttribute(DATA_ATTR_OFFSET);
        node.removeAttribute(DATA_ATTR_NODE);
      }

      if (position !== null) {
        node = this.getChildNodeByIndex(node, +position);
      }

      this.composer.selection.set(node, offset);
    },

    getChildNodeIndex: function(parent, child) {
      var i           = 0,
          childNodes  = parent.childNodes,
          length      = childNodes.length;
      for (; i<length; i++) {
        if (childNodes[i] === child) {
          return i;
        }
      }
    },

    getChildNodeByIndex: function(parent, index) {
      return parent.childNodes[index];
    }
  });
})(wysihtml5);
;/**
 * TODO: the following methods still need unit test coverage
 */
wysihtml5.views.View = Base.extend(
  /** @scope wysihtml5.views.View.prototype */ {
  constructor: function(parent, textareaElement, config) {
    this.parent   = parent;
    this.element  = textareaElement;
    this.config   = config;
    if (!this.config.noTextarea) {
        this._observeViewChange();
    }
  },

  _observeViewChange: function() {
    var that = this;
    this.parent.on("beforeload", function() {
      that.parent.on("change_view", function(view) {
        if (view === that.name) {
          that.parent.currentView = that;
          that.show();
          // Using tiny delay here to make sure that the placeholder is set before focusing
          setTimeout(function() { that.focus(); }, 0);
        } else {
          that.hide();
        }
      });
    });
  },

  focus: function() {
    if (this.element && this.element.ownerDocument && this.element.ownerDocument.querySelector(":focus") === this.element) {
      return;
    }

    try { if(this.element) { this.element.focus(); } } catch(e) {}
  },

  hide: function() {
    this.element.style.display = "none";
  },

  show: function() {
    this.element.style.display = "";
  },

  disable: function() {
    this.element.setAttribute("disabled", "disabled");
  },

  enable: function() {
    this.element.removeAttribute("disabled");
  }
});
;(function(wysihtml5) {
  var dom       = wysihtml5.dom,
      browser   = wysihtml5.browser;

  wysihtml5.views.Composer = wysihtml5.views.View.extend(
    /** @scope wysihtml5.views.Composer.prototype */ {
    name: "composer",

    // Needed for firefox in order to display a proper caret in an empty contentEditable
    CARET_HACK: "<br>",

    constructor: function(parent, editableElement, config) {
      this.base(parent, editableElement, config);
      if (!this.config.noTextarea) {
          this.textarea = this.parent.textarea;
      } else {
          this.editableArea = editableElement;
      }
      if (this.config.contentEditableMode) {
          this._initContentEditableArea();
      } else {
          this._initSandbox();
      }
    },

    clear: function() {
      this.element.innerHTML = browser.displaysCaretInEmptyContentEditableCorrectly() ? "" : this.CARET_HACK;
    },

    getValue: function(parse, clearInternals) {
      var value = this.isEmpty() ? "" : wysihtml5.quirks.getCorrectInnerHTML(this.element);
      if (parse !== false) {
        value = this.parent.parse(value, (clearInternals === false) ? false : true);
      }

      return value;
    },

    setValue: function(html, parse) {
      if (parse) {
        html = this.parent.parse(html);
      }

      try {
        this.element.innerHTML = html;
      } catch (e) {
        this.element.innerText = html;
      }
    },

    cleanUp: function() {
      var bookmark;
      if (this.selection) {
        bookmark = rangy.saveSelection(this.win);
      }
      this.parent.parse(this.element);
      if (bookmark) {
        rangy.restoreSelection(bookmark);
      }
    },

    show: function() {
      this.editableArea.style.display = this._displayStyle || "";

      if (!this.config.noTextarea && !this.textarea.element.disabled) {
        // Firefox needs this, otherwise contentEditable becomes uneditable
        this.disable();
        this.enable();
      }
    },

    hide: function() {
      this._displayStyle = dom.getStyle("display").from(this.editableArea);
      if (this._displayStyle === "none") {
        this._displayStyle = null;
      }
      this.editableArea.style.display = "none";
    },

    disable: function() {
      this.parent.fire("disable:composer");
      this.element.removeAttribute("contentEditable");
    },

    enable: function() {
      this.parent.fire("enable:composer");
      this.element.setAttribute("contentEditable", "true");
    },

    focus: function(setToEnd) {
      // IE 8 fires the focus event after .focus()
      // This is needed by our simulate_placeholder.js to work
      // therefore we clear it ourselves this time
      if (wysihtml5.browser.doesAsyncFocus() && this.hasPlaceholderSet()) {
        this.clear();
      }

      this.base();

      var lastChild = this.element.lastChild;
      if (setToEnd && lastChild && this.selection) {
        if (lastChild.nodeName === "BR") {
          this.selection.setBefore(this.element.lastChild);
        } else {
          this.selection.setAfter(this.element.lastChild);
        }
      }
    },

    getScrollPos: function() {
      if (this.doc && this.win) {
        var pos = {};

        if (typeof this.win.pageYOffset !== "undefined") {
          pos.y = this.win.pageYOffset;
        } else {
          pos.y = (this.doc.documentElement || this.doc.body.parentNode || this.doc.body).scrollTop;
        }

        if (typeof this.win.pageXOffset !== "undefined") {
          pos.x = this.win.pageXOffset;
        } else {
          pos.x = (this.doc.documentElement || this.doc.body.parentNode || this.doc.body).scrollLeft;
        }

        return pos;
      }
    },

    setScrollPos: function(pos) {
      if (pos && typeof pos.x !== "undefined" && typeof pos.y !== "undefined") {
        this.win.scrollTo(pos.x, pos.y);
      }
    },

    getTextContent: function() {
      return dom.getTextContent(this.element);
    },

    hasPlaceholderSet: function() {
      return this.getTextContent() == ((this.config.noTextarea) ? this.editableArea.getAttribute("data-placeholder") : this.textarea.element.getAttribute("placeholder")) && this.placeholderSet;
    },

    isEmpty: function() {
      var innerHTML = this.element.innerHTML.toLowerCase();
      return (/^(\s|<br>|<\/br>|<p>|<\/p>)*$/i).test(innerHTML)  ||
             innerHTML === ""            ||
             innerHTML === "<br>"        ||
             innerHTML === "<p></p>"     ||
             innerHTML === "<p><br></p>" ||
             this.hasPlaceholderSet();
    },

    _initContentEditableArea: function() {
        var that = this;
        if (this.config.noTextarea) {
            this.sandbox = new dom.ContentEditableArea(function() {
                that._create();
            }, {
              className: this.config.classNames.sandbox
            }, this.editableArea);
        } else {
            this.sandbox = new dom.ContentEditableArea(function() {
                that._create();
            }, {
              className: this.config.classNames.sandbox
            });
            this.editableArea = this.sandbox.getContentEditable();
            dom.insert(this.editableArea).after(this.textarea.element);
            this._createWysiwygFormField();
        }
    },

    _initSandbox: function() {
      var that = this;
      this.sandbox = new dom.Sandbox(function() {
        that._create();
      }, {
        stylesheets:  this.config.stylesheets,
        className: this.config.classNames.sandbox
      });
      this.editableArea  = this.sandbox.getIframe();

      var textareaElement = this.textarea.element;
      dom.insert(this.editableArea).after(textareaElement);

      this._createWysiwygFormField();
    },

    // Creates hidden field which tells the server after submit, that the user used an wysiwyg editor
    _createWysiwygFormField: function() {
        if (this.textarea.element.form) {
          var hiddenField = document.createElement("input");
          hiddenField.type   = "hidden";
          hiddenField.name   = "_wysihtml5_mode";
          hiddenField.value  = 1;
          dom.insert(hiddenField).after(this.textarea.element);
        }
    },

    _create: function() {
      var that = this;
      this.doc                = this.sandbox.getDocument();
      this.win                = this.sandbox.getWindow();
      this.element            = (this.config.contentEditableMode) ? this.sandbox.getContentEditable() : this.doc.body;
      if (!this.config.noTextarea) {
          this.textarea           = this.parent.textarea;
          this.element.innerHTML  = this.textarea.getValue(true, false);
      } else {
          this.cleanUp(); // cleans contenteditable on initiation as it may contain html
      }

      // Make sure our selection handler is ready
      this.selection = new wysihtml5.Selection(this.parent, this.element, this.config.classNames.uneditableContainer);

      // Make sure commands dispatcher is ready
      this.commands  = new wysihtml5.Commands(this.parent);

      if (!this.config.noTextarea) {
          dom.copyAttributes([
              "className", "spellcheck", "title", "lang", "dir", "accessKey"
          ]).from(this.textarea.element).to(this.element);
      }

      dom.addClass(this.element, this.config.classNames.composer);
      //
      // Make the editor look like the original textarea, by syncing styles
      if (this.config.style && !this.config.contentEditableMode) {
        this.style();
      }

      this.observe();

      var name = this.config.name;
      if (name) {
        dom.addClass(this.element, name);
        if (!this.config.contentEditableMode) { dom.addClass(this.editableArea, name); }
      }

      this.enable();

      if (!this.config.noTextarea && this.textarea.element.disabled) {
        this.disable();
      }

      // Simulate html5 placeholder attribute on contentEditable element
      var placeholderText = typeof(this.config.placeholder) === "string"
        ? this.config.placeholder
        : ((this.config.noTextarea) ? this.editableArea.getAttribute("data-placeholder") : this.textarea.element.getAttribute("placeholder"));
      if (placeholderText) {
        dom.simulatePlaceholder(this.parent, this, placeholderText, this.config.classNames.placeholder);
      }

      // Make sure that the browser avoids using inline styles whenever possible
      this.commands.exec("styleWithCSS", false);

      this._initAutoLinking();
      this._initObjectResizing();
      this._initUndoManager();
      this._initLineBreaking();

      // Simulate html5 autofocus on contentEditable element
      // This doesn't work on IOS (5.1.1)
      if (!this.config.noTextarea && (this.textarea.element.hasAttribute("autofocus") || document.querySelector(":focus") == this.textarea.element) && !browser.isIos()) {
        setTimeout(function() { that.focus(true); }, 100);
      }

      // IE sometimes leaves a single paragraph, which can't be removed by the user
      if (!browser.clearsContentEditableCorrectly()) {
        wysihtml5.quirks.ensureProperClearing(this);
      }

      // Set up a sync that makes sure that textarea and editor have the same content
      if (this.initSync && this.config.sync) {
        this.initSync();
      }

      // Okay hide the textarea, we are ready to go
      if (!this.config.noTextarea) { this.textarea.hide(); }

      // Fire global (before-)load event
      this.parent.fire("beforeload").fire("load");
    },

    _initAutoLinking: function() {
      var that                           = this,
          supportsDisablingOfAutoLinking = browser.canDisableAutoLinking(),
          supportsAutoLinking            = browser.doesAutoLinkingInContentEditable();
      if (supportsDisablingOfAutoLinking) {
        this.commands.exec("autoUrlDetect", false);
      }

      if (!this.config.autoLink) {
        return;
      }

      // Only do the auto linking by ourselves when the browser doesn't support auto linking
      // OR when he supports auto linking but we were able to turn it off (IE9+)
      if (!supportsAutoLinking || (supportsAutoLinking && supportsDisablingOfAutoLinking)) {
        this.parent.on("newword:composer", function() {
          if (dom.getTextContent(that.element).match(dom.autoLink.URL_REG_EXP)) {
            var nodeWithSelection = that.selection.getSelectedNode(),
                uneditables = that.element.querySelectorAll("." + that.config.classNames.uneditableContainer),
                isInUneditable = false;

            for (var i = uneditables.length; i--;) {
              if (wysihtml5.dom.contains(uneditables[i], nodeWithSelection)) {
                isInUneditable = true;
              }
            }

            if (!isInUneditable) dom.autoLink(nodeWithSelection, [that.config.classNames.uneditableContainer]);
          }
        });

        dom.observe(this.element, "blur", function() {
          dom.autoLink(that.element, [that.config.classNames.uneditableContainer]);
        });
      }

      // Assuming we have the following:
      //  <a href="http://www.google.de">http://www.google.de</a>
      // If a user now changes the url in the innerHTML we want to make sure that
      // it's synchronized with the href attribute (as long as the innerHTML is still a url)
      var // Use a live NodeList to check whether there are any links in the document
          links           = this.sandbox.getDocument().getElementsByTagName("a"),
          // The autoLink helper method reveals a reg exp to detect correct urls
          urlRegExp       = dom.autoLink.URL_REG_EXP,
          getTextContent  = function(element) {
            var textContent = wysihtml5.lang.string(dom.getTextContent(element)).trim();
            if (textContent.substr(0, 4) === "www.") {
              textContent = "http://" + textContent;
            }
            return textContent;
          };

      dom.observe(this.element, "keydown", function(event) {
        if (!links.length) {
          return;
        }

        var selectedNode = that.selection.getSelectedNode(event.target.ownerDocument),
            link         = dom.getParentElement(selectedNode, { query: "a" }, 4),
            textContent;

        if (!link) {
          return;
        }

        textContent = getTextContent(link);
        // keydown is fired before the actual content is changed
        // therefore we set a timeout to change the href
        setTimeout(function() {
          var newTextContent = getTextContent(link);
          if (newTextContent === textContent) {
            return;
          }

          // Only set href when new href looks like a valid url
          if (newTextContent.match(urlRegExp)) {
            link.setAttribute("href", newTextContent);
          }
        }, 0);
      });
    },

    _initObjectResizing: function() {
      this.commands.exec("enableObjectResizing", true);

      // IE sets inline styles after resizing objects
      // The following lines make sure that the width/height css properties
      // are copied over to the width/height attributes
      if (browser.supportsEvent("resizeend")) {
        var properties        = ["width", "height"],
            propertiesLength  = properties.length,
            element           = this.element;

        dom.observe(element, "resizeend", function(event) {
          var target = event.target || event.srcElement,
              style  = target.style,
              i      = 0,
              property;

          if (target.nodeName !== "IMG") {
            return;
          }

          for (; i<propertiesLength; i++) {
            property = properties[i];
            if (style[property]) {
              target.setAttribute(property, parseInt(style[property], 10));
              style[property] = "";
            }
          }

          // After resizing IE sometimes forgets to remove the old resize handles
          wysihtml5.quirks.redraw(element);
        });
      }
    },

    _initUndoManager: function() {
      this.undoManager = new wysihtml5.UndoManager(this.parent);
    },

    _initLineBreaking: function() {
      var that                              = this,
          USE_NATIVE_LINE_BREAK_INSIDE_TAGS = "li, p, h1, h2, h3, h4, h5, h6",
          LIST_TAGS                         = "ul, ol, menu";

      function adjust(selectedNode) {
        var parentElement = dom.getParentElement(selectedNode, { query: "p, div" }, 2);
        if (parentElement && dom.contains(that.element, parentElement)) {
          that.selection.executeAndRestore(function() {
            if (that.config.useLineBreaks) {
              dom.replaceWithChildNodes(parentElement);
            } else if (parentElement.nodeName !== "P") {
              dom.renameElement(parentElement, "p");
            }
          });
        }
      }

      if (!this.config.useLineBreaks) {
        dom.observe(this.element, ["focus", "keydown"], function() {
          if (that.isEmpty()) {
            var paragraph = that.doc.createElement("P");
            that.element.innerHTML = "";
            that.element.appendChild(paragraph);
            if (!browser.displaysCaretInEmptyContentEditableCorrectly()) {
              paragraph.innerHTML = "<br>";
              that.selection.setBefore(paragraph.firstChild);
            } else {
              that.selection.selectNode(paragraph, true);
            }
          }
        });
      }

      // Under certain circumstances Chrome + Safari create nested <p> or <hX> tags after paste
      // Inserting an invisible white space in front of it fixes the issue
      // This is too hacky and causes selection not to replace content on paste in chrome
     /* if (browser.createsNestedInvalidMarkupAfterPaste()) {
        dom.observe(this.element, "paste", function(event) {
          var invisibleSpace = that.doc.createTextNode(wysihtml5.INVISIBLE_SPACE);
          that.selection.insertNode(invisibleSpace);
        });
      }*/


      dom.observe(this.element, "keydown", function(event) {
        var keyCode = event.keyCode;

        if (event.shiftKey) {
          return;
        }

        if (keyCode !== wysihtml5.ENTER_KEY && keyCode !== wysihtml5.BACKSPACE_KEY) {
          return;
        }
        var blockElement = dom.getParentElement(that.selection.getSelectedNode(), { query: USE_NATIVE_LINE_BREAK_INSIDE_TAGS }, 4);
        if (blockElement) {
          setTimeout(function() {
            // Unwrap paragraph after leaving a list or a H1-6
            var selectedNode = that.selection.getSelectedNode(),
                list;

            if (blockElement.nodeName === "LI") {
              if (!selectedNode) {
                return;
              }

              list = dom.getParentElement(selectedNode, { query: LIST_TAGS }, 2);

              if (!list) {
                adjust(selectedNode);
              }
            }

            if (keyCode === wysihtml5.ENTER_KEY && blockElement.nodeName.match(/^H[1-6]$/)) {
              adjust(selectedNode);
            }
          }, 0);
          return;
        }

        if (that.config.useLineBreaks && keyCode === wysihtml5.ENTER_KEY && !wysihtml5.browser.insertsLineBreaksOnReturn()) {
          event.preventDefault();
          that.commands.exec("insertLineBreak");

        }
      });
    }
  });
})(wysihtml5);
;(function(wysihtml5) {
  var dom             = wysihtml5.dom,
      doc             = document,
      win             = window,
      HOST_TEMPLATE   = doc.createElement("div"),
      /**
       * Styles to copy from textarea to the composer element
       */
      TEXT_FORMATTING = [
        "background-color",
        "color", "cursor",
        "font-family", "font-size", "font-style", "font-variant", "font-weight",
        "line-height", "letter-spacing",
        "text-align", "text-decoration", "text-indent", "text-rendering",
        "word-break", "word-wrap", "word-spacing"
      ],
      /**
       * Styles to copy from textarea to the iframe
       */
      BOX_FORMATTING = [
        "background-color",
        "border-collapse",
        "border-bottom-color", "border-bottom-style", "border-bottom-width",
        "border-left-color", "border-left-style", "border-left-width",
        "border-right-color", "border-right-style", "border-right-width",
        "border-top-color", "border-top-style", "border-top-width",
        "clear", "display", "float",
        "margin-bottom", "margin-left", "margin-right", "margin-top",
        "outline-color", "outline-offset", "outline-width", "outline-style",
        "padding-left", "padding-right", "padding-top", "padding-bottom",
        "position", "top", "left", "right", "bottom", "z-index",
        "vertical-align", "text-align",
        "-webkit-box-sizing", "-moz-box-sizing", "-ms-box-sizing", "box-sizing",
        "-webkit-box-shadow", "-moz-box-shadow", "-ms-box-shadow","box-shadow",
        "-webkit-border-top-right-radius", "-moz-border-radius-topright", "border-top-right-radius",
        "-webkit-border-bottom-right-radius", "-moz-border-radius-bottomright", "border-bottom-right-radius",
        "-webkit-border-bottom-left-radius", "-moz-border-radius-bottomleft", "border-bottom-left-radius",
        "-webkit-border-top-left-radius", "-moz-border-radius-topleft", "border-top-left-radius",
        "width", "height"
      ],
      ADDITIONAL_CSS_RULES = [
        "html                 { height: 100%; }",
        "body                 { height: 100%; padding: 1px 0 0 0; margin: -1px 0 0 0; }",
        "body > p:first-child { margin-top: 0; }",
        "._wysihtml5-temp     { display: none; }",
        wysihtml5.browser.isGecko ?
          "body.placeholder { color: graytext !important; }" :
          "body.placeholder { color: #a9a9a9 !important; }",
        // Ensure that user see's broken images and can delete them
        "img:-moz-broken      { -moz-force-broken-image-icon: 1; height: 24px; width: 24px; }"
      ];

  /**
   * With "setActive" IE offers a smart way of focusing elements without scrolling them into view:
   * http://msdn.microsoft.com/en-us/library/ms536738(v=vs.85).aspx
   *
   * Other browsers need a more hacky way: (pssst don't tell my mama)
   * In order to prevent the element being scrolled into view when focusing it, we simply
   * move it out of the scrollable area, focus it, and reset it's position
   */
  var focusWithoutScrolling = function(element) {
    if (element.setActive) {
      // Following line could cause a js error when the textarea is invisible
      // See https://github.com/xing/wysihtml5/issues/9
      try { element.setActive(); } catch(e) {}
    } else {
      var elementStyle = element.style,
          originalScrollTop = doc.documentElement.scrollTop || doc.body.scrollTop,
          originalScrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft,
          originalStyles = {
            position:         elementStyle.position,
            top:              elementStyle.top,
            left:             elementStyle.left,
            WebkitUserSelect: elementStyle.WebkitUserSelect
          };

      dom.setStyles({
        position:         "absolute",
        top:              "-99999px",
        left:             "-99999px",
        // Don't ask why but temporarily setting -webkit-user-select to none makes the whole thing performing smoother
        WebkitUserSelect: "none"
      }).on(element);

      element.focus();

      dom.setStyles(originalStyles).on(element);

      if (win.scrollTo) {
        // Some browser extensions unset this method to prevent annoyances
        // "Better PopUp Blocker" for Chrome http://code.google.com/p/betterpopupblocker/source/browse/trunk/blockStart.js#100
        // Issue: http://code.google.com/p/betterpopupblocker/issues/detail?id=1
        win.scrollTo(originalScrollLeft, originalScrollTop);
      }
    }
  };


  wysihtml5.views.Composer.prototype.style = function() {
    var that                  = this,
        originalActiveElement = doc.querySelector(":focus"),
        textareaElement       = this.textarea.element,
        hasPlaceholder        = textareaElement.hasAttribute("placeholder"),
        originalPlaceholder   = hasPlaceholder && textareaElement.getAttribute("placeholder"),
        originalDisplayValue  = textareaElement.style.display,
        originalDisabled      = textareaElement.disabled,
        displayValueForCopying;

    this.focusStylesHost      = HOST_TEMPLATE.cloneNode(false);
    this.blurStylesHost       = HOST_TEMPLATE.cloneNode(false);
    this.disabledStylesHost   = HOST_TEMPLATE.cloneNode(false);

    // Remove placeholder before copying (as the placeholder has an affect on the computed style)
    if (hasPlaceholder) {
      textareaElement.removeAttribute("placeholder");
    }

    if (textareaElement === originalActiveElement) {
      textareaElement.blur();
    }

    // enable for copying styles
    textareaElement.disabled = false;

    // set textarea to display="none" to get cascaded styles via getComputedStyle
    textareaElement.style.display = displayValueForCopying = "none";

    if ((textareaElement.getAttribute("rows") && dom.getStyle("height").from(textareaElement) === "auto") ||
        (textareaElement.getAttribute("cols") && dom.getStyle("width").from(textareaElement) === "auto")) {
      textareaElement.style.display = displayValueForCopying = originalDisplayValue;
    }

    // --------- iframe styles (has to be set before editor styles, otherwise IE9 sets wrong fontFamily on blurStylesHost) ---------
    dom.copyStyles(BOX_FORMATTING).from(textareaElement).to(this.editableArea).andTo(this.blurStylesHost);

    // --------- editor styles ---------
    dom.copyStyles(TEXT_FORMATTING).from(textareaElement).to(this.element).andTo(this.blurStylesHost);

    // --------- apply standard rules ---------
    dom.insertCSS(ADDITIONAL_CSS_RULES).into(this.element.ownerDocument);

    // --------- :disabled styles ---------
    textareaElement.disabled = true;
    dom.copyStyles(BOX_FORMATTING).from(textareaElement).to(this.disabledStylesHost);
    dom.copyStyles(TEXT_FORMATTING).from(textareaElement).to(this.disabledStylesHost);
    textareaElement.disabled = originalDisabled;

    // --------- :focus styles ---------
    textareaElement.style.display = originalDisplayValue;
    focusWithoutScrolling(textareaElement);
    textareaElement.style.display = displayValueForCopying;

    dom.copyStyles(BOX_FORMATTING).from(textareaElement).to(this.focusStylesHost);
    dom.copyStyles(TEXT_FORMATTING).from(textareaElement).to(this.focusStylesHost);

    // reset textarea
    textareaElement.style.display = originalDisplayValue;

    dom.copyStyles(["display"]).from(textareaElement).to(this.editableArea);

    // Make sure that we don't change the display style of the iframe when copying styles oblur/onfocus
    // this is needed for when the change_view event is fired where the iframe is hidden and then
    // the blur event fires and re-displays it
    var boxFormattingStyles = wysihtml5.lang.array(BOX_FORMATTING).without(["display"]);

    // --------- restore focus ---------
    if (originalActiveElement) {
      originalActiveElement.focus();
    } else {
      textareaElement.blur();
    }

    // --------- restore placeholder ---------
    if (hasPlaceholder) {
      textareaElement.setAttribute("placeholder", originalPlaceholder);
    }

    // --------- Sync focus/blur styles ---------
    this.parent.on("focus:composer", function() {
      dom.copyStyles(boxFormattingStyles) .from(that.focusStylesHost).to(that.editableArea);
      dom.copyStyles(TEXT_FORMATTING)     .from(that.focusStylesHost).to(that.element);
    });

    this.parent.on("blur:composer", function() {
      dom.copyStyles(boxFormattingStyles) .from(that.blurStylesHost).to(that.editableArea);
      dom.copyStyles(TEXT_FORMATTING)     .from(that.blurStylesHost).to(that.element);
    });

    this.parent.observe("disable:composer", function() {
      dom.copyStyles(boxFormattingStyles) .from(that.disabledStylesHost).to(that.editableArea);
      dom.copyStyles(TEXT_FORMATTING)     .from(that.disabledStylesHost).to(that.element);
    });

    this.parent.observe("enable:composer", function() {
      dom.copyStyles(boxFormattingStyles) .from(that.blurStylesHost).to(that.editableArea);
      dom.copyStyles(TEXT_FORMATTING)     .from(that.blurStylesHost).to(that.element);
    });

    return this;
  };
})(wysihtml5);
;/**
 * Taking care of events
 *  - Simulating 'change' event on contentEditable element
 *  - Handling drag & drop logic
 *  - Catch paste events
 *  - Dispatch proprietary newword:composer event
 *  - Keyboard shortcuts
 */
(function(wysihtml5) {
  var dom       = wysihtml5.dom,
      browser   = wysihtml5.browser,
      /**
       * Map keyCodes to query commands
       */
      shortcuts = {
        "66": "bold",     // B
        "73": "italic",   // I
        "85": "underline" // U
      };

  // Adds multiple eventlisteners to target, bound to one callback
  // TODO: If needed elsewhere make it part of wysihtml5.dom or sth
  var addListeners = function (target, events, callback) {
    for(var i = 0, max = events.length; i < max; i++) {
      target.addEventListener(events[i], callback, false);
    }
  };

  // Removes multiple eventlisteners from target, bound to one callback
  // TODO: If needed elsewhere make it part of wysihtml5.dom or sth
  var removeListeners = function (target, events, callback) {
    for(var i = 0, max = events.length; i < max; i++) {
      target.removeEventListener(events[i], callback, false);
    }
  };

  // Override for giving user ability to delete last line break in table cell
  var fixLastBrDeletionInTable = function(composer, force) {
    if (composer.selection.caretIsLastInSelection()) {
      var sel = composer.selection.getSelection(),
          aNode = sel.anchorNode;
      if (aNode && aNode.nodeType === 1 && (wysihtml5.dom.getParentElement(aNode, {query: 'td, th'}, false, composer.element) || force)) {
        var nextNode = aNode.childNodes[sel.anchorOffset];
        if (nextNode && nextNode.nodeType === 1 & nextNode.nodeName === "BR") {
          nextNode.parentNode.removeChild(nextNode);
          return true;
        }
      }
    }
    return false;
  };

  // If found an uneditable before caret then notify it before deletion
  var handleUneditableDeletion = function(composer) {
    var before = composer.selection.getBeforeSelection(true);
    if (before && (before.type === "element" || before.type === "leafnode") && before.node.nodeType === 1 && before.node.classList.contains(composer.config.classNames.uneditableContainer)) {
      if (fixLastBrDeletionInTable(composer, true)) {
        return true;
      }
      try {
        var ev = new CustomEvent("wysihtml5:uneditable:delete");
        before.node.dispatchEvent(ev);
      } catch (err) {}
      before.node.parentNode.removeChild(before.node);
      return true;
    }
    return false;
  };

  // Deletion with caret in the beginning of headings needs special attention
  // Heading does not concate text to previous block node correctly (browsers do unexpected miracles here especially webkit)
  var fixDeleteInTheBeginnigOfHeading = function(composer) {
    var selection = composer.selection,
        prevNode = selection.getPreviousNode();

    if (selection.caretIsFirstInSelection() &&
        prevNode &&
        prevNode.nodeType === 1 &&
        (/block/).test(composer.win.getComputedStyle(prevNode).display)
    ) {
      if ((/^\s*$/).test(prevNode.textContent || prevNode.innerText)) {
        // If heading is empty remove the heading node
        prevNode.parentNode.removeChild(prevNode);
        return true;
      } else {
        if (prevNode.lastChild) {
          var selNode = prevNode.lastChild,
              selectedNode = selection.getSelectedNode(),
              commonAncestorNode = wysihtml5.dom.domNode(prevNode).commonAncestor(selectedNode, composer.element);
              curNode = commonAncestorNode ? wysihtml5.dom.getParentElement(selectedNode, {
                query: "h1, h2, h3, h4, h5, h6, p, pre, div, blockquote"
              }, false, commonAncestorNode) : null;
          
            if (curNode) {
              while (curNode.firstChild) {
                prevNode.appendChild(curNode.firstChild);
              }
              selection.setAfter(selNode);
              return true;
            } else if (selectedNode.nodeType === 3) {
              prevNode.appendChild(selectedNode);
              selection.setAfter(selNode);
              return true;
            }
        }
      }
    }
    return false;
  };

  var handleDeleteKeyPress = function(event, composer) {
    var selection = composer.selection,
        element = composer.element;

    if (selection.isCollapsed()) {
      if (fixDeleteInTheBeginnigOfHeading(composer)) {
        event.preventDefault();
        return;
      }
      if (fixLastBrDeletionInTable(composer)) {
        event.preventDefault();
        return;
      }
      if (handleUneditableDeletion(composer)) {
        event.preventDefault();
        return;
      }
    } else {
      if (selection.containsUneditable()) {
        event.preventDefault();
        selection.deleteContents();
      }
    }
  };

  var handleTabKeyDown = function(composer, element, shiftKey) {
    if (!composer.selection.isCollapsed()) {
      composer.selection.deleteContents();
    } else if (composer.selection.caretIsInTheBeginnig('li')) {
      if (shiftKey) {
        if (composer.commands.exec('outdentList')) return;
      } else {
        if (composer.commands.exec('indentList')) return;
      }
    }

    // Is &emsp; close enough to tab. Could not find enough counter arguments for now.
    composer.commands.exec("insertHTML", "&emsp;");
  };

  var handleDomNodeRemoved = function(event) {
      if (this.domNodeRemovedInterval) {
        clearInterval(domNodeRemovedInterval);
      }
      this.parent.fire("destroy:composer");
  };

  // Listens to "drop", "paste", "mouseup", "focus", "keyup" events and fires
  var handleUserInteraction = function (event) {
    this.parent.fire("beforeinteraction", event).fire("beforeinteraction:composer", event);
    setTimeout((function() {
      this.parent.fire("interaction", event).fire("interaction:composer", event);
    }).bind(this), 0);
  };

  var handleFocus = function(event) {
    this.parent.fire("focus", event).fire("focus:composer", event);

    // Delay storing of state until all focus handler are fired
    // especially the one which resets the placeholder
    setTimeout((function() {
      this.focusState = this.getValue(false, false);
    }).bind(this), 0);
  };

  var handleBlur = function(event) {
    if (this.focusState !== this.getValue(false, false)) {
      //create change event if supported (all except IE8)
      var changeevent = event;
      if(typeof Object.create == 'function') {
        changeevent = Object.create(event, { type: { value: 'change' } });
      }
      this.parent.fire("change", changeevent).fire("change:composer", changeevent);
    }
    this.parent.fire("blur", event).fire("blur:composer", event);
  };

  var handlePaste = function(event) {
    this.parent.fire(event.type, event).fire(event.type + ":composer", event);
    if (event.type === "paste") {
      setTimeout((function() {
        this.parent.fire("newword:composer");
      }).bind(this), 0);
    }
  };

  var handleCopy = function(event) {
    if (this.config.copyedFromMarking) {
      // If supported the copied source can be based directly on selection
      // Very useful for webkit based browsers where copy will otherwise contain a lot of code and styles based on whatever and not actually in selection.
      if (event.clipboardData) {
        event.clipboardData.setData("text/html", this.config.copyedFromMarking + this.selection.getHtml());
        event.clipboardData.setData("text/plain", this.selection.getPlainText());
        event.preventDefault();
      }
      this.parent.fire(event.type, event).fire(event.type + ":composer", event);
    }
  };

  var handleKeyUp = function(event) {
    var keyCode = event.keyCode;
    if (keyCode === wysihtml5.SPACE_KEY || keyCode === wysihtml5.ENTER_KEY) {
      this.parent.fire("newword:composer");
    }
  };

  var handleMouseDown = function(event) {
    if (!browser.canSelectImagesInContentEditable()) {
      // Make sure that images are selected when clicking on them
      var target = event.target,
          allImages = this.element.querySelectorAll('img'),
          notMyImages = this.element.querySelectorAll('.' + this.config.classNames.uneditableContainer + ' img'),
          myImages = wysihtml5.lang.array(allImages).without(notMyImages);

      if (target.nodeName === "IMG" && wysihtml5.lang.array(myImages).contains(target)) {
        this.selection.selectNode(target);
      }
    }
  };

  // TODO: mouseover is not actually a foolproof and obvious place for this, must be changed as it modifies dom on random basis
  // Shows url in tooltip when hovering links or images
  var handleMouseOver = function(event) {
    var titlePrefixes = {
          IMG: "Image: ",
          A:   "Link: "
        },
        target   = event.target,
        nodeName = target.nodeName,
        title;

    if (nodeName !== "A" && nodeName !== "IMG") {
      return;
    }
    if(!target.hasAttribute("title")){
      title = titlePrefixes[nodeName] + (target.getAttribute("href") || target.getAttribute("src"));
      target.setAttribute("title", title);
    }
  };

  var handleClick = function(event) {
    if (this.config.classNames.uneditableContainer) {
      // If uneditables is configured, makes clicking on uneditable move caret after clicked element (so it can be deleted like text)
      // If uneditable needs text selection itself event.stopPropagation can be used to prevent this behaviour
      var uneditable = wysihtml5.dom.getParentElement(event.target, { query: "." + this.config.classNames.uneditableContainer }, false, this.element);
      if (uneditable) {
        this.selection.setAfter(uneditable);
      }
    }
  };

  var handleDrop = function(event) {
    if (!browser.canSelectImagesInContentEditable()) {
      // TODO: if I knew how to get dropped elements list from event I could limit it to only IMG element case
      setTimeout((function() {
        this.selection.getSelection().removeAllRanges();
      }).bind(this), 0);
    }
  };

  var handleKeyDown = function(event) {
    var keyCode = event.keyCode,
        command = shortcuts[keyCode],
        target, parent;

    // Select all (meta/ctrl + a)
    if ((event.ctrlKey || event.metaKey) && keyCode === 65) {
      this.selection.selectAll();
      event.preventDefault();
      return;
    }

    // Shortcut logic
    if ((event.ctrlKey || event.metaKey) && !event.altKey && command) {
      this.commands.exec(command);
      event.preventDefault();
    }

    if (keyCode === wysihtml5.BACKSPACE_KEY) {
      // Delete key override for special cases
      handleDeleteKeyPress(event, this);
    }

    // Make sure that when pressing backspace/delete on selected images deletes the image and it's anchor
    if (keyCode === wysihtml5.BACKSPACE_KEY || keyCode === wysihtml5.DELETE_KEY) {
      target = this.selection.getSelectedNode(true);
      if (target && target.nodeName === "IMG") {
        event.preventDefault();
        parent = target.parentNode;
        parent.removeChild(target);// delete the <img>
        // And it's parent <a> too if it hasn't got any other child nodes
        if (parent.nodeName === "A" && !parent.firstChild) {
          parent.parentNode.removeChild(parent);
        }
        setTimeout((function() {
          wysihtml5.quirks.redraw(this.element);
        }).bind(this), 0);
      }
    }

    if (this.config.handleTabKey && keyCode === wysihtml5.TAB_KEY) {
      // TAB key handling
      event.preventDefault();
      handleTabKeyDown(this, this.element, event.shiftKey);
    }

  };

  var handleIframeFocus = function(event) {
    setTimeout((function() {
      if (this.doc.querySelector(":focus") !== this.element) {
        this.focus();
      }
    }).bind(this), 0);
  };

  var handleIframeBlur = function(event) {
    setTimeout((function() {
      this.selection.getSelection().removeAllRanges();
    }).bind(this), 0);
  };

  // Table management
  // If present enableObjectResizing and enableInlineTableEditing command should be called with false to prevent native table handlers
  var initTableHandling = function () {
    var hideHandlers = function () {
          this.doc.execCommand("enableObjectResizing", false, "false");
          this.doc.execCommand("enableInlineTableEditing", false, "false");
        },
        iframeInitiator = (function() {
          hideHandlers.call(this);
          removeListeners(this.sandbox.getIframe(), ["focus", "mouseup", "mouseover"], iframeInitiator);
        }).bind(this);

    if( this.doc.execCommand &&
        wysihtml5.browser.supportsCommand(this.doc, "enableObjectResizing") &&
        wysihtml5.browser.supportsCommand(this.doc, "enableInlineTableEditing"))
    {
      if (this.sandbox.getIframe) {
        addListeners(this.sandbox.getIframe(), ["focus", "mouseup", "mouseover"], iframeInitiator);
      } else {
        setTimeout((function() {
          hideHandlers.call(this);
        }).bind(this), 0);
      }
    }
    this.tableSelection = wysihtml5.quirks.tableCellsSelection(this.element, this.parent);
  };

  wysihtml5.views.Composer.prototype.observe = function() {
    var that                = this,
        container           = (this.sandbox.getIframe) ? this.sandbox.getIframe() : this.sandbox.getContentEditable(),
        element             = this.element,
        focusBlurElement    = (browser.supportsEventsInIframeCorrectly() || this.sandbox.getContentEditable) ? this.element : this.sandbox.getWindow();

    this.focusState = this.getValue(false, false);

    // --------- destroy:composer event ---------
    container.addEventListener(["DOMNodeRemoved"], handleDomNodeRemoved.bind(this), false);

    // DOMNodeRemoved event is not supported in IE 8
    // TODO: try to figure out a polyfill style fix, so it could be transferred to polyfills and removed if ie8 is not needed
    if (!browser.supportsMutationEvents()) {
      this.domNodeRemovedInterval = setInterval(function() {
        if (!dom.contains(document.documentElement, container)) {
          handleDomNodeRemoved.call(this);
        }
      }, 250);
    }

    // --------- User interactions --
    if (this.config.handleTables) {
      // If handleTables option is true, table handling functions are bound
      initTableHandling.call(this);
    }

    addListeners(focusBlurElement, ["drop", "paste", "mouseup", "focus", "keyup"], handleUserInteraction.bind(this));
    focusBlurElement.addEventListener("focus", handleFocus.bind(this), false);
    focusBlurElement.addEventListener("blur",  handleBlur.bind(this), false);
    
    addListeners(this.element, ["drop", "paste", "beforepaste"], handlePaste.bind(this), false);
    this.element.addEventListener("copy",       handleCopy.bind(this), false);
    this.element.addEventListener("mousedown",  handleMouseDown.bind(this), false);
    this.element.addEventListener("mouseover",  handleMouseOver.bind(this), false);
    this.element.addEventListener("click",      handleClick.bind(this), false);
    this.element.addEventListener("drop",       handleDrop.bind(this), false);
    this.element.addEventListener("keyup",      handleKeyUp.bind(this), false);
    this.element.addEventListener("keydown",    handleKeyDown.bind(this), false);

    this.element.addEventListener("dragenter", (function() {
      this.parent.fire("unset_placeholder");
    }).bind(this), false);

  };
})(wysihtml5);
;/**
 * Class that takes care that the value of the composer and the textarea is always in sync
 */
(function(wysihtml5) {
  var INTERVAL = 400;

  wysihtml5.views.Synchronizer = Base.extend(
    /** @scope wysihtml5.views.Synchronizer.prototype */ {

    constructor: function(editor, textarea, composer) {
      this.editor   = editor;
      this.textarea = textarea;
      this.composer = composer;

      this._observe();
    },

    /**
     * Sync html from composer to textarea
     * Takes care of placeholders
     * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the textarea
     */
    fromComposerToTextarea: function(shouldParseHtml) {
      this.textarea.setValue(wysihtml5.lang.string(this.composer.getValue(false, false)).trim(), shouldParseHtml);
    },

    /**
     * Sync value of textarea to composer
     * Takes care of placeholders
     * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the composer
     */
    fromTextareaToComposer: function(shouldParseHtml) {
      var textareaValue = this.textarea.getValue(false, false);
      if (textareaValue) {
        this.composer.setValue(textareaValue, shouldParseHtml);
      } else {
        this.composer.clear();
        this.editor.fire("set_placeholder");
      }
    },

    /**
     * Invoke syncing based on view state
     * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the composer/textarea
     */
    sync: function(shouldParseHtml) {
      if (this.editor.currentView.name === "textarea") {
        this.fromTextareaToComposer(shouldParseHtml);
      } else {
        this.fromComposerToTextarea(shouldParseHtml);
      }
    },

    /**
     * Initializes interval-based syncing
     * also makes sure that on-submit the composer's content is synced with the textarea
     * immediately when the form gets submitted
     */
    _observe: function() {
      var interval,
          that          = this,
          form          = this.textarea.element.form,
          startInterval = function() {
            interval = setInterval(function() { that.fromComposerToTextarea(); }, INTERVAL);
          },
          stopInterval  = function() {
            clearInterval(interval);
            interval = null;
          };

      startInterval();

      if (form) {
        // If the textarea is in a form make sure that after onreset and onsubmit the composer
        // has the correct state
        wysihtml5.dom.observe(form, "submit", function() {
          that.sync(true);
        });
        wysihtml5.dom.observe(form, "reset", function() {
          setTimeout(function() { that.fromTextareaToComposer(); }, 0);
        });
      }

      this.editor.on("change_view", function(view) {
        if (view === "composer" && !interval) {
          that.fromTextareaToComposer(true);
          startInterval();
        } else if (view === "textarea") {
          that.fromComposerToTextarea(true);
          stopInterval();
        }
      });

      this.editor.on("destroy:composer", stopInterval);
    }
  });
})(wysihtml5);
;(function(wysihtml5) {

  wysihtml5.views.SourceView = Base.extend(
    /** @scope wysihtml5.views.SourceView.prototype */ {

    constructor: function(editor, composer) {
      this.editor   = editor;
      this.composer = composer;

      this._observe();
    },

    switchToTextarea: function(shouldParseHtml) {
      var composerStyles = this.composer.win.getComputedStyle(this.composer.element),
          width = parseFloat(composerStyles.width),
          height = Math.max(parseFloat(composerStyles.height), 100);

      if (!this.textarea) {
        this.textarea = this.composer.doc.createElement('textarea');
        this.textarea.className = "wysihtml5-source-view";
      }
      this.textarea.style.width = width + 'px';
      this.textarea.style.height = height + 'px';
      this.textarea.value = this.editor.getValue(shouldParseHtml, true);
      this.composer.element.parentNode.insertBefore(this.textarea, this.composer.element);
      this.editor.currentView = "source";
      this.composer.element.style.display = 'none';
    },

    switchToComposer: function(shouldParseHtml) {
      var textareaValue = this.textarea.value;
      if (textareaValue) {
        this.composer.setValue(textareaValue, shouldParseHtml);
      } else {
        this.composer.clear();
        this.editor.fire("set_placeholder");
      }
      this.textarea.parentNode.removeChild(this.textarea);
      this.editor.currentView = this.composer;
      this.composer.element.style.display = '';
    },

    _observe: function() {
      this.editor.on("change_view", function(view) {
        if (view === "composer") {
          this.switchToComposer(true);
        } else if (view === "textarea") {
          this.switchToTextarea(true);
        }
      }.bind(this));
    }

  });

})(wysihtml5);
;wysihtml5.views.Textarea = wysihtml5.views.View.extend(
  /** @scope wysihtml5.views.Textarea.prototype */ {
  name: "textarea",

  constructor: function(parent, textareaElement, config) {
    this.base(parent, textareaElement, config);

    this._observe();
  },

  clear: function() {
    this.element.value = "";
  },

  getValue: function(parse) {
    var value = this.isEmpty() ? "" : this.element.value;
    if (parse !== false) {
      value = this.parent.parse(value);
    }
    return value;
  },

  setValue: function(html, parse) {
    if (parse) {
      html = this.parent.parse(html);
    }
    this.element.value = html;
  },

  cleanUp: function() {
      var html = this.parent.parse(this.element.value);
      this.element.value = html;
  },

  hasPlaceholderSet: function() {
    var supportsPlaceholder = wysihtml5.browser.supportsPlaceholderAttributeOn(this.element),
        placeholderText     = this.element.getAttribute("placeholder") || null,
        value               = this.element.value,
        isEmpty             = !value;
    return (supportsPlaceholder && isEmpty) || (value === placeholderText);
  },

  isEmpty: function() {
    return !wysihtml5.lang.string(this.element.value).trim() || this.hasPlaceholderSet();
  },

  _observe: function() {
    var element = this.element,
        parent  = this.parent,
        eventMapping = {
          focusin:  "focus",
          focusout: "blur"
        },
        /**
         * Calling focus() or blur() on an element doesn't synchronously trigger the attached focus/blur events
         * This is the case for focusin and focusout, so let's use them whenever possible, kkthxbai
         */
        events = wysihtml5.browser.supportsEvent("focusin") ? ["focusin", "focusout", "change"] : ["focus", "blur", "change"];

    parent.on("beforeload", function() {
      wysihtml5.dom.observe(element, events, function(event) {
        var eventName = eventMapping[event.type] || event.type;
        parent.fire(eventName).fire(eventName + ":textarea");
      });

      wysihtml5.dom.observe(element, ["paste", "drop"], function() {
        setTimeout(function() { parent.fire("paste").fire("paste:textarea"); }, 0);
      });
    });
  }
});
;/**
 * WYSIHTML5 Editor
 *
 * @param {Element} editableElement Reference to the textarea which should be turned into a rich text interface
 * @param {Object} [config] See defaultConfig object below for explanation of each individual config option
 *
 * @events
 *    load
 *    beforeload (for internal use only)
 *    focus
 *    focus:composer
 *    focus:textarea
 *    blur
 *    blur:composer
 *    blur:textarea
 *    change
 *    change:composer
 *    change:textarea
 *    paste
 *    paste:composer
 *    paste:textarea
 *    newword:composer
 *    destroy:composer
 *    undo:composer
 *    redo:composer
 *    beforecommand:composer
 *    aftercommand:composer
 *    enable:composer
 *    disable:composer
 *    change_view
 */
(function(wysihtml5) {
  var undef;

  var defaultConfig = {
    // Give the editor a name, the name will also be set as class name on the iframe and on the iframe's body
    name:                 undef,
    // Whether the editor should look like the textarea (by adopting styles)
    style:                true,
    // Id of the toolbar element, pass falsey value if you don't want any toolbar logic
    toolbar:              undef,
    // Whether toolbar is displayed after init by script automatically.
    // Can be set to false if toolobar is set to display only on editable area focus
    showToolbarAfterInit: true,
    // With default toolbar it shows dialogs in toolbar when their related text format state becomes active (click on link in text opens link dialogue)
    showToolbarDialogsOnSelection: true,
    // Whether urls, entered by the user should automatically become clickable-links
    autoLink:             true,
    // Includes table editing events and cell selection tracking
    handleTables:         true,
    // Tab key inserts tab into text as default behaviour. It can be disabled to regain keyboard navigation
    handleTabKey:         true,
    // Object which includes parser rules to apply when html gets cleaned
    // See parser_rules/*.js for examples
    parserRules:          { tags: { br: {}, span: {}, div: {}, p: {} }, classes: {} },
    // Object which includes parser when the user inserts content via copy & paste. If null parserRules will be used instead
    pasteParserRulesets: null,
    // Parser method to use when the user inserts content
    parser:               wysihtml5.dom.parse,
    // By default wysihtml5 will insert a <br> for line breaks, set this to false to use <p>
    useLineBreaks:        true,
    // Array (or single string) of stylesheet urls to be loaded in the editor's iframe
    stylesheets:          [],
    // Placeholder text to use, defaults to the placeholder attribute on the textarea element
    placeholderText:      undef,
    // Whether the rich text editor should be rendered on touch devices (wysihtml5 >= 0.3.0 comes with basic support for iOS 5)
    supportTouchDevices:  true,
    // Whether senseless <span> elements (empty or without attributes) should be removed/replaced with their content
    cleanUp:              true,
    // Whether to use div instead of secure iframe
    contentEditableMode: false,
    classNames: {
      // Class name which should be set on the contentEditable element in the created sandbox iframe, can be styled via the 'stylesheets' option
      composer: "wysihtml5-editor",
      // Class name to add to the body when the wysihtml5 editor is supported
      body: "wysihtml5-supported",
      // classname added to editable area element (iframe/div) on creation
      sandbox: "wysihtml5-sandbox",
      // class on editable area with placeholder
      placeholder: "wysihtml5-placeholder",
      // Classname of container that editor should not touch and pass through
      uneditableContainer: "wysihtml5-uneditable-container"
    },
    // Browsers that support copied source handling will get a marking of the origin of the copied source (for determinig code cleanup rules on paste)
    // Also copied source is based directly on selection - 
    // (very useful for webkit based browsers where copy will otherwise contain a lot of code and styles based on whatever and not actually in selection).
    // If falsy value is passed source override is also disabled
    copyedFromMarking: '<meta name="copied-from" content="wysihtml5">'
  };

  wysihtml5.Editor = wysihtml5.lang.Dispatcher.extend(
    /** @scope wysihtml5.Editor.prototype */ {
    constructor: function(editableElement, config) {
      this.editableElement  = typeof(editableElement) === "string" ? document.getElementById(editableElement) : editableElement;
      this.config           = wysihtml5.lang.object({}).merge(defaultConfig).merge(config).get();
      this._isCompatible    = wysihtml5.browser.supported();

      // merge classNames
      if (config && config.classNames) {
        wysihtml5.lang.object(this.config.classNames).merge(config.classNames);
      }

      if (this.editableElement.nodeName.toLowerCase() != "textarea") {
          this.config.contentEditableMode = true;
          this.config.noTextarea = true;
      }
      if (!this.config.noTextarea) {
          this.textarea         = new wysihtml5.views.Textarea(this, this.editableElement, this.config);
          this.currentView      = this.textarea;
      }

      // Sort out unsupported/unwanted browsers here
      if (!this._isCompatible || (!this.config.supportTouchDevices && wysihtml5.browser.isTouchDevice())) {
        var that = this;
        setTimeout(function() { that.fire("beforeload").fire("load"); }, 0);
        return;
      }

      // Add class name to body, to indicate that the editor is supported
      wysihtml5.dom.addClass(document.body, this.config.classNames.body);

      this.composer = new wysihtml5.views.Composer(this, this.editableElement, this.config);
      this.currentView = this.composer;

      if (typeof(this.config.parser) === "function") {
        this._initParser();
      }

      this.on("beforeload", this.handleBeforeLoad);
    },

    handleBeforeLoad: function() {
        if (!this.config.noTextarea) {
          this.synchronizer = new wysihtml5.views.Synchronizer(this, this.textarea, this.composer);
        } else {
          this.sourceView = new wysihtml5.views.SourceView(this, this.composer);
        }
        if (this.config.toolbar) {
          this.toolbar = new wysihtml5.toolbar.Toolbar(this, this.config.toolbar, this.config.showToolbarAfterInit);
        }
    },

    isCompatible: function() {
      return this._isCompatible;
    },

    clear: function() {
      this.currentView.clear();
      return this;
    },

    getValue: function(parse, clearInternals) {
      return this.currentView.getValue(parse, clearInternals);
    },

    setValue: function(html, parse) {
      this.fire("unset_placeholder");

      if (!html) {
        return this.clear();
      }

      this.currentView.setValue(html, parse);
      return this;
    },

    cleanUp: function() {
        this.currentView.cleanUp();
    },

    focus: function(setToEnd) {
      this.currentView.focus(setToEnd);
      return this;
    },

    /**
     * Deactivate editor (make it readonly)
     */
    disable: function() {
      this.currentView.disable();
      return this;
    },

    /**
     * Activate editor
     */
    enable: function() {
      this.currentView.enable();
      return this;
    },

    isEmpty: function() {
      return this.currentView.isEmpty();
    },

    hasPlaceholderSet: function() {
      return this.currentView.hasPlaceholderSet();
    },

    destroy: function() {
      if (this.composer && this.composer.sandbox) {
        this.composer.sandbox.destroy();
      }
      if (this.toolbar) {
        this.toolbar.destroy();
      }
      this.off();
    },

    parse: function(htmlOrElement, clearInternals) {
      var parseContext = (this.config.contentEditableMode) ? document : ((this.composer) ? this.composer.sandbox.getDocument() : null);
      var returnValue = this.config.parser(htmlOrElement, {
        "rules": this.config.parserRules,
        "cleanUp": this.config.cleanUp,
        "context": parseContext,
        "uneditableClass": this.config.classNames.uneditableContainer,
        "clearInternals" : clearInternals
      });
      if (typeof(htmlOrElement) === "object") {
        wysihtml5.quirks.redraw(htmlOrElement);
      }
      return returnValue;
    },

    /**
     * Prepare html parser logic
     *  - Observes for paste and drop
     */
    _initParser: function() {
      var oldHtml;

      if (wysihtml5.browser.supportsModernPaste()) {
        this.on("paste:composer", function(event) {
          event.preventDefault();
          oldHtml = wysihtml5.dom.getPastedHtml(event);
          if (oldHtml) {
            this._cleanAndPaste(oldHtml);
          }
        }.bind(this));

      } else {
        this.on("beforepaste:composer", function(event) {
          event.preventDefault();
          var scrollPos = this.composer.getScrollPos();

          wysihtml5.dom.getPastedHtmlWithDiv(this.composer, function(pastedHTML) {
            if (pastedHTML) {
              this._cleanAndPaste(pastedHTML);
            }
            this.composer.setScrollPos(scrollPos);
          }.bind(this));

        }.bind(this));
      }
    },

    _cleanAndPaste: function (oldHtml) {
      var cleanHtml = wysihtml5.quirks.cleanPastedHTML(oldHtml, {
        "referenceNode": this.composer.element,
        "rules": this.config.pasteParserRulesets || [{"set": this.config.parserRules}],
        "uneditableClass": this.config.classNames.uneditableContainer
      });
      this.composer.selection.deleteContents();
      this.composer.selection.insertHTML(cleanHtml);
    }
  });
})(wysihtml5);
