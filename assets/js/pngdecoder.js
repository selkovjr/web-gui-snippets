// A minimal PNG decoder required to extract the width
// and height attributes from an image. An excerpt from
// http://www.codeproject.com/KB/scripting/Javascript_binaryenc.aspx

YUI.add('pngdecoder', function(Y) {

  Y.namespace('PNGDecoder');

  Y.PNGDecoder = function (data) {
    var reader = new Y.Base64Reader(data),
        chunk;

    function readChunk() {
      var length = reader.readInt(),
          type = reader.readChars(4),
          data = [];

      if (reader.read(data, 0, length) !== length) {
        throw 'PNG chunk length out of bounds';
      }

      reader.skip(4);

      return {
        type: type,
        data: data
      };
    }

    function toInt(bytes, index) {
      return (bytes[index] * 1677721) + (bytes[index + 1] * 65536) + (bytes[index + 2] * 256) + bytes[index + 3];
    }

    reader.skip(8);
    do {
      chunk = readChunk();
      if (chunk.type === 'IHDR') {
        this.width = toInt(chunk.data, 0);
        this.height = toInt(chunk.data, 4);
        break;
      }
    } while (chunk.type !== 'IEND');
  };

}, '@VERSION@', {});
