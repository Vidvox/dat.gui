import Controller from './Controller';
import dom from '../dom/dom';
import common from '../utils/common';

/*
 * Linearly maps a position in [0,1] to our vector range.
 */
function pos2vec(pos, min, max) {
  return [
    pos[0] * (max[0] - min[0]) + min[0],
    pos[1] * (max[1] - min[1]) + min[1],
  ];
}

/*
 * Linearly maps a value in our vector range to
 * a position in [0, 1]
 */
function vec2pos(vec, min, max) {
  return [
    (vec[0] - min[0]) / (max[0] - min[0]),
    (vec[1] - min[1]) / (max[1] - min[1]),
  ];
}

/**
 * @class Represents a given property of an object that is a 2D vector.
 * @param {Object} object
 * @param {string} property
 */
class VectorController extends Controller {
  constructor(object, property, min = [0, 0], max = [1, 1]) {
    super(object, property, { min: min, max: max });
    this.__min = min;
    this.__max = max;
    this.__vec = (this.getValue());
    this.__temp = [0, 0];

    const _this = this;

    this.domElement = document.createElement('div');

    dom.makeSelectable(this.domElement, false);

    this.__selector = document.createElement('div');
    this.__selector.className = 'vector-selector';

    this.__pos_field = document.createElement('div');
    this.__pos_field.className = 'saturation-field';

    this.__field_knob = document.createElement('div');
    this.__field_knob.className = 'field-knob';

    dom.bind(this.__selector, 'mousedown', function(/* e */) {
      dom
        .addClass(this, 'drag')
        .bind(window, 'mouseup', function(/* e */) {
          dom.removeClass(_this.__selector, 'drag');
        });
    });

    dom.bind(this.__selector, 'touchstart', function(/* e */) {
      dom
        .addClass(this, 'drag')
        .bind(window, 'touchend', function(/* e */) {
          dom.removeClass(_this.__selector, 'drag');
        });
    });

    common.extend(this.__selector.style, {
      width: '52px',
      height: '52px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });

    common.extend(this.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      borderRadius: '12px',
      zIndex: 1
    });

    common.extend(this.__pos_field.style, {
      width: '50px',
      height: '50px',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });

    dom.bind(this.__pos_field, 'mousedown', fieldDown);
    dom.bind(this.__pos_field, 'touchstart', fieldDown);

    dom.bind(this.__field_knob, 'mousedown', fieldDown);
    dom.bind(this.__field_knob, 'touchstart', fieldDown);

    function fieldDown(e) {
      setSV(e);
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'touchmove', setSV);
      dom.bind(window, 'mouseup', fieldUpSV);
      dom.bind(window, 'touchend', fieldUpSV);
    }

    function fieldUpSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'touchmove', setSV);
      dom.unbind(window, 'mouseup', fieldUpSV);
      dom.unbind(window, 'touchend', fieldUpSV);
      onFinish();
    }

    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.__vec);
      }
    }

    this.__selector.appendChild(this.__field_knob);
    this.__selector.appendChild(this.__pos_field);
    this.domElement.appendChild(this.__selector);

    this.updateDisplay();

    function setSV(e) {
      if (e.type.indexOf('touch') === -1) { e.preventDefault(); }

      const fieldRect = _this.__pos_field.getBoundingClientRect();
      const { clientX, clientY } = (e.touches && e.touches[0]) || e;
      let x = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
      let y = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

      if (x > 1) {
        x = 1;
      } else if (x < 0) {
        x = 0;
      }

      if (y > 1) {
        y = 1;
      } else if (y < 0) {
        y = 0;
      }

      _this.__vec = pos2vec([x, y], _this.__min, _this.__max);
      _this.setValue(_this.__vec);

      return false;
    }
  }

  updateDisplay() {
    this.__vec = this.getValue();
    const offset = vec2pos(this.__vec, this.__min, this.__max);
    common.extend(this.__field_knob.style, {
      marginLeft: 50 * offset[0] - 7 + 'px',
      marginTop: 50 * (1 - offset[1]) - 7 + 'px',
    });

    this.__temp[0] = 1;
    this.__temp[1] = 1;
  }
}

const vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

export default VectorController;
