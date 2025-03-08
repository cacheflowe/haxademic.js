class DashboardCheckinPoller {
  constructor(dashboardURL, appId, appTitle, interval) {
    this.dashboardURL = dashboardURL;
    this.appId = appId;
    this.appTitle = appTitle;
    this.startTime = Date.now();
    this.restartInterval(interval);
    this.loadJson(); // check in on init
  }

  restartInterval(interval) {
    let checkinInterval = interval;
    if (checkinInterval > 1) {
      window.clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.loadJson();
      }, checkinInterval);
    }
  }

  loadJson() {
    fetch(this.dashboardURL, {
      method: "POST",
      referrerPolicy: "unsafe-url",
      crossorigin: true,
      // mode: "no-cors", // remove this if sending to Node backend
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appId: this.appId,
        appTitle: this.appTitle,
        uptime: Math.round((Date.now() - this.startTime) / 1000),
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        frameCount: 1,
        frameRate: 60,
        imageScreenshot:
          "/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABVAAD/4QMdaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA5LjEtYzAwMiA3OS5hMWNkMTJmNDEsIDIwMjQvMTEvMDgtMTY6MDk6MjAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjIzRTY4QTVFRkJDRjExRUZCM0M1QTQ5NzdFMkFCMkZGIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjIzRTY4QTVERkJDRjExRUZCM0M1QTQ5NzdFMkFCMkZGIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMDI1IFdpbmRvd3MiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0iNjlBNkFFREJCOTczNjYwRjcyRjlBOEFDRkNGQkJEQ0MiIHN0UmVmOmRvY3VtZW50SUQ9IjY5QTZBRURCQjk3MzY2MEY3MkY5QThBQ0ZDRkJCRENDIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+4ADkFkb2JlAGTAAAAAAf/bAIQAAgEBAQEBAgEBAgMCAQIDAwICAgIDAwMDAwMDAwUDBAQEBAMFBQUGBgYFBQcHCAgHBwoKCgoKDAwMDAwMDAwMDAECAgIEAwQHBQUHCggHCAoMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM/8AAEQgAIAAgAwERAAIRAQMRAf/EAHEAAAIDAAAAAAAAAAAAAAAAAAgJBQYHAQEBAQEAAAAAAAAAAAAAAAABAgADEAABAwMCBQMDBQEAAAAAAAACAQMEBQYHEQgAIRITCTFBIjIUJFFhQiMVFhEBAQEBAQADAAAAAAAAAAAAAAERAjEhURL/2gAMAwEAAhEDEQA/AHN5tzZcpXNIxPiiSMGswQZduW5Dabkf5aSQ7rESKy7q25MdD5/PUGm9CJCUgEmTWY9UcF4duGSdQvm3492Vh4eiTUL0U69Kf0TRCIqirjYqicv6gBE9kTisAVd5m3tnafVqPuE2q1GoWHCmylpNSgWvNfgswZhtq6y+w2Cq0TTwiQE08BiipyTRdOCzCIfxo+VebuAySG0jcqsaJuFep0ivWhXogDFh3bToBA3PAWEXpZqEPrA3mQXpNokdbRBQxbLGSu2a537/AMB25lSeYu1u9QlXrU3Q5dUysTHJJIQ+gk0122NPZG0T24qeBfjeiFAbjgx01AXDN2V1kvcbVNBDt/SnSvPVOa8LBa8pWQKRTsZ29iMHBO56xUAuB6Oip1swKeBttuknsjj59I6+vSq+nE9MWLuuz5cO2C8cNZ/sV9WcgWXesa6oCNkok7DgsIlSjlpzJuRFM2CH0JD04ZBaNbDG6DMex+4bg27XTTWa9a9s1abRZFHmOuMPwpEQ0aR+JJBC5SY6NPqBCoL1oSaa8TuKXy7vKvcMmmHHxzZLECsGiiM2vzVmgyun1DHjA2J6foZacP6AVco5RqFZmVjMWZq91yD/ACq1cFWcEGwEB6QFNNBERT4ttNp+wpxpGAjcdTvXyPb0LGwhjGM+MS6KzT7HtWGYL3WafKlo5UKjIEdegkji7JNV+gARPbi/PlN+j/vLp4tsw7ip5bptj9Qp8DdJFiswa/aVy/Gg3pAhov27bryaLEqLAKQR5SKgkK9t34IJN85Vkk543cb1duVwvY9z1hd3Hd+sqTZf9RErAMEqckOO8X4b4l6irT5Cqe/Fyai3GLU6Fva8gN+xbQx/bdxZIubuJ9jRrVpTx0qERLopqrIjCjoKcycfdTRP5cNkno23w9zwL+Bub495T267de7Dqu8erQ3KZSqVTXElU6zqbK0KQwxIVEF+c+iIL74ogoKdttVBSJyOutVzzj//2Q==",
        imageExtra: null,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((jsonData) => {
        if (this.callback) this.callback(jsonData);
      })
      .catch((error) => {
        console.warn("Checkin failed:", JSON.stringify(error));
      });
  }

  successCallback(callback) {
    this.callback = callback;
  }
}

export default DashboardCheckinPoller;
