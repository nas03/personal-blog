const colorCodes: { [key: string]: string } = Object.freeze({
  GET: "\x1b[32m", // Green
  POST: "\x1b[33m", // Yellow
  DELETE: "\x1b[31m", // Red
  PUT: "\x1b[36m", // Cyan
  RESET: "\x1b[0m", // Reset
});
export function printRoute(path: any, layer: any) {
  if (layer.route) {
    layer.route.stack.forEach(printRoute.bind(null, path.concat(split(layer.route.path))));
  } else if (layer.name === "router" && layer.handle.stack) {
    layer.handle.stack.forEach(printRoute.bind(null, path.concat(split(layer.regexp))));
  } else if (layer.method) {
    const method: string = layer.method.toUpperCase();
    const color = colorCodes[`${method}`] || colorCodes.RESET;
    console.log(`${color}${method} - ${path.concat(split(layer.regexp)).filter(Boolean).join("/")}${colorCodes.RESET}`);
  }
}

function split(thing: any) {
  if (typeof thing === "string") {
    return thing.split("/");
  } else if (thing.fast_slash) {
    return "";
  } else {
    var match = thing
      .toString()
      .replace("\\/?", "")
      .replace("(?=\\/|$)", "$")
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
    return match ? match[1].replace(/\\(.)/g, "$1").split("/") : "<complex:" + thing.toString() + ">";
  }
}
