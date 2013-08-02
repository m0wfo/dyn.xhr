var XMLHttpRequest = function() {

  var _channel = java.nio.channels.AsynchronousSocketChannel.open();
  var _method = null;
  var _address = null;
  var _path = null;
  var _headers = {"User-Agent": "dyn.xhr/0.0.1"};
  var _encoder = java.nio.charset.Charset.forName("US-ASCII").newEncoder();

  _encoder.reset();

  this.readyState = 0;

  this.onreadystatechange = function() {};

  this.open = function(method, url, async) {
    _method = method;
    var uri = new java.net.URI(url);
    _address = new java.net.InetSocketAddress(uri.getHost(), uri.getPort());
    _path = uri.getPath();
  }

  this.setRequestHeader = function(key, value) {
    _headers[key] = value;
  }

  var _buildRequest = function(data) {
    var request = _method + " " + _path + " HTTP/1.1\r\n";
    _headers["Content-Length"] = data.length;
    _headers["Accept"] = "*/*";
    _headers["Host"] = "localhost:8080";
    for (var k in _headers) {
      request += k + ": " + _headers[k] + "\r\n";
    }
    request += ("\r\n" + data);
    return request;
  }

  var _parseResponse = function(data) {
    var resp = data.split("\r\n");
    that.status = resp[0].split(" ")[1];
  }

  this.status = 0;

  var that = this;

  this.send = function(data) {
    var req = _buildRequest(data);
    var cb = java.nio.CharBuffer.wrap(req);
    var bb = _encoder.encode(cb);
    _channel.connect(_address, null, new java.nio.channels.CompletionHandler({
      completed: function(result, attachment) {
        that.readyState = 1;
        _channel.write(bb, null, new java.nio.channels.CompletionHandler({
          completed: function(result, attachment) {
            var bb = java.nio.ByteBuffer.allocate(4096);
            _channel.read(bb, null, new java.nio.channels.CompletionHandler({
              completed: function(result, attachment) {
                var str = new java.lang.String(bb.array());
                var resp = _parseResponse(str);
                _channel.close();
                that.readyState = 4;
                that.onreadystatechange();
              }
            }));
          },
          failed: function(err, attachment) {
            print(err);
            _channel.close();
          }
        }));
      },
      failed: function(err, attachment) {
        print(err);
        _channel.close();
      }
    }));
  }
}

