// dependencies:
import ArrayUtil from './array-util.es6.js';
import FloatBuffer from './float-buffer.es6.js';

class SoundFFT {

  constructor(context, sourceAudioNode, options={}) { // Howler.ctx, sound._sounds[0]._node
    this.context = context;
    this.sourceAudioNode = sourceAudioNode;
    this.debug = false;
    this.options = {
      fftSize: 512,                   // eq bands. analysis resolution
      fftDecay: 0.98,                 // eq band decay
      waveformCrossfadeEndsAmp: 0.05, // crossfade both ends of the waveform together
      beatHoldTime: 300,              // minimum frames in between detected beats
      beatDecayRate: 0.97,            // beat amp decay. smooths out likeliness of the next beat
      beatMinAmp: 0.15,               // minimum normalized amp for a beat
      beatAmpDirectionThresh: 0.01,   // minimum normalized amplitude direction for a beat
      beatAmpDirectionSamples: 5,     // number of samples for amplitude direction tracking
    }
    // override default options
    for(let key in options) {
      if(!!this.options[key]) this.options[key] = options[key];
    }

    // send sound node to analyser. the main destination output remains intact
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = this.options.fftSize;
    this.analyser.smoothingTimeConstant = 0.1;
    this.sourceAudioNode.connect(this.analyser);

    // build audio data array
    this.binCount = this.analyser.frequencyBinCount;
    this.spectrumData = new Uint8Array(this.binCount);
    this.spectrum = new Array(this.binCount);
    this.spectrumCrossfaded = new Array(this.binCount);
    for(var i=0; i < this.binCount; i++) this.spectrum[i] = 0; // reset to zero

    this.waveformData = new Uint8Array(this.binCount);
    this.waveform = new Array(this.binCount);
    this.waveformCrossfadeEndsAmp = this.options.waveformCrossfadeEndsAmp;
    for(var i=0; i < this.binCount; i++) this.waveform[i] = 0; // reset to zero

    // spectrum decay
    this.freqDecay = this.options.fftDecay;

    // beat detect
    this.detectedBeat = false;
    this.beatCutOff = 0;
    this.beatLastTime = 0;
    this.beatHoldTime = this.options.beatHoldTime;
    this.beatDecayRate = this.options.beatDecayRate;
    this.beatMinAmp = this.options.beatMinAmp;
    this.avgAmp = 0;
    this.avgAmpDirect = 0;
    this.beatAmpDirectionThresh = this.options.beatAmpDirectionThresh;
    this.ampDirection = new FloatBuffer(this.options.beatAmpDirectionSamples);

    // pitch detection
    this.doCenterClip = true;
    this.centerClipThreshold = 0.0;
    this.preNormalize = false;
    this.postNormalize = false;
    this.freqAvg = new FloatBuffer(10);
    this.lastPitchTime = 0;
    this.pitchTimeThresh = 300;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  // Public API
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  setNewSourceAudioNode(newAudioNode) {
    // remove old audio source from analyzer chain
    if(this.sourceAudioNode) {
      this.sourceAudioNode.disconnect(this.analyser);
    }

    // store & set new source in audio chain
    this.sourceAudioNode = newAudioNode;
    this.sourceAudioNode.connect(this.analyser);
  }

  setDebug(isDebug) {
    this.debug = isDebug;
  }

  getSpectrum() {
    return this.spectrum;
  }

  getWaveform() {
    return this.waveform;
  }

  getDetectedBeat() {
    return this.detectedBeat;
  }

  getPitch() {
    if(Date.now() - this.lastPitchTime > this.pitchTimeThresh) {
      return 0;
    } else {
      return this.freqAvg.average();
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  // Update - call this on requestAnimationFrame
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  update() {
    if(this.analyser) {
      // get raw data
      this.analyser.getByteFrequencyData(this.spectrumData);
      this.analyser.getByteTimeDomainData(this.waveformData);
      // turn it into usable floats: 0-1 for spectrum and -1 to 1 for waveform data
      this.calcAvgAmp();
      this.normalizeSpectrumFloats(false);
      this.normalizeWaveformFloats();
      this.calcAvgDecayedAmp();
      this.detectBeats();
      this.calculatePitch();
      ArrayUtil.crossfadeEnds(this.waveform, this.waveformCrossfadeEndsAmp);
      if(this.debug) this.drawDebug();
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  // Update Amplitude, FFT, and waveform data
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  calcAvgAmp() {
    let totalEQ = 0;
    for(var i = 0; i < this.spectrumData.length; i++) {
      totalEQ += this.spectrumData[i];
    }
    this.avgAmpDirect = totalEQ / this.spectrumData.length;
    this.avgAmpDirect /= 255;
  }

  normalizeSpectrumFloats(crossfadeEnds) {
    if(crossfadeEnds == false) {
      for(var i = 0; i < this.spectrumData.length; i++) {
        let curFloat = this.spectrumData[i] / 255;
        this.spectrum[i] = Math.max(curFloat, this.spectrum[i] * this.freqDecay); // lerp decay
      }
    } else {
      // create temp crossfaded array without decay
      for(var i = 0; i < this.spectrumData.length; i++) {
        let curFloat = this.spectrumData[i] / 255;
        this.spectrumCrossfaded[i] = curFloat;
      }
      ArrayUtil.crossfadeEnds(this.spectrumCrossfaded, 0.5);
      // use crossfaded array to decay
      for(var i = 0; i < this.spectrumCrossfaded.length; i++) {
        let curFloat = this.spectrumCrossfaded[i];
        this.spectrum[i] = Math.max(curFloat, this.spectrum[i] * this.freqDecay); // lerp decay
      }
    }
  }

  normalizeWaveformFloats() {
    for(var i = 0; i < this.waveformData.length; i++) {
      this.waveform[i] = 2 * (this.waveformData[i] / 255 - 0.5);
    }
  }

  resetSpectrum() {
    // bring spectrum back down to zero after song ends
    if(this.spectrum) {
      for (var i = 0; i < this.spectrum.length; i++) {
        if(this.spectrum[i] > 0) {
          this.spectrum[i] = this.spectrum[i] - 1;
        }
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  // Beat detection
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  calcAvgDecayedAmp() {
    let lastAmp = this.avgAmp;
    let ampSum = 0;
    for(var i = 0; i < this.spectrum.length; i++) {
      ampSum += this.spectrum[i]; // `spectrum is decayed data`
    }
    this.avgAmp = ampSum / this.spectrum.length;
    this.ampDirection.update(this.avgAmp - lastAmp);
  }

  detectBeats() {
    if(this.avgAmp > this.beatCutOff && this.avgAmp > this.beatMinAmp && this.beatDetectAvailable() && this.ampDirection.average() > this.beatAmpDirectionThresh) {
      this.detectedBeat = true;
      this.beatCutOff = this.avgAmp * 1.1;  // put the cutoff a bit above the threshold where a beat was detected
      this.beatLastTime = Date.now();
    } else {
      this.detectedBeat = false;
      if(this.beatDetectAvailable()){
        this.beatCutOff *= this.beatDecayRate;
        this.beatCutOff = Math.max(this.beatCutOff, this.beatMinAmp);
      }
    }
  }

  beatDetectAvailable() {
    return Date.now() > this.beatLastTime + this.beatHoldTime;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  // Pitch analysis
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  /**
   *  Pitch Detection using Auto Correlation.
   *
   *  Auto correlation multiplies each sample in a buffer by all
   *  of the other samples. This emphasizes the fundamental
   *  frequency.
   *
   *  Running the signal through a low pass filter prior to
   *  autocorrelation helps bring out the fundamental frequency.
   *
   *  The visualization is a correlogram, which plots
   *  the autocorrelations.
   *
   *  We calculate the pitch by counting the number of samples
   *  between peaks.
   *
   *  Example by Jason Sigal and Golan Levin.
   *  from: https://therewasaguy.github.io/p5-music-viz/
   *  modified by: @cacheflowe
   */

  calculatePitch() {
    // array of values from -1 to 1
    this.corrBuff = this.autoCorrelate(this.waveform);
    let freq = this.findFrequency(this.corrBuff);
    if(freq > 0 && freq < 10000 && this.avgAmpDirect > 0.01) {   // if it's a valid freq & signal is loud enough, use it!
      this.freqAvg.update(freq);
      this.lastPitchTime = Date.now();
    }
  }

  // accepts a timeDomainBuffer and multiplies every value
  autoCorrelate(timeDomainBuffer) {
    var nSamples = timeDomainBuffer.length;

    // pre-normalize the input buffer
    if (this.preNormalize){
      timeDomainBuffer = this.normalize(timeDomainBuffer);
    }

    // zero out any values below the centerClipThreshold
    if (this.doCenterClip) {
      timeDomainBuffer = this.centerClip(timeDomainBuffer);
    }

    var autoCorrBuffer = [];
    for (var lag = 0; lag < nSamples; lag++){
      var sum = 0;
      for (var index = 0; index < nSamples-lag; index++){
        var indexLagged = index+lag;
        var sound1 = timeDomainBuffer[index];
        var sound2 = timeDomainBuffer[indexLagged];
        var product = sound1 * sound2;
        sum += product;
      }

      // average to a value between -1 and 1
      autoCorrBuffer[lag] = sum/nSamples;
    }

    // normalize the output buffer
    if (this.postNormalize){
      autoCorrBuffer = this.normalize(autoCorrBuffer);
    }
    return autoCorrBuffer;
  }

  // Find the biggest value in a buffer, set that value to 1.0,
  // and scale every other value by the same amount.
  normalize(buffer) {
    var biggestVal = 0;
    var nSamples = buffer.length;
    for (var index = 0; index < nSamples; index++){
      if (Math.abs(buffer[index]) > biggestVal){
        biggestVal = Math.abs(buffer[index]);
      }
    }
    for (var index = 0; index < nSamples; index++){
      // divide each sample of the buffer by the biggest val
      buffer[index] /= biggestVal;
    }
    return buffer;
  }

  // Accepts a buffer of samples, and sets any samples whose
  // amplitude is below the centerClipThreshold to zero.
  // This factors them out of the autocorrelation.
  centerClip(buffer) {
    var nSamples = buffer.length;

    // center clip removes any samples whose abs is less than centerClipThreshold
    // this.centerClipThreshold = map(mouseY, 0, height, 0,1);

    if (this.centerClipThreshold > 0.0) {
      for (var i = 0; i < nSamples; i++) {
        var val = buffer[i];
        buffer[i] = (Math.abs(val) > this.centerClipThreshold) ? val : 0;
      }
    }
    return buffer;
  }

  // Calculate the fundamental frequency of a buffer
  // by finding the peaks, and counting the distance
  // between peaks in samples, and converting that
  // number of samples to a frequency value.
  findFrequency(autocorr) {
    var nSamples = autocorr.length;
    var valOfLargestPeakSoFar = 0;
    var indexOfLargestPeakSoFar = -1;

    for (var index = 1; index < nSamples; index++){
      var valL = autocorr[index-1];
      var valC = autocorr[index];
      var valR = autocorr[index+1];

      var bIsPeak = ((valL < valC) && (valR < valC));
      if (bIsPeak){
        if (valC > valOfLargestPeakSoFar){
          valOfLargestPeakSoFar = valC;
          indexOfLargestPeakSoFar = index;
        }
      }
    }

    var distanceToNextLargestPeak = indexOfLargestPeakSoFar - 0;

    // convert sample count to frequency
    var fundamentalFrequency = this.context.sampleRate / distanceToNextLargestPeak;
    return fundamentalFrequency;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  // Debug <canvas> view
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  buildDebugCanvas() {
    // debug params
    this.titleH = 16;
    this.panelLargeH = 70;
    this.panelMediumH = 35;
    this.panelSmallH = 20;
    this.debugW = 256;
    this.debugH = this.titleH * 5 + this.panelLargeH * 2 + this.panelMediumH * 1 + this.panelSmallH * 2;

    this.colorWhite = '#fff';
    this.colorGreen = 'rgba(0, 255, 0, 1)';
    this.colorYellow = 'rgba(255, 255, 0, 1)';
    this.colorRed = 'rgba(255, 0, 0, 1)';
    this.colorBlack = '#000';
    this.clearColor = 'rgba(0, 0, 0, 0)';

    // build canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.debugW;
    this.canvas.height = this.debugH;
    this.canvas.setAttribute('class', 'sound-fft-debug');
    this.canvas.style.setProperty('border', '2px solid #fff');
    document.body.appendChild(this.canvas);

    // setup canvas context dfaults
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = this.colorBlack;
    this.ctx.strokeStyle = this.colorWhite;
    this.ctx.lineWidth = 2;
    this.ctx.font = "9px Arial";
  }

  getDebugCanvas() {
    return this.canvas;
  }

  drawPanelBg(x, y, w, h) {
    this.ctx.fillStyle = this.colorBlack;
    this.ctx.strokeStyle = this.colorWhite;
    this.ctx.strokeRect(x, y, w, h);
  }

  drawDebug() {
    if(this.ctx == null) this.buildDebugCanvas();

    // clear background
    this.ctx.save();
    this.ctx.fillStyle = this.colorBlack;
    this.ctx.strokeStyle = this.colorWhite;
    this.ctx.fillRect(0, 0, this.debugW, this.debugH);

    ////////////////////////////////////
    // draw spectrum
    ////////////////////////////////////
    // fft title
    this.drawPanelBg(0, 0, this.debugW, this.titleH);
    this.drawDebugText(`FFT [${this.binCount}]`, 4, 11, this.colorWhite);
    this.drawDebugText(`sampleRate [${this.context.sampleRate}]`, this.debugW / 2, 11, this.colorWhite);

    // fft bars
    this.ctx.translate(0, this.titleH);
    this.drawPanelBg(0, 0, this.debugW, this.panelLargeH);

    // line width
    var barWidth = this.debugW / this.binCount;
    this.ctx.lineWidth = barWidth;
    // decayed fft data
    this.ctx.fillStyle = this.colorWhite;
    for(var i = 0; i < this.binCount; i++) {
      this.ctx.fillRect(i * barWidth, this.panelLargeH, barWidth, -this.spectrum[i] * this.panelLargeH);
    }
    // green original data
    this.ctx.fillStyle = this.colorGreen;
    for(var i = 0; i < this.binCount; i++) {
      this.ctx.fillRect(i * barWidth, this.panelLargeH, barWidth, -this.spectrumData[i]/255 * this.panelLargeH);
    }

    ////////////////////////////////////
    // draw waveform
    ////////////////////////////////////
    // waveform title
    this.ctx.translate(0, this.panelLargeH);
    this.drawPanelBg(0, 0, this.debugW, this.titleH);
    this.drawDebugText(`Waveform [${this.binCount}]`, 4, 11, this.colorWhite);

    // waveform data
    this.ctx.translate(0, this.titleH);
    this.drawPanelBg(0, 0, this.debugW, this.panelLargeH);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.colorWhite;
    this.ctx.beginPath();
    for(var i = 0; i < this.binCount; i++) {
      this.ctx.lineTo(i * barWidth, this.panelLargeH / 2 + this.waveform[i] * this.panelLargeH / 2);
    }
    this.ctx.stroke();

    ////////////////////////////////////
    // draw pitch analysis
    ////////////////////////////////////
    // pitch title
    this.ctx.translate(0, this.panelLargeH);
    this.drawPanelBg(0, 0, this.debugW, this.titleH);
    this.drawDebugText(`Pitch: ${this.getPitch().toFixed(2)}hz`, 4, 11, this.colorWhite);

    // pitch data
    this.ctx.translate(0, this.titleH);
    this.drawPanelBg(0, 0, this.debugW, this.panelMediumH);

    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.colorYellow;
    if(Date.now() - this.lastPitchTime > this.pitchTimeThresh) this.ctx.strokeStyle = this.colorRed;
    this.ctx.beginPath();
    for(var i = 0; i < this.binCount; i++) {
      let pitchOsc = Math.sin(i * this.getPitch() * 0.0002);
      this.ctx.lineTo(i * barWidth, this.panelMediumH / 2 + pitchOsc * this.panelMediumH / 2.5);
    }
    this.ctx.stroke();

    ////////////////////////////////////
    // draw amplitude
    ////////////////////////////////////
    // amp title
    this.ctx.translate(0, this.panelMediumH);
    this.drawPanelBg(0, 0, this.debugW, this.titleH);
    this.drawDebugText(`Amplitude: ${this.avgAmpDirect.toFixed(2)}`, 4, 11, this.colorWhite);

    // amp panel
    this.ctx.translate(0, this.titleH);
    this.drawPanelBg(0, 0, this.debugW, this.panelSmallH);

    // amp data
    this.ctx.fillStyle = this.colorGreen;
    this.ctx.fillRect(0, 0, this.debugW * this.avgAmpDirect, this.panelSmallH);

    ////////////////////////////////////
    // draw beat detection
    ////////////////////////////////////
    // amp title
    this.ctx.translate(0, this.panelSmallH);
    this.drawPanelBg(0, 0, this.debugW, this.titleH);
    this.drawDebugText(`Beat Detect amp: ${this.avgAmpDirect.toFixed(2)}`, 4, 11, this.colorWhite);
    this.drawDebugText(`Amp Up: ${Math.max(0, this.ampDirection.average().toFixed(3))}`, this.debugW / 2, 11, this.colorWhite);

    // amp panel
    this.ctx.translate(0, this.titleH);
    this.drawPanelBg(0, 0, this.debugW, this.panelSmallH);

    // amp panel
    this.ctx.fillStyle = this.colorGreen;
    this.ctx.fillRect(0, 0, this.debugW * this.avgAmpDirect, this.panelSmallH);

    // beat detection amp (this is just the main average of the decayed spectrum array)
    // beat detect cutoff
    this.ctx.fillStyle = this.colorYellow;
    this.ctx.fillRect(this.debugW * this.beatCutOff, 0, 2, this.panelSmallH);

    this.ctx.fillStyle = this.colorWhite;
    if (this.beatDetectAvailable() == false && Date.now() < this.beatLastTime + 200) {  // flash green for a moment after beat detection
      this.ctx.fillStyle = this.colorYellow;
    }
    this.ctx.fillRect(0, 0, this.debugW * this.avgAmp, this.panelSmallH);

    /////////////////////////////////////
    // end
    /////////////////////////////////////
    // pop
    this.ctx.restore();
  }

  drawDebugText(str, x, y, fill, outline) {
    this.ctx.strokeStyle = this.clearColor;
    this.ctx.fillStyle = fill;
    this.ctx.fillText(str, x, y);
  }

}

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// Static constants
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

SoundFFT.FREQUENCIES = 'SoundFFT.FREQUENCIES';
SoundFFT.WAVEFORM = 'SoundFFT.WAVEFORM';
SoundFFT.BEAT = 'SoundFFT.BEAT';

export default SoundFFT;
