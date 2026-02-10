import DemoBase from "./demo--base.js";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

class WebcamDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Multi-Camera Recorder",
      "webcam-container",
      "Record from multiple cameras simultaneously with shared audio.",
    );
  }

  init() {
    this.recorders = [];
    this.isRecording = false;

    // --- Control Panel ---
    this.controlPanel = document.createElement("div");
    this.controlPanel.style.padding = "20px";
    this.controlPanel.style.borderBottom = "1px solid #ccc";
    this.controlPanel.style.marginBottom = "20px";
    this.el.appendChild(this.controlPanel);

    // Audio Select
    this.audioSelect = document.createElement("select");
    this.controlPanel.appendChild(this.audioSelect);

    // Audio Processing
    this.audioProcessingCheck = document.createElement("input");
    this.audioProcessingCheck.type = "checkbox";
    this.audioProcessingCheck.id = "audioProcessingCheck";
    this.audioProcessingCheck.checked = true;

    const label = document.createElement("label");
    label.htmlFor = "audioProcessingCheck";
    label.innerText = "Audio Processing";
    label.style.marginLeft = "5px";
    label.style.marginRight = "20px";

    this.controlPanel.appendChild(this.audioProcessingCheck);
    this.controlPanel.appendChild(label);

    // Populate Audio Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const savedAudioId = localStorage.getItem("haxademic-demo-webcam-audioId");
      devices.forEach((device) => {
        if (device.kind === "audioinput") {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text = device.label || `Microphone ${this.audioSelect.length + 1}`;
          this.audioSelect.appendChild(option);
          if (savedAudioId === device.deviceId) this.audioSelect.value = savedAudioId;
        }
      });
    });

    // Add Camera Button
    this.addCameraButton = document.createElement("button");
    this.addCameraButton.innerText = "+ Add Camera";
    this.addCameraButton.addEventListener("click", () => this.addRecorder());
    this.controlPanel.appendChild(this.addCameraButton);

    // Start/Stop All Buttons
    this.startAllButton = document.createElement("button");
    this.startAllButton.innerText = "Start Recording All";
    this.startAllButton.style.marginLeft = "20px";
    this.startAllButton.addEventListener("click", () => this.startAllRecording());
    this.controlPanel.appendChild(this.startAllButton);

    this.stopAllButton = document.createElement("button");
    this.stopAllButton.innerText = "Stop All";
    this.stopAllButton.disabled = true;
    this.stopAllButton.addEventListener("click", () => this.stopAllRecording());
    this.controlPanel.appendChild(this.stopAllButton);

    // FFmpeg Status
    this.statusLabel = document.createElement("div");
    this.statusLabel.style.display = "inline-block";
    this.statusLabel.style.marginLeft = "20px";
    this.statusLabel.style.fontFamily = "monospace";
    this.controlPanel.appendChild(this.statusLabel);

    // Recorders Container
    this.recordersContainer = document.createElement("div");
    this.recordersContainer.style.display = "flex";
    this.recordersContainer.style.flexWrap = "wrap";
    this.recordersContainer.style.gap = "20px";
    this.el.appendChild(this.recordersContainer);

    // Init FFmpeg
    this.ffmpeg = new FFmpeg();
    this.loadFFmpeg();

    // Add initial recorder
    this.addRecorder();
  }

  async loadFFmpeg() {
    this.statusLabel.innerText = "Loading FFmpeg...";
    try {
      await this.ffmpeg.load();
      this.statusLabel.innerText = "FFmpeg Ready";
    } catch (e) {
      console.error(e);
      this.statusLabel.innerText = "FFmpeg load failed";
    }
  }

  addRecorder() {
    const recorder = new RecorderInstance(this.recordersContainer, this.ffmpeg, this.recorders.length);
    this.recorders.push(recorder);
  }

  async startAllRecording() {
    if (this.isRecording) return;

    // UI Updates
    this.isRecording = true;
    this.startAllButton.disabled = true;
    this.addCameraButton.disabled = true;
    this.audioSelect.disabled = true;
    this.stopAllButton.disabled = false;

    // Save Audio Pref
    localStorage.setItem("haxademic-demo-webcam-audioId", this.audioSelect.value);

    // Get Shared Audio Stream
    let audioStream = null;
    try {
      const audioConstraints = {
        deviceId: this.audioSelect.value ? { exact: this.audioSelect.value } : undefined,
        echoCancellation: this.audioProcessingCheck.checked,
        noiseSuppression: this.audioProcessingCheck.checked,
        autoGainControl: this.audioProcessingCheck.checked,
      };

      console.log("Requesting Audio:", audioConstraints);
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
    } catch (err) {
      console.error("Error getting audio stream:", err);
      alert("Could not access microphone! Recording will proceed without audio.");
    }

    // Start all recorders
    const promises = this.recorders.map((recorder) => recorder.start(audioStream));
    await Promise.all(promises);
  }

  stopAllRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;

    // UI Updates
    this.stopAllButton.disabled = true;
    this.startAllButton.disabled = false;
    this.addCameraButton.disabled = false;
    this.audioSelect.disabled = false;

    // Stop all recorders
    this.recorders.forEach((recorder) => recorder.stop());
  }
}

class RecorderInstance {
  constructor(container, ffmpeg, index) {
    this.container = container;
    this.ffmpeg = ffmpeg;
    this.index = index;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;

    this.el = document.createElement("div");
    this.el.style.border = "1px solid #666";
    this.el.style.padding = "10px";
    this.el.style.width = "480px";
    this.el.style.background = "#222";
    this.container.appendChild(this.el);

    this.initUI();
  }

  initUI() {
    // Header
    const header = document.createElement("div");
    header.style.marginBottom = "10px";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    this.el.appendChild(header);

    // Video Select
    this.videoSelect = document.createElement("select");
    this.videoSelect.style.maxWidth = "300px";
    header.appendChild(this.videoSelect);

    // Remove Button
    const removeBtn = document.createElement("button");
    removeBtn.innerText = "❌";
    removeBtn.onclick = () => this.dispose();
    header.appendChild(removeBtn);

    // Populate Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      let count = 0;
      devices.forEach((device) => {
        if (device.kind === "videoinput") {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text = device.label || `Camera ${count++}`;
          this.videoSelect.appendChild(option);
        }
      });

      // Try to restore previous selection for this index?
      // Or just let user pick. For simplicity, default to first or let user pick.
      // If we want to be fancy, we could save "cam-0", "cam-1" prefs.
      const savedId = localStorage.getItem(`haxademic-demo-webcam-id-${this.index}`);
      if (savedId) this.videoSelect.value = savedId;
    });

    // Preview Video
    this.videoEl = document.createElement("video");
    this.videoEl.setAttribute("autoplay", true);
    this.videoEl.setAttribute("playsinline", true);
    this.videoEl.muted = true; // Always mute preview to avoid feedback
    this.videoEl.style.width = "100%";
    this.videoEl.style.backgroundColor = "#000";
    this.el.appendChild(this.videoEl);

    // Status
    this.status = document.createElement("div");
    this.status.innerText = "Ready";
    this.status.style.marginTop = "5px";
    this.status.style.fontSize = "12px";
    this.el.appendChild(this.status);

    // Activate Preview immediately (Video Only)
    this.videoSelect.addEventListener("change", () => this.startPreview());
    // Give it a moment to populate then start preview
    setTimeout(() => this.startPreview(), 500);
  }

  async startPreview() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: {
          deviceId: this.videoSelect.value ? { exact: this.videoSelect.value } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoEl.srcObject = this.stream;
      localStorage.setItem(`haxademic-demo-webcam-id-${this.index}`, this.videoSelect.value);
    } catch (e) {
      this.status.innerText = "Preview Error: " + e.message;
    }
  }

  async start(audioStream) {
    this.status.innerText = "Starting...";
    this.recordedChunks = [];
    this.videoSelect.disabled = true;

    // Ensure we have a stream (refresh if needed, but usually preview stream is fine to use)
    // Actually, we want to attach the shared audio track to the video stream for recording purposes
    if (!this.stream || !this.stream.active) {
      await this.startPreview();
    }

    if (!this.stream) {
      this.status.innerText = "No video stream!";
      return;
    }

    // Combine tracks: My Video + Shared Audio
    const tracks = [...this.stream.getVideoTracks()];
    if (audioStream) {
      tracks.push(...audioStream.getAudioTracks());
    }
    const combinedStream = new MediaStream(tracks);

    // Setup MediaRecorder
    const mimeTypes = [
      "video/x-matroska;codecs=h264,opus",
      "video/x-matroska;codecs=vp8,opus",
      "video/x-matroska;codecs=vp9,opus",
      "video/x-matroska",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
    ];
    let mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));

    this.status.innerText = "Recording... (" + mimeType + ")";

    try {
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 50000000,
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => this.onStop(mimeType);

      this.mediaRecorder.start(100);
    } catch (e) {
      this.status.innerText = "Recorder Error: " + e.message;
      console.error(e);
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.status.innerText = "Stopping...";
    }
    this.videoSelect.disabled = false;
  }

  async onStop(mimeType) {
    const type = this.mediaRecorder?.mimeType || mimeType || "video/webm";
    const blob = new Blob(this.recordedChunks, { type });

    try {
      await this.convertAndDownload(blob, type);
    } catch (e) {
      console.error("Conversion failed", e);
      this.status.innerText = "Conversion failed. Downloading raw.";
      const ext = type.includes("matroska") ? "mkv" : "webm";
      this.downloadBlob(blob, ext);
    }
  }

  async convertAndDownload(blob, mimeType) {
    if (!this.ffmpeg.loaded) {
      this.status.innerText = "Waiting for FFmpeg...";
      // Simple wait/retry logic could go here, but for now assume loaded
    }

    const ext = mimeType.includes("matroska") ? "mkv" : "webm";
    const inputName = `input_${this.index}_${Date.now()}.${ext}`;
    const outputName = `output_${this.index}_${Date.now()}.mp4`;

    this.status.innerText = "Writing mem file...";
    await this.ffmpeg.writeFile(inputName, await fetchFile(blob));

    this.status.innerText = "Encoding MP4...";

    // Using a queue could be safer for shared ffmpeg instance,
    // but ffmpeg.wasm typically blocks exec(), so sequentially awaiting is key.
    // However, JS is single threaded so 'await' blocks this function context.
    // If multiple recorders call this, we need a mutex or they might interfere
    // if ffmpeg was stateful in a way that forbid parallel ops (it is).
    // Mutex is safest for shared ffmpeg instance usage.

    await this.safeFFmpegExec(inputName, outputName);

    this.status.innerText = "Reading file...";
    const data = await this.ffmpeg.readFile(outputName);

    const mp4Blob = new Blob([data.buffer], { type: "video/mp4" });
    this.downloadBlob(mp4Blob, "mp4");

    // cleanup
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    this.status.innerText = "Done! Saved.";
  }

  // Mutex-like lock for FFmpeg
  static ffmpegLock = Promise.resolve();

  async safeFFmpegExec(input, output) {
    // Chain onto the lock
    const currentLock = RecorderInstance.ffmpegLock;
    let releaseLock;

    const newLock = new Promise((resolve) => (releaseLock = resolve));
    RecorderInstance.ffmpegLock = newLock; // Updated global lock

    await currentLock; // Wait for previous job

    try {
      await this.ffmpeg.exec(["-i", input, "-c:v", "libx264", "-crf", "18", "-preset", "ultrafast", output]);
    } finally {
      releaseLock(); // Signal next job
    }
  }

  downloadBlob(blob, ext) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `cam_${this.index}_recording.${ext}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  dispose() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    this.el.remove();
  }
}

if (window.autoInitDemo) window.demo = new WebcamDemo(document.body);
