var kMinDelay = 0.001, playback_speed = 1.0;
var term = {}, logdata = "", metadata = [];
var next_delay = 0, next_write = 0, data_ofs = 0, timeout = 0;
var running = false;
var total_time = 0.0;

// ---

function timestr(raw) {
  "use strict";

  var min = parseInt(raw / 60, 10);
  var sec = raw - (min * 60);

  var res = "";
  if (min < 10) {
    res = "0";
  }

  res += min + ":";

  if (sec < 10) {
    res += "0";
  }

  res += sec;
  return res;
}

function writeChars() {
  "use strict";

  var num_bytes = 0;

  if (next_delay < next_write) {
    term.reset();
    data_ofs = 0;
    next_write = 0;
  }

  $("#pos").html(next_delay + " / " + metadata.length);

  if (next_delay > next_write) {
    for (var pos = next_write; pos < next_delay; ++pos) {
      var m = metadata[pos];
      num_bytes += m.count;

      var cur_time = parseInt(m.cum_time, 10);
      var total_int = parseInt(total_time, 10);
      $("#time").html(timestr(cur_time) + " / " + timestr(total_int));
    }
  }

  term.write(logdata.substr(data_ofs, num_bytes));
  data_ofs += num_bytes;
  next_write = next_delay;

  if (running === true) {
    nextChunk();
  }
}

function nextChunk() {
  "use strict";

  if (next_delay == metadata.length) {
    $("#pause").attr("disabled", true);
    $("#play").attr("disabled", false);
    $("#status").html("Playback complete.");
    running = false;
    return;
  }

  var m = metadata[next_delay++];

  if (m.delay > kMinDelay) {
    timeout = window.setTimeout(writeChars, m.delay * 1000.0 / playback_speed);
  } else {
    writeChars();
  }
}

// ---

function receivedLog(data, status, xhr) {
  "use strict";

  if (!data.logdata) {
    console.log("Response is missing 'logdata'", data);
    return;
  }

  if (!data.timingdata) {
    console.log("Response is missing 'timingdata'", data);
    return;
  }

  if (data.title) {
    $("title").html(data.title);
    $("#title").html(data.title);
  }

  logdata = data.logdata;
  data_ofs = 0;
  total_time = 0;

  $.each(data.timingdata.split('\n'), function(i, line) {
    var d = line.split(' ');
    var o = {};

    o.delay = parseFloat(d[0], 10);
    o.count = parseInt(d[1], 10);

    if (!isNaN(o.delay) && !isNaN(o.count)) {
      metadata.push(o);
      total_time += o.delay;
      o.cum_time = total_time;
    }
  });

  next_write = 0;
  next_delay = 0;

  playClicked();
}

function getLogError(data, status, xhr) {
  "use strict";

  console.log("Log retrieval failed", data, status, xhr);
  logdata = data;

  $("#status").html("Log retrieval failed.");
}

function getLog(target) {
  "use strict";

  $("#status").html("Retrieving log");

  $.ajax({
    type: "GET",
    url: "../.data/" + target,
    dataType: "json",
    async: true,
    success: receivedLog,
    error: getLogError
  });
}

function keyboardInput(ch) {
  "use strict";

  return false;
}

function startTerm(target) {
  "use strict";

  $("#status").html("Initializing terminal.");

  term = new Terminal(160, 48, keyboardInput);
  term.open();

  getLog(target);
}

// ---

function restartClicked() {
  "use strict";

  clearTimeout(timeout);

  $("#pos").html("");

  next_delay = 0;
  running = true;

  $("#pause").attr("disabled", false);
  $("#play").attr("disabled", true);
  $("#status").html("Playback running.");

  writeChars();
}

function stepbackClicked() {
  "use strict";

  clearTimeout(timeout);

  if (running === false) {
    $("#play").attr("disabled", false);
  }

  if (next_delay > 0) {
    next_delay -= 1;
  } else {
    next_delay = 0;
  }

  writeChars();
}

function backClicked() {
  "use strict";

  clearTimeout(timeout);

  if (running === false) {
    $("#play").attr("disabled", false);
  }

  if (next_delay > 10) {
    next_delay -= 10;
  } else {
    next_delay = 0;
  }

  writeChars();
}

function pauseClicked() {
  "use strict";

  if (running === false) {
    return;
  }

  $("#pause").attr("disabled", true);
  $("#play").attr("disabled", false);

  clearTimeout(timeout);
  running = false;
  $("#status").html("Paused.");
}

function playClicked() {
  "use strict";

  if (running === true) {
    return;
  }

  $("#pause").attr("disabled", false);
  $("#play").attr("disabled", true);

  running = true;
  $("#status").html("Playback running.");

  writeChars();
}

function stepforwardClicked() {
  "use strict";

  clearTimeout(timeout);

  if (next_delay + 1 > metadata.length) {
    return;
  }

  if (running === false) {
    $("#play").attr("disabled", false);
  }

  next_delay += 1;
  writeChars();
}

function forwardClicked() {
  "use strict";

  clearTimeout(timeout);

  if (next_delay + 10 > metadata.length) {
    return;
  }

  if (running === false) {
    $("#play").attr("disabled", false);
  }

  next_delay += 10;
  writeChars();
}

function setSpeed(speed) {
  "use strict";

  playback_speed = speed;
}

function handleKey(event) {
  "use strict";

  if (!event.keyCode) {
    return;
  }

  switch (event.keyCode) {
    case 32:
      if (running) {
        pauseClicked();
      } else {
        playClicked();
      }
      break;

    case 37:
      stepbackClicked();
      break;

    case 38:
      backClicked();
      break;

    case 39:
      stepforwardClicked();
      break;

    case 40:
      forwardClicked();
      break;
  }
}

// ---

$(document).ready(function() {
  "use strict";

  if (window.location.search) {
    var target = window.location.search.substring(1);
    startTerm(target);
  } else {
    $("#status").html("Error: no target specified.");
  }

  $(document).keyup(handleKey);

  $("#restart").on("click", restartClicked);
  $("#stepback").on("click", stepbackClicked);
  $("#back").on("click", backClicked);
  $("#pause").on("click", pauseClicked);
  $("#play").on("click", playClicked);
  $("#stepforward").on("click", stepforwardClicked);
  $("#forward").on("click", forwardClicked);

  $(".speed").attr("disabled", false);
  $("#speed_100").attr("disabled", true);

  $(".speed").on("click", function(e) {
    var b = $(this);
    var new_speed = b.data("speed");
    setSpeed(new_speed);
    $(".speed").attr("disabled", false);
    b.attr("disabled", true);
  });
});
