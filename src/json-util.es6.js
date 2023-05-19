class JsonUtil {
  static validJSON(json) {
    if (!json) return false;
    try {
      JSON.parse(json);
    } catch (e) {
      return false;
    }
    return true;
  }
}

export default JsonUtil;
