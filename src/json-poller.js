class JsonPoller {

  constructor(url, callback, errorCallback, interval=0, requestData={}) {
    this.url = url;
    this.callback = callback;
    this.errorCallback = errorCallback;
    this.interval = interval;
    this.requestData = requestData;
    this.requestCount = 0;
    this.fetchData();
  }

  setRequestData(requestData) {
    this.requestData = requestData;
  }

  fetchData() {
    this.requestCount++;
    //  + "&rand="+Math.round(Math.random() * 999999)
    fetch(this.url, this.requestData)
      .then((response) => {
        return response.json();
      }).then((jsonData) => {
        requestAnimationFrame(() => {  // detach from fetch Promise to prevent Error-throwing
          this.callback(jsonData);
          setTimeout(() => this.fetchData(), this.interval);
        });
      }).catch((error) => {
        this.errorCallback(error);
        setTimeout(() => this.fetchData(), this.interval);
      });
  }

}

export default JsonPoller;
