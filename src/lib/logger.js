(function () {
  "use strict";

  function serializeDetails(details) {
    if (!details) {
      return null;
    }

    try {
      return JSON.parse(
        JSON.stringify(details, (_key, value) => {
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack
            };
          }
          return value;
        })
      );
    } catch (_error) {
      return {
        note: "details_not_serializable"
      };
    }
  }

  function send(entry) {
    if (!globalThis.chrome?.runtime?.id) {
      return;
    }

    try {
      chrome.runtime.sendMessage({
        type: "DIROB_LOG_EVENT",
        payload: entry
      }).catch(() => {});
    } catch (_error) {
      // Ignore logging failures.
    }
  }

  function log(level, scope, message, details) {
    send({
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      details: serializeDetails(details),
      href: typeof location !== "undefined" ? location.href : null
    });
  }

  globalThis.DirobLogger = {
    debug(scope, message, details) {
      log("debug", scope, message, details);
    },
    info(scope, message, details) {
      log("info", scope, message, details);
    },
    warn(scope, message, details) {
      log("warn", scope, message, details);
    },
    error(scope, message, details) {
      log("error", scope, message, details);
    }
  };
})();
