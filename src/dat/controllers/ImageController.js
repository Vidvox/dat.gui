import SuperGif from 'wsgif';
import Controller from './Controller';
import dom from '../dom/dom';
import '../utils/getUserMedia';
class ImageController extends Controller {
  constructor(object, property, opts) {
    super(object, property);
    let defaultOptions;
    let disableVideo = false;

    if (opts.defaults) {
      disableVideo = opts.disableVideo;
      defaultOptions = opts.defaults;
    } else {
      defaultOptions = opts;
    }

    this.__controlContainer = document.createElement('div');
    dom.addClass(this.__controlContainer, 'image-picker');
    this.videoStreams = [];

    this.__selectedInputContainer = this.__controlContainer.appendChild(document.createElement('div'));
    dom.addClass(this.__selectedInputContainer, 'selected-image');

    this.__swatches = this.__controlContainer.appendChild(document.createElement('div'));
    dom.addClass(this.__swatches, 'image-swatches');

    this.__img = this.__selectedInputContainer.appendChild(document.createElement('img'));
    this.__img.crossOrigin = 'anonymous';

    this.__video = this.__selectedInputContainer.appendChild(document.createElement('video'));
    this.__input = this.__controlContainer.appendChild(document.createElement('input'));

    this.__swatchButtons = this.__swatches.appendChild(document.createElement('div'));
    dom.addClass(this.__swatchButtons, 'swatch-buttons');

    this.__swatchImages = this.__swatches.appendChild(document.createElement('div'));
    this.__disableVideo = disableVideo;
    dom.addClass(this.__swatchImages, 'swatch-images');
    this.__useCamera = navigator.getUserMedia && !disableVideo;

    if (this.__useCamera) {
      this.__camera = this.__swatchButtons.appendChild(document.createElement('div'));
      this.__cameraTitle = this.__camera.appendChild(document.createElement('span'));
      this.__cameraTitle.innerHTML = "Video";
      this.__cameraIcon = this.__camera.appendChild(document.createElement('div'));
      dom.addClass(this.__cameraIcon, 'camera-icon');
      dom.addClass(this.__camera, 'camera-button');
    }
    this.__plus = this.__swatchButtons.appendChild(document.createElement('div'));
    this.__plusTitle = this.__plus.appendChild(document.createElement('span'));
    this.__plusTitle.innerHTML = "Image";
    this.__plusIcon = this.__plus.appendChild(document.createElement('div'));
    dom.addClass(this.__plusIcon, 'new-image-icon');
    dom.addClass(this.__plus, 'new-image-button');

    defaultOptions.forEach((option) => {
      this.addSwatch(option.src, option.videoSrc);
    });

    this.__video.className = this.__img.className = 'content';
    this.__video.crossOrigin = 'anonymous';
    // should this be //webkit-playsinline?
    // as of iOS10 you don't need the prefix
    this.__video.setAttribute('playsinline', true);
    this.__input.type = 'file';

    this.__gifImg = this.__selectedInputContainer.appendChild(document.createElement('img'));
    this.__gifImg.crossOrigin = 'anonymous';
    dom.addClass(this.__gifImg, 'content gif-img');
    this.__glGif = new SuperGif({ gif: this.__gifImg });
    this.__gifNeedsInitializing = true;
    // this.__glGif.load();

    this.initializeValue();
    if (this.__useCamera) {
      dom.bind(this.__camera, 'click', onCameraClick.bind(this));
    }
    dom.bind(this.__plus, 'click', chooseImage.bind(this));
    dom.bind(this.__input, 'change', inputChange.bind(this));

    dom.bind(this.__img, 'dragover', onDragOver.bind(this));
    dom.bind(this.__img, 'dragleave', onDragLeave.bind(this));
    dom.bind(this.__img, 'drop', onDrop.bind(this));
    dom.bind(this.__video, 'dragover', onDragOver.bind(this));
    dom.bind(this.__video, 'dragleave', onDragLeave.bind(this));
    dom.bind(this.__video, 'drop', onDrop.bind(this));

    function chooseImage() {
      this.__input.click();
    }

    function inputChange(e) {
      const file = e.target.files[0];
      file.isSaved = false;
      this.parseFile(file);
    }

    function onDragOver(e) {
      e.preventDefault();
      e.target.classList.add('dragover');
    }

    function onDragLeave(e) {
      e.target.classList.remove('dragover');
    }

    function onDrop(e) {
      e.target.classList.remove('dragover');
      const file = e.originalEvent.dataTransfer.files[0];
      file.isSaved = false;
      this.parseFile(file);
    }

    function onCameraClick() {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(localMediaStream => {
          this.killStream();
          this.videoStream = localMediaStream;
          this.setValue({
            type: 'video-stream',
            value: localMediaStream,
            domElement: this.__video
          });
        })
        .catch(err => {
          this.killStream();
        })
    }

    // at the end
    this.domElement.appendChild(this.__controlContainer);
  }

  killStream() {
    if (!this.videoStream) return;
    this.videoStream.getTracks().forEach(track => track.stop());
  }

  destruct() {
    this.killStream();
  }

  initializeValue() {
    const asset = this.getValue();
    if (!asset) { return; }
    // const isAnimated = asset.url.split('.').pop() === 'gif';
    if (asset.type === 'gif') {
      if (this.__gifNeedsInitializing) {
        this.setImage(asset.url, true);
      } else {
        this.setValue({
          url: asset.url,
          type: asset.type,
          domElement: this.__glGif.get_canvas()
        });
      }
    } else if (asset.type === 'image') {
      this.setValue({
        url: asset.url,
        type: asset.type,
        domElement: this.__img
      });
    } else if (asset.type === 'video') {
      this.setValue({
        url: asset.url,
        type: asset.type,
        domElement: this.__video
      });
    }
  }

  updateDisplay() {
    const asset = this.getValue();
    if (!asset) { return; }
    if (asset.type === 'image') {
      this.setImage(asset.url, false);
    } else if (asset.type === 'gif') {
      this.setImage(asset.url, true);
    } else if (asset.type === 'video') {
      this.setVideo(asset.url);
    } else if (asset.type === 'video-stream') {
      this.setVideo(asset.value);
    }
  }

  parseFile(file) {
    // is there a better way to get the mime type?
    const type = file.type.split('/')[0];
    if (this.__glGif) this.__glGif.pause();
    if (type === 'image') {
      const url = file.urlOverride || URL.createObjectURL(file);
      const isAnimated = file.type.split('/')[1] === 'gif' || file.animatedOverride;
      if (!this.__disableVideo && isAnimated) {
        if (this.__gifNeedsInitializing) {
          this.setImage(url, true);
        } else {
          this.setValue({
            url: url,
            type: 'gif',
            domElement: this.__glGif.get_canvas()
          });
        }
      } else if (!isAnimated) {
        this.setValue({
          url: url,
          type: 'image',
          domElement: this.__img
        });
        this.setImage(url, false);
      }
    } else if (!this.__disableVideo && type === 'video') {
      this.setValue({
        url: url,
        type: 'video',
        domElement: this.__video
      });
      this.setVideo();
    }
  }

  setImage(url, isAnimated) {
    if (this.__skipSetImage) {
      this.__skipSetImage = false;
      return;
    }
    this.__isVideo = false;
    this.__isAnimated = isAnimated;
    if (isAnimated) {
      this.__img.src = '';
      this.__img.style.display = 'none';
      this.__gifImg.src = url;
      if (this.__glGif.get_canvas()) {
        this.__glGif.get_canvas().style.display = 'block';
      }
      this.__glGif.load((err) => {
        if (!err) {
          this.__glGif.play().catch(e => console.log(e));
          if (this.__gifNeedsInitializing) {
            // only want to call this if the canvas hasn't been initialized yet
            // but don't want to call setImage again
            // could have a variable to skip setImage once?

            this.__gifNeedsInitializing = false;
            this.__skipSetImage = true;
            this.setValue({
              url: url,
              type: 'gif',
              domElement: this.__glGif.get_canvas()
            });
          }
        }
      });
    } else {
      if (this.__glGif.get_canvas()) {
        this.__glGif.get_canvas().style.display = 'none';
      }
      this.__img.src = url;
      this.__img.style.display = 'block';
    }
    this.__video.style.display = 'none';
    this.__video.src = '';
  }

  setVideo() {
    const asset = this.getValue();
    if (asset.type === 'video-stream') {
      this.__video.srcObject = asset.value;
    } else {
      this.killStream();
      this.__video.src = asset.url;
    }
    this.__isVideo = true;
    this.__isAnimated = true;
    this.__video.loop = true;
    this.__video.volume = 0;
    this.__video.play().catch(e => {
      console.log(e, e.message, e.name)
    });
    this.__img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
    this.__img.style.display = 'none';
    if (this.__glGif.get_canvas()) {
      this.__glGif.get_canvas().style.display = 'none';
    }
    this.__video.style.display = 'block';
  }

  addSwatch(src, videoSrc) {
    const swatch = this.__swatchImages.appendChild(document.createElement('img'));
    swatch.src = src;
    swatch.videoSrc = videoSrc;
    swatch.className = 'swatch';

    dom.bind(swatch, 'click', () => {
      if (videoSrc) {
        this.setValue({
          url: videoSrc,
          type: 'video',
          domElement: this.__video
        });
      } else {
        const isAnimated = src.split('.').pop() === 'gif';
        if (isAnimated) {
          if (this.__gifNeedsInitializing) {
            this.setImage(url, true);
          } else {
            this.setValue({
              url: src,
              type: 'gif',
              domElement: this.__glGif.get_canvas()
            });
          }
        } else {
          this.setValue({
            url: src,
            type: 'image',
            domElement: this.__img
          });
        }
      }
    });
  }
}

export default ImageController;
