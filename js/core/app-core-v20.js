/**
 * GP App Core — V20
 * Point d'entrée léger pour initialiser les helpers globaux.
 */
(function () {
  window.GPApp = window.GPApp || {};

  window.GPApp.version = 'v20-frontend-architecture';

  window.GPApp.ready = function (callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  };

  window.GPApp.ready(function () {
    if (window.GPDateUtils) {
      window.GPDateUtils.normalizeAllDateInputs(document);
    }
  });
})();
