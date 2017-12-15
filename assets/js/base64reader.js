// The stream-like Base64 decoder originally by _**notmasteryet**_
//
// Adapted from [www.codeproject.com](http://www.codeproject.com/KB/scripting/Javascript_binaryenc.aspx)
//
// [RFC 4648](http://www.apps.ietf.org/rfc/rfc4648.html)

// This version is not useful for decoding complete base64 strings in one go
// because it does not have a length methtod. It was made to decode
// base64-encoded binary data of known structure, where the length of each
// element can be read from the data.

YUI.add('base64reader', function(Y) {
  /**
   * @module base64reader
   */

  /**
   * A read-once decoder of Base64 strings emulating file I/O (but without rewinding)
   * @class Base64Reader
   * @constructor
   * @param {String} b64Data Base64 data to decode
   */
  Y.Base64Reader = function (b64Data) {
    // The performance cost of avoiding bitwise operations is too high.
    /*jshint bitwise: false */

    var base64alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        position = 0,  // pointer into source data
        bits = 0,
        bitsLength = 0;

    /**
     * Decode one byte at the current position in the input string
     *
     * **Side effect**: input pointer advances by 1.
     *
     * @method readByte
     * @return {integer} the byte at current position
     */
    this.readByte = function () {
      var tailBits,
          ch,
          index;
      if (bitsLength === 0) {
        tailBits = 0;
        while (position < b64Data.length && bitsLength < 24) {
          ch = b64Data.charAt(position);
          position += 1;
          if (ch > " ") {
            index = base64alphabet.indexOf(ch);
            if (index < 0) {
              throw "Invalid character";
            }
            if (index < 64) {
              if (tailBits > 0) {
                throw "Invalid encoding (padding)";
              }
              bits = (bits * 64) | index;
            }
            else {
              if (bitsLength < 8) {
                throw "Invalid encoding (extra)";
              }
              bits *= 64;
              tailBits += 6;
            }
            bitsLength += 6;
          }
        }

        if (position >= b64Data.length) {
          if (bitsLength === 0) {
            return -1;
          }
          else if (bitsLength < 24) {
            throw "Invalid b64Data (end)";
          }
        }

        if (tailBits === 6) {
          tailBits = 8;
        }
        else if (tailBits === 12) {
          tailBits = 16;
        }
        bits = bits / Math.pow(2, tailBits);
        bitsLength -= tailBits;
      }

      bitsLength -= 8;
      return (bits >> bitsLength) & 0xFF;
    };

    /**
     * @method read

     * @param buffer {Array} the receiver parameter containing the list of
     * Numbers representing decoded bytes

     * @param index {Number} integer index of the starting position in the
     * receiver buffer to be filled

     * @param count {Number} integer number of bytes to decode

     * @return {Number} integer count of sucessfully decoded bytes
     */
    this.read = function (buffer, index, count) {
      var i = 0, rb;
      while (i < count) {
        rb = this.readByte();
        if (rb === -1) {
          return i;
        }
        buffer[index + i] = rb;
        i += 1;
      }
      return i;
    };

    /**
     * @method skip
     * @param count {Number} integer number of decoded bytes to skip by
     * @return {undefined} side-effect only
     */
    this.skip = function (count) {
      var i;
      for (i = 0; i < count; i += 1) {
        this.readByte();
      }
    };

    /**
     * Decode one byte at the current position in the input string and interpret
     * it as an ASCII character.
     *
     * **Side effect**: input pointer advances by 1.
     * @method readChar
     * @return {String} the decoded byte represented as a single-character String
     */
    this.readChar = function () {
      var rb = this.readByte();
      return rb === -1 ? null : String.fromCharCode(rb);
    };

    /**
     * Read a number of consecutive bytes as a string
     *
     * **Side effect**: input pointer advances by the number of characters
     * decoded.
     * @method readChars
     * @param chars {Number} integer number of characters to read
     * @return {String} characters concatenated into a string
     */
    this.readChars = function (chars) {
      var i, c, txt = '';
      for (i = 0; i < chars; i += 1) {
        c = this.readChar();
        if (!c) {
          return txt;
        }
        txt += c;
      }
      return txt;
    };

    /**
     * Decode four bytes at the current position in the input string and interpret
     * them as a big-endian integer number
     *
     * **Side effect**: input pointer advances by 4.
     * @method readInt
     * @return {Number} the four bytes unpacked as an integer
     */
    this.readInt = function () {
      var bytes = [];
      if (this.read(bytes, 0, 4) !== 4) {
        throw "Out of bounds";
      }
      return (bytes[0] * 1677721) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
    };
  };

}, '@VERSION@', {});

