class ErrorUtil {

  static initErrorCatching() {
    if(ErrorUtil.INITIALIZED) return;
    window.addEventListener('error', function(error) {
      // get info from error object
      var fileComponents = error.filename.split('/');
      var file = fileComponents[fileComponents.length-1];
      var line = error.lineno;
      var message = error.message;
      var stack = error.error.stack.replace('\n', '<br>');
      // write to error panel
      ErrorUtil.showError(`Message: <b>${message}</b><br>File: ${file}<br>Line: ${line}<br>Stack: ${stack}<br>Error message: ${JSON.stringify(error)}<br>`);
    });
    ErrorUtil.INITIALIZED = true;
  }

  static showError(message) {
    // lazy-init error element
    var errorContainer = document.querySelector('#inline-error');
    if(!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.setAttribute("id", "inline-error");
      errorContainer.setAttribute("style", "box-sizing: border-box; position: fixed; top: 20px; left: 20px; width: calc(100% - 40px); max-height: calc(100% - 40px); background: rgba(0, 0, 0, 0.7); color: #fff; z-index: 99; font-size: 10px; padding: 20px 20px 0; overflow: auto;");
      document.body.appendChild(errorContainer);

      // click to kill the error alert
      errorContainer.addEventListener('click', function(e) {
        document.body.removeChild(errorContainer);
      });
    }

    // add individual error
    let errorMsgEl = document.createElement('p');
    errorMsgEl.setAttribute("style", "border: 2px solid #ff0000; padding: 20px;");
    errorMsgEl.innerHTML = message;
    errorContainer.appendChild(errorMsgEl);

    // set timeout to delete from dom
    clearTimeout(ErrorUtil.TIMEOUT);
    ErrorUtil.TIMEOUT = setTimeout(function() {
      var errorElDelete = document.querySelector('#inline-error');
      if(errorElDelete) errorElDelete.parentNode.removeChild(errorElDelete);
    }, ErrorUtil.TIMEOUT_DURATION);
  }

}

ErrorUtil.INITIALIZED = false;
ErrorUtil.TIMEOUT = null;
ErrorUtil.TIMEOUT_DURATION = 60000;
