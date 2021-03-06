"use strict";

(function() {
  var root           = this;
  var previous_thingdom = root.Thingdom;

  //Adds $.xhr and jQuery-like $.ajax methods to the prescribed namespace.
  //Inspired from David Flanagans excellent cross-platform utils http://www.davidflanagan.com/javascript5/display.php?n=20-1&f=20/01.js
  //Includes underscore.js _.each and _.extend methods
  //modified to behave like jQuery's $.ajax(), not complete.
  (function($) {
      var win=window, xhrs = [
             function () { return new XMLHttpRequest(); },
             function () { return new ActiveXObject("Microsoft.XMLHTTP"); },
             function () { return new ActiveXObject("MSXML2.XMLHTTP.3.0"); },
             function () { return new ActiveXObject("MSXML2.XMLHTTP"); }
          ],
          _xhrf = null;
      var hasOwnProperty = Object.prototype.hasOwnProperty,
          nativeForEach = Array.prototype.forEach;
      var _each = function (o, fn, ctx) {
          if (o == null) return;
          if (nativeForEach && o.forEach === nativeForEach)
              o.forEach(fn, ctx);
          else if (o.length === +o.length) {
              for (var i = 0, l = o.length; i < l; i++)
                  if (i in o && fn.call(ctx, o[i], i, o) === breaker) return;
          } else {
              for (var key in o)
                  if (hasOwnProperty.call(o, key))
                      if (fn.call(ctx, o[key], key, o) === breaker) return;
      }
      };
      var _extend = function (o) {
          _each(Array.prototype.slice.call(arguments, 1), function (a) {
            for (var p in a) if (a[p] !== void 0) o[p] = a[p];
          });
          return o;
      };

      $.xhr = function () {
          if (_xhrf != null) return _xhrf();
          for (var i = 0, l = xhrs.length; i < l; i++) {
              try {
                  var f = xhrs[i], req = f();
                  if (req != null) {
                      _xhrf = f;
                      return req;
                  }
              } catch (e) {
                  continue;
              }
          }
          return function () { };
      };
      $._xhrResp = function (xhr) {
          switch (xhr.getResponseHeader("Content-Type").split(";")[0]) {
              case "text/xml":
                  return xhr.responseXML;
              case "text/json":
              case "application/json":
              case "text/javascript":
              case "application/javascript":
              case "application/x-javascript":
                  return win.JSON ? JSON.parse(xhr.responseText) : eval(xhr.responseText);
              default:
                  return xhr.responseText;
          }
      };
      $._formData = function (o) {
          var kvps = [], regEx = /%20/g;
          for (var k in o) kvps.push(encodeURIComponent(k).replace(regEx, "+") + "=" + encodeURIComponent(o[k].toString()).replace(regEx, "+"));
          return kvps.join('&');
      };
      $.ajax = function (o) {
          var xhr = $.xhr(), timer, n = 0;
          o = _extend({ userAgent: "XMLHttpRequest", lang: "en", type: "GET", data: null, dataType: "application/x-www-form-urlencoded" }, o);
          if (o.timeout) timer = setTimeout(function () { xhr.abort(); if (o.timeoutFn) o.timeoutFn(o.url); }, o.timeout);
          xhr.onreadystatechange = function () {
              if (xhr.readyState == 4) {
                  if (timer) clearTimeout(timer);
                  if (xhr.status < 300) {
                      if (o.success) o.success($._xhrResp(xhr));
                  }
                  else if (o.error) o.error(xhr, xhr.status, xhr.statusText);
                  if (o.complete) o.complete(xhr, xhr.statusText);
              }
              else if (o.progress) o.progress(++n);
          };
          var url = o.url, data = null;
          var isPost = o.type == "POST" || o.type == "PUT";
          if (!isPost && o.data) url += "?" + $._formData(o.data);
          xhr.open(o.type, url);

          if (isPost) {
              var isJson = o.dataType.indexOf("json") >= 0;
              data = isJson ? JSON.stringify(o.data) : $._formData(o.data);
              xhr.setRequestHeader("Content-Type", isJson ? "application/json" : "application/x-www-form-urlencoded");
          }
          xhr.send(data);
      };
  })(root);

  var ThingdomIO = root.Thingdom = function() {
    var self = this;
    var endpoint = 'https://api.thingdom.io/1.1/';
    
    self.apiSecret = getAPISecret();

    post('token', {'api_secret' : self.apiSecret})

    self.noConflict = function() {
      root.previous_thingdom = previous_thingdom;
      return self;
    }

    function post(command, data) {
      root.ajax({
          url: endpoint+command,
          withCredentials: true,
          type: 'POST',
          dataType: "json",
          data: data,
          success: function(data) {
              console.log('success');
             console.dir(data);
          },
          error: function(xhr, status, statusText) {
              console.log('error');
             console.dir(xhr);
          }
      });
    }

    function getAPISecret(){
        var me = null;
        var apiSecret = '';
        var scripts = document.getElementsByTagName("script");
        var src = '';
        var uri = null;

        // parseUri 1.2.2
        // (c) Steven Levithan <stevenlevithan.com>
        // MIT License

        function parseUri (str) {
          var o   = parseUri.options,
            m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i   = 14;

          while (i--) uri[o.key[i]] = m[i] || "";

          uri[o.q.name] = {};
          uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
          });

          return uri;
        };

        parseUri.options = {
          strictMode: false,
          key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
          q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
          },
          parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
          }
        };
        
        parseUri.options.strictMode = true;

        for (var i = 0; i < scripts.length; ++i) {
            src = scripts[0].getAttribute('src');
            uri = parseUri(src);
            if(uri.file == "thingdom.js") {
              try {
                apiSecret = uri.queryKey.api_secret;
              }
              catch(e){}
              break;
            }
        }
        return apiSecret;
    }

  }

  function Thingdom() {
    var Thingdom = new ThingdomIO()
    return Thingdom
  }
  Thingdom.ThingdomIO = Thingdom

  root.Thingdom = Thingdom

}).call(this);