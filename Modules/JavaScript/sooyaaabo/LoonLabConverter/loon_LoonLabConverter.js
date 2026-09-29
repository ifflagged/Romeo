/**
 * Loon 插件导入转换脚本
 *
 * 参数说明：
 *   target = Loon | Surge | Egern | Shadowrocket
 *
**/

// 读取外部参数
let target = $argument?.target;

// 显示值 → 内部值 映射
const targetMap = {
  Loon: "loon",
  Surge: "surge",
  Egern: "egern",
  Shadowrocket: "shadowrocket"
};

target = targetMap[target];

let body = $response.body;

if (!body) {
  return $done({});
}

// loon：完全不处理
if (!target || target === "loon") {
  return $done({ body });
}

/* Hub target 映射 */
const hubTargetMap = {
  surge: "surge-module",
  egern: "surge-module",
  shadowrocket: "shadowrocket-module"
};

const hubTarget = hubTargetMap[target];

/* 插件链接 → Hub 转换链接 */
body = body.replace(
  /(https:\/\/loon\.103516\.xyz\/Plugin\/(.+?)\.lpx)/g,
  `http://script.hub/file/_start_/$1/_end_/$2.sgmodule%3Ftype%3Dloon-plugin%26target%3D${hubTarget}%26del%3Dtrue%26jqEnabled%3Dtrue%26pm%3D.%26sni%3D.`
);

/* 客户端导入 scheme 映射 */
const schemeMap = {
  surge: "surge:///install-module?url=",
  egern: "egern:/modules/new?url=",
  shadowrocket: "shadowrocket://install?module="
};

const scheme = schemeMap[target];

if (scheme) {
  body = body.replace(
    /(loon:\/\/import\?plugin=|loon:\/\/import%3Fplugin=)/gi,
    scheme
  );
}

$done({ body });