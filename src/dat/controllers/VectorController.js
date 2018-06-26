import Controller from './Controller';
import dom from '../dom/dom';
import common from '../utils/common';

/**
 * @class Represents a given property of an object that is a vector.
 * @param {Object} object
 * @param {string} property
 */
class VectorController extends Controller {
  constructor(object, property, min=0, max=1) {
    super(object, property, { min: min, max: max });

    this.__vec = (this.getValue());
    this.__temp = [0, 0];

    const _this = this;

    this.domElement = document.createElement('div');

    dom.makeSelectable(this.domElement, false);

    this.__selector = document.createElement('div');
    this.__selector.className = 'selector';

    this.__pos_field = document.createElement('div');
    this.__pos_field.className = 'saturation-field';

    this.__field_knob = document.createElement('div');
    this.__field_knob.className = 'field-knob';

    this.__input = document.createElement('input');
    this.__input.type = 'text';

    dom.bind(this.__input, 'keydown', function(e) {
      if (e.keyCode === 13) { // on enter
      }
    });

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

    const valueField = document.createElement('div');

    common.extend(this.__selector.style, {
      width: '102px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });

    common.extend(this.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: '2px solid #fff',
      borderRadius: '12px',
      zIndex: 1
    });

    common.extend(this.__pos_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });

    common.extend(valueField.style, {
      width: '100%',
      height: '100%',
      background: 'none'
    });

    common.extend(this.__input.style, {
      outline: 'none',
      textAlign: 'center',
      border: 0,
      fontWeight: 'bold',
      textShadow: this.__input_textShadow + 'rgba(0,0,0,0.7)'
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

    this.__pos_field.appendChild(valueField);
    this.__selector.appendChild(this.__field_knob);
    this.__selector.appendChild(this.__pos_field);
    this.domElement.appendChild(this.__input);
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

      _this.__vec[0] = x * (max[0] - min[0]) + min[0];
      _this.__vec[1] = y * (max[1] - min[1]) + min[1];

      _this.setValue(_this.__vec);


      return false;
    }
  }

  updateDisplay() {
    this.__vec = this.getValue();
    common.extend(this.__field_knob.style, {
      marginLeft: 100 * this.__vec[0] - 7 + 'px',
      marginTop: 100 * (1 - this.__vec[1]) - 7 + 'px',
    });

    this.__temp[0] = 1;
    this.__temp[1] = 1;


    this.__input.value = '[' + this.__vec[0].toFixed(3) + ',' + this.__vec[1].toFixed(3) + ']';
  }
}

const vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

export default VectorController;
