"use strict";

exports.__esModule = true;
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _lazyBrush = require("lazy-brush");

var _catenaryCurve = require("catenary-curve");

var _resizeObserverPolyfill = require("resize-observer-polyfill");

var _resizeObserverPolyfill2 = _interopRequireDefault(_resizeObserverPolyfill);

var _drawImage = require("./drawImage");

var _drawImage2 = _interopRequireDefault(_drawImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function midPointBtw(p1, p2) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}

var canvasStyle = {
  display: "block",
  position: "absolute"
};

var canvasTypes = [{
  name: "interface",
  zIndex: 15
}, {
  name: "drawing",
  zIndex: 11
}, {
  name: "temp",
  zIndex: 12
}, {
  name: "grid",
  zIndex: 10
}];

var dimensionsPropTypes = _propTypes2.default.oneOfType([_propTypes2.default.number, _propTypes2.default.string]);

var _default = (_temp = _class = function (_PureComponent) {
  _inherits(_default, _PureComponent);

  function _default(props) {
    _classCallCheck(this, _default);

    var _this = _possibleConstructorReturn(this, _PureComponent.call(this, props));

    _this.componentWillUnmount = function () {
      _this.canvasObserver.unobserve(_this.canvasContainer);
    };

    _this.drawImage = function () {
      if (!_this.props.imgSrc) return;

      // Load the image
      _this.image = new Image();
      _this.image.src = _this.props.imgSrc;

      // Draw the image once loaded
      _this.image.onload = function () {
        return (0, _drawImage2.default)({ ctx: _this.ctx.grid, img: _this.image });
      };
    };

    _this.undo = function () {
      var lines = _this.lines.slice(0, -1);
      _this.clear();
      _this.simulateDrawingLines({ lines: lines, immediate: true });
      _this.triggerOnChange();
    };

    _this.getSaveData = function () {
      // Construct and return the stringified saveData object
      return JSON.stringify({
        lines: _this.lines,
        width: _this.props.canvasWidth,
        height: _this.props.canvasHeight
      });
    };

    _this.loadSaveData = function (saveData) {
      var immediate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this.props.immediateLoading;

      if (typeof saveData !== "string") {
        throw new Error("saveData needs to be of type string!");
      }

      var _JSON$parse = JSON.parse(saveData),
          lines = _JSON$parse.lines,
          width = _JSON$parse.width,
          height = _JSON$parse.height;

      if (!lines || typeof lines.push !== "function") {
        throw new Error("saveData.lines needs to be an array!");
      }

      _this.clear();

      if (width === _this.props.canvasWidth && height === _this.props.canvasHeight) {
        _this.simulateDrawingLines({
          lines: lines,
          immediate: immediate
        });
      } else {
        // we need to rescale the lines based on saved & current dimensions
        var scaleX = _this.props.canvasWidth / width;
        var scaleY = _this.props.canvasHeight / height;
        var scaleAvg = (scaleX + scaleY) / 2;

        _this.simulateDrawingLines({
          lines: lines.map(function (line) {
            return _extends({}, line, {
              points: line.points.map(function (p) {
                return {
                  x: p.x * scaleX,
                  y: p.y * scaleY
                };
              }),
              brushRadius: line.brushRadius * scaleAvg
            });
          }),
          immediate: immediate
        });
      }
    };

    _this.simulateDrawingLines = function (_ref) {
      var lines = _ref.lines,
          immediate = _ref.immediate;

      // Simulate live-drawing of the loaded lines
      // TODO use a generator
      var curTime = 0;
      var timeoutGap = immediate ? 0 : _this.props.loadTimeOffset;

      lines.forEach(function (line) {
        var points = line.points,
            brushColor = line.brushColor,
            brushRadius = line.brushRadius;

        var _loop = function _loop(i) {
          curTime += timeoutGap;
          window.setTimeout(function () {
            _this.drawPoints({
              points: points.slice(0, i + 1),
              brushColor: brushColor,
              brushRadius: brushRadius
            });
          }, curTime);
        };

        for (var i = 1; i < points.length; i++) {
          _loop(i);
        }

        curTime += timeoutGap;
        window.setTimeout(function () {
          // Save this line with its props instead of this.props
          _this.points = points;
          var notTriggerOnChange = true;
          _this.saveLine({ brushColor: brushColor, brushRadius: brushRadius, notTriggerOnChange: notTriggerOnChange });
        }, curTime);
      });
    };

    _this.handleTouchStart = function (e) {
      var _this$getPointerPos = _this.getPointerPos(e),
          x = _this$getPointerPos.x,
          y = _this$getPointerPos.y;

      _this.lazy.update({ x: x, y: y }, { both: true });
      _this.handleMouseDown(e);

      _this.mouseHasMoved = true;
    };

    _this.handleTouchMove = function (e) {
      e.preventDefault();

      var _this$getPointerPos2 = _this.getPointerPos(e),
          x = _this$getPointerPos2.x,
          y = _this$getPointerPos2.y;

      _this.handlePointerMove(x, y);
    };

    _this.handleTouchEnd = function (e) {
      _this.handleMouseUp(e);
      var brush = _this.lazy.getBrushCoordinates();
      _this.lazy.update({ x: brush.x, y: brush.y }, { both: true });
      _this.mouseHasMoved = true;
    };

    _this.handleMouseDown = function (e) {
      e.preventDefault();
      _this.isPressing = true;
    };

    _this.handleMouseMove = function (e) {
      var _this$getPointerPos3 = _this.getPointerPos(e),
          x = _this$getPointerPos3.x,
          y = _this$getPointerPos3.y;

      _this.handlePointerMove(x, y);
    };

    _this.handleMouseUp = function (e) {
      e.preventDefault();
      _this.isDrawing = false;
      _this.isPressing = false;

      _this.saveLine();
    };

    _this.handleCanvasResize = function (entries, observer) {
      var saveData = _this.getSaveData();
      for (var _iterator = entries, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref2 = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref2 = _i.value;
        }

        var entry = _ref2;
        var _entry$contentRect = entry.contentRect,
            width = _entry$contentRect.width,
            height = _entry$contentRect.height;

        _this.setCanvasSize(_this.canvas.interface, width, height);
        _this.setCanvasSize(_this.canvas.drawing, width, height);
        _this.setCanvasSize(_this.canvas.temp, width, height);
        _this.setCanvasSize(_this.canvas.grid, width, height);

        _this.drawGrid(_this.ctx.grid);
        _this.loop({ once: true });
      }
      _this.loadSaveData(saveData, true);
    };

    _this.setCanvasSize = function (canvas, width, height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width;
      canvas.style.height = height;
    };

    _this.getPointerPos = function (e) {
      var rect = _this.canvas.interface.getBoundingClientRect();

      // use cursor pos as default
      var clientX = e.clientX;
      var clientY = e.clientY;

      // use first touch if available
      if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }

      // return mouse/touch position inside canvas
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    _this.handlePointerMove = function (x, y) {
      if (_this.props.disabled) return;

      var hasChanged = _this.lazy.update({ x: x, y: y });
      var isDisabled = !_this.lazy.isEnabled();

      if (_this.isPressing && hasChanged && !_this.isDrawing || isDisabled && _this.isPressing) {
        // Start drawing and add point
        _this.isDrawing = true;
        _this.points.push(_this.lazy.brush.toObject());
      }

      if (_this.isDrawing && (_this.lazy.brushHasMoved() || isDisabled)) {
        // Add new point
        _this.points.push(_this.lazy.brush.toObject());

        // Draw current points
        _this.drawPoints({
          points: _this.points,
          brushColor: _this.props.brushColor,
          brushRadius: _this.props.brushRadius
        });
      }

      _this.mouseHasMoved = true;
    };

    _this.drawPoints = function (_ref3) {
      var points = _ref3.points,
          brushColor = _ref3.brushColor,
          brushRadius = _ref3.brushRadius;

      _this.ctx.temp.lineJoin = "round";
      _this.ctx.temp.lineCap = "round";
      _this.ctx.temp.strokeStyle = brushColor;

      _this.ctx.temp.clearRect(0, 0, _this.ctx.temp.canvas.width, _this.ctx.temp.canvas.height);
      _this.ctx.temp.lineWidth = brushRadius * 2;

      var p1 = points[0];
      var p2 = points[1];

      _this.ctx.temp.moveTo(p2.x, p2.y);
      _this.ctx.temp.beginPath();

      for (var i = 1, len = points.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        var midPoint = midPointBtw(p1, p2);
        _this.ctx.temp.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = points[i];
        p2 = points[i + 1];
      }
      // Draw last line as a straight line while
      // we wait for the next point to be able to calculate
      // the bezier control point
      _this.ctx.temp.lineTo(p1.x, p1.y);
      _this.ctx.temp.stroke();
    };

    _this.saveLine = function () {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          brushColor = _ref4.brushColor,
          brushRadius = _ref4.brushRadius,
          notTriggerOnChange = _ref4.notTriggerOnChange;

      if (_this.points.length < 2) return;

      // Save as new line
      _this.lines.push({
        points: [].concat(_this.points),
        brushColor: brushColor || _this.props.brushColor,
        brushRadius: brushRadius || _this.props.brushRadius
      });

      // Reset points array
      _this.points.length = 0;

      var width = _this.canvas.temp.width;
      var height = _this.canvas.temp.height;

      // Copy the line to the drawing canvas
      _this.ctx.drawing.drawImage(_this.canvas.temp, 0, 0, width, height);

      // Clear the temporary line-drawing canvas
      _this.ctx.temp.clearRect(0, 0, width, height);

      if (notTriggerOnChange) {
        return;
      }
      _this.triggerOnChange();
    };

    _this.triggerOnChange = function () {
      _this.props.onChange && _this.props.onChange(_this);
    };

    _this.clear = function () {
      _this.lines = [];
      _this.valuesChanged = true;
      _this.ctx.drawing.clearRect(0, 0, _this.canvas.drawing.width, _this.canvas.drawing.height);
      _this.ctx.temp.clearRect(0, 0, _this.canvas.temp.width, _this.canvas.temp.height);
    };

    _this.loop = function () {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref5$once = _ref5.once,
          once = _ref5$once === undefined ? false : _ref5$once;

      if (_this.mouseHasMoved || _this.valuesChanged) {
        var pointer = _this.lazy.getPointerCoordinates();
        var brush = _this.lazy.getBrushCoordinates();

        // this.drawInterface(this.ctx.interface, pointer, brush);
        _this.mouseHasMoved = false;
        _this.valuesChanged = false;
      }

      if (!once) {
        window.requestAnimationFrame(function () {
          _this.loop();
        });
      }
    };

    _this.drawGrid = function (ctx) {
      if (_this.props.hideGrid) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.beginPath();
      ctx.setLineDash([5, 1]);
      ctx.setLineDash([]);
      ctx.strokeStyle = _this.props.gridColor;
      ctx.lineWidth = 0.5;

      var gridSize = 25;

      var countX = 0;
      while (countX < ctx.canvas.width) {
        countX += gridSize;
        ctx.moveTo(countX, 0);
        ctx.lineTo(countX, ctx.canvas.height);
      }
      ctx.stroke();

      var countY = 0;
      while (countY < ctx.canvas.height) {
        countY += gridSize;
        ctx.moveTo(0, countY);
        ctx.lineTo(ctx.canvas.width, countY);
      }
      ctx.stroke();
    };

    _this.drawInterface = function (ctx, pointer, brush) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Draw brush preview
      ctx.beginPath();
      ctx.fillStyle = _this.props.brushColor;
      ctx.arc(brush.x, brush.y, _this.props.brushRadius, 0, Math.PI * 2, true);
      ctx.fill();

      // Draw mouse point (the one directly at the cursor)
      ctx.beginPath();
      ctx.fillStyle = _this.props.catenaryColor;
      ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
      ctx.fill();

      // Draw catenary
      if (_this.lazy.isEnabled()) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = _this.props.catenaryColor;
        _this.catenary.drawToCanvas(_this.ctx.interface, brush, pointer, _this.chainLength);
        ctx.stroke();
      }

      // Draw brush point (the one in the middle of the brush preview)
      ctx.beginPath();
      ctx.fillStyle = _this.props.catenaryColor;
      ctx.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
      ctx.fill();
    };

    _this.canvas = {};
    _this.ctx = {};

    _this.catenary = new _catenaryCurve.Catenary();

    _this.points = [];
    _this.lines = [];

    _this.mouseHasMoved = true;
    _this.valuesChanged = true;
    _this.isDrawing = false;
    _this.isPressing = false;
    return _this;
  }

  _default.prototype.componentDidMount = function componentDidMount() {
    var _this2 = this;

    this.lazy = new _lazyBrush.LazyBrush({
      radius: this.props.lazyRadius * window.devicePixelRatio,
      enabled: true,
      initialPoint: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      }
    });
    this.chainLength = this.props.lazyRadius * window.devicePixelRatio;

    this.canvasObserver = new _resizeObserverPolyfill2.default(function (entries, observer) {
      return _this2.handleCanvasResize(entries, observer);
    });
    this.canvasObserver.observe(this.canvasContainer);

    this.drawImage();
    this.loop();

    window.setTimeout(function () {
      var initX = window.innerWidth / 2;
      var initY = window.innerHeight / 2;
      _this2.lazy.update({ x: initX - _this2.chainLength / 4, y: initY }, { both: true });
      _this2.lazy.update({ x: initX + _this2.chainLength / 4, y: initY }, { both: false });
      _this2.mouseHasMoved = true;
      _this2.valuesChanged = true;
      _this2.clear();

      // Load saveData from prop if it exists
      if (_this2.props.saveData) {
        _this2.loadSaveData(_this2.props.saveData);
      }
    }, 100);
  };

  _default.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
    if (prevProps.lazyRadius !== this.props.lazyRadius) {
      // Set new lazyRadius values
      this.chainLength = this.props.lazyRadius * window.devicePixelRatio;
      this.lazy.setRadius(this.props.lazyRadius * window.devicePixelRatio);
    }

    if (prevProps.saveData !== this.props.saveData) {
      this.loadSaveData(this.props.saveData);
    }

    if (JSON.stringify(prevProps) !== JSON.stringify(this.props)) {
      // Signal this.loop function that values changed
      this.valuesChanged = true;
    }
  };

  _default.prototype.render = function render() {
    var _this3 = this;

    return _react2.default.createElement(
      "div",
      {
        className: this.props.className,
        style: _extends({
          display: "block",
          background: this.props.backgroundColor,
          touchAction: "none",
          width: this.props.canvasWidth,
          height: this.props.canvasHeight
        }, this.props.style),
        ref: function ref(container) {
          if (container) {
            _this3.canvasContainer = container;
          }
        }
      },
      canvasTypes.map(function (_ref6) {
        var name = _ref6.name,
            zIndex = _ref6.zIndex;

        var isInterface = name === "interface";
        return _react2.default.createElement("canvas", {
          key: name,
          ref: function ref(canvas) {
            if (canvas) {
              _this3.canvas[name] = canvas;
              _this3.ctx[name] = canvas.getContext("2d");
            }
          },
          style: _extends({}, canvasStyle, { zIndex: zIndex }),
          onMouseDown: isInterface ? _this3.handleMouseDown : undefined,
          onMouseMove: isInterface ? _this3.handleMouseMove : undefined,
          onMouseUp: isInterface ? _this3.handleMouseUp : undefined,
          onMouseOut: isInterface ? _this3.handleMouseUp : undefined,
          onTouchStart: isInterface ? _this3.handleTouchStart : undefined,
          onTouchMove: isInterface ? _this3.handleTouchMove : undefined,
          onTouchEnd: isInterface ? _this3.handleTouchEnd : undefined,
          onTouchCancel: isInterface ? _this3.handleTouchEnd : undefined
        });
      })
    );
  };

  return _default;
}(_react.PureComponent), _class.propTypes = {
  onChange: _propTypes2.default.func,
  loadTimeOffset: _propTypes2.default.number,
  lazyRadius: _propTypes2.default.number,
  brushRadius: _propTypes2.default.number,
  brushColor: _propTypes2.default.string,
  catenaryColor: _propTypes2.default.string,
  gridColor: _propTypes2.default.string,
  backgroundColor: _propTypes2.default.string,
  hideGrid: _propTypes2.default.bool,
  canvasWidth: dimensionsPropTypes,
  canvasHeight: dimensionsPropTypes,
  disabled: _propTypes2.default.bool,
  imgSrc: _propTypes2.default.string,
  saveData: _propTypes2.default.string,
  immediateLoading: _propTypes2.default.bool
}, _class.defaultProps = {
  onChange: null,
  loadTimeOffset: 5,
  lazyRadius: 12,
  brushRadius: 10,
  brushColor: "#444",
  catenaryColor: "#0a0302",
  gridColor: "rgba(150,150,150,0.17)",
  backgroundColor: "#FFF",
  hideGrid: false,
  canvasWidth: 400,
  canvasHeight: 400,
  disabled: false,
  imgSrc: "",
  saveData: "",
  immediateLoading: false
}, _temp);

exports.default = _default;
module.exports = exports["default"];