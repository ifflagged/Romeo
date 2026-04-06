/**
 * @name iios.fun 自动签到
 * @description 支持 Argument 传入邮箱、密码、client_id，兼容 Loon / Quantumult X
 * @platform Loon, Quantumult X
 * @author sooyaaabo
 * @reference https://raw.githubusercontent.com/ZenmoFeiShi/Qx/refs/heads/main/iios_checkin.js
 */

const API_BASE = 'https://iios-api.suil.dpdns.org';
const API_SECRET = '5SAi3saB9A7pDRIoKdrmB1HYnQq7exe2';
const START_URL = API_BASE + '/iios/checkin_login_async';
const RESULT_URL = API_BASE + '/iios/checkin_result';

const EMAIL_KEY = 'iios_login_email';
const PASSWORD_KEY = 'iios_login_password';
const CLIENT_ID_KEY = 'iios_client_id';

const POLL_INTERVAL = 3000;
const MAX_POLLS = 15;
const SCRIPT_TIMEOUT = 60000;

let finished = false;
let currentEmail = '';
let finalResult = null;
let scriptTimeoutTimer = null;

function log(msg) {
  console.log('[iios.fun] ' + msg);
}

function read(key) {
  try {
    if (typeof $persistentStore !== 'undefined' && $persistentStore.read) {
      return $persistentStore.read(key) || '';
    }
    if (typeof $prefs !== 'undefined' && $prefs.valueForKey) {
      return $prefs.valueForKey(key) || '';
    }
  } catch (e) {}
  return '';
}

function write(key, value) {
  try {
    const val = String(value || '');
    if (typeof $persistentStore !== 'undefined' && $persistentStore.write) {
      return $persistentStore.write(val, key);
    }
    if (typeof $prefs !== 'undefined' && $prefs.setValueForKey) {
      return $prefs.setValueForKey(val, key);
    }
  } catch (e) {}
  return false;
}

function notify(title, subTitle, message) {
  const t = String(title || '');
  const s = String(subTitle || '');
  const m = String(message || '');

  try {
    if (typeof $notification !== 'undefined' && $notification.post) {
      return $notification.post(t, s, m);
    }
    if (typeof $notify !== 'undefined') {
      return $notify(t, s, m);
    }
  } catch (e) {}
}

function done(value) {
  if (typeof $done !== 'undefined') {
    $done(value);
  }
}

function request(options) {
  if (typeof $task !== 'undefined' && $task.fetch) {
    return $task.fetch(options).then(resp => ({
      status: resp.statusCode || resp.status,
      headers: resp.headers || {},
      body: resp.body || ''
    }));
  }

  return new Promise((resolve, reject) => {
    const method = String(options.method || 'GET').toUpperCase();
    const req = {
      url: options.url,
      headers: options.headers || {},
      body: options.body || ''
    };

    const callback = (error, response, data) => {
      if (error) return reject(error);
      resolve({
        status: response.status || response.statusCode,
        headers: response.headers || {},
        body: data || ''
      });
    };

    if (typeof $httpClient === 'undefined') {
      return reject(new Error('No supported HTTP client found'));
    }

    if (method === 'POST') {
      $httpClient.post(req, callback);
    } else {
      $httpClient.get(req, callback);
    }
  });
}

function parseBody(body) {
  try {
    return JSON.parse(body || '{}');
  } catch (e) {
    return {};
  }
}

function authHeaders() {
  return {
    Authorization: `Bearer ${API_SECRET}`,
    'Content-Type': 'application/json'
  };
}

function parseArgument() {
  let rawEmail = '';
  let rawPassword = '';
  let rawClientId = '';

  if (typeof $argument !== 'undefined' && $argument) {
    if (typeof $argument === 'object') {
      rawEmail = String($argument.iios_email || '').trim();
      rawPassword = String($argument.iios_password || '');
      rawClientId = String($argument.iios_client_id || '').trim();
    } else if (typeof $argument === 'string') {
      const str = String($argument).trim();
      if (str) {
        str.split('&').forEach(pair => {
          const idx = pair.indexOf('=');
          if (idx === -1) return;
          const key = decodeURIComponent(pair.slice(0, idx)).trim();
          const val = decodeURIComponent(pair.slice(idx + 1)).trim();
          if (key === 'iios_email') rawEmail = val;
          if (key === 'iios_password') rawPassword = val;
          if (key === 'iios_client_id') rawClientId = val;
        });
      }
    }
  }

  return {
    email: rawEmail,
    password: rawPassword,
    clientId: rawClientId
  };
}

function saveArgumentToStore() {
  const args = parseArgument();

  if (args.email !== '') write(EMAIL_KEY, args.email);
  if (args.password !== '') write(PASSWORD_KEY, args.password);
  if (args.clientId !== '') write(CLIENT_ID_KEY, args.clientId);

  return args;
}

function buildMessage(message) {
  return `账号：${currentEmail}\n${message}`;
}

function finish(title, subTitle, message) {
  if (finished) return;
  finished = true;
  finalResult = {
    title: String(title || 'iios.fun'),
    subTitle: String(subTitle || ''),
    message: String(message || '')
  };
}

function cleanup() {
  if (scriptTimeoutTimer) {
    clearTimeout(scriptTimeoutTimer);
    scriptTimeoutTimer = null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function handleFinal(obj) {
  if (finished) return true;

  if (!obj) {
    finish('iios.fun', '签到失败', buildMessage('empty response'));
    return true;
  }

  if (obj.status === 'pending') return false;

  if (obj.status === 'error' || obj.ok === false) {
    finish('iios.fun', '签到失败', buildMessage(obj.message || JSON.stringify(obj)));
    return true;
  }

  const data = obj.data || {};
  const status = data.status || obj.status || '';
  const result = data.result || {};

  if (status === 'already_done') {
    finish('iios.fun', '今日已签到', buildMessage(result.message || '今日已完成'));
    return true;
  }

  if (status === 'checked_in') {
    const msg = [];
    if (typeof result.message !== 'undefined') msg.push(result.message);
    if (typeof result.points !== 'undefined') msg.push('积分：' + result.points);
    finish('iios.fun', '签到成功', buildMessage(msg.join('，') || '签到成功'));
    return true;
  }

  if (obj.status === 'done' && obj.data) {
    const r = obj.data.result || {};
    if (obj.data.status === 'already_done') {
      finish('iios.fun', '今日已签到', buildMessage(r.message || '今日已完成'));
      return true;
    }
    if (obj.data.status === 'checked_in') {
      finish('iios.fun', '签到成功', buildMessage(r.message || '签到成功'));
      return true;
    }
  }

  finish('iios.fun', '签到完成', buildMessage(JSON.stringify(obj)));
  return true;
}

async function poll(jobId) {
  for (let count = 1; count <= MAX_POLLS; count++) {
    if (finished) return;

    let resp;
    try {
      resp = await request({
        url: RESULT_URL + '?id=' + encodeURIComponent(jobId),
        method: 'GET',
        headers: { Authorization: `Bearer ${API_SECRET}` }
      });
    } catch (err) {
      finish(
        'iios.fun',
        '查询失败',
        buildMessage(
          err && (err.error || err.message)
            ? (err.error || err.message)
            : JSON.stringify(err)
        )
      );
      return;
    }

    if (finished) return;

    const obj = parseBody(resp.body);
    const ended = handleFinal(obj);
    if (ended) return;

    if (count < MAX_POLLS) {
      await sleep(POLL_INTERVAL);
    }
  }

  if (!finished) {
    finish('iios.fun', '签到处理中', buildMessage('服务仍在执行，请稍后手动重试'));
  }
}

async function startCheckinByLogin(email, password, clientId) {
  if (finished) return;

  log(`开始 | 账号: ${email} | client_id: ${clientId}`);

  let resp;
  try {
    resp = await request({
      url: START_URL,
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        username: email,
        password,
        client_id: clientId,
        type: 2,
        webapp: true
      })
    });
  } catch (err) {
    finish(
      'iios.fun',
      '请求失败',
      buildMessage(
        err && (err.error || err.message)
          ? (err.error || err.message)
          : JSON.stringify(err)
      )
    );
    return;
  }

  if (finished) return;

  const obj = parseBody(resp.body);

  if (!obj || !obj.ok || !obj.jobId) {
    finish('iios.fun', '启动失败', buildMessage(obj.message || resp.body || 'start failed'));
    return;
  }

  await poll(obj.jobId);
}

async function main() {
  saveArgumentToStore();

  const email = String(read(EMAIL_KEY) || '').trim();
  const password = String(read(PASSWORD_KEY) || '');
  const clientId = String(read(CLIENT_ID_KEY) || 'default').trim() || 'default';

  currentEmail = email;

  if (!email || !password) {
    finish(
      'iios.fun',
      '缺少账号参数',
      `账号：${email || '未填写'}\n请先在 Argument 或持久化存储中填写 iios_email 和 iios_password`
    );
    return;
  }

  notify('iios.fun', '开始登录签到', `账号：${email}`);
  await startCheckinByLogin(email, password, clientId);
}

(async () => {
  try {
    scriptTimeoutTimer = setTimeout(() => {
      finish('iios.fun', '执行超时', buildMessage('脚本运行超时，已自动结束'));
    }, SCRIPT_TIMEOUT);

    await main();
  } catch (e) {
    finish('iios.fun', '脚本异常', buildMessage(e.message || String(e)));
  }
})()
.finally(() => {
  cleanup();

  if (!finalResult) {
    finalResult = {
      title: 'iios.fun',
      subTitle: '执行结束',
      message: buildMessage('脚本已结束')
    };
  }

  log(`结束 | 账号: ${currentEmail} | ${finalResult.subTitle} | ${finalResult.message}`);
  notify(finalResult.title, finalResult.subTitle, finalResult.message);
  done({ ok: 1 });
});